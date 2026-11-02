// Puts a ready-made copy of the top of the home page (header and hero) into index.html, so first-time visitors
// see it at once instead of waiting for the scripts. app.js replaces it with the live page a moment later.
// Run after changing the home page header or hero: node tools/prerender.cjs   (needs the site served on :8765)
const fs = require('fs'); const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await pg.route(/googletagmanager|fonts\.g/, r => r.abort());
  await pg.goto('http://localhost:8765/#/'); await pg.waitForSelector('.hero');
  const html = await pg.evaluate(() => {
    const app = document.getElementById('app'), out = [];
    for (const el of app.children) { if (el.tagName === 'HEADER' || el.classList.contains('preview-ribbon')) out.push(el.outerHTML); }
    const main = app.querySelector('main'), keep = [];
    for (const el of main.children) { if (el.classList.contains('resume-bar')) continue; keep.push(el.outerHTML); if (el.classList.contains('hero')) break; }
    return out.join('') + '<main id="main">' + keep.join('') + '</main>';
  });
  await b.close();
  let idx = fs.readFileSync('index.html', 'utf8');
  idx = idx.replace(/<div id="app"[^>]*>[\s\S]*?<\/div><!--\/app-->|<div id="app"><\/div>/, '<div id="app" data-pre>' + html + '</div><!--/app-->');
  fs.writeFileSync('index.html', idx); console.log('prerendered', html.length, 'bytes');
})();
