"""Canada: country first, then its cities; Canadian dollars, provincial tax, km, Canadian searches and shops. US unchanged."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import _open
from playwright.sync_api import sync_playwright
U = 'http://localhost:8765/'; OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp'; problems = []; qs = []
def check(c, m):
    if not c: problems.append(m); print('FAIL', m)
def api(route):
    u = route.request.url; h = {'access-control-allow-origin': '*'}
    if u.endswith('/api/places'): b = json.loads(route.request.post_data); qs.append(b['city']); route.fulfill(status=200, content_type='application/json', body='{"places":[]}', headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    elif '/api/vendors' in u: route.fulfill(status=200, content_type='application/json', body='{"vendors":[]}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r = route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''", "apiUrl: 'http://api.test'"))
def plan(pg, text, country=None, city=None, other=None):
    pg.goto(U + '#/new/1'); pg.fill('#text', text); pg.click('#next'); pg.wait_for_selector('#country')
    if country: pg.select_option('#country', country)
    if city: pg.select_option('#city', city)
    if other: pg.fill('#cityOther', other)
    if not pg.input_value('#type'): pg.select_option('#type', 'birthday')
    pg.click('#setting [data-v=indoor]'); pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    pg.evaluate("(()=>{var a=JSON.parse(localStorage.getItem('ec.events'));var e=Array.isArray(a)?a[a.length-1]:Object.values(a).pop();e.paid={price:0};localStorage.setItem('ec.events',JSON.stringify(a))})()")
    return '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
with sync_playwright() as p:
    b = p.chromium.launch()
    for vp, size in [('phone', {'width': 390, 'height': 844}), ('desk', {'width': 1280, 'height': 900})]:
        pg = b.new_page(viewport=size); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        # the city list follows the country
        pg.goto(U + '#/new/1'); pg.fill('#text', 'elegant black and gold birthday'); pg.click('#next'); pg.wait_for_selector('#country')
        us = pg.eval_on_selector_all('#city option', 'o => o.map(x => x.textContent)')
        check('Houston, TX' in us and 'Toronto, ON' not in us, f'{vp}: US list wrong')
        pg.select_option('#country', 'CA'); ca = pg.eval_on_selector_all('#city option', 'o => o.map(x => x.textContent)')
        check('Toronto, ON' in ca and 'Vancouver, BC' in ca and 'Houston, TX' not in ca and 'Other city in Canada' in ca, f'{vp}: Canada list wrong {ca}')
        check('CAD' in pg.inner_text('#budgetLbl'), f'{vp}: budget label not CAD')
        pg.select_option('#city', 'Toronto, ON'); areas = pg.eval_on_selector_all('#area option', 'o => o.map(x => x.textContent)')
        check('Yorkville' in areas, f'{vp}: Toronto areas missing {areas}')
        pg.screenshot(path=f'{OUT}/canada-form-{vp}.png')
        # Toronto plan
        base = plan(pg, 'elegant black and gold wedding', 'CA', 'Toronto, ON')
        pg.goto(U + base + '/budget'); pg.reload(); pg.wait_for_timeout(600); t = pg.inner_text('main')
        check('CA$' in t and 'HST (13%)' in t and 'Sales tax' not in t, f'{vp}: Toronto budget not in CAD with HST')
        pg.screenshot(path=f'{OUT}/canada-budget-{vp}.png')
        qs.clear(); pg.goto(U + base + '/vendors'); pg.wait_for_selector('[data-vendor]'); pg.click('[data-vendor] >> nth=0'); pg.wait_for_timeout(800)
        check(qs and all('Canada' in c for c in qs), f'{vp}: search city not Canadian {qs}')
        # a city she types in British Columbia gets BC tax
        base = plan(pg, 'garden brunch', 'CA', 'Other city in Canada', 'Kelowna, BC')
        pg.goto(U + base + '/budget'); pg.reload(); pg.wait_for_timeout(500); t = pg.inner_text('main')
        check('GST and PST (12%)' in t and 'CA$' in t, f'{vp}: Kelowna tax wrong')
        pg.goto(U + base + '/style'); pg.reload(); pg.wait_for_timeout(500)
        links = pg.eval_on_selector_all('a[href*="amazon."]', 'a => a.map(x => x.href)')
        check(links and all('amazon.ca' in l for l in links), f'{vp}: shopping not amazon.ca {links[:2]}')
        check('CA$' in pg.inner_text('main'), f'{vp}: shopping prices not CAD')
        # the description picks Canada
        pg.goto(U + '#/new/1'); pg.fill('#text', 'birthday dinner in Vancouver'); pg.click('#next'); pg.wait_for_selector('#country')
        check(pg.input_value('#country') == 'CA' and pg.input_value('#city') == 'Vancouver, BC', f'{vp}: Vancouver not picked from description')
        # US unchanged
        base = plan(pg, 'black and gold birthday', 'US', 'Houston, TX')
        pg.goto(U + base + '/budget'); pg.reload(); pg.wait_for_timeout(500); t = pg.inner_text('main')
        check('CA$' not in t and 'Sales tax (8.25%)' in t, f'{vp}: US budget changed')
        pg.goto(U + '#/pricing'); pg.wait_for_timeout(300); check('CA$' not in pg.inner_text('main'), f'{vp}: pricing page in CAD')
        check(not errs, f'{vp}: page errors {errs}')
        pg.close()
    b.close()
print('canada ok' if not problems else f'{len(problems)} problems'); sys.exit(1 if problems else 0)
