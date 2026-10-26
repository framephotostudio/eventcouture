"""Formal invitation written for each event: wording, names, formal date, reply date, own wording, guest view. Phone and desktop."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import _open
from playwright.sync_api import sync_playwright
U = 'http://localhost:8765/'; OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp'; problems = []
def check(c, m):
    if not c: problems.append(m); print('FAIL', m)
def make(pg, text, typ, culture=None):
    pg.goto(U + '#/new/1'); pg.fill('#text', text); pg.click('#next')
    if culture: pg.select_option('#type', label=culture)
    else: pg.select_option('#type', typ)
    pg.select_option('#city', 'Houston, TX'); pg.fill('#date', '2099-06-13'); pg.fill('#time', '18:00'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
    pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    pg.evaluate("(()=>{var a=JSON.parse(localStorage.getItem('ec.events'));var e=Array.isArray(a)?a[a.length-1]:Object.values(a).pop();e.paid={price:0};localStorage.setItem('ec.events',JSON.stringify(a))})()")
    base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2]); pg.goto(U + base + '/invite'); pg.reload(); pg.wait_for_selector('#invCard'); return base
with sync_playwright() as p:
    b = p.chromium.launch()
    for vp, size in [('phone', {'width': 390, 'height': 844}), ('desk', {'width': 1280, 'height': 900})]:
        pg = b.new_page(viewport=size); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        base = make(pg, 'ivory and gold wedding with candles', 'wedding', 'Arabic wedding')
        pg.fill('#invNames', 'Sara Haddad & Omar Khalil'); pg.wait_for_timeout(300); c = pg.inner_text('#invCard')
        check('With the blessing of God and their families' in c and 'Sara Haddad & Omar Khalil' in c and 'request the honour of your presence' in c.lower() or 'REQUEST THE HONOUR' in c, f'{vp}: wedding wording {c[:200]}')
        check('the thirteenth of June'.lower() in c.lower() and 'two thousand ninety-nine' in c.lower() and "six o’clock in the evening" in c.lower(), f'{vp}: formal date/time {c}')
        check('Kindly reply by May 14' in c, f'{vp}: reply-by date')
        check(pg.inner_text('.inv-mono') == 'S & O', f'{vp}: monogram')
        pg.evaluate("document.querySelector('#invCard').scrollIntoView({block:'start'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/invite-wedding-{vp}.png')
        pg.goto(U + '#/g/' + base.split('/')[2]); pg.wait_for_selector('.invite-card'); g = pg.inner_text('.invite-card')
        check('Sara Haddad & Omar Khalil' in g and 'Add to calendar' in g, f'{vp}: guest page shows the same invitation')
        # own wording
        pg.goto(U + base + '/invite'); pg.wait_for_selector('#invCard'); pg.click('.inv-edit > summary'); pg.click('.inv-own summary'); pg.fill('#invCustom', 'Mr. and Mrs. Haddad\ninvite you to the wedding of their daughter\nSara\nto\nOmar'); pg.click('#invUse'); pg.wait_for_timeout(300)
        c = pg.inner_text('#invCard'); check('Mr. and Mrs. Haddad' in c and 'Kindly reply by' in c, f'{vp}: own wording')
        # kids birthday
        make(pg, 'unicorn party for my daughter', 'kids-birthday'); pg.fill('#invNames', 'Mila'); pg.fill('#invAge', '6'); pg.wait_for_timeout(300); c = pg.inner_text('#invCard')
        check('Mila is turning 6' in c and 'unicorn birthday party' in c.lower() and 'Please RSVP by' in c and 'o’clock' not in c, f'{vp}: kids wording {c}')
        pg.evaluate("document.querySelector('#invCard').scrollIntoView({block:'start'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/invite-kids-{vp}.png')
        # milestone birthday
        make(pg, 'black and gold 40th birthday', 'milestone'); pg.fill('#invNames', 'Demah'); pg.fill('#invAge', '40'); pg.wait_for_timeout(300); c = pg.inner_text('#invCard')
        check('Demah’s Fortieth Birthday' in c, f'{vp}: milestone wording {c[:150]}')
        # baby shower without names still reads well
        make(pg, 'sage baby shower', 'baby-shower'); c = pg.inner_text('#invCard')
        check('baby shower' in c.lower() and 'parents-to-be' in c, f'{vp}: baby shower fallback {c[:150]}')
        check(not errs, f'{vp}: page errors {errs}')
        pg.close()
    b.close()
print('invitation ok' if not problems else f'{len(problems)} problems'); sys.exit(1 if problems else 0)
