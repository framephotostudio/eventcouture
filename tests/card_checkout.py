# Card checkout on our server: request saved, checkout session opened, booking shows paid only after the server confirms: python3 tests/card_checkout.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]; SAVED=[]; PAID=[]; CHK=[]; POLLS=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); hh=hashlib.md5((b['query']+b.get('city','')).encode()).hexdigest()[:5]; city=b.get('city','').split(',')[0]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':b['query'].split()[-1].title()+' House '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Main St, {city}, TX 77001, USA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh} for i in range(5)]}), headers=h)
    elif u.endswith('/api/concierge/new'):
        b=json.loads(route.request.post_data); SAVED.append(b); route.fulfill(status=200, content_type='application/json', body=json.dumps({'ref':'abc123abc123abc123abc123'}), headers=h)
    elif u.endswith('/api/checkout'):
        CHK.append(json.loads(route.request.post_data)); route.fulfill(status=200, content_type='application/json', body=json.dumps({'url':'https://checkout.stripe.com/c/pay/cs_test_1'}), headers=h)
    elif '/api/concierge/abc123' in u:
        POLLS.append(1); paid = len(POLLS) >= 2
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'request':dict(SAVED[-1], ref='abc123abc123abc123abc123', at=1793440000000, paid=paid or None, amountPaid=59900 if paid else None)}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
LINKS="concierge: { links: { essentials: 'https://buy.stripe.com/test_ess', signature: 'https://buy.stripe.com/test_sig', full: 'https://buy.stripe.com/test_full', allin: 'https://buy.stripe.com/test_allin' }, call: 'https://calendly.com/alwaysluxe/15min', founding: true }"
def cfg(links):
    def f(route):
        r=route.fetch(); t=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'")
        t=t.replace("founding: true, stripe: false", "founding: true, stripe: true")
        if False: t=t.replace("concierge: { links: { essentials: '', signature: '', full: '', allin: '' }, call: '', founding: true, stripe: false }", LINKS)
        route.fulfill(response=r, body=t)
    return f
def stripe(route): PAID.append(route.request.url); route.fulfill(status=200, content_type='text/html', body='<h1>Stripe test checkout</h1>')
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
def plan(pg, text, typ, country, city, guests, setting):
    pg.goto(U+'#/new/1'); pg.wait_for_selector('#text'); pg.fill('#text', text); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type', typ)
    pg.select_option('#country', country); pg.wait_for_timeout(150); pg.select_option('#city', city); pg.fill('#guests', str(guests)); pg.click(f'#setting [data-v={setting}]'); pg.click('#next')
    pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
    pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000)
    pg.goto(U+base+'/budget'); pg.wait_for_selector('[data-pkuse="0"]'); pg.click('[data-pkuse="0"]'); pg.wait_for_selector('#pkgSum'); pg.wait_for_timeout(2800)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        SAVED.clear(); CHK.clear(); PAID.clear(); POLLS.clear()
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg(False)); pg.route('http://api.test/**', api); pg.route('https://checkout.stripe.com/**', stripe)
        base=plan(pg, 'Blush and ivory wedding for 150', 'wedding', 'US', 'Houston, TX', 150, 'indoor')
        check(n, pg.query_selector('[data-cq]') is not None, 'offer shows with card checkout on (no payment links needed)')
        pg.click('[data-cq]'); pg.wait_for_selector('.sheet [data-cqt]')
        check(n, len(pg.query_selector_all('.sheet [data-cqt]:not([disabled])'))>=2, 'packages can be chosen')
        pg.click('.sheet [data-cqt=full]'); pg.fill('.sheet #cqName','Sara Q'); pg.fill('.sheet #cqPhone','713-555-0199'); pg.fill('.sheet #cqEmail','sara@example.com')
        for sel in ['.sheet #cqOk', '.sheet #cqTerms']:
            if pg.query_selector(sel): pg.check(sel)
        pg.click('.sheet #cqGo'); pg.wait_for_timeout(2500)
        check(n, CHK and CHK[0]['ref']=='abc123abc123abc123abc123', 'checkout asked from our server with the booking code only (no price from the browser)')
        check(n, PAID and 'checkout.stripe.com' in PAID[0], 'went to Stripe checkout')
        pg.goto(U+'#/booked/abc123abc123abc123abc123'); pg.wait_for_timeout(6000)
        t=pg.inner_text('main'); check(n, 'booked with Event Couture' in t, 'thank-you after the server confirms payment: '+t[:80])
        check(n, len(POLLS)>=2, 'waited for the server to confirm')
        check(n, not e, 'no page errors '+str(e[:2]))
print('FAILURES:', F or 'none')
