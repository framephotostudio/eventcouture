# Seating chart: tables of any size, a head table, moving guests, auto-seating with plus-ones, and the printable chart.
# python3 tests/seating.py <folder> [port]
from playwright.sync_api import sync_playwright
import os as _os, sys as _sys; _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__))); import _open  # noqa
import sys, json
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'; PORT=sys.argv[2] if len(sys.argv)>2 else '8765'; U=f'http://localhost:{PORT}/'
fails=[]
def check(n, ok, what):
    print(n, 'OK ' if ok else 'FAIL', what)
    if not ok: fails.append(n+' '+what)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(390,844,'phone'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); e=[]; pg.on('pageerror',lambda x:e.append(str(x)))
        pg.goto(U+'#/new/1'); pg.wait_for_timeout(300); pg.fill('#text','ivory and gold wedding'); pg.click('#next'); pg.wait_for_timeout(250)
        pg.select_option('#type','wedding'); pg.fill('#guests','120'); pg.select_option('#city','Houston, TX'); pg.click('#setting [data-v=indoor]'); pg.click('#next')
        pg.wait_for_selector('.concept', timeout=20000); pg.click('.concept button >> nth=0'); pg.wait_for_timeout(800)
        base='#/'+'/'.join(pg.url.split('#/')[1].split('/')[:2]); eid=base.split('/')[2]
        ev=lambda: pg.evaluate("id => JSON.parse(localStorage['ec.events'])[id]", eid)
        pg.goto(U+base+'/guests'); pg.wait_for_selector('#seating')
        check(n, 'No one is marked Coming' in pg.inner_text('#seating'), 'tells her to mark guests Coming first')
        pg.click('#stAuto'); pg.wait_for_timeout(200); check(n, 'No one is marked' in pg.inner_text('body'), 'Seat everyone with no one coming explains why')
        names=['Ava','Bri','Cam','Dee','Eli','Fay','Gus','Hal','Ivy','Jo','Kai','Lu']; plus=[1,0,2,0,1,0,0,3,0,1,0,0]
        pg.click('#bulk'); pg.fill('.sheet #names', '\n'.join(names)); pg.click('.sheet #ok'); pg.wait_for_timeout(300)
        # plus-ones and Coming for all (directly, like RSVPs coming in)
        pg.evaluate("([id, plus]) => { var all = JSON.parse(localStorage['ec.events']); var e = all[id]; e.guestsList.forEach((g, i) => { g.status = 'yes'; g.plusOnes = plus[i]; }); localStorage['ec.events'] = JSON.stringify(all); }", [eid, plus])
        pg.reload(); pg.wait_for_selector('#seating')
        un=pg.inner_text('.st-un'); check(n, 'Not seated yet (20 guests)' in un, 'shows 20 guests (12 + 8 plus-ones) not seated: '+un.split('\n')[0])
        pg.click('#stAuto'); pg.wait_for_timeout(300)
        E=ev(); st=E['seating']; tabs=st['tables']
        used={t['id']:sum(1+g.get('plusOnes',0) for g in E['guestsList'] if g.get('table')==t['id']) for t in tabs}
        check(n, all(g.get('table') for g in E['guestsList']), 'everyone coming is seated')
        check(n, all(used[t['id']]<=t['seats'] for t in tabs) and len(tabs)==3, f'3 tables of 8, none over: {list(used.values())}')
        pg.screenshot(path=f'{OUT}/seat-auto-{n}.png', full_page=False); pg.locator('#seating').screenshot(path=f'{OUT}/seat-chart-{n}.png')
        # head table and moving a guest there
        pg.click('#stHead'); pg.wait_for_timeout(250)
        check(n, ev()['seating']['tables'][0]['name']=='Head table' and pg.query_selector('#stHead') is None, 'head table added first, button gone')
        pg.click('.st-t:not(.head) .st-g >> nth=0'); pg.wait_for_selector('.sheet .st-pick'); first=pg.inner_text('.sheet h3')
        pg.click('.sheet [data-to] >> nth=0'); pg.wait_for_timeout(300)
        E=ev(); head=E['seating']['tables'][0]; at=[g['name'] for g in E['guestsList'] if g.get('table')==head['id']]
        check(n, len(at)==1 and head['seats']>=1+[g for g in E['guestsList'] if g.get('table')==head['id']][0].get('plusOnes',0), f'moved {first} to the head table, seats grew to fit: {at} {head["seats"]}')
        # rename and resize a table
        pg.click('[data-stedit] >> nth=1'); pg.wait_for_selector('.sheet #tName'); pg.fill('.sheet #tName', "Bride's family"); pg.fill('.sheet #tSeats', '10'); pg.click('.sheet #tSave'); pg.wait_for_timeout(250)
        check(n, "Bride's family" in pg.inner_text('#seating') and ev()['seating']['tables'][1]['seats']==10, 'rename and resize a table')
        # seats per table setting
        pg.select_option('#stSize', '10'); pg.wait_for_timeout(250); T=ev()['seating']['tables']
        check(n, ev()['seating']['size']==10 and T[2]['seats']==10, 'Seats per table changes the regular tables')
        # remove a table: its guests go back to Not seated
        pg.click('[data-stedit] >> nth=2'); pg.wait_for_selector('.sheet #tDel'); pg.click('.sheet #tDel'); pg.wait_for_timeout(250)
        check(n, pg.query_selector('.st-un') is not None, 'removing a table sends its guests back to Not seated')
        # a guest who stops coming leaves the chart
        g0=[g for g in ev()['guestsList'] if g.get('table')][0]
        pg.select_option(f'[data-st="{g0["id"]}"]', 'declined'); pg.wait_for_timeout(250)
        check(n, not [g for g in ev()['guestsList'] if g['id']==g0['id']][0].get('table'), 'a guest who declines is taken off the chart')
        # move to a new table
        pg.click('.st-un .st-g >> nth=0'); pg.wait_for_selector('.sheet .st-pick'); pg.click('.sheet [data-to="new"]'); pg.wait_for_timeout(250)
        check(n, len(ev()['seating']['tables'])==4, 'seat a guest at a new table')
        # printable chart content
        html=pg.evaluate("() => { document.querySelector('#seatPrint').innerHTML = ''; return 1 }")
        pg.evaluate("() => { window.print = () => { window.__printed = document.querySelector('#seatPrint').innerText; }; }")
        pg.click('#stPrint'); pg.wait_for_timeout(400)
        if pg.query_selector('.sheet #keepPay'): pg.click('.sheet #keepPay'); pg.wait_for_timeout(800)
        pr=pg.evaluate('window.__printed || ""')
        check(n, 'Find your seat' in pr and "Bride's family" in pr and 'Lu' in pr, 'printable chart has every table and an A-to-Z list: '+pr[:80].replace('\n',' '))
        sw=pg.evaluate('document.documentElement.scrollWidth - innerWidth'); check(n, sw<=1, f'no sideways scroll ({sw})')
        pg.locator('#seating').screenshot(path=f'{OUT}/seat-final-{n}.png')
        # old plans seated with numbered tables keep their tables
        pg.evaluate("id => { var all = JSON.parse(localStorage['ec.events']); var e = all[id]; delete e.seating; e.guestsList.forEach((g, i) => { g.status = 'yes'; g.table = i < 6 ? 1 : 2; }); localStorage['ec.events'] = JSON.stringify(all); }", eid)
        pg.reload(); pg.wait_for_selector('#seating')
        check(n, 'Table 1' in pg.inner_text('#seating') and 'Table 2' in pg.inner_text('#seating') and pg.query_selector('.st-un') is None, 'an old numbered chart carries over')
        check(n, not e, f'no page errors {e[:2]}')
        ctx.close()
    b.close()
print('FAILURES:', fails or 'none')
