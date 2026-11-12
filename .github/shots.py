import os, json
from playwright.sync_api import sync_playwright
os.makedirs('out',exist_ok=True); U='https://eventcouture.app/'
log=lambda m: open('out/log.txt','a').write(str(m)+'\n')
with sync_playwright() as p:
    b=p.chromium.launch()
    for n,vp in [('phone',{'width':390,'height':844}),('desktop',{'width':1280,'height':900})]:
        pg=b.new_page(viewport=vp); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:200]))
        pg.goto(U+'?v=3'); pg.wait_for_selector('.hero'); pg.wait_for_timeout(2500)
        log(n+' button there: '+str(bool(pg.query_selector('.hero-planner'))))
        pg.click('.hero-planner'); pg.wait_for_timeout(2500); log(n+' after tap: '+pg.url.split('#')[1]+' | '+pg.inner_text('main h2'))
        pg.screenshot(path=f'out/{n}-plan-for-me.png')
        log(n+' errors '+json.dumps(errs)); pg.close()
    b.close()
