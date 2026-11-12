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
      'access-control-allow-headers': 'content-type,authorization,x-admin-code',
      'vary': 'origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
    try {
      const inv = url.pathname.match(/^\/api\/inv\/([a-z0-9]{6,32})(?:\/(publish|rsvp|vote|bought|inbox|delete))?$/);
      if (inv) return await invite(req, env, inv[1], inv[2] || '', json);
      const prp = url.pathname.match(/^\/api\/prop\/([a-f0-9]{16,32})(?:\/(publish|delete))?$/);
      if (prp) return await proposal(req, env, prp[1], prp[2] || '', json);
      const ask = url.pathname.match(/^\/api\/ask\/([a-f0-9]{20})(?:\/(reply|delete|report))?$/);
      if (ask) return await askVendor(req, env, ask[1], ask[2] || '', json);
      if (url.pathname === '/api/ask/new') return await askVendor(req, env, '', 'new', json);
      const mv = url.pathname.match(/^\/api\/move\/(new|[a-f0-9]{24})$/);
      if (mv) return await movePlan(req, env, mv[1], json);
      if (req.method === 'GET' && url.pathname === '/api/vendors') return await vendorSearch(env, url, json);
      const vp = url.pathname.match(/^\/api\/vendor\/([a-z0-9]{8,16})$/);
      if (req.method === 'GET' && vp) return await vendorProfile(env, vp[1], json);
      const cqg = url.pathname.match(/^\/api\/concierge\/([a-z0-9]{16,40})$/);
      if (req.method === 'GET' && cqg) { if (!env.EC_KV) return json({ error: 'Not found' }, 404); let r = await env.EC_KV.get('cq:' + cqg[1], 'json'); if (typeof r === 'string') r = JSON.parse(r); return r ? json({ request: r }) : json({ error: 'Not found' }, 404); }
      if (req.method === 'GET' && url.pathname === '/api/where') {   // the approximate city of her internet connection, to fill in the city on the first screen; nothing is stored
        const cf = req.cf || {};
        return new Response(JSON.stringify({ city: cf.city || '', region: cf.regionCode || '', country: cf.country || '', lat: +cf.latitude || null, lon: +cf.longitude || null }), { headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'private, no-store' } });
      }
      if (url.pathname === '/api/status') {
        return json({ ai: !!env.GEMINI_KEY, model: env.GEMINI_KEY ? await pickModel(env) : null, places: !!env.GOOGLE_MAPS_KEY, spentToday: await spent(env), capToday: cap(env), placesThisMonth: parseInt((env.EC_KV && await env.EC_KV.get('places:' + new Date().toISOString().slice(0, 7))) || '0', 10), placesMonthLimit: FREE_PLACES + (inReview(env) ? 150 : 0) });
      }
      if (req.method === 'GET' && url.pathname === '/api/optin/export') return await optinExport(req, env, cors);
      if (req.method === 'GET' && url.pathname === '/api/reviews') { if (!env.EC_KV) return json({ reviews: [] }); return json({ reviews: (await env.EC_KV.get('revs:approved', 'json')) || [] }); }
      if (req.method === 'GET' && url.pathname === '/api/reports') { if (!adminOk(req, env)) return json({ error: 'Wrong code' }, 403); return json({ reports: await kvGet(env, 'reports', []) }); }
      if (req.method === 'GET' && url.pathname === '/api/vendors/pending') { if (!adminOk(req, env)) return json({ error: 'Wrong code' }, 403); return await vendorsPending(env, json); }
      if (req.method === 'GET' && url.pathname === '/api/planreq') { if (!adminOk(req, env)) return json({ error: 'Wrong code' }, 403); return await planReqList(env, json); }
      if (req.method === 'GET' && url.pathname === '/api/reviews/all') { if (!adminOk(req, env)) return json({ error: 'Wrong code' }, 403); return await reviewsAll(env, json); }
      if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
      if (url.pathname === '/api/stripe/webhook') return await stripeWebhook(req, env, json);
      // Per-visitor rate limit (free, best effort): 150 requests an hour per IP across AI and search.
      if (!(await rateOk(env, req.headers.get('cf-connecting-ip') || 'unknown', url.pathname))) return json({ error: 'You\u2019ve made a lot of requests. Please wait a few minutes and try again. Nothing was charged.' }, 429);
      if (+(req.headers.get('content-length') || 0) > 12e6) return json({ error: 'Those photos are too large. Try fewer or smaller photos.' }, 413);
      const body = await req.json().catch(() => ({}));
      // Bot check (Cloudflare Turnstile) for new booking requests, quote requests and new vendor listings, once TURNSTILE_SECRET is set.
      const human = url.pathname === '/api/concierge/new' || url.pathname === '/api/planreq/new' || url.pathname === '/api/req/new' || url.pathname === '/api/optin' || url.pathname === '/api/review' || (url.pathname === '/api/vendor/save' && !body.id);
      const fromApp = /^(capacitor:\/\/localhost|https?:\/\/localhost)$/.test(req.headers.get('origin') || '');   // the iPhone and Android apps can't show the web bot check; the rate limit still applies
      if (human && !fromApp && env.TURNSTILE_SECRET && !(await turnstileOk(env, body.ts, req.headers.get('cf-connecting-ip')))) return json({ error: 'Please confirm you\u2019re not a robot and try again.', code: 'turnstile' }, 403);
      delete body.ts;
      // A basic word filter on text other people will read (vendor listings and replies, guest RSVPs and votes, reviews). App Store 1.2.
      if (/^\/api\/(vendor\/save|req\/reply|req\/new|review|inv\/[^/]+\/(rsvp|vote)|prop\/[^/]+\/(reply|vote))$/.test(url.pathname) && rude(JSON.stringify(body))) return json({ error: 'Please keep it friendly: that message has words we don\u2019t allow.', code: 'words' }, 400);
      if (url.pathname === '/api/optin' || url.pathname === '/api/optin/remove') { if (!env.EC_KV) return json({ error: 'Email sign-up is not connected yet.' }, 503); return await optin(env, url.pathname.endsWith('remove'), body, json); }
      if (url.pathname === '/api/review') { if (!env.EC_KV) return json({ error: 'Reviews are not connected yet.' }, 503); return await reviewNew(env, body, json); }
      if (url.pathname === '/api/reports/clear') { if (!adminOk(req, env)) return json({ error: 'Wrong code' }, 403); await env.EC_KV.put('reports', '[]'); return json({ ok: true }); }
      if (url.pathname === '/api/vendors/set') { if (!adminOk(req, env)) return json({ error: 'Wrong code' }, 403); return await vendorSet(env, body, json); }
      if (url.pathname === '/api/reviews/set') { if (!adminOk(req, env)) return json({ error: 'Wrong code' }, 403); return await reviewSet(env, body, json); }
      if (url.pathname === '/api/checkout') { if (!env.EC_KV || !env.STRIPE_SECRET_KEY) return json({ error: 'Card payments are not switched on yet.' }, 503); return await checkout(env, body, url, json); }
      if (url.pathname === '/api/planreq/new') { if (!env.EC_KV) return json({ error: 'Requests are not connected yet.' }, 503); const pr = await planReqNew(env, body); return pr.error ? json(pr, 400) : json(pr); }
      if (url.pathname === '/api/planreq/set') { if (!adminOk(req, env)) return json({ error: 'Wrong code' }, 403); return await planReqSet(env, body, json); }
      if (url.pathname === '/api/concierge/new') { if (!env.EC_KV) return json({ error: 'Booking requests are not connected yet.' }, 503); const cr = await conciergeNew(env, body); return cr.error ? json(cr, 400) : json(cr); }
      const mk = url.pathname.match(/^\/api\/(vendor\/save|vendor\/report|req\/new|req\/list|req\/reply|req\/inbox|req\/delete)$/);
      if (mk) { if (!env.EC_KV) return json({ error: 'Vendor listings are not connected yet.' }, 503); return await market(env, mk[1], body, req.headers.get('cf-connecting-ip') || 'unknown', json); }
      if (url.pathname === '/api/concepts') {
        if (!env.GEMINI_KEY) return json({ error: 'AI is not connected yet.' }, 503);
        if (!(await reserve(env, COST.concepts))) return json({ error: 'Daily AI limit reached. Try again tomorrow.' }, 429);
        return json({ concepts: await concepts(env, body) });
      }
      if (url.pathname === '/api/places') {
        if (!env.GOOGLE_MAPS_KEY) return json({ error: 'Venue search is not connected yet.' }, 503);
        let found;
        try { found = await places(env, String(body.query || '').slice(0, 120), String(body.city || '').slice(0, 120), ['L', 'S', 'U'].includes(body.level) ? body.level : 'S', body.kind === 'vendor', String(body.cat || '').slice(0, 30), String(body.hint || '').slice(0, 60)); }
        catch (e) { if (e.message === 'limit') return json({ error: 'Live search is resting until next month. Use Google Maps to find one.', code: 'limit' }, 429); throw e; }
        return json({ places: found });
      }
      if (url.pathname === '/api/drive') {
        if (!env.GOOGLE_MAPS_KEY) return json({ error: 'Drive times are not connected yet.' }, 503);
        if (!(await freeMonthly(env, 'drive', 9000, Math.min(10, (body.placeIds || []).length)))) return json({ error: 'Drive times are resting until next month.', code: 'limit' }, 429);   // Google's 10,000 free route elements a month, never more
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
const FREE_PLACES = 900;   // Google gives 1,000 free searches a month; stop at 900 to be safe
/* The month's count lives in one stored number, and the store takes about one write per second for it.
   A plan runs six searches at once, so a write can be turned away; that used to stop the search ("free searches used up")
   and the rest of the plan came back empty. Now a turned-away write is kept here and added to the next one. */
const PLACES_MEM = { month: '', pending: 0 };
async function freePlaces(env) {
  if (!env.EC_KV) return false;
  const month = new Date().toISOString().slice(0, 7), key = 'places:' + month;
  if (PLACES_MEM.month !== month) { PLACES_MEM.month = month; PLACES_MEM.pending = 0; }
  const stored = parseInt((await env.EC_KV.get(key).catch(() => null)) || '0', 10);
  if (stored + PLACES_MEM.pending >= FREE_PLACES + (inReview(env) ? 150 : 0)) return false;   // review window: 150 more searches, about 50 beyond Google's free 1,000 (under $2)
  PLACES_MEM.pending++;
  try { await env.EC_KV.put(key, String(stored + PLACES_MEM.pending), { expirationTtl: 60 * 60 * 24 * 40 }); PLACES_MEM.pending = 0; } catch (e) {}   // busy: written with the next search
  return true;
}
async function freeMonthly(env, name, limit, n) {
  if (!env.EC_KV) return false;
  const key = name + ':' + new Date().toISOString().slice(0, 7), used = parseInt((await env.EC_KV.get(key)) || '0', 10);
  if (used + n > limit) return false;
  try { await env.EC_KV.put(key, String(used + n), { expirationTtl: 60 * 60 * 24 * 40 }); } catch (e) { return false; }   // can't count it, so don't spend
  return true;
}
// App Store review window: a little more room so Apple's testers never hit the daily limit (worst case about $5 extra), then back to normal.
function inReview(env) { return new Date().toISOString().slice(0, 10) <= String(env.REVIEW_UNTIL || ''); }
function cap(env) { return Math.max(Number(env.DAILY_CAP_USD || 0.66), inReview(env) ? 1 : 0); }
function dayKey() { return 'spend:' + new Date().toISOString().slice(0, 10); }
async function spent(env) { return Number((await env.EC_KV?.get(dayKey())) || 0); }
async function reserve(env, usd) {
  if (!env.EC_KV) return false; // never spend without a working counter
  const now = await spent(env);
  if (now + usd > cap(env)) return false;
  try { await env.EC_KV.put(dayKey(), String(Math.round((now + usd) * 10000) / 10000), { expirationTtl: 60 * 60 * 48 }); } catch (e) { return false; }
  return true;
}

/* ---------- concepts (Gemini) ---------- */
// Per-visitor limit, kept in the server's memory (no storage writes, so it never uses up Cloudflare's free daily
// write allowance). Best effort: 150 requests an hour per visitor; the daily dollar cap still protects spending.
const RL = new Map();
const RUDE = /\b(f+u+c+k\w*|sh[i1]t+\w*|bitch\w*|cunts?|c0ck\w*|cocksucker|dick(head|s)?|puss(y|ies)|assholes?|arsehole|whores?|sluts?|bastards?|motherf\w*|n[i1]gg\w*|fag(g?ot)?s?|retard(ed|s)?|porn\w*|nudes?|xxx|kys)\b/i;
function rude(text) { return RUDE.test(String(text || '').replace(/https?:\/\/\S+/g, ' ')); }
async function rateOk(env, ip, path = '') {
  /* searches get their own, larger allowance: one plan with three packages runs about 100 of them; the daily dollar cap still limits spending */
  const places = path === '/api/places', hour = new Date().toISOString().slice(0, 13), key = ip + (places ? ':p:' : ':') + hour, n = RL.get(key) || 0;
  if (n >= (places ? 400 : 150)) return false;
  RL.set(key, n + 1);
  if (RL.size > 5000) for (const k of RL.keys()) if (!k.endsWith(hour)) RL.delete(k);
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
  bar: { types: /night_club|\bbar\b|pub|restaurant|liquor_store|store|winery|brewery/, names: /sports bar|tavern|pub\b|grill|lounge|liquor|wine (shop|store)|brewing|brewery|alcohol delivery|bottle service/i },
  bartender: { types: /night_club|\bbar\b|pub|restaurant|liquor_store|store/, names: /sports bar|tavern|pub\b|grill|lounge|liquor|bartending school/i },
  photographer: { types: /store|school|lab\b/, names: /camera|photo lab|printing|passport|school|cvs|walgreens|walmart/i },
  videographer: { types: /store|school/, names: /camera|school|rental house/i },
  florals: { types: /supermarket|grocery|department_store|shopping_mall|convenience|pharmacy|gas_station/, names: /walmart|kroger|h-e-b|heb\b|costco|trader joe|whole foods|safeway|publix|1-800/i },
  cake: { types: /supermarket|grocery|convenience|gas_station|fast_food/, names: /walmart|kroger|h-e-b|heb\b|costco|sam's club|safeway|publix|dunkin|krispy|donut/i },
  catering: { types: /fast_food|convenience|gas_station|supermarket|event_venue|banquet_hall|wedding_venue/, names: /mcdonald|chick-fil-a|subway|taco bell|wendy|burger king|domino|pizza hut|papa john|panda express|popeyes|kfc|reception (venue|hall)|event venue|wedding venue|ballroom|banquet hall/i },   // a caterer, not a venue that happens to serve food
  hairMakeup: { types: /store|school|nail_salon|barber/, names: /beauty supply|sally beauty|ulta|sephora|school|academy|barber|nail/i },
  hair: { types: /store|school|nail_salon/, names: /beauty supply|sally beauty|ulta|sephora|school|academy|nail/i },
  rentals: { types: /car_rental|truck|storage/, names: /u-haul|penske|budget truck|storage|car rental/i },
  balloons: { types: /supermarket|grocery|department_store/, names: /party city|walmart|dollar|kroger/i },
  decor: { types: /home_goods_store|furniture_store|department_store|supermarket/, names: /hobby lobby|michaels|home goods|homegoods|walmart|target|ikea|at home/i },
  photoBooth: { types: /store|school/, names: /camera|school/i },
  favors: { types: /supermarket|grocery|department_store|discount_store|variety_store|convenience/, names: /popshelf|dollar|five below|party city|walmart|target|big lots|family dollar|balloon|helium|party decor|\bdecor\b|rental|\bevents\b|\bparty r\b/i },   // favors, not a balloon or decor company
  av: { types: /electronics_store|cell_phone|movie_theater/, names: /best buy|geek squad|cinema|theater|theatre/i },
  attire: { types: /print|screen_print|sporting/, names: /t-?shirt|tees\b|printing|screen print|uniform|sportswear|alterations only/i },
  signage: { types: /supermarket|department_store/, names: /walmart|office depot|staples|ups store|fedex office/i }
};
/* Vendors are businesses that provide the service, never the mall, a store or a restaurant they sit near.
   The primary type decides (Google tags a florist as a "store" too). Some categories must look like the thing itself. */
const NEVER_VENDOR = /^(shopping_mall|department_store|tourist_attraction|clothing_store|shoe_store|jewelry_store|supermarket|grocery_store|convenience_store|gas_station|pharmacy|hotel|lodging|park|museum|church|school|university)$/;
/* A mosque, temple or community center is never a vendor, except as the place to find an officiant. */
const WORSHIP = /^(mosque|hindu_temple|synagogue|place_of_worship|church|buddhist_temple|community_center)$/;
const FOOD_PLACE = /restaurant|cafe|meal_takeaway|meal_delivery|food_court|fast_food/;
const FOOD_OK = ['catering', 'cake', 'bar', 'bartender', 'privateDining', 'restaurantFood'];
const MUST_LOOK_LIKE = {
  florals: { types: /florist/, names: /flor|flower|bloom|blossom|petal|botanic|stem|rose|bouquet|garden/i },
  cake: { types: /bakery|dessert|confection|cake|pastry/, names: /cake|bak(e|er|ing)|patisser|p\u00e2tisser|sweet|dessert|confection|cupcake|cookie|pastr|mithai|tres leches/i },
  balloons: { types: /party|event/, names: /balloon|ballon|party|decor|event/i },
  photographer: { types: /photograph/, names: /photo|studio|image|portrait|film|captur|lens|visual/i },
  videographer: { types: /video|film|photograph/, names: /video|film|cinema|motion|studio|media|production/i },
  hairMakeup: { types: /beauty|hair|spa|makeup/, names: /makeup|mua|beauty|glam|hair|bridal|artistry|lash|face/i },
  hair: { types: /beauty|hair|spa/, names: /hair|stylist|salon|blowout|bridal|glam|beauty|updo|extensions/i },
  decor: { types: /event|party|florist|furniture_rental|interior/, names: /decor|design|event|rental|styl|backdrop|balloon|floral|draper|luxe|occasion/i },
  attire: { types: /bridal|wedding|clothing_store|boutique/, names: /bridal|bride|wedding|gown|couture|dress|boutique|formal|evening|suit|tux|abaya|saree|sari|lehenga|kaftan|atelier|fashion|tailor/i }
};
function rightKind(p, cat) {
  const prim = String(p.primaryType || ''), name = p.displayName?.text || '', types = [prim].concat(p.types || []).join(' ');
  if (NEVER_VENDOR.test(prim) && !(cat === 'attire' && /clothing_store/.test(prim))) return false;
  if (WORSHIP.test(prim) && cat !== 'officiant') return false;
  if (FOOD_PLACE.test(prim) && !FOOD_OK.includes(cat)) return false;
  const must = MUST_LOOK_LIKE[cat]; if (must && !must.types.test(types) && !must.names.test(name)) return false;
  return true;
}
/* Keep results in the city's own area: Google sometimes adds a business from another city (a Dallas DJ for Houston).
   The middle of all results marks the city; anything more than 70 km from it is dropped. */
function kmBetween(a, b) { const R = 6371, d = x => x * Math.PI / 180, dl = d(b.latitude - a.latitude), dn = d(b.longitude - a.longitude); const h = Math.sin(dl / 2) ** 2 + Math.cos(d(a.latitude)) * Math.cos(d(b.latitude)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
function nearCity(list, km = 70) {
  const pts = list.filter(p => p.location && isFinite(p.location.latitude) && isFinite(p.location.longitude));
  if (pts.length < 3) return list;
  const mid = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const c = { latitude: mid(pts.map(p => p.location.latitude)), longitude: mid(pts.map(p => p.location.longitude)) };
  return list.filter(p => !p.location || kmBetween(c, p.location) <= km);
}
/* Every Google search is remembered for a week (the same search from anyone costs nothing again),
   and only the monthly free allowance is ever used: past it, searches stop until next month and the app offers Google Maps links instead. */
async function googleSearch(env, body) {
  const key = 'g2:' + await sha(JSON.stringify(body));   // g2: results now include the business phone
  const hit = env.EC_KV && await env.EC_KV.get(key, 'json').catch(() => null);
  if (Array.isArray(hit)) return hit;
  if (!(await freePlaces(env))) throw new Error('limit');
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_MAPS_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.regularOpeningHours.weekdayDescriptions,places.businessStatus,places.types,places.primaryType,places.location' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('places');
  const list = (await r.json()).places || [];
  if (env.EC_KV) try { await env.EC_KV.put(key, JSON.stringify(list), { expirationTtl: 60 * 60 * 24 * 7 }); } catch (e) {}   // a full cache never breaks a search
  return list;
}
async function places(env, query, city, level = 'S', vendor = false, cat = '', hint = '') {
  const rule = CAT_RULES[cat], hintRe = hint ? new RegExp('\\b(' + hint.split(/[,|]/).map(w => w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean).join('|') + ')', 'i') : null;
  const L = vendor ? { minRating: 4.5, minReviews: /^(bartender|bar|favors|officiant|coordinator)$/.test(cat) ? 5 : 15, priceLevels: [] } : (LEVEL[level] || LEVEL.S);   // small trades (mobile bartenders, favor makers) rarely have many reviews
  const search = async (withPrice) => {
    const body = { textQuery: `${query} in ${city}`, maxResultCount: 20, minRating: L.minRating };
    if (withPrice) body.priceLevels = L.priceLevels;
    return googleSearch(env, body);
  };
  let raw = await search(!vendor);
  // venues like ballrooms and estates often have no price level; fill in from an unpriced search, still rating-filtered
  if (!vendor && raw.length < 5) { const more = await search(false); const seen = new Set(raw.map(p => p.id)); raw = raw.concat(more.filter(p => !seen.has(p.id) && !(p.priceLevel === 'PRICE_LEVEL_INEXPENSIVE' || p.priceLevel === 'PRICE_LEVEL_FREE'))); }
  raw = nearCity(raw);
  return raw
    .filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY' && p.businessStatus !== 'CLOSED_TEMPORARILY')
    .filter(p => !BUDGET_CHAINS.test(p.displayName?.text || '') && (level === 'L' || !MID_CHAINS.test(p.displayName?.text || '')))
    .filter(p => vendor || !p.priceLevel || L.priceLevels.includes(p.priceLevel))
    .filter(p => vendor || !/^(shopping_mall|department_store|clothing_store|store)$/.test(String(p.primaryType || '')))   // a venue is never a mall or a store (a conference search found The Galleria mall)
    .filter(p => !vendor || /coordinator/.test(query) || !PLANNERS.test(p.displayName?.text || ''))   // vendors means the actual service, never planners   // places with no price level (ballrooms, estates) are judged by rating alone
    .filter(p => !rule || (!rule.types.test(cat === 'florals' ? String(p.primaryType || '') : [p.primaryType || ''].concat(p.types || []).join(' ')) && !rule.names.test(p.displayName?.text || '')))
    .filter(p => !vendor || rightKind(p, cat))
    .filter(p => (p.rating || 0) >= L.minRating && (p.userRatingCount || 0) >= L.minReviews)
    /* best reviewed first; a business that names this occasion (a wedding DJ for a wedding) moves up */
    .map(p => ({ p, score: p.rating * Math.log10(10 + p.userRatingCount) * (hintRe && hintRe.test(p.displayName?.text || '') ? 1.12 : 1) }))
    .sort((a, b) => b.score - a.score).map(x => x.p)
    .slice(0, 8)
    .map(p => ({ id: p.id, name: p.displayName?.text, address: p.formattedAddress, rating: p.rating, reviews: p.userRatingCount,
      priceLevel: p.priceLevel, mapsUrl: p.googleMapsUri, website: p.websiteUri, phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '', hours: p.regularOpeningHours?.weekdayDescriptions || [], restaurant: /restaurant|steak|bistro|brasserie|grill|dining/.test(String(p.primaryType || '')), bar: /\b(bar|night_club|pub|wine_bar|cocktail_bar|brewery|liquor_store)\b/.test([p.primaryType || ''].concat(p.types || []).join(' ')), source: 'Google' }));
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
  const out = recs.filter(x => x && x[1].live && !x[1].hidden && x[1].approved !== false && (!cat || x[1].l.cats.includes(cat)) && x[1].l.cities.some(c => cityKey(c) === city))
    .sort((a, b) => (isFeatured(b[1]) ? 1 : 0) - (isFeatured(a[1]) ? 1 : 0) || (b[1].founding ? 1 : 0) - (a[1].founding ? 1 : 0) || a[1].at - b[1].at).slice(0, 12).map(x => publicCard(x[0], x[1]));
  return json({ vendors: out });
}
async function vendorProfile(env, id, json) {
  const rec = env.EC_KV && await kvGet(env, 'vend:' + id, null);
  if (!rec || !rec.live || rec.hidden || rec.approved === false) return json({ error: 'This vendor isn’t listed right now.' }, 404);
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
    if (!rec) { id = rid().slice(0, 12); rec = { kh: await sha(key), at: Date.now(), reports: [], approved: false }; const pend = await kvGet(env, 'vpend', []); pend.push(id); await env.EC_KV.put('vpend', JSON.stringify(pend.slice(-500))); }   // a new listing waits for the owner's approval (App Store 1.2)
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
    return json({ ok: true, id, live: rec.live, pending: rec.approved === false, founding: !!rec.founding, missing: rec.live ? [] : ['name', 'cats', 'cities'].filter(k => !l[k].length).concat(l.site || l.ig ? [] : ['ig']).concat(body.listing && body.listing.agree ? [] : ['agree']) });
  }
  if (action === 'vendor/report') {
    const id = String(body.id || ''); const rec = /^[a-z0-9]{8,16}$/.test(id) && await kvGet(env, 'vend:' + id, null);
    if (!rec) return json({ error: 'Not found' }, 404);
    const who = (await sha('r' + ip)).slice(0, 16); rec.reports = rec.reports || [];
    if (!rec.reports.includes(who)) rec.reports.push(who);
    if (rec.reports.length >= REPORTS_HIDE) rec.hidden = true;
    await addReport(env, { kind: 'vendor', id, note: String(body.why || '').slice(0, 40), text: rec.l ? rec.l.name : '' });
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
    if (rec.approved === false) return json({ error: 'Your listing is waiting for approval. You can reply once it\u2019s approved, usually within a day.' }, 403);
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

/* Always Luxe Concierge Booking: one request per checkout. The private code in its link lets only Demah
   (from the Stripe payment) and the client open it. Kept a year; no card details ever pass through here. */
const CQ_TIERS = { essentials: 1, signature: 1, full: 1, allin: 1 };
// Concierge prices in US dollars, set here on the server (never trusted from the browser): [founding-client price, regular price].
const CQ_PRICES = { essentials: [249, 349, 'Essentials'], signature: [599, 899, 'Signature'], full: [1299, 1800, 'Full Concierge'], allin: [2499, 3500, 'Couture All-Inclusive'] };
const cqPriceOf = (env, tier) => CQ_PRICES[tier] ? CQ_PRICES[tier][env.CQ_FOUNDING === '0' ? 1 : 0] : 0;
async function conciergeNew(env, b) {
  const t = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b-\u001f]/g, '').slice(0, n).trim();
  if (!CQ_TIERS[b.tier]) return { error: 'Choose a booking package.' };
  const a = new Uint8Array(12); crypto.getRandomValues(a);
  const ref = Array.from(a, x => x.toString(16).padStart(2, '0')).join('');
  const rec = { ref, tier: b.tier, tierName: CQ_PRICES[b.tier][2], price: cqPriceOf(env, b.tier), founding: env.CQ_FOUNDING !== '0',
    name: t(b.name, 80), phone: t(b.phone, 30), email: t(b.email, 120), when: t(b.when, 20), type: t(b.type, 60), date: t(b.date, 10),
    city: t(b.city, 80), guests: Math.max(0, Math.min(100000, +b.guests || 0)), vendors: Math.max(0, Math.min(99, +b.vendors || 0)), summary: t(b.summary, 8000), at: Date.now() };
  if (!rec.name || !rec.phone || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rec.email)) return { error: 'Add your name, phone and email.' };
  await env.EC_KV.put('cq:' + ref, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 366 });
  return { ref };
}

/* "Let us plan it for you": a request for the founder's paid planning service. Kept a year; she reads them in the admin page. */
const PR_HELP = ['Full planning', 'Finding a venue', 'Booking vendors', 'Negotiating prices', 'Decor and flowers', 'Budget', 'Invitations and RSVPs', 'Wedding-day schedule'];
async function planReqNew(env, b) {
  const t = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b-\u001f]/g, '').slice(0, n).trim();
  const a = new Uint8Array(10); crypto.getRandomValues(a);
  const id = Array.from(a, x => x.toString(16).padStart(2, '0')).join('');
  const rec = { id, at: new Date().toISOString(), status: 'new', help: (Array.isArray(b.help) ? b.help : []).filter(h => PR_HELP.includes(h)).slice(0, 8),
    type: t(b.type, 60), date: t(b.date, 40), city: t(b.city, 80), guests: Math.max(0, Math.min(100000, +b.guests || 0)), budget: t(b.budget, 40),
    name: t(b.name, 80), phone: t(b.phone, 30), email: t(b.email, 120), contact: ['text', 'call', 'email'].includes(b.contact) ? b.contact : 'text', notes: t(b.notes, 2000), priceOk: t(b.priceOk, 10) };
  if (!rec.name) return { error: 'Add your name.' };
  if (!rec.phone && !rec.email) return { error: 'Add a phone number or an email so we can reach you.' };
  if (rec.email && !EMAIL_RE.test(rec.email)) return { error: 'Check your email address.' };
  if (rec.phone && rec.phone.replace(/\D/g, '').length < 7) return { error: 'Check your phone number.' };
  await env.EC_KV.put('preq:' + id, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 366 });
  return { ok: true };
}
async function planReqList(env, json) {
  const out = []; let cursor;
  do { const l = await env.EC_KV.list({ prefix: 'preq:', cursor }); for (const k of l.keys) { const r = await env.EC_KV.get(k.name, 'json'); if (r) out.push(r); } cursor = l.list_complete ? null : l.cursor; } while (cursor);
  out.sort((x, y) => String(y.at).localeCompare(String(x.at)));
  return json({ requests: out });
}
async function planReqSet(env, b, json) {
  const id = String(b.id || ''); if (!/^[a-f0-9]{20}$/.test(id)) return json({ error: 'Not found' }, 404);
  const r = await env.EC_KV.get('preq:' + id, 'json'); if (!r) return json({ error: 'Not found' }, 404);
  if (b.status === 'delete') { await env.EC_KV.delete('preq:' + id); return json({ ok: true }); }
  r.status = b.status === 'new' ? 'new' : 'handled'; await env.EC_KV.put('preq:' + id, JSON.stringify(r), { expirationTtl: 60 * 60 * 24 * 366 });
  return json({ ok: true });
}

async function turnstileOk(env, token, ip) {
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  try {
    const f = new FormData(); f.append('secret', env.TURNSTILE_SECRET); f.append('response', token); if (ip) f.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f });
    const j = await r.json(); return j.success === true;
  } catch (e) { return false; }
}

// Email tips list: stored only with explicit consent, keyed by a hash of the address so a removal finds it.
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
async function emailKey(email) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.trim().toLowerCase())); return 'optin:' + [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 40); }
async function optin(env, remove, body, json) {
  const email = String(body.email || '').trim().slice(0, 254);
  if (!EMAIL_RE.test(email)) return json({ error: 'Enter a valid email address.' }, 400);
  const key = await emailKey(email);
  if (remove) { await env.EC_KV.delete(key); return json({ ok: true }); }
  if (body.consent !== true) return json({ error: 'Tick the box to agree to the emails.' }, 400);
  const clip = (v, n) => String(v || '').replace(/[\r\n]+/g, ' ').slice(0, n);
  const rec = { email, consent: body.kind === 'ideas' ? 'Yes, email me event ideas and planning tips. I can unsubscribe anytime.' : 'Yes, email me planning tips and reminders for this event. I can unsubscribe anytime.', at: new Date().toISOString(), type: clip(body.type, 60), date: /^\d{4}-\d{2}-\d{2}$/.test(String(body.date || '')) ? body.date : '', city: clip(body.city, 80), guests: Math.max(0, Math.min(100000, +body.guests || 0)) };
  await env.EC_KV.put(key, JSON.stringify(rec));
  return json({ ok: true });
}
/* The owner's code, compared in constant time. Never stored anywhere but the server's secrets. */
function adminOk(req, env) {
  const code = req.headers.get('x-admin-code') || '';
  if (!env.ADMIN_CODE || !env.EC_KV || !code) return false;
  const a = new TextEncoder().encode(code), b = new TextEncoder().encode(env.ADMIN_CODE);
  let same = a.length === b.length ? 0 : 1; for (let i = 0; i < Math.max(a.length, b.length); i++) same |= (a[i] || 0) ^ (b[i] || 0);
  return same === 0;
}

// ---------- Reviews of Event Couture: hosts write them after planning; none show until the owner approves them ----------
// People who know the founder pick that when they write, and the site shows it beside their review (FTC rule on reviews).
const REV_REL = { none: '', friend: 'Friend of the founder', family: 'Family of the founder' };
async function reviewNew(env, body, json) {
  const stars = Math.round(+body.stars || 0);
  if (!(stars >= 1 && stars <= 5)) return json({ error: 'Choose from 1 to 5 stars.' }, 400);
  const text = aclip(body.text, 600), name = aclip(body.name, 40);
  if (text.length < 10) return json({ error: 'Write a few words about your plan.' }, 400);
  if (!name) return json({ error: 'Add your first name.' }, 400);
  if (body.consent !== true) return json({ error: 'Tick the box so we can show your review.' }, 400);
  const id = Date.now().toString(36) + [...crypto.getRandomValues(new Uint8Array(5))].map(b => b.toString(16).padStart(2, '0')).join('');
  const rec = { id, stars, text, name, event: aclip(body.event, 60), city: aclip(body.city, 60), rel: Object.prototype.hasOwnProperty.call(REV_REL, body.rel) ? body.rel : 'none', status: 'pending', at: new Date().toISOString() };
  await env.EC_KV.put('rev:' + id, JSON.stringify(rec));
  return json({ ok: true });
}
// Reports from hosts: kept for the owner, who is emailed within the hour and acts within 24 hours.
async function addReport(env, r) { if (!env.EC_KV) return; const l = await kvGet(env, 'reports', []); l.unshift({ ...r, at: new Date().toISOString() }); await env.EC_KV.put('reports', JSON.stringify(l.slice(0, 200))); }
async function vendorsPending(env, json) {
  if (!env.EC_KV) return json({ vendors: [] });
  const ids = await kvGet(env, 'vpend', []), out = [];
  for (const id of ids) { const r = await kvGet(env, 'vend:' + id, null); if (r && r.approved === false && !r.hidden) out.push({ id, name: r.l && r.l.name, cats: r.l && r.l.cats, cities: r.l && r.l.cities, ig: r.l && r.l.ig, site: r.l && r.l.site, bio: r.l && r.l.bio, at: r.at, live: r.live }); }
  return json({ vendors: out });
}
async function vendorSet(env, body, json) {
  const id = String(body.id || ''); if (!/^[a-z0-9]{8,16}$/.test(id)) return json({ error: 'Not found' }, 404);
  const r = await kvGet(env, 'vend:' + id, null); if (!r) return json({ error: 'Not found' }, 404);
  if (body.status === 'approved') { r.approved = true; r.hidden = false; } else if (body.status === 'hidden') r.hidden = true; else return json({ error: 'Choose approve or hide.' }, 400);
  await env.EC_KV.put('vend:' + id, JSON.stringify(r));
  await env.EC_KV.put('vpend', JSON.stringify((await kvGet(env, 'vpend', [])).filter(x => x !== id)));
  return json({ ok: true });
}
async function reviewsAll(env, json) {
  const out = []; let cursor;
  do { const l = await env.EC_KV.list({ prefix: 'rev:', cursor }); for (const k of l.keys) { const r = await env.EC_KV.get(k.name, 'json'); if (r) out.push(r); } cursor = l.list_complete ? null : l.cursor; } while (cursor);
  out.sort((x, y) => (y.at || '').localeCompare(x.at || ''));
  return json({ reviews: out });
}
async function reviewSet(env, body, json) {
  const id = String(body.id || ''); if (!/^[a-z0-9]{12,30}$/.test(id)) return json({ error: 'Not found' }, 404);
  const k = 'rev:' + id, r = await env.EC_KV.get(k, 'json'); if (!r) return json({ error: 'Not found' }, 404);
  if (body.status === 'deleted') await env.EC_KV.delete(k);
  else if (body.status === 'approved' || body.status === 'hidden') { r.status = body.status; await env.EC_KV.put(k, JSON.stringify(r)); }
  else return json({ error: 'Choose approve, hide or delete.' }, 400);
  /* The public list is one stored key, rebuilt only when the owner changes something, so showing reviews costs one read. */
  let list = ((await env.EC_KV.get('revs:approved', 'json')) || []).filter(x => x.id !== id);
  if (body.status === 'approved') list.unshift({ id: r.id, stars: r.stars, text: r.text, name: r.name, event: r.event, city: r.city, label: REV_REL[r.rel] || '', at: r.at });
  await env.EC_KV.put('revs:approved', JSON.stringify(list.slice(0, 60)));
  return json({ ok: true });
}
async function optinExport(req, env, cors) {
  const code = req.headers.get('x-admin-code') || '';
  if (!env.ADMIN_CODE || !env.EC_KV) return new Response('Not found', { status: 404, headers: cors });
  const a = new TextEncoder().encode(code), b = new TextEncoder().encode(env.ADMIN_CODE);
  let same = a.length === b.length ? 0 : 1; for (let i = 0; i < Math.max(a.length, b.length); i++) same |= (a[i] || 0) ^ (b[i] || 0);
  if (same !== 0) return new Response('Forbidden', { status: 403, headers: cors });
  const rows = [['email', 'signed_up', 'event_type', 'event_date', 'city', 'guests', 'consent']];
  let cursor;
  do { const l = await env.EC_KV.list({ prefix: 'optin:', cursor }); for (const k of l.keys) { const r = await env.EC_KV.get(k.name, 'json'); if (r) rows.push([r.email, r.at, r.type, r.date, r.city, r.guests, r.consent]); } cursor = l.list_complete ? null : l.cursor; } while (cursor);
  const csv = rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\n');
  return new Response(csv, { headers: { ...cors, 'content-type': 'text/csv; charset=utf-8', 'cache-control': 'no-store' } });
}

// View-only plan links (#/p/<id>): the host publishes a snapshot of the finished plan; anyone with the link can read it.
// The host owns it with a random key (only its hash is stored). Kept for 180 days after the last publish.
const PROP_MAX = 1500000;
async function proposal(req, env, id, action, json) {
  if (!env.EC_KV) return json({ error: 'Sharing is not connected yet.' }, 503);
  const k = 'prop:' + id, rec = await env.EC_KV.get(k, 'json');
  if (req.method === 'GET' && !action) return rec ? json({ plan: rec.plan, at: rec.at }) : json({ error: 'This plan link isn\u2019t available. Ask the host for a new one.' }, 404);
  if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
  if (+(req.headers.get('content-length') || 0) > PROP_MAX + 4000) return json({ error: 'That plan is too large to share. Remove a few photos and try again.' }, 413);
  const body = await req.json().catch(() => ({}));
  if (!body.key || String(body.key).length < 20) return json({ error: 'Missing key' }, 400);
  const kh = await sha(body.key);
  if (rec && rec.kh !== kh) return json({ error: 'Not allowed' }, 403);
  if (action === 'delete') { if (rec) await env.EC_KV.delete(k); return json({ ok: true }); }
  if (action === 'publish') {
    if (!(await rateOk(env, req.headers.get('cf-connecting-ip') || 'unknown'))) return json({ error: 'Please wait a few minutes and try again.' }, 429);
    const text = JSON.stringify(body.plan || {});
    if (text.length > PROP_MAX) return json({ error: 'That plan is too large to share. Remove a few photos and try again.' }, 413);
    await env.EC_KV.put(k, JSON.stringify({ kh, plan: JSON.parse(text), at: Date.now() }), { expirationTtl: 180 * 86400 });
    return json({ ok: true, id });
  }
  return json({ error: 'Not found' }, 404);
}

// ---------- Vendor replies: a customer's message carries a private link; the vendor answers in one minute, sharing only what they want ----------
// No customer contact details are stored or shown. Everything the vendor shares is optional (phone, availability, a starting price).
const ASK_TTL = 240 * 86400, ASK_HITS = new Map();
// A tighter limit for reply links than for planning: 30 new links and 20 replies an hour from one address.
function askOk(ip, kind, max) { const now = Date.now(), key = kind + ip, a = (ASK_HITS.get(key) || []).filter(t => now - t < 3600e3); if (a.length >= max) return false; a.push(now); ASK_HITS.set(key, a); if (ASK_HITS.size > 5000) ASK_HITS.clear(); return true; }
const aclip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);   // no tags, ever
async function askVendor(req, env, id, action, json) {
  if (!env.EC_KV) return json({ error: 'Vendor replies are not connected yet.' }, 503);
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';
  if (action === 'new') {
    if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
    if (!askOk(ip, 'n', 30) || !(await rateOk(env, ip))) return json({ error: 'Please wait a few minutes and try again.' }, 429);
    const b = await req.json().catch(() => ({})), d = b.d || {};
    if (!b.key || String(b.key).length < 20) return json({ error: 'Missing key' }, 400);
    const rec = { kh: await sha(b.key), at: Date.now(), reply: null, d: {
      type: aclip(d.type, 60), date: /^\d{4}-\d{2}-\d{2}$/.test(d.date || '') ? d.date : '', dateTo: /^\d{4}-\d{2}-\d{2}$/.test(d.dateTo || '') ? d.dateTo : '', city: aclip(d.city, 80), guests: Math.max(0, Math.min(5000, parseInt(d.guests, 10) || 0)),
      look: aclip(d.look, 80), colors: aclip(d.colors, 120), need: aclip(d.need, 80), setting: aclip(d.setting, 60), vendor: aclip(d.vendor, 120), cur: /^[A-Z]{3}$/.test(d.cur || '') ? d.cur : 'USD', hours: Math.max(0, Math.min(24, +d.hours || 0)) } };
    if (!rec.d.need || !rec.d.vendor) return json({ error: 'Missing details' }, 400);
    const nid = [...crypto.getRandomValues(new Uint8Array(10))].map(x => x.toString(16).padStart(2, '0')).join('');
    try { await env.EC_KV.put('ask:' + nid, JSON.stringify(rec), { expirationTtl: ASK_TTL }); } catch (e) { return json({ error: 'Reply links are busy right now. Your message still works without one.' }, 503); }
    return json({ id: nid });
  }
  const k = 'ask:' + id, rec = await env.EC_KV.get(k, 'json');
  if (!rec) return json({ error: 'This request isn’t available anymore.' }, 404);
  if (req.method === 'GET') return json({ d: rec.d, reply: rec.reply ? { ...rec.reply, vth: undefined } : null, at: rec.at });
  if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
  if (!(await rateOk(env, ip))) return json({ error: 'Please wait a few minutes and try again.' }, 429);
  const b = await req.json().catch(() => ({}));
  if (action === 'delete') { if (!b.key || await sha(b.key) !== rec.kh) return json({ error: 'Not allowed' }, 403); await env.EC_KV.delete(k); return json({ ok: true }); }   // the customer removes her request
  if (action === 'report') { if (!b.key || await sha(b.key) !== rec.kh) return json({ error: 'Not allowed' }, 403); await addReport(env, { kind: 'vendor message', id, note: String(b.why || '').slice(0, 40), text: rec.reply ? String(rec.reply.note || '').slice(0, 300) : '' }); return json({ ok: true }); }   // the host reports a reply (App Store 1.2)
  if (action !== 'reply') return json({ error: 'Not found' }, 404);
  if (rude(JSON.stringify(b))) return json({ error: 'Please keep it friendly: that message has words we don\u2019t allow.', code: 'words' }, 400);
  if (!askOk(ip, 'r', 20)) return json({ error: 'Please wait a few minutes and try again.' }, 429);
  // The first reply gets a private edit token; only that browser can change the answer, a few times at most.
  if (rec.reply && (!b.vt || await sha(b.vt) !== rec.reply.vth)) return json({ error: 'This request already has a reply.', code: 'replied' }, 409);
  if (rec.reply && (rec.reply.edits || 0) >= 5) return json({ error: 'This reply can\u2019t be changed again. Reach the client directly.' }, 429);
  const avail = ['yes', 'no', 'check'].includes(b.avail) ? b.avail : '';
  const priceMode = b.priceMode === 'price' ? 'price' : b.priceMode === 'direct' ? 'direct' : '';
  const price = priceMode === 'price' ? Math.max(0, Math.min(1e7, Math.round(+b.price || 0))) : 0;
  const reply = { name: aclip(b.name, 120), phone: aclip(b.phone, 30).replace(/[^\d+()\-.\s]/g, ''), ig: aclip(b.ig, 40).replace(/[^\w.@]/g, ''), avail, priceMode, price, priceNote: aclip(b.priceNote, 60), note: aclip(b.note, 600), at: Date.now() };
  if (!reply.avail && !reply.phone && !reply.note && !reply.price && !reply.priceMode) return json({ error: 'Add at least one answer.' }, 400);
  const vt = rec.reply ? b.vt : [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, '0')).join('');
  reply.vth = rec.reply ? rec.reply.vth : await sha(vt); reply.edits = rec.reply ? (rec.reply.edits || 0) + 1 : 0;
  rec.reply = reply;
  try { await env.EC_KV.put(k, JSON.stringify(rec), { expirationTtl: ASK_TTL }); } catch (e) { return json({ error: 'That didn\u2019t send. Please try again in a little while.' }, 503); }
  return json({ ok: true, vt });
}

// ---------- Continue on another device: a private link that copies one plan to another phone or computer (30 days) ----------
const MOVE_MAX = 1500000;
async function movePlan(req, env, id, json) {
  if (!env.EC_KV) return json({ error: 'Moving plans is not connected yet.' }, 503);
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';
  if (id === 'new') {
    if (req.method !== 'POST') return json({ error: 'Not found' }, 404);
    if (+(req.headers.get('content-length') || 0) > MOVE_MAX + 4000) return json({ error: 'This plan is too large to move. Remove a few photos and try again.' }, 413);
    if (!askOk(ip, 'm', 20) || !(await rateOk(env, ip))) return json({ error: 'Please wait a few minutes and try again.' }, 429);
    const b = await req.json().catch(() => ({})), text = JSON.stringify(b.plan || null);
    if (!b.plan || typeof b.plan !== 'object' || !b.plan.id) return json({ error: 'Missing plan' }, 400);
    if (text.length > MOVE_MAX) return json({ error: 'This plan is too large to move. Remove a few photos and try again.' }, 413);
    const nid = [...crypto.getRandomValues(new Uint8Array(12))].map(x => x.toString(16).padStart(2, '0')).join('');
    try { await env.EC_KV.put('mv:' + nid, text, { expirationTtl: 30 * 86400 }); } catch (e) { return json({ error: 'That didn\u2019t work right now. Please try again in a little while.' }, 503); }
    return json({ id: nid });
  }
  if (req.method !== 'GET') return json({ error: 'Not found' }, 404);
  const plan = await env.EC_KV.get('mv:' + id, 'json');
  return plan ? json({ plan }) : json({ error: 'This link has expired or was already replaced. Make a new one from the plan on your other device.' }, 404);
}

// ---------- Payments: Stripe Checkout for Event Couture's own fees (the concierge booking packages) ----------
// The price comes from CQ_PRICES on the server. The booking is marked paid only by Stripe's signed webhook.
const SITE = 'https://eventcouture.app/';
// Webhook signing secret: from the STRIPE_WEBHOOK_SECRET setting if one was saved, otherwise created automatically.
// The first checkout with a Stripe key registers this server's webhook with Stripe (once per test/live key) and keeps the
// signing secret in KV, so the owner only has to save STRIPE_SECRET_KEY.
const WH_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'charge.refunded'];
function keyMode(env) { return /_live_/.test(String(env.STRIPE_SECRET_KEY || '')) ? 'live' : 'test'; }
async function webhookSecret(env) { return env.STRIPE_WEBHOOK_SECRET || (env.EC_KV ? await env.EC_KV.get('cfg:whsec:' + keyMode(env)) : null); }
async function ensureWebhook(env, origin) {
  if (env.STRIPE_WEBHOOK_SECRET || await env.EC_KV.get('cfg:whsec:' + keyMode(env))) return true;
  const hookUrl = origin + '/api/stripe/webhook', auth = { authorization: 'Bearer ' + env.STRIPE_SECRET_KEY };
  try {   // remove an earlier endpoint for this URL whose secret we no longer have, so Stripe never sends duplicates
    const l = await (await fetch('https://api.stripe.com/v1/webhook_endpoints?limit=100', { headers: auth })).json();
    for (const w of (l && l.data) || []) if (w.url === hookUrl) await fetch('https://api.stripe.com/v1/webhook_endpoints/' + w.id, { method: 'DELETE', headers: auth });
  } catch (e) {}
  const f = new URLSearchParams(); f.set('url', hookUrl); f.set('description', 'Event Couture payments (created automatically)'); WH_EVENTS.forEach((e, i) => f.set('enabled_events[' + i + ']', e));
  const r = await fetch('https://api.stripe.com/v1/webhook_endpoints', { method: 'POST', headers: Object.assign({ 'content-type': 'application/x-www-form-urlencoded' }, auth), body: f.toString() });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !/^whsec_/.test(String(d.secret || ''))) return false;
  await env.EC_KV.put('cfg:whsec:' + keyMode(env), d.secret);
  return true;
}
async function checkout(env, b, url, json) {
  if (!(await ensureWebhook(env, url.origin))) return json({ error: 'Card payments couldn\u2019t be set up. Please try again in a minute.' }, 502);
  const ref = String(b.ref || '');
  if (!/^[a-f0-9]{24}$/.test(ref)) return json({ error: 'That booking request wasn\u2019t found.' }, 400);
  const rec = await env.EC_KV.get('cq:' + ref, 'json');
  if (!rec) return json({ error: 'That booking request wasn\u2019t found.' }, 404);
  if (rec.paid) return json({ error: 'This booking is already paid.', paid: true }, 409);
  const price = cqPriceOf(env, rec.tier); if (!price) return json({ error: 'Choose a booking package.' }, 400);
  const f = new URLSearchParams();
  f.set('mode', 'payment'); f.set('client_reference_id', ref); f.set('customer_email', rec.email);
  f.set('line_items[0][quantity]', '1'); f.set('line_items[0][price_data][currency]', 'usd'); f.set('line_items[0][price_data][unit_amount]', String(price * 100));
  f.set('line_items[0][price_data][product_data][name]', 'Event Couture Concierge: ' + CQ_PRICES[rec.tier][2]);
  f.set('line_items[0][price_data][product_data][description]', 'Booking service fee. Vendor prices are separate and paid to each vendor.');
  f.set('metadata[ref]', ref); f.set('metadata[tier]', rec.tier); f.set('payment_intent_data[metadata][ref]', ref);
  // The client's request goes with the payment, so the owner sees everything on the payment's page in the Stripe Dashboard.
  const info = [['client', rec.name], ['phone', rec.phone], ['email', rec.email], ['event', rec.type], ['date', rec.date], ['call_time', rec.when], ['city', rec.city], ['guests', rec.guests ? String(rec.guests) : ''], ['package_vendors', rec.vendors ? String(rec.vendors) : '']];
  const sum = String(rec.summary || ''); for (let i = 0; i * 480 < sum.length && i < 17; i++) info.push(['plan_' + String(i + 1).padStart(2, '0'), sum.slice(i * 480, i * 480 + 480)]);
  for (const [k, v] of info) if (v) { f.set('metadata[' + k + ']', String(v).slice(0, 490)); f.set('payment_intent_data[metadata][' + k + ']', String(v).slice(0, 490)); }
  f.set('payment_intent_data[description]', ('Concierge ' + CQ_PRICES[rec.tier][2] + ' \u00b7 ' + [rec.name, rec.type, rec.city, rec.date].filter(Boolean).join(' \u00b7 ')).slice(0, 900));
  f.set('phone_number_collection[enabled]', 'true');
  f.set('success_url', SITE + '#/booked/' + ref); f.set('cancel_url', SITE + '#/cq/' + ref);
  f.set('expires_at', String(Math.floor(Date.now() / 1000) + 3600));
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'content-type': 'application/x-www-form-urlencoded', 'idempotency-key': 'cq-' + ref + '-' + rec.tier + '-' + Math.floor(Date.now() / 3600000) }, body: f.toString() });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.url) return json({ error: 'Card payment couldn\u2019t start. Please try again in a minute.' }, 502);
  rec.session = j.id; await env.EC_KV.put('cq:' + ref, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 366 });
  return json({ url: j.url });
}
function hex(buf) { return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join(''); }
function sameText(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
async function stripeSignatureOk(secret, header, payload, nowSec) {
  if (!secret || !header) return false;
  const parts = Object.create(null), v1 = [];
  for (const kv of header.split(',')) { const i = kv.indexOf('='); if (i < 0) continue; const k = kv.slice(0, i).trim(), v = kv.slice(i + 1).trim(); if (k === 'v1') v1.push(v); else parts[k] = v; }
  const t = +parts.t; if (!t || !v1.length || Math.abs((nowSec || Date.now() / 1000) - t) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const want = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(t + '.' + payload)));
  return v1.some(sig => sameText(sig, want));
}
async function stripeWebhook(req, env, json) {
  const whsec = env.EC_KV ? await webhookSecret(env) : null;
  if (!whsec) return json({ error: 'Not set up' }, 503);
  const payload = await req.text();
  if (payload.length > 512000) return json({ error: 'Too large' }, 413);
  if (!(await stripeSignatureOk(whsec, req.headers.get('stripe-signature'), payload))) return json({ error: 'Bad signature' }, 400);
  let ev; try { ev = JSON.parse(payload); } catch (e) { return json({ error: 'Bad JSON' }, 400); }
  if (!ev || !/^evt_/.test(String(ev.id || ''))) return json({ error: 'Bad event' }, 400);
  if (await env.EC_KV.get('sevt:' + ev.id)) return json({ received: true, duplicate: true });   // each Stripe event is handled once
  const o = (ev.data && ev.data.object) || {};
  if ((ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') && o.payment_status === 'paid') {
    const ref = String(o.client_reference_id || (o.metadata && o.metadata.ref) || '');
    const rec = /^[a-f0-9]{24}$/.test(ref) ? await env.EC_KV.get('cq:' + ref, 'json') : null;
    if (rec && !rec.paid) {
      const expected = cqPriceOf(env, rec.tier) * 100;
      rec.paid = o.amount_total === expected || o.amount_total === CQ_PRICES[rec.tier][0] * 100 || o.amount_total === CQ_PRICES[rec.tier][1] * 100;
      rec.paidAt = new Date().toISOString(); rec.amountPaid = o.amount_total; rec.session = o.id; rec.paymentIntent = o.payment_intent || '';
      if (!rec.paid) rec.paymentProblem = 'Amount ' + o.amount_total + ' did not match the package price';
      await env.EC_KV.put('cq:' + ref, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 366 });
    }
  }
  if (ev.type === 'charge.refunded' && o.metadata && /^[a-f0-9]{24}$/.test(o.metadata.ref || '')) {
    const rec = await env.EC_KV.get('cq:' + o.metadata.ref, 'json');
    if (rec) { rec.refunded = true; rec.refundedAt = new Date().toISOString(); await env.EC_KV.put('cq:' + o.metadata.ref, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 366 }); }
  }
  await env.EC_KV.put('sevt:' + ev.id, '1', { expirationTtl: 60 * 60 * 24 * 30 });
  return json({ received: true });
}
export { stripeSignatureOk };
