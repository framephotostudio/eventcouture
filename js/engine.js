/* Event Couture planning engine: deterministic math only (no AI here).
   Budgets, pass pricing, quantities, timelines, capacity and concept matching. */
(function (root) {
  'use strict';
  var D = root.EC_DATA;

  function round2(n) { return Math.round(n * 100) / 100; }
  function roundTo(n, step) { return Math.round(n / step) * step; }
  function typeOf(id) { return D.EVENT_TYPES.find(function (t) { return t.id === id; }) || D.EVENT_TYPES[D.EVENT_TYPES.length - 1]; }
  function cityOf(name) { return D.CITIES.find(function (c) { return c.name === name; }) || D.CITIES[D.CITIES.length - 1]; }

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
  function categoriesFor(ev) {
    var t = typeOf(ev.type);
    if (ev.setting === 'restaurant' || ev.setting === 'privateRoom') {
      var rl = D.PROFILES[ev.setting].slice(); if (ev.kids && ev.setting === 'privateRoom') rl.push('kids');
      var rs = {};
      return rl.concat(ev.include || []).filter(function (c) { if (rs[c] || !D.CATEGORIES[c] || (ev.exclude || []).indexOf(c) >= 0) return false; rs[c] = 1; return true; });
    }
    var list = (D.PROFILES[t.style] || D.PROFILES.party).slice();
    if (ev.setting === 'outdoor') list = list.concat(['tent', 'restrooms', 'generator', 'permits']);
    if (ev.kids) list.push('kids');
    if (ev.type === 'wedding' && list.indexOf('officiant') < 0) list.push('officiant');
    if (ev.type !== 'wedding') list = list.filter(function (c) { return c !== 'officiant'; });
    if (ev.setting === 'home') list = list.filter(function (c) { return c !== 'venue' && c !== 'privateDining'; }).concat(t.style === 'dining' ? ['catering', 'rentals'] : []);
    var seen = {};
    return list.filter(function (c) { if (seen[c] || (ev.exclude || []).indexOf(c) >= 0) return false; seen[c] = 1; return true; });
  }

  function rules(ev) { return (D.SETTING_RULES && D.SETTING_RULES[ev.setting]) || {}; }
  function tiersFor(catId, ev) { var r = rules(ev).tiers; return (r && r[catId]) || D.CATEGORIES[catId].tier; }
  function isDaytime(ev) { var h = +String(ev.time || '18:00').split(':')[0]; return h < 15; }
  function lineItem(catId, ev, tier) {
    var c = D.CATEGORIES[catId];
    var t = typeOf(ev.type);
    var adj = D.ADJUST[ev.type] || {};
    var city = cityOf(ev.city);
    var guests = Math.max(1, ev.guests || t.defaultGuests);
    var hours = ev.hours || t.hours;
    var mult = (adj[catId] || 1) * city.index * tier.mult;
    var lo = 0, hi = 0;
    var fscale = Math.min(1.5, Math.max(0.4, Math.sqrt(guests / 50)));
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
    var mealNote = '';
    if (c.meal && isDaytime(ev)) { lo *= 0.8; hi *= 0.8; mealNote = ', lunch or brunch prices'; }
    var extras = [];
    if (c.service) extras.push({ label: 'Service charge (20%)', rate: D.SERVICE });
    if (c.taxable) extras.push({ label: 'Sales tax (' + city.tax + '%)', rate: city.tax / 100 });
    if (c.tip) extras.push({ label: 'Tip (10%)', rate: D.TIP });
    if (c.gratuity) extras.push({ label: 'Tip or automatic group gratuity (20%)', rate: D.GRATUITY });
    var rate = extras.reduce(function (s, e) { return s + e.rate; }, 0);
    lo = lo * (1 + rate); hi = hi * (1 + rate);
    var ov = ev.overrides && ev.overrides[catId];
    if (ov && ov.amount > 0) { lo = hi = ov.amount; }
    return {
      id: catId, name: c.name, group: c.group,
      lo: roundTo(lo, 5), hi: roundTo(hi, 5), mid: roundTo((lo + hi) / 2, 5),
      extras: extras.map(function (e) { return e.label; }),
      label: ov ? ({ vendor: 'Vendor-published price', quote: 'Confirmed quote', booking: 'Confirmed booking' }[ov.source] || 'Your price') : 'Planning estimate',
      source: ov ? (ov.note || '') : (city.name + ' estimate, ' + guests + ' guests' + mealNote)
    };
  }

  function budget(ev, tierId) {
    if (tierId === 'F') return budgetFit(ev);
    var tier = D.TIERS.find(function (x) { return x.id === tierId; }) || D.TIERS[1];
    var cats = categoriesFor(ev).filter(function (id) { return tiersFor(id, ev).indexOf(tier.id) >= 0 || (ev.include || []).indexOf(id) >= 0; });
    var items = cats.map(function (id) { return lineItem(id, ev, tier); });
    var sum = function (k) { return items.reduce(function (s, i) { return s + i[k]; }, 0); };
    var lo = sum('lo'), hi = sum('hi'), mid = sum('mid');
    var contingency = roundTo(mid * D.CONTINGENCY, 5);
    return { tier: tier, items: items, lo: lo, hi: hi, mid: mid, contingency: contingency, total: mid + contingency, perGuest: Math.round((mid + contingency) / Math.max(1, ev.guests || 1)) };
  }

  function allBudgets(ev) { return D.TIERS.map(function (t) { return budget(ev, t.id); }); }

  /* Made for your budget: one plan that lands at the host's number, protecting must-haves. */
  var FIT_TIER = { id: 'F', name: 'Made for your budget', mult: 1, blurb: 'One plan built to your exact budget, with your must-haves protected.' };
  /* Never auto-dropped: venue, food, security and insurance (venues often require the last two). They can be trimmed, not removed. */
  var OPTIONAL = ['videographer', 'liveMusic', 'lighting', 'coordinator', 'photoBooth', 'mc', 'transport', 'invitations', 'parking', 'favors', 'entertainment', 'cleanup', 'hairMakeup', 'florals', 'balloons'];
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
      rows.filter(function (r) { return !r.pri && !r.fixed && OPTIONAL.indexOf(r.id) >= 0 && r.amt > 0; })
        .sort(function (a, b) { return b.amt - a.amt; })
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
    // money left over: upgrade priorities first, then everything toward the Ultra level
    if (total() < target * 0.995) {
      var addExtras = ev.setting !== 'restaurant';
      [rows.filter(function (r) { return r.pri && !r.fixed; }), rows.filter(function (r) { return !r.pri && !r.fixed && dropped.indexOf(r.id) < 0 && (addExtras || r.amt > 0); })].forEach(function (grp) {
        var gap = target - total(); if (gap <= 0) return;
        var up = grp.reduce(function (s, r) { return s + Math.max(0, r.ceil - r.amt); }, 0);
        var uk = Math.min(1, up ? gap / up : 0);
        grp.forEach(function (r) { r.amt += Math.max(0, r.ceil - r.amt) * uk; });
      });
    }
    var tierItems = U.items.concat(S.items.filter(function (i) { return ids.indexOf(i.id) < 0; }));
    var items = rows.filter(function (r) { return r.amt > 0; }).map(function (r) {
      var base = tierItems.find(function (i) { return i.id === r.id; });
      var mid = roundTo(r.amt, 5);
      return Object.assign({}, base, { mid: mid, lo: base.label === 'Planning estimate' ? roundTo(mid * 0.85, 5) : mid, hi: base.label === 'Planning estimate' ? roundTo(mid * 1.15, 5) : mid, priority: r.pri });
    });
    var sum = function (key) { return items.reduce(function (s, i) { return s + i[key]; }, 0); };
    var mid = sum('mid'); var contingency = roundTo(mid * D.CONTINGENCY, 5);
    var res = { tier: FIT_TIER, items: items, lo: sum('lo'), hi: sum('hi'), mid: mid, contingency: contingency, total: mid + contingency,
      perGuest: Math.round((mid + contingency) / Math.max(1, ev.guests || 1)), dropped: dropped };
    res.shortBy = ev.budget && res.total > ev.budget + 5 ? res.total - ev.budget : 0;
    return res;
  }

  /* Pros and cons for a budget version, derived from what it includes. */
  function prosCons(ev, b) {
    var ids = b.items.map(function (i) { return i.id; });
    var has = function (x) { return ids.indexOf(x) >= 0; };
    var pros = [], cons = [];
    if (b.tier.id === 'F') {
      var pri = (ev.priorities || []).map(function (id) { return D.CATEGORIES[id] ? D.CATEGORIES[id].name.toLowerCase() : id; });
      pros.push(b.shortBy ? 'As close to your budget as this guest count allows' : 'Lands at your budget, cushion included');
      if (pri.length) pros.push('Protects your must-haves: ' + pri.join(', '));
      pros.push('Every category sized to ' + (ev.city || 'your city'));
      if (b.dropped && b.dropped.length) cons.push('Leaves out ' + b.dropped.map(function (id) { return D.CATEGORIES[id].name.toLowerCase(); }).join(', '));
      if (b.shortBy) cons.push('Still about ' + money(b.shortBy) + ' over; fewer guests or a home venue would close the gap');
      if (!cons.length) cons.push('Less room to add extras later');
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
    var optional = ['videographer', 'liveMusic', 'lighting', 'coordinator', 'photoBooth', 'mc', 'transport', 'invitations', 'parking', 'favors', 'entertainment', 'security'];
    var swaps = b.items.filter(function (i) { return optional.indexOf(i.id) >= 0; })
      .sort(function (a, b2) { return b2.mid - a.mid; })
      .map(function (i) { return { kind: 'drop', id: i.id, text: 'Skip ' + i.name.toLowerCase(), save: Math.round(i.mid * (1 + D.CONTINGENCY)) }; });
    var florals = b.items.find(function (i) { return i.id === 'florals'; });
    if (florals) swaps.push({ kind: 'note', id: 'florals', text: 'Use seasonal flowers and greenery-heavy designs', save: Math.round(florals.mid * 0.35) });
    var bar = b.items.find(function (i) { return i.id === 'bar'; });
    if (bar) swaps.push({ kind: 'note', id: 'bar', text: 'Beer, wine and one signature cocktail instead of a full bar', save: Math.round(bar.mid * 0.3) });
    var drinks = b.items.find(function (i) { return i.id === 'restaurantDrinks'; });
    if (drinks) swaps.push({ kind: 'note', id: 'restaurantDrinks', text: 'One drink each, or guests buy their own drinks', save: Math.round(drinks.mid * 0.5) });
    var food = b.items.find(function (i) { return i.id === 'restaurantFood'; });
    if (food && !isDaytime(ev)) swaps.push({ kind: 'note', id: 'restaurantFood', text: 'Make it lunch or brunch instead of dinner', save: Math.round(food.mid * 0.2) });
    var hours = ev.hours || typeOf(ev.type).hours;
    if (hours > 3) swaps.push({ kind: 'hours', id: 'hours', text: 'Shorten the event by one hour', save: Math.round(b.items.filter(function (i) { return D.CATEGORIES[i.id].perHour; }).reduce(function (s, i) { return s + i.mid / hours; }, 0)) });
    if (b.tier.id !== 'L') swaps.push({ kind: 'tier', id: 'tier', text: 'Switch to the ' + (b.tier.id === 'U' ? 'Signature' : 'Luxe for Less') + ' version', save: 0 });
    swaps = swaps.filter(function (s) { return s.save > 0 || s.kind === 'tier'; }).slice(0, 6);
    return { over: over, swaps: swaps };
  }

  /* ---------- Quantities ---------- */
  function quantities(ev) {
    var g = Math.max(1, ev.expected || ev.guests || 1);
    var hours = ev.hours || typeOf(ev.type).hours;
    var tables = Math.ceil(g / 8);
    var drinks = g * (1 + hours);
    if (ev.setting === 'restaurant') return [
      { item: 'Reservation', qty: g, unit: 'seats', note: 'Book for everyone who said yes, plus the guest of honor' },
      { item: 'Cake or dessert', qty: Math.ceil(g * 1.1), unit: 'servings', note: 'Or order dessert from the menu and skip the cake-cutting fee' },
      { item: 'Candles', qty: 1, unit: 'set', note: 'Ask the restaurant before lighting anything' },
      { item: 'Small centerpieces', qty: Math.max(1, Math.ceil(g / 6)), unit: 'pieces', note: 'One for every six seats' },
      { item: 'Favors', qty: Math.ceil(g * 1.05), unit: 'favors', note: 'Optional; 5% extra' }
    ];
    return [
      { item: 'Drinks (all kinds)', qty: drinks, unit: 'servings', note: '2 in the first hour, then 1 per hour per guest' },
      { item: 'Wine', qty: Math.ceil(drinks * 0.4 / 5), unit: 'bottles', note: 'If 40% of drinks are wine; 5 glasses per bottle' },
      { item: 'Champagne for a toast', qty: Math.ceil(g / 6), unit: 'bottles', note: '6 toast pours per bottle' },
      { item: 'Ice', qty: Math.ceil(g * 1.5), unit: 'lb', note: '1.5 lb per guest; double it outdoors in summer' },
      { item: 'Appetizers', qty: g * (ev.mealServed === false ? 10 : 4), unit: 'pieces', note: ev.mealServed === false ? 'No full meal: 10 pieces per guest' : '4 pieces per guest before a meal' },
      { item: 'Cake or dessert', qty: Math.ceil(g * 1.1), unit: 'servings', note: '10% extra' },
      { item: 'Plates', qty: Math.ceil(g * 3 * 1.1), unit: 'plates', note: 'Appetizer, dinner and dessert, plus 10%' },
      { item: 'Napkins', qty: Math.ceil(g * 3), unit: 'napkins', note: '3 per guest' },
      { item: 'Chairs', qty: g, unit: 'chairs', note: 'One per guest' },
      { item: 'Round tables (seat 8)', qty: tables, unit: 'tables', note: 'Plus 2 to 3 for cake, gifts and food' },
      { item: 'Tablecloths', qty: tables + 3, unit: 'linens', note: 'Guest tables plus service tables' },
      { item: 'Favors', qty: Math.ceil(g * 1.05), unit: 'favors', note: '5% extra' }
    ];
  }

  /* ---------- Timeline ---------- */
  function checklist(ev, today) {
    var date = ev.date ? new Date(ev.date + 'T12:00:00') : null;
    today = today || new Date();
    var st = ev.setting || 'indoor';
    return D.CHECKLIST.filter(function (c) { return (!c.only || c.only.indexOf(ev.type) >= 0) && (!c.not || c.not.indexOf(st) < 0) && (!c.in || c.in.indexOf(st) >= 0); }).map(function (c, i) {
      var due = date ? new Date(date.getTime() - c.w * 7 * 864e5) : null;
      return { id: 'c' + i, text: c.t, due: due ? due.toISOString().slice(0, 10) : null, overdue: !!(due && due < today && c.w > 0) };
    });
  }

  function runOfShow(ev) {
    var t = typeOf(ev.type);
    var start = ev.time || '18:00';
    var parts = start.split(':'); var base = (+parts[0]) * 60 + (+parts[1] || 0);
    var hours = ev.hours || t.hours;
    var plan = ev.setting === 'restaurant'
      ? [[-30, 'Host arrives to set the table decor'], [0, 'Guests arrive and order drinks'], [20, 'Order food'], [Math.round(hours * 60 * 0.55), 'Toasts'], [Math.round(hours * 60 * 0.75), 'Cake or dessert and the birthday song'], [hours * 60 - 10, 'Pay the bill (separate checks or your split)'], [hours * 60, 'Goodbyes and photos outside']]
      : t.style === 'wedding'
      ? [[-180, 'Vendors arrive and setup begins'], [-120, 'Hair and makeup finishing touches'], [-30, 'Guests arrive'], [0, 'Ceremony'], [30, 'Cocktail hour'], [90, 'Grand entrance and dinner'], [150, 'Toasts and first dance'], [180, 'Cake cutting and dancing'], [hours * 60 - 15, 'Send-off'], [hours * 60, 'Breakdown and cleanup']]
      : [[-120, 'Setup begins and vendors arrive'], [-30, 'Host ready for photos'], [0, 'Guests arrive, welcome drinks'], [45, 'Food is served'], [Math.round(hours * 60 * 0.5), 'Toasts or the main moment'], [Math.round(hours * 60 * 0.65), 'Cake or dessert'], [Math.round(hours * 60 * 0.75), 'Games, dancing or photo booth'], [hours * 60, 'Goodbyes and favors'], [hours * 60 + 30, 'Cleanup']];
    return plan.map(function (p) {
      var m = base + p[0]; m = ((m % 1440) + 1440) % 1440;
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
    pink: ['pink', 'blush', 'rose'], gold: ['gold', 'champagne', 'glam'], black: ['black', 'noir'], white: ['white', 'minimal', 'clean'],
    green: ['green', 'garden', 'greenery', 'botanical'], boho: ['boho', 'pampas', 'bohemian'], rustic: ['rustic', 'barn', 'wood', 'farm'],
    coastal: ['beach', 'coastal', 'ocean', 'nautical', 'blue'], tropical: ['tropical', 'palm', 'island', 'luau'], disco: ['disco', 'sparkle', 'sequin', '70s'],
    vintage: ['vintage', 'hollywood', 'gatsby', 'roaring'], pastel: ['pastel', 'whimsy', 'baby', 'candy'], purple: ['purple', 'lavender', 'plum', 'lilac', 'royal'],
    red: ['red', 'burgundy', 'wine'], ivory: ['ivory', 'cream', 'chandelier', 'ballroom'], classic: ['classic', 'timeless', 'black tie', 'formal'],
    lavender: ['lavender', 'lilac'], tea: ['tea party', 'high tea', 'afternoon tea'], dark: ['moody', 'dark', 'velvet'], outdoor: ['outdoor', 'backyard', 'park', 'garden'], romantic: ['romantic', 'love', 'romance']
  };
  function matchStyles(colors, text, liked) {
    text = ((text || '') + ' ' + (liked || []).join(' ')).toLowerCase();
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
        if (WORDS[tag].some(function (w) { return text.indexOf(w) >= 0; }) && s.tags.indexOf(tag) >= 0) { score += 2; groups++; }
      });
      if (groups > 1) score += groups; /* matching several of the host's words beats matching one */
      s.tags.forEach(function (tag) { if (text.indexOf(tag) >= 0) score += 1; });
      return { style: s, score: score };
    }).sort(function (a, b) { return b.score - a.score; });
    return scored;
  }
  var TYPE_TITLE = { brunch: 'Brunch', birthday: 'Birthday', milestone: 'Birthday', dinner: 'Dinner Party', 'bridal-shower': 'Bridal Shower', 'baby-shower': 'Baby Shower',
    'gender-reveal': 'Gender Reveal', bachelorette: 'Bachelorette', graduation: 'Graduation Party', engagement: 'Engagement Party', quince: 'Quincea\u00f1era', anniversary: 'Anniversary',
    holiday: 'Holiday Party', wedding: 'Wedding', gala: 'Gala', other: 'Celebration' };
  function concepts(ev, colors, text, liked, skip) {
    skip = skip || [];
    var ranked = matchStyles(colors, text, liked).filter(function (r) { return skip.indexOf(r.style.id) < 0; });
    var t = typeOf(ev.type);
    return ranked.slice(0, 3).map(function (r, i) {
      var s = r.style;
      var name = s.name + ' ' + (TYPE_TITLE[ev.type] || 'Celebration');
      return {
        id: s.id, name: name, styleName: s.name, palette: s.palette, mood: s.mood, decor: s.decor, dress: s.dress,
        menuStyle: s.menu, music: s.music, fit: i === 0 ? 'Closest match to your inspiration' : (i === 1 ? 'A close alternative' : 'A fresh direction'),
        outline: [
          'Arrival: ' + s.decor[0].toLowerCase() + ' sets the tone at the entrance',
          'Tables: ' + s.decor[1].toLowerCase(),
          'Moment: ' + s.decor[3].toLowerCase(),
          'Dress code: ' + s.dress.toLowerCase()
        ]
      };
    });
  }

  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  root.EC_ENGINE = {
    passFor: passFor, upgradeCost: upgradeCost, categoriesFor: categoriesFor, budget: budget, allBudgets: allBudgets,
    prosCons: prosCons, guardian: guardian, quantities: quantities, checklist: checklist, runOfShow: runOfShow,
    placesUsed: placesUsed, concepts: concepts, budgetFit: budgetFit, matchStyles: matchStyles, money: money, typeOf: typeOf, cityOf: cityOf
  };
})(typeof window !== 'undefined' ? window : globalThis);
