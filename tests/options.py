# Three options per category, a front-runner and the side-by-side comparison: python3 tests/options.py <screenshot folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'
PL=json.dumps({'places':[
 {'id':'p1','name':'Gilded Florals','rating':4.8,'reviews':212,'priceLevel':'PRICE_LEVEL_EXPENSIVE','address':'1 Main St, Houston, TX','mapsUrl':'https://maps.google.com/?q=1','website':'https://example.com'},
 {'id':'p2','name':'Bloom House','rating':4.7,'reviews':98,'address':'2 Elm St, Houston, TX','mapsUrl':'https://maps.google.com/?q=2'},
 {'id':'p3','name':'Petal and Stem Studio','rating':4.9,'reviews':340,'priceLevel':'PRICE_LEVEL_MODERATE','address':'3 Oak St, Houston, TX','mapsUrl':'https://maps.google.com/?q=3'},
 {'id':'p4','name':'Maison Fleur','rating':4.6,'reviews':51,'address':'4 Pine St, Houston, TX','mapsUrl':'https://maps.google.com/?q=4'}]})
def api(route):
    u=route.request.url
    if u.endswith('/api/places'): route.fulfill(status=200, content_type='application/json', body=PL, headers={'access-control-allow-origin':'*'})
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers={'access-control-allow-origin':'*'})
    else: route.fulfill(status=500, body='{}', headers={'access-control-allow-origin':'*'})
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
fails=[]
def check(n, ok, what):
    print(n, 'OK ' if ok else 'FAIL', what)
    if not ok: fails.append(n+' '+what)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U+'#/new/1'); pg.wait_for_timeout(300); pg.fill('#text','black and gold 30th birthday'); pg.click('#next'); pg.wait_for_timeout(250)
        pg.select_option('#type','birthday'); pg.fill('#guests','40'); pg.fill('#expected','40'); pg.fill('#time','19:00'); pg.select_option('#city','Houston, TX'); pg.click('#setting [data-v=indoor]')
        pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.wait_for_timeout(250)
        pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(300)
        base=pg.url.split('#')[1].split('/'); base='#/'+base[1]+'/'+base[2]
        eid=base.split('/')[2]; ev=lambda: pg.evaluate("id => JSON.parse(localStorage['ec.events'])[id]", eid)
        pg.goto(U+base+'/vendors'); pg.wait_for_timeout(300)
        btn=pg.query_selector('[data-vendor=florals]') or pg.query_selector_all('[data-vendor]')[0]; cat=btn.get_attribute('data-vendor')
        bar=f'[data-optbar={cat}]'
        check(n, pg.query_selector(bar) is not None and not pg.is_visible(bar), 'options bar hidden until something is saved')
        btn.click(); pg.wait_for_selector('[data-short]')
        for i in range(3): pg.click(f'[data-short] >> nth={i}'); pg.wait_for_timeout(150)
        t=pg.inner_text(bar); check(n, 'Gilded Florals' in t and '3 of 3' in t, 'first saved is front-runner, 3 of 3: '+t.replace('\n',' '))
        pg.click('[data-short] >> nth=3'); pg.wait_for_selector('[data-swap-out]')
        check(n, len(pg.query_selector_all('[data-swap-out]'))==3, 'fourth save asks which to replace')
        pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/opt_replace_{n}.png')
        pg.click('[data-swap-out] >> nth=1'); pg.wait_for_timeout(250)
        t=pg.inner_text(bar); check(n, '3 of 3' in t, 'still 3 after replace')
        pg.click(bar+' [data-compare]'); pg.wait_for_selector('.cmp')
        names=[x.inner_text() for x in pg.query_selector_all('.cmp-row:first-child .cmp-c b')]
        check(n, names==['Gilded Florals','Petal and Stem Studio','Maison Fleur'], 'compare shows the three: '+str(names))
        check(n, 'Upscale' in pg.inner_text('.cmp') and '★ 4.9' in pg.inner_text('.cmp'), 'price level and rating shown')
        pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/opt_compare_{n}.png')
        pg.click('[data-pick-opt] >> nth=0'); pg.wait_for_timeout(200)
        check(n, 'Front-runner' in pg.inner_text('.cmp-row:first-child .cmp-c >> nth=1'), 'star moves to Petal and Stem')
        pg.click('[data-quote-opt] >> nth=1'); pg.wait_for_selector('#pamt'); pg.fill('#pamt','2400'); pg.click('#psave'); pg.wait_for_timeout(300)
        d=ev(); ov=d['overrides'][cat]; check(n, ov['amount']==2400 and ov['note']=='Petal and Stem Studio', 'front-runner quote drives the budget')
        # quote for a non-front-runner should not drive the budget
        pg.goto(U+base+'/budget'); pg.wait_for_timeout(300)
        pg.click(f'[data-compare={cat}]'); pg.wait_for_selector('.cmp')
        pg.click('[data-quote-opt] >> nth=2'); pg.wait_for_selector('#pamt'); pg.fill('#pamt','1800'); pg.click('#psave'); pg.wait_for_timeout(300)
        d=ev(); ov=d['overrides'][cat]; check(n, ov['amount']==2400, 'other quote is stored but budget keeps front-runner')
        check(n, '$1,800' in pg.inner_text('.cmp'), 'other quote shown side by side')
        pg.click('[data-book-opt] >> nth=2'); pg.wait_for_selector('#pamt'); check(n, pg.input_value('#pamt')=='1800', 'booking starts from their quote'); pg.fill('#pamt','1750'); pg.click('#psave'); pg.wait_for_timeout(300)
        pg.click('.sheet [data-close]'); pg.wait_for_timeout(300)
        d=ev(); ov=d['overrides'][cat]; pk=[x['name'] for x in d['shortlist'] if x.get('pick')]
        check(n, ov['source']=='booking' and pk==['Maison Fleur'], 'booked option becomes the pick: '+str(pk))
        t=pg.inner_text('.bookings'); check(n, 'Booked' in t and 'Maison Fleur' in t, 'bookings panel shows booked: '+t.replace('\n',' | ')[:160])
        pg.query_selector('.bookings').scroll_into_view_if_needed(); pg.screenshot(path=f'{OUT}/opt_budget_{n}.png')
        # removing a quoted front-runner takes its quote out; booking survives other removals
        pg.click(f'[data-compare={cat}]'); pg.wait_for_selector('.cmp'); pg.click('[data-rm-opt] >> nth=1'); pg.wait_for_timeout(250)
        d=ev(); check(n, d['overrides'][cat]['source']=='booking' and d['overrides'][cat]['amount']==1750, 'booking kept when another option is removed')
        names=[x.inner_text() for x in pg.query_selector_all('.cmp-row:first-child .cmp-c b')]
        pg.click('[data-rm-opt] >> nth=' + str(names.index('Maison Fleur'))); pg.wait_for_timeout(250)
        d=ev(); check(n, cat not in d.get('overrides',{}), 'removing the booked option clears the booking: '+str(d.get('overrides',{}).get(cat)))
        pg.click('.sheet [data-close]'); pg.wait_for_timeout(300)
        # venues: own option and finished plan
        pg.goto(U+base+'/places'); pg.wait_for_timeout(300)
        check(n, pg.query_selector('.optbar.wide') is not None, 'venue options bar')
        pg.click('.optbar.wide [data-compare]'); pg.wait_for_selector('#oname'); pg.fill('#oname','The Grand Salon'); pg.fill('#olink','grandsalon.com'); pg.click('#oadd'); pg.wait_for_timeout(200)
        check(n, 'The Grand Salon' in pg.inner_text('.sheet'), 'own option added')
        pg.click('.sheet [data-close]'); pg.wait_for_timeout(300)
        check(n, 'The Grand Salon' in pg.inner_text('.optbar.wide'), 'bar shows own front-runner')
        lb=pg.query_selector_all('[data-live]')
        if lb: lb[0].click(); pg.wait_for_selector('.live-res [data-short]'); pg.click('.live-res [data-short] >> nth=0'); pg.wait_for_timeout(200); check(n, '2 of 3' in pg.inner_text('.optbar.wide'), 'venue bar counts live save')
        pg.goto(U+base+'/plan'); pg.wait_for_timeout(400); t=pg.inner_text('#tab')
        check(n, 'Front-runner: The Grand Salon' in t and 'also considering Gilded Florals' in t, 'finished plan lists front-runner and others')
        check(n, 'Booked: Maison Fleur' not in t, 'removed booking is gone from the plan')
        pg.screenshot(path=f'{OUT}/opt_plan_{n}.png', full_page=True)
        # save the plan: PDF, email, share; change and replace links
        with pg.expect_download() as dl: pg.click('#pdfPlan')
        f=dl.value; path=f'{OUT}/plan_{n}.pdf'; f.save_as(path); head=open(path,'rb').read(8)
        check(n, head.startswith(b'%PDF') and f.suggested_filename.endswith('-plan.pdf'), 'PDF downloaded: '+f.suggested_filename)
        mail=pg.evaluate("(function(){var h=null;window.ECMailTo=function(u){h=u;};document.querySelector('#mailPlan').click();delete window.ECMailTo;return h;})()")
        check(n, bool(mail) and mail.startswith('mailto:?subject=') and 'Front-runner' in __import__('urllib.parse').parse.unquote(mail), 'email opens with the plan in the body')
        hrefs=[x.get_attribute('href').split('/')[-1] for x in pg.query_selector_all('a.ps-edit')]
        check(n, set(['concepts','budget','food','timeline']).issubset(set(hrefs)), 'change links: '+str(hrefs))
        before=len([x for x in ev()['shortlist'] if x['cat']==cat])
        pg.click(f'[data-plan-replace={cat}]'); pg.wait_for_selector('.cmp'); pg.wait_for_timeout(300)
        pg.click('[data-replace-opt] >> nth=0'); pg.wait_for_timeout(900)
        check(n, pg.url.endswith('/vendors') and pg.query_selector(f'.live-res [data-short]') is not None, 'replace goes to a fresh search: '+pg.url.split('/')[-1])
        d=ev(); check(n, len([x for x in d['shortlist'] if x['cat']==cat])==before-1, 'replaced option removed')
        pg.goto(U+base+'/plan'); pg.wait_for_timeout(300); pg.click('a.ps-edit[href$=concepts]'); pg.wait_for_selector('.concept'); check(n, pg.query_selector('.concept.selected') is not None, 'change look shows the three looks with hers selected')
        check(n, not e, 'no page errors '+str(e)); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', fails if fails else 'none')
