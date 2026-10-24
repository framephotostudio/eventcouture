/* Event Couture: catalogs used by the planning engine.
   All money is USD. Cost ranges are national planning estimates for the Signature tier
   and are scaled by city and tier in engine.js. They are labeled to users as estimates. */
(function (root) {
  'use strict';

  var EVENT_TYPES = [
    { id: 'brunch', name: "Girls' brunch", hours: 3, style: 'dining', defaultGuests: 10 },
    { id: 'birthday', name: 'Birthday party', hours: 4, style: 'party', defaultGuests: 40 },
    { id: 'milestone', name: 'Milestone birthday', hours: 5, style: 'party', defaultGuests: 80 },
    { id: 'dinner', name: 'Dinner party', hours: 3, style: 'dining', defaultGuests: 12 },
    { id: 'bridal-shower', name: 'Bridal shower', hours: 3, style: 'shower', defaultGuests: 30 },
    { id: 'baby-shower', name: 'Baby shower', hours: 3, style: 'shower', defaultGuests: 30 },
    { id: 'gender-reveal', name: 'Gender reveal', hours: 3, style: 'shower', defaultGuests: 30 },
    { id: 'bachelorette', name: 'Bachelorette', hours: 5, style: 'party', defaultGuests: 12 },
    { id: 'graduation', name: 'Graduation party', hours: 4, style: 'party', defaultGuests: 50 },
    { id: 'engagement', name: 'Engagement party', hours: 4, style: 'party', defaultGuests: 60 },
    { id: 'quince', name: 'Quinceañera or sweet 16', hours: 5, style: 'gala', defaultGuests: 150 },
    { id: 'anniversary', name: 'Anniversary', hours: 4, style: 'party', defaultGuests: 50 },
    { id: 'holiday', name: 'Holiday party', hours: 4, style: 'party', defaultGuests: 40 },
    { id: 'wedding', name: 'Wedding', hours: 6, style: 'wedding', defaultGuests: 120 },
    { id: 'gala', name: 'Gala or fundraiser', hours: 5, style: 'gala', defaultGuests: 200 },
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

  var TIERS = [
    { id: 'L', name: 'Luxe for Less', mult: 0.65, blurb: 'The same look with smart swaps: DIY styling, fewer hired services, simpler venue.' },
    { id: 'S', name: 'Signature', mult: 1.0, blurb: 'The balanced version: key pieces done by pros, the look kept intact.' },
    { id: 'U', name: 'Ultra Luxe', mult: 1.55, blurb: 'Full service and statement pieces: lighting, live music, coordinator, more florals.' }
  ];

  /* City cost index for planning estimates (1.00 = US average). Approximate; shown as an estimate. */
  var CITIES = [
    ['Atlanta, GA', 1.0, 8.9], ['Austin, TX', 1.05, 8.25], ['Baltimore, MD', 1.0, 6], ['Boston, MA', 1.35, 6.25],
    ['Charlotte, NC', 0.95, 7.25], ['Chicago, IL', 1.12, 10.25], ['Columbus, OH', 0.92, 7.5], ['Dallas, TX', 1.0, 8.25],
    ['Denver, CO', 1.1, 8.8], ['Detroit, MI', 0.9, 6], ['Fort Worth, TX', 0.95, 8.25], ['Honolulu, HI', 1.4, 4.7],
    ['Houston, TX', 0.96, 8.25], ['Indianapolis, IN', 0.9, 7], ['Jacksonville, FL', 0.92, 7.5], ['Kansas City, MO', 0.92, 8.6],
    ['Las Vegas, NV', 1.0, 8.4], ['Los Angeles, CA', 1.32, 9.5], ['Memphis, TN', 0.88, 9.75], ['Miami, FL', 1.22, 7],
    ['Milwaukee, WI', 0.92, 7.9], ['Minneapolis, MN', 1.02, 8], ['Nashville, TN', 1.05, 9.25], ['New Orleans, LA', 0.98, 9.45],
    ['New York, NY', 1.48, 8.9], ['Newark, NJ', 1.25, 6.6], ['Oakland, CA', 1.35, 10.25], ['Oklahoma City, OK', 0.88, 8.6],
    ['Orange County, CA', 1.32, 7.75], ['Orlando, FL', 0.97, 6.5], ['Philadelphia, PA', 1.12, 8], ['Phoenix, AZ', 0.98, 8.6],
    ['Pittsburgh, PA', 0.95, 7], ['Portland, OR', 1.12, 0], ['Raleigh, NC', 0.98, 7.25], ['Sacramento, CA', 1.12, 8.75],
    ['Salt Lake City, UT', 1.0, 7.75], ['San Antonio, TX', 0.9, 8.25], ['San Diego, CA', 1.25, 7.75], ['San Francisco, CA', 1.5, 8.6],
    ['San Jose, CA', 1.45, 9.4], ['Seattle, WA', 1.28, 10.35], ['St. Louis, MO', 0.92, 9.7], ['Tampa, FL', 0.98, 7.5],
    ['Tucson, AZ', 0.92, 8.7], ['Washington, DC', 1.32, 6], ['Other US city', 1.0, 8]
  ].map(function (c) { return { name: c[0], index: c[1], tax: c[2] }; });

  /* Style library used to build concepts. Palettes are hex values shown as swatches. */
  var STYLES = [
    { id: 'champagne-garden', shop: 'champagne and sage green', name: 'Champagne Garden', palette: ['#F3E7D3', '#D9C29C', '#A9B89A', '#FFFFFF', '#6F7D63'], tags: ['garden', 'neutral', 'elegant', 'outdoor', 'green', 'gold', 'sage', 'cream'],
      mood: 'Soft gold light, garden greenery and candlelit tables.', decor: ['Greenery runners with white blooms', 'Gold chargers and blush napkins', 'Floating candles in tall glass', 'Champagne tower welcome moment'],
      music: 'jazz brunch acoustic', dress: 'Soft neutrals, garden formal', menu: 'garden' },
    { id: 'modern-noir', shop: 'black and gold', name: 'Modern Noir', palette: ['#111111', '#2B2B2B', '#C9A86A', '#F5F2EC', '#7A6A55'], tags: ['black', 'dark', 'gold', 'modern', 'glam', 'evening'],
      mood: 'Black and gold, sharp lines and dramatic low light.', decor: ['Black linens with gold flatware', 'Mirrored table numbers', 'Tall black taper candles', 'Neon sign with the guest of honor’s name'],
      music: 'r&b lounge house', dress: 'All black, cocktail to black tie', menu: 'modern' },
    { id: 'blush-romance', shop: 'blush pink', name: 'Blush Romance', palette: ['#F7DCDC', '#E8B4B8', '#C98B92', '#FFF7F3', '#B88A5A'], tags: ['pink', 'blush', 'romantic', 'soft', 'floral', 'gold', 'tea'],
      mood: 'Blush roses, soft draping and a romantic glow.', decor: ['Blush and ivory rose centerpieces', 'Sheer draped backdrop', 'Rose-gold accents', 'Pearl-dotted dessert table'],
      music: 'love songs soul', dress: 'Blush, ivory and champagne', menu: 'elegant' },
    { id: 'boho-sunset', shop: 'terracotta boho', name: 'Boho Sunset', palette: ['#E9C9A6', '#C47C4E', '#8C5A3C', '#F4EBDD', '#6B7A55'], tags: ['boho', 'terracotta', 'warm', 'rustic', 'orange', 'outdoor'],
      mood: 'Warm sunset tones, pampas grass and low lounge seating.', decor: ['Pampas and dried-flower arrangements', 'Low tables with floor cushions', 'Rattan and macramé accents', 'Lantern-lit pathway'],
      music: 'indie acoustic sunset', dress: 'Flowy earth tones', menu: 'rustic' },
    { id: 'coastal-linen', shop: 'dusty blue', name: 'Coastal Linen', palette: ['#EAF1F4', '#A9C7D3', '#5D8AA0', '#FBF8F2', '#D8C8A8'], tags: ['blue', 'coastal', 'beach', 'light'],
      mood: 'Breezy linen, ocean blues and natural textures.', decor: ['Linen tablecloths in sea-glass blue', 'Driftwood and white hydrangea', 'Glass hurricanes with sand', 'Seafood raw bar display'],
      music: 'yacht rock bossa nova', dress: 'Linen and light blues', menu: 'coastal' },
    { id: 'tropical-glam', shop: 'tropical', name: 'Tropical Glam', palette: ['#0F5C4D', '#F2B544', '#E5677A', '#FFF6E5', '#1B3B36'], tags: ['tropical', 'green', 'bright', 'colorful', 'summer'],
      mood: 'Lush palms, bold color and island glamour.', decor: ['Monstera and orchid centerpieces', 'Gold pineapple accents', 'Tiki-luxe bar setup', 'Bright floral photo wall'],
      music: 'afrobeats reggaeton summer', dress: 'Bold tropical prints', menu: 'tropical' },
    { id: 'old-hollywood', shop: 'red and gold', name: 'Old Hollywood', palette: ['#7A0E1B', '#111111', '#D4AF37', '#F7F1E3', '#4A0A12'], tags: ['red', 'gold', 'glam', 'vintage', 'evening'],
      mood: 'Red carpet, gold accents and vintage glamour.', decor: ['Red carpet entrance with stanchions', 'Gold sequin linens', 'Marquee light letters', 'Vintage film-reel table numbers'],
      music: 'swing jazz motown', dress: 'Old Hollywood glamour, black tie', menu: 'classic' },
    { id: 'pastel-whimsy', shop: 'pastel', name: 'Pastel Whimsy', palette: ['#F9E1EC', '#D9ECF5', '#FFF3C4', '#DCEFD9', '#B9A3D6'], tags: ['pastel', 'colorful', 'playful', 'soft', 'baby', 'lavender', 'tea'],
      mood: 'Soft pastels, balloons and playful sweetness.', decor: ['Pastel balloon garland', 'Macaron and candy table', 'Paper flower wall', 'Mismatched pastel napkins'],
      music: 'pop feel-good', dress: 'Pastels and florals', menu: 'sweet' },
    { id: 'ivory-ballroom', shop: 'ivory and gold', name: 'Ivory Elegance', palette: ['#FBF6EC', '#EFE3CF', '#D9C4A0', '#B8925A', '#FFFFFF'], tags: ['ivory', 'cream', 'gold', 'classic', 'elegant', 'ballroom', 'champagne', 'formal'],
      mood: 'Candlelit ivory and gold, sparkling crystal and lush white roses.', decor: ['Gold stands with white rose and hydrangea arrangements', 'Ivory damask linens and gold beaded chargers', 'Pillar candles in glass hurricanes', 'Draped ivory backdrop with a floral garland'],
      music: 'string quartet classics', dress: 'Dressy ivory, cream and gold', menu: 'elegant' },
    { id: 'minimal-white', shop: 'white', name: 'Minimal White', palette: ['#FFFFFF', '#F1EFEA', '#D6D2C8', '#8C8A84', '#2E2E2C'], tags: ['white', 'minimal', 'modern', 'neutral', 'clean', 'lavender'],
      mood: 'Clean white space, sculptural florals and quiet luxury.', decor: ['White-on-white table design', 'Single-stem sculptural florals', 'Clear acrylic signage', 'Statement white balloon cloud'],
      music: 'deep house chill', dress: 'All white', menu: 'modern' },
    { id: 'disco-glam', shop: 'silver disco', name: 'Disco Glam', palette: ['#C0C0C8', '#E05AA6', '#6B3FA0', '#141414', '#F2D16B'], tags: ['disco', 'silver', 'sparkle', 'party', 'purple', 'pink'],
      mood: 'Mirror balls, metallics and a packed dance floor.', decor: ['Disco ball clusters', 'Metallic fringe backdrop', 'Silver tablescape with glitter accents', 'LED dance floor'],
      music: 'disco funk dance', dress: 'Sequins and metallics', menu: 'party' },
    { id: 'moody-floral', shop: 'burgundy', name: 'Moody Floral', palette: ['#3B1F2B', '#7B2D3B', '#B5838D', '#E8D5C4', '#2F3A2F'], tags: ['burgundy', 'dark', 'floral', 'romantic', 'autumn', 'purple'],
      mood: 'Deep jewel tones, abundant florals and candlelight.', decor: ['Burgundy and plum floral runners', 'Velvet napkins', 'Brass candelabras', 'Fruit and flower grazing table'],
      music: 'neo soul candlelight', dress: 'Jewel tones', menu: 'elegant' },
    { id: 'rustic-elegance', shop: 'rustic', name: 'Rustic Elegance', palette: ['#EADBC8', '#A47551', '#5C4033', '#F8F4EE', '#7D8C6A'], tags: ['rustic', 'wood', 'brown', 'barn', 'warm', 'neutral', 'autumn'],
      mood: 'Natural wood, warm lighting and refined country charm.', decor: ['Farm tables with linen runners', 'Edison string lights', 'Wildflowers in vintage vessels', 'Wood slice signage'],
      music: 'country folk acoustic', dress: 'Rustic chic textures and warm neutrals', menu: 'rustic' },
    { id: 'royal-purple', shop: 'purple and gold', name: 'Royal Plum', palette: ['#4B2353', '#7E4A8C', '#D8B4E2', '#F6EFF8', '#C9A86A'], tags: ['purple', 'lavender', 'royal', 'glam', 'gold'],
      mood: 'Rich plum, lavender and gold for a regal evening.', decor: ['Plum velvet linens', 'Lavender and orchid centerpieces', 'Gold-rimmed glassware', 'Throne-style guest-of-honor chair'],
      music: 'r&b soul classics', dress: 'Jewel tones and gold', menu: 'elegant' },
    { id: 'midnight-celestial', shop: 'navy and gold celestial', name: 'Midnight Celestial', palette: ['#16203A', '#2C3A5E', '#C9A86A', '#C7CBD3', '#F4F1EA'], tags: ['celestial', 'navy', 'silver', 'gold', 'dark', 'evening', 'blue'],
      mood: 'Midnight blue, gold stars and soft twinkling light.', decor: ['Navy linens with gold star confetti', 'Hanging moon and star installation', 'Silver candle clusters', 'Twinkle-light backdrop for photos'],
      music: 'neo soul candlelight', dress: 'Navy, silver and gold shimmer', menu: 'elegant' }
  ];

  var MENUS = {
    garden: ['Herb frittata and quiche duo', 'Citrus and burrata salad', 'Lemon ricotta pancakes', 'Mini croissant sandwiches', 'Berry pavlova', 'Elderflower spritz and mimosa bar'],
    modern: ['Seared salmon bites', 'Truffle fries in cones', 'Short rib sliders', 'Caprese skewers', 'Chocolate mousse cups', 'Signature espresso martini'],
    elegant: ['Champagne-poached shrimp', 'Roasted chicken with herb jus', 'Wild mushroom risotto', 'Spring greens with shaved parmesan', 'Raspberry rose cake', 'Rose spritz and sparkling wine'],
    rustic: ['Grazing board with local cheeses', 'Smoked brisket or roasted vegetables', 'Mac and cheese bar', 'Cornbread with honey butter', 'Peach cobbler cups', 'Lavender lemonade'],
    coastal: ['Raw bar or shrimp cocktail', 'Fish tacos with mango salsa', 'Grilled corn salad', 'Lobster or crab rolls', 'Key lime tarts', 'Blue Hawaiian mocktail'],
    tropical: ['Jerk chicken skewers', 'Coconut rice', 'Plantain chips with guac', 'Tropical fruit display', 'Pineapple upside-down cupcakes', 'Passion-fruit punch'],
    classic: ['Beef tenderloin crostini', 'Crab cakes with remoulade', 'Caesar salad', 'Filet or vegetable Wellington', 'Champagne cake', 'Classic martinis'],
    gardenDinner: ['Burrata with heirloom tomatoes and basil', 'Herb-roasted chicken with lemon', 'Grilled vegetables with salsa verde', 'Spring pea and mint risotto', 'Berry pavlova', 'Elderflower spritz'],
    sweet: ['Finger sandwiches', 'Fruit skewers', 'Mini quiches', 'Macaron tower', 'Cake pops', 'Pink lemonade'],
    party: ['Loaded slider bar', 'Wings and dips', 'Taco station', 'Veggie crudités', 'Cupcake tower', 'Glitter cocktail and mocktail']
  };

  var DIETS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut allergy', 'Halal', 'Kosher', 'Pescatarian'];

  /* Checklist: weeks before the event. */
  var CHECKLIST = [
    { w: 52, t: 'Set the budget and guest count', only: ['wedding', 'gala', 'quince'] },
    { w: 40, t: 'Book the venue', only: ['wedding', 'gala', 'quince'], not: ['home'] },
    { w: 32, t: 'Book photographer, caterer and music', only: ['wedding', 'gala', 'quince'] },
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
    { w: 2, t: 'Finish seating chart', not: ['restaurant'], minGuests: 40 },
    { w: 1, t: 'Confirm the reservation and final headcount', in: ['restaurant', 'privateRoom'] },
    { w: 1, t: 'Confirm vendor arrival times and pay balances', not: ['restaurant'] },
    { w: 1, t: 'Build the day-of run of show' },
    { w: 0, t: 'Enjoy the event' },
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

  root.EC_DATA = {
    SETTINGS: SETTINGS, SETTING_RULES: SETTING_RULES, GRATUITY: 0.20,
    EVENT_TYPES: EVENT_TYPES, CATEGORIES: CATEGORIES, PROFILES: PROFILES, ADJUST: ADJUST, TIERS: TIERS,
    CITIES: CITIES, STYLES: STYLES, MENUS: MENUS, DIETS: DIETS, CHECKLIST: CHECKLIST, PASSES: PASSES,
    CREDIT_PACKS: CREDIT_PACKS, PACKAGES: PACKAGES, ADDONS: ADDONS, ALLOWANCE: ALLOWANCE,
    VENUE_TYPES: VENUE_TYPES, PLAYLIST_SEARCH: PLAYLIST_SEARCH, CONTINGENCY: 0.10, SERVICE: 0.20, TIP: 0.10
  };
})(typeof window !== 'undefined' ? window : globalThis);
