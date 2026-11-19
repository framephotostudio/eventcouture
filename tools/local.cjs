// Hand-written local detail for the guides that Google already shows most (Search Console, Nov 2026):
// Houston, Dallas, San Jose, Los Angeles and Phuket. Adds a local section and extra FAQs to the city page,
// and to chosen city + occasion pages. Prices still come from the planning engine.
// Used by tools/seo.cjs (city pages) and tools/combos.cjs (city + occasion pages).
'use strict';
module.exports = function local({ D, E, OCC, esc, money, evFor, YEAR }) {
  const wed = OCC.find(o => o.key === 'wedding');
  const levels = (city, over, occ) => { const ev = Object.assign(evFor(occ || wed, city), over); E.useCountry(city); return ['L', 'S', 'U'].map(k => E.budget(ev, k).total); };
  const sizeTable = (city, sizes, over, label) => `<div class="table-wrap panel"><table class="qty"><thead><tr><th>${esc(label)}</th><th class="n">Luxe for Less</th><th class="n">Signature</th><th class="n">Ultra Luxe</th></tr></thead><tbody>${sizes.map(n => { const t = levels(city, Object.assign({ guests: n, expected: n }, over)); return `<tr><td>${n} guests</td><td class="n">${money(t[0], city)}</td><td class="n"><b>${money(t[1], city)}</b></td><td class="n">${money(t[2], city)}</td></tr>`; }).join('')}</tbody></table></div>`;
  const list = a => `<ul class="plain">${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const L = {};

  /* ---------- Houston ---------- */
  L['Houston, TX'] = {
    city: () => `<h2>Where to hold an event in Houston</h2><p>Houston is spread out, so the area you choose shapes the venue style, the price and how far your guests drive.</p>${list([
      '<b>Galleria / Uptown and River Oaks:</b> hotel ballrooms and upscale private clubs, the usual choice for formal weddings and galas.',
      '<b>Downtown and the Museum District:</b> historic buildings, rooftops and museum spaces for evening receptions and corporate events.',
      '<b>The Heights and Montrose:</b> gardens, lofts and restaurant private rooms, good for showers, rehearsal dinners and smaller weddings.',
      '<b>Southwest Houston, Sugar Land, Stafford, Katy and Pearland:</b> large banquet halls that seat 300 to 600, popular for quinceañeras and Arabic, Indian, Pakistani, Nigerian and Vietnamese weddings.',
      '<b>The Woodlands, Magnolia and Tomball:</b> lakeside resorts, ranches and barn venues for a country or garden look about an hour from the city.'])}
<p>Houston has one of the most diverse populations in the US, so caterers, DJs, zaffe groups, mariachis and dhol players for almost any tradition are close by. Many banquet halls work with outside or cultural caterers; ask about the outside-catering fee, required security, and the latest end time before you sign.</p>`,
    faqs: [['What are the best areas for a wedding venue in Houston?', 'Galleria / Uptown and River Oaks for hotel ballrooms, Downtown and the Museum District for historic and rooftop spaces, The Heights for gardens and lofts, and Sugar Land, Stafford, Katy or Pearland for large banquet halls. The Woodlands and Magnolia have resort, ranch and barn venues.'],
      ['Can I bring my own caterer to a Houston banquet hall?', 'Often yes, especially at halls that host cultural weddings and quinceañeras, but many charge an outside-catering fee and require licensed, insured caterers. Ask for the fee, security requirements and the latest end time in writing.']],
    occ: {
      quince: (city) => `<h2>Planning a quinceañera in Houston</h2><p>Houston is one of the biggest quinceañera cities in the country, so the best halls, DJs and choreographers book early. Start 9 to 12 months ahead for a Saturday in spring or fall.</p>${list([
        '<b>Mass or blessing first:</b> confirm the church date before you sign with a hall, and leave travel time between the two.',
        '<b>Hall:</b> banquet halls in Southwest Houston, Pasadena, Pearland and Katy often include tables, linens and a dance floor; compare what is included, not just the room price.',
        '<b>Court and dances:</b> budget for the damas and chambelanes, a choreographer for the waltz and surprise dance, and a DJ who can run the program.',
        '<b>Traditions:</b> the last doll, the changing of the shoes and the crown; add them to the run of show so the DJ and photographer are ready.'])}
<p>A quinceañera for about ${OCC.find(o => o.key === 'quince').guests} guests in Houston costs ${money(levels(city, {}, OCC.find(o => o.key === 'quince'))[0], city)} and up in ${YEAR}; the table above shows all three levels.</p>`,
      wedding: (city) => `<h2>Houston wedding packages by guest count</h2><p>What a wedding costs in Houston in ${YEAR} for different guest counts, from the same budget engine as the plan.</p>${sizeTable(city, [50, 100, 150, 250, 400], {}, 'Wedding size')}
<p>For an outdoor ceremony, pick March to May or October to November and keep an indoor or tented backup: summer heat and the June to November storm season make rain plans essential in Houston.</p>`
    },
    occFaqs: { quince: [['How far ahead should I book a quinceañera hall in Houston?', '9 to 12 months ahead for a Saturday in spring or fall, since the most popular halls, DJs and choreographers book first. Confirm the church date before signing with the hall.']] }
  };

  /* ---------- Dallas ---------- */
  L['Dallas, TX'] = {
    city: () => `<h2>Where to hold an event in Dallas</h2>${list([
      '<b>Uptown and Downtown:</b> hotel ballrooms, rooftops and historic buildings for formal weddings, galas and company parties.',
      '<b>Design District and Deep Ellum:</b> lofts, galleries and warehouse spaces with a modern, industrial look.',
      '<b>Highland Park:</b> private clubs and upscale restaurants for showers, engagement parties and rehearsal dinners.',
      '<b>Plano, Frisco and Las Colinas:</b> newer hotels and conference centers, the easiest choice for corporate events and large cultural weddings.',
      '<b>McKinney, Aubrey and the north:</b> ranches, barns and garden estates for a Texas country look.'])}
<p>April, May and October are the busiest months; spring storms and summer heat mean outdoor events need a covered backup. Many Dallas couples also look at Fort Worth venues, which can cost less for the same date.</p>`,
    faqs: [['What are the best areas for a wedding venue in Dallas?', 'Uptown and Downtown for hotel ballrooms and rooftops, the Design District and Deep Ellum for lofts and galleries, Plano, Frisco and Las Colinas for newer hotels, and McKinney or Aubrey for ranch and barn venues.']]
  };

  /* ---------- San Jose ---------- */
  L['San Jose, CA'] = {
    city: () => `<h2>Where to hold an event in San Jose and Silicon Valley</h2>${list([
      '<b>Downtown San Jose and Santana Row:</b> hotel ballrooms, rooftops and restaurants close to the airport, good for guests flying in.',
      '<b>Los Gatos and Saratoga:</b> wineries, estates and garden venues in the foothills of the Santa Cruz Mountains.',
      '<b>Willow Glen and Palo Alto:</b> restaurant private rooms and smaller venues for showers, rehearsal dinners and intimate weddings.',
      '<b>Corporate events:</b> Silicon Valley companies book hotel conference centers and offsite venues heavily on weekdays, so weekday rates can be higher than you expect while some weekends are easier to book.'])}
<p>San Jose prices are among the highest in the US. The weather is dry from about May to October, which makes outdoor events reliable; the rainy months are roughly November to March.</p>`,
    faqs: [['Is San Jose an expensive place to have a wedding?', 'Yes, venue, catering and staff costs in Silicon Valley are among the highest in the US. A Friday or Sunday date, a smaller guest list, or a restaurant venue in Willow Glen or Downtown can lower the total a lot.']]
  };

  /* ---------- Los Angeles ---------- */
  L['Los Angeles, CA'] = {
    city: () => `<h2>Where to hold an event in Los Angeles</h2>${list([
      '<b>Beverly Hills and West Hollywood:</b> luxury hotels, rooftops and private estates for black-tie weddings and parties.',
      '<b>Downtown LA:</b> historic theaters, lofts and rooftop venues with a city view, popular for modern weddings and company events.',
      '<b>Santa Monica, Malibu and Long Beach:</b> beach clubs, ocean-view restaurants and hotels; beach ceremonies need a permit from the city that manages that beach.',
      '<b>Pasadena:</b> gardens, mansions and historic estates for classic outdoor weddings.',
      '<b>Calabasas and the canyons:</b> ranches and garden estates with a private, rustic feel.'])}
<p>Traffic is the biggest planning factor in LA: choose a venue close to where most guests stay, and start evening events after rush hour. Near the coast, late spring and early summer mornings are often gray; September and October are usually the warmest, clearest months.</p>`,
    faqs: [['Do I need a permit for a beach wedding in Los Angeles?', 'Usually yes. Beaches are managed by the city or county they are in (for example Santa Monica, Malibu or LA County), and each issues its own permit for ceremonies, with limits on guests, chairs and decor. Apply a few months ahead.']]
  };

  /* ---------- Phuket ---------- */
  const phuketBeach = (city) => `<h2>Beach wedding in Phuket: prices by guest count</h2><p>What an outdoor beach or villa wedding costs in Phuket in ${YEAR}, in Thai baht with ${D.CITIES.find(c => c.name === city).tax}% VAT, from the same budget engine as the plan. Most beach weddings here are small, so the table starts at 20 guests.</p>${sizeTable(city, [20, 40, 60, 100, 150], { setting: 'outdoor' }, 'Beach wedding')}
<h2>Phuket wedding packages: what they usually include</h2><p>Resorts and villas in Phuket often sell all-in wedding packages. Compare what each one actually covers:</p>${list([
    '<b>Ceremony setup:</b> beach or garden spot, arch, chairs, aisle decor and a celebrant for a symbolic ceremony.',
    '<b>Reception:</b> dinner per guest (often a set menu or seafood barbecue), drinks packages charged separately, and a time limit for music on the beach.',
    '<b>Photo and beauty:</b> a few hours of photography, and bridal hair and makeup.',
    '<b>Extras that add up:</b> fire shows, Thai dancers, a monk blessing, flower upgrades, extra hours and service charges on top of VAT.'])}`;
  L['Phuket, Thailand'] = {
    title: c => `Phuket Wedding Packages & Beach Wedding Prices (${YEAR}) | Event Couture`,
    city: (city) => `<h2>Planning a wedding in Phuket</h2>${list([
      '<b>Best time:</b> the dry high season runs about November to April. May to October brings the southwest monsoon, with afternoon storms and rough seas on west-coast beaches, but lower venue and hotel prices.',
      '<b>Beaches:</b> Kata, Karon, Kamala, Surin, Nai Harn and Mai Khao are the most popular for ceremonies. Beaches in Thailand are public, so resorts usually hold ceremonies on their own beachfront lawn or a quieter stretch.',
      '<b>Villas:</b> private pool villas on the west-coast hills give sunset views and full privacy, and often let you bring your own caterer and decorator.',
      '<b>Thai traditions:</b> many couples add a morning monk blessing or the Thai water-pouring ceremony (rod nam sang) alongside the main ceremony.',
      '<b>Legal marriage:</b> most foreign couples marry legally at home and hold a symbolic ceremony in Phuket. A legal Thai marriage is registered at a district office and needs translated documents from your embassy, so check with your embassy first.'])}${phuketBeach(city)}`,
    faqs: [['How much does a beach wedding in Phuket cost?', 'See the beach wedding table above: it shows Luxe for Less, Signature and Ultra Luxe budgets from 20 to 150 guests, in Thai baht with VAT. Small beach weddings for 20 to 40 guests are the most common.'],
      ['When is the best time for a wedding in Phuket?', 'November to April, the dry high season. May to October is the monsoon season on the west coast, with storms and rough seas, but prices are lower.'],
      ['Is a wedding in Phuket legally binding?', 'Only if it is registered at a Thai district office with translated embassy documents. Most foreign couples marry legally at home and hold a symbolic ceremony in Phuket.']],
    occ: { wedding: phuketBeach },
    occTitle: { wedding: () => `Phuket Wedding Packages & Prices (${YEAR}): Beach Weddings | Event Couture` }
  };

  return L;
};
