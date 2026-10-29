# Extras now live in a pop-up behind "+ Add extras" on the final package.
def extras(pg):
    if not pg.query_selector('.pkg-more [data-pkextras]'): return []
    pg.click('.pkg-more [data-pkextras]'); pg.wait_for_selector('.sheet [data-pkadd]')
    ids = pg.evaluate("[...document.querySelectorAll('.sheet [data-pkadd]')].map(b=>b.dataset.pkadd)")
    pg.click('.sheet [data-close]'); pg.wait_for_timeout(200)
    return ids
def groups(pg):
    pg.click('.pkg-more [data-pkextras]'); pg.wait_for_selector('.sheet .pkg-add-g')
    g = pg.evaluate("[...document.querySelectorAll('.sheet .pkg-add-g')].map(x=>x.textContent)")
    pg.click('.sheet [data-close]'); pg.wait_for_timeout(200)
    return g
def add_extra(pg, cat):
    pg.click('.pkg-more [data-pkextras]'); pg.wait_for_selector(f'.sheet [data-pkadd="{cat}"]'); pg.click(f'.sheet [data-pkadd="{cat}"]')
