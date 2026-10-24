# 18 different clients plan their event end to end; every page of each kept plan is read and checked.
# python3 tests/personas.py <folder for plan text>   (needs the local server on :8765)
import sys, os, re, json
from playwright.sync_api import sync_playwright
U = 'http://localhost:8765/'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/personas'; os.makedirs(OUT, exist_ok=True)
TABS = ['overview', 'style', 'extras', 'budget', 'places', 'vendors', 'food', 'guests', 'invite', 'votes', 'after', 'timeline']

P = [
  dict(id='maria-brunch', text='pink and gold girls brunch with mimosas for my best friends, we each pay for ourselves', type='brunch', guests=8, city='Dallas, TX', setting='restaurant', time='11:00', budget=None, alcohol='wine', payer='own'),
  dict(id='jasmine-30th', text='black and gold glam 30th birthday, DJ, photo booth, dramatic lighting', type='milestone', guests=60, city='Atlanta, GA', setting='indoor', time='20:00', budget=9000, alcohol='full', must=['dj', 'photoBooth']),
  dict(id='priya-shower', text='sage and cream baby shower tea party at my house', type='baby-shower', guests=25, city='Houston, TX', setting='home', time=None, budget=1500, alcohol=None),
  dict(id='carlos-wedding', text='ivory and gold ballroom wedding with a live band and lots of white roses', type='wedding', guests=150, city='San Antonio, TX', setting='indoor', time='17:00', budget=40000, alcohol='full', must=['photographer', 'florals', 'liveMusic']),
  dict(id='low-budget-wedding', text='simple outdoor wedding in the desert, boho', type='wedding', guests=120, city='Phoenix, AZ', setting='outdoor', time='18:00', budget=5000, alcohol='wine'),
  dict(id='grad-backyard', text='purple and gold graduation party in the backyard', type='graduation', guests=50, city='Chicago, IL', setting='outdoor', time='15:00', budget=2000, alcohol='none'),
  dict(id='quince', text='red and gold quinceañera, elegant and glam, with family', type='quince', guests=200, city='Los Angeles, CA', setting='indoor', time='18:00', budget=25000, alcohol=None, kids=True),
  dict(id='bachelorette', text='disco cowgirl bachelorette dinner, we are splitting everything', type='bachelorette', guests=12, city='Nashville, TN', setting='privateRoom', time='19:30', budget=3000, alcohol='full', payer='shared'),
  dict(id='gala', text='navy and silver black tie charity gala', type='gala', guests=400, city='New York, NY', setting='indoor', time='19:00', budget=120000, alcohol='full'),
  dict(id='dinner-home', text='moody burgundy dinner party at home with wine', type='dinner', guests=10, city='Seattle, WA', setting='home', time='19:00', budget=800, alcohol=None),
  dict(id='gender-reveal', text='pink or blue gender reveal in the park', type='gender-reveal', guests=40, city='Orlando, FL', setting='outdoor', time=None, budget=2500, alcohol=None, kids=True),
  dict(id='anniversary-50', text='50th anniversary dinner in gold for my parents', type='anniversary', guests=80, city='Chicago, IL', setting='privateRoom', time='18:00', budget=10000, alcohol='wine'),
  dict(id='holiday', text='emerald and gold company holiday party', type='holiday', guests=100, city='Denver, CO', setting='indoor', time='19:00', budget=15000, alcohol='full'),
  dict(id='engagement', text='tropical engagement party on a rooftop', type='engagement', guests=70, city='Miami, FL', setting='indoor', time='19:00', budget=12000, alcohol='full'),
  dict(id='kids-birthday', text='rainbow pastel 7th birthday for my daughter with a bounce house', type='birthday', guests=30, city='Houston, TX', setting='home', time='14:00', budget=600, alcohol='none', kids=True),
  dict(id='other-city', text='classic dinner party', type='dinner', guests=16, city='Other US city', setting='privateRoom', time='19:00', budget=2500, alcohol='wine'),
  dict(id='tiny-anniversary', text='romantic anniversary dinner for the two of us', type='anniversary', guests=2, city='San Francisco, CA', setting='restaurant', time='20:00', budget=400, alcohol='wine'),
  dict(id='huge-wedding', text='grand wedding, ivory and gold', type='wedding', guests=1000, city='Houston, TX', setting='indoor', time='17:00', budget=None, alcohol='full'),
]

def money(t):
    m = re.search(r'\$([\d,]+)', t or ''); return int(m.group(1).replace(',', '')) if m else None

problems = []
def bad(pid, msg): problems.append(pid + ': ' + msg)

with sync_playwright() as p:
    b = p.chromium.launch()
    for i, c in enumerate(P):
        w = 390 if i % 2 == 0 else 1280   # alternate phone and desktop
        ctx = b.new_context(viewport={'width': w, 'height': 900}); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(U + '#/new/1'); pg.wait_for_timeout(300)
        pg.fill('#text', c['text']); pg.click('#next'); pg.wait_for_timeout(300)
        pg.select_option('#type', c['type'])
        pg.fill('#guests', str(c['guests'])); pg.fill('#expected', str(c['guests']))
        pg.select_option('#city', c['city'])
        if c.get('time'): pg.fill('#time', c['time'])
        if c.get('budget'): pg.fill('#budget', str(c['budget']))
        if c.get('alcohol'): pg.click('#alcohol [data-v=%s]' % c['alcohol'])
        if c.get('payer'): pg.click('#payer [data-v=%s]' % c['payer'])
        if c.get('kids'): pg.check('#kids')
        for m in c.get('must', []): pg.click('#musts [data-must=%s]' % m)
        pg.click('#setting [data-v=%s]' % c['setting'])
        name = pg.input_value('#name')
        drinks_default = pg.inner_text('#alcohol [aria-pressed=true]')
        time_default = pg.input_value('#time')
        pg.click('#next'); pg.wait_for_selector('#go'); review = pg.inner_text('.confirm')
        pg.click('#go'); pg.wait_for_selector('.concept', timeout=20000); pg.wait_for_timeout(300)
        concepts = pg.inner_text('main')
        pg.click('.concept button >> nth=0'); pg.wait_for_selector('.plan-head'); pg.wait_for_timeout(200)
        pg.click('#keepBtn'); pg.wait_for_timeout(200); keep = pg.inner_text('.sheet'); pg.click('#keepPay'); pg.wait_for_timeout(300)
        base = '#/' + '/'.join(pg.url.split('#/')[1].split('/')[:2])
        pages = {}
        for t in TABS:
            pg.goto(U + base + '/' + t); pg.wait_for_timeout(350)
            pages[t] = pg.inner_text('#tab')
            if pg.evaluate('document.documentElement.scrollWidth') > w: bad(c['id'], 'sideways scroll on ' + t)
        head = pg.inner_text('.plan-head')
        txt = '\n\n'.join('#### ' + k + '\n' + v for k, v in pages.items())
        open(os.path.join(OUT, c['id'] + '.txt'), 'w').write('NAME ' + name + '\nDRINKS DEFAULT ' + drinks_default + '\nTIME ' + time_default + '\n\nREVIEW\n' + review + '\n\nCONCEPTS\n' + concepts + '\n\nKEEP\n' + keep + '\n\nHEAD\n' + head + '\n\n' + txt)
        allt = (head + txt).lower()
        pid = c['id']
        # what the host entered is what the plan uses
        if '%d people invited' % c['guests'] not in review.replace(',', '') and '%d person invited' % c['guests'] not in review: bad(pid, 'review guest count: ' + review[:120])
        if not re.search(r'\b%s guests?\b' % format(c['guests'], ','), head): bad(pid, 'header guests wrong: ' + head[:160])
        tot = money(head.split('Estimated total')[0].split('\n')[-2] if 'Estimated total' in head else head)
        if c.get('budget'):
            if 'Fits your' in head and tot and tot > c['budget']: bad(pid, 'says fits but total %s > %s' % (tot, c['budget']))
            if 'over your budget' not in head and 'Fits your' not in head: bad(pid, 'no budget label: ' + head[-120:])
        # setting rules
        bud = pages['budget']
        if c['setting'] in ('restaurant', 'home') and 'Venue rental' in bud: bad(pid, 'venue rental charged for ' + c['setting'])
        if c['setting'] == 'restaurant' and re.search(r'^Catering$', bud, re.M): bad(pid, 'catering at a restaurant')
        if c['setting'] == 'outdoor' and 'Tent' not in bud: bad(pid, 'outdoor without a tent')
        # drinks
        alc = c.get('alcohol') or ('none' if c['type'] in ('baby-shower', 'gender-reveal', 'quince') else None)
        if alc == 'none':
            for word in ['bartender', 'cocktail', 'martini', 'champagne', 'wine', 'beer', 'mimosa', 'sangria', 'margarita', 'spritz', 'prosecco']:
                for t in ('budget', 'food', 'vendors', 'timeline', 'overview'):
                    for line in pages[t].lower().split('\n'):
                        if word in line and 'non-alcoholic' not in line and 'mocktail' not in line and 'sparkling cider' not in line and 'no alcohol' not in line and 'look in' not in line and 'colors' not in line:
                            bad(pid, 'alcohol word "%s" on %s: %s' % (word, t, line[:90])); break
        if c['type'] in ('baby-shower', 'gender-reveal', 'quince') and not c.get('alcohol') and drinks_default != 'No alcohol': bad(pid, 'drinks default for family event is ' + drinks_default)
        # who pays
        if c.get('payer') == 'own' and 'Everyone pays their own' not in bud: bad(pid, 'no pay-your-own note')
        if c['type'] == 'wedding' and c.get('payer') != 'shared' and ('cost splitting' in pages['invite'].lower() or 'your share' in pages['invite'].lower()): bad(pid, 'wedding shows cost splitting')
        if c.get('payer') == 'shared' and 'split' not in (bud + pages['invite']).lower(): bad(pid, 'splitting not shown')
        # music fits the occasion
        st = pages['style']; first = st.split('Your playlist')[1].split('\n')[1] if 'Your playlist' in st else ''
        if c['type'] not in ('wedding', 'engagement', 'anniversary', 'bridal-shower', 'bachelorette', 'dinner') and first in ('Love, Always',): bad(pid, 'romantic playlist for ' + c['type'])
        if c['type'] in ('baby-shower', 'gender-reveal', 'quince') and first in ('Velvet Lounge', 'After Hours', 'Candlelight Soul'): bad(pid, 'club playlist for family event: ' + first)
        if 'Your playlist' in st and st.count('Spotify') < 25 and 'Show all 25 songs' not in st: bad(pid, 'playlist has %d songs' % st.count('Spotify'))
        # timeline
        tl = pages['timeline']
        if 'birthday song' in tl.lower() and c['type'] not in ('birthday', 'milestone', 'quince'): bad(pid, 'birthday song at a ' + c['type'])
        if c['setting'] == 'restaurant' and 'Book the venue' in tl: bad(pid, 'restaurant asked to book a venue')
        # name ideas
        if 'brunch' in name.lower() and c['type'] != 'brunch': bad(pid, 'brunch name for ' + c['type'])
        # dress code sanity
        if c['setting'] == 'home' and 'Black tie' in pages['style']: bad(pid, 'black tie at home')
        for junk in ['undefined', 'NaN', '[object', 'null']:
            if junk in txt + head + review + concepts: bad(pid, 'text shows ' + junk)
        if errs: bad(pid, 'errors ' + str(errs[:2]))
        ctx.close()
    b.close()
print('\n'.join(problems) if problems else 'all %d clients ok' % len(P))
