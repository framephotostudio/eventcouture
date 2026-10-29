# Package add-ons: grouped, only those that suit the occasion, and each one finds businesses that offer it.
# python3 tests/addons.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]; Q=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); Q.append(b); hh=hashlib.md5((b['query']+b.get('city','')).encode()).hexdigest()[:5]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':b['query'].split()[0].title()+' Co '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Main St, Dallas, TX 75201, USA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh} for i in range(5)]}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
def plan(pg, text, typ, guests, setting, kids=False):
    pg.goto(U+'#/new/1'); pg.wait_for_selector('#text'); pg.fill('#text', text); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type', typ)
    pg.select_option('#country','US'); pg.wait_for_timeout(150); pg.select_option('#city','Dallas, TX'); pg.fill('#guests', str(guests)); pg.click(f'#setting [data-v={setting}]')
    if kids and not pg.is_checked('#kids'): pg.check('#kids')
    pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
    pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000)
    pg.goto(U+base+'/budget'); pg.wait_for_selector('[data-pkuse="0"]'); pg.click('[data-pkuse="0"]'); pg.wait_for_selector('#pkgSum')
    return base, pg.evaluate("[...document.querySelectorAll('#pkgSum [data-pkadd]')].map(b=>b.dataset.pkadd)")
CASES=[
 ('Pink and gold unicorn party for my daughter, 20 kids', 'kids-birthday', 20, 'home', True, ['characterVisit','bounceHouse','gameTruck','magician','balloonTwister','facePainter','craftStation','pettingZoo','popcornCart','chocolateFountain'], ['livePainter','effects','coffeeBar','hairMakeup','danceFloor']),
 ('Ivory and gold wedding for 150', 'wedding', 150, 'indoor', False, ['chocolateFountain','livePainter','effects','danceFloor','coffeeBar','booth360','flowerWall'], ['bounceHouse','popcornCart','caricature','balloons','facePainter','characterVisit','magician','gameTruck']),
 ('Company holiday party for 80', 'corporate', 80, 'indoor', False, ['coffeeBar','foodTruck','caricature','booth360'], ['hairMakeup','livePainter','effects','cake','bounceHouse','flowerWall']),
 ('Sage baby shower for 30', 'baby-shower', 30, 'indoor', False, ['popcornCart','flowerWall','dessertBar','chocolateFountain'], ['danceFloor','effects','foodTruck','livePainter','bounceHouse']),
 ('Birthday dinner for 12', 'birthday', 12, 'restaurant', False, [], ['chocolateFountain','bounceHouse','dj','effects','danceFloor','foodTruck']),
]
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        for text,typ,g,setting,kids,want,never in CASES:
            base,adds=plan(pg, text, typ, g, setting, kids)
            check(n, all(x in adds for x in want), f'{typ}: offers {want} (got {adds})')
            check(n, not any(x in adds for x in never), f'{typ}: never offers {[x for x in never if x in adds]}')
            if typ=='wedding':
                gl=pg.evaluate("[...document.querySelectorAll('#pkgSum .pkg-add-g')].map(x=>x.textContent)")
                check(n, gl[:2]==['Food and treats','Photos and memories'], 'add-ons are grouped: '+str(gl))
                pg.wait_for_timeout(2800); pg.locator('#pkgSum .pkg-adds').screenshot(path=f'{OUT}/addons_wedding_{n}.png')
                Q.clear(); rows0=len(pg.query_selector_all('.pkg-sum-r')); pg.click('#pkgSum [data-pkadd="chocolateFountain"]'); pg.wait_for_timeout(2500)
                st=pg.inner_text('#pkgSum'); qs=[q['query'] for q in Q]
                check(n, len(pg.query_selector_all('.pkg-sum-r'))==rows0+1 and 'Chocolate fountain' in st and ' Co A' in st, 'chocolate fountain line with a business that offers it')
                check(n, qs and 'chocolate fountain rental' in qs[0], 'searches "chocolate fountain rental": '+str(qs[:2]))
                pg.goto(U+base+'/budget'); pg.wait_for_timeout(500); check(n, 'Chocolate fountain' in pg.inner_text('#tab'), 'chocolate fountain is priced in the budget')
            if typ=='kids-birthday':
                gl=pg.evaluate("[...document.querySelectorAll('#pkgSum .pkg-add-g')].map(x=>x.textContent)"); check(n, gl[:1]==['Kids\u2019 fun'], 'kids add-ons come first: '+str(gl[:2]))
                Q.clear(); pg.click('#pkgSum [data-pkadd="characterVisit"]'); pg.wait_for_timeout(2500); qs=[q['query'] for q in Q]
                check(n, qs and 'unicorn party entertainment' in qs[0] and 'Character visit' in pg.inner_text('#pkgSum'), 'unicorn party finds unicorn characters: '+str(qs[:1]))
                pg.wait_for_timeout(2800); pg.locator('#pkgSum .pkg-adds').screenshot(path=f'{OUT}/addons_kids_{n}.png')
        check(n, not e, 'no page errors '+str(e[:2])); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
