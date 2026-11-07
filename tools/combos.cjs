// One page for every city and occasion: "How much does a wedding cost in Raleigh, NC?" answered first, with the
// three budget levels, the line-by-line budget for that city, local vendor rates, local picks and nearby cities.
// Every number comes from the same planning engine the app uses. Called from tools/seo.cjs.
'use strict';
module.exports = function ({ D, E, OCC, CITIES, page, write, urls, esc, money, totals, evFor, YEAR, BASE, recsIn, catLabel, noteFor }) {
  const TITLE = { brunch: 'Brunch or Tea Party', birthday: 'Birthday Party', 'kids-birthday': 'Kids’ Birthday Party', milestone: 'Milestone Birthday Party', dinner: 'Dinner Party',
    'bridal-shower': 'Bridal Shower', 'baby-shower': 'Baby Shower', 'gender-reveal': 'Gender Reveal Party', bachelorette: 'Bachelorette Party', graduation: 'Graduation Party',
    engagement: 'Engagement Party', quince: 'Quinceañera', sweet16: 'Sweet 16', anniversary: 'Anniversary Party', retirement: 'Retirement Party', christmas: 'Christmas Party',
    holiday: 'Holiday Party', wedding: 'Wedding', gala: 'Gala or Fundraiser', corporate: 'Corporate Event' };
  const titleOf = o => o.culture ? o.name.replace(/\bwedding\b/, 'Wedding') : (TITLE[o.key] || o.name);
  const RATE = [['photographer', 'an hour'], ['dj', 'an hour'], ['catering', 'a guest'], ['florals', 'a table'], ['cake', 'a guest'], ['hairMakeup', 'a person']];
  let n = 0;
  /* the same vendor picks and order the app shows, taken from js/app.js */
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js/app.js'), 'utf8');
  const recFor = eval('(' + src.match(/  function recFor\(ev, cat\) \{[\s\S]*?\n  \}\n/)[0].replace('function recFor', 'function') + ')');
  const W = r => r.weight != null ? r.weight : (r.first ? 100 : 0) + (r.cities ? 20 : r.states ? 10 : 0) + (r.top ? 5 : 0);
  for (const c of CITIES) {
    const cityShort = c.name.split(',')[0], country = E.countryOf(c.name);
    const shortTaken = CITIES.filter(x => x.name.split(',')[0] === cityShort).length > 1, where = shortTaken ? c.name : cityShort;
    const recs = recsIn(c.name);
    const near = CITIES.filter(x => x !== c && (country.id === 'US' ? x.name.split(', ')[1] === c.name.split(', ')[1] : E.countryOf(x.name).id === country.id)).slice(0, 6);
    for (const o of OCC) {
      const t = totals(o, c.name), ev = evFor(o, c.name); E.useCountry(c.name);
      const b = E.budget(ev, 'S'), T = titleOf(o), phrase = o.phrase;
      const top3 = b.items.slice().sort((x, y) => y.mid - x.mid).slice(0, 3);
      const cats = new Set(b.items.map(i => i.id));
      const myRecs = []; b.items.forEach(it => { recFor(Object.assign({}, ev, { setting: 'indoor', culture: o.culture || '' }), it.id).filter(r => !r.late).slice(0, 2).map(r => D.RECOMMENDED.find(x => x.name === r.name && (x.ig || '') === (r.ig || ''))).filter(Boolean).forEach(r => { if (!myRecs.some(x => (x.ig || x.name) === (r.ig || r.name))) myRecs.push(r); }); }); myRecs.length = Math.min(myRecs.length, 12);
      const rateRows = RATE.filter(([id]) => cats.has(id) && D.CATEGORIES[id]).map(([id, unit]) => { const k = D.CATEGORIES[id], r = k.perHour || k.perGuest || k.fixed; return r ? `<tr><td>${esc(k.name.split(' (')[0])}</td><td class="n">${money(r[0] * c.index, c.name)} to ${money(r[1] * c.index, c.name)}${k.fixed ? '' : ' ' + unit}</td></tr>` : ''; }).join('');
      const base = `${BASE}plan/${c.slug}/${o.slug}/`;
      const q = `How much does ${phrase} cost in ${where}?`;
      const answer = `For about ${o.guests} guests, ${phrase} in ${where} costs about ${money(t[0], c.name)} done smartly, ${money(t[1], c.name)} with the key pieces handled by pros, and ${money(t[2], c.name)} or more for full-service luxury, in ${YEAR}.`;
      const faqs = [[q, answer],
        [`What are the biggest expenses for ${phrase} in ${where}?`, top3.map(i => `${i.name.split(' (')[0]} (about ${money(i.mid, c.name)})`).join(', ') + '.'],
        [`How can I spend less on ${phrase} in ${where}?`, `The Luxe for Less version keeps the look for about ${money(t[0], c.name)}, ${money(t[1] - t[0], c.name)} less than Signature, mostly by trimming ${top3.slice(0, 2).map(i => i.name.split(' (')[0].toLowerCase()).join(' and ')}. A Friday, Sunday or off-season date also lowers venue prices.`],
        [`Can I plan ${phrase} in ${where} online for free?`, `Yes. Event Couture builds the look, a budget for your exact guest count in ${where}, top-rated local vendors, a checklist and invitations, free.`]];
      const body = `<p class="lead">${esc(answer)}</p>
<div class="cta"><a class="btn gold" href="../../../#/start/${o.start}/${encodeURIComponent(c.name)}">Get my exact budget, free</a><span class="small muted">Your guest count, your style, local vendors.</span></div>
<div class="table-wrap panel"><table class="qty"><thead><tr><th>Budget level</th><th class="n">${o.guests} guests</th></tr></thead><tbody><tr><td>Luxe for Less <span class="small muted">(smart swaps)</span></td><td class="n">${money(t[0], c.name)}</td></tr><tr><td><b>Signature</b> <span class="small muted">(key pieces by pros)</span></td><td class="n"><b>${money(t[1], c.name)}</b></td></tr><tr><td>Ultra Luxe <span class="small muted">(full service)</span></td><td class="n">${money(t[2], c.name)}</td></tr><tr><td>Per guest (Signature)</td><td class="n">${money(t[1] / o.guests, c.name)}</td></tr></tbody></table></div>
<h2>Budget breakdown in ${esc(cityShort)} (Signature)</h2><div class="table-wrap panel"><table class="qty"><tbody>${b.items.map(i => `<tr><td>${esc(i.name)}</td><td class="n">${money(i.mid, c.name)}</td></tr>`).join('')}<tr><td>Contingency (unexpected costs)</td><td class="n">${money(b.contingency, c.name)}</td></tr><tr><td><b>Estimated total</b></td><td class="n"><b>${money(b.total, c.name)}</b></td></tr></tbody></table></div>
${rateRows ? `<h2>Vendor rates in ${esc(cityShort)}</h2><div class="table-wrap panel"><table class="qty"><tbody>${rateRows}</tbody></table></div>` : ''}
<h2>Planning notes</h2><p>${esc(noteFor(c))}</p>
${myRecs.length ? `<h2>Event Couture picks in ${esc(cityShort)}</h2><p class="small muted">Recommended by Event Couture, not paid placement. Always check reviews and contracts yourself.</p><ul class="plain">${myRecs.map(r => `<li><b>${esc(r.name)}</b> · ${esc(r.cats.map(catLabel).join(', '))}${r.ig ? ` · <a href="https://instagram.com/${esc(r.ig)}" rel="nofollow noopener" target="_blank">@${esc(r.ig)}</a>` : ''}</li>`).join('')}</ul>` : ''}
${near.length ? `<h2>${esc(T)} cost in nearby cities</h2><div class="table-wrap panel"><table class="qty"><tbody>${near.map(x => `<tr><td><a href="../../${x.slug}/${o.slug}/">${esc(x.name)}</a></td><td class="n">${money(totals(o, x.name)[1], x.name)}</td></tr>`).join('')}</tbody></table></div>` : ''}
<h2>Questions people ask</h2><div class="faq">${faqs.map(([qq, a]) => `<details class="panel"><summary><b>${esc(qq)}</b></summary><p>${esc(a)}</p></details>`).join('')}</div>
<h2>Other events in ${esc(cityShort)}</h2><div class="cols">${OCC.filter(x => x !== o).map(x => `<a href="../${x.slug}/">${esc(titleOf(x))} cost</a>`).join('')}</div>
<p class="small"><a href="../">All event costs in ${esc(c.name)}</a> · <a href="../../${o.slug}/">${esc(T)} planning guide</a></p>`;
      const ld = [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([qq, a]) => ({ '@type': 'Question', name: qq, acceptedAnswer: { '@type': 'Answer', text: a } })) },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Planning guides', item: `${BASE}plan/` }, { '@type': 'ListItem', position: 2, name: c.name, item: `${BASE}plan/${c.slug}/` }, { '@type': 'ListItem', position: 3, name: `${T} cost`, item: base }] }];
      write(`plan/${c.slug}/${o.slug}/index.html`, page({ rel: 3, title: `Average ${T} Cost in ${where} (${YEAR}) | Event Couture`, h1: q,
        desc: `${T} cost in ${c.name} for ${YEAR}: ${money(t[0], c.name)} to ${money(t[2], c.name)} for ${o.guests} guests, with a line-by-line budget, local vendor rates and ways to save.`,
        body, canonical: base, ld, crumb: `${c.name} › ${T} cost` }));
      urls.push(base); n++;
    }
  }
  return n;
};
