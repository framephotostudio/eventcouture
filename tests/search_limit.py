# When the free Google searches are used up, every line still works: free "Search on Google Maps" links. python3 tests/search_limit.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'): route.fulfill(status=429, content_type='application/json', body=json.dumps({'error':'Live search is resting until next month. Use Google Maps to find one.','code':'limit'}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U+'#/new/1'); pg.fill('#text','Gold birthday party for 40'); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type','birthday')
        pg.select_option('#country','US'); pg.wait_for_timeout(150); pg.select_option('#city','Austin, TX'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000); pg.wait_for_timeout(500)
        links=pg.evaluate("[...document.querySelectorAll('a')].filter(a=>/Search on Google Maps/.test(a.textContent)).map(a=>a.href)")
        check(n, len(links)>=5 and all('google.com/maps/search' in l and 'Austin' in l for l in links), 'lines offer free Google Maps links: '+str(len(links))+' '+str(links[:1]))
        pg.screenshot(path=f'{OUT}/search_limit_{n}.png')
        check(n, not e, 'no page errors '+str(e[:2])); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
