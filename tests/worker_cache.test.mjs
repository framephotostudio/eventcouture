// Google searches are remembered for a week, never ask Google for "takes reservations", and stop at the free monthly allowance: node tests/worker_cache.test.mjs
import assert from 'assert';
const src = await import('../worker/index.js');
const fake = [{ id: 'a', displayName: { text: 'Bloom Florist' }, rating: 4.9, userRatingCount: 300, types: ['florist'], primaryType: 'florist', businessStatus: 'OPERATIONAL' }];
let calls = 0, masks = [];
globalThis.fetch = async (url, opts) => { calls++; masks.push(opts.headers['X-Goog-FieldMask']); return { ok: true, json: async () => ({ places: fake }) }; };
const store = new Map();
const kv = { get: async (k, t) => { const v = store.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, put: async (k, v) => { store.set(k, v); } };
const env = { GOOGLE_MAPS_KEY: 'x', EC_KV: kv, DAILY_CAP_USD: '1', ALLOWED_ORIGINS: 'https://x' };
const ask = () => src.default.fetch(new Request('https://w/api/places', { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json' }, body: JSON.stringify({ query: 'wedding florist', city: 'Houston, TX', kind: 'vendor', cat: 'florals' }) }), env);
let r = await ask(); assert.equal(r.status, 200); assert.equal(calls, 1);
r = await ask(); assert.equal(r.status, 200); assert.equal(calls, 1, 'the same search a second time is free (remembered)');
assert.ok(!/reservable/.test(masks[0]), 'never asks Google for reservations');
store.clear(); store.set('places:' + new Date().toISOString().slice(0, 7), '900');
r = await ask(); const j = await r.json(); assert.equal(r.status, 429); assert.equal(j.code, 'limit'); assert.equal(calls, 1, 'past the free allowance: no Google call at all');
console.log('worker cache ok: remembered, free allowance only');
