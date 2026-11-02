# "Message" writes a ready-to-send inquiry naming Event Couture; Recommended listings link to "Your business?" (update or remove): python3 tests/vendor_message.py <folder>
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'culture_pkg.py')).read().split('with sync_playwright() as p:')[0])
from playwright.sync_api import sync_playwright
_B = B
def B(name, i=0): d = _B(name, i); d['phone'] = '(713) 555-01%02d' % i; return d   # Google now returns the business phone
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, n in [(390, 844, 'phone'), (1280, 900, 'desktop')]:
        ctx = b.new_context(viewport={'width': w, 'height': h}); ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=U.rstrip('/'))
        pg = ctx.new_page(); e = []; pg.on('pageerror', lambda x: e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U + '#/new/1'); pg.wait_for_selector('#text'); pg.fill('#text', 'ivory and gold romantic wedding'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#type', label='Wedding'); pg.select_option('#city', 'Houston, TX'); pg.fill('#guests', '150'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U + base + '/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.wait_for_timeout(800)
        pg.click('[data-pkmsg="catering"] >> nth=0'); pg.wait_for_selector('#vmsg')
        msg = pg.input_value('#vmsg'); check(n, msg.startswith('Hi ') and '150 guests' in msg and 'Houston' in msg and 'catering' in msg and 'I found you on Event Couture (eventcouture.app)' in msg, 'inquiry is written for her: ' + msg[:120])
        check(n, pg.query_selector('[data-vsms]') is not None and pg.query_selector('.sheet a[href^="tel:"]') is not None, 'businesses with a phone get Send as a text and Call')
        pg.fill('#vmsg', msg + ' Thanks!'); pg.click('[data-vcopy]'); pg.wait_for_timeout(300)
        clip = pg.evaluate('navigator.clipboard.readText()'); check(n, clip.endswith('Thanks!'), 'Copy copies her edited message')
        pg.click('.sheet [data-close]'); pg.wait_for_timeout(200)
        rec = pg.query_selector('.pkg-cmp a[href^="#/vendors/claim/"]')
        check(n, rec is not None, 'a Recommended pick shows "Your business?"')
        if rec:
            rb = pg.evaluate("(a) => a.closest('tr').getAttribute('data-pkrow')", rec)
            pg.click(f'[data-pkrow="{rb}"] [data-pkmsg] >> nth=0'); pg.wait_for_selector('#vmsg')
            ig = pg.query_selector('[data-vgo^="https://ig.me/m/"]'); check(n, ig is not None, 'Instagram vendors get "Copy and open Instagram"')
            pg.click('.sheet [data-close]'); name = pg.evaluate("(a) => decodeURIComponent(a.getAttribute('href').split('/')[3])", rec)
            rec.click(); pg.wait_for_selector('#v_name')
            check(n, 'Update your listing' in pg.inner_text('h2') and pg.input_value('#v_name') == name, 'claim page opens with their name filled in: ' + name)
            check(n, pg.query_selector('a[href^="mailto:"][href*="Remove"]') is not None, 'they can ask to be removed')
        check(n, not e, 'no page errors ' + str(e[:2]))
        check(n, not pg.evaluate('document.documentElement.scrollWidth > innerWidth'), 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none'); sys.exit(1 if F else 0)
