# Realistic customer scenarios, end to end in the browser: python3 tests/scenarios.py
# Checks that what the host enters is what the plan uses, totals are honest, and the plan is free until kept.
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import re
U = 'http://localhost:8765/'
problems = []

def money(t):
    m = re.search(r'\$([\d,]+)', t); return int(m.group(1).replace(',', '')) if m else None

def run(pg, text, typ, guests, setting, time='18:00', budget=None, alcohol=None, payer=None, guests_first=True, keep=True):
    pg.goto(U + '#/new/1'); pg.wait_for_timeout(250)
    pg.fill('#text', text); pg.click('#next'); pg.wait_for_timeout(250)
    if guests_first:  # the bug ChatGPT found: typing guests, then choosing the type, reset the number
        pg.fill('#guests', str(guests)); pg.fill('#expected', str(guests)); pg.select_option('#type', typ)
    else:
        pg.select_option('#type', typ); pg.fill('#guests', str(guests)); pg.fill('#expected', str(guests))
    pg.fill('#time', time)
    if budget: pg.fill('#budget', str(budget))
    if alcohol: pg.click(f'#alcohol [data-v={alcohol}]')
    if payer: pg.click(f'#payer [data-v={payer}]')
    pg.select_option('#city', 'Houston, TX'); pg.click(f'#setting [data-v={setting}]')
    names = pg.inner_text('#names')
    pg.click('#next'); pg.wait_for_selector('.concept')
    review = pg.evaluate("(() => { var id = location.hash.split('/')[2]; var e = JSON.parse(localStorage['ec.events'])[id]; return e.guests + (e.guests === 1 ? ' person invited' : ' people invited'); })()"); pg.wait_for_timeout(250)
    pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.wait_for_timeout(250)
    head = pg.inner_text('.plan-head'); base = pg.url.rstrip('/')
    if keep:
        pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(250)
    return names, review, head, base

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))

    # 1. ChatGPT's test: lavender birthday dinner, 10 people, Houston restaurant, $1,000 max, no alcohol
    names, review, head, base = run(pg, 'lavender birthday dinner for 10, no alcohol', 'birthday', 10, 'restaurant', '19:00', 1000, 'none', keep=False)
    if '10 people invited' not in review: problems.append('1: review lost guest count: ' + review)
    if '10 guests' not in head: problems.append('1: plan shows wrong guests: ' + head)
    if 'brunch' in names.lower(): problems.append('1: name ideas mention brunch: ' + names)
    if money(head) > 1000: problems.append('1: over the $1,000 maximum: ' + head)
    if 'Fits your $1,000 budget' not in head: problems.append('1: budget label: ' + head)
    if not pg.query_selector('#keepBtn'): problems.append('1: no Keep my plan button on a free plan')
    pg.goto(base + '/timeline'); pg.wait_for_timeout(250)
    if not pg.query_selector('.lock-card'): problems.append('1: free preview shows the full timeline')
    pg.goto(base + '/guests'); pg.wait_for_timeout(250)
    if 'Keep your plan' not in pg.inner_text('#tab'): problems.append('1: guest list open before keeping')
    pg.goto(base + '/extras'); pg.wait_for_timeout(250)
    if '$9.99' not in pg.inner_text('#tab'): problems.append('1: pass for 10 guests is not $9.99')
    pg.goto(base + '/invite'); pg.wait_for_timeout(250); pg.click('#copy'); pg.wait_for_timeout(250)
    if not pg.query_selector('#keepPay'): problems.append('1: sharing works without keeping the plan')
    else:
        pg.click('#keepPay'); pg.wait_for_timeout(300)
        pg.goto(base); pg.wait_for_timeout(250)
        if pg.query_selector('#keepBtn'): problems.append('1: still asks to keep after keeping')
        pg.goto(base + '/budget'); pg.wait_for_timeout(250); t = pg.inner_text('#tab')
        if re.search(r'beer|wine|cocktail', t, re.I) or 'Non-alcoholic' not in t: problems.append('1: alcohol preference ignored')
        if pg.query_selector('.lock-card'): problems.append('1: budget still locked after keeping')

    # 2. restaurant brunch, everyone pays their own
    names, review, head, base = run(pg, 'girls brunch, everyone pays for themselves', 'brunch', 8, 'restaurant', '11:00', None, 'wine', 'own')
    pg.goto(base + '/budget'); pg.wait_for_timeout(250); t = pg.inner_text('#tab')
    if 'Everyone pays their own' not in t: problems.append('2: no per-person note for pay-your-own')
    pg.goto(base + '/timeline'); pg.wait_for_timeout(250)
    if 'birthday' in pg.inner_text('#tab').lower(): problems.append('2: brunch timeline has a birthday song')

    # 3. home baby shower
    names, review, head, base = run(pg, 'baby shower at my house, sage and cream', 'baby-shower', 25, 'home', '13:00')
    pg.goto(base + '/budget'); pg.wait_for_timeout(250); t = pg.inner_text('#tab')
    if 'Venue rental' in t: problems.append('3: home shower charges a venue')

    # 4. outdoor celebration
    names, review, head, base = run(pg, 'outdoor graduation party in the backyard park', 'graduation', 60, 'outdoor', '15:00')
    pg.goto(base + '/budget'); pg.wait_for_timeout(250); t = pg.inner_text('#tab')
    if 'Tent' not in t: problems.append('4: outdoor plan missing tent')

    # 5. unrealistic budget
    names, review, head, base = run(pg, 'wedding, ivory and gold', 'wedding', 150, 'indoor', '17:00', 5000)
    if 'over your budget' not in head: problems.append('5: impossible budget not labeled over: ' + head)

    # 6. tier boundary: 26 guests should be the 26-75 pass
    names, review, head, base = run(pg, 'birthday party', 'birthday', 26, 'indoor', '19:00')
    pg.goto(base + '/extras'); pg.wait_for_timeout(250)
    if '26 to 75 guests' not in pg.inner_text('#tab'): problems.append('6: 26 guests not on the 26-75 pass')

    # 7. choosing the type first, then guests, also keeps the number
    names, review, head, base = run(pg, 'dinner party', 'dinner', 14, 'privateRoom', '19:00', guests_first=False)
    if '14 guests' not in head: problems.append('7: guest count lost: ' + head)

    if errs: problems.append(errs)
    b.close()
print(problems or 'all scenarios ok')
