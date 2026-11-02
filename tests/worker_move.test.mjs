// Continue on another device: store a plan copy behind a private link (30 days), read it back, size and shape checks: node tests/worker_move.test.mjs
import assert from 'assert';
const src = await import('../worker/index.js');
const store = new Map();
const env = { EC_KV: { get: async (k, t) => store.has(k) ? (t === 'json' ? JSON.parse(store.get(k)) : store.get(k)) : null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } }, ALLOWED_ORIGINS: 'https://x' };
const call = async (path, body) => { const r = await src.default.fetch(new Request('https://w' + path, body ? { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json', 'cf-connecting-ip': '7.7.7.7' }, body: JSON.stringify(body) } : { headers: { origin: 'https://x' } }), env); return { status: r.status, body: await r.json() }; };
assert.equal((await call('/api/move/new', { plan: { name: 'x' } })).status, 400, 'needs a real plan');
let r = await call('/api/move/new', { plan: { id: 'abc123', name: 'Layla & Adam', guests: 150, guestList: [{ name: 'Aunt Mona' }] } });
assert.equal(r.status, 200); assert.match(r.body.id, /^[a-f0-9]{24}$/);
r = await call('/api/move/' + r.body.id); assert.equal(r.status, 200); assert.equal(r.body.plan.name, 'Layla & Adam'); assert.equal(r.body.plan.guestList[0].name, 'Aunt Mona');
assert.equal((await call('/api/move/new', { plan: { id: 'big', name: 'Big', photo: 'x'.repeat(1600000) } })).status, 413, 'too large');
assert.equal((await call('/api/move/' + 'a'.repeat(24))).status, 404, 'unknown link');
assert.equal((await call('/api/move/nothex')).status, 404, 'bad id');
console.log('move worker tests passed');
