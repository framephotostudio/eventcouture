# Step tracker, finished plan page and optional gift list: python3 tests/finished_plan.py [shots_dir]
import sys
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
U = 'http://localhost:8765/'; SH = sys.argv[1] if len(sys.argv) > 1 else None
problems = []
def check(ok, msg):
    if not ok: problems.append(msg)
with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (390, 1280):
        t = str(w) + ': '; pg = b.new_page(viewport={'width': w, 'height': 900}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(U + '#/inspiration/kids-birthday'); pg.wait_for_selector('#igrid'); pg.click('[data-inspo=princess-castle]'); pg.click('.sheet #useInspo'); pg.wait_for_selector('.inspo-chosen')
        pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#city', 'Houston, TX'); pg.click('#next'); pg.wait_for_selector('.concept'); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.wait_for_timeout(300)
        base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
        ov = pg.inner_text('#tab')
        check('Your plan, step by step' in ov and '1 of 6 done' in ov and 'Next: Set your date' in ov, t + 'tracker: ' + ov[:300])
        if SH: pg.query_selector('.steps-card').scroll_into_view_if_needed(); pg.screenshot(path=SH + '/steps-%d.png' % w)
        pg.click('[data-step=when]'); pg.wait_for_selector('.sheet #wd'); pg.fill('.sheet #wd', '2027-04-17'); pg.click('.sheet #ok'); pg.wait_for_timeout(300)
        check('2 of 6 done' in pg.inner_text('#tab'), t + 'date step did not tick')
        pg.goto(U + base + '/plan'); pg.wait_for_timeout(300); check('Keep my plan to see it' in pg.inner_text('#tab'), t + 'finished plan not gated in preview')
        pg.click('[data-keep]'); pg.click('.sheet #keepPay'); pg.wait_for_timeout(300); pg.goto(U + base + '/plan'); pg.wait_for_timeout(300); fp = pg.inner_text('#tab')
        for want in ['Your look', 'Budget', 'Venue and vendors', 'Day-of schedule', 'Estimated total', 'Still to book']:
            check(want in fp, t + 'finished plan missing ' + want)
        check(pg.query_selector('#pdfPlan') is not None and pg.query_selector('#mailPlan') is not None and pg.query_selector('#sharePlan') is not None, t + 'save/share buttons missing')
        check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 1, t + 'finished plan scrolls sideways')
        if SH: pg.screenshot(path=SH + '/finished-%d.png' % w, full_page=True)
        pg.goto(U + base + '/invite'); pg.wait_for_timeout(300); inv = pg.inner_text('#tab')
        check('Registry' not in inv and 'Add a gift list (optional)' in inv, t + 'kids birthday registry not optional')
        check('Invitation' in pg.inner_text('.rail') or 'Invitation' in pg.inner_text('main'), t + 'tab label')
        pg.click('#giftOn'); pg.wait_for_timeout(300); check('Registry' in pg.inner_text('#tab'), t + 'gift list did not turn on')
        pg.click('#copy'); pg.wait_for_timeout(300); pg.goto(U + base); pg.wait_for_timeout(300); check('4 of 6 done' in pg.inner_text('#tab') or '5 of 6' in pg.inner_text('#tab'), t + 'invite/keep steps: ' + pg.inner_text('.steps-card'))
        check(not errs, t + 'errors ' + str(errs[:2]))
        pg.close()
    b.close()
print('\n'.join(problems) if problems else 'finished plan ok')
