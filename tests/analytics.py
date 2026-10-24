# Analytics: the live site sends the right events and never personal details; local and Do Not Track send nothing: python3 tests/analytics.py
import os, json, mimetypes
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
problems = []
def check(ok, msg):
    if not ok: problems.append(msg)
def serve(route):
    path = route.request.url.split('facecouture.app/eventcouture/')[1].split('#')[0].split('?')[0] or 'index.html'
    f = os.path.join(ROOT, path)
    if not os.path.isfile(f): return route.fulfill(status=404, body='')
    route.fulfill(status=200, body=open(f, 'rb').read(), headers={'content-type': mimetypes.guess_type(f)[0] or 'application/octet-stream'})
U = 'https://facecouture.app/eventcouture/'
SECRET = ['Ava Stone', 'secret garden for grandma', 'Maya']
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, tag in [(390, 'phone'), (1280, 'desktop')]:
        ctx = b.new_context(viewport={'width': w, 'height': 860}); pg = ctx.new_page()
        pg.route('https://facecouture.app/eventcouture/**', serve)
        pg.route('https://www.googletagmanager.com/**', lambda r: r.fulfill(status=200, body='', headers={'content-type': 'text/javascript'}))
        pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, body='', headers={'content-type': 'text/css'}))
        pg.route('**/*.workers.dev/**', lambda r: r.abort())
        pg.goto(U); pg.wait_for_timeout(700)
        ev = lambda: [list(x) for x in pg.evaluate("(window.dataLayer||[]).map(a => Array.from(a)).filter(a => a[0]==='event')")]
        pg.click('[data-scroll=inspo]'); pg.click('#ifilter [data-t=graduation]'); pg.click('[data-inspo=emerald-garden-graduation]'); pg.click('.sheet #useInspo'); pg.wait_for_selector('.inspo-chosen')
        pg.fill('#text', 'secret garden for grandma'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#city', 'Houston, TX'); pg.fill('#budget', '6000'); pg.fill('#name', 'Maya'); pg.click('#next'); pg.wait_for_selector('#go'); pg.click('#go'); pg.wait_for_selector('.concept h3'); pg.wait_for_timeout(400)
        pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(300)
        base = pg.url.split('#')[1]
        pg.goto(U + '#' + base + '/guests'); pg.wait_for_timeout(300); pg.fill('#gn', 'Ava Stone'); pg.click('#addg button'); pg.wait_for_timeout(200)
        pg.goto(U + '#' + base + '/style'); pg.wait_for_timeout(400)
        with ctx.expect_page() as np: pg.click('.get-look a[href*=amazon] >> nth=0')
        np.value.close()
        names = [e[1] for e in ev()]
        for want in ['page_view', 'inspiration_filter', 'inspiration_open', 'inspiration_used', 'details_done', 'concepts_shown', 'concept_chosen', 'plan_kept', 'guest_added', 'shop_click']:
            check(want in names, tag + ': missing event ' + want + ' in ' + str(names))
        blob = json.dumps(pg.evaluate('(window.dataLayer||[]).map(a => Array.from(a))'), default=str)
        for sct in SECRET: check(sct not in blob, tag + ': personal text sent: ' + sct)
        check(base.split('/')[2] not in blob, tag + ': event id sent')
        paths = [e[2]['page_path'] for e in ev() if e[1] == 'page_view']
        check('/eventcouture/plan/style' in paths and '/eventcouture/home' in paths, tag + ': page paths ' + str(paths))
        check(all(e[2].get('app_name') == 'event_couture' for e in ev()), tag + ': event without app_name')
        dd = [e[2] for e in ev() if e[1] == 'details_done'][0]
        check(dd.get('event_type') == 'graduation' and dd.get('start') == 'inspiration_photo' and dd.get('budget_band') == '5001-10000', tag + ': details_done ' + str(dd))
        sc = [e[2] for e in ev() if e[1] == 'shop_click'][0]; check(sc.get('list') == 'get_this_look' and sc.get('store') == 'amazon', tag + ': shop_click ' + str(sc))
        ctx.close()
    # Do Not Track and local copies send nothing
    ctx = b.new_context(extra_http_headers={'DNT': '1'}); pg = ctx.new_page(); pg.add_init_script("Object.defineProperty(navigator,'doNotTrack',{get:()=>'1'})")
    pg.route('https://facecouture.app/eventcouture/**', serve); pg.route('https://www.googletagmanager.com/**', lambda r: r.fulfill(status=200, body=''))
    pg.goto(U); pg.wait_for_timeout(500); check(not pg.evaluate('window.dataLayer && window.dataLayer.length'), 'Do Not Track still sent data')
    pg.goto('http://localhost:8765/'); pg.wait_for_timeout(500); check(not pg.evaluate('window.dataLayer && window.dataLayer.length'), 'local copy sent data')
    b.close()
print('\n'.join(problems) if problems else 'analytics ok')
