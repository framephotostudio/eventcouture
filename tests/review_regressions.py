# Problems an independent reviewer found, kept fixed: python3 tests/review_regressions.py
from playwright.sync_api import sync_playwright
U = 'http://localhost:8765/'
problems = []
def check(ok, msg):
    if not ok: problems.append(msg)

def start(pg, text, typ, guests, setting, budget=None, time=None, kids=False, payer=None, city='Houston, TX'):
    pg.goto(U + '#/new/1'); pg.wait_for_timeout(300); pg.fill('#text', text); pg.click('#next'); pg.wait_for_timeout(300)
    pg.select_option('#type', typ); pg.fill('#guests', str(guests)); pg.fill('#expected', str(guests)); pg.select_option('#city', city)
    if kids: pg.check('#kids'); pg.wait_for_timeout(100)
    if budget: pg.fill('#budget', str(budget))
    if time: pg.fill('#time', time)
    if payer: pg.click('#payer [data-v=%s]' % payer)
    pg.click('#setting [data-v=%s]' % setting)

def finish(pg):
    pg.click('#next'); pg.wait_for_selector('#go'); pg.click('#go'); pg.wait_for_selector('.concept'); pg.wait_for_timeout(300)
    names = [x.inner_text() for x in pg.query_selector_all('.concept h3')]
    pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(300)
    return names, '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])

with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (390, 1280):
        pg = b.new_page(viewport={'width': w, 'height': 900}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        tag = 'phone' if w < 500 else 'desktop'
        # kids birthday at home: daytime, kid-friendly looks, music and menu
        start(pg, 'unicorn rainbow 6th birthday party for my daughter at home', 'birthday', 20, 'home', 600, kids=True)
        check(pg.input_value('#time') < '17:00', tag + ': kids party defaults to the evening: ' + pg.input_value('#time'))
        names, base = finish(pg)
        check(not any(n.startswith(('Disco', 'Modern Noir', 'Moody', 'Old Hollywood')) for n in names), tag + ': adult look offered for a kids party: ' + str(names))
        pg.goto(U + base + '/style'); pg.wait_for_timeout(300); st = pg.inner_text('#tab')
        check('Kids’ Dance Party' in st, tag + ': kids party playlist missing')
        check('Taper candles' not in st, tag + ': candles on a kids shopping list')
        pg.goto(U + base + '/food'); pg.wait_for_timeout(300); check('Mini pizzas' in pg.inner_text('#tab'), tag + ': kids menu missing')
        pg.goto(U + base); pg.wait_for_timeout(300); ov = pg.inner_text('#tab')
        check('a home venue would close the gap' not in ov, tag + ': suggests a home venue for a home party')
        check('LED dance floor' not in ov and 'Evening' not in pg.inner_text('.plan-head'), tag + ': night-party wording at a kids party')
        # black-tie gala
        start(pg, 'black tie charity gala, black and gold, orchestra', 'gala', 300, 'indoor', 150000, time='19:00', city='New York, NY')
        names, base = finish(pg)
        pg.goto(U + base); pg.wait_for_timeout(300); ov = pg.inner_text('#tab')
        check('Black tie' in ov, tag + ': gala is not black tie')
        check('Neon sign' not in ov and 'neon sign' not in ov, tag + ': neon sign at a gala')
        check('Lands at your budget' not in ov, tag + ': says lands at budget with lots unused')
        pg.goto(U + base + '/budget'); pg.wait_for_timeout(300); check('Live music' in pg.inner_text('#tab'), tag + ': orchestra request did not add live music')
        pg.goto(U + base + '/food'); pg.wait_for_timeout(300); check('slider' not in pg.inner_text('#tab').lower(), tag + ': sliders at a black-tie gala')
        pg.goto(U + base + '/style'); pg.wait_for_timeout(300); check('Velvet Lounge' not in pg.inner_text('#tab'), tag + ': club playlist at a gala')
        # ivory and gold romantic wedding: ivory first, name follows the choice
        start(pg, 'ivory and gold romantic wedding', 'wedding', 200, 'indoor', 60000, city='Atlanta, GA')
        names, base = finish(pg)
        check(names and names[0].startswith('Ivory'), tag + ': ivory and gold did not lead: ' + str(names))
        pg.goto(U + base); pg.wait_for_timeout(300); check(pg.inner_text('.plan-head').startswith('Ivory'), tag + ': name does not follow the chosen look')
        # bachelorette splitting the cost: share = amount / people sharing
        start(pg, 'disco bachelorette dinner, splitting everything', 'bachelorette', 10, 'privateRoom', 3000, time='19:30', payer='shared', city='Nashville, TN')
        names, base = finish(pg)
        pg.goto(U + base + '/invite'); pg.wait_for_timeout(300)
        pg.fill('#stot', '2345'); pg.press('#stot', 'Tab'); pg.wait_for_timeout(300)
        check('$235' in pg.inner_text('#tab') or '$234' in pg.inner_text('#tab'), tag + ': share is not $2,345 / 10: ' + pg.inner_text('#tab')[-300:])
        pg.goto(U + base + '/timeline'); pg.wait_for_timeout(300); tl = pg.inner_text('#tab')
        check('Setup begins and vendors arrive' not in tl, tag + ': private dinner has venue setup in its schedule')
        pg.goto(U + base + '/food'); pg.wait_for_timeout(300); check('Round tables' not in pg.inner_text('#tab'), tag + ': private dinner counts tables and chairs')
        # brand-new wedding dated months out has nothing overdue
        start(pg, 'classic wedding', 'wedding', 120, 'indoor', 50000)
        pg.fill('#date', '2027-05-15'); names, base = finish(pg)
        pg.goto(U + base + '/timeline'); pg.wait_for_timeout(300); check('Overdue' not in pg.inner_text('#tab'), tag + ': brand-new plan shows overdue steps')
        # restaurant limits and refresh keeps typed details
        start(pg, 'birthday dinner', 'birthday', 120, 'restaurant')
        pg.click('#next'); pg.wait_for_timeout(300); check(pg.query_selector('#go') is None, tag + ': 120 people ordering off a menu was accepted')
        pg.fill('#guests', '35'); pg.fill('#budget', '2000'); pg.wait_for_timeout(700); pg.reload(); pg.wait_for_timeout(500)
        check(pg.input_value('#guests') == '35' and pg.input_value('#budget') == '2000', tag + ': refresh lost typed details')
        check(not errs, tag + ': page errors ' + str(errs[:2]))
        pg.close()
    b.close()
print('\n'.join(problems) if problems else 'review regressions ok')
