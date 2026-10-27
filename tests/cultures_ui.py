"""All cultural weddings in the browser: front page cards, detection from words, form choice. Phone and desktop."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import _open
from playwright.sync_api import sync_playwright
U = 'http://localhost:8765/'; OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp'; problems = []
def check(c, m):
    if not c: problems.append(m); print('FAIL', m)
SAY = {'Pakistani wedding': 'nikah and walima for 300', 'Mexican wedding': 'boda with mariachi and padrinos', 'Chinese wedding': 'red and gold wedding with a lion dance', 'Vietnamese wedding': 'wedding with ao dai and a tea ceremony',
  'Korean wedding': 'wedding with a pyebaek in hanbok', 'Filipino wedding': 'filipino wedding with lechon', 'Nigerian wedding': 'yoruba wedding with aso ebi', 'Greek wedding': 'greek orthodox wedding with stefana', 'Spanish wedding': 'wedding in spain style with flamenco', 'Russian wedding': 'russian wedding with a tamada', 'Moroccan wedding': 'moroccan wedding with a negafa', 'African American wedding': 'wedding where we jump the broom'}
with sync_playwright() as p:
    b = p.chromium.launch()
    for vp, size in [('phone', {'width': 390, 'height': 844}), ('desk', {'width': 1280, 'height': 900})]:
        pg = b.new_page(viewport=size); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(U); pg.wait_for_selector('#cultural')
        vis = lambda: len([c for c in pg.query_selector_all('.culture-card') if c.is_visible()])
        check(vis() == 6, f'{vp}: front page shows 6 cultural weddings first ({vis()})'); pg.click('#allCult'); pg.wait_for_timeout(200)
        check(vis() == 15, f'{vp}: See all shows 15 ({vis()})')
        pg.evaluate("document.querySelector('#cultural').scrollIntoView({block:'start'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/cultures-home-{vp}.png', full_page=False)
        check(pg.evaluate('document.documentElement.scrollWidth') <= size['width'] + 1, f'{vp}: sideways scroll')
        for name, text in SAY.items():
            pg.goto(U + '#/new/1'); pg.fill('#text', text); pg.click('#next'); pg.wait_for_selector('#type')
            got = pg.evaluate("document.querySelector('#type').selectedOptions[0].textContent")
            check(got == name, f'{vp}: "{text}" picked {got}, expected {name}')
            check(pg.is_visible('#music'), f'{vp}: {name} music choices')
        check(not errs, f'{vp}: errors {errs}')
        pg.close()
    b.close()
print('cultures ui ok' if not problems else f'{len(problems)} problems'); sys.exit(1 if problems else 0)
