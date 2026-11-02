// Serves the brand fonts from our own site instead of Google's, so pages don't wait on a second server.
// Run during deploy after the site is packaged: node tools/fonts.cjs _site
// Downloads Google's font CSS and woff2 files, saves them in _site/fonts/, and points every page at /fonts/<family>.css.
// If anything fails, the pages keep the Google Fonts links (nothing breaks).
const fs = require('fs'), path = require('path');
const SITE = process.argv[2] || '_site';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const LINK = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)">/g;
(async () => {
  const pages = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) pages.push(p); } })(SITE);
  const urls = new Set(); for (const p of pages) for (const m of fs.readFileSync(p, 'utf8').matchAll(LINK)) urls.add(m[1].replace(/&amp;/g, '&'));
  const map = {}; fs.mkdirSync(path.join(SITE, 'fonts'), { recursive: true }); let n = 0;
  for (const u of urls) {
    const css = await (await fetch(u, { headers: { 'user-agent': UA } })).text();
    if (!/@font-face/.test(css)) throw new Error('no fonts in ' + u);
    let local = css;
    for (const f of [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g) || [])]) {
      const name = 'f' + (n++) + '.woff2'; const r = await fetch(f); if (!r.ok) throw new Error('font ' + r.status);
      fs.writeFileSync(path.join(SITE, 'fonts', name), Buffer.from(await r.arrayBuffer())); local = local.split(f).join('/fonts/' + name);
    }
    const fam = (u.match(/family=([A-Za-z+]+)/) || [, 'font'])[1].toLowerCase().replace(/\+/g, '-');
    fs.writeFileSync(path.join(SITE, 'fonts', fam + '.css'), local); map[u] = '/fonts/' + fam + '.css';
  }
  for (const p of pages) {
    const s = fs.readFileSync(p, 'utf8');
    const t = s.replace(LINK, (m, u) => map[u.replace(/&amp;/g, '&')] ? '<link rel="stylesheet" href="' + map[u.replace(/&amp;/g, '&')] + '">' : m)
      .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"( crossorigin)?>\s*/g, '');
    if (t !== s) fs.writeFileSync(p, t);
  }
  console.log('fonts: ' + n + ' files, ' + Object.keys(map).length + ' stylesheets, ' + pages.length + ' pages');
})().catch(e => { console.log('fonts: kept Google Fonts (' + e.message + ')'); process.exit(0); });
