# Look -> packages in one tap, and the "What's next" prompt after choosing a package: python3 tests/quick_path.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'
def places_for(q, city=''):
    h=hashlib.md5((q+city).encode()).hexdigest()[:5]; word=q.split()[-1].title()
    return [{'id':h+str(i),'name':f'{word} Studio {"ABCDE"[i]}','rating':4.9-i*0.1,'reviews':300-i*40,'priceLevel':['PRICE_LEVEL_EXPENSIVE','PRICE_LEVEL_MODERATE'][i%2],'address':f'{i+1} Main St, Houston, TX','mapsUrl':'https://maps.google.com/?q='+h,'website':'https://example.com/'+h} for i in range(5)]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'): b=json.loads(route.request.post_data); route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':places_for(b['query'], b.get('city',''))}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
fails=[]
def check(n, ok, what):
    print(n, 'OK ' if ok else 'FAIL', what)
    if not ok: fails.append(n+' '+what)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U+'#/new/1'); pg.wait_for_timeout(300); pg.fill('#text','blush and gold baby shower brunch'); pg.click('#next'); pg.wait_for_timeout(250)
        pg.select_option('#type','baby-shower'); pg.fill('#guests','40'); pg.fill('#expected','40'); pg.select_option('#city','Houston, TX'); pg.click('#setting [data-v=indoor]')
        pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.wait_for_timeout(300)
        pg.click('.concept button.gold >> nth=0')
        pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.wait_for_timeout(500)
        check(n, pg.url.endswith('/budget'), 'choosing a look goes straight to the packages')
        check(n, len(pg.query_selector_all('[data-pkuse]'))>=1, 'packages were built without another tap')
        pg.screenshot(path=f'{OUT}/{n}-packages.png')
        pg.locator('[data-pkuse="0"]').click(); pg.wait_for_timeout(700)
        sh=pg.query_selector('.sheet')
        check(n, sh is not None and 'What would you like to do next' in sh.inner_text(), 'a What’s next prompt opens after choosing a package')
        txt=sh.inner_text() if sh else ''
        check(n, all(x in txt for x in ['Send your invitations','Add your guest list','Set up your gift registry','See your checklist','Book my vendors first']), 'prompt offers invitations, guests, registry, checklist and booking first')
        pg.screenshot(path=f'{OUT}/{n}-next-sheet.png')
        pg.click('.sheet button[data-close]'); pg.wait_for_timeout(300)
        check(n, pg.query_selector('.sheet') is None, 'Book my vendors first closes it')
        check(n, pg.query_selector('#pkgSum .pkg-next') is not None, 'What’s next stays in the package summary')
        pg.locator('#pkgSum .pkg-next').scroll_into_view_if_needed(); pg.wait_for_timeout(200); pg.locator('#pkgSum').screenshot(path=f'{OUT}/{n}-summary.png')
        pg.click('#pkgSum [data-next="invite"]'); pg.wait_for_timeout(500)
        check(n, pg.url.endswith('/invite'), 'Send your invitations opens the invitation page')
        pg.go_back(); pg.wait_for_timeout(500)
        pg.locator('[data-pkuse="0"]').click() if pg.query_selector('[data-pkuse="0"]') else None; pg.wait_for_timeout(500)
        check(n, pg.query_selector('.sheet') is None, 'the prompt shows only the first time')
        sw=pg.evaluate('document.documentElement.scrollWidth - innerWidth'); check(n, sw<=1, f'no sideways scroll ({sw})')
        check(n, not e, f'no page errors {e[:2]}')
        ctx.close()
    b.close()
print('FAILURES:', fails or 'none')
