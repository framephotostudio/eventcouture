/* Event Couture server (Cloudflare Worker).
   Routes:
     POST /api/concepts  -> three event concepts from photos and words (Gemini)
     POST /api/places    -> real venues and vendors near a city (Google Places)
     POST /api/drive     -> drive times from a starting point (Google Routes)
     GET  /api/status    -> which services are connected and today's spend
     GET  /api/inv/:id            -> a shared invitation (public details only)
     POST /api/inv/:id/publish    -> host saves or updates the invitation (needs the host key)
     POST /api/inv/:id/rsvp       -> a guest RSVPs (name, yes/no, plus-ones, dietary needs)
     POST /api/inv/:id/vote       -> a guest votes in a poll
     POST /api/inv/:id/bought     -> a guest marks a gift as bought
     POST /api/inv/:id/inbox      -> host reads RSVPs, votes and gifts (needs the host key)
     POST /api/inv/:id/delete     -> host removes the invitation and everything guests sent
   Secrets (set with `wrangler secret put`): GEMINI_KEY, GOOGLE_MAPS_KEY
   Vars: ALLOWED_ORIGINS (comma list), DAILY_CAP_USD (default 0.66 = about $20 a month), GEMINI_MODEL
   KV binding: EC_KV (usage counters, shared invitations and RSVPs; invitation data expires 30 days after the event).
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
      const inv = url.pathname.match(/^\/api\/inv\/([a-z0-9]{6,32})(?:\/(publish|rsvp|vote|bought|inbox|delete))?$/);
      if (inv) return await invite(req, env, inv[1], inv[2] || '', json);
      if (req.method === 'GET' && url.pathname === '/api/vendors') return await vendorSearch(env, url, json);
      const vp = url.pathname.match(/^\/api\/vendor\/([a-z0-9]{8,16})$/);
      if (req.method === 'GET' && vp) return await vendorProfile(env, vp[1], json);
      if (url.pathname === '/api/status') {
        return json({ ai: !!env.GEMINI_KEY, model: env.GEMINI_KEY ? await pickModel(env) : null, places: !!env.GOOGLE_MAPS_KEY, spentToday: await spent(env), capToday: cap(env) });
      }
      if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
      // Per-visitor rate limit (free, best effort): 40 requests an hour per IP across AI and search.
      if (!(await rateOk(env, req.headers.get('cf-connecting-ip') || 'unknown'))) return json({ error: 'You\u2019ve made a lot of requests. Please wait a few minutes and try again. Nothing was charged.' }, 429);
      if (+(req.headers.get('content-length') || 0) > 12e6) return json({ error: 'Those photos are too large. Try fewer or smaller photos.' }, 413);
      const body = await req.json().catch(() => ({}));
      const mk = url.pathname.match(/^\/api\/(vendor\/save|vendor\/report|req\/new|req\/list|req\/reply|req\/inbox|req\/delete)$/);
      if (mk) { if (!env.EC_KV) return json({ error: 'Vendor listings are not connected yet.' }, 503); return await market(env, mk[1], body, req.headers.get('cf-connecting-ip') || 'unknown', json); }
      if (url.pathname === '/api/concepts') {
        if (!env.GEMINI_KEY) return json({ error: 'AI is not connected yet.' }, 503);
        if (!(await reserve(env, COST.concepts))) return json({ error: 'Daily AI limit reached. Try again tomorrow.' }, 429);
        return json({ concepts: await concepts(env, body) });
      }
      if (url.pathname === '/api/places') {
        if (!env.GOOGLE_MAPS_KEY) return json({ error: 'Venue search is not connected yet.' }, 503);
        if (!(await freePlaces(env)) && !(await reserve(env, COST.places))) return json({ error: 'Daily search limit reached. Try again tomorrow.' }, 429);
        return json({ places: await places(env, String(body.query || '').slice(0, 120), String(body.city || '').slice(0, 120), ['L', 'S', 'U'].includes(body.level) ? body.level : 'S', body.kind === 'vendor', String(body.cat || '').slice(0, 30), String(body.hint || '').slice(0, 60)) });
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
/* Google gives 1,000 detailed place searches a month free. Those don't count against the daily dollar cap;
   searches past that (with a little margin) are paid and are counted as before. */
const FREE_PLACES = 950;
async function freePlaces(env) {
  if (!env.EC_KV) return false;
  const key = 'places:' + new Date().toISOString().slice(0, 7), n = parseInt((await env.EC_KV.get(key)) || '0', 10);
  if (n >= FREE_PLACES) return false;
  await env.EC_KV.put(key, String(n + 1), { expirationTtl: 60 * 60 * 24 * 40 });
  return true;
}
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
    `You are a luxury event stylist. Event: ${event.type}, ${event.guests} guests, ${event.city}, budget ${event.budget} USD, setting ${event.setting}, starts ${String(event.time || '').slice(0, 5) || 'evening'}, drinks: ${event.alcohol === 'none' ? 'no alcohol' : event.alcohol === 'wine' ? 'beer and wine only' : 'full bar'}${event.kids ? ', children attending' : ''}.\n` +
    `Name every look for this occasion (a ${event.type}): never call it a gala, party, shower or any other kind of event than this one. ` +
    'Fit every idea to this occasion: no alcohol in any idea when drinks are no alcohol; kid-friendly looks (no nightclub, candles or dark moody themes) for a child\'s birthday; daytime wording for daytime events; nothing a restaurant or private dining room wouldn\'t allow when the setting is restaurant or privateRoom. Use the colors the host named first. Never use alcohol words (champagne, wine, prosecco, rosé, bourbon, merlot and the like) as color, look or concept names; say cream, soft gold or deep red instead. If the notes mention an Inspiration photo, that exact look is already shown to the host as its own concept: give three clearly different directions, each with a name that does not repeat the photo\u2019s name.\n' +
    `Chosen vibes and colors: ${(event.vibes || []).slice(0, 12).join(', ') || 'none'}. Host notes: ${event.text || 'none'}. Links: ${(event.links || []).join(' ') || 'none'}.\n` +
    `Avoid these concepts already shown: ${skip.join(', ') || 'none'}.\n` +
    'Return JSON: {"concepts":[{"id":"kebab-id","name":"","styleName":"","palette":["#hex x5"],"mood":"one sentence","decor":["4 items"],"dress":"one specific outfit idea for the person being celebrated (bride, birthday guest of honor, graduate, etc.), under 20 words","menuStyle":"garden|modern|elegant|rustic|coastal|tropical|classic|sweet|party","music":"3-word mood","fit":"Closest match to your inspiration|A close alternative|A fresh direction","outline":["Arrival: ...","Tables: ...","Moment: ...","Dress code: ..."],"pieces":[{"item":"a specific thing to buy or hire, e.g. Emerald velvet table runners","search":"3-6 word store search for it, or empty if a pro makes it","hire":"florals|balloons|cake|decor|rentals|lighting|catering|none"}]}]} with exactly 3 distinct concepts that keep what the host loves and feel luxurious at any budget. Give each concept 6 to 8 pieces: for the first concept, list the exact items you can see in the host\u2019s photos and every item she named in her notes; never list alcohol when drinks are no alcohol.' });
  // Ask up to twice; a long or interrupted answer is retried once before failing
  let out = [];
  /* Speed: concepts are short, so ask for a quick answer with little or no extended thinking.
     Newer models take thinkingLevel, older ones thinkingBudget; if a model rejects the setting we ask again without it. */
  const v = parseFloat((model.match(/gemini-([\d.]+)/) || [0, 0])[1]) || 0;
  let thinking = v >= 3 ? { thinkingLevel: 'low' } : v >= 2.5 ? { thinkingBudget: 0 } : null;
  for (let attempt = 0; attempt < 3 && out.length < 3; attempt++) {
    const gen = { responseMimeType: 'application/json', temperature: 0.8, maxOutputTokens: 6144 };
    if (thinking) gen.thinkingConfig = thinking;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: gen })
    });
    if (r.status === 400 && thinking) { thinking = null; continue; }
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
    music: String(c.music || 'feel-good party').slice(0, 40), fit: String(c.fit || ''), outline: (c.outline || []).map(String).slice(0, 4),
    pieces: (Array.isArray(c.pieces) ? c.pieces : []).slice(0, 8).map(x => ({ item: String(x && x.item || '').slice(0, 80), search: String(x && x.search || '').slice(0, 80), hire: /^(florals|balloons|cake|decor|rentals|lighting|catering)$/.test(x && x.hire) ? x.hire : '' })).filter(x => x.item)
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
/* Each kind of vendor must actually be that business: a DJ search never returns a nightclub, a mobile bar never a pub,
   a photographer never a camera shop. Checked against Google's place types and the business name. */
const SHOPS = /store|supermarket|grocery|department_store|shopping_mall|convenience|pharmacy|gas_station/;
const CAT_RULES = {
  dj: { types: /night_club|bar\b|pub|restaurant|karaoke|casino|store/, names: /lounge|night ?club|\bclub\b|\bbar\b|grill|tavern|pub\b|karaoke|hookah/i },
  liveMusic: { types: /night_club|bar\b|pub|restaurant|store/, names: /lounge|night ?club|\bbar\b|grill|tavern|guitar center|music store/i },
  bar: { types: /night_club|\bbar\b|pub|restaurant|liquor_store|store|winery|brewery/, names: /sports bar|tavern|pub\b|grill|lounge|liquor|wine (shop|store)|brewing|brewery/i },
  bartender: { types: /night_club|\bbar\b|pub|restaurant|liquor_store|store/, names: /sports bar|tavern|pub\b|grill|lounge|liquor|bartending school/i },
  photographer: { types: /store|school|lab\b/, names: /camera|photo lab|printing|passport|school|cvs|walgreens|walmart/i },
  videographer: { types: /store|school/, names: /camera|school|rental house/i },
  florals: { types: SHOPS, names: /walmart|kroger|h-e-b|heb\b|costco|trader joe|whole foods|safeway|publix|1-800/i },
  cake: { types: /supermarket|grocery|convenience|gas_station|fast_food/, names: /walmart|kroger|h-e-b|heb\b|costco|sam's club|safeway|publix|dunkin|krispy|donut/i },
  catering: { types: /fast_food|convenience|gas_station|supermarket/, names: /mcdonald|chick-fil-a|subway|taco bell|wendy|burger king|domino|pizza hut|papa john|panda express|popeyes|kfc/i },
  hairMakeup: { types: /store|school|nail_salon|barber/, names: /beauty supply|sally beauty|ulta|sephora|school|academy|barber|nail/i },
  rentals: { types: /car_rental|truck|storage/, names: /u-haul|penske|budget truck|storage|car rental/i },
  balloons: { types: /supermarket|grocery|department_store/, names: /party city|walmart|dollar|kroger/i },
  decor: { types: /home_goods_store|furniture_store|department_store|supermarket/, names: /hobby lobby|michaels|home goods|homegoods|walmart|target|ikea|at home/i },
  photoBooth: { types: /store|school/, names: /camera|school/i }
};
async function places(env, query, city, level = 'S', vendor = false, cat = '', hint = '') {
  const rule = CAT_RULES[cat], hintRe = hint ? new RegExp('\\b(' + hint.split(/[,|]/).map(w => w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean).join('|') + ')', 'i') : null;
  const L = vendor ? { minRating: 4.5, minReviews: 15, priceLevels: [] } : (LEVEL[level] || LEVEL.S);
  const search = async (withPrice) => {
    const body = { textQuery: `${query} in ${city}`, maxResultCount: 20, minRating: L.minRating };
    if (withPrice) body.priceLevels = L.priceLevels;
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_MAPS_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,places.websiteUri,places.regularOpeningHours.weekdayDescriptions,places.businessStatus,places.types,places.primaryType' },
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
    .filter(p => !rule || (!rule.types.test([p.primaryType || ''].concat(p.types || []).join(' ')) && !rule.names.test(p.displayName?.text || '')))
    .filter(p => (p.rating || 0) >= L.minRating && (p.userRatingCount || 0) >= L.minReviews)
    /* best reviewed first; a business that names this occasion (a wedding DJ for a wedding) moves up */
    .map(p => ({ p, score: p.rating * Math.log10(10 + p.userRatingCount) * (hintRe && hintRe.test(p.displayName?.text || '') ? 1.12 : 1) }))
    .sort((a, b) => b.score - a.score).map(x => x.p)
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

/* ---------- shared invitations ----------
   The host's device keeps the plan. Only what guests need is stored here: the invitation details the host chose to share,
   and what guests send back (RSVPs, votes, gifts bought). The host proves ownership with a random key we keep only as a hash. */
const INV_MAX = 60000, RSVP_MAX = 1000;
async function sha(t) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(t))); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join(''); }
function ttlFor(inv) {
  const d = inv && /^\d{4}-\d{2}-\d{2}$/.test(inv.date || '') ? Date.parse(inv.date + 'T12:00:00Z') : 0;
  const end = d ? d + 30 * 864e5 : Date.now() + 400 * 864e5;
  return Math.max(7 * 86400, Math.min(400 * 86400, Math.round((end - Date.now()) / 1000)));
}
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
async function invite(req, env, id, action, json) {
  if (!env.EC_KV) return json({ error: 'Sharing is not connected yet.' }, 503);
  const K = { inv: 'inv:' + id, rsvp: 'rsvp:' + id, votes: 'votes:' + id, bought: 'bought:' + id };
  const rec = JSON.parse((await env.EC_KV.get(K.inv)) || 'null');
  if (req.method === 'GET' && !action) return rec ? json({ inv: rec.inv }) : json({ error: 'This invitation isn\u2019t available. Ask the host for a new link.' }, 404);
  if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
  if (+(req.headers.get('content-length') || 0) > INV_MAX + 2000) return json({ error: 'That invitation is too large.' }, 413);
  const body = await req.json().catch(() => ({}));
  const owner = async () => rec && body.key && (await sha(body.key)) === rec.kh;
  if (action === 'publish') {
    if (!body.key || String(body.key).length < 20) return json({ error: 'Missing key' }, 400);
    if (rec && !(await owner())) return json({ error: 'Not allowed' }, 403);
    const text = JSON.stringify(body.inv || {});
    if (text.length > INV_MAX) return json({ error: 'That invitation is too large.' }, 413);
    const inv = JSON.parse(text), ttl = ttlFor(inv);
    await env.EC_KV.put(K.inv, JSON.stringify({ kh: rec ? rec.kh : await sha(body.key), inv, at: Date.now() }), { expirationTtl: ttl });
    return json({ ok: true });
  }
  if (action === 'inbox') {
    if (!(await owner())) return json({ error: 'Not allowed' }, 403);
    const [r, v, b] = await Promise.all([K.rsvp, K.votes, K.bought].map(k => env.EC_KV.get(k)));
    return json({ rsvps: JSON.parse(r || '[]'), votes: JSON.parse(v || '{}'), bought: JSON.parse(b || '[]') });
  }
  if (action === 'delete') {
    if (!rec) return json({ ok: true });
    if (!(await owner())) return json({ error: 'Not allowed' }, 403);
    await Promise.all(Object.values(K).map(k => env.EC_KV.delete(k)));
    return json({ ok: true });
  }
  // guests
  if (!rec) return json({ error: 'This invitation isn\u2019t available. Ask the host for a new link.' }, 404);
  if (!(await rateOk(env, req.headers.get('cf-connecting-ip') || 'unknown'))) return json({ error: 'Too many tries. Please wait a few minutes.' }, 429);
  const ttl = ttlFor(rec.inv);
  if (action === 'rsvp') {
    const name = clip(body.name, 80).trim(); if (!name) return json({ error: 'Enter your name' }, 400);
    const status = body.status === 'declined' ? 'declined' : 'yes';
    const list = JSON.parse((await env.EC_KV.get(K.rsvp)) || '[]').filter(x => x.name.toLowerCase() !== name.toLowerCase());
    if (list.length >= RSVP_MAX) return json({ error: 'This invitation has reached its RSVP limit. Contact the host.' }, 409);
    list.push({ name, status, plus: Math.max(0, Math.min(5, parseInt(body.plus, 10) || 0)), diet: (Array.isArray(body.diet) ? body.diet : []).slice(0, 8).map(d => clip(d, 40)), note: clip(body.note, 300), at: Date.now() });
    await env.EC_KV.put(K.rsvp, JSON.stringify(list), { expirationTtl: ttl });
    return json({ ok: true });
  }
  if (action === 'vote') {
    const pi = parseInt(body.poll, 10), oi = parseInt(body.option, 10);
    const polls = rec.inv.polls || []; if (!(pi >= 0 && pi < polls.length && oi >= 0 && oi < (polls[pi].options || []).length)) return json({ error: 'Not found' }, 404);
    const votes = JSON.parse((await env.EC_KV.get(K.votes)) || '{}'); const k = pi + ':' + oi; votes[k] = (votes[k] || 0) + 1;
    await env.EC_KV.put(K.votes, JSON.stringify(votes), { expirationTtl: ttl });
    return json({ ok: true });
  }
  if (action === 'bought') {
    const i = parseInt(body.item, 10); if (!(i >= 0 && i < ((rec.inv.registry || {}).items || []).length)) return json({ error: 'Not found' }, 404);
    const b = JSON.parse((await env.EC_KV.get(K.bought)) || '[]'); if (b.indexOf(i) < 0) b.push(i);
    await env.EC_KV.put(K.bought, JSON.stringify(b), { expirationTtl: ttl });
    return json({ ok: true });
  }
  return json({ error: 'Not found' }, 404);
}

/* ---------- vendors and quote requests ----------
   Vendors list for free. Hosts send anonymous quote requests (no name or contact); signed-up vendors in that
   city and category see them and reply with their own contact. Listings go live automatically when complete;
   three reports from different people hide one. Keys are stored only as SHA-256 hashes. */
const VENDOR_MAX = 8000, FOUNDING = 25, REPORTS_HIDE = 3;
const cityKey = c => clip(c, 60).toLowerCase().replace(/[^a-z0-9, ]/g, '').trim();
const catOk = c => /^[a-zA-Z]{2,20}$/.test(String(c));
const rid = () => [...crypto.getRandomValues(new Uint8Array(8))].map(b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('') + Date.now().toString(36).slice(-4);
const kvGet = async (env, k, d) => JSON.parse((await env.EC_KV.get(k)) || 'null') || d;
function cleanListing(l) {
  l = l || {};
  const url = u => /^https?:\/\/[^\s"<>]{3,200}$/.test(String(u || '').trim()) ? String(u).trim().slice(0, 200) : '';
  const ig = String(l.ig || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
  const list = (a, n, m) => (Array.isArray(a) ? a : []).map(x => clip(x, m).trim()).filter(Boolean).slice(0, n);
  return {
    name: clip(l.name, 80).trim(), bio: clip(l.bio, 400), cats: list(l.cats, 12, 20).filter(catOk), cities: list(l.cities, 10, 60),
    site: url(l.site), ig: /^[A-Za-z0-9._]{1,30}$/.test(ig) ? ig : '', phone: clip(l.phone, 30).replace(/[^0-9+()\- .]/g, ''),
    pkgName: clip(l.pkgName, 80), pkgIncl: clip(l.pkgIncl, 400), priceType: clip(l.priceType, 20), price: Math.max(0, Math.min(1e6, +l.price || 0)),
    events: list(l.events, 30, 40), langs: clip(l.langs, 80), years: Math.max(0, Math.min(99, parseInt(l.years, 10) || 0)), insured: clip(l.insured, 30),
    cancel: clip(l.cancel, 400), deposit: Math.max(0, Math.min(100, +l.deposit || 0)), minGuests: parseInt(l.minGuests, 10) || 0, maxGuests: parseInt(l.maxGuests, 10) || 0
  };
}
const isLive = (l, agree) => !!(l.name && l.cats.length && l.cities.length && (l.site || l.ig) && agree);
/* Featured (paid placement) is off until payments are connected: nothing sets rec.featuredUntil yet. */
const isFeatured = rec => !!(rec.featuredUntil && rec.featuredUntil > Date.now());
const publicCard = (id, rec) => Object.assign({ id, founding: !!rec.founding, featured: isFeatured(rec) }, rec.l);
async function vendorSearch(env, url, json) {
  if (!env.EC_KV) return json({ vendors: [] });
  const city = cityKey(url.searchParams.get('city') || ''), cat = String(url.searchParams.get('cat') || '');
  if (!city) return json({ vendors: [] });
  const ids = await kvGet(env, 'vidx:' + city, []);
  const recs = await Promise.all(ids.slice(0, 60).map(id => kvGet(env, 'vend:' + id, null).then(r => r && [id, r])));
  const out = recs.filter(x => x && x[1].live && !x[1].hidden && (!cat || x[1].l.cats.includes(cat)) && x[1].l.cities.some(c => cityKey(c) === city))
    .sort((a, b) => (isFeatured(b[1]) ? 1 : 0) - (isFeatured(a[1]) ? 1 : 0) || (b[1].founding ? 1 : 0) - (a[1].founding ? 1 : 0) || a[1].at - b[1].at).slice(0, 12).map(x => publicCard(x[0], x[1]));
  return json({ vendors: out });
}
async function vendorProfile(env, id, json) {
  const rec = env.EC_KV && await kvGet(env, 'vend:' + id, null);
  if (!rec || !rec.live || rec.hidden) return json({ error: 'This vendor isn’t listed right now.' }, 404);
  return json({ vendor: publicCard(id, rec) });
}
async function market(env, action, body, ip, json) {
  const key = String(body.key || '');
  if (action === 'vendor/save') {
    if (key.length < 20) return json({ error: 'Missing key' }, 400);
    if (JSON.stringify(body.listing || {}).length > VENDOR_MAX) return json({ error: 'That listing is too long.' }, 413);
    let id = /^[a-z0-9]{8,16}$/.test(String(body.id || '')) ? String(body.id) : '';
    let rec = id ? await kvGet(env, 'vend:' + id, null) : null;
    if (rec && rec.kh !== await sha(key)) return json({ error: 'Not allowed' }, 403);
    if (!rec) { id = rid().slice(0, 12); rec = { kh: await sha(key), at: Date.now(), reports: [] }; }
    const l = cleanListing(body.listing), email = clip(body.listing && body.listing.email, 120).trim();
    const old = rec.l ? rec.l.cities.map(cityKey) : [];
    rec.l = l; rec.email = email; rec.live = isLive(l, !!(body.listing && body.listing.agree)); rec.up = Date.now();
    const now = l.cities.map(cityKey).filter(Boolean);
    for (const c of new Set(old.concat(now))) {
      const ix = await kvGet(env, 'vidx:' + c, []); const has = ix.includes(id);
      if (rec.live && rec.founding === undefined && now.includes(c) && ix.filter(x => x !== id).length < FOUNDING) rec.founding = true;
      if (now.includes(c) && !has) { ix.push(id); await env.EC_KV.put('vidx:' + c, JSON.stringify(ix.slice(-500))); }
      if (!now.includes(c) && has) await env.EC_KV.put('vidx:' + c, JSON.stringify(ix.filter(x => x !== id)));
    }
    if (rec.founding === undefined && rec.live) rec.founding = false;
    await env.EC_KV.put('vend:' + id, JSON.stringify(rec));
    return json({ ok: true, id, live: rec.live, founding: !!rec.founding, missing: rec.live ? [] : ['name', 'cats', 'cities'].filter(k => !l[k].length).concat(l.site || l.ig ? [] : ['ig']).concat(body.listing && body.listing.agree ? [] : ['agree']) });
  }
  if (action === 'vendor/report') {
    const id = String(body.id || ''); const rec = /^[a-z0-9]{8,16}$/.test(id) && await kvGet(env, 'vend:' + id, null);
    if (!rec) return json({ error: 'Not found' }, 404);
    const who = (await sha('r' + ip)).slice(0, 16); rec.reports = rec.reports || [];
    if (!rec.reports.includes(who)) rec.reports.push(who);
    if (rec.reports.length >= REPORTS_HIDE) rec.hidden = true;
    await env.EC_KV.put('vend:' + id, JSON.stringify(rec));
    return json({ ok: true });
  }
  const vendorAuth = async () => { const id = String(body.vid || ''); const rec = /^[a-z0-9]{8,16}$/.test(id) && await kvGet(env, 'vend:' + id, null); return rec && rec.kh === await sha(key) && !rec.hidden ? [id, rec] : null; };
  if (action === 'req/new') {
    if (key.length < 20) return json({ error: 'Missing key' }, 400);
    const r = body.req || {}, city = cityKey(r.city), cat = String(r.cat || '');
    if (!city || !catOk(cat)) return json({ error: 'Choose a city and what you need.' }, 400);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(r.date || '')) ? String(r.date) : '';
    const until = date ? Math.max(Date.now() + 864e5, new Date(date + 'T12:00:00Z').getTime() + 14 * 864e5) : Date.now() + 90 * 864e5;
    const id = rid();
    const pub = { city: clip(r.city, 60), cat, need: clip(r.need, 60), type: clip(r.type, 40), date, guests: Math.max(1, Math.min(100000, parseInt(r.guests, 10) || 0)) || null, budget: Math.max(0, Math.min(1e6, +r.budget || 0)) || null, theme: clip(r.theme, 80), notes: clip(r.notes, 300), at: Date.now() };
    const ttl = Math.max(86400, Math.ceil((until - Date.now()) / 1000));
    await env.EC_KV.put('req:' + id, JSON.stringify({ kh: await sha(key), r: pub, until }), { expirationTtl: ttl });
    const ix = (await kvGet(env, 'ridx:' + city, [])).filter(x => x.until > Date.now()); ix.push({ id, cat, until });
    await env.EC_KV.put('ridx:' + city, JSON.stringify(ix.slice(-300)));
    return json({ ok: true, id });
  }
  if (action === 'req/list') {
    const v = await vendorAuth(); if (!v) return json({ error: 'Not allowed' }, 403);
    const [vid, rec] = v; const out = [];
    for (const c of new Set(rec.l.cities.map(cityKey))) {
      const ix = (await kvGet(env, 'ridx:' + c, [])).filter(x => x.until > Date.now() && rec.l.cats.includes(x.cat)).slice(-40);
      for (const x of ix) { const q = await kvGet(env, 'req:' + x.id, null); if (!q) continue; const reps = await kvGet(env, 'rep:' + x.id, []); out.push(Object.assign({ id: x.id, replied: reps.some(p => p.vid === vid), replies: reps.length }, q.r)); }
    }
    return json({ requests: out.sort((a, b) => b.at - a.at) });
  }
  if (action === 'req/reply') {
    const v = await vendorAuth(); if (!v) return json({ error: 'Not allowed' }, 403);
    const [vid, rec] = v; const id = String(body.id || ''); const q = /^[a-z0-9]{8,20}$/.test(id) && await kvGet(env, 'req:' + id, null);
    if (!q) return json({ error: 'This request has closed.' }, 404);
    if (!rec.live || !rec.l.cats.includes(q.r.cat) || !rec.l.cities.some(c => cityKey(c) === cityKey(q.r.city))) return json({ error: 'This request isn’t in your category or city.' }, 403);
    const msg = clip(body.msg, 600).trim(); if (!msg) return json({ error: 'Write a short reply.' }, 400);
    const reps = (await kvGet(env, 'rep:' + id, [])).filter(p => p.vid !== vid); if (reps.length >= 20) return json({ error: 'This request already has the most replies it can take.' }, 409);
    reps.push({ vid, msg, price: Math.max(0, Math.min(1e6, +body.price || 0)) || null, card: publicCard(vid, rec), email: rec.email, at: Date.now() });
    await env.EC_KV.put('rep:' + id, JSON.stringify(reps), { expirationTtl: Math.max(86400, Math.ceil((q.until - Date.now()) / 1000)) });
    return json({ ok: true });
  }
  if (action === 'req/inbox' || action === 'req/delete') {
    const ids = (Array.isArray(body.ids) ? body.ids : []).slice(0, 40).map(String).filter(x => /^[a-z0-9]{8,20}$/.test(x)); const out = {}, kh = await sha(key);
    for (const id of ids) {
      const q = await kvGet(env, 'req:' + id, null); if (!q || q.kh !== kh) continue;
      if (action === 'req/delete') { await env.EC_KV.delete('req:' + id); await env.EC_KV.delete('rep:' + id); continue; }
      out[id] = await kvGet(env, 'rep:' + id, []);
    }
    return json(action === 'req/delete' ? { ok: true } : { replies: out });
  }
  return json({ error: 'Not found' }, 404);
}
