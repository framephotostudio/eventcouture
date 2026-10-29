/* Event Couture: catalogs used by the planning engine.
   All money is USD. Cost ranges are national planning estimates for the Signature tier
   and are scaled by city and tier in engine.js. They are labeled to users as estimates. */
(function (root) {
  'use strict';

  var EVENT_TYPES = [
    { id: 'brunch', name: 'Brunch or tea party', hours: 3, style: 'dining', defaultGuests: 10 },
    { id: 'birthday', name: 'Birthday party', hours: 4, style: 'party', defaultGuests: 40 },
    { id: 'kids-birthday', name: 'Kids\u2019 themed birthday', hours: 3, style: 'party', defaultGuests: 25 },
    { id: 'milestone', name: 'Milestone birthday', hours: 5, style: 'party', defaultGuests: 80 },
    { id: 'dinner', name: 'Dinner party', hours: 3, style: 'dining', defaultGuests: 12 },
    { id: 'bridal-shower', name: 'Bridal shower', hours: 3, style: 'shower', defaultGuests: 30 },
    { id: 'baby-shower', name: 'Baby shower', hours: 3, style: 'shower', defaultGuests: 30 },
    { id: 'gender-reveal', name: 'Gender reveal', hours: 3, style: 'shower', defaultGuests: 30 },
    { id: 'bachelorette', name: 'Bachelorette', hours: 5, style: 'party', defaultGuests: 12 },
    { id: 'graduation', name: 'Graduation party', hours: 4, style: 'party', defaultGuests: 50 },
    { id: 'engagement', name: 'Engagement party', hours: 4, style: 'party', defaultGuests: 60 },
    { id: 'quince', name: 'Quinceañera', hours: 5, style: 'gala', defaultGuests: 150 },
    { id: 'sweet16', name: 'Sweet 16', hours: 4, style: 'party', defaultGuests: 60 },
    { id: 'anniversary', name: 'Anniversary', hours: 4, style: 'party', defaultGuests: 50 },
    { id: 'retirement', name: 'Retirement party', hours: 4, style: 'party', defaultGuests: 50 },
    { id: 'christmas', name: 'Christmas party', hours: 4, style: 'party', defaultGuests: 40 },
    { id: 'holiday', name: 'Holiday party', hours: 4, style: 'party', defaultGuests: 40 },
    { id: 'wedding', name: 'Wedding', hours: 6, style: 'wedding', defaultGuests: 120 },
    { id: 'gala', name: 'Gala or fundraiser', hours: 5, style: 'gala', defaultGuests: 200 },
    { id: 'corporate', name: 'Corporate event', hours: 3, style: 'party', defaultGuests: 80 },
    { id: 'other', name: 'Other celebration', hours: 4, style: 'party', defaultGuests: 30 }
  ];

  /* Cost models: fixed [lo,hi], perGuest [lo,hi], perHour [lo,hi] (x event hours or hoursOverride),
     taxable (goods), service (adds 20% service charge), tip (tip expected, 10%), tier: which budget
     versions include it (L = Luxe for Less, S = Signature, U = Ultra Luxe). */
  var CATEGORIES = {
    venue:        { name: 'Venue rental', group: 'Venue', fixed: [400, 1800], perGuest: [5, 15], tier: 'LSU', taxable: true },
    privateDining:{ name: 'Private dining (food and drink minimum)', group: 'Venue', perGuest: [40, 75], tier: 'LSU', taxable: true, service: true, tip: false },
    catering:     { name: 'Catering', group: 'Food and drink', perGuest: [22, 50], tier: 'LSU', taxable: true, service: true },
    bar:          { name: 'Bar and drinks', group: 'Food and drink', perGuest: [10, 25], tier: 'LSU', taxable: true },
    bartender:    { name: 'Bartender', group: 'Food and drink', perHour: [40, 65], tier: 'SU', tip: true, staffPer: 75 },
    cake:         { name: 'Cake and desserts', group: 'Food and drink', fixed: [40, 100], perGuest: [2.5, 6], tier: 'LSU', taxable: true },
    rentals:      { name: 'Rentals (tables, chairs, linens, tableware)', group: 'Setup', perGuest: [6, 16], tier: 'LSU', taxable: true },
    decor:        { name: 'Decor and styling', group: 'Style', fixed: [150, 800], perGuest: [1.5, 6], tier: 'LSU', taxable: true },
    balloons:     { name: 'Balloon installation', group: 'Style', fixed: [150, 700], tier: 'LSU', taxable: true },
    florals:      { name: 'Florals', group: 'Style', fixed: [120, 700], perGuest: [2, 8], tier: 'SU', taxable: true },
    lighting:     { name: 'Lighting and uplighting', group: 'Style', fixed: [300, 1500], tier: 'U', taxable: true },
    photographer: { name: 'Photographer', group: 'Memories', perHour: [125, 275], tier: 'SU', tip: true },
    videographer: { name: 'Videographer', group: 'Memories', perHour: [150, 320], tier: 'U', tip: true },
    photoBooth:   { name: 'Photo booth', group: 'Memories', fixed: [400, 1000], tier: 'U' },
    dj:           { name: 'DJ', group: 'Music and fun', perHour: [100, 200], tier: 'SU', tip: true },
    liveMusic:    { name: 'Live music', group: 'Music and fun', perHour: [300, 900], tier: 'U', tip: true },
    mc:           { name: 'MC or host', group: 'Music and fun', fixed: [300, 900], tier: 'U', tip: true },
    entertainment:{ name: 'Entertainment or activity', group: 'Music and fun', fixed: [200, 900], tier: 'U' },
    kids:         { name: "Kids' entertainment", group: 'Music and fun', fixed: [200, 600], tier: 'SU' },
    hairMakeup:   { name: 'Hair and makeup', group: 'Look', perPerson: [110, 260], people: 1, tier: 'SU', tip: true },
    attire:       { name: 'Attire', group: 'Look', fixed: [150, 600], tier: 'LSU', taxable: true },
    invitations:  { name: 'Printed invitations and postage', group: 'Paper', perGuest: [2.5, 7], tier: 'U', taxable: true },
    favors:       { name: 'Favors and welcome bags', group: 'Paper', perGuest: [3, 10], tier: 'SU', taxable: true },
    transport:    { name: 'Transportation', group: 'Logistics', fixed: [400, 1600], tier: 'U' },
    officiant:    { name: 'Officiant', group: 'Logistics', fixed: [300, 800], tier: 'LSU' },
    security:     { name: 'Security', group: 'Logistics', perHour: [40, 70], tier: 'U', staffPer: 100 },
    coordinator:  { name: 'Day-of coordinator', group: 'Logistics', fixed: [600, 2500], tier: 'U' },
    cleanup:      { name: 'Setup and cleanup crew', group: 'Logistics', fixed: [100, 450], tier: 'SU' },
    parking:      { name: 'Parking and valet', group: 'Logistics', perGuest: [4, 12], tier: 'U' },
    insurance:    { name: 'Event insurance', group: 'Logistics', fixed: [100, 300], tier: 'U' },
    tent:         { name: 'Tent', group: 'Outdoor', perGuest: [8, 24], tier: 'LSU', taxable: true, outdoor: true },
    restrooms:    { name: 'Restroom trailer', group: 'Outdoor', fixed: [300, 1400], tier: 'SU', outdoor: true },
    generator:    { name: 'Generator', group: 'Outdoor', fixed: [300, 900], tier: 'SU', outdoor: true },
    permits:      { name: 'Permits', group: 'Outdoor', fixed: [50, 450], tier: 'LSU', outdoor: true },
    /* Cultural weddings: traditions with their own vendors. "flat" prices don't grow with the guest count. */
    zaffe:        { name: 'Zaffe group (drums, dancers and the grand entrance)', group: 'Music and fun', fixed: [900, 2800], flat: true, tier: 'LSU', tip: true },
    singer:       { name: 'Wedding singer', group: 'Music and fun', fixed: [900, 3500], flat: true, tier: 'LSU', tip: true },
    dabke:        { name: 'Dabke dance troupe', group: 'Music and fun', fixed: [600, 1800], flat: true, tier: 'U', tip: true },
    kosha:        { name: 'Kosha (the couple\u2019s stage and seating)', group: 'Style', fixed: [900, 4000], flat: true, tier: 'LSU', taxable: true },
    dhol:         { name: 'Dhol player', group: 'Music and fun', fixed: [300, 900], flat: true, tier: 'LSU', tip: true },
    mandap:       { name: 'Mandap (ceremony canopy and decor)', group: 'Style', fixed: [1500, 6500], flat: true, tier: 'LSU', taxable: true },
    mehndi:       { name: 'Mehndi (henna) artist for the bride and guests', group: 'Look', fixed: [350, 1400], flat: true, tier: 'LSU', tip: true },
    baraat:       { name: 'Baraat (the groom\u2019s horse or car arrival)', group: 'Logistics', fixed: [900, 2800], flat: true, tier: 'SU' },
    sofreh:       { name: 'Sofreh aghd (the ceremony spread)', group: 'Style', fixed: [800, 3500], flat: true, tier: 'LSU', taxable: true },
    qawwali:      { name: 'Qawwali group', group: 'Music and fun', fixed: [1200, 4000], flat: true, tier: 'LSU', tip: true },
    mariachi:     { name: 'Mariachi band', group: 'Music and fun', fixed: [600, 1800], flat: true, tier: 'LSU', tip: true },
    lionDance:    { name: 'Lion dance troupe', group: 'Music and fun', fixed: [600, 1600], flat: true, tier: 'LSU', tip: true },
    teaCeremony:  { name: 'Tea ceremony set and setup', group: 'Style', fixed: [150, 700], flat: true, tier: 'LSU', taxable: true },
    giftTrays:    { name: 'M\u00e2m qu\u1ea3 gift trays (betel, fruit, sweets, tea)', group: 'Style', fixed: [300, 1200], flat: true, tier: 'LSU', taxable: true },
    pyebaek:      { name: 'Pyebaek ceremony set and hanbok rental', group: 'Look', fixed: [400, 1500], flat: true, tier: 'LSU', taxable: true },
    sponsors:     { name: 'Veil, cord and coins for the sponsors\u2019 rites', group: 'Style', fixed: [100, 400], flat: true, tier: 'LSU', taxable: true },
    gele:         { name: 'Gele tying for the bride and family', group: 'Look', fixed: [150, 600], flat: true, tier: 'LSU', tip: true },
    stefana:      { name: 'Stefana crowns and koumbaro gifts', group: 'Style', fixed: [150, 500], flat: true, tier: 'LSU', taxable: true },
    lazo:         { name: 'Lazo, arras and padrinos gifts', group: 'Style', fixed: [80, 350], flat: true, tier: 'LSU', taxable: true },
    flamenco:     { name: 'Flamenco or rumba group', group: 'Music and fun', fixed: [800, 2500], flat: true, tier: 'LSU', tip: true },
    jamon:        { name: 'Jam\u00f3n carver station', group: 'Food and drink', fixed: [600, 1800], flat: true, tier: 'LSU', taxable: true },
    karavai:      { name: 'Karavai bread for the bread-and-salt welcome', group: 'Food and drink', fixed: [80, 250], flat: true, tier: 'LSU', taxable: true },
    negafa:       { name: 'Negafa: outfit changes, jewelry and the amariya', group: 'Look', fixed: [1500, 5000], flat: true, tier: 'LSU', tip: true },
    gospel:       { name: 'Gospel choir or soloist', group: 'Music and fun', fixed: [400, 2500], flat: true, tier: 'LSU', tip: true },
    broom:        { name: 'Jumping the broom: keepsake broom', group: 'Style', fixed: [60, 250], flat: true, tier: 'LSU', taxable: true },
    libation:     { name: 'Libation ceremony (elder or officiant, vessel and offering)', group: 'Style', fixed: [100, 450], flat: true, tier: 'LSU' },
    elements:     { name: 'Tasting the four elements set', group: 'Style', fixed: [40, 150], flat: true, tier: 'LSU', taxable: true },
    kente:        { name: 'Kente stoles or accents for the wedding party', group: 'Look', fixed: [150, 700], flat: true, tier: 'LSU', taxable: true },
    secondLine:   { name: 'Second line brass band and parade', group: 'Music and fun', fixed: [1200, 3500], flat: true, tier: 'LSU', tip: true },
    dakka:        { name: 'Dakka marrakchia or Andalusian band', group: 'Music and fun', fixed: [1000, 3500], flat: true, tier: 'LSU', tip: true },
    /* Restaurant, ordering from the menu: no venue, catering or rentals. Lunch and brunch cost about 20% less than dinner. */
    restaurantFood:   { name: 'Meals ordered from the menu', group: 'Food and drink', perGuest: [26, 42], tier: 'LSU', taxable: true, gratuity: true, meal: true },
    restaurantDrinks: { name: 'Drinks (about two per person)', group: 'Food and drink', perGuest: [12, 22], tier: 'LSU', taxable: true, gratuity: true, meal: true },
    cakeFee:          { name: 'Cake-cutting fee (if you bring a cake)', group: 'Food and drink', perGuest: [1.5, 4], tier: 'LSU' },
    tableDecor:       { name: 'Table decor (small centerpiece, candles, confetti)', group: 'Style', fixed: [30, 120], perGuest: [1, 3], tier: 'LSU', taxable: true }
  };

  /* Which categories each event style uses. */
  var PROFILES = {
    dining:  ['privateDining', 'cake', 'decor', 'balloons', 'florals', 'photographer', 'favors', 'attire', 'hairMakeup', 'lighting', 'transport', 'invitations'],
    shower:  ['venue', 'catering', 'bar', 'cake', 'rentals', 'decor', 'balloons', 'florals', 'photographer', 'entertainment', 'favors', 'invitations', 'cleanup', 'attire', 'hairMakeup', 'photoBooth', 'lighting'],
    party:   ['venue', 'catering', 'bar', 'bartender', 'cake', 'rentals', 'decor', 'balloons', 'florals', 'dj', 'photographer', 'photoBooth', 'entertainment', 'favors', 'invitations', 'cleanup', 'attire', 'hairMakeup', 'lighting', 'videographer', 'mc', 'insurance', 'security', 'transport', 'parking'],
    gala:    ['venue', 'catering', 'bar', 'bartender', 'cake', 'rentals', 'decor', 'balloons', 'florals', 'lighting', 'dj', 'liveMusic', 'mc', 'photographer', 'videographer', 'photoBooth', 'entertainment', 'favors', 'invitations', 'attire', 'hairMakeup', 'transport', 'security', 'coordinator', 'cleanup', 'insurance', 'parking'],
    wedding: ['venue', 'catering', 'bar', 'bartender', 'cake', 'rentals', 'decor', 'florals', 'lighting', 'dj', 'liveMusic', 'mc', 'photographer', 'videographer', 'photoBooth', 'favors', 'invitations', 'attire', 'hairMakeup', 'officiant', 'transport', 'security', 'coordinator', 'cleanup', 'insurance', 'parking'],
    /* Where the event happens can override the event type. */
    restaurant:  ['restaurantFood', 'restaurantDrinks', 'cake', 'cakeFee', 'tableDecor', 'photographer', 'favors'],
    privateRoom: ['privateDining', 'cake', 'cakeFee', 'decor', 'florals', 'balloons', 'photographer', 'favors', 'invitations']
  };
  /* Per-setting limits: which budget versions include an item, and short bookings. */
  var SETTINGS = [
    { id: 'restaurant', name: 'Restaurant, ordering from the menu', short: 'Restaurant' },
    { id: 'privateRoom', name: 'Private room at a restaurant', short: 'Private room' },
    { id: 'indoor', name: 'Event venue', short: 'Event venue' },
    { id: 'outdoor', name: 'Outdoors', short: 'Outdoors' },
    { id: 'home', name: 'At home', short: 'At home' }
  ];
  var SETTING_RULES = {
    restaurant: { tiers: { photographer: 'U', favors: 'U', tableDecor: 'LSU' }, hours: { photographer: 2 } },
    privateRoom: { tiers: { balloons: 'SU', florals: 'SU', photographer: 'SU', favors: 'U', invitations: 'U' }, hours: { photographer: 2 } }
  };

  /* Event-specific adjustments (multipliers on the Signature range). */
  var ADJUST = {
    wedding: { venue: 2.6, catering: 1.6, cake: 1.5, florals: 3, attire: 5, decor: 1.5, people: { hairMakeup: 5 }, hours: { photographer: 8, videographer: 8, dj: 5 } },
    quince: { venue: 1.6, florals: 1.6, attire: 2.5, people: { hairMakeup: 3 }, hours: { photographer: 5 } },
    gala: { venue: 1.8, catering: 1.4, lighting: 1.5 },
    'bridal-shower': { people: { hairMakeup: 1 } },
    bachelorette: { people: { hairMakeup: 4 }, transport: 1.4 },
    milestone: { venue: 1.3, decor: 1.3 },
    'baby-shower': {}, brunch: {}, dinner: {}, birthday: {}
  };

  /* Cultural weddings: each tradition's music choices, the vendors it always has, and what lines are called. */
  var CULTURES = {
    arabic: {
      name: 'Arabic wedding', guests: 250, hours: 6, menu: 'arabic', blurb: 'Zaffe entrance, live band and singer, the kosha, dabke and a mezze-to-knafeh menu.', pre: 'With the blessing of God and their families',
      music: [['zaffe', 'Zaffe group'], ['liveMusic', 'Live band'], ['singer', 'Singer'], ['dj', 'DJ'], ['dabke', 'Dabke troupe']], musicDefault: ['zaffe', 'liveMusic', 'dj'],
      add: ['kosha'],
      labels: { liveMusic: 'Live band (Arabic music)', singer: 'Arabic wedding singer', officiant: 'Officiant (sheikh or priest)', catering: 'Middle Eastern catering', cake: 'Wedding cake and Arabic sweets', dj: 'DJ (Arabic and international music)' },
      search: { liveMusic: 'arabic wedding band', singer: 'arabic wedding singer', dj: 'arabic wedding DJ', zaffe: 'zaffe group wedding', dabke: 'dabke dance group', kosha: 'wedding kosha stage decor', catering: 'middle eastern mediterranean catering', cake: 'arabic sweets bakery', officiant: 'sheikh imam or priest wedding officiant' },
      hint: 'arabic,arab,lebanese,middle eastern,mediterranean,zaffe,zaffa,kosha',
      moments: [[-30, 'Guests arrive and are seated'], [0, 'Zaffe: drums and dancers lead the couple in'], [20, 'The couple takes their seats at the kosha'], [40, 'First dance'], [60, 'Dinner'], [120, 'Dabke and dancing'], [180, 'Cake cutting and sweets'], ['end', 'Send-off']],
      /* The same traditions for the engagement party (khutbe or katb el kitab). */
      engagement: {
        name: 'Arabic engagement party', guests: 150, hours: 5, blurb: 'Khutbe or katb el kitab, a zaffe entrance, the ring exchange, an Arabic singer and dabke.', pre: 'With the blessing of God and their families',
        musicDefault: ['zaffe', 'singer', 'dj'],
        labels: { singer: 'Arabic singer', officiant: 'Sheikh or priest (if katb el kitab)', cake: 'Engagement cake and Arabic sweets' },
        moments: [[-30, 'Guests arrive and are seated'], [0, 'Zaffe: drums and dancers lead the couple in'], [20, 'The couple takes their seats at the kosha'], [30, 'Katb el kitab or the families\u2019 blessing'], [50, 'Ring exchange'], [70, 'Dinner'], [130, 'Arabic singer, dabke and dancing'], [190, 'Cake cutting and sweets'], ['end', 'Send-off']]
      }
    },
    indian: {
      name: 'Indian wedding', guests: 300, hours: 7, menu: 'indian', blurb: 'Baraat with dhol, the mandap, mehndi artist, Bollywood DJ and a full Indian menu.', pre: 'With the blessings of their families',
      music: [['dhol', 'Dhol player'], ['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dhol', 'dj'],
      add: ['mandap', 'mehndi', 'baraat'],
      labels: { officiant: 'Pandit (priest) for the ceremony', catering: 'Indian catering', dj: 'DJ (Bollywood and bhangra)', liveMusic: 'Live band (Indian music)', singer: 'Wedding singer (Indian music)', cake: 'Wedding cake and mithai' },
      search: { dhol: 'dhol player', dj: 'indian wedding DJ', liveMusic: 'indian wedding band', singer: 'indian wedding singer', mandap: 'mandap decor rental', mehndi: 'mehndi henna artist', baraat: 'baraat horse rental', catering: 'indian wedding catering', officiant: 'hindu priest pandit wedding', cake: 'indian sweets mithai', photographer: 'indian wedding photographer', hairMakeup: 'indian bridal makeup artist', decor: 'indian wedding decor' },
      hint: 'indian,desi,south asian,bollywood,punjabi,dhol,mandap,mehndi,henna',
      moments: [[-60, 'Baraat: the groom arrives with dhol and dancing'], [-15, 'Milni: the families greet each other'], [0, 'Ceremony at the mandap'], [90, 'Cocktail hour and appetizers'], [150, 'Grand entrance and dinner'], [210, 'Speeches and first dance'], [240, 'Dancing'], ['end', 'Vidaai: the send-off']]
    },
    persian: {
      name: 'Persian wedding', guests: 200, hours: 6, menu: 'persian', blurb: 'Sofreh aghd, the aghd ceremony, live Persian music, the knife dance and jeweled rice.',
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dj', 'liveMusic'],
      add: ['sofreh'],
      labels: { officiant: 'Aghd officiant', catering: 'Persian catering', dj: 'DJ (Persian and international music)', liveMusic: 'Live band (Persian music)', singer: 'Persian wedding singer', cake: 'Wedding cake and Persian sweets' },
      search: { dj: 'persian wedding DJ', liveMusic: 'persian wedding band', singer: 'persian wedding singer', sofreh: 'sofreh aghd', catering: 'persian catering', officiant: 'persian aghd officiant', cake: 'persian bakery sweets' },
      hint: 'persian,iranian,sofreh,aghd',
      moments: [[-30, 'Guests arrive'], [0, 'Aghd ceremony at the sofreh'], [45, 'Sugar rubbed over a cloth held above the couple, and blessings'], [75, 'Grand entrance'], [90, 'Dinner'], [150, 'Knife dance and cake cutting'], [180, 'Dancing'], ['end', 'Send-off']]
    },
    pakistani: {
      name: 'Pakistani wedding', guests: 300, hours: 6, menu: 'pakistani', blurb: 'Nikah with an imam, the baraat with dhol, a stage for the couple, qawwali and the rukhsati.',
      music: [['dhol', 'Dhol player'], ['dj', 'DJ'], ['qawwali', 'Qawwali group'], ['singer', 'Singer'], ['liveMusic', 'Live band']], musicDefault: ['dhol', 'dj'],
      add: ['kosha', 'mehndi'], pre: 'With the blessings of their families',
      labels: { kosha: 'Stage and seating for the couple', officiant: 'Imam or maulvi for the nikah', catering: 'Pakistani catering', dj: 'DJ (Punjabi, Bollywood and pop)', cake: 'Wedding cake and mithai', mehndi: 'Mehndi (henna) artist for the bride and family' },
      search: { dhol: 'dhol player', dj: 'pakistani wedding DJ', qawwali: 'qawwali group', singer: 'pakistani wedding singer', kosha: 'pakistani wedding stage decor', mehndi: 'mehndi henna artist', catering: 'pakistani catering', officiant: 'imam nikah officiant', cake: 'pakistani sweets mithai', photographer: 'pakistani wedding photographer', hairMakeup: 'pakistani bridal makeup artist', decor: 'pakistani wedding decor' },
      hint: 'pakistani,desi,south asian,nikah,mehndi,dhol,halal',
      moments: [[-60, 'Baraat: the groom and his family arrive with dhol'], [0, 'Nikah ceremony'], [45, 'The couple takes the stage'], [75, 'Dinner'], [150, 'Photos with family and friends'], [180, 'Music and dancing'], ['end', 'Rukhsati: the bride\u2019s send-off']]
    },
    mexican: {
      name: 'Mexican wedding', guests: 200, hours: 6, menu: 'mexican', blurb: 'Padrinos, the lazo and arras, mariachi, the v\u00edbora de la mar and the money dance.',
      music: [['mariachi', 'Mariachi'], ['liveMusic', 'Banda or live band'], ['dj', 'DJ']], musicDefault: ['mariachi', 'dj'],
      add: ['lazo'], pre: 'Together with their families and padrinos',
      labels: { officiant: 'Priest or officiant', catering: 'Mexican catering', liveMusic: 'Banda or live band', dj: 'DJ (Latin and pop)', cake: 'Wedding cake and Mexican sweets' },
      search: { mariachi: 'mariachi band', liveMusic: 'banda musical para bodas', dj: 'latin wedding DJ', catering: 'mexican catering', officiant: 'catholic wedding priest', cake: 'mexican bakery wedding cake', lazo: 'wedding lazo arras', photographer: 'latino wedding photographer' },
      hint: 'mexican,latino,latina,hispanic,boda,mariachi,taqueria',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony with the lazo and arras'], [45, 'Cocktail hour with mariachi'], [105, 'Grand entrance and dinner'], [165, 'First dance and the money dance'], [195, 'La v\u00edbora de la mar'], [225, 'Cake and dancing'], ['end', 'Send-off']]
    },
    chinese: {
      name: 'Chinese wedding', guests: 200, hours: 5, menu: 'chinese', blurb: 'Tea ceremony, red and gold, the door games, a banquet of many courses and lion dancers.',
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['lionDance', 'Lion dance troupe']], musicDefault: ['dj', 'lionDance'],
      add: ['teaCeremony'], pre: 'Together with their families',
      labels: { catering: 'Chinese banquet (8 to 10 courses)', cake: 'Wedding cake and Chinese desserts', decor: 'Red and gold decor with double happiness' },
      search: { lionDance: 'lion dance troupe', dj: 'chinese wedding DJ', liveMusic: 'wedding band', catering: 'chinese banquet restaurant', teaCeremony: 'chinese tea ceremony set', cake: 'chinese bakery', photographer: 'chinese wedding photographer', decor: 'chinese wedding decor', hairMakeup: 'asian bridal makeup artist' },
      hint: 'chinese,cantonese,mandarin,banquet,dim sum,tea ceremony',
      moments: [[-90, 'Tea ceremony with both families'], [-15, 'Guests arrive; red envelopes go in the box'], [0, 'Lion dance welcome'], [30, 'Grand entrance'], [45, 'Banquet begins, course by course'], [120, 'Toasts and table visits'], [150, 'Outfit change into a qipao'], [180, 'Cake and dancing'], ['end', 'Send-off']]
    },
    vietnamese: {
      name: 'Vietnamese wedding', guests: 250, hours: 5, menu: 'vietnamese', blurb: 'The procession with gift trays, a tea ceremony at the family altar, \u00e1o d\u00e0i and a banquet.',
      music: [['dj', 'DJ'], ['singer', 'Singer'], ['liveMusic', 'Live band']], musicDefault: ['dj', 'singer'],
      add: ['giftTrays', 'teaCeremony'], pre: 'Together with their families',
      labels: { catering: 'Vietnamese banquet (multi-course)', cake: 'Wedding cake and Vietnamese desserts', singer: 'Wedding singer (Vietnamese and English)' },
      search: { dj: 'vietnamese wedding DJ', singer: 'vietnamese wedding singer', catering: 'vietnamese banquet restaurant', giftTrays: 'mam qua wedding trays', teaCeremony: 'vietnamese tea ceremony set', photographer: 'vietnamese wedding photographer', hairMakeup: 'asian bridal makeup artist', attire: 'ao dai boutique' },
      hint: 'vietnamese,viet,ao dai,banquet,pho',
      moments: [[-120, 'Procession with gift trays to the bride\u2019s home'], [-90, 'Tea ceremony at the family altar'], [0, 'Guests arrive at the reception'], [30, 'Grand entrance'], [45, 'Banquet, course by course'], [120, 'Toasts and table visits by the couple'], [150, 'Cake and dancing'], ['end', 'Send-off']]
    },
    korean: {
      name: 'Korean wedding', guests: 200, hours: 4, menu: 'korean', blurb: 'A pyebaek ceremony in hanbok with chestnuts and dates, then dinner and dancing.',
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dj'],
      add: ['pyebaek'], pre: 'Together with their families',
      labels: { catering: 'Korean catering', cake: 'Wedding cake and rice cakes (tteok)' },
      search: { dj: 'korean wedding DJ', pyebaek: 'pyebaek ceremony hanbok rental', catering: 'korean catering', cake: 'korean bakery', photographer: 'korean wedding photographer', hairMakeup: 'korean bridal makeup artist' },
      hint: 'korean,hanbok,pyebaek,kbbq',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony'], [40, 'Pyebaek in hanbok with the families'], [90, 'Grand entrance and dinner'], [150, 'Toasts and first dance'], [180, 'Cake and dancing'], ['end', 'Send-off']]
    },
    filipino: {
      name: 'Filipino wedding', guests: 200, hours: 6, menu: 'filipino', blurb: 'Veil, cord and coin sponsors, the money dance, a live band and lechon.',
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dj', 'singer'],
      add: ['sponsors'], pre: 'Together with their families and principal sponsors',
      labels: { catering: 'Filipino catering (with lechon)', cake: 'Wedding cake and Filipino desserts', officiant: 'Priest or officiant' },
      search: { dj: 'filipino wedding DJ', singer: 'filipino wedding singer', catering: 'filipino catering lechon', cake: 'filipino bakery ube cake', photographer: 'filipino wedding photographer', officiant: 'catholic wedding priest' },
      hint: 'filipino,pinoy,lechon,ninong,ninang',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony with the veil, cord and coins'], [60, 'Cocktail hour'], [105, 'Grand entrance and dinner'], [165, 'First dance and the money dance'], [195, 'Cake and dancing'], ['end', 'Send-off']]
    },
    nigerian: {
      name: 'Nigerian wedding', guests: 300, hours: 6, menu: 'nigerian', blurb: 'Aso ebi for guests, gele, a lively MC, a live band, spraying money and jollof.',
      music: [['liveMusic', 'Live band (highlife or juju)'], ['dj', 'DJ'], ['singer', 'Singer']], musicDefault: ['liveMusic', 'dj'],
      add: ['gele', 'mc'], pre: 'Together with their families',
      labels: { catering: 'Nigerian catering', liveMusic: 'Live band (highlife or juju)', dj: 'DJ (Afrobeats and more)', mc: 'MC to run the reception', cake: 'Wedding cake and small chops' },
      search: { liveMusic: 'nigerian live band', dj: 'afrobeats wedding DJ', mc: 'nigerian wedding MC', catering: 'nigerian catering', gele: 'gele tying stylist', photographer: 'nigerian wedding photographer', hairMakeup: 'nigerian bridal makeup artist', decor: 'nigerian wedding decor' },
      hint: 'nigerian,naija,yoruba,igbo,african,afrobeats,aso ebi',
      moments: [[-30, 'Guests arrive in aso ebi'], [0, 'Grand entrance of the families'], [30, 'The couple dances in as guests spray money'], [60, 'Dinner'], [120, 'Toasts and the cake'], [150, 'Dancing and spraying'], ['end', 'Send-off']]
    },
    africanamerican: {
      name: 'African American wedding', guests: 175, hours: 6, menu: 'soul', blurb: 'Choose the traditions you love: jumping the broom, a libation ceremony, gospel, kente, line dances and a second line.',
      chipsTitle: 'Music and traditions', chipsNote: 'Pick only what you want. Each one you choose gets its own line in your budget and its own vendor options.',
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['gospel', 'Gospel choir or soloist'], ['broom', 'Jumping the broom'], ['libation', 'Libation ceremony'], ['elements', 'Tasting the four elements'], ['kente', 'Kente accents'], ['secondLine', 'Second line']], musicDefault: ['dj'],
      add: [], pre: 'Together with their families',
      labels: { catering: 'Catering (soul food or Southern)', dj: 'DJ (R&B, hip-hop and line dances)', cake: 'Wedding cake (red velvet, pound cake) and desserts' },
      search: { gospel: 'gospel choir for weddings', dj: 'wedding DJ r&b hip hop', liveMusic: 'wedding band r&b soul', catering: 'soul food catering', secondLine: 'second line brass band', kente: 'kente stole', broom: 'jumping the broom wedding broom', cake: 'wedding cake bakery', photographer: 'wedding photographer', hairMakeup: 'bridal hair and makeup artist for black women' },
      hint: 'black,african american,soul,gospel',
      moments: [[-30, 'Guests arrive'], [-5, 'Libation ceremony honoring the ancestors', 'libation'], [0, 'Ceremony'], [20, 'Tasting the four elements', 'elements'], [35, 'Jumping the broom', 'broom'], [60, 'Cocktail hour'], [105, 'Grand entrance and dinner'], [165, 'First dance and toasts'], [195, 'Line dances: the Electric Slide, the Cupid Shuffle and the Wobble'], [225, 'Cake and dancing'], ['end', 'Second line send-off', 'secondLine'], ['end', 'Send-off']]
    },
    spanish: {
      name: 'Spanish wedding', guests: 180, hours: 7, menu: 'spanish', blurb: 'The 13 arras coins and padrinos, a jam\u00f3n carver, a late dinner, detalles for guests and flamenco or rumba.',
      music: [['dj', 'DJ'], ['flamenco', 'Flamenco or rumba'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dj', 'flamenco'],
      add: ['lazo', 'jamon'], pre: 'Together with their families and padrinos',
      labels: { lazo: 'Arras (13 coins) and padrinos gifts', catering: 'Spanish catering', favors: 'Detalles (small gifts for every guest)', cake: 'Wedding cake and Spanish sweets', officiant: 'Priest or officiant' },
      search: { flamenco: 'flamenco rumba group', dj: 'spanish wedding DJ', catering: 'spanish catering tapas', jamon: 'jamon carver cortador', cake: 'spanish bakery', photographer: 'wedding photographer' },
      hint: 'spanish,spain,espanol,tapas,flamenco,paella',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony with the arras and padrinos'], [60, 'C\u00f3ctel with the jam\u00f3n carver'], [120, 'Grand entrance and dinner'], [210, 'Detalles for the guests and the tie is cut and \u201csold\u201d'], [240, 'First dance and dancing'], ['end', 'Send-off']]
    },
    russian: {
      name: 'Russian wedding', guests: 120, hours: 7, menu: 'russian', blurb: 'The bread-and-salt welcome, a tamada who runs the night, toasts, \u201cGorko!\u201d and a long feast.',
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dj', 'singer'],
      add: ['mc', 'karavai'], pre: 'Together with their families',
      labels: { mc: 'Tamada (toastmaster and host)', catering: 'Russian and Eastern European catering', singer: 'Wedding singer (Russian and English)', cake: 'Wedding cake and Russian desserts' },
      search: { mc: 'russian wedding tamada host', dj: 'russian wedding DJ', singer: 'russian wedding singer', catering: 'russian restaurant banquet', karavai: 'russian bakery karavai', cake: 'russian bakery', photographer: 'russian wedding photographer' },
      hint: 'russian,ukrainian,slavic,tamada,banquet',
      moments: [[-150, 'The bride ransom games at her home'], [0, 'Guests arrive'], [20, 'Bread-and-salt welcome with the karavai'], [40, 'The tamada opens the feast with zakuski'], [90, 'Toasts and \u201cGorko!\u201d'], [150, 'Hot dishes, games and dancing'], [240, 'Cake'], ['end', 'Send-off']]
    },
    moroccan: {
      name: 'Moroccan wedding', guests: 250, hours: 7, menu: 'moroccan', blurb: 'A negafa and several outfit changes, the amariya, dakka or Andalusian music, mint tea and pastilla.',
      music: [['dakka', 'Dakka or Andalusian band'], ['dj', 'DJ'], ['singer', 'Singer']], musicDefault: ['dakka', 'dj'],
      add: ['negafa', 'teaCeremony', 'mehndi'], pre: 'With the blessing of God and their families',
      labels: { teaCeremony: 'Moroccan mint tea service', mehndi: 'Henna artist for the henna night', catering: 'Moroccan catering', officiant: 'Imam or officiant', cake: 'Wedding cake and Moroccan pastries', kosha: 'Stage for the couple' },
      search: { dakka: 'dakka marrakchia band', dj: 'moroccan wedding DJ', singer: 'moroccan wedding singer', negafa: 'negafa moroccan wedding', catering: 'moroccan catering', teaCeremony: 'moroccan tea service', mehndi: 'henna artist', cake: 'moroccan pastries', photographer: 'moroccan wedding photographer' },
      hint: 'moroccan,maghreb,arab,negafa,takchita,kaftan,amariya',
      moments: [[-30, 'Guests arrive to mint tea and pastries'], [0, 'The couple enters on the amariya to dakka drums'], [45, 'First outfit and photos'], [90, 'Dinner: pastilla, tagine and mechoui'], [150, 'Outfit changes and dancing'], [240, 'Cake and the final outfit'], ['end', 'Send-off']]
    },
    greek: {
      name: 'Greek wedding', guests: 200, hours: 6, menu: 'greek', blurb: 'The stefana crowns and koumbaro, the Dance of Isaiah, a Greek band and the money dance.',
      music: [['liveMusic', 'Greek band (bouzouki)'], ['dj', 'DJ'], ['singer', 'Singer']], musicDefault: ['liveMusic', 'dj'],
      add: ['stefana'], pre: 'With the blessing of God and their families',
      labels: { officiant: 'Greek Orthodox priest', catering: 'Greek catering', liveMusic: 'Greek band (bouzouki)', cake: 'Wedding cake and Greek sweets' },
      search: { liveMusic: 'greek band bouzouki', dj: 'greek wedding DJ', catering: 'greek catering', officiant: 'greek orthodox church wedding', stefana: 'stefana wedding crowns', cake: 'greek bakery', photographer: 'greek wedding photographer' },
      hint: 'greek,hellenic,orthodox,bouzouki',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony with the stefana crowns and the Dance of Isaiah'], [60, 'Cocktail hour'], [105, 'Grand entrance and dinner'], [165, 'First dance and the money dance'], [195, 'Kalamatianos circle dance'], [225, 'Cake and dancing'], ['end', 'Send-off']]
    }
  };
  var TIERS = [
    { id: 'L', name: 'Luxe for Less', mult: 0.65, blurb: 'The same look with smart swaps: DIY styling, fewer hired services, simpler venue.' },
    { id: 'S', name: 'Signature', mult: 1.0, blurb: 'The balanced version: key pieces done by pros, the look kept intact.' },
    { id: 'U', name: 'Ultra Luxe', mult: 1.55, blurb: 'Full service and statement pieces: lighting, live music, coordinator, more florals.' }
  ];

  /* City cost index for planning estimates (1.00 = US average). Approximate; shown as an estimate. */
  /* Neighborhoods and nearby towns people ask for, per city (for the venue area picker). */
  var AREAS = {"Long Island, NY": ["Nassau County", "Suffolk County", "The Hamptons", "North Fork", "Garden City", "Huntington"], "Westchester, NY": ["White Plains", "Rye", "Tarrytown", "Scarsdale", "New Rochelle"], "Jersey City, NJ": ["Downtown", "Hoboken", "Weehawken", "Bayonne"], "Princeton, NJ": ["Downtown Princeton", "Lawrenceville", "Hopewell", "New Brunswick"], "Atlantic City, NJ": ["Boardwalk", "Marina District", "Cape May", "Ocean City"], "Scottsdale, AZ": ["Old Town", "North Scottsdale", "Paradise Valley", "Fountain Hills"], "Albuquerque, NM": ["Old Town", "Downtown", "Nob Hill", "Rio Rancho", "Corrales"], "Santa Fe, NM": ["Downtown Plaza", "Canyon Road", "Railyard", "Tesuque"], "Baton Rouge, LA": ["Downtown", "Mid City", "Southdowns", "Prairieville"], "Lafayette, LA": ["Downtown", "River Ranch", "Broussard", "Youngsville"], "Shreveport, LA": ["Downtown", "Bossier City", "South Highlands"], "Fort Lauderdale, FL": ["Las Olas", "Fort Lauderdale Beach", "Hollywood", "Pompano Beach", "Weston"], "Palm Beach, FL": ["Palm Beach Island", "West Palm Beach", "Boca Raton", "Delray Beach", "Jupiter", "Wellington"], "Naples, FL": ["Old Naples", "Marco Island", "Bonita Springs", "Vanderbilt Beach"], "St. Petersburg, FL": ["Downtown", "St. Pete Beach", "Clearwater", "Dunedin"], "Napa Valley, CA": ["Napa", "Yountville", "St. Helena", "Calistoga", "Sonoma"], "Santa Barbara, CA": ["Downtown", "Montecito", "Santa Ynez", "Goleta"], "Palm Springs, CA": ["Downtown", "Rancho Mirage", "Palm Desert", "La Quinta", "Indian Wells"], "Long Beach, CA": ["Downtown", "Belmont Shore", "Naples Island", "Signal Hill"], "Charleston, SC": ["Downtown", "Mount Pleasant", "Kiawah Island", "Daniel Island", "Folly Beach"], "Savannah, GA": ["Historic District", "Tybee Island", "Richmond Hill"], "Boulder, CO": ["Downtown", "Pearl Street", "Louisville", "Lyons"], "Colorado Springs, CO": ["Downtown", "Broadmoor", "Manitou Springs", "Monument"], "Cincinnati, OH": ["Downtown", "Over-the-Rhine", "Hyde Park", "Northern Kentucky"], "Cleveland, OH": ["Downtown", "Ohio City", "Tremont", "Westlake", "Beachwood"], "Richmond, VA": ["Downtown", "The Fan", "Scott's Addition", "Short Pump"], "Louisville, KY": ["Downtown", "NuLu", "Highlands", "St. Matthews"], "Birmingham, AL": ["Downtown", "Mountain Brook", "Homewood", "Hoover"], "Asheville, NC": ["Downtown", "River Arts District", "Biltmore Village", "Weaverville"], "Buffalo, NY": ["Downtown", "Elmwood Village", "Niagara Falls", "Orchard Park"], "Hartford, CT": ["Downtown", "West Hartford", "Glastonbury", "Farmington"], "Providence, RI": ["Downtown", "Federal Hill", "Newport", "East Side"], "Reno, NV": ["Downtown", "Midtown", "Lake Tahoe", "Sparks"], "Durham, NC": ["Downtown", "Chapel Hill", "Southpoint"], "El Paso, TX": ["Downtown", "West Side", "Las Cruces"], "Omaha, NE": ["Old Market", "Midtown", "West Omaha"], "Tulsa, OK": ["Downtown", "Brookside", "Cherry Street", "Broken Arrow"], "Anchorage, AK": ["Downtown", "Midtown", "Girdwood", "Eagle River"], "Toronto, ON": ["Downtown", "Yorkville", "King West", "Distillery District", "Mississauga", "Vaughan", "Markham", "Oakville"], "Ottawa, ON": ["Downtown", "ByWard Market", "The Glebe", "Kanata", "Orléans", "Gatineau"], "Hamilton, ON": ["Downtown", "Burlington", "Ancaster", "Dundas", "Stoney Creek"], "Montreal, QC": ["Old Montreal", "Downtown", "Plateau", "Westmount", "Laval", "West Island", "Longueuil"], "Quebec City, QC": ["Old Quebec", "Sainte-Foy", "Beauport", "Lévis"], "Vancouver, BC": ["Downtown", "Yaletown", "Gastown", "Kitsilano", "North Vancouver", "Burnaby", "Richmond", "Surrey"], "Victoria, BC": ["Downtown", "Oak Bay", "Saanich", "Langford"], "Calgary, AB": ["Downtown", "Beltline", "Inglewood", "Kensington", "Mission", "Canmore"], "Edmonton, AB": ["Downtown", "Old Strathcona", "Oliver", "St. Albert", "Sherwood Park"], "Winnipeg, MB": ["Downtown", "Exchange District", "St. Boniface", "Osborne Village"], "Saskatoon, SK": ["Downtown", "Broadway", "Riversdale", "Stonebridge"], "Halifax, NS": ["Downtown", "North End", "Dartmouth", "Bedford"], "Atlanta, GA": ["Buckhead", "Midtown", "Downtown", "Inman Park", "West Midtown", "Alpharetta", "Decatur", "Marietta"], "Austin, TX": ["Downtown", "South Congress", "East Austin", "The Domain", "Westlake", "Lake Travis", "Round Rock", "Dripping Springs"], "Baltimore, MD": ["Inner Harbor", "Fells Point", "Mount Vernon", "Canton", "Towson", "Columbia"], "Boston, MA": ["Back Bay", "Seaport", "Beacon Hill", "North End", "Cambridge", "Brookline"], "Charlotte, NC": ["Uptown", "SouthPark", "South End", "NoDa", "Ballantyne", "Lake Norman"], "Chicago, IL": ["The Loop", "River North", "West Loop", "Gold Coast", "Lincoln Park", "Wicker Park", "Evanston", "Oak Brook"], "Columbus, OH": ["Short North", "German Village", "Downtown", "Easton", "Dublin"], "Dallas, TX": ["Uptown", "Downtown", "Highland Park", "Deep Ellum", "Design District", "Bishop Arts", "Plano", "Frisco", "Las Colinas"], "Denver, CO": ["LoDo", "RiNo", "Cherry Creek", "Highlands", "Downtown", "Boulder"], "Detroit, MI": ["Downtown", "Midtown", "Corktown", "Birmingham", "Royal Oak", "Grosse Pointe"], "Fort Worth, TX": ["Downtown", "Sundance Square", "Cultural District", "Stockyards", "Southlake", "Grapevine"], "Honolulu, HI": ["Waikiki", "Kakaako", "Ko Olina", "Kahala", "North Shore"], "Houston, TX": ["Galleria / Uptown", "River Oaks", "Downtown", "Montrose", "The Heights", "Museum District", "Memorial", "Katy", "Sugar Land", "The Woodlands", "Pearland", "Clear Lake"], "Indianapolis, IN": ["Downtown", "Mass Ave", "Broad Ripple", "Carmel", "Fishers"], "Jacksonville, FL": ["Downtown", "San Marco", "Riverside", "Jacksonville Beach", "Ponte Vedra"], "Kansas City, MO": ["Country Club Plaza", "Crossroads", "Power and Light", "Westport", "Overland Park"], "Las Vegas, NV": ["The Strip", "Downtown", "Summerlin", "Henderson", "Lake Las Vegas"], "Los Angeles, CA": ["Beverly Hills", "Downtown LA", "West Hollywood", "Hollywood", "Santa Monica", "Pasadena", "Malibu", "Long Beach", "Calabasas"], "Memphis, TN": ["Downtown", "Midtown", "East Memphis", "Germantown", "Collierville"], "Miami, FL": ["Brickell", "South Beach", "Coral Gables", "Wynwood", "Coconut Grove", "Downtown", "Fort Lauderdale"], "Milwaukee, WI": ["Third Ward", "Downtown", "East Side", "Brookfield", "Wauwatosa"], "Minneapolis, MN": ["Downtown", "North Loop", "Uptown", "St. Paul", "Edina", "Wayzata"], "Nashville, TN": ["Downtown", "The Gulch", "12 South", "East Nashville", "Germantown", "Franklin", "Brentwood"], "New Orleans, LA": ["French Quarter", "Garden District", "Warehouse District", "Uptown", "Marigny", "Metairie"], "New York, NY": ["Midtown", "Upper East Side", "Tribeca", "SoHo", "Chelsea", "Brooklyn", "Williamsburg", "Queens", "Long Island", "Westchester"], "Newark, NJ": ["Downtown", "Ironbound", "Montclair", "Short Hills", "Jersey City", "Hoboken"], "Oakland, CA": ["Downtown", "Jack London Square", "Rockridge", "Piedmont", "Berkeley", "Walnut Creek"], "Oklahoma City, OK": ["Bricktown", "Midtown", "Plaza District", "Nichols Hills", "Edmond"], "Orange County, CA": ["Newport Beach", "Irvine", "Laguna Beach", "Costa Mesa", "Huntington Beach", "Dana Point", "San Juan Capistrano", "San Clemente", "Laguna Niguel", "Mission Viejo", "Tustin", "Orange", "Santa Ana", "Anaheim", "Fullerton", "Yorba Linda"], "Orlando, FL": ["Downtown", "Winter Park", "Lake Nona", "Dr. Phillips", "Kissimmee", "Lake Buena Vista"], "Philadelphia, PA": ["Center City", "Rittenhouse", "Old City", "Fishtown", "Main Line", "Manayunk"], "Phoenix, AZ": ["Scottsdale", "Downtown", "Arcadia", "Paradise Valley", "Tempe", "Chandler"], "Pittsburgh, PA": ["Downtown", "Strip District", "Lawrenceville", "Shadyside", "North Shore", "Sewickley"], "Portland, OR": ["Pearl District", "Downtown", "Alberta Arts", "Lake Oswego", "Willamette Valley"], "Raleigh, NC": ["Downtown", "North Hills", "Durham", "Chapel Hill", "Cary", "Wake Forest"], "Sacramento, CA": ["Midtown", "Downtown", "East Sacramento", "Folsom", "Roseville"], "Salt Lake City, UT": ["Downtown", "Sugar House", "Park City", "Draper", "Provo"], "San Antonio, TX": ["River Walk", "Pearl District", "Alamo Heights", "Stone Oak", "Downtown", "Boerne"], "San Diego, CA": ["Gaslamp Quarter", "La Jolla", "Little Italy", "Coronado", "Del Mar", "Rancho Santa Fe"], "San Francisco, CA": ["Union Square", "SoMa", "Marina", "Nob Hill", "Embarcadero", "Napa Valley", "Sausalito"], "San Jose, CA": ["Downtown", "Santana Row", "Willow Glen", "Palo Alto", "Los Gatos", "Saratoga"], "Seattle, WA": ["Downtown", "Capitol Hill", "Fremont", "South Lake Union", "Bellevue", "Kirkland", "Woodinville"], "St. Louis, MO": ["Downtown", "Central West End", "Clayton", "Soulard", "Chesterfield"], "Tampa, FL": ["Downtown", "Hyde Park", "Ybor City", "Channelside", "St. Petersburg", "Clearwater"], "Tucson, AZ": ["Downtown", "Catalina Foothills", "Oro Valley", "University Area"], "Washington, DC": ["Georgetown", "Downtown", "Dupont Circle", "The Wharf", "Capitol Hill", "Arlington", "Bethesda", "Alexandria"]};
  /* Canadian sales tax by province or territory (2026 general rates). */
  var PROVINCES = {
    AB: { tax: 5, label: 'GST' }, BC: { tax: 12, label: 'GST and PST' }, MB: { tax: 12, label: 'GST and PST' }, NB: { tax: 15, label: 'HST' },
    NL: { tax: 15, label: 'HST' }, NS: { tax: 14, label: 'HST' }, NT: { tax: 5, label: 'GST' }, NU: { tax: 5, label: 'GST' }, ON: { tax: 13, label: 'HST' },
    PE: { tax: 15, label: 'HST' }, QC: { tax: 14.975, label: 'GST and QST' }, SK: { tax: 11, label: 'GST and PST' }, YT: { tax: 5, label: 'GST' }
  };
  var CITIES = [
    ['Albany, NY', 0.95, 8], ['Albuquerque, NM', 0.9, 7.625], ['Anchorage, AK', 1.15, 0], ['Asheville, NC', 1, 7],
    ['Atlanta, GA', 1, 8.9], ['Atlantic City, NJ', 1.1, 6.625], ['Austin, TX', 1.05, 8.25], ['Baltimore, MD', 1, 6],
    ['Baton Rouge, LA', 0.9, 9.95], ['Birmingham, AL', 0.88, 10], ['Boise, ID', 0.95, 6], ['Boston, MA', 1.35, 6.25],
    ['Boulder, CO', 1.15, 8.86], ['Buffalo, NY', 0.95, 8.75], ['Charleston, SC', 1.05, 9], ['Charlotte, NC', 0.95, 7.25],
    ['Chattanooga, TN', 0.9, 9.25], ['Chicago, IL', 1.12, 10.25], ['Cincinnati, OH', 0.92, 7.8], ['Cleveland, OH', 0.92, 8],
    ['Colorado Springs, CO', 0.98, 8.2], ['Columbus, OH', 0.92, 7.5], ['Dallas, TX', 1, 8.25], ['Denver, CO', 1.1, 8.8],
    ['Des Moines, IA', 0.88, 7], ['Detroit, MI', 0.9, 6], ['Durham, NC', 0.98, 7.5], ['El Paso, TX', 0.85, 8.25],
    ['Fort Lauderdale, FL', 1.12, 7], ['Fort Myers, FL', 0.95, 6.5], ['Fort Worth, TX', 0.95, 8.25], ['Fresno, CA', 0.95, 8.35],
    ['Grand Rapids, MI', 0.9, 6], ['Greenville, SC', 0.9, 6], ['Hartford, CT', 1.05, 6.35], ['Honolulu, HI', 1.4, 4.7],
    ['Houston, TX', 0.96, 8.25], ['Huntsville, AL', 0.88, 9], ['Indianapolis, IN', 0.9, 7], ['Jacksonville, FL', 0.92, 7.5],
    ['Jersey City, NJ', 1.3, 6.625], ['Kansas City, MO', 0.92, 8.6], ['Knoxville, TN', 0.9, 9.25], ['Lafayette, LA', 0.88, 9.45],
    ['Las Vegas, NV', 1, 8.4], ['Lexington, KY', 0.9, 6], ['Little Rock, AR', 0.85, 8.625], ['Long Beach, CA', 1.25, 10.25],
    ['Long Island, NY', 1.35, 8.625], ['Los Angeles, CA', 1.32, 9.5], ['Louisville, KY', 0.9, 6], ['Madison, WI', 0.95, 5.5],
    ['Memphis, TN', 0.88, 9.75], ['Miami, FL', 1.22, 7], ['Milwaukee, WI', 0.92, 7.9], ['Minneapolis, MN', 1.02, 8],
    ['Napa Valley, CA', 1.4, 7.75], ['Naples, FL', 1.15, 6], ['Nashville, TN', 1.05, 9.25], ['New Orleans, LA', 0.98, 9.45],
    ['New York, NY', 1.48, 8.9], ['Newark, NJ', 1.25, 6.6], ['Oakland, CA', 1.35, 10.25], ['Oklahoma City, OK', 0.88, 8.6],
    ['Omaha, NE', 0.9, 7], ['Orange County, CA', 1.32, 7.75], ['Orlando, FL', 0.97, 6.5], ['Palm Beach, FL', 1.25, 7],
    ['Palm Springs, CA', 1.15, 8.75], ['Philadelphia, PA', 1.12, 8], ['Phoenix, AZ', 0.98, 8.6], ['Pittsburgh, PA', 0.95, 7],
    ['Portland, OR', 1.12, 0], ['Princeton, NJ', 1.25, 6.625], ['Providence, RI', 1.05, 7], ['Raleigh, NC', 0.98, 7.25],
    ['Reno, NV', 0.98, 8.265], ['Richmond, VA', 0.95, 6], ['Rochester, NY', 0.92, 8], ['Sacramento, CA', 1.12, 8.75],
    ['Salt Lake City, UT', 1, 7.75], ['San Antonio, TX', 0.9, 8.25], ['San Diego, CA', 1.25, 7.75], ['San Francisco, CA', 1.5, 8.6],
    ['San Jose, CA', 1.45, 9.4], ['Santa Barbara, CA', 1.35, 8.75], ['Santa Fe, NM', 1.05, 8.1875], ['Savannah, GA', 0.95, 7],
    ['Scottsdale, AZ', 1.15, 8.05], ['Seattle, WA', 1.28, 10.35], ['Shreveport, LA', 0.85, 9.6], ['St. Louis, MO', 0.92, 9.7],
    ['St. Petersburg, FL', 0.98, 7.5], ['Tampa, FL', 0.98, 7.5], ['Tucson, AZ', 0.92, 8.7], ['Tulsa, OK', 0.88, 8.517],
    ['Virginia Beach, VA', 0.95, 6], ['Washington, DC', 1.32, 6], ['Westchester, NY', 1.35, 8.375],
    ['Other US city', 1.0, 8]
  ].map(function (c) { return { name: c[0], index: c[1], tax: c[2], country: 'US' }; }).concat([
    /* Canada: estimates are in Canadian dollars (the index already includes the currency), with each province's sales tax. */
    ['Calgary, AB', 1.2], ['Edmonton, AB', 1.1], ['Halifax, NS', 1.05], ['Hamilton, ON', 1.15], ['Montreal, QC', 1.12], ['Ottawa, ON', 1.2],
    ['Quebec City, QC', 1.0], ['Saskatoon, SK', 0.98], ['Toronto, ON', 1.35], ['Vancouver, BC', 1.4], ['Victoria, BC', 1.25], ['Winnipeg, MB', 1.0],
    ['Other city in Canada', 1.15]
  ].map(function (c) { var pv = PROVINCES[(c[0].split(', ')[1]) || 'ON']; return { name: c[0], index: c[1], tax: pv.tax, taxName: pv.label, country: 'CA' }; }));
  var COUNTRIES = [
    { id: 'US', name: 'United States', currency: 'USD', other: 'Other US city', region: 'state', example: 'e.g. Boise, ID', km: false },
    { id: 'CA', name: 'Canada', currency: 'CAD', other: 'Other city in Canada', region: 'province', example: 'e.g. Kelowna, BC', km: true }
  ];

  /* Style library used to build concepts. Palettes are hex values shown as swatches. */
  var STYLES = [
    { id: 'champagne-garden', shop: 'sage green and ivory', name: 'Sage Garden', palette: ['#F3E7D3', '#D9C29C', '#A9B89A', '#FFFFFF', '#6F7D63'], tags: ['garden', 'neutral', 'elegant', 'outdoor', 'green', 'gold', 'sage', 'cream'],
      mood: 'Soft gold light, garden greenery and candlelit tables.', decor: ['Greenery runners with white blooms', 'Gold chargers and blush napkins', 'Floating candles in tall glass', 'Gold candlelit welcome table'],
      music: 'jazz brunch acoustic', dress: 'Soft neutrals, garden formal', menu: 'garden' },
    { id: 'modern-noir', shop: 'black and gold', name: 'Modern Noir', palette: ['#111111', '#2B2B2B', '#C9A86A', '#F5F2EC', '#7A6A55'], tags: ['black', 'dark', 'gold', 'modern', 'glam', 'evening'],
      mood: 'Black and gold, sharp lines and dramatic low light.', decor: ['Black linens with gold flatware', 'Mirrored table numbers', 'Tall black taper candles', 'Neon sign with the guest of honor’s name'],
      music: 'r&b lounge house', dress: 'All black, cocktail to black tie', menu: 'modern' },
    { id: 'blush-romance', shop: 'blush pink', name: 'Blush Romance', palette: ['#F7DCDC', '#E8B4B8', '#C98B92', '#FFF7F3', '#B88A5A'], tags: ['pink', 'blush', 'romantic', 'soft', 'floral', 'gold', 'tea'],
      mood: 'Blush roses, soft draping and a romantic glow.', decor: ['Blush and ivory rose centerpieces', 'Sheer draped backdrop', 'Rose-gold accents', 'Pearl-dotted dessert table'],
      music: 'love songs soul', dress: 'Blush, ivory and soft gold', menu: 'elegant' },
    { id: 'boho-sunset', shop: 'terracotta boho', name: 'Boho Sunset', palette: ['#E9C9A6', '#C47C4E', '#8C5A3C', '#F4EBDD', '#6B7A55'], tags: ['boho', 'terracotta', 'warm', 'rustic', 'orange', 'outdoor'],
      mood: 'Warm sunset tones, pampas grass and low lounge seating.', decor: ['Pampas and dried-flower arrangements', 'Lounge corners with floor cushions', 'Rattan and macramé accents', 'Lantern-lit pathway'],
      music: 'indie acoustic sunset', dress: 'Flowy earth tones', menu: 'rustic' },
    { id: 'coastal-linen', shop: 'dusty blue', name: 'Coastal Linen', palette: ['#EAF1F4', '#A9C7D3', '#5D8AA0', '#FBF8F2', '#D8C8A8'], tags: ['blue', 'coastal', 'beach', 'light'],
      mood: 'Breezy linen, ocean blues and natural textures.', decor: ['Linen tablecloths in sea-glass blue', 'Driftwood and white hydrangea', 'Glass hurricanes with sand', 'Golden-hour toast under blue lanterns'],
      music: 'yacht rock bossa nova', dress: 'Linen and light blues', menu: 'coastal' },
    { id: 'tropical-glam', shop: 'tropical', name: 'Tropical Glam', palette: ['#0F5C4D', '#F2B544', '#E5677A', '#FFF6E5', '#1B3B36'], tags: ['tropical', 'green', 'bright', 'colorful', 'summer'],
      mood: 'Lush palms, bold color and island glamour.', decor: ['Monstera and orchid centerpieces', 'Gold pineapple accents', 'Tiki-luxe bar setup', 'Bright floral photo wall'],
      music: 'afrobeats reggaeton summer', dress: 'Bold tropical prints', menu: 'tropical' },
    { id: 'old-hollywood', shop: 'red and gold', name: 'Old Hollywood', palette: ['#7A0E1B', '#111111', '#D4AF37', '#F7F1E3', '#4A0A12'], tags: ['red', 'gold', 'glam', 'vintage', 'evening'],
      mood: 'Red carpet, gold accents and vintage glamour.', decor: ['Gold sequin linens', 'Vintage film-reel table numbers', 'Red carpet entrance with stanchions', 'Marquee light letters for photos'],
      music: 'swing jazz motown', dress: 'Old Hollywood glamour, black tie', menu: 'classic' },
    { id: 'pastel-whimsy', shop: 'pastel', name: 'Pastel Whimsy', palette: ['#F9E1EC', '#D9ECF5', '#FFF3C4', '#DCEFD9', '#B9A3D6'], tags: ['pastel', 'colorful', 'playful', 'soft', 'baby', 'lavender', 'tea'],
      mood: 'Soft pastels, balloons and playful sweetness.', decor: ['Pastel balloon garland', 'Macaron and candy table', 'Mismatched pastel napkins', 'Paper flower wall for photos'],
      music: 'pop feel-good', dress: 'Pastels and florals', menu: 'sweet' },
    { id: 'ivory-ballroom', shop: 'ivory and gold', name: 'Ivory Elegance', palette: ['#FBF6EC', '#EFE3CF', '#D9C4A0', '#B8925A', '#FFFFFF'], tags: ['ivory', 'cream', 'gold', 'classic', 'elegant', 'ballroom', 'champagne', 'formal', 'luxe'],
      mood: 'Candlelit ivory and gold, sparkling crystal and lush white roses.', decor: ['Gold stands with white rose and hydrangea arrangements', 'Ivory damask linens and gold beaded chargers', 'Pillar candles in glass hurricanes', 'Draped ivory backdrop with a floral garland'],
      music: 'string quartet classics', dress: 'Dressy ivory, cream and gold', menu: 'elegant' },
    { id: 'minimal-white', shop: 'white', name: 'Minimal White', palette: ['#FFFFFF', '#F1EFEA', '#D6D2C8', '#8C8A84', '#2E2E2C'], tags: ['white', 'minimal', 'modern', 'neutral', 'clean', 'lavender'],
      mood: 'Clean white space, sculptural florals and quiet luxury.', decor: ['White-on-white table design', 'Single-stem sculptural florals', 'Clear acrylic signage', 'Statement white balloon cloud'],
      music: 'deep house chill', dress: 'All white', menu: 'modern' },
    { id: 'disco-glam', shop: 'silver disco', name: 'Disco Glam', palette: ['#C0C0C8', '#E05AA6', '#6B3FA0', '#141414', '#F2D16B'], tags: ['disco', 'silver', 'sparkle', 'party', 'purple', 'pink'],
      mood: 'Mirror balls, metallics and a packed dance floor.', decor: ['Disco ball clusters', 'Metallic fringe backdrop', 'Silver tablescape with glitter accents', 'Mirror-ball lit dance area'],
      music: 'disco funk dance', dress: 'Sequins and metallics', menu: 'party' },
    { id: 'moody-floral', shop: 'burgundy', name: 'Moody Floral', palette: ['#3B1F2B', '#7B2D3B', '#B5838D', '#E8D5C4', '#2F3A2F'], tags: ['burgundy', 'red', 'dark', 'floral', 'romantic', 'autumn', 'purple'],
      mood: 'Deep jewel tones, abundant florals and candlelight.', decor: ['Burgundy and plum floral runners', 'Velvet napkins', 'Brass candelabras', 'Fruit and flower grazing table'],
      music: 'neo soul candlelight', dress: 'Jewel tones', menu: 'elegant' },
    { id: 'rustic-elegance', shop: 'rustic', name: 'Rustic Elegance', palette: ['#EADBC8', '#A47551', '#5C4033', '#F8F4EE', '#7D8C6A'], tags: ['rustic', 'wood', 'brown', 'barn', 'warm', 'neutral', 'autumn', 'western', 'cozy'],
      mood: 'Natural wood, warm lighting and refined country charm.', decor: ['Farm tables with linen runners', 'Wildflowers in vintage vessels', 'Wood slice signage', 'Edison string-light canopy'],
      music: 'country folk acoustic', dress: 'Rustic chic textures and warm neutrals', menu: 'rustic' },
    { id: 'royal-purple', shop: 'purple and gold', name: 'Royal Plum', palette: ['#4B2353', '#7E4A8C', '#D8B4E2', '#F6EFF8', '#C9A86A'], tags: ['purple', 'lavender', 'royal', 'glam', 'gold'],
      mood: 'Rich plum, lavender and gold for a regal evening.', decor: ['Plum velvet linens', 'Lavender and orchid centerpieces', 'Gold-rimmed glassware', 'Throne-style guest-of-honor chair'],
      music: 'r&b soul classics', dress: 'Jewel tones and gold', menu: 'elegant' },
    { id: 'emerald-luxe', shop: 'emerald green and gold', name: 'Emerald Luxe', palette: ['#0F4D3A', '#08332A', '#C9A86A', '#F5F0E6', '#6E1F2B'], tags: ['emerald', 'green', 'gold', 'jewel', 'holiday', 'evening', 'dark'],
      mood: 'Deep emerald, polished gold and warm candlelight.', decor: ['Emerald velvet runners with gold chargers', 'Evergreen and white-flower centerpieces', 'Gold candlesticks and mercury glass', 'Glowing greenery arch for photos'],
      music: 'swing jazz motown', dress: 'Jewel tones and gold', menu: 'classic' },
    { id: 'dino-adventure', kidsOnly: true, shop: 'dinosaur party', name: 'Dino Adventure', palette: ['#5E8C4A', '#A7C957', '#F2E8CF', '#E07A2F', '#6B4F3A'], tags: ['dinosaur', 'dino', 'jungle', 'green', 'kids', 'adventure'],
      mood: 'Leafy greens, explorer gear and a dinosaur dig.', decor: ['Leafy table runners with dino figurines', 'Explorer hats and binoculars for every guest', 'Volcano cake table', 'Fossil dig in the sandbox'],
      music: 'kids party', dress: 'Explorer outfit in greens and khaki', menu: 'kids' },
    { id: 'under-the-sea', kidsOnly: true, shop: 'under the sea party', name: 'Under the Sea', palette: ['#4FB3BF', '#A0E7E5', '#FFF4E0', '#F7A9A8', '#3D5A80'], tags: ['mermaid', 'ocean', 'sea', 'beach', 'blue', 'kids', 'shell'],
      mood: 'Ocean blues, shimmering shells and a mermaid lagoon.', decor: ['Sea-glass blue linens with shell scatter', 'Bubble machine and balloon waves', 'Pearl and shell treasure chests', 'Mermaid lagoon photo spot'],
      music: 'kids party', dress: 'Shimmering ocean blues', menu: 'kids' },
    { id: 'hero-squad', kidsOnly: true, shop: 'superhero party', name: 'Hero Squad', palette: ['#D62828', '#003049', '#FCBF49', '#FFFFFF', '#2A9D8F'], tags: ['superhero', 'hero', 'comic', 'bright', 'kids', 'red', 'blue'],
      mood: 'Bold primary colors, capes and comic-book action.', decor: ['Comic-panel table covers', 'Capes and masks for every guest', 'City skyline backdrop', 'Hero training obstacle course'],
      music: 'kids party', dress: 'Cape and a bold primary color', menu: 'kids' },
    { id: 'unicorn-dream', kidsOnly: true, shop: 'unicorn party', name: 'Unicorn Dream', palette: ['#F7C6D9', '#C8B6FF', '#B8E0F6', '#FFF6E5', '#E8C26A'], tags: ['unicorn', 'rainbow', 'pastel', 'magic', 'sparkle', 'pink', 'purple', 'kids', 'girl'],
      mood: 'Pastel rainbows, gold horns and a sprinkle of sparkle.', decor: ['Pastel balloon garland with gold stars', 'Unicorn horn headbands for every guest', 'Rainbow cake with a gold horn', 'Cloud and rainbow photo backdrop'],
      music: 'kids party', dress: 'Pastels with a little sparkle', menu: 'kids' },
    { id: 'princess-royale', kidsOnly: true, shop: 'princess party', name: 'Princess Royale', palette: ['#F4B6C2', '#FBE3E8', '#D4AF6A', '#FFFFFF', '#B784A7'], tags: ['princess', 'castle', 'crown', 'tiara', 'fairy', 'royal', 'pink', 'gold', 'kids', 'girl'],
      mood: 'Blush pink, gold crowns and a castle fit for royalty.', decor: ['Blush tablecloths with gold crown confetti', 'Tiaras and wands for every guest', 'Castle cake table with tulle', 'Throne chair for the birthday star'],
      music: 'kids party', dress: 'Ball gowns, tiaras and gold', menu: 'kids' },
    { id: 'space-explorer', kidsOnly: true, shop: 'outer space party', name: 'Space Explorer', palette: ['#1B2A4A', '#3E5C99', '#F2C14E', '#E4572E', '#F4F1EA'], tags: ['space', 'rocket', 'astronaut', 'planet', 'galaxy', 'stars', 'moon', 'kids', 'boy'],
      mood: 'Deep space blues, glowing planets and a rocket launch.', decor: ['Planet balloon cluster over the tables', 'Astronaut helmets for photos', 'Rocket cake with a star trail', 'Glow-in-the-dark star ceiling'],
      music: 'kids party', dress: 'Astronaut silver and space blues', menu: 'kids' },
    { id: 'rainbow-art', kidsOnly: true, shop: 'art party for kids', name: 'Little Artists', palette: ['#E63946', '#F4A261', '#E9C46A', '#2A9D8F', '#457B9D'], tags: ['art', 'paint', 'painting', 'craft', 'crayon', 'rainbow', 'colorful', 'bright', 'kids'],
      mood: 'Bright paint splashes, mini easels and a gallery wall.', decor: ['Kraft paper table runners to draw on', 'Mini easels and paint sets at each seat', 'Paint-splash cake', 'Gallery wall to show off their art'],
      music: 'kids party', dress: 'Bright colors that don\u2019t mind paint', menu: 'kids' },
    { id: 'midnight-celestial', shop: 'navy and gold celestial', name: 'Midnight Celestial', palette: ['#16203A', '#2C3A5E', '#C9A86A', '#C7CBD3', '#F4F1EA'], tags: ['celestial', 'navy', 'silver', 'gold', 'dark', 'evening', 'blue', 'winter', 'wonderland'],
      mood: 'Midnight blue, gold stars and soft twinkling light.', decor: ['Navy linens with gold star confetti', 'Hanging moon and star installation', 'Silver candle clusters', 'Twinkle-light backdrop for photos'],
      music: 'neo soul candlelight', dress: 'Navy, silver and gold shimmer', menu: 'elegant' },
    { id: 'citrus-fiesta', shop: 'hot pink and orange', name: 'Citrus Fiesta', palette: ['#E23D7A', '#F07B2E', '#F6B26B', '#FFF6EE', '#2A9D9A'], tags: ['orange', 'fiesta', 'bright', 'colorful', 'summer', 'coral', 'citrus', 'neon'],
      mood: 'Hot pink and orange blooms, citrus and sunshine.', decor: ['Bright layered runners in hot pink and orange', 'Peony, dahlia and ranunculus centerpieces', 'Citrus slices, rattan chargers and colored glassware', 'Sunset toast under a flower-covered pergola'],
      music: 'afrobeats reggaeton summer', dress: 'Bright pinks, corals and oranges', menu: 'garden' },
    { id: 'amalfi-lemon', shop: 'lemon yellow and blue', name: 'Amalfi Lemon', palette: ['#F4D03F', '#3D6CB9', '#FFFFFF', '#A9C7E3', '#D9C29C'], tags: ['yellow', 'lemon', 'amalfi', 'mediterranean', 'summer'],
      mood: 'Lemons, blue and white stripes and sunshine by the sea.', decor: ['Blue and white striped linens with yellow napkins', 'Lemons and yellow flowers in blue and white vases', 'Wicker chairs with patterned pillows', 'Lemonade and a potted lemon tree to welcome guests'],
      music: 'jazz brunch acoustic', dress: 'Crisp whites, lemon yellow and blue', menu: 'garden' },
    { id: 'blue-willow', shop: 'blue and white chinoiserie', name: 'Blue Willow', palette: ['#5B7FBF', '#A9C7E3', '#FFFFFF', '#F4F1EA', '#C9A86A'], tags: ['chinoiserie', 'tea', 'classic', 'porcelain'],
      mood: 'Blue and white porcelain, toile linens and satin bows.', decor: ['Blue floral toile tablecloths', 'White roses and blue hydrangeas in porcelain vases', 'Floral teacups and tiered pastries', 'Powder blue bows tied on every chair'],
      music: 'jazz brunch acoustic', dress: 'Blue and white, soft and polished', menu: 'sweet' },
    { id: 'butter-bloom', shop: 'butter yellow and peach', name: 'Butter and Bloom', palette: ['#F6E3A6', '#F3C7A8', '#FFF8EC', '#F6C6C0', '#C9A86A'], tags: ['yellow', 'spring', 'soft', 'daisy', 'peach'],
      mood: 'Butter yellow, peach and blush flowers in soft sunshine.', decor: ['Peach, butter yellow and white flower runners', 'Daisies and garden roses in white pitchers', 'Cane-back chairs and soft linen napkins', 'Pastry and cake table in butter yellow and blush'],
      music: 'jazz brunch acoustic', dress: 'Soft yellows, peach and florals', menu: 'sweet' },
    { id: 'tuscan-olive', shop: 'olive green and terracotta', name: 'Tuscan Olive', palette: ['#7E8C5A', '#C47C4E', '#F4EBDD', '#A47551', '#E9C9A6'], tags: ['tuscan', 'olive', 'terracotta', 'warm', 'italian'],
      mood: 'Olive branches, terracotta and candlelight at sunset.', decor: ['Long rustic table on a stone terrace', 'Olive branches and dahlias in terracotta vases', 'Olive green linen napkins and stoneware', 'Candlelit supper as the sun goes down'],
      music: 'jazz brunch acoustic', dress: 'Earthy linens, olive and terracotta', menu: 'gardenDinner' }
  ];

  /* What to buy or hire for each look: [item, store search, who to hire]. A blank search means hire a pro for it. */
  var STYLE_PIECES = {
    'champagne-garden': [['Greenery table runners', 'faux eucalyptus garland table runner', ''], ['Gold charger plates', 'gold charger plates', ''], ['Blush napkins', 'blush linen napkins', ''], ['Floating candles in tall glass', 'floating candles tall glass cylinder', ''], ['White flower centerpieces', '', 'florals']],
    'modern-noir': [['Black tablecloths', 'black tablecloth', ''], ['Gold flatware', 'gold flatware set', ''], ['Mirrored table numbers', 'mirror acrylic table numbers', ''], ['Black taper candles', 'black taper candles', ''], ['Custom neon sign', 'custom neon sign', '']],
    'blush-romance': [['Sheer draped backdrop', 'sheer white backdrop drape', ''], ['Rose-gold candle holders', 'rose gold candle holders', ''], ['Pearl garland for the dessert table', 'pearl garland strand', ''], ['Blush napkins', 'blush linen napkins', ''], ['Blush and ivory rose centerpieces', '', 'florals']],
    'boho-sunset': [['Pampas grass arrangements', 'pampas grass bouquet', ''], ['Floor cushions', 'boho floor cushions', ''], ['Macramé table runner', 'macrame table runner', ''], ['Lanterns for the pathway', 'candle lanterns set', ''], ['Terracotta napkins', 'terracotta linen napkins', '']],
    'coastal-linen': [['Dusty blue linen tablecloths', 'dusty blue linen tablecloth', ''], ['Glass hurricanes with sand', 'glass hurricane candle holders', ''], ['Blue glass lanterns', 'blue glass lanterns', ''], ['Natural linen napkins', 'natural linen napkins', ''], ['Driftwood and white hydrangea', '', 'florals']],
    'tropical-glam': [['Gold pineapple accents', 'gold pineapple decor', ''], ['Monstera leaf placemats', 'monstera leaf placemats', ''], ['Tropical print napkins', 'tropical print napkins', ''], ['Monstera and orchid centerpieces', '', 'florals'], ['Bright floral photo wall', '', 'decor']],
    'old-hollywood': [['Gold sequin tablecloths', 'gold sequin tablecloth', ''], ['Film-reel table numbers', 'film reel table numbers', ''], ['Red carpet runner and stanchions', 'red carpet runner with stanchions', ''], ['Red rose centerpieces', '', 'florals'], ['Marquee light letters', '', 'decor']],
    'pastel-whimsy': [['Pastel napkins', 'pastel napkins assorted', ''], ['Paper flower wall', 'paper flower backdrop', ''], ['Glass candy jars', 'glass apothecary candy jars', ''], ['Pastel balloon garland', '', 'balloons'], ['Macaron and candy table', '', 'cake']],
    'ivory-ballroom': [['Ivory damask tablecloths', 'ivory damask tablecloth', ''], ['Gold beaded chargers', 'gold beaded charger plates', ''], ['Pillar candles in hurricanes', 'glass hurricane pillar candle holders', ''], ['Gold stands with white florals', '', 'florals'], ['Draped ivory backdrop', '', 'decor']],
    'minimal-white': [['White tablecloths', 'white tablecloth', ''], ['Clear acrylic signs', 'clear acrylic sign', ''], ['White ceramic bud vases', 'white ceramic bud vases', ''], ['Single-stem sculptural florals', '', 'florals'], ['White balloon cloud', '', 'balloons']],
    'disco-glam': [['Disco ball cluster', 'disco ball set', ''], ['Silver fringe backdrop', 'silver metallic fringe curtain', ''], ['Silver sequin table runner', 'silver sequin table runner', ''], ['Silver table confetti', 'silver glitter table confetti', ''], ['Dance floor lighting', '', 'lighting']],
    'moody-floral': [['Burgundy velvet napkins', 'burgundy velvet napkins', ''], ['Brass candelabras', 'brass candelabra', ''], ['Burgundy taper candles', 'burgundy taper candles', ''], ['Burgundy and plum flower runners', '', 'florals'], ['Fruit and flower grazing table', '', 'catering']],
    'rustic-elegance': [['Natural linen table runners', 'natural linen table runner', ''], ['Wood slice signs', 'wood slice sign', ''], ['Edison string lights', 'edison bulb string lights', ''], ['Wildflowers in vintage vessels', '', 'florals'], ['Farm tables', '', 'rentals']],
    'royal-purple': [['Plum velvet tablecloths', 'plum velvet tablecloth', ''], ['Gold-rim glassware', 'gold rim glassware', ''], ['Purple taper candles', 'purple taper candles', ''], ['Lavender and orchid centerpieces', '', 'florals'], ['Throne-style chair for the guest of honor', '', 'rentals']],
    'emerald-luxe': [['Emerald velvet runners', 'emerald green velvet table runner', ''], ['Gold charger plates', 'gold charger plates', ''], ['Gold candlesticks', 'gold taper candle holders', ''], ['Mercury glass votives', 'gold mercury glass votive holders', ''], ['Evergreen and white flower centerpieces', '', 'florals']],
    'dino-adventure': [['Dinosaur figurines for the tables', 'dinosaur figurines set', ''], ['Explorer hats and binoculars', 'kids explorer hat and binoculars set', ''], ['Jungle leaf table runner', 'jungle leaf table runner', ''], ['Fossil dig kit', 'dinosaur fossil dig kit', ''], ['Volcano cake', '', 'cake']],
    'under-the-sea': [['Aqua tablecloths', 'aqua blue tablecloth', ''], ['Seashell table scatter', 'seashell table confetti', ''], ['Bubble machine', 'bubble machine', ''], ['Treasure chest favors', 'treasure chest party favor', ''], ['Balloon waves', '', 'balloons']],
    'hero-squad': [['Comic table covers', 'superhero comic table cover', ''], ['Capes and masks', 'kids superhero capes and masks set', ''], ['City skyline backdrop', 'superhero city skyline backdrop', ''], ['Obstacle course set', 'kids obstacle course set', ''], ['Hero cake', '', 'cake']],
    'unicorn-dream': [['Pastel balloon garland kit', 'pastel balloon garland kit gold', ''], ['Unicorn horn headbands', 'kids unicorn horn headbands set', ''], ['Rainbow table runner', 'pastel rainbow table runner', ''], ['Cloud and rainbow backdrop', 'pastel rainbow cloud backdrop', ''], ['Unicorn cake', '', 'cake']],
    'princess-royale': [['Blush tablecloths', 'blush pink tablecloth', ''], ['Kids tiaras and wands', 'kids princess tiara and wand set', ''], ['Gold crown confetti', 'gold crown table confetti', ''], ['Tulle table skirt', 'pink tulle table skirt', ''], ['Castle cake', '', 'cake']],
    'space-explorer': [['Planet balloon set', 'solar system planet balloons', ''], ['Glow-in-the-dark stars', 'glow in the dark ceiling stars', ''], ['Astronaut photo props', 'kids astronaut party photo props', ''], ['Galaxy tablecloth', 'galaxy space tablecloth', ''], ['Rocket cake', '', 'cake']],
    'rainbow-art': [['Kraft paper roll for the tables', 'kraft paper roll table runner', ''], ['Mini easels and paint sets', 'kids mini easel paint set party', ''], ['Kids art aprons', 'kids art aprons set', ''], ['Gallery wall clips and string', 'photo display string with clips', ''], ['Paint-splash cake', '', 'cake']],
    'midnight-celestial': [['Navy tablecloths', 'navy blue tablecloth', ''], ['Gold star confetti', 'gold star table confetti', ''], ['Hanging moons and stars', 'gold moon and star hanging decorations', ''], ['Silver votive clusters', 'silver mercury glass votive holders', ''], ['Twinkle-light backdrop', 'fairy light curtain backdrop', '']],
    'citrus-fiesta': [['Hot pink and orange runners', 'hot pink orange table runner', ''], ['Rattan chargers', 'rattan charger plates', ''], ['Pink and orange glassware', 'pink and orange drinking glasses', ''], ['Colorful paper flower garland', 'paper flower garland colorful', ''], ['Peony and dahlia centerpieces', '', 'florals']],
    'amalfi-lemon': [['Blue and white striped tablecloths', 'blue and white striped tablecloth', ''], ['Yellow napkins', 'yellow linen napkins', ''], ['Blue and white vases', 'blue and white ceramic vase', ''], ['Potted lemon tree', 'faux potted lemon tree', ''], ['Lemons and yellow flowers', '', 'florals']],
    'blue-willow': [['Blue toile tablecloths', 'blue floral toile tablecloth', ''], ['Blue and white teacups', 'blue and white floral teacups', ''], ['Powder blue chair bows', 'powder blue satin chair sash bows', ''], ['Ginger jar vases', 'blue and white ginger jar', ''], ['White rose and blue hydrangea arrangements', '', 'florals']],
    'butter-bloom': [['Butter yellow tablecloth', 'butter yellow tablecloth', ''], ['White ceramic pitchers for daisies', 'white ceramic pitcher vase', ''], ['Peach linen napkins', 'peach linen napkins', ''], ['Peach and yellow flower runners', '', 'florals'], ['Pastry and cake table', '', 'cake']],
    'tuscan-olive': [['Terracotta vases', 'terracotta vase set', ''], ['Olive green napkins', 'olive green linen napkins', ''], ['Stoneware plates', 'stoneware dinner plates', ''], ['Ivory pillar candles', 'ivory pillar candles set', ''], ['Olive branches and dahlias', '', 'florals']]
  };

  var MENUS = {
    garden: ['Herb frittata and quiche duo', 'Citrus and burrata salad', 'Lemon ricotta pancakes', 'Mini croissant sandwiches', 'Berry pavlova', 'Elderflower spritz and mimosa bar'],
    modern: ['Seared salmon bites', 'Truffle fries in cones', 'Short rib sliders', 'Caprese skewers', 'Chocolate mousse cups', 'Signature espresso martini'],
    elegant: ['Champagne-poached shrimp', 'Roasted chicken with herb jus', 'Wild mushroom risotto', 'Spring greens with shaved parmesan', 'Raspberry rose cake', 'Rose spritz and sparkling wine'],
    rustic: ['Grazing board with local cheeses', 'Smoked brisket or roasted vegetables', 'Mac and cheese bar', 'Cornbread with honey butter', 'Peach cobbler cups', 'Lavender lemonade'],
    coastal: ['Raw bar or shrimp cocktail', 'Fish tacos with mango salsa', 'Grilled corn salad', 'Lobster or crab rolls', 'Key lime tarts', 'Blue Hawaiian mocktail'],
    tropical: ['Jerk chicken skewers', 'Coconut rice', 'Plantain chips with guac', 'Tropical fruit display', 'Pineapple upside-down cupcakes', 'Passion-fruit punch'],
    classic: ['Beef tenderloin crostini', 'Crab cakes with remoulade', 'Caesar salad', 'Filet or vegetable Wellington', 'Champagne cake', 'Classic martinis'],
    gardenDinner: ['Burrata with heirloom tomatoes and basil', 'Herb-roasted chicken with lemon', 'Grilled vegetables with salsa verde', 'Spring pea and mint risotto', 'Berry pavlova', 'Elderflower spritz'],
    kids: ['Mini pizzas', 'Chicken tenders with dips', 'Fruit cups and veggie cups', 'Mac and cheese bites', 'Cupcakes or a fun cake', 'Pink lemonade and juice boxes'],
    holiday: ['Herb-crusted beef tenderloin', 'Roasted winter vegetables', 'Baked brie with cranberry', 'Mini crab cakes', 'Peppermint chocolate tart', 'Spiced cider and a holiday punch'],
    quince: ['Carne asada or chicken in mole', 'Arroz and frijoles charros', 'Elote cups', 'Taco or tostada station', 'Tres leches cake', 'Aguas frescas: horchata and jamaica'],
    arabic: ['Mezze: hummus, moutabal, tabbouleh and fattoush', 'Mixed grill: shish tawook and kafta', 'Ouzi or mansaf (lamb with rice)', 'Stuffed grape leaves and kibbeh', 'Knafeh and baklava', 'Fresh juices, mint lemonade and Arabic coffee'],
    indian: ['Paneer tikka and samosas', 'Butter chicken and dal makhani', 'Biryani', 'Naan and rice', 'Gulab jamun and mithai', 'Mango lassi and masala chai'],
    persian: ['Mast-o-khiar and Shirazi salad', 'Joojeh and koobideh kabob', 'Jeweled rice (morasa polo) with tahdig', 'Ghormeh sabzi', 'Persian sweets and saffron ice cream', 'Rose sharbat and Persian tea'],
    pakistani: ['Chicken and beef seekh kebabs', 'Chicken karahi', 'Mutton biryani', 'Nihari with naan', 'Kheer, gulab jamun and mithai', 'Mango lassi and doodh patti chai'],
    mexican: ['Guacamole, salsas and ceviche', 'Carne asada and chicken in mole', 'Arroz and frijoles charros', 'Taco or tamale station', 'Tres leches cake and churros', 'Aguas frescas: horchata and jamaica'],
    chinese: ['Roast suckling pig or Peking duck', 'Lobster or crab with ginger and scallion', 'Steamed whole fish', 'Longevity noodles and fried rice', 'Sweet red bean soup and lotus buns', 'Jasmine tea'],
    vietnamese: ['Fresh spring rolls and crispy cha gio', 'Lobster or crab with garlic noodles', 'Roast duck or quail', 'Fried rice and stir-fried greens', 'Che and sesame balls', 'Jasmine tea and Vietnamese iced coffee'],
    korean: ['Japchae and pajeon', 'Galbi (marinated short ribs)', 'Bulgogi with lettuce wraps', 'Banchan and rice', 'Tteok rice cakes and fruit', 'Barley tea and sikhye'],
    filipino: ['Lumpia shanghai', 'Lechon', 'Chicken adobo and pancit', 'Kare-kare', 'Leche flan, ube cake and buko pandan', 'Calamansi juice'],
    nigerian: ['Small chops: puff puff, samosa, spring rolls', 'Jollof rice and fried rice', 'Peppered chicken and suya', 'Pounded yam with egusi soup', 'Chin chin and wedding cake', 'Zobo and Chapman mocktail'],
    greek: ['Spanakopita and dips with pita', 'Greek salad', 'Lamb or chicken souvlaki', 'Moussaka or pastitsio', 'Baklava and koufeta (sugared almonds)', 'Lemonade and Greek coffee'],
    soul: ['Shrimp and grits bites', 'Fried or baked chicken', 'Mac and cheese', 'Collard greens and candied yams', 'Red velvet cake and peach cobbler', 'Sweet tea and lemonade'],
    spanish: ['Tapas: croquetas, tortilla espa\u00f1ola, gambas al ajillo', 'Jam\u00f3n ib\u00e9rico carved to order', 'Paella', 'Solomillo or sea bass', 'Turr\u00f3n, crema catalana and wedding cake', 'Fresh juices and Spanish hot chocolate'],
    russian: ['Zakuski: blini with caviar, herring under a fur coat, pickles', 'Olivier salad', 'Pelmeni and pirozhki', 'Beef stroganoff or shashlik', 'Medovik and napoleon cake', 'Mors (berry drink) and tea'],
    moroccan: ['Moroccan salads and briouats', 'Chicken or seafood pastilla', 'Lamb tagine with prunes and almonds', 'Mechoui and couscous', 'Moroccan pastries: cornes de gazelle, chebakia', 'Mint tea'],
    sweet: ['Finger sandwiches', 'Fruit skewers', 'Mini quiches', 'Macaron tower', 'Cake pops', 'Pink lemonade'],
    party: ['Loaded slider bar', 'Wings and dips', 'Taco station', 'Veggie crudités', 'Cupcake tower', 'Glitter cocktail and mocktail']
  };

  var DIETS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut allergy', 'Halal', 'Kosher', 'Pescatarian'];

  /* Checklist: weeks before the event. */
  var CHECKLIST = [
    { w: 40, t: 'Book the pandit and confirm the ceremony time (muhurat)', cu: 'indian' },
    { w: 26, t: 'Book the mandap, dhol player and baraat horse or car', cu: 'indian' },
    { w: 12, t: 'Book the mehndi artist for the bride and guests', cu: 'indian' },
    { w: 4, t: 'Order mithai for guests and the families', cu: 'indian' },
    { w: 28, t: 'Book the zaffe group, band and singer early: the best ones fill up first', cu: 'arabic' },
    { w: 16, t: 'Choose the kosha design and its flowers', cu: 'arabic' },
    { w: 4, t: 'Order Arabic sweets (knafeh, baklava) and favors', cu: 'arabic' },
    { w: 24, t: 'Book the aghd officiant', cu: 'persian' },
    { w: 32, t: 'Book the imam or maulvi and prepare the nikah nama', cu: 'pakistani' },
    { w: 20, t: 'Plan the dholki and mehndi nights', cu: 'pakistani' },
    { w: 16, t: 'Plan the walima, the groom\u2019s family reception', cu: 'pakistani' },
    { w: 24, t: 'Ask your padrinos and choose the lazo and arras', cu: 'mexican' },
    { w: 20, t: 'Book the mariachi early: the best ones fill up first', cu: 'mexican' },
    { w: 40, t: 'Choose a lucky date and book the banquet restaurant', cu: 'chinese' },
    { w: 16, t: 'Book the lion dance and order the red envelope box', cu: 'chinese' },
    { w: 8, t: 'Plan the door games and the tea ceremony', cu: 'chinese' },
    { w: 16, t: 'Order the gift trays and plan the procession', cu: 'vietnamese' },
    { w: 12, t: 'Order \u00e1o d\u00e0i for the couple and family', cu: 'vietnamese' },
    { w: 16, t: 'Reserve the hanbok and pyebaek set', cu: 'korean' },
    { w: 6, t: 'Choose who joins the pyebaek and prepare the chestnuts and dates', cu: 'korean' },
    { w: 24, t: 'Ask your principal and secondary sponsors', cu: 'filipino' },
    { w: 8, t: 'Order the lechon', cu: 'filipino' },
    { w: 24, t: 'Choose your aso ebi fabric and tell guests how to order it', cu: 'nigerian' },
    { w: 20, t: 'Book the MC and live band', cu: 'nigerian' },
    { w: 2, t: 'Get crisp bills for spraying', cu: 'nigerian' },
    { w: 32, t: 'Book the church and meet the priest', cu: 'greek' },
    { w: 24, t: 'Choose your padrinos and the 13 arras coins', cu: 'spanish' },
    { w: 16, t: 'Choose the traditions you want and tell your officiant', cu: 'africanamerican' },
    { w: 12, t: 'Ask an elder to lead the libation ceremony', cu: 'africanamerican', needs: 'libation' },
    { w: 8, t: 'Order or decorate the broom for jumping the broom', cu: 'africanamerican', needs: 'broom' },
    { w: 16, t: 'Book the gospel choir or soloist', cu: 'africanamerican', needs: 'gospel' },
    { w: 4, t: 'Give the DJ your line dance list', cu: 'africanamerican' },
    { w: 8, t: 'Order the detalles for every guest', cu: 'spanish' },
    { w: 28, t: 'Book the tamada first: the night runs around them', cu: 'russian' },
    { w: 4, t: 'Order the karavai and plan the bride ransom games', cu: 'russian' },
    { w: 32, t: 'Book the negafa and choose the outfits and the amariya', cu: 'moroccan' },
    { w: 20, t: 'Book the dakka or Andalusian band', cu: 'moroccan' },
    { w: 8, t: 'Plan the henna night', cu: 'moroccan' },
    { w: 12, t: 'Choose your koumbaro or koumbara and the stefana', cu: 'greek' },
    { w: 12, t: 'Plan the sofreh aghd: mirror, candelabras, sweets, honey and flowers', cu: 'persian' },
    { w: 4, t: 'Order Persian sweets and the wedding cake', cu: 'persian' },
    { w: 52, t: 'Set the budget and guest count', only: ['wedding', 'gala', 'quince'] },
    { w: 40, t: 'Book the venue', only: ['wedding', 'gala', 'quince'], not: ['home', 'restaurant', 'privateRoom'] },
    { w: 40, t: 'Reserve the private dining room', only: ['wedding', 'gala', 'quince'], in: ['privateRoom'] },
    { w: 32, t: 'Book photographer, caterer and music', only: ['wedding', 'gala', 'quince'], not: ['restaurant', 'privateRoom'] },
    { w: 32, t: 'Book the photographer and music', only: ['wedding', 'gala', 'quince'], in: ['restaurant', 'privateRoom'] },
    { w: 24, t: 'Send save-the-dates', only: ['wedding'] },
    { w: 10, t: 'Choose your concept and budget version', not: ['restaurant'] },
    { w: 9, t: 'Book the venue or reserve private dining', not: ['restaurant', 'home'] },
    { w: 8, t: 'Book key vendors (food, photos, music)', not: ['restaurant', 'privateRoom'] },
    { w: 4, t: 'Choose the restaurant and reserve a table for your group', in: ['restaurant'] },
    { w: 3, t: 'Ask the restaurant about large-party rules: automatic tip, cake-cutting fee, decor and separate checks', in: ['restaurant', 'privateRoom'] },
    { w: 6, t: 'Send invitations and open RSVPs', not: ['restaurant'] },
    { w: 3, t: 'Send invitations and open RSVPs', in: ['restaurant'] },
    { w: 5, t: 'Order decor, balloons and florals', not: ['restaurant'] },
    { w: 1, t: 'Order or pick up the cake and table decor', in: ['restaurant'] },
    { w: 4, t: 'Finalize menu and dietary needs', not: ['restaurant'] },
    { w: 3, t: 'Plan outfits and book hair and makeup', not: ['restaurant'] },
    { w: 2, t: 'Confirm final guest count with vendors', not: ['restaurant'] },
    { w: 2, t: 'Finish seating chart', not: ['restaurant', 'privateRoom'], minGuests: 40 },
    { w: 1, t: 'Confirm the reservation and final headcount', in: ['restaurant', 'privateRoom'] },
    { w: 1, t: 'Confirm vendor arrival times and pay balances', not: ['restaurant'] },
    { w: 1, t: 'Share the day-of schedule with vendors and helpers' },
    { w: -1, t: 'Send thank-you notes and share the album' }
  ];

  /* Event Pass pricing (USD) from the approved proposal. */
  var PASSES = [
    { max: 25, price: 9.99 }, { max: 75, price: 19.99 }, { max: 150, price: 39.99 }, { max: 350, price: 69.99 },
    { max: 500, price: 79.99 }, { max: 2000, price: 99.99 }, { max: 5000, price: 199.99 }, { max: 10000, price: 349.99 }
  ];
  var CREDIT_PACKS = [{ credits: 10, price: 4.99 }, { credits: 25, price: 9.99 }, { credits: 60, price: 19.99 }];
  var PACKAGES = [
    { id: 'concepts3', name: 'Three more event concepts', price: 7.99, credits: 16, desc: 'Three new theme directions for this event, guided by what you want changed.' }
  ];
  var ADDONS = [
    { id: 'graphics', name: 'Matching event graphics', price: 6.99, desc: 'Welcome sign, menu, place card, table number and thank-you card; editable; PDF or PNG.' },
    { id: 'outfits', name: 'Guest outfit inspiration', price: 4.99, desc: 'Three outfit boards for one person, with product links.' },
    { id: 'branding', name: 'Planner branding', price: 9.99, desc: 'Your logo, contact details and colors on this event’s pages and PDFs.' },
    { id: 'languages', name: 'Multilingual event page', price: 4.99, desc: 'Invitation and up to 2,000 words in up to three more languages.' },
    { id: 'album', name: 'Photo album upgrade', price: 4.99, desc: '2 GB more album space for 90 days. No auto-renewal.' },
    { id: 'moreOptions', name: 'More venue or vendor options', price: 4.99, desc: 'Up to five more candidates for one category, with sources.' },
    { id: 'thanks', name: 'Personalized thank-you drafts', price: 4.99, desc: 'Up to 25 individual drafts plus one batch rewrite.' }
  ];

  /* Included allowances per pass (placeholders until real-usage cost testing; shown before purchase). */
  var ALLOWANCE = { photoAnalyses: 10, aiChanges: 15, venueSearches: 20, storageMB: 500, accessMonths: 12, afterEventDays: 30 };

  var VENUE_TYPES = {
    restaurant: ['Upscale brunch or lunch spot', 'Steakhouse or chophouse', 'Rooftop restaurant', 'Wine bar or bistro', 'Trendy dinner spot with a large table'],
    privateRoom: ['Private dining room', 'Rooftop restaurant', 'Hotel tea room', 'Wine bar with a private space'],
    dining: ['Private dining room', 'Rooftop restaurant', 'Hotel tea room', 'Wine bar with a private space'],
    shower: ['Event loft', 'Garden venue', 'Tea room or bistro', 'Community or clubhouse room'],
    party: ['Event loft', 'Rooftop lounge', 'Restaurant buyout', 'Backyard or home', 'Hotel ballroom'],
    gala: ['Hotel ballroom', 'Banquet hall', 'Museum or gallery', 'Historic mansion'],
    wedding: ['Estate or garden venue', 'Hotel ballroom', 'Vineyard or barn', 'Historic mansion', 'Rooftop with skyline views']
  };

  var PLAYLIST_SEARCH = function (q) {
    return {
      spotify: 'https://open.spotify.com/search/' + encodeURIComponent(q + ' playlist'),
      apple: 'https://music.apple.com/us/search?term=' + encodeURIComponent(q + ' playlist')
    };
  };

  /* Newly opened event venues, checked by hand from the venue's own website. Shown as an idea only: no payment or partnership.
     Remove a venue if its details change or it closes. */
  var NEW_VENUES = [
    { name: 'Deco House River Oaks', city: 'Houston, TX', area: 'River Oaks', address: '4235 Richmond Ave, Suite 200, Houston, TX 77027', seated: 160, standing: 200,
      settings: ['indoor'], types: ['wedding', 'quince', 'milestone', 'birthday', 'baby-shower', 'bridal-shower', 'anniversary', 'dinner', 'gala', 'corporate', 'engagement', 'graduation', 'sweet16', 'retirement', 'holiday', 'christmas', 'other'],
      about: 'A private Art Deco event space with a 4,000 sq ft event floor and statement lighting.',
      details: ['Up to 160 seated or 200 standing', 'Catering through their partner caterers, quoted for your event; prep kitchen on site', '125+ parking spaces, valet on weekends', 'Tours by appointment; prices are quoted on request'],
      site: 'https://www.decohousehtx.com/', checked: '2026-10-24' }
  ];

  root.EC_DATA = {
    NEW_VENUES: NEW_VENUES, STYLE_PIECES: STYLE_PIECES,
    SETTINGS: SETTINGS, SETTING_RULES: SETTING_RULES, GRATUITY: 0.20,
    EVENT_TYPES: EVENT_TYPES, CULTURES: CULTURES, CATEGORIES: CATEGORIES, PROFILES: PROFILES, ADJUST: ADJUST, TIERS: TIERS,
    /* Vendors Always Luxe recommends by name. They show first, marked Recommended, in these cities. */
    RECOMMENDED: [
      { name: 'DJ Mosses', ig: 'dj_mosses_music', cats: ['dj'], cities: ['Los Angeles, CA', 'Orange County, CA', 'San Diego, CA'], note: 'International and Arabic music for weddings and private events' },
      /* No cities: shown in every city. cultures: only for those cultural weddings. */
      { name: 'Waseem Rabih', ig: 'waseemrabih', cats: ['singer'], states: ['CA'], top: true, cultures: ['arabic'], note: 'Arabic wedding singer for zaffe entrances, weddings and live music events' },
      { name: 'Jabour Bakla', ig: 'jabour.bakla', cats: ['singer'], cities: ['Houston, TX'], cultures: ['arabic'], note: 'Houston\u2019s favorite Lebanese singer for weddings and celebrations' },
      { name: 'Salem Omran', ig: 'salem_omran_official', cats: ['singer'], cities: ['Houston, TX'], cultures: ['arabic'], note: 'Arabic wedding and festival singer in Houston' },
      { name: 'Tur\u00e1th Folkoholic Dance Theatre', ig: 'zaffadabketexas', cats: ['zaffe', 'dabke'], cities: ['Houston, TX'], top: true, note: 'Epic zaffa wedding entrances and dabke: Lebanese, Palestinian, Jordanian, Syrian, Iraqi and Egyptian. Texas and nationwide' },
      { name: 'Watan Zaffe & Dabke Group', ig: 'watanzaffegroup', cats: ['zaffe', 'dabke'], cities: ['Houston, TX'], note: 'Zaffe entrances and dabke for weddings, Houston' },
      /* top: first among the others for the same place. No cities, states or country: every US and Canadian city (they say they travel worldwide). states: every city in those states. country: everywhere in that country. notStates: not in those states. notTop: in those cities they're never in the first 3 picks, only further down the list. */
      { name: 'Zaffet Joseph', ig: 'zaffetjosephentertainment', cats: ['zaffe', 'dabke'], states: ['MI'], note: 'Michigan\u2019s first and original zaffa group: drummers, violin and DJ. Available worldwide' },
      { name: 'Zaffet El Ezz', ig: 'zaffetelezz', cats: ['zaffe', 'dabke'], states: ['CA'], note: 'Zaffe beyond traditions: weddings, engagements and parties. California based, travels nationwide' },
      { name: 'Zaffet Al-Afrah', ig: 'zaffet_al_afrah', cats: ['zaffe', 'dabke'], notTop: ['Houston, TX'], note: 'Zaffe, dabke and drummers for weddings. Detroit based, travels nationwide' },
      { name: 'Zaffet Joseph', ig: 'zaffetjosephentertainment', cats: ['zaffe', 'dabke'], notTop: ['Houston, TX'], note: 'Michigan\u2019s first and original zaffa group: drummers, violin and DJ. Available worldwide' },
      { name: 'Tur\u00e1th Folkoholic Dance Theatre', ig: 'zaffadabketexas', cats: ['zaffe', 'dabke'], country: 'US', notStates: ['MI'], note: 'Epic zaffa wedding entrances and dabke: Lebanese, Palestinian, Jordanian, Syrian, Iraqi and Egyptian. Texas and nationwide' },
      { name: 'Royal Zaffe Group', ig: 'royal_zaffe_group', cats: ['zaffe', 'dabke'], country: 'US', notTop: ['Houston, TX'], note: 'Traditional Middle Eastern zaffe grand entrance by professional musicians, across the U.S.' },
      { name: 'Jamal Kassab', ig: 'jamalkassabofficial', cats: ['singer'], states: ['CA'], cultures: ['arabic'], note: 'Arabic singer for weddings, engagements and parties across California' },
      { name: 'Salem Mawla', ig: 'salem_mawla', cats: ['singer'], states: ['CA'], cultures: ['arabic'], note: 'Arabic singer for weddings, engagements and parties across California' },
      { name: 'Ronnie Altahan', ig: 'ronnie.altahan', cats: ['singer'], states: ['CA'], cultures: ['arabic'], note: 'Arabic singer for weddings, engagements and parties across California' },
      { name: 'Farah Ibrahim', ig: 'farah_ibrahim_official', cats: ['singer'], states: ['CA'], cultures: ['arabic'], note: 'Arab star singer for weddings, engagements and parties across California' },
      { name: 'Danny Ashkar', ig: 'danyachkar', cats: ['singer'], states: ['CA'], cultures: ['arabic'], note: 'Lebanese singer for weddings, engagements and parties across California' },
      { name: 'Chris Hawat', ig: 'chrishawat', cats: ['singer'], cultures: ['arabic'], note: 'Lebanese and Arabic singer for weddings and celebrations' },
      { name: 'Tamer Aldabouqi', ig: 'tamerdabouqi', cats: ['singer'], cultures: ['arabic'], note: 'Arabic singer with a live band for weddings and celebrations' },
      /* cultures '' = every event that isn't a cultural wedding (birthdays, showers, classic weddings, parties); 'parties' = every event that isn't a wedding. */
      { name: 'DJ Yamani', ig: 'dj_yamani', cats: ['dj'], cities: ['Houston, TX'], cultures: ['arabic', ''], note: 'Arabic and American music for weddings and parties' },
      { name: 'Hammoudeh Alex', ig: 'hammoudeh.hamdan', cats: ['hairMakeup'], cities: ['Orange County, CA'], cultures: ['arabic', 'parties'], note: 'Hair stylist for brides and parties: styles, extensions, cuts, color and smoothing' },
      { name: 'Wassim Hair Stylist', ig: 'wassimhairstylist_houston', cats: ['hairMakeup'], cities: ['Houston, TX'], cultures: ['arabic'], note: 'Lebanese hair stylist, from Dubai to Houston. Color, highlights and extensions; home and hotel visits' },
      { name: 'Joseph\u2019s Fashion', ig: 'josephs_fashion', cats: ['attire'], states: ['MI'], note: 'Custom suits and tuxedos for men and women: weddings, prom and personal styling. Sterling Heights, Michigan' }
    ],
    CITIES: CITIES, COUNTRIES: COUNTRIES, PROVINCES: PROVINCES, AREAS: AREAS, STYLES: STYLES, MENUS: MENUS, DIETS: DIETS, CHECKLIST: CHECKLIST, PASSES: PASSES,
    CREDIT_PACKS: CREDIT_PACKS, PACKAGES: PACKAGES, ADDONS: ADDONS, ALLOWANCE: ALLOWANCE,
    VENUE_TYPES: VENUE_TYPES, PLAYLIST_SEARCH: PLAYLIST_SEARCH, CONTINGENCY: 0.10, SERVICE: 0.20, TIP: 0.10
  };
})(typeof window !== 'undefined' ? window : globalThis);
