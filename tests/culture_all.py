# Every cultural wedding: starts from its own photo, and the plan, music, menu and package searches all fit that tradition.
# python3 tests/culture_all.py <folder>   (writes <folder>/culture_queries.txt: every package search, by culture and line)
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib, re
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]; Q=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); Q.append(b); hh=hashlib.md5((b['query']+b.get('city','')).encode()).hexdigest()[:5]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':b['query'].split()[-1].title()+' Studio '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Main St, Houston, TX 77001, USA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh} for i in range(5)]}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def getev(pg, base):
    return pg.evaluate("id=>{const a=JSON.parse(localStorage.getItem('ec.events')||'{}');const l=Array.isArray(a)?a:Object.values(a);return l.find(x=>x&&x.id===id)||{}}", base.split('/')[-1])
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
data=json.loads(_os.popen("node -e \"global.window=global;require('./js/config.js');require('./js/data.js');require('./js/songs.js');require('./js/engine.js');var D=EC_DATA,E=EC_ENGINE;var o={};for(const k in D.CULTURES){var c=D.CULTURES[k];o[k]={name:c.name,add:c.add,music:c.musicDefault,menu:c.menu,search:c.search,cats:Object.fromEntries(Object.entries(D.CATEGORIES).map(([i,x])=>[i,x.name])),pl:(EC_CULTURE_SONGS[k]||{}).name||'',an:(function(){var b=E.budget({type:'wedding',culture:k,city:'Houston, TX',guests:c.guests,hours:c.hours,setting:'indoor',include:[],exclude:[],priorities:[]},'S');return c.add.map(a=>(b.items.find(i=>i.id===a)||{}).name||a)})()}};console.log(JSON.stringify(o))\"").read())
OTHER={k:[w for w in [k] ] for k in data}
log=open(f'{OUT}/culture_queries.txt','w')
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        for k,cu in data.items():
            Q.clear()
            pg.goto(U+f'#/start/{k}-wedding/Houston, TX'); pg.wait_for_selector('.inspo-chosen'); src=pg.get_attribute('.inspo-chosen img','src') or ''
            check(n, f'culture-{k}' in src, f'{k}: card starts from its own photo')
            pg.click('#next'); pg.wait_for_selector('#type')
            check(n, pg.evaluate("document.querySelector('#type').selectedOptions[0].dataset.culture")==k, f'{k}: tradition selected')
            pg.click('#setting [data-v=indoor]'); pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000)
            first=pg.inner_html('.concept >> nth=0'); check(n, f'culture-{k}' in first, f'{k}: first concept is its photo')
            pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
            ev=getev(pg, base)
            check(n, (ev.get('concept') or {}).get('inspo')==f'culture-{k}' and ev.get('culture')==k, f'{k}: plan uses its photo and tradition')
            pg.goto(U+base+'/budget'); pg.wait_for_timeout(400); bt=pg.inner_text('#tab')
            miss=[a for a in cu['an'] if a.split(' (')[0].split(':')[0] not in bt]
            check(n, not miss, f'{k}: budget has its traditions {cu["add"]} missing {miss}')
            pg.goto(U+base+'/style'); pg.wait_for_timeout(500); st=pg.inner_text('#tab')
            check(n, cu['pl'] and cu['pl'] in st, f'{k}: playlist is {cu["pl"]}')
            # package searches
            pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=40000)
            bycat={}
            for q in Q: bycat.setdefault(q.get('cat') or 'venue', []).append(q['query'])
            if n=='phone':
                log.write(f'\n== {k} ({cu["name"]})\n'); [log.write(f'  {c:14} {" | ".join(v)}\n') for c,v in bycat.items()]
            for c,qs in bycat.items():
                if c in cu['search']: check(n, cu['search'][c] in qs[0], f'{k}: {c} searches "{cu["search"][c]}" first, got "{qs[0]}"')
            bad=[(c,q) for c,qs in bycat.items() for q in qs for o in data if o!=k and o!='fusion' and k!='fusion' and re.search(r'\b'+{'africanamerican':'zzz'}.get(o,o)+r'\b', q)]
            check(n, not bad, f'{k}: no other culture in its searches {bad[:2]}')
            fl=bycat.get('florals',[]); check(n, not fl or re.search(r'flor', fl[0]), f'{k}: florals line searches florists: {fl[:1]}')
            pg.screenshot(path=f'{OUT}/culture_{k}_{n}.png')
        # switching a classic plan to a tradition picks up that tradition's photo, and back
        pg.goto(U+'#/new/1'); pg.fill('#text','Blush and ivory wedding for 150'); pg.click('#next'); pg.wait_for_selector('#type'); pg.select_option('#type','wedding')
        pg.select_option('#country','US'); pg.wait_for_timeout(150); pg.select_option('#city','Houston, TX'); pg.click('#setting [data-v=indoor]'); pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2]); pg.goto(U+base+'/overview'); pg.wait_for_selector('#cultureSel'); pg.select_option('#cultureSel','mexican'); pg.wait_for_timeout(600)
        ev=getev(pg, base)
        check(n, ev['concept'].get('inspo')=='culture-mexican', 'switching to Mexican picks the Mexican photo: '+str(ev['concept'].get('inspo')))
        check(n, 'culture-mexican' in pg.inner_html('main'), 'plan shows the Mexican photo')
        pg.select_option('#cultureSel',''); pg.wait_for_timeout(600)
        ev=getev(pg, base)
        check(n, not str(ev['concept'].get('inspo') or '').startswith('culture-'), 'back to classic drops the cultural photo')
        # typed words: "Persian wedding" with no photo picks the Persian photo
        pg.goto(U+'#/new/1'); pg.fill('#text','Persian wedding, gold and ivory, 200 guests'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#country','US'); pg.wait_for_timeout(150); pg.select_option('#city','Houston, TX'); pg.click('#setting [data-v=indoor]')
        if pg.evaluate("document.querySelector('#type').selectedOptions[0].dataset.culture")!='persian': pg.select_option('#type', index=[i for i,o in enumerate(pg.evaluate("[...document.querySelectorAll('#type option')].map(o=>o.dataset.culture||'')")) if o=='persian'][0])
        pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000)
        check(n, 'culture-persian' in pg.inner_html('.concept >> nth=0'), 'typed "Persian wedding" starts from the Persian photo')
        check(n, not e, 'no page errors '+str(e[:2])); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
log.close()
print('FAILURES:', F or 'none')
