import os, json
from playwright.sync_api import sync_playwright
os.makedirs('out',exist_ok=True); U='https://eventcouture.app/'
log=lambda m: open('out/log.txt','a').write(str(m)+'\n')
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:200]))
    pg.goto(U+'?v=4'); pg.wait_for_selector('.hero'); pg.wait_for_timeout(2500)
    log('gold button: '+str(pg.evaluate("(()=>{const b=document.querySelector('.hero-planner');return b?getComputedStyle(b).backgroundImage.slice(0,40):null})()")))
    pg.screenshot(path='out/1-home.png')
    pg.click('.hero a[data-hchip=birthday]'); pg.wait_for_timeout(6000); log('after Birthday: '+pg.url.split('#')[1])
    if pg.query_selector('#city') and '/new/' in pg.url:
        pg.select_option('#country','US'); pg.select_option('#city','Houston, TX'); pg.click('#next')
    for i in range(60):
        pg.wait_for_timeout(1000)
        if '/budget' in pg.url or ('/e/' in pg.url and '/concepts' not in pg.url): break
    log('landed: '+pg.url.split('#')[1]); pg.wait_for_timeout(25000)
    log('packages shown: '+str(bool(pg.query_selector('.pkg-cmp'))))
    pg.screenshot(path='out/2-landed.png')
    log('errors '+json.dumps(errs)); b.close()
