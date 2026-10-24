# Every control a host touches after the plan is made, on phone and desktop: python3 tests/interactions.py
import os, re
from playwright.sync_api import sync_playwright
U = 'http://localhost:8765/'
HERE = os.path.dirname(os.path.abspath(__file__))
problems = []
def check(ok, msg):
    if not ok: problems.append(msg)

def plan(pg, payer='shared', kept=True):
    pg.goto(U + '#/new/1'); pg.wait_for_timeout(300)
    pg.fill('#text', 'black and gold 40th birthday, splitting with friends'); pg.click('#next'); pg.wait_for_timeout(300)
    pg.select_option('#type', 'milestone'); pg.fill('#guests', '30'); pg.fill('#expected', '30'); pg.fill('#budget', '6000')
    pg.click('#payer [data-v=%s]' % payer); pg.click('#setting [data-v=indoor]')
    pg.click('#next'); pg.wait_for_selector('#go'); pg.click('#go'); pg.wait_for_selector('.concept'); pg.wait_for_timeout(250)
    pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head')
    if kept: pg.click('#keepBtn'); pg.click('#keepPay'); pg.wait_for_timeout(300)
    return '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, n in [(390, 'phone'), (1280, 'desktop')]:
        ctx = b.new_context(viewport={'width': w, 'height': 900}); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        def go(h): pg.goto(U + h); pg.wait_for_timeout(350)
        base = plan(pg)
        head = lambda: pg.inner_text('.plan-head')
        # date and time from the header
        go(base); pg.click('#when'); pg.fill('#wd', '2027-03-14'); pg.fill('#wt', '19:30'); pg.click('.sheet #ok'); pg.wait_for_timeout(300)
        check('March 14, 2027' in head() or 'Mar 14, 2027' in head(), n + ': date not saved: ' + head()[:200])
        go(base + '/timeline'); t = pg.inner_text('#tab')
        check('Add your event date' not in t, n + ': checklist still asks for a date')
        check('7:30 PM' in t, n + ': run of show did not move to the new start time')
        cb = pg.query_selector('[data-ck]')
        if cb: cb.check(); pg.wait_for_timeout(200); go(base + '/timeline'); check(pg.query_selector('[data-ck]:checked') is not None, n + ': checklist tick not kept')
        # compare levels and undo
        go(base); before = head()
        pg.click('#cmpLevels'); pg.click('.sheet [data-pick=U]'); pg.wait_for_timeout(300)
        check('Ultra' in head() or 'Estimated total' in head(), n + ': level switch failed')
        pg.click('.toast.undo button'); pg.wait_for_timeout(300); check(head() == before, n + ': undo after level switch did not restore')
        # budget: remove a line, add it back; add and clear a price
        go(base + '/budget'); lines = len(pg.query_selector_all('[data-drop]'))
        pg.click('[data-drop] >> nth=-1'); pg.wait_for_timeout(300)
        check(pg.query_selector('[data-restore]') is not None, n + ': no add-back chip after removing a line')
        pg.click('[data-restore] >> nth=0'); pg.wait_for_timeout(300); check(len(pg.query_selector_all('[data-drop]')) == lines, n + ': add back did not restore the line')
        pg.click('[data-price] >> nth=0'); pg.fill('.sheet #amt', '1234'); pg.select_option('.sheet #src', 'quote'); pg.click('.sheet #ok'); pg.wait_for_timeout(300)
        t = pg.inner_text('#tab'); check('$1,234' in t and 'Got a price' in t, n + ': quote not shown')
        pg.click('[data-price] >> nth=0'); pg.click('.sheet #clr'); pg.wait_for_timeout(300); check('$1,234' not in pg.inner_text('#tab'), n + ': price not cleared')
        # guests, bulk paste, co-host, seating
        go(base + '/guests')
        pg.fill('#gn', 'Ava Stone'); pg.fill('#gp', '1'); pg.click('#addg button'); pg.wait_for_timeout(250)
        pg.click('#bulk'); pg.fill('.sheet #names', 'Ben\nCara\nDee'); pg.click('.sheet #ok'); pg.wait_for_timeout(300)
        t = pg.inner_text('#tab'); check(all(x in t for x in ['Ava Stone', 'Ben', 'Cara', 'Dee']), n + ': guests not added')
        pg.fill('#cn', 'Maya'); pg.select_option('#cr', index=2); pg.click('#addc button'); pg.wait_for_timeout(250)
        check('Maya' in pg.inner_text('#tab'), n + ': co-host not added')
        pg.select_option('[data-st] >> nth=0', 'yes'); pg.wait_for_timeout(250); pg.click('#seat'); pg.wait_for_timeout(250); check('Table 1' in pg.inner_text('#tab'), n + ': seating not done')
        # cost splitting
        go(base + '/invite'); t = pg.inner_text('#tab')
        check('Cost splitting' in t, n + ': splitting missing when the host chose splitting')
        pg.fill('#stot', '600'); pg.press('#stot', 'Tab'); pg.wait_for_timeout(250)
        for nm in ['Ava', 'Ben', 'Cara']: pg.fill('#sname', nm); pg.click('#sadd button'); pg.wait_for_timeout(200)
        check('$200' in pg.inner_text('#tab'), n + ': share not $200: ' + pg.inner_text('#tab')[-400:])
        pg.check('[data-paid="0"]'); pg.wait_for_timeout(250); go(base + '/invite'); check(pg.query_selector('[data-paid="0"]:checked') is not None, n + ': paid tick not kept')
        # album, gifts, thank-you note
        go(base + '/after')
        pg.set_input_files('#alb', [os.path.join(HERE, 'pink.jpg')]); pg.wait_for_timeout(1200)
        go(base + '/after'); check(len(pg.query_selector_all('#tab img')) >= 1, n + ': album photo not added')
        pg.fill('#gf', 'Aunt Rose'); pg.fill('#gg', 'Champagne flutes'); pg.click('#gadd button'); pg.wait_for_timeout(250)
        check('Aunt Rose' in pg.inner_text('#tab'), n + ': gift not added')
        d = pg.query_selector('[data-draft]')
        if d: d.click(); pg.wait_for_timeout(250); nt = pg.input_value('.sheet #note'); check('Dear Aunt' in nt and 'champagne flutes' in nt, n + ': thank-you note wrong: ' + nt[:80]); pg.click('.sheet [data-close]')
        else: check(False, n + ': no thank-you note button')
        # move up a size
        go(base + '/extras'); pg.click('#upg'); pg.wait_for_timeout(250)
        bb = pg.query_selector('.sheet .btn.gold, .sheet #buy')
        if bb: bb.click(); pg.wait_for_timeout(300)
        check('76 to 150' in pg.inner_text('#tab') or '76' in pg.inner_text('#tab'), n + ': pass did not move up: ' + pg.inner_text('#tab')[:200])
        # change concept and see three new ones
        go(base); pg.click('text=Change concept'); pg.wait_for_selector('.concept'); first = pg.inner_text('.concept h3 >> nth=0') if pg.query_selector('.concept h3') else ''
        if pg.query_selector('#more'):
            pg.click('#more'); pg.wait_for_timeout(800)
            names = [x.inner_text() for x in pg.query_selector_all('.concept h3')]
            check(first not in names, n + ': more concepts repeated the first look')
            check(pg.query_selector('#more') is None, n + ': more-concepts button still there after the free set')
        pg.click('.concept button >> nth=1'); pg.wait_for_selector('.plan-head'); pg.wait_for_timeout(200)
        # delete the event
        go(base + '/extras'); pg.click('#del'); pg.click('.sheet #yes'); pg.wait_for_timeout(400)
        check('#/events' in pg.url, n + ': delete did not go to My events')
        go(base); check('doesn' in pg.inner_text('main').lower() or 'not' in pg.inner_text('main').lower(), n + ': deleted event still opens')
        # samples can't be changed
        go('#/sample/1/budget'); pg.click('[data-drop] >> nth=0'); pg.wait_for_timeout(200)
        check(pg.query_selector('.toast') and 'sample' in pg.inner_text('.toast').lower(), n + ': sample allowed an edit')
        # help assistant
        go('#/help'); pg.fill('#q', 'can I get a refund'); pg.click('#ask button'); pg.wait_for_timeout(400)
        check('refund' in pg.inner_text('#chat').lower() or 'Apple' in pg.inner_text('#chat'), n + ': help did not answer')
        # vendor listing form
        go('#/vendors')
        pg.evaluate('''() => {
          document.querySelectorAll('[id^="v_"]').forEach(el => {
            if (el.tagName === 'SELECT') { el.selectedIndex = 1; el.dispatchEvent(new Event('change', {bubbles: true})); }
            else if (el.tagName === 'TEXTAREA') { el.value = 'Full setup and cleanup'; el.dispatchEvent(new Event('input', {bubbles: true})); }
            else if (el.tagName === 'INPUT' && el.type === 'checkbox') { el.checked = true; el.dispatchEvent(new Event('change', {bubbles: true})); }
            else if (el.tagName === 'INPUT') { el.value = el.type === 'number' ? '5' : 'Gilded Events'; el.dispatchEvent(new Event('input', {bubbles: true})); }
            else if (el.dataset.multi !== undefined) { const c = el.querySelector('.chip'); if (c) c.click(); }
          });
        }''')
        pg.click('#submit'); pg.wait_for_timeout(400)
        check(pg.query_selector('.sheet') and 'listing' in pg.inner_text('.sheet').lower(), n + ': vendor listing not accepted: ' + (pg.inner_text('.toast') if pg.query_selector('.toast') else ''))
        # drafts: start one, save for later, delete it
        go('#/new/1'); pg.fill('#text', 'garden tea party'); pg.click('#later'); pg.wait_for_timeout(300)
        go('#/events'); has = 'garden' in pg.inner_text('main').lower() or 'Untitled' in pg.inner_text('main')
        check(has, n + ': saved draft not in My events')
        dl = pg.query_selector('[data-rmd]')
        if dl: dl.click(); pg.click('.sheet #yes'); pg.wait_for_timeout(300)
        # visiting the planner without doing anything leaves no empty draft
        go('#/events'); before = pg.inner_text('main'); go('#/new/1'); go('#/events')
        check(pg.inner_text('main').count('Untitled event') == before.count('Untitled event'), n + ': empty draft created just by opening the planner')
        check(not errs, n + ': page errors ' + str(errs[:3]))
        ctx.close()
    b.close()
print('\n'.join(problems) if problems else 'all interactions ok')
