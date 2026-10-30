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
    effects:      { name: 'Special effects (cold sparks, dancing on a cloud)', group: 'Style', fixed: [400, 1500], flat: true, tier: 'U' },
    danceFloor:   { name: 'Dance floor (custom vinyl or LED)', group: 'Setup', fixed: [500, 2000], tier: 'U', taxable: true },
    /* Specialty add-ons: never in a plan unless she adds them from the package. */
    chocolateFountain: { name: 'Chocolate fountain', group: 'Food and drink', fixed: [250, 800], tier: 'U', taxable: true },
    dessertBar:   { name: 'Candy and dessert bar', group: 'Food and drink', fixed: [300, 1200], tier: 'U', taxable: true },
    iceCreamCart: { name: 'Ice cream or gelato cart', group: 'Food and drink', fixed: [300, 900], tier: 'U', taxable: true },
    coffeeBar:    { name: 'Espresso and coffee bar', group: 'Food and drink', fixed: [400, 1200], tier: 'U', taxable: true },
    foodTruck:    { name: 'Food truck', group: 'Food and drink', fixed: [600, 2000], tier: 'U', taxable: true },
    popcornCart:  { name: 'Popcorn and cotton candy cart', group: 'Food and drink', fixed: [200, 600], flat: true, tier: 'U', taxable: true },
    booth360:     { name: '360 video booth', group: 'Memories', fixed: [500, 1200], flat: true, tier: 'U' },
    livePainter:  { name: 'Live event painter', group: 'Memories', fixed: [800, 2500], flat: true, tier: 'U' },
    caricature:   { name: 'Caricature artist', group: 'Music and fun', fixed: [300, 800], flat: true, tier: 'U', tip: true },
    flowerWall:   { name: 'Flower wall backdrop', group: 'Style', fixed: [300, 900], flat: true, tier: 'U', taxable: true },
    bounceHouse:  { name: 'Bounce house and inflatables', group: 'Music and fun', fixed: [200, 600], flat: true, tier: 'U' },
    facePainter:  { name: 'Face painter', group: 'Music and fun', fixed: [150, 400], flat: true, tier: 'U', tip: true },
    characterVisit: { name: 'Character visit (princess, superhero and more)', group: 'Music and fun', fixed: [175, 450], flat: true, tier: 'U', tip: true },
    gameTruck:    { name: 'Game truck or party games host', group: 'Music and fun', fixed: [300, 700], flat: true, tier: 'U' },
    magician:     { name: 'Magician or bubble show', group: 'Music and fun', fixed: [200, 500], flat: true, tier: 'U', tip: true },
    balloonTwister: { name: 'Balloon twister', group: 'Music and fun', fixed: [150, 350], flat: true, tier: 'U', tip: true },
    craftStation: { name: 'Craft or slime station', group: 'Music and fun', fixed: [150, 450], tier: 'U' },
    pettingZoo:   { name: 'Petting zoo or pony rides', group: 'Music and fun', fixed: [300, 800], flat: true, tier: 'U' },
    dj:           { name: 'DJ', group: 'Music and fun', perHour: [100, 200], tier: 'SU', tip: true },
    liveMusic:    { name: 'Live music', group: 'Music and fun', perHour: [300, 900], tier: 'U', tip: true },
    mc:           { name: 'MC or host', group: 'Music and fun', fixed: [300, 900], tier: 'U', tip: true },
    entertainment:{ name: 'Entertainment or activity', group: 'Music and fun', fixed: [200, 900], tier: 'U' },
    kids:         { name: "Kids' entertainment", group: 'Music and fun', fixed: [200, 600], tier: 'SU' },
    hairMakeup:   { name: 'Hair and makeup', group: 'Look', perPerson: [110, 260], people: 1, tier: 'SU', tip: true },
    attire:       { name: 'Attire', group: 'Look', fixed: [150, 600], tier: 'LSU', taxable: true },
    invitations:  { name: 'Printed invitations and postage', group: 'Paper', perGuest: [2.5, 7], tier: 'U', taxable: true },
    favors:       { name: 'Favors and welcome bags', group: 'Paper', perGuest: [3, 10], tier: 'SU', taxable: true },
    transport:    { name: 'Luxury transportation (limo, Rolls-Royce or party bus)', group: 'Logistics', fixed: [400, 1600], tier: 'U' },
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
    zaffe:        { name: 'Zaffe and dabke group (drums, dancers and the grand entrance)', group: 'Music and fun', fixed: [900, 2800], flat: true, tier: 'LSU', tip: true },
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
    davul:        { name: 'Davul and zurna players (drum and pipe)', group: 'Music and fun', fixed: [600, 2200], flat: true, tier: 'LSU', tip: true },
    kina:         { name: 'K\u0131na night: henna, red veil and trays', group: 'Look', fixed: [400, 1600], flat: true, tier: 'LSU', taxable: true },
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
    wedding: ['venue', 'catering', 'bar', 'bartender', 'cake', 'rentals', 'decor', 'florals', 'lighting', 'dj', 'singer', 'liveMusic', 'mc', 'photographer', 'videographer', 'photoBooth', 'favors', 'invitations', 'attire', 'hairMakeup', 'officiant', 'transport', 'security', 'coordinator', 'cleanup', 'insurance', 'parking'],
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
      music: [['zaffe', 'Zaffe and dabke group'], ['liveMusic', 'Live band'], ['singer', 'Singer'], ['dj', 'DJ']], musicDefault: ['zaffe', 'liveMusic', 'dj', 'singer'],
      add: ['kosha'],
      labels: { liveMusic: 'Live band (Arabic music)', singer: 'Arabic wedding singer', officiant: 'Officiant (sheikh or priest)', catering: 'Middle Eastern catering', cake: 'Wedding cake and Arabic sweets', dj: 'DJ (Arabic and international music)' },
      search: { liveMusic: 'arabic wedding band', singer: 'arabic wedding singer', dj: 'arabic wedding DJ', zaffe: 'zaffe group wedding', dabke: 'dabke dance group', kosha: 'wedding kosha stage decor', catering: 'middle eastern mediterranean catering', officiant: 'sheikh imam or priest wedding officiant' },
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
      music: [['dhol', 'Dhol player'], ['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dhol', 'dj', 'singer'],
      add: ['mandap', 'mehndi', 'baraat'],
      labels: { officiant: 'Pandit (priest) for the ceremony', catering: 'Indian catering', dj: 'DJ (Bollywood and bhangra)', liveMusic: 'Live band (Indian music)', singer: 'Wedding singer (Indian music)', cake: 'Wedding cake and mithai' },
      search: { dhol: 'dhol player', dj: 'indian wedding DJ', liveMusic: 'indian wedding band', singer: 'indian wedding singer', mandap: 'mandap decor rental', mehndi: 'mehndi henna artist', baraat: 'baraat horse rental', catering: 'indian wedding catering', officiant: 'hindu priest pandit wedding', photographer: 'indian wedding photographer', hairMakeup: 'indian bridal makeup artist', decor: 'indian wedding decor' },
      hint: 'indian,desi,south asian,bollywood,punjabi,dhol,mandap,mehndi,henna',
      moments: [[-60, 'Baraat: the groom arrives with dhol and dancing'], [-15, 'Milni: the families greet each other'], [0, 'Ceremony at the mandap'], [90, 'Cocktail hour and appetizers'], [150, 'Grand entrance and dinner'], [210, 'Speeches and first dance'], [240, 'Dancing'], ['end', 'Vidaai: the send-off']]
    },
    persian: {
      name: 'Persian wedding', guests: 200, hours: 6, menu: 'persian', blurb: 'Sofreh aghd, the aghd ceremony, live Persian music, the knife dance and jeweled rice.',
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dj', 'liveMusic', 'singer'],
      add: ['sofreh'],
      labels: { officiant: 'Aghd officiant', catering: 'Persian catering', dj: 'DJ (Persian and international music)', liveMusic: 'Live band (Persian music)', singer: 'Persian wedding singer', cake: 'Wedding cake and Persian sweets' },
      search: { dj: 'persian wedding DJ', liveMusic: 'persian wedding band', singer: 'persian wedding singer', sofreh: 'sofreh aghd', catering: 'persian catering', officiant: 'persian aghd officiant' },
      hint: 'persian,iranian,sofreh,aghd',
      moments: [[-30, 'Guests arrive'], [0, 'Aghd ceremony at the sofreh'], [45, 'Sugar rubbed over a cloth held above the couple, and blessings'], [75, 'Grand entrance'], [90, 'Dinner'], [150, 'Knife dance and cake cutting'], [180, 'Dancing'], ['end', 'Send-off']]
    },
    pakistani: {
      name: 'Pakistani wedding', guests: 300, hours: 6, menu: 'pakistani', blurb: 'Nikah with an imam, the baraat with dhol, a stage for the couple, qawwali and the rukhsati.',
      music: [['dhol', 'Dhol player'], ['dj', 'DJ'], ['qawwali', 'Qawwali group'], ['singer', 'Singer'], ['liveMusic', 'Live band']], musicDefault: ['dhol', 'dj', 'singer'],
      add: ['kosha', 'mehndi'], pre: 'With the blessings of their families',
      labels: { kosha: 'Stage and seating for the couple', officiant: 'Imam or maulvi for the nikah', catering: 'Pakistani catering', dj: 'DJ (Punjabi, Bollywood and pop)', cake: 'Wedding cake and mithai', mehndi: 'Mehndi (henna) artist for the bride and family' },
      search: { dhol: 'dhol player', dj: 'pakistani wedding DJ', qawwali: 'qawwali group', singer: 'pakistani wedding singer', kosha: 'pakistani wedding stage decor', mehndi: 'mehndi henna artist', catering: 'pakistani catering', officiant: 'imam nikah officiant', photographer: 'pakistani wedding photographer', hairMakeup: 'pakistani bridal makeup artist', decor: 'pakistani wedding decor' },
      hint: 'pakistani,desi,south asian,nikah,mehndi,dhol,halal',
      moments: [[-60, 'Baraat: the groom and his family arrive with dhol'], [0, 'Nikah ceremony'], [45, 'The couple takes the stage'], [75, 'Dinner'], [150, 'Photos with family and friends'], [180, 'Music and dancing'], ['end', 'Rukhsati: the bride\u2019s send-off']]
    },
    mexican: {
      name: 'Mexican wedding', guests: 200, hours: 6, menu: 'mexican', blurb: 'Padrinos, the lazo and arras, mariachi, the v\u00edbora de la mar and the money dance.',
      music: [['mariachi', 'Mariachi'], ['liveMusic', 'Banda or live band'], ['dj', 'DJ'], ['singer', 'Singer']], musicDefault: ['mariachi', 'dj', 'singer'],
      add: ['lazo'], pre: 'Together with their families and padrinos',
      labels: { officiant: 'Priest or officiant', catering: 'Mexican catering', liveMusic: 'Banda or live band', dj: 'DJ (Latin and pop)', cake: 'Wedding cake and Mexican sweets' },
      search: { mariachi: 'mariachi band', liveMusic: 'banda musical para bodas', dj: 'latin wedding DJ', catering: 'mexican catering', officiant: 'catholic wedding priest', lazo: 'wedding lazo arras', photographer: 'latino wedding photographer' },
      hint: 'mexican,latino,latina,hispanic,boda,mariachi,taqueria',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony with the lazo and arras'], [45, 'Cocktail hour with mariachi'], [105, 'Grand entrance and dinner'], [165, 'First dance and the money dance'], [195, 'La v\u00edbora de la mar'], [225, 'Cake and dancing'], ['end', 'Send-off']]
    },
    chinese: {
      name: 'Chinese wedding', guests: 200, hours: 5, menu: 'chinese', blurb: 'Tea ceremony, red and gold, the door games, a banquet of many courses and lion dancers.',
      music: [['dj', 'DJ'], ['singer', 'Singer'], ['liveMusic', 'Live band'], ['lionDance', 'Lion dance troupe']], musicDefault: ['dj', 'lionDance', 'singer'],
      add: ['teaCeremony'], pre: 'Together with their families',
      labels: { catering: 'Chinese banquet (8 to 10 courses)', cake: 'Wedding cake and Chinese desserts', decor: 'Red and gold decor with double happiness' },
      search: { lionDance: 'lion dance troupe', dj: 'chinese wedding DJ', liveMusic: 'wedding band', catering: 'chinese banquet restaurant', teaCeremony: 'chinese tea ceremony set', photographer: 'chinese wedding photographer', decor: 'chinese wedding decor', hairMakeup: 'asian bridal makeup artist' },
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
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dj', 'singer'],
      add: ['pyebaek'], pre: 'Together with their families',
      labels: { catering: 'Korean catering', cake: 'Wedding cake and rice cakes (tteok)' },
      search: { dj: 'korean wedding DJ', pyebaek: 'pyebaek ceremony hanbok rental', catering: 'korean catering', photographer: 'korean wedding photographer', hairMakeup: 'korean bridal makeup artist' },
      hint: 'korean,hanbok,pyebaek,kbbq',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony'], [40, 'Pyebaek in hanbok with the families'], [90, 'Grand entrance and dinner'], [150, 'Toasts and first dance'], [180, 'Cake and dancing'], ['end', 'Send-off']]
    },
    filipino: {
      name: 'Filipino wedding', guests: 200, hours: 6, menu: 'filipino', blurb: 'Veil, cord and coin sponsors, the money dance, a live band and lechon.',
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dj', 'singer'],
      add: ['sponsors'], pre: 'Together with their families and principal sponsors',
      labels: { catering: 'Filipino catering (with lechon)', cake: 'Wedding cake and Filipino desserts', officiant: 'Priest or officiant' },
      search: { dj: 'filipino wedding DJ', singer: 'filipino wedding singer', catering: 'filipino catering lechon', photographer: 'filipino wedding photographer', officiant: 'catholic wedding priest' },
      hint: 'filipino,pinoy,lechon,ninong,ninang',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony with the veil, cord and coins'], [60, 'Cocktail hour'], [105, 'Grand entrance and dinner'], [165, 'First dance and the money dance'], [195, 'Cake and dancing'], ['end', 'Send-off']]
    },
    nigerian: {
      name: 'Nigerian wedding', guests: 300, hours: 6, menu: 'nigerian', blurb: 'Aso ebi for guests, gele, a lively MC, a live band, spraying money and jollof.',
      music: [['liveMusic', 'Live band (highlife or juju)'], ['dj', 'DJ'], ['singer', 'Singer']], musicDefault: ['liveMusic', 'dj', 'singer'],
      add: ['gele', 'mc'], pre: 'Together with their families',
      labels: { catering: 'Nigerian catering', liveMusic: 'Live band (highlife or juju)', dj: 'DJ (Afrobeats and more)', mc: 'MC to run the reception', cake: 'Wedding cake and small chops' },
      search: { liveMusic: 'nigerian live band', dj: 'afrobeats wedding DJ', mc: 'nigerian wedding MC', catering: 'nigerian catering', gele: 'gele tying stylist', photographer: 'nigerian wedding photographer', hairMakeup: 'nigerian bridal makeup artist', decor: 'nigerian wedding decor' },
      hint: 'nigerian,naija,yoruba,igbo,african,afrobeats,aso ebi',
      moments: [[-30, 'Guests arrive in aso ebi'], [0, 'Grand entrance of the families'], [30, 'The couple dances in as guests spray money'], [60, 'Dinner'], [120, 'Toasts and the cake'], [150, 'Dancing and spraying'], ['end', 'Send-off']]
    },
    africanamerican: {
      name: 'African American wedding', guests: 175, hours: 6, menu: 'soul', blurb: 'Choose the traditions you love: jumping the broom, a libation ceremony, gospel, kente, line dances and a second line.',
      chipsTitle: 'Music and traditions', chipsNote: 'Pick only what you want. Each one you choose gets its own line in your budget and its own vendor options.',
      music: [['dj', 'DJ'], ['singer', 'Singer'], ['liveMusic', 'Live band'], ['gospel', 'Gospel choir or soloist'], ['broom', 'Jumping the broom'], ['libation', 'Libation ceremony'], ['elements', 'Tasting the four elements'], ['kente', 'Kente accents'], ['secondLine', 'Second line']], musicDefault: ['dj', 'singer'],
      add: [], pre: 'Together with their families',
      labels: { catering: 'Catering (soul food or Southern)', dj: 'DJ (R&B, hip-hop and line dances)', cake: 'Wedding cake (red velvet, pound cake) and desserts' },
      search: { gospel: 'gospel choir for weddings', dj: 'wedding DJ r&b hip hop', liveMusic: 'wedding band r&b soul', catering: 'soul food catering', secondLine: 'second line brass band', kente: 'kente stole', broom: 'jumping the broom wedding broom', photographer: 'wedding photographer', hairMakeup: 'bridal hair and makeup artist for black women' },
      hint: 'black,african american,soul,gospel',
      moments: [[-30, 'Guests arrive'], [-5, 'Libation ceremony honoring the ancestors', 'libation'], [0, 'Ceremony'], [20, 'Tasting the four elements', 'elements'], [35, 'Jumping the broom', 'broom'], [60, 'Cocktail hour'], [105, 'Grand entrance and dinner'], [165, 'First dance and toasts'], [195, 'Line dances: the Electric Slide, the Cupid Shuffle and the Wobble'], [225, 'Cake and dancing'], ['end', 'Second line send-off', 'secondLine'], ['end', 'Send-off']]
    },
    spanish: {
      name: 'Spanish wedding', guests: 180, hours: 7, menu: 'spanish', blurb: 'The 13 arras coins and padrinos, a jam\u00f3n carver, a late dinner, detalles for guests and flamenco or rumba.',
      music: [['dj', 'DJ'], ['flamenco', 'Flamenco or rumba'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dj', 'flamenco', 'singer'],
      add: ['lazo', 'jamon'], pre: 'Together with their families and padrinos',
      labels: { lazo: 'Arras (13 coins) and padrinos gifts', catering: 'Spanish catering', favors: 'Detalles (small gifts for every guest)', cake: 'Wedding cake and Spanish sweets', officiant: 'Priest or officiant' },
      search: { flamenco: 'flamenco rumba group', dj: 'spanish wedding DJ', catering: 'spanish catering tapas', jamon: 'jamon carver cortador', photographer: 'wedding photographer' },
      hint: 'spanish,spain,espanol,tapas,flamenco,paella',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony with the arras and padrinos'], [60, 'C\u00f3ctel with the jam\u00f3n carver'], [120, 'Grand entrance and dinner'], [210, 'Detalles for the guests and the tie is cut and \u201csold\u201d'], [240, 'First dance and dancing'], ['end', 'Send-off']]
    },
    russian: {
      name: 'Russian wedding', guests: 120, hours: 7, menu: 'russian', blurb: 'The bread-and-salt welcome, a tamada who runs the night, toasts, \u201cGorko!\u201d and a long feast.',
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['dj', 'singer'],
      add: ['mc', 'karavai'], pre: 'Together with their families',
      labels: { mc: 'Tamada (toastmaster and host)', catering: 'Russian and Eastern European catering', singer: 'Wedding singer (Russian and English)', cake: 'Wedding cake and Russian desserts' },
      search: { mc: 'russian wedding tamada host', dj: 'russian wedding DJ', singer: 'russian wedding singer', catering: 'russian restaurant banquet', karavai: 'russian bakery karavai', photographer: 'russian wedding photographer' },
      hint: 'russian,ukrainian,slavic,tamada,banquet',
      moments: [[-150, 'The bride ransom games at her home'], [0, 'Guests arrive'], [20, 'Bread-and-salt welcome with the karavai'], [40, 'The tamada opens the feast with zakuski'], [90, 'Toasts and \u201cGorko!\u201d'], [150, 'Hot dishes, games and dancing'], [240, 'Cake'], ['end', 'Send-off']]
    },
    moroccan: {
      name: 'Moroccan wedding', guests: 250, hours: 7, menu: 'moroccan', blurb: 'A negafa and several outfit changes, the amariya, dakka or Andalusian music, mint tea and pastilla.',
      music: [['dakka', 'Dakka or Andalusian band'], ['dj', 'DJ'], ['singer', 'Singer']], musicDefault: ['dakka', 'dj', 'singer'],
      add: ['negafa', 'teaCeremony', 'mehndi'], pre: 'With the blessing of God and their families',
      labels: { teaCeremony: 'Moroccan mint tea service', mehndi: 'Henna artist for the henna night', catering: 'Moroccan catering', officiant: 'Imam or officiant', cake: 'Wedding cake and Moroccan pastries', kosha: 'Stage for the couple' },
      search: { dakka: 'dakka marrakchia band', dj: 'moroccan wedding DJ', singer: 'moroccan wedding singer', negafa: 'negafa moroccan wedding', catering: 'moroccan catering', teaCeremony: 'moroccan tea service', mehndi: 'henna artist', photographer: 'moroccan wedding photographer' },
      hint: 'moroccan,maghreb,arab,negafa,takchita,kaftan,amariya',
      moments: [[-30, 'Guests arrive to mint tea and pastries'], [0, 'The couple enters on the amariya to dakka drums'], [45, 'First outfit and photos'], [90, 'Dinner: pastilla, tagine and mechoui'], [150, 'Outfit changes and dancing'], [240, 'Cake and the final outfit'], ['end', 'Send-off']]
    },
    greek: {
      name: 'Greek wedding', guests: 200, hours: 6, menu: 'greek', blurb: 'The stefana crowns and koumbaro, the Dance of Isaiah, a Greek band and the money dance.',
      music: [['liveMusic', 'Greek band (bouzouki)'], ['dj', 'DJ'], ['singer', 'Singer']], musicDefault: ['liveMusic', 'dj', 'singer'],
      add: ['stefana'], pre: 'With the blessing of God and their families',
      labels: { officiant: 'Greek Orthodox priest', catering: 'Greek catering', liveMusic: 'Greek band (bouzouki)', cake: 'Wedding cake and Greek sweets' },
      search: { liveMusic: 'greek band bouzouki', dj: 'greek wedding DJ', catering: 'greek catering', officiant: 'greek orthodox church wedding', stefana: 'stefana wedding crowns', photographer: 'greek wedding photographer' },
      hint: 'greek,hellenic,orthodox,bouzouki',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony with the stefana crowns and the Dance of Isaiah'], [60, 'Cocktail hour'], [105, 'Grand entrance and dinner'], [165, 'First dance and the money dance'], [195, 'Kalamatianos circle dance'], [225, 'Cake and dancing'], ['end', 'Send-off']]
    },
    turkish: {
      name: 'Turkish wedding', guests: 250, hours: 6, menu: 'turkish', blurb: 'The k\u0131na henna night, davul and zurna, the gold pinning, halay dancing and a Turkish feast.', pre: 'With the blessing of their families',
      music: [['davul', 'Davul and zurna'], ['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer']], musicDefault: ['davul', 'dj', 'singer'],
      add: ['kina'],
      labels: { catering: 'Turkish catering', dj: 'DJ (Turkish and international music)', liveMusic: 'Live band (Turkish music)', singer: 'Turkish wedding singer', cake: 'Wedding cake and Turkish sweets', officiant: 'Officiant or imam' },
      search: { davul: 'davul zurna', dj: 'turkish wedding DJ', liveMusic: 'turkish wedding band', singer: 'turkish wedding singer', catering: 'turkish catering', kina: 'henna artist', photographer: 'turkish wedding photographer' },
      hint: 'turkish,turkey,istanbul,anatolian,kina,henna,davul,zurna,halay',
      moments: [[-30, 'Guests arrive to Turkish coffee and lokum'], [0, 'The couple enters to davul and zurna'], [20, 'Ceremony and the shoe signing'], [45, 'First dance'], [75, 'Dinner'], [135, 'Tak\u0131 t\u00f6reni: gold pinning for the couple'], [165, 'Halay and dancing'], [225, 'Cake and sweets'], ['end', 'Send-off']]
    },
    fusion: {
      name: 'Multicultural fusion wedding', guests: 200, hours: 6, menu: 'fusion', blurb: 'Two families, two traditions: blend the music, rituals and food you both love, from a dhol or zaffe entrance to mariachi and a henna night.',
      chipsTitle: 'Music and traditions from both families', chipsNote: 'Pick everything you want to blend. Each one gets its own line in your budget and its own vendor options.',
      music: [['dj', 'DJ'], ['liveMusic', 'Live band'], ['singer', 'Singer'], ['dhol', 'Dhol player'], ['zaffe', 'Zaffe and dabke group'], ['mariachi', 'Mariachi'], ['mehndi', 'Henna night'], ['teaCeremony', 'Tea ceremony']], musicDefault: ['dj', 'liveMusic', 'singer'],
      add: [], pre: 'Together with their families',
      labels: { catering: 'Catering with dishes from both families', dj: 'DJ (music from both cultures)', cake: 'Wedding cake and desserts from both families', mehndi: 'Henna artist for the henna night' },
      search: { dj: 'multicultural wedding DJ', liveMusic: 'wedding band', singer: 'wedding singer', dhol: 'dhol player', zaffe: 'zaffe group wedding', mariachi: 'mariachi band', mehndi: 'henna artist', teaCeremony: 'tea ceremony wedding', catering: 'international fusion catering', photographer: 'multicultural wedding photographer' },
      hint: 'fusion,multicultural,bicultural,interfaith,international',
      moments: [[-30, 'Guests arrive'], [0, 'Ceremony honoring both families'], [40, 'Cocktail hour with dishes from both cultures'], [100, 'Grand entrance and dinner'], [160, 'First dance and toasts'], [190, 'Dancing to music from both cultures'], [240, 'Cake and sweets'], ['end', 'Send-off']]
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
  /* Countries beyond the US and Canada. Prices: the US estimate x the city's price level x units per US dollar (rates of Oct 2026). No tipping lines outside the US and Canada. */
  /* Package add-ons, by group, with the occasions each one suits. A list means only those occasions; "not" means every occasion but those. */
  var WED = ['wedding', 'engagement', 'anniversary'], CELEB = ['birthday', 'milestone', 'quince', 'sweet16', 'graduation', 'retirement', 'bachelorette'], SHOWER = ['bridal-shower', 'baby-shower', 'gender-reveal', 'brunch'];
  var PKG_ADDONS = [
    { group: 'Kids\u2019 fun', items: [
      { id: 'characterVisit', kids: true }, { id: 'bounceHouse', kids: true, settings: ['home', 'outdoor'] }, { id: 'gameTruck', kids: true }, { id: 'magician', kids: true },
      { id: 'balloonTwister', kids: true }, { id: 'facePainter', kids: true }, { id: 'craftStation', kids: true }, { id: 'pettingZoo', kids: true, settings: ['home', 'outdoor'] } ] },
    { group: 'Food and treats', items: [
      { id: 'cake', not: ['corporate'] },
      { id: 'chocolateFountain', not: ['dinner', 'retirement'] },
      { id: 'dessertBar', not: ['dinner'] },
      { id: 'iceCreamCart', only: WED.concat(CELEB, SHOWER, ['kids-birthday', 'corporate', 'other']) },
      { id: 'coffeeBar', only: WED.concat(['gala', 'corporate', 'bridal-shower', 'baby-shower', 'brunch', 'holiday', 'christmas', 'retirement', 'milestone', 'other']) },
      { id: 'foodTruck', only: ['wedding', 'birthday', 'milestone', 'graduation', 'corporate', 'kids-birthday', 'sweet16', 'quince', 'retirement', 'bachelorette', 'other'] },
      { id: 'popcornCart', only: ['kids-birthday', 'birthday', 'sweet16', 'quince', 'graduation', 'baby-shower', 'gender-reveal', 'corporate'] } ] },
    { group: 'Photos and memories', items: [
      { id: 'photographer' }, { id: 'videographer' },
      { id: 'photoBooth' },
      { id: 'booth360', only: WED.concat(['birthday', 'milestone', 'quince', 'sweet16', 'graduation', 'bachelorette', 'corporate', 'gala', 'holiday', 'christmas']) },
      { id: 'livePainter', only: ['wedding', 'engagement', 'anniversary', 'gala', 'quince'] } ] },
    { group: 'Music and fun', items: [
      { id: 'dj' }, { id: 'liveMusic' },
      { id: 'caricature', only: ['birthday', 'kids-birthday', 'graduation', 'corporate', 'sweet16', 'retirement', 'holiday', 'christmas', 'milestone'] },
      ] },
    { group: 'Style and wow', items: [
      { id: 'florals' }, { id: 'decor' },
      { id: 'flowerWall', only: WED.concat(CELEB, SHOWER, ['gala']) },
      { id: 'balloons', not: ['wedding', 'gala', 'engagement', 'anniversary', 'dinner'] },
      { id: 'lighting' },
      { id: 'effects', only: ['wedding', 'engagement', 'anniversary', 'quince', 'sweet16', 'gala', 'milestone', 'birthday'] },
      { id: 'danceFloor', only: ['wedding', 'engagement', 'anniversary', 'quince', 'sweet16', 'gala', 'milestone', 'birthday', 'graduation', 'corporate', 'holiday', 'christmas'] } ] },
    { group: 'Services', items: [
      { id: 'hairMakeup', not: ['dinner', 'holiday', 'christmas', 'corporate', 'other', 'kids-birthday', 'retirement'] },
      { id: 'transport' }, { id: 'coordinator' }, { id: 'favors' }, { id: 'invitations' } ] }
  ];
  /* At a restaurant: only what you'd bring to the table. */
  var PKG_ADDONS_RESTAURANT = ['photographer', 'videographer', 'florals', 'cake', 'favors', 'invitations', 'transport'];
  var INTL = [{"id":"GB","name":"United Kingdom","short":"UK","currency":"GBP","sym":"£","fx":0.750779,"tax":20,"taxName":"VAT","km":false,"amazon":"amazon.co.uk","adj":"UK","cities":[["London",1.3],["Manchester",0.95],["Birmingham",0.9],["Edinburgh",1.05],["Glasgow",0.9],["Cotswolds",1.15]],"otherLevel":0.96},{"id":"IE","name":"Ireland","short":"Ireland","currency":"EUR","sym":"€","fx":0.896861,"tax":23,"taxName":"VAT","km":true,"amazon":"amazon.co.uk","adj":"Irish","cities":[["Dublin",1.15],["Cork",0.95]],"otherLevel":0.97},{"id":"FR","name":"France","short":"France","currency":"EUR","sym":"€","fx":0.896861,"tax":20,"taxName":"VAT","km":true,"amazon":"amazon.fr","adj":"French","cities":[["Paris",1.3],["Nice",1.2],["Lyon",0.95],["Provence",1.15]],"otherLevel":1.06},{"id":"IT","name":"Italy","short":"Italy","currency":"EUR","sym":"€","fx":0.896861,"tax":22,"taxName":"VAT","km":true,"amazon":"amazon.it","adj":"Italian","cities":[["Rome",1.0],["Milan",1.1],["Florence",1.2],["Lake Como",1.6],["Amalfi Coast",1.5],["Tuscany",1.25]],"otherLevel":1.17},{"id":"ES","name":"Spain","short":"Spain","currency":"EUR","sym":"€","fx":0.896861,"tax":21,"taxName":"VAT","km":true,"amazon":"amazon.es","adj":"Spanish","cities":[["Madrid",0.85],["Barcelona",0.95],["Marbella",1.05],["Seville",0.8],["Mallorca",1.0]],"otherLevel":0.86},{"id":"PT","name":"Portugal","short":"Portugal","currency":"EUR","sym":"€","fx":0.896861,"tax":23,"taxName":"VAT","km":true,"amazon":"amazon.es","adj":"Portuguese","cities":[["Lisbon",0.8],["Porto",0.7],["Algarve",0.8]],"otherLevel":0.71},{"id":"GR","name":"Greece","short":"Greece","currency":"EUR","sym":"€","fx":0.896861,"tax":24,"taxName":"VAT","km":true,"amazon":"amazon.de","adj":"Greek","cities":[["Athens",0.75],["Santorini",1.2],["Mykonos",1.3]],"otherLevel":1.0},{"id":"DE","name":"Germany","short":"Germany","currency":"EUR","sym":"€","fx":0.896861,"tax":19,"taxName":"VAT","km":true,"amazon":"amazon.de","adj":"German","cities":[["Berlin",0.95],["Munich",1.05],["Frankfurt",0.95],["Hamburg",0.95]],"otherLevel":0.9},{"id":"NL","name":"Netherlands","short":"Netherlands","currency":"EUR","sym":"€","fx":0.896861,"tax":21,"taxName":"VAT","km":true,"amazon":"amazon.nl","adj":"Dutch","cities":[["Amsterdam",1.1],["Rotterdam",0.95]],"otherLevel":0.94},{"id":"BE","name":"Belgium","short":"Belgium","currency":"EUR","sym":"€","fx":0.896861,"tax":21,"taxName":"VAT","km":true,"amazon":"amazon.com.be","adj":"Belgian","cities":[["Brussels",0.95]],"otherLevel":0.87},{"id":"CH","name":"Switzerland","short":"Switzerland","currency":"CHF","sym":"CHF ","fx":0.82879,"tax":8.1,"taxName":"VAT","km":true,"amazon":"amazon.de","adj":"Swiss","cities":[["Zurich",1.6],["Geneva",1.6]],"otherLevel":1.47},{"id":"AT","name":"Austria","short":"Austria","currency":"EUR","sym":"€","fx":0.896861,"tax":20,"taxName":"VAT","km":true,"amazon":"amazon.de","adj":"Austrian","cities":[["Vienna",1.0],["Salzburg",1.0]],"otherLevel":0.92},{"id":"SE","name":"Sweden","short":"Sweden","currency":"SEK","sym":"SEK ","fx":9.93677,"tax":25,"taxName":"VAT","km":true,"amazon":"amazon.se","adj":"Swedish","cities":[["Stockholm",1.1]],"otherLevel":1.01},{"id":"DK","name":"Denmark","short":"Denmark","currency":"DKK","sym":"DKK ","fx":6.7033,"tax":25,"taxName":"VAT","km":true,"amazon":"amazon.de","adj":"Danish","cities":[["Copenhagen",1.2]],"otherLevel":1.1},{"id":"NO","name":"Norway","short":"Norway","currency":"NOK","sym":"NOK ","fx":9.317,"tax":25,"taxName":"VAT","km":true,"amazon":"amazon.se","adj":"Norwegian","cities":[["Oslo",1.25]],"otherLevel":1.15},{"id":"PL","name":"Poland","short":"Poland","currency":"PLN","sym":"PLN ","fx":3.9542,"tax":23,"taxName":"VAT","km":true,"amazon":"amazon.pl","adj":"Polish","cities":[["Warsaw",0.6],["Krakow",0.55]],"otherLevel":0.53},{"id":"CZ","name":"Czech Republic","short":"Czechia","currency":"CZK","sym":"CZK ","fx":21.834,"tax":21,"taxName":"VAT","km":true,"amazon":"amazon.de","adj":"Czech","cities":[["Prague",0.65]],"otherLevel":0.6},{"id":"HU","name":"Hungary","short":"Hungary","currency":"HUF","sym":"HUF ","fx":328.979,"tax":27,"taxName":"VAT","km":true,"amazon":"amazon.de","adj":"Hungarian","cities":[["Budapest",0.55]],"otherLevel":0.51},{"id":"HR","name":"Croatia","short":"Croatia","currency":"EUR","sym":"€","fx":0.896861,"tax":25,"taxName":"VAT","km":true,"amazon":"amazon.de","adj":"Croatian","cities":[["Dubrovnik",0.9],["Split",0.8]],"otherLevel":0.78},{"id":"CY","name":"Cyprus","short":"Cyprus","currency":"EUR","sym":"€","fx":0.896861,"tax":19,"taxName":"VAT","km":true,"amazon":"amazon.de","adj":"Cypriot","cities":[["Limassol",0.8],["Paphos",0.75]],"otherLevel":0.71},{"id":"TR","name":"Turkey","short":"Turkey","currency":"TRY","sym":"₺","fx":49.8361,"tax":20,"taxName":"VAT","km":true,"amazon":"amazon.com.tr","adj":"Turkish","cities":[["Istanbul",0.6],["Antalya",0.5],["Bodrum",0.75],["Izmir",0.5]],"otherLevel":0.54},{"id":"AE","name":"United Arab Emirates","short":"UAE","currency":"AED","sym":"AED ","fx":3.6725,"tax":5,"taxName":"VAT","km":true,"amazon":"amazon.ae","adj":"UAE","cities":[["Dubai",1.3],["Abu Dhabi",1.25],["Sharjah",0.9]],"otherLevel":1.06},{"id":"SA","name":"Saudi Arabia","short":"Saudi Arabia","currency":"SAR","sym":"SAR ","fx":3.75,"tax":15,"taxName":"VAT","km":true,"amazon":"amazon.sa","adj":"Saudi","cities":[["Riyadh",1.1],["Jeddah",1.0],["Dammam",0.9],["AlUla",1.3]],"otherLevel":0.99},{"id":"QA","name":"Qatar","short":"Qatar","currency":"QAR","sym":"QAR ","fx":3.64,"tax":0,"taxName":"VAT","km":true,"amazon":"amazon.ae","adj":"Qatari","cities":[["Doha",1.3]],"otherLevel":1.2},{"id":"KW","name":"Kuwait","short":"Kuwait","currency":"KWD","sym":"KWD ","fx":0.30815,"tax":0,"taxName":"VAT","km":true,"amazon":"amazon.ae","adj":"Kuwaiti","cities":[["Kuwait City",1.0]],"otherLevel":0.92},{"id":"BH","name":"Bahrain","short":"Bahrain","currency":"BHD","sym":"BHD ","fx":0.377577,"tax":10,"taxName":"VAT","km":true,"amazon":"amazon.ae","adj":"Bahraini","cities":[["Manama",0.9]],"otherLevel":0.83},{"id":"OM","name":"Oman","short":"Oman","currency":"OMR","sym":"OMR ","fx":0.3845,"tax":5,"taxName":"VAT","km":true,"amazon":"amazon.ae","adj":"Omani","cities":[["Muscat",0.9]],"otherLevel":0.83},{"id":"JO","name":"Jordan","short":"Jordan","currency":"JOD","sym":"JOD ","fx":0.709249,"tax":16,"taxName":"sales tax","km":true,"amazon":"amazon.ae","adj":"Jordanian","cities":[["Amman",0.55],["Aqaba",0.6],["Dead Sea",0.8]],"otherLevel":0.6},{"id":"LB","name":"Lebanon","short":"Lebanon","currency":"USD","sym":"US$","fx":1,"tax":11,"taxName":"VAT","km":true,"amazon":"amazon.ae","adj":"Lebanese","cities":[["Beirut",0.6],["Jounieh",0.55],["Byblos",0.55]],"otherLevel":0.52},{"id":"EG","name":"Egypt","short":"Egypt","currency":"EGP","sym":"EGP ","fx":56.0383,"tax":14,"taxName":"VAT","km":true,"amazon":"amazon.eg","adj":"Egyptian","cities":[["Cairo",0.3],["Alexandria",0.25],["Sharm El Sheikh",0.35],["El Gouna",0.4]],"otherLevel":0.3},{"id":"MA","name":"Morocco","short":"Morocco","currency":"MAD","sym":"MAD ","fx":9.82006,"tax":20,"taxName":"VAT","km":true,"amazon":"amazon.fr","adj":"Moroccan","cities":[["Marrakech",0.5],["Casablanca",0.45],["Rabat",0.4]],"otherLevel":0.41},{"id":"IL","name":"Israel","short":"Israel","currency":"ILS","sym":"₪","fx":3.078,"tax":18,"taxName":"VAT","km":true,"amazon":"amazon.com","adj":"Israeli","cities":[["Tel Aviv",1.1],["Jerusalem",0.95]],"otherLevel":0.94},{"id":"IN","name":"India","short":"India","currency":"INR","sym":"₹","fx":95.1623,"tax":18,"taxName":"GST","km":true,"amazon":"amazon.in","adj":"Indian","cities":[["Mumbai",0.55],["Delhi",0.55],["Bangalore",0.5],["Hyderabad",0.45],["Jaipur",0.6],["Udaipur",0.75],["Goa",0.6],["Chennai",0.45]],"otherLevel":0.51},{"id":"PK","name":"Pakistan","short":"Pakistan","currency":"PKR","sym":"Rs ","fx":276.647,"tax":16,"taxName":"sales tax","km":true,"amazon":"amazon.com","adj":"Pakistani","cities":[["Karachi",0.35],["Lahore",0.35],["Islamabad",0.35]],"otherLevel":0.32},{"id":"BD","name":"Bangladesh","short":"Bangladesh","currency":"BDT","sym":"৳","fx":124.188,"tax":15,"taxName":"VAT","km":true,"amazon":"amazon.in","adj":"Bangladeshi","cities":[["Dhaka",0.25]],"otherLevel":0.23},{"id":"LK","name":"Sri Lanka","short":"Sri Lanka","currency":"LKR","sym":"LKR ","fx":331.856,"tax":18,"taxName":"VAT","km":true,"amazon":"amazon.in","adj":"Sri Lankan","cities":[["Colombo",0.35]],"otherLevel":0.32},{"id":"CN","name":"China","short":"China","currency":"CNY","sym":"CN¥","fx":6.6684,"tax":6,"taxName":"VAT","km":true,"amazon":"amazon.com","adj":"Chinese","cities":[["Shanghai",0.8],["Beijing",0.75]],"otherLevel":0.71},{"id":"HK","name":"Hong Kong","short":"Hong Kong","currency":"HKD","sym":"HK$","fx":7.84495,"tax":0,"taxName":"tax","km":true,"amazon":"amazon.com","adj":"Hong Kong","cities":[["Hong Kong",1.2]],"otherLevel":1.1},{"id":"TW","name":"Taiwan","short":"Taiwan","currency":"TWD","sym":"NT$","fx":31.0,"tax":5,"taxName":"VAT","km":true,"amazon":"amazon.com","adj":"Taiwanese","cities":[["Taipei",0.7]],"otherLevel":0.64},{"id":"JP","name":"Japan","short":"Japan","currency":"JPY","sym":"¥","fx":157.65,"tax":10,"taxName":"consumption tax","km":true,"amazon":"amazon.co.jp","adj":"Japanese","cities":[["Tokyo",1.1],["Osaka",1.0],["Kyoto",1.1]],"otherLevel":0.98},{"id":"KR","name":"South Korea","short":"South Korea","currency":"KRW","sym":"₩","fx":1322.6,"tax":10,"taxName":"VAT","km":true,"amazon":"amazon.com","adj":"Korean","cities":[["Seoul",0.9],["Busan",0.8],["Jeju",0.85]],"otherLevel":0.78},{"id":"SG","name":"Singapore","short":"Singapore","currency":"SGD","sym":"S$","fx":1.2803,"tax":9,"taxName":"GST","km":true,"amazon":"amazon.sg","adj":"Singapore","cities":[["Singapore",1.2]],"otherLevel":1.1},{"id":"MY","name":"Malaysia","short":"Malaysia","currency":"MYR","sym":"RM ","fx":4.0855,"tax":8,"taxName":"SST","km":true,"amazon":"amazon.sg","adj":"Malaysian","cities":[["Kuala Lumpur",0.5],["Penang",0.45]],"otherLevel":0.44},{"id":"TH","name":"Thailand","short":"Thailand","currency":"THB","sym":"฿","fx":33.745,"tax":7,"taxName":"VAT","km":true,"amazon":"amazon.sg","adj":"Thai","cities":[["Bangkok",0.45],["Phuket",0.6],["Koh Samui",0.65]],"otherLevel":0.52},{"id":"VN","name":"Vietnam","short":"Vietnam","currency":"VND","sym":"VND ","fx":25821.8,"tax":10,"taxName":"VAT","km":true,"amazon":"amazon.sg","adj":"Vietnamese","cities":[["Ho Chi Minh City",0.4],["Hanoi",0.38],["Da Nang",0.4]],"otherLevel":0.36},{"id":"PH","name":"Philippines","short":"Philippines","currency":"PHP","sym":"₱","fx":63.859,"tax":12,"taxName":"VAT","km":true,"amazon":"amazon.com","adj":"Philippine","cities":[["Manila",0.4],["Cebu",0.4],["Boracay",0.5]],"otherLevel":0.4},{"id":"ID","name":"Indonesia","short":"Indonesia","currency":"IDR","sym":"Rp ","fx":18145,"tax":11,"taxName":"VAT","km":true,"amazon":"amazon.sg","adj":"Indonesian","cities":[["Jakarta",0.4],["Bali",0.5]],"otherLevel":0.41},{"id":"AU","name":"Australia","short":"Australia","currency":"AUD","sym":"A$","fx":1.424299,"tax":10,"taxName":"GST","km":true,"amazon":"amazon.com.au","adj":"Australian","cities":[["Sydney",1.15],["Melbourne",1.1],["Brisbane",1.0],["Perth",1.0],["Gold Coast",1.0]],"otherLevel":0.97},{"id":"NZ","name":"New Zealand","short":"New Zealand","currency":"NZD","sym":"NZ$","fx":1.756697,"tax":15,"taxName":"GST","km":true,"amazon":"amazon.com.au","adj":"New Zealand","cities":[["Auckland",1.05],["Queenstown",1.15]],"otherLevel":1.01},{"id":"MX","name":"Mexico","short":"Mexico","currency":"MXN","sym":"MX$","fx":18.6525,"tax":16,"taxName":"IVA","km":true,"amazon":"amazon.com.mx","adj":"Mexican","cities":[["Mexico City",0.55],["Cancun",0.75],["Tulum",0.85],["Los Cabos",0.9],["Guadalajara",0.5],["Monterrey",0.55],["Puerto Vallarta",0.7],["San Miguel de Allende",0.75]],"otherLevel":0.64},{"id":"BR","name":"Brazil","short":"Brazil","currency":"BRL","sym":"R$","fx":5.334,"tax":0,"taxName":"tax","km":true,"amazon":"amazon.com.br","adj":"Brazilian","cities":[["Sao Paulo",0.55],["Rio de Janeiro",0.6]],"otherLevel":0.53},{"id":"AR","name":"Argentina","short":"Argentina","currency":"USD","sym":"US$","fx":1,"tax":21,"taxName":"IVA","km":true,"amazon":"amazon.com","adj":"Argentine","cities":[["Buenos Aires",0.5]],"otherLevel":0.46},{"id":"CL","name":"Chile","short":"Chile","currency":"CLP","sym":"CLP$","fx":994.29,"tax":19,"taxName":"IVA","km":true,"amazon":"amazon.com","adj":"Chilean","cities":[["Santiago",0.6]],"otherLevel":0.55},{"id":"CO","name":"Colombia","short":"Colombia","currency":"COP","sym":"COP$","fx":3146.03,"tax":19,"taxName":"IVA","km":true,"amazon":"amazon.com","adj":"Colombian","cities":[["Bogota",0.45],["Medellin",0.45],["Cartagena",0.6]],"otherLevel":0.46},{"id":"PE","name":"Peru","short":"Peru","currency":"PEN","sym":"S/ ","fx":3.436,"tax":18,"taxName":"IGV","km":true,"amazon":"amazon.com","adj":"Peruvian","cities":[["Lima",0.5]],"otherLevel":0.46},{"id":"DO","name":"Dominican Republic","short":"Dominican Republic","currency":"DOP","sym":"RD$","fx":61.3215,"tax":18,"taxName":"ITBIS","km":true,"amazon":"amazon.com","adj":"Dominican","cities":[["Punta Cana",0.8],["Santo Domingo",0.55]],"otherLevel":0.62},{"id":"ZA","name":"South Africa","short":"South Africa","currency":"ZAR","sym":"R ","fx":16.6417,"tax":15,"taxName":"VAT","km":true,"amazon":"amazon.co.za","adj":"South African","cities":[["Cape Town",0.5],["Johannesburg",0.45]],"otherLevel":0.44},{"id":"NG","name":"Nigeria","short":"Nigeria","currency":"NGN","sym":"₦","fx":1346.59,"tax":7.5,"taxName":"VAT","km":true,"amazon":"amazon.com","adj":"Nigerian","cities":[["Lagos",0.4],["Abuja",0.4]],"otherLevel":0.37},{"id":"GH","name":"Ghana","short":"Ghana","currency":"GHS","sym":"GH₵","fx":11.6534,"tax":15,"taxName":"VAT","km":true,"amazon":"amazon.com","adj":"Ghanaian","cities":[["Accra",0.4]],"otherLevel":0.37},{"id":"KE","name":"Kenya","short":"Kenya","currency":"KES","sym":"KES ","fx":129.938,"tax":16,"taxName":"VAT","km":true,"amazon":"amazon.com","adj":"Kenyan","cities":[["Nairobi",0.35],["Mombasa",0.35]],"otherLevel":0.32}];
  INTL.sort(function (a, b) { return a.name.localeCompare(b.name); });
  INTL.forEach(function (co) {
    co.cities.forEach(function (c) { CITIES.push({ name: c[0] === co.short ? c[0] : c[0] + ', ' + co.short, index: Math.round(c[1] * co.fx * 1000) / 1000, tax: co.tax, taxName: co.taxName.charAt(0).toUpperCase() + co.taxName.slice(1), country: co.id }); });
    if (co.id !== 'SG' && co.id !== 'HK') CITIES.push({ name: 'Other city in ' + co.name, index: Math.round(co.otherLevel * co.fx * 1000) / 1000, tax: co.tax, taxName: co.taxName.charAt(0).toUpperCase() + co.taxName.slice(1), country: co.id });
  });
  /* The inspiration photo for each cultural wedding: plans started from a cultural wedding begin with it. */
  var CULTURE_LOOKS = [{"id":"culture-arabic","culture":"arabic","name":"Palace of Lanterns","setting":"outdoor","style":"ivory-ballroom","shop":"ivory, gold and white","mood":"Gold lanterns, white roses and a candlelit aisle under palms.","decor":["Lantern-lined white aisle under palm trees","White rose and orchid arrangements in gold urns","Hanging gold Moroccan-style lanterns","Candlelit stage for the couple (kosha)"],"palette":["#F4EBDD","#D4AF37","#FFFFFF","#C9A86A","#8A6A3B"],"pieces":[{"name":"Lantern-lined white aisle under palm trees","q":"","hire":"decor"},{"name":"White rose and orchid arrangements in gold urns","q":"","hire":"florals"},{"name":"Hanging gold Moroccan-style lanterns","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-indian","culture":"indian","name":"Crimson Mandap","setting":"indoor","style":"royal-purple","shop":"red, gold and ivory","mood":"A crimson and gold mandap with roses, chandeliers and royal seating.","decor":["Red and gold draped mandap with a crystal chandelier","Red rose and marigold garlands","Gold carved thrones for the couple","Candles and brass lanterns along the stage"],"palette":["#9E1B32","#D4AF37","#F4E4C1","#C2185B","#6B0F1A"],"pieces":[{"name":"Red and gold draped mandap with a crystal chandelier","q":"","hire":"decor"},{"name":"Red rose and marigold garlands","q":"","hire":"florals"},{"name":"Gold carved thrones for the couple","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-pakistani","culture":"pakistani","name":"Emerald Mehfil","setting":"indoor","style":"emerald-luxe","shop":"emerald, gold and ivory","mood":"Emerald velvet, crystal chandeliers and a gold stage for the couple.","decor":["Emerald velvet drapes and lounge seating","Crystal chandeliers over a gold stage","Jewel-tone cushions and low tables","Brass lanterns and white florals"],"palette":["#0F5132","#D4AF37","#F4EBDD","#8A1538","#1E3A2F"],"pieces":[{"name":"Emerald velvet drapes and lounge seating","q":"","hire":"decor"},{"name":"Crystal chandeliers over a gold stage","q":"","hire":"florals"},{"name":"Jewel-tone cushions and low tables","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-persian","culture":"persian","name":"Sunset Sofreh","setting":"outdoor","style":"blush-romance","shop":"blush, ivory and gold","mood":"A flower-draped arch at sunset over a candlelit sofreh aghd.","decor":["Flower-draped canopy with sheer white fabric","Sofreh aghd table with candles, mirror and sweets","Blush and white rose garlands","Golden-hour candlelight by the water"],"palette":["#F2C6C2","#FFFFFF","#D4AF37","#E8B4A0","#B98A6E"],"pieces":[{"name":"Flower-draped canopy with sheer white fabric","q":"","hire":"decor"},{"name":"Sofreh aghd table with candles, mirror and sweets","q":"","hire":"florals"},{"name":"Blush and white rose garlands","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-turkish","culture":"turkish","name":"Bosphorus Lanterns","setting":"indoor","style":"moody-floral","shop":"ruby, gold and amber","mood":"Ruby velvet lounges, glowing lanterns and a view across the water.","decor":["Hanging colored glass lanterns","Ruby velvet lounge seating with cushions","Low brass tables with candles","Waterfront terrace at dusk"],"palette":["#8B1E2D","#D4AF37","#E0A458","#3B1F2B","#F4E4C1"],"pieces":[{"name":"Hanging colored glass lanterns","q":"","hire":"decor"},{"name":"Ruby velvet lounge seating with cushions","q":"","hire":"florals"},{"name":"Low brass tables with candles","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-moroccan","culture":"moroccan","name":"Riad Palace","setting":"indoor","style":"old-hollywood","shop":"gold, amber and ivory","mood":"Carved arches, long candlelit tables and warm golden light.","decor":["Carved arches and palm-lined courtyard","Long banquet tables with gold candles","Brass lanterns and amber light","Rich rugs and carved wood details"],"palette":["#C9862F","#D4AF37","#F4E4C1","#7A4A21","#2E2A26"],"pieces":[{"name":"Carved arches and palm-lined courtyard","q":"","hire":"decor"},{"name":"Long banquet tables with gold candles","q":"","hire":"florals"},{"name":"Brass lanterns and amber light","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-chinese","culture":"chinese","name":"Double Happiness","setting":"indoor","style":"royal-purple","shop":"red and gold","mood":"Red lanterns, a double-happiness backdrop and red-and-gold tables.","decor":["Red silk lanterns overhead","Gold double-happiness backdrop","Red linens with gold chargers","Red rose and peony centerpieces"],"palette":["#C8102E","#D4AF37","#8B0000","#F4E4C1","#E35D6A"],"pieces":[{"name":"Red silk lanterns overhead","q":"","hire":"decor"},{"name":"Gold double-happiness backdrop","q":"","hire":"florals"},{"name":"Red linens with gold chargers","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-korean","culture":"korean","name":"Cherry Blossom Hall","setting":"indoor","style":"blush-romance","shop":"blush pink, white and gold","mood":"Cherry blossom trees, a floral arch and a mirrored aisle.","decor":["Cherry blossom trees lining the aisle","White floral arch for the ceremony","Mirrored aisle with candles","Crystal chandelier and soft white light"],"palette":["#F8C8D4","#FFFFFF","#D4AF37","#EBD9DC","#C9A86A"],"pieces":[{"name":"Cherry blossom trees lining the aisle","q":"","hire":"decor"},{"name":"White floral arch for the ceremony","q":"","hire":"florals"},{"name":"Mirrored aisle with candles","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-vietnamese","culture":"vietnamese","name":"Blossom Terrace","setting":"outdoor","style":"blush-romance","shop":"blush pink, white and silver","mood":"Cherry blossoms over a lakeside ceremony arch and white tables.","decor":["Cherry blossom canopy over the guests","White rose ceremony arch by the water","White chairs and candlelit aisle","Soft pink and white table florals"],"palette":["#F6C1CC","#FFFFFF","#C0C0C8","#EBD9DC","#9FB3C8"],"pieces":[{"name":"Cherry blossom canopy over the guests","q":"","hire":"decor"},{"name":"White rose ceremony arch by the water","q":"","hire":"florals"},{"name":"White chairs and candlelit aisle","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-mexican","culture":"mexican","name":"Hacienda Fiesta","setting":"outdoor","style":"citrus-fiesta","shop":"fuchsia, orange and gold","mood":"Bright bougainvillea, papel picado and candlelit hacienda tables.","decor":["Bougainvillea and bright floral canopies","Papel picado and string lights overhead","Fuchsia and orange linens with candles","Hacienda arches and courtyard tables"],"palette":["#D6246E","#F28C28","#D4AF37","#F4E4C1","#2E8B57"],"pieces":[{"name":"Bougainvillea and bright floral canopies","q":"","hire":"decor"},{"name":"Papel picado and string lights overhead","q":"","hire":"florals"},{"name":"Fuchsia and orange linens with candles","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-spanish","culture":"spanish","name":"Andalusian Courtyard","setting":"outdoor","style":"citrus-fiesta","shop":"red, orange and gold","mood":"A flower-crowned courtyard of arches, candles and long tables.","decor":["Courtyard arches crowned with red and orange flowers","Long candlelit banquet tables","Gold chandeliers in the open air","Terracotta and gold details"],"palette":["#C8102E","#F28C28","#D4AF37","#F4E4C1","#8B4513"],"pieces":[{"name":"Courtyard arches crowned with red and orange flowers","q":"","hire":"decor"},{"name":"Long candlelit banquet tables","q":"","hire":"florals"},{"name":"Gold chandeliers in the open air","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-filipino","culture":"filipino","name":"Garden Pavilion","setting":"outdoor","style":"champagne-garden","shop":"ivory, blush and greenery","mood":"Sheer drapes, crystal chandeliers and garden roses under the trees.","decor":["Sheer white drapes in a garden pavilion","Crystal chandeliers among greenery","Blush and white rose arrangements","Candlelit tables on the lawn"],"palette":["#F4EBDD","#F2C6C2","#7A8B64","#FFFFFF","#C9A86A"],"pieces":[{"name":"Sheer white drapes in a garden pavilion","q":"","hire":"decor"},{"name":"Crystal chandeliers among greenery","q":"","hire":"florals"},{"name":"Blush and white rose arrangements","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-nigerian","culture":"nigerian","name":"Owambe Colors","setting":"indoor","style":"tropical-glam","shop":"fuchsia, orange, gold and royal blue","mood":"Vivid draped fabrics, jewel-tone lounges and bold florals.","decor":["Bright draped fabrics in fuchsia, orange and gold","Jewel-tone lounge seating and cushions","Bold floral chandeliers","Colorful low tables for guests"],"palette":["#D6246E","#F28C28","#D4AF37","#1F4E9A","#6A1B9A"],"pieces":[{"name":"Bright draped fabrics in fuchsia, orange and gold","q":"","hire":"decor"},{"name":"Jewel-tone lounge seating and cushions","q":"","hire":"florals"},{"name":"Bold floral chandeliers","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-africanamerican","culture":"africanamerican","name":"Grand Ballroom","setting":"indoor","style":"ivory-ballroom","shop":"ivory, champagne and gold","mood":"Crystal chandeliers, tall white centerpieces and a golden ballroom.","decor":["Grand ballroom with crystal chandeliers","Tall white rose centerpieces","Gold chiavari chairs and ivory linens","Warm uplighting on draped walls"],"palette":["#F4EBDD","#E8D3A9","#D4AF37","#FFFFFF","#C9A86A"],"pieces":[{"name":"Grand ballroom with crystal chandeliers","q":"","hire":"decor"},{"name":"Tall white rose centerpieces","q":"","hire":"florals"},{"name":"Gold chiavari chairs and ivory linens","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-russian","culture":"russian","name":"Crystal Grandeur","setting":"indoor","style":"minimal-white","shop":"white, crystal and silver","mood":"A mirrored aisle, white blossom trees and crystal chandeliers.","decor":["Mirrored aisle with white blossom trees","Crystal chandeliers overhead","White and silver table settings","Candles in tall glass"],"palette":["#FFFFFF","#E9EEF2","#C0C0C8","#D9D9D9","#1C1C1C"],"pieces":[{"name":"Mirrored aisle with white blossom trees","q":"","hire":"decor"},{"name":"Crystal chandeliers overhead","q":"","hire":"florals"},{"name":"White and silver table settings","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-greek","culture":"greek","name":"Aegean Arch","setting":"outdoor","style":"coastal-linen","shop":"blush, coral and sea blue","mood":"A floral arch on the beach with candlelit chairs and sea views.","decor":["Floral ceremony arch on the beach","Blush and coral rose arrangements","Gold chairs facing the sea","Lanterns and candles along the aisle"],"palette":["#F2C6C2","#F08080","#4A90A4","#F4EBDD","#D4AF37"],"pieces":[{"name":"Floral ceremony arch on the beach","q":"","hire":"decor"},{"name":"Blush and coral rose arrangements","q":"","hire":"florals"},{"name":"Gold chairs facing the sea","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]},{"id":"culture-fusion","culture":"fusion","name":"Two Traditions","setting":"indoor","style":"royal-purple","shop":"burgundy, blush and gold","mood":"Layered burgundy and blush drapes, a crystal chandelier and royal seating.","decor":["Layered burgundy, blush and gold drapes","Crystal chandelier over the stage","Royal seating for the couple","Flower garlands and candlelight"],"palette":["#7A0E2A","#F2C6C2","#D4AF37","#F4E4C1","#4A1438"],"pieces":[{"name":"Layered burgundy, blush and gold drapes","q":"","hire":"decor"},{"name":"Crystal chandelier over the stage","q":"","hire":"florals"},{"name":"Royal seating for the couple","q":"","hire":"rentals"},{"name":"Pillar candles in glass","q":"glass hurricane pillar candle holders","hire":""}]}];
  var COUNTRIES = [
    { id: 'US', name: 'United States', short: 'US', currency: 'USD', sym: '$', other: 'Other US city', region: 'state', example: 'e.g. Boise, ID', km: false, tip: true, amazon: 'amazon.com', adj: 'US' },
    { id: 'CA', name: 'Canada', short: 'Canada', currency: 'CAD', sym: 'CA$', other: 'Other city in Canada', region: 'province', example: 'e.g. Kelowna, BC', km: true, tip: true, amazon: 'amazon.ca', adj: 'Canadian' }
  ].concat(INTL.map(function (co) { return { id: co.id, name: co.name, short: co.short, currency: co.currency, sym: co.sym, other: 'Other city in ' + co.name, region: 'city', example: 'Type your city', km: co.km, tip: false, amazon: co.amazon, adj: co.adj }; }));

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
    turkish: ['Meze: ezme, haydari, hummus and sigara b\u00f6re\u011fi', 'Mercimek lentil soup', 'Adana and shish kebab with pilav', 'Lamb with smoky eggplant (h\u00fcnkar be\u011fendi)', 'Baklava, k\u00fcnefe and Turkish delight', 'Turkish tea, coffee and ayran'],
    fusion: ['Appetizers from both families', 'A signature dish from each culture', 'Shared mains served family style', 'Breads, rice and sides from both kitchens', 'Wedding cake plus sweets from both cultures', 'A drink or tea tradition from each family'],
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
    { w: 20, t: 'Book the davul and zurna players', cu: 'turkish' },
    { w: 10, t: 'Plan the k\u0131na night: henna, red veil and trays', cu: 'turkish' },
    { w: 6, t: 'Ask family to prepare gold for the tak\u0131 t\u00f6reni', cu: 'turkish' },
    { w: 30, t: 'Choose the traditions from each family to include', cu: 'fusion' },
    { w: 16, t: 'Give the DJ a playlist from both cultures', cu: 'fusion' },
    { w: 12, t: 'Plan a menu with dishes from both families', cu: 'fusion' },
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
    { w: 3, t: 'Ask the restaurant about large-party rules: service charge, cake-cutting fee, decor and separate checks', in: ['restaurant', 'privateRoom'] },
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

  root.EC_DATA = { PKG_ADDONS: PKG_ADDONS, PKG_ADDONS_RESTAURANT: PKG_ADDONS_RESTAURANT,
    NEW_VENUES: NEW_VENUES, STYLE_PIECES: STYLE_PIECES,
    SETTINGS: SETTINGS, SETTING_RULES: SETTING_RULES, GRATUITY: 0.20,
    EVENT_TYPES: EVENT_TYPES, CULTURES: CULTURES, CATEGORIES: CATEGORIES, PROFILES: PROFILES, ADJUST: ADJUST, TIERS: TIERS,
    /* Vendors Always Luxe recommends by name. They show first, marked Recommended, in these cities. */
    RECOMMENDED: [
      /* No cities: shown in every city. cultures: only for those cultural weddings. */
      { name: 'Waseem Rabih', ig: 'waseemrabih', cats: ['singer'], states: ['CA'], top: true, cultures: ['arabic'], note: 'Arabic wedding singer for zaffe entrances, weddings and live music events' },
      { name: 'Chris Hawat', ig: 'chrishawat', cats: ['singer'], onlyCities: ['Houston, TX'], weight: 30, cultures: ['arabic'], note: 'Lebanese and Arabic singer for weddings and celebrations' },
      { name: 'Jabour Bakla', ig: 'jabour.bakla', cats: ['singer'], cities: ['Houston, TX'], cultures: ['arabic'], note: 'Houston\u2019s favorite Lebanese singer for weddings and celebrations' },
      { name: 'Salem Omran', ig: 'salem_omran_official', cats: ['singer'], cities: ['Houston, TX'], cultures: ['arabic'], note: 'Arabic wedding and festival singer in Houston' },
      { name: 'Tur\u00e1th Folkoholic Dance Theatre', ig: 'zaffadabketexas', cats: ['zaffe', 'dabke'], cities: ['Houston, TX'], top: true, note: 'Epic zaffa wedding entrances and dabke: Lebanese, Palestinian, Jordanian, Syrian, Iraqi and Egyptian. Texas and nationwide' },
      { name: 'Watan Zaffe & Dabke Group', ig: 'watanzaffegroup', cats: ['zaffe', 'dabke'], cities: ['Houston, TX'], note: 'Zaffe entrances and dabke for weddings, Houston' },
      /* weight: an exact place in the order (first = 100, a city = 20, a state = 10). first: ahead of everyone else wherever they show. top: first among the others for the same place. No cities, states or country: every US and Canadian city (they say they travel worldwide). states: every city in those states. country: everywhere in that country. notStates: not in those states. types: also for these event types whatever the culture (a quincea\u00f1era for a Latin DJ). onlyCities: only in those cities, with no extra rank (used to place someone last there). notTop: in those cities they're never in the first 3 picks, only further down the list. */
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
      { name: 'Nidal Nasr', ig: 'nidalnasrofficial', cats: ['singer'], states: ['CA'], cultures: ['arabic'], note: 'Arabic singer for weddings, engagements and parties across California' },
      { name: 'Tony Eid', ig: 'tony_eid', cats: ['singer'], notCities: ['Houston, TX'], cultures: ['arabic'], note: 'Lebanese star singer for weddings, engagements and galas' },
      { name: 'Chris Hawat', ig: 'chrishawat', cats: ['singer'], cultures: ['arabic'], note: 'Lebanese and Arabic singer for weddings and celebrations' },
      { name: 'Tamer Aldabouqi', ig: 'tamerdabouqi', cats: ['singer'], cultures: ['arabic'], note: 'Arabic singer with a live band for weddings and celebrations' },
      { name: 'Wissam Wahhab', ig: 'wissam_wahhab_official', cats: ['singer'], country: 'US', cultures: ['arabic'], note: 'Arabic singer for weddings, engagements and celebrations' },
      { name: 'Janho Brothers', ig: 'janhobrothers', cats: ['singer', 'liveMusic'], states: ['CA'], weight: -1, cultures: ['arabic'], note: 'Live band and singers: Arabic, Mediterranean and international music for every occasion' },
      { name: 'Tony Eid', ig: 'tony_eid', cats: ['singer'], onlyCities: ['Houston, TX'], cultures: ['arabic'], note: 'Lebanese star singer for weddings, engagements and galas' },
      { name: 'Salem Anan', ig: 'salemanan11', cats: ['singer'], cities: ['Toronto, ON', 'Hamilton, ON'], cultures: ['arabic'], note: 'Arabic singer for weddings, engagements and celebrations in Mississauga and the Greater Toronto Area' },
      /* cultures '' = every event that isn't a cultural wedding (birthdays, showers, classic weddings, parties); 'parties' = every event that isn't a wedding. */
      /* Houston: Flash Memories for every event (photo booths, lighting, special effects, dance floors; their DJ comes after DJ Yamani and DJ Roy). Glitz N Glam is a Houston venue with its own decor and setup, for Nigerian and African American weddings. */
      { name: 'Flash Memories Photo Booth Co', ig: 'flashmemoriesphotoboothco', cats: ['photoBooth', 'lighting', 'effects', 'danceFloor', 'dj'], cities: ['Houston, TX'], weight: -1, note: 'Photo booths, wedding DJ, sound, lighting, special effects and vinyl dance floors' },
      { name: 'Glitz N Glam Houston', ig: 'glitznglamhouston', cats: ['venue', 'decor', 'rentals'], cities: ['Houston, TX'], cultures: ['nigerian', 'africanamerican'], note: 'Event venue on Beechnut St with its own decor, rentals and setup' },
      { name: 'Fady Youssef', ig: 'fadyyoussef17', cats: ['transport'], cities: ['Los Angeles, CA', 'Orange County, CA'], weight: 120, note: 'Luxury car and limo service, Los Angeles and Orange County' },
      { name: 'DJ Music Entertainment', ig: 'djmusicentertainment', cats: ['dj', 'mc'], states: ['TX'], note: 'Texas wedding DJs and MCs: San Antonio, Austin, Hill Country and Houston, with full entertainment and event production' },
      { name: 'DJ Yamani', ig: 'dj_yamani', cats: ['dj'], cities: ['Houston, TX'], cultures: ['arabic', ''], note: 'Arabic and American music for weddings and parties' },
      /* DJ Roy plays Arabic, English, Spanish, Turkish, Persian, Indian, Russian, Kurdish and French music: every event, and the weddings and engagements in those styles. First across the U.S.; second in Houston after DJ Yamani. DJ Mosses is California only (his choice for now), and the main DJ there for every event. */
      { name: 'DJ Roy', ig: 'djroy_1', cats: ['dj'], cities: ['Houston, TX'], cultures: ['', 'arabic', 'moroccan', 'persian', 'indian', 'russian', 'spanish', 'mexican', 'turkish', 'fusion'], note: 'All kinds of music: Arabic, English, Spanish, Turkish, Persian, Indian, Russian, Kurdish and French' },
      { name: 'DJ Mosses', ig: 'dj_mosses_music', cats: ['dj'], states: ['CA'], first: true, note: 'International and Arabic music for weddings and private events' },
      { name: 'DJ Jon', ig: 'djjonofficial', cats: ['dj'], weight: 150, cultures: ['korean'], note: 'K-pop and international DJ for weddings and events. djjon.com' },
      { name: 'DJ Jon', ig: 'djjonofficial', cats: ['dj'], cities: ['San Francisco, CA'], weight: 105, note: 'K-pop and international DJ for weddings and events. djjon.com' },
      { name: 'DJ Burak', ig: 'realdjburak', cats: ['dj'], cities: ['Los Angeles, CA'], first: true, cultures: ['persian', 'mexican', 'spanish', 'turkish'], types: ['quince'], note: 'Turkish, Persian and Latin hits for weddings and parties, Los Angeles' },
      { name: 'DJ L\u2019Rythm', ig: 'djlrythm', cats: ['dj', 'lighting'], cities: ['Los Angeles, CA', 'Orange County, CA'], weight: 105, cultures: ['arabic', ''], note: 'Female Arabic DJ, plus lighting, sound, sparks and stage effects rentals. Orange County and LA' },
      { name: 'DJ Roy', ig: 'djroy_1', cats: ['dj'], country: 'US', notCities: ['Houston, TX'], first: true, cultures: ['', 'arabic', 'moroccan', 'persian', 'indian', 'russian', 'spanish', 'mexican', 'turkish', 'fusion'], note: 'All kinds of music: Arabic, English, Spanish, Turkish, Persian, Indian, Russian, Kurdish and French' },
      { name: 'Hammoudeh Alex', ig: 'hammoudeh.hamdan', cats: ['hairMakeup'], cities: ['Orange County, CA'], cultures: ['arabic', 'parties'], note: 'Hair stylist for brides and parties: styles, extensions, cuts, color and smoothing' },
      /* Wassim: first for Arabic weddings in Houston, and for every other Houston event right after Makeup by Suzette */
      { name: 'Wassim Hair Stylist', ig: 'wassimhairstylist_houston', cats: ['hairMakeup'], cities: ['Houston, TX'], cultures: ['arabic'], weight: 25, note: 'Lebanese hair stylist, from Dubai to Houston. Color, highlights and extensions; home and hotel visits' },
      { name: 'Wassim Hair Stylist', ig: 'wassimhairstylist_houston', cats: ['hairMakeup'], cities: ['Houston, TX'], weight: 15, note: 'Lebanese hair stylist, from Dubai to Houston. Color, highlights and extensions; home and hotel visits' },
      { name: 'Makeup by Suzette', ig: 'makeupbysuzette', cats: ['hairMakeup'], cities: ['Houston, TX'], note: 'Celebrity makeup and hair artist and glam team, bridal glam. Houston and worldwide' },
      /* No Instagram: maps is what to search on Google Maps, and the link opens their listing there. */
      /* Houston Persian weddings: Kasra first, then Aban, Caspian, Garson and Zafran. */
      { name: 'Kasra Persian Grill', maps: 'Kasra Persian Grill Houston TX', cats: ['catering'], cities: ['Houston, TX'], cultures: ['persian'], weight: 60, note: 'Persian grill and catering: kabobs, rice and stews for weddings and parties' },
      { name: 'Caspian', maps: 'Caspian Persian restaurant Houston TX', cats: ['catering'], cities: ['Houston, TX'], cultures: ['persian'], weight: 55, note: 'Persian cuisine and catering, Houston' },
      { name: 'Garson', maps: 'Garson Persian restaurant Houston TX', cats: ['catering'], cities: ['Houston, TX'], cultures: ['persian'], weight: 50, note: 'Persian and Mediterranean restaurant with catering, Houston' },
      { name: 'Zafran', maps: 'Zafran Persian Houston TX', cats: ['catering'], cities: ['Houston, TX'], cultures: ['persian'], weight: 45, note: 'Persian cuisine and catering, Houston' },
      { name: 'Aban Restaurant', maps: 'Aban Persian restaurant Houston TX', cats: ['catering'], cities: ['Houston, TX'], cultures: ['persian'], weight: 58, note: 'Persian restaurant and catering, Houston' },
      { name: 'Cafe Layal', ig: 'cafelayal_richmond', cats: ['catering'], cities: ['Houston, TX'], cultures: ['arabic'], note: 'Mediterranean restaurant, lounge and catering for weddings and engagements, Houston area' },
      { name: 'Fadi\u2019s Mediterranean', ig: 'fadiscuisine', cats: ['catering'], cities: ['Houston, TX'], cultures: ['arabic'], note: 'Family-owned Lebanese and Mediterranean since 1996: catering and event space, 100% halal' },
      { name: 'Joseph\u2019s Fashion', ig: 'josephs_fashion', cats: ['attire'], states: ['MI'], note: 'Custom suits and tuxedos for men and women: weddings, prom and personal styling. Sterling Heights, Michigan' }
    ],
    CITIES: CITIES, COUNTRIES: COUNTRIES, PROVINCES: PROVINCES, AREAS: AREAS, STYLES: STYLES, MENUS: MENUS, DIETS: DIETS, CHECKLIST: CHECKLIST, PASSES: PASSES,
    CREDIT_PACKS: CREDIT_PACKS, PACKAGES: PACKAGES, ADDONS: ADDONS, ALLOWANCE: ALLOWANCE,
    CULTURE_LOOKS: CULTURE_LOOKS,
    VENUE_TYPES: VENUE_TYPES, PLAYLIST_SEARCH: PLAYLIST_SEARCH, CONTINGENCY: 0.10, SERVICE: 0.20, TIP: 0.10
  };
})(typeof window !== 'undefined' ? window : globalThis);
