# Finished plan: proposal cover, mood board, PDF cover page, and the view-only link (create, open read-only, no budget when unticked, stop sharing): python3 tests/proposal.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, sys, hashlib, re
PROPS={}
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; F=[]
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    if u.endswith('/api/places'):
        b=json.loads(route.request.post_data); q=b['query']; hh=hashlib.md5((q+b.get('city','')).encode()).hexdigest()[:5]; city=b.get('city','').split(',')[0]
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'places':[{'id':hh+str(i),'name':q.split()[-1].title()+' Pros '+'ABCDE'[i],'rating':4.9-i*0.1,'reviews':200,'address':f'{i+1} Ocean Ave, {city}, CA','mapsUrl':'https://maps.google.com/?q='+hh,'website':'https://example.com/'+hh} for i in range(5)]}), headers=h)
    elif '/api/prop/' in u:
        m=re.search(r'/api/prop/([a-f0-9]+)(?:/(publish|delete))?$', u); pid, act = m.group(1), m.group(2)
        if act=='publish': PROPS[pid]=json.loads(route.request.post_data)['plan']; route.fulfill(status=200, content_type='application/json', body='{"ok":true}', headers=h)
        elif act=='delete': PROPS.pop(pid, None); route.fulfill(status=200, content_type='application/json', body='{"ok":true}', headers=h)
        elif pid in PROPS: route.fulfill(status=200, content_type='application/json', body=json.dumps({'plan':PROPS[pid]}), headers=h)
        else: route.fulfill(status=404, content_type='application/json', body='{"error":"This plan link isn’t available."}', headers=h)
    elif u.endswith('/api/status'): route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    elif '/api/vendors' in u: route.fulfill(status=200, content_type='application/json', body='{"vendors":[]}', headers=h)
    else: route.fulfill(status=500, body='{}', headers=h)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
def check(n, ok, what): print(n, 'OK  ' if ok else 'FAIL', what); (None if ok else F.append(n+' '+what))
def plan(pg, city, start='#/start/arabic-wedding/', text='Ivory and gold wedding with a grand zaffe entrance'):
    pg.goto(U+start); pg.wait_for_selector('#text'); pg.fill('#text', text); pg.click('#next'); pg.wait_for_selector('#type')
    if city.endswith((', ON',', BC',', QC',', AB')): pg.select_option('#country','CA'); pg.wait_for_timeout(200)
    pg.select_option('#city', city); pg.fill('#guests','200'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
    pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    return '#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2])
with sync_playwright() as p:
    b=p.chromium.launch()
    for n,w,h in [('phone',390,844),('desktop',1280,900)]:
        PROPS.clear(); ctx=b.new_context(viewport={'width':w,'height':h}, accept_downloads=True, device_scale_factor=2); pg=ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        base=plan(pg,'Houston, TX','#/start/wedding/-/blush-wisteria-ballroom','Blush and gold ballroom wedding with roses')
        pg.goto(U+base+'/plan'); pg.wait_for_selector('#pdfPlan')
        check(n, pg.query_selector('.ps-cover img') is not None and 'AI-generated inspiration' in pg.inner_text('.ps-cover'), 'cover photo with the AI label')
        check(n, len(pg.query_selector_all('.mb-sw'))>=3, 'mood board colors with names')
        pg.click('#linkPlan'); pg.wait_for_selector('.sheet #keepPay'); pg.click('.sheet #keepPay'); pg.wait_for_timeout(500)
        pg.goto(U+base+'/plan'); pg.wait_for_selector('#linkPlan'); pg.wait_for_timeout(1500)
        if n=='phone': pg.screenshot(path=f'{OUT}/plan_cover_{n}.png'); pg.evaluate("document.querySelector('.moodboard').scrollIntoView({block:'center'})"); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/plan_mood_{n}.png')
        with pg.expect_download() as d: pg.click('#pdfPlan')
        d.value.save_as(f'{OUT}/plan_{n}.pdf'); pdf=open(f'{OUT}/plan_{n}.pdf','rb').read()
        check(n, b'/Subtype /Image' in pdf and b'/DCTDecode' in pdf, 'PDF has the cover photo')
        pg.click('#linkPlan'); pg.wait_for_selector('.sheet #propGo'); pg.uncheck('.sheet #propBudget'); pg.click('.sheet #propGo'); pg.wait_for_timeout(1500)
        check(n, pg.query_selector('.sheet #propUrl') is not None and '#/p/' in pg.input_value('.sheet #propUrl'), 'link shown with a Copy button'); pg.click('.sheet [data-close]'); pg.wait_for_timeout(300)
        check(n, len(PROPS)==1, 'link published')
        snap=list(PROPS.values())[0] if PROPS else {}
        check(n, not any(x['h'].startswith('Budget') for x in snap.get('sections',[])), 'budget left out when unticked')
        check(n, (snap.get('cover') or {}).get('src','').startswith('http'), 'cover photo address is shared, not a file from the device')
        check(n, all(not r[2] for x in snap.get('sections',[]) for r in (x.get('rows') or [])), 'no prices anywhere when the budget is left out')
        pid=list(PROPS.keys())[0] if PROPS else 'x'
        pg2=ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e))); pg2.route('**/js/config.js*', cfg); pg2.route('http://api.test/**', api)
        pg2.goto(U+'#/p/'+pid); pg2.wait_for_selector('.proposal', timeout=10000); t=pg2.inner_text('main')
        check(n, 'Blush' in t and 'Mood board' in t and 'Planned with Event Couture' in t and 'Budget, ' not in t and not pg2.query_selector('#pdfPlan, .ps-edit'), 'view-only page shows the plan, no budget, no edit buttons')
        if n=='phone': pg2.screenshot(path=f'{OUT}/proposal_{n}.png', full_page=True)
        pg.click('#linkPlan'); pg.wait_for_selector('.sheet #propStop'); pg.click('.sheet #propStop'); pg.wait_for_timeout(800)
        check(n, not PROPS, 'stop sharing deletes the link')
        pg2.reload(); pg2.wait_for_timeout(1200); check(n, 'isn’t available' in pg2.inner_text('main'), 'old link says it is not available')
        check(n, not errs, 'no page errors '+str(errs[:2]))
print('FAILURES:', F or 'none')
