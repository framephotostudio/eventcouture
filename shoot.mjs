// Header preview: "by Always Luxe" as live vs. thicker options, with the real brand fonts, phone and desktop.
import fs from 'node:fs'; import { execSync, spawn } from 'node:child_process';
fs.mkdirSync('showcase', { recursive: true });
execSync('git clone -q --depth 1 --branch install https://github.com/framephotostudio/eventcouture.git st && cd st && mkdir _site && cp -r index.html manifest.json sw.js css js img _site/ && node tools/fonts.cjs _site');
const srv = spawn('node', ['gz.cjs', 'st/_site'], { stdio: 'ignore', detached: true });
await new Promise(r => setTimeout(r, 1500));
const { chromium } = await import('playwright');
const b = await chromium.launch();
const V = { live: '.brand.logo-mark .by{font-variation-settings:normal!important;font-optical-sizing:auto!important;font-size:10.5px}@media(min-width:700px){.brand.logo-mark .by{font-size:26px}}', thick: '', thicker: '.brand.logo-mark .by{-webkit-text-stroke:.35px #E9D29E}@media(min-width:700px){.brand.logo-mark .by{-webkit-text-stroke:.6px #E9D29E}}' };
for (const [n, w, h, s] of [['phone', 390, 120, 3], ['desktop', 1280, 90, 2]]) {
  for (const [k, css] of Object.entries(V)) {
    const pg = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: s })).newPage();
    await pg.route(/googletagmanager|workers\.dev/, r => r.abort());
    await pg.goto('http://localhost:8799/'); await pg.waitForSelector('.topbar'); await pg.evaluate(() => document.fonts.ready); if (css) await pg.addStyleTag({ content: css }); await pg.waitForTimeout(800);
    await pg.screenshot({ path: `showcase/by-${n}-${k}.png`, clip: { x: 0, y: 0, width: w, height: n === 'phone' ? 64 : 70 } }); await pg.close();
  }
}
await b.close(); try { process.kill(-srv.pid); } catch (e) {} console.log('done'); process.exit(0);
