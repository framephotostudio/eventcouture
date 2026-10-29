// Screenshots of a real package on the live site, to show a vendor how they appear. Run by .github/workflows/showcase.yml.
// Uses live Google results (about 20 searches). No customer data or photos.
import { chromium } from 'playwright'; import fs from 'node:fs';
const U = process.env.SITE || 'https://eventcouture.app/', CITY = process.env.CITY || 'Orange County, CA', OUT = 'showcase';
fs.mkdirSync(OUT, { recursive: true });
const hide = '.toast,.preview-ribbon,.keep-note{display:none!important}';
const b = await chromium.launch();
for (const [n, w, h, m] of [['phone', 430, 932, true], ['desktop', 1280, 900, false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: m ? 3 : 2, isMobile: m, hasTouch: m }); const pg = await ctx.newPage();
  await pg.goto(U + '#/start/arabic-wedding/'); await pg.waitForSelector('#text'); await pg.fill('#text', 'Ivory and gold wedding with candlelight, white roses and a grand zaffe entrance'); await pg.click('#next');
  await pg.waitForSelector('#type'); await pg.evaluate(() => document.querySelectorAll('details.more').forEach(d => d.open = true));
  await pg.selectOption('#city', CITY); await pg.fill('#guests', '200'); await pg.click('#setting [data-v=indoor]');
  if (await pg.$('#date')) await pg.fill('#date', '2027-06-12');
  await pg.click('#next'); await pg.waitForSelector('.concept', { timeout: 120000 }); await pg.click('.concept button'); await pg.waitForSelector('.plan-head');
  const base = '#/' + pg.url().split('#/')[1].split('/').slice(0, 2).join('/');
  await pg.evaluate(id => { const a = JSON.parse(localStorage.getItem('ec.events')); a[id].keepNoteHidden = true; a[id].name = 'Layla & Omar’s Wedding'; localStorage.setItem('ec.events', JSON.stringify(a)); }, base.split('/')[2]);
  await pg.goto(U + base + '/overview'); await pg.reload(); await pg.waitForSelector('#pkgStart'); await pg.click('#pkgStart');
  await pg.waitForSelector('.pkg-cmp', { timeout: 180000 }); await pg.addStyleTag({ content: hide }); await pg.waitForTimeout(800);
  const dj = await pg.$('tr[data-pkrow="dj"]'); if (dj) { await dj.scrollIntoViewIfNeeded(); await pg.screenshot({ path: `${OUT}/${n}-dj-row.png` }); }
  await pg.click('[data-pkuse="0"]'); await pg.waitForSelector('#pkgSum'); await pg.addStyleTag({ content: hide }); await pg.waitForTimeout(800);
  await (await pg.$('#pkgSum')).screenshot({ path: `${OUT}/${n}-final-package.png` });
  console.log(n, 'done', await pg.innerText('#pkgSum'));
  await ctx.close();
}
await b.close();
