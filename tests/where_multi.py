# More than one place: an event venue and a hotel ballroom (one package each), or a venue and outdoors (compared). A restaurant stays on its own.
# python3 tests/where_multi.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]; Q=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); Q.append(b); hh=hashlib.md5((b['query']+b.get('city','')).encode()).hexdigest()[:5]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':b['query'].split()[-1].title()+' Place '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Main St, Dallas, TX 75201, USA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh} for i in range(5)]}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
def pressed(pg): return pg.evaluate("[...document.querySelectorAll('#setting [aria-pressed=true]')].map(b=>b.dataset.v)")
def start(pg):
    pg.goto(U+'#/new/1'); pg.wait_for_selector('#text'); pg.fill('#text','Ivory and gold wedding for 150'); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type','wedding')
    pg.select_option('#country','US'); pg.wait_for_timeout(150); pg.select_option('#city','Dallas, TX'); pg.fill('#guests','150')
def go(pg):
    pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    return '#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        start(pg)
        pg.click('#setting [data-v=indoor]'); pg.click('#setting [data-v=ballroom]'); check(n, sorted(pressed(pg))==['ballroom','indoor'], 'venue and ballroom both on: '+str(pressed(pg)))
        pg.click('#setting [data-v=restaurant]'); check(n, pressed(pg)==['restaurant'], 'restaurant is on its own')
        pg.click('#setting [data-v=indoor]'); check(n, pressed(pg)==['indoor'], 'choosing a venue turns the restaurant off')
        pg.click('#setting [data-v=indoor]'); check(n, pressed(pg)==['indoor'], 'the last choice cannot be turned off')
        pg.click('#setting [data-v=ballroom]'); pg.screenshot(path=f'{OUT}/where_both_{n}.png')
        base=go(pg)
        Q.clear(); pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000)
        v1=[q['query'] for q in Q if not q.get('kind')]; pg.wait_for_timeout(700); Q.clear(); pg.click('#pkgMore'); pg.wait_for_selector('[data-pkuse="1"]', timeout=40000); v2=[q['query'] for q in Q if not q.get('kind')]
        check(n, v1 and v2 and ('ballroom' in v1[0] or 'hotel' in v1[0]) != ('ballroom' in v2[0] or 'hotel' in v2[0]), 'one package has an event venue, the other a hotel ballroom: '+str(v1[:1])+' / '+str(v2[:1]))
        # venue and outdoors: compared
        start(pg); pg.click('#setting [data-v=indoor]'); pg.click('#setting [data-v=outdoor]'); base=go(pg)
        pg.goto(U+base+'/overview'); pg.wait_for_selector('.where-compare'); rows=pg.evaluate("[...document.querySelectorAll('.where-compare [data-pickwhere]')].map(b=>b.dataset.pickwhere)")
        check(n, sorted(rows)==['indoor','outdoor'], 'compares only the two she picked: '+str(rows))
        pg.locator('.where-compare').screenshot(path=f'{OUT}/where_compare_{n}.png')
        pg.click('.where-compare [data-pickwhere="outdoor"]'); pg.wait_for_timeout(500)
        check(n, not pg.query_selector('.where-compare') and 'Outdoors' in pg.inner_text('main'), 'choosing outdoors settles it')
        check(n, not e, 'no page errors '+str(e[:2])); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
