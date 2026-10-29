// Which pictures fail to load on the live site (desktop and phone): every page section scrolled into view, failures listed.
import { chromium } from 'playwright'; import fs from 'node:fs';
fs.mkdirSync('showcase', { recursive: true }); const out = [];
const b = await chromium.launch();
for (const [n, w, h, m] of [['desktop', 1440, 900, false], ['phone', 390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m }); const pg = await ctx.newPage();
  const bad = []; pg.on('response', r => { if (r.status() >= 400 && /\.(jpg|jpeg|png|webp|svg)/i.test(r.url())) bad.push(r.status() + ' ' + r.url()); });
  pg.on('requestfailed', r => { if (/\.(jpg|jpeg|png|webp|svg)/i.test(r.url())) bad.push('failed ' + r.failure()?.errorText + ' ' + r.url()); });
  for (const route of ['#/', '#/inspiration']) {
    await pg.goto('https://eventcouture.app/' + route, { waitUntil: 'networkidle' }); await pg.waitForTimeout(1500);
    for (let y = 0; y < 30000; y += 600) { await pg.evaluate(y => window.scrollTo(0, y), y); await pg.waitForTimeout(250); if (await pg.evaluate(y => y > document.body.scrollHeight, y)) break; }
    await pg.waitForTimeout(2000);
    const broken = await pg.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc || i.src));
    const pending = await pg.evaluate(() => [...document.images].filter(i => !i.complete).map(i => i.currentSrc || i.src));
    const noimg = await pg.evaluate(() => document.querySelectorAll('.noimg').length);
    out.push({ n, route, total: await pg.evaluate(() => document.images.length), broken, pending: pending.slice(0, 20), pendingCount: pending.length, noimg });
    await pg.screenshot({ path: `showcase/${n}-${route.replace(/\W/g, '') || 'home'}.png`, fullPage: false });
  }
  out.push({ n, network: [...new Set(bad)].slice(0, 40) });
  await ctx.close();
}
await b.close(); fs.writeFileSync('showcase/imgcheck.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1));
