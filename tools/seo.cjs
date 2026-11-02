// Builds the Event Couture planning guides for search engines: one page per city (what events cost there)
// and one per occasion (what it costs, the budget, a sample schedule and a checklist), plus a sitemap.
// Every number comes from the same planning engine the app uses. Run: node tools/seo.cjs <site folder>
'use strict';
const fs = require('fs'), path = require('path');
global.window = global;
require('../js/data.js'); require('../js/engine.js'); require('../js/inspo.js');
const D = global.EC_DATA, E = global.EC_ENGINE, INSPO = global.EC_INSPO || [];
const OUT = process.argv[2] || '_site', BASE = 'https://eventcouture.app/', YEAR = new Date().getFullYear();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Occasions: every event type except "other", plus the cultural weddings. */
const PHRASE = { brunch: 'a brunch or tea party', birthday: 'a birthday party', 'kids-birthday': 'a kids’ birthday party', milestone: 'a milestone birthday', dinner: 'a dinner party',
  'bridal-shower': 'a bridal shower', 'baby-shower': 'a baby shower', 'gender-reveal': 'a gender reveal', bachelorette: 'a bachelorette party', graduation: 'a graduation party',
  engagement: 'an engagement party', quince: 'a quinceañera', sweet16: 'a sweet 16', anniversary: 'an anniversary party', retirement: 'a retirement party', christmas: 'a Christmas party',
  holiday: 'a holiday party', wedding: 'a wedding', gala: 'a gala or fundraiser', corporate: 'a corporate event' };
const OCC = D.EVENT_TYPES.filter(t => t.id !== 'other').map(t => ({ key: t.id, type: t.id, name: t.name, phrase: PHRASE[t.id] || 'an event', guests: t.defaultGuests, hours: t.hours, start: t.id }))
  .concat(Object.keys(D.CULTURES).map(k => ({ key: k + '-wedding', type: 'wedding', culture: k, name: D.CULTURES[k].name, phrase: (/^[AEIOU]/.test(D.CULTURES[k].name) ? 'an ' : 'a ') + D.CULTURES[k].name.replace(/ Wedding$/, ' wedding'), guests: D.CULTURES[k].guests, hours: D.CULTURES[k].hours, start: k + '-wedding' })));
OCC.forEach(o => { o.slug = slug(o.name.replace(/’s/, 's')); o.phrase = o.phrase.replace(/^an (Arabic|Indian|Persian)/, 'an $1'); });
const CITIES = D.CITIES.filter(c => !/^Other /.test(c.name)).map(c => Object.assign({ slug: slug(c.name) }, c));
const BIG = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Dallas, TX', 'Miami, FL', 'Atlanta, GA', 'Washington, DC', 'Philadelphia, PA', 'Phoenix, AZ', 'San Diego, CA', 'San Francisco, CA',
  'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Las Vegas, NV', 'Orlando, FL', 'Nashville, TN', 'New Orleans, LA', 'Toronto, ON', 'Vancouver, BC', 'Montreal, QC'];

function evFor(o, city) { return { type: o.type, culture: o.culture, guests: o.guests, expected: o.guests, hours: o.hours, city, setting: 'indoor', time: o.type === 'brunch' ? '11:00' : o.type === 'kids-birthday' ? '14:00' : '18:00', alcohol: ['baby-shower', 'gender-reveal', 'quince', 'sweet16', 'kids-birthday'].includes(o.type) ? 'none' : 'full', kids: o.type === 'kids-birthday', priorities: [], overrides: {} }; }
function totals(o, city) { const ev = evFor(o, city); E.useCountry(city); const t = ['L', 'S', 'U'].map(k => E.budget(ev, k).total); return t; }
const money = (n, city) => E.moneyIn(n, city);

function page({ rel, title, desc, h1, body, canonical, ld, crumb, image }) {
  const up = rel ? '../'.repeat(rel) : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script>if(location.protocol==='http:'&&/(^|\.)eventcouture\.app$/.test(location.hostname))location.replace('https://'+location.host+location.pathname+location.search+location.hash)</script>
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="article"><meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${image || BASE + 'img/hero.jpg'}"><meta property="og:site_name" content="Event Couture"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${up}img/brand/ec-mark-128.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&display=swap"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500&display=optional">
<link rel="stylesheet" href="${up}css/app.css"><style>.topbar .btn{white-space:nowrap}@media(max-width:560px){.topbar .btn{padding:6px 12px;font-size:.82rem}}.guide table{width:100%}.guide td.n,.guide th.n{text-align:right;white-space:nowrap}.guide .cta{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.guide ol.plain,.guide ul.plain{padding-left:20px;display:grid;gap:6px}.guide .cols{columns:2 220px;gap:24px}.guide .cols a{display:block;padding:3px 0}</style>
${(ld || [{ '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, image: image || BASE + 'img/hero.jpg', author: { '@type': 'Organization', name: 'Event Couture by Always Luxe', url: BASE }, publisher: { '@type': 'Organization', name: 'Event Couture by Always Luxe', logo: { '@type': 'ImageObject', url: BASE + 'img/brand/ec-mark-256.png' } }, dateModified: new Date().toISOString().slice(0, 10), mainEntityOfPage: canonical }]).concat([{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Event Couture', item: BASE }].concat(crumb ? [{ '@type': 'ListItem', position: 2, name: crumb, item: canonical }] : canonical === BASE + 'plan/' ? [{ '@type': 'ListItem', position: 2, name: 'Planning guides', item: canonical }] : [{ '@type': 'ListItem', position: 2, name: 'Planning guides', item: BASE + 'plan/' }, { '@type': 'ListItem', position: 3, name: h1, item: canonical }]) }]).map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('')}<script src="${up}js/analytics.js" defer></script>
</head><body><header class="topbar"><a class="brand logo-mark" href="${up}#/" aria-label="Event Couture by Always Luxe, home"><img src="${up}img/brand/logo-mark-gold-wide.webp" alt="Event Couture" width="563" height="210"><span class="by" aria-hidden="true">by Always Luxe</span></a><nav><a class="btn small gold" href="${up}#/new/1">Plan my event</a></nav></header>
<main class="guide stack-lg"><nav class="small muted" aria-label="Breadcrumb"><a href="${up}">Home</a> › ${crumb ? esc(crumb) : `<a href="${up}plan/">Planning guides</a>`}</nav><div class="stack"><h1>${esc(h1)}</h1></div>${body}
<p class="small muted">All prices are ${YEAR} planning estimates from Event Couture, sized to local costs and including tax, service charges and tips where they usually apply. Real prices come from each venue and vendor.</p></main>
<footer class="site"><img src="${up}img/brand/ec-mark-128.png" alt="" loading="lazy"><nav><a href="${up}plan/">Planning guides</a><a href="${up}ai-event-planner/">AI event planner</a><a href="${up}event-budget-calculator/">Budget calculator</a><a href="${up}#/help">Help</a><a href="${up}#/vendors">For vendors</a><a href="${up}#/privacy">Privacy</a><a href="${up}#/terms">Terms</a></nav><div class="name">Event Couture by Always Luxe</div></footer></body></html>`;
}
const cta = (o, city, up) => `<div class="panel stack"><b>Plan ${esc(o ? o.phrase.replace(/^an? /, 'your ') : 'your event')}${city ? ' in ' + esc(city.split(',')[0]) : ''}, free</b><p class="small muted">Share one photo or a few words. Event Couture builds the look, a budget for your exact guest count, top-rated venues and vendors near you, the menu, the schedule and a formal invitation.</p><div class="cta"><a class="btn gold" href="${up}#/start/${o ? o.start : ''}/${city ? encodeURIComponent(city) : ''}">Start planning</a></div></div>`;
const write = (rel, html) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const urls = [];

/* City pages. The 20 biggest US markets get full local guides and go to Google; the others stay reachable from the
   site but carry noindex until they get the same local detail (avoids near-duplicate pages). */
const TOP = {
  'New York, NY': 'Peak seasons are May to June and September to October, when the best venues book 12 to 18 months ahead. Venue food-and-drink minimums are among the highest in the country, so a Friday, Sunday or winter date can lower the total a lot.',
  'Los Angeles, CA': 'The mild weather allows outdoor events most of the year. Beaches, parks and some landmark sites need a permit from the city or county, and traffic means a venue close to guests matters as much as the view.',
  'Orange County, CA': 'Coastal weather is mild all year, with cooler, cloudier mornings in late spring and early summer. Beach ceremonies need a permit from the city that manages that beach.',
  'San Diego, CA': 'Weather is mild year round; late spring and early summer often bring a cool, cloudy marine layer near the coast, and September to October are the warmest, clearest months.',
  'San Francisco, CA': 'Summers are often cool and foggy; September and October are usually the warmest months. Plan layers or heaters for evening events, and expect high venue and catering prices in the city.',
  'Chicago, IL': 'Peak season runs June to October. Winters are cold and snowy, so many venues offer lower prices from November to March, especially on Fridays and Sundays.',
  'Houston, TX': 'Summers are hot and humid, and hurricane season runs June through November. Most hosts choose spring (March to May) or late fall, and keep an indoor or tented backup for outdoor events.',
  'Dallas, TX': 'Summers are hot and spring brings storms. April, May and October are the most popular months for outdoor events; plan shade and cooling for anything outdoors from June to September.',
  'Austin, TX': 'Hill Country venues are popular for weddings. Summers are hot; spring and fall are peak season, and big festivals in March and October raise hotel prices.',
  'San Antonio, TX': 'Winters are mild and summers are hot. Fiesta in April fills hotels and River Walk venues, so book early or choose another month.',
  'Miami, FL': 'Peak season is November to April. May to October is hot and rainy, with afternoon storms and hurricane season, so outdoor events need a covered backup.',
  'Orlando, FL': 'Summer brings heat and near-daily afternoon thunderstorms. Cooler, drier months from November to April are the most popular, and theme-park holidays raise hotel rates.',
  'Atlanta, GA': 'Summers are hot and humid. Spring and fall are peak season; outdoor venues need shade and a rain plan.',
  'Washington, DC': 'Cherry blossom season in late March and April is very busy. Summers are hot and humid; September to November is the most popular time for events.',
  'Philadelphia, PA': 'Peak months are May, June, September and October. Winter dates often come with lower venue prices.',
  'Boston, MA': 'Peak season runs June to October, and fall foliage weekends book first. Winters are cold and snowy, which brings lower prices.',
  'Phoenix, AZ': 'Summer heat often passes 105\u00b0F, so most events happen from October to April. Outdoor summer events need evening times, shade and cooling.',
  'Las Vegas, NV': 'Summers are very hot. Spring and fall are the most popular seasons, and large conventions can raise hotel prices on short notice.',
  'Seattle, WA': 'October to April is rainy. July to September is usually dry and books first, so outdoor events outside summer need a covered plan.',
  'Detroit, MI': 'Peak season runs June to October. Winters are cold and snowy, with lower venue prices from November to March.'
};
const recsIn = (city) => { const st = city.split(', ')[1] || ''; const seen = {}; return (D.RECOMMENDED || []).filter(r => (r.cities && r.cities.includes(city)) || (r.onlyCities && r.onlyCities.includes(city)) || (!r.cities && !r.onlyCities && r.states && r.states.includes(st) && !(r.notCities || []).includes(city))).filter(r => { const k = r.ig || r.name; if (seen[k]) return false; seen[k] = 1; return true; }); };
const catLabel = id => (D.CATEGORIES[id] ? D.CATEGORIES[id].name.split(' (')[0] : id);
for (const c of CITIES) {
  const country = E.countryOf(c.name), cityShort = c.name.split(',')[0];
  const rows = OCC.map(o => { const t = totals(o, c.name); return `<tr><td><a href="../${o.slug}/">${esc(o.name)}</a></td><td class="n">${o.guests}</td><td class="n">${money(t[0], c.name)}</td><td class="n"><b>${money(t[1], c.name)}</b></td><td class="n">${money(t[2], c.name)}</td><td><a class="small" href="../../#/start/${o.start}/${encodeURIComponent(c.name)}">Plan it</a></td></tr>`; }).join('');
  const rate = (id, unit) => { E.useCountry(c.name); const k = D.CATEGORIES[id], m = c.index; const r = k.perHour || k.perGuest || k.fixed; return `<tr><td>${esc(k.name.split(' (')[0])}</td><td class="n">${money(r[0] * m, c.name)} to ${money(r[1] * m, c.name)} ${unit}</td></tr>`; };
  const areas = D.AREAS[c.name] || [];
  const tax = c.taxName ? `${c.taxName} (${c.tax}%)` : c.tax ? `${c.tax}% sales tax` : 'no local sales tax';
  const body = `<p>What it typically costs to host an event in ${esc(c.name)} in ${YEAR}: weddings, quinceañeras, birthdays, showers and more, sized to local prices${country.id === 'US' ? '' : ' in ' + country.currency}${country.tip === false ? ', no tips added' : ''} with ${esc(tax)}.</p>
<div class="table-wrap panel"><table class="qty"><thead><tr><th>Occasion</th><th class="n">Guests</th><th class="n">Luxe for Less</th><th class="n">Signature</th><th class="n">Ultra Luxe</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="small muted"><b>Luxe for Less</b> keeps the look with smart swaps; <b>Signature</b> has the key pieces done by pros; <b>Ultra Luxe</b> adds full service, lighting, live music and a coordinator.</p>
<h2>Typical vendor rates in ${esc(cityShort)}</h2><div class="table-wrap panel"><table class="qty"><tbody>${rate('photographer', 'an hour')}${rate('videographer', 'an hour')}${rate('dj', 'an hour')}${rate('liveMusic', 'an hour')}${rate('catering', 'a guest')}${rate('bartender', 'an hour')}${rate('rentals', 'a guest')}${rate('cake', 'base, plus per guest')}${rate('balloons', '')}${rate('photoBooth', '')}</tbody></table></div>
${areas.length ? `<h2>Popular areas for venues</h2><p>${areas.map(esc).join(' · ')}</p>` : ''}
${cta(null, c.name, '../../')}<h2>Planning guides by occasion</h2><div class="cols">${OCC.map(o => `<a href="../${o.slug}/">${esc(o.name)}</a>`).join('')}</div>`;
  const top = TOP[c.name];
  let local = '', ld = [];
  if (top) {
    const wed = OCC.find(o => o.key === 'wedding'), quince = OCC.find(o => o.key === 'quince'), bday = OCC.find(o => o.key === 'birthday'), baby = OCC.find(o => o.key === 'baby-shower');
    const tw = totals(wed, c.name), tq = quince && totals(quince, c.name), tb = bday && totals(bday, c.name), tbs = baby && totals(baby, c.name);
    const cult = OCC.filter(o => o.culture).map(o => ({ o, t: totals(o, c.name) })).sort((x, y) => x.t[1] - y.t[1]);
    const recs = recsIn(c.name), nv = (D.NEW_VENUES || []).filter(v => v.city === c.name);
    local = `<h2>Planning notes for ${esc(cityShort)}</h2><p>${esc(top)}</p>` +
      `<h2>Cultural weddings in ${esc(cityShort)}</h2><p class="small muted">Signature level, typical guest count for each tradition.</p><div class="table-wrap panel"><table class="qty"><thead><tr><th>Wedding</th><th class="n">Guests</th><th class="n">Signature budget</th></tr></thead><tbody>${cult.map(x => `<tr><td><a href="../${x.o.slug}/">${esc(x.o.name)}</a></td><td class="n">${x.o.guests}</td><td class="n">${money(x.t[1], c.name)}</td></tr>`).join('')}</tbody></table></div>` +
      (recs.length ? `<h2>Event Couture picks in ${esc(cityShort)}</h2><p class="small muted">Founder\u2019s picks: not paid placement or an independent review. Always check reviews and contracts yourself.</p><ul class="plain">${recs.slice(0, 16).map(r => `<li><b>${esc(r.name)}</b> \u00b7 ${esc(r.cats.map(catLabel).join(', '))}${r.cultures && r.cultures.length && !r.cultures.includes('parties') ? ' \u00b7 ' + esc(r.cultures.map(k => (D.CULTURES[k] || { name: k }).name.replace(/ wedding$/i, '')).join(', ')) + ' weddings' : ''}${r.ig ? ` \u00b7 <a href="https://instagram.com/${esc(r.ig)}" rel="nofollow noopener" target="_blank">@${esc(r.ig)}</a>` : ''}${r.note ? `<br><span class="small muted">${esc(r.note)}</span>` : ''}</li>`).join('')}</ul>` : '') +
      (nv.length ? `<h2>Newly opened venues</h2><ul class="plain">${nv.map(v => `<li><b>${esc(v.name)}</b>${v.area ? ' \u00b7 ' + esc(v.area) : ''}${v.note ? `<br><span class="small muted">${esc(v.note)}</span>` : ''}</li>`).join('')}</ul>` : '');
    const faqs = [[`How much does a wedding cost in ${cityShort}?`, `For about ${wed.guests} guests, ${money(tw[0], c.name)} done smartly, ${money(tw[1], c.name)} with the key pieces handled by pros, and ${money(tw[2], c.name)} or more for full-service luxury, in ${YEAR}.`],
      tq ? [`How much does a quinceañera cost in ${cityShort}?`, `About ${money(tq[0], c.name)} to ${money(tq[2], c.name)} for ${quince.guests} guests, with ${money(tq[1], c.name)} a typical middle budget.`] : null,
      tb ? [`How much does a birthday party cost in ${cityShort}?`, `About ${money(tb[0], c.name)} to ${money(tb[2], c.name)} for ${bday.guests} guests.`] : null,
      tbs ? [`How much does a baby shower cost in ${cityShort}?`, `About ${money(tbs[0], c.name)} to ${money(tbs[2], c.name)} for ${baby.guests} guests.`] : null,
      [`When is the best time to host an event in ${cityShort}?`, top]].filter(Boolean);
    local += `<h2>Questions people ask</h2><div class="faq">${faqs.map(([q, a]) => `<details class="panel"><summary><b>${esc(q)}</b></summary><p>${esc(a)}</p></details>`).join('')}</div>`;
    ld = [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
  }
  const fullBody = top ? body.replace(`${cta(null, c.name, '../../')}<h2>Planning guides by occasion</h2>`, `${local}${cta(null, c.name, '../../')}<h2>Planning guides by occasion</h2>`) : body;
  const title = top ? `Event & Wedding Costs in ${cityShort} (${YEAR}): Local Planning Guide | Event Couture` : `What events cost in ${c.name} (${YEAR} guide) | Event Couture`;
  let html = page({ rel: 2, title, h1: top ? `Planning an event in ${c.name}: ${YEAR} costs and local tips` : `Planning an event in ${c.name}`, desc: top ? `${YEAR} costs for weddings, quinceañeras, birthdays and showers in ${c.name}, cultural wedding budgets, local vendor rates, the best areas for venues and when to book.` : `Typical ${YEAR} costs for weddings, quinceañeras, birthdays, showers and more in ${c.name}, with local vendor rates and the best areas for venues.`, body: fullBody, canonical: `${BASE}plan/${c.slug}/`, ld });
  if (!top) html = html.replace('<head>', '<head><meta name="robots" content="noindex,follow">');
  write(`plan/${c.slug}/index.html`, html);
  if (top) urls.push(`${BASE}plan/${c.slug}/`);
}

const AKA = { wedding: 'wedding ceremony and reception, small or intimate weddings, micro weddings and big ballroom weddings', engagement: 'engagement parties and proposal celebrations', 'bridal-shower': 'bridal showers, bridal brunches and kitchen teas', bachelorette: 'bachelorette parties, hen parties and girls’ weekends', 'baby-shower': 'baby showers, baby sprinkles and sip and sees', 'gender-reveal': 'gender reveal parties, boy or girl parties', birthday: 'adult birthday parties, birthday dinners and surprise parties', 'kids-birthday': 'kids’ birthday parties, first birthdays and children’s themed parties', milestone: '30th, 40th, 50th, 60th and 70th birthday parties', sweet16: 'sweet sixteen parties', quince: 'quinceañeras, XV años and fiestas de quince años', graduation: 'graduation parties, grad parties and open houses', anniversary: 'anniversary parties and vow renewals', retirement: 'retirement parties and farewell celebrations', brunch: 'brunches, tea parties and garden luncheons', dinner: 'dinner parties and private dinners', christmas: 'Christmas parties and family holiday dinners', holiday: 'holiday parties, New Year’s Eve parties and seasonal celebrations', gala: 'galas, charity fundraisers and award dinners', corporate: 'corporate events, company parties and office celebrations',
  'arabic-wedding': 'Arab, Middle Eastern, Lebanese, Palestinian, Syrian, Jordanian, Iraqi and Egyptian weddings, with the zaffe, katb el kitab and dabke', 'indian-wedding': 'Hindu, Sikh, Punjabi, Gujarati and South Indian weddings, with the sangeet, mehndi, baraat and pheras', 'pakistani-wedding': 'Pakistani weddings with the nikah, mehndi, baraat and walima', 'persian-wedding': 'Persian and Iranian weddings with the aghd and sofreh aghd', 'mexican-wedding': 'Mexican and Latin weddings (bodas), with mariachi, lazo and arras', 'chinese-wedding': 'Chinese weddings with the tea ceremony and banquet', 'vietnamese-wedding': 'Vietnamese weddings with the tea ceremony and procession', 'korean-wedding': 'Korean weddings with the pyebaek', 'filipino-wedding': 'Filipino weddings with the veil, cord and coins', 'nigerian-wedding': 'Nigerian, Yoruba and Igbo traditional weddings, with aso ebi and gele', 'africanamerican-wedding': 'African American weddings with jumping the broom', 'spanish-wedding': 'Spanish and Latin weddings', 'russian-wedding': 'Russian and Eastern European weddings', 'moroccan-wedding': 'Moroccan weddings with the henna night, negafa and amariya', 'greek-wedding': 'Greek Orthodox weddings with the stefana crowns', 'turkish-wedding': 'Turkish weddings with the kına gecesi henna night', 'fusion-wedding': 'multicultural, interfaith and fusion weddings' };
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
  const extra = cu ? `<h2>Traditions and music</h2><p>${cu.chipsTitle ? 'Traditions and music couples choose from' : 'Music most families choose from'}: ${cu.music.map(m => esc(m[1])).join(', ')}.${cu.add.length ? ' Traditions to budget for: ' + cu.add.map(a => esc(D.CATEGORIES[a].name)).join('; ') + '.' : ''}</p><p>Menu ideas: ${D.MENUS[cu.menu].map(esc).join(' · ')}.</p>` : '';
  const q = `How much does ${o.phrase} cost?`;
  const pic = INSPO.find(p => o.culture ? p.id === 'culture-' + o.culture : p.types[0] === o.type) || INSPO.find(p => p.types.includes(o.type));
  const top3 = b.items.slice().sort((x, y) => y.mid - x.mid).slice(0, 3);
  const firstStep = E.checklist(Object.assign({}, ev, { date: d.toISOString().slice(0, 10) }), new Date())[1];
  const lead = firstStep ? Math.max(1, Math.round((new Date(d) - new Date(firstStep.due)) / (30.4 * 864e5))) : 0;
  const short = o.phrase.replace(/^an? /, '');
  const faqs = [[`How much does ${o.phrase} cost?`, `For about ${o.guests} guests, ${money(t[0], nat)} to ${money(t[2], nat)} at average US prices in ${YEAR}, with ${money(t[1], nat)} a typical middle budget. Prices rise in big cities: see the table above.`],
    [`What are the biggest expenses for ${o.phrase}?`, top3.map(i => `${i.name.split(' (')[0]} (about ${Math.round(i.mid / b.total * 100)}% of the budget)`).join(', ') + '.'],
    lead ? [`How far ahead should I plan ${o.phrase}?`, `Start about ${lead} month${lead === 1 ? '' : 's'} ahead and ${firstStep.text.toLowerCase()} first. The checklist above shows what to book, and when.`] : null,
    [`How can I save money on ${o.phrase}?`, `Keep the look and swap the extras: the Luxe for Less version of this ${short} costs about ${money(t[0], nat)}, ${money(t[1] - t[0], nat)} less than the Signature version, mostly by trimming ${top3.slice(0, 2).map(i => i.name.split(' (')[0].toLowerCase()).join(' and ')}.`],
    [`Can I plan ${o.phrase} online for free?`, `Yes. Event Couture builds the look, a budget for your city and guest count, top-rated vendors, a checklist and invitations, free.`]].filter(Boolean);
  const body = `<p>For about ${o.guests} guests, ${o.phrase} typically costs <b>${money(t[0], nat)}</b> done smartly, <b>${money(t[1], nat)}</b> with the key pieces handled by pros, and <b>${money(t[2], nat)}</b> or more for full-service luxury, at average US prices in ${YEAR}. Here is where the money goes, what it costs in major cities, a sample schedule and what to book when.</p>${AKA[o.key] ? `<p class="small muted">This guide covers ${AKA[o.key]}.</p>` : ''}
<h2>Budget breakdown (Signature, ${o.guests} guests)</h2><div class="table-wrap panel"><table class="qty"><tbody>${lines}<tr><td>Contingency (unexpected costs)</td><td class="n">${money(b.contingency, nat)}</td></tr><tr><td><b>Estimated total</b></td><td class="n"><b>${money(b.total, nat)}</b></td></tr></tbody></table></div>
<h2>What ${o.phrase.replace(/^an? /, '')} costs in major cities</h2><div class="table-wrap panel"><table class="qty"><thead><tr><th>City</th><th class="n">Luxe for Less</th><th class="n">Signature</th><th class="n">Ultra Luxe</th></tr></thead><tbody>${cityRows}</tbody></table></div>
${pic ? `<figure class="lp-fig"><img src="../../img/inspo/${pic.id}.jpg" alt="${esc(pic.alt || pic.name)}" width="1200" height="800" loading="lazy"><figcaption class="small muted">${esc(pic.name)} · AI-generated inspiration</figcaption></figure>` : ''}${extra}<h2>Sample schedule</h2><ol class="plain">${ros}</ol><h2>What to book, and when</h2><ol class="plain">${steps}</ol>
<h2>Questions people ask</h2><div class="faq">${faqs.map(([qq, a]) => `<details class="panel"><summary><b>${esc(qq)}</b></summary><p>${esc(a)}</p></details>`).join('')}</div>
${cta(o, null, '../../')}<h2>Costs in your city</h2><div class="cols">${CITIES.map(c => `<a href="../${c.slug}/">${esc(c.name)}</a>`).join('')}</div>`;
  const art = { '@context': 'https://schema.org', '@type': 'Article', headline: q, description: `${o.name} budget for ${YEAR}`, image: pic ? `${BASE}img/inspo/${pic.id}.jpg` : `${BASE}img/hero.jpg`, author: { '@type': 'Organization', name: 'Event Couture by Always Luxe', url: BASE }, publisher: { '@type': 'Organization', name: 'Event Couture by Always Luxe', logo: { '@type': 'ImageObject', url: `${BASE}img/brand/ec-mark-256.png` } }, dateModified: new Date().toISOString().slice(0, 10), mainEntityOfPage: `${BASE}plan/${o.slug}/` };
  const fq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([qq, a]) => ({ '@type': 'Question', name: qq, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  write(`plan/${o.slug}/index.html`, page({ rel: 2, title: `${o.name} Cost (${YEAR}): Budget, Checklist and Planner | Event Couture`, h1: q, desc: `${o.name} planner for ${YEAR}: what it costs (${money(t[0], nat)} to ${money(t[2], nat)}), a line-by-line budget, costs in major cities, a sample schedule and a planning checklist.`, body, canonical: `${BASE}plan/${o.slug}/`, ld: [art, fq], image: pic ? `${BASE}img/inspo/${pic.id}.jpg` : null }));
  urls.push(`${BASE}plan/${o.slug}/`);
}

/* Guides index and sitemap */
const idx = `<p>Real numbers for planning any celebration: what it costs, where the money goes, and what to book when, for ${OCC.length} occasions and ${CITIES.length} cities in ${new Set(CITIES.map(c => c.country)).size} countries.</p>
<h2>By occasion</h2><div class="cols">${OCC.map(o => `<a href="${o.slug}/">${esc(o.name)}</a>`).join('')}</div><h2>By city</h2><div class="cols">${CITIES.map(c => `<a href="${c.slug}/">${esc(c.name)}</a>`).join('')}</div>${cta(null, null, '../')}`;
write('plan/index.html', page({ rel: 1, title: `Event planning guides and costs (${YEAR}) | Event Couture`, h1: 'Event planning guides', desc: `What weddings, quinceañeras, birthdays, showers and more cost in ${YEAR}, city by city, with budgets, schedules and checklists.`, body: idx, canonical: `${BASE}plan/` }).replace('<a href="../">Home</a> › <a href="../plan/">Planning guides</a></nav>', '<a href="../">Home</a> › Planning guides</nav>'));
urls.unshift(BASE, `${BASE}plan/`);
const landingPages = require('./landing.cjs')({ D, E, OCC, CITIES, BIG, page, write, urls, esc, money, totals, evFor, YEAR, BASE, INSPO });
fs.writeFileSync(path.join(OUT, 'robots.txt'), `# Event Couture: everything public may be crawled. Private plans live behind # links, which search engines don't index.\nUser-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`);
write('404.html', page({ rel: 0, title: 'Page not found | Event Couture', desc: 'This page doesn’t exist. Start planning your event or browse the planning guides.', h1: 'This page doesn’t exist', crumb: 'Page not found', canonical: BASE, body: `<p>The link may be old or mistyped. Here are good places to start:</p><div class="cta"><a class="btn primary" href="/#/new/1">Plan my event</a><a class="btn ghost" href="/plan/">Planning guides</a><a class="btn ghost" href="/ai-event-planner/">AI event planner</a></div>` }).replace('<head>', '<head><meta name="robots" content="noindex"><base href="/">'));
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u}</loc><lastmod>${today}</lastmod>${u === BASE ? '<priority>1.0</priority>' : landingPages.some(l => u === BASE + l + '/') ? '<priority>0.9</priority>' : /\/plan\/[a-z0-9-]+-(wedding|party)\/$|\/plan\/(wedding|birthday|baby-shower|quinceanera|kids-themed-birthday|engagement-party|bridal-shower|graduation-party|sweet-16)\/$/.test(u) ? '<priority>0.8</priority>' : '<priority>0.5</priority>'}</url>`).join('\n')}\n</urlset>\n`);
console.log(`guides: ${CITIES.length} cities, ${OCC.length} occasions, ${landingPages.length} landing pages, ${urls.length} urls`);
