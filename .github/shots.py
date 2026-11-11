import os, json
from playwright.sync_api import sync_playwright
os.makedirs('out',exist_ok=True); U='https://eventcouture.app/'
log=lambda m: open('out/log.txt','a').write(m+'\n')
def run(pg,name,cc,city,typ,text,start='#/new/1',setting='indoor'):
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    try:
        pg.goto(U+start); pg.wait_for_timeout(2500)
        pg.fill('#text',text); pg.click('#next'); pg.wait_for_timeout(800)
        if typ: pg.select_option('#type',typ)
        pg.select_option('#country',cc); pg.wait_for_timeout(300); pg.select_option('#city',city); pg.click('#setting [data-v=%s]'%setting); pg.wait_for_timeout(300)
        pg.click('#next'); pg.wait_for_selector('.concept', timeout=90000); pg.wait_for_timeout(800)
        pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head', timeout=60000); pg.wait_for_timeout(800)
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U+base+'/budget'); pg.wait_for_selector('.pkg-cmp', timeout=120000); pg.wait_for_timeout(60000)
        if pg.query_selector('#pkgMore'): pg.click('#pkgMore'); pg.wait_for_timeout(20000)
        rows=pg.evaluate("[...document.querySelectorAll('tr[data-pkrow]')].map(r=>[r.dataset.pkrow,[...r.querySelectorAll('td')].slice(1).map(td=>{const b=td.querySelector('b');return (b?b.innerText:td.innerText.split('\\n')[0])+(td.innerText.includes('Event Couture Pick')?' [PICK]':'')})])")
        log(json.dumps({'name':name,'city':city,'rows':rows,'errors':errs},ensure_ascii=False))
        t=pg.query_selector('.pkg-cmp'); t.scroll_into_view_if_needed(); pg.wait_for_timeout(500); t.screenshot(path=f'out/{name}.png')
    except Exception as e:
        log(name+' ERR '+str(e)[:400]+' '+json.dumps(errs)); pg.screenshot(path=f'out/{name}-error.png', full_page=True)
with sync_playwright() as p:
    b=p.chromium.launch()
    for a in [('la-quince','US','Los Angeles, CA','quince','Pink and gold quinceanera with a ballroom feel'),
              ('toronto-arabic','CA','Toronto, ON',None,'Ivory and gold wedding with a grand zaffe entrance','#/start/arabic-wedding/'),
              ('miami-wedding','US','Miami, FL','wedding','Romantic white and greenery wedding')]:
        pg=b.new_page(viewport={'width':1100,'height':1000},device_scale_factor=1); run(pg,*a); pg.close()
    b.close()
