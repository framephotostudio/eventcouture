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
<p>Houston has one of the most diverse populations in the US, so caterers, DJs, zaffe groups, mariachis and dhol players for almost any tradition are close by. Many banquet halls work with outside or cultural caterers; ask about the outside-catering fee, required security, and the latest end time before you sign.</p><p class="small">Read next: <a href="../../articles/quinceanera-cost-houston/">Quinceañera cost in Houston</a> · <a href="../../articles/arabic-wedding-traditions-budget/">Arabic wedding traditions and budget</a> · <a href="../../articles/indian-wedding-cost-usa/">Indian wedding cost in the US</a></p>`,
    faqs: [['What are the best areas for a wedding venue in Houston?', 'Galleria / Uptown and River Oaks for hotel ballrooms, Downtown and the Museum District for historic and rooftop spaces, The Heights for gardens and lofts, and Sugar Land, Stafford, Katy or Pearland for large banquet halls. The Woodlands and Magnolia have resort, ranch and barn venues.'],
      ['Can I bring my own caterer to a Houston banquet hall?', 'Often yes, especially at halls that host cultural weddings and quinceañeras, but many charge an outside-catering fee and require licensed, insured caterers. Ask for the fee, security requirements and the latest end time in writing.']],
    occ: {
      quince: (city) => `<h2>Planning a quinceañera in Houston</h2><p>Houston is one of the biggest quinceañera cities in the country, so the best halls, DJs and choreographers book early. Start 9 to 12 months ahead for a Saturday in spring or fall.</p>${list([
        '<b>Mass or blessing first:</b> confirm the church date before you sign with a hall, and leave travel time between the two.',
        '<b>Hall:</b> banquet halls in Southwest Houston, Pasadena, Pearland and Katy often include tables, linens and a dance floor; compare what is included, not just the room price.',
        '<b>Court and dances:</b> budget for the damas and chambelanes, a choreographer for the waltz and surprise dance, and a DJ who can run the program.',
        '<b>Traditions:</b> the last doll, the changing of the shoes and the crown; add them to the run of show so the DJ and photographer are ready.'])}
<p>A quinceañera for about ${OCC.find(o => o.key === 'quince').guests} guests in Houston costs ${money(levels(city, {}, OCC.find(o => o.key === 'quince'))[0], city)} and up in ${YEAR}; the table above shows all three levels. See the full <a href="../../../articles/quinceanera-cost-houston/">quinceañera cost guide for Houston</a> and the <a href="../../../articles/quinceanera-planning-checklist/">12-month quinceañera checklist</a>.</p>`,
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

  /* ---------- Houston: more occasions ---------- */
  Object.assign(L['Houston, TX'].occ, {
    'arabic-wedding': () => `<h2>Arabic weddings in Houston</h2><p>Houston has a large Arab community, so zaffe groups, dabke troupes, Arabic DJs and singers, and halal caterers are easy to find locally.</p>${list([
      '<b>Venue:</b> most Arabic weddings here use banquet halls in Southwest Houston, Sugar Land, Stafford or Katy that seat 300 or more and allow outside halal catering.',
      '<b>Zaffe:</b> book the zaffe group and the DJ or singer together so the entrance, dabke and first dance flow without gaps.',
      '<b>Katb el kitab:</b> often held at home or a mosque before the party; plan it as its own smaller event in the budget.',
      '<b>Late nights:</b> Arabic weddings usually run late, so confirm the hall’s latest end time and overtime fees in writing.'])}`,
    'indian-wedding': () => `<h2>Indian weddings in Houston</h2><p>Sugar Land, Stafford, Katy and Southwest Houston have banquet halls and hotels used to multi-day Indian weddings, along with Indian caterers, mandap decorators, mehndi artists and dhol players.</p>${list([
      '<b>Several events:</b> budget the sangeet, mehndi, ceremony and reception separately; many families use one hotel for the ceremony and reception and a smaller hall or home for the mehndi.',
      '<b>Baraat:</b> ask the venue early whether a horse, a dhol and a procession in the parking lot are allowed, and what permit or insurance they need.',
      '<b>Fire ceremony:</b> the pheras need an open flame; confirm the venue and fire marshal rules before booking.',
      '<b>Catering:</b> many hotels allow outside Indian caterers for a fee; get the fee and kitchen rules in writing.'])}`,
    'pakistani-wedding': () => `<h2>Pakistani weddings in Houston</h2><p>Houston has many halal caterers, mehndi decorators and banquet halls that host Pakistani weddings, mostly in Southwest Houston, Sugar Land, Stafford and Katy.</p>${list([
      '<b>Several events:</b> the nikah, mehndi, baraat and walima are often on different days and sometimes hosted by different families; budget each one.',
      '<b>Halal catering:</b> confirm the caterer’s halal certification and whether the hall allows outside caterers.',
      '<b>Separate seating:</b> if you need separate men’s and women’s areas, ask the hall about dividers and two entrances.',
      '<b>Book early:</b> spring, fall and the weeks around Eid fill up fast at the most popular halls.'])}`,
    'baby-shower': () => `<h2>Baby showers in Houston</h2>${list([
      '<b>Restaurant private rooms and tea rooms</b> in the Galleria, River Oaks, The Heights and Sugar Land are the easiest choice: food, tables and cleanup are included.',
      '<b>At home</b> keeps the cost lowest; add a balloon installation, a dessert table and rented chairs and linens.',
      '<b>Weather:</b> from June to September keep it indoors or plan shade and fans; spring and fall are the most comfortable for garden showers.'])}`
  });

  /* ---------- More US cities ---------- */
  L['Austin, TX'] = { city: () => `<h2>Where to hold an event in Austin</h2>${list([
      '<b>Hill Country (Dripping Springs, Spicewood, Lake Travis):</b> ranches, vineyards and lakeside venues, the classic Austin wedding look.',
      '<b>Downtown and Rainey Street:</b> hotel ballrooms, rooftops and historic venues for evening weddings and company events.',
      '<b>South Congress and East Austin:</b> restaurants, gardens and small venues for showers, rehearsal dinners and parties.',
      '<b>Round Rock and the north:</b> newer hotels and halls with easier parking for large groups.'])}<p>Spring and fall book first. During big festivals hotels fill up and prices rise, so check the city calendar before you pick a date.</p>`,
    faqs: [['What are the best areas for a wedding in Austin?', 'Hill Country towns like Dripping Springs and Spicewood for ranch and vineyard venues, Lake Travis for lake views, and Downtown for hotel ballrooms and rooftops.']] };
  L['San Antonio, TX'] = { city: () => `<h2>Where to hold an event in San Antonio</h2>${list([
      '<b>Downtown and the River Walk:</b> historic hotels and riverside venues, popular for weddings with out-of-town guests.',
      '<b>Pearl and Southtown:</b> restored buildings, courtyards and restaurants with a modern look.',
      '<b>Hill Country (Boerne, New Braunfels):</b> ranches, barns and garden estates about 30 to 45 minutes away.',
      '<b>Banquet halls across the city</b> host large quinceañeras and family weddings, often with packages that include tables, linens and a DJ.'])}<p>San Antonio is one of the biggest quinceañera cities in the US, so book halls 9 to 12 months ahead for spring and fall Saturdays.</p>`,
    faqs: [['How far ahead should I book a quinceañera hall in San Antonio?', '9 to 12 months ahead for a spring or fall Saturday. Avoid Fiesta week in April unless you book very early, since hotels and venues fill up.']] };
  L['Miami, FL'] = { city: () => `<h2>Where to hold an event in Miami</h2>${list([
      '<b>Miami Beach and South Beach:</b> oceanfront hotels and beach clubs; ceremonies on the sand need a permit from the city.',
      '<b>Coral Gables and Coconut Grove:</b> historic hotels, gardens and waterfront venues for classic weddings.',
      '<b>Brickell and Downtown:</b> rooftops and modern hotels with skyline views for evening events.',
      '<b>Wynwood and the Design District:</b> galleries and warehouse spaces for creative parties and launches.'])}<p>November to April is peak season with the best weather. From May to October plan for heat, afternoon storms and hurricane season, and keep a covered backup.</p>`,
    faqs: [['Do I need a permit for a beach wedding in Miami?', 'Usually yes. Miami Beach and the other coastal cities each issue their own beach ceremony permits, with limits on guests, chairs and decor. Apply a few months ahead.']] };
  L['Atlanta, GA'] = { city: () => `<h2>Where to hold an event in Atlanta</h2>${list([
      '<b>Buckhead:</b> luxury hotels and private estates for formal weddings and galas.',
      '<b>Midtown and Downtown:</b> museums, rooftops and hotel ballrooms for evening receptions and company events.',
      '<b>Inman Park, Old Fourth Ward and West Midtown:</b> lofts, restored warehouses and restaurants with a modern look.',
      '<b>North Georgia and the suburbs (Alpharetta, Roswell):</b> gardens, barns and estates for outdoor weddings.'])}<p>Spring and fall are peak seasons. Summers are hot and humid, so outdoor events need shade and a rain plan.</p>`,
    faqs: [['What are the best areas for a wedding venue in Atlanta?', 'Buckhead for luxury hotels and estates, Midtown and Downtown for museums and rooftops, West Midtown for lofts and warehouses, and Alpharetta, Roswell or North Georgia for gardens and barns.']] };
  L['Chicago, IL'] = { city: () => `<h2>Where to hold an event in Chicago</h2>${list([
      '<b>The Loop and River North:</b> historic hotels, ballrooms and rooftops with skyline and river views.',
      '<b>West Loop:</b> lofts, restaurants and event spaces with an industrial look.',
      '<b>Lincoln Park and the lakefront:</b> conservatories, gardens and lake-view venues for spring and summer.',
      '<b>Suburbs (Oak Brook, Schaumburg, Rosemont):</b> large banquet halls and hotels for big cultural weddings, close to O’Hare.'])}<p>June to October is peak season. Winter dates from November to March often come with lower venue prices, especially on Fridays and Sundays.</p>`,
    faqs: [['Is it cheaper to get married in Chicago in winter?', 'Often yes. Many Chicago venues lower their prices or food-and-drink minimums from November to March, especially for Friday and Sunday dates.']] };
  L['New York, NY'] = { city: () => `<h2>Where to hold an event in New York</h2>${list([
      '<b>Manhattan:</b> hotel ballrooms, historic mansions, rooftops and lofts; expect high food-and-drink minimums.',
      '<b>Brooklyn:</b> converted warehouses, waterfront venues and restaurants, often at lower minimums than Manhattan.',
      '<b>Queens and Long Island:</b> large banquet halls and catering halls that host big cultural weddings.',
      '<b>Hudson Valley:</b> barns, estates and vineyards about 90 minutes north, popular for weekend weddings.'])}<p>Venues book 12 to 18 months ahead for May, June, September and October. A Friday, Sunday or winter date can lower the total a lot.</p>`,
    faqs: [['How can I save money on a wedding in New York?', 'Choose a Friday, Sunday or winter date, look at Brooklyn, Queens or Long Island venues with lower minimums, and keep the guest list smaller. Manhattan food-and-drink minimums are the biggest cost.']] };
  L['Phoenix, AZ'] = { city: () => `<h2>Where to hold an event in Phoenix</h2>${list([
      '<b>Scottsdale:</b> resorts, desert estates and golf clubs, the most popular choice for weddings and destination events.',
      '<b>Downtown Phoenix and Tempe:</b> hotels, rooftops and historic buildings for evening events.',
      '<b>Desert venues (North Scottsdale, Cave Creek):</b> ranches and desert gardens with mountain views and sunset ceremonies.'])}<p>Most events happen from October to April. Summer heat often passes 105°F, so summer events should be indoors or in the evening, with shade and cooling.</p>`,
    faqs: [['When is the best time for a wedding in Phoenix?', 'October to April, when days are warm and evenings are cool. From June to September, plan indoors or after sunset, since temperatures often pass 105°F.']] };

  return L;
};
