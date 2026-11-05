# Tests reach every field: folded optional sections of the plan form are opened before a test types, taps or reads there.
from playwright.sync_api import Page
_OPEN = "document.querySelectorAll('details.more, details.budget-more').forEach(d => d.open = true)"
_ws = Page.wait_for_selector
def _attached(self, sel, k):
    try: _ws(self, sel, state='attached', timeout=k.get('timeout', 30000))
    except Exception: pass
def _open(self):
    try: self.evaluate(_OPEN)
    except Exception: pass
def _wrap(name):
    orig = getattr(Page, name)
    def run(self, *a, **k):
        if a and isinstance(a[0], str): _attached(self, a[0], k)
        _open(self)
        return orig(self, *a, **k)
    setattr(Page, name, run)
for _n in ('fill', 'click', 'select_option', 'check', 'press', 'inner_text', 'is_visible'): _wrap(_n)
def _wait(self, sel, *a, **k):
    # Choosing a look now builds the packages right away (Nov 4, 2026), so "Create my package" on the Summary is gone
    # once they exist. Old tests that wait for it wait for the Summary's "Open my package" link instead.
    if sel == '#pkgStart': sel = '#pkgStart, .pkg-cta a[href$="/budget"]'
    if 'state' not in k: _attached(self, sel, k)
    _open(self)
    return _ws(self, sel, *a, **k)
Page.wait_for_selector = _wait
# Keeping a plan is asked for only when she saves or shares it. Old tests that tapped "Keep my plan" at the top
# go through the real path instead: open the finished plan, tap Save as PDF, keep, and come back.
_click = Page.click
def _keep_click(self, sel, *a, **k):
    if sel == '#pkgStart' and not self.query_selector('#pkgStart'):
        return _click(self, '.pkg-cta a[href$="/budget"]')
    if sel in ('#keepBtn', '[data-keep]'):
        self._keep_return = self.url
        base = '#/' + '/'.join(self.url.split('#/')[1].split('/')[:2])
        self.goto(self.url.split('#')[0] + base + '/plan'); _ws(self, '#pdfPlan')
        return _click(self, '#pdfPlan')
    if sel in ('#keepPay', '.sheet #keepPay') and getattr(self, '_keep_return', None):
        r = _click(self, '#keepPay'); back = self._keep_return; self._keep_return = None
        self.wait_for_timeout(150); self.goto(back); self.wait_for_timeout(250); return r
    r = _click(self, sel, *a, **k)
    # Choosing a package opens a one-time "What's next" prompt: old tests carry on with "Book my vendors first".
    if isinstance(sel, str) and sel.startswith('[data-pkuse'):
        self.wait_for_timeout(500)
        nx = self.query_selector('.sheet button[data-close]')
        if nx and 'Book my vendors first' in (nx.inner_text() or ''): nx.click(); self.wait_for_timeout(200)
    # Choosing a look builds the packages right away: old tests wait until they're built before going anywhere else.
    if isinstance(sel, str) and sel.startswith('.concept button'):
        self.wait_for_timeout(400)
        if self.url.rstrip('/').endswith('/budget'):
            try: _ws(self, '.pkg-cmp', timeout=45000); self.wait_for_timeout(800)
            except Exception: pass
            if CLEAR_PACKAGES:   # tests of the plan before any package (saving options by hand) start from an empty plan
                self.evaluate("() => { var all = JSON.parse(localStorage['ec.events']); Object.values(all).forEach(e => { e.packages = []; e.shortlist = []; e.overrides = {}; e.pkgConfirmed = false; }); localStorage['ec.events'] = JSON.stringify(all); }")
                self.goto(self.url.rsplit('/budget', 1)[0]); self.wait_for_timeout(300)
    return r
Page.click = _keep_click
CLEAR_PACKAGES = False   # a test sets _open.CLEAR_PACKAGES = True to start each plan with no package
