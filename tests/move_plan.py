# Plans aren't lost: "Continue on another device" link copies a plan to another browser; backup file download and restore: python3 tests/move_plan.py <folder>
import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'culture_pkg.py')).read().split('with sync_playwright() as p:')[0])
from playwright.sync_api import sync_playwright
MV = {}
def api3(route):
    u = route.request.url; h = {'access-control-allow-origin': '*'}
    if u.endswith('/api/move/new'):
        b = json.loads(route.request.post_data); i = format(len(MV) + 1, '024x'); MV[i] = b['plan']
        return route.fulfill(status=200, content_type='application/json', body=json.dumps({'id': i}), headers=h)
    if '/api/move/' in u:
        i = u.split('/api/move/')[1]; return route.fulfill(status=200 if i in MV else 404, content_type='application/json', body=json.dumps({'plan': MV[i]} if i in MV else {'error': 'gone'}), headers=h)
    return api(route)
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, hh, n in [(390, 844, 'phone'), (1280, 900, 'desktop')]:
        MV.clear(); ctx = b.new_context(viewport={'width': w, 'height': hh}, accept_downloads=True)
        pg = ctx.new_page(); e = []; pg.on('pageerror', lambda x: e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api3)
        pg.goto(U + '#/new/1'); pg.wait_for_selector('#text'); pg.fill('#text', 'ivory and gold romantic wedding'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#type', label='Wedding'); pg.select_option('#city', 'Houston, TX'); pg.fill('#guests', '150'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        name = pg.inner_text('.plan-head h2').replace('Rename', '').strip()
        check(n, 'Saved on this device' in pg.inner_text('.plan-head'), 'plan says it saves on this device')
        pg.click('.plan-head [data-move]'); pg.wait_for_selector('#mvMake'); pg.click('#mvMake'); pg.wait_for_selector('#mvLink')
        link = pg.input_value('#mvLink'); check(n, link.startswith('https://eventcouture.app/#/move/'), 'private link made: ' + link)
        mid = link.split('/move/')[1]
        # another device: a fresh browser
        c2 = b.new_context(viewport={'width': w, 'height': hh}); p2 = c2.new_page(); p2.on('pageerror', lambda x: e.append(str(x))); p2.route('**/js/config.js*', cfg); p2.route('http://api.test/**', api3)
        p2.goto(U + '#/move/' + mid); p2.wait_for_selector('#mvAdd'); p2.click('#mvAdd'); p2.wait_for_selector('.plan-head')
        check(n, name in p2.inner_text('.plan-head'), 'the other device opens the same plan: ' + name)
        c2.close()
        # same device: already has it -> keep both
        pg.click('.sheet [data-close]'); pg.goto(U + '#/move/' + mid); pg.wait_for_selector('#mvAdd'); pg.click('#mvAdd'); pg.wait_for_selector('[data-imp=copy]'); pg.click('[data-imp=copy]'); pg.wait_for_selector('.plan-head')
        evs = json.loads(pg.evaluate("localStorage.getItem('ec.events')")); check(n, len(evs) == 2 and any(v['name'].endswith('(copy)') for v in evs.values()), 'opening it where it already exists asks, and Keep both keeps both')
        # backup file
        pg.click('.plan-head [data-move]'); pg.wait_for_selector('[data-mvfile]')
        with pg.expect_download() as dl: pg.click('[data-mvfile]')
        path = dl.value.path(); data = json.load(open(path)); check(n, data.get('plan', {}).get('name', '').startswith(name.split(' (')[0]), 'backup file downloads with the plan')
        c3 = b.new_context(viewport={'width': w, 'height': hh}); p3 = c3.new_page(); p3.on('pageerror', lambda x: e.append(str(x))); p3.route('**/js/config.js*', cfg); p3.route('http://api.test/**', api3)
        p3.goto(U + '#/events'); p3.wait_for_selector('[data-restore-file]')
        with p3.expect_file_chooser() as fc: p3.click('[data-restore-file]')
        fc.value.set_files(path); p3.wait_for_selector('.plan-head'); check(n, 'Saved on this device' in p3.inner_text('.plan-head'), 'restoring the backup file brings the plan back on a new device')
        c3.close()
        check(n, not e, 'no page errors ' + str(e[:2]))
        check(n, not pg.evaluate('document.documentElement.scrollWidth > innerWidth'), 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none'); sys.exit(1 if F else 0)
