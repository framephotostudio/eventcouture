# Alcohol on and off: a checkbox on step 2 and at the top of every plan: python3 tests/alcohol.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import sys, json
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
def getev(pg): return pg.evaluate("()=>{const a=JSON.parse(localStorage.getItem('ec.events')||'{}');const l=Object.values(a);return l.sort((x,y)=>(y.updated||0)-(x.updated||0))[0]}")
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.goto(U+'#/new/1'); pg.fill('#text','Ivory and gold wedding for 150'); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type','wedding')
        check(n, pg.is_checked('#alc'), 'a wedding starts with alcohol checked')
        pg.select_option('#type','baby-shower'); pg.wait_for_timeout(100); check(n, not pg.is_checked('#alc'), 'a baby shower starts without alcohol')
        pg.check('#alc'); pg.click('details.more summary'); check(n, pg.get_attribute('#alcohol [data-v=none]','aria-pressed')=='false', 'checking it turns the Drinks choice back on')
        pg.uncheck('#alc'); check(n, pg.get_attribute('#alcohol [data-v=none]','aria-pressed')=='true', 'unchecking it picks No alcohol under More details')
        pg.click('#alcohol [data-v=wine]'); pg.wait_for_timeout(50); check(n, pg.is_checked('#alc'), 'picking Beer and wine checks the box')
        pg.select_option('#type','wedding'); pg.uncheck('#alc'); pg.select_option('#country','US'); pg.wait_for_timeout(150); pg.select_option('#city','Houston, TX'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        check(n, getev(pg).get('alcohol')=='none' and not pg.is_checked('#alcTgl'), 'the plan starts without alcohol and the header box is unchecked')
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U+base+'/budget'); pg.wait_for_timeout(400); t=pg.inner_text('#tab'); check(n, 'Non-alcoholic drinks' in t, 'budget shows non-alcoholic drinks')
        pg.check('#alcTgl'); pg.wait_for_timeout(400); t=pg.inner_text('#tab')
        check(n, getev(pg).get('alcohol')=='full' and 'Non-alcoholic drinks' not in t and pg.is_checked('#alcTgl'), 'checking Alcohol in the header brings the bar back')
        pg.locator('.plan-head').screenshot(path=f'{OUT}/alcohol_head_{n}.png')
        pg.uncheck('#alcTgl'); pg.wait_for_timeout(400); check(n, getev(pg).get('alcohol')=='none' and 'Non-alcoholic drinks' in pg.inner_text('#tab'), 'unchecking takes alcohol out again')
        pg.goto(U+'#/sample/1'); pg.wait_for_selector('.plan-head'); check(n, not pg.query_selector('#alcTgl'), 'sample plans have no checkbox')
        check(n, not e, 'no page errors '+str(e[:2])); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
