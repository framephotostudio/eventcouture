// Email tips list on the server: consent required, removal works, export needs the admin code, Turnstile when switched on: node tests/worker_optin.test.mjs
import assert from 'assert';
const src = await import('../worker/index.js');
const store = new Map();
const kv = { get: async (k, t) => store.has(k) ? (t === 'json' ? JSON.parse(store.get(k)) : store.get(k)) : null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); },
  list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }) };
const env = { EC_KV: kv, ALLOWED_ORIGINS: 'https://x', ADMIN_CODE: 'correct-horse-battery' };
const post = async (path, body, e = env) => { const r = await src.default.fetch(new Request('https://w' + path, { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json', 'cf-connecting-ip': '9.9.9.' + Math.floor(Math.random() * 200) }, body: JSON.stringify(body) }), e); return { status: r.status, body: await r.json().catch(() => ({})) }; };
const exp = async (code, e = env) => { const r = await src.default.fetch(new Request('https://w/api/optin/export', { headers: { origin: 'https://x', 'x-admin-code': code } }), e); return { status: r.status, text: await r.text() }; };
assert.equal((await post('/api/optin', { email: 'a@example.com' })).status, 400, 'no consent, no sign-up');
assert.equal((await post('/api/optin', { email: 'bad', consent: true })).status, 400, 'bad email');
assert.equal((await post('/api/optin', { email: 'A@Example.com', consent: true, type: 'Wedding', date: '2027-05-01', city: 'Houston, TX', guests: 150 })).status, 200);
assert.equal((await post('/api/optin', { email: 'b@example.com', consent: true, type: 'Birthday,\nparty', city: 'Dallas, TX' })).status, 200);
const n = () => [...store.keys()].filter(k => k.startsWith('optin:')).length;
assert.equal(n(), 2);
assert.equal((await exp('wrong')).status, 403, 'wrong admin code');
assert.equal((await exp('')).status, 403, 'empty admin code');
assert.equal((await exp('x', Object.assign({}, env, { ADMIN_CODE: '' }))).status, 404, 'export off without ADMIN_CODE');
let r = await exp('correct-horse-battery'); assert.equal(r.status, 200); assert.ok(r.text.includes('A@Example.com') && r.text.includes('Houston, TX') && r.text.split('\n').length === 3, r.text);
assert.ok(r.text.includes('"Birthday, party"'), 'line breaks cleaned, commas kept inside quotes');
assert.equal((await post('/api/optin/remove', { email: 'a@example.com' })).status, 200);
assert.equal(n(), 1, 'removal is case-insensitive');
// Turnstile switched on: a missing token is refused
const ts = Object.assign({}, env, { TURNSTILE_SECRET: 'x' });
assert.equal((await post('/api/optin', { email: 'c@example.com', consent: true }, ts)).status, 403, 'robot check enforced');
assert.equal((await post('/api/concierge/new', { tier: 'signature' }, ts)).status, 403, 'robot check on booking requests');
console.log('optin worker tests passed');
