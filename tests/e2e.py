# End-to-end run: python3 tests/e2e.py [outdir]
import sys, os, json
from playwright.sync_api import sync_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ec-shots'
os.makedirs(OUT, exist_ok=True)
BASE = 'http://localhost:8765/'
HERE = os.path.dirname(os.path.abspath(__file__))
TABS = ['overview', 'budget', 'places', 'vendors', 'food', 'style', 'timeline', 'guests', 'votes', 'invite', 'after', 'extras']
problems = []

def run(p, name, viewport, scheme):
    b = p.chromium.launch()
    ctx = b.new_context(viewport=viewport, color_scheme=scheme, device_scale_factor=1)
    page = ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
    page.goto(BASE)
    page.wait_for_selector('.hero')
    page.screenshot(path=f'{OUT}/{name}-home.png', full_page=True)
    # wizard step 1
    page.click('text=Plan my event')
    page.set_input_files('#files', [os.path.join(HERE, 'pink.jpg'), os.path.join(HERE, 'noir.jpg')])
    page.wait_for_selector('.photo img')
    page.locator('.photo img').first.click(position={'x': 40, 'y': 60})
    page.click('.sheet [data-v="Colors"]')
    page.fill('#text', 'blush pink and gold girls brunch, chic and girly')
    page.screenshot(path=f'{OUT}/{name}-step1.png', full_page=True)
    page.click('#next')
    # step 2
    page.wait_for_selector('#type')
    page.select_option('#type', 'birthday')
    page.fill('#name', "Maya's 30th")
    page.select_option('#city', 'Houston, TX')
    page.fill('#date', '2026-12-19')
    page.fill('#guests', '30'); page.fill('#expected', '26'); page.fill('#budget', '6000')
    page.fill('#start', '1600 Main St, Houston')
    page.click('#next'); page.wait_for_timeout(200)
    if '#/new/3' in page.url: problems.append('continued without choosing restaurant or venue')
    page.click('#setting [data-v=indoor]')
    page.screenshot(path=f'{OUT}/{name}-step2.png', full_page=True)
    page.click('#next')
    page.wait_for_selector('#pay')
    txt = page.inner_text('.price-big')
    if txt.strip() != '$19.99': problems.append(f'{name}: pass price shows {txt}')
    page.screenshot(path=f'{OUT}/{name}-step3.png', full_page=True)
    page.click('#pay')
    page.wait_for_selector(".concept"); page.wait_for_timeout(450)
    page.screenshot(path=f'{OUT}/{name}-concepts.png', full_page=True)
    first = page.inner_text('.concept h3')
    if 'Blush' not in first and 'Pastel' not in first: problems.append(f'{name}: first concept {first}')
    page.click('.concept button.gold')
    page.wait_for_selector('.tier')
    url = page.url.split('#')[0] + '#' + page.url.split('#')[1]
    evbase = page.url.split('#')[1].rstrip('/')
    for t in TABS:
        page.goto(BASE + '#' + evbase + '/' + t)
        page.wait_for_selector('#tab')
        page.wait_for_timeout(450)
        if t == 'guests':
            for n in ['Ava', 'Bri', 'Cam']:
                page.fill('#gn', n); page.fill('#gp', '1'); page.click('#addg button')
            page.select_option('[data-st]', 'yes')
            page.click('#seat')
        if t == 'votes':
            page.fill('#pq', 'Which date works best?'); page.fill('#po', 'Dec 19\nDec 20'); page.click('#addp button')
            page.click('[data-vote="0:0"]')
        if t == 'invite':
            page.fill('[data-pay="venmo"]', 'maya-host'); page.click('#savePay')
            page.fill('#rn', 'Champagne flutes'); page.fill('#rp', '40'); page.click('#radd button')
        if t == 'overview':
            page.fill('#q', 'make it 25 guests and skip the photographer'); page.click('#ask button'); page.wait_for_timeout(1400)
        sw = page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
        if sw: problems.append(f'{name}: horizontal scroll on {t}')
        page.screenshot(path=f'{OUT}/{name}-tab-{t}.png', full_page=True)
    # guest page
    eid = evbase.split('/')[2]
    page.goto(BASE + '#/g/' + eid)
    page.wait_for_selector('#rsvp')
    page.fill('#rsvp #rn', 'Dee'); page.click('#rd .chip >> nth=1'); page.click('#rsvp button.gold')
    page.wait_for_timeout(200)
    page.screenshot(path=f'{OUT}/{name}-guest.png', full_page=True)
    for r in ['#/vendors', '#/help', '#/events', '#/sample/4', '#/sample/4/budget', '#/privacy']:
        page.goto(BASE + r); page.wait_for_timeout(250)
        if page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1'): problems.append(f'{name}: horizontal scroll on {r}')
        page.screenshot(path=f'{OUT}/{name}-{r.replace("#/","").replace("/","-")}.png', full_page=True)
    if errs: problems.append(f'{name}: console errors: {errs[:5]}')
    b.close()

with sync_playwright() as p:
    run(p, 'phone-light', {'width': 390, 'height': 844}, 'light')
    run(p, 'desk-dark', {'width': 1280, 'height': 900}, 'dark')
print(json.dumps(problems, indent=1) if problems else 'no problems found')
