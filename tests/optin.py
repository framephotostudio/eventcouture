# Email tips sign-up: needs a ticked box, saves, shows the address, and Stop emails removes it: python3 tests/optin.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
CALLS=[]
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); q=b['query']; hh=hashlib.md5((q+b.get('city','')).encode()).hexdigest()[:5]; city=b.get('city','').split(',')[0]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':q.split()[-1].title()+' Pros '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Ocean Ave, {city}, CA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh} for i in range(5)]}), headers=h)
    elif u.endswith('/api/optin') or u.endswith('/api/optin/remove'):
        CALLS.append((u.rsplit('/',1)[-1], json.loads(route.request.post_data))); route.fulfill(status=200, content_type='application/json', body='{"ok":true}', headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    elif '/api/vendors' in u: route.fulfill(status=200, content_type='application/json', body='{"vendors":[]}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
def plan(pg, city, start='#/start/arabic-wedding/', text='Ivory and gold wedding with a grand zaffe entrance'):
    pg.goto(U+start); pg.wait_for_selector('#text'); pg.fill('#text', text); pg.click('#next'); pg.wait_for_selector('#type')
    if city.endswith((', ON',', BC',', QC',', AB')): pg.select_option('#country','CA'); pg.wait_for_timeout(200)
    pg.select_option('#city', city); pg.fill('#guests','200'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
    pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    return '#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
with sync_playwright() as p:
    b=p.chromium.launch()
    for n,w,h in [('phone',390,844),('desktop',1280,900)]:
        CALLS.clear(); ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        base=plan(pg,'Houston, TX','#/new/1','Blush and gold baby shower for 40')
        pg.goto(U+base+'/plan'); pg.wait_for_selector('#optin')
        pg.fill('#optEmail','not-an-email'); pg.click('#optin button'); pg.wait_for_timeout(300); check(n, not CALLS, 'bad email is not sent')
        pg.fill('#optEmail','host@example.com'); pg.click('#optin button'); pg.wait_for_timeout(300); check(n, not CALLS, 'nothing sent without the box ticked')
        pg.check('#optOk'); pg.click('#optin button'); pg.wait_for_timeout(800)
        check(n, CALLS and CALLS[0][0]=='optin' and CALLS[0][1]['consent'] is True and CALLS[0][1]['email']=='host@example.com' and 'Houston' in CALLS[0][1]['city'], 'sign-up sent with consent: '+str(CALLS[:1]))
        check(n, 'host@example.com' in pg.inner_text('#tab') and not pg.query_selector('#optin'), 'shows the address instead of the form')
        if n=='phone': pg.screenshot(path=f'{OUT}/optin_{n}.png', full_page=False)
        pg.goto(U+base+'/plan'); pg.wait_for_timeout(500); check(n, not pg.query_selector('#optin'), 'not asked again after reload')
        pg.goto(U+'#/unsubscribe'); pg.wait_for_selector('#unEmail'); pg.fill('#unEmail','host@example.com'); pg.click('#unsub button'); pg.wait_for_timeout(800)
        check(n, CALLS[-1][0]=='remove' and 'unsubscribed' in pg.inner_text('main'), 'Stop emails removes the address')
        pg.goto(U+base+'/plan'); pg.wait_for_selector('#optin'); check(n, True, 'form back after unsubscribing')
        pg.goto(U+'#/privacy'); pg.wait_for_timeout(300); check(n, 'Your email for planning tips' in pg.inner_text('main'), 'privacy policy explains the email list')
        check(n, not errs, 'no page errors '+str(errs[:2]))
print('FAILURES:', F or 'none')
