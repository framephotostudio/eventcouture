# The quick start (Nov 11, 2026): planning opens on one basics screen (occasion, city, guests), describing it is
# optional, "Not sure yet" is the default place, and the city fills in from the approximate location.
import json
from playwright.sync_api import sync_playwright
U = 'http://localhost:8765/'; API = 'http://fake.api'; F = []
def check(n, ok, msg): print(('OK   ' if ok else 'FAIL ') + n + ' ' + msg); ok or F.append(n + ' ' + msg)
def fake(body):
    def f(route):
        route.fulfill(status=200, content_type='application/json', body=body if route.request.url.endswith('/api/where') else '{}', headers={'access-control-allow-origin': '*'})
    return f
with sync_playwright() as p:
    b = p.chromium.launch()
    for n, vp in [('phone', {'width': 390, 'height': 844}), ('desktop', {'width': 1280, 'height': 900})]:
        pg = b.new_page(viewport=vp); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(U + '#/new'); pg.wait_for_selector('#occ')
        check(n, '/new/2/' in pg.url and not pg.query_selector('#text'), 'Plan my event opens on the basics, no describe box')
        check(n, pg.get_attribute('#setting [data-v=indoor]', 'aria-pressed') == 'true', 'a place is pre-picked (event venue) so it can go straight on')
        check(n, len(pg.query_selector_all('#occ [data-occ2]')) == 9 and all(x.is_visible() for x in pg.query_selector_all('#occ [data-occ2]')), 'all 9 occasions are in view')
        pg.click('[data-occ2=kids-birthday]'); check(n, pg.get_attribute('#setting [data-v=home]', 'aria-pressed') == 'true', 'a kids\u2019 party pre-picks at home')
        pg.click('[data-occ2=baby-shower]'); check(n, pg.input_value('#type') == 'baby-shower' and pg.get_attribute('[data-occ2=baby-shower]', 'aria-pressed') == 'true' and pg.get_attribute('#setting [data-v=indoor]', 'aria-pressed') == 'true', 'one tap picks the occasion (and the usual place)')
        pg.click('#setting [data-v=outdoor]'); pg.click('[data-occ2=wedding]'); check(n, pg.get_attribute('#setting [data-v=outdoor]', 'aria-pressed') == 'true', 'a place she picked herself stays when she changes the occasion')
        pg.click('[data-occ2=baby-shower]')
        pg.click('#next'); pg.wait_for_timeout(300); check(n, '/new/2/' in pg.url, 'no city: stays and asks for it')
        pg.select_option('#city', 'Houston, TX'); pg.click('#next'); pg.wait_for_selector('.concept', timeout=30000)
        check(n, '/concepts' in pg.url, 'occasion + city is enough to get looks')
        pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        ev = pg.evaluate("(()=>{const id=location.hash.split('/')[2];return JSON.parse(localStorage['ec.events'])[id]})()")
        check(n, not ev.get('settingOpen'), 'the plan has a place, so packages can build right away (setting=' + str(ev.get('setting')) + ')')
        pg.goto(U + '#/start/birthday/Dallas, TX'); pg.wait_for_selector('#occ')
        check(n, pg.get_attribute('[data-occ2=birthday]', 'aria-pressed') == 'true' and pg.input_value('#city') == 'Dallas, TX', 'home Birthday button lands on the basics with birthday and the city set')
        pg.click('#vision'); pg.wait_for_selector('#text'); check(n, '/new/1/' in pg.url and 'optional' in pg.inner_text('main h2'), 'the vision screen is optional')
        pg.click('#next'); pg.wait_for_selector('#occ'); check(n, '/new/2/' in pg.url, 'Done with nothing typed goes back, nothing required')
        pg.goto(U + '#/inspiration/all'); pg.wait_for_selector('#igrid'); pg.click('#igrid [data-inspo] >> nth=0'); pg.click('.sheet #useInspo')
        pg.wait_for_timeout(800); check(n, '/new/' in pg.url and pg.query_selector('.inspo-chosen') is not None, 'a chosen photo shows on the screen it lands on')
        check(n, not errs, 'no page errors ' + str(errs[:2]))
        pg.close()
    # city from the approximate location
    for where, want in [({'city': 'Katy', 'region': 'TX', 'country': 'US'}, 'Houston, TX'), ({'city': 'London', 'region': 'ENG', 'country': 'GB'}, 'London, UK'), ({'city': 'Smallville', 'region': 'KS', 'country': 'US'}, '')]:
        pg = b.new_page(viewport={'width': 390, 'height': 844})
        def cfg(route):
            r = route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''", "apiUrl: '" + API + "'"))
        pg.route('**/js/config.js*', cfg); pg.route(API + '/**', fake(json.dumps(where)))
        pg.goto(U + '#/new'); pg.wait_for_selector('#city'); pg.wait_for_timeout(1200)
        check('where', pg.input_value('#city') == want, where['city'] + ' -> ' + repr(pg.input_value('#city')))
        # a home page occasion goes straight to the looks when the city is known, and waits on the basics when it isn't
        pg.goto(U + '#/'); pg.wait_for_selector('.hero'); pg.click('.hero a[data-hchip=birthday]')
        if want:
            pg.wait_for_selector('.concept', timeout=30000); check('home', '/concepts' in pg.url, where['city'] + ': Birthday on the home page goes straight to the looks')
        else:
            pg.wait_for_timeout(1500); check('home', '/new/2/' in pg.url and pg.get_attribute('[data-occ2=birthday]', 'aria-pressed') == 'true', 'no city found: the basics screen waits with Birthday picked')
        pg.close()
    b.close()
print('FAILURES:', F if F else 'none')
