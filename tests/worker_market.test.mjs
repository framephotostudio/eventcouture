// Vendor listings and quote requests on the server: node tests/worker_market.test.mjs
import assert from 'assert';
const src = await import('../worker/index.js');
const store = new Map();
const env = { EC_KV: { get: async k => store.has(k) ? store.get(k) : null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } }, ALLOWED_ORIGINS: 'https://x' };
let ip = 1;
const call = async (path, body, method = 'POST', who) => { const r = await src.default.fetch(new Request('https://w' + path, method === 'GET' ? { headers: { origin: 'https://x' } } : { method, headers: { origin: 'https://x', 'content-type': 'application/json', 'cf-connecting-ip': who || '9.9.9.' + (ip++ % 200) }, body: JSON.stringify(body) }), env); return { status: r.status, body: await r.json() }; };
const vkey = 'v'.repeat(24), hkey = 'h'.repeat(24);
const listing = { name: 'Layali Voice', email: 'layali@example.com', cats: ['singer', 'liveMusic'], cities: ['Houston, TX'], ig: '@layali.voice', bio: 'Arabic wedding singer', price: 2500, priceType: 'Starting at', agree: true };
// incomplete listing is saved but not live
let r = await call('/api/vendor/save', { key: vkey, listing: Object.assign({}, listing, { ig: '', agree: false }) });
assert.equal(r.status, 200); assert.equal(r.body.live, false); assert.deepEqual(r.body.missing, ['ig', 'agree']);
const vid = r.body.id;
assert.equal((await call('/api/vendors?city=Houston,%20TX&cat=singer', null, 'GET')).body.vendors.length, 0, 'not live yet');
r = await call('/api/vendor/save', { key: vkey, id: vid, listing });
assert.equal(r.body.live, true); assert.equal(r.body.founding, true, 'early vendors are founding vendors'); assert.equal(r.body.id, vid);
assert.equal((await call('/api/vendor/save', { key: 'x'.repeat(24), id: vid, listing: { name: 'Hacked' } })).status, 403);
let found = (await call('/api/vendors?city=houston,%20tx&cat=singer', null, 'GET')).body.vendors;
assert.equal(found.length, 1); assert.equal(found[0].ig, 'layali.voice'); assert.ok(!JSON.stringify(found).includes('layali@example.com'), 'email not public'); assert.ok(!JSON.stringify(found).includes('"kh"'));
assert.equal((await call('/api/vendors?city=Houston,%20TX&cat=dj', null, 'GET')).body.vendors.length, 0, 'category filter');
assert.equal((await call('/api/vendor/' + vid, null, 'GET')).body.vendor.name, 'Layali Voice');
// a host's anonymous request
r = await call('/api/req/new', { key: hkey, req: { city: 'Houston, TX', cat: 'singer', need: 'Arabic wedding singer', type: 'Arabic wedding', date: '2099-06-12', guests: 250, budget: 3000, theme: 'ivory and gold', name: 'Sara Q', phone: '713-555-0199' } });
assert.equal(r.status, 200); const qid = r.body.id;
await call('/api/req/new', { key: hkey, req: { city: 'Houston, TX', cat: 'dj', date: '2099-06-12' } });
await call('/api/req/new', { key: hkey, req: { city: 'Dallas, TX', cat: 'singer' } });
assert.equal((await call('/api/req/list', { key: 'bad'.repeat(8), vid })).status, 403);
let list = (await call('/api/req/list', { key: vkey, vid })).body.requests;
assert.equal(list.length, 1, 'only my city and category'); assert.equal(list[0].guests, 250); assert.ok(!JSON.stringify(list).match(/Sara Q|713-555-0199|"kh"/), 'no customer identity');
assert.equal((await call('/api/req/reply', { key: vkey, vid, id: qid, msg: '' })).status, 400);
assert.equal((await call('/api/req/reply', { key: vkey, vid, id: qid, msg: 'Available! Full set with oud player.', price: 2800 })).status, 200);
assert.equal((await call('/api/req/reply', { key: vkey, vid, id: qid, msg: 'Updated: 2700', price: 2700 })).status, 200);
assert.equal((await call('/api/req/list', { key: vkey, vid })).body.requests[0].replied, true);
assert.deepEqual((await call('/api/req/inbox', { key: 'z'.repeat(24), ids: [qid] })).body.replies, {}, 'only the host reads replies');
const reps = (await call('/api/req/inbox', { key: hkey, ids: [qid] })).body.replies[qid];
assert.equal(reps.length, 1, 'one reply per vendor'); assert.equal(reps[0].price, 2700); assert.equal(reps[0].card.ig, 'layali.voice'); assert.equal(reps[0].email, 'layali@example.com');
// reports hide after 3 different people
await call('/api/vendor/report', { id: vid }, 'POST', '1.1.1.1'); await call('/api/vendor/report', { id: vid }, 'POST', '1.1.1.1'); await call('/api/vendor/report', { id: vid }, 'POST', '1.1.1.2');
assert.equal((await call('/api/vendors?city=Houston,%20TX', null, 'GET')).body.vendors.length, 1, 'two people is not enough');
await call('/api/vendor/report', { id: vid }, 'POST', '1.1.1.3');
assert.equal((await call('/api/vendors?city=Houston,%20TX', null, 'GET')).body.vendors.length, 0, 'hidden after 3 reports');
assert.equal((await call('/api/vendor/' + vid, null, 'GET')).status, 404);
// host deletes the request
assert.equal((await call('/api/req/delete', { key: hkey, ids: [qid] })).status, 200);
assert.ok(!store.has('req:' + qid) && !store.has('rep:' + qid));
// moving cities updates the index
const v2 = (await call('/api/vendor/save', { key: 'w'.repeat(24), listing: Object.assign({}, listing, { name: 'Zaffe Stars', cats: ['zaffe'] }) })).body.id;
await call('/api/vendor/save', { key: 'w'.repeat(24), id: v2, listing: Object.assign({}, listing, { name: 'Zaffe Stars', cats: ['zaffe'], cities: ['Dallas, TX'] }) });
assert.equal((await call('/api/vendors?city=Houston,%20TX&cat=zaffe', null, 'GET')).body.vendors.length, 0);
assert.equal((await call('/api/vendors?city=Dallas,%20TX&cat=zaffe', null, 'GET')).body.vendors.length, 1);
console.log('worker market ok');
