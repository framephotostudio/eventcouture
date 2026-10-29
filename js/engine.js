/* Event Couture planning engine: deterministic math only (no AI here).
   Budgets, pass pricing, quantities, timelines, capacity and concept matching. */
(function (root) {
  'use strict';
  var D = root.EC_DATA;

  function round2(n) { return Math.round(n * 100) / 100; }
  function roundTo(n, step) { return Math.round(n / step) * step; }
  function typeOf(id) { return D.EVENT_TYPES.find(function (t) { return t.id === id; }) || D.EVENT_TYPES[D.EVENT_TYPES.length - 1]; }
  /* A typed city ("Kelowna, BC") is matched to its country, and in Canada to its province's sales tax. */
  var CA_RE = /,\s*(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b|\bcanada\b/i;
  function cityOf(name) {
    var hit = D.CITIES.find(function (c) { return c.name === name; }); if (hit) return hit;
    var m = CA_RE.exec(String(name || ''));
    if (m) { var base = D.CITIES.find(function (c) { return c.name === 'Other city in Canada'; }); var pv = m[1] && D.PROVINCES[m[1].toUpperCase()]; return pv ? Object.assign({}, base, { tax: pv.tax, taxName: pv.label }) : base; }
    return D.CITIES.find(function (c) { return c.name === 'Other US city'; });
  }
  function countryOf(city) { return D.COUNTRIES.find(function (c) { return c.id === cityOf(city).country; }) || D.COUNTRIES[0]; }
  var CUR = 'USD';
  function useCountry(cityOrNull) { CUR = cityOrNull ? countryOf(cityOrNull).currency : 'USD'; return CUR; }
  function currency() { return CUR; }
  function isOtherCity(c) { return !c || /^Other /.test(c.name); }

  /* ---------- Event Pass pricing ---------- */
  function passFor(guests) {
    guests = Math.max(1, Math.ceil(guests || 1));
    for (var i = 0; i < D.PASSES.length; i++) {
      var p = D.PASSES[i];
      if (guests <= p.max) {
        var min = i === 0 ? 1 : D.PASSES[i - 1].max + 1;
        return { price: p.price, max: p.max, min: min, label: (i === 0 ? 'Up to ' : min.toLocaleString('en-US') + ' to ') + p.max.toLocaleString('en-US') + ' guests' };
      }
    }
    var extra = Math.ceil((guests - 10000) / 5000);
    return { price: round2(349.99 + 150 * extra), max: 10000 + extra * 5000, min: 10001, label: 'Up to ' + (10000 + extra * 5000).toLocaleString('en-US') + ' guests' };
  }
  function upgradeCost(paidPrice, newGuests) {
    var next = passFor(newGuests);
    return { pass: next, due: Math.max(0, round2(next.price - (paidPrice || 0))) };
  }

  /* ---------- Budget ---------- */
  /* Cultural weddings (Arabic, Indian, Persian) are weddings with their own traditions and music. */
  /* A cultural wedding, or a cultural engagement party where that culture has one (its own name, guests, moments and music on top of the wedding's). */
  var ENGAGED = {};
  function culture(ev) {
    var cu = ev && ev.culture && D.CULTURES && D.CULTURES[ev.culture]; if (!cu) return null;
    if (ev.type === 'wedding') return cu;
    if (ev.type === 'engagement' && cu.engagement) return ENGAGED[ev.culture] || (ENGAGED[ev.culture] = Object.assign({}, cu, cu.engagement, { labels: Object.assign({}, cu.labels || {}, cu.engagement.labels || {}) }));
    return null;
  }
  var MUSIC_CATS = ['dj', 'liveMusic', 'singer', 'zaffe', 'dhol', 'dabke', 'qawwali', 'mariachi', 'lionDance', 'flamenco', 'dakka', 'gospel', 'secondLine'];
  function musicOf(ev) { var cu = culture(ev); if (!cu) return []; var ok = cu.music.map(function (m) { return m[0]; }); var m = (Array.isArray(ev.music) ? ev.music : cu.musicDefault).filter(function (x) { return ok.indexOf(x) >= 0; }); return m; }
  function typeName(ev) { var cu = culture(ev); return cu ? cu.name : typeOf(ev && ev.type).name; }
  function categoriesFor(ev) {
    var t = typeOf(ev.type);
    if (ev.setting === 'restaurant' || ev.setting === 'privateRoom') {
      var rl = D.PROFILES[ev.setting].slice(); if (ev.kids && ev.setting === 'privateRoom') rl.push('kids');
      if (['gala', 'wedding', 'anniversary', 'engagement', 'dinner', 'holiday', 'christmas'].indexOf(ev.type) >= 0) rl = rl.filter(function (c) { return c !== 'balloons'; });
      if ((ev.type === 'holiday' || ev.type === 'christmas')) rl = rl.filter(function (c) { return c !== 'cake' && c !== 'cakeFee'; });
      var rs = {};
      return rl.concat(ev.include || []).filter(function (c) { if (rs[c] || !D.CATEGORIES[c] || (ev.exclude || []).indexOf(c) >= 0) return false; rs[c] = 1; return true; });
    }
    var list = (D.PROFILES[t.style] || D.PROFILES.party).slice();
    if (ev.setting === 'outdoor') list = list.concat(['tent', 'restrooms', 'generator', 'permits']);
    list = list.concat((ev.priorities || []).filter(function (c) { return D.CATEGORIES[c] && ['venue', 'catering'].indexOf(c) < 0; }));   /* a must-have is always in the plan */
    if (ev.kids) list.push('kids');
    if (ev.type === 'wedding' && list.indexOf('officiant') < 0) list.push('officiant');
    if (ev.type !== 'wedding') list = list.filter(function (c) { return c !== 'officiant'; });
    if (ev.setting === 'home') list = list.filter(function (c) { return c !== 'venue' && c !== 'privateDining'; }).concat(t.style === 'dining' ? ['catering', 'rentals'] : []);
    if (ev.alcohol === 'none') list = list.filter(function (c) { return c !== 'bartender'; });
    /* No one is being dressed for a dinner party, holiday party or gala: guests bring their own look. */
    if (['dinner', 'holiday', 'christmas', 'gala', 'corporate', 'other', 'kids-birthday'].indexOf(ev.type) >= 0 || (ev.kids && /birthday/.test(ev.type || ''))) list = list.filter(function (c) { return c !== 'attire' && c !== 'hairMakeup'; });   /* a child's party doesn't budget a glam look for the host */
    if (ev.type === 'corporate') list = list.filter(function (c) { return ['balloons', 'favors', 'cake', 'cakeFee'].indexOf(c) < 0 || (ev.include || []).indexOf(c) >= 0; });
    /* Balloon installations don't suit black-tie or romantic occasions unless the host adds them. */
    if (['gala', 'wedding', 'anniversary', 'engagement', 'dinner', 'holiday', 'christmas'].indexOf(ev.type) >= 0) list = list.filter(function (c) { return c !== 'balloons' || (ev.include || []).indexOf('balloons') >= 0; });
    if ((ev.type === 'holiday' || ev.type === 'christmas')) list = list.filter(function (c) { return (c !== 'cake' && c !== 'cakeFee') || (ev.include || []).indexOf(c) >= 0; });
    var said = ((ev.inspiration && ev.inspiration.text) || '').toLowerCase();
    if (ev.setting === 'outdoor' && /\b(park|backyard|beach|yard|lake)\b/.test(said)) list = list.filter(function (c) { return c !== 'venue'; });   /* a park or backyard needs a permit, not a rental */
    var cu = culture(ev);
    if (cu) list = list.filter(function (c) { return MUSIC_CATS.indexOf(c) < 0 || (ev.priorities || []).indexOf(c) >= 0 && musicOf(ev).indexOf(c) >= 0; }).concat(musicOf(ev), cu.add);
    var seen = {};
    return list.filter(function (c) { if (seen[c] || (ev.exclude || []).indexOf(c) >= 0) return false; seen[c] = 1; return true; });
  }

  function rules(ev) { return (D.SETTING_RULES && D.SETTING_RULES[ev.setting]) || {}; }
  function tiersFor(catId, ev) { if (musicOf(ev).indexOf(catId) >= 0 || ((culture(ev) || {}).add || []).indexOf(catId) >= 0) return 'LSU';   /* the music she chose and her traditions are in every version */ var r = rules(ev).tiers; return (r && r[catId]) || D.CATEGORIES[catId].tier; }
  /* Start hour; midnight to 4 AM counts as late night (24 to 28), never as daytime. */
  function startHour(ev) { var h = +String((ev && ev.time) || '18:00').split(':')[0]; return h < 5 ? h + 24 : h; }
  function isDaytime(ev) { var h = startHour(ev); return h < 15; }
  function lineItem(catId, ev, tier) {
    var c = D.CATEGORIES[catId];
    var t = typeOf(ev.type);
    var adj = D.ADJUST[ev.type] || {};
    var city = cityOf(ev.city);
    var guests = Math.max(1, ev.guests || t.defaultGuests);
    var hours = ev.hours || t.hours;
    var mult = (adj[catId] || 1) * city.index * tier.mult;
    var lo = 0, hi = 0;
    var fscale = c.flat ? 1 : Math.min(1.5, Math.max(0.4, Math.sqrt(guests / 50)));
    if (c.fixed) { lo += c.fixed[0] * fscale; hi += c.fixed[1] * fscale; }
    if (c.perGuest) { lo += c.perGuest[0] * guests; hi += c.perGuest[1] * guests; }
    if (c.perHour) {
      var h = (rules(ev).hours && rules(ev).hours[catId]) || (adj.hours && adj.hours[catId]) || hours;
      var staff = c.staffPer ? Math.max(1, Math.ceil(guests / c.staffPer)) : 1;
      lo += c.perHour[0] * h * staff; hi += c.perHour[1] * h * staff;
    }
    if (c.perPerson) {
      var people = (adj.people && adj.people[catId]) || c.people || 1;
      lo += c.perPerson[0] * people; hi += c.perPerson[1] * people;
    }
    lo *= mult; hi *= mult;
    var mealNote = '', label = c.name, cu = culture(ev);
    if (cu && cu.labels[catId]) label = cu.labels[catId];
    if (catId === 'tableDecor' && ev.kids && /birthday/.test(ev.type || '')) label = 'Table decor (small centerpiece, confetti, party favors)';   /* no candles at a child's party */
    /* Drinks follow the host's alcohol choice: none = soft drinks and mocktails, wine = beer and wine only */
    if (catId === 'bar' || catId === 'restaurantDrinks') {
      if (ev.alcohol === 'none') { lo *= 0.4; hi *= 0.4; label = ev.kids && /birthday/.test(ev.type) ? 'Drinks (juice, lemonade, water)' : catId === 'bar' ? 'Non-alcoholic drinks (mocktails, soft drinks, coffee)' : 'Non-alcoholic drinks'; }
      else if (ev.alcohol === 'wine') { lo *= 0.75; hi *= 0.75; label = catId === 'bar' ? 'Beer and wine' : 'Drinks (beer and wine, about two per person)'; }
    }
    if (c.meal && isDaytime(ev)) { lo *= 0.8; hi *= 0.8; mealNote = ', lunch or brunch prices'; }
    var extras = [];
    if (c.service) extras.push({ label: 'Service charge (20%)', rate: D.SERVICE });
    if (c.taxable && city.tax) extras.push({ label: (city.taxName || 'Sales tax') + ' (' + city.tax + '%)', rate: city.tax / 100 });
    if (c.tip) extras.push({ label: 'Tip (10%)', rate: D.TIP });
    if (c.gratuity) extras.push({ label: 'Tip or automatic group gratuity (20%)', rate: D.GRATUITY });
    var rate = extras.reduce(function (s, e) { return s + e.rate; }, 0);
    lo = lo * (1 + rate); hi = hi * (1 + rate);
    var ov = ev.overrides && ev.overrides[catId];
    if (ov && ov.amount > 0) { lo = hi = ov.amount; }
    return {
      id: catId, name: label, group: c.group,
      /* A price the host entered is shown exactly as entered, already including fees. */
      lo: ov && ov.amount > 0 ? ov.amount : roundTo(lo, 5), hi: ov && ov.amount > 0 ? ov.amount : roundTo(hi, 5), mid: ov && ov.amount > 0 ? ov.amount : roundTo((lo + hi) / 2, 5),
      extras: ov && ov.amount > 0 ? [] : extras.map(function (e) { return e.label; }),
      label: ov ? (ov.amount > 0 ? ({ vendor: 'Vendor-published price', quote: 'Confirmed quote', booking: 'Confirmed booking' }[ov.source] || 'Your price') : (ov.source === 'booking' ? 'Booked; estimate until you add the price' : 'Planning estimate')) : 'Planning estimate',
      source: ov ? (ov.note || '') : ((isOtherCity(city) ? (ev.city && !/^Other /.test(ev.city) ? ev.city + ', typical ' + (city.country === 'CA' ? 'Canadian' : 'US') + ' prices' : 'Typical ' + (city.country === 'CA' ? 'Canadian' : 'US') + ' prices') : city.name + ' estimate') + ', ' + Number(guests).toLocaleString('en-US') + (guests === 1 ? ' guest' : ' guests') + mealNote)
    };
  }

  function budget(ev, tierId) {
    if (tierId === 'F') return budgetFit(ev);
    var tier = D.TIERS.find(function (x) { return x.id === tierId; }) || D.TIERS[1];
    var cats = categoriesFor(ev).filter(function (id) { return tiersFor(id, ev).indexOf(tier.id) >= 0 || (ev.include || []).concat(ev.priorities || []).indexOf(id) >= 0; });
    var items = cats.map(function (id) { return lineItem(id, ev, tier); });
    var sum = function (k) { return items.reduce(function (s, i) { return s + i[k]; }, 0); };
    var lo = sum('lo'), hi = sum('hi'), mid = sum('mid');
    var contingency = roundTo(mid * D.CONTINGENCY, 5);
    return { tier: tier, items: items, lo: lo, hi: hi, mid: mid, contingency: contingency, total: mid + contingency, perGuest: Math.round((mid + contingency) / Math.max(1, ev.guests || 1)) };
  }

  function allBudgets(ev) { return D.TIERS.map(function (t) { return budget(ev, t.id); }); }

  /* Made for your budget: one plan that lands at the host's number, protecting must-haves. */
  var FIT_TIER = { id: 'F', name: 'Your budget plan', mult: 1, blurb: 'One plan built to your exact budget, with your must-haves protected.' };
  /* Never auto-dropped: venue, food, security and insurance (venues often require the last two). They can be trimmed, not removed. */
  var OPTIONAL = ['videographer', 'liveMusic', 'lighting', 'coordinator', 'photoBooth', 'mc', 'transport', 'invitations', 'parking', 'favors', 'entertainment', 'cleanup', 'hairMakeup', 'florals', 'balloons'];
  /* Lowercase a category name for a sentence, keeping DJ, MC and LED as they are. */
  function lc(name) { return String(name).toLowerCase().replace(/\b(dj|mc|led)\b/g, function (m) { return m.toUpperCase(); }); }
  function listJoin(a) { return a.length < 2 || a.some(function (x) { return / and /.test(x); }) ? a.join(', ') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function budgetFit(ev) {
    var pri = ev.priorities || [];
    var target = (ev.budget || 0) / (1 + D.CONTINGENCY);
    var L = budget(ev, 'L'), S = budget(ev, 'S'), U = budget(ev, 'U');
    var get = function (b, id) { var i = b.items.find(function (x) { return x.id === id; }); return i ? i.mid : 0; };
    var ids = U.items.map(function (i) { return i.id; });
    var fixed = function (id) { return !!(ev.overrides && ev.overrides[id] && ev.overrides[id].amount > 0); };
    var rows = ids.map(function (id) {
      var u = get(U, id), sm = get(S, id), l = get(L, id);
      var isPri = pri.indexOf(id) >= 0;
      var start = sm || (isPri ? u : 0);
      if (isPri && sm) start = Math.min(u, sm * 1.3);
      return { id: id, pri: isPri, amt: start, floor: fixed(id) ? start : (l || (sm ? sm * 0.6 : 0)), ceil: u || sm, fixed: fixed(id) };
    });
    var total = function () { return rows.reduce(function (s, r) { return s + r.amt; }, 0); };
    var dropped = [], notes = [];
    if (!ev.budget) { target = total(); }
    // too high: trim non-priorities toward their floor, then drop optional extras, then trim priorities
    if (total() > target) {
      var flex = rows.filter(function (r) { return !r.pri && !r.fixed && r.amt > r.floor; });
      var room = flex.reduce(function (s, r) { return s + (r.amt - r.floor); }, 0);
      var need = total() - target; var k = Math.min(1, room ? need / room : 0);
      flex.forEach(function (r) { r.amt -= (r.amt - r.floor) * k; });
    }
    if (total() > target) {
      /* Some things are part of the occasion itself: hair and makeup for a bride or quinceañera, flowers at a wedding. */
      var essential = ({ wedding: ['hairMakeup', 'florals'], quince: ['hairMakeup', 'florals'] }[ev.type] || []).concat(musicOf(ev), (culture(ev) || {}).add || []);   /* the music they chose and their traditions stay in */
      var optional = OPTIONAL.concat(['dinner', 'holiday', 'christmas', 'brunch'].indexOf(ev.type) >= 0 ? ['photographer', 'decor'] : []).concat(ev.kids && /birthday/.test(ev.type) ? ['dj', 'photographer'] : []);
      rows.filter(function (r) { return !r.pri && !r.fixed && optional.indexOf(r.id) >= 0 && essential.indexOf(r.id) < 0 && r.amt > 0; })
        .sort(function (a, b) { return b.amt - a.amt; })
        .forEach(function (r) { if (total() > target) { dropped.push(r.id); r.amt = 0; } });
      /* Essentials go only if the host's own must-haves would otherwise be cut. */
      rows.filter(function (r) { return !r.pri && !r.fixed && essential.indexOf(r.id) >= 0 && musicOf(ev).indexOf(r.id) < 0 && r.amt > 0; })   /* music she chose is trimmed, never dropped */
        .forEach(function (r) { if (total() > target) { dropped.push(r.id); r.amt = 0; } });
    }
    if (total() > target) {
      var pflex = rows.filter(function (r) { return r.pri && !r.fixed && r.amt > r.floor; });
      var proom = pflex.reduce(function (s, r) { return s + (r.amt - r.floor); }, 0);
      var pk = Math.min(1, proom ? (total() - target) / proom : 0);
      pflex.forEach(function (r) { r.amt -= (r.amt - r.floor) * pk; });
    }
    if (total() > target) { // last resort: leaner choices across the board, never below 70% of the lowest version
      var lean = rows.filter(function (r) { return !r.fixed && r.amt > r.floor * 0.7; });
      var lroom = lean.reduce(function (s, r) { return s + (r.amt - r.floor * 0.7); }, 0);
      var lk = Math.min(1, lroom ? (total() - target) / lroom : 0);
      lean.forEach(function (r) { r.amt -= (r.amt - r.floor * 0.7) * lk; });
    }
    // money left over: the budget is a maximum, not a target. Only the host's must-haves are upgraded; everything else stays at the Signature level.
    if (total() < target * 0.995) {
      [rows.filter(function (r) { return r.pri && !r.fixed; })].forEach(function (grp) {
        var gap = target - total(); if (gap <= 0) return;
        var up = grp.reduce(function (s, r) { return s + Math.max(0, r.ceil - r.amt); }, 0);
        var uk = Math.min(1, up ? gap / up : 0);
        grp.forEach(function (r) { r.amt += Math.max(0, r.ceil - r.amt) * uk; });
      });
    }
    var tierItems = U.items.concat(S.items.filter(function (i) { return ids.indexOf(i.id) < 0; }));
    var items = rows.filter(function (r) { return r.amt > 0; }).map(function (r) {
      var base = tierItems.find(function (i) { return i.id === r.id; });
      var mid = r.fixed ? r.amt : roundTo(r.amt, 5);
      return Object.assign({}, base, { mid: mid, lo: base.label === 'Planning estimate' ? roundTo(mid * 0.85, 5) : mid, hi: base.label === 'Planning estimate' ? roundTo(mid * 1.15, 5) : mid, priority: r.pri });
    });
    var sum = function (key) { return items.reduce(function (s, i) { return s + i[key]; }, 0); };
    var mid = sum('mid'); var contingency = roundTo(mid * D.CONTINGENCY, 5);
    /* Rounding each line to $5 can tip a plan a few dollars over a realistic maximum; take it from the largest flexible line. */
    var tip = ev.budget ? mid + contingency - ev.budget : 0;
    if (tip > 0 && tip <= 25 * items.length) {
      var flexItems = items.filter(function (i) { return !i.priority && !fixed(i.id); }).sort(function (a, b) { return b.mid - a.mid; });
      for (var fi = 0; fi < flexItems.length && mid + contingency > ev.budget; fi++) {
        var it = flexItems[fi], cut = Math.min(it.mid * 0.2, Math.ceil((mid + contingency - ev.budget) / (1 + D.CONTINGENCY) / 5) * 5 + 5);
        it.mid = roundTo(it.mid - cut, 5); if (it.label === 'Planning estimate') { it.lo = roundTo(it.mid * 0.85, 5); it.hi = roundTo(it.mid * 1.15, 5); } else { it.lo = it.hi = it.mid; }
        mid = sum('mid'); contingency = roundTo(mid * D.CONTINGENCY, 5);
      }
    }
    var res = { tier: FIT_TIER, items: items, lo: sum('lo'), hi: sum('hi'), mid: mid, contingency: contingency, total: mid + contingency,
      perGuest: Math.round((mid + contingency) / Math.max(1, ev.guests || 1)), dropped: dropped };
    res.shortBy = ev.budget && res.total > ev.budget ? res.total - ev.budget : 0;
    res.spare = ev.budget && res.total < ev.budget ? ev.budget - res.total : 0;
    return res;
  }

  /* Pros and cons for a budget version, derived from what it includes. */
  function prosCons(ev, b) {
    var ids = b.items.map(function (i) { return i.id; });
    var has = function (x) { return ids.indexOf(x) >= 0; };
    var pros = [], cons = [];
    if (b.tier.id === 'F') {
      var pri = (ev.priorities || []).map(function (id) { return D.CATEGORIES[id] ? lc(D.CATEGORIES[id].name) : id; });
      var roomy = b.spare && b.spare > ev.budget * 0.1;
      pros.push(b.shortBy ? 'As close to your budget as this guest count allows' : roomy ? 'Comes in about ' + money(b.spare) + ' under your maximum, cushion included' : 'Lands at your budget, cushion included');
      if (pri.length) pros.push('Protects your must-haves: ' + pri.join(', '));
      pros.push(D.CITIES.some(function (c) { return c.name === ev.city && !/^Other /.test(c.name); }) ? 'Every category sized to ' + ev.city : 'Every category priced at typical US rates');
      if (b.dropped && b.dropped.length) cons.push('Leaves out ' + listJoin(b.dropped.map(function (id) { return lc(D.CATEGORIES[id].name); })));
      if (b.shortBy) cons.push('Still about ' + money(b.shortBy) + ' over; ' + (ev.setting === 'home' ? 'fewer guests or skipping a hired service would close the gap' : 'fewer guests or a simpler setting would close the gap'));
      if (!cons.length) cons.push(roomy ? 'None: you have room to add a must-have or keep the savings' : 'Less room to add extras later');
      return { pros: pros, cons: cons };
    }
    if (ev.setting === 'restaurant') {
      var kind = { L: 'a stylish casual restaurant', S: 'an upscale restaurant', U: 'a fine-dining restaurant' }[b.tier.id];
      var meal = b.items.filter(function (i) { return i.id === 'restaurantFood' || i.id === 'restaurantDrinks'; }).reduce(function (s, i) { return s + i.mid; }, 0);
      pros.push('Plans for ' + kind + ': food and drinks about ' + money(meal / Math.max(1, ev.guests || 1)) + ' per person with tax and tip');
      pros.push('No venue, rentals, setup or cleanup');
      if (has('photographer')) pros.push('A photographer for the first two hours');
      cons.push('Decor is limited to the table; ask the restaurant what is allowed');
      if (b.tier.id === 'U') cons.push('Fine dining books up early for groups');
      else cons.push('Large groups may get a set menu or automatic tip');
      if (ev.budget && b.total > ev.budget) cons.unshift('About ' + money(b.total - ev.budget) + ' over your budget');
      else if (ev.budget) pros.unshift('Fits your budget with ' + money(ev.budget - b.total) + ' to spare');
      return { pros: pros, cons: cons };
    }
    if (b.tier.id === 'L') {
      pros.push('Lowest total, about ' + money(b.total));
      pros.push('Keeps the colors, theme and key decor of the concept');
      cons.push('More do-it-yourself setup and styling');
      if (!has('photographer')) cons.push('No hired photographer; friends capture the photos');
      cons.push('Simpler venue options');
    } else if (b.tier.id === 'S') {
      pros.push('Pros handle food, photos and music');
      pros.push('The look stays polished without top-tier prices');
      if (has('florals')) pros.push('Real florals instead of faux');
      cons.push('Some vendors book up 6 to 10 weeks ahead');
      if (!has('lighting')) cons.push('No custom lighting design');
    } else {
      pros.push('Statement pieces: lighting, ' + (has('liveMusic') ? 'live music, ' : '') + 'fuller florals');
      if (has('coordinator')) pros.push('A day-of coordinator so the host can relax');
      pros.push('Most memorable guest experience');
      cons.push('Highest total, about ' + money(b.total));
      cons.push('Larger deposits due earlier');
    }
    if (ev.budget && b.total > ev.budget) cons.unshift('About ' + money(b.total - ev.budget) + ' over your budget');
    else if (ev.budget) pros.unshift('Fits your budget with ' + money(ev.budget - b.total) + ' to spare');
    return { pros: pros, cons: cons };
  }

  /* Budget guardian: cheaper swaps that keep the look. */
  function guardian(ev, b) {
    if (!ev.budget || b.total <= ev.budget) return { over: 0, swaps: [] };
    var over = b.total - ev.budget;
    var optional = ['videographer', 'liveMusic', 'lighting', 'coordinator', 'photoBooth', 'mc', 'transport', 'invitations', 'parking', 'favors', 'entertainment', 'security', 'photographer', 'dj', 'attire', 'hairMakeup', 'balloons', 'florals'];
    var pri = ev.priorities || [];
    var swaps = b.items.filter(function (i) { return optional.indexOf(i.id) >= 0 && pri.indexOf(i.id) < 0 && !(ev.type === 'wedding' && /photographer|attire/.test(i.id)); })
      .sort(function (a, b2) { return b2.mid - a.mid; })
      .map(function (i) { return { kind: 'drop', id: i.id, text: ({ photographer: 'Skip the hired photographer; friends take the photos', dj: 'Play your own playlist instead of hiring a DJ', attire: 'Wear something you already own or rent the look', hairMakeup: 'Do hair and makeup yourself', florals: 'Use greenery and grocery-store flowers', balloons: 'Skip the balloon installation' }[i.id]) || 'Skip ' + lc(i.name), save: Math.round(i.mid * (1 + D.CONTINGENCY)) }; });
    var florals = b.items.find(function (i) { return i.id === 'florals'; });
    if (florals) swaps.push({ kind: 'note', id: 'florals', text: 'Use seasonal flowers and greenery-heavy designs', save: Math.round(florals.mid * 0.35) });
    var bar = b.items.find(function (i) { return i.id === 'bar'; });
    if (bar && ev.alcohol !== 'none' && ev.alcohol !== 'wine') swaps.push({ kind: 'note', id: 'bar', text: 'Beer, wine and one signature cocktail instead of a full bar', save: Math.round(bar.mid * 0.3) });
    else if (bar && ev.alcohol === 'wine') swaps.push({ kind: 'note', id: 'bar', text: 'Serve wine with dinner only, and one welcome drink', save: Math.round(bar.mid * 0.25) });
    else if (bar && !(ev.kids && /birthday/.test(ev.type))) swaps.push({ kind: 'note', id: 'bar', text: 'Lemonade and iced tea stations instead of a mocktail bar', save: Math.round(bar.mid * 0.3) });
    var drinks = b.items.find(function (i) { return i.id === 'restaurantDrinks'; });
    if (drinks) swaps.push({ kind: 'note', id: 'restaurantDrinks', text: 'One drink each, or guests buy their own drinks', save: Math.round(drinks.mid * 0.5) });
    var food = b.items.find(function (i) { return i.id === 'restaurantFood'; });
    if (food && !isDaytime(ev)) swaps.push({ kind: 'note', id: 'restaurantFood', text: 'Make it lunch or brunch instead of dinner', save: Math.round(food.mid * 0.2) });
    var hours = ev.hours || typeOf(ev.type).hours;
    if (hours > 3) { var shorter = budget(Object.assign({}, ev, { hours: hours - 1 }), b.tier.id), cut1 = Math.round(b.total - shorter.total);   /* the real difference, not a guess */
      if (cut1 > 0) swaps.push({ kind: 'hours', id: 'hours', text: 'Shorten the event by one hour', save: cut1 }); }
    D.TIERS.forEach(function (t) {
      if (t.id === b.tier.id) return;
      var alt = budget(ev, t.id).total;
      if (alt < b.total) swaps.push({ kind: 'tier', id: 'tier', to: t.id, text: 'Switch to the ' + t.name + ' version (total ' + money(alt) + ')', save: b.total - alt });
    });
    /* Bigger levers for big gaps: fewer guests, or a setting without venue costs. */
    var curTotal = function (e2) { return (e2.tier === 'F' && e2.budget ? budgetFit(e2) : budget(e2, e2.tier || 'S')).total; };
    var gN = ev.guests || 0, with_ = function (o) { return Object.assign({}, ev, o); };
    if (gN > 2) {
      var lo = 1, hi = gN - 1, best = 0;
      while (lo <= hi) { var md = (lo + hi) >> 1; if (curTotal(with_({ guests: md, expected: Math.min(ev.expected || md, md) })) <= ev.budget) { best = md; lo = md + 1; } else hi = md - 1; }
      if (best >= 2 && best >= gN * 0.6) swaps.push({ kind: 'guests', id: 'guests', to: best, text: 'Invite ' + best + ' people instead of ' + gN + ' (fits your budget)', save: b.total - curTotal(with_({ guests: best, expected: Math.min(ev.expected || best, best) })) });
    }
    if (ev.setting === 'outdoor') { var ib = curTotal(with_({ setting: 'indoor' })); if (ib < b.total) swaps.push({ kind: 'setting', id: 'setting', to: 'indoor', text: 'Choose an indoor venue (no tent, restroom trailer or generator)', save: b.total - ib }); }
    if (ev.setting !== 'home' && ev.setting !== 'restaurant' && gN <= 80) { var hb = curTotal(with_({ setting: 'home' })); if (hb < b.total) swaps.push({ kind: 'setting', id: 'setting', to: 'home', text: 'Hold it at home or a friend\u2019s place', save: b.total - hb }); }
    /* Smallest change that closes the gap first; then the rest, biggest saving first. */
    swaps = swaps.filter(function (s) { return s.save > 0; }).sort(function (a, c) {
      if (!!a.harsh !== !!c.harsh) return a.harsh ? 1 : -1;
      var ac = a.save >= over, cc = c.save >= over;
      if (ac !== cc) return ac ? -1 : 1;
      return ac ? a.save - c.save : c.save - a.save;
    }).slice(0, 6);
    return { over: over, swaps: swaps };
  }

  /* ---------- Quantities ---------- */
  function quantities(ev) {
    var g = Math.max(1, ev.expected || ev.guests || 1);
    var hours = ev.hours || typeOf(ev.type).hours;
    var tables = Math.ceil(g / 8);
    var drinks = g * (1 + hours);
    if (ev.setting === 'restaurant' || ev.setting === 'privateRoom') return [
      { item: ev.setting === 'privateRoom' ? 'Private room for' : 'Reservation', qty: g, unit: 'seats', note: 'Book for everyone who said yes, including you' },
      { item: 'Cake or dessert', qty: Math.ceil(g * 1.1), unit: 'servings', note: 'Or order dessert from the menu and skip the cake-cutting fee' },
      (ev.kids && /birthday/.test(ev.type || '')) ? { item: 'Balloons for the table', qty: Math.max(3, Math.ceil(g / 4)), unit: 'balloons', note: 'Ask the restaurant first; weighted, not helium-only' } : { item: 'Candles', qty: 1, unit: 'set', note: 'Ask the restaurant before lighting anything' },
      { item: 'Small centerpieces', qty: Math.max(1, Math.ceil(g / 6)), unit: 'pieces', note: 'One for every six seats' },
      { item: 'Favors', qty: Math.ceil(g * 1.05), unit: 'favors', note: 'Optional; 5% extra' }
    ];
    return [
      { item: 'Drinks (all kinds)', qty: drinks, unit: 'servings', note: '2 in the first hour, then 1 per hour per guest' },
    ].concat(ev.alcohol === 'none' ? (ev.kids && /birthday/.test(ev.type) ? [] : [{ item: 'Sparkling cider or mocktail for a toast', qty: Math.ceil(g / 6), unit: 'bottles', note: '6 toast pours per bottle' }]) : [
      { item: 'Wine', qty: Math.ceil(drinks * 0.4 / 5), unit: 'bottles', note: 'If 40% of drinks are wine; 5 glasses per bottle' },
      { item: 'Beer', qty: Math.ceil(drinks * (ev.alcohol === 'wine' ? 0.45 : 0.25)), unit: 'bottles or cans', note: ev.alcohol === 'wine' ? 'About 45% of drinks' : 'About 25% of drinks; the rest are cocktails and soft drinks' },
      { item: 'Champagne for a toast', qty: Math.ceil(g / 6), unit: 'bottles', note: '6 toast pours per bottle' }]).concat([
      { item: 'Ice', qty: Math.ceil(g * 1.5), unit: 'lb', note: '1.5 lb per guest; double it outdoors in summer' },
      { item: 'Appetizers', qty: g * (ev.mealServed === false ? 10 : 4), unit: 'pieces', note: ev.mealServed === false ? 'No full meal: 10 pieces per guest' : '4 pieces per guest before a meal' },
      { item: 'Cake or dessert', qty: Math.ceil(g * 1.1), unit: 'servings', note: '10% extra' },
      { item: 'Plates', qty: Math.ceil(g * 3 * 1.1), unit: 'plates', note: 'Appetizer, dinner and dessert, plus 10%' },
      { item: 'Napkins', qty: Math.ceil(g * 3), unit: 'napkins', note: '3 per guest' },
      { item: 'Chairs', qty: g, unit: 'chairs', note: 'One per guest' },
      { item: 'Round tables (seat 8)', qty: tables, unit: 'tables', note: 'Plus 2 to 3 for cake, gifts and food' },
      { item: 'Tablecloths', qty: tables + 3, unit: 'linens', note: 'Guest tables plus service tables' },
      { item: 'Favors', qty: Math.ceil(g * 1.05), unit: 'favors', note: '5% extra' }
    ]);
  }

  /* ---------- Timeline ---------- */
  /* Checklist wording follows what is actually in the plan (no "book hair and makeup" when it was left out). */
  function fitStep(t, ev) {
    var have; try { have = (ev.tier === 'F' && ev.budget ? budgetFit(ev) : budget(ev, ev.tier || 'S')).items.map(function (i) { return i.id; }); } catch (e) { return t; }
    if (t === 'Order decor, balloons and florals') { var parts = ['decor'].concat(have.indexOf('balloons') >= 0 ? ['balloons'] : []).concat(have.indexOf('florals') >= 0 ? ['florals'] : []); return 'Order ' + (parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0]); }
    if (t === 'Book the venue or reserve private dining' && ev.setting === 'outdoor') return 'Reserve the space or get the park permit';
    if (t === 'Plan outfits and book hair and makeup') return have.indexOf('hairMakeup') >= 0 ? t : 'Plan outfits';
    if (t === 'Book key vendors (food, photos, music)') { var k = [have.indexOf('catering') >= 0 ? 'food' : null, have.indexOf('photographer') >= 0 ? 'photos' : null, (have.indexOf('dj') >= 0 || have.indexOf('liveMusic') >= 0) ? 'music' : null].filter(Boolean); return k.length ? 'Book key vendors (' + k.join(', ') + ')' : 'Book your vendors'; }
    return t;
  }
  function checklist(ev, today) {
    var date = ev.date || ev.dateFrom ? new Date((ev.date || ev.dateFrom) + 'T12:00:00') : null;   /* with a range, plan for the earliest date */
    today = today || new Date();
    var st = ev.setting || 'indoor';
    var bigEvent = ['wedding', 'gala', 'quince'].indexOf(ev.type) >= 0;
    return D.CHECKLIST.filter(function (c) { return (!c.cu || c.cu === (culture(ev) && ev.culture)) && (!c.needs || musicOf(ev).indexOf(c.needs) >= 0) && !(bigEvent && /^Book the venue or reserve|^Book key vendors/.test(c.t)) && (!c.only || c.only.indexOf(ev.type) >= 0) && (!c.not || c.not.indexOf(st) < 0) && (!c.in || c.in.indexOf(st) >= 0) && (!c.minGuests || (ev.guests || 0) >= c.minGuests || ['wedding', 'gala', 'quince'].indexOf(ev.type) >= 0); }).map(function (c, i) {
      var due = date ? new Date(date.getTime() - c.w * 7 * 864e5) : null;
      /* A step whose usual lead time had already passed when the plan was made isn't "overdue": it's simply first. */
      var start = new Date((ev.created || today.toISOString().slice(0, 10)) + 'T00:00:00'); if (isNaN(start)) start = today;
      var soon = !!(due && due < start && c.w > 0); if (soon) due = start;
      var dueDay = due ? due.toISOString().slice(0, 10) : null, todayDay = today.toISOString().slice(0, 10);
      return { id: 'c' + i, text: fitStep(c.t, ev), due: dueDay, soon: soon && !(dueDay < todayDay), overdue: !!(dueDay && dueDay < todayDay && c.w > 0) };
    }).sort(function (a, b) { return a.due && b.due ? (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) : 0; });
  }

  function runOfShow(ev) {
    var t = typeOf(ev.type);
    var start = ev.time || '18:00';
    var parts = start.split(':'); var base = (+parts[0]) * 60 + (+parts[1] || 0);
    var hours = ev.hours || t.hours;
    var bill = ev.payer === 'own' ? 'Everyone settles their own check' : ev.payer === 'shared' ? 'Settle the bill and split it' : 'Settle the bill';
    var plan = (ev.setting === 'restaurant' || ev.setting === 'privateRoom')
      ? [[-30, 'Host arrives to set the table decor'], [0, 'Guests arrive and order drinks'], [20, 'Order food'], [Math.round(hours * 60 * 0.55), 'Toasts'], [Math.round(hours * 60 * 0.75), /birthday|milestone/.test(ev.type) ? 'Cake or dessert and the birthday song' : 'Dessert'], [hours * 60 - 10, bill], [hours * 60, 'Goodbyes and photos outside']]
      : culture(ev)
      ? [[-180, 'Vendors arrive and setup begins'], [-120, 'Hair and makeup finishing touches']].concat(culture(ev).moments.filter(function (m, i, all) { if (m[2]) return musicOf(ev).indexOf(m[2]) >= 0; return !(m[0] === 'end' && all.some(function (o) { return o[0] === 'end' && o[2] && musicOf(ev).indexOf(o[2]) >= 0; })); }).map(function (m) { return [m[0] === 'end' ? hours * 60 - 15 : m[0], m[1]]; }), [[hours * 60, 'Breakdown and cleanup']])
      : t.style === 'wedding'
      ? [[-180, 'Vendors arrive and setup begins'], [-120, 'Hair and makeup finishing touches'], [-30, 'Guests arrive'], [0, 'Ceremony'], [30, ev.alcohol === 'none' ? 'Welcome hour with mocktails and appetizers' : 'Cocktail hour'], [90, 'Grand entrance and dinner'], [150, 'Toasts and first dance'], [180, 'Cake cutting and dancing'], [hours * 60 - 15, 'Send-off'], [hours * 60, 'Breakdown and cleanup']]
      : (function () {
        var T = ev.type, H = hours * 60;
        var kidsParty = ev.kids && /birthday/.test(T);
        var moment = { birthday: kidsParty ? 'Cake and the birthday song' : 'Toast, cake and the birthday song', milestone: 'Toast, cake and the birthday song', 'baby-shower': 'Shower games', 'bridal-shower': 'Shower games', 'gender-reveal': 'The big reveal', graduation: 'Toast to the graduate', engagement: 'Toast to the couple', anniversary: 'Toasts to the couple', quince: 'Grand entrance and the waltz', holiday: 'Welcome toast', christmas: 'Toast and gift exchange', retirement: 'Toasts and a tribute to the retiree', 'kids-birthday': 'Cake and the birthday song', sweet16: 'Candle ceremony, cake and the birthday song', corporate: 'Welcome remarks and a toast', gala: 'Welcome remarks and program', bachelorette: 'Games and toasts', dinner: 'Toasts' }[T] || 'Toasts or the main moment';
        var cakeSep = !/birthday|milestone/.test(T);
        var has = function (id) { try { return budget(ev, ev.tier || 'S').items.some(function (i) { return i.id === id; }); } catch (e) { return false; } };
        var fun = kidsParty ? 'Games, activities and gifts' : /shower/.test(T) ? 'Gift opening' : T === 'gender-reveal' ? 'Photos and games' : (has('dj') || has('liveMusic')) ? (has('photoBooth') ? 'Dancing and photo booth' : 'Dancing') : has('photoBooth') ? 'Photo booth and mingling' : 'Mingling and photos';
        var p = [[-120, 'Setup begins and vendors arrive'], [-30, 'Host ready for photos'], [0, kidsParty ? 'Guests arrive, drinks and snacks' : ev.alcohol === 'none' ? 'Guests arrive, welcome drinks and mocktails' : 'Guests arrive, welcome drinks'], [45, ev.setting === 'home' && !has('catering') ? 'Food is out' : 'Food is served'], [Math.round(H * 0.5), moment]];
        if (cakeSep) p.push([Math.round(H * 0.65), 'Cake or dessert']);
        p.push([Math.round(H * 0.72), fun], [H, 'Goodbyes and favors'], [H + 30, 'Cleanup']);
        return p;
      })();
    return plan.map(function (p) {
      var m = Math.round((base + p[0]) / 5) * 5; m = ((m % 1440) + 1440) % 1440;
      var h = Math.floor(m / 60), mm = m % 60;
      var label = ((h + 11) % 12 + 1) + ':' + (mm < 10 ? '0' : '') + mm + (h < 12 ? ' AM' : ' PM');
      return { time: label, text: p[1] };
    });
  }

  /* ---------- Capacity (counted by individual places, including plus-ones) ---------- */
  function placesUsed(guests) {
    return (guests || []).filter(function (g) { return g.status !== 'declined' && g.status !== 'waitlist'; })
      .reduce(function (s, g) { return s + 1 + (g.plusOnes || 0); }, 0);
  }

  /* ---------- Concept matching from photo colors and words ---------- */
  function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function dist(a, b) { var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db); }
  var WORDS = {
    pink: ['pink', 'blush', 'rose', 'mauve'], gold: ['gold', 'champagne', 'glam', 'luxe'], black: ['black', 'noir'], white: ['white', 'minimal', 'clean'],
    green: ['green', 'greenery', 'botanical', 'sage', 'eucalyptus', 'olive', 'mint'], emerald: ['emerald', 'jewel tone', 'hunter green', 'forest green', 'enchanted forest'], holiday: ['holiday', 'christmas', 'winter', 'festive', 'december', 'new year'], boho: ['boho', 'pampas', 'bohemian', 'copper'], rustic: ['rustic', 'barn', 'wood', 'farm', 'western', 'cowboy', 'cowgirl', 'cozy'], neutral: ['neutral', 'nude', 'taupe', 'beige'],
    coastal: ['beach', 'coastal', 'ocean', 'nautical', 'blue', 'teal'], tropical: ['tropical', 'palm', 'island', 'luau'], disco: ['disco', 'sparkle', 'sequin', '70s', 'retro'],
    vintage: ['vintage', 'hollywood', 'gatsby', 'roaring', 'art deco'], pastel: ['pastel', 'whimsy', 'baby pink', 'baby blue', 'candy', 'rainbow', 'fairytale', 'whimsical'], purple: ['purple', 'lavender', 'plum', 'lilac', 'royal'],
    red: ['red', 'burgundy', 'wine'], ivory: ['ivory', 'cream', 'chandelier', 'ballroom'], classic: ['classic', 'timeless', 'black tie', 'formal', 'elegant', 'parisian'],
    lavender: ['lavender', 'lilac'], tea: ['tea party', 'high tea', 'afternoon tea'], dark: ['moody', 'dark', 'velvet'], outdoor: ['outdoor', 'backyard', 'park', 'garden'], romantic: ['romantic', 'love', 'romance', 'fairytale', 'parisian'], celestial: ['moon', 'stars', 'starry', 'celestial', 'galaxy', 'navy', 'midnight', 'twinkle'], silver: ['silver', 'metallic', 'chrome', 'wonderland', 'snow'], autumn: ['fall ', 'autumn', 'harvest', 'thanksgiving'],
    orange: ['orange', 'coral', 'citrus', 'tangerine', 'fuchsia', 'hot pink', 'magenta', 'neon', 'glow'], fiesta: ['fiesta', 'bougainvillea', 'cinco de mayo'], yellow: ['yellow', 'lemon', 'butter', 'sunshine', 'daisy', 'daisies', 'sunflower'],
    chinoiserie: ['chinoiserie', 'blue and white', 'porcelain', 'toile', 'blue willow', 'ginger jar'], tuscan: ['tuscan', 'tuscany', 'italian villa', 'olive grove'], amalfi: ['amalfi', 'positano', 'capri', 'mediterranean', 'italian summer'], peach: ['peach', 'apricot']
  };
  var COLOR_TAGS = ['emerald', 'orange', 'yellow', 'chinoiserie', 'peach', 'boho', 'rustic', 'disco', 'vintage', 'pink', 'gold', 'black', 'white', 'green', 'purple', 'red', 'ivory', 'coastal', 'lavender', 'celestial', 'silver', 'pastel', 'tropical'];
  function matchStyles(colors, text, liked) {
    text = ((text || '') + ' ' + (liked || []).join(' ')).toLowerCase().replace(/royal blue/g, 'cobalt blue');   /* royal blue is a blue, not a purple */
    /* The first color the host names breaks ties: "ivory and gold … florals" is ivory first. */
    var firstTag = null, firstAt = 1e9;
    COLOR_TAGS.forEach(function (tag) { (WORDS[tag] || []).forEach(function (w) { var at = text.indexOf(w); if (at >= 0 && at < firstAt) { firstAt = at; firstTag = tag; } }); });
    var scored = D.STYLES.map(function (s) {
      var score = 0;
      if (colors && colors.length) {
        var pal = s.palette.map(hexToRgb);
        colors.forEach(function (c) {
          var best = Math.min.apply(null, pal.map(function (p) { return dist(c, p); }));
          score += Math.max(0, 300 - best) / 300;
        });
        score = score / colors.length * 3;
      }
      var groups = 0;
      Object.keys(WORDS).forEach(function (tag) {
        /* Colors the host names count more than moods: "ivory and gold romantic" is an ivory and gold look first. */
        if (WORDS[tag].some(function (w) { return text.indexOf(w) >= 0; }) && s.tags.indexOf(tag) >= 0) { score += COLOR_TAGS.indexOf(tag) >= 0 ? 3 : 2; groups++; }
      });
      if (groups > 1) score += groups;
      if (firstTag && s.tags.indexOf(firstTag) >= 0) score += 1; /* matching several of the host's words beats matching one */
      s.tags.forEach(function (tag) { if (text.indexOf(tag) >= 0) score += 1; });
      return { style: s, score: score };
    }).sort(function (a, b) { return b.score - a.score; });
    return scored;
  }
  /* General dress code only (no colors or themes), from the kind of event, where it is and the time of day. */
  function dressCode(ev, tierId) {
    var t = ev.type, st = ev.setting || 'indoor', h = startHour(ev), night = h >= 17, day = h < 15;
    var said = ((ev.inspiration && ev.inspiration.text) || '').toLowerCase();
    if (/white tie/.test(said)) return 'White tie';
    if (/black[- ]tie optional/.test(said)) return 'Black tie optional';
    if (/black[- ]tie/.test(said)) return 'Black tie';
    if (ev.kids && /birthday/.test(t)) return 'Comfy party clothes for playing';
    if (t === 'wedding' && /rustic|boho|barn|backyard|casual|beach|simple/.test(said)) return day ? 'Garden party attire' : 'Semi-formal';
    if (t === 'graduation' && (st === 'home' || st === 'outdoor')) return 'Casual chic';
    if (t === 'wedding' || t === 'gala') return night ? (tierId === 'U' ? 'Black tie optional' : 'Formal') : 'Formal daytime attire';
    if (t === 'quince') return 'Formal';
    if (t === 'sweet16') return night ? 'Dressy party attire' : 'Dressy casual';
    if (t === 'corporate') return night ? 'Cocktail attire' : 'Business casual';
    if (t === 'bachelorette') return night ? 'Going-out attire' : 'Casual chic';
    if (t === 'graduation') return 'Business casual';
    if (st === 'restaurant' || st === 'privateRoom') return day ? 'Smart casual' : 'Dressy casual';
    if (st === 'home') return day ? 'Casual chic' : 'Smart casual';
    if (st === 'outdoor') return day ? 'Summer dresses and light fabrics' : 'Garden party attire';
    if (['bridal-shower', 'baby-shower', 'gender-reveal', 'brunch'].indexOf(t) >= 0) return 'Dressy casual';
    return night ? 'Cocktail attire' : 'Dressy casual';
  }
  var TYPE_TITLE = { brunch: 'Brunch', birthday: 'Birthday', milestone: 'Birthday', dinner: 'Dinner Party', 'bridal-shower': 'Bridal Shower', 'baby-shower': 'Baby Shower',
    'gender-reveal': 'Gender Reveal', bachelorette: 'Bachelorette', graduation: 'Graduation Party', engagement: 'Engagement Party', quince: 'Quincea\u00f1era', anniversary: 'Anniversary',
    holiday: 'Holiday Party', christmas: 'Christmas Party', retirement: 'Retirement Party', 'kids-birthday': 'Birthday', sweet16: 'Sweet 16', corporate: 'Corporate Event', wedding: 'Wedding', gala: 'Gala', other: 'Celebration' };
  /* A host who starts from one of our AI-generated inspiration photos gets that photo as a concept, built from what is in it. */
  function inspoOf(ev) { var id = ev && ev.inspiration && ev.inspiration.inspo; return id && root.EC_INSPO ? root.EC_INSPO.find(function (p) { return p.id === id; }) || null : null; }
  function inspoText(p) { return p ? 'Inspiration photo "' + p.name + '" (an AI-generated sample): ' + p.mood + ' In the photo: ' + p.decor.join('; ') + '. Colors: ' + p.shop + '.' : ''; }
  /* A photo made for one occasion, used for another, is renamed for the host's occasion: "Royal Red Quinceañera" for a wedding is "Royal Red Wedding". */
  var OCCASION_WORDS = /\s*(?:Quinceañera|Sweet 16|Grad Party|Graduation|Baby Shower|Bridal Shower|Shower|Gender Reveal|Reveal|Tea Party|Pool Party|Birthday|Christmas Dinner|Christmas|Luncheon|Brunch|Lunch|Dinner Party|Dinner|Supper|Party)\s*$/;
  function inspoName(p, type) {
    if (!type || p.types[0] === type) return p.name;
    var base = p.name, prev; do { prev = base; base = base.replace(OCCASION_WORDS, ''); } while (base !== prev && base);
    if (!base || base === p.name) return p.name;
    return base.replace(/\s*&\s*$/, '').replace(/\s+/g, ' ').trim() + ' ' + (TYPE_TITLE[type] || 'Celebration');
  }
  var KIDS_NO = ['disco-glam', 'modern-noir', 'moody-floral', 'old-hollywood'];
  var KIDS_BAD = /night ?club|\bclub\b|neon|strobe|bottle service|lounge|cocktail|\bbar\b|bartender|candle|candlelit|\bdark\b|noir|moody|velvet curtains|disco/i;
  /* Words that mean a children's party: an age under 13, a child, or a classic kids' theme. */
  var KIDS_TEXT = /\b([1-9]|1[0-2])(st|nd|rd|th)\b.*birthday|\b([1-9]|1[0-2])[- ]?(year|yr)s?[- ]old\b|\bturning ([1-9]|1[0-2])\b|for my (son|daughter|kids?|little one|toddler|grandson|granddaughter)\b|kids'? (party|birthday)|\bchildren\b|\b(unicorn|princess|dinosaur|dino|superhero|mermaid|paw patrol|bluey|first birthday|1st birthday)\b/i;
  function isKidsParty(ev) { return !!(ev && ((ev.kids && /birthday/.test(ev.type || '')) || ev.type === 'kids-birthday')); }
  function kidSafePhoto(p) { return p.types.indexOf('kids-birthday') >= 0 || (KIDS_NO.indexOf(p.style) < 0 && !KIDS_BAD.test(p.mood + ' ' + p.decor.join(' '))); }
  /* A photo made for one occasion, used for another: its words follow this event (a quinceañera's throne becomes the couple's). */
  var HONOREE = { wedding: 'the couple', engagement: 'the couple', anniversary: 'the couple', quince: 'the quincea\u00f1era', sweet16: 'the birthday girl', 'bridal-shower': 'the bride', bachelorette: 'the bride', 'baby-shower': 'the mom-to-be', 'gender-reveal': 'the parents-to-be', graduation: 'the graduate', retirement: 'the retiree', gala: 'the hosts', corporate: 'the hosts' };
  var OTHER_HONOREE = /\bthe (quincea(?:ñ|n)era|birthday girl|birthday boy|bride|bride-to-be|mom-to-be|graduate|couple|guest of honou?r)\b/gi;
  function forOccasion(t, ev, p) {
    if (!t || !ev || !ev.type || (p && p.types[0] === ev.type)) return t;
    var who = HONOREE[ev.type] || 'the guest of honor';
    return String(t).replace(OTHER_HONOREE, function (m) { return m.toLowerCase() === who ? m : who; }).replace(/\bquincea(?:ñ|n)era\b/gi, function (m) { return ev.type === 'quince' ? m : TYPE_TITLE[ev.type] || 'celebration'; });
  }
  function menuFor(p, ev) { return p.menu === 'quince' && ['quince', 'sweet16'].indexOf(ev.type) < 0 ? 'elegant' : p.menu === 'kids' && !isKidsParty(ev) ? 'party' : p.menu; }
  function inspoConcept(ev, p) {
    var s = D.STYLES.find(function (x) { return x.id === p.style; }) || D.STYLES[0], nm = inspoName(p, ev.type);
    var fo = function (t) { return forOccasion(t, ev, p); };
    return { id: s.id, inspo: p.id, img: 'img/inspo/' + p.id + '.jpg', name: nm, styleName: nm, palette: p.palette, mood: fo(p.mood), decor: p.decor.map(fo), shop: p.shop,
      dress: 'A standout look in ' + s.dress.charAt(0).toLowerCase() + s.dress.slice(1), menuStyle: menuFor(p, ev), music: s.music, fit: 'The look in the photo you chose',
      outline: ['Setting: ' + fo(p.decor[0]).toLowerCase(), 'Details: ' + fo(p.decor[1]).toLowerCase() + ', plus ' + fo(p.decor[2]).charAt(0).toLowerCase() + fo(p.decor[2]).slice(1), 'Moment: ' + fo(p.decor[3]).toLowerCase(), 'Dress code: ' + dressCode(ev).toLowerCase()] };
  }
  /* Colors the host typed herself win over the photo: the photo's look then comes second instead of first. */
  function hostNamedColors(ev) {
    var t = (((ev.inspiration && ev.inspiration.text) || '') + ' ' + ((ev.inspiration && ev.inspiration.vibes) || []).join(' ')).toLowerCase();
    return COLOR_TAGS.some(function (tag) { return (WORDS[tag] || []).some(function (w) { return t.indexOf(w) >= 0; }); }) || /\b(navy|teal|beige|taupe|mauve|brown|grey|gray|turquoise|mint|copper|bronze|rose gold)\b/.test(t);
  }
  /* Did the host name colors that are not in the chosen photo? Then her words lead. */
  function wordsDiffer(ev, p) {
    p = p || inspoOf(ev); if (!p) return false;
    var said = (((ev.inspiration && ev.inspiration.text) || '') + ' ' + ((ev.inspiration && ev.inspiration.vibes) || []).join(' ')).toLowerCase(), inPhoto = (p.shop + ' ' + p.mood + ' ' + p.name).toLowerCase();
    var has = function (w) { return new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(said); };
    return COLOR_TAGS.some(function (tag) { return (WORDS[tag] || []).some(function (w) { return has(w) && inPhoto.indexOf(w) < 0; }); }) || ['navy', 'teal', 'beige', 'taupe', 'mauve', 'brown', 'grey', 'gray', 'turquoise', 'mint', 'copper', 'bronze'].some(function (w) { return has(w) && inPhoto.indexOf(w) < 0; });
  }
  /* No drink names as a color or look name, ever. Each drink word becomes a fitting color or mood word. */
  var DRINK_SWAP = [['champagne', 'soft gold'], ['prosecco', 'sparkle'], ['mimosas?', 'citrus'], ['sangrias?', 'ruby'], ['margaritas?', 'lime'], ['rosé|rose wine', 'blush'], ['whiske?y', 'amber'], ['bourbon', 'amber'], ['cognac', 'amber'], ['brandy', 'amber'], ['negroni', 'amber'], ['merlot', 'deep red'], ['cabernet', 'deep red'], ['bordeaux', 'deep red'], ['burgundy wine', 'burgundy'], ['wine[- ]red', 'deep red'], ['wine', 'deep red'], ['martinis?', 'velvet'], ['cocktails?', 'evening'], ['bellinis?', 'peach'], ['spritz(?:es)?', 'sunny'], ['tequila', 'agave'], ['mezcal', 'agave'], ['sake', 'blossom'], ['beers?', 'garden'], ['vodka', 'crystal'], ['gin', 'botanical'], ['rum', 'island'], ['mojitos?', 'mint'], ['piña colada', 'pineapple']];
  var DRINK_THING = /(champagne|prosecco|wine|cocktail) (tower|toast|flutes?|bar|wall|cart|hour)|mimosa bar|bar cart|bartender/i;
  function caseLike(src, out, title) { return /^[A-Z][a-z\u00e0-\u00ff]/.test(src) ? (title ? out.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }) : out.charAt(0).toUpperCase() + out.slice(1)) : /^[A-Z]+$/.test(src) ? out.toUpperCase() : out; }
  function swapDrinks(t, keepThings, title) {
    t = String(t == null ? '' : t);
    DRINK_SWAP.forEach(function (d) {
      t = t.replace(new RegExp('(^|[^A-Za-z\\u00c0-\\u00ff])(' + d[0] + ')(?![A-Za-z\\u00c0-\\u00ff])', 'gi'), function (m, pre, w, at, all) { var st = at + pre.length; if (keepThings && DRINK_THING.test(all.slice(st, st + w.length + 12))) return m; return pre + caseLike(w, d[1], title); });
    });
    return t;
  }
  function noDrinkWords(t) { return swapDrinks(t, true); }
  var ALC_ANY = /champagne|prosecco|mimosa|sangria|margarita|rosé|whiske?y|bourbon|cognac|brandy|negroni|merlot|cabernet|\bwine\b|martini|cocktail|bellini|spritz|tequila|mezcal|\bsake\b|\bbeer\b|vodka|\bgin\b|\brum\b|mojito|bartender|open bar|\bbar cart\b|bottle service|happy hour|\bbooze\b|\btoast with\b/i;
  var HEX = /^#[0-9a-f]{6}$/i, MENUS_OK = /^(garden|modern|elegant|rustic|coastal|tropical|classic|sweet|party|gardenDinner|kids|holiday|quince)$/;
  function str(x, max) { return x == null || typeof x === 'object' ? '' : String(x).slice(0, max || 200).trim(); }
  function list(x, max) { return (Array.isArray(x) ? x : typeof x === 'string' && x ? [x] : []).map(function (v) { return str(v, 160); }).filter(Boolean).slice(0, max || 6); }
  /* Everything from the AI server is untrusted: keep only well-formed text and colors, never links or pictures, and follow the host's drinks and kids rules. */
  /* A look named for the wrong occasion ("Imperial Crimson Gala" for a wedding) gets this event's own word. */
  var OCCASION_WORDS = /\b(gala|wedding|birthday|bridal shower|baby shower|shower|quincea(?:ñ|n)era|quince|sweet (?:16|sixteen)|bachelorette|graduation|grad party|anniversary|retirement|brunch|engagement|reunion|fundraiser|prom)\b/gi;
  function fitOccasion(name, ev) {
    if (!name || !ev || !ev.type) return name;
    var own = TYPE_TITLE[ev.type] || '', ownL = own.toLowerCase();
    var out = name.replace(OCCASION_WORDS, function (w) { var l = w.toLowerCase(); if (!own || ownL.indexOf(l) >= 0 || l.indexOf(ownL) >= 0 || (ev.type === 'gala' && /gala|fundraiser/.test(l)) || (/birthday|milestone|sweet16|kids-birthday/.test(ev.type) && l === 'birthday')) return w; return own; });
    if (/^(wedding|engagement|gala|anniversary|quince)$/.test(ev.type) && own) out = out.replace(/\bparty\b/gi, own);   /* formal occasions are never called a party */
    return out.replace(new RegExp('(' + (own || 'x').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(\\s+\\1)+', 'i'), '$1');
  }
  /* For a look without its own photo: the closest labeled AI inspiration photo for this occasion (colors and style), never one already shown. */
  function similarPhoto(c, ev, avoid) {
    var list = (root.EC_INSPO || []).filter(function (p) { return (avoid || []).indexOf(p.id) < 0 && (!isKidsParty(ev) || kidSafePhoto(p)) && (isKidsParty(ev) || p.types.indexOf('kids-birthday') < 0 || p.types.length > 1); });
    var rgb = function (h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
    var dist = function (a, b) { var A = (a || []).slice(0, 4).map(rgb), B = (b || []).slice(0, 4).map(rgb); if (!A.length || !B.length) return 999; return A.reduce(function (t, x) { return t + Math.min.apply(null, B.map(function (y) { return Math.sqrt((x[0] - y[0]) * (x[0] - y[0]) + (x[1] - y[1]) * (x[1] - y[1]) + (x[2] - y[2]) * (x[2] - y[2])); })); }, 0) / A.length; };
    var best = null, bs = 1e9;
    list.forEach(function (p) { var sc = dist(c.palette, p.palette) - (p.types.indexOf(ev.type) >= 0 ? 60 : 0) - (p.style && c.id && (c.id === p.style || c.id === 'ai-' + p.style) ? 40 : 0); if (sc < bs) { bs = sc; best = p; } });
    return best;
  }
  function cleanConcept(c, i, ev) {
    if (!c || typeof c !== 'object') return null;
    var lib = D.STYLES[(i || 0) % D.STYLES.length];
    var none = ev && ev.alcohol === 'none', kid = isKidsParty(ev);
    var name = fitOccasion(swapDrinks(str(c.name, 60) || str(c.styleName, 60), false, true), ev), styleName = fitOccasion(swapDrinks(str(c.styleName, 60) || name, false, true), ev);
    if (!name) return null;
    var pal = (Array.isArray(c.palette) ? c.palette : []).filter(function (h) { return typeof h === 'string' && HEX.test(h); }).slice(0, 5);
    var keepText = function (t) { return !(none && ALC_ANY.test(t)) && !(kid && KIDS_BAD.test(t)); };
    var tidy = function (t) { return none ? swapDrinks(t) : noDrinkWords(t); };
    var out = {
      id: 'ai-' + (str(c.id, 40).replace(/[^a-z0-9-]/gi, '').toLowerCase() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
      name: name, styleName: styleName, palette: pal.length >= 3 ? pal : lib.palette.slice(),
      mood: tidy(str(c.mood, 220)), decor: list(c.decor, 4).filter(keepText).map(tidy), dress: tidy(str(c.dress, 160)),
      menuStyle: MENUS_OK.test(str(c.menuStyle, 20)) ? str(c.menuStyle, 20) : 'party', music: str(c.music, 40) || 'pop feel-good', fit: str(c.fit, 60),
      outline: list(c.outline, 4).filter(keepText).map(tidy),
      pieces: (Array.isArray(c.pieces) ? c.pieces : []).filter(function (x) { return x && typeof x === 'object'; }).map(function (x) {
        return { item: tidy(str(x.item || x.name, 80)), search: tidy(str(x.search || x.q, 80)), hire: /^(florals|balloons|cake|decor|rentals|lighting|catering)$/.test(x.hire) ? x.hire : '' };
      }).filter(function (x) { return x.item && keepText(x.item + ' ' + x.search); }).slice(0, 8)
    };
    while (out.decor.length < 3) out.decor.push(lib.decor[out.decor.length]);
    if (kid && (KIDS_BAD.test(name + ' ' + out.mood) || KIDS_NO.indexOf(str(c.id, 40)) >= 0)) return null;   /* never a nightclub or moody look at a child's party */
    if (none && ALC_ANY.test(out.mood)) out.mood = swapDrinks(out.mood);
    return out;
  }
  var STOP = { the: 1, and: 1, a: 1, of: 1, with: 1, party: 1, shower: 1, birthday: 1, celebration: 1, '&': 1 };
  function words(n) { return String(n || '').toLowerCase().replace(/[^a-zà-ÿ ]/g, ' ').split(/\s+/).filter(function (w) { return w && !STOP[w]; }); }
  function sameLook(a, b) { a = String(a || ''); b = String(b || ''); var A = words(a), B = words(b); if (!A.length || !B.length) return false; var hit = A.filter(function (w) { return B.indexOf(w) >= 0; }).length; return hit >= Math.min(2, A.length, B.length) || a.toLowerCase() === b.toLowerCase(); }
  /* Always three different looks: drop repeats (by name or by look), anything already shown, and top up from the style library. */
  function threeDifferent(list, extra, avoid) {
    var out = [];
    list.concat(extra || []).forEach(function (c) {
      if (!c || !c.name || out.length >= 3) return;
      if ((avoid || []).some(function (a) { return a && ((a.name && sameLook(a.name, c.name)) || (a.style && a.style === c.id) || (a.id && a.id === c.id)); })) return;
      if (out.some(function (o) { return sameLook(o.name, c.name) || (o.id === c.id && !o.inspo && !c.inspo); })) return;
      out.push(c);
    });
    return out;
  }
  /* ev.seenLooks: everything the host was already shown, so "three different concepts" never repeats one. */
  function withInspo(ev, list, skip, extra) {
    var ai = (Array.isArray(list) ? list : []).map(function (c, i) { return c && c.inspo && !c.img ? c : cleanConcept(c, i, ev); }).filter(Boolean);
    var kid = isKidsParty(ev);
    extra = (extra || []).filter(function (c) { return !(kid && (KIDS_NO.indexOf(c.id) >= 0 || KIDS_BAD.test(c.name + ' ' + c.mood))); });
    var avoid = (ev.seenLooks || []).map(function (n) { return { name: n }; }).concat((skip || []).map(function (id) { return { id: id }; }));
    var p = inspoOf(ev);
    if (p) avoid.push({ name: inspoName(p, ev.type), style: p.style }, { name: p.name });
    var useP = p && !(skip && skip.length) && (!kid || kidSafePhoto(p));
    var rest = threeDifferent(ai, extra, avoid);
    if (!useP) { var k = 0; return rest.map(function (c, i) { c.fit = skip && skip.length ? (i < 2 ? 'Another idea' : 'A fresh direction') : (i === 0 ? (c.fit && /closest/i.test(c.fit) ? c.fit : 'Closest match to your inspiration') : k++ ? 'A fresh direction' : 'A close alternative'); return c; }); }
    var pc = inspoConcept(ev, p), at = wordsDiffer(ev, p) ? 1 : 0;
    rest = rest.slice(0, 2); rest.splice(Math.min(at, rest.length), 0, pc);
    var n = 0;
    return rest.slice(0, 3).map(function (c, i) { if (c.inspo) return c; if (i === 0 && at === 1) c.fit = 'Closest match to your words'; else c.fit = n++ ? 'A fresh direction' : 'A close alternative'; return c; });
  }
  function concepts(ev, colors, text, liked, skip, count) {
    skip = skip || [];
    /* Children's parties never get nightclub or black-tie looks. */
    var kidsNo = isKidsParty(ev) || (/birthday|party|bday/i.test(ev.type || '') && KIDS_TEXT.test(text || '')) ? KIDS_NO : [];
    var kidsParty = kidsNo.length > 0;
    var ranked = matchStyles(colors, text, liked).filter(function (r) { return skip.indexOf(r.style.id) < 0 && kidsNo.indexOf(r.style.id) < 0 && (kidsParty || !r.style.kidsOnly); });
    var kidBoost = function (r) { return r.score + (r.style.kidsOnly ? 1.5 : ['pastel-whimsy', 'tropical-glam'].indexOf(r.style.id) >= 0 ? 1 : 0); };
    if (kidsParty) ranked.sort(function (a, b) { return kidBoost(b) - kidBoost(a); });   /* a named theme comes first at a kids' party */
    var t = typeOf(ev.type);
    return ranked.slice(0, count || 3).map(function (r, i) {
      var s = r.style;
      var name = s.name + ' ' + (TYPE_TITLE[ev.type] || 'Celebration');
      return {
        id: s.id, name: name, styleName: s.name, palette: s.palette, mood: s.mood, decor: s.decor, dress: 'A standout look in ' + s.dress.charAt(0).toLowerCase() + s.dress.slice(1),
        menuStyle: s.menu, music: s.music, fit: skip.length ? (i === 0 ? 'Another idea' : (i === 1 ? 'Another idea' : 'A fresh direction')) : (i === 0 ? 'Closest match to your inspiration' : (i === 1 ? 'A close alternative' : 'A fresh direction')),
        outline: [
          'Setting: ' + s.decor[0].toLowerCase(),
          'Details: ' + s.decor[1].toLowerCase() + ', plus ' + s.decor[2].charAt(0).toLowerCase() + s.decor[2].slice(1),
          'Moment: ' + s.decor[3].toLowerCase(),
          'Dress code: ' + dressCode(ev).toLowerCase()
        ]
      };
    });
  }

  /* ---------- Get this look: the exact pieces to buy or hire ----------
     Order: what the host asked for in her own words, what she marked in her photos, then the pieces in the chosen photo or look. */
  var PIECE_WORDS = [
    [/balloon (arch|garland|wall|cloud)|balloons/, 'Balloon $1', '', 'balloons', 'Balloon garland'], [/neon sign/, 'Custom neon sign', 'custom neon sign', ''], [/disco ball|mirror ball/, 'Disco balls', 'disco ball set', ''],
    [/throne/, 'Throne chair for the guest of honor', '', 'rentals'], [/flower wall|floral wall/, 'Flower wall', '', 'decor'], [/(string|fairy|twinkle|bistro) lights/, 'String lights', 'outdoor string lights', ''],
    [/lanterns?/, 'Lanterns', 'candle lanterns set', ''], [/chandeliers?/, 'Chandeliers', '', 'lighting'], [/uplighting/, 'Uplighting', '', 'lighting'], [/photo ?booth/, 'Photo booth', '', 'photoBooth'],
    [/backdrop/, 'Photo backdrop', '', 'decor'], [/drap(e|es|ing)\b/, 'Draping', '', 'decor'], [/dessert table|candy (bar|table)/, 'Dessert table', '', 'cake'], [/macarons?/, 'Macaron tower', '', 'cake'],
    [/\bcakes?\b/, 'Custom cake', '', 'cake'], [/grazing (table|board)|charcuterie/, 'Grazing table', '', 'catering'], [/tea ?cups|tea party|high tea|tea set/, 'Teacups and saucers', 'floral teacups set', ''],
    [/\bbows?\b/, 'Chair bows', 'satin chair sash bows', 'C'], [/pampas/, 'Pampas grass', 'pampas grass bouquet', ''], [/monogram|initials/, 'Monogram sign', 'custom monogram sign', ''],
    [/confetti/, 'Table confetti', 'table confetti', 'C'], [/donut wall/, 'Donut wall', 'donut wall stand', ''], [/sparklers?/, 'Sparklers for the send-off', 'wedding sparklers', ''],
    [/dance floor/, 'Dance floor', '', 'rentals'], [/lounge/, 'Lounge furniture', '', 'rentals'], [/\btent\b/, 'Tent', '', 'rentals'],
    [/(velvet|chiavari|ghost|cross-back|cane-back|cane|wishbone) chairs?/, '$1 chairs', '', 'rentals'], [/chargers?/, 'Charger plates', 'charger plates', 'C'], [/runners?/, 'Table runners', 'table runner', 'C'],
    [/tablecloths?|\blinens\b/, 'Tablecloths', 'tablecloth', 'C'], [/napkins/, 'Napkins', 'linen napkins', 'C'], [/candles?|candlelit|candlelight/, 'Candles', 'pillar candles set', 'C'],
    [/pi[ñn]ata/, 'Piñata', 'custom pinata', ''], [/bounce house/, 'Bounce house', '', 'kids'], [/face paint/, 'Face painter', '', 'kids'], [/mariachi/, 'Mariachi band', '', 'liveMusic'],
    [/grad(uation)? cap/, 'Graduation cap decor', 'graduation cap centerpiece', ''], [/dinosaurs?|\bdino\b/, 'Dinosaur decorations', 'dinosaur party decorations', ''], [/mermaids?/, 'Mermaid decorations', 'mermaid party decorations', ''],
    [/unicorns?/, 'Unicorn decorations', 'unicorn party decorations', ''], [/superhero/, 'Superhero decorations', 'superhero party decorations', ''], [/butterfl(y|ies)/, 'Butterfly decorations', 'butterfly party decorations', ''],
    [/\bmoon\b|\bstars\b|celestial/, 'Moon and star decorations', 'gold moon and star hanging decorations', ''], [/rainbow/, 'Rainbow decorations', 'rainbow party decorations', ''], [/lemons?\b/, 'Lemon accents', 'faux lemons decor', ''],
    [/(peon(?:y|ies)|hydrangeas?|garden roses|roses|orchids?|tulips|dahlias?|ranunculus|daisies|sunflowers?|wildflowers|lilies|magnolias?|calla lilies|baby'?s breath)/, 'Arrangements with $1', '', 'florals'],
    [/\b(flowers|florals|floral)\b/, 'Flower arrangements', '', 'florals']
  ];
  var PIECE_COLORS = ['dusty blue', 'hot pink', 'rose gold', 'blush', 'pink', 'gold', 'silver', 'black', 'white', 'ivory', 'cream', 'sage', 'emerald', 'green', 'navy', 'royal blue', 'blue', 'lavender', 'lilac', 'purple', 'plum', 'burgundy', 'red', 'orange', 'coral', 'yellow', 'peach', 'terracotta', 'taupe', 'mauve', 'teal'];
  var LOVE_PIECES = { Florals: ['Flowers like the ones in your photo', '', 'florals'], Cake: ['A cake like the one in your photo', '', 'cake'], Balloons: ['Balloons like the ones in your photo', '', 'balloons'], Backdrop: ['A backdrop like the one in your photo', '', 'decor'], Lighting: ['Lighting like your photo', '', 'lighting'], Signage: ['Signs like the ones in your photo', 'custom event sign', ''], 'Table setting': ['Table setting like your photo', '', 'rentals'], Food: ['Food like the spread in your photo', '', 'catering'] };
  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }
  function lookPieces(ev, c) {
    c = c || ev.concept || {};
    var said = (((ev.inspiration && ev.inspiration.text) || '') + ' ' + ((ev.inspiration && ev.inspiration.vibes) || []).join(' ')).toLowerCase();
    var color = null, at = 1e9; PIECE_COLORS.forEach(function (w) { var i = said.search(new RegExp('\\b' + w + '\\b')); if (i >= 0 && i < at) { at = i; color = w; } });
    var out = [], names = {}, hired = {};
    function add(name, q, hire, why) {
      var key = name.toLowerCase(); if (names[key]) return; if (hire && !q) { if (hired[hire]) return; hired[hire] = 1; }
      names[key] = 1; out.push({ name: name, q: q, hire: hire && hire !== 'C' ? hire : '', why: why });
    }
    var kid = ev.kids && /birthday/.test(ev.type || '');
    PIECE_WORDS.forEach(function (r) {
      var m = said.match(r[0]); if (!m) return;
      if (kid && /candle/i.test(r[1])) return;
      if (kid && /lantern/i.test(r[1])) { add('Paper lanterns', 'paper lanterns colorful', '', 'asked'); return; }
      var name = r[4] && !m[1] ? r[4] : r[1].replace('$1', m[1] || ''), q = r[2];
      /* The color right before the word wins ("gold chargers" in a navy party), then the host's main color. Candles default to ivory. */
      var near = null, win = said.slice(Math.max(0, m.index - 12), m.index); PIECE_COLORS.forEach(function (w) { var re = new RegExp('\\b' + w + '\\b', 'g'), mm, i = -1; while ((mm = re.exec(win))) i = mm.index; var e = i + w.length; if (i >= 0 && (!near || e > near[1] || (e === near[1] && w.length > near[0].length))) near = [w, e]; });
      var col = near ? near[0] : /candle/i.test(r[1]) ? 'ivory' : color;
      if (r[3] === 'C' && col) { name = cap(col) + ' ' + name.charAt(0).toLowerCase() + name.slice(1); q = col + ' ' + q; }
      add(cap(name), q, r[3], 'asked');
    });
    (ev.inspiration && ev.inspiration.photos || []).forEach(function (p) { (p.loves || []).forEach(function (l) { var x = LOVE_PIECES[l.label]; if (x) add(x[0], x[1], x[2], 'loved'); }); });
    var list = c.pieces && c.pieces.length ? c.pieces.map(function (x) { return [x.name || x.item, x.q || x.search || '', x.hire && x.hire !== 'none' ? x.hire : '']; })
      : c.inspo && root.EC_INSPO ? (function () { var ph = root.EC_INSPO.find(function (p) { return p.id === c.inspo; }) || { pieces: [], types: [] }; return (ph.pieces || []).map(function (x) { return [ev.type === 'wedding' && /throne/i.test(x.name) && ph.types[0] !== 'wedding' ? 'Sweetheart chairs for the couple' : forOccasion(x.name, ev, ph), x.q, x.hire]; }); })()
      : (D.STYLE_PIECES || {})[c.id] || [];
    list.forEach(function (x) { if (x[0]) add(x[0], x[1], x[2], c.inspo ? 'photo' : c.pieces ? 'ai' : 'look'); });
    return out;
  }

  function money(n) { return (CUR === 'CAD' ? 'CA$' : '$') + Math.round(n).toLocaleString('en-US'); }
  function moneyIn(n, city) { return (countryOf(city).currency === 'CAD' ? 'CA$' : '$') + Math.round(n).toLocaleString('en-US'); }

  root.EC_ENGINE = {
    forOccasion: forOccasion,
    similarPhoto: similarPhoto, fitOccasion: fitOccasion,
    KIDS_TEXT: KIDS_TEXT,
    passFor: passFor, upgradeCost: upgradeCost, categoriesFor: categoriesFor, budget: budget, allBudgets: allBudgets,
    prosCons: prosCons, guardian: guardian, quantities: quantities, checklist: checklist, runOfShow: runOfShow,
    placesUsed: placesUsed, startHour: startHour, concepts: concepts, inspoOf: inspoOf, inspoName: inspoName, wordsDiffer: wordsDiffer, kidSafePhoto: kidSafePhoto, swapDrinks: swapDrinks, lookPieces: lookPieces, inspoText: inspoText, withInspo: withInspo, hostNamedColors: hostNamedColors, lc: lc, dressCode: dressCode, budgetFit: budgetFit, matchStyles: matchStyles, money: money, typeOf: typeOf, countryOf: countryOf, useCountry: useCountry, currency: currency, moneyIn: moneyIn, culture: culture, musicOf: musicOf, typeName: typeName, MUSIC_CATS: MUSIC_CATS, cityOf: cityOf
  };
})(typeof window !== 'undefined' ? window : globalThis);
