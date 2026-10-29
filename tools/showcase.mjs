// Screenshots of a real package on the live site, to show a vendor how they appear. Run by .github/workflows/showcase.yml.
// Uses live Google results (about 20 searches). No customer data or photos.
import { chromium } from 'playwright'; import fs from 'node:fs';
const U = process.env.SITE || 'https://eventcouture.app/', CITY = process.env.CITY || 'Orange County, CA', OUT = 'showcase';
fs.mkdirSync(OUT, { recursive: true });
const hide = '.toast,.preview-ribbon,.keep-note{display:none!important}';
const b = await chromium.launch();
for (const [n, w, h, m] of [['phone', 430, 932, true], ['desktop', 1280, 900, false]]) {
  let pg0; try {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: m ? 3 : 2, isMobile: m, hasTouch: m }); const pg = await ctx.newPage(); pg0 = pg;
  await pg.goto(U + '#/start/' + (process.env.START || 'arabic-wedding') + '/'); await pg.waitForSelector('#text'); await pg.fill('#text', process.env.TEXT || 'Ivory and gold wedding with candlelight, white roses and a grand zaffe entrance'); await pg.click('#next');
  await pg.waitForSelector('#type'); await pg.evaluate(() => document.querySelectorAll('details.more').forEach(d => d.open = true));
  await pg.selectOption('#city', CITY); await pg.fill('#guests', process.env.GUESTS || '200'); await pg.click('#setting [data-v=indoor]');
  if (process.env.SINGER) { const sg = await pg.$('[data-music="singer"]'); if (sg && (await sg.getAttribute('aria-pressed')) !== 'true') await sg.click(); }
  if (await pg.$('#date')) await pg.fill('#date', '2027-06-12');
  await pg.click('#next'); await pg.waitForSelector('.concept', { timeout: 120000 }); await pg.click('.concept button'); await pg.waitForSelector('.plan-head');
  const base = '#/' + pg.url().split('#/')[1].split('/').slice(0, 2).join('/');
  await pg.evaluate(([id, nm]) => { const a = JSON.parse(localStorage.getItem('ec.events')); a[id].keepNoteHidden = true; a[id].name = nm; localStorage.setItem('ec.events', JSON.stringify(a)); }, [base.split('/')[2], process.env.NAME || 'Layla & Omar’s Wedding']);
  await pg.goto(U + base + '/overview'); await pg.reload(); await pg.waitForSelector('#pkgStart'); await pg.click('#pkgStart');
  await pg.waitForSelector('.pkg-cmp', { timeout: 180000 }); await pg.addStyleTag({ content: hide }); await pg.waitForTimeout(800);
  const ROW = process.env.ROW || 'dj'; const dj = await pg.$(`tr[data-pkrow="${ROW}"]`); if (dj) { await pg.evaluate(r => document.querySelector(`tr[data-pkrow="${r}"]`).scrollIntoView({ block: 'center' }), ROW); await pg.waitForTimeout(400); await pg.screenshot({ path: `${OUT}/${n}-${ROW}-row.png` }); }
  const K = +(process.env.PKG || 0);
  if (K) { await pg.click('#pkgMore'); await pg.waitForSelector('[data-pkuse="1"]', { timeout: 180000 }); await pg.waitForTimeout(800); }
  await pg.click(`[data-pkuse="${K}"]`); await pg.waitForSelector('#pkgSum'); await pg.addStyleTag({ content: hide }); await pg.waitForTimeout(800);
  await (await pg.$('#pkgSum')).screenshot({ path: `${OUT}/${n}-final-package.png` });
  console.log(n, 'done', await pg.innerText('#pkgSum'));
  await ctx.close();
  } catch (e) { fs.writeFileSync(`${OUT}/${n}-error.txt`, String(e && e.stack || e)); if (pg0) await pg0.screenshot({ path: `${OUT}/${n}-error.png`, fullPage: true }).catch(() => {}); }
}
await b.close();
