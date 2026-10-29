"""Vendors and quotes, end to end with the real server code: a singer lists free, a host asks for quotes
anonymously and adds an Instagram vendor, the singer replies, the host sees the quote. Phone and desktop."""
import sys, os, json, subprocess, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import _open
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
U = 'http://localhost:8765/'; problems = []
def check(c, m):
    if not c: problems.append(m); print('FAIL', m)
VENDOR = {'name': 'Layali Voice', 'email': 'layali@example.com', 'phone': '713-555-0100', 'cats': ['Wedding singer'], 'bio': 'Arabic and English wedding singer with oud and percussion.', 'ig': '@layali.voice', 'years': '8',
  'cities': ['Houston, TX'], 'radius': '60', 'pkgName': 'Wedding set', 'pkgIncl': 'Three hours with musicians', 'priceType': 'Starting at', 'price': '2500', 'deposit': '30', 'minGuests': '50', 'maxGuests': '800',
  'lead': '8', 'notIncl': 'Sound system for venues without one', 'cancel': 'Deposit is non-refundable', 'events': ['Wedding', 'Arabic wedding'], 'langs': 'Arabic, English', 'agree': True}
for vp, size, port in [('phone', {'width': 390, 'height': 844}, 8791), ('desk', {'width': 1280, 'height': 900}, 8792)]:
    srv = subprocess.Popen(['node', os.path.join(HERE, 'market_server.mjs'), str(port)]); time.sleep(1.2)
    API = f'http://localhost:{port}'
    def cfg(route):
        r = route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''", f"apiUrl: '{API}'"))
    def fake(route):
        u = route.request.url; h = {'access-control-allow-origin': '*'}
        if u.endswith('/api/places'): route.fulfill(status=200, content_type='application/json', body=json.dumps({'places': [{'id': 'g1', 'name': 'Houston Wedding Voices', 'rating': 4.8, 'reviews': 120, 'website': 'https://example.com', 'mapsUrl': 'https://maps.example.com/g1', 'address': '1 Main St, Houston, TX'}]}), headers=h)
        elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
        else: route.continue_()
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(); ctx = b.new_context(viewport=size); ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=U.rstrip('/'))
            pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.route('**/js/config.js*', cfg); ctx.route('https://ig.me/**', lambda r: r.fulfill(status=200, body='ok')); pg.route(API + '/api/places', fake); pg.route(API + '/api/status', fake)
            # 1. the singer lists her business
            pg.goto(U); pg.evaluate("v => localStorage.setItem('ec.vendor', JSON.stringify(v))", VENDOR)
            pg.goto(U + '#/vendors'); pg.wait_for_selector('#submit'); pg.click('#submit')
            pg.wait_for_selector('.sheet h3'); t = pg.inner_text('.sheet')
            check('live' in t and 'Founding vendor' in t, f'{vp}: vendor not live: {t[:120]}')
            check('Book me on Event Couture' in t, f'{vp}: no Instagram bio line')
            pg.wait_for_timeout(700); pg.screenshot(path=f'{OUT}/vendor-live-{vp}.png')
            vid = pg.evaluate("JSON.parse(localStorage.getItem('ec.vendor')).serverId")
            pg.click('.sheet [data-close] >> nth=-1')
            # 2. the host plans an Arabic wedding in Houston
            pg.goto(U + '#/new/1'); pg.fill('#text', 'Arabic wedding, ivory and gold, with a zaffe'); pg.click('#next')
            pg.select_option('#city', 'Houston, TX');   # the singer is on by default
            pg.fill('#date', '2099-06-12'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
            pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
            base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
            pg.evaluate("(()=>{var a=JSON.parse(localStorage.getItem('ec.events'));var e=Array.isArray(a)?a[a.length-1]:Object.values(a).pop();e.paid={price:0};localStorage.setItem('ec.events',JSON.stringify(a))})()")
            pg.goto(U + base + '/vendors'); pg.reload(); pg.wait_for_selector('[data-vendor=singer]'); pg.click('[data-vendor=singer]')
            pg.wait_for_selector('[data-ecv=singer] .curated', timeout=8000)
            ecv = pg.inner_text('[data-ecv=singer]'); check('Layali Voice' in ecv and 'Founding vendor' in ecv, f'{vp}: listed vendor not first: {ecv[:100]}')
            pg.wait_for_selector('.live-res[data-for=v-singer] .curated'); check('Houston Wedding Voices' in pg.inner_text('.live-res[data-for=v-singer]'), f'{vp}: Google results missing')
            # save the listed vendor
            pg.click('[data-ecv=singer] [data-short]'); pg.wait_for_timeout(300)
            check(pg.evaluate("JSON.parse(localStorage.getItem('ec.events'))") and 'ec:' + vid in json.dumps(pg.evaluate("localStorage.getItem('ec.events')")), f'{vp}: listed vendor not saved as option')
            # ask for quotes
            pg.click('[data-getq=singer]'); pg.wait_for_selector('#qSend'); sh = pg.inner_text('.sheet')
            check('never shared' in sh, f'{vp}: privacy line missing in quote sheet')
            pg.fill('#qNotes', 'Arabic and English songs please'); pg.click('#qSend'); pg.wait_for_selector('[data-mk=singer] >> text=Your request is out')
            # Instagram vendor
            pg.fill('[data-mk=singer] [data-ighandle]', '@noor.sings'); pg.click('[data-mk=singer] [data-igadd]'); pg.wait_for_selector('[data-igmsg="noor.sings"]')
            with ctx.expect_page() as popup: pg.click('[data-igmsg="noor.sings"]')
            check('ig.me/m/noor.sings' in popup.value.url, f'{vp}: Instagram chat did not open: {popup.value.url}'); popup.value.close()
            msg = pg.evaluate("navigator.clipboard.readText()")
            check('Arabic wedding in Houston' in msg and 'quote for a wedding singer' in msg and 'get listed free' in msg and '#/vendors' in msg, f'{vp}: Instagram message wrong: {msg}')
            if vp == 'phone': print('message:', msg)
            pg.screenshot(path=f'{OUT}/quotes-host-{vp}.png', full_page=False)
            # 3. the singer sees the request (no name or contact) and replies
            pg.goto(U + '#/vendors/requests'); pg.wait_for_selector('[data-req]')
            rq = pg.inner_text('#reqs'); check('Arabic wedding' in rq and 'Arabic and English songs please' in rq, f'{vp}: request not shown to vendor: {rq[:150]}')
            pg.fill('[data-req] [data-msg]', 'I\'m available June 12! Full set with oud and darbuka.'); pg.fill('[data-req] [data-price]', '2800'); pg.click('[data-req] [data-send]'); pg.wait_for_selector('text=Reply sent')
            pg.screenshot(path=f'{OUT}/vendor-requests-{vp}.png')
            # 4. the host sees the quote
            pg.goto(U + base + '/vendors'); pg.wait_for_selector('text=new quote', timeout=8000)
            pg.click('[data-vendor=singer]'); pg.wait_for_selector('[data-mk=singer] >> text=Quotes from vendors (1)')
            qt = pg.inner_text('[data-mk=singer]'); check('$2,800' in qt and 'oud and darbuka' in qt, f'{vp}: quote not shown: {qt[:150]}')
            # 5. the vendor's public page
            pg.goto(U + '#/v/' + vid); pg.wait_for_selector('#vp h2'); check('Layali Voice' in pg.inner_text('#vp'), f'{vp}: profile page')
            pg.screenshot(path=f'{OUT}/vendor-page-{vp}.png')
            check(not errs, f'{vp}: page errors {errs}')
            b.close()
    finally:
        srv.terminate()
print('market ok' if not problems else f'{len(problems)} problems'); sys.exit(1 if problems else 0)
