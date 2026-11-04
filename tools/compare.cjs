// "Event Couture vs ..." comparison pages for search: fair, sourced, side by side.
// Facts about other services come only from their own pages or well-known public sources, checked November 2026;
// each page names its sources and the date. No logos or trademarks beyond the plain names used to compare.
'use strict';
module.exports = function compare(ctx) {
  const { page, write, urls, esc, BASE, CITIES, D } = ctx;
  const nCities = CITIES.length, nCountries = new Set(CITIES.map(c => c.country)).size, nCult = Object.keys(D.CULTURES).length;
  const CHECKED = 'November 2026';
  const Y = '<span class="ok">Yes</span>', N = '<span class="muted">No</span>';
  const P = t => `<span>${t}</span>`;
  const EC = {
    photo: P('One photo, Pinterest or TikTok link, or a few words becomes three full looks'),
    budget: P(`Priced for your city and guest count (${nCities} cities in ${nCountries} countries), at three spending levels`),
    events: P('Weddings, birthdays, quinceañeras, showers, graduations, dinners, galas and more'),
    culture: P(`${nCult} cultural wedding traditions with their own customs, food and music`),
    vendors: P('Top-rated local businesses from Google ratings, grouped into side-by-side packages; no paid vendor reviews of its own yet'),
    invites: P('Formal invitations, RSVPs, guest list and seating chart'),
    registry: P('Gift wish list and cash gifts through your own Venmo, Cash App or PayPal links; no store-linked universal registry'),
    privacy: P('Vendors only hear from you when you choose to message them'),
    app: P('Website now; iPhone and Android app coming soon'),
    price: P('Free to plan; a one-time Event Pass to keep and share a plan (free during launch)')
  };
  const ROWS = [['photo', 'Plan from an inspiration photo'], ['budget', 'Budget estimate for your city'], ['events', 'Kinds of events'], ['culture', 'Cultural weddings'], ['vendors', 'Vendors'], ['invites', 'Invitations and RSVPs'], ['registry', 'Registry and gifts'], ['privacy', 'Your contact details'], ['app', 'Phone app'], ['price', 'Price']];
  const S = {
    knot: { name: 'The Knot', slug: 'the-knot', src: [['The Knot Worldwide (Wikipedia)', 'https://en.wikipedia.org/wiki/The_Knot_Worldwide']],
      intro: 'The Knot is one of the biggest wedding planning brands in the US, owned by The Knot Worldwide, the same company as WeddingWire. It is best known for its large marketplace of wedding vendors with couple reviews.',
      row: { photo: P('Its AI tool matches vendors to images you favorite; it does not build a full plan and budget from a photo'), budget: P('Wedding budget tools'), events: P('Weddings'), culture: P('General wedding content'), vendors: P('A large vendor marketplace with reviews, its biggest strength'), invites: P('Wedding website, invitations and paper (paid designs)'), registry: P('Registry services'), privacy: P('Couples contact vendors through its marketplace'), app: Y, price: P('Free planning tools; paid invitations and paper') },
      stronger: ['A much larger vendor marketplace, with years of couple reviews', 'A phone app today', 'Registry services and printed invitations and paper'],
      diff: ['Starts from your inspiration and builds the whole plan: look, budget, vendors, menu, music, schedule and invitation', 'Budgets sized to your city and guest count, so you see real numbers before you call anyone', 'Plans every kind of event, not only weddings, plus ' + nCult + ' cultural wedding traditions'] },
    weddingwire: { name: 'WeddingWire', slug: 'weddingwire', src: [['The Knot Worldwide (Wikipedia)', 'https://en.wikipedia.org/wiki/The_Knot_Worldwide']],
      intro: 'WeddingWire is owned by The Knot Worldwide, the same company as The Knot. Couples mostly use it to find wedding vendors and read their reviews.',
      row: { photo: N, budget: P('Wedding budget tools'), events: P('Weddings'), culture: P('General wedding content'), vendors: P('A large vendor directory with reviews, its biggest strength'), invites: P('Wedding website tools'), registry: P('Registry services'), privacy: P('Couples contact vendors through its directory'), app: Y, price: P('Free planning tools') },
      stronger: ['A large vendor directory with many couple reviews', 'A phone app today'],
      diff: ['Builds the plan for you from a photo or a few words, instead of starting with a vendor search', 'A full budget for your city and guest count, line by line, at three spending levels', 'Every kind of event, and cultural weddings with their own customs'] },
    zola: { name: 'Zola', slug: 'zola', src: [['Zola: the best free wedding planning websites', 'https://www.zola.com/expert-advice/best-free-wedding-planning-websites']],
      intro: 'Zola is a wedding planning company known for its wedding websites and universal registry. By its own description, its free tools include a website with 300+ designs, a registry with zero-fee cash funds, a guest list manager, a checklist, a budget and a vendor marketplace.',
      row: { photo: N, budget: P('Wedding budget with cost breakdowns and vendor suggestions by budget and location'), events: P('Weddings'), culture: P('General wedding content'), vendors: P('A marketplace of vetted vendors'), invites: P('Website with 300+ designs, matching paper, guest list and RSVPs'), registry: P('Universal registry with zero-fee cash funds, its biggest strength'), privacy: P('Couples contact vendors through its marketplace'), app: Y, price: P('Free tools; custom guest text messages cost extra') },
      stronger: ['A universal registry that works with gifts from any store, plus zero-fee cash funds', 'Hundreds of wedding website and paper designs', 'A phone app today'],
      diff: ['Starts from your inspiration photo and designs the whole look for you', 'Plans every kind of event, not only weddings', 'Cultural weddings with their own customs, food and music'] },
    joy: { name: 'Joy', slug: 'joy', src: [['Joy: cash wedding registries guide', 'https://withjoy.com/blog/cash-wedding-registries-guide/']],
      intro: 'Joy (withjoy.com) is a wedding website and app. By its own description, its wedding websites, planning tools and registry are free, and it takes no cut of cash gifts (card processing fees still apply).',
      row: { photo: N, budget: P('Planning tools'), events: P('Mostly weddings'), culture: P('General wedding content'), vendors: N, invites: P('Wedding website, guest list, save the dates and invitations (free and premium designs)'), registry: P('Registry with cash funds and no Joy fee, its biggest strength'), privacy: P('Guest-focused tools'), app: Y, price: P('Free; premium invitation designs cost extra') },
      stronger: ['A polished wedding website and guest app', 'Cash funds with no Joy fee', 'A phone app today'],
      diff: ['Builds the plan itself: the look, a full budget, vendors, menu, music and schedule', 'Budgets sized to your city and guest count', 'Every kind of event, and cultural weddings'] },
    partiful: { name: 'Partiful', slug: 'partiful', src: [['Partiful (Wikipedia)', 'https://en.wikipedia.org/wiki/Partiful']],
      intro: 'Partiful is a free app for party invitations. You create an event, share it by link or text, and guests RSVP without an app; it also has date polls, text blasts, photo sharing and payment links through Venmo, Cash App and PayPal.',
      row: { photo: N, budget: N, events: P('Parties and social events'), culture: N, vendors: N, invites: P('Fun invitation pages, RSVPs and text blasts, its biggest strength'), registry: P('Payment links'), privacy: P('Guests need a verified phone number to RSVP'), app: Y, price: P('Free') },
      stronger: ['Very quick, playful invitations made for texting', 'Date polls and group text blasts', 'A phone app today'],
      diff: ['Plans the whole event, not only the invitation: look, budget, venue, vendors, food, music and schedule', 'Formal invitations for weddings and bigger events, plus RSVPs and seating', 'Budgets sized to your city and guest count'] }
  };
  const pages = [];
  for (const k of Object.keys(S)) {
    const s = S[k], slug = `compare/${s.slug}`, h1 = `Event Couture vs ${s.name}`;
    const title = `Event Couture vs ${s.name}: Which Planner Is Right for You? (${new Date().getFullYear()}) | Event Couture`;
    const desc = `A fair side-by-side look at Event Couture and ${s.name}: planning from a photo, budgets for your city, vendors, invitations, registry, privacy and price. Checked ${CHECKED}.`;
    const table = `<style>.cmp th[scope=row]{text-align:left;width:22%}.cmp td,.cmp th{vertical-align:top;padding:8px 10px}.cmp td{width:39%}@media(max-width:600px){.cmp thead{display:none}.cmp tr{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--line)}.cmp th[scope=row]{grid-column:1/-1;width:auto;padding-bottom:0}.cmp td{width:auto}.cmp td::before{content:attr(data-l);display:block;font-weight:600;font-size:.78rem;color:var(--champagne,#9a7b4f)}}</style><div class="table-wrap panel"><table class="cmp"><thead><tr><th></th><th>Event Couture</th><th>${esc(s.name)}</th></tr></thead><tbody>${ROWS.map(([id, label]) => `<tr><th scope="row">${esc(label)}</th><td data-l="Event Couture">${EC[id]}</td><td data-l="${esc(s.name)}">${s.row[id]}</td></tr>`).join('')}</tbody></table></div>`;
    const items = [[`Is Event Couture free like ${s.name}?`, 'Planning on Event Couture is free. Keeping and sharing a finished plan uses a one-time Event Pass, which is free during the launch period.'],
      [`Can I use Event Couture and ${s.name} together?`, `Yes. Many people use Event Couture to design the event and see the budget, and keep using ${esc(s.name)} for what it does best.`],
      ['Does Event Couture sell my details to vendors?', 'No. Vendors only hear from you when you choose to message them through Event Couture.']];
    const body = `<p class="lead">${esc(s.intro)} Here is how it compares with Event Couture, an AI event planner that turns one inspiration photo into a full plan.</p>
<div class="cta"><a class="btn primary" href="../../#/new/1">Try Event Couture free</a><a class="btn ghost" href="../../#/sample/4">See a sample plan</a></div>
<h2>Side by side</h2>${table}<p class="small muted">Based on each company's own pages and public sources, checked ${CHECKED}. Features change, so check ${esc(s.name)} directly for the latest.</p>
<h2>Where ${esc(s.name)} is stronger</h2><ul class="plain">${s.stronger.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>What Event Couture does differently</h2><ul class="plain">${s.diff.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>Which should you choose?</h2><p>Choose ${esc(s.name)} if its strengths above are what you need most. Choose Event Couture if you want to see your whole event designed and priced first, from a photo you love, in a few minutes. You can also use both.</p>
<div class="cta"><a class="btn gold" href="../../#/new/1">Plan my event free</a></div>
<h2>Questions people ask</h2><div class="faq">${items.map(([q, a]) => `<details class="panel"><summary><b>${esc(q)}</b></summary><p>${a}</p></details>`).join('')}</div>
<h2>Sources</h2><ul class="plain small">${s.src.map(([t, u]) => `<li><a href="${u}" rel="nofollow noopener" target="_blank">${esc(t)}</a></li>`).join('')}</ul>
<h2>More comparisons</h2><div class="cols">${Object.values(S).filter(x => x !== s).map(x => `<a href="../${x.slug}/">Event Couture vs ${esc(x.name)}</a>`).join('')}<a href="../">All comparisons</a></div>`;
    const ld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: h1, description: desc, url: `${BASE}${slug}/` }, { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
    write(`${slug}/index.html`, page({ rel: 2, title, desc, h1, body, canonical: `${BASE}${slug}/`, ld, crumb: h1 }));
    urls.push(`${BASE}${slug}/`); pages.push(slug);
  }
  const idx = `<p class="lead">How Event Couture, the AI event planner, compares with popular planning and invitation services. Each comparison is side by side, fair about where the other service is stronger, and checked ${CHECKED}.</p>
<div class="cols">${Object.values(S).map(x => `<a href="${x.slug}/">Event Couture vs ${esc(x.name)}</a>`).join('')}</div><div class="cta"><a class="btn primary" href="../#/new/1">Try Event Couture free</a></div>`;
  write('compare/index.html', page({ rel: 1, title: 'Event Couture vs The Knot, Zola, WeddingWire, Joy and Partiful | Event Couture', desc: 'Fair, side-by-side comparisons of Event Couture with The Knot, Zola, WeddingWire, Joy and Partiful.', h1: 'How Event Couture compares', body: idx, canonical: `${BASE}compare/`, crumb: 'Comparisons' }));
  urls.push(`${BASE}compare/`); pages.push('compare');
  return pages;
};
