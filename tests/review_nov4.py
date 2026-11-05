# Fixes from the Nov 4, 2026 independent review: python3 tests/review_nov4.py <folder> [port]
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib, time
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; PORT=sys.argv[2] if len(sys.argv)>2 else '8765'; U=f'http://localhost:{PORT}/'
SLOW=[0]
def places_for(q, city=''):
    h=hashlib.md5((q+city).encode()).hexdigest()[:5]; word=q.split()[-1].title()
    return [{'id':h+str(i),'name':f'{word} Studio {"ABCDE"[i]}','rating':4.9-i*0.1,'reviews':300-i*40,'priceLevel':['PRICE_LEVEL_EXPENSIVE','PRICE_LEVEL_MODERATE'][i%2],'address':f'{i+1} Main St, Houston, TX','mapsUrl':'https://maps.google.com/?q='+h,'website':'https://example.com/'+h} for i in range(5)]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        if SLOW[0]: time.sleep(SLOW[0])
        b=json.loads(route.request.post_data); route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':places_for(b['query'], b.get('city',''))}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
fails=[]
def check(n, ok, what):
    print(n, 'OK ' if ok else 'FAIL', what)
    if not ok: fails.append(n+' '+what)
def plan(pg, typ='baby-shower', guests='40', setting='indoor', time_='13:00'):
    pg.goto(U+'#/new/1'); pg.wait_for_timeout(300); pg.fill('#text','blush and gold baby shower brunch'); pg.click('#next'); pg.wait_for_timeout(250)
    pg.select_option('#type',typ); pg.fill('#guests',guests); pg.fill('#expected',guests); pg.fill('#time', time_); pg.select_option('#city','Houston, TX'); pg.click(f'#setting [data-v={setting}]'); pg.click('#next')
    pg.wait_for_selector('.concept', timeout=20000); pg.wait_for_timeout(300)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        # 1. Back while packages build: the page matches the address
        plan(pg); SLOW[0]=0.25; pg.locator('.concept button.gold >> nth=0').click(); pg.wait_for_timeout(700)
        btn=pg.evaluate("() => { var b = document.querySelector('#pkgGo'); return b ? b.textContent : '' }")
        check(n, 'Building your 3 packages' in btn, 'the button says it is building all 3: '+btn)
        pg.go_back(); pg.wait_for_timeout(9000); SLOW[0]=0
        check(n, pg.url.endswith('/concepts') and pg.query_selector('.concept') is not None and pg.query_selector('.pkg-cmp') is None, 'Back during the build stays on the looks page')
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U+base+'/budget'); pg.wait_for_selector('.pkg-cmp', timeout=40000)
        check(n, True, 'the packages built in the background are there when she returns')
        # 2. choose a package: finished plan and overview follow it
        pg.locator('[data-pkuse="0"]').click(); pg.wait_for_timeout(600)
        check(n, pg.query_selector('.toast') is None, 'no toast sits on top of the What’s next prompt')
        pg.click('.sheet button[data-close]'); pg.wait_for_timeout(300)
        pg.goto(U+base+'/plan'); pg.wait_for_timeout(600); pt=pg.inner_text('main')
        check(n, 'In your package' in pt and 'also considering' not in pt, 'the finished plan lists her chosen package, not other options')
        pg.goto(U+base+'/overview'); pg.wait_for_timeout(500); ov=pg.inner_text('main')
        check(n, 'is your final package' in ov and 'compare packages' not in ov, 'the overview says which package she chose')
        check(n, len(pg.query_selector_all('.psteps .ps-go'))>=1, 'step rows that aren’t done can be tapped')
        # 3. invitation: a 1 PM shower isn't followed by dinner
        pg.goto(U+base+'/invite'); pg.wait_for_timeout(600); iv=pg.inner_text('main')
        check(n, 'Dinner to follow' not in iv and 'Dinner and dancing' not in iv, 'a 1 PM event never says dinner to follow')
        check(n, 'Add your date”' not in iv, 'the date tip names the real button')
        # 4. registry wording
        pg.goto(U+base+'/registry'); pg.wait_for_timeout(500)
        if pg.query_selector('#giftOn'): pg.click('#giftOn'); pg.wait_for_timeout(300)
        check(n, 'payment links above' not in pg.inner_text('main'), 'registry points to payment links below')
        # 5. guest limit in the free launch: no dead end
        pg.goto(U+base+'/guests'); pg.wait_for_selector('#bulk'); pg.click('#bulk'); pg.fill('.sheet #names','\n'.join(f'G{i}' for i in range(44))); pg.click('.sheet #ok'); pg.wait_for_timeout(400)
        wl=[g for g in pg.evaluate("id => JSON.parse(localStorage['ec.events'])[id].guestsList", base.split('/')[2]) if g['status']=='waitlist']
        if wl:
            pg.select_option(f'[data-st="{wl[0]["id"]}"]', 'yes'); pg.wait_for_timeout(200); t=pg.inner_text('.toast') if pg.query_selector('.toast') else ''
            check(n, 'Your pass' not in t, 'the guest limit message doesn’t point to a hidden tab: '+t[:90])
        # 6. at home: no venue area line
        plan(pg, 'birthday', '30', 'home', '19:00'); pg.locator('.concept button.gold >> nth=0').click(); pg.wait_for_selector('.pkg-cmp', timeout=40000)
        check(n, pg.query_selector('.pkg-area') is None, 'an at-home party has no venue area line')
        check(n, not e, f'no page errors {e[:2]}')
        ctx.close()
    b.close()
print('FAILURES:', fails or 'none')
