// Lighthouse (mobile) on the stage1 branch and on the live site, with the real fonts, plus what shifts.
import fs from 'node:fs'; import { execSync, spawn } from 'node:child_process';
fs.mkdirSync('showcase', { recursive: true }); const out = {};
execSync('git clone -q --depth 1 --branch stage1 https://github.com/framephotostudio/eventcouture.git st && cd st && mkdir _site && cp -r index.html manifest.json css js img _site/ && node tools/seo.cjs _site >/dev/null && node tools/fonts.cjs _site');
const srv = spawn('node', ['gz.cjs', 'st/_site'], { stdio: 'ignore', detached: true });
await new Promise(r => setTimeout(r, 1500));
const chrome = execSync('node -e "console.log(require(\'playwright\').chromium.executablePath())"').toString().trim();
execSync('npm install --no-save playwright@1 lighthouse@12 chrome-launcher@1 >/dev/null 2>&1');
const runs = [['new_home', 'http://localhost:8799/'], ['new_home2', 'http://localhost:8799/'], ['new_guide', 'http://localhost:8799/plan/wedding/'], ['new_city', 'http://localhost:8799/plan/houston-tx/'], ['new_landing', 'http://localhost:8799/ai-event-planner/'], ['live_home', 'https://eventcouture.app/'], ['live_home2', 'https://eventcouture.app/'], ['live_guide', 'https://eventcouture.app/plan/wedding/']];
for (const [name, u] of runs) {
  try {
    execSync(`CHROME_PATH="${chrome}" npx lighthouse "${u}" --quiet --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,seo,accessibility,best-practices --output=json --output-path=showcase/lh.json`, { stdio: 'ignore', timeout: 240000 });
    const j = JSON.parse(fs.readFileSync('showcase/lh.json', 'utf8')); const a = j.audits;
    const shifts = ((a['layout-shifts'] || a['layout-shift-elements'] || {}).details || {}).items || [];
    out[name] = { scores: Object.fromEntries(Object.entries(j.categories).map(([k, v]) => [k, Math.round(v.score * 100)])), LCP: a['largest-contentful-paint'].displayValue, CLS: a['cumulative-layout-shift'].displayValue, TBT: a['total-blocking-time'].displayValue,
      lcpEl: JSON.stringify(((a['largest-contentful-paint-element'] || {}).details || {}).items || []).slice(0, 400),
      shifts: shifts.slice(0, 6).map(s => ({ score: s.score, node: s.node && (s.node.snippet || s.node.selector), causes: JSON.stringify(s.subItems || '').slice(0, 300) })),
      fails: Object.values(a).filter(x => x.score !== null && x.score < 0.9 && !['informative', 'notApplicable', 'manual'].includes(x.scoreDisplayMode)).map(x => x.id + ': ' + (x.displayValue || x.title)).slice(0, 20) };
  } catch (e) { out[name] = { error: String(e.message || e).slice(0, 300) }; }
}
fs.writeFileSync('showcase/lh.json', JSON.stringify(out, null, 1)); try { process.kill(-srv.pid); } catch (e) {} console.log('done'); process.exit(0);
