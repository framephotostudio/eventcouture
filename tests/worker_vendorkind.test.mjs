// Vendor searches return the business that provides the service, never a mall, a store or a nearby restaurant: node tests/worker_vendorkind.test.mjs
import assert from 'assert';
const src = await import('../worker/index.js');
const env = { GOOGLE_MAPS_KEY: 'x', DAILY_CAP_USD: '1', EC_KV: { get: async () => '0', put: async () => {} }, ALLOWED_ORIGINS: 'https://x' };
const run = async (cat, places) => { globalThis.fetch = async () => ({ ok: true, json: async () => ({ places }) }); const r = await src.default.fetch(new Request('https://w/api/places', { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json', 'cf-connecting-ip': '5.5.5.' + Math.floor(Math.random() * 200) }, body: JSON.stringify({ query: 'q', city: 'Houston, TX', kind: 'vendor', cat }) }), env); return (await r.json()).places.map(p => p.name); };
const P = (name, primaryType, types = [], rating = 4.7, n = 300) => ({ id: name, displayName: { text: name }, rating, userRatingCount: n, primaryType, types: [primaryType].concat(types) });
const mall = P('The Galleria', 'shopping_mall', ['point_of_interest']), musaafer = P('Musaafer', 'indian_restaurant', ['restaurant']), aga = P('Aga’s Restaurant & Catering', 'restaurant', ['caterer']), palkhi = P('Palkhi Fashion', 'clothing_store', ['store']);
// the real Houston results she saw
assert.deepEqual(await run('cake', [mall, musaafer, aga, P('Sweet Lucie’s Cakes', 'bakery', ['store', 'food'])]), ['Sweet Lucie’s Cakes']);
assert.deepEqual(await run('decor', [mall, musaafer, palkhi, P('Luxe Event Decor', 'event_planner')]), ['Luxe Event Decor']);
assert.deepEqual(await run('favors', [mall, musaafer, P('Azalia Cute Designs', 'point_of_interest'), P('Jolie’s Party Shop', 'party_store', ['store'])]).then(r => r.sort()), ['Azalia Cute Designs', 'Jolie’s Party Shop']);
// florists are tagged as stores too and must not be dropped
assert.deepEqual(await run('florals', [P('Petals and Stems', 'florist', ['store', 'point_of_interest']), P('Kroger', 'supermarket', ['store'])]), ['Petals and Stems']);
assert.equal((await run('florals', [P('Bloom Studio Houston', 'point_of_interest', ['store'])])).length, 1, 'a florist without the florist tag but with a flower name stays');
// catering can be a restaurant; a photographer cannot be a camera store
assert.deepEqual(await run('catering', [aga]), ['Aga’s Restaurant & Catering']);
assert.deepEqual(await run('photographer', [P('Camera Exchange', 'electronics_store', ['store']), P('Amalya Shandelman Photography', 'photographer')]), ['Amalya Shandelman Photography']);
assert.deepEqual(await run('hairMakeup', [mall, P('Glam by Nour', 'beauty_salon')]), ['Glam by Nour']);
console.log('vendor kinds ok');
