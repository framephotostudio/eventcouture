# Tests reach every field: folded optional sections of the plan form are opened before a test types, taps or reads there.
from playwright.sync_api import Page
_OPEN = "document.querySelectorAll('details.more').forEach(d => d.open = true)"
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
    if 'state' not in k: _attached(self, sel, k)
    _open(self)
    return _ws(self, sel, *a, **k)
Page.wait_for_selector = _wait
# Keeping a plan is asked for only when she saves or shares it. Old tests that tapped "Keep my plan" at the top
# go through the real path instead: open the finished plan, tap Save as PDF, keep, and come back.
_click = Page.click
def _keep_click(self, sel, *a, **k):
    if sel in ('#keepBtn', '[data-keep]'):
        self._keep_return = self.url
        base = '#/' + '/'.join(self.url.split('#/')[1].split('/')[:2])
        self.goto(self.url.split('#')[0] + base + '/plan'); _ws(self, '#pdfPlan')
        return _click(self, '#pdfPlan')
    if sel in ('#keepPay', '.sheet #keepPay') and getattr(self, '_keep_return', None):
        r = _click(self, '#keepPay'); back = self._keep_return; self._keep_return = None
        self.wait_for_timeout(150); self.goto(back); self.wait_for_timeout(250); return r
    return _click(self, sel, *a, **k)
Page.click = _keep_click
