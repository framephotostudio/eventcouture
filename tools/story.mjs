// A 1080x1920 Instagram story of a real package (live Google results), with one recommended vendor at the top and no prices.
// Run by .github/workflows/showcase.yml when STORY is set. Env: START, TEXT, CITY, GUESTS, NAME, ROW (the line to feature, e.g. singer), SINGER.
import { chromium } from 'playwright'; import fs from 'node:fs';
const U = process.env.SITE || 'https://eventcouture.app/', OUT = 'showcase', ROW = process.env.ROW || 'singer';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 600, height: 1067 }, deviceScaleFactor: 1.8 }); const pg = await ctx.newPage();
if (process.env.MOCK) {   // local layout check only: pretend search results
  await pg.route('**/js/config.js*', async r => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace("apiUrl: ''", "apiUrl: 'http://api.test'") }); });
  await pg.route('http://api.test/**', r => { const u = r.request().url(); if (u.endsWith('/api/status')) return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ai":true,"places":true}', headers: { 'access-control-allow-origin': '*' } }); if (!u.endsWith('/api/places')) return r.fulfill({ status: 500, body: '{}', headers: { 'access-control-allow-origin': '*' } }); const q = JSON.parse(r.request().postData()).query; r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ places: [0, 1, 2].map(i => ({ id: q.replace(/\W/g, '') + i, name: 'Sample ' + q.split(' ').slice(-2).join(' ') + ' ' + i, rating: 4.8, reviews: 200, address: '1 Main St, Houston, TX 77001, USA', mapsUrl: 'https://maps.google.com', website: 'https://example.com' })) }) }); });
}
try {
  await pg.goto(U + '#/start/' + (process.env.START || 'arabic-wedding') + '/'); await pg.waitForSelector('#text'); await pg.fill('#text', process.env.TEXT || 'Ivory and gold wedding with candlelight and white roses'); await pg.click('#next');
  await pg.waitForSelector('#type'); await pg.evaluate(() => document.querySelectorAll('details.more').forEach(d => d.open = true));
  await pg.selectOption('#city', process.env.CITY || 'Houston, TX'); await pg.fill('#guests', process.env.GUESTS || '250');
  if (!(await pg.$('#setting [data-v=indoor][aria-pressed=true]'))) await pg.click('#setting [data-v=indoor]');
  if (process.env.SINGER) { const sg = await pg.$('[data-music="singer"]'); if (sg && (await sg.getAttribute('aria-pressed')) !== 'true') await sg.click(); }
  if (await pg.$('#date')) await pg.fill('#date', '2027-06-12');
  await pg.click('#next'); await pg.waitForSelector('.concept', { timeout: 120000 }); await pg.click('.concept button'); await pg.waitForSelector('.plan-head');
  const base = '#/' + pg.url().split('#/')[1].split('/').slice(0, 2).join('/');
  await pg.evaluate(([id, nm]) => { const a = JSON.parse(localStorage.getItem('ec.events')); a[id].keepNoteHidden = true; a[id].name = nm; localStorage.setItem('ec.events', JSON.stringify(a)); }, [base.split('/')[2], process.env.NAME || 'Layla & Omar’s Wedding']);
  await pg.goto(U + base + '/overview'); await pg.reload(); await pg.waitForSelector('#pkgStart'); await pg.click('#pkgStart');
  await pg.waitForSelector('.pkg-cmp', { timeout: 180000 }); await pg.waitForTimeout(800);
  // PICK: "venue=post oak;cake=three brothers;florals=!delivery" swaps a line to a matching business from the app's own options (! = any name without that word).
  for (const rule of (process.env.PICK || '').split(';').map(x => x.trim()).filter(Boolean)) {
    const [cat, want] = rule.split('='); const sw = await pg.$(`[data-pkswap="${cat}"][data-pk="0"]`); if (!sw) { console.log('no swap for', cat); continue; }
    await sw.click(); await pg.waitForSelector(`[data-pkswapbox="${cat}"] .curated, [data-pkswapbox="${cat}"] p.muted:not(:has(+ *))`, { timeout: 60000 }).catch(() => {}); await pg.waitForTimeout(1500);
    const ok = await pg.evaluate(([cat, want]) => { const neg = want.startsWith('!'), w = (neg ? want.slice(1) : want).toLowerCase();
      const it = [...document.querySelectorAll(`[data-pkswapbox="${cat}"] .it`)].find(x => { const n = x.querySelector('b').textContent.toLowerCase(); return neg ? n.indexOf(w) < 0 : n.indexOf(w) >= 0; });
      if (!it) return false; it.querySelector('[data-pkpick]').click(); return it.querySelector('b').textContent; }, [cat, want]);
    console.log('pick', cat, want, '->', ok); await pg.waitForTimeout(1200);
  }
  await pg.click('[data-pkuse="0"]'); await pg.waitForSelector('#pkgSum'); await pg.waitForTimeout(3500);
  const rmvList = (process.env.REMOVE || '').split(',').map(x => x.trim()).filter(Boolean), nameMap = Object.fromEntries((process.env.NAMES || '').split(';').map(x => x.split('=').map(y => y.trim())).filter(x => x[0] && x[1]));
  const info = await pg.evaluate(([row, rmv, names]) => {
    const sum = document.querySelector('#pkgSum');
    const rows = [...sum.querySelectorAll('.pkg-sum-r')], want = rows.find(r => r.querySelector('.badge.rec') && new RegExp(row, 'i').test(r.querySelector('.pkg-sum-c').textContent));
    if (want) { want.parentNode.prepend(want); want.classList.add('story-star'); }
    (rmv || []).forEach(name => rows.filter(r => r.querySelector('.pkg-sum-c').textContent.trim().toLowerCase() === name.toLowerCase()).forEach(r => r.remove()));
    Object.entries(names || {}).forEach(([cat, nm]) => rows.filter(r => r.querySelector('.pkg-sum-c').textContent.trim().toLowerCase() === cat.toLowerCase()).forEach(r => { r.querySelector('.pkg-sum-n b').textContent = nm; const bd = r.querySelector('.badge.rec'); if (bd) bd.remove(); }));
    sum.querySelectorAll('.pkg-sum-a, .pkg-sum-t, .pkg-adds-row, .pkg-adds, .pkg-pl, .pkg-sum-acts, .badge.ok').forEach(x => x.remove());
    [...sum.children].forEach(c => { if (c.tagName === 'P') c.remove(); });
    rows.filter(r => !r.querySelector('.pkg-sum-n b') || /Still to choose/.test(r.textContent)).forEach(r => r.remove());
    const story = document.createElement('div'); story.id = 'story';
    story.innerHTML = '<div class="st-top">Event Couture <span>by Always Luxe</span></div>';
    story.appendChild(sum);
    story.insertAdjacentHTML('beforeend', '<div class="st-foot">Your vision. Brought to life.<b>eventcouture.app</b></div>');
    document.body.innerHTML = ''; document.body.appendChild(story);
    const st = document.createElement('style'); st.textContent = `
      html, body { margin: 0; background: #F7F2EA; }
      #story { width: 600px; height: 1067px; box-sizing: border-box; padding: 34px 26px 26px; display: flex; flex-direction: column; gap: 16px; overflow: hidden; }
      .st-top { font-family: 'Bodoni Moda', 'Didot', Georgia, serif; color: #4A1438; font-size: 26px; text-align: center; letter-spacing: .02em; }
      .st-top span { display: block; font-family: inherit; font-size: 12px; letter-spacing: .3em; text-transform: uppercase; color: #8A6A2F; margin-top: 4px; }
      #story .pkg-sum { flex: 1; overflow: hidden; box-shadow: 0 10px 30px rgba(74,20,56,.10); }
      #story .pkg-sum { padding: 14px 16px; gap: 8px; }
      #story .pkg-sum-r { grid-template-columns: 40% 1fr; padding: 5px 0; font-size: 14.5px; }
      #story .story-star { background: #FBF3E2; border: 1.5px solid #C9A86A; border-radius: 12px; padding: 12px 12px; margin-bottom: 6px; }
      #story .story-star .pkg-sum-n b { font-size: 1.25em; color: #4A1438; }
      .st-foot { text-align: center; font-family: 'Bodoni Moda', Georgia, serif; color: #4A1438; font-size: 17px; }
      .st-foot b { display: block; font-family: system-ui, sans-serif; font-weight: 600; font-size: 13px; letter-spacing: .12em; color: #8A6A2F; margin-top: 4px; }`;
    document.head.appendChild(st);
    const box = document.querySelector('#story .pkg-sum'), rs = document.querySelector('#story .pkg-sum-rows'); let fs = 14.5;
    while (box.scrollHeight > box.clientHeight && fs > 10) { fs -= 0.5; rs.style.fontSize = fs + 'px'; [...rs.children].forEach(r => r.style.fontSize = fs + 'px'); }   /* every line fits on one screen */
    return { fontSize: fs, found: !!want, rows: [...document.querySelectorAll('.pkg-sum-r')].map(r => r.innerText.replace(/\s+/g, ' ')), overflow: document.querySelector('#story .pkg-sum').scrollHeight - document.querySelector('#story .pkg-sum').clientHeight };
  }, [ROW, rmvList, nameMap]);
  console.log(JSON.stringify(info));
  fs.writeFileSync(`${OUT}/story-info.json`, JSON.stringify(info, null, 1));
  await pg.screenshot({ path: `${OUT}/story.png` });
} catch (e) { fs.writeFileSync(`${OUT}/story-error.txt`, String(e && e.stack || e)); await pg.screenshot({ path: `${OUT}/story-error.png`, fullPage: true }).catch(() => {}); }
await b.close();
