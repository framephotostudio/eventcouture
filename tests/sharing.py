# Shared invitations: host shares, a guest on another phone RSVPs and votes, the host sees it: python3 tests/sharing.py <folder>
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import json, re, sys
U='http://localhost:8765/'; OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'
STORE={}
def api(route):
    u=route.request.url; h={'access-control-allow-origin':'*'}
    m=re.search(r'/api/inv/([a-z0-9]+)(?:/(\w+))?$', u)
    if u.endswith('/api/status'): return route.fulfill(status=200, content_type='application/json', body='{"ai":true,"places":true}', headers=h)
    if not m: return route.fulfill(status=500, body='{}', headers=h)
    i,a=m.group(1),m.group(2) or ''; b=json.loads(route.request.post_data or '{}'); rec=STORE.get(i)
    def ok(x, s=200): route.fulfill(status=s, content_type='application/json', body=json.dumps(x), headers=h)
    if route.request.method=='GET': return ok({'inv':rec['inv']}) if rec else ok({'error':'gone'},404)
    if a=='publish':
        if rec and rec['key']!=b['key']: return ok({'error':'no'},403)
        STORE[i]={'key':b['key'],'inv':b['inv'],'rsvps':rec['rsvps'] if rec else [],'votes':rec['votes'] if rec else {}}; return ok({'ok':True})
    if a=='inbox': return ok({'rsvps':rec['rsvps'],'votes':rec['votes'],'bought':[]}) if rec and rec['key']==b['key'] else ok({'error':'no'},403)
    if a=='delete': STORE.pop(i,None); return ok({'ok':True})
    if not rec: return ok({'error':'gone'},404)
    if a=='rsvp': rec['rsvps']=[r for r in rec['rsvps'] if r['name'].lower()!=b['name'].lower()]+[{'name':b['name'],'status':b['status'],'plus':b.get('plus',0),'diet':b.get('diet',[]),'at':len(rec['rsvps'])+1000}]; return ok({'ok':True})
    if a=='vote': k=f"{b['poll']}:{b['option']}"; rec['votes'][k]=rec['votes'].get(k,0)+1; return ok({'ok':True})
    return ok({'error':'nf'},404)
def cfg(route):
    r=route.fetch(); route.fulfill(response=r, body=r.text().replace("apiUrl: ''","apiUrl: 'http://api.test'"))
fails=[]
def check(n, okk, what):
    print(n, 'OK ' if okk else 'FAIL', what)
    if not okk: fails.append(n+' '+what)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        STORE.clear()
        host=b.new_context(viewport={'width':w,'height':h}); host.grant_permissions(['clipboard-read','clipboard-write']); pg=host.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.route('**/js/config.js*', cfg); pg.route('http://api.test/**', api)
        pg.goto(U+'#/new/1'); pg.wait_for_timeout(300); pg.fill('#text','gold and ivory 40th birthday dinner'); pg.click('#next'); pg.wait_for_timeout(250)
        pg.select_option('#type','birthday'); pg.fill('#guests','30'); pg.fill('#expected','30'); pg.fill('#time','19:00'); pg.select_option('#city','Houston, TX'); pg.click('#setting [data-v=indoor]')
        pg.click('#next'); pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(300)
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2]); eid=base.split('/')[2]
        # a poll for guests
        pg.goto(U+base+'/votes'); pg.wait_for_timeout(300)
        if pg.query_selector('#pq'): pg.fill('#pq','Cake flavor?'); pg.fill('#po','Vanilla, Chocolate'); pg.click('#addp button, #addp .btn, button#addp'); pg.wait_for_timeout(300)
        pg.goto(U+base+'/invite'); pg.wait_for_timeout(300); pg.click('#copy'); pg.wait_for_timeout(800)
        clip=pg.evaluate('navigator.clipboard.readText()')
        check(n, eid in STORE, 'invitation published to the server')
        check(n, clip.endswith('#/g/'+eid), 'copied the guest link: '+clip[-40:])
        inv=STORE.get(eid,{}).get('inv',{}); check(n, 'guestsList' not in json.dumps(inv) and 'budget' not in inv and inv.get('name'), 'only public details shared')
        pg.screenshot(path=f'{OUT}/share_host_{n}.png')
        # a guest on another phone
        guest=b.new_context(viewport={'width':w,'height':h}); gp=guest.new_page(); ge=[]; gp.on('pageerror',lambda x:ge.append(str(x)))
        gp.route('**/js/config.js*', cfg); gp.route('http://api.test/**', api)
        gp.goto(U+'#/g/'+eid); gp.wait_for_selector('#rsvp', timeout=8000)
        check(n, inv['name'] in gp.inner_text('.invite'), 'guest sees the invitation on her own phone')
        gp.fill('#rn','Maya Brooks'); gp.fill('#rp','1'); gp.click('#rd .chip >> nth=0'); gp.click('#rsvp .btn.gold'); gp.wait_for_timeout(500)
        check(n, 'sent to the host' in gp.inner_text('#rsvp'), 'guest RSVP sent')
        if gp.query_selector('[data-vote]'): gp.click('[data-vote] >> nth=1'); gp.wait_for_timeout(300)
        gp.screenshot(path=f'{OUT}/share_guest_{n}.png', full_page=True)
        check(n, not ge, 'no guest page errors '+str(ge))
        # host sees it after reopening
        pg.goto(U+base+'/guests'); pg.reload(); pg.wait_for_timeout(1200)
        t=pg.inner_text('#tab'); check(n, 'Maya Brooks' in t, 'host sees the RSVP in Guests')
        d=pg.evaluate("id => JSON.parse(localStorage['ec.events'])[id]", eid); g=[x for x in d['guestsList'] if x['name']=='Maya Brooks']
        check(n, g and g[0]['status']=='yes' and g[0]['plusOnes']==1, 'RSVP details merged')
        if d.get('polls'): check(n, any(o.get('rv') for p2 in d['polls'] for o in p2['options']), 'online vote counted')
        # a missing invitation
        gp.goto(U+'#/g/zzzzzz999'); gp.wait_for_timeout(800); check(n, 'isn’t available' in gp.inner_text('main'), 'missing invitation explained')
        # deleting the event removes it from the server
        pg.goto(U+base+'/extras'); pg.wait_for_timeout(300); pg.click('#del'); pg.click('.sheet #yes'); pg.wait_for_timeout(500)
        check(n, eid not in STORE, 'deleting the event removes the shared invitation')
        check(n, not e, 'no host errors '+str(e)); host.close(); guest.close()
    b.close()
print('FAILURES:', fails if fails else 'none')
