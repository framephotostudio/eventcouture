// Builds the Event Couture planning guides for search engines: one page per city (what events cost there)
// and one per occasion (what it costs, the budget, a sample schedule and a checklist), plus a sitemap.
// Every number comes from the same planning engine the app uses. Run: node tools/seo.cjs <site folder>
'use strict';
const fs = require('fs'), path = require('path');
global.window = global;
require('../js/data.js'); require('../js/engine.js');
const D = global.EC_DATA, E = global.EC_ENGINE;
const OUT = process.argv[2] || '_site', BASE = 'https://facecouture.app/eventcouture/', YEAR = new Date().getFullYear();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Occasions: every event type except "other", plus the cultural weddings. */
const PHRASE = { brunch: 'a brunch or tea party', birthday: 'a birthday party', 'kids-birthday': 'a kids’ birthday party', milestone: 'a milestone birthday', dinner: 'a dinner party',
  'bridal-shower': 'a bridal shower', 'baby-shower': 'a baby shower', 'gender-reveal': 'a gender reveal', bachelorette: 'a bachelorette party', graduation: 'a graduation party',
  engagement: 'an engagement party', quince: 'a quinceañera', sweet16: 'a sweet 16', anniversary: 'an anniversary party', retirement: 'a retirement party', christmas: 'a Christmas party',
  holiday: 'a holiday party', wedding: 'a wedding', gala: 'a gala or fundraiser', corporate: 'a corporate event' };
const OCC = D.EVENT_TYPES.filter(t => t.id !== 'other').map(t => ({ key: t.id, type: t.id, name: t.name, phrase: PHRASE[t.id] || 'an event', guests: t.defaultGuests, hours: t.hours, start: t.id }))
  .concat(Object.keys(D.CULTURES).map(k => ({ key: k + '-wedding', type: 'wedding', culture: k, name: D.CULTURES[k].name, phrase: 'an ' + D.CULTURES[k].name.replace(/^./, c => c.toLowerCase()).replace(/^(arabic|indian|persian)/i, m => m[0].toUpperCase() + m.slice(1)), guests: D.CULTURES[k].guests, hours: D.CULTURES[k].hours, start: k + '-wedding' })));
OCC.forEach(o => { o.slug = slug(o.name.replace(/’s/, 's')); o.phrase = o.phrase.replace(/^an (Arabic|Indian|Persian)/, 'an $1'); });
const CITIES = D.CITIES.filter(c => !/^Other /.test(c.name)).map(c => Object.assign({ slug: slug(c.name) }, c));
const BIG = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Dallas, TX', 'Miami, FL', 'Atlanta, GA', 'Washington, DC', 'Philadelphia, PA', 'Phoenix, AZ', 'San Diego, CA', 'San Francisco, CA',
  'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Las Vegas, NV', 'Orlando, FL', 'Nashville, TN', 'New Orleans, LA', 'Toronto, ON', 'Vancouver, BC', 'Montreal, QC'];

function evFor(o, city) { return { type: o.type, culture: o.culture, guests: o.guests, expected: o.guests, hours: o.hours, city, setting: 'indoor', time: o.type === 'brunch' ? '11:00' : o.type === 'kids-birthday' ? '14:00' : '18:00', alcohol: ['baby-shower', 'gender-reveal', 'quince', 'sweet16', 'kids-birthday'].includes(o.type) ? 'none' : 'full', kids: o.type === 'kids-birthday', priorities: [], overrides: {} }; }
function totals(o, city) { const ev = evFor(o, city); E.useCountry(city); const t = ['L', 'S', 'U'].map(k => E.budget(ev, k).total); return t; }
const money = (n, city) => E.moneyIn(n, city);

function page({ rel, title, desc, h1, body, canonical }) {
  const up = rel ? '../'.repeat(rel) : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="article"><meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${BASE}img/brand/logo-full.jpg"><link rel="icon" href="${up}img/brand/ec-mark-128.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=Jost:wght@400;500&display=swap">
<link rel="stylesheet" href="${up}css/app.css"><style>.topbar .btn{white-space:nowrap}@media(max-width:560px){.topbar .btn{padding:6px 12px;font-size:.82rem}}.guide table{width:100%}.guide td.n,.guide th.n{text-align:right;white-space:nowrap}.guide .cta{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.guide ol.plain,.guide ul.plain{padding-left:20px;display:grid;gap:6px}.guide .cols{columns:2 220px;gap:24px}.guide .cols a{display:block;padding:3px 0}</style>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, author: { '@type': 'Organization', name: 'Event Couture by Always Luxe' }, publisher: { '@type': 'Organization', name: 'Always Luxe' }, dateModified: new Date().toISOString().slice(0, 10), mainEntityOfPage: canonical })}</script>
</head><body><header class="topbar"><a class="brand logo-mark" href="${up}#/" aria-label="Event Couture by Always Luxe, home"><img src="${up}img/brand/logo-mark-gold-wide.png" alt="Event Couture" width="563" height="210"><span class="by" aria-hidden="true">by Always Luxe</span></a><nav><a class="btn small gold" href="${up}#/new/1">Plan my event</a></nav></header>
<main class="guide stack-lg"><nav class="small muted" aria-label="Breadcrumb"><a href="${up}plan/">Planning guides</a></nav><div class="stack"><h1>${esc(h1)}</h1></div>${body}
<p class="small muted">All prices are ${YEAR} planning estimates from Event Couture, sized to local costs and including tax, service charges and tips where they usually apply. Real prices come from each venue and vendor.</p></main>
<footer class="site"><img src="${up}img/brand/ec-mark-128.png" alt="" loading="lazy"><nav><a href="${up}plan/">Planning guides</a><a href="${up}#/help">Help</a><a href="${up}#/vendors">For vendors</a><a href="${up}#/privacy">Privacy</a><a href="${up}#/terms">Terms</a></nav><div class="name">Event Couture by Always Luxe</div></footer></body></html>`;
}
const cta = (o, city, up) => `<div class="panel stack"><b>Plan ${esc(o ? o.phrase.replace(/^an? /, 'your ') : 'your event')}${city ? ' in ' + esc(city.split(',')[0]) : ''}, free</b><p class="small muted">Share one photo or a few words. Event Couture builds the look, a budget for your exact guest count, top-rated venues and vendors near you, the menu, the schedule and a formal invitation.</p><div class="cta"><a class="btn gold" href="${up}#/start/${o ? o.start : ''}/${city ? encodeURIComponent(city) : ''}">Start planning</a></div></div>`;
const write = (rel, html) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const urls = [];

/* City pages */
for (const c of CITIES) {
  const country = E.countryOf(c.name), cityShort = c.name.split(',')[0];
  const rows = OCC.map(o => { const t = totals(o, c.name); return `<tr><td><a href="../${o.slug}/">${esc(o.name)}</a></td><td class="n">${o.guests}</td><td class="n">${money(t[0], c.name)}</td><td class="n"><b>${money(t[1], c.name)}</b></td><td class="n">${money(t[2], c.name)}</td><td><a class="small" href="../../#/start/${o.start}/${encodeURIComponent(c.name)}">Plan it</a></td></tr>`; }).join('');
  const rate = (id, unit) => { const k = D.CATEGORIES[id], m = c.index; const r = k.perHour || k.perGuest || k.fixed; return `<tr><td>${esc(k.name.split(' (')[0])}</td><td class="n">${money(r[0] * m, c.name)} to ${money(r[1] * m, c.name)} ${unit}</td></tr>`; };
  const areas = D.AREAS[c.name] || [];
  const tax = c.taxName ? `${c.taxName} (${c.tax}%)` : c.tax ? `${c.tax}% sales tax` : 'no local sales tax';
  const body = `<p>What it typically costs to host an event in ${esc(c.name)} in ${YEAR}: weddings, quinceañeras, birthdays, showers and more, sized to local prices${country.id === 'CA' ? ' in Canadian dollars' : ''} with ${esc(tax)}.</p>
<div class="table-wrap panel"><table class="qty"><thead><tr><th>Occasion</th><th class="n">Guests</th><th class="n">Luxe for Less</th><th class="n">Signature</th><th class="n">Ultra Luxe</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="small muted"><b>Luxe for Less</b> keeps the look with smart swaps; <b>Signature</b> has the key pieces done by pros; <b>Ultra Luxe</b> adds full service, lighting, live music and a coordinator.</p>
<h2>Typical vendor rates in ${esc(cityShort)}</h2><div class="table-wrap panel"><table class="qty"><tbody>${rate('photographer', 'an hour')}${rate('videographer', 'an hour')}${rate('dj', 'an hour')}${rate('liveMusic', 'an hour')}${rate('catering', 'a guest')}${rate('bartender', 'an hour')}${rate('rentals', 'a guest')}${rate('cake', 'base, plus per guest')}${rate('balloons', '')}${rate('photoBooth', '')}</tbody></table></div>
${areas.length ? `<h2>Popular areas for venues</h2><p>${areas.map(esc).join(' · ')}</p>` : ''}
${cta(null, c.name, '../../')}<h2>Planning guides by occasion</h2><div class="cols">${OCC.map(o => `<a href="../${o.slug}/">${esc(o.name)}</a>`).join('')}</div>`;
  const title = `What events cost in ${c.name} (${YEAR} guide) | Event Couture`;
  write(`plan/${c.slug}/index.html`, page({ rel: 2, title, h1: `Planning an event in ${c.name}`, desc: `Typical ${YEAR} costs for weddings, quinceañeras, birthdays, showers and more in ${c.name}, with local vendor rates and the best areas for venues.`, body, canonical: `${BASE}plan/${c.slug}/` }));
  urls.push(`${BASE}plan/${c.slug}/`);
}

/* Occasion pages */
for (const o of OCC) {
  const nat = D.CITIES.find(c => c.name === 'Other US city').name, ev = evFor(o, nat); E.useCountry(nat);
  const b = E.budget(ev, 'S'), t = totals(o, nat);
  const lines = b.items.map(i => `<tr><td>${esc(i.name)}</td><td class="n">${money(i.mid, nat)}</td></tr>`).join('');
  const cityRows = BIG.map(cn => { const tt = totals(o, cn), c = CITIES.find(x => x.name === cn); return `<tr><td><a href="../${c.slug}/">${esc(cn)}</a></td><td class="n">${money(tt[0], cn)}</td><td class="n"><b>${money(tt[1], cn)}</b></td><td class="n">${money(tt[2], cn)}</td></tr>`; }).join('');
  const ros = E.runOfShow(ev).map(r => `<li><b>${esc(r.time)}</b> ${esc(r.text)}</li>`).join('');
  const d = new Date(); d.setFullYear(d.getFullYear() + 1);
  const steps = E.checklist(Object.assign({}, ev, { date: d.toISOString().slice(0, 10) }), new Date()).slice(0, 14).map(c => `<li>${esc(c.text)}</li>`).join('');
  const cu = o.culture && D.CULTURES[o.culture];
  const extra = cu ? `<h2>Traditions and music</h2><p>Music most families choose from: ${cu.music.map(m => esc(m[1])).join(', ')}. Traditions to budget for: ${cu.add.map(a => esc(D.CATEGORIES[a].name)).join('; ')}.</p><p>Menu ideas: ${D.MENUS[cu.menu].map(esc).join(' · ')}.</p>` : '';
  const q = `How much does ${o.phrase} cost?`;
  const body = `<p>For about ${o.guests} guests, ${o.phrase} typically costs <b>${money(t[0], nat)}</b> done smartly, <b>${money(t[1], nat)}</b> with the key pieces handled by pros, and <b>${money(t[2], nat)}</b> or more for full-service luxury, at average US prices in ${YEAR}. Here is where the money goes, what it costs in major cities, a sample schedule and what to book when.</p>
<h2>Budget breakdown (Signature, ${o.guests} guests)</h2><div class="table-wrap panel"><table class="qty"><tbody>${lines}<tr><td>Contingency (unexpected costs)</td><td class="n">${money(b.contingency, nat)}</td></tr><tr><td><b>Estimated total</b></td><td class="n"><b>${money(b.total, nat)}</b></td></tr></tbody></table></div>
<h2>What ${o.phrase.replace(/^an? /, '')} costs in major cities</h2><div class="table-wrap panel"><table class="qty"><thead><tr><th>City</th><th class="n">Luxe for Less</th><th class="n">Signature</th><th class="n">Ultra Luxe</th></tr></thead><tbody>${cityRows}</tbody></table></div>
${extra}<h2>Sample schedule</h2><ol class="plain">${ros}</ol><h2>What to book, and when</h2><ol class="plain">${steps}</ol>
${cta(o, null, '../../')}<h2>Costs in your city</h2><div class="cols">${CITIES.map(c => `<a href="../${c.slug}/">${esc(c.name)}</a>`).join('')}</div>`;
  write(`plan/${o.slug}/index.html`, page({ rel: 2, title: `${q} ${YEAR} budget guide | Event Couture`, h1: q, desc: `${o.name} budget for ${YEAR}: typical totals, a line-by-line breakdown, costs in major US and Canadian cities, a sample schedule and a planning checklist.`, body, canonical: `${BASE}plan/${o.slug}/` }));
  urls.push(`${BASE}plan/${o.slug}/`);
}

/* Guides index and sitemap */
const idx = `<p>Real numbers for planning any celebration: what it costs, where the money goes, and what to book when, for ${OCC.length} occasions and ${CITIES.length} cities in the US and Canada.</p>
<h2>By occasion</h2><div class="cols">${OCC.map(o => `<a href="${o.slug}/">${esc(o.name)}</a>`).join('')}</div><h2>By city</h2><div class="cols">${CITIES.map(c => `<a href="${c.slug}/">${esc(c.name)}</a>`).join('')}</div>${cta(null, null, '../')}`;
write('plan/index.html', page({ rel: 1, title: `Event planning guides and costs (${YEAR}) | Event Couture`, h1: 'Event planning guides', desc: `What weddings, quinceañeras, birthdays, showers and more cost in ${YEAR}, city by city, with budgets, schedules and checklists.`, body: idx, canonical: `${BASE}plan/` }).replace('<nav class="small muted" aria-label="Breadcrumb"><a href="../plan/">Planning guides</a></nav>', ''));
urls.unshift(BASE, `${BASE}plan/`);
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log(`guides: ${CITIES.length} cities, ${OCC.length} occasions, ${urls.length} urls`);
