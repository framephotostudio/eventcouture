// Header preview: current "by Always Luxe" (phone stacks it under the logo) vs. beside the logo on phones too, real fonts.
import fs from 'node:fs'; import { execSync, spawn } from 'node:child_process';
fs.mkdirSync('showcase', { recursive: true });
execSync('git clone -q --depth 1 --branch install https://github.com/framephotostudio/eventcouture.git st && cd st && mkdir _site && cp -r index.html manifest.json sw.js css js img _site/ && node tools/fonts.cjs _site');
const srv = spawn('node', ['gz.cjs', 'st/_site'], { stdio: 'ignore', detached: true });
await new Promise(r => setTimeout(r, 1500));
const { chromium } = await import('playwright');
const b = await chromium.launch();
const V = { now: '' }; const _x = { beside: '@media(max-width:699px){.brand.logo-mark{grid-auto-flow:column;align-items:center;gap:8px}.brand.logo-mark img{height:38px}.brand.logo-mark .by{font-size:11px;letter-spacing:.12em;margin-top:3px!important;white-space:nowrap}}' };
for (const [n, w, h, s] of [['w320', 320, 120, 3], ['w340', 340, 120, 3], ['w360', 360, 120, 3], ['w390', 390, 120, 3], ['w430', 430, 120, 3], ['w680', 680, 120, 2], ['desktop', 1280, 90, 2]]) {
  for (const [k, css] of Object.entries(V)) {
    if (n === 'desktop' && k !== 'now') continue;
    const pg = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: s })).newPage();
    await pg.route(/googletagmanager|workers\.dev/, r => r.abort());
    await pg.goto('http://localhost:8799/'); await pg.waitForSelector('.topbar'); await pg.evaluate(() => document.fonts.ready); if (css) await pg.addStyleTag({ content: css }); await pg.waitForTimeout(800);
    const ov = await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth); if (ov) console.log('OVERFLOW', n);
    await pg.screenshot({ path: `showcase/hdr-${n}-${k}.png`, clip: { x: 0, y: 0, width: w, height: n === 'desktop' ? 70 : 64 } }); await pg.close();
  }
}
await b.close(); try { process.kill(-srv.pid); } catch (e) {} console.log('done'); process.exit(0);
