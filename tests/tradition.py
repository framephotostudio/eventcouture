# A classic wedding can become a cultural wedding (and back) after it's made; the app-coming-soon bar sits at the top of the home page.
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import sys
from playwright.sync_api import sync_playwright
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
with sync_playwright() as p:
    b=p.chromium.launch()
    for n,w,h,m in [('phone',390,844,True),('desktop',1280,900,False)]:
        ctx=b.new_context(viewport={'width':w,'height':h}, is_mobile=m, has_touch=m); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.goto(U+'#/'); pg.wait_for_selector('.hero')
        bar=pg.query_selector('.app-soon-bar'); hero=pg.query_selector('.hero')
        check(n, bar is not None and bar.bounding_box()['y'] < hero.bounding_box()['y'], 'app coming soon bar is at the top, above the hero')
        pg.screenshot(path=f'{OUT}/top_{n}.png')
        pg.goto(U+'#/new/1'); pg.fill('#text','Ivory and gold wedding with white roses'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#type','wedding'); pg.select_option('#city','Houston, TX'); pg.fill('#guests','150'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept'); pg.click('.concept button'); pg.wait_for_selector('.plan-head')
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2]); eid=base.split('/')[2]
        ev=lambda: pg.evaluate("id => JSON.parse(localStorage['ec.events'])[id]", eid)
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#cultureSel'); check(n, pg.input_value('#cultureSel')=='', 'overview shows Wedding tradition: Classic')
        pg.select_option('#cultureSel','arabic'); pg.wait_for_timeout(400)
        check(n, ev().get('culture')=='arabic' and 'an Arabic wedding' in pg.inner_text('body'), 'switching to Arabic updates the plan')
        pg.goto(U+base+'/budget'); pg.wait_for_selector('#musicPlan'); t=pg.inner_text('#musicPlan')
        check(n, pg.query_selector('#cultureSel') is None and pg.query_selector('#music') is not None, 'budget page shows the music choices; the tradition menu is on Summary only')
        bt=pg.inner_text('#tab'); check(n, 'Zaffe' in bt or 'zaffe' in bt.lower(), 'zaffe is in the budget')
        pg.evaluate("document.querySelector('#musicPlan').scrollIntoView({block:'start'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/tradition_{n}.png')
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#cultureSel'); pg.select_option('#cultureSel',''); pg.wait_for_timeout(400); pg.goto(U+base+'/budget'); pg.wait_for_timeout(400); check(n, not ev().get('culture') and pg.query_selector('#music') is None, 'switching back to classic removes the cultural extras')
        check(n, not e, 'no page errors '+str(e)); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
