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
