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
        return json({ ai: !!env.GEMINI_KEY, places: !!env.GOOGLE_MAPS_KEY, spentToday: await spent(env), capToday: cap(env) });
      }
      if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
      const body = await req.json().catch(() => ({}));
      if (url.pathname === '/api/concepts') {
        if (!env.GEMINI_KEY) return json({ error: 'AI is not connected yet.' }, 503);
        if (!(await reserve(env, COST.concepts))) return json({ error: 'Daily AI limit reached. Try again tomorrow.' }, 429);
        return json({ concepts: await concepts(env, body) });
      }
      if (url.pathname === '/api/places') {
        if (!env.GOOGLE_MAPS_KEY) return json({ error: 'Venue search is not connected yet.' }, 503);
        if (!(await reserve(env, COST.places))) return json({ error: 'Daily search limit reached. Try again tomorrow.' }, 429);
        return json({ places: await places(env, String(body.query || '').slice(0, 120), String(body.city || '').slice(0, 80)) });
      }
      if (url.pathname === '/api/drive') {
        if (!env.GOOGLE_MAPS_KEY) return json({ error: 'Drive times are not connected yet.' }, 503);
        if (!(await reserve(env, COST.drive))) return json({ error: 'Daily limit reached. Try again tomorrow.' }, 429);
        return json({ times: await drive(env, String(body.origin || '').slice(0, 200), (body.placeIds || []).slice(0, 10)) });
      }
      return json({ error: 'Not found' }, 404);
    } catch (e) {
      return json({ error: 'Something went wrong on our side. Nothing was charged.' }, 500);
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
async function concepts(env, { event = {}, skip = [] }) {
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const parts = [];
  for (const p of (event.photos || []).slice(0, 8)) {
    const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(p.image || '');
    if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
    if (p.loves && p.loves.length) parts.push({ text: 'In this photo the host loves: ' + p.loves.map(l => l.label).join(', ') });
  }
  parts.push({ text:
    `You are a luxury event stylist. Event: ${event.type}, ${event.guests} guests, ${event.city}, budget ${event.budget} USD, setting ${event.setting}.\n` +
    `Host notes: ${event.text || 'none'}. Links: ${(event.links || []).join(' ') || 'none'}.\n` +
    `Avoid these concepts already shown: ${skip.join(', ') || 'none'}.\n` +
    'Return JSON: {"concepts":[{"id":"kebab-id","name":"","styleName":"","palette":["#hex x5"],"mood":"one sentence","decor":["4 items"],"dress":"","menuStyle":"garden|modern|elegant|rustic|coastal|tropical|classic|sweet|party","music":"3-word mood","fit":"Closest match to your inspiration|A close alternative|A fresh direction","outline":["Arrival: ...","Tables: ...","Moment: ...","Dress code: ..."]}]} with exactly 3 distinct concepts that keep what the host loves and feel luxurious at any budget.' });
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0.8 } })
  });
  if (!r.ok) throw new Error('ai');
  const j = await r.json();
  const text = j.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const out = JSON.parse(text).concepts || [];
  const hex = /^#[0-9a-f]{6}$/i;
  const clean = out.slice(0, 3).map(c => ({
    id: String(c.id || '').slice(0, 40), name: String(c.name || '').slice(0, 60), styleName: String(c.styleName || c.name || '').slice(0, 40),
    palette: (c.palette || []).filter(h => hex.test(h)).slice(0, 5), mood: String(c.mood || '').slice(0, 200),
    decor: (c.decor || []).map(String).slice(0, 4), dress: String(c.dress || '').slice(0, 80), menuStyle: String(c.menuStyle || 'party'),
    music: String(c.music || 'feel-good party').slice(0, 40), fit: String(c.fit || ''), outline: (c.outline || []).map(String).slice(0, 4)
  })).filter(c => c.palette.length >= 3 && c.decor.length >= 3);
  if (clean.length < 3) throw new Error('ai shape');
  return clean;
}

/* ---------- venues and vendors (Places API, Text Search) ---------- */
async function places(env, query, city) {
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_MAPS_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,places.websiteUri,places.regularOpeningHours.weekdayDescriptions' },
    body: JSON.stringify({ textQuery: `${query} in ${city}`, maxResultCount: 8 })
  });
  if (!r.ok) throw new Error('places');
  const j = await r.json();
  return (j.places || []).map(p => ({ id: p.id, name: p.displayName?.text, address: p.formattedAddress, rating: p.rating, reviews: p.userRatingCount,
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
