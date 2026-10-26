# Shortlist and bookings with a stand-in server: python3 tests/bookings.py <screenshot folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json
U='http://localhost:8765/'
PL=json.dumps({'places':[{'id':'p1','name':'Gilded Florals','rating':4.8,'reviews':212,'address':'1 Main St, Dallas, TX','mapsUrl':'https://maps.google.com/?q=1','website':'https://example.com'},{'id':'p2','name':'Bloom House','rating':4.7,'reviews':98,'address':'2 Elm St, Dallas, TX','mapsUrl':'https://maps.google.com/?q=2'}]})
def api(route):
    u=route.request.url
    if u.endswith('/api/places'): route.fulfill(status=200, content_type='application/json', body=PL, headers={'access-control-allow-origin':'*'})
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers={'access-control-allow-origin':'*'})
    else: route.fulfill(status=500, body='{}', headers={'access-control-allow-origin':'*'})
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'p'),(1280,900,'d')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U+'#/new/1'); pg.wait_for_timeout(300); pg.fill('#text','black and gold 30th birthday'); pg.click('#next'); pg.wait_for_timeout(250)
        pg.select_option('#type','birthday'); pg.fill('#guests','40'); pg.fill('#expected','40'); pg.fill('#time','19:00'); pg.select_option('#city', 'Houston, TX'); pg.click('#setting [data-v=indoor]')
        pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.wait_for_timeout(250)
        pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(300)
        base=pg.url.split('#')[1].split('/'); base='#/'+base[1]+'/'+base[2]
        pg.goto(U+base+'/vendors'); pg.wait_for_timeout(300)
        btns=pg.query_selector_all('[data-vendor]'); print(n,'vendor search buttons',len(btns))
        btns[3].click(); pg.wait_for_selector('[data-short]'); pg.click('[data-short] >> nth=0'); pg.wait_for_timeout(200)
        print(n,'saved btn:', pg.inner_text('[data-short] >> nth=0'))
        pg.screenshot(path=(__import__('sys').argv[1] if len(__import__('sys').argv) > 1 else '/tmp') + '/'+f'save_{n}.png')
        pg.goto(U+base+'/places'); pg.wait_for_timeout(300)
        lb=pg.query_selector_all('[data-live]'); lb[0].click(); pg.wait_for_selector('[data-short]'); pg.click('[data-short] >> nth=1'); pg.wait_for_timeout(200)
        pg.goto(U+base+'/budget'); pg.wait_for_timeout(300)
        print(n,'bookings:', pg.inner_text('.bookings').replace('\n',' | ')[:260])
        pg.click('[data-compare] >> nth=0'); pg.wait_for_selector('.cmp'); pg.click('[data-book-opt] >> nth=0'); pg.wait_for_selector('#pamt'); print(n,'booking form:', pg.inner_text('.sheet h3')); pg.fill('#pamt','1500'); pg.click('#psave'); pg.wait_for_timeout(300); pg.click('.sheet [data-close]'); pg.wait_for_timeout(300)
        print(n,'after booking:', pg.inner_text('.bookings').replace('\n',' | ')[:120])
        pg.query_selector('.bookings').scroll_into_view_if_needed(); pg.evaluate('window.scrollBy(0,-100)'); pg.wait_for_timeout(100); pg.screenshot(path=(__import__('sys').argv[1] if len(__import__('sys').argv) > 1 else '/tmp') + '/'+f'book_{n}.png')
        pg.goto(U+base+'/vendors'); pg.wait_for_timeout(300); print(n,'vendor badges:', [x.inner_text() for x in pg.query_selector_all('.badge[class*=st-]')][:6])
        print(n, e, pg.evaluate('document.documentElement.scrollWidth')>w)
    b.close()
