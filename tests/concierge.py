# Always Luxe Concierge Booking: US plans only, founding prices, request saved, then Stripe checkout: python3 tests/concierge.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]; SAVED=[]; PAID=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); hh=hashlib.md5((b['query']+b.get('city','')).encode()).hexdigest()[:5]; city=b.get('city','').split(',')[0]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':b['query'].split()[-1].title()+' House '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Main St, {city}, TX 77001, USA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh} for i in range(5)]}), headers=h)
    elif u.endswith('/api/concierge/new'):
        b=json.loads(route.request.post_data); SAVED.append(b); route.fulfill(status=200, content_type='application/json', body=json.dumps({'ref':'abc123abc123abc123abc123'}), headers=h)
    elif '/api/concierge/abc123' in u:
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'request':dict(SAVED[-1], ref='abc123abc123abc123abc123', at=1793440000000)}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
LINKS="concierge: { links: { essentials: 'https://buy.stripe.com/test_ess', signature: 'https://buy.stripe.com/test_sig', full: 'https://buy.stripe.com/test_full', allin: 'https://buy.stripe.com/test_allin' }, call: 'https://calendly.com/alwaysluxe/15min', founding: true }"
def cfg(links):
    def f(route):
        r=route.fetch(); t=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'")
        if links: t=t.replace("concierge: { links: { essentials: '', signature: '', full: '', allin: '' }, call: '', founding: true }", LINKS)
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
    return base
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        # no payment links yet: the offer stays hidden
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg(False)); pg.route('http://api.test/**', api)
        plan(pg, 'Blush and ivory wedding for 150', 'wedding', 'US', 'Houston, TX', 150, 'indoor')
        check(n, not pg.query_selector('.cq-card'), 'no offer until the Stripe links are added')
        ctx.close()
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg(True)); pg.route('http://api.test/**', api); ctx.route('https://buy.stripe.com/**', stripe)
        # a London plan never sees it
        plan(pg, 'Birthday party for 40', 'birthday', 'GB', 'London, UK', 40, 'indoor')
        check(n, not pg.query_selector('.cq-card'), 'not offered outside the US')
        # a Houston wedding: the offer, Full Concierge recommended, founding prices
        base=plan(pg, 'Blush and ivory wedding for 150', 'wedding', 'US', 'Houston, TX', 150, 'indoor')
        card=pg.inner_text('.cq-card'); check(n, 'Have Event Couture book it for you' in card and '$1,299' in card and 'Full Concierge' in card, 'offer card shows the package that fits: '+card.replace('\n',' ')[:120])
        pg.locator('.cq-card').scroll_into_view_if_needed(); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/concierge_card_{n}.png')
        pg.click('[data-cq]'); pg.wait_for_selector('.sheet .cq-tiers'); st=pg.inner_text('.sheet')
        check(n, pg.get_attribute('[data-cqt=full]','aria-checked')=='true' and 'Best for your plan' in pg.inner_text('[data-cqt=full]'), 'a wedding gets Full Concierge recommended')
        check(n, '$1,299' in st and '$599' in st and '$249' in st and 'Founding client price' in st, 'founding prices shown with the regular ones')
        check(n, '$2,499' in st and 'Couture All-Inclusive' in st and 'Most complete' in st and 'invitations' in pg.inner_text('[data-cqt=allin]'), 'the premium All-Inclusive package is offered')
        check(n, pg.is_disabled('[data-cqt=essentials]'), 'Essentials is off for a package with more than 5 vendors')
        check(n, pg.query_selector('#cqCall') is not None, 'free 15-minute call option')
        pg.wait_for_timeout(300); pg.locator('.sheet').screenshot(path=f'{OUT}/concierge_sheet_{n}.png')
        n0=len(SAVED); pg.click('#cqGo'); pg.wait_for_timeout(300); check(n, 'name' in (pg.inner_text('.toast') if pg.query_selector('.toast') else '').lower() and len(SAVED)==n0, 'asks for the name first')
        pg.fill('#cqName','Sara Q'); pg.fill('#cqPhone','713-555-0199'); pg.fill('#cqEmail','sara@example.com'); pg.click('#cqGo'); pg.wait_for_url('https://buy.stripe.com/**', timeout=10000)
        q=SAVED[-1]; check(n, q['tier']=='full' and q['price']==1299 and 'PACKAGE' in q['summary'] and 'Venue' in q['summary'] and q['city']=='Houston, TX', 'request saved with the package: '+q['summary'][:80].replace('\n',' | '))
        check(n, 'client_reference_id=abc123abc123abc123abc123' in PAID[-1] and 'prefilled_email=sara%40example.com' in PAID[-1] and 'test_full' in PAID[-1], 'checkout opens the Full Concierge link with the request code: '+PAID[-1])
        # back from Stripe
        pg.goto(U+'#/booked'); pg.wait_for_timeout(500); check(n, 'booked with Event Couture' in pg.inner_text('main') and 'Sara' in pg.inner_text('main'), 'thank-you page after payment')
        pg.screenshot(path=f'{OUT}/concierge_thanks_{n}.png')
        pg.goto(U+base+'/budget'); pg.wait_for_selector('.cq-card'); check(n, 'booked with Event Couture' in pg.inner_text('.cq-card'), 'the plan shows she is booked')
        # Demah opens the request from the Stripe payment
        pg.goto(U+'#/cq/abc123abc123abc123abc123'); pg.wait_for_selector('.cq-pre'); t=pg.inner_text('main')
        check(n, '713-555-0199' in t and 'Full Concierge' in t and 'Venue' in t, 'request page shows contact and package'); pg.screenshot(path=f'{OUT}/concierge_request_{n}.png')
        check(n, not e, 'no page errors '+str(e[:2])); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
