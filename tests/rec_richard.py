# Makeup by Richard is the first makeup artist pick, with the Recommended badge, in LA, Orange County and San Diego: python3 tests/rec_richard.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); hh=hashlib.md5((b['query']+b.get('city','')).encode()).hexdigest()[:5]; city=b.get('city','').split(',')[0]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':b['query'].split()[-1].title()+' House '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Main St, {city}, CA 90001, USA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh} for i in range(5)]}), headers=h)
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
        for city in ['Los Angeles, CA','Orange County, CA','San Diego, CA']:
            pg.goto(U+'#/new/1'); pg.fill('#text','Ivory and gold wedding for 150'); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type','wedding')
            pg.select_option('#country','US'); pg.wait_for_timeout(150); pg.select_option('#city',city); pg.click('#setting [data-v=indoor]'); pg.click('#next')
            pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
            pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000)
            pg.goto(U+base+'/budget'); pg.wait_for_selector('[data-pkuse="0"]'); pg.click('[data-pkuse="0"]'); pg.wait_for_selector('#pkgSum')
            row=[r.inner_text() for r in pg.query_selector_all('#pkgSum .pkg-sum-r') if 'Makeup artist' in r.inner_text()]
            check(n, row and 'Makeup by Richard' in row[0] and 'Recommended' in row[0], city+': makeup artist is Makeup by Richard, Recommended: '+(row[0].replace('\n',' ') if row else 'none'))
        pg.goto(U+'#/new/1'); pg.fill('#text','Ivory and gold wedding for 150'); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type','wedding')
        pg.select_option('#country','US'); pg.wait_for_timeout(150); pg.select_option('#city','Houston, TX'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000)
        check(n, 'Makeup by Richard' not in pg.inner_text('#pkg'), 'not in Houston packages')
        check(n, not e, 'no page errors '+str(e[:2]))
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
