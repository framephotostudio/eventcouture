// App Store and Google Play screenshots, made from the real app screens with a caption above each.
// Run after `npm run build:web`: node scripts/store-shots.mjs  ->  store/shots/<size>/<n>.png
// Uses sample data only; no real customer, vendor or photo is shown.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { chromium } from 'playwright';

const WWW = path.resolve('www'), OUT = path.resolve('store/shots'), PORT = 8811;
const SIZES = [{ name: 'iphone-6.9', w: 440, h: 956 }, { name: 'iphone-6.5', w: 428, h: 926 }, { name: 'android-phone', w: 412, h: 915 }];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(WWW, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(WWW) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(PORT);
const U = `http://localhost:${PORT}/`;

const SHOTS = [
  { caption: 'Plan any celebration from one photo', go: async pg => { await pg.goto(U + '#/'); await pg.waitForSelector('.hero'); } },
  { caption: 'Three looks, made for your event', go: async pg => { await newPlan(pg, 'Ivory and gold wedding with candlelight and white roses', 'wedding', 'Houston, TX', 150); await pg.waitForSelector('.concept'); } },
  { caption: 'Every cost, sized to your city', go: async pg => { await open(pg, 'budget'); await pg.evaluate(() => { const r = document.querySelector('#tab [data-price]'); const row = r && (r.closest('.it, .line, .bline, div')); const box = row && row.parentElement; (box || r).scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); }); } },
  { caption: 'Cultural weddings, done beautifully', go: async pg => { await pg.goto(U + '#/start/arabic-wedding/'); await pg.waitForSelector('#text'); await pg.fill('#text', 'Ivory and gold, a grand zaffe entrance'); await pg.click('#next'); await pg.waitForSelector('#music'); await pg.evaluate(() => { document.querySelector('main h2').scrollIntoView({ block: 'start' }); window.scrollBy(0, -10); }); } },
  { caption: 'Invitations as elegant as your day', go: async pg => { await open(pg, 'invite', ev => { ev.inv = { names: 'Sara & Omar' }; ev.date = '2027-06-12'; ev.time = '18:00'; }); await pg.waitForSelector('.invite-card'); await pg.evaluate(() => { document.querySelector('.invite-card').scrollIntoView({ block: 'start' }); window.scrollBy(0, -20); }); } },
  { caption: 'Your whole day, step by step', go: async pg => { await open(pg, 'timeline'); } }
];

let planBase = '';
async function newPlan(pg, text, type, city, guests) {
  await pg.goto(U + '#/new/1'); await pg.waitForSelector('#text'); await pg.fill('#text', text); await pg.click('#next');
  await pg.waitForSelector('#type'); await pg.selectOption('#type', type); await pg.selectOption('#city', city); await pg.fill('#guests', String(guests));
  await pg.click('#setting [data-v=indoor]'); await pg.evaluate(() => document.querySelectorAll('details.more').forEach(d => d.open = true));
  await pg.fill('#date', '2027-06-12'); await pg.click('#next');
}
async function open(pg, tab, edit) {
  if (!planBase) { await pg.click('.concept button'); await pg.waitForSelector('.plan-head'); planBase = '#/' + pg.url().split('#/')[1].split('/').slice(0, 2).join('/'); }
  await pg.evaluate(([b, code]) => { const all = JSON.parse(localStorage.getItem('ec.events')); const ev = all[b.split('/')[2]]; if (code) (new Function('ev', code))(ev); ev.keepNoteHidden = true; localStorage.setItem('ec.events', JSON.stringify(all)); }, [planBase, edit ? '(' + edit.toString() + ')(ev)' : '']);
  await pg.goto(U + planBase + '/' + tab); await pg.reload(); await pg.waitForSelector('.plan-head'); await pg.waitForTimeout(600);
}

const fontCss = fs.existsSync(path.join(WWW, 'fonts/fonts.css')) ? `<link rel="stylesheet" href="${U}fonts/fonts.css">` : '';
const browser = await chromium.launch();
for (const size of SIZES) {
  fs.mkdirSync(path.join(OUT, size.name), { recursive: true }); planBase = '';
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.route('**/api/**', r => r.request().url().endsWith('/api/status') ? r.fulfill({ status: 200, contentType: 'application/json', body: '{"ai":false,"places":false}', headers: { 'access-control-allow-origin': '*' } }) : r.fulfill({ status: 503, body: '{}', headers: { 'access-control-allow-origin': '*' } }));
  const pg = await ctx.newPage();
  for (let i = 0; i < SHOTS.length; i++) {
    await SHOTS[i].go(pg); await pg.waitForTimeout(900);
    const raw = await pg.screenshot({ type: 'png' });
    const W = size.w * 3, H = size.h * 3;
    const comp = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await comp.setContent(`<!doctype html><html><head>${fontCss}<style>
      html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
      body{background:radial-gradient(120% 70% at 50% 0%,#6B2350 0%,#3E1030 55%,#2A0A20 100%);font-family:'Bodoni Moda',Georgia,serif;display:flex;flex-direction:column;align-items:center}
      h1{color:#E8CF9A;font-weight:500;font-size:${Math.round(W * 0.078)}px;line-height:1.12;text-align:center;margin:${Math.round(H * 0.06)}px ${Math.round(W * 0.08)}px ${Math.round(H * 0.012)}px;letter-spacing:-.01em;text-wrap:balance}
      p{color:#F3E2C3;opacity:.85;font-family:Jost,Helvetica,Arial,sans-serif;font-size:${Math.round(W * 0.032)}px;margin:0 0 ${Math.round(H * 0.035)}px;letter-spacing:.14em;text-transform:uppercase}
      .phone{width:${Math.round(W * 0.8)}px;border-radius:${Math.round(W * 0.07)}px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.45),0 0 0 ${Math.round(W * 0.012)}px #1B0714,0 0 0 ${Math.round(W * 0.016)}px #C9A86A}
      .phone img{display:block;width:100%}
    </style></head><body><h1>${SHOTS[i].caption}</h1><p>Event Couture by Always Luxe</p><div class="phone"><img src="data:image/png;base64,${raw.toString('base64')}"></div></body></html>`);
    await comp.waitForTimeout(300);
    await comp.screenshot({ path: path.join(OUT, size.name, `${i + 1}.png`), type: 'png' }); await comp.close();
    console.log(size.name, i + 1, SHOTS[i].caption);
  }
  await ctx.close();
}
await browser.close(); server.close();
console.log('store screenshots ready in store/shots');
