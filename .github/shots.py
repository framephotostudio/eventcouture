import json, sys, os
from playwright.sync_api import sync_playwright
U = sys.argv[1] if len(sys.argv) > 1 else 'https://eventcouture.app/?v=walk'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'out'
os.makedirs(OUT, exist_ok=True)
log = lambda m: (print(m), open(OUT + '/log.txt', 'a').write(str(m) + '\n'))
UA_P = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

def land(pg, secs=70):
    for i in range(secs):
        pg.wait_for_timeout(1000)
        u = pg.url.split('#')[-1]
        if pg.query_selector('.pkg-cmp'): return u, i
    return pg.url.split('#')[-1], secs

with sync_playwright() as p:
    b = p.chromium.launch()
    for tag, opts in [('phone', dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, user_agent=UA_P, device_scale_factor=1)), ('desktop', dict(viewport={'width': 1280, 'height': 860}))]:
        def fresh():
            ctx = b.new_context(**opts); ctx.add_init_script("try{localStorage.setItem('ec.owner','1')}catch(e){}")
            pg = ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append('pageerror ' + str(e)[:200]))
            pg.on('console', lambda m: m.type == 'error' and errs.append('console ' + m.text[:200]))
            return ctx, pg, errs
        # 1. Plan my event -> wedding -> Houston
        ctx, pg, errs = fresh()
        pg.goto(U); pg.wait_for_selector('.hero'); pg.wait_for_timeout(1500); pg.screenshot(path=f'{OUT}/{tag}-1-home.png', full_page=False)
        pg.click('.hero-ctas a[href="#/new"]'); pg.wait_for_timeout(2500)
        log(f'{tag} A after Plan my event: {pg.url.split("#")[-1]}'); pg.screenshot(path=f'{OUT}/{tag}-2-step2.png', full_page=True)
        if pg.query_selector('[data-occ2=wedding]'): pg.click('[data-occ2=wedding]')
        pg.wait_for_timeout(500)
        cs = pg.query_selector('#citySearch')
        if cs and cs.is_visible(): cs.fill('Houston'); pg.wait_for_timeout(600)
        log(f'{tag} A city value: ' + str(pg.evaluate("document.querySelector('#city') && document.querySelector('#city').value")))
        pg.screenshot(path=f'{OUT}/{tag}-3-step2-filled.png', full_page=True)
        nb = pg.query_selector('#next'); log(f'{tag} A next button: ' + (nb.inner_text() if nb else 'NONE'))
        if nb: nb.click()
        u, t = land(pg); log(f'{tag} A landed {u} after {t}s, packages={bool(pg.query_selector(".pkg-cmp"))}')
        pg.wait_for_timeout(1500); pg.screenshot(path=f'{OUT}/{tag}-4-wedding-result.png', full_page=False)
        log(f'{tag} A errors {json.dumps(errs)}'); ctx.close()
        # 2. Hero chip birthday
        ctx, pg, errs = fresh(); pg.goto(U); pg.wait_for_selector('.hero'); pg.wait_for_timeout(1200)
        chips = pg.eval_on_selector_all('[data-hchip]', 'els => els.map(e => e.dataset.hchip)'); log(f'{tag} B hero chips {chips}')
        pg.click('[data-hchip=birthday]'); pg.wait_for_timeout(3000); log(f'{tag} B after chip: {pg.url.split("#")[-1]}')
        pg.screenshot(path=f'{OUT}/{tag}-5-chip.png', full_page=True)
        cs = pg.query_selector('#citySearch')
        if cs and cs.is_visible(): cs.fill('Dallas'); pg.wait_for_timeout(600); nb = pg.query_selector('#next'); nb and nb.click()
        u, t = land(pg); log(f'{tag} B landed {u} after {t}s, packages={bool(pg.query_selector(".pkg-cmp"))}')
        pg.screenshot(path=f'{OUT}/{tag}-6-bday-result.png', full_page=False); log(f'{tag} B errors {json.dumps(errs)}'); ctx.close()
        # 3. Cultural wedding card
        ctx, pg, errs = fresh(); pg.goto(U); pg.wait_for_selector('.hero'); pg.wait_for_timeout(1200)
        cc = pg.query_selector('a[href^="#/start/arabic-wedding"]')
        log(f'{tag} C arabic card present: {bool(cc)}')
        if cc: cc.scroll_into_view_if_needed(); cc.click(); pg.wait_for_timeout(3000)
        log(f'{tag} C after card: {pg.url.split("#")[-1]}'); pg.screenshot(path=f'{OUT}/{tag}-7-culture.png', full_page=True)
        cs = pg.query_selector('#citySearch')
        if cs and cs.is_visible(): cs.fill('Houston'); pg.wait_for_timeout(600); nb = pg.query_selector('#next'); nb and nb.click()
        u, t = land(pg); log(f'{tag} C landed {u} after {t}s, packages={bool(pg.query_selector(".pkg-cmp"))}')
        pg.screenshot(path=f'{OUT}/{tag}-8-culture-result.png', full_page=False); log(f'{tag} C errors {json.dumps(errs)}'); ctx.close()
        # 4. Let us plan it for you
        ctx, pg, errs = fresh(); pg.goto(U); pg.wait_for_selector('.hero'); pg.wait_for_timeout(1000)
        hp = pg.query_selector('.hero-planner')
        if hp: hp.click(); pg.wait_for_timeout(1500)
        log(f'{tag} D planner: {pg.url.split("#")[-1]} form={bool(pg.query_selector("#prName"))}')
        pg.screenshot(path=f'{OUT}/{tag}-9-planner.png', full_page=True); log(f'{tag} D errors {json.dumps(errs)}'); ctx.close()
        # 5. Inspiration
        ctx, pg, errs = fresh(); pg.goto(U + '#/inspiration'); pg.wait_for_timeout(2000)
        ph = pg.query_selector('[data-inspo]')
        if ph: ph.click(); pg.wait_for_timeout(800)
        ui = pg.query_selector('#useInspo')
        if ui: ui.click(); pg.wait_for_timeout(2500)
        log(f'{tag} E after use photo: {pg.url.split("#")[-1]}'); pg.screenshot(path=f'{OUT}/{tag}-10-inspo.png', full_page=True)
        cs = pg.query_selector('#citySearch')
        if cs and cs.is_visible(): cs.fill('Chicago'); pg.wait_for_timeout(600)
        nb = pg.query_selector('#next'); nb and nb.click()
        u, t = land(pg); log(f'{tag} E landed {u} after {t}s, packages={bool(pg.query_selector(".pkg-cmp"))}')
        pg.screenshot(path=f'{OUT}/{tag}-11-inspo-result.png', full_page=False); log(f'{tag} E errors {json.dumps(errs)}'); ctx.close()
    b.close()
