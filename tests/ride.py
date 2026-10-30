# Add a limo or car service from the end of the package. python3 tests/ride.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]; Q=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); Q.append(b)
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':b['query'][:8]+str(i),'name':b['query'].split()[0].title()+' Co '+str(i),'rating':4.8,'reviews':200,'address':'1 Main St, Houston, TX 77001, USA','mapsUrl':'https://maps.google.com','website':'https://example.com'} for i in range(4)]}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
def plan(pg, text, typ):
    pg.goto(U+'#/new/1'); pg.fill('#text', text); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type', typ); pg.select_option('#city','Houston, TX'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
    pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
    pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000); return base
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}, device_scale_factor=2); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        base=plan(pg, 'Black and gold 30th birthday party', 'birthday')
        check(n, pg.query_selector('.pkg-cmp [data-pkaddnow=transport]') is not None, 'compare view ends with Add a limo or car service')
        pg.locator('.pk-ride').scroll_into_view_if_needed(); pg.wait_for_timeout(300); pg.locator('.pkg-cmp-wrap').screenshot(path=f'{OUT}/ride_compare_{n}.png')
        Q.clear(); pg.click('.pkg-cmp [data-pkaddnow=transport]'); pg.wait_for_timeout(2500)
        qs=[q['query'] for q in Q]; t=pg.inner_text('.pkg-cmp')
        check(n, 'Luxury transportation' in t and not pg.query_selector('[data-pkaddnow]'), 'adds a Luxury transportation line, and the prompt goes away')
        rows=pg.evaluate("[...document.querySelectorAll('.pkg-cmp tbody tr[data-pkrow]')].map(r=>r.dataset.pkrow)"); check(n, rows and rows[-1]=='transport', 'transportation is the very last line: '+str(rows[-3:]))
        check(n, qs and 'limousine' in qs[0], 'searches limousine and chauffeur services: '+str(qs[:1]))
        # Los Angeles: Fady Youssef is the first pick for transportation
        pg.goto(U+'#/new/1'); pg.fill('#text', 'Ivory wedding'); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type', 'wedding'); pg.select_option('#city','Los Angeles, CA'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); lb='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U+lb+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000)
        if pg.query_selector('.pkg-cmp [data-pkaddnow=transport]'): pg.click('.pkg-cmp [data-pkaddnow=transport]'); pg.wait_for_timeout(2500)
        tr=pg.evaluate("(()=>{const r=document.querySelector('tr[data-pkrow=transport]');return r?r.innerText:''})()")
        check(n, 'Fady Youssef' in tr and 'Recommended' in tr, 'Los Angeles: Fady Youssef is the transportation pick: '+tr[:80].replace('\n',' '))
        base=plan(pg, 'Unicorn party for my daughter', 'kids-birthday')
        check(n, pg.query_selector('[data-pkaddnow]') is not None, 'kids birthday: the limo option is there too')
        check(n, not e, 'no page errors '+str(e[:2])); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
# (see also: transportation, when in the package, is the very last line)
