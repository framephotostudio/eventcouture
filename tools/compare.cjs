// "Event Couture vs ..." comparison pages for search: fair, sourced, side by side, and fun to read.
// Facts about other services come only from their own pages or well-known public sources, checked November 2026;
// each page names its sources and the date. No logos or trademarks beyond the plain names used to compare.
'use strict';
module.exports = function compare(ctx) {
  const { page, write, urls, esc, BASE, CITIES, D } = ctx;
  const nCities = CITIES.length, nCountries = new Set(CITIES.map(c => c.country)).size, nCult = Object.keys(D.CULTURES).length;
  const CHECKED = 'November 2026';
  // Each cell: [level, text]. 2 = does it well, 1 = partly, 0 = not offered.
  const EC = {
    photo: [2, 'One photo, a Pinterest or TikTok link, or a few words becomes three full looks, plus three more free if you want'],
    budget: [2, `Priced for your city and guest count (${nCities} cities in ${nCountries} countries), at three spending levels`],
    events: [2, 'Weddings, birthdays, quinceañeras, showers, graduations, dinners, galas and more'],
    culture: [2, `${nCult} cultural wedding traditions with their own customs, food and music`],
    vendors: [1, 'Top-rated local businesses from Google ratings, in side-by-side packages; no reviews of its own yet'],
    invites: [2, 'Formal invitations, RSVPs, guest list and seating chart'],
    registry: [1, 'Gift wish list and cash gifts through your own Venmo, Cash App or PayPal; no store-linked registry'],
    privacy: [2, 'Vendors only hear from you when you choose to message them'],
    app: [1, 'Website now; iPhone and Android app coming soon'],
    price: [2, 'Free to plan; a one-time Event Pass to keep and share a plan (free during launch)']
  };
  const ROWS = [['photo', 'Plan from an inspiration photo'], ['budget', 'Budget for your city'], ['events', 'Kinds of events'], ['culture', 'Cultural weddings'], ['vendors', 'Vendors'], ['invites', 'Invitations and RSVPs'], ['registry', 'Registry and gifts'], ['privacy', 'Your contact details'], ['app', 'Phone app'], ['price', 'Price']];
  const S = {
    knot: { name: 'The Knot', slug: 'the-knot', pic: 'ivory-grand-aisle', tag: 'The giant vendor directory vs. the planner that designs your whole event for you',
      src: [['The Knot Worldwide (Wikipedia)', 'https://en.wikipedia.org/wiki/The_Knot_Worldwide']],
      intro: 'The Knot is one of the biggest wedding brands in the US, owned by The Knot Worldwide (the same company as WeddingWire). It is best known for its huge marketplace of wedding vendors with couple reviews.',
      row: { photo: [1, 'Its AI tool matches vendors to images you favorite; it does not build a full plan and budget from a photo'], budget: [1, 'Wedding budget tools'], events: [1, 'Weddings'], culture: [1, 'General wedding articles'], vendors: [2, 'A huge vendor marketplace with reviews: its biggest strength'], invites: [2, 'Wedding website, invitations and paper (paid designs)'], registry: [2, 'Registry services'], privacy: [1, 'Couples contact vendors through its marketplace'], app: [2, 'Yes'], price: [2, 'Free planning tools; paid invitations and paper'] },
      them: ['You mainly want to browse lots of wedding vendors and read reviews', 'You want a phone app today', 'You want printed invitations and a registry in one place'],
      us: ['You have a photo you love and want to see the whole event designed, with up to six looks to choose from', 'You want real numbers for your city before calling anyone', `It's not a wedding, or it's a cultural wedding (${nCult} traditions)`] },
    weddingwire: { name: 'WeddingWire', slug: 'weddingwire', pic: 'blush-wisteria-ballroom', tag: 'Scrolling vendor lists vs. seeing your event first',
      src: [['The Knot Worldwide (Wikipedia)', 'https://en.wikipedia.org/wiki/The_Knot_Worldwide']],
      intro: 'WeddingWire is owned by The Knot Worldwide, the same company as The Knot. Couples mostly use it to find wedding vendors and read their reviews.',
      row: { photo: [0, 'No'], budget: [1, 'Wedding budget tools'], events: [1, 'Weddings'], culture: [1, 'General wedding articles'], vendors: [2, 'A large vendor directory with reviews: its biggest strength'], invites: [2, 'Wedding website tools'], registry: [2, 'Registry services'], privacy: [1, 'Couples contact vendors through its directory'], app: [2, 'Yes'], price: [2, 'Free planning tools'] },
      them: ['You already know your style and just need vendors and reviews', 'You want a phone app today'],
      us: ['You want the plan built for you from a photo or a few words', 'You want a line-by-line budget for your city and guest count', 'You are planning any kind of event, not only a wedding'] },
    zola: { name: 'Zola', slug: 'zola', pic: 'olive-grove-dinner', tag: 'The registry favorite vs. the party designer',
      src: [['Zola: the best free wedding planning websites', 'https://www.zola.com/expert-advice/best-free-wedding-planning-websites']],
      intro: 'Zola is a wedding company known for its wedding websites and universal registry. By its own description, its free tools include a website with 300+ designs, a registry with zero-fee cash funds, a guest list manager, a checklist, a budget and a vendor marketplace.',
      row: { photo: [0, 'No'], budget: [2, 'Wedding budget with cost breakdowns and vendor suggestions by budget and location'], events: [1, 'Weddings'], culture: [1, 'General wedding articles'], vendors: [2, 'A marketplace of vetted vendors'], invites: [2, 'Website with 300+ designs, matching paper, guest list and RSVPs'], registry: [2, 'Universal registry with zero-fee cash funds: its biggest strength'], privacy: [1, 'Couples contact vendors through its marketplace'], app: [2, 'Yes'], price: [2, 'Free tools; custom guest text messages cost extra'] },
      them: ['A universal registry with gifts from any store is your top priority', 'You want hundreds of website and paper designs', 'You want a phone app today'],
      us: ['You want your whole look designed from an inspiration photo', 'You are planning a birthday, shower, quinceañera or any other event', 'You are planning a cultural wedding with its own customs'] },
    joy: { name: 'Joy', slug: 'joy', pic: 'candlelit-sweetheart-garden', tag: 'The pretty wedding website vs. the whole event, planned',
      src: [['Joy: cash wedding registries guide', 'https://withjoy.com/blog/cash-wedding-registries-guide/']],
      intro: 'Joy (withjoy.com) is a wedding website and app. By its own description, its wedding websites, planning tools and registry are free, and it takes no cut of cash gifts (card processing fees still apply).',
      row: { photo: [0, 'No'], budget: [1, 'Planning tools'], events: [1, 'Mostly weddings'], culture: [1, 'General wedding articles'], vendors: [0, 'No'], invites: [2, 'Wedding website, guest list, save the dates and invitations (free and premium designs)'], registry: [2, 'Registry with cash funds and no Joy fee: its biggest strength'], privacy: [1, 'Guest-focused tools'], app: [2, 'Yes'], price: [2, 'Free; premium invitation designs cost extra'] },
      them: ['You mostly need a polished wedding website and guest app', 'You want cash funds with no Joy fee', 'You want a phone app today'],
      us: ['You want the plan itself: look, budget, vendors, menu, music and schedule', 'You want a budget sized to your city and guest count', 'You are planning any kind of event, or a cultural wedding'] },
    partiful: { name: 'Partiful', slug: 'partiful', pic: 'disco-velvet-lounge', tag: 'The cute invite vs. the whole party',
      src: [['Partiful (Wikipedia)', 'https://en.wikipedia.org/wiki/Partiful']],
      intro: 'Partiful is a free app for party invitations. You make an event, share it by link or text, and guests RSVP without an app. It also has date polls, text blasts, photo sharing and payment links through Venmo, Cash App and PayPal.',
      row: { photo: [0, 'No'], budget: [0, 'No'], events: [1, 'Parties and social events'], culture: [0, 'No'], vendors: [0, 'No'], invites: [2, 'Fun invitation pages, RSVPs and text blasts: its biggest strength'], registry: [1, 'Payment links'], privacy: [1, 'Guests need a verified phone number to RSVP'], app: [2, 'Yes'], price: [2, 'Free'] },
      them: ['You just need a quick, playful invite to text your friends', 'You want date polls and group text blasts', 'You want a phone app today'],
      us: ['You want the whole party planned: look, venue, food, music, vendors and schedule', 'You want formal invitations for a wedding or bigger event', 'You want a budget sized to your city and guest count'] }
  };
  const mark = l => l === 2 ? '<span class="cv-i cv-y" aria-label="Yes">✓</span>' : l === 1 ? '<span class="cv-i cv-p" aria-label="Partly"></span>' : '<span class="cv-i cv-n" aria-label="No">—</span>';
  const score = row => ROWS.reduce((a, [id]) => a + row[id][0], 0);
  const LOOKS = ['blush-champagne-ballroom', 'emerald-courtyard-dinner', 'butterfly-glow-quinceanera'];
  const CSS = `<style>
.cv-hero{position:relative;border-radius:var(--r-lg);overflow:hidden;min-height:320px;display:flex;align-items:flex-end;color:#fff;background:#4B1235}
.cv-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cv-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(75,18,53,.1) 0%,rgba(40,8,28,.88) 78%)}
.cv-hero .in{position:relative;z-index:1;padding:28px 24px;display:grid;gap:12px}
.cv-vs{margin:0;display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-family:var(--display);font-weight:500;font-size:clamp(1.7rem,5vw,2.8rem);line-height:1.1;color:#fff}
.cv-vs i{font-style:normal;font-family:var(--body);font-size:.85rem;font-weight:700;letter-spacing:.15em;background:#B69A68;color:#fff;border-radius:999px;padding:8px 12px}
.cv-hero p{margin:0;font-size:1.08rem;max-width:620px;opacity:.95}
.cv-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.cv-stat{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md);padding:16px 12px;text-align:center}
.cv-stat b{display:block;font-family:var(--display);font-size:2.1rem;font-weight:500;color:var(--ink);line-height:1;margin-bottom:6px}.cv-stat span{font-size:.85rem;color:var(--muted)}
.cv-looks{display:grid;grid-template-columns:1.15fr repeat(3,1fr);gap:10px}
.cv-looks figure{margin:0;position:relative;border-radius:var(--r-md);overflow:hidden;aspect-ratio:3/4;background:var(--tint)}
.cv-looks img{width:100%;height:100%;object-fit:cover;display:block}.cv-looks figcaption{position:absolute;left:8px;bottom:8px;background:rgba(255,255,255,.94);color:#4B1235;border-radius:999px;padding:3px 10px;font-size:.78rem;font-weight:600}
.cv-step{display:flex;flex-direction:column;justify-content:center;gap:8px;background:linear-gradient(135deg,#4B1235,#7a2350);color:#fff;border-radius:var(--r-md);padding:18px}.cv-step b{font-family:var(--display);font-size:1.35rem;font-weight:500;line-height:1.2}.cv-step span{font-size:.92rem;opacity:.9}
.cv-score{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cv-score>div{border-radius:var(--r-md);padding:14px 18px;border:1px solid var(--line);background:var(--surface)}
.cv-score>div:first-child{background:linear-gradient(135deg,#4B1235,#7a2350);color:#fff;border:0}.cv-score b{font-family:var(--display);font-size:2rem;font-weight:500;display:block;line-height:1.1}.cv-score span{font-size:.85rem;opacity:.85}
.cv-bar{height:6px;border-radius:9px;background:rgba(128,128,128,.25);margin:8px 0 6px;overflow:hidden}.cv-bar i{display:block;height:100%;background:#B69A68;border-radius:9px}
.cv-t{width:100%;border-collapse:collapse}.cv-t th,.cv-t td{vertical-align:top;padding:12px 10px;border-top:1px solid var(--line);text-align:left}
.cv-t thead th{border-top:0;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-text)}.cv-t th[scope=row]{width:22%;color:var(--ink)}.cv-t td{width:39%}
.cv-t td.ec{background:var(--champagne-soft)}.cv-c{display:flex;gap:8px;align-items:flex-start}
.cv-i{flex:none;display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;font-size:.78rem;font-weight:700;margin-top:1px}
.cv-y{background:#2F6F4E;color:#fff}.cv-p{background:linear-gradient(90deg,#B69A68 50%,#F3E3C6 50%);border:2px solid #B69A68;width:20px;height:20px}.cv-n{background:var(--line);color:var(--muted)}
.cv-key{display:flex;gap:16px;flex-wrap:wrap;font-size:.85rem;color:var(--muted)}.cv-key span{display:inline-flex;gap:6px;align-items:center}
.cv-pick{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cv-pick>div{border-radius:var(--r-lg);padding:22px;border:1px solid var(--line);background:var(--surface)}
.cv-pick>div.us{background:linear-gradient(135deg,#4B1235,#7a2350);color:#fff;border:0}.cv-pick h3{margin:0 0 12px;font-family:var(--display);font-weight:500;font-size:1.4rem;color:inherit}
.cv-pick ul{margin:0;padding-left:20px;display:grid;gap:8px}.cv-pick .us .btn{margin-top:16px;background:#fff;color:#4B1235;border-color:#fff}
.cv-band{border-radius:var(--r-lg);padding:30px 22px;text-align:center;background:linear-gradient(135deg,#B69A68,#dcc79f);color:#3A1A2A;display:grid;gap:10px;justify-items:center}
.cv-band b{font-family:var(--display);font-size:1.7rem;font-weight:500;line-height:1.2}
.cv-more{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}.cv-more a{position:relative;display:block;border-radius:var(--r-md);overflow:hidden;aspect-ratio:4/3;color:#fff;text-decoration:none}
.cv-more img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}.cv-more a:hover img{transform:scale(1.04)}.cv-more span{position:absolute;inset:auto 0 0 0;padding:24px 12px 10px;background:linear-gradient(transparent,rgba(40,8,28,.88));font-weight:600}
@media(max-width:700px){.cv-hero{min-height:280px}.cv-stats{grid-template-columns:repeat(2,1fr)}.cv-looks{grid-template-columns:repeat(3,1fr)}.cv-step{grid-column:1/-1}.cv-pick{grid-template-columns:1fr}
.cv-t thead{display:none}.cv-t tr{display:grid;grid-template-columns:1fr 1fr}.cv-t th[scope=row]{grid-column:1/-1;width:auto;padding-bottom:4px}.cv-t td{width:auto;border-top:0;padding:8px 6px}.cv-tw{padding:4px 10px!important}.cv-t td.ec{border-radius:8px}.cv-t td:before{content:attr(data-l);display:block;font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-text);margin-bottom:4px}}
</style>`;
  const pages = [];
  const tiles = (list, up) => `<div class="cv-more">${list.map(x => `<a href="${up}${x.slug}/"><img src="${up}../img/inspo/${x.pic}.jpg" alt="" loading="lazy"><span>vs ${esc(x.name)}</span></a>`).join('')}</div>`;
  const band = up => `<div class="cv-band"><b>See your event before you spend a dollar.</b><span>Upload one photo and get up to six looks, a budget for your city and ready-to-book vendor packages, in minutes.</span><a class="btn primary" href="${up}#/new/1">Start with a photo</a></div>`;
  for (const k of Object.keys(S)) {
    const s = S[k], slug = `compare/${s.slug}`, h1 = `Event Couture vs ${s.name}`;
    const title = `Event Couture vs ${s.name}: Which Is Right for You? (${new Date().getFullYear()}) | Event Couture`;
    const desc = `${s.tag}. A fair, side-by-side look at Event Couture and ${s.name}: planning from a photo, city budgets, vendors, invitations, registry and price. Checked ${CHECKED}.`;
    const a = score(EC), b = score(s.row);
    const table = `<div class="panel cv-tw"><table class="cv-t"><thead><tr><th></th><th>Event Couture</th><th>${esc(s.name)}</th></tr></thead><tbody>${ROWS.map(([id, label]) => `<tr><th scope="row">${esc(label)}</th><td class="ec" data-l="Event Couture"><div class="cv-c">${mark(EC[id][0])}<span>${esc(EC[id][1])}</span></div></td><td data-l="${esc(s.name)}"><div class="cv-c">${mark(s.row[id][0])}<span>${esc(s.row[id][1])}</span></div></td></tr>`).join('')}</tbody></table></div>
<div class="cv-key"><span>${mark(2)} Does it well</span><span>${mark(1)} Partly</span><span>${mark(0)} Not offered</span></div>`;
    const items = [[`Is Event Couture free like ${s.name}?`, 'Planning on Event Couture is free. Keeping and sharing a finished plan uses a one-time Event Pass, which is free during the launch period.'],
      [`Can I use Event Couture and ${s.name} together?`, `Yes. Lots of people use Event Couture to design the event and see the budget, and keep using ${s.name} for what it does best.`],
      ['Does Event Couture sell my details to vendors?', 'No. Vendors only hear from you when you choose to message them through Event Couture.']];
    const body = `${CSS}
<section class="cv-hero"><img src="../../img/inspo/${s.pic}.jpg" alt="" fetchpriority="high"><div class="in"><h1 class="cv-vs">Event Couture <i>VS</i> ${esc(s.name)}</h1><p>${esc(s.tag)}.</p></div></section>
<p class="lead">${esc(s.intro)} Here's how it stacks up against Event Couture, the AI planner that turns one inspiration photo into a complete event plan.</p>
<div class="cv-stats"><div class="cv-stat"><b>6</b><span>looks for every plan</span></div><div class="cv-stat"><b>${nCities}</b><span>cities priced</span></div><div class="cv-stat"><b>${nCult}</b><span>cultural traditions</span></div><div class="cv-stat"><b>$0</b><span>to start planning</span></div></div>
<h2>One photo in, a whole event out</h2>
<div class="cv-looks"><div class="cv-step"><b>Drop in a photo you love</b><span>Get three looks (and three more, free), pick one, and Event Couture prices every line for your city and builds vendor packages you can compare.</span></div>${LOOKS.map((p, i) => `<figure><img src="../../img/inspo/${p}.jpg" alt="Sample look ${i + 1}" loading="lazy"><figcaption>Look ${i + 1}</figcaption></figure>`).join('')}</div>
<div class="cta"><a class="btn primary" href="../../#/new/1">Try it free with your photo</a><a class="btn ghost" href="../../#/sample/4">See a finished sample plan</a></div>
<h2>Side by side</h2>
<div class="cv-score"><div><b>${a} / 20</b><div class="cv-bar"><i style="width:${a * 5}%"></i></div><span>Event Couture</span></div><div><b>${b} / 20</b><div class="cv-bar"><i style="width:${b * 5}%"></i></div><span>${esc(s.name)}</span></div></div>
${table}
<p class="small muted">Two points for doing it well, one for partly, on the 10 things above. Based on each company's own pages and public sources, checked ${CHECKED}. Features change, so check ${esc(s.name)} directly for the latest.</p>
<h2>So which one is for you?</h2>
<div class="cv-pick"><div><h3>Pick ${esc(s.name)} if…</h3><ul>${s.them.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div class="us"><h3>Pick Event Couture if…</h3><ul>${s.us.map(x => `<li>${esc(x)}</li>`).join('')}</ul><a class="btn" href="../../#/new/1">Plan my event free</a></div></div>
${band('../../')}
<h2>Questions people ask</h2><div class="faq stack">${items.map(([q, a]) => `<details class="panel"><summary><b>${esc(q)}</b></summary><p>${esc(a)}</p></details>`).join('')}</div>
<h2>More matchups</h2>${tiles(Object.values(S).filter(x => x !== s), '../')}
<p class="small muted">Sources: ${s.src.map(([t, u]) => `<a href="${u}" rel="nofollow noopener" target="_blank">${esc(t)}</a>`).join(', ')}. <a href="../">All comparisons</a>.</p>`;
    const ld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: h1, description: desc, url: `${BASE}${slug}/` }, { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
    const html = page({ rel: 2, title, desc, h1, body, canonical: `${BASE}${slug}/`, ld, crumb: h1, image: `${BASE}img/inspo/${s.pic}.jpg` });
    write(`${slug}/index.html`, html.replace(`<div class="stack"><h1>${esc(h1)}</h1></div>`, ''));
    urls.push(`${BASE}${slug}/`); pages.push(slug);
  }
  const idx = `${CSS}<p class="lead">How Event Couture, the AI event planner, stacks up against popular planning and invitation apps. Every matchup is side by side, honest about where the other app is stronger, and checked ${CHECKED}.</p>
${tiles(Object.values(S), '')}
${band('../')}`;
  write('compare/index.html', page({ rel: 1, title: 'Event Couture vs The Knot, Zola, WeddingWire, Joy and Partiful | Event Couture', desc: 'Fair, side-by-side comparisons of Event Couture with The Knot, Zola, WeddingWire, Joy and Partiful.', h1: 'How Event Couture compares', body: idx, canonical: `${BASE}compare/`, crumb: 'Comparisons' }));
  urls.push(`${BASE}compare/`); pages.push('compare');
  return pages;
};
