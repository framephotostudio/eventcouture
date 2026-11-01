// Event Couture landing pages for search: what the app does for each kind of plan, with real numbers from the planning engine.
// Called from tools/seo.cjs; every page links into the app and the existing planning guides.
'use strict';
module.exports = function landing(ctx) {
  const { D, E, OCC, CITIES, BIG, page, write, urls, esc, money, totals, evFor, YEAR, BASE, INSPO } = ctx;
  const NAT = 'Other US city';
  const occ = id => OCC.find(o => o.key === id);
  const photo = (id, cls) => { const p = INSPO.find(x => x.id === id); return p ? `<figure class="lp-fig${cls ? ' ' + cls : ''}"><img src="../img/inspo/${p.id}.jpg" alt="${esc(p.alt || p.name)}" width="1200" height="800" loading="lazy"><figcaption class="small muted">${esc(p.name)} · AI-generated inspiration</figcaption></figure>` : ''; };
  const startBtn = (href, label) => `<a class="btn primary" href="../${href}">${esc(label)}</a>`;
  const faq = items => `<h2>Questions people ask</h2><div class="faq">${items.map(([q, a]) => `<details class="panel"><summary><b>${esc(q)}</b></summary><p>${a}</p></details>`).join('')}</div>`;
  const faqLd = items => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) });
  const range = (id, city) => { const t = totals(occ(id), city || NAT); return `${money(t[0], city || NAT)} to ${money(t[2], city || NAT)}`; };
  const mid = (id, city) => money(totals(occ(id), city || NAT)[1], city || NAT);
  const guideLink = id => { const o = occ(id); return o ? `<a href="../plan/${o.slug}/">${esc(o.name)}</a>` : ''; };
  const occTable = ids => `<div class="table-wrap panel"><table class="qty"><thead><tr><th>Event</th><th class="n">Guests</th><th class="n">Luxe for Less</th><th class="n">Signature</th><th class="n">Ultra Luxe</th></tr></thead><tbody>${ids.map(id => { const o = occ(id), t = totals(o, NAT); return `<tr><td><a href="../plan/${o.slug}/">${esc(o.name)}</a></td><td class="n">${o.guests}</td><td class="n">${money(t[0], NAT)}</td><td class="n"><b>${money(t[1], NAT)}</b></td><td class="n">${money(t[2], NAT)}</td></tr>`; }).join('')}</tbody></table></div><p class="small muted">Average US prices in ${YEAR}, including tax, service and tips. Open any event for its full budget, or plan yours for your own city and guest count.</p>`;
  const checklist = (id, n) => { const o = occ(id), d = new Date(); d.setFullYear(d.getFullYear() + 1); const ev = Object.assign({}, evFor(o, NAT), { date: d.toISOString().slice(0, 10) }); return `<ol class="plain">${E.checklist(ev, new Date()).slice(0, n || 14).map(c => `<li>${esc(c.text)}</li>`).join('')}</ol>`; };
  const biggest = id => { const o = occ(id), ev = evFor(o, NAT); E.useCountry(NAT); const b = E.budget(ev, 'S'); return b.items.slice().sort((x, y) => y.mid - x.mid).slice(0, 3).map(i => `${esc(i.name.split(' (')[0])} (about ${Math.round(i.mid / b.total * 100)}%)`).join(', '); };
  const ALL = ['wedding', 'engagement', 'bridal-shower', 'bachelorette', 'baby-shower', 'gender-reveal', 'birthday', 'kids-birthday', 'milestone', 'sweet16', 'quince', 'graduation', 'anniversary', 'retirement', 'brunch', 'dinner', 'holiday', 'christmas', 'gala', 'corporate'];
  const nCult = Object.keys(D.CULTURES).length, nCountries = new Set(CITIES.map(c => c.country)).size;
  const related = (skip) => `<h2>More planning tools</h2><div class="cols">${[['ai-event-planner', 'AI event planner'], ['wedding-planner', 'Online wedding planner'], ['birthday-party-planner', 'Birthday party planner'], ['event-budget-calculator', 'Event budget calculator'], ['event-vendors', 'Find event vendors'], ['cultural-weddings', 'Cultural weddings'], ['event-inspiration', 'Event inspiration'], ['plan', 'All planning guides']].filter(x => x[0] !== skip).map(x => `<a href="../${x[0]}/">${x[1]}</a>`).join('')}</div>`;
  const pages = [];
  const add = (slug, title, desc, h1, body, items, image) => {
    const ld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: h1, description: desc, url: `${BASE}${slug}/`, isPartOf: { '@type': 'WebSite', name: 'Event Couture', url: BASE }, publisher: { '@type': 'Organization', name: 'Event Couture by Always Luxe', logo: `${BASE}img/brand/ec-mark-256.png` } }];
    if (items) ld.push(faqLd(items));
    write(`${slug}/index.html`, page({ rel: 1, title, desc, h1, body: body + (items ? faq(items) : '') + related(slug), canonical: `${BASE}${slug}/`, ld, crumb: h1, image: image ? `${BASE}img/inspo/${image}.jpg` : null }));
    urls.splice(1, 0, `${BASE}${slug}/`); pages.push(slug);
  };

  /* 1. AI event planner */
  add('ai-event-planner', `AI Event Planner: Plan Any Party or Wedding Online, Free | Event Couture`,
    `Event Couture is an AI event planner and party planner: share a photo or a few words and get three looks, a budget for your city, top-rated vendors, a checklist and invitations. Free to plan.`,
    'AI event planner: from one photo to a full plan',
    `<p class="lead">Event Couture is a free online event planner. AI reads your inspiration and designs the look; a pricing engine built on local costs estimates the budget; real top-rated businesses fill your vendor list. Share a photo you love, paste a Pinterest or TikTok link, or just describe your party in a few words. In about a minute you get three event looks, a budget sized to your city and guest count, top-rated venues and vendors near you, a menu, a playlist, a day-of schedule and an invitation your guests can RSVP to.</p>
<div class="cta">${startBtn('#/new/1', 'Plan my event with AI')}<a class="btn ghost" href="../#/inspiration">Browse inspiration</a></div>
${photo('blush-wisteria-ballroom')}
<h2>What AI does, and what it doesn’t</h2><ol class="plain">
<li><b>AI reads your inspiration.</b> Colors, flowers, lighting and decor are picked out of your photo or words, so the plan matches the look you love.</li>
<li><b>AI designs three looks.</b> Each comes with a color palette, decor list, menu ideas, music and a dress code. Pick one, or ask for three more.</li>
<li><b>Budget estimates, not AI guesses.</b> A pricing engine sizes every line, from the venue to the cake, to local prices and your guest count, with tax, service charges and tips included. See it at three spending levels, or one made for your budget.</li>
<li><b>Finds real people to hire.</b> Real, top-rated venues and vendors near you, ranked by their ratings and reviews, side by side in packages you can compare, swap and book one by one.</li>
<li><b>Handles the guests.</b> A formal invitation link, RSVPs, voting on choices, a registry and cost splitting. Your guests never need an app.</li>
<li><b>Keeps you on schedule.</b> A checklist with due dates counted back from your date, and an hour-by-hour plan for the day.</li></ol>
<h2>Events you can plan</h2><p>Weddings, engagement parties, bridal and baby showers, gender reveals, bachelorettes, birthdays (kids’, milestone, sweet 16), quinceañeras, graduations, anniversaries, retirements, brunches, dinner parties, holiday and Christmas parties, galas and corporate events, plus ${nCult} cultural weddings with their own traditions and music.</p>
${occTable(['wedding', 'birthday', 'kids-birthday', 'baby-shower', 'quince', 'graduation'])}
<h2>Planning in ${nCountries} countries</h2><p>Prices follow local costs, currencies, taxes and tipping customs in ${CITIES.length} cities, from ${['New York, NY', 'Toronto, ON', 'London, UK', 'Dubai, UAE', 'Riyadh, Saudi Arabia', 'Sydney, Australia', 'Mexico City, Mexico'].filter(c => CITIES.some(x => x.name === c)).map(c => `<a href="../plan/${CITIES.find(x => x.name === c).slug}/">${esc(c.split(',')[0])}</a>`).join(', ')} to your own town.</p>`,
    [['Is Event Couture free?', 'Yes. Planning is free: your looks, budget, vendor packages, checklist and schedule cost nothing.'],
     ['How does an AI event planner work?', 'You share a photo, a link or a few words. Event Couture reads the colors and style, builds three looks, and prices every part of the event for your city and guest count using the same planning engine for every event. You then compare top-rated vendors and book them yourself.'],
     ['Can AI plan a wedding?', 'It can do the heavy lifting: the look, a full wedding budget, a 12-month checklist, vendor packages and invitations. You stay in charge of every choice, and every price is an estimate until a vendor confirms it.'],
     ['Do my guests need to download an app?', 'No. Guests open your invitation link on any phone to RSVP, vote and see the details.'],
     ['Which countries does it work in?', `Event Couture prices events in ${nCountries} countries and ${CITIES.length} cities, in local currency.`]], 'blush-wisteria-ballroom');

  /* 2. Online wedding planner */
  const wtot = totals(occ('wedding'), NAT);
  add('wedding-planner', `Online Wedding Planner: Budget, Checklist and Vendors | Event Couture`,
    `Plan your wedding online, free: a wedding budget for your city, a 12-month wedding planning checklist, vendor packages, cultural wedding traditions and invitations with RSVPs.`,
    'Online wedding planner, free',
    `<p class="lead">Plan your whole wedding in one place: the look, the budget, the vendors, the guest list and the invitations. For about 120 guests, a wedding typically costs <b>${money(wtot[0], NAT)}</b> done smartly, <b>${money(wtot[1], NAT)}</b> with the key pieces handled by pros, and <b>${money(wtot[2], NAT)}</b> or more for full-service luxury at average US prices in ${YEAR}.</p>
<div class="cta">${startBtn('#/start/wedding', 'Plan my wedding')}<a class="btn ghost" href="../plan/wedding/">See the full wedding budget</a></div>
${photo('ivory-chandelier-ballroom')}
<h2>Where the wedding money goes</h2><p>The biggest costs are usually ${biggest('wedding')}. Event Couture shows every line, and you can remove anything you don’t need and watch the total update.</p>
<h2>Wedding planning checklist</h2>${checklist('wedding')}
<h2>Wedding vendors to book</h2><p>Venue, caterer, photographer, florist, DJ or band, cake, officiant, makeup artist, hair stylist, rentals, attire and transportation. Event Couture builds packages of top-rated local vendors you can compare side by side, swap and book one by one, with a message written for you to send each one.</p>
<h2>Cultural and multicultural weddings</h2><p>Plan with your traditions built in: ${Object.keys(D.CULTURES).map(k => `<a href="../plan/${OCC.find(o => o.culture === k).slug}/">${esc(D.CULTURES[k].name)}</a>`).join(', ')}.</p>
<h2>Wedding budget by city</h2><div class="table-wrap panel"><table class="qty"><thead><tr><th>City</th><th class="n">Luxe for Less</th><th class="n">Signature</th><th class="n">Ultra Luxe</th></tr></thead><tbody>${BIG.slice(0, 12).map(cn => { const t = totals(occ('wedding'), cn), c = CITIES.find(x => x.name === cn); return `<tr><td><a href="../plan/${c.slug}/">${esc(cn)}</a></td><td class="n">${money(t[0], cn)}</td><td class="n"><b>${money(t[1], cn)}</b></td><td class="n">${money(t[2], cn)}</td></tr>`; }).join('')}</tbody></table></div>
<h2>Wedding events around the big day</h2><p>${['engagement', 'bridal-shower', 'bachelorette', 'anniversary'].map(guideLink).join(' · ')}</p>`,
    [['How much does a wedding cost?', `For about 120 guests, ${money(wtot[0], NAT)} to ${money(wtot[2], NAT)} at average US prices in ${YEAR}, depending on how much is handled by professionals. Costs vary a lot by city: see the table above.`],
     ['How far ahead should I start planning a wedding?', 'About 12 months is comfortable: book the venue first, then the photographer, caterer and music, then everything else. Event Couture counts every step back from your date.'],
     ['Is there a free wedding budget calculator?', 'Yes. Event Couture builds a line-by-line wedding budget for your city and guest count, with three spending levels or a plan made to fit your own maximum.'],
     ['Can I plan a cultural wedding?', `Yes. ${nCult} cultural weddings each come with their own traditions, music and menu, from Arabic and Indian to Nigerian, Mexican and Korean.`]], 'ivory-chandelier-ballroom');

  /* 3. Birthday party planner */
  const kidThemes = INSPO.filter(p => p.types.includes('kids-birthday')).map(p => p.name);
  const adultThemes = INSPO.filter(p => p.types.includes('birthday') || p.types.includes('milestone')).map(p => p.name).slice(0, 12);
  add('birthday-party-planner', `Birthday Party Planner: Ideas, Budget and Checklist | Event Couture`,
    `Plan a birthday party online, free: kids’ party themes, sweet 16 and milestone birthday ideas, a party budget for your city, a checklist and invitations with RSVPs.`,
    'Birthday party planner: ideas, budget and checklist',
    `<p class="lead">From a first birthday to a 50th, plan the theme, the budget, the venue and the guest list in one place. A birthday party for about 40 guests typically costs <b>${range('birthday')}</b> at average US prices in ${YEAR}, and a kids’ themed party for 25 children about <b>${range('kids-birthday')}</b>.</p>
<div class="cta">${startBtn('#/start/birthday', 'Plan a birthday')}${startBtn('#/start/kids-birthday', 'Plan a kids’ party')}</div>
${photo('unicorn-dreamland')}
<h2>Kids’ birthday party ideas</h2><p>Themes ready to plan: ${kidThemes.map(esc).join(', ')}. Each comes with decor, a menu kids like, games and party favors, and the plan keeps everything child-friendly: no bars, no candles on tables.</p>
<h2>Birthday party ideas for adults</h2><p>${adultThemes.map(esc).join(', ')}, and any look you bring as a photo.</p>
<h2>Birthday budgets</h2>${occTable(['birthday', 'kids-birthday', 'milestone', 'sweet16', 'quince'])}
<h2>Birthday party checklist</h2>${checklist('birthday', 10)}
<h2>Add-ons people love</h2><p>Bounce house, character visit, magician, face painter, balloon garland, photo booth, dessert bar, chocolate fountain and more, each with a price and top-rated local businesses that offer it.</p>`,
    [['How much does a birthday party cost?', `About ${range('birthday')} for 40 guests at average US prices in ${YEAR}; a kids’ themed party for 25 children is about ${range('kids-birthday')}.`],
     ['How do I plan a kids’ birthday party?', 'Pick a theme, set the guest count and budget, book the venue or plan it at home, add entertainment, then send invitations about 3 to 4 weeks ahead. Event Couture builds each step for you.'],
     ['What should I plan for a sweet 16 or quinceañera?', `A venue, catering, a DJ, decor, a cake, photos and the traditions. A quinceañera for about 150 guests typically costs ${range('quince')}.`],
     ['Can I plan a birthday party at a restaurant?', 'Yes. Choose a restaurant or a private room and Event Couture finds family-friendly or upscale places that suit your party, with the menu and the bill estimated.']], 'unicorn-dreamland');

  /* 4. Event budget calculator */
  const wb = (() => { const ev = evFor(occ('wedding'), NAT); E.useCountry(NAT); return E.budget(ev, 'S'); })();
  add('event-budget-calculator', `Event Budget Calculator: Wedding and Party Budget Planner | Event Couture`,
    `Free event budget calculator for weddings, birthdays, showers and parties: a line-by-line budget for your city and guest count, with tax, tips and a 10% cushion included.`,
    'Event budget calculator',
    `<p class="lead">Tell Event Couture what you’re celebrating, where, and for how many guests, and it builds a line-by-line budget: venue, food, drinks, decor, flowers, music, photos and the fees people forget. Prices follow your city, and every line already includes tax, service charges and tips where they apply, plus a 10% cushion for surprises.</p>
<div class="cta">${startBtn('#/new/1', 'Calculate my budget')}</div>
<h2>Typical event budgets</h2>${occTable(ALL.slice(0, 12))}
<h2>Sample wedding budget, line by line</h2><div class="table-wrap panel"><table class="qty"><tbody>${wb.items.map(i => `<tr><td>${esc(i.name)}</td><td class="n">${money(i.mid, NAT)}</td><td class="n small muted">${Math.round(i.mid / wb.total * 100)}%</td></tr>`).join('')}<tr><td>Cushion for surprises (10%)</td><td class="n">${money(wb.contingency, NAT)}</td><td></td></tr><tr><td><b>Estimated total, 120 guests</b></td><td class="n"><b>${money(wb.total, NAT)}</b></td><td></td></tr></tbody></table></div>
<h2>Three ways to fit your budget</h2><ol class="plain"><li><b>Luxe for Less</b> keeps the look with smart swaps.</li><li><b>Signature</b> has the key pieces handled by pros.</li><li><b>Ultra Luxe</b> adds full service, lighting, live music and a coordinator.</li></ol><p>Or set your own maximum: the plan is fitted to it and protects your must-haves first.</p>`,
    [['How do I make an event budget?', 'Start from your guest count and city, list every vendor you need, add tax, service charges and tips, and keep about 10% for surprises. Event Couture does all of this for you in seconds.'],
     ['What percentage of a wedding budget goes to the venue and catering?', `In a typical ${YEAR} US wedding budget, the biggest lines are ${biggest('wedding')}.`],
     ['Is the budget calculator free?', 'Yes, and it works for 20 kinds of events in ' + nCountries + ' countries, in local currency.'],
     ['Are the prices exact?', 'They are planning estimates sized to your city. Add real quotes as vendors send them and your totals update.']]);

  /* 5. Event vendors */
  const rate = (id, unit) => { E.useCountry(NAT); const k = D.CATEGORIES[id]; const r = k.perHour || k.perGuest || k.fixed || k.perPerson; return r ? `<tr><td>${esc(k.name.split(' (')[0])}</td><td class="n">${money(r[0], NAT)} to ${money(r[1], NAT)} ${unit}</td></tr>` : ''; };
  add('event-vendors', `Find Event Vendors: Venues, Caterers, Photographers, DJs | Event Couture`,
    `Find top-rated event and wedding vendors near you: venues, caterers, photographers, florists, DJs, makeup artists and transportation, compared side by side with typical prices.`,
    'Find event and wedding vendors near you',
    `<p class="lead">Event Couture builds packages of top-rated local vendors for your event: one for every part of your plan, side by side, so you can compare, swap and book. You contact and pay each vendor directly.</p>
<div class="cta">${startBtn('#/new/1', 'Find vendors for my event')}<a class="btn ghost" href="../#/vendors">List your business, free</a></div>
<h2>Vendor categories</h2><div class="cols">${['Event venues and hotel ballrooms', 'Caterers', 'Wedding cakes and dessert bars', 'Florists and floral designers', 'Event decorators', 'Photographers and videographers', 'DJs, bands and singers', 'Makeup artists and hair stylists', 'Bridal wear and attire', 'Officiants', 'Rentals: tables, chairs, linens', 'Photo booths', 'Luxury transportation and limos', 'Kids’ entertainment', 'Cultural music and dance groups'].map(esc).join('<br>')}</div>
<h2>Typical vendor rates (average US prices, ${YEAR})</h2><div class="table-wrap panel"><table class="qty"><tbody>${rate('photographer', 'an hour')}${rate('videographer', 'an hour')}${rate('dj', 'an hour')}${rate('liveMusic', 'an hour')}${rate('catering', 'a guest')}${rate('bartender', 'an hour')}${rate('rentals', 'a guest')}${rate('hairMakeup', 'a person')}${rate('hair', 'a person')}</tbody></table></div><p class="small muted">Rates change by city: open a <a href="../plan/">city guide</a> for local prices.</p>
<h2>How vendors are chosen</h2><p>Venues and vendors come from top-rated local businesses, ranked by rating and number of reviews, plus a small number of vendors Event Couture recommends personally, marked ★ Recommended. Prices from recommended performers are shown as “price on request”.</p>
<h2>For vendors</h2><p>Venues, planners, photographers, caterers, DJs, florists and other event professionals can <a href="../#/vendors">list their business for free</a> and reach people planning events in their city.</p>`,
    [['How do I find wedding vendors near me?', 'Start a plan with your city and guest count. Event Couture builds packages of top-rated local vendors for every part of your wedding and shows them side by side.'],
     ['How much do event vendors cost?', 'See the typical rates above; your plan sizes every vendor to your city, guest count and hours.'],
     ['Can I book vendors through Event Couture?', 'You contact and book each vendor directly; Event Couture writes the message for you and tracks what is booked.']]);

  /* 6. Cultural weddings */
  add('cultural-weddings', `Cultural Weddings: Arabic, Indian, Nigerian, Mexican and More | Event Couture`,
    `Plan a cultural wedding with its traditions, music and food: ${Object.keys(D.CULTURES).slice(0, 8).map(k => D.CULTURES[k].name.replace(/ wedding$/i, '')).join(', ')} and more, with budgets and vendors.`,
    `${nCult} cultural weddings, planned with their traditions`,
    `<p class="lead">Every cultural wedding in Event Couture comes with its own traditions, music, menu, schedule and vendors, priced for your city. Pick yours, or mix two for a multicultural wedding.</p>
<div class="lp-grid">${Object.keys(D.CULTURES).map(k => { const cu = D.CULTURES[k], o = OCC.find(x => x.culture === k), t = totals(o, NAT); return `<div class="panel stack"><img src="../img/cultures/${k}.jpg" alt="${esc(cu.name)} setting, AI-generated inspiration" width="900" height="600" loading="lazy"><h3><a href="../plan/${o.slug}/">${esc(cu.name)}</a></h3><p class="small">${esc(cu.blurb)}</p><p class="small muted">About ${money(t[1], NAT)} for ${o.guests} guests (Signature)</p><a class="small" href="../#/start/${k}-wedding/">Plan ${/^[aeiou]/i.test(cu.name) ? 'an' : 'a'} ${esc(cu.name)}</a></div>`; }).join('')}</div>
<p class="small muted">Photos are AI-generated inspiration.</p>`,
    [['Can I plan an Arabic wedding with a zaffe and a kosha?', 'Yes. The Arabic wedding includes the zaffe entrance, a singer with a live band, a DJ, the kosha and a Middle Eastern menu, with vendors who specialize in them.'],
     ['Do you plan Indian weddings with a mandap and baraat?', 'Yes: the mandap, dhol, baraat, mehndi artist and Indian catering are all built in.'],
     ['What about multicultural weddings?', 'Choose the fusion wedding to blend two traditions in one plan.']]);

  /* 7. Event inspiration */
  const byType = {}; INSPO.forEach(p => p.types.forEach(t => { (byType[t] = byType[t] || []).push(p); }));
  const sections = ['wedding', 'quince', 'birthday', 'kids-birthday', 'baby-shower', 'bridal-shower', 'engagement', 'graduation', 'gala', 'christmas'].filter(t => byType[t]).map(t => { const o = occ(t); return `<h2>${esc(o.name)} ideas</h2><div class="lp-grid">${byType[t].slice(0, 6).map(p => `<figure class="panel stack"><img src="../img/inspo/sm/${p.id}.jpg" alt="${esc(p.alt || p.name)}" loading="lazy"><figcaption><b>${esc(p.name)}</b><br><span class="small muted">${esc(p.mood || '')}</span></figcaption><a class="small" href="../#/start/${t}/-/${p.id}">Plan this look</a></figure>`).join('')}</div>`; }).join('');
  add('event-inspiration', `Event Inspiration: Wedding, Party and Shower Ideas | Event Couture`,
    `Event and party inspiration you can plan in one tap: wedding reception looks, quinceañera themes, kids’ birthday ideas, baby and bridal shower decor, galas and holiday parties.`,
    'Event inspiration you can plan',
    `<p class="lead">Every look below comes with its colors, decor, menu and music. Tap one to start a plan built around it, or bring your own photo. Images are AI-generated inspiration.</p>
<div class="cta">${startBtn('#/inspiration', 'See all inspiration')}${startBtn('#/new/1', 'Plan from my own photo')}</div>${sections}`);

  return pages;
};
