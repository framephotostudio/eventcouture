"""Cultural weddings: Arabic, Indian, Persian. Type menu group, music picks, budget lines, searches, menu, run of show."""
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import _open
from playwright.sync_api import sync_playwright
U = 'http://localhost:8765/'; OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp'; problems = []; qs = []
def api(route):
    u = route.request.url; h = {'access-control-allow-origin': '*'}
    if u.endswith('/api/places'): b = json.loads(route.request.post_data); qs.append((b.get('cat', ''), b['query'], b.get('hint', ''))); route.fulfill(status=200, content_type='application/json', body='{"places":[]}', headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r = route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''", "apiUrl: 'http://api.test'"))
def check(c, msg):
    if not c: problems.append(msg); print('FAIL', msg)
with sync_playwright() as p:
    b = p.chromium.launch()
    for vp, size in [('phone', {'width': 390, 'height': 844}), ('desk', {'width': 1280, 'height': 900})]:
        for cu, label, text, must in [
            ('arabic', 'Arabic wedding', 'elegant ivory and gold wedding with a big entrance', ['Zaffe and dabke group', 'Live band (Arabic music)', 'DJ (Arabic and international music)', 'Kosha']),
            ('indian', 'Indian wedding', 'colorful wedding with marigolds', ['Dhol player', 'Mandap', 'Mehndi', 'Pandit']),
            ('persian', 'Persian wedding', 'romantic white and gold wedding', ['Sofreh aghd', 'Aghd officiant', 'Live band (Persian music)'])]:
            qs.clear(); errs = []
            pg = b.new_page(viewport=size); pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
            pg.goto(U + '#/new/1'); pg.fill('#text', text); pg.click('#next')
            pg.select_option('#type', label=label)
            check(pg.is_visible('#music'), f'{vp} {cu}: music choices not shown')
            check(pg.input_value('#guests') != '120', f'{vp} {cu}: guest default not set for tradition')
            if cu == 'arabic':
                pg.click('#music [data-music=singer]')
                pg.screenshot(path=f'{OUT}/cultural-form-{vp}.png', full_page=False)
            pg.select_option('#city', 'Houston, TX'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
            pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
            head = pg.inner_text('.plan-head') if pg.is_visible('.plan-head') else ''
            base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
            pg.evaluate("(()=>{var a=JSON.parse(localStorage.getItem('ec.events'));var e=Array.isArray(a)?a[a.length-1]:Object.values(a).pop();e.paid={price:0};localStorage.setItem('ec.events',JSON.stringify(a))})()")
            pg.goto(U + base + '/budget'); pg.reload(); pg.wait_for_selector('#musicPlan'); pg.wait_for_timeout(400)
            body = pg.inner_text('main')
            for m in must: check(m in body, f'{vp} {cu}: budget missing "{m}"')
            if cu == 'arabic':
                check('Arabic wedding singer' in body, f'{vp} arabic: singer picked on form but not in budget')
                pg.screenshot(path=f'{OUT}/cultural-budget-{vp}.png', full_page=False)
                pg.click('#musicPlan [data-music=dj]'); pg.wait_for_timeout(500)
                check('DJ (Arabic' not in pg.inner_text('main'), f'{vp} arabic: removing DJ on budget page did not remove the line')
            ev = pg.evaluate("(()=>{var e=JSON.parse(localStorage.getItem('ec.events'));e=Array.isArray(e)?e[e.length-1]:Object.values(e).pop();return e})()")
            check(ev.get('type') == 'wedding' and ev.get('culture') == cu, f'{vp} {cu}: saved as {ev.get("type")}/{ev.get("culture")}')
            if pg.is_visible('#pkgGo'):
                pg.click('#pkgGo'); pg.wait_for_timeout(2500)
                ql = ' | '.join(q for c, q, h in qs)
                if cu == 'arabic': check('zaffe' in ql and 'arabic wedding band' in ql, f'{vp} arabic: searches {ql}')
                if cu == 'indian': check('dhol player' in ql and 'mandap' in ql, f'{vp} indian: searches {ql}')
                if cu == 'persian': check('sofreh' in ql, f'{vp} persian: searches {ql}')
                if vp == 'desk': print(cu, 'searches:', ql)
            pg.goto(U + base + '/food'); pg.wait_for_timeout(400)
            food = pg.inner_text('main')
            check({'arabic': 'Mezze', 'indian': 'Biryani', 'persian': 'tahdig'}[cu] in food, f'{vp} {cu}: menu not cultural')
            check(not errs, f'{vp} {cu}: page errors {errs}')
            pg.close()
    # auto-detect from words
    pg = b.new_page(); pg.goto(U + '#/new/1'); pg.fill('#text', 'Lebanese wedding with a zaffe and dabke, 300 guests'); pg.click('#next'); pg.wait_for_selector('#type')
    o = pg.evaluate("document.querySelector('#type').selectedOptions[0].textContent")
    check(o == 'Arabic wedding', f'description did not pick Arabic wedding: {o}')
    # plain wedding unchanged
    pg.goto(U + '#/new/1'); pg.evaluate("localStorage.clear()"); pg.goto(U + '#/new/1'); pg.fill('#text', 'classic white wedding'); pg.click('#next'); pg.wait_for_selector('#type'); pg.wait_for_selector('#type')
    o = pg.evaluate("document.querySelector('#type').selectedOptions[0].textContent")
    check(o == 'Wedding' and not pg.is_visible('#music'), f'plain wedding changed: {o}')
    b.close()
print('cultural ok' if not problems else f'{len(problems)} problems'); sys.exit(1 if problems else 0)
