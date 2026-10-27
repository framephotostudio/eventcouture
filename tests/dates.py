"""Date range when she has no exact date, and the venue-area step. Phone and desktop."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import _open
from playwright.sync_api import sync_playwright
U = 'http://localhost:8765/'; problems = []
def check(c, m):
    if not c: problems.append(m); print('FAIL', m)
with sync_playwright() as p:
    b = p.chromium.launch()
    for vp, size in [('phone', {'width': 390, 'height': 844}), ('desk', {'width': 1280, 'height': 900})]:
        ctx = b.new_context(viewport=size); ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=U.rstrip('/')); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        # range in the form
        pg.goto(U + '#/new/1'); pg.fill('#text', 'garden bridal shower'); pg.click('#next'); pg.select_option('#type', 'bridal-shower'); pg.select_option('#city', 'Houston, TX'); pg.click('#setting [data-v=indoor]')
        pg.check('#dateFlex'); pg.fill('#dateFrom', '2099-05-01'); pg.fill('#dateTo', '2099-06-30'); pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        head = pg.inner_text('.plan-head'); check('Between May 1, 2099 and Jun 30, 2099' in head, f'{vp}: range in plan head: {head[:200]}')
        t = pg.inner_text('#tab'); check('Choose the area for your venue' in t, f'{vp}: area step on the summary')
        pg.evaluate("document.querySelector('[data-step=when]') && 0")
        pg.goto(pg.url); pg.wait_for_timeout(200)
        if pg.query_selector('[data-step=area]'):
            pg.click('[data-step=area]'); pg.wait_for_selector('.sheet #sArea'); pg.select_option('.sheet #sArea', 'River Oaks'); pg.click('.sheet #ok'); pg.wait_for_timeout(300)
            check('River Oaks' in pg.inner_text('#tab'), f'{vp}: area step saves the area')
        else: check(False, f'{vp}: area is not the next step')
        # exact date via the sheet, then back to a range
        pg.click('#when'); pg.wait_for_selector('.sheet #wmode'); check(pg.get_attribute('#wmode [data-m=range]', 'aria-pressed') == 'true', f'{vp}: sheet opens on range')
        pg.click('#wmode [data-m=one]'); pg.fill('.sheet #wd', '2099-05-20'); pg.click('.sheet #ok'); pg.wait_for_timeout(300)
        check('May 20' in pg.inner_text('.plan-head') and 'Between' not in pg.inner_text('.plan-head'), f'{vp}: exact date replaces range')
        pg.click('#when'); pg.wait_for_selector('.sheet #wmode'); pg.click('#wmode [data-m=range]'); pg.fill('.sheet #wf', '2099-07-10'); pg.fill('.sheet #wl', '2099-07-01'); pg.click('.sheet #ok'); pg.wait_for_timeout(200)
        check(pg.query_selector('.sheet #ok') is not None, f'{vp}: latest before earliest is refused')
        pg.fill('.sheet #wl', '2099-08-15'); pg.click('.sheet #ok'); pg.wait_for_timeout(300)
        check('Between Jul 10, 2099 and Aug 15, 2099' in pg.inner_text('.plan-head'), f'{vp}: range saved from the sheet')
        base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U + base + '/timeline'); pg.wait_for_timeout(300); check('2099' in pg.inner_text('#tab') or 'Jul' in pg.inner_text('#tab'), f'{vp}: checklist dates follow the range')
        check(not errs, f'{vp}: page errors {errs}')
        ctx.close()
    b.close()
print('dates ok' if not problems else f'{len(problems)} problems'); sys.exit(1 if problems else 0)
