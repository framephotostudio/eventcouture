# A kids' birthday at a restaurant: family-friendly places, never bars or brunch spots. python3 tests/kids_restaurant.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]; Q=[]
NAMES=[('Lost and Found',True),('Pizza Party Palace',False),('Lone Star Brewery',False),('Family Fun Cafe',False),('Midnight Lounge',False),('Kids Grill House',False)]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); Q.append(b)
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':b['query'][:6]+str(i),'name':nm,'bar':bar,'rating':4.8,'reviews':300,'address':'1 Main St, Houston, TX 77001, USA','mapsUrl':'https://maps.google.com','website':'https://example.com','restaurant':True} for i,(nm,bar) in enumerate(NAMES)]}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api); Q.clear()
        pg.goto(U+'#/new/1'); pg.fill('#text','Unicorn birthday party for my daughter, 15 kids'); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type','kids-birthday')
        pg.select_option('#city','Houston, TX'); pg.fill('#guests','15'); pg.click('#setting [data-v=restaurant]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000)
        vq=[q['query'] for q in Q if not q.get('kind')]
        check(n, vq and 'family friendly' in vq[0], 'searches family-friendly restaurants: '+str(vq[:1]))
        cmp=pg.inner_text('.pkg-cmp')
        check(n, not any(x in cmp for x in ['Lost and Found','Brewery','Lounge']), 'no bars, breweries or lounges: '+cmp[:200].replace('\n',' '))
        check(n, not e, 'no page errors '+str(e[:2]))
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
