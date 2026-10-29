# Indian wedding packages: right kind of business on every line, backups fill short lines, nothing left empty: python3 tests/culture_pkg.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]; Q=[]
def B(name, i=0): h=hashlib.md5(name.encode()).hexdigest()[:6]; return {'id':h,'name':name,'rating':4.9-i*0.05,'reviews':300-i*20,'address':('115 Grand Ave, Englewood, NJ 07631, USA' if 'Jersey' in name else f'{i+1} Main St, Houston, TX 77002, USA'),'mapsUrl':'https://maps.google.com/?q='+h,'website':'https://example.com/'+h}
SPECIAL={
 'indian wedding favors': ['Islamic Society of Greater Houston','Piñatas Express','Mango Party Balloon Decoration Houston','Rani Wedding Favors','Mithai Box Co','Desi Gift Studio'],
 'hindu priest pandit wedding': ['Ashton Gardens North Houston','Pandit Sharma Wedding Priest','Houston Hindu Temple','Shastri Ceremonies'],
 'indian wedding singer': ['Desi Junction DJs - Indian Wedding DJs','GSH Event Center','Raag Live Singer'],
 'baraat horse rental': ['Jersey Baraat Horses'],
 'mandap decor rental': ['Foto Vibe','Mandap Creations','Royal Stage Decor','Shaadi Decor'],
 'wedding horse rental': ['Royal White Horse Baraat','Houston Carriage Co'],
 'indian wedding band': ['Sur Sangam Band'],
 'mehndi henna artist': ['Maquillage','Henna by Priya','Mehndi Magic','Artistry By Zurays'],
}
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); q=b['query']; Q.append((b.get('cat',''),q))
        names=['Dhol Beats Houston'] if b.get('cat')=='dhol' else SPECIAL.get(q)
        if names is None: names=[q.split()[-1].title()+' Studio '+c for c in 'ABCDE']
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[B(n,i) for i,n in enumerate(names)]}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        Q.clear(); ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U+'#/start/indian-wedding/'); pg.wait_for_selector('#text'); pg.fill('#text','Red and gold Indian wedding with marigolds'); pg.click('#next'); pg.wait_for_selector('#type')
        pg.select_option('#city','Houston, TX'); pg.fill('#guests','300'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
        pg.goto(U+base+'/overview'); pg.wait_for_selector('#pkgStart'); pg.click('#pkgStart'); pg.wait_for_selector('.pkg-cmp', timeout=20000)
        for _ in range(2): pg.click('#pkgMore'); pg.wait_for_timeout(1500)
        pg.wait_for_function("document.querySelectorAll('.pkg-cmp thead th.pk-colh').length>=3")
        cell=lambda cat: [x.inner_text() for x in pg.query_selector_all(f'tr[data-pkrow="{cat}"] td > b')]
        empties=[r.get_attribute('data-pkrow') for r in pg.query_selector_all('tr[data-pkrow]') if len(r.query_selector_all('td > b'))<3]
        check(n, not empties, 'no empty spots in any of the 3 packages '+str(empties))
        fav=' '.join(cell('favors')); check(n, 'Piñatas' not in fav and 'Balloon' not in fav, 'no piñata or balloon shops for wedding favors: '+fav)
        off=' '.join(cell('officiant')); check(n, 'Ashton Gardens' not in off and 'Pandit Sharma' in off, 'officiant is a priest, never a venue: '+off)
        sg=' '.join(cell('singer')) if pg.query_selector('tr[data-pkrow="singer"]') else 'Raag'; check(n, 'DJs' not in sg and 'Event Center' not in sg, 'singer is a singer: '+sg)
        check(n, 'Islamic Society' not in fav, 'never a mosque or community group for favors')
        md=' '.join(cell('mandap')); check(n, 'Foto Vibe' not in md, 'a photo studio is never the stage/mandap: '+md)
        bt=' '.join(cell('baraat')); check(n, 'Jersey' not in bt, 'never a business in another state: '+bt); check(n, 'Horse' in bt, 'baraat filled from the backup search: '+bt)
        mh=cell('mehndi'); check(n, mh and mh[0] in ('Henna by Priya','Mehndi Magic'), 'henna artists come first for mehndi: '+str(mh))
        lm=cell('dhol'); check(n, len(lm)==3 and lm[0]==lm[1]==lm[2]=='Dhol Beats Houston', 'one good dhol player is shared rather than left empty: '+str(lm))
        att=[q for c,q in Q if c=='attire']; check(n, att and att[0].startswith('indian bridal wear'), 'attire searches Indian bridal wear: '+str(att[:1]))
        check(n, not any(q.startswith('luxury') or q.startswith('upscale') for c,q in Q if c in ('baraat','mehndi','dhol')), 'niche searches are not narrowed by "luxury"')
        pg.evaluate("document.querySelector('tr[data-pkrow=\"favors\"]').scrollIntoView({block:'start'})"); pg.wait_for_timeout(200); pg.screenshot(path=f'{OUT}/indian_pkg_{n}.png')
        check(n, not e, 'no page errors '+str(e)); check(n, pg.evaluate('document.documentElement.scrollWidth')<=w, 'no sideways scroll')
        ctx.close()
    b.close()
print('FAILURES:', F or 'none')
