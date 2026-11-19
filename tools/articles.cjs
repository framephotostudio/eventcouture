// Articles (/articles/...): longer, hand-written guides aimed at specific searches a new site can win
// ("quinceañera cost Houston", "Arabic wedding traditions"). Prices come from the same planning engine as the app.
// Called from tools/seo.cjs.
'use strict';
module.exports = function articles({ D, E, OCC, page, write, urls, esc, money, evFor, YEAR, BASE }) {
  const NAT = 'Other US city', HOU = 'Houston, TX';
  const occ = k => OCC.find(o => o.key === k);
  const bud = (o, city, over, lvl) => { const ev = Object.assign(evFor(o, city), over || {}); E.useCountry(city); return E.budget(ev, lvl || 'S'); };
  const tot = (o, city, over) => ['L', 'S', 'U'].map(k => bud(o, city, over, k).total);
  const sizes = (o, city, list, over) => `<div class="table-wrap panel"><table class="qty"><thead><tr><th>Guests</th><th class="n">Luxe for Less</th><th class="n">Signature</th><th class="n">Ultra Luxe</th></tr></thead><tbody>${list.map(n => { const t = tot(o, city, Object.assign({ guests: n, expected: n }, over)); return `<tr><td>${n} guests</td><td class="n">${money(t[0], city)}</td><td class="n"><b>${money(t[1], city)}</b></td><td class="n">${money(t[2], city)}</td></tr>`; }).join('')}</tbody></table></div>`;
  const lines = (o, city, over) => { const b = bud(o, city, over); return `<div class="table-wrap panel"><table class="qty"><tbody>${b.items.map(i => `<tr><td>${esc(i.name.split(' (')[0].replace(/, if your venue.*$/, ''))}</td><td class="n">${money(i.mid, city)}</td></tr>`).join('')}<tr><td>Contingency (unexpected costs)</td><td class="n">${money(b.contingency, city)}</td></tr><tr><td><b>Estimated total</b></td><td class="n"><b>${money(b.total, city)}</b></td></tr></tbody></table></div>`; };
  const ul = a => `<ul class="plain">${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const faqHtml = f => `<h2>Questions people ask</h2><div class="faq">${f.map(([q, a]) => `<details class="panel"><summary><b>${esc(q)}</b></summary><p>${esc(a)}</p></details>`).join('')}</div>`;
  const cta = (href, label) => `<div class="cta"><a class="btn gold" href="../../${href}">${esc(label)}</a><a class="btn ghost" href="../../#/plan-for-me">Let us plan it for you</a></div>`;
  const list = [];
  const add = (slug, a) => {
    const url = `${BASE}articles/${slug}/`, today = new Date().toISOString().slice(0, 10);
    const ld = [{ '@context': 'https://schema.org', '@type': 'Article', headline: a.h1, description: a.desc, image: `${BASE}img/hero.jpg`, datePublished: '2026-11-19', dateModified: today, author: { '@type': 'Organization', name: 'Event Couture', url: BASE }, publisher: { '@type': 'Organization', name: 'Event Couture by Always Luxe', logo: { '@type': 'ImageObject', url: `${BASE}img/brand/ec-mark-256.png` } }, mainEntityOfPage: url },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faqs.map(([q, x]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: x } })) }];
    const more = `<h2>More articles</h2><div class="cols">${ALL.filter(x => x[0] !== slug).map(x => `<a href="../${x[0]}/">${esc(x[1])}</a>`).join('')}<a href="../">All articles</a></div>`;
    write(`articles/${slug}/index.html`, page({ rel: 2, title: a.title, desc: a.desc, h1: a.h1, body: a.body + faqHtml(a.faqs) + more, canonical: url, ld, crumb: 'Articles' }));
    urls.splice(1, 0, url); list.push([slug, a.h1, a.desc]);
  };
  const ALL = [['quinceanera-cost-houston', 'Quinceañera cost in Houston'], ['quinceanera-planning-checklist', 'Quinceañera planning checklist'], ['arabic-wedding-traditions-budget', 'Arabic wedding traditions and budget'], ['indian-wedding-cost-usa', 'Indian wedding cost in the US']];

  /* 1. Quinceañera cost in Houston */
  { const q = occ('quince'), t = tot(q, HOU), b = bud(q, HOU), big = b.items.slice().sort((x, y) => y.mid - x.mid).slice(0, 3);
    add('quinceanera-cost-houston', {
      title: `How Much Does a Quinceañera Cost in Houston? (${YEAR} Prices) | Event Couture`,
      h1: `How much does a quinceañera cost in Houston? (${YEAR})`,
      desc: `A quinceañera in Houston costs about ${money(t[0], HOU)} to ${money(t[2], HOU)} for ${q.guests} guests in ${YEAR}. See the line-by-line budget, prices by guest count, and where to save.`,
      body: `<p class="lead">For about ${q.guests} guests, a quinceañera in Houston costs about <b>${money(t[0], HOU)}</b> with smart swaps, <b>${money(t[1], HOU)}</b> with the key pieces handled by professionals, and <b>${money(t[2], HOU)}</b> or more for full-service luxury, in ${YEAR}. The biggest costs are ${(n => n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1])(big.map(i => esc(i.name.split(' (')[0].toLowerCase())))}.</p>
${cta('#/start/quince/' + encodeURIComponent(HOU), 'Get my exact quinceañera budget, free')}
<h2>Quinceañera prices in Houston by guest count</h2>${sizes(q, HOU, [75, 100, 150, 200, 300])}
<p class="small muted"><b>Luxe for Less</b> keeps the look with smart swaps; <b>Signature</b> has the key pieces done by pros; <b>Ultra Luxe</b> adds full service, lighting, live entertainment and a coordinator. Estimates include Texas sales tax and customary tips.</p>
<h2>Where the money goes (Signature, ${q.guests} guests)</h2>${lines(q, HOU)}
<h2>What drives the price up</h2>${ul([
  '<b>Guest count.</b> Catering, drinks, rentals and favors are all priced per guest, so 50 more guests can add thousands.',
  '<b>The hall.</b> Halls in the Galleria and River Oaks area cost more than banquet halls in Southwest Houston, Pasadena, Pearland or Katy. A package that includes tables, linens and a dance floor is often cheaper than a lower room price plus rentals.',
  '<b>Saturday nights in spring and fall.</b> These are the most requested dates. Friday or Sunday, or a summer date indoors, usually costs less.',
  '<b>Entertainment.</b> A DJ is the base; a mariachi, live band, choreographer for the waltz and surprise dance, or a photo booth each add to the total.'])}
<h2>Ways to save without losing the look</h2>${ul([
  'Ask family members to be <b>padrinos</b> for specific items, such as the cake, the last doll, the crown or the DJ. It is a long tradition and spreads the cost.',
  'Choose a hall package that includes tables, chairs, linens and setup, and remove those lines from your budget.',
  'Put the money where photos show it: the backdrop, the head table and the dress. Simpler centerpieces on guest tables save a lot.',
  'Serve a buffet or family-style dinner instead of plated service.'])}
<h2>Rather have someone plan it?</h2><p>Event Couture can find, compare and book your Houston hall, DJ, photographer, cake and decor for you, by phone and online. You approve every choice and pay vendors directly.</p>`,
      faqs: [[`How much does a quinceañera cost in Houston?`, `About ${money(t[0], HOU)} to ${money(t[2], HOU)} for ${q.guests} guests in ${YEAR}, with ${money(t[1], HOU)} a typical middle budget.`],
        ['How much is a quinceañera for 100 guests in Houston?', (() => { const x = tot(q, HOU, { guests: 100, expected: 100 }); return `About ${money(x[0], HOU)} to ${money(x[2], HOU)}, with ${money(x[1], HOU)} a typical middle budget in ${YEAR}.`; })()],
        ['Who pays for a quinceañera?', 'Usually the parents, with padrinos (godparents, relatives or close friends) often sponsoring specific items such as the cake, dress, crown, last doll or DJ.'],
        ['How far ahead should I book a quinceañera hall in Houston?', '9 to 12 months ahead for a Saturday in spring or fall. Confirm the church date first.']]
    }); }

  /* 2. Quinceañera checklist */
  { const q = occ('quince');
    add('quinceanera-planning-checklist', {
      title: `Quinceañera Planning Checklist: 12-Month Timeline (${YEAR}) | Event Couture`,
      h1: 'Quinceañera planning checklist: a 12-month timeline',
      desc: 'A month-by-month quinceañera checklist: when to book the church, hall, court, dress, DJ, photographer and choreographer, plus the traditions to plan for.',
      body: `<p class="lead">Most families start planning a quinceañera about a year ahead. Here is what to do and when, from setting the budget to the last dance.</p>
${cta('#/start/quince', 'Make my quinceañera checklist, free')}
<h2>12 months before</h2>${ul(['Set the budget and the guest list, and decide who the padrinos will be.', 'Choose the date. Confirm the Mass or blessing with your church first, since churches book early and some ask for classes or paperwork.', 'Book the hall. Compare what each package includes: tables, linens, dance floor, setup and end time.'])}
<h2>9 to 10 months before</h2>${ul(['Choose the court of honor (damas and chambelanes) and the chambelán de honor.', 'Book the photographer and videographer.', 'Book the DJ, and the mariachi or band if you want live music.'])}
<h2>6 to 8 months before</h2>${ul(['Shop for the dress; many need several months for ordering and fittings.', 'Book a choreographer for the waltz and the surprise dance, and set a rehearsal schedule.', 'Pick the theme and colors, and book the decorator and florist.'])}
<h2>4 to 5 months before</h2>${ul(['Order the cake and the dessert table.', 'Design the invitations.', 'Order the traditional items: the crown (tiara), the last doll, the high-heel shoes, the cushion, and the Bible and rosary for the Mass.', 'Book hair and makeup for the quinceañera and the damas.'])}
<h2>2 to 3 months before</h2>${ul(['Send invitations about 8 weeks before and open RSVPs.', 'Order outfits for the court so they match.', 'Plan the program with the DJ: entrance, toast, father-daughter dance, changing of the shoes, the last doll, waltz and surprise dance.'])}
<h2>The last month</h2>${ul(['Confirm the final guest count with the hall and caterer.', 'Finish the seating chart.', 'Hold the final dance rehearsal at the hall if possible.', 'Confirm every vendor’s arrival time and pay balances.', 'Share the day-of schedule with vendors, the court and the helpers.'])}
<h2>What a quinceañera costs</h2><p>For about ${q.guests} guests, ${(() => { const t = tot(q, NAT); return `about ${money(t[0], NAT)} to ${money(t[2], NAT)} at average US prices in ${YEAR}`; })()}. See <a href="../quinceanera-cost-houston/">quinceañera cost in Houston</a> or the <a href="../../plan/quinceanera/">full quinceañera budget guide</a>.</p>`,
      faqs: [['How far in advance should you plan a quinceañera?', 'About 12 months. Book the church and hall first, then the photographer, DJ and court, then the dress and choreographer.'],
        ['What traditions happen at a quinceañera?', 'Common traditions include a Mass or blessing, the entrance with the court of honor, the changing of the shoes, the crowning, the last doll, a father-daughter dance, the waltz and a surprise dance.'],
        ['How many damas and chambelanes are in a quinceañera court?', 'It varies; many courts have 7 pairs or 14 people plus the chambelán de honor, but smaller courts are common and completely fine.']]
    }); }

  /* 3. Arabic wedding */
  { const o = occ('arabic-wedding'), DRY = { alcohol: 'none' }, t = tot(o, NAT, DRY), th = tot(o, HOU, DRY), cu = D.CULTURES.arabic;
    add('arabic-wedding-traditions-budget', {
      title: `Arabic Wedding Traditions and Budget: Zaffe, Dabke, Katb el Kitab (${YEAR}) | Event Couture`,
      h1: 'Arabic wedding traditions and what to budget',
      desc: `The traditions of an Arabic wedding (katb el kitab, henna night, zaffe, dabke and the kosha) and what each costs. A ${o.guests}-guest Arabic wedding in the US costs about ${money(t[0], NAT)} to ${money(t[2], NAT)} in ${YEAR}.`,
      body: `<p class="lead">Arabic weddings are big, joyful and long. They often have ${o.guests} guests or more, run past midnight, and blend traditions from the Levant, the Gulf, Iraq, Egypt and North Africa. Here are the traditions most families plan for, and what a full Arabic wedding costs in the US in ${YEAR}.</p>
${cta('#/start/arabic-wedding', 'Plan my Arabic wedding, free')}
<h2>The traditions</h2>${ul([
  '<b>Katb el kitab:</b> the signing of the marriage contract, usually with a sheikh or imam and close family, at home, a mosque or a small venue. Often held weeks or days before the party.',
  '<b>Henna night (laylet el henna):</b> a celebration for the bride with family and friends, henna designs, music and traditional dress.',
  '<b>Zaffe:</b> the loud, joyful entrance of the couple with drummers, dancers and sometimes swords or torches. It sets the tone for the night.',
  '<b>Dabke:</b> the line dance everyone joins. A dabke troupe can lead it and get the crowd up.',
  '<b>The kosha:</b> the decorated stage or seating area where the couple sits and greets guests.',
  '<b>Cake cutting:</b> often a tall cake, sometimes cut with a sword, followed by the first dance.'])}
<h2>Music and food</h2><p>Families usually choose from: ${cu.music.map(m => esc(m[1])).join(', ')}. A typical menu: ${D.MENUS[cu.menu].map(esc).join('; ')}.</p>
<h2>Arabic wedding budget (Signature, ${o.guests} guests, average US prices)</h2><p class="small muted">Shown without an alcohol bar, as at many Arabic weddings; plan your own in the app to add one.</p>${lines(o, NAT, DRY)}
<h2>Arabic wedding cost by guest count</h2>${sizes(o, NAT, [150, 250, 350, 500], DRY)}
<p>In Houston, a ${o.guests}-guest Arabic wedding costs about ${money(th[0], HOU)} to ${money(th[2], HOU)}. See <a href="../../plan/houston-tx/arabic-wedding/">Arabic weddings in Houston</a>.</p>
<h2>Planning tips</h2>${ul([
  'Book the zaffe group and the DJ or singer together so the entrance, dabke and first dance flow without gaps.',
  'Choose a hall that allows outside halal catering if your caterer isn’t in-house, and get the fee in writing.',
  'Confirm the latest end time and overtime fees: Arabic weddings usually run late.',
  'Budget the katb el kitab and henna night as their own smaller events.'])}`,
      faqs: [['How much does an Arabic wedding cost in the US?', `About ${money(t[0], NAT)} to ${money(t[2], NAT)} for ${o.guests} guests in ${YEAR}, with ${money(t[1], NAT)} a typical middle budget.`],
        ['What is a zaffe?', 'The traditional wedding entrance: a procession of drummers, dancers and singers who lead the couple into the reception with music and celebration.'],
        ['What is katb el kitab?', 'The Islamic marriage contract ceremony, usually led by a sheikh or imam with close family, often held separately and before the wedding party.']]
    }); }

  /* 4. Indian wedding */
  { const o = occ('indian-wedding'), t = tot(o, NAT), th = tot(o, HOU);
    add('indian-wedding-cost-usa', {
      title: `Indian Wedding Cost in the US (${YEAR}): Sangeet, Mehndi, Baraat and More | Event Couture`,
      h1: `How much does an Indian wedding cost in the US? (${YEAR})`,
      desc: `An Indian wedding for ${o.guests} guests in the US costs about ${money(t[0], NAT)} to ${money(t[2], NAT)} in ${YEAR}. See each event, the line-by-line budget and ways to save.`,
      body: `<p class="lead">For about ${o.guests} guests, an Indian wedding in the US costs about <b>${money(t[0], NAT)}</b> done smartly, <b>${money(t[1], NAT)}</b> with the key pieces handled by pros, and <b>${money(t[2], NAT)}</b> or more for full-service luxury, in ${YEAR}. That is for the wedding day itself; most families also host several smaller events.</p>
${cta('#/start/indian-wedding', 'Plan my Indian wedding, free')}
<h2>The events to budget for</h2>${ul([
  '<b>Mehndi:</b> henna for the bride and guests, with music and a casual meal; often at home or a smaller hall.',
  '<b>Sangeet:</b> an evening of performances, music and dancing, often as big as a reception.',
  '<b>Haldi:</b> a morning turmeric ceremony with close family.',
  '<b>Baraat:</b> the groom’s procession with a dhol player and dancing, sometimes on a horse or in a car.',
  '<b>Ceremony:</b> under the mandap, with the pheras around a sacred fire.',
  '<b>Reception:</b> dinner, speeches and dancing.'])}
<h2>Indian wedding budget (Signature, ${o.guests} guests, average US prices)</h2>${lines(o, NAT)}
<h2>Cost by guest count</h2>${sizes(o, NAT, [150, 300, 450, 600])}
<p>In Houston, a ${o.guests}-guest Indian wedding costs about ${money(th[0], HOU)} to ${money(th[2], HOU)}. See <a href="../../plan/houston-tx/indian-wedding/">Indian weddings in Houston</a>.</p>
<h2>Planning tips</h2>${ul([
  'Ask every venue early whether a baraat with a horse and dhol, and an open flame for the pheras, are allowed, and what permits or insurance they need.',
  'Many hotels allow outside Indian caterers for a fee; get the fee and kitchen rules in writing.',
  'Use one hotel for the ceremony and reception to save on venue fees and guest travel, and a smaller space for the mehndi.',
  'Book the mandap decorator, photographer and videographer first: the best ones book a year or more ahead for peak season.'])}`,
      faqs: [['How much does an Indian wedding cost in the US?', `About ${money(t[0], NAT)} to ${money(t[2], NAT)} for ${o.guests} guests in ${YEAR} for the wedding day, with ${money(t[1], NAT)} a typical middle budget. Mehndi and sangeet are extra.`],
        ['How many guests are at an Indian wedding?', `Many Indian weddings in the US have 200 to 500 guests; ${o.guests} is a common size.`],
        ['Can you have a baraat at a hotel?', 'Often yes, but ask early: many hotels allow a baraat in the driveway or parking area with set times, and some require insurance for a horse.']]
    }); }

  /* the hub */
  const hub = `<p class="lead">Guides to plan and budget your event, with real ${YEAR} prices from the Event Couture planning engine.</p><div class="stack">${list.map(([s, h, d]) => `<a class="panel stack" style="text-decoration:none" href="${s}/"><b>${esc(h)}</b><span class="small muted">${esc(d)}</span></a>`).join('')}</div>`;
  write('articles/index.html', page({ rel: 1, title: 'Event Planning Articles and Guides | Event Couture', desc: 'Event planning articles: quinceañera costs and checklists, Arabic and Indian wedding traditions and budgets, with real prices.', h1: 'Event planning articles', body: hub, canonical: `${BASE}articles/`, crumb: 'Articles' }));
  urls.splice(1, 0, `${BASE}articles/`);
  return list.length;
};
