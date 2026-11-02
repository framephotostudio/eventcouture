// View-only plan links on the server: owner key, read, too large, delete: node tests/worker_proposal.test.mjs
import assert from 'assert';
const src = await import('../worker/index.js');
const store = new Map();
const env = { EC_KV: { get: async (k, t) => store.has(k) ? (t === 'json' ? JSON.parse(store.get(k)) : store.get(k)) : null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } }, ALLOWED_ORIGINS: 'https://x' };
const call = async (path, body) => { const r = await src.default.fetch(new Request('https://w' + path, body ? { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json', 'cf-connecting-ip': '5.5.5.5' }, body: JSON.stringify(body) } : { headers: { origin: 'https://x' } }), env); return { status: r.status, body: await r.json() }; };
const id = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', key = 'k'.repeat(36);
assert.equal((await call('/api/prop/' + id)).status, 404, 'unknown link');
assert.equal((await call('/api/prop/' + id + '/publish', { key: 'short', plan: {} })).status, 400, 'needs a real key');
assert.equal((await call('/api/prop/' + id + '/publish', { key, plan: { title: 'Layla & Adam', sections: [] } })).status, 200);
let r = await call('/api/prop/' + id); assert.equal(r.status, 200); assert.equal(r.body.plan.title, 'Layla & Adam'); assert.ok(!JSON.stringify(r.body).includes(key), 'key never returned');
assert.equal((await call('/api/prop/' + id + '/publish', { key: 'x'.repeat(36), plan: { title: 'Hijack' } })).status, 403, 'someone else can’t overwrite');
assert.equal((await call('/api/prop/' + id + '/delete', { key: 'x'.repeat(36) })).status, 403, 'someone else can’t delete');
assert.equal((await call('/api/prop/' + id + '/publish', { key, plan: { big: 'x'.repeat(1600000) } })).status, 413, 'too large');
assert.equal((await call('/api/prop/' + id + '/delete', { key })).status, 200);
assert.equal((await call('/api/prop/' + id)).status, 404, 'deleted');
assert.equal((await call('/api/prop/NOTHEX!/publish', { key })).status, 404, 'bad id');
console.log('proposal worker tests passed');
