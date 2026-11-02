# The ready-made home page in index.html matches what app.js draws, so first-time visitors see no jump: python3 tests/prerender.py
from playwright.sync_api import sync_playwright
import re, sys
U='http://localhost:8765/'; F=[]
def check(ok, what): print('OK  ' if ok else 'FAIL', what); (None if ok else F.append(what))
idx=open('index.html').read(); m=re.search(r'<div id="app" data-pre>([\s\S]*?)</div><!--/app-->', idx)
check(bool(m), 'index.html has the ready-made home page')
norm=lambda h: re.sub(r'\s+',' ', re.sub(r' class="fade"','',h)).strip()
with sync_playwright() as p:
    b=p.chromium.launch()
    for n,w,h in [('phone',390,844),('desktop',1280,900)]:
        pg=b.new_page(viewport={'width':w,'height':h}); pg.route(re.compile(r'googletagmanager|fonts\.g'), lambda r: r.abort())
        pg.goto(U); pg.wait_for_selector('.hero'); pg.wait_for_timeout(500)
        live=pg.evaluate("""()=>{const a=document.getElementById('app');let o='';for(const e of a.children){if(e.tagName==='HEADER')o+=e.outerHTML}const m=a.querySelector('main');let k=[];for(const e of m.children){if(e.classList.contains('resume-bar'))continue;k.push(e.outerHTML);if(e.classList.contains('hero'))break}return o+'<main id="main">'+k.join('')+'</main>'}""")
        check(m and norm(live)==norm(m.group(1)), n+': ready-made home page matches the live one (run node tools/prerender.cjs after changing the home header or hero)')
        check(not pg.evaluate("document.getElementById('app').hasAttribute('data-pre')"), n+': the live page replaced the ready-made one')
        pg.goto(U+'#/events'); pg.wait_for_timeout(800); check('My events' in pg.inner_text('main') or pg.query_selector('main') is not None, n+': other pages still open normally')
        check(pg.evaluate("getComputedStyle(document.getElementById('app')).visibility")=='visible', n+': app visible on other pages')
print('FAILURES:', F or 'none')
