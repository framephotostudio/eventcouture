# Fixes from the worldwide review, plus Houston recommendations: python3 tests/review_fixes.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
from _extras import extras, groups, add_extra  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); hh=hashlib.md5((b['query']+b.get('city','')).encode()).hexdigest()[:5]; city=b.get('city','').split(',')[0]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':b['query'].split()[-1].title()+' House '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Main St, {city}, TX 77001, USA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh,'reservable':True,'restaurant':True} for i in range(5)]}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
def plan(pg, text, typ, country, city, guests, setting, other=None):
    pg.goto(U+'#/new/1'); pg.wait_for_selector('#text'); pg.fill('#text', text); pg.click('#next'); pg.wait_for_selector('#type')
    if typ: pg.select_option('#type', typ)
    pg.select_option('#country', country); pg.wait_for_timeout(150); pg.select_option('#city', city)
    if other: pg.fill('#cityOther', other)
    pg.fill('#guests', str(guests)); pg.click(f'#setting [data-v={setting}]'); pg.click('#next')
    pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    return '#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
def package(pg, base):
    pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=30000)
    pg.goto(U+base+'/budget'); pg.wait_for_selector('[data-pkuse="0"]'); pg.click('[data-pkuse="0"]'); pg.wait_for_selector('#pkgSum')
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,"phone"),(1280,900,"desktop")]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        # add-on chips add a line at a home party
        base=plan(pg, 'Sage and cream baby shower at home for 30', 'baby-shower', 'CA', 'Toronto, ON', 30, 'home'); package(pg, base)
        rows0=len(pg.query_selector_all('.pkg-sum-r')); adds=extras(pg)
        pk='videographer' if 'videographer' in adds else (adds[0] if adds else None)
        if pk: add_extra(pg, pk); pg.wait_for_timeout(2500)
        check(n, pk and len(pg.query_selector_all('.pkg-sum-r'))==rows0+1 and pk not in extras(pg), 'Toronto home shower: + '+str(pk)+' adds a line')
        check(n, 'Reserve a table' not in pg.inner_text('#pkg'), 'no Reserve a table at a home party')
        # engagement name said once
        base=plan(pg, 'Minimal white engagement party for 60', 'engagement', 'JP', 'Tokyo, Japan', 60, 'indoor'); hd=pg.inner_text('.plan-head')
        check(n, 'Engagement Engagement' not in hd and 'Engagement Engagement' not in pg.title(), 'engagement name not doubled: '+hd.split('\n')[0])
        pg.goto(U+base+'/budget'); pg.wait_for_timeout(500); bt=pg.inner_text('#tab')
        check(n, 'and tips' not in bt and 'tax, service, tips' not in bt, 'Tokyo budget never mentions tips')
        check(n, 'Consumption tax' in bt, 'tax name capitalised')
        # Argentina in US dollars
        base=plan(pg, 'Gold birthday party for 40', 'birthday', 'AR', 'Buenos Aires, Argentina', 40, 'indoor')
        check(n, 'US$' in pg.inner_text('.plan-head'), 'Buenos Aires shows US$: '+pg.inner_text('.plan-head')[:80].replace('\n',' '))
        # Houston Nigerian wedding: Glitz N Glam first venue, Flash Memories for add-ons, no Reserve on the venue
        pg.goto(U+'#/start/nigerian-wedding/'); pg.wait_for_selector('#text'); pg.fill('#text','Emerald and gold Nigerian wedding'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#country','US'); pg.wait_for_timeout(150); pg.select_option('#city','Houston, TX'); pg.fill('#guests','250'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        package(pg, base); st=pg.inner_text('#pkgSum')
        check(n, 'Glitz N Glam Houston' in st, 'Nigerian wedding in Houston: Glitz N Glam is in the package')
        check(n, 'Reserve a table' not in pg.inner_text('#pkg'), 'no Reserve a table on a wedding venue')
        check(n, 'Kasra' not in st, 'Persian caterers stay out of a Nigerian wedding')
        adds=extras(pg)
        check(n, 'effects' in adds and 'danceFloor' in adds, 'special effects and dance floor are add-ons: '+str(adds))
        if 'effects' in adds: add_extra(pg, 'effects'); pg.wait_for_timeout(2500)
        st=pg.inner_text('#pkgSum'); check(n, 'Special effects' in st and 'Flash Memories Photo Booth Co' in st, 'special effects line picks Flash Memories')
        pg.screenshot(path=f'{OUT}/houston_nigerian_{n}.png', full_page=False)
        # a classic Houston wedding does not get Glitz N Glam, but gets Flash Memories for the photo booth
        base=plan(pg, 'Blush and ivory wedding for 150', 'wedding', 'US', 'Houston, TX', 150, 'indoor'); package(pg, base)
        if 'photoBooth' in extras(pg): add_extra(pg, 'photoBooth'); pg.wait_for_timeout(2500)
        st=pg.inner_text('#pkgSum'); check(n, 'Glitz N Glam' not in st and 'Flash Memories Photo Booth Co' in st, 'classic Houston wedding: Flash Memories photo booth, no Glitz N Glam')
        # Houston Persian wedding: Kasra caters, Caspian and Garson next in See options
        pg.goto(U+'#/start/persian-wedding/'); pg.wait_for_selector('#text'); pg.fill('#text','Ivory and gold Persian wedding'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#country','US'); pg.wait_for_timeout(150); pg.select_option('#city','Houston, TX'); pg.fill('#guests','200'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        package(pg, base); st=pg.inner_text('#pkgSum')
        check(n, 'Kasra Persian Grill' in st, 'Persian wedding in Houston: Kasra caters the package')
        pg.screenshot(path=f'{OUT}/houston_persian_{n}.png')
        # London restaurant: only restaurant add-ons
        base=plan(pg, 'Birthday dinner for 12, black and gold', 'birthday', 'GB', 'London, UK', 12, 'restaurant'); package(pg, base)
        adds=extras(pg)
        check(n, 'dj' not in adds and 'balloons' not in adds and 'photoBooth' not in adds and len(adds)<=7, 'restaurant add-ons are restaurant-appropriate: '+str(adds))
        # Kuwait: refresh before choosing a city keeps the country
        pg.goto(U+'#/new/1'); pg.fill('#text','Gold party'); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#country','KW'); pg.wait_for_timeout(150); pg.fill('#budget','5000'); pg.wait_for_timeout(300)
        pg.click('#back2'); pg.wait_for_selector('#next'); pg.click('#next'); pg.wait_for_selector('#type')
        check(n, pg.input_value('#country')=='KW', 'country kept after going back: '+pg.input_value('#country'))
        pg.select_option('#type','birthday'); pg.select_option('#city','Other city in Kuwait'); pg.click('#setting [data-v=indoor]'); pg.click('#next'); pg.wait_for_timeout(400)
        tt=pg.inner_text('.toast') if pg.query_selector('.toast') else ''
        check(n, tt=='Type your city', 'blank typed city asks for the city only: '+tt)
        check(n, not e, 'no page errors '+str(e)); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
