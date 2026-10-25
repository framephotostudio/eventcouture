# Prices typed on the Budget page and prices on saved options stay in step: python3 tests/prices.py
from playwright.sync_api import sync_playwright
import json
U='http://localhost:8765/'
PL=json.dumps({'places':[{'id':'g','name':'Grand Hall','rating':4.8,'reviews':10,'address':'1 A St, Houston','mapsUrl':'https://maps.google.com/?q=g'},{'id':'r','name':'Rose Room','rating':4.6,'reviews':9,'address':'2 B St, Houston','mapsUrl':'https://maps.google.com/?q=r'},{'id':'s','name':'Sky Loft','rating':4.7,'reviews':8,'address':'3 C St, Houston','mapsUrl':'https://maps.google.com/?q=s'},{'id':'m','name':'Maison','rating':4.5,'reviews':7,'address':'4 D St, Houston','mapsUrl':'https://maps.google.com/?q=m'}]})
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
    for w,n in [(390,'phone'),(1280,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':900}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U+'#/new/1'); pg.wait_for_timeout(300); pg.fill('#text','gold 40th birthday'); pg.click('#next'); pg.wait_for_timeout(250)
        pg.select_option('#type','birthday'); pg.fill('#guests','50'); pg.fill('#expected','50'); pg.fill('#time','19:00'); pg.select_option('#city','Houston, TX'); pg.click('#setting [data-v=indoor]')
        pg.click('#next'); pg.wait_for_selector('#go'); pg.click('#go'); pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(300)
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2]); eid=base.split('/')[2]
        ev=lambda: pg.evaluate("id => JSON.parse(localStorage['ec.events'])[id]", eid)
        pg.goto(U+base+'/places'); pg.wait_for_timeout(300); pg.click('[data-live] >> nth=0'); pg.wait_for_selector('.live-res [data-short]')
        for i in range(3): pg.click(f'.live-res [data-short] >> nth={i}'); pg.wait_for_timeout(120)
        # 4th save replacing the front-runner makes the new one the front-runner
        pg.click('.live-res [data-short] >> nth=3'); pg.wait_for_selector('[data-swap-out]'); pg.click('[data-swap-out="g"]'); pg.wait_for_timeout(250)
        picks=[x['name'] for x in ev()['shortlist'] if x.get('pick')]; check(n, picks==['Maison'], 'replacing the front-runner passes the star to the new one: '+str(picks))
        # removing in Compare updates the Save buttons in the results
        pg.click('.optbar.wide [data-compare]'); pg.wait_for_selector('.cmp'); names=[x.inner_text() for x in pg.query_selector_all('.cmp-row:first-child .cmp-c b')]
        pg.click('[data-rm-opt] >> nth='+str(names.index('Rose Room'))); pg.wait_for_timeout(200); pg.click('.sheet [data-close]'); pg.wait_for_timeout(300)
        check(n, pg.inner_text('[data-short="venue|r"]')=='Save', 'result button says Save after removing in Compare')
        check(n, pg.query_selector('.live-res [data-short]') is not None, 'search results still there after closing Compare')
        # Budget page quote for the front-runner by name sticks, and shows in Compare
        pg.goto(U+base+'/budget'); pg.wait_for_timeout(300); pg.click('[data-price=venue]'); pg.wait_for_selector('#amt'); pg.fill('#amt','5000'); pg.fill('#nt','maison'); pg.click('#ok'); pg.wait_for_timeout(300)
        d=ev(); ov=d['overrides']['venue']; check(n, ov.get('opt')=='m' and ov['amount']==5000, 'budget-page quote links to the saved option')
        pg.click('[data-compare=venue]'); pg.wait_for_selector('.cmp'); check(n, '$5,000' in pg.inner_text('.cmp'), 'compare shows the budget-page quote')
        pg.click('[data-pick-opt] >> nth=0'); pg.wait_for_timeout(200); pg.click('[data-pick-opt] >> nth=0' if pg.query_selector('[data-pick-opt="m"]') is None else '[data-pick-opt="m"]'); pg.wait_for_timeout(200)
        check(n, ev()['overrides']['venue']['amount']==5000, 'quote survives moving the star away and back')
        pg.click('.sheet [data-close]'); pg.wait_for_timeout(300)
        # a manual price with a free-text note is never deleted by option changes
        pg.click('[data-price=venue]'); pg.wait_for_selector('#amt'); pg.click('#clr'); pg.wait_for_timeout(300)
        check(n, 'venue' not in ev().get('overrides',{}) and not any(x.get('quote') for x in ev()['shortlist'] if x['cat']=='venue'), 'Use the estimate again clears the option quote too')
        pg.click('[data-price=venue]'); pg.wait_for_selector('#amt'); pg.fill('#amt','4200'); pg.fill('#nt','deposit paid'); pg.click('#ok'); pg.wait_for_timeout(300)
        pg.click('[data-compare=venue]'); pg.wait_for_selector('.cmp'); pg.click('[data-pick-opt] >> nth=0'); pg.wait_for_timeout(200)
        check(n, ev()['overrides']['venue']['amount']==4200, 'manual price stays when the star moves')
        # booking on the Budget page by option name, then removing that option clears it
        pg.click('.sheet [data-close]'); pg.wait_for_timeout(300)
        pg.click('[data-price=venue]'); pg.wait_for_selector('#amt'); pg.fill('#amt','6000'); pg.select_option('#src','booking'); pg.fill('#nt','Sky Loft'); pg.click('#ok'); pg.wait_for_timeout(300)
        pg.click('[data-compare=venue]'); pg.wait_for_selector('.cmp'); check(n, 'Booked' in pg.inner_text('.cmp-row:first-child'), 'compare shows the budget-page booking')
        names=[x.inner_text() for x in pg.query_selector_all('.cmp-row:first-child .cmp-c b')]
        pg.click('[data-rm-opt] >> nth='+str(names.index('Sky Loft'))); pg.wait_for_timeout(200)
        check(n, 'venue' not in ev().get('overrides',{}), 'removing the booked option clears the booking')
        # booking with no amount is refused for a venue
        pg.click('[data-book-opt] >> nth=0'); pg.wait_for_selector('#pamt'); pg.fill('#pamt',''); pg.click('#psave'); pg.wait_for_timeout(200)
        check(n, pg.query_selector('#pamt') is not None and 'venue' not in ev().get('overrides',{}), 'venue booking needs an amount')
        check(n, not e, 'no page errors '+str(e)); ctx.close()
    b.close()
print('FAILURES:', fails if fails else 'none')
