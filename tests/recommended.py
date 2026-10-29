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
    if city.endswith((', ON',', BC',', QC',', AB')): pg.select_option('#country','CA'); pg.wait_for_timeout(200)
    pg.select_option('#city', city); pg.fill('#guests','200'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
    pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    return '#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        for city in ['Orange County, CA','Los Angeles, CA','San Diego, CA']:
            base=plan(pg, city)
            pg.goto(U+base+'/budget'); pg.wait_for_selector('#musicPlan')
            if pg.get_attribute('[data-music="singer"]','aria-pressed')!='true': pg.click('[data-music="singer"]'); pg.wait_for_timeout(400)
            pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.click('#pkgMore'); pg.wait_for_timeout(1200)
            dj=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="dj"] td > b')]; cellt=pg.inner_text('tr[data-pkrow="dj"] td >> nth=0')
            sg=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="singer"] td > b')]
            check(n, sg[:2]==['Waseem Rabih','Jamal Kassab'], city+': Waseem Rabih (city) then Jamal Kassab (all California): '+str(sg))
            zf=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="zaffe"] td > b')]
            check(n, zf[:2]==['Zaffet El Ezz','Zaffet Al-Afrah'], city+': California zaffe first, then the worldwide one: '+str(zf[:2]))
            hm=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="hairMakeup"] td > b')]
            check(n, (hm[:1]==['Hammoudeh Alex']) == city.startswith('Orange'), city+': Hammoudeh Alex is the hair stylist only in Orange County: '+str(hm[:1]))
            check(n, dj[:2]==(['DJ Mosses','DJ Roy'] if city.startswith('San Diego') else ['DJ Mosses','DJ L\u2019Rythm']) and 'Recommended' in cellt, city+': DJ Mosses first; then DJ L\u2019Rythm in OC and LA, DJ Roy in San Diego: '+str(dj))
            if city.startswith('Orange'):
                pg.evaluate("document.querySelector('tr[data-pkrow=\"dj\"]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/rec_pkg_{n}.png')
        base=plan(pg, 'Detroit, MI')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.click('#pkgMore'); pg.wait_for_timeout(1200)
        zf=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="zaffe"] td > b')]; check(n, zf[:2]==['Zaffet Joseph','Zaffet Al-Afrah'] and 'Tur\u00e1th Folkoholic Dance Theatre' not in zf, 'Detroit: Zaffet Joseph, Zaffet Al-Afrah, no Tur\u00e1th: '+str(zf))
        at=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="attire"] td > b')]; check(n, at[:1]==['Joseph\u2019s Fashion'], 'Detroit: Joseph\u2019s Fashion is the attire pick: '+str(at[:1]))
        base=plan(pg, 'Toronto, ON')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.click('#pkgMore'); pg.wait_for_timeout(1200)
        zf=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="zaffe"] td > b')]; check(n, 'Zaffet Al-Afrah' in zf and 'Zaffet Joseph' in zf and 'Royal Zaffe Group' not in zf, 'Toronto: the worldwide groups show, the U.S.-only one does not: '+str(zf))
        base=plan(pg, 'Orange County, CA', '#/start/arabic-engagement/', 'Ivory and gold engagement with a zaffe entrance')
        ev=pg.evaluate("id => JSON.parse(localStorage['ec.events'])[id]", base.split('/')[2])
        check(n, ev['type']=='engagement' and ev.get('culture')=='arabic', 'Arabic engagement party is created: '+str((ev['type'],ev.get('culture'))))
        pg.goto(U+base+'/budget'); pg.wait_for_selector('#cultureSel'); check(n, pg.input_value('#cultureSel')=='arabic' and 'Engagement tradition' in pg.inner_text('#musicPlan'), 'engagement has its own tradition menu')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.click('#pkgMore'); pg.wait_for_timeout(1200)
        sg=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="singer"] td > b')]; zf=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="zaffe"] td > b')]
        check(n, sg[:2]==['Waseem Rabih','Jamal Kassab'] and zf[:1]==['Zaffet El Ezz'], 'Arabic engagement in Orange County gets the Arabic singers and zaffe: '+str(sg[:2])+str(zf[:1]))
        if n=='phone': pg.evaluate("document.querySelector('tr[data-pkrow=\"singer\"]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/arabic_engagement_{n}.png')
        pg.goto(U+base+'/timeline'); pg.wait_for_timeout(600); check(n, 'Ring exchange' in pg.inner_text('#tab'), 'engagement schedule has the ring exchange')
        base=plan(pg, 'Los Angeles, CA', '#/start/persian-wedding/', 'Gold and white Persian wedding with a sofreh')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        dj=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="dj"] td > b')]; check(n, dj[:1]==['DJ Burak'], 'LA Persian wedding: DJ Burak first: '+str(dj[:1]))
        base=plan(pg, 'Los Angeles, CA', '#/start/quince/', 'Pink and gold quinceanera')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        dj=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="dj"] td > b')]; check(n, dj[:1]==['DJ Burak'], 'LA quincea\u00f1era: DJ Burak first: '+str(dj[:1]))
        base=plan(pg, 'Dallas, TX')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        pg.click('#pkgMore'); pg.wait_for_timeout(1200)
        dj=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="dj"] td > b')]; check(n, dj[:1]==['DJ Roy'] and 'DJ Mosses' not in dj, 'Dallas: DJ Roy first, no DJ Mosses: '+str(dj[:2]))
        base=plan(pg, 'Chicago, IL')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.click('#pkgMore'); pg.wait_for_timeout(1200); pg.click('#pkgMore'); pg.wait_for_timeout(1200)
        zf=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="zaffe"] td > b')]; check(n, zf[:3]==['Zaffet Al-Afrah','Zaffet Joseph','Tur\u00e1th Folkoholic Dance Theatre'], 'Chicago: the two Michigan groups, then Tur\u00e1th: '+str(zf[:3]))
        base=plan(pg, 'Orange County, CA', '#/new/1', 'Ivory and gold wedding with white roses')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        check(n, 'Hammoudeh' not in pg.inner_text('.pkg-cmp'), 'Orange County classic wedding: no Hammoudeh')
        base=plan(pg, 'Orange County, CA', '#/new/1', 'Glam black and gold 40th birthday party')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        hb=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="hairMakeup"] td > b')]
        check(n, not hb or hb[0]=='Hammoudeh Alex', 'Orange County birthday party: Hammoudeh is the hair stylist '+str(hb[:1]))
        base=plan(pg, 'Houston, TX')
        pg.goto(U+base+'/budget'); pg.wait_for_selector('#musicPlan')
        if pg.get_attribute('[data-music="singer"]','aria-pressed')!='true': pg.click('[data-music="singer"]'); pg.wait_for_timeout(400)
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.click('#pkgMore'); pg.wait_for_timeout(1200)
        sg=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="singer"] td > b')]
        zf=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="zaffe"] td > b')]; check(n, not ({'Zaffet Al-Afrah','Zaffet El Ezz','Royal Zaffe Group','Zaffet Joseph'} & set(zf[:3])), 'Houston: no travelling zaffe group in the first picks: '+str(zf)); check(n, zf[:2]==['Tur\u00e1th Folkoholic Dance Theatre','Watan Zaffe & Dabke Group'], 'Houston: Tur\u00e1th first, Watan second: '+str(zf[:2]))
        hm=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="hairMakeup"] td > b')]; check(n, hm and hm[0]=='Wassim Hair Stylist', 'Wassim is the recommended hair stylist for an Arabic wedding in Houston: '+str(hm))
        dj=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="dj"] td > b')]; check(n, dj[:2]==['DJ Yamani','DJ Roy'], 'Houston Arabic wedding: DJ Yamani first, DJ Roy second: '+str(dj))
        pg.click('#pkgMore'); pg.wait_for_timeout(1200); dj=[x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="dj"] td > b')]; check(n, dj[:2]==['DJ Yamani','DJ Roy'] and 'DJ Mosses' not in dj, 'Houston: no DJ Mosses (California only): '+str(dj))
        check(n, sg[:2]==['Jabour Bakla','Salem Omran'], 'Houston Arabic wedding: Jabour Bakla and Salem Omran are the singers in Packages 1 and 2: '+str(sg))
        if n=='phone': pg.evaluate("document.querySelector('tr[data-pkrow=\"singer\"]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/rec_singer_{n}.png')
        base=plan(pg, 'Houston, TX', '#/new/1', 'Ivory and gold wedding with white roses')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        t=pg.inner_text('.pkg-cmp'); check(n, 'DJ Mosses' not in t and 'Chris Hawat' not in t and 'Wassim' not in t and 'DJ Yamani' in t, 'classic Houston party: DJ Yamani shows, the LA DJ and Arabic singer do not')
        if n=='phone': pg.evaluate("document.querySelector('tr[data-pkrow=\"dj\"]').scrollIntoView({block:'center'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/rec_yamani_{n}.png')
        check(n, not e, 'no page errors '+str(e)); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
