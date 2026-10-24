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
    { id: 'champagne-garden', shop: 'sage green and ivory', name: 'Sage Garden', palette: ['#F3E7D3', '#D9C29C', '#A9B89A', '#FFFFFF', '#6F7D63'], tags: ['garden', 'neutral', 'elegant', 'outdoor', 'green', 'gold', 'sage', 'cream'],
      mood: 'Soft gold light, garden greenery and candlelit tables.', decor: ['Greenery runners with white blooms', 'Gold chargers and blush napkins', 'Floating candles in tall glass', 'Champagne tower welcome moment'],
      music: 'jazz brunch acoustic', dress: 'Soft neutrals, garden formal', menu: 'garden' },
    { id: 'modern-noir', shop: 'black and gold', name: 'Modern Noir', palette: ['#111111', '#2B2B2B', '#C9A86A', '#F5F2EC', '#7A6A55'], tags: ['black', 'dark', 'gold', 'modern', 'glam', 'evening'],
      mood: 'Black and gold, sharp lines and dramatic low light.', decor: ['Black linens with gold flatware', 'Mirrored table numbers', 'Tall black taper candles', 'Neon sign with the guest of honor’s name'],
      music: 'r&b lounge house', dress: 'All black, cocktail to black tie', menu: 'modern' },
    { id: 'blush-romance', shop: 'blush pink', name: 'Blush Romance', palette: ['#F7DCDC', '#E8B4B8', '#C98B92', '#FFF7F3', '#B88A5A'], tags: ['pink', 'blush', 'romantic', 'soft', 'floral', 'gold', 'tea'],
      mood: 'Blush roses, soft draping and a romantic glow.', decor: ['Blush and ivory rose centerpieces', 'Sheer draped backdrop', 'Rose-gold accents', 'Pearl-dotted dessert table'],
      music: 'love songs soul', dress: 'Blush, ivory and champagne', menu: 'elegant' },
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
    { id: 'ivory-ballroom', shop: 'ivory and gold', name: 'Ivory Elegance', palette: ['#FBF6EC', '#EFE3CF', '#D9C4A0', '#B8925A', '#FFFFFF'], tags: ['ivory', 'cream', 'gold', 'classic', 'elegant', 'ballroom', 'champagne', 'formal'],
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
    { id: 'rustic-elegance', shop: 'rustic', name: 'Rustic Elegance', palette: ['#EADBC8', '#A47551', '#5C4033', '#F8F4EE', '#7D8C6A'], tags: ['rustic', 'wood', 'brown', 'barn', 'warm', 'neutral', 'autumn'],
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
    { id: 'midnight-celestial', shop: 'navy and gold celestial', name: 'Midnight Celestial', palette: ['#16203A', '#2C3A5E', '#C9A86A', '#C7CBD3', '#F4F1EA'], tags: ['celestial', 'navy', 'silver', 'gold', 'dark', 'evening', 'blue'],
      mood: 'Midnight blue, gold stars and soft twinkling light.', decor: ['Navy linens with gold star confetti', 'Hanging moon and star installation', 'Silver candle clusters', 'Twinkle-light backdrop for photos'],
      music: 'neo soul candlelight', dress: 'Navy, silver and gold shimmer', menu: 'elegant' },
    { id: 'citrus-fiesta', shop: 'hot pink and orange', name: 'Citrus Fiesta', palette: ['#E23D7A', '#F07B2E', '#F6B26B', '#FFF6EE', '#2A9D9A'], tags: ['orange', 'fiesta', 'bright', 'colorful', 'summer', 'coral', 'citrus'],
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
    EVENT_TYPES: EVENT_TYPES, CATEGORIES: CATEGORIES, PROFILES: PROFILES, ADJUST: ADJUST, TIERS: TIERS,
    CITIES: CITIES, STYLES: STYLES, MENUS: MENUS, DIETS: DIETS, CHECKLIST: CHECKLIST, PASSES: PASSES,
    CREDIT_PACKS: CREDIT_PACKS, PACKAGES: PACKAGES, ADDONS: ADDONS, ALLOWANCE: ALLOWANCE,
    VENUE_TYPES: VENUE_TYPES, PLAYLIST_SEARCH: PLAYLIST_SEARCH, CONTINGENCY: 0.10, SERVICE: 0.20, TIP: 0.10
  };
})(typeof window !== 'undefined' ? window : globalThis);
