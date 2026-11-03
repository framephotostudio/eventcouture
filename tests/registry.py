# Gift registry: its own page, one-tap gift ideas with store links, paste any store link (name filled in), cash funds; guests see it on the event page: python3 tests/registry.py <folder>
import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'culture_pkg.py')).read().split('with sync_playwright() as p:')[0])
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, hh, n in [(390, 844, 'phone'), (1280, 900, 'desktop')]:
        pg = b.new_page(viewport={'width': w, 'height': hh}); e = []; pg.on('pageerror', lambda x: e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U + '#/new/1'); pg.wait_for_selector('#text'); pg.fill('#text', 'ivory and gold romantic wedding'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#type', label='Wedding'); pg.select_option('#city', 'Houston, TX'); pg.fill('#guests', '150'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U + base + '/invite'); pg.wait_for_selector('.reg-pointer'); check(n, 'Start my registry' in pg.inner_text('.reg-pointer'), 'invitation page points to the registry')
        nav = pg.inner_text('body'); check(n, 'Gift registry' in nav and 'Guests and seating' in nav and 'wedding website' in nav, 'menu shows Gift registry, Guests and seating, Invitation and wedding website')
        pg.click('.reg-pointer a'); pg.wait_for_selector('[data-gidea]')
        pg.click('[data-gidea="Stand mixer"]'); pg.wait_for_timeout(300); pg.click('[data-gidea="Air fryer"]'); pg.wait_for_timeout(300); pg.click('[data-fidea="Honeymoon fund"]'); pg.wait_for_timeout(300)
        pg.fill('#ru', 'https://www.amazon.com/Le-Creuset-Enameled-Cast-Iron-Signature/dp/B00005QFQX'); pg.dispatch_event('#ru', 'change'); check(n, 'Le Creuset' in pg.input_value('#rn'), 'pasting a store link fills in the gift name: ' + pg.input_value('#rn'))
        pg.fill('#rp', '380'); pg.click('#radd button'); pg.wait_for_timeout(300)
        ev = list(json.loads(pg.evaluate("localStorage.getItem('ec.events')")).values())[0]; items = ev['registry']['items']
        check(n, [i['name'] for i in items][:2] == ['Stand mixer', 'Air fryer'] and 'amazon.com' in items[0]['url'] and 'tag=eventcouture-20' in items[0]['url'] and items[0]['price'] == 400, 'one-tap gifts come with a store link and price')
        check(n, len(items) == 3 and items[2]['price'] == 380 and ev['registry']['funds'][0]['name'] == 'Honeymoon fund', 'pasted gift and the honeymoon fund saved')
        check(n, pg.query_selector('[data-gidea="Stand mixer"]') is None, 'an added idea leaves the one-tap list')
        pg.goto(U + '#/g/' + ev['id']); pg.wait_for_timeout(1200); g = pg.inner_text('body'); check(n, 'Stand mixer' in g and 'Honeymoon fund' in g, 'guests see the registry on the event page')
        # a birthday: registry is optional
        pg.goto(U + base + '/registry'); pg.wait_for_selector('h3')
        check(n, not e, 'no page errors ' + str(e[:2])); check(n, not pg.evaluate('document.documentElement.scrollWidth > innerWidth'), 'no sideways scroll')
        pg.screenshot(path=f'{OUT}/registry_{n}.png', full_page=True); pg.close()
    b.close()
print('FAILURES:', F or 'none'); sys.exit(1 if F else 0)
