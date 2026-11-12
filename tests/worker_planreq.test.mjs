// "Let us plan it for you" requests: saved with the right fields, listed only with the admin code, marked handled: node tests/worker_planreq.test.mjs
import assert from 'assert';
const src = await import('../worker/index.js');
const store = new Map();
const kv = { get: async (k, t) => { const v = store.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, put: async (k, v) => { store.set(k, v); }, delete: async (k) => { store.delete(k); },
  list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }) };
const env = { EC_KV: kv, ALLOWED_ORIGINS: 'https://x', ADMIN_CODE: 'local-test-only' };
const call = (path, body, method = 'POST', h = {}) => src.default.fetch(new Request('https://w' + path, { method, headers: { origin: 'https://x', 'content-type': 'application/json', ...h }, body: method === 'POST' ? JSON.stringify(body) : undefined }), env);
let r = await call('/api/planreq/new', { name: '', phone: '' }); assert.equal(r.status, 400, 'needs a name');
r = await call('/api/planreq/new', { name: 'Sara', phone: '', email: '' }); assert.equal(r.status, 400, 'needs a way to reach her');
r = await call('/api/planreq/new', { name: 'Sara', phone: '713 555 0100', email: 'sara@example.com', help: ['Full planning', 'Hacking', 'Budget'], type: 'Wedding', date: 'June 2027', city: 'Houston, TX', guests: 150, budget: '$20,000', contact: 'call', notes: 'Outdoor if possible' });
assert.equal(r.status, 200, 'a good request is saved');
const saved = [...store.values()].map(v => JSON.parse(v))[0];
assert.deepEqual(saved.help, ['Full planning', 'Budget'], 'only the listed kinds of help are kept'); assert.equal(saved.status, 'new'); assert.equal(saved.contact, 'call');
r = await call('/api/planreq', null, 'GET'); assert.equal(r.status, 403, 'the list needs the admin code');
r = await call('/api/planreq', null, 'GET', { 'x-admin-code': 'local-test-only' }); const j = await r.json(); assert.equal(j.requests.length, 1, 'the owner sees it');
r = await call('/api/planreq/set', { id: saved.id, status: 'handled' }, 'POST', { 'x-admin-code': 'local-test-only' }); assert.equal(r.status, 200);
assert.equal(JSON.parse(store.get('preq:' + saved.id)).status, 'handled', 'marked handled');
console.log('plan requests ok');
