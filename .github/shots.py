import os, json
from playwright.sync_api import sync_playwright
os.makedirs('out',exist_ok=True); U='https://eventcouture.app/'
log=lambda m: open('out/log.txt','a').write(str(m)+'\n')
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':390,'height':844}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:200]))
    r=pg.request.get('https://event-couture-api.facecouture.workers.dev/api/where', headers={'origin':'https://eventcouture.app'}); log('where '+r.text())
    pg.goto(U+'?v=2'); pg.wait_for_selector('.hero'); pg.wait_for_timeout(2000)
    pg.click('.hero a[data-hchip=birthday]'); pg.wait_for_timeout(8000); log('after Birthday: '+pg.url.split('#')[1]); pg.screenshot(path='out/1-after-birthday.png')
    if pg.query_selector('#city'):
        log('city shown: '+repr(pg.input_value('#city'))); pg.select_option('#country','US'); pg.select_option('#city','Houston, TX'); pg.click('#next'); pg.wait_for_selector('.concept',timeout=90000); log('looks: '+pg.url.split('#')[1])
    pg.screenshot(path='out/2-looks.png')
    pg.goto(U+'#/new'); pg.wait_for_selector('#occ'); pg.wait_for_timeout(1500); log('plan my event: '+pg.url.split('#')[1]+' occ='+str(len(pg.query_selector_all('#occ [data-occ2]'))))
    log('errors '+json.dumps(errs))
    b.close()
