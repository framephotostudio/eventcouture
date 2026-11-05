// "Theme ideas" pages for search and Pinterest: every look Event Couture has for one occasion, with its colors and decor,
// a typical cost, and one tap to plan it. Photos are the app's own AI-generated inspiration, labeled as such.
'use strict';
module.exports = function ideas(ctx) {
  const { OCC, INSPO, page, write, urls, esc, money, totals, BASE, YEAR } = ctx;
  const NAT = 'Other US city';
  const occ = id => OCC.find(o => o.key === id);
  // [inspo type, slug, page name, plural noun, one-line hook]
  const LIST = [
    ['wedding', 'wedding-themes', 'Wedding', 'wedding themes', 'From candlelit ballrooms to garden ceremonies, each look comes with its colors, decor and a budget.'],
    ['quince', 'quinceanera-themes', 'Quinceañera', 'quinceañera themes', 'Royal ballrooms, butterfly gardens and glowing celestial nights for her fifteen.'],
    ['sweet16', 'sweet-16-themes', 'Sweet 16', 'sweet 16 themes', 'Glam, glow and sparkle: party looks she will actually want to post.'],
    ['birthday', 'birthday-party-themes', 'Birthday party', 'birthday party themes', 'Dinner parties, disco nights and garden soirées for any age.'],
    ['kids-birthday', 'kids-birthday-party-themes', 'Kids’ birthday party', 'kids’ birthday party themes', 'Dinosaurs, outer space, superheroes and under the sea, planned down to the cake.'],
    ['baby-shower', 'baby-shower-themes', 'Baby shower', 'baby shower themes', 'Soft florals, pastel whimsy and garden brunches to welcome the baby.'],
    ['bridal-shower', 'bridal-shower-themes', 'Bridal shower', 'bridal shower themes', 'Garden luncheons, lemon tables and blush teas for the bride-to-be.'],
    ['engagement', 'engagement-party-themes', 'Engagement party', 'engagement party themes', 'Romantic, modern or black-tie: celebrate the yes in style.'],
    ['anniversary', 'anniversary-party-themes', 'Anniversary party', 'anniversary party themes', 'Elegant dinners and golden evenings to mark the years together.'],
    ['gala', 'gala-themes', 'Gala', 'gala and black-tie themes', 'Old Hollywood, emerald luxe and midnight glamour for big nights.'],
    ['bachelorette', 'bachelorette-party-themes', 'Bachelorette party', 'bachelorette party themes', 'Disco, pink glam and dinner-party chic for the last fling.'],
    ['graduation', 'graduation-party-themes', 'Graduation party', 'graduation party themes', 'Celebrate the grad with a party that feels as big as the moment.'],
  ];
  const byType = {}; INSPO.forEach(p => p.types.forEach(t => { (byType[t] = byType[t] || []).push(p); }));
  /* Looks made for this occasion first (it is listed earlier in their types), so the top photo fits the page. */
  Object.keys(byType).forEach(t => { byType[t] = byType[t].map((p, i) => [p, i]).sort((x, y) => (x[0].types.indexOf(t) - y[0].types.indexOf(t)) || (x[1] - y[1])).map(x => x[0]); });
  const pages = LIST.filter(([t]) => (byType[t] || []).length >= 5 && occ(t));
  const CSS = `<style>
.ti-hero{position:relative;border-radius:var(--r-lg);overflow:hidden;min-height:300px;display:flex;align-items:flex-end;color:#fff;background:#4B1235}
.ti-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ti-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(75,18,53,.05) 0%,rgba(40,8,28,.86) 80%)}
.ti-hero .in{position:relative;z-index:1;padding:26px 24px;display:grid;gap:10px}
.ti-hero h1{margin:0;color:#fff;font-size:clamp(1.8rem,5vw,2.9rem);line-height:1.08}
.ti-hero p{margin:0;font-size:1.06rem;max-width:620px;opacity:.95}
.ti-kick{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:#E9D7B0}
.ti-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ti-fact{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md);padding:14px 12px;text-align:center}
.ti-fact b{display:block;font-family:var(--display);font-size:1.7rem;font-weight:500;color:var(--ink);line-height:1.1;margin-bottom:4px}.ti-fact span{font-size:.84rem;color:var(--muted)}
.ti-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.ti-card{margin:0;display:grid;grid-template-rows:auto 1fr;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden}
.ti-card .ph{position:relative;aspect-ratio:4/5;background:var(--tint)}.ti-card .ph img{width:100%;height:100%;object-fit:cover;display:block}
.ti-card .no{position:absolute;left:12px;top:12px;background:rgba(255,255,255,.94);color:#4B1235;border-radius:999px;min-width:30px;height:30px;display:grid;place-items:center;font-weight:600;font-size:.85rem;padding:0 8px}
.ti-card .in{padding:16px 18px 18px;display:grid;gap:10px;align-content:start}
.ti-card h3{margin:0;font-size:1.3rem}
.ti-card p{margin:0}
.ti-sw{display:flex;gap:6px}.ti-sw i{width:22px;height:22px;border-radius:50%;border:1px solid rgba(0,0,0,.08);display:block}
.ti-card ul{margin:0;padding-left:18px;display:grid;gap:4px;font-size:.92rem;color:var(--muted)}
.ti-card .btn{justify-self:start;margin-top:4px}
.ti-band{border-radius:var(--r-lg);padding:26px 24px;background:linear-gradient(135deg,#4B1235,#7a2350);color:#fff;display:grid;gap:10px;justify-items:start}
.ti-band h2{margin:0;color:#fff}.ti-band p{margin:0;opacity:.92;max-width:600px}.ti-band .btn{background:#B69A68;color:#fff;border-color:#B69A68}
.ti-more{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.ti-more a{position:relative;display:block;border-radius:var(--r-md);overflow:hidden;aspect-ratio:1;color:#fff;text-decoration:none}
.ti-more img{width:100%;height:100%;object-fit:cover;display:block}.ti-more a:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(40,8,28,.85))}
.ti-more span{position:absolute;left:10px;right:10px;bottom:10px;z-index:1;font-weight:600;font-size:.92rem;line-height:1.2}
@media(max-width:560px){.ti-facts{grid-template-columns:1fr 1fr 1fr;gap:6px}.ti-fact{padding:12px 6px}.ti-fact b{font-size:1.35rem}.ti-hero{min-height:260px}}
</style>`;
  const tiles = (skip, up) => `<div class="ti-more">${pages.filter(x => x[1] !== skip).map(([t, slug, name]) => `<a href="${up}${slug}/"><img src="${up}../img/inspo/sm/${byType[t][0].id}.jpg" alt="" loading="lazy"><span>${esc(name)} themes</span></a>`).join('')}</div>`;
  const out = [];
  pages.forEach(([t, slug, name, plural, hook]) => {
    const o = occ(t), looks = byType[t], tot = totals(o, NAT), n = looks.length;
    const title = `${n} ${plural.replace(/(^|\s)\S/g, c => c.toUpperCase()).replace(' And ', ' and ')} and Ideas (${YEAR}) | Event Couture`;
    const desc = `${n} ${plural} with colors, decor and a typical budget for each. ${hook} Tap any look to plan it free.`;
    const h1 = `${n} ${plural} ready to plan`;
    const cards = looks.map((p, i) => `<figure class="ti-card"><div class="ph"><img src="../../img/inspo/sm/${p.id}.jpg" alt="${esc(p.alt || p.name)}, AI-generated inspiration" loading="${i < 2 ? 'eager' : 'lazy'}"><span class="no">${i + 1}</span></div><div class="in"><h3>${esc(p.name)}</h3><div class="ti-sw" aria-label="Colors">${(p.palette || []).slice(0, 5).map(c => `<i style="background:${esc(c)}"></i>`).join('')}</div><p class="small">${esc(p.mood || '')}</p><ul>${(p.decor || []).slice(0, 3).map(d => `<li>${esc(d)}</li>`).join('')}</ul><a class="btn small primary" href="../../#/start/${esc(t)}/-/${esc(p.id)}">Plan this look</a></div></figure>`).join('');
    const items = [
      [`How much does ${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name.toLowerCase()} cost?`, `For about ${o.guests} guests in an average US city, plan on around ${money(tot[0], NAT)} for a budget-friendly version, ${money(tot[1], NAT)} for mid-range and ${money(tot[2], NAT)} for full luxury, including tax and tips. Prices change a lot by city.`],
      ['Can I plan one of these looks for my own city?', 'Yes. Tap “Plan this look” and Event Couture prices every part of it for your city and guest count, then builds vendor packages you can compare.'],
      ['Can I use my own inspiration photo instead?', 'Yes. Upload any photo, or paste a Pinterest or TikTok link, and you get three full looks built from it, plus three more free if you want.'],
      ['Are these real events?', 'No. The photos are AI-generated inspiration, made to show what each look could be. Your real event is planned with real local vendors and prices.'],
    ];
    const body = `${CSS}
<section class="ti-hero"><img src="../../img/inspo/${looks[0].id}.jpg" alt="" fetchpriority="high"><div class="in"><span class="ti-kick">${esc(name)} ideas · ${YEAR}</span><h1>${esc(h1)}</h1><p>${esc(hook)}</p></div></section>
<div class="ti-facts"><div class="ti-fact"><b>${n}</b><span>looks to choose from</span></div><div class="ti-fact"><b>${money(tot[0], NAT).replace(/,\d{3}$/, 'k')}+</b><span>typical starting budget</span></div><div class="ti-fact"><b>$0</b><span>to plan yours</span></div></div>
<p class="lead">Every look below comes with its colors, decor and a typical budget. Tap <b>Plan this look</b> and Event Couture prices it for your city and guest count, finds local vendors and builds your checklist. Photos are AI-generated inspiration.</p>
<div class="ti-grid">${cards}</div>
<section class="ti-band"><h2>Have your own photo?</h2><p>Upload a picture you love, or paste a Pinterest or TikTok link. Event Couture turns it into up to six looks and a full plan for your city, free.</p><a class="btn" href="../../#/new/1">Plan from my photo</a></section>
<p>Want the numbers first? See the full <a href="../../plan/${esc(o.slug || o.key)}/">${esc(name.toLowerCase())} cost and checklist</a>, or open your <a href="../../plan/">city’s planning guide</a>.</p>
<h2>Questions people ask</h2><div class="faq stack">${items.map(([q, a]) => `<details class="panel"><summary><b>${esc(q)}</b></summary><p>${esc(a)}</p></details>`).join('')}</div>
<h2>More theme ideas</h2>${tiles(slug, '../')}`;
    const ld = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: h1, description: desc, url: `${BASE}ideas/${slug}/`, hasPart: looks.map((p, i) => ({ '@type': 'CreativeWork', position: i + 1, name: p.name, image: `${BASE}img/inspo/sm/${p.id}.jpg` })) },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
    const html = page({ rel: 2, title, desc, h1, body, canonical: `${BASE}ideas/${slug}/`, ld, crumb: `${name} themes`, image: `${BASE}img/inspo/${looks[0].id}.jpg` });
    write(`ideas/${slug}/index.html`, html.replace(`<div class="stack"><h1>${esc(h1)}</h1></div>`, ''));
    urls.push(`${BASE}ideas/${slug}/`); out.push('ideas/' + slug);
  });
  const idx = `${CSS}<section class="ti-hero"><img src="../img/inspo/${byType.wedding[0].id}.jpg" alt="" fetchpriority="high"><div class="in"><span class="ti-kick">Theme ideas · ${YEAR}</span><h1>Party and wedding theme ideas</h1><p>${INSPO.length} looks with their colors, decor and budgets. Pick one and start planning it, free.</p></div></section>${tiles('', '')}`;
  write('ideas/index.html', page({ rel: 1, title: `Party and Wedding Theme Ideas (${YEAR}) | Event Couture`, desc: `Theme ideas for weddings, quinceañeras, sweet 16s, birthdays, baby and bridal showers and more, each with its colors, decor and a typical budget.`, h1: 'Party and wedding theme ideas', body: idx, canonical: `${BASE}ideas/`, crumb: 'Theme ideas', image: `${BASE}img/inspo/${byType.wedding[0].id}.jpg` }).replace('<div class="stack"><h1>Party and wedding theme ideas</h1></div>', '').replace(/src="\.\.\/\.\.\/img/g, 'src="../img'));
  urls.push(`${BASE}ideas/`);
  return out;
};
