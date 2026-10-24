/* Event Couture server (Cloudflare Worker).
   Routes:
     POST /api/concepts  -> three event concepts from photos and words (Gemini)
     POST /api/places    -> real venues and vendors near a city (Google Places)
     POST /api/drive     -> drive times from a starting point (Google Routes)
     GET  /api/status    -> which services are connected and today's spend
   Secrets (set with `wrangler secret put`): GEMINI_KEY, GOOGLE_MAPS_KEY
   Vars: ALLOWED_ORIGINS (comma list), DAILY_CAP_USD (default 0.66 = about $20 a month), GEMINI_MODEL
   KV binding: EC_KV (usage counters).
   Every paid call checks the daily spending cap first and refuses once it is reached. */

const COST = { concepts: 0.004, places: 0.035, drive: 0.01 }; // conservative per-call estimates in USD

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = {
      'access-control-allow-origin': allowed.includes(origin) ? origin : (allowed[0] || '*'),
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization',
      'vary': 'origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
    try {
      if (url.pathname === '/api/status') {
        return json({ ai: !!env.GEMINI_KEY, model: env.GEMINI_KEY ? await pickModel(env) : null, places: !!env.GOOGLE_MAPS_KEY, spentToday: await spent(env), capToday: cap(env) });
      }
      if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
      // Per-visitor rate limit (free, best effort): 40 requests an hour per IP across AI and search.
      if (!(await rateOk(env, req.headers.get('cf-connecting-ip') || 'unknown'))) return json({ error: 'You\u2019ve made a lot of requests. Please wait a few minutes and try again. Nothing was charged.' }, 429);
      if (+(req.headers.get('content-length') || 0) > 12e6) return json({ error: 'Those photos are too large. Try fewer or smaller photos.' }, 413);
      const body = await req.json().catch(() => ({}));
      if (url.pathname === '/api/concepts') {
        if (!env.GEMINI_KEY) return json({ error: 'AI is not connected yet.' }, 503);
        if (!(await reserve(env, COST.concepts))) return json({ error: 'Daily AI limit reached. Try again tomorrow.' }, 429);
        return json({ concepts: await concepts(env, body) });
      }
      if (url.pathname === '/api/places') {
        if (!env.GOOGLE_MAPS_KEY) return json({ error: 'Venue search is not connected yet.' }, 503);
        if (!(await reserve(env, COST.places))) return json({ error: 'Daily search limit reached. Try again tomorrow.' }, 429);
        return json({ places: await places(env, String(body.query || '').slice(0, 120), String(body.city || '').slice(0, 120), ['L', 'S', 'U'].includes(body.level) ? body.level : 'S', body.kind === 'vendor') });
      }
      if (url.pathname === '/api/drive') {
        if (!env.GOOGLE_MAPS_KEY) return json({ error: 'Drive times are not connected yet.' }, 503);
        if (!(await reserve(env, COST.drive))) return json({ error: 'Daily limit reached. Try again tomorrow.' }, 429);
        return json({ times: await drive(env, String(body.origin || '').slice(0, 200), (body.placeIds || []).slice(0, 10)) });
      }
      return json({ error: 'Not found' }, 404);
    } catch (e) {
      return json({ error: 'Something went wrong on our side. Nothing was charged.', code: String(e && e.message || '').slice(0, 60) }, 500);
    }
  }
};

/* ---------- spending cap ---------- */
function cap(env) { return Number(env.DAILY_CAP_USD || 0.66); }
function dayKey() { return 'spend:' + new Date().toISOString().slice(0, 10); }
async function spent(env) { return Number((await env.EC_KV?.get(dayKey())) || 0); }
async function reserve(env, usd) {
  if (!env.EC_KV) return false; // never spend without a working counter
  const now = await spent(env);
  if (now + usd > cap(env)) return false;
  await env.EC_KV.put(dayKey(), String(Math.round((now + usd) * 10000) / 10000), { expirationTtl: 60 * 60 * 48 });
  return true;
}

/* ---------- concepts (Gemini) ---------- */
async function rateOk(env, ip) {
  const key = 'rl:' + ip + ':' + new Date().toISOString().slice(0, 13);
  const n = parseInt(await env.EC_KV.get(key) || '0', 10);
  if (n >= 40) return false;
  await env.EC_KV.put(key, String(n + 1), { expirationTtl: 3700 });
  return true;
}
/* Pick the newest Gemini Flash model the key can use, so retired model names never break the app. Cached for a day. */
async function pickModel(env) {
  const cached = await env.EC_KV.get('model');
  if (cached) return cached;
  let name = env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': env.GEMINI_KEY } });
    const list = ((await r.json()).models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .filter(n => /^gemini-[\d.]+-flash(-\d+)?$|^gemini-flash-latest$/.test(n));
    const ver = n => parseFloat((n.match(/gemini-([\d.]+)/) || [0, 0])[1]);
    list.sort((a, b) => ver(b) - ver(a));
    if (list.length) name = list.find(n => n !== 'gemini-flash-latest') || list[0];
  } catch (e) {}
  await env.EC_KV.put('model', name, { expirationTtl: 86400 });
  return name;
}
async function concepts(env, { event = {}, skip = [] }) {
  const model = await pickModel(env);
  const parts = [];
  for (const p of (event.photos || []).slice(0, 8)) {
    const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(p.image || '');
    if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
    if (p.loves && p.loves.length) parts.push({ text: 'In this photo the host loves: ' + p.loves.map(l => l.label).join(', ') });
  }
  parts.push({ text:
    `You are a luxury event stylist. Event: ${event.type}, ${event.guests} guests, ${event.city}, budget ${event.budget} USD, setting ${event.setting}.\n` +
    `Chosen vibes and colors: ${(event.vibes || []).slice(0, 12).join(', ') || 'none'}. Host notes: ${event.text || 'none'}. Links: ${(event.links || []).join(' ') || 'none'}.\n` +
    `Avoid these concepts already shown: ${skip.join(', ') || 'none'}.\n` +
    'Return JSON: {"concepts":[{"id":"kebab-id","name":"","styleName":"","palette":["#hex x5"],"mood":"one sentence","decor":["4 items"],"dress":"one specific outfit idea for the person being celebrated (bride, birthday guest of honor, graduate, etc.), under 20 words","menuStyle":"garden|modern|elegant|rustic|coastal|tropical|classic|sweet|party","music":"3-word mood","songs":["10 well-known real songs that fit, as Title — Artist"],"fit":"Closest match to your inspiration|A close alternative|A fresh direction","outline":["Arrival: ...","Tables: ...","Moment: ...","Dress code: ..."]}]} with exactly 3 distinct concepts that keep what the host loves and feel luxurious at any budget.' });
  // Ask up to twice; a long or interrupted answer is retried once before failing
  let out = [];
  for (let attempt = 0; attempt < 2 && out.length < 3; attempt++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0.8, maxOutputTokens: 8192 } })
    });
    if (!r.ok) { let why = ''; try { why = (await r.json()).error?.status || ''; } catch (e) {} throw new Error('ai ' + r.status + ' ' + why); }
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    try { out = JSON.parse(text.replace(/^```json\s*|```$/g, '')).concepts || []; } catch (e) { out = []; }
  }
  const hex = /^#[0-9a-f]{6}$/i;
  const clean = out.slice(0, 3).map(c => ({
    id: String(c.id || '').slice(0, 40), name: String(c.name || '').slice(0, 60), styleName: String(c.styleName || c.name || '').slice(0, 40),
    palette: (c.palette || []).filter(h => hex.test(h)).slice(0, 5), mood: String(c.mood || '').slice(0, 200),
    decor: (c.decor || []).map(String).slice(0, 4), dress: String(c.dress || '').slice(0, 160), menuStyle: String(c.menuStyle || 'party'),
    music: String(c.music || 'feel-good party').slice(0, 40), songs: (c.songs || []).map(String).filter(x => x.length < 90).slice(0, 12), fit: String(c.fit || ''), outline: (c.outline || []).map(String).slice(0, 4)
  })).filter(c => c.palette.length >= 3 && c.decor.length >= 3);
  if (clean.length < 3) throw new Error('ai shape');
  return clean;
}

/* ---------- venues and vendors (Places API, Text Search) ---------- */
/* Quality rules so a host never gets random or cheap places:
   - Google filters: minimum rating, and price levels that match the plan's level
   - drop budget chains by name, require enough reviews, rank by rating weighted by review count */
const BUDGET_CHAINS = /motel 6|super 8|red roof|la quinta|days inn|econo ?lodge|quality inn|comfort (inn|suites)|travelodge|extended stay|rodeway|americas best value|studio 6|howard johnson|knights inn|baymont|microtel|sleep inn|candlewood|holiday inn express|hampton inn|fairfield inn|best western(?! premier)|motel|hostel|wingate|super 8|country inn|woodspring|intown suites|home2|tru by hilton|springhill|towneplace|crossland|budget/i;
const MID_CHAINS = /hyatt place|hilton garden inn|homewood suites|residence inn|staybridge|holiday inn|courtyard by marriott|four points|aloft|avid hotel|cambria|drury|embassy suites|doubletree|radisson|ramada|wyndham garden/i; // fine for Luxe for Less, left out of Signature and Ultra Luxe
const LEVEL = {
  L: { minRating: 4.3, minReviews: 40, priceLevels: ['PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE'] },
  S: { minRating: 4.4, minReviews: 80, priceLevels: ['PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE'] },
  U: { minRating: 4.5, minReviews: 100, priceLevels: ['PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE'] }
};
const PLANNERS = /planner|planning|coordinat|wedding(s)? by|event management|wedding consult/i;
async function places(env, query, city, level = 'S', vendor = false) {
  const L = vendor ? { minRating: 4.5, minReviews: 15, priceLevels: [] } : (LEVEL[level] || LEVEL.S);
  const search = async (withPrice) => {
    const body = { textQuery: `${query} in ${city}`, maxResultCount: 20, minRating: L.minRating };
    if (withPrice) body.priceLevels = L.priceLevels;
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_MAPS_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,places.websiteUri,places.regularOpeningHours.weekdayDescriptions,places.businessStatus' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('places');
    return (await r.json()).places || [];
  };
  let raw = await search(!vendor);
  // venues like ballrooms and estates often have no price level; fill in from an unpriced search, still rating-filtered
  if (!vendor && raw.length < 5) { const more = await search(false); const seen = new Set(raw.map(p => p.id)); raw = raw.concat(more.filter(p => !seen.has(p.id) && !(p.priceLevel === 'PRICE_LEVEL_INEXPENSIVE' || p.priceLevel === 'PRICE_LEVEL_FREE'))); }
  return raw
    .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY' && p.businessStatus !== 'CLOSED_TEMPORARILY')
    .filter(p => !BUDGET_CHAINS.test(p.displayName?.text || '') && (level === 'L' || !MID_CHAINS.test(p.displayName?.text || '')))
    .filter(p => vendor || !p.priceLevel || L.priceLevels.includes(p.priceLevel))
    .filter(p => !vendor || /coordinator/.test(query) || !PLANNERS.test(p.displayName?.text || ''))   // vendors means the actual service, never planners   // places with no price level (ballrooms, estates) are judged by rating alone
    .filter(p => (p.rating || 0) >= L.minRating && (p.userRatingCount || 0) >= L.minReviews)
    .sort((a, b) => (b.rating * Math.log10(10 + b.userRatingCount)) - (a.rating * Math.log10(10 + a.userRatingCount)))
    .slice(0, 8)
    .map(p => ({ id: p.id, name: p.displayName?.text, address: p.formattedAddress, rating: p.rating, reviews: p.userRatingCount,
      priceLevel: p.priceLevel, mapsUrl: p.googleMapsUri, website: p.websiteUri, hours: p.regularOpeningHours?.weekdayDescriptions || [], source: 'Google' }));
}

/* ---------- drive times (Routes API) ---------- */
async function drive(env, origin, placeIds) {
  if (!origin || !placeIds.length) return [];
  const r = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_MAPS_KEY, 'X-Goog-FieldMask': 'destinationIndex,duration,distanceMeters,condition' },
    body: JSON.stringify({ origins: [{ waypoint: { address: origin } }], destinations: placeIds.map(id => ({ waypoint: { placeId: id } })), travelMode: 'DRIVE' })
  });
  if (!r.ok) throw new Error('routes');
  const rows = await r.json();
  return rows.filter(x => x.condition === 'ROUTE_EXISTS').map(x => ({ placeId: placeIds[x.destinationIndex], minutes: Math.round(parseInt(x.duration) / 60), miles: Math.round(x.distanceMeters / 160.9) / 10 }));
}
