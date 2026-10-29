// A Houston search never returns a business in another city (the Dallas DJ she saw): node tests/worker_distance.test.mjs
import assert from 'assert';
const src = await import('../worker/index.js');
const env = { GOOGLE_MAPS_KEY: 'x', DAILY_CAP_USD: '1', EC_KV: { get: async () => '0', put: async () => {} }, ALLOWED_ORIGINS: 'https://x' };
const run = async (cat, places) => { globalThis.fetch = async () => ({ ok: true, json: async () => ({ places }) }); const r = await src.default.fetch(new Request('https://w/api/places', { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json', 'cf-connecting-ip': '6.6.6.' + Math.floor(Math.random() * 200) }, body: JSON.stringify({ query: 'indian wedding DJ', city: 'Houston, TX', kind: 'vendor', cat }) }), env); return (await r.json()).places.map(p => p.name); };
const P = (name, lat, lng) => ({ id: name, displayName: { text: name }, rating: 5, userRatingCount: 200, primaryType: 'dj_service', types: ['dj_service'], location: { latitude: lat, longitude: lng } });
const got = await run('dj', [P('DJ Riz Entertainment', 32.92, -96.82), P('Houston Wedding DJ', 29.75, -95.36), P('Elegante Entertainment', 29.86, -95.54), P('Desi Beats Katy', 29.79, -95.82), P('Sugar Land Sounds', 29.6, -95.62)]);
assert.ok(!got.includes('DJ Riz Entertainment'), 'Dallas business dropped');
assert.ok(got.includes('Desi Beats Katy') && got.includes('Sugar Land Sounds'), 'suburbs stay');
// results with no location are kept
assert.equal((await run('dj', [{ id: 'a', displayName: { text: 'A DJ' }, rating: 5, userRatingCount: 50, primaryType: 'dj_service' }])).length, 1);
console.log('distance ok');
