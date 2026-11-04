// Automatic Stripe webhook setup when only STRIPE_SECRET_KEY is saved: node tests/worker_stripe_autohook.test.mjs
import assert from 'assert';
import crypto from 'crypto';
const src = await import('../worker/index.js');
const store = new Map();
const kv = { get: async (k, t) => store.has(k) ? (t === 'json' ? JSON.parse(store.get(k)) : store.get(k)) : null, put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); } };
const env = { EC_KV: kv, ALLOWED_ORIGINS: 'https://x', STRIPE_SECRET_KEY: 'sk_test_x' };
const calls = []; let created = 0, failCreate = false;
globalThis.fetch = async (u, o = {}) => {
  u = String(u); calls.push({ u, m: o.method || 'GET', body: o.body });
  if (u.startsWith('https://api.stripe.com/v1/webhook_endpoints?')) return new Response(JSON.stringify({ data: [{ id: 'we_old', url: 'https://w/api/stripe/webhook' }, { id: 'we_other', url: 'https://else/hook' }] }));
  if (u.startsWith('https://api.stripe.com/v1/webhook_endpoints/')) return new Response('{}');
  if (u === 'https://api.stripe.com/v1/webhook_endpoints') { if (failCreate) return new Response('{"error":{}}', { status: 400 }); created++; return new Response(JSON.stringify({ id: 'we_new' + created, secret: 'whsec_auto' + created })); }
  return new Response(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' }));
};
const post = async (path, body) => { const r = await src.default.fetch(new Request('https://w' + path, { method: 'POST', headers: { origin: 'https://x', 'content-type': 'application/json', 'cf-connecting-ip': '8.8.8.' + Math.floor(Math.random() * 250) }, body: JSON.stringify(body) }), env); return { status: r.status, body: await r.json() }; };
const hook = async (payload, sig) => { const r = await src.default.fetch(new Request('https://w/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': sig }, body: payload }), env); return { status: r.status, body: await r.json() }; };
const sign = (payload, secret) => { const t = Math.floor(Date.now() / 1000); return `t=${t},v1=${crypto.createHmac('sha256', secret).update(t + '.' + payload).digest('hex')}`; };

// before any checkout the webhook isn't ready
assert.equal((await hook('{}', sign('{}', 'x'))).status, 503);
// a setup failure stops checkout before sending the customer to Stripe
failCreate = true;
let r = await post('/api/concierge/new', { tier: 'signature', name: 'Sara Q', phone: '713-555-0199', email: 'sara@example.com', city: 'Houston, TX' }); const ref = r.body.ref;
r = await post('/api/checkout', { ref }); assert.equal(r.status, 502); assert.ok(!calls.some(c => c.u.includes('checkout/sessions')));
failCreate = false; calls.length = 0;
r = await post('/api/checkout', { ref }); assert.equal(r.status, 200);
assert.ok(calls.some(c => c.m === 'DELETE' && c.u.endsWith('/we_old')), 'old endpoint for this URL removed');
assert.ok(!calls.some(c => c.u.endsWith('/we_other')), 'other endpoints untouched');
const mk = calls.find(c => c.u === 'https://api.stripe.com/v1/webhook_endpoints');
const f = new URLSearchParams(mk.body); assert.equal(f.get('url'), 'https://w/api/stripe/webhook'); assert.equal(f.get('enabled_events[0]'), 'checkout.session.completed'); assert.equal(f.get('enabled_events[1]'), 'checkout.session.async_payment_succeeded');
assert.equal(store.get('cfg:whsec:test'), 'whsec_auto1');
// second checkout reuses it
calls.length = 0; r = await post('/api/checkout', { ref }); assert.equal(r.status, 200); assert.equal(created, 1); assert.ok(!calls.some(c => c.u.includes('webhook_endpoints')));
// the stored secret verifies Stripe's events, and a wrong one is refused
const ev = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { payment_status: 'paid', client_reference_id: ref, amount_total: 59900, id: 'cs_1' } } });
assert.equal((await hook(ev, sign(ev, 'whsec_wrong'))).status, 400);
assert.equal((await hook(ev, sign(ev, 'whsec_auto1'))).status, 200);
assert.equal(JSON.parse(store.get('cq:' + ref)).paid, true);
// switching to a live key registers a separate live webhook
env.STRIPE_SECRET_KEY = 'sk_live_y';
r = await post('/api/concierge/new', { tier: 'signature', name: 'Lee P', phone: '713-555-0100', email: 'lee@example.com', city: 'Houston, TX' });
assert.equal((await post('/api/checkout', { ref: r.body.ref })).status, 200); assert.equal(created, 2); assert.equal(store.get('cfg:whsec:live'), 'whsec_auto2');
console.log('stripe auto-webhook tests passed');
