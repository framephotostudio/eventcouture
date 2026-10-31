// Event Couture promo video: records the live site on a phone (with demo vendors), then animates it into a 9:16 video.
import { chromium } from 'playwright'; import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const SITE = 'https://eventcouture.app/';
fs.mkdirSync('showcase', { recursive: true }); fs.mkdirSync('shots', { recursive: true }); fs.rmSync('frames', { recursive: true, force: true }); fs.mkdirSync('frames');
const NAMES = { venue: 'The Magnolia Ballroom', catering: 'Saffron & Sage Catering', cake: 'Petal & Crumb Bakery', florals: 'Bloom Atelier Florals', decor: 'Gilded Moments Decor', dj: 'Nova Sound Events', singer: 'Velvet Voice Entertainment', bar: 'The Copper Cart Bar Co.', bartender: 'Silver Pour Bartending', rentals: 'Linen & Lace Rentals', photographer: 'Golden Hour Studio', videographer: 'Reel Love Films', favors: 'Little Luxe Favors', attire: 'Maison Ivory Bridal', hairMakeup: 'Glow Bridal Beauty', officiant: 'Grace Ceremonies', cleanup: 'Swift Setup Crew', lighting: 'Lumière Lighting', transport: 'Noir Chauffeur Co.' };
const ALT = ['', ' II', ' Studio', ' Collective', ' House'];
const api = route => {
  const u = route.request().url(), h = { 'access-control-allow-origin': '*' };
  if (u.endsWith('/api/places')) {
    const b = JSON.parse(route.request().postData() || '{}'), cat = b.cat || 'venue';
    const base = NAMES[cat] || (b.query || 'Event').split(' ').slice(-2).map(w => w[0].toUpperCase() + w.slice(1)).join(' ') + ' Co.';
    const places = [0, 1, 2, 3, 4].map(i => ({ id: cat + i, name: base + ALT[i], rating: 0, reviews: 0, address: (120 + i * 37) + ' Ocean Dr, Miami, FL 33139, USA', mapsUrl: 'https://maps.google.com/', website: 'https://example.com/' }));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ places }), headers: h });
  }
  if (u.endsWith('/api/status')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ai":true,"places":true}', headers: h });
  return route.fulfill({ status: 500, body: '{}', headers: h });
};
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.route('**/googletagmanager.com/**', r => r.abort()); await ctx.route('**/google-analytics.com/**', r => r.abort());
await ctx.route('**/js/config.js*', async r => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace(/apiUrl: '[^']*'/, "apiUrl: 'https://api.demo.test'") }); });
await ctx.route('https://api.demo.test/**', api);
const pg = await ctx.newPage();
const settle = async (ms = 1500) => { await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(ms); };
// Step 1: a photo chosen and a few words
await pg.goto(SITE + '#/start/wedding/-/blush-wisteria-ballroom'); await pg.waitForSelector('#text');
await pg.fill('#text', 'Blush and gold ballroom wedding, lots of roses and candlelight'); await settle();
await pg.screenshot({ path: 'shots/step1.png', fullPage: true });
await pg.click('#next'); await pg.waitForSelector('#type'); await pg.selectOption('#country', 'US'); await pg.waitForTimeout(200); await pg.selectOption('#city', 'Miami, FL');
await pg.fill('#guests', '150'); await pg.click('#setting [data-v=indoor]'); await pg.click('#next');
await pg.waitForSelector('.concept', { timeout: 30000 }); await settle(2500);
await pg.screenshot({ path: 'shots/looks.png', fullPage: true });
await pg.click('.concept button >> nth=0'); await pg.waitForSelector('.plan-head');
const base = '#/' + pg.url().split('#/')[1].split('/').slice(0, 2).join('/');
const kn = await pg.$('#keepNoteX'); if (kn) await kn.click();
// Step 3: every cost (the full budget breakdown opened)
await pg.goto(SITE + base + '/overview'); await pg.waitForSelector('#pkgStart'); await pg.click('#pkgStart'); await pg.waitForSelector('.pkg-cmp', { timeout: 40000 });
await pg.goto(SITE + base + '/budget'); await pg.waitForSelector('[data-pkuse="0"]'); await pg.click('[data-pkuse="0"]'); await pg.waitForSelector('#pkgSum'); await settle(3500);
await pg.screenshot({ path: 'shots/package.png', fullPage: true });
await pg.evaluate(() => { const d = document.querySelector('#budgetMore'); if (d) d.open = true; }); await settle(800);
const top = await pg.evaluate(() => { const d = document.querySelector('#budgetMore'); return d ? Math.max(0, d.getBoundingClientRect().top + scrollY - 20) : 0; });
const full = await pg.evaluate(() => document.documentElement.scrollHeight);
await pg.screenshot({ path: 'shots/budget.png', fullPage: true, clip: { x: 0, y: top, width: 390, height: Math.min(4200, full - top) } });
// Step 5: the invitation
await pg.goto(SITE + base + '/invite'); await settle(1200);
const nm = await pg.$('#invNames'); if (nm) { await nm.fill('Layla & Adam'); await settle(800); }
const inv = await pg.evaluate(() => { const c = document.querySelector('#invCard') || document.querySelector('.inv-card'); return c ? Math.max(0, c.getBoundingClientRect().top + scrollY - 30) : 0; });
await pg.screenshot({ path: 'shots/invite.png', fullPage: true, clip: { x: 0, y: inv, width: 390, height: 2400 } });
// Local prices: the same 150-guest wedding in seven cities, from the site's own price engine
const CITIES = await pg.evaluate(() => {
  const E = window.EC_ENGINE, out = [];
  for (const [label, city] of [['Miami', 'Miami, FL'], ['London', 'London, UK'], ['Dubai', 'Dubai, UAE'], ['Toronto', 'Toronto, ON'], ['Mexico City', 'Mexico City, Mexico'], ['Mumbai', 'Mumbai, India'], ['Tokyo', 'Tokyo, Japan']]) {
    E.useCountry(city); const t = E.budget({ type: 'wedding', guests: 150, city, hours: 5, setting: 'indoor', include: [], exclude: [], priorities: [] }, 'S').total; out.push([label, E.money(t)]);
  }
  E.useCountry(null); return out;
});
console.log('cities', JSON.stringify(CITIES));
await b.close();
// Animate
const b2 = await chromium.launch(); const p2 = await b2.newPage({ viewport: { width: 1080, height: 1920 } });
await p2.addInitScript(c => { window.CITIES = c; }, CITIES);
await p2.goto('file://' + path.resolve('composer.html')); await p2.evaluate(() => document.fonts.ready); await p2.evaluate(() => window.build());
await p2.waitForTimeout(1500);
const FPS = 30, DUR = 33;
for (let f = 0; f < FPS * DUR; f++) {
  await p2.evaluate(t => window.render(t), f / FPS);
  if (f === 0) await p2.waitForTimeout(300);
  await p2.screenshot({ path: 'frames/' + String(f).padStart(4, '0') + '.jpg', type: 'jpeg', quality: 94 });
  if ([20, 75, 140, 230, 400, 520, 640, 760, 830, 960].includes(f)) fs.copyFileSync('frames/' + String(f).padStart(4, '0') + '.jpg', 'showcase/frame-' + String(f).padStart(4, '0') + '.jpg');
}
await b2.close();
try { execSync('ffmpeg -version', { stdio: 'ignore' }); } catch (e) { execSync('sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg', { stdio: 'inherit' }); }
execSync('ffmpeg -y -loglevel error -framerate 30 -i frames/%04d.jpg -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart showcase/event-couture-promo.mp4', { stdio: 'inherit' });
fs.copyFileSync('frames/0950.jpg', 'showcase/cover.jpg');
for (const s of fs.readdirSync('shots')) fs.copyFileSync('shots/' + s, 'showcase/shot-' + s);
console.log('done', fs.statSync('showcase/event-couture-promo.mp4').size);
