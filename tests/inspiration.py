# AI-generated inspiration photos: browse by occasion, plan from a photo, and the plan follows the photo: python3 tests/inspiration.py [shots_dir]
import sys
from playwright.sync_api import sync_playwright
U = 'http://localhost:8765/'
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
problems = []
def check(ok, msg):
    if not ok: problems.append(msg)
def shot(pg, name):
    if SHOTS: pg.screenshot(path='%s/%s.png' % (SHOTS, name), full_page=False)

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, tag in [(390, 'phone'), (1280, 'desktop')]:
        pg = b.new_page(viewport={'width': w, 'height': 860}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(U); pg.wait_for_timeout(500)
        pg.click('[data-scroll=inspo]'); pg.wait_for_timeout(600); shot(pg, tag + '-1-home-gallery')
        cards = pg.query_selector_all('#igrid [data-inspo]')
        check(len(cards) == 7, tag + ': home should show 7 photos, shows %d' % len(cards))
        check(all('AI-generated inspiration' in c.inner_text() for c in cards), tag + ': a photo is missing its AI label')
        overflow = pg.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
        check(not overflow, tag + ': page scrolls sideways')
        pg.click('#ifilter [data-t=graduation]'); pg.wait_for_timeout(300)
        names = [c.inner_text() for c in pg.query_selector_all('#igrid .iname')]
        check(len(names) >= 3 and all('Grad' in n for n in names[:3]), tag + ': graduation filter wrong: ' + str(names))
        shot(pg, tag + '-2-graduation')
        pg.click('#igrid [data-inspo=emerald-garden-graduation]'); pg.wait_for_selector('.sheet #useInspo'); pg.wait_for_timeout(400)
        st = pg.inner_text('.sheet')
        check('AI-generated inspiration' in st and 'Oversized grad cap' in st, tag + ': photo sheet missing label or details')
        shot(pg, tag + '-3-photo-sheet')
        pg.click('.sheet #useInspo'); pg.wait_for_selector('.inspo-chosen'); pg.wait_for_timeout(300)
        check('Emerald Garden Graduation' in pg.inner_text('main'), tag + ': chosen photo not on step 1')
        shot(pg, tag + '-4-step1')
        pg.click('#next'); pg.wait_for_selector('#type'); pg.wait_for_timeout(300)
        check(pg.input_value('#type') == 'graduation', tag + ': type not carried over')
        check(pg.query_selector('#setting [data-v=outdoor][aria-pressed=true]') is not None, tag + ': outdoor not preselected')
        check('Emerald Garden Graduation' in pg.inner_text('#names'), tag + ': photo name not offered as a name')
        pg.select_option('#city', 'Houston, TX'); pg.fill('#budget', '6000')
        pg.click('#next'); pg.wait_for_selector('#go'); check('Inspiration photo: Emerald Garden Graduation' in pg.inner_text('.confirm'), tag + ': review missing photo')
        pg.click('#go'); pg.wait_for_selector('.concept h3'); pg.wait_for_timeout(400)
        first = pg.inner_text('.concept h3 >> nth=0')
        check(first == 'Emerald Garden Graduation', tag + ': photo look not first: ' + first)
        check('AI-generated inspiration' in pg.inner_text('.concept >> nth=0'), tag + ': concept photo not labeled')
        shot(pg, tag + '-5-concepts')
        pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.wait_for_timeout(300)
        check('AI-generated inspiration' in pg.inner_text('.plan-head'), tag + ': plan photo not labeled')
        shot(pg, tag + '-6-plan')
        base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(300)
        pg.goto(U + base + '/style'); pg.wait_for_timeout(300); sty = pg.inner_text('#tab')
        check('Get this look' in sty and 'Oversized graduation cap prop' in sty and 'Find a florist' in sty, tag + ': photo pieces missing: ' + sty[:300])
        if pg.query_selector('.get-look'): pg.query_selector('.get-look').scroll_into_view_if_needed(); shot(pg, tag + '-8-get-look')
        check('emerald green and gold graduation' in sty.lower() or 'emerald' in pg.content().lower(), tag + ': shopping not in the photo colors')
        pg.goto(U + base); pg.wait_for_timeout(300); ov = pg.inner_text('#tab')
        check('grad cap' in ov.lower() or 'grad cap' in pg.inner_text('main').lower(), tag + ': photo details not in the plan')
        pg.goto(U + base + '/places'); pg.wait_for_timeout(300)
        check('Deco House' not in pg.inner_text('#tab'), tag + ': indoor venue shown for an outdoor party')
        # host's own colors win
        pg.goto(U + '#/inspiration/graduation'); pg.wait_for_timeout(400)
        pg.click('#igrid [data-inspo=emerald-garden-graduation]'); pg.click('.sheet #useInspo'); pg.wait_for_selector('.inspo-chosen')
        pg.fill('#text', 'same feel but navy and silver'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#city', 'Houston, TX'); pg.click('#next'); pg.wait_for_selector('#go'); pg.click('#go'); pg.wait_for_selector('.concept h3'); pg.wait_for_timeout(300)
        ns = [x.inner_text() for x in pg.query_selector_all('.concept h3')]
        check(ns[0] != 'Emerald Garden Graduation' and 'Emerald Garden Graduation' in ns, tag + ': host colors did not lead: ' + str(ns))
        # typed or spoken ideas: every named piece shows up to buy or hire
        pg.goto(U + '#/new/1'); pg.wait_for_timeout(300)
        pg.fill('#text', 'navy and gold 30th birthday with a balloon arch, peonies, a neon sign, velvet chairs and gold chargers')
        pg.set_input_files('#files', ['tests/pink.jpg']); pg.wait_for_timeout(1200)
        pg.click('#photos img'); pg.wait_for_selector('.sheet [data-v=Cake]'); pg.click('.sheet [data-v=Cake]'); pg.wait_for_timeout(200)
        pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#city', 'Houston, TX'); pg.click('#setting [data-v=indoor]')
        pg.click('#next'); pg.wait_for_selector('#go'); pg.click('#go'); pg.wait_for_selector('.concept h3'); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2]); pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(300)
        pg.goto(U + base + '/style'); pg.wait_for_timeout(300); sty = pg.inner_text('#tab')
        for want in ['Balloon arch', 'Arrangements with peonies', 'Custom neon sign', 'Velvet chairs', 'Gold charger plates', 'A cake like the one in your photo']:
            check(want in sty, tag + ': typed idea not in Get this look: ' + want)
        if pg.query_selector('.get-look'): pg.query_selector('.get-look').scroll_into_view_if_needed(); shot(pg, tag + '-9-typed-look')
        # new venue: Houston indoor birthday
        pg.goto(U + '#/inspiration/milestone'); pg.wait_for_timeout(300)
        pg.click('#igrid [data-inspo=black-and-gold-soiree]'); pg.click('.sheet #useInspo'); pg.wait_for_selector('.inspo-chosen'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#city', 'Houston, TX'); pg.fill('#guests', '120'); pg.fill('#expected', '120'); pg.click('#next'); pg.wait_for_selector('#go'); pg.click('#go'); pg.wait_for_selector('.concept h3'); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U + base + '/places'); pg.wait_for_timeout(300)
        check('Deco House River Oaks' in pg.inner_text('#tab'), tag + ': new Houston venue missing')
        if pg.query_selector('.new-venue'): pg.query_selector('.new-venue').scroll_into_view_if_needed(); shot(pg, tag + '-7-new-venue')
        check(not errs, tag + ': page errors ' + str(errs[:2]))
        pg.close()
    b.close()
import re
bad = re.findall(r'champagne|wine|cocktail|vineyard|prosecco|mimosa|martini', open('js/inspo.js').read().lower().replace('champagne-garden', ''))
check(not bad, 'alcohol words in inspiration photos: ' + str(set(bad)))
print('\n'.join(problems) if problems else 'inspiration ok')
