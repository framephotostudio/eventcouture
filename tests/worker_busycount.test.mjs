// Six searches at once: the stored monthly count turns writes away (one write per second), searches still work and the count catches up: node tests/worker_busycount.test.mjs
import assert from 'assert';
const src = await import('../worker/index.js');
globalThis.fetch = async () => ({ ok: true, json: async () => ({ places: [{ id: 'p', displayName: { text: 'Studio' }, rating: 4.9, userRatingCount: 300, types: ['photographer'], primaryType: 'photographer', businessStatus: 'OPERATIONAL' }] }) });
const store = new Map(); let lastPut = 0;
const kv = { get: async (k, t) => { const v = store.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
  put: async (k, v) => { if (k.startsWith('places:')) { const now = Date.now(); if (now - lastPut < 1000) throw new Error('429 too many writes'); lastPut = now; } store.set(k, v); } };
const env = { GOOGLE_MAPS_KEY: 'x', EC_KV: kv, DAILY_CAP_USD: '1', ALLOWED_ORIGINS: 'https://x' };
const ask = (q) => src.default.fetch(new Request('https://w/api/places', { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json' }, body: JSON.stringify({ query: q, city: 'London, UK', kind: 'vendor', cat: 'photographer', level: 'S' }) }), env);
const rs = await Promise.all(['a', 'b', 'c', 'd', 'e', 'f'].map(q => ask('photographer ' + q)));
assert.deepEqual(rs.map(r => r.status), [200, 200, 200, 200, 200, 200], 'all six searches answer even when the count write is busy');
await new Promise(r => setTimeout(r, 1100)); await ask('photographer g');
const n = parseInt(store.get('places:' + new Date().toISOString().slice(0, 7)), 10);
assert.ok(n >= 2, 'the count keeps moving: ' + n);
console.log('busy count ok: 6 at once all answered, count', n);
