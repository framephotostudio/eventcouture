// Card checkout and Stripe webhook: server price, signature checks, duplicate events, amount check: node tests/worker_stripe.test.mjs
import assert from 'assert';
import crypto from 'crypto';
const src = await import('../worker/index.js');
const store = new Map();
const kv = { get: async (k, t) => store.has(k) ? (t === 'json' ? JSON.parse(store.get(k)) : store.get(k)) : null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } };
const WH = 'whsec_test_123', env = { EC_KV: kv, ALLOWED_ORIGINS: 'https://x', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: WH };
const calls = []; const realFetch = globalThis.fetch;
globalThis.fetch = async (u, o) => { if (String(u).startsWith('https://api.stripe.com/')) { calls.push({ u, o }); return new Response(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' }), { status: 200 }); } return realFetch(u, o); };
const post = async (path, body) => { const r = await src.default.fetch(new Request('https://w' + path, { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json', 'cf-connecting-ip': '7.7.7.' + Math.floor(Math.random() * 250) }, body: JSON.stringify(body) }), env); return { status: r.status, body: await r.json() }; };
const get = async path => { const r = await src.default.fetch(new Request('https://w' + path, { headers: { origin: 'https://x' } }), env); return { status: r.status, body: await r.json() }; };
const hook = async (payload, sig) => { const r = await src.default.fetch(new Request('https://w/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': sig, 'content-type': 'application/json' }, body: payload }), env); return { status: r.status, body: await r.json() }; };
const sign = (payload, t = Math.floor(Date.now() / 1000), secret = WH) => `t=${t},v1=${crypto.createHmac('sha256', secret).update(t + '.' + payload).digest('hex')}`;

// a booking request; the browser's price is ignored
let r = await post('/api/concierge/new', { tier: 'signature', price: 1, name: 'Sara Q', phone: '713-555-0199', email: 'sara@example.com', city: 'Houston, TX' });
assert.equal(r.status, 200); const ref = r.body.ref;
assert.equal((await get('/api/concierge/' + ref)).body.request.price, 599, 'server sets the price');
// checkout
r = await post('/api/checkout', { ref }); assert.equal(r.status, 200); assert.ok(r.body.url.startsWith('https://checkout.stripe.com/'));
const form = new URLSearchParams(calls[0].o.body);
assert.equal(form.get('line_items[0][price_data][unit_amount]'), '59900'); assert.equal(form.get('client_reference_id'), ref); assert.equal(form.get('mode'), 'payment');
assert.ok(calls[0].o.headers['idempotency-key'].startsWith('cq-' + ref), 'idempotency key on the Stripe call');
assert.ok(form.get('success_url').endsWith('#/booked/' + ref));
assert.equal((await post('/api/checkout', { ref: 'f'.repeat(24) })).status, 404, 'unknown booking');
assert.equal((await post('/api/checkout', { ref: '../x' })).status, 400, 'bad ref');
// webhook: signature failures
const evt = (id, amount = 59900, type = 'checkout.session.completed', status = 'paid') => JSON.stringify({ id, type, data: { object: { id: 'cs_test_1', client_reference_id: ref, payment_status: status, amount_total: amount, payment_intent: 'pi_1' } } });
let p = evt('evt_1');
assert.equal((await hook(p, '')).status, 400, 'missing signature');
assert.equal((await hook(p, sign(p, undefined, 'whsec_wrong'))).status, 400, 'wrong secret');
assert.equal((await hook(p, sign(p, Math.floor(Date.now() / 1000) - 1000))).status, 400, 'old timestamp (replay)');
assert.equal((await hook(p.replace('59900', '100'), sign(p))).status, 400, 'body changed after signing');
assert.equal((await get('/api/concierge/' + ref)).body.request.paid, undefined, 'still unpaid after bad webhooks');
// unpaid status does nothing
let q = evt('evt_0', 59900, 'checkout.session.completed', 'unpaid'); assert.equal((await hook(q, sign(q))).status, 200);
assert.ok(!(await get('/api/concierge/' + ref)).body.request.paid, 'unpaid session does not mark paid');
// good webhook, then the same event again
assert.equal((await hook(p, sign(p))).status, 200);
let req = (await get('/api/concierge/' + ref)).body.request; assert.equal(req.paid, true); assert.equal(req.amountPaid, 59900);
const firstPaidAt = req.paidAt;
r = await hook(p, sign(p)); assert.equal(r.status, 200); assert.equal(r.body.duplicate, true, 'duplicate event ignored');
assert.equal((await get('/api/concierge/' + ref)).body.request.paidAt, firstPaidAt, 'duplicate does not change the booking');
assert.equal((await post('/api/checkout', { ref })).status, 409, 'cannot pay twice');
// wrong amount is flagged, not marked paid
r = await post('/api/concierge/new', { tier: 'essentials', name: 'A B', phone: '1', email: 'a@b.co' }); const ref2 = r.body.ref;
const p2 = JSON.stringify({ id: 'evt_2', type: 'checkout.session.completed', data: { object: { id: 'cs_2', client_reference_id: ref2, payment_status: 'paid', amount_total: 100 } } });
assert.equal((await hook(p2, sign(p2))).status, 200);
req = (await get('/api/concierge/' + ref2)).body.request; assert.equal(req.paid, false); assert.ok(req.paymentProblem);
// switched off without the secrets
const off = await src.default.fetch(new Request('https://w/api/checkout', { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json' }, body: JSON.stringify({ ref }) }), { EC_KV: kv, ALLOWED_ORIGINS: 'https://x' });
assert.equal(off.status, 503, 'checkout off without the Stripe key');
console.log('stripe worker tests passed');
