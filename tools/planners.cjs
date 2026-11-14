// "Hire a planner" pages: for people searching to have their event planned for them ("Arabic wedding planner Houston",
// "quinceañera planner Dallas", "virtual wedding planner"), not to plan it themselves. Each page shows the Event Couture
// planning packages with what's included, what that event costs in that city, and leads to the "Let us plan it for you" form.
// The packages and prices are read from js/app.js so these pages always match the form. Called from tools/seo.cjs.
'use strict';
/* Every US and Canadian city gets an event, wedding and party planner page (plus quinceañera in the US);
   the biggest metros also get the cultural wedding planner pages. Houston and Dallas list their suburbs by name. */
const SUBURBS = {
  'Houston, TX': ['Katy', 'Sugar Land', 'The Woodlands', 'Pearland', 'Cypress', 'Spring', 'Missouri City', 'League City'],
  'Dallas, TX': ['Plano', 'Frisco', 'Irving', 'Richardson', 'McKinney', 'Arlington', 'Garland', 'Fort Worth']
};
const BIG_CA = ['Toronto, ON', 'Montreal, QC', 'Vancouver, BC', 'Calgary, AB', 'Ottawa, ON', 'Edmonton, AB'];
const CULTS = ['arabic', 'indian', 'pakistani', 'persian'];
const PLACES = {};
const slugOf = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function setup({ E, CITIES, BIG }) {
  const list = CITIES.filter(c => ['US', 'CA'].includes(E.countryOf(c.name).id));
  for (const c of list) {
    const cc = E.countryOf(c.name).id, region = c.name.split(', ')[1];
    PLACES[c.name] = { slug: slugOf(c.name.split(',')[0]), short: c.name.split(',')[0], guide: c.slug, cc, big: BIG.includes(c.name) || BIG_CA.includes(c.name) || !!SUBURBS[c.name],
      near: SUBURBS[c.name] || null, nearCities: list.filter(x => x !== c && x.name.split(', ')[1] === region).map(x => x.name).slice(0, 6) };
  }
}
const KINDS = (c, P) => [
  { key: 'event', occ: 'wedding', title: `Event Planner in ${c}`, h1: `Event planner in ${c}`, what: 'event', pk: 'all' },
  { key: 'wedding', occ: 'wedding', title: `Wedding Planner in ${c}`, h1: `Wedding planner in ${c}`, what: 'wedding', pk: 'big' },
  ...(P && P.big ? CULTS.map(k => ({ key: k + '-wedding', occ: k + '-wedding', culture: k, pk: 'big' })) : []),
  ...(!P || P.cc === 'US' ? [{ key: 'quinceanera', occ: 'quince', title: `Quinceañera Planner in ${c}`, h1: `Quinceañera planner in ${c}`, what: 'quinceañera', pk: 'big' }] : []),
  { key: 'party', occ: 'birthday', title: `Party Planner in ${c}: Birthdays, Showers and More`, h1: `Party planner in ${c}`, what: 'party', pk: 'small' }
];
/* which planner pages exist for a city, for linking from that city's planning guide */
function listFor(city) { const p = PLACES[city]; return p ? KINDS(p.short, p).map(k => ({ slug: `${p.slug}-${k.key}-planner`, key: k.key, culture: k.culture })) : []; }

function build(ctx) {
  const { D, OCC, page, write, urls, esc, money, totals, YEAR, BASE, recsIn, catLabel, noteFor, CITIES } = ctx;
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js/app.js'), 'utf8');
  const PKGS = eval(src.match(/var PR_PKGS = (\[[\s\S]*?\]\]?\s*\}\]);/)[1]);
  const occ = id => OCC.find(o => o.key === id);
  const pages = [];
  const cards = (which, note) => {
    const list = which === 'all' ? PKGS : which === 'small' ? PKGS.filter(k => k.id === 'Party Planning') : PKGS.filter(k => k.id !== 'Party Planning');
    return `<div class="pr-pkgs${list.length < 3 ? ' pr-two' : ''}">${list.map(k => `<div class="pr-pkg${k.top ? ' top' : ''}">${k.top ? '<span class="pr-pop">Most popular</span>' : ''}<span class="pr-name">${esc(k.name)}</span><span class="pr-kind">${esc(k.id)}</span><span class="pr-for">${esc(k.for)}</span><span class="pr-cost"><s>${k.was}</s> <b>from ${k.from}</b></span><ul class="pr-inc">${k.inc.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
<p class="small muted pr-terms">Holiday special prices${note || ''} · Vendor costs are separate and paid directly to your vendors · 50% to start, the rest once your vendors are booked · Planning by phone and online</p>`;
  };
  const how = `<h2>How it works</h2><ol class="plain"><li><b>Send a request.</b> Choose a package and tell us about your event. No payment to send it.</li><li><b>We get back to you within 24 hours</b> by text, call or email, whichever you prefer, to talk through your vision, date and budget.</li><li><b>We find, compare and book your vendors,</b> negotiating prices for you. You approve every choice and pay your vendors directly.</li><li><b>You get a full timeline</b> shared with every vendor, so the day runs the way you planned it.</li></ol>`;
  const cta = (o, city) => `<div class="cta"><a class="btn gold" href="../#/plan-for-me">See packages and send a request</a><a class="btn ghost" href="../#/start/${o.start}/${city ? encodeURIComponent(city) : ''}">Or plan it yourself, free</a></div>`;
  const add = (slug, title, desc, h1, body, faqs, areaServed) => {
    const ld = [{ '@context': 'https://schema.org', '@type': 'Service', name: h1, serviceType: 'Event planning', description: desc, url: `${BASE}${slug}/`, areaServed,
      provider: { '@type': 'Organization', name: 'Event Couture by Always Luxe', url: BASE, logo: `${BASE}img/brand/ec-mark-256.png` },
      offers: PKGS.map(k => ({ '@type': 'Offer', name: `${k.name} (${k.id})`, priceCurrency: 'USD', price: k.from.replace(/[^0-9]/g, ''), description: k.inc.join('; ') })) },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
    const faqHtml = `<h2>Questions people ask</h2><div class="faq">${faqs.map(([q, a]) => `<details class="panel"><summary><b>${esc(q)}</b></summary><p>${esc(a)}</p></details>`).join('')}</div>`;
    write(`${slug}/index.html`, page({ rel: 1, title: `${title} (${YEAR}) | Event Couture`, desc, h1, body: body + faqHtml, canonical: `${BASE}${slug}/`, ld, crumb: h1 }));
    urls.splice(1, 0, `${BASE}${slug}/`); pages.push(slug);
  };

  for (const city of Object.keys(PLACES)) {
    const P = PLACES[city], c = P.short, area = P.near ? `${c} and nearby, including ${P.near.slice(0, -1).join(', ')} and ${P.near[P.near.length - 1]}` : `${c} and the surrounding area`;
    const cityObj = CITIES.find(x => x.name === city), usd = P.cc === 'US' ? '' : ' Planning fees are in US dollars.';
    const picks = (recsIn(city) || []).slice(0, 8);
    const siblings = listFor(city);
    for (const k of KINDS(c, P)) {
      const o = occ(k.occ); if (!o) continue;
      const cu = k.culture && D.CULTURES[k.culture];
      const what = cu ? cu.name.replace(/ wedding$/, '') + ' wedding' : k.what;
      const title = cu ? `${cu.name.replace(/ wedding$/, '')} Wedding Planner in ${c}` : k.title;
      const h1 = cu ? `${cu.name.replace(/ wedding$/, '')} wedding planner in ${c}` : k.h1;
      const t = totals(o, city), slug = `${P.slug}-${k.key}-planner`;
      const occLine = k.key === 'event' ? 'weddings, engagement parties, quinceañeras, birthdays, baby and bridal showers, graduations and corporate events'
        : k.key === 'party' ? 'birthdays, kids’ parties, baby and bridal showers, gender reveals, graduations and holiday parties' : `your ${what}`;
      const lead = `Event Couture plans ${occLine} in ${area}. We find and book your venue and vendors, negotiate prices for you and build the timeline, by phone and online, so you can enjoy the planning instead of chasing quotes.`;
      const costs = k.key === 'party'
        ? ['birthday', 'kids-birthday', 'baby-shower', 'bridal-shower', 'graduation'].map(occ).filter(Boolean)
        : k.key === 'event' ? ['wedding', 'engagement', 'quince', 'birthday', 'baby-shower', 'corporate'].map(occ).filter(Boolean) : [o];
      const costTable = `<div class="table-wrap panel"><table class="qty"><thead><tr><th>Event</th><th class="n">Guests</th><th class="n">Typical budget in ${esc(c)}</th></tr></thead><tbody>${costs.map(x => { const tt = totals(x, city); return `<tr><td><a href="../plan/${P.guide}/${x.slug}/">${esc(x.name)}</a></td><td class="n">${x.guests}</td><td class="n">${money(tt[0], city)} to ${money(tt[2], city)}</td></tr>`; }).join('')}</tbody></table></div>`;
      const trad = cu ? `<h2>${esc(cu.name.replace(/ wedding$/, ''))} traditions we plan for</h2><p>${esc(cu.blurb)} We book vendors who specialize in ${esc(what)}s and know the order of the night, from ${esc((cu.music || []).map(m => m[1].replace(/^([A-Z])([a-z])/, (x, a, b) => a.toLowerCase() + b)).join(', '))} to the menu.</p>` : '';
      const more = `<h2>Other planners in ${esc(c)}</h2><div class="cols">${siblings.filter(s => s.slug !== slug).map(s => { const kk = KINDS(c, P).find(x => x.key === s.key); const nm = kk.culture ? D.CULTURES[kk.culture].name.replace(/ wedding$/, '') + ' wedding planner' : kk.h1.replace(` in ${c}`, ''); return `<a href="../${s.slug}/">${esc(nm.charAt(0).toUpperCase() + nm.slice(1))}</a>`; }).join('')}<a href="../virtual-wedding-planner/">Virtual wedding planner</a></div>`;
      const body = `<p class="lead">${esc(lead)}</p>${cta(o, city)}
<h2>Planning packages</h2>${cards(k.pk, usd)}
${trad}
<h2>What ${k.key === 'event' ? 'events' : k.key === 'party' ? 'parties' : (/^[aeiou]/i.test(what) ? 'an ' : 'a ') + esc(what)} cost${k.key === 'event' || k.key === 'party' ? '' : 's'} in ${esc(c)}</h2><p class="small muted">Typical ${YEAR} budgets for the event itself (venue, food, vendors), separate from our planning fee.</p>${costTable}
<h2>Planning notes for ${esc(c)}</h2><p>${esc(noteFor(cityObj))}</p>
${picks.length ? `<h2>Event Couture picks in ${esc(c)}</h2><p class="small muted">Vendors we recommend in ${esc(c)}; not paid placement.</p><ul class="plain">${picks.map(r => `<li><b>${esc(r.name)}</b> \u00b7 ${esc(r.cats.map(catLabel).join(', '))}</li>`).join('')}</ul>` : ''}
${how}${cta(o, city)}${more}${P.nearCities.length ? `<h2>${esc(k.key === 'event' ? 'Event' : k.key === 'party' ? 'Party' : cu ? cu.name.replace(/ wedding$/, '') + ' wedding' : k.what.charAt(0).toUpperCase() + k.what.slice(1))} planners nearby</h2><div class="cols">${P.nearCities.map(n => { const q = PLACES[n]; if (!q) return ''; const has = KINDS(q.short, q).some(x => x.key === k.key); return `<a href="../${q.slug}-${has ? k.key : 'event'}-planner/">${esc(q.short)}</a>`; }).join('')}</div>` : ''}`;
      const fee = k.pk === 'small' ? 'The Soirée (party planning) starts at $500' : 'The Atelier (vendor booking) starts at $1,900 and The Haute Couture (full planning) at $2,500';
      const faqs = [
        [`How much does ${k.key === 'party' ? 'a party planner' : k.key === 'event' ? 'an event planner' : (/^[aeiou]/i.test(what) ? 'an ' : 'a ') + what + ' planner'} cost in ${c}?`, `${fee}, with our holiday special prices. Your vendor costs are separate and paid directly to your vendors. 50% of the planning fee is due to start and the rest once your vendors are booked.`],
        [`Do you plan in person?`, `Planning is by phone and online: we research, compare, negotiate and book your vendors and build a timeline every vendor follows. Your venue and vendors run the day itself.`],
        [`Which areas do you serve?`, `${area}. We can also plan events anywhere in the US remotely.`],
        ...(cu ? [[`Can you plan a traditional ${what}?`, `Yes. ${cu.blurb} We book vendors who specialize in ${what}s.`]] : []),
        [`How far ahead should I book?`, k.pk === 'small' ? 'For most parties, 4 to 8 weeks ahead gives the best choice of venues and vendors. Shorter notice is often possible too.' : 'Ideally 9 to 12 months ahead for a wedding or quinceañera, since popular venues and vendors book early. Shorter timelines are possible; send a request and we will tell you what is available.'],
        [`Can I plan it myself instead?`, `Yes. Event Couture’s free planner builds the look, a budget for ${c} prices, local vendors and a checklist, and you can switch to our planning service anytime.`]];
      add(slug, title, `${h1}: ${k.pk === 'small' ? 'party planning from $500' : 'vendor booking from $1,900 and full planning from $2,500'}, holiday special. We find, negotiate and book your vendors in ${c}, by phone and online.`, h1, body, faqs, { '@type': 'City', name: city });
    }
  }

  /* Virtual planners: anywhere in the US */
  const wed = occ('wedding');
  for (const v of [{ slug: 'virtual-wedding-planner', title: 'Virtual Wedding Planner', h1: 'Virtual wedding planner', what: 'wedding', pk: 'big', o: wed },
    { slug: 'virtual-event-planner', title: 'Virtual Event Planner: Weddings, Parties and More', h1: 'Virtual event planner', what: 'event', pk: 'all', o: wed }]) {
    const t = totals(wed, 'Other US city');
    const body = `<p class="lead">A virtual ${v.what} planner plans everything by phone and online, so you get a planner’s know-how without paying for travel or day-of hours. Event Couture researches, compares and books your venue and vendors anywhere in the US, negotiates prices for you and builds the timeline your vendors follow.</p>${cta(wed, null)}
<h2>Planning packages</h2>${cards(v.pk)}
<h2>Why go virtual</h2><ol class="plain"><li><b>Lower cost.</b> You pay for the planning, not travel time or hours on site.</li><li><b>Any city.</b> Planning a ${v.what} back home or in another state works the same way.</li><li><b>Everything in one place.</b> Quotes, choices and your timeline stay organized, and you approve every booking.</li></ol>
<p>For reference, a 120-guest wedding at average US prices costs about ${money(t[0], 'Other US city')} to ${money(t[2], 'Other US city')} in ${YEAR}, before planning fees.</p>
${how}${cta(wed, null)}<h2>Local planners</h2><div class="cols">${Object.keys(PLACES).map(city => `<a href="../${PLACES[city].slug}-wedding-planner/">Wedding planner in ${PLACES[city].short}</a><a href="../${PLACES[city].slug}-event-planner/">Event planner in ${PLACES[city].short}</a>`).join('')}</div>`;
    const faqs = [[`What does a virtual ${v.what} planner do?`, 'Everything that doesn’t need someone on site: vendor research and booking, price negotiation, budget, decoration direction, invitations and RSVPs, and a timeline every vendor follows.'],
      [`How much does a virtual ${v.what} planner cost?`, v.pk === 'all' ? 'Party planning starts at $500; for weddings and large events, vendor booking starts at $1,900 and full planning at $2,500, with holiday special prices. Vendor costs are separate.' : 'Vendor booking starts at $1,900 and full planning at $2,500, with holiday special prices. Vendor costs are separate and paid directly to your vendors.'],
      ['Which cities do you plan in?', 'Anywhere in the US.'],
      ['Who runs the day itself?', 'Your venue and vendors, following the timeline we build with them. Many venues include a day-of coordinator; we can help you find one if yours does not.']];
    add(v.slug, v.title, `${v.h1}: we plan by phone and online anywhere in the US. ${v.pk === 'all' ? 'Party planning from $500, ' : ''}vendor booking from $1,900, full planning from $2,500 (holiday special).`, v.h1, body, faqs, { '@type': 'Country', name: 'United States' });
  }
  return pages;
}
module.exports = { build, listFor, setup };
