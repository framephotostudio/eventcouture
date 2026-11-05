# Hotel ballroom is its own choice, and venues come nicest first: python3 tests/venue_luxe.py [port] [folder]
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys
PORT=sys.argv[1] if len(sys.argv)>1 else '8765'; U=f'http://localhost:{PORT}/'; OUT=sys.argv[2] if len(sys.argv)>2 else '/tmp'
def P(i,name,r,n,pl,ad): return {'id':f'p{i}','name':name,'rating':r,'reviews':n,'priceLevel':pl,'address':ad,'mapsUrl':'https://maps.google.com/?q=p'+str(i),'website':'https://example.com/'+str(i)}
LA=[P(1,'Hilton Los Angeles Airport',4.5,6000,'PRICE_LEVEL_EXPENSIVE','5711 W Century Blvd, Los Angeles, CA 90045'),
    P(2,'Courtyard by Marriott LAX',4.6,2500,'PRICE_LEVEL_MODERATE','6161 W Century Blvd, Los Angeles, CA'),
    P(3,'The Peninsula Beverly Hills',4.7,1400,'PRICE_LEVEL_VERY_EXPENSIVE','9882 S Santa Monica Blvd, Beverly Hills, CA'),
    P(4,'Beverly Wilshire, A Four Seasons Hotel',4.6,2100,'PRICE_LEVEL_VERY_EXPENSIVE','9500 Wilshire Blvd, Beverly Hills, CA'),
    P(5,'Waldorf Astoria Beverly Hills',4.6,1300,'PRICE_LEVEL_VERY_EXPENSIVE','9850 Wilshire Blvd, Beverly Hills, CA'),
    P(6,'Grand Plaza Banquet Hall',4.8,900,'PRICE_LEVEL_MODERATE','100 Main St, Los Angeles, CA'),
    P(7,'Vibiana Event Venue',4.7,700,'PRICE_LEVEL_EXPENSIVE','214 S Main St, Los Angeles, CA'),
    P(9,'InterContinental Los Angeles Century City',4.5,2600,'PRICE_LEVEL_EXPENSIVE','2151 Avenue of the Stars, Los Angeles, CA'),
    P(10,'The Beverly Hilton',4.4,5200,'PRICE_LEVEL_EXPENSIVE','9876 Wilshire Blvd, Beverly Hills, CA'),
    P(8,'Convention Center Event Hall',4.6,4000,'PRICE_LEVEL_MODERATE','1201 S Figueroa St, Los Angeles, CA')]
REQ=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); REQ.append(b)
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':LA if not b.get('kind') else []}), headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
fails=[]
def check(n, ok, what):
    print(n, 'OK ' if ok else 'FAIL', what)
    if not ok: fails.append(n+' '+what)
def venues(pg):
    return pg.evaluate("""() => { const all = JSON.parse(localStorage.getItem('ec.events')||localStorage.getItem('ec:events')||'null'); let ev=null;
      for (const k of Object.keys(localStorage)) { try { const v=JSON.parse(localStorage.getItem(k)); const list=Array.isArray(v)?v:(v&&v.packages?[v]:Object.values(v||{})); for (const e of list) if (e&&e.packages&&e.packages.length) ev=e; } catch(x){} }
      if (!ev) return []; return ev.packages.map(pk => { const id=pk.items.venue; const o=(ev.shortlist||[]).concat(ev.options||[]).find(x=>x&&x.id===id); return o?o.name:id; }); }""")
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        for kind in ['ballroom','indoor','tight','low']:
            budget = {'tight':'55000','low':'25000'}.get(kind,''); kind0 = kind; kind = 'ballroom' if kind in ('tight','low') else kind
            REQ.clear()
            ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
            pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
            pg.goto(U+'#/new/1'); pg.wait_for_timeout(300); pg.fill('#text','ivory and gold black tie wedding'); pg.click('#next'); pg.wait_for_timeout(250)
            pg.select_option('#type','wedding'); pg.fill('#guests','150'); pg.fill('#expected','150'); pg.select_option('#city','Los Angeles, CA')
            if budget: pg.fill('#budget', budget)
            labels=pg.inner_text('#setting')
            if kind=='ballroom': check(n, 'Hotel ballroom' in labels and 'banquet' not in labels.split('Hotel ballroom')[1].split('\n')[0], 'chip reads Hotel ballroom on its own'); check(n, 'Event venue or banquet hall' in labels, 'chip reads Event venue or banquet hall')
            pg.click(f'#setting [data-v={kind}]'); pg.screenshot(path=f'{OUT}/{n}-{kind}-where.png') if kind=='ballroom' else None
            pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.wait_for_timeout(300)
            pg.click('.concept button.gold >> nth=0'); pg.wait_for_selector('.pkg-cmp', timeout=20000); pg.wait_for_timeout(800)
            vq=[r for r in REQ if not r.get('kind')]
            check(n, bool(vq) and all('Beverly Hills' in r['city'] for r in vq[:1]), f'{kind}: general LA search starts in Beverly Hills {[r["city"] for r in vq][:2]}')
            if kind=='ballroom': check(n, all('hotel ballroom' in r['query'] and 'banquet' not in r['query'] for r in vq), f'ballroom search is hotels only {[r["query"] for r in vq]}')
            else: check(n, all('hotel' not in r['query'] for r in vq), f'event venue search has no hotels {[r["query"] for r in vq]}')
            txt=pg.inner_text('body'); vs=venues(pg); print('   venues:', vs)
            LUX=['Peninsula','Four Seasons','Waldorf']; FOUR=['InterContinental','Beverly Hilton']
            if kind0=='ballroom': check(n, len(vs)>=1 and any(any(x in (v or '') for x in LUX) for v in vs), 'no budget: the lavish package uses a luxury Beverly Hills hotel')
            if kind0=='low': check(n, len(vs)>=2 and not any(x in ' '.join(vs[:2]) for x in LUX), '$25,000 for 150: no 5-star hotel first')
            if kind0=='tight': check(n, len(vs)>=2 and any(x in vs[0] for x in FOUR) and any(x in vs[1] for x in FOUR), f'$55,000 for 150: packages 1 and 2 use nice 4-star hotels that fit')
            if kind0=='indoor': check(n, len(vs)>=1 and not any('Hotel' in (v or '') or 'Hilton' in (v or '') or 'Four Seasons' in (v or '') for v in vs), 'event venue packages have no hotels')
            check(n, 'Airport' not in ' '.join(vs) and 'LAX' not in ' '.join(vs), 'no airport hotels picked')
            pg.screenshot(path=f'{OUT}/{n}-{kind0}-packages.png'); check(n, 'starting with Beverly Hills' in txt, 'venue area line says Beverly Hills first')
            pg.screenshot(path=f'{OUT}/{n}-{kind}-packages.png', full_page=False)
            sw=pg.evaluate('document.documentElement.scrollWidth - innerWidth'); check(n, sw<=1, f'no sideways scroll ({sw})')
            check(n, not e, f'no page errors {e[:2]}')
            ctx.close()
    b.close()
print('FAILURES:', fails or 'none')
