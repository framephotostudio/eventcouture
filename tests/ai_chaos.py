# The live AI's answers are untrusted: messy, unsafe or off-brand answers must never reach a host. python3 tests/ai_chaos.py
import json, re
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
U = 'http://localhost:8765/'
problems = []
def check(ok, msg):
    if not ok: problems.append(msg)
def C(name, **kw):
    c = {'id': re.sub(r'[^a-z]+', '-', name.lower()), 'name': name, 'styleName': name, 'palette': ['#111111', '#C9A86A', '#FFFFFF'], 'mood': 'A mood.', 'decor': ['Tables', 'Lights', 'Flowers', 'Cake moment'], 'menuStyle': 'modern', 'music': 'pop', 'outline': ['Arrival: a', 'Tables: b', 'Moment: c', 'Dress code: d']}
    c.update(kw); return c
def page(b, w, answer):
    pg = b.new_page(viewport={'width': w, 'height': 860}); pg.errs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.route('**/js/config.js', lambda r: r.fulfill(content_type='application/javascript', body="window.EC_CONFIG={apiUrl:'https://api.test',preview:true};"))
    pg.route('https://api.test/api/concepts', lambda r: r.fulfill(content_type='application/json', body=json.dumps(answer(r) if callable(answer) else answer)))
    pg.route('https://api.test/api/**', lambda r: r.fulfill(content_type='application/json', body='{"places":[],"times":[]}') if 'concepts' not in r.request.url else r.fallback())
    return pg
def plan(pg, text, typ, alcohol=None, kids=False, setting='indoor', photo=None, occ=None):
    if photo:
        pg.goto(U + '#/inspiration/' + (occ or 'all')); pg.wait_for_selector('#igrid'); pg.click('#igrid [data-inspo=%s]' % photo); pg.click('.sheet #useInspo'); pg.wait_for_selector('.inspo-chosen')
    else:
        pg.goto(U + '#/new/1'); pg.wait_for_selector('#text')
    pg.fill('#text', text); pg.click('#next'); pg.wait_for_selector('#type')
    if typ: pg.select_option('#type', typ)
    pg.select_option('#city', 'Houston, TX'); pg.click('#setting [data-v=%s]' % setting)
    if alcohol: pg.click('#alcohol [data-v=%s]' % alcohol)
    if kids and not pg.is_checked('#kids'): pg.click('#kids')
    pg.click('#next'); pg.wait_for_selector('.concept h3', timeout=25000); pg.wait_for_timeout(300)
    return [x.inner_text() for x in pg.query_selector_all('.concept h3')], pg.inner_text('#cs')
DRINK = re.compile(r'champagne|prosecco|mimosa|sangria|margarita|ros[eé]\b|whiske?y|merlot|bartender', re.I)
with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (390, 1280):
        t = str(w) + ': '
        pg = page(b, w, {'concepts': [C('Evil', img='x" onerror="window.__x=1" a="', inspo='x'), C('Bad'), C('Worse')]})
        plan(pg, 'black and gold party', 'birthday'); check(not pg.evaluate('window.__x'), t + 'AI could run code in the page')
        pg.close()
        pg = page(b, w, {'concepts': [C('Mimosa Morning', mood='Mimosas and blush roses.'), C('Sangria Garden', pieces=[{'item': 'Bartender', 'hire': 'catering'}]), C('Champagne Blush Soiree')]})
        names, txt = plan(pg, 'baby shower brunch', 'baby-shower', alcohol='none'); check(not DRINK.search(txt), t + 'drink words at a no-alcohol event: ' + str(names))
        pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base = pg.url.split('#')[1]
        pg.click('#keepBtn'); pg.click('#keepPay'); pg.goto(U + '#' + base + '/style'); pg.wait_for_timeout(300); check(not DRINK.search(pg.inner_text('#tab')), t + 'drink words on Style page')
        pg.close()
        pg = page(b, w, {'concepts': [C('Rosé All Day'), C('Whiskey Lounge Nights'), C('Champagne Blush Soiree')]})
        names, _ = plan(pg, 'birthday', 'birthday', alcohol='full'); check(not any(DRINK.search(n) for n in names) and 'Soft Gold Blush Soiree' in names, t + 'drink names: ' + str(names))
        pg.close()
        pg = page(b, w, {'concepts': [C('Neon Nightclub Bash', id='disco-glam', mood='Dark room, strobe lights'), C('Modern Noir Birthday', id='modern-noir'), C('Bottle Service VIP')]})
        names, txt = plan(pg, 'superhero party for my 6th birthday', 'kids-birthday', alcohol='none'); check(not re.search(r'nightclub|noir|bottle|strobe|dark room', txt, re.I) and len(names) == 3, t + 'kids got club looks: ' + str(names))
        pg.close()
        pg = page(b, w, {'concepts': [{'name': 'No Palette', 'decor': 'one string'}, {'name': 'Alpha', 'palette': {'a': 1}, 'pieces': {'x': 1}}, {'styleName': 'Style Only', 'pieces': [None, 5, {'item': 'Gold chargers', 'search': 'gold chargers'}]}]})
        names, txt = plan(pg, 'black and gold birthday', 'birthday'); check(len(names) == 3 and all(names) and not re.search(r'undefined|NaN|\[object', txt), t + 'messy AI broke concepts: ' + str(names))
        pg.click('.concept button >> nth=2'); pg.wait_for_selector('.plan-head'); base = pg.url.split('#')[1]; pg.goto(U + '#' + base + '/style'); pg.wait_for_timeout(300)
        check('went wrong' not in pg.inner_text('main'), t + 'style page crashed on messy AI'); check(not pg.errs, t + 'errors: ' + str(pg.errs[:2]))
        pg.close()
        pg = page(b, w, {'concepts': [{'name': 'Alpha Night', 'palette': ['#111111', '#222222', '#333333'], 'decor': ['a', 'b', 'c']}, {'name': 'Bravo Garden', 'palette': ['#111111', '#222222', '#333333'], 'decor': ['a', 'b', 'c']}, {'name': 'Charlie Coast', 'palette': ['#111111', '#222222', '#333333'], 'decor': ['a', 'b', 'c']}]})
        names, _ = plan(pg, 'party', 'birthday'); check(names == ['Alpha Night', 'Bravo Garden', 'Charlie Coast'], t + 'concepts without ids collapsed: ' + str(names))
        pg.click('#more'); pg.wait_for_timeout(1200); again = [x.inner_text() for x in pg.query_selector_all('.concept h3')]
        check(len(again) == 3 and not set(again) & set(names), t + 'more concepts repeated: ' + str(again))
        pg.close()
        pg = page(b, w, {'concepts': [C('X' * 70, decor=['Y' * 300, 'b', 'c'])]})
        plan(pg, 'party', 'birthday'); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.wait_for_timeout(300)
        check(pg.evaluate('document.documentElement.scrollWidth - innerWidth') <= 1, t + 'long AI words push the page sideways')
        pg.close()
        # photo flows
        pg = page(b, w, {'concepts': [C('Wedding Idea One'), C('Wedding Idea Two'), C('Wedding Idea Three')]})
        names, _ = plan(pg, '', 'wedding', photo='royal-red-quinceanera', occ='quince'); check('Royal Red Wedding' in names and not any('Quincea' in n for n in names), t + 'photo named for the wrong occasion: ' + str(names))
        pg.goto(U + '#/inspiration/kids-birthday'); pg.wait_for_selector('#igrid'); pg.click('[data-inspo=dino-discovery]'); pg.click('.sheet #useInspo'); pg.wait_for_selector('.inspo-chosen')
        pg.fill('#text', 'for my son Leo'); pg.click('#swapInspo'); pg.wait_for_selector('#igrid'); did = pg.url.split('/')[-1]
        pg.goto(U); pg.wait_for_selector('#igrid'); pg.click('#igrid [data-inspo] >> nth=0'); pg.click('.sheet #useInspo'); pg.wait_for_selector('.inspo-chosen')
        d = pg.evaluate("JSON.parse(localStorage.getItem('ec.drafts'))[%s]" % json.dumps(did))
        check(d and d['type'] == 'kids-birthday' and d['inspiration']['text'] == 'for my son Leo', t + 'home photo overwrote another draft or lost typed text: ' + str(d and (d['type'], d['inspiration']['text'])))
        pg.close()
    b.close()
print('\n'.join(problems) if problems else 'ai chaos ok')
