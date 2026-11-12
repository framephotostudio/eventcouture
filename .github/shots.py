import os
from playwright.sync_api import sync_playwright
os.makedirs('out',exist_ok=True); log=lambda m: open('out/log.txt','a').write(str(m)+'\n')
with sync_playwright() as p:
    b=p.chromium.launch()
    for tag,vp in [('phone',{'width':390,'height':844}),('desktop',{'width':1280,'height':860})]:
        pg=b.new_page(viewport=vp); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:200]))
        pg.goto('https://eventcouture.app/?v=pk#/plan-for-me'); pg.wait_for_selector('#prPkgs',timeout=30000); pg.wait_for_timeout(1500)
        log(tag+' names: '+str(pg.eval_on_selector_all('.pr-name','e=>e.map(x=>x.textContent)')))
        log(tag+' roadmap present: '+str('roadmap' in pg.content().lower()))
        pg.screenshot(path='out/'+tag+'.png',full_page=True)
        pg.goto('https://eventcouture.app/?v=pk#/'); pg.wait_for_selector('.hero'); pg.click('.hero-planner'); pg.wait_for_timeout(1500)
        log(tag+' gold button opens: '+pg.url.split('#')[1]+' cards='+str(len(pg.query_selector_all('.pr-pkg'))))
        log(tag+' errors '+str(errs))
    b.close()
