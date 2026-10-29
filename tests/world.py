# Countries worldwide, cultural photo first, Reserve a table: python3 tests/world.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]; Q=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); Q.append(b); hh=hashlib.md5((b['query']+b.get('city','')).encode()).hexdigest()[:5]; city=b.get('city','').split(',')[0]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':b['query'].split()[-1].title()+' House '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Main St, {city}','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh,'reservable':i==0,'restaurant':True} for i in range(5)]}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        Q.clear(); ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        # 1. cultural card starts from its own photo
        pg.goto(U+'#/'); pg.wait_for_selector('#cultural'); pg.click('#cultural a[href="#/start/arabic-wedding/"]'); pg.wait_for_selector('.inspo-chosen')
        src=pg.get_attribute('.inspo-chosen img','src'); check(n, 'culture-arabic' in src and 'Your inspiration' in pg.inner_text('main'), 'Arabic wedding starts from its own photo: '+src)
        pg.click('#swapInspo'); pg.wait_for_selector('#igrid .icard'); first=pg.get_attribute('#igrid .icard >> nth=0','data-inspo'); check(n, first=='culture-arabic', 'Choose a different photo lists the Arabic photo first: '+first)
        pg.go_back(); pg.wait_for_selector('#text'); pg.fill('#text','Ivory and gold, a grand zaffe entrance'); pg.click('#next'); pg.wait_for_selector('#type')
        check(n, pg.evaluate("document.querySelector('#type').selectedOptions[0].dataset.culture")=='arabic', 'tradition stays Arabic')
        # 2. Dubai: country, city, currency
        pg.select_option('#country','AE'); pg.wait_for_timeout(200); opts=pg.evaluate("[...document.querySelectorAll('#city option')].map(o=>o.textContent)")
        check(n, 'Dubai, UAE' in opts and 'Abu Dhabi, UAE' in opts, 'UAE lists Dubai and Abu Dhabi: '+str(opts[:4]))
        pg.select_option('#city','Dubai, UAE'); pg.fill('#guests','200'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); check(n, 'culture-arabic' in (pg.get_attribute('.concept img >> nth=0','src') or '') or 'culture-arabic' in pg.inner_html('.concept >> nth=0') or 'Palace of Lanterns' in pg.inner_text('main'), 'the plan follows the Arabic photo')
        pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); head=pg.inner_text('.plan-head')
        check(n, 'AED' in head and '$' not in head.replace('AED',''), 'prices in AED: '+head[:120].replace('\n',' '))
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U+base+'/budget'); pg.wait_for_timeout(500); bt=pg.inner_text('#tab')
        check(n, 'VAT (5%)' in bt or 'VAT' in bt, 'UAE VAT shown'); check(n, 'Tip (10%)' not in bt, 'no US-style tips in Dubai')
        check(n, 'Chris Hawat' not in bt and 'Tony Eid' not in bt, 'US-only recommended singers do not show in Dubai')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        cities=[q.get('city','') for q in Q]; check(n, all('Dubai' in c or 'UAE' in c for c in cities), 'searches stay in Dubai: '+str(set(cities)))
        pg.goto(U+base+'/style'); pg.wait_for_timeout(600); shop=pg.evaluate("[...document.querySelectorAll('a')].map(a=>a.href).filter(h=>/amazon/.test(h))")
        check(n, not shop or all('amazon.ae' in x and 'tag=' not in x for x in shop), 'Dubai shopping links go to amazon.ae with no US tag: '+str(shop[:1]))
        # playlist and add-ons in the package
        pg.goto(U+base+'/budget'); pg.wait_for_selector('[data-pkuse="0"]'); pg.click('[data-pkuse="0"]'); pg.wait_for_selector('#pkgSum'); st=pg.inner_text('#pkgSum')
        check(n, 'Playlist: Arabian Nights Wedding' in st, 'package shows the Arabic playlist')
        adds=pg.evaluate("[...document.querySelectorAll('#pkgSum [data-pkadd]')].map(b=>b.dataset.pkadd)")
        rows0=len(pg.query_selector_all('.pkg-sum-r')); pk=adds[0] if adds else None
        if pk: pg.click(f'#pkgSum [data-pkadd="{pk}"]'); pg.wait_for_timeout(1500)
        check(n, pk and len(pg.query_selector_all('.pkg-sum-r'))==rows0+1, 'adding an add-on puts a new line in the package: '+str(pk))
        pg.click('#pkgSum [data-goto="playlist"]'); pg.wait_for_selector('#playlist'); pg.wait_for_timeout(600)
        pl=pg.inner_text('#playlist'); check(n, 'zaffe and grand entrance' in pl.lower() and 'Ala Dalouna' in pl, 'See the songs opens the Arabic playlist')
        pg.screenshot(path=f'{OUT}/playlist_{n}.png')
        # 3. Restaurant dinner in London: Reserve a table
        Q.clear(); pg.goto(U+'#/new/1'); pg.fill('#text','Birthday dinner for 12, black and gold'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#type','birthday'); pg.select_option('#country','GB'); pg.wait_for_timeout(150); pg.select_option('#city','London, UK'); pg.fill('#guests','12'); pg.click('#setting [data-v=restaurant]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        check(n, '£' in pg.inner_text('.plan-head'), 'London prices in £')
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2]); pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        pg.click('[data-pkuse="0"]'); pg.wait_for_timeout(500)
        rs=pg.evaluate("[...document.querySelectorAll('#pkg a')].filter(a=>/Reserve a table/.test(a.textContent)).map(a=>a.href)")
        check(n, rs and 'opentable.com' in rs[0] and 'London' in rs[0], 'Reserve a table links to OpenTable: '+str(rs[:1]))
        pg.screenshot(path=f'{OUT}/reserve_{n}.png')
        # 4. a typed city in another country
        pg.goto(U+'#/new/1'); pg.fill('#text','Engagement party for 80'); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#country','JO'); pg.wait_for_timeout(150)
        pg.select_option('#city','Other city in Jordan'); pg.fill('#cityOther','Petra'); pg.fill('#guests','80'); pg.click('#setting [data-v=indoor]'); pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        check(n, 'JOD' in pg.inner_text('.plan-head') and 'Petra' in pg.inner_text('main'), 'typed city in Jordan is priced in JOD')
        check(n, not e, 'no page errors '+str(e)); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
