# No-photo flow: vibes + must-haves + plan made for the budget. python3 tests/vibe.py outdir
import sys
from playwright.sync_api import sync_playwright
OUT = sys.argv[1]; problems = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/#/new/1'); pg.wait_for_selector('#speak')
    pg.click('#speak'); pg.wait_for_timeout(200)
    hint = pg.inner_text('#speakHint')
    for v in ['Blush', 'Ivory', 'Gold', 'Romantic', 'Classic']: pg.click(f'[data-vibe="{v}"]')
    pg.screenshot(path=OUT + '/vibe-step1.png', full_page=True)
    pg.click('#next'); pg.wait_for_selector('#musts')
    pg.select_option('#type', 'wedding'); pg.fill('#guests', '200'); pg.fill('#expected', '180'); pg.fill('#budget', '45000')
    pg.click('[data-must="photographer"]'); pg.click('[data-must="florals"]')
    pg.screenshot(path=OUT + '/vibe-step2.png', full_page=True)
    pg.select_option('#city', 'Houston, TX'); pg.click('#setting [data-v=indoor]'); pg.click('#next'); pg.click('#go'); pg.wait_for_selector('.concept'); pg.wait_for_timeout(400)
    first = pg.inner_text('.concept h3')
    pg.click('.concept button.gold'); pg.wait_for_selector('.tier'); pg.wait_for_timeout(400)
    cards = pg.locator('.tier .muted.small').all_inner_texts()
    total = pg.inner_text('.plan-total .display')
    pg.screenshot(path=OUT + '/vibe-overview.png', full_page=True)
    if 'Your budget plan' not in cards[0]: problems.append('fit card missing: ' + str(cards))
    if total.replace('$', '').replace(',', '') not in ('45000', '44995', '45005') and abs(int(total.replace('$', '').replace(',', '')) - 45000) > 60: problems.append('total ' + total)
    print('hint:', hint, '| first concept:', first, '| total:', total)
    if errs: problems.append(errs)
    b.close()
print(problems or 'vibe flow ok')
