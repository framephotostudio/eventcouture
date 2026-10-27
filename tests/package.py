# One-tap booking package and a second package: python3 tests/package.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'
calls=[0]; cities=[]
def places_for(q, city=''):
    h=hashlib.md5((q+city).encode()).hexdigest()[:5]; word=q.split()[-1].title()
    return [{'id':h+str(i),'name':f'{word} Studio {"ABCDE"[i]}','rating':4.9-i*0.1,'reviews':300-i*40,'priceLevel':['PRICE_LEVEL_EXPENSIVE','PRICE_LEVEL_MODERATE'][i%2],'address':f'{i+1} Main St, Houston, TX','mapsUrl':'https://maps.google.com/?q='+h,'website':'https://example.com/'+h} for i in range(5)]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'): calls[0]+=1; b=json.loads(route.request.post_data); cities.append(b.get('city','')); route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':places_for(b['query'], b.get('city',''))}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
fails=[]
def check(n, ok, what):
    print(n, 'OK ' if ok else 'FAIL', what)
    if not ok: fails.append(n+' '+what)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        calls[0]=0; cities.clear()
        ctx=b.new_context(viewport={'width':w,'height':h}); ctx.grant_permissions(['clipboard-read','clipboard-write'], origin=U.rstrip('/')); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U+'#/new/1'); pg.wait_for_timeout(300); pg.fill('#text','black and gold 40th birthday party'); pg.click('#next'); pg.wait_for_timeout(250)
        pg.select_option('#type','birthday'); pg.fill('#guests','80'); pg.fill('#expected','80'); pg.fill('#time','19:00'); pg.select_option('#city','Houston, TX'); pg.select_option('#area','River Oaks'); pg.click('#setting [data-v=indoor]')
        pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.wait_for_timeout(300)
        check(n, len(pg.query_selector_all('.concept .thumb img'))==len(pg.query_selector_all('.concept')), 'every look has a labeled photo')
        pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(300)
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2]); eid=base.split('/')[2]
        ev=lambda: pg.evaluate("id => JSON.parse(localStorage['ec.events'])[id]", eid)
        check(n, 'Venues' not in pg.inner_text('.groupbar') and pg.query_selector('a[href$="/budget"]') is not None, 'one booking page in the menu')
        pg.goto(U+base+'/budget'); pg.wait_for_selector('#pkgGo'); check(n, pg.query_selector('#pkArea') is not None and pg.query_selector('[data-pkwhen]') is not None, 'create step asks for the date and the venue area first')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=15000); pg.wait_for_timeout(400)
        check(n, pg.url.endswith('/budget'), 'Create my package on the Summary starts it right away')
        rows=pg.query_selector_all('tr[data-pkrow]'); filled=pg.query_selector_all('tr[data-pkrow] td > b')
        check(n, len(rows)>=8 and len(filled)==len(rows), f'package fills venue and every vendor in one tap: {len(filled)}/{len(rows)}')
        first_calls=calls[0]
        check(n, 'River Oaks' in pg.inner_text('.pkg-area') and cities and any(c.startswith('River Oaks, Houston') for c in cities) and sum(1 for c in cities if c.startswith('River Oaks'))==1 and all(c.startswith('Houston') for c in cities if not c.startswith('River Oaks')), 'the venue is searched in her area, vendors across the whole city')
        check(n, 'Venue' in pg.inner_text('tr[data-pkrow] >> nth=0'), 'venue first')
        d=ev(); check(n, all(any(x['cat']==c and x.get('pick') for x in d['shortlist']) for c in d['packages'][0]['items']), 'package 1 picks are the front-runners')
        pg.screenshot(path=f'{OUT}/pkg1_{n}.png', full_page=True)
        pg.click('#pkgMore'); pg.wait_for_selector('th:has-text("Package 2")', timeout=15000); pg.wait_for_timeout(300)
        d=ev(); p1,p2=d['packages'][0]['items'],d['packages'][1]['items']
        check(n, all(p1[c]!=p2.get(c) for c in p1), 'package 2 has different picks for every item')
        check(n, calls[0]==first_calls, f'second package needed no new searches ({calls[0]-first_calls})')
        check(n, not d.get('pkgConfirmed') and len(pg.query_selector_all('[data-pkuse]'))==2 and 'Compare your packages' in pg.inner_text('#pkg') and 'I booked it' not in pg.inner_text('#pkg'), 'step 2: choose first, no booking buttons yet')
        check(n, pg.get_attribute('.pkg-steps li.on','aria-current')=='step' and 'Choose' in pg.inner_text('.pkg-steps li.on'), 'step tracker shows Choose')
        pg.screenshot(path=f'{OUT}/pkg2_{n}.png', full_page=True)
        # swap one item in package 2
        pg.click('[data-pkswap][data-pk="1"] >> nth=1'); pg.wait_for_selector('[data-pkpick]'); old=ev()['packages'][1]['items']; cat=pg.get_attribute('[data-pkswap][data-pk="1"] >> nth=1','data-pkswap')
        pg.click('[data-pkpick] >> nth=0'); pg.wait_for_timeout(300); new=ev()['packages'][1]['items']
        check(n, new[cat]!=old[cat] and new[cat]!=ev()['packages'][0]['items'][cat], 'swap replaces just that item')
        check(n, all(len([x for x in ev()['shortlist'] if x['cat']==c])<=3 for c in new), 'never more than 3 saved per category')
        # put a business from the full list into the package
        pg.goto(U+base+'/vendors'); pg.wait_for_timeout(300); pg.click('[data-vendor] >> nth=0'); pg.wait_for_selector('[data-topkg]'); vc=pg.get_attribute('[data-vendor] >> nth=0','data-vendor')
        key=pg.get_attribute('[data-topkg] >> nth=0','data-topkg'); pg.click('[data-topkg] >> nth=0'); pg.wait_for_timeout(300)
        check(n, ev()['packages'][1]['items'][vc]==key.split('|')[1], 'Put in package adds a business from the full list')
        # add one she found herself
        pg.goto(U+base+'/budget'); pg.wait_for_timeout(300); pg.click('[data-pkswap][data-pk="1"] >> nth=2'); pg.wait_for_selector('.pk-swap .cmp-add'); oc=pg.get_attribute('[data-pkswap][data-pk="1"] >> nth=2','data-pkswap')
        pg.click('.pk-swap .cmp-add summary'); pg.fill('[data-ownname]','Bella Cakes by Ana'); pg.fill('[data-ownlink]','bellacakes.com'); pg.click('[data-ownadd]'); pg.wait_for_timeout(300)
        check(n, 'Bella Cakes by Ana' in pg.inner_text('#pkg'), 'her own business goes into the package')
        # change the venue area from the package
        pg.click('#pkgArea'); pg.wait_for_selector('#parea'); pg.select_option('#parea','__other'); pg.fill('#pareaOther','Rice Village'); old_v=ev()['packages'][ev()['pkgView']]['items']
        pg.click('.sheet #ok'); pg.wait_for_timeout(800)
        d=ev(); new_v=d['packages'][d['pkgView']]['items']; vcat=[c for c in new_v if c in ('venue','privateDining')][0]
        check(n, d['area']=='Rice Village' and new_v[vcat]!=old_v[vcat] and cities[-1].startswith('Rice Village, Houston'), 'changing the area finds a venue there')
        # remove something she doesn't need, then put it back
        xc=pg.get_attribute('[data-pkx] >> nth=-1','data-pkx'); nrows=len(pg.query_selector_all('tr[data-pkrow]')); pg.click('[data-pkx] >> nth=-1'); pg.wait_for_timeout(300)
        check(n, len(pg.query_selector_all('tr[data-pkrow]'))==nrows-1 and xc in ev().get('exclude',[]), 'x removes an item from the package and the plan')
        pg.click('[data-pkunx="'+xc+'"]'); pg.wait_for_timeout(300); check(n, len(pg.query_selector_all('tr[data-pkrow]'))==nrows, 'Add back returns it')
        # choose package 2
        pg.click('[data-pkuse="1"]'); pg.wait_for_timeout(300); d=ev()
        check(n, d['pkgChosen']==1 and all(any(x['cat']==c and x['id']==d['packages'][1]['items'][c] and x.get('pick') for x in d['shortlist']) for c in d['packages'][1]['items']), 'choosing package 2 makes its picks the front-runners')
        check(n, d.get('pkgConfirmed') and 'Book' in pg.inner_text('.pkg-steps li.on') and 'next up' in pg.inner_text('.pkg-next').lower() and '1 of' in pg.inner_text('.pkg-next .eyebrow').lower(), 'step 3 starts with the first vendor')
        pg.evaluate("document.querySelector('#pkg').scrollIntoView({block:'start'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/pkg3_{n}.png', full_page=False)
        pg.click('.pkg-next [data-pkcopy]'); pg.wait_for_timeout(200); check(n, 'copied' in pg.inner_text('body').lower(), 'copy my message works')
        # book the venue from the Next up card
        first=pg.get_attribute('.pkg-next','data-pkrow')
        pg.click('.pkg-next [data-pkbook]'); pg.wait_for_selector('#pamt'); pg.fill('#pamt','4500'); pg.click('#psave'); pg.wait_for_timeout(200); pg.click('.sheet [data-close]'); pg.wait_for_timeout(400)
        check(n, '1 of' in pg.inner_text('.pkg-top') and pg.get_attribute('.pkg-next','data-pkrow')!=first and '2 of' in pg.inner_text('.pkg-next .eyebrow').lower(), 'after booking, the next vendor comes up')
        sk=pg.get_attribute('.pkg-next','data-pkrow'); pg.click('.pkg-next [data-pkskip]'); pg.wait_for_timeout(300)
        check(n, pg.get_attribute('.pkg-next','data-pkrow')!=sk, 'skip for now moves on')
        check(n, 'Your final package' in pg.inner_text('#pkg') and 'You chose Package' in pg.inner_text('#pkg'), 'after choosing, it says this is the final package and how to finalize it'); check(n, 'Booked' in pg.inner_text('.pkg-all .pk-row >> nth=0'), 'whole package list shows what is booked')
        pg.goto(U+base+'/plan'); pg.wait_for_timeout(400); t=pg.inner_text('#tab'); check(n, 'Booked:' in t and 'Front-runner:' in t, 'finished plan shows the package')
        # remove package 1
        pg.goto(U+base+'/budget'); pg.wait_for_timeout(300); pg.click('[data-pkback]'); pg.wait_for_timeout(300); pg.click('[data-pkdel="0"]'); pg.wait_for_timeout(300); d=ev()
        check(n, len(d['packages'])==1 and d['pkgChosen']==0, 'removing the other package keeps the chosen one')
        # finish: book everything left and land on Done
        pg.click('[data-pkuse="0"]'); pg.wait_for_timeout(300)
        for _ in range(40):
            if not pg.query_selector('.pkg-next [data-pkbook]'): break
            pg.click('.pkg-next [data-pkbook]'); pg.wait_for_selector('#pamt'); pg.fill('#pamt','500'); pg.click('#psave'); pg.wait_for_timeout(150); pg.click('.sheet [data-close]'); pg.wait_for_timeout(250)
        t=pg.inner_text('#pkg'); check(n, 'Everything is booked' in t and 'Invite my guests' in t and 'Done' in pg.inner_text('.pkg-steps li.on'), 'step 4: everything booked, next is inviting guests')
        pg.evaluate("document.querySelector('#pkg').scrollIntoView({block:'start'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/pkg4_{n}.png', full_page=False)
        check(n, not e, 'no page errors '+str(e)); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', fails if fails else 'none')
