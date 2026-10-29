# Recommended performers (singer, DJ, zaffe) show "Price on request", never our estimate. python3 tests/price_request.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); hh=hashlib.md5((b['query']+b.get('city','')).encode()).hexdigest()[:5]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':'Biz '+hh+str(i),'rating':4.8,'reviews':200,'address':'1 Main St, Houston, TX 77001, USA','mapsUrl':'https://maps.google.com','website':'https://example.com'} for i in range(4)]}), headers=h)
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
        pg.goto(U+'#/start/arabic-wedding/Houston, TX'); pg.wait_for_selector('#text'); pg.fill('#text','Ivory and gold wedding'); pg.click('#next'); pg.wait_for_selector('#type')
        if not pg.query_selector('#setting [aria-pressed=true]'): pg.click('#setting [data-v=indoor]')
        pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000)
        cmp=pg.evaluate("(()=>{const r=document.querySelector('tr[data-pkrow=singer]');return r?r.innerText:''})()")
        check(n, 'Chris Hawat' in cmp and 'Price on request' in cmp and '$' not in cmp, 'compare: singer row has no estimate: '+cmp.replace('\n',' ')[:90])
        pg.goto(U+base+'/budget'); pg.wait_for_selector('[data-pkuse="0"]'); pg.click('[data-pkuse="0"]'); pg.wait_for_selector('#pkgSum')
        rows=pg.evaluate("[...document.querySelectorAll('.pkg-sum-r')].map(r=>r.innerText.replace(/\\s+/g,' '))")
        perf=[r for r in rows if 'Recommended' in r and any(r.startswith(c) for c in ['Wedding singer','DJ','Zaffe'])]
        check(n, len(perf)>=3 and all('Price on request' in r and '$' not in r for r in perf), 'singer, DJ and zaffe say Price on request: '+str(perf))
        other=[r for r in rows if r.startswith('Catering')]; check(n, other and '$' in other[0], 'other lines keep their estimate: '+str(other[:1]))
        check(n, not e, 'no page errors '+str(e[:2]))
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
