# Customer message carries a private reply link written from her plan; vendor answers (only what they choose); answer shows in her package: python3 tests/vendor_reply.py <folder>
import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'culture_pkg.py')).read().split('with sync_playwright() as p:')[0])
from playwright.sync_api import sync_playwright
ASK = {}
def api2(route):
    u = route.request.url; h = {'access-control-allow-origin': '*'}
    if u.endswith('/api/ask/new'):
        b = json.loads(route.request.post_data); i = format(len(ASK) + 1, '020x'); ASK[i] = {'d': b['d'], 'reply': None}
        return route.fulfill(status=200, content_type='application/json', body=json.dumps({'id': i}), headers=h)
    if '/api/ask/' in u:
        i = u.split('/api/ask/')[1].split('/')[0]
        if u.endswith('/reply'):
            ASK[i]['reply'] = dict(json.loads(route.request.post_data), at=123); return route.fulfill(status=200, content_type='application/json', body='{"ok":true}', headers=h)
        return route.fulfill(status=200, content_type='application/json', body=json.dumps(ASK[i]), headers=h)
    return api(route)
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, hh, n in [(390, 844, 'phone'), (1280, 900, 'desktop')]:
        ASK.clear(); ctx = b.new_context(viewport={'width': w, 'height': hh}); ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=U.rstrip('/'))
        pg = ctx.new_page(); e = []; pg.on('pageerror', lambda x: e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api2)
        pg.goto(U + '#/new/1'); pg.wait_for_selector('#text'); pg.fill('#text', 'ivory and gold romantic wedding'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#type', label='Wedding'); pg.select_option('#city', 'Houston, TX'); pg.fill('#guests', '150'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U + base + '/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.wait_for_timeout(800)
        pg.click('[data-pkmsg="catering"] >> nth=0'); pg.wait_for_selector('#vmsg'); pg.wait_for_function("document.querySelector('#vmsg').value.includes('#/r/')")
        pg.fill('#vfirst', 'Layla'); pg.check('#vbud'); pg.wait_for_timeout(200); msg = pg.input_value('#vmsg')
        check(n, 'I’m Layla, planning a wedding in Houston' in msg and 'look' in msg and 'My budget for catering is about $' in msg and 'https://eventcouture.app/#/r/' in msg, 'message written from her plan, with name, look, budget and reply link: ' + msg)
        d = list(ASK.values())[0]['d']; check(n, d['need'] == 'Catering' and d['guests'] == 150 and 'Layla' not in json.dumps(d) and 'budget' not in json.dumps(d).lower(), 'server gets event details only, never her name or budget: ' + json.dumps(d))
        pg.click('[data-vcopy]'); pg.wait_for_timeout(300); pg.click('.sheet [data-close]'); pg.wait_for_timeout(300)
        check(n, 'waiting for a reply' in pg.inner_text('.pkg-cmp'), 'package shows she messaged them')
        rid = list(ASK.keys())[0]
        vp = ctx.new_page(); vp.on('pageerror', lambda x: e.append(str(x))); vp.route('**/js/config.js*', cfg); vp.route('http://api.test/**', api2)
        vp.goto(U + '#/r/' + rid); vp.wait_for_selector('#vrSend'); txt = vp.inner_text('#app')
        check(n, 'a client found you on event couture' in txt.lower() and 'Catering' in txt and 'About 150' in txt and 'Layla' not in txt, 'vendor sees the event, never her contact: ' + txt[:400].replace(chr(10),' | '))
        vp.click('#vrSend'); vp.wait_for_timeout(200); check(n, 'at least one answer' in vp.inner_text('#vrMsg'), 'empty reply asks for one answer')
        vp.click('[data-av=yes]'); vp.click('[data-pm=price]'); vp.fill('#vrPriceVal', '1800'); vp.fill('#vrPriceNote', 'for up to 150 guests'); vp.fill('#vrPhone', '(713) 555-0100'); vp.fill('#vrNote', 'Would love to cater!')
        vp.click('#vrSend'); vp.wait_for_selector('text=Your reply is on its way'); check(n, ASK[rid]['reply']['price'] == 1800, 'reply sent')
        vp.screenshot(path=f'{OUT}/vreply_{n}.png', full_page=True); vp.close()
        pg.wait_for_timeout(15500); pg.goto(U + base + '/overview'); pg.goto(U + base + '/budget'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.wait_for_selector('.ask-ok', timeout=8000)
        t = pg.inner_text('.ask-ok'); check(n, 'Available' in t and '$1,800' in t and '555-0100' in t, 'her package shows the reply: ' + t)
        check(n, not e, 'no page errors ' + str(e[:2]))
        check(n, not pg.evaluate('document.documentElement.scrollWidth > innerWidth'), 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none'); sys.exit(1 if F else 0)
