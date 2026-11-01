// Live SEO audit: redirects, status codes, robots/sitemap, tags, and Lighthouse (mobile) scores.
import fs from 'node:fs'; import { execSync } from 'node:child_process';
fs.mkdirSync('showcase', { recursive: true }); const out = {};
const head = async (u) => { try { const r = await fetch(u, { redirect: 'manual' }); return { status: r.status, location: r.headers.get('location'), cache: r.headers.get('cache-control'), type: r.headers.get('content-type') }; } catch (e) { return { error: String(e.message || e) }; } };
for (const u of ['http://eventcouture.app/', 'https://eventcouture.app/', 'http://www.eventcouture.app/', 'https://www.eventcouture.app/', 'https://eventcouture.app/plan/', 'https://eventcouture.app/plan/wedding/', 'https://eventcouture.app/plan/wedding', 'https://eventcouture.app/plan/houston-tx/', 'https://eventcouture.app/robots.txt', 'https://eventcouture.app/sitemap.xml', 'https://eventcouture.app/this-page-does-not-exist', 'https://eventcouture.app/index.html', 'https://facecouture.app/eventcouture/', 'https://framephotostudio.github.io/eventcouture/'])
  out[u] = await head(u);
const sm = await (await fetch('https://eventcouture.app/sitemap.xml')).text(); out.sitemapUrls = (sm.match(/<loc>/g) || []).length;
const home = await (await fetch('https://eventcouture.app/')).text(); out.homeHead = home.slice(0, 3000);
const g = await (await fetch('https://eventcouture.app/plan/wedding/')).text(); out.guideHead = g.slice(0, 2500);
// Lighthouse, mobile
execSync('npm install --no-save lighthouse@12 chrome-launcher@1 >/dev/null 2>&1');
const chrome = execSync('node -e "console.log(require(\'playwright\').chromium.executablePath())"').toString().trim();
for (const [name, u] of [['home', 'https://eventcouture.app/'], ['guide', 'https://eventcouture.app/plan/wedding/']]) {
  try {
    execSync(`CHROME_PATH="${chrome}" npx lighthouse "${u}" --quiet --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,seo,accessibility,best-practices --output=json --output-path=showcase/lh-${name}.json`, { stdio: 'ignore', timeout: 240000 });
    const j = JSON.parse(fs.readFileSync(`showcase/lh-${name}.json`, 'utf8')); const a = j.audits;
    out['lh_' + name] = { scores: Object.fromEntries(Object.entries(j.categories).map(([k, v]) => [k, Math.round(v.score * 100)])), LCP: a['largest-contentful-paint'].displayValue, CLS: a['cumulative-layout-shift'].displayValue, TBT: a['total-blocking-time'].displayValue, FCP: a['first-contentful-paint'].displayValue,
      fails: Object.values(a).filter(x => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable').map(x => x.id + ': ' + (x.displayValue || x.title)).slice(0, 30) };
    fs.unlinkSync(`showcase/lh-${name}.json`);
  } catch (e) { out['lh_' + name] = { error: String(e.message || e).slice(0, 300) }; }
}
fs.writeFileSync('showcase/seo-audit.json', JSON.stringify(out, null, 1)); console.log('done');
