# Dalouna Events: first zaffe group in New York, New Jersey and Dallas; added across Texas; Houston keeps its top 3: python3 tests/rec_dalouna.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); hh=hashlib.md5((b['query']+b.get('city','')).encode()).hexdigest()[:5]; city=b.get('city','').split(',')[0]; st=(b.get('city','').split(', ')+['TX'])[1][:2]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':b['query'].split()[-1].title()+' House '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Main St, {city}, {st} 10001, USA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh} for i in range(5)]}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
def zaffe_picks(pg, city):
    pg.goto(U+'#/start/arabic-wedding/'+city); pg.wait_for_selector('#text'); pg.click('#next'); pg.wait_for_selector('#type'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
    pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
    pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000); pg.wait_for_timeout(600)
    for _ in range(2): (pg.query_selector('#pkgMore') and pg.click('#pkgMore')); pg.wait_for_timeout(1500)
    return [x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="zaffe"] td > b')], pg.inner_html('tr[data-pkrow="zaffe"] td >> nth=0')
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        for city, ig in [('New York, NY','dalouna_events'), ('Newark, NJ','dalouna_events'), ('Dallas, TX','dalouna_dallas'), ('Austin, TX','dalouna_dallas')]:
            z, cell = zaffe_picks(pg, city)
            check(n, z[:1]==['Dalouna Events'] and ig in cell and 'Founder\u2019s Pick' in cell, city+': Dalouna first, linking @'+ig+': '+str(z))
        z, cell = zaffe_picks(pg, 'Houston, TX')
        check(n, 'Dalouna Events' not in z[:3] and z[:2]==['Turáth Folkoholic Dance Theatre','Watan Zaffe & Dabke Group'], 'Houston keeps its top 3, Dalouna after: '+str(z))
        z, cell = zaffe_picks(pg, 'Los Angeles, CA')
        check(n, 'Dalouna Events' not in z, 'not in California: '+str(z))
        check(n, not e, 'no page errors '+str(e[:2]))
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
