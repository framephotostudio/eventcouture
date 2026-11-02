# Add to home screen / desktop: the button shows the right steps for each device, and the footer link works: python3 tests/install.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import sys, re, json
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
ANDROID='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
with sync_playwright() as p:
    b=p.chromium.launch()
    for n,w,h,ua,want in [('iphone',390,844,IPHONE,'Add to Home Screen'),('android',412,900,ANDROID,'Add to Home screen'),('desktop',1280,900,None,'install icon')]:
        ctx=b.new_context(viewport={'width':w,'height':h}, **({'user_agent':ua} if ua else {})); pg=ctx.new_page(); e=[]; pg.on('pageerror', lambda x: e.append(str(x)))
        pg.route(re.compile(r'googletagmanager|fonts\.g'), lambda r: r.abort())
        pg.goto(U); pg.wait_for_selector('.hero'); pg.click('.app-soon-bar [data-install]'); pg.wait_for_selector('.sheet .install-steps')
        t=pg.inner_text('.sheet'); check(n, want in t, 'right steps for this device: '+t[:90].replace('\n',' '))
        if n=='iphone': pg.screenshot(path=f'{OUT}/install_{n}.png')
        pg.click('.sheet [data-close]'); pg.wait_for_timeout(200)
        pg.click('footer.site [data-install]'); pg.wait_for_selector('.sheet .install-steps'); check(n, True, 'footer link opens the steps'); pg.click('.sheet [data-close]')
        m=json.loads(pg.evaluate("fetch('manifest.json').then(r=>r.text())")); check(n, m.get('display')=='standalone' and any(i['sizes']=='512x512' for i in m['icons']), 'manifest ready to install')
        pg.goto(U+'#/help'); pg.wait_for_timeout(500); check(n, not e, 'no page errors '+str(e[:2]))
print('FAILURES:', F or 'none')
