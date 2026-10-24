// Checks the server keeps only polished, well-reviewed places: node tests/worker_places.test.mjs
import assert from 'assert';
const src = await import('../worker/index.js');
const fake = [
  { id: 'a', displayName: { text: 'The Post Oak Hotel' }, rating: 4.7, userRatingCount: 3200, priceLevel: 'PRICE_LEVEL_VERY_EXPENSIVE' },
  { id: 'b', displayName: { text: 'Motel 6 Houston' }, rating: 4.5, userRatingCount: 900 },
  { id: 'c', displayName: { text: 'Hampton Inn Galleria' }, rating: 4.4, userRatingCount: 1200, priceLevel: 'PRICE_LEVEL_MODERATE' },
  { id: 'd', displayName: { text: 'Hotel ZaZa Museum District' }, rating: 4.5, userRatingCount: 4000, priceLevel: 'PRICE_LEVEL_EXPENSIVE' },
  { id: 'e', displayName: { text: 'Tiny New Place' }, rating: 4.9, userRatingCount: 6 },
  { id: 'f', displayName: { text: 'Closed Grand Hotel' }, rating: 4.8, userRatingCount: 900, businessStatus: 'CLOSED_PERMANENTLY' },
  { id: 'g', displayName: { text: 'Cheap Eats' }, rating: 4.6, userRatingCount: 500, priceLevel: 'PRICE_LEVEL_INEXPENSIVE' }
];
let bodies = [];
globalThis.fetch = async (url, opts) => { bodies.push(JSON.parse(opts.body)); return { ok: true, json: async () => ({ places: fake }) }; };
const env = { GOOGLE_MAPS_KEY: 'x', EC_KV: { get: async () => '0', put: async () => {} }, DAILY_CAP_USD: '1', ALLOWED_ORIGINS: 'https://x' };
const res = await src.default.fetch(new Request('https://w/api/places', { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json' }, body: JSON.stringify({ query: 'luxury five-star hotel ballroom event venue', city: 'Houston, TX', level: 'U' }) }), env);
const names = (await res.json()).places.map(p => p.name);
assert.deepEqual(names.slice().sort(), ['Hotel ZaZa Museum District', 'The Post Oak Hotel']);
assert(!names.some(n => /Motel|Hampton|Tiny|Closed|Cheap/.test(n)), names.join());
assert.equal(bodies[0].minRating, 4.5); assert.deepEqual(bodies[0].priceLevels, ['PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE']);
console.log('worker places ok:', names.join(', '));
