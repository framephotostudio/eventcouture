# Missing something? Anything removed by mistake (even the venue) comes back from "+ Add an item" on the package page: python3 tests/add_item.py <folder>
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'culture_pkg.py')).read().split('with sync_playwright() as p:')[0])
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, n in [(390, 844, 'phone'), (1280, 900, 'desktop')]:
        pg = b.new_page(viewport={'width': w, 'height': h}); e = []; pg.on('pageerror', lambda x: e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U + '#/new/1'); pg.wait_for_selector('#text'); pg.fill('#text', 'ivory and gold romantic wedding'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#type', label='Wedding'); pg.select_option('#city', 'Los Angeles, CA'); pg.fill('#guests', '150'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U + base + '/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.wait_for_timeout(800)
        pg.click('[data-pkx=venue]'); pg.wait_for_timeout(800)
        if pg.query_selector('.sheet [data-close], .sheet button.gold'): pass
        gone = not pg.query_selector('tr[data-pkrow="venue"]'); check(n, gone, 'venue removed with x')
        pg.click('.pkg-x-note [data-pkextras]'); pg.wait_for_selector('[data-pkadd]')
        txt = pg.inner_text('.sheet') if pg.query_selector('.sheet') else pg.content()
        check(n, 'main items' in txt.lower(), 'pop-up lists main items first')
        pg.click('[data-pkadd=venue]'); pg.wait_for_selector('tr[data-pkrow="venue"]', timeout=15000); pg.wait_for_timeout(500)
        cells = [x.inner_text() for x in pg.query_selector_all('tr[data-pkrow="venue"] td > b')]
        npk = len(pg.query_selector_all('.pkg-cmp thead th.pk-colh:not(.pk-addcol)')); check(n, npk >= 1 and len(cells) == npk, 'venue back in every package: ' + str(cells) + ' of ' + str(npk))
        pg.goto(U + base + '/budget'); pg.wait_for_timeout(500); pg.evaluate("document.querySelectorAll('details#budgetMore').forEach(d => d.open = true)"); pg.wait_for_selector('[data-budgetadd]'); pg.click('[data-budgetadd]'); pg.wait_for_selector('[data-pkadd=cleanup]'); pg.click('[data-pkadd=cleanup]'); pg.wait_for_timeout(500)
        check(n, 'Setup and cleanup crew' in pg.inner_text('#tab'), '+ Add an item on the budget adds a line (setup and cleanup crew)')
        check(n, not e, 'no page errors ' + str(e[:2]))
        sw = pg.evaluate('document.documentElement.scrollWidth > innerWidth'); check(n, not sw, 'no sideways scroll')
    b.close()
print('FAILURES:', F or 'none'); sys.exit(1 if F else 0)
