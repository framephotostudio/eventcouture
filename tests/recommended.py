# DJ Mosses shows first, marked Recommended, for DJs in Los Angeles and Orange County, and nowhere else: python3 tests/recommended.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); q=b['query']; hh=hashlib.md5((q+b.get('city','')).encode()).hexdigest()[:5]; city=b.get('city','').split(',')[0]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':q.split()[-1].title()+' Pros '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Ocean Ave, {city}, CA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh} for i in range(5)]}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    elif '/api/vendors' in u: route.fulfill(status=200, content_type='application/json', body='{"vendors":[]}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
def plan(pg, city, start='#/start/arabic-wedding/', text='Ivory and gold wedding with a grand zaffe entrance'):
    pg.goto(U+start); pg.wait_for_selector('#text'); pg.fill('#text', text); pg.click('#next'); pg.wait_for_selector('#type')
    pg.select_option('#city', city); pg.fill('#guests','200'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
    pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    return '#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        for city in ['Orange County, CA','Los Angeles, CA']:
            base=plan(pg, city)
            pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.click('#pkgMore'); pg.wait_for_timeout(1200)
            dj=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="dj"] td > b')]; cellt=pg.inner_text('tr[data-pkrow="dj"] td >> nth=0')
            check(n, dj and dj[0]=='DJ Mosses' and 'Recommended' in cellt and dj.count('DJ Mosses')==1, city+': DJ Mosses is the DJ in Package 1, marked Recommended: '+str(dj))
            if city.startswith('Orange'):
                pg.evaluate("document.querySelector('tr[data-pkrow=\"dj\"]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/rec_pkg_{n}.png')
        base=plan(pg, 'Houston, TX')
        pg.goto(U+base+'/budget'); pg.wait_for_selector('#musicPlan')
        if pg.get_attribute('[data-music="singer"]','aria-pressed')!='true': pg.click('[data-music="singer"]'); pg.wait_for_timeout(400)
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        sg=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="singer"] td > b')]
        hm=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="hairMakeup"] td > b')]; check(n, hm and hm[0]=='Wassim Hair Stylist', 'Wassim is the recommended hair stylist for an Arabic wedding in Houston: '+str(hm))
        dj=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="dj"] td > b')]; check(n, dj and dj[0]=='DJ Yamani', 'DJ Yamani is the recommended DJ for an Arabic wedding in Houston: '+str(dj))
        check(n, sg and sg[0]=='Chris Hawat' and 'Recommended' in pg.inner_text('tr[data-pkrow="singer"] td >> nth=0'), 'Chris Hawat is the recommended singer for an Arabic wedding in any city: '+str(sg))
        if n=='phone': pg.evaluate("document.querySelector('tr[data-pkrow=\"singer\"]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/rec_singer_{n}.png')
        base=plan(pg, 'Houston, TX', '#/new/1', 'Ivory and gold wedding with white roses')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        t=pg.inner_text('.pkg-cmp'); check(n, 'DJ Mosses' not in t and 'Chris Hawat' not in t and 'Wassim' not in t and 'DJ Yamani' in t, 'classic Houston party: DJ Yamani shows, the LA DJ and Arabic singer do not')
        if n=='phone': pg.evaluate("document.querySelector('tr[data-pkrow=\"dj\"]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/rec_yamani_{n}.png')
        check(n, not e, 'no page errors '+str(e)); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
