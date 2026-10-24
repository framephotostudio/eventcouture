// Builds the app's web bundle from the live site's code (checked out into ./site from the main branch),
// so the apps and the website always plan events the same way. Nothing loads the website itself.
import fs from 'node:fs'; import path from 'node:path';
const SITE = process.env.SITE_DIR || 'site', OUT = 'www';
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
for (const d of ['css', 'js', 'img']) fs.cpSync(path.join(SITE, d), path.join(OUT, d), { recursive: true });
// app config: the same server as the website, store-safe settings, and links that open on guests' phones
let cfg = fs.readFileSync(path.join(SITE, 'js/config.js'), 'utf8');
const api = process.env.EC_API_URL || 'https://event-couture-api.facecouture.workers.dev';
cfg = cfg.replace(/apiUrl:\s*'[^']*'/, "apiUrl: '" + api + "'");
if (!/apiUrl: 'https/.test(cfg)) throw new Error('apiUrl not set in app config');
cfg += "\nwindow.EC_CONFIG.siteUrl = 'https://facecouture.app/eventcouture/';\nwindow.EC_CONFIG.app = true;\nwindow.EC_CONFIG.appVersion = " + JSON.stringify(process.env.APP_VERSION || '1.0.0') + ";\n";
fs.writeFileSync(path.join(OUT, 'js/config.js'), cfg);
let html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
// fonts are bundled into the app so it looks right offline
const fontCss = 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=Jost:wght@400;500&display=swap';
try {
  const css = await (await fetch(fontCss, { headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1' } })).text();
  let local = css, n = 0; fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });
  for (const u of [...new Set(css.match(/https:\/\/fonts\.gstatic\.com[^)]+/g) || [])]) { const f = 'f' + (n++) + '.woff2'; fs.writeFileSync(path.join(OUT, 'fonts', f), Buffer.from(await (await fetch(u)).arrayBuffer())); local = local.split(u).join('./' + f); }
  fs.writeFileSync(path.join(OUT, 'fonts/fonts.css'), local);
  html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">/, '<link rel="stylesheet" href="fonts/fonts.css">');
  console.log('fonts bundled:', n);
} catch (e) { console.warn('fonts not bundled (system fonts used):', e.message); }
// app layer: native share, links, haptics and the tab bar
{ const h = html.indexOf('<head>') + 6; html = html.slice(0, h) + '<script>window.__EC_APP=true</script><script src="app-early.js"></script>' + html.slice(h); }
{ const i = html.indexOf('</head>'); html = html.slice(0, i) + '<link rel="stylesheet" href="app.css">' + html.slice(i); }
{ const i = html.lastIndexOf('</body>'); html = html.slice(0, i) + '<script src="app.js"></script>' + html.slice(i); }
html = html.replace(/<link rel="manifest"[^>]*>\s*/, '');
fs.writeFileSync(path.join(OUT, 'index.html'), html);
if (process.env.EC_SHOT_TOUR === '1') {   /* simulator screenshots only, never in store builds */
  html = html.replace('</body>', "<script>(function(){var r=['#/inspiration/all','#/new','#/sample/1','#/sample/1/style','#/events'],i=0;setTimeout(function n(){if(i<r.length){location.hash=r[i++];setTimeout(n,15000)}},15000)})()</script></body>");
  fs.writeFileSync(path.join(OUT, 'index.html'), html); console.log('SCREENSHOT TOUR build');
}
for (const f of ['app.css', 'app.js', 'app-early.js']) fs.copyFileSync(path.join('app', f), path.join(OUT, f));
const left = (html.match(/https:\/\/(fonts\.googleapis|fonts\.gstatic)[^"'\s)]*/g) || []); if (left.length) console.warn('Still online:', left);
console.log('web bundle ready');
