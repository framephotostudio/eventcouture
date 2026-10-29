/* Event Couture: the app. Hash routes, local storage, every screen. */
(function () {
  'use strict';
  var D = window.EC_DATA, E = window.EC_ENGINE, CFG = window.EC_CONFIG || {};
  var money = E.money;
  function T(n, p) { try { (window.ecTrack || function () {})(n, p); } catch (e) {} }
  function band(n, cuts) { for (var i = 0; i < cuts.length; i++) if (n <= cuts[i]) return (i ? cuts[i - 1] + 1 : 0) + '-' + cuts[i]; return cuts[cuts.length - 1] + '+'; }
  var app = document.getElementById('app');

  /* ---------- small utilities ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function uid() { return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
  function sw(p) { return '<div class="swatch" aria-hidden="true">' + p.map(function (c) { return '<i style="background:' + esc(c) + '"></i>'; }).join('') + '</div>'; }
  /* Small palette dots: the photo carries the mood, the dots name the colors. */
  function dots(p, label) { p = Array.isArray(p) ? p.filter(function (c) { return /^#[0-9a-f]{3,8}$/i.test(c); }) : []; return '<span class="dots" role="img" aria-label="' + esc(label || 'Color palette') + '">' + p.slice(0, 5).map(function (c) { return '<i style="background:' + esc(c) + '"></i>'; }).join('') + '</span>'; }
  /* Curated inspiration photos (AI-generated samples). Matched by style and, where the scene is event-specific, by event type. */
  var IMG = 'img/events/', INSPO_IMG = 'img/inspo/';
  var PHOTOS = [
    { src: IMG + 'blush-tea.jpg', ai: true, styles: ['blush-romance', 'pastel-whimsy'], types: ['brunch', 'bridal-shower'], alt: 'Blush and ivory brunch table with tiered pastries, roses and gold-rimmed teacups' },
    { src: IMG + 'moon-shower.jpg', ai: true, styles: ['blush-romance', 'pastel-whimsy'], types: ['baby-shower', 'gender-reveal'], alt: 'Blush and gold baby shower dessert table with a moon cake, teddy bear and balloon garland' },
    { src: IMG + 'sage-garden-shower.jpg', ai: true, styles: ['champagne-garden'], types: ['baby-shower', 'gender-reveal'], alt: 'Garden baby shower with sage and ivory balloons, white roses and a long table under a pergola' },
    { src: IMG + 'plum-graduation.jpg', ai: true, styles: ['royal-purple', 'moody-floral'], types: ['graduation'], alt: 'Plum, ivory and gold graduation table with a cap-topped cake and cupcakes' },
    { src: IMG + 'plum-birthday.jpg', ai: true, styles: ['royal-purple', 'moody-floral'], types: ['birthday', 'milestone'], alt: 'Plum velvet lounge with a blush floral cake, candles and a plum and blush balloon arch' },
    { src: IMG + 'noir-skyline.jpg', ai: true, styles: ['modern-noir', 'old-hollywood'], types: ['birthday', 'milestone', 'bachelorette', 'holiday', 'christmas', 'retirement'], alt: 'Black and gold table at dusk with orchids, candles and a skyline view' },
    { src: IMG + 'ivory-ballroom.jpg', ai: true, styles: ['ivory-ballroom', 'minimal-white'], types: ['wedding', 'gala', 'quince', 'corporate', 'engagement', 'anniversary'], alt: 'Ivory and gold ballroom with a tiered cake, chandeliers and white rose centerpieces' },
    { src: 'img/hero.jpg', ai: true, styles: ['blush-romance'], types: ['wedding', 'engagement', 'anniversary', 'gala', 'quince'], alt: 'Candlelit table with blush and ivory roses, gold candlesticks and a tiered cake' }
  ];
  function photoFor(styleId, type) {
    /* Only show a photo when it fits both the look and the kind of event. A wedding scene is never shown for a brunch. */
    return PHOTOS.find(function (x) { return x.styles.indexOf(styleId) >= 0 && x.types.indexOf(type) >= 0; }) || null;
  }
  /* Server-made concepts have their own ids, so match them to the closest library style by color. */
  function nearestStyle(pal) {
    var best = null, bd = 1e9;
    D.STYLES.forEach(function (st) {
      var d = 0; pal.slice(0, 5).forEach(function (h) { var a = hexRgb(h), m = 1e9; st.palette.forEach(function (k) { var b = hexRgb(k); m = Math.min(m, Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])); }); d += m; });
      if (d < bd) { bd = d; best = st.id; }
    });
    return bd < 260 ? best : null;
  }
  function conceptPhoto(c, type) { return photoFor(c.id, type) || (c.palette ? photoFor(nearestStyle(c.palette), type) : null); }
  function eventPhoto(ev) {
    var up = ev.inspiration && ev.inspiration.photos && ev.inspiration.photos[0];
    if (up) return { src: up.src, alt: 'Your inspiration photo' };
    var ip = E.inspoOf(ev); if (ip) return { src: INSPO_IMG + ip.id + '.jpg', alt: ip.alt, ai: true };
    return ev.photo || null; /* sample plans only; we never generate or substitute pictures for a host's event */
  }
  /* At a restaurant only table-sized decor makes sense: no backdrops, arches or dessert tables. */
  var BIG_DECOR = /backdrop|arch|installation|garland|lounge|neon|cloud|tower|wall|dessert table|bar setup|signage|runway|hanging|marquee|dance floor|photo/i;
  /* Drinks follow the host's choice everywhere: no champagne towers or martinis at an alcohol-free event. */
  var ALC = /bartender|bottle service|ros\u00e9|whiske?y|martini|spritz|mimosa|\bwine\b|cocktail|sangria|margarita|champagne|prosecco|\bbeer\b|bourbon|whiskey|tequila|rum punch|bellini|negroni|old fashioned|bar setup|bar cart/i;
  var HARD = /martini|cocktail|margarita|bourbon|whiskey|tequila|negroni|old fashioned|rum punch/i;
  function drinkSafe(list, ev, kind) {
    if (!ev || !ev.alcohol || ev.alcohol === 'full') return list;
    var re = ev.alcohol === 'none' ? ALC : HARD;
    var out = (list || []).map(function (x) {
      if (!re.test(x)) return x;
      if (kind === 'decor' && /tower/i.test(x)) return ev.alcohol === 'none' ? (ev.kids && /birthday/.test(ev.type) ? 'Pink lemonade station with fun straws' : 'Sparkling cider tower welcome moment') : x;
      if (kind === 'decor' && /bar setup|bar cart/i.test(x)) return ev.alcohol === 'none' ? 'Lemonade and mocktail station' : 'Wine and beer station';
      return null;
    }).filter(Boolean);
    if (kind === 'menu' && out.length < (list || []).length) out.push(ev.alcohol === 'none' ? 'Signature mocktail and sparkling lemonade' : 'Wine and beer pairings');
    return out;
  }
  /* Wording that follows the occasion: names on the sign, no candles at a kids' party. */
  function occasionWords(list, ev) {
    if (!ev) return list;
    var couple = ['wedding', 'engagement', 'anniversary'].indexOf(ev.type) >= 0, formal = ['wedding', 'gala', 'anniversary'].indexOf(ev.type) >= 0;
    var kids = ev.kids && /birthday/.test(ev.type);
    return (list || []).map(function (x) {
      if (/neon sign/i.test(x)) return formal ? (couple ? 'Gold monogram with your initials lit on the dance floor' : 'Gold monogram lit on the dance floor') : couple ? 'Neon sign with your names' : x;
      if (kids && /candle|candelabra/i.test(x)) return 'Paper lanterns and fairy lights';
      if (/guest-of-honor chair/i.test(x)) return couple ? 'Throne-style chairs for the couple' : x;
      if (/guest of honor/.test(x) && couple) return x.replace(/the guest of honor\u2019s|the guest of honor's/g, 'the couple\u2019s');
      return x;
    });
  }
  function moodFor(c, ev) {
    var m = c.mood || ''; if (!ev) return m;
    var h = E.startHour(ev);
    if (h < 16) m = m.replace(/dramatic low light/i, 'bold contrast').replace(/candlelit tables/i, 'sunlit tables').replace(/candlelight/i, 'soft daylight').replace(/for a regal evening/i, 'for a regal celebration').replace(/soft twinkling light/i, 'soft shimmer');
    if (ev.kids && /birthday/.test(ev.type)) m = m.replace(/candlelit tables/i, 'bright tables').replace(/romantic glow/i, 'sweet glow');
    return m;
  }
  function decorFor(c, ev) {
    if (!ev || (ev.setting !== 'restaurant' && ev.setting !== 'privateRoom')) return occasionWords(drinkSafe(c.decor, ev, 'decor'), ev);
    var keep = (c.decor || []).filter(function (d) { return !BIG_DECOR.test(d); });
    return occasionWords(drinkSafe(keep.concat(['Small centerpieces and candles in ' + c.styleName + ' colors', 'Place cards and a cake topper to match']).slice(0, 4), ev, 'decor'), ev);
  }
  function outlineFor(c, ev) {
    if (!ev || (ev.setting !== 'restaurant' && ev.setting !== 'privateRoom')) return (c.outline || []).filter(function (o) { return !/^dress code/i.test(o); }).map(function (o) { var m = o.match(/^([^:]+:\s*)(.*)$/); if (!m) return o; var d = occasionWords(drinkSafe([m[2]], ev, 'decor'), ev); return d.length ? m[1] + d[0].charAt(0).toLowerCase() + d[0].slice(1) : null; }).filter(Boolean).slice(0, 3).concat(ev ? ['Dress code: ' + E.dressCode(ev).toLowerCase()] : []);
    var d = decorFor(c, ev);
    return ['Table: ' + d[0].toLowerCase(), 'Details: ' + d[1].toLowerCase(), (/birthday|milestone/.test(ev.type) ? 'Moment: cake brought out with candles and the birthday song' : 'Moment: ' + ({ 'blush-romance': 'a pink toast with petit fours', 'modern-noir': 'espresso and dark chocolate to finish', 'champagne-garden': 'a toast with berries and cream', 'boho-sunset': 'shared desserts passed family-style', 'coastal-linen': 'key lime pie and a toast', 'tropical-glam': 'a tropical dessert platter', 'old-hollywood': 'a toast with a classic cake', 'pastel-whimsy': 'macarons and a sweet surprise', 'ivory-ballroom': 'a toast with a small tiered cake', 'minimal-white': 'a single elegant dessert for everyone', 'disco-glam': 'a sparkler dessert moment', 'moody-floral': 'a candlelit dessert course', 'rustic-elegance': 'pie and coffee to finish', 'royal-purple': 'a toast to the guest of honor', 'midnight-celestial': 'a toast under the stars' }[c.id] || 'dessert and a toast')), 'Dress code: ' + E.dressCode(ev).toLowerCase()];
  }
  var HONOREE = { wedding: 'the couple', engagement: 'the couple', anniversary: 'the couple', 'bridal-shower': 'the bride-to-be', bachelorette: 'the bride-to-be', 'baby-shower': 'the parent-to-be', 'gender-reveal': 'the parents-to-be', birthday: 'the birthday guest of honor', milestone: 'the birthday guest of honor', graduation: 'the graduate', quince: 'the quincea\u00f1era', retirement: 'the retiree', 'kids-birthday': 'the birthday child', sweet16: 'the birthday girl or boy', corporate: 'the host' };
  /* Cost splitting only for events friends usually chip in on together, not weddings, galas or graduations. */
  function canSplit(ev) { if (ev.payer) return ev.payer === 'shared'; return ['brunch', 'birthday', 'milestone', 'dinner', 'bachelorette', 'bridal-shower', 'baby-shower', 'gender-reveal', 'holiday', 'christmas', 'retirement', 'kids-birthday', 'other'].indexOf(ev.type) >= 0; }
  function honoree(ev) { return HONOREE[ev.type] || 'the host'; }
  /* Guests get a general dress code; the person being celebrated gets the concept's specific look. */
  function dressBlock(ev, cls) {
    var look = ev.concept && ev.concept.dress ? ev.concept.dress : '';
    if (honoree(ev) === 'the host' && ev.concept) look = 'A standout look in the ' + ev.concept.styleName + ' colors';   /* no one is the guest of honor: a gentle idea for the host */
    if (ev.kids && /birthday/.test(ev.type) && ev.concept && !/explorer|ocean|cape/i.test(look)) look = 'A fun party outfit in the ' + ev.concept.styleName + ' colors';
    if (/^Black tie$|^White tie$/.test(E.dressCode(ev, ev.tier))) look = look.replace(/cocktail to black tie/i, 'black tie');
    return '<p class="' + (cls || '') + '"><b>Guest dress code:</b> ' + esc(E.dressCode(ev, ev.tier)) + '</p>' +
      (look ? '<p class="' + (cls || '') + '"><b>For ' + esc(honoree(ev)) + ':</b> ' + esc(look.charAt(0).toUpperCase() + look.slice(1)) + '</p>' : '');
  }
  function srcOf(u) { return (window.EC_EMBED && window.EC_EMBED[u]) || u; }
  function thumb(photo, cls) { return photo ? '<div class="thumb ' + (cls || '') + '"><img src="' + esc(srcOf(photo.src)) + '" alt="' + esc(photo.alt) + '" loading="lazy" onerror="this.parentNode.classList.add(\'noimg\');this.remove()">' + (photo.ai ? AI_TAG : '') + '</div>' : ''; }
  /* Every AI-made picture says so, so no one mistakes it for a real event we organized. */
  var AI_TAG = '<span class="ai-tag">AI-generated inspiration</span>';
  function fmtDate(d) { if (!d) return 'Date not set'; var x = new Date(d + 'T12:00:00'); return x.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }); }
  function shortDate(d) { if (!d) return ''; return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function shortDate(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  /* The date, or the range she's considering when she doesn't have one yet. */
  function whenText(ev) { return ev.date ? fmtDate(ev.date) + (ev.time ? ', ' + fmtTime(ev.time) : '') : ev.dateFrom ? 'Between ' + shortDate(ev.dateFrom) + ' and ' + shortDate(ev.dateTo || ev.dateFrom) : 'Date not set yet'; }
  function fmtTime(t) { if (!t) return ''; var p = t.split(':'); var h = +p[0]; return ((h + 11) % 12 + 1) + ':' + p[1] + (h < 12 ? ' AM' : ' PM'); }
  function plural(n, w) { return (typeof n === 'number' ? n.toLocaleString('en-US') : n) + ' ' + w + (n === 1 ? '' : 's'); }
  function clearToasts() { $$('.toast').forEach(function (t) { t.remove(); }); }
  function toast(msg) {
    clearToasts();
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  /* Undo: big plan changes show a message with an Undo button for 8 seconds. */
  var UNDO_KEYS = ['tier', 'exclude', 'include', 'overrides', 'hours', 'guests', 'expected', 'budget', 'alcohol', 'setting', 'city', 'shortlist', 'date', 'time', 'ros', 'settingOpen', 'culture', 'music'];
  function snap(ev) { var o = {}; UNDO_KEYS.forEach(function (k) { o[k] = ev[k] === undefined ? undefined : JSON.parse(JSON.stringify(ev[k])); }); return o; }
  function undoToast(ev, before, msg, rerender) {
    clearToasts();
    var t = document.createElement('div'); t.className = 'toast undo'; t.setAttribute('role', 'status');
    t.innerHTML = '<span>' + esc(msg) + '</span><button type="button">Undo</button>';
    document.body.appendChild(t);
    var timer = setTimeout(function () { t.remove(); }, 8000);
    t.querySelector('button').addEventListener('click', function () {
      clearTimeout(timer); t.remove();
      UNDO_KEYS.forEach(function (k) { if (before[k] === undefined) delete ev[k]; else ev[k] = before[k]; });
      if (!ev.sample) saveEvent(ev); rerender(); toast('Change undone');
    });
  }
  function sheet(html, mount) {
    var back = document.createElement('div'); back.className = 'sheet-back';
    back.innerHTML = '<div class="sheet fade" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(back);
    var opener = document.activeElement;   /* focus returns here when the pop-up closes */
    function close() { back.remove(); document.removeEventListener('keydown', onKey); if (opener && opener.focus && document.contains(opener)) try { opener.focus(); } catch (e) {} }
    function onKey(e) {
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab') return;   /* keyboard focus stays inside the pop-up */
      var f = Array.prototype.filter.call(back.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'), function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === a || !back.contains(document.activeElement))) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && (document.activeElement === z || !back.contains(document.activeElement))) { e.preventDefault(); a.focus(); }
    }
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', function (e) { if (e.target === back || e.target.closest('[data-close]')) close(); });
    var first = back.querySelector('input, select, textarea, button'); if (first) setTimeout(function () { first.focus(); }, 30);
    if (mount) mount(back.firstChild, close);
    return close;
  }
  function copyText(text, label) {
    function manual() { sheet('<h3>Copy</h3><textarea class="input" id="cpy" readonly style="min-height:90px">' + esc(text) + '</textarea><p class="muted small">Press and hold to select, then copy.</p><button class="btn block" data-close>Done</button>', function (el) { var t = $('#cpy', el); t.focus(); t.select(); }); }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { toast((label || 'Link') + ' copied'); }, manual);
    manual();
  }

  /* ---------- storage (this device; the server syncs across devices when connected) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('ec.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('ec.' + k, JSON.stringify(v)); return true; } catch (e) { toast('This device is out of storage space. Remove some photos and try again.'); return false; } }
  };
  function events() { return store.get('events', {}); }
  function getEvent(id) { return events()[id]; }
  function saveEvent(ev) { var all = events(); ev.updated = Date.now(); all[ev.id] = ev; return store.set('events', all); }
  function drafts() { return store.get('drafts', {}); }
  function saveDraft(d) { var all = drafts(); d.updated = Date.now(); all[d.id] = d; return store.set('drafts', all); }
  function removeDraft(id) { var all = drafts(); delete all[id]; store.set('drafts', all); }
  /* Paid extras stay hidden until each one has a working deliverable. Flip to true per item only when it really delivers. */
  var SELL_EXTRAS = false;
  function wallet() { return store.get('wallet', { credits: 0, ledger: [] }); }
  function saveWallet(w) { store.set('wallet', w); }
  function addLedger(entry) { var w = wallet(); entry.id = uid(); entry.at = new Date().toISOString(); w.ledger.unshift(entry); saveWallet(w); return entry; }

  /* ---------- photo processing: resize and pull the main colors ---------- */
  function readPhoto(file) {
    return new Promise(function (res, rej) {
      if (!/^image\//.test(file.type)) return rej(new Error('That file isn’t a photo. Choose a JPG, PNG or HEIC image.'));
      var url = URL.createObjectURL(file); var img = new Image();
      img.onload = function () {
        var max = 640, w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
        var x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
        var data = c.toDataURL('image/jpeg', 0.78);
        var t = document.createElement('canvas'); t.width = 48; t.height = 48; var tx = t.getContext('2d'); tx.drawImage(img, 0, 0, 48, 48);
        var px = tx.getImageData(0, 0, 48, 48).data, buckets = {};
        for (var i = 0; i < px.length; i += 4) {
          if (px[i + 3] < 128) continue;
          var key = (px[i] >> 5) + ',' + (px[i + 1] >> 5) + ',' + (px[i + 2] >> 5);
          var b = buckets[key] || (buckets[key] = { n: 0, r: 0, g: 0, b: 0 }); b.n++; b.r += px[i]; b.g += px[i + 1]; b.b += px[i + 2];
        }
        var cols = Object.keys(buckets).map(function (k) { var b = buckets[k]; return { n: b.n, c: [Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)] }; })
          .sort(function (a, b) { return b.n - a.n; });
        var picked = [];
        cols.forEach(function (o) { if (picked.length < 5 && picked.every(function (p) { return Math.abs(p[0] - o.c[0]) + Math.abs(p[1] - o.c[1]) + Math.abs(p[2] - o.c[2]) > 60; })) picked.push(o.c); });
        URL.revokeObjectURL(url);
        res({ id: uid(), src: data, colors: picked, loves: [] });
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('That photo couldn’t be opened. Try a screenshot of it instead.')); };
      img.src = url;
    });
  }
  function rgb(c) { return 'rgb(' + c.join(',') + ')'; }

  /* ---------- AI client: uses the server when connected, otherwise the on-device matcher ---------- */
  var AI = {
    live: !!CFG.apiUrl,
    concepts: function (ev, skip) {
      var colors = [].concat.apply([], (ev.inspiration.photos || []).map(function (p) { return p.colors; }));
      var loves = [].concat.apply([], (ev.inspiration.photos || []).map(function (p) { return p.loves.map(function (l) { return l.label; }); }));
      var vibes = ev.inspiration.vibes || [];
      VIBE_COLORS.forEach(function (c) { if (vibes.indexOf(c[0]) >= 0) { colors.push(hexRgb(c[1])); colors.push(hexRgb(c[1])); } });
      var text = (ev.inspiration.text || '') + ' ' + vibes.join(' ').toLowerCase() + ' ' + (ev.inspiration.links || []).join(' ');
      /* A chosen inspiration photo counts like the host's own photo; her own words come first, so they win. */
      var ip = E.inspoOf(ev); if (ip && !E.wordsDiffer(ev, ip)) { ip.palette.forEach(function (h) { colors.push(hexRgb(h)); }); text += ' ' + E.inspoText(ip).toLowerCase(); }
      var fin = function (list) { return E.withInspo(ev, list, skip, E.concepts(ev, colors, text, loves, (skip || []).concat((Array.isArray(list) ? list : []).map(function (c) { return c && c.id; })), 12)); };
      if (AI.live) {
        /* Started early on the review screen, so the concepts are usually ready when the host taps Create. */
        var key = JSON.stringify(slim(ev)).length + ':' + JSON.stringify([ev.inspiration.inspo || '', ev.type, ev.guests, ev.city, ev.budget, ev.setting, ev.time, ev.kids, ev.alcohol, ev.inspiration.text, ev.inspiration.vibes, (ev.inspiration.photos || []).length]);
        if (!(skip && skip.length) && AI.pre && AI.pre.key === key) return AI.pre.p;
        var library = function () { AI.source = 'library'; return fin(E.concepts(ev, colors, text, loves, skip)); };
        var call = fetch(CFG.apiUrl + '/api/concepts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event: slim(ev), skip: skip || [] }) })
          .then(function (r) { if (!r.ok) throw new Error('server'); return r.json(); })
          .then(function (j) { AI.source = 'ai'; return fin(j.concepts); });
        /* Never keep a host waiting: after 20 seconds the style library answers instead. */
        var p = Promise.race([call, new Promise(function (_, no) { setTimeout(function () { no(new Error('slow')); }, 20000); })]).catch(library);
        if (!(skip && skip.length)) AI.pre = { key: key, p: p };
        return p;
      }
      AI.source = 'library';
      return Promise.resolve(fin(E.concepts(ev, colors, text, loves, skip)));
    }
  };
  function slim(ev) { return { type: ev.type, guests: ev.guests, city: ev.city, budget: ev.budget, setting: ev.setting, time: ev.time, kids: !!ev.kids, alcohol: ev.alcohol || 'full', text: [ev.inspiration.text, E.inspoText(E.inspoOf(ev))].filter(Boolean).join(' '), vibes: ev.inspiration.vibes || [], links: ev.inspiration.links, photos: (ev.inspiration.photos || []).map(function (p) { return { image: p.src, loves: p.loves }; }) }; }

  /* ---------- layout ---------- */
  var ICON = {
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>',
    events: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>'
  };
  /* Sister site: Face Couture (already live). Simple link only; deeper tie-ins wait until its looks are approved. */
  function faceCard(ctx) {
    return '<a class="sister" href="https://facecouture.app/" target="_blank" rel="noopener"><img src="' + srcOf('img/brand/facecouture-icon-128.png') + '" alt="" width="53" height="44"><span><b>' + (ctx === 'look' ? 'Get photo-ready for the day' : 'Also from Always Luxe') + '</b><span class="muted small">Face Couture: couture beauty for every photo</span></span><span class="sister-go" aria-hidden="true">\u2192</span></a>';
  }
  var BRAND = { markGold: 'img/brand/logo-mark-gold-wide.png', mark: 'img/brand/ec-mark-128.png', logo: 'img/brand/logo-full.jpg', compact: 'img/brand/logo-compact.jpg', banner: 'img/brand/logo-banner-wide.jpg', letters: 'img/brand/logo-letters.png' };
  var lastHash = null;
  function frame(inner, opts) {
    opts = opts || {};
    var ribbon = CFG.preview && !CFG.app && !CFG.launchFree && !opts.noRibbon ? '<div class="preview-ribbon">Preview version: no real charges, and sharing works on this device only.</div>' : '';
    app.innerHTML = ribbon +
      '<header class="topbar"><a class="brand logo-mark" href="#/" aria-label="Event Couture by Always Luxe, home"><img src="' + srcOf(BRAND.markGold) + '" alt="Event Couture" width="563" height="210"><span class="by" aria-hidden="true">by Always Luxe</span></a>' +
      '<nav><a class="icon-btn" href="#/events" aria-label="My events" title="My events">' + ICON.events + '</a><a class="icon-btn" href="#/help" aria-label="Help" title="Help">' + ICON.help + '</a></nav></header>' +
      '<main id="main"' + (location.hash !== lastHash ? ' class="fade"' : '') + '>' + inner + '</main>' +
      '<footer class="site"><img src="' + srcOf(BRAND.mark) + '" alt="" loading="lazy"><nav><a href="#/help">Help</a>' + (CFG.app ? '' : '<a href="plan/">Planning guides</a>') + (CFG.app ? '' : '<a href="#/pricing">Pricing</a>') + '' + (CFG.app ? '' : '<a href="#/vendors">For vendors</a>') + '<a href="#/privacy">Privacy</a><a href="#/terms">Terms</a></nav><div class="name">Event Couture by Always Luxe</div>' + (CFG.supportEmail ? '<div class="small">Questions? <a href="mailto:' + esc(CFG.supportEmail) + '">' + esc(CFG.supportEmail) + '</a></div>' : '') + (CFG.app ? '' : '<div class="small">iPhone and Android app coming soon</div>') + '<div class="small">Also from Always Luxe: <a href="https://facecouture.app/" target="_blank" rel="noopener">Face Couture</a></div></footer>';
    var ld = document.getElementById('loader'); if (ld && !ld.classList.contains('done')) { ld.classList.add('done'); setTimeout(function () { if (ld.parentNode) ld.parentNode.removeChild(ld); }, 450); }
    if (location.hash !== lastHash) window.scrollTo(0, 0);
    var h2 = app.querySelector('main h1, main h2'); document.title = (h2 && location.hash.length > 2 ? h2.textContent.replace(/Rename$/, '').trim() + ' \u00b7 ' : '') + 'Event Couture by Always Luxe';
    lastHash = location.hash;
  }

  /* ---------- samples (prepared plans; free to explore) ---------- */
  var SAMPLES = [
    { title: 'Blush brunch for 10', type: 'brunch', guests: 10, city: 'Houston, TX', budget: 0, style: 'blush-romance', setting: 'restaurant', time: '11:00', hours: 2, img: 'blush-tea' },
    { title: 'Black and gold 30th', type: 'milestone', guests: 60, city: 'Dallas, TX', budget: 9000, style: 'modern-noir', setting: 'indoor', hours: 5, img: 'noir-skyline' },
    { title: 'Garden baby shower', type: 'baby-shower', guests: 30, city: 'Atlanta, GA', budget: 6000, style: 'champagne-garden', setting: 'outdoor', hours: 3, img: 'sage-garden-shower' },
    { title: 'Plum and blush birthday', type: 'birthday', guests: 40, city: 'Chicago, IL', budget: 8000, style: 'royal-purple', setting: 'indoor', hours: 4, img: 'plum-birthday' },
    { title: 'Ivory ballroom wedding', type: 'wedding', guests: 200, city: 'Los Angeles, CA', budget: 90000, style: 'ivory-ballroom', setting: 'indoor', hours: 6, img: 'ivory-ballroom' },
    { title: 'Moon and stars baby shower', type: 'baby-shower', guests: 35, city: 'Phoenix, AZ', budget: 5500, style: 'blush-romance', setting: 'indoor', hours: 3, img: 'moon-shower' },
    { title: 'Plum and gold graduation', type: 'graduation', guests: 75, city: 'Washington, DC', budget: 7500, style: 'royal-purple', setting: 'indoor', hours: 4, img: 'plum-graduation' }
  ];
  var FEATURED = [1, 2, 0]; /* varied: black and gold, sage garden, blush */
  function samplePhoto(s) { return PHOTOS.find(function (x) { return x.src === IMG + s.img + '.jpg'; }); }
  function sampleEvent(i) {
    var s = SAMPLES[i]; if (!s) return null; var st = D.STYLES.find(function (x) { return x.id === s.style; });
    var c = E.concepts({ type: s.type }, st.palette.map(function (h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }), st.tags.join(' '), []);
    var concept = c.find(function (x) { return x.id === s.style; }) || c[0];
    /* Each sample on its own Saturday, 2 to 5 months out, at a time that suits the event. */
    var d0 = new Date(Date.now() + (60 + i * 17) * 864e5); d0.setDate(d0.getDate() + ((6 - d0.getDay() + 7) % 7)); var d = d0.toISOString().slice(0, 10);
    return { id: 'sample-' + i, sample: true, name: s.title, type: s.type, guests: s.guests, expected: s.guests, city: s.city, budget: s.budget, setting: s.setting, hours: s.hours, date: d, time: s.time || defaultTime(s.type),
      inspiration: { photos: [], links: [], text: '' }, photo: samplePhoto(s), concepts: c, concept: concept, tier: s.budget ? 'F' : 'S', guestsList: [], polls: [], registry: { items: [], funds: [] }, gifts: [], album: [], cohosts: [], checklistDone: {}, split: { people: [] }, payLinks: {}, paid: { price: 0, max: 0 } };
  }

  /* ---------- routes ---------- */
  var draft = null, pendingDraft = null;
  function route() {
    var h = (location.hash || '#/').slice(1); var p = h.split('/').filter(Boolean); E.useCountry(null); SHOP_COUNTRY = null;   /* prices in a plan follow its country; everything else is US dollars */
    if (p[0] !== 'inspiration') inspoFor_ = null;   /* only the "choose a different photo" page swaps a photo on an existing draft */
    try {
      if (!p.length) return home();
      if (p[0] === 'start') { var sd = newDraft(), st = decodeURIComponent(p[1] || ''), sc = decodeURIComponent(p[2] || ''); var cuk = Object.keys(D.CULTURES).find(function (k) { return st === k + '-wedding' || st === k + '-engagement' && D.CULTURES[k].engagement; }); if (cuk) { sd.type = /-engagement$/.test(st) ? 'engagement' : 'wedding'; sd.culture = cuk; if ((window.EC_INSPO || []).some(function (q) { return q.id === 'culture-' + cuk; })) { sd.inspiration.inspo = 'culture-' + cuk; sd.typeChosen = true; } } else if (D.EVENT_TYPES.some(function (t) { return t.id === st; })) sd.type = st; if (sd.type) { var tt = E.typeOf(sd.type); sd.guests = sd.expected = cuk ? E.culture(sd).guests : tt.defaultGuests; sd.hours = cuk ? E.culture(sd).hours : tt.hours; sd.typeChosen = true; } if (D.CITIES.some(function (c) { return c.name === sc; })) { sd.city = sc; sd.country = E.countryOf(sc).id; } T('guide_start', { event_type: sd.type || 'none', city: sd.city || 'none' }); saveDraft(sd); location.replace('#/new/1/' + sd.id); return; }
      if (p[0] === 'new') return wizard(+(p[1] || 1), p[2]);
      if (p[0] === 'events') return myEvents();
      if (p[0] === 'inspiration') return inspirationPage(p[1] && p[1] !== 'all' ? decodeURIComponent(p[1]) : '', p[2]);
      if (p[0] === 'sample') { var se = sampleEvent(+p[1] || 0); return se ? planView(se, p[2] || 'overview') : notFound(); }
      if (p[0] === 'e' && p[2] === 'concepts') return conceptsView(p[1]);
      if (p[0] === 'e') { var ev = getEvent(p[1]); if (!ev) return frame('<div class="stack"><h2>This plan isn\u2019t here</h2><p class="muted">It may have been deleted, or it was made on another device.</p><div><a class="btn" href="#/events">Go to My events</a></div></div>'); return planView(ev, p[2] || 'overview'); }
      if (p[0] === 'g') return guestPage(p[1]);
      if (p[0] === 'vendors' && p[1] === 'requests') { if (CFG.app) { location.replace('#/'); return; } return vendorRequests(); }
      if (p[0] === 'vendors') { if (CFG.app) { location.replace('#/'); return; } return vendorJoin(); }
      if (p[0] === 'v' && p[1]) return vendorProfile(p[1]);
      if (p[0] === 'help') return help();
      if (p[0] === 'pricing') { if (CFG.app) { location.replace('#/'); return; } return pricing(); }
      if (p[0] === 'privacy') return legal('privacy');
      if (p[0] === 'terms') return legal('terms');
      notFound();
    } catch (err) { console.error(err); frame('<div class="stack"><h2>Something went wrong on this screen</h2><p class="muted">Your events are saved. Go back to <a href="#/events">My events</a> and open it again.</p></div>'); }
  }
  /* A tab left open keeps running the version it loaded. Every 10 minutes the site checks for a newer one,
     and the next time she moves to another page it reloads into it (her plans and drafts are saved on the device). */
  var BUILD = (function () { var m = /app\.js\?v=([a-z0-9]+)/.exec([].map.call(document.scripts, function (x) { return x.getAttribute('src') || ''; }).join(' ')); return m ? m[1] : ''; })();
  var NEWER = false, lastCheck = Date.now();
  function checkNewer() {
    if (CFG.app || !BUILD || NEWER || Date.now() - lastCheck < 6e5) return; lastCheck = Date.now();
    fetch('index.html?check=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) { var m = /app\.js\?v=([a-z0-9]+)/.exec(t); if (m && m[1] !== BUILD) NEWER = true; }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkNewer(); });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-fc]')) T('face_couture_click', { from: e.target.closest('.fc-finish') ? 'photos' : 'hair_and_makeup' }); });
  window.addEventListener('hashchange', function () { if (NEWER) { location.reload(); return; } checkNewer(); });
  window.addEventListener('hashchange', function () { clearToasts(); $$('.sheet-back').forEach(function (x) { x.remove(); }); route(); });   /* pop-ups never follow you to another page */
  function notFound() { frame('<div class="stack"><h2>This page doesn’t exist</h2><p class="muted">It may have been removed. <a href="#/">Go to the home page</a>.</p></div>'); }

  /* ---------- home ---------- */
  var HERO_IMG = 'img/hero.jpg';
  function sampleCard(s, i) {
    var stl = D.STYLES.find(function (x) { return x.id === s.style; }); var b = E.budget(s, 'S');
    return '<a class="sample" href="#/sample/' + i + '">' + thumb(samplePhoto(s)) + '<div class="in"><h3>' + esc(s.title) + '</h3>' + dots(stl.palette, stl.name + ' colors') +
      '<span class="muted small">' + esc(s.city) + ', ' + s.guests + ' guests' + (s.setting === 'restaurant' ? ', at a restaurant' : '') + '</span></div></a>';
  }
  /* ---------- AI-generated inspiration gallery: browse by occasion, then plan from a photo ---------- */
  var INSPO = window.EC_INSPO || [];
  function inspoTypes() { return D.EVENT_TYPES.filter(function (t) { return INSPO.some(function (p) { return p.types.indexOf(t.id) >= 0; }); }); }
  /* "All occasions" mixes occasions so the first row isn't all weddings. */
  /* The first photos on the home page: grand wedding ballrooms in four different palettes. */
  var HOME_LEAD = ['blush-wisteria-ballroom', 'black-gold-orchid-ballroom', 'lavender-glow-ballroom', 'ivory-grand-aisle'];
  var INSPO_MIX = (function () { var by = {}, order = []; INSPO.filter(function (p) { return !p.culture; }).forEach(function (p) { var k = p.types[0]; if (!by[k]) { by[k] = []; order.push(k); } by[k].push(p); }); var out = [], more = true; for (var i = 0; more; i++) { more = false; order.forEach(function (k) { if (by[k][i]) { out.push(by[k][i]); more = true; } }); }
    var lead = HOME_LEAD.map(function (id) { return out.find(function (p) { return p.id === id; }); }).filter(Boolean); return lead.concat(out.filter(function (p) { return lead.indexOf(p) < 0; })); })();
  /* A cultural wedding's own photo comes first; other cultures' photos come after the general ones. */
  function inspoFor(type) {
    var d = inspoFor_ && drafts()[inspoFor_], cu = d && d.culture;
    if (!type) return INSPO_MIX;
    var rank = function (p) { return p.culture ? (p.culture === cu ? -1 : 1) : 0; };
    return INSPO.filter(function (p) { return p.types.indexOf(type) >= 0; }).sort(function (a, b) { return rank(a) - rank(b) || a.types.indexOf(type) - b.types.indexOf(type); });
  }
  function inspoCards(type, limit) {
    var list = inspoFor(type), shown = limit ? list.slice(0, limit) : list;
    return shown.map(function (p) { return '<button type="button" class="icard" data-inspo="' + p.id + '" aria-label="' + esc(E.inspoName(p, type)) + ', AI-generated inspiration photo"><div class="thumb"><img src="' + srcOf(INSPO_IMG + 'sm/' + p.id + '.jpg') + '" alt="' + esc(p.alt) + '" loading="lazy">' + AI_TAG + '</div><span class="iname">' + esc(E.inspoName(p, type)) + '</span></button>'; }).join('') +
      (limit && list.length > limit ? '<a class="icard more" href="#/inspiration' + (type ? '/' + type : '') + '"><span>See all ' + list.length + (type ? ' ' + esc(E.typeOf(type).name.toLowerCase().replace(/christmas/, 'Christmas')) : '') + ' photos</span></a>' : '');
  }
  function inspoGallery(type, limit) {
    return '<div class="chips iscroll" id="ifilter" role="group" aria-label="Filter by occasion"><button type="button" class="chip" data-t="" aria-pressed="' + !type + '">All occasions</button>' +
      inspoTypes().map(function (t) { return '<button type="button" class="chip" data-t="' + t.id + '" aria-pressed="' + (t.id === type) + '">' + esc(t.name) + '</button>'; }).join('') + '</div>' +
      '<div class="igrid" id="igrid">' + inspoCards(type, limit) + '</div>' +
      '<p class="muted small">Every photo here is AI-generated inspiration, not a real event we organized. Venues and vendors in your plan are real places in your city, and prices are local estimates until you add real quotes.</p>';
  }
  function bindInspo(limit, onType) {
    var cur = ($('#ifilter [aria-pressed="true"]') || {}).dataset; cur = cur ? cur.t : '';
    $('#ifilter').addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; cur = b.dataset.t; $$('#ifilter [data-t]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $('#igrid').innerHTML = inspoCards(cur, limit); if (onType) onType(cur); });
    $('#igrid').addEventListener('click', function (e) { var b = e.target.closest('[data-inspo]'); if (b) openInspo(b.dataset.inspo, cur); });
  }
  function openInspo(id, type) {
    var p = INSPO.find(function (x) { return x.id === id; }); if (!p) return;
    var dt = inspoFor_ && drafts()[inspoFor_] && drafts()[inspoFor_].type;   /* changing the photo on a plan already set to a wedding keeps it a wedding */
    var pick = type && p.types.indexOf(type) >= 0 ? type : dt && p.types.indexOf(dt) >= 0 ? dt : p.types[0];
    sheet('<div class="thumb ibig"><img src="' + srcOf(INSPO_IMG + p.id + '.jpg') + '" alt="' + esc(p.alt) + '">' + AI_TAG + '</div>' +
      '<div class="stack"><h3 id="iname">' + esc(E.inspoName(p, pick)) + '</h3>' + dots(p.palette, p.name + ' colors') + '<p class="muted">' + esc(p.mood) + '</p></div>' +
      '<div class="stack"><b class="small">In this photo</b><ul class="incl">' + p.decor.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="stack"><b class="small" id="iforLbl">Plan it for</b><div class="chips" id="ifor" role="group" aria-labelledby="iforLbl">' + p.types.map(function (t) { return '<button type="button" class="chip" data-t="' + t + '" aria-pressed="' + (t === pick) + '">' + esc(E.typeOf(t).name) + '</button>'; }).join('') + '</div><span class="muted small">Planning something else? Choose any occasion on the next steps.</span></div>' +
      '<p class="muted small">Your concepts, decor, shopping list, menu and playlist follow this photo. Next, add anything you want different, like colors, guest count or budget. Your words always win.</p>' +
      '<button class="btn gold block" id="useInspo">Use this inspiration</button><button class="btn ghost block" data-close>Keep browsing</button>', function (el, close) {
      $('#ifor', el).addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; pick = b.dataset.t; $('#iname', el).textContent = E.inspoName(p, pick); $$('#ifor [data-t]', el).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });
      $('#useInspo', el).addEventListener('click', function () { T('inspiration_used', { photo: p.id, occasion: pick }); close(); startFromInspo(p, pick); });
    });
  }
  var inspoFor_ = null;   /* the draft a host is choosing a different photo for */
  function startFromInspo(p, type) {
    var keep = inspoFor_ && drafts()[inspoFor_]; inspoFor_ = null;
    var d = keep || newDraft(), tt = E.typeOf(type);
    d.inspiration.inspo = p.id;
    if (p.culture && (type === 'wedding' || type === 'engagement')) { if (d.culture !== p.culture) d.music = null; d.culture = p.culture; }   /* a cultural photo plans that cultural wedding */
    if (d.type !== type) { d.type = type; d.hours = tt.hours; if (!d.guestsTouched) d.guests = d.expected = tt.defaultGuests; }
    d.typeChosen = true;
    if (!d.settingChosen) { d.setting = p.setting; if ((d.setting === 'restaurant' || d.setting === 'privateRoom') && d.hours > 3) d.hours = 3; }
    if (type === 'kids-birthday') d.kids = true; else if (!d.kidsTouched) d.kids = false;
    if (keep) { if (!saveDraft(d)) return; } else pendingDraft = d;   /* a new draft is saved only once the host continues, so Back never leaves empty drafts */
    location.hash = '#/new/1/' + d.id;
  }
  function inspirationPage(type, forId) {
    inspoFor_ = forId && drafts()[forId] ? forId : null;
    if (type && !inspoTypes().some(function (t) { return t.id === type; })) type = '';
    frame('<div class="stack-lg"><div class="stack"><h2>Inspiration by occasion</h2><p class="muted">Tap a photo you love. Your plan, from the decor to the playlist, is built around what’s in it.</p></div>' + inspoGallery(type) + '</div>');
    var on = $('#ifilter [aria-pressed="true"]'); if (on && on.dataset.t) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    bindInspo(0, function (t) { history.replaceState(null, '', '#/inspiration/' + (t || 'all') + (inspoFor_ ? '/' + inspoFor_ : '')); });
  }

  function home() {
    var demoEv = { type: 'wedding', guests: 150, city: 'Houston, TX' };
    var demo = E.budget(demoEv, 'S');
    var pick = function (id) { return demo.items.find(function (i) { return i.id === id; }) || { mid: 0 }; };
    var tags = [['Candles and decor', pick('decor').mid, 36, 30], ['Cake', pick('cake').mid, 80, 36], ['Florals', pick('florals').mid, 52, 62], ['Linens and tableware', pick('rentals').mid, 34, 86]];
    var lines = [['Venue', 'venue'], ['Catering', 'catering'], ['Florals', 'florals'], ['Candles and decor', 'decor'], ['Cake', 'cake'], ['Photographer', 'photographer']].map(function (l) { return '<div class="line"><span>' + l[0] + '</span><span class="num">' + money(pick(l[1]).mid) + '</span></div>'; }).join('') +
      (function () { var shown = ['venue', 'catering', 'florals', 'decor', 'cake', 'photographer'].reduce(function (t, id) { return t + pick(id).mid; }, 0); return '<div class="line"><span>Bar, rentals, music, attire and more, plus a 10% cushion</span><span class="num">' + money(demo.total - shown) + '</span></div>'; })();
    var lastEv = Object.values(events()).filter(function (e) { return e && e.id && !e.sample; }).sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); })[0];
    frame(
      (lastEv ? '<a class="resume-bar" href="#/e/' + esc(lastEv.id) + ((lastEv.packages || []).length ? '/budget' : '') + '"><span>Welcome back. <b>Continue planning ' + esc(lastEv.name || 'your event') + '</b></span><span aria-hidden="true">\u2192</span></a>' : '') +
      (CFG.app ? '' : '<div class="app-soon-bar"><img src="img/brand/ec-mark-128.png" alt="" width="30" height="30"><span><b>The Event Couture app is coming soon</b> to iPhone and Android. Plan, book and invite from your phone.</span></div>') +
      '<section class="hero"><div class="hero-copy"><h1>Your inspiration. A beautifully planned event.</h1>' +
      '<p class="lead">Turn photos or ideas into three event concepts, a detailed budget and a step-by-step plan.</p>' +
      '<div class="row"><a class="btn primary" href="#/new">Plan my event</a><button class="link quiet" data-scroll="inspo">Browse inspiration</button></div></div>' +
      '<figure class="hero-photo"><div class="scene">' +
      '<img src="' + srcOf(HERO_IMG) + '" alt="Candlelit reception table with blush and ivory roses, gold candlesticks, crystal glasses and a tiered cake">' +
      tags.map(function (t) { return '<button class="hot' + (t[2] > 65 ? ' r' : t[2] < 30 ? ' l' : '') + '" style="left:' + t[2] + '%;top:' + t[3] + '%" aria-expanded="false" aria-label="' + esc(t[0]) + ', ' + money(t[1]) + '"><span class="dot" aria-hidden="true"></span><span class="lbl" aria-hidden="true"><b>' + esc(t[0]) + '</b> ' + money(t[1]) + '</span></button>'; }).join('') +
      '</div><figcaption>AI-generated sample concept. Tap a dot to see what that piece costs.</figcaption></figure></section>' +
      '<section class="demo panel"><div class="demo-head"><div><span class="small muted">Example plan</span><h3>Blush and gold wedding</h3><span class="small muted">Houston, TX · 150 guests · Signature version</span></div>' +
      '<div class="demo-total"><span class="small muted">Estimated event budget</span><span class="display num">' + money(demo.total) + '</span></div></div>' +
      '<button class="link small" id="showBudget" aria-expanded="false" aria-controls="demoLines">See example budget</button>' +
      '<div id="demoLines" class="demo-lines" hidden>' + lines + '<p class="muted small" style="margin:8px 0 0">Every line already includes tax, service charges and tips.</p></div></section>' +
      '<section id="inspo" class="stack section"><h2>What are you celebrating?</h2><p class="muted">No idea yet? Pick your occasion and tap a photo you love. Your whole plan is built around it.</p>' + inspoGallery('', 7) + '</section>' +
      '<section id="cultural" class="stack section"><h2>Cultural weddings</h2><p class="muted">Planned with the traditions, music and food that make them yours.</p><div class="culture-cards">' +
      Object.keys(D.CULTURES).map(function (k, i) { var c = [k, D.CULTURES[k].blurb], cu = D.CULTURES[k]; return '<div class="panel culture-card"' + (i >= 6 ? ' data-cmore hidden' : '') + '>' + thumb({ src: 'img/cultures/' + k + '.jpg', alt: cu.name + ' setting', ai: true }, 'cc-img') + '<h3>' + esc(cu.name) + '</h3><p class="small muted">' + esc(c[1]) + '</p><div class="row"><a class="btn small gold" href="#/start/' + c[0] + '-wedding/" aria-label="Plan ' + (/^[aeiou]/i.test(cu.name) ? 'an ' : 'a ') + esc(cu.name) + '">Start planning</a>' + (CFG.app ? '' : '<a class="link small" href="plan/' + guideSlug(cu.name) + '/">What it costs</a>') + '</div></div>'; }).join('') + '</div>' + (Object.keys(D.CULTURES).length > 6 ? '<div><button class="btn ghost" id="allCult" aria-expanded="false">See all ' + Object.keys(D.CULTURES).length + ' cultural weddings</button></div>' : '') + '</section>' +
      '<section id="gallery" class="stack section"><h2>Explore sample plans</h2><p class="muted">Complete plans you can open for free. Photos are AI-generated inspiration, not events we organized.</p><div class="samples home-samples">' +
      FEATURED.map(function (i) { return sampleCard(SAMPLES[i], i); }).join('') + '</div>' +
      '<div class="samples" id="moreSamples" hidden>' + SAMPLES.map(function (s, i) { return FEATURED.indexOf(i) >= 0 ? '' : sampleCard(s, i); }).join('') + '</div>' +
      '<div><button class="btn ghost" id="allSamples" aria-expanded="false" aria-controls="moreSamples">See all ' + SAMPLES.length + ' sample plans</button></div></section>' +
      '<section class="stack-lg section"><h2>How it works</h2><ol class="steps-line">' +
      '<li><h3>Share your inspiration</h3><p class="muted">Several photos, Pinterest or TikTok links, a few words, or just say it out loud.</p></li>' +
      '<li><h3>Pick a concept</h3><p class="muted">Three creative directions. Then see the one you choose in three spending versions, or one made for your budget.</p></li>' +
      '<li><h3>See every cost</h3><p class="muted">Venue, food, decor, music, photos and the fees people forget, sized to your city and guest count.</p></li>' +
      '<li><h3>Plan it together</h3><p class="muted">Co-hosts, voting, RSVPs, a registry and cost splitting, without anyone downloading an app.</p></li></ol></section>' +
      '<section class="stack section" style="text-align:center;justify-items:center"><h2>Ready when you are</h2><p class="muted">Start with a photo, a few words or just your colors.</p><div><a class="btn primary" href="#/new">Plan my event</a></div></section>'
    );
    $$('[data-scroll]').forEach(function (b) { b.addEventListener('click', function () { var t = document.getElementById(b.dataset.scroll); if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }); });
    var hots = $$('.hot');
    hots.forEach(function (h) { h.addEventListener('click', function () { var open = h.getAttribute('aria-expanded') === 'true'; hots.forEach(function (o) { o.setAttribute('aria-expanded', 'false'); }); h.setAttribute('aria-expanded', open ? 'false' : 'true'); }); });
    $('#showBudget').addEventListener('click', function () { var l = $('#demoLines'), open = l.hidden; l.hidden = !open; this.setAttribute('aria-expanded', open); this.textContent = open ? 'Hide example budget' : 'See example budget'; });
    bindInspo(7);
    var ac = $('#allCult'); if (ac) ac.addEventListener('click', function () { $$('[data-cmore]').forEach(function (x) { x.hidden = false; }); ac.remove(); });
    $('#allSamples').addEventListener('click', function () { var m = $('#moreSamples'), open = m.hidden; m.hidden = !open; this.setAttribute('aria-expanded', open); this.textContent = open ? 'Show fewer' : 'See all ' + SAMPLES.length + ' sample plans'; });
  }

  /* The planning-guide address for an occasion, built the same way as tools/seo.cjs builds it. */
  function guideSlug(name) { return String(name).replace(/\u2019s/, 's').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function pricing() {
    frame('<div class="stack-lg"><div class="stack"><h2>Pricing</h2>' + (CFG.launchFree ? '<div class="note"><b>Launch offer:</b> keeping your plan is free right now. The prices below apply after our launch.</div>' : '') + '<p class="muted">Planning is free: build your concepts, budget and plan at no cost. You pay once per event, only if you want to keep your plan. No subscription.</p></div>' +
      '<section class="stack"><h3>Event Pass</h3><p class="muted">Based on how many people you invite, including plus-ones. This is what Event Couture costs, separate from your event budget.</p>' +
      '<div class="panel price-grid">' + D.PASSES.map(function (ps) { return '<div><span class="muted small">Up to ' + ps.max.toLocaleString('en-US') + ' guests</span><b class="num">' + usdSign() + ps.price.toFixed(2) + '</b></div>'; }).join('') + '<div><span class="muted small">Each extra 5,000</span><b class="num">+$150</b></div></div>' +
      '<p class="small muted">Guest list grows later? You pay only the difference.</p></section>' +
      '<section class="stack"><h3>How long you keep it</h3><p class="muted">Your plan stays available until 12 months after you keep it, or 30 days after your event, whichever is later. The exact date is shown before you pay.</p></section>' +
      '<div><a class="btn primary" href="#/new">Plan my event</a></div></div>');
  }

  function myEvents() {
    var all = Object.values(events()).sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
    var ds = Object.values(drafts()).sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
    var stepName = { 1: 'Inspiration', 2: 'Details', 3: 'Review details' };
    frame('<div class="stack-lg"><div class="row" style="justify-content:space-between"><h2>My events</h2><a class="btn gold small" href="#/new">Plan a new event</a></div>' +
      (ds.length ? '<div class="stack"><h3>In progress</h3><p class="muted small">Saved automatically. Pick up right where you left off.</p><div class="list panel">' + ds.map(function (d) {
        var dsrc = d.inspiration.photos[0] ? d.inspiration.photos[0].src : E.inspoOf(d) ? INSPO_IMG + 'sm/' + E.inspoOf(d).id + '.jpg' : '';
        var thumb = dsrc ? '<img src="' + srcOf(dsrc) + '" alt="" style="width:52px;height:52px;object-fit:cover;border-radius:8px">' : '<span style="width:52px;height:52px;border-radius:8px;background:var(--champagne-soft);display:block"></span>';
        return '<div class="it">' + thumb + '<div class="grow"><b>' + esc(d.name || (d.inspiration && d.inspiration.text ? '\u201c' + d.inspiration.text.slice(0, 40) + (d.inspiration.text.length > 40 ? '\u2026' : '') + '\u201d' : 'Untitled event')) + '</b><div class="small muted">Next: ' + stepName[d.step || 1] + (d.updated ? ', saved ' + new Date(d.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '') + '</div></div><span class="acts"><a class="btn small" href="#/new/' + (d.step || 1) + '/' + d.id + '">Continue</a><button class="link small" data-rmd="' + d.id + '">Delete</button></span></div>';
      }).join('') + '</div></div>' : '') +
      (all.length ? (ds.length ? '<h3>Planned</h3>' : '') + '<div class="samples">' + all.map(function (ev) {
        var pal = ev.concept ? ev.concept.palette : ['#E6DEE0', '#F2DDE1', '#F3EADB'];
        return '<a class="sample" href="#/e/' + ev.id + (ev.concept ? '' : '/concepts') + '">' + (thumb(eventPhoto(ev)) || '<div class="thumb noimg" aria-hidden="true" style="background:linear-gradient(120deg,' + pal.slice(0, 4).join(',') + ')"></div>') + '<div class="in"><h3>' + esc(ev.name) + '</h3>' + dots(pal) + '<span class="muted small">' + esc(fmtDate(ev.date)) + ' \u00b7 ' + esc(ev.city.split(',')[0]) + ' \u00b7 ' + plural(ev.guests, 'guest') + '</span><span class="small">' + (ev.concept ? esc(ev.concept.styleName) : 'Choose a concept') + ' ' + (isKept(ev) ? '<span class="badge ok">Kept</span>' : '<span class="badge">' + (CFG.app || CFG.launchFree ? 'Not kept yet' : 'Free preview') + '</span>') + '</span></div></a>'; }).join('') + '</div>'
        : (ds.length ? '' : '<div class="panel stack"><h3>No events yet</h3><p class="muted">Start with your inspiration photos or a description. Your plan saves automatically.</p><div><a class="btn gold" href="#/new">Plan my event</a></div></div>')) + '</div>');
    $$('[data-rmd]').forEach(function (b) { b.addEventListener('click', function () { sheet('<h3>Delete this draft?</h3><p class="muted">Its photos and details will be removed.</p><button class="btn block" id="yes" style="background:var(--bad);border-color:var(--bad)">Delete draft</button><button class="btn ghost block" data-close>Keep it</button>', function (el, close) { $('#yes', el).addEventListener('click', function () { removeDraft(b.dataset.rmd); close(); myEvents(); }); }); }); });
  }

  var MIC = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>';
  function setupSpeak(btn, ta, hint) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null;
    btn.addEventListener('click', function () {
      if (!SR) { hint.textContent = 'Tap the microphone on your keyboard to speak, then talk about your event.'; ta.focus(); return; }
      if (rec) { rec.stop(); return; }
      try { rec = new SR(); } catch (e) { hint.textContent = 'Tap the microphone on your keyboard to speak instead.'; ta.focus(); return; }
      rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
      var base = ta.value.trim() ? ta.value.trim() + ' ' : '';
      rec.onresult = function (e) { var t = ''; for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; ta.value = base + t; };
      rec.onerror = function (e) { hint.textContent = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Microphone access is off here. Tap the microphone on your keyboard instead.' : 'I couldn\u2019t hear that. Tap Speak it and try again.'; };
      rec.onend = function () { rec = null; btn.setAttribute('aria-pressed', 'false'); btn.querySelector('span').textContent = 'Speak it'; };
      try { rec.start(); } catch (e) { rec = null; hint.textContent = 'Tap the microphone on your keyboard to speak instead.'; return; }
      btn.setAttribute('aria-pressed', 'true'); btn.querySelector('span').textContent = 'Listening, tap to stop'; hint.textContent = 'Speak naturally about colors, vibe, guests and budget.';
    });
  }
  var TYPE_WORD = { brunch: 'Brunch', birthday: 'Birthday', milestone: 'Birthday', dinner: 'Dinner', 'bridal-shower': 'Bridal Shower', 'baby-shower': 'Baby Shower', 'gender-reveal': 'Gender Reveal', bachelorette: 'Bachelorette', graduation: 'Graduation', engagement: 'Engagement Party', quince: 'Quincea\u00f1era', anniversary: 'Anniversary', holiday: 'Holiday Party', christmas: 'Christmas Party', retirement: 'Retirement Party', 'kids-birthday': 'Birthday', sweet16: 'Sweet 16', corporate: 'Corporate Event', wedding: 'Wedding', gala: 'Gala', other: 'Celebration' };
  var VIBE_NOUN = { Romantic: 'Romance', Glam: 'Glamour', Garden: 'A Garden Party', Modern: 'Modern Luxe', Classic: 'Classic Elegance', Boho: 'Boho Dreams', Rustic: 'Rustic Charm', Tropical: 'A Tropical Escape', Coastal: 'A Coastal Breeze', Playful: 'Sweet Moments', Minimal: 'Quiet Luxury', Vintage: 'Vintage Glamour', Disco: 'Disco Nights', Moody: 'Moody Elegance', Elegant: 'Timeless Elegance', Luxe: 'Pure Luxury', 'Black tie': 'A Black Tie Evening', Western: 'Western Chic', Mediterranean: 'A Mediterranean Summer', Parisian: 'A Parisian Dream', Fairytale: 'A Fairytale', Whimsical: 'A Whimsical Dream', 'Enchanted forest': 'An Enchanted Forest', 'Old Hollywood': 'Old Hollywood Glamour', 'Art deco': 'Art Deco Glamour', Retro: 'Retro Fun', Neon: 'Neon Nights', Celestial: 'Under the Stars', 'Winter wonderland': 'A Winter Wonderland', Royal: 'Royal Elegance', Cozy: 'Cozy Charm' };
  function suggestNames(d, type) {
    var vibes = (d.inspiration && d.inspiration.vibes) || [];
    var colors = [].concat.apply([], ((d.inspiration && d.inspiration.photos) || []).map(function (p) { return p.colors; }));
    var picked = vibes.filter(function (v) { return VIBE_COLORS.some(function (c) { return c[0] === v; }); });
    if (picked.length < 2 && colors.length) {
      var count = {};
      colors.forEach(function (c) { var best = null, bd = 1e9; VIBE_COLORS.forEach(function (vc) { if (vc[0] === 'Bright colors' || vc[0] === 'Pastels') return; var r = hexRgb(vc[1]); var dd = Math.abs(r[0] - c[0]) + Math.abs(r[1] - c[1]) + Math.abs(r[2] - c[2]); if (dd < bd) { bd = dd; best = vc[0]; } }); count[best] = (count[best] || 0) + 1; });
      Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).forEach(function (c) { if (picked.indexOf(c) < 0) picked.push(c); });
    }
    var text = ((d.inspiration && d.inspiration.text) || '') + ' ' + vibes.join(' ').toLowerCase();
    var ip0 = E.inspoOf(d); if (ip0) { ip0.palette.slice(0, 2).forEach(function (h) { colors.push(hexRgb(h)); }); text += ' ' + ip0.shop; }
    var kid = (d.kids && /birthday/.test(type || '')) || type === 'kids-birthday';   /* children's parties never get nightlife names */
    var style = E.matchStyles(colors, text, []).filter(function (r) { return kid ? ['disco-glam', 'modern-noir', 'moody-floral', 'old-hollywood'].indexOf(r.style.id) < 0 : !r.style.kidsOnly; })[0].style;
    var word = TYPE_WORD[type] || 'Celebration';
    /* Names use real colors: the ones picked, else the ones typed, else the look's main color. */
    var typed = ['Blush', 'Pink', 'Ivory', 'Cream', 'Gold', 'Champagne', 'Sage', 'Emerald', 'Black', 'White', 'Navy', 'Silver', 'Lavender', 'Plum', 'Purple', 'Burgundy', 'Red', 'Terracotta', 'Blue', 'Pastel'].filter(function (w) { return new RegExp('\\b' + w + '\\b', 'i').test(text); }).sort(function (a, b) { return text.toLowerCase().indexOf(a.toLowerCase()) - text.toLowerCase().indexOf(b.toLowerCase()); });
    var STYLE_COLOR = { 'champagne-garden': 'Sage', 'modern-noir': 'Black', 'blush-romance': 'Blush', 'boho-sunset': 'Terracotta', 'coastal-linen': 'Blue', 'tropical-glam': 'Tropical', 'old-hollywood': 'Red', 'pastel-whimsy': 'Pastel', 'ivory-ballroom': 'Ivory', 'minimal-white': 'White', 'disco-glam': 'Silver', 'moody-floral': 'Burgundy', 'rustic-elegance': 'Rustic', 'royal-purple': 'Plum', 'midnight-celestial': 'Midnight' };
    picked = picked.concat(typed.filter(function (w) { return picked.indexOf(w) < 0; }));
    picked = picked.map(function (w) { return /^(champagne|soft gold)$/i.test(w) ? 'Gold' : w === 'Bright colors' ? 'Colorful' : w === 'Pastels' ? 'Pastel' : w.replace(/\b[a-z]/g, function (m) { return m.toUpperCase(); }); }).filter(function (w, i, a) { return a.indexOf(w) === i; });   /* no drink names in event names */
    var c1 = picked[0] || STYLE_COLOR[style.id] || 'Gold', c2 = picked[1];
    var hr = E.startHour({ time: d.timeTouched && d.time ? d.time : defaultTime(type, d.kids) });
    var partOfDay = (d.kids && /birthday/.test(type)) ? 'A Party' : hr < 12 ? 'A Morning' : hr < 16 ? 'An Afternoon' : 'An Evening';
    var vibe = vibes.filter(function (v) { return VIBE_NOUN[v] && !(kid && /Disco|Moody|Glam|Vintage|Black tie|Old Hollywood|Art deco|Luxe/.test(v)); })[0];
    var art = function (w) { return /^[AEIOU]/i.test(w) ? 'An ' : 'A '; };
    var out = [style.name + ' ' + word,
      c2 ? art(c1) + c1 + ' and ' + c2 + ' ' + (type === 'wedding' ? 'Affair' : word) : art(c1) + c1 + ' ' + word,
      (vibe ? VIBE_NOUN[vibe] : partOfDay) + ' in ' + c1,
      'The ' + c1 + ' ' + (type === 'wedding' || type === 'gala' || / Party$/.test(word) ? 'Soir\u00e9e' : word + ' Soir\u00e9e')];
    var ip = E.inspoOf(d); if (ip) out.unshift(E.inspoName(ip, type));
    return out.filter(function (n, i) { return out.indexOf(n) === i; });
  }
  /* The colors and vibes people ask for most, in rough order of popularity. */
  var VIBE_COLORS = [['Blush', '#F2C9CF'], ['Ivory', '#F7F1E3'], ['Gold', '#C9A86A'], ['Soft gold', '#E8D9BC'], ['Rose gold', '#D9A39A'], ['White', '#FFFFFF'], ['Black', '#151515'], ['Sage', '#A9B89A'], ['Emerald', '#1E6B4F'],
    ['Burgundy', '#7B2D3B'], ['Red', '#B3202B'], ['Pink', '#E97AA8'], ['Dusty rose', '#C99197'], ['Mauve', '#A87C8F'], ['Lavender', '#C9B3DD'], ['Plum', '#5E2B55'], ['Navy', '#1F2A4A'], ['Royal blue', '#2A4BA0'],
    ['Dusty blue', '#A9C7D3'], ['Teal', '#2A8C8C'], ['Mint', '#BFE3D0'], ['Peach', '#F6C4A3'], ['Coral', '#F27C6B'], ['Butter yellow', '#F6E3A1'], ['Terracotta', '#C47C4E'], ['Copper', '#B87333'],
    ['Nude', '#D8BFAA'], ['Silver', '#C0C0C8'], ['Pastels', '#F9E1EC'], ['Bright colors', '#F2B544']];
  var VIBES = ['Romantic', 'Elegant', 'Glam', 'Luxe', 'Garden', 'Modern', 'Classic', 'Black tie', 'Boho', 'Rustic', 'Western', 'Tropical', 'Coastal', 'Mediterranean', 'Parisian', 'Fairytale', 'Whimsical', 'Enchanted forest',
    'Old Hollywood', 'Art deco', 'Vintage', 'Retro', 'Disco', 'Neon', 'Celestial', 'Winter wonderland', 'Royal', 'Cozy', 'Playful', 'Minimal', 'Moody'];
  var MUSTS = [['photographer', 'Great photos'], ['videographer', 'Video'], ['florals', 'Lots of flowers'], ['catering', 'Amazing food'], ['bar', 'Open bar'], ['dj', 'DJ and dancing'], ['liveMusic', 'Live music'], ['venue', 'Stunning venue'], ['decor', 'Wow decor'], ['lighting', 'Lighting'], ['hairMakeup', 'Hair and makeup'], ['photoBooth', 'Photo booth'], ['cake', 'Show-stopping cake']];
  function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  /* ---------- new event wizard ---------- */
  /* Sensible defaults the host can change: family showers default to no alcohol, brunches to beer and wine. */
  function defaultAlcohol(type, text) {
    text = (text || '').toLowerCase();
    if (/no alcohol|alcohol[- ]free|\bdry\b|mocktail|sober|no drinking/.test(text)) return 'none';
    if (/wine|mimosa|champagne|beer/.test(text) && !/cocktail|open bar|full bar/.test(text)) return 'wine';
    if (/cocktail|open bar|full bar|tequila|whiskey|martini/.test(text)) return 'full';
    if (['baby-shower', 'gender-reveal', 'quince', 'sweet16', 'kids-birthday'].indexOf(type) >= 0) return 'none';
    if (type === 'corporate') return 'wine';
    if (['brunch', 'bridal-shower', 'graduation'].indexOf(type) >= 0) return 'wine';
    return 'full';
  }
  function defaultTime(type, kids) {
    if (kids && /birthday/.test(type)) return '14:00';
    if (type === 'kids-birthday') return '14:00';
    return { brunch: '11:00', 'baby-shower': '13:00', 'bridal-shower': '13:00', 'gender-reveal': '14:00', graduation: '15:00', wedding: '17:00', other: '18:00' }[type] || '19:00';
  }
  /* Cultural weddings: which tradition the type menu or the description points to, and the music the host picks. */
  /* A cultural wedding starts from its own photo: choosing one selects that photo (her own uploaded photos always stay in charge); going back to classic drops it. */
  function matchCultureInspo(d) {
    var ins = d.inspiration || (d.inspiration = { photos: [], links: [], text: '' }), cur = ins.inspo || '';
    if ((ins.photos || []).length) return false;
    var id = d.culture ? 'culture-' + d.culture : '';
    if (id && cur !== id && (window.EC_INSPO || []).some(function (q) { return q.id === id; })) { ins.inspo = id; return true; }
    if (!id && /^culture-/.test(cur)) { delete ins.inspo; return true; }
    return false;
  }
  function selCulture() { var o = $('#type') && $('#type').selectedOptions[0]; return (o && o.dataset.culture) || ''; }
  function guessCulture(text) {
    text = (text || '').toLowerCase();
    if (/\b(arab|arabic|lebanese|syrian|palestinian|jordanian|iraqi|egyptian|zaffe|zaffa|zaffeh|dabke|kosha)\b/.test(text)) return 'arabic';
    if (/\b(indian|desi|hindu|sikh|punjabi|gujarati|mandap|baraat|sangeet|pheras)\b/.test(text)) return 'indian';
    if (/\b(persian|iranian|sofreh|aghd)\b/.test(text)) return 'persian';
    if (/\b(pakistani|nikah|walima|rukhsati|dholki|qawwali)\b/.test(text)) return 'pakistani';
    if (/\b(mexican|latino|latina|hispanic|lazo|arras|mariachi|padrinos|boda)\b/.test(text)) return 'mexican';
    if (/\b(vietnamese|viet|ao dai|\u00e1o d\u00e0i)\b/.test(text)) return 'vietnamese';
    if (/\b(korean|hanbok|pyebaek)\b/.test(text)) return 'korean';
    if (/\b(chinese|lion dance|double happiness|qipao|cheongsam)\b|tea ceremony/.test(text)) return 'chinese';
    if (/\b(filipino|filipina|pinoy|ninong|ninang|lechon)\b/.test(text)) return 'filipino';
    if (/\b(nigerian|naija|yoruba|igbo|aso ebi|aso-ebi|gele)\b/.test(text)) return 'nigerian';
    if (/\b(greek|stefana|koumbaro|bouzouki)\b/.test(text)) return 'greek';
    if (/\b(moroccan|morocco|negafa|takchita|amariya|amaria)\b/.test(text)) return 'moroccan';
    if (/\b(turkish|turkey|istanbul|kina night|davul|zurna|halay)\b/.test(text)) return 'turkish';
    if (/\b(fusion|multicultural|multi-cultural|bicultural|interfaith|two cultures)\b/.test(text)) return 'fusion';
    if (/african american|black love|jump(ing)? the broom|\blibation\b|\bkente\b|second line|four elements/.test(text)) return 'africanamerican';
    if (/\b(spanish|spain|espa\u00f1ola|flamenco)\b/.test(text)) return 'spanish';
    if (/\b(russian|ukrainian|tamada|karavai)\b/.test(text)) return 'russian';
    return '';
  }
  function musicChips(d) {
    var cu = d.culture && (E.culture(d) || D.CULTURES[d.culture]); if (!cu) return '';
    var on = Array.isArray(d.music) ? d.music : cu.musicDefault;
    return '<h3 id="musicLbl">' + esc(cu.chipsTitle || 'Music and entertainment') + '</h3><span class="muted small">' + esc(cu.chipsNote || 'Pick everything you want. Each one gets its own line in your budget and its own vendor options.') + '</span><div class="chips" id="music" role="group" aria-labelledby="musicLbl">' + cu.music.map(function (m) { return '<button type="button" class="chip" data-music="' + m[0] + '" aria-pressed="' + (on.indexOf(m[0]) >= 0) + '">' + esc(m[1]) + '</button>'; }).join('') + '</div>';
  }
  /* Switch a wedding to (or from) a cultural wedding anytime after it's made. */
  function hasTradition(ev) { return !ev.sample && (ev.type === 'wedding' || ev.type === 'engagement'); }
  function cultureRow(ev) {
    if (!hasTradition(ev)) return '';
    var eng = ev.type === 'engagement', keys = Object.keys(D.CULTURES).filter(function (k) { return !eng || D.CULTURES[k].engagement; });
    return '<div class="culture-row"><label for="cultureSel"><b>' + (eng ? 'Engagement tradition' : 'Wedding tradition') + '</b></label><select id="cultureSel"><option value="">' + (eng ? 'Classic engagement party' : 'Classic wedding') + '</option>' +
      keys.map(function (k) { return '<option value="' + k + '"' + (ev.culture === k ? ' selected' : '') + '>' + esc(eng ? D.CULTURES[k].engagement.name : D.CULTURES[k].name) + '</option>'; }).join('') + '</select></div>' +
      (ev.culture ? '' : '<span class="small muted">' + (eng ? 'Planning an Arabic engagement? Pick it here and we add the zaffe, singer, kosha and Arabic menu.' : 'Planning a cultural wedding? Pick it here and we add its traditions, music and vendors to your plan.') + '</span>');
  }
  function bindCulture(ev, save, rerender) {
    var sel = $('#cultureSel'); if (!sel) return;
    sel.addEventListener('change', function () {
      if (lockSample(ev)) return; var bf = snap(ev); ev.culture = sel.value || ''; ev.music = null; delete ev.ros;
      if (matchCultureInspo(ev) && ev.concept) {   /* the look follows the tradition: its own photo, colors and decor */
        var ip = E.inspoOf(ev), back = !ip && (ev.concepts || []).find(function (c) { return !/^culture-/.test(c.inspo || ''); });
        if (ip || back || /^culture-/.test(ev.concept.inspo || '')) { ev.concept = ip ? E.inspoConcept(ev, ip) : back || Object.assign({}, ev.concept, { inspo: undefined, img: undefined }); if (ev.nameAuto) ev.name = ev.concept.name; }
      }
      save(); rerender();
      undoToast(ev, bf, 'Now planned as ' + (ev.culture ? (/^[aeiou]/i.test(E.typeName(ev)) ? 'an ' : 'a ') + E.typeName(ev) : ev.type === 'engagement' ? 'a classic engagement party' : 'a classic wedding'), rerender);
    });
  }
  function bindMusic(box, d, after) {
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-music]'); if (!b) return; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); d.music = $$('[data-music]', box).filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; }).map(function (x) { return x.dataset.music; }); if (after) after(); });
  }
  function guessType(text) {
    text = (text || '').toLowerCase();
    var rules = [['wedding', /wedding|reception|bride and groom|\bnikah\b|\bwalima\b|\bboda\b|\bshaadi\b|\bshadi\b/], ['bachelorette', /bachelorette|bach party/], ['bridal-shower', /bridal shower/], ['baby-shower', /baby shower|sprinkle/],
      ['gender-reveal', /gender reveal/], ['quince', /quince/], ['sweet16', /sweet 16|sweet sixteen|16th birthday/], ['corporate', /corporate|company|office|client|team (event|dinner|party)|product launch|conference/], ['graduation', /graduat/], ['engagement', /engagement|\bkhutbe\b|\bkhotba\b|katb (el|al) kitab|kitab party|\btolbe\b/], ['anniversary', /anniversary/],
      ['retirement', /retire/], ['kids-birthday', /\b([1-9]|1[0-2])(st|nd|rd|th)\b.*birthday|kids'? (party|birthday)|birthday for my (son|daughter)|(son|daughter)'s birthday|\b([1-9]|1[0-2])[- ]?(year|yr)s?[- ]old\b|\bturning ([1-9]|1[0-2])\b|\b(unicorn|princess|dinosaur|dino|superhero|mermaid|paw patrol|bluey) (party|birthday|theme)|first birthday|1st birthday/], ['milestone', /\b(30|40|50|60|70)th\b|milestone/], ['birthday', /birthday|bday/], ['gala', /gala|fundraiser/], ['christmas', /christmas|xmas/], ['holiday', /holiday|new year/],
      ['brunch', /brunch/], ['dinner', /dinner party|dinner/]];
    for (var i = 0; i < rules.length; i++) if (rules[i][1].test(text)) return rules[i][0];
    return null;
  }
  function guessSetting(text) {
    text = (text || '').toLowerCase();
    if (/private (dining )?room/.test(text)) return 'privateRoom';
    if (/restaurant|order(ing)? from the menu|reservation|(lunch|dinner|brunch) at /.test(text)) return 'restaurant';
    if (/at home|my house|my place|backyard/.test(text)) return 'home';
    if (/outdoor|outside|park|beach/.test(text)) return 'outdoor';
    return null;
  }
  function newDraft() {
    return { id: uid(), name: '', type: '', guests: 20, expected: 20, city: '', budget: 0, setting: null, hours: 3, date: '', time: '18:00', start: '', kids: false,
      inspiration: { photos: [], links: [], text: '', vibes: [] }, priorities: [], guestsList: [], polls: [], registry: { items: [], funds: [] }, gifts: [], album: [], cohosts: [], checklistDone: {}, split: { people: [] }, payLinks: {}, overrides: {}, exclude: [], include: [], tier: 'F', created: Date.now() };
  }
  var JUST_CREATED = {};
  /* Where in the city the venue should be: a short list of neighborhoods people ask for, or any area she types. */
  function areaOptions(city, cur) {
    var list = D.AREAS[city] || [], other = cur && list.indexOf(cur) < 0;
    return '<option value="">' + (city && !/^Other /.test(city) ? 'Anywhere in ' + esc(city.split(',')[0]) : 'Anywhere in the city') + '</option>' + list.map(function (a) { return '<option' + (a === cur ? ' selected' : '') + '>' + esc(a) + '</option>'; }).join('') + '<option value="__other"' + (other ? ' selected' : '') + '>Another area\u2026</option>';
  }
  function areaField(city, cur, ids) {
    var other = cur && (D.AREAS[city] || []).indexOf(cur) < 0;
    return '<label class="field"><span>Area for your venue (optional)</span><select class="input" id="' + ids[0] + '">' + areaOptions(city, cur) + '</select></label>' +
      '<label class="field" id="' + ids[1] + 'Wrap"' + (other ? '' : ' hidden') + '><span>Type the area or neighborhood</span><input class="input" id="' + ids[1] + '" value="' + esc(other ? cur : '') + '" placeholder="e.g. Rice Village"></label>';
  }
  function readArea(sel, txt) { var v = sel ? sel.value : ''; return v === '__other' ? (txt ? txt.value.trim() : '') : v; }
  /* Cities for one country; a city she typed herself selects that country's "Other" choice. */
  var COMMON_WORD_CITIES = ['split', 'nice', 'goa', 'bali', 'provence', 'tuscany', 'cotswolds', 'algarve', 'dead sea', 'gold coast', 'amalfi coast', 'lake como', 'cork', 'mallorca', 'boracay'];
  function otherCity(typed, choice) {
    if (!typed) return choice;
    var co = D.COUNTRIES.find(function (k) { return k.other === choice; });
    if (co && co.id !== 'US' && E.countryOf(typed).id !== co.id) return typed + ', ' + (co.id === 'CA' ? 'Canada' : co.name);
    return typed;
  }
  function cityOptions(country, city) {
    var list = D.CITIES.filter(function (c) { return c.country === country; }), known = !city || list.some(function (c) { return c.name === city; });
    return (city ? '' : '<option value="" selected disabled>Choose your city</option>') + list.map(function (c) { return '<option' + (c.name === city || (!known && /^Other /.test(c.name) && E.countryOf(city).id === country) ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
  }
  function bindArea(sel, txt, cityOf) {
    if (!sel) return;
    sel.addEventListener('change', function () { var w = document.getElementById(txt.id + 'Wrap'); if (w) w.hidden = sel.value !== '__other'; if (sel.value === '__other') txt.focus(); });
    if (cityOf) cityOf.addEventListener('change', function () { sel.innerHTML = areaOptions(cityOf.value, ''); var w = document.getElementById(txt.id + 'Wrap'); if (w) w.hidden = true; });
  }
  function wizard(step, id) {
    var done = id && events()[id]; if (done) { if (JUST_CREATED[id] && done.concept) { history.back(); return; } location.replace('#/e/' + id + (done.concept ? '' : '/concepts')); return; }   /* Back past the finished form steps goes to where she was before planning */   /* Back from the concepts page returns to the plan, not a blank form */
    if (!id || (!drafts()[id] && !(pendingDraft && pendingDraft.id === id))) { pendingDraft = newDraft(); location.replace('#/new/1/' + pendingDraft.id); return; }
    draft = drafts()[id] || pendingDraft;   /* a new draft is saved only once the host adds something or continues */
    E.useCountry(draft.city || (draft.country && draft.country !== 'US' ? (D.COUNTRIES.find(function (k) { return k.id === draft.country; }) || {}).other || null : null));
    var W = '#/new/';
    function persist() { draft.step = Math.max(draft.step || 1, step); return saveDraft(draft); }
    function laterBtn() { return '<button type="button" class="link" id="later">Save and finish later</button>'; }
    var prog = '<div class="progress" aria-label="Step ' + Math.min(step, 2) + ' of 2">' + [1, 2].map(function (i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('') + '</div>';
    if (step === 1) {
      var ip = E.inspoOf(draft);
      frame('<div class="wizard stack-lg">' + prog + (ip ? '<div class="stack"><h2>Your inspiration</h2><p class="muted">Your plan starts from this photo. Add your own photos or words below for anything you want different.</p></div>' +
        '<div class="panel inspo-chosen">' + thumb({ src: INSPO_IMG + 'sm/' + ip.id + '.jpg', alt: ip.alt, ai: true }) + '<div class="stack"><b>' + esc(E.inspoName(ip, draft.type)) + '</b><span class="muted small">' + esc(ip.mood) + '</span><div class="row"><a class="btn ghost small" id="swapInspo" href="#/inspiration/' + esc(draft.type || 'all') + '/' + draft.id + '">Choose a different photo</a><button type="button" class="link small" id="noInspo">Remove</button></div></div></div>'
        : '<div class="stack"><h2>Tell us about your ' + esc(E.culture(draft) ? E.typeName(draft) : 'event') + '</h2><p class="muted">A few words or a photo is all it takes. You can add more later.</p></div>') +
        '<div class="field"><span>' + (ip ? 'Anything you\u2019d change or add? (optional)' : 'What are you celebrating?') + '</span><textarea class="input" id="text" placeholder="' + (ip ? 'Example: same look in navy and silver, 40 guests, at home, under $5,000' : 'Example: pink and gold girls’ brunch for 10, chic and girly, under $2,000') + '">' + esc(draft.inspiration.text) + '</textarea>' +
        '<div class="row"><button type="button" class="btn ghost small" id="speak" aria-pressed="false">' + MIC + '<span>Speak it</span></button><span class="muted small" id="speakHint">Talk about your colors, vibe, guests and budget.</span></div></div>' +
        '<label class="drop" id="drop"><input type="file" id="files" accept="image/*" multiple class="sr"><b>Add inspiration photos</b><span class="muted small">Tap to choose, or drop photos here</span></label>' +
        '<div class="photos" id="photos"></div>' +
        (ip ? '' : '<div class="panel row inspo-nudge"><span class="grow"><b>No inspiration yet?</b> <span class="muted small">Browse AI-generated photos by occasion and start from one you love.</span></span><a class="btn small" id="browseInspo" href="#/inspiration/' + esc(draft.type || 'all') + '/' + draft.id + '">Browse inspiration</a></div>') +
        '<details class="more"' + ((draft.inspiration.links || []).length || (draft.inspiration.vibes || []).length ? ' open' : '') + '><summary class="link">Add links, colors or a vibe (optional)</summary>' +
        '<div class="field"><span>Links to posts or boards (optional)</span><textarea class="input" id="links" placeholder="Paste Pinterest, Instagram or TikTok links, one per line">' + esc(draft.inspiration.links.join('\n')) + '</textarea><span class="muted small">If a link can’t be opened, add a screenshot of it as a photo.</span></div>' +
        '<div class="stack"><h3>' + (ip ? 'Change the colors or vibe (optional)' : 'Or pick the colors and vibe you like') + '</h3><span class="muted small">Colors</span><div class="chips" id="vcolors">' + VIBE_COLORS.map(function (c) { return '<button type="button" class="chip vchip" aria-pressed="' + ((draft.inspiration.vibes || []).indexOf(c[0]) >= 0) + '" data-vibe="' + esc(c[0]) + '"><i style="background:' + c[1] + '"></i>' + esc(c[0]) + '</button>'; }).join('') + '</div>' +
        '<span class="muted small">Vibe</span><div class="chips" id="vvibes">' + VIBES.map(function (v) { return '<button type="button" class="chip" aria-pressed="' + ((draft.inspiration.vibes || []).indexOf(v) >= 0) + '" data-vibe="' + esc(v) + '">' + esc(v) + '</button>'; }).join('') + '</div></div>' + '</details>' +
        '<div class="wiz-act"><button class="btn gold" id="next">Continue</button>' + laterBtn() + '</div></div>');
      var drop = $('#drop'), files = $('#files');
      function renderPhotos() {
        $('#photos').innerHTML = draft.inspiration.photos.map(function (p) {
          return '<div class="photo" data-id="' + p.id + '"><img src="' + p.src + '" alt="Inspiration photo; tap to mark what you love">' +
            p.loves.map(function (l) { return '<span class="pin" style="left:' + l.x + '%;top:' + l.y + '%">' + esc(l.label) + '</span>'; }).join('') +
            '<div class="pal">' + p.colors.map(function (c) { return '<i style="background:' + rgb(c) + '"></i>'; }).join('') + '</div><button class="x" aria-label="Remove photo">×</button></div>';
        }).join('');
      }
      renderPhotos();
      function addFiles(list) {
        var arr = Array.prototype.slice.call(list || []);
        Promise.all(arr.map(function (f) { return readPhoto(f).catch(function (e) { toast(e.message); return null; }); })).then(function (ps) {
          ps.filter(Boolean).forEach(function (p) { draft.inspiration.photos.push(p); });
          if (persist() === false) {} renderPhotos();
          if (ps.filter(Boolean).length) toast('Tap a photo to mark the parts you love');
        });
      }
      files.addEventListener('change', function () { addFiles(files.files); files.value = ''; });
      ['dragenter', 'dragover'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
      drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
      $('#photos').addEventListener('click', function (e) {
        var card = e.target.closest('.photo'); if (!card) return;
        var p = draft.inspiration.photos.find(function (x) { return x.id === card.dataset.id; });
        if (e.target.classList.contains('x')) { draft.inspiration.photos = draft.inspiration.photos.filter(function (x) { return x !== p; }); persist(); return renderPhotos(); }
        if (e.target.tagName !== 'IMG') return;
        var r = e.target.getBoundingClientRect(); var x = Math.round((e.clientX - r.left) / r.width * 100), y = Math.round((e.clientY - r.top) / r.height * 100);
        var opts = ['Colors', 'Florals', 'Cake', 'Table setting', 'Balloons', 'Backdrop', 'Lighting', 'Outfit', 'Venue', 'Food', 'Signage', 'Everything'];
        sheet('<h3>What do you love here?</h3><div class="chips">' + opts.map(function (o) { return '<button class="chip" data-v="' + o + '">' + o + '</button>'; }).join('') + '</div><button class="btn ghost" data-close>Cancel</button>', function (el, close) {
          el.addEventListener('click', function (ev2) { var b = ev2.target.closest('[data-v]'); if (!b) return; p.loves.push({ x: x, y: y, label: b.dataset.v }); persist(); renderPhotos(); close(); });
        });
      });
      $$('[data-vibe]').forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); var v = b.dataset.vibe; draft.inspiration.vibes = (draft.inspiration.vibes || []).filter(function (x) { return x !== v; }); if (on) draft.inspiration.vibes.push(v); persist(); }); });
      setupSpeak($('#speak'), $('#text'), $('#speakHint'));
      var t1; ['#text', '#links'].forEach(function (sel) { $(sel).addEventListener('input', function () { clearTimeout(t1); t1 = setTimeout(function () { if (!$('#text') || !$('#links')) return; draft.inspiration.text = $('#text').value.trim(); draft.inspiration.links = $('#links').value.split(/\s+/).filter(function (x) { return /^https?:\/\//.test(x); }); if (draft.inspiration.text || draft.inspiration.links.length || drafts()[draft.id]) persist(); }, 300); }); });
      window.addEventListener('pagehide', function () { if (!$('#text')) return; draft.inspiration.text = $('#text').value.trim(); if (draft.inspiration.text || drafts()[draft.id]) persist(); }, { once: true });
      ['#browseInspo', '#swapInspo'].forEach(function (sel) { if ($(sel)) $(sel).addEventListener('click', function () { draft.inspiration.text = $('#text').value.trim(); draft.inspiration.links = $('#links').value.split(/\s+/).filter(function (x) { return /^https?:\/\//.test(x); }); persist(); }); });
      if ($('#noInspo')) $('#noInspo').addEventListener('click', function () { draft.inspiration.text = $('#text').value.trim(); delete draft.inspiration.inspo; persist(); wizard(1, draft.id); });
      $('#next').addEventListener('click', function () {
        draft.inspiration.links = $('#links').value.split(/\s+/).filter(function (s) { return /^https?:\/\//.test(s); });
        draft.inspiration.text = $('#text').value.trim();
        if (!E.inspoOf(draft) && !draft.inspiration.photos.length && !draft.inspiration.text && !draft.inspiration.links.length && !(draft.inspiration.vibes || []).length) return toast('Add a photo, a description, or pick a few colors and a vibe');
        var said1 = draft.inspiration.text.toLowerCase().replace(/(\d),(\d{3})/g, '$1$2'), mm;
        if (!draft.guestsTouched && (mm = said1.match(/\b(?:for|about|around|of|with)?\s*(\d{1,5})\s*(?:guests|people|persons|adults|friends|kids|children|ppl)\b/))) { draft.guests = draft.expected = Math.max(1, Math.min(20000, +mm[1])); draft.guestsTouched = true; }
        if (!draft.budgetTouched && (mm = said1.match(/(?:budget(?: of| is)?|under|less than|max(?:imum)?|spend(?:ing)?|up to)\s*(?:about|around)?\s*\$?\s*(\d+(?:\.\d+)?)\s*(k|thousand)?\b/) || said1.match(/\$\s*(\d+(?:\.\d+)?)\s*(k|thousand)?\b/))) { var bv = Math.round(+mm[1] * (mm[2] ? 1000 : 1)); if (bv >= 50) { draft.budget = bv; draft.tier = 'F'; } }
        if (!draft.typeChosen) { var gt = guessType(draft.inspiration.text); if (gt) { draft.type = gt; draft.culture = gt === 'wedding' || gt === 'engagement' ? guessCulture(draft.inspiration.text) : ''; if (gt === 'engagement' && draft.culture && !D.CULTURES[draft.culture].engagement) draft.culture = ''; var tt = Object.assign({}, E.typeOf(gt)); if (E.culture(draft)) { tt.defaultGuests = E.culture(draft).guests; tt.hours = E.culture(draft).hours; } if (!draft.guestsTouched) { draft.guests = tt.defaultGuests; draft.expected = tt.defaultGuests; } if (!draft.hoursTouched) draft.hours = tt.hours; } }
        persist(); location.hash = W + '2/' + draft.id;
      });
      $('#later').addEventListener('click', function () { draft.inspiration.links = $('#links').value.split(/\s+/).filter(function (x) { return /^https?:\/\//.test(x); }); draft.inspiration.text = $('#text').value.trim(); persist(); location.hash = '#/events'; setTimeout(function () { toast('Saved. Pick it up anytime from My events.'); }, 80); });
      return;
    }
    if (step === 2) {
      var ktx = (draft.inspiration && draft.inspiration.text) || '', kty = draft.type || guessType(ktx.toLowerCase()) || '';
      if (!draft.kidsTouched && E.KIDS_TEXT.test(ktx) && !/shower|wedding|bridal|engagement|anniversary|retire|corporate|gala|reveal|bachelorette/.test(kty)) draft.kids = true;
      /* Must-haves the host already named in her description are pre-selected (she can untick them). */
      if (!draft.mustsGuessed && !(draft.priorities || []).length) {
        var said2 = ((draft.inspiration && draft.inspiration.text) || '').toLowerCase();
        draft.priorities = [['liveMusic', /live (band|music)|\bband\b|orchestra|string quartet|mariachi|jazz trio/], ['photoBooth', /photo ?booth/], ['dj', /\bdj\b|dance floor|dancing/], ['videographer', /video/], ['florals', /flowers|roses|florals|peonies|floral/], ['bar', /open bar/], ['hairMakeup', /hair and makeup|glam squad|makeup artist/], ['photographer', /photographer|great photos/], ['lighting', /lighting|uplighting/]].filter(function (r) { return r[1].test(said2); }).map(function (r) { return r[0]; });
        draft.mustsGuessed = true;
      }
      frame('<div class="wizard stack-lg">' + prog + '<div class="stack"><h2>A few basics</h2><p class="muted">That\u2019s all we need to build your looks, prices and plan. You can change anything later.</p></div>' +
        '<div class="grid2">' +
        '<label class="field"><span>Event type</span><select class="input" id="type">' + (draft.type ? '' : '<option value="" selected disabled>Choose your event type</option>') + D.EVENT_TYPES.map(function (t) { return '<option value="' + t.id + '"' + (t.id === draft.type && !draft.culture ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '<optgroup label="Cultural weddings">' + Object.keys(D.CULTURES).map(function (k) { return '<option value="wedding" data-culture="' + k + '"' + (draft.type === 'wedding' && draft.culture === k ? ' selected' : '') + '>' + esc(D.CULTURES[k].name) + '</option>'; }).join('') + '</optgroup><optgroup label="Cultural engagement parties">' + Object.keys(D.CULTURES).filter(function (k) { return D.CULTURES[k].engagement; }).map(function (k) { return '<option value="engagement" data-culture="' + k + '"' + (draft.type === 'engagement' && draft.culture === k ? ' selected' : '') + '>' + esc(D.CULTURES[k].engagement.name) + '</option>'; }).join('') + '</optgroup></select></label>' + 
        (function () {
          if (!draft.city) { var said = ((draft.inspiration && draft.inspiration.text) || '').toLowerCase(); var hit = D.CITIES.find(function (c) { var cn = c.name.split(',')[0].toLowerCase(); return !/^Other /.test(c.name) && COMMON_WORD_CITIES.indexOf(cn) < 0 && new RegExp('\\b' + cn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(said); });   /* a whole city name, never a word like "split" or "nice" */ if (hit) draft.city = hit.name; else if (!draft.country && /\bcanad/.test(said)) draft.country = 'CA'; }
          var co = draft.city ? E.countryOf(draft.city) : (D.COUNTRIES.find(function (c) { return c.id === draft.country; }) || D.COUNTRIES[0]);
          var known = !draft.city || D.CITIES.some(function (c) { return c.name === draft.city; });
          return '<label class="field"><span>Country</span><select class="input" id="country">' + D.COUNTRIES.map(function (c) { return '<option value="' + c.id + '"' + (c.id === co.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></label>' +
            '<label class="field"><span>City</span><select class="input" id="city">' + cityOptions(co.id, draft.city) + '</select></label>' +
            '<label class="field" id="cityOtherWrap"' + (known || !draft.city ? ' hidden' : '') + '><span id="cityOtherLbl">' + (co.region === 'city' ? 'Your city' : 'Your city and ' + co.region) + '</span><input class="input" id="cityOther" placeholder="' + esc(co.example) + '" value="' + esc(known ? '' : draft.city) + '"></label>';
        })() +
        areaField(draft.city, draft.area || '', ['area', 'areaOther']) +
        '<label class="field"><span>How many people are you inviting? (include plus-ones and yourself)</span><input class="input num" type="number" min="1" max="100000" id="guests" value="' + draft.guests + '"></label>' +
        '<label class="field"><span id="budgetLbl">Maximum budget for the event (' + E.currency() + ', optional)</span><input class="input num" type="number" min="0" step="50" id="budget" value="' + (draft.budget || '') + '" placeholder="Leave blank to see typical prices"></label>' +
        '</div>' + '<div class="stack" id="musicBox"' + (draft.culture && D.CULTURES[draft.culture] ? '' : ' hidden') + '>' + musicChips(draft) + '</div>' + '<div class="stack"><h3 id="whereLbl">Where is it? <span class="muted small" style="font-family:var(--body)">(required)</span></h3><span class="muted small">Not sure yet? Pick it and we\u2019ll compare every option for you.</span><div class="chips" id="setting" role="group" aria-labelledby="whereLbl">' + D.SETTINGS.map(function (st) { return '<button type="button" class="chip" data-v="' + st.id + '" aria-pressed="' + (draft.setting === st.id && !draft.settingOpen && !(st.id === 'indoor' && draft.venueKind === 'ballroom')) + '">' + esc(st.name) + '</button>' + (st.id === 'indoor' ? '<button type="button" class="chip" data-v="ballroom" aria-pressed="' + (draft.setting === 'indoor' && draft.venueKind === 'ballroom' && !draft.settingOpen) + '">Hotel ballroom</button>' : ''); }).join('') + '<button type="button" class="chip" data-v="unsure" aria-pressed="' + !!draft.settingOpen + '">Not sure yet</button>' + '</div>' +
        '<label class="row small"><input type="checkbox" id="kids"' + (draft.kids ? ' checked' : '') + '> Children will attend</label></div>' +
        '<details class="more"' + (draft.date || draft.timeTouched || draft.alcoholTouched || draft.mustsTouched || draft.payer && draft.payer !== 'host' ? ' open' : '') + '><summary class="link">More details: date, time, drinks, must-haves (optional)</summary><div class="stack" style="margin-top:12px">' +
        '<div class="panel stack"><label class="field"><span>Name your event</span><input class="input" id="name" value="' + esc(draft.name) + '" placeholder="Name it, or tap an idea below" maxlength="80"></label><span class="muted small">Ideas from your inspiration</span><div class="chips" id="names"></div><span class="muted small">Your event saves under this name in My events, so you can come back and finish anytime.</span></div>' +
        '<div class="grid2">' +
        '<div class="field"><label class="field" id="dateOne"' + (draft.dateFrom && !draft.date ? ' hidden' : '') + '><span>Date</span><input class="input" type="date" id="date" min="' + todayISO() + '" value="' + esc(draft.date) + '"></label><div class="grid2" id="dateRange"' + (draft.dateFrom && !draft.date ? '' : ' hidden') + '><label class="field"><span>Earliest date</span><input class="input" type="date" id="dateFrom" min="' + todayISO() + '" value="' + esc(draft.dateFrom || '') + '"></label><label class="field"><span>Latest date</span><input class="input" type="date" id="dateTo" min="' + todayISO() + '" value="' + esc(draft.dateTo || '') + '"></label></div><label class="row small"><input type="checkbox" id="dateFlex"' + (draft.dateFrom && !draft.date ? ' checked' : '') + '> No exact date yet, pick a range</label></div>' +
        '<label class="field"><span>Start time</span><input class="input" type="time" id="time" value="' + esc(draft.timeTouched ? draft.time : (draft.time && draft.time !== '18:00' ? draft.time : defaultTime(draft.type, draft.kids))) + '"></label>' +
        '<label class="field"><span>How many hours</span><input class="input" type="number" min="1" max="16" id="hours" value="' + draft.hours + '"></label>' +
        '<label class="field"><span>Expected to attend</span><input class="input num" type="number" min="1" id="expected" value="' + draft.expected + '"></label>' +
        '<label class="field"><span>Your starting point for drive times (optional)</span><input class="input" id="start" value="' + esc(draft.start) + '" placeholder="Home, hotel or ceremony address"></label>' +
        '</div>' +
        '<div class="grid2"><div class="stack"><h3 id="alcLbl">Drinks</h3><div class="chips" id="alcohol" role="group" aria-labelledby="alcLbl">' + [['none', 'No alcohol'], ['wine', 'Beer and wine'], ['full', 'Full bar or cocktails']].map(function (o) { return '<button type="button" class="chip" data-v="' + o[0] + '" aria-pressed="' + ((draft.alcohol || defaultAlcohol(draft.type, draft.inspiration && draft.inspiration.text)) === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>' +
        '<div class="stack"><h3 id="payLbl">Who\u2019s paying?</h3><div class="chips" id="payer" role="group" aria-labelledby="payLbl">' + [['host', 'I\u2019m hosting and paying'], ['own', 'Everyone pays their own'], ['shared', 'We\u2019re splitting the cost']].map(function (o) { return '<button type="button" class="chip" data-v="' + o[0] + '" aria-pressed="' + ((draft.payer || 'host') === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div></div>' +
        '<div class="stack"><h3>Your must-haves</h3><span class="muted small">These are protected first when the plan is fitted to your budget.' + ((draft.priorities || []).length && draft.mustsGuessed && !draft.mustsTouched ? ' We picked the highlighted ones from your description; tap to change.' : '') + '</span><div class="chips" id="musts">' + MUSTS.map(function (m) { return '<button type="button" class="chip" data-must="' + m[0] + '" aria-pressed="' + ((draft.priorities || []).indexOf(m[0]) >= 0) + '">' + esc(m[1]) + '</button>'; }).join('') + '</div></div>' +
        '</div></details>' +
        '<div class="wiz-act"><button class="btn gold" id="next">Create my concepts</button><a class="btn ghost" id="back2" href="' + W + '1/' + draft.id + '">Back</a>' + laterBtn() + '</div></div>');
      var lastIdeas = [];
      function showNames() { lastIdeas = suggestNames(draft, $('#type').value); $('#names').innerHTML = lastIdeas.map(function (n) { return '<button type="button" class="chip" data-name="' + esc(n) + '">' + esc(n) + '</button>'; }).join(''); }
      showNames();
      $('#names').addEventListener('click', function (e) { var b = e.target.closest('[data-name]'); if (!b) return; $('#name').value = b.dataset.name; draft.name = b.dataset.name; draft.nameAuto = false; persist(); });
      $('#type').addEventListener('change', function () {
        var old = lastIdeas || [], cur = $('#name').value.trim();
        if (cur && old.indexOf(cur) >= 0) { $('#name').value = ''; draft.name = ''; draft.nameAuto = true; }
        showNames();
      });
      if (!draft.settingChosen) { var gs = guessSetting((draft.inspiration && draft.inspiration.text) || ''); if (gs) { draft.setting = gs; $$('#setting button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.v === gs); }); } }
      /* Never replace a number the host typed: defaults only fill fields they haven't touched. */
      ['guests', 'expected'].forEach(function (f) { $('#' + f).addEventListener('input', function () { draft.guestsTouched = true; }); });
      $('#budget').addEventListener('input', function () { draft.budgetTouched = true; });
      bindMusic($('#musicBox'), draft, persist);
      $('#type').addEventListener('change', function () { var c = selCulture(); if (c !== (draft.culture || '')) draft.music = null; draft.culture = c; draft.type = $('#type').value || draft.type; var mb = $('#musicBox'); mb.innerHTML = musicChips(draft); mb.hidden = !c;
        var cu = E.culture(draft); if (cu) setTimeout(function () { if (!draft.guestsTouched) { $('#guests').value = cu.guests; $('#expected').value = cu.guests; } if (!draft.hoursTouched) $('#hours').value = cu.hours; }, 0); });
      $('#type').addEventListener('change', function () { draft.typeChosen = true; var t = E.typeOf(this.value); if (this.value === 'kids-birthday') $('#kids').checked = true; if (!draft.hoursTouched) $('#hours').value = t.hours; if (!draft.guestsTouched) { $('#guests').value = t.defaultGuests; $('#expected').value = t.defaultGuests; }
        if (!draft.timeTouched) $('#time').value = defaultTime(this.value, $('#kids').checked);
        if (!draft.alcoholTouched) { var da = defaultAlcohol(this.value, draft.inspiration && draft.inspiration.text); $$('#alcohol button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.v === da); }); } });
      $('#dateFlex').addEventListener('change', function () { $('#dateOne').hidden = this.checked; $('#dateRange').hidden = !this.checked; });
      $('#time').addEventListener('input', function () { draft.timeTouched = true; });
      $('#hours').addEventListener('input', function () { draft.hoursTouched = true; });
      $('#kids').addEventListener('change', function () { draft.kidsTouched = true; if (!draft.timeTouched) $('#time').value = defaultTime($('#type').value, this.checked); });
      /* Everything typed here is saved as you go, so a refresh never loses it. */
      var autoT; ['input', 'change', 'click'].forEach(function (evt) { $('#main').addEventListener(evt, function () { clearTimeout(autoT); autoT = setTimeout(saveNow, 150); }); });
      $('#back2').addEventListener('click', function () { clearTimeout(autoT); saveNow(); });   /* Back saves first, even on a quick tap */
      function saveNow() { if (!draft || !$('#guests') || !(+$('#guests').value >= 1)) return; var typedName = $('#name').value.trim(); collect2(); if (!typedName) draft.name = ''; persist(); }
      window.addEventListener('pagehide', saveNow, { once: true }); window.addEventListener('beforeunload', saveNow, { once: true });
      $('#city').addEventListener('change', function () { var oth = /^Other /.test(this.value); $('#cityOtherWrap').hidden = !oth; if (oth) $('#cityOther').focus(); });
      $('#country').addEventListener('change', function () { var co = D.COUNTRIES.find(function (c) { return c.id === $('#country').value; }); draft.country = co.id; E.useCountry(co.id === 'US' ? null : co.other); var bl = $('#budgetLbl'); if (bl) bl.textContent = 'Maximum budget for the event (' + co.currency + ', optional)'; $('#city').innerHTML = cityOptions(co.id, ''); $('#cityOtherWrap').hidden = true; $('#cityOther').value = ''; $('#cityOther').placeholder = co.example; $('#cityOtherLbl').textContent = co.region === 'city' ? 'Your city' : 'Your city and ' + co.region; $('#city').dispatchEvent(new Event('change')); });
      bindArea($('#area'), $('#areaOther'), $('#city'));
      $('#expected').addEventListener('input', function () { draft.expectedTouched = true; });
      $('#guests').addEventListener('input', function () { if (!draft.expectedTouched && +this.value >= 1) $('#expected').value = Math.round(+this.value); });
      $('#alcohol').addEventListener('click', function () { draft.alcoholTouched = true; });
      ['alcohol', 'payer'].forEach(function (g) { $('#' + g).addEventListener('click', function (e) { var bt = e.target.closest('button'); if (!bt) return; $$('#' + g + ' button').forEach(function (x) { x.setAttribute('aria-pressed', x === bt); }); }); });
      $('#musts').addEventListener('click', function (e) { var b = e.target.closest('[data-must]'); if (b) draft.mustsTouched = true; if (b) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
      $('#setting').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; draft.settingChosen = true; $$('#setting button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); if ((b.dataset.v === 'restaurant' || b.dataset.v === 'privateRoom') && +$('#hours').value > 3 && !draft.hoursTouched) $('#hours').value = b.dataset.v === 'restaurant' ? 2 : 3; });
      function collect2() {
        var g = Math.round(+$('#guests').value), ex = Math.round(+$('#expected').value);
        draft.type = $('#type').value || ''; draft.culture = draft.type === 'wedding' || draft.type === 'engagement' ? selCulture() : ''; if (!draft.culture) delete draft.music; draft.nameAuto = !$('#name').value.trim() || draft.nameAuto && $('#name').value.trim() === draft.name; draft.name = $('#name').value.trim() || (suggestNames(draft, draft.type)[0]) || E.typeOf(draft.type).name; draft.city = !$('#city').value ? '' : /^Other /.test($('#city').value) ? otherCity($('#cityOther').value.trim(), $('#city').value) : $('#city').value; draft.country = draft.city ? E.countryOf(draft.city).id : (($('#country') || {}).value || draft.country || 'US'); var flex = $('#dateFlex') && $('#dateFlex').checked; draft.date = flex ? '' : $('#date').value; if (flex && $('#dateFrom').value) { draft.dateFrom = $('#dateFrom').value; draft.dateTo = $('#dateTo').value && $('#dateTo').value >= draft.dateFrom ? $('#dateTo').value : draft.dateFrom; } else { delete draft.dateFrom; delete draft.dateTo; } draft.time = $('#time').value || defaultTime(draft.type);
        draft.hours = Math.max(1, +$('#hours').value || 3); draft.guests = g; draft.expected = ex || g; draft.budget = Math.max(0, +$('#budget').value || 0); draft.start = $('#start').value.trim();
        var sb = $('#setting [aria-pressed="true"]'); draft.settingOpen = !!(sb && sb.dataset.v === 'unsure'); draft.setting = sb ? (draft.settingOpen || sb.dataset.v === 'ballroom' ? 'indoor' : sb.dataset.v) : null; draft.venueKind = sb && sb.dataset.v === 'ballroom' ? 'ballroom' : ''; draft.kids = $('#kids').checked || draft.type === 'kids-birthday'; draft.priorities = $$('#musts [aria-pressed="true"]').map(function (b) { return b.dataset.must; }); draft.tier = draft.budget ? 'F' : 'S';
        var ab = $('#alcohol [aria-pressed="true"]'); draft.alcohol = ab ? ab.dataset.v : defaultAlcohol(draft.type, draft.inspiration && draft.inspiration.text);
        var pb = $('#payer [aria-pressed="true"]'); draft.payer = pb ? pb.dataset.v : 'host';
        if ($('#area')) draft.area = readArea($('#area'), $('#areaOther'));
        matchCultureInspo(draft);
      }
      $('#later').addEventListener('click', function () { collect2(); if (!$('#name').value.trim()) draft.name = ''; persist(); var nm = draft.name || 'your event'; location.hash = '#/events'; setTimeout(function () { toast('Saved ' + nm + '. Pick it up anytime from My events.'); }, 80); });
      $('#next').addEventListener('click', function () {
        if (!draft) return;   /* a second tap after the plan was already created */
        var g = Math.round(+$('#guests').value), ex = Math.round(+$('#expected').value);
        if (!$('#type').value) { $('#type').focus(); return toast('Choose what you’re celebrating'); }
        if (!$('#city').value) { $('#city').focus(); return toast('Choose your city so prices match where you live'); }
        if (!(g >= 1)) return toast('Enter how many people you’re inviting');
        if (g > 20000) return toast('Event Couture plans events for up to 20,000 people');
        var hrs = +$('#hours').value; if (!(hrs >= 1 && hrs <= 16)) return toast('An event can run from 1 to 16 hours');
        var stSel = $('#setting [aria-pressed="true"]'), stv = stSel && stSel.dataset.v;
        if (stv === 'restaurant' && g > 40) return toast('Ordering from the menu works for groups up to about 40. Choose a private room or an event venue for ' + g.toLocaleString('en-US') + ' people.');
        if (stv === 'privateRoom' && g > 150) return toast('Private dining rooms hold up to about 150. Choose an event venue for ' + g.toLocaleString('en-US') + ' people.');
        if (stv === 'home' && g > 150) return toast('Home events work for up to about 150 people. Choose a venue or outdoors for ' + g.toLocaleString('en-US') + '.');
        if (ex > g && !draft.expectedTouched) { ex = g; $('#expected').value = g; }   /* the folded 'expected' follows the guest count unless she set it */
        if (ex > g) { var md2 = $('details.more'); if (md2) md2.open = true; $('#expected').focus(); return toast('Expected to attend can’t be more than the number of people you’re inviting'); }
        if ($('#date').value && $('#date').value < todayISO()) { var md = $('details.more'); if (md) md.open = true; $('#date').focus(); return toast('That date has already passed. Choose an upcoming date, or leave it blank for now.'); }
        if (/^Other /.test($('#city').value) && !$('#cityOther').value.trim()) { $('#cityOther').focus(); var cv = ($('#country') || {}).value || 'US'; return toast(cv === 'CA' ? 'Type your city and province' : cv === 'US' ? 'Type your city and state' : 'Type your city'); }
        if (!$('#setting [aria-pressed="true"]')) { $('#whereLbl').scrollIntoView({ block: 'center' }); return toast('Choose where it is: a restaurant, a venue, outdoors or at home'); }
        collect2(); persist();
        T('details_done', { event_type: draft.type, setting: draft.settingOpen ? 'not_sure' : draft.setting, city: D.CITIES.some(function (c) { return c.name === draft.city; }) ? draft.city : E.countryOf(draft.city).other, country: E.countryOf(draft.city).id, guests_band: band(draft.guests, [10, 25, 50, 100, 200, 500]), budget_band: draft.budget ? band(draft.budget, [1000, 3000, 5000, 10000, 25000, 50000, 100000]) : 'none', drinks: draft.alcohol, payer: draft.payer, kids: draft.kids ? 'yes' : 'no', start: E.inspoOf(draft) ? 'inspiration_photo' : draft.inspiration.photos.length ? 'own_photos' : draft.inspiration.text ? 'words' : 'colors_and_vibes', own_photos: draft.inspiration.photos.length });
        T('concepts_requested', { event_type: draft.type });   /* no extra review page: straight to the looks */
        var nev = draft; nev.paid = null; nev.created = nev.created || new Date().toISOString().slice(0, 10);
        if (!saveEvent(nev)) return;
        removeDraft(nev.id); draft = null; JUST_CREATED[nev.id] = true;
        location.hash = '#/e/' + nev.id + '/concepts';
      });
      return;
    }
    // step 3: confirm the details before anything is generated. Planning is free; payment comes at the end, to keep and share.
    var setName = (D.SETTINGS.find(function (x) { return x.id === draft.setting; }) || {}).name || 'Not chosen';
    var rowsHtml = [
      ['Event', esc(E.typeName(draft)) + (draft.name && draft.name !== E.typeName(draft) ? ' · ' + esc(draft.name) : '')],
      ['Where', (draft.settingOpen ? 'Not decided yet: your plan compares a restaurant, a venue, outdoors and home' : esc(setName)) + ', ' + esc(draft.city)],
      ['When', draft.date ? esc(fmtDate(draft.date)) + ' at ' + esc(fmtTime(draft.time)) : 'Date not set yet, ' + esc(fmtTime(draft.time))],
      ['People', draft.guests.toLocaleString('en-US') + (draft.guests === 1 ? ' person' : ' people') + ' invited' + (draft.expected && draft.expected !== draft.guests ? ', about ' + draft.expected.toLocaleString('en-US') + ' expected' : '') + (draft.kids ? ', children attending' : '')],
      ['Budget', draft.budget ? 'Up to ' + money(draft.budget) + ' for the event' : 'No limit set; you’ll see three spending levels'],
      ['Drinks', { none: 'No alcohol', wine: 'Beer and wine', full: 'Full bar or cocktails' }[draft.alcohol || 'full']],
      ['Who’s paying', { host: 'You’re hosting and paying', own: 'Everyone pays their own', shared: 'Splitting the cost' }[draft.payer || 'host']],
      ['Must-haves', (draft.priorities || []).length ? esc(draft.priorities.map(function (id) { var m = MUSTS.find(function (x) { return x[0] === id; }); return m ? m[1] : id; }).join(', ')) : 'None picked'],
      ['Inspiration', [E.inspoOf(draft) ? 'Inspiration photo: ' + esc(E.inspoOf(draft).name) : '', draft.inspiration.photos.length ? plural(draft.inspiration.photos.length, 'photo') : '', draft.inspiration.text ? '“' + esc(draft.inspiration.text.slice(0, 120)) + (draft.inspiration.text.length > 120 ? '…' : '') + '”' : '', (draft.inspiration.vibes || []).length ? esc(draft.inspiration.vibes.join(', ')) : ''].filter(Boolean).join(' · ') || 'None']
    ];
    frame('<div class="wizard stack-lg">' + prog + '<div class="stack"><h2>Does this look right?</h2><p class="muted">Your concepts, prices and timeline are built from these details. Fix anything before we start.</p></div>' +
      '<div class="panel confirm">' + rowsHtml.map(function (r) { return '<div class="crow"><span class="muted small">' + r[0] + '</span><span>' + r[1] + '</span></div>'; }).join('') + '</div>' +
      '<p class="muted small">' + (CFG.app ? 'Planning and keeping your plan are free in the app.' : 'Planning is free. You only pay if you want to keep your plan and share it with guests.') + '</p>' +
      '<div class="wiz-act"><button class="btn gold" id="go">Create my concepts</button><a class="btn ghost" href="' + W + '2/' + draft.id + '">Edit details</a>' + laterBtn() + '</div></div>');
    $('#later').addEventListener('click', function () { persist(); location.hash = '#/events'; setTimeout(function () { toast('Saved. Pick it up anytime from My events.'); }, 80); });
    if (AI.live) AI.concepts(draft, []);   /* start the AI now; it's usually ready by the time the host taps Create */
    $('#go').addEventListener('click', function () {
      var btn = this; if (btn.disabled) return; btn.disabled = true; btn.textContent = 'Starting…';   // no double submits
      T('concepts_requested', { event_type: draft.type });
      var ev = draft; ev.paid = null; ev.created = ev.created || new Date().toISOString().slice(0, 10);
      if (!saveEvent(ev)) { btn.disabled = false; btn.textContent = 'Create my concepts'; return; }
      removeDraft(ev.id); draft = null; JUST_CREATED[ev.id] = true;
      location.hash = '#/e/' + ev.id + '/concepts';
    });
  }

  /* ---------- concepts ---------- */
  function conceptsView(id) {
    var ev = getEvent(id); if (!ev) return notFound(); E.useCountry(ev.city); SHOP_COUNTRY = E.countryOf(ev.city);
    frame('<div class="stack-lg"><div class="stack"><h2>Three looks for ' + (ev.nameAuto ? 'your ' + esc(E.typeName(ev).toLowerCase().replace(/christmas/, 'Christmas')) : esc(ev.name)) + '</h2><p class="muted">Each look has its own colors, atmosphere and decor. Pick one to see what it costs, venues in your city, vendors, menu and timeline.</p><p class="small muted">' + (function () { var ins = ev.inspiration || {}, src = []; if (ins.inspo) src.push('the inspiration photo you chose'); if ((ins.photos || []).length) src.push('your photos'); if (ins.text) src.push('your description'); if ((ins.vibes || []).length) src.push('the colors and vibes you picked'); return src.length ? 'Built from ' + (src.length > 1 ? src.slice(0, -1).join(', ') + ' and ' + src[src.length - 1] : src[0]) + '.' : 'Built from your event details.'; })() + '</p></div><div id="cs" class="concepts"><div class="loading-concepts" role="status"><span class="spin" aria-hidden="true"></span><span id="lmsg">Reading your inspiration…</span></div></div>' +
      '<p class="small muted" id="srcNote" hidden></p>' + (ev.usedMoreConcepts && !SELL_EXTRAS ? '' : '<div class="row"><button class="btn ghost" id="more">Show three different concepts</button><span class="muted small">You can see three new looks once, free.</span></div>') + '</div>');
    var msgs = ['Reading your inspiration…', 'Choosing colors and decor…', 'Matching the look to your event…', 'Almost ready…'], mi = 0;
    var tick = setInterval(function () { var m = $('#lmsg'); if (!m) return clearInterval(tick); mi = Math.min(msgs.length - 1, mi + 1); m.textContent = msgs[mi]; }, 2500);
    function render(list) {
      clearInterval(tick);
      var shown = list.map(function (c) { return c.inspo; }).filter(Boolean).concat(E.inspoOf(ev) ? [E.inspoOf(ev).id] : []);
      $('#cs').innerHTML = list.map(function (c, i) {
        var sel = ev.concept && ev.concept.id === c.id;
        var own = c.inspo && E.inspoOf({ inspiration: { inspo: c.inspo } }), like = own ? null : E.similarPhoto(c, ev, shown); if (like) shown.push(like.id);   /* every look shows a labeled inspiration photo */
        return '<article class="concept' + (sel ? ' selected' : '') + '">' + (own ? thumb({ src: INSPO_IMG + 'sm/' + c.inspo + '.jpg', alt: 'The inspiration photo you chose', ai: true }) : like ? '<div class="thumb"><img src="' + esc(srcOf(INSPO_IMG + 'sm/' + like.id + '.jpg')) + '" alt="AI-generated inspiration with a similar look" loading="lazy" onerror="this.parentNode.classList.add(\'noimg\');this.remove()"><span class="ai-tag">AI-generated inspiration \u00b7 similar look</span></div>' : '') + '<div class="in"><span class="concept-num">Concept ' + (i + 1) + ' of ' + list.length + '</span><span class="badge est">' + esc(sel ? 'Your current choice' : c.fit) + '</span><h3>' + esc(c.name) + '</h3>' + dots(c.palette, c.styleName + ' colors') + '<p class="muted">' + esc(moodFor(c, ev)) + '</p><ul>' + outlineFor(c, ev).map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul><button class="btn ' + (i === 0 ? 'gold' : '') + ' block" data-i="' + i + '" aria-label="Choose ' + esc(c.name) + '">Choose this concept</button></div></article>';
      }).join('');
    }
    function load(skip) {
      var t0 = Date.now();
      AI.concepts(ev, skip).then(function (list) {
        T(skip && skip.length ? 'concepts_more_shown' : 'concepts_shown', { source: AI.source || 'library', wait_seconds: Math.round((Date.now() - t0) / 100) / 10, event_type: ev.type, from_photo: E.inspoOf(ev) ? 'yes' : 'no' });
        ev.concepts = list; saveEvent(ev); render(list);
        var n = $('#srcNote'); if (n) { n.hidden = !(AI.live && AI.source === 'library'); n.textContent = 'Our AI is busy right now, so these three come from the Event Couture style library. Nothing extra was used. Try again later for fresh AI ideas.'; }
      });
    }
    if (ev.concepts && ev.concepts.length) render(ev.concepts); else load([]);
    $('#cs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]'); if (!b) return;
      ev.concept = ev.concepts[+b.dataset.i]; T('concept_chosen', { look: ev.concept.inspo || ev.concept.id, position: +b.dataset.i + 1, from_photo: ev.concept.inspo ? 'yes' : 'no', event_type: ev.type }); if (ev.nameAuto) ev.name = ev.concept.name; saveEvent(ev); location.hash = '#/e/' + ev.id;
    });
    if ($('#more')) $('#more').addEventListener('click', function () {
      ev.seen = (ev.seen || []).concat(ev.concepts.map(function (c) { return c.id; }));
      ev.seenLooks = (ev.seenLooks || []).concat(ev.concepts.map(function (c) { return c.name; }));
      if (ev.usedMoreConcepts && SELL_EXTRAS) {
        return buySheet({ name: 'Three more event concepts', price: 7.99, credits: 16, desc: D.PACKAGES[0].desc }, ev, function () { load(ev.seen); });
      }
      if (ev.usedMoreConcepts) return;
      ev.usedMoreConcepts = true; saveEvent(ev); load(ev.seen); $('#more').closest('.row').remove();
    });
  }

  /* ---------- Keep this plan: the Event Pass, asked for once the plan is built ---------- */
  function isKept(ev) { return ev.sample || !!(ev.paid && ev.paid.price !== undefined); }
  /* Free preview: every section shows a taste; keeping the plan reveals the rest. Sample plans are always complete. */
  function preview(ev) { return false; }   /* planning shows everything; the pass is asked for only when she shares or saves her plan */
  function cut(arr, n, ev) { return preview(ev) ? arr.slice(0, n) : arr; }
  function more(ev, total, shown, noun) {
    if (!preview(ev) || total <= shown) return '';
    return '<div class="lock-card"><div class="ghost-rows" aria-hidden="true"><i></i><i></i><i></i></div><p><b>' + (total - shown) + ' more ' + esc(noun) + '</b> ' + (total - shown === 1 ? 'is' : 'are') + ' in your plan.</p><button class="btn small" data-keep>Keep my plan to see everything</button></div>';
  }
  var LOCKED_TABS = { guests: 'Your guest list, RSVPs and seating', votes: 'Voting with guests and co-hosts', after: 'Your shared album and thank-you notes' };
  /* Access rule: 12 months after keeping, or 30 days after the event, whichever is later. */
  function accessUntil(ev, from) {
    var kept = from ? new Date(from) : new Date();
    var a = new Date(kept); a.setFullYear(a.getFullYear() + 1);
    if (ev.date) { var b = new Date(ev.date + 'T12:00:00'); b.setDate(b.getDate() + 30); if (b > a) a = b; }
    return a.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  /* Event passes are priced in US dollars: "US$" whenever the plan is in another currency */
  function usdSign() { return E.currency() === 'USD' && E.symOf('USD') === '$' ? '$' : 'US$'; }
  function usd2(n) { return usdSign() + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function keepSheet(ev, why, onDone) {
    var pass = E.passFor(ev.guests), FREE = CFG.app || CFG.launchFree;
    /* In the iPhone and Android apps, keeping a plan is free until in-app purchase is connected, so no prices are shown there. */
    sheet('<h3>' + esc(why || 'Keep your plan') + '</h3><p class="muted">' + (FREE ? 'Keeping ' + esc(ev.name) + ' is free ' + (CFG.app ? 'in the app' : 'during our launch') + '. Guests never pay to view, RSVP or vote.' : 'One payment for ' + esc(ev.name) + ', ' + esc(pass.label.toLowerCase()) + '. No subscription. Guests never pay to view, RSVP or vote.') + '</p>' +
      (FREE ? '' : '<div class="price-big num">$' + pass.price.toFixed(2) + '</div>') +
      '<ul class="incl"><li><span>Send your invitation, collect RSVPs and save your finished plan as a PDF</span></li><li><span>Saved with every edit until <b>' + esc(accessUntil(ev)) + '</b></span></li><li><span>Guest list, RSVPs' + (ev.setting === 'restaurant' ? '' : ', seating') + ', voting' + (hasRegistry(ev) ? ' and registry' : '') + (canSplit(ev) ? ' and cost splitting' : '') + '</span></li><li><span>Checklist with due dates and your day-of schedule</span></li></ul>' +
      (SHARING ? '<p class="muted small">Your plan is saved on this ' + (CFG.app ? 'phone' : 'device') + '. Guests RSVP from your invitation link on their own phones.</p>' : CFG.app ? '<p class="muted small">Your plan is saved on this phone. Send your invitation from the Invitation page.</p>' : CFG.preview ? '<p class="muted small">Right now your plan is saved on this device. Sending your invitation to guests on their own phones turns on when accounts launch.</p>' : '') +
      (FREE ? '' : '<p class="muted small">Guest list grows past ' + pass.max.toLocaleString('en-US') + '? You pay only the difference.</p>') +
      (CFG.preview && !FREE ? '<div class="note">Preview version: no payment is taken.</div>' : '') +
      '<button class="btn gold block" id="keepPay">' + (CFG.preview ? 'Keep my plan' : 'Pay ' + usd2(pass.price) + ' and keep my plan') + '</button><button class="btn ghost block" data-close>Not now</button>', function (el, close) {
      $('#keepPay', el).addEventListener('click', function () {
        ev.paid = { price: pass.price, max: pass.max, at: new Date().toISOString() };
        T('plan_kept', { pass: pass.label, value: CFG.preview ? 0 : pass.price, pass_price: pass.price, currency: 'USD', event_type: ev.type, preview: CFG.preview ? 'yes' : 'no' });
        addLedger({ kind: 'Event Pass', event: ev.name, amount: CFG.preview ? 0 : pass.price, note: pass.label + (CFG.preview ? ' (preview)' : '') });
        saveEvent(ev); close(); toast('Your plan is kept'); onDone && onDone();
      });
    });
  }
  /* ---------- purchase sheet (fair-selling: exact scope, price, continue without) ---------- */
  function buySheet(item, ev, onDone) {
    var w = wallet();
    var canCredits = item.credits && w.credits >= item.credits;
    sheet('<h3>' + esc(item.name) + '</h3><p class="muted">' + esc(item.desc) + '</p>' +
      '<div class="sum"><div><span>Price</span><b class="num">$' + item.price.toFixed(2) + '</b></div>' + (item.credits ? '<div><span>Or with credits</span><span class="num">' + item.credits + ' credits (you have ' + w.credits + ')</span></div>' : '') + '</div>' +
      '<p class="muted small">Charged once, only when it’s delivered. Failed results never cost anything.</p>' +
      (CFG.preview ? '<div class="note">' + (CFG.launchFree ? 'Free during our launch.' : 'Preview version: no payment is taken.') + '</div>' : '') +
      '<button class="btn gold block" id="buy">' + (CFG.preview ? 'Add it' : 'Pay ' + usd2(item.price)) + '</button>' +
      (canCredits ? '<button class="btn block" id="useCredits">Use ' + item.credits + ' credits</button>' : '') +
      '<button class="btn ghost block" data-close>Continue without this</button>', function (el, close) {
      $('#buy', el).addEventListener('click', function () { addLedger({ kind: item.name, event: ev ? ev.name : '', amount: CFG.preview ? 0 : item.price, note: CFG.preview ? 'preview' : '' }); close(); toast('Added'); onDone && onDone(); });
      var uc = $('#useCredits', el); if (uc) uc.addEventListener('click', function () { var w2 = wallet(); w2.credits -= item.credits; saveWallet(w2); addLedger({ kind: item.name, event: ev ? ev.name : '', amount: 0, note: item.credits + ' credits' }); close(); toast('Added'); onDone && onDone(); });
    });
  }

  /* ---------- plan workspace ---------- */
  var TABS = [['overview', 'Overview'], ['budget', 'Budget'], ['places', 'Venues'], ['vendors', 'Vendors'], ['food', 'Food and drink'], ['style', 'Style and music'], ['timeline', 'Timeline'], ['guests', 'Guests'], ['votes', 'Voting'], ['invite', 'Invite and registry'], ['after', 'Photos and thank-yous'], ['extras', 'Extras']];
  /* The 12 pages, grouped into 4 sections so the plan is easy to find your way around on a phone. */
  var TAB_GROUPS = [
    ['Overview', [['overview', 'Summary'], ['plan', 'Your finished plan'], ['style', 'Style and music'], ['extras', CFG.app ? 'Plan details' : 'Your pass']]],
    ['Budget & bookings', [['budget', 'Book and budget'], ['food', 'Food and drink']]],
    ['Guests & invitations', [['guests', 'Guests'], ['invite', 'Invite and registry'], ['votes', 'Voting'], ['after', 'Photos and thank-yous']]],
    ['Tasks & timeline', [['timeline', 'Checklist and schedule']]]
  ];
  function tierName(id) { if (id === 'F') return 'Your budget plan'; var t = D.TIERS.find(function (x) { return x.id === id; }); return t ? t.name : id; }
  function groupOf(tab) { if (tab === 'places' || tab === 'vendors') return 1; for (var i = 0; i < TAB_GROUPS.length; i++) if (TAB_GROUPS[i][1].some(function (t) { return t[0] === tab; })) return i; return 0; }
  function planView(ev, tab) {
    E.useCountry(ev.city); SHOP_COUNTRY = E.countryOf(ev.city);
    if (!ev.concept) { location.hash = '#/e/' + ev.id + '/concepts'; return; }
    var base = ev.sample ? '#/sample/' + ev.id.split('-')[1] : '#/e/' + ev.id;
    var save = function () { if (!ev.sample) saveEvent(ev); };
    var b = E.budget(ev, ev.tier);
    var hp = eventPhoto(ev);
    var head = '<div class="plan-head">' + (hp ? thumb(hp, 'banner') : '<div class="swatch" aria-hidden="true">' + (ev.concept.palette || []).map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div>') +
      '<div class="plan-row"><div style="min-width:0"><h2>' + esc(ev.name) + (ev.sample ? '' : ' <button class="link small" id="rename" style="font-family:var(--body)">Rename</button>') + '</h2><div class="meta">' + (ev.concept.styleName && ev.concept.styleName !== ev.name ? '<span>' + esc(ev.concept.styleName) + '</span>' : '') + '<span>' + (ev.sample ? esc(fmtDate(ev.date)) + (ev.time && ev.date ? ', ' + fmtTime(ev.time) : '') : '<button class="link small" id="when" aria-label="Date and time: ' + esc(ev.date ? fmtDate(ev.date) : 'not set') + '. Change">' + (ev.date || ev.dateFrom ? esc(whenText(ev)) : 'Add your date') + '</button>') + '</span><span>' + esc(ev.city) + '</span><span>' + (ev.sample ? plural(ev.guests, 'guest') : '<button class="link small" id="guestsBtn" aria-label="' + plural(ev.guests, 'guest') + '. Change">' + plural(ev.guests, 'guest') + '</button>') + '</span><span>' + (ev.sample ? esc(settingName(ev)) : '<button class="link small" id="where" aria-label="Where it happens: ' + esc(settingName(ev)) + '. Change">' + esc(settingName(ev)) + '</button>') + '</span></div></div>' +
      '<div class="plan-total"><div class="display num" style="font-size:1.9rem">' + money(b.total) + '</div><div class="muted small">' + 'Estimated total \u00b7 ' + (b.tier.id === 'F' ? (b.shortBy ? 'Closest plan, ' + money(b.shortBy) + ' over your budget' : 'Fits your ' + money(ev.budget) + ' budget') : esc(b.tier.name)) + '</div></div></div>' +
      (ev.sample ? '<div class="note">This is a sample plan. <a href="#/new">Start your own</a> to edit it with your details.</div>' : '') + '</div>';
    if (!TAB_VIEWS[tab]) tab = 'overview';
    var gi = groupOf(tab);
    var groupBar = '<nav class="groupbar" aria-label="Plan sections">' + TAB_GROUPS.map(function (g, i) { return '<a href="' + base + '/' + g[1][0][0] + '"' + (i === gi ? ' aria-current="true"' : '') + '>' + esc(g[0]) + '</a>'; }).join('') + '</nav>';
    var rail = '<nav class="rail" aria-label="Pages in this section">' + TAB_GROUPS.map(function (g, i) {
      return '<div class="rg' + (i === gi ? ' on' : '') + (g[1].length === 1 ? ' solo' : '') + '"><span class="rg-h">' + esc(g[0]) + '</span>' + g[1].map(function (t) { return '<a href="' + base + '/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + (t[0] === 'invite' && !hasRegistry(ev) ? (canSplit(ev) ? 'Invite and payments' : 'Invitation') : t[1]) + '</a>'; }).join('') + '</div>';
    }).join('') + '</nav>';
    var lockedTab = preview(ev) && LOCKED_TABS[tab];
    var body = lockedTab ? '<div class="stack"><div class="lock-card big"><h3>' + esc(LOCKED_TABS[tab]) + '</h3><p class="muted">Keep your plan to invite guests, track RSVPs and plan together. Your concept and estimates stay exactly as they are.</p><button class="btn" data-keep>Keep my plan</button></div></div>' : (TAB_VIEWS[tab] || TAB_VIEWS.overview)(ev, b);
    var keepBar = isKept(ev) || ev.keepNoteHidden ? '' : '<div class="keep-note small muted"><span>' + (CFG.app ? 'Planning is free.' : CFG.launchFree ? 'Planning and keeping your plan are free during our launch.' : 'Planning is free. You pay once, ' + usd2(E.passFor(ev.guests).price) + ', only when you share your invitation or save your plan.') + '</span><button class="link small quiet" id="keepNoteX" aria-label="Hide this note">Got it</button></div>';
    frame(head + keepBar + groupBar + '<div class="workspace">' + rail + '<section id="tab" class="stack-lg" style="min-width:0">' + body + '</section></div>');
    var kn = $('#keepNoteX'); if (kn) kn.addEventListener('click', function () { ev.keepNoteHidden = true; saveEvent(ev); kn.closest('.keep-note').remove(); });
    if (!ev.sample) syncQuotes(ev);
    if (!ev.sample && isKept(ev) && ev.published) { publishInvite(ev).catch(function () {}); syncInbox(ev, function () { if (location.hash.indexOf('#/e/' + ev.id) === 0 && !document.querySelector('.sheet-back')) planView(ev, tab); }); }   /* guests' RSVPs come in; edits reach the shared invitation */
    var cur = $('.rail [aria-current]'); if (cur && cur.scrollIntoView && window.innerWidth < 960) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
    var rn = $('#rename'); if (rn) rn.addEventListener('click', function () {
      sheet('<h3>Rename your event</h3><input class="input" id="nn" maxlength="80" value="' + esc(ev.name) + '"><div class="chips">' + suggestNames(ev, ev.type).map(function (n) { return '<button type="button" class="chip" data-name="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') + '</div><button class="btn gold block" id="ok">Save name</button><button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        el.addEventListener('click', function (e) { var b = e.target.closest('[data-name]'); if (b) $('#nn', el).value = b.dataset.name; });
        $('#ok', el).addEventListener('click', function () { var n = $('#nn', el).value.trim(); if (!n) return toast('Enter a name'); ev.name = n; ev.nameAuto = false; save(); close(); planView(ev, tab); });
      });
    });
    var wn = $('#when'); if (wn) wn.addEventListener('click', function () {
      var rng = !ev.date && !!ev.dateFrom;
      sheet('<h3>When is it?</h3><p class="muted">Your checklist due dates and day-of schedule update to match.</p><div class="seg" id="wmode"><button type="button" data-m="one" aria-pressed="' + !rng + '">I have a date</button><button type="button" data-m="range" aria-pressed="' + rng + '">Not sure yet: a range</button></div><label class="field" id="wdOne"' + (rng ? ' hidden' : '') + '><span>Date</span><input class="input" type="date" id="wd" min="' + todayISO() + '" value="' + esc(ev.date || '') + '"></label><div class="grid2" id="wdRange"' + (rng ? '' : ' hidden') + '><label class="field"><span>Earliest date</span><input class="input" type="date" id="wf" min="' + todayISO() + '" value="' + esc(ev.dateFrom || '') + '"></label><label class="field"><span>Latest date</span><input class="input" type="date" id="wl" min="' + todayISO() + '" value="' + esc(ev.dateTo || '') + '"></label></div><label class="field"><span>Start time</span><input class="input" type="time" id="wt" value="' + esc(ev.time || '18:00') + '"></label><label class="field"><span>How many hours</span><input class="input" type="number" min="1" max="16" id="wh" value="' + (ev.hours || 3) + '"></label><button class="btn gold block" id="ok">Save</button><button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        $$('#wmode [data-m]', el).forEach(function (m) { m.addEventListener('click', function () { $$('#wmode [data-m]', el).forEach(function (x) { x.setAttribute('aria-pressed', x === m); }); $('#wdOne', el).hidden = m.dataset.m !== 'one'; $('#wdRange', el).hidden = m.dataset.m === 'one'; }); });
        $('#ok', el).addEventListener('click', function () { var bf = snap(ev); bf.date = ev.date; bf.time = ev.time; bf.dateFrom = ev.dateFrom; bf.dateTo = ev.dateTo;
          if ($('#wmode [data-m=range]', el).getAttribute('aria-pressed') === 'true') { var f = $('#wf', el).value, l = $('#wl', el).value || f; if (!f) return toast('Choose the earliest date'); if (f < todayISO()) return toast('That date has already passed. Choose an upcoming date.'); if (l < f) return toast('The latest date is before the earliest'); ev.date = ''; ev.dateFrom = f; ev.dateTo = l; ev.time = $('#wt', el).value || ev.time; ev.hours = Math.min(16, Math.max(1, +$('#wh', el).value || ev.hours || 3)); delete ev.ros; save(); close(); planView(ev, tab); return undoToast(ev, bf, 'Date range saved', function () { planView(ev, tab); }); }
          if ($('#wd', el).value && $('#wd', el).value < todayISO()) return toast('That date has already passed. Choose an upcoming date.'); if ($('#wd', el).value) { delete ev.dateFrom; delete ev.dateTo; } ev.date = $('#wd', el).value; ev.time = $('#wt', el).value || ev.time; ev.hours = Math.min(16, Math.max(1, +$('#wh', el).value || ev.hours || 3)); delete ev.ros; save(); close(); planView(ev, tab); undoToast(ev, bf, 'Date and time updated', function () { planView(ev, tab); }); });
      });
    });
    var gb = $('#guestsBtn'); if (gb) gb.addEventListener('click', function () {
      sheet('<h3>How many guests?</h3><p class="muted">Count everyone you\u2019re inviting, including plus-ones. Prices, food amounts and the checklist update to match.</p><label class="field"><span>Guests</span><input class="input num" type="number" min="1" max="20000" inputmode="numeric" id="gn" value="' + ev.guests + '"></label><button class="btn gold block" id="ok">Update</button><button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        var go = function () {
          var n = Math.round(+$('#gn', el).value); if (!(n >= 1)) return toast('Enter how many guests'); if (n > 20000) return toast('Event Couture plans events for up to 20,000 people.');
          var lim = tooBigFor(ev.setting, n); if (lim) return toast(tooBigText(ev.setting, n, lim));
          if (ev.paid && ev.paid.max && n > ev.paid.max) { if (CFG.app || CFG.launchFree) ev.paid.max = E.passFor(n).max; else return toast(plural(n, 'guest') + ' is more than your pass covers (' + ev.paid.max + '). Move up a size under Overview, Your pass first.'); }
          var bf = snap(ev); ev.guests = n; ev.expected = Math.min(ev.expected || n, n); delete ev.ros; save(); close(); planView(ev, tab); undoToast(ev, bf, 'Updated for ' + plural(n, 'guest'), function () { planView(ev, tab); });
        };
        $('#ok', el).addEventListener('click', go); $('#gn', el).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      });
    });
    var wh = $('#where'); if (wh) wh.addEventListener('click', function () {
      sheet('<h3>Where is it?</h3><p class="muted">Prices, venues, checklist and timeline update to match.</p><div class="stack">' + D.SETTINGS.concat([{ id: 'ballroom', name: 'Hotel ballroom' }]).map(function (st) { return '<button class="btn ' + ((st.id === 'ballroom' ? ev.venueKind === 'ballroom' : st.id === (ev.setting || 'indoor') && !(st.id === 'indoor' && ev.venueKind === 'ballroom')) ? 'gold' : 'ghost') + ' block" data-set="' + st.id + '"' + (tooBigFor(st.id, ev.guests) ? ' aria-disabled="true" style="opacity:.5"' : '') + '>' + esc(st.name) + (tooBigFor(st.id, ev.guests) ? ' <span class="small">(up to ' + tooBigFor(st.id, ev.guests) + ')</span>' : '') + '</button>'; }).join('') + '</div><button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        el.addEventListener('click', function (e) { var bt = e.target.closest('[data-set]'); if (!bt) return; var sv = bt.dataset.set === 'ballroom' ? 'indoor' : bt.dataset.set; var lim = tooBigFor(sv, ev.guests); if (lim) return toast(tooBigText(sv, ev.guests, lim)); var bf = snap(ev); ev.setting = sv; ev.venueKind = bt.dataset.set === 'ballroom' ? 'ballroom' : ''; ev.settingOpen = false; if (ev.setting === 'restaurant' && ev.hours > 3) ev.hours = 2; save(); close(); planView(ev, tab); undoToast(ev, bf, 'Updated for ' + settingName(ev).toLowerCase(), function () { planView(ev, tab); }); });
      });
    });
    var bind = TAB_BIND[tab]; if (bind && !lockedTab) bind(ev, save, function () { planView(ev, tab); });
    $$('[data-keep]').forEach(function (k) { k.addEventListener('click', function () { keepSheet(ev, 'Keep your plan', function () { planView(ev, tab); }); }); });
  }
  /* "Not sure yet": compare every place the event could happen, priced for this plan, and let the host pick. */
  function whereCompare(ev) {
    var g = ev.guests || 0;
    var opts = [['restaurant', 'Restaurant, ordering from the menu', 'No venue, catering or setup; simplest and often cheapest.', 'Table decor only; group size limits.', g <= 40],
      ['privateRoom', 'Private room at a restaurant', 'Food, service and a room in one booking.', 'Food and drink minimums and a set end time.', g <= 150],
      ['indoor', 'Event venue', 'Full control of decor, music and dancing.', 'You book catering, rentals and setup.', true],
      ['outdoor', 'Outdoors', 'Big, beautiful space and great photos.', 'Needs a tent, restrooms, power and a rain plan.', true],
      ['home', 'At home', 'No venue cost and the most personal.', 'Setup, cleanup and parking fall on you.', g <= 150]].filter(function (o) { return o[4]; });
    var rows = opts.map(function (o) { var t = Object.assign({}, ev, { setting: o[0] }); return { id: o[0], name: o[1], pro: o[2], con: o[3], total: E.budget(t, t.tier).total }; }).sort(function (a, b) { return a.total - b.total; });
    return '<div class="panel stack where-compare"><h3>Where should you host it?</h3><p class="muted small">You haven\u2019t decided yet, so here is this same plan priced in each kind of place. Your plan uses an event venue until you choose.</p><div class="list">' +
      rows.map(function (r) { return '<div class="it"><div class="grow"><b>' + esc(r.name) + '</b> <span class="num">about ' + money(r.total) + '</span>' + (ev.budget ? (r.total <= ev.budget ? ' <span class="badge ok">Fits your budget</span>' : '') : '') + '<div class="small muted">Pros: ' + esc(r.pro) + ' Cons: ' + esc(r.con) + '</div></div><span class="acts"><button class="btn small ghost" data-pickwhere="' + r.id + '">Choose</button></span></div>'; }).join('') + '</div></div>';
  }
  function bindWhere(ev, rerender) {
    $$('[data-pickwhere]').forEach(function (bt) { bt.addEventListener('click', function () { if (lockSample(ev)) return; var bf = snap(ev); bf.settingOpen = true; ev.setting = bt.dataset.pickwhere; ev.settingOpen = false; if ((ev.setting === 'restaurant' || ev.setting === 'privateRoom') && ev.hours > 3) ev.hours = ev.setting === 'restaurant' ? 2 : 3; saveEvent(ev); rerender(); undoToast(ev, bf, 'Planned for ' + settingName(ev).toLowerCase(), rerender); }); });
  }
  /* How many people each kind of place can hold; the same limits as the planning form. */
  var SETTING_MAX = { restaurant: 40, privateRoom: 150, home: 150 };
  function tooBigFor(setting, guests) { var m = SETTING_MAX[setting]; return m && guests > m ? m : 0; }
  function tooBigText(setting, guests, m) { return { restaurant: 'Ordering from the menu works for groups up to about 40', privateRoom: 'Private dining rooms hold up to about 150', home: 'Home events work for up to about 150 people' }[setting] + '. Choose an event venue or outdoors for ' + guests.toLocaleString('en-US') + '.'; }
  function settingName(ev) { if (ev.settingOpen) return 'Not decided yet'; if (ev.venueKind === 'ballroom' && ev.setting === 'indoor') return 'Hotel ballroom'; var st = D.SETTINGS.find(function (x) { return x.id === (ev.setting || 'indoor'); }); return st ? st.short : 'Event venue'; }

  function lockSample(ev) { if (ev.sample) { toast('This is a sample. Start your own plan to make changes.'); return true; } return false; }

  var TAB_VIEWS = {}, TAB_BIND = {};

  /* ---------- Your plan, step by step: what's done, and the one thing to do next ---------- */
  var NOT_VENDORS = ['venue', 'privateDining', 'tent', 'restrooms', 'generator', 'permits', 'insurance', 'parking', 'restaurantFood', 'restaurantDrinks', 'cakeFee', 'tableDecor', 'favors', 'attire', 'invitations', 'cleanup', 'security', 'transport', 'officiant', 'mc'];
  /* A checklist step is done when the host ticked it, or when the plan already shows it (concept chosen, budget set, venue booked); her untick always wins. */
  function checkDone(ev, text) { var saved = ev.checklistDone && ev.checklistDone[text]; return saved === false ? false : !!(saved || (text.indexOf('Choose your concept') === 0 && ev.concept) || (text === 'Set the budget and guest count' && ev.guests && (ev.budget || ev.tier)) || (/^Book the venue|^Reserve/.test(text) && statusOf(ev, venueCat(ev)) === 'booked')); }
  function vendorCats(ev, b) { return b.items.filter(function (i) { return NOT_VENDORS.indexOf(i.id) < 0; }); }
  /* Once she has a package, every page counts the same vendors the package does. */
  function bookLines(ev, b) {
    if ((ev.packages || []).length) { var ids = pkgCats(ev, b).filter(function (c) { return c.kind === 'vendor'; }).map(function (c) { return c.cat; }); return b.items.filter(function (i) { return ids.indexOf(i.id) >= 0; }); }
    return vendorCats(ev, b);
  }
  function planSteps(ev, b) {
    var base = ev.sample ? '#/sample/' + ev.id.split('-')[1] : '#/e/' + ev.id, rest = ev.setting === 'restaurant';
    var vc = venueCat(ev), vst = statusOf(ev, vc), saved = savedFor(ev, vc).length;
    var vend = bookLines(ev, b), booked = vend.filter(function (i) { return statusOf(ev, i.id) === 'booked'; }).length;
    var where = ev.settingOpen ? { done: false, label: 'Decide where to host it', detail: 'Compare a restaurant, a venue, outdoors and home', href: base }
      : ev.setting === 'home' ? { done: true, label: 'Where: at home', detail: 'No venue to book' }
      : { done: vst === 'booked', label: rest ? 'Choose your restaurant' : ev.setting === 'privateRoom' ? 'Choose your private room' : 'Choose your venue', detail: vst === 'booked' ? 'Booked' : saved ? 'Front-runner: ' + pickOf(ev, vc).name + (saved > 1 ? ', ' + plural(saved, 'option') + ' to compare' : '') : 'Browse places that fit your plan, then mark the one you book', href: base + '/budget' };
    return [
      { done: true, label: 'Choose your look', detail: ev.concept.styleName, href: base + '/concepts' },
      { done: !!(ev.date || ev.dateFrom), label: 'Set your date', detail: ev.date || ev.dateFrom ? whenText(ev) : 'One date, or a range if you\u2019re not sure yet', act: 'when' },
      ev.setting === 'home' || ev.settingOpen ? null : { done: !!(ev.areaChosen || ev.area), label: 'Choose the area for your venue', detail: ev.area || 'Anywhere in ' + ev.city.split(',')[0], act: 'area' },
      where,
      { done: !vend.length || booked === vend.length, label: 'Choose your vendors', detail: vend.length ? booked + ' of ' + vend.length + ' booked' : 'No other vendors needed', href: base + '/budget' },
      { done: isKept(ev), label: 'Keep your plan', detail: isKept(ev) ? 'Saved and unlocked' : 'Unlocks every detail, invitations and RSVPs', act: 'keep' },
      { done: !!ev.invited || (ev.guestsList || []).some(function (g) { return g.status === 'yes' || g.status === 'declined'; }), label: 'Invite your guests', detail: (ev.guestsList || []).length ? plural(ev.guestsList.length, 'guest') + ' on your list' : 'Send your invitation link', href: base + '/invite' }
    ];
  }
  function stepsCard(ev, b) {
    if (ev.sample) return '';
    var st = planSteps(ev, b).filter(Boolean), n = st.filter(function (x) { return x.done; }).length, next = st.find(function (x) { return !x.done; });
    var base = '#/e/' + ev.id;
    return '<div class="panel stack steps-card"><div class="row" style="justify-content:space-between"><h3>Your plan, step by step</h3><span class="badge' + (next ? '' : ' ok') + '">' + n + ' of ' + st.length + ' done</span></div>' +
      '<ol class="psteps">' + st.map(function (x) { return '<li class="' + (x.done ? 'done' : x === next ? 'next' : '') + '"><span class="pk" aria-hidden="true">' + (x.done ? '\u2713' : '') + '</span><span class="grow"><b>' + esc(x.label) + '</b><span class="small muted">' + esc(x.detail || '') + '</span></span></li>'; }).join('') + '</ol>' +
      (next ? '<div class="row">' + (next.act ? '<button class="btn gold small" data-step="' + next.act + '">Next: ' + esc(next.label) + '</button>' : '<a class="btn gold small" href="' + next.href + '">Next: ' + esc(next.label) + '</a>') + '<a class="link small" href="' + base + '/plan">See your finished plan</a></div>'
        : '<div class="note"><b>Your plan is complete.</b> Everything is booked and your guests are invited. Save your finished plan to keep every detail in one place.</div><div class="row"><a class="btn gold small" href="' + base + '/plan">Open your finished plan</a></div>') + '</div>';
  }
  function bindSteps(ev, rerender) {
    $$('[data-step]').forEach(function (b2) { b2.addEventListener('click', function () {
      if (b2.dataset.step === 'when') { var w = $('#when'); if (w) w.click(); }
      if (b2.dataset.step === 'keep') keepSheet(ev, 'Keep your plan', rerender);
      if (b2.dataset.step === 'area') sheet('<h3>Where should your venue be?</h3><p class="muted small">Pick a neighborhood in ' + esc(ev.city.split(',')[0]) + ' or type your own. Your venue options and package look there first.</p>' + areaField(ev.city, ev.area || '', ['sArea', 'sAreaOther']) + '<button class="btn gold block" id="ok">Save area</button><button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        bindArea($('#sArea', el), $('#sAreaOther', el));
        $('#ok', el).addEventListener('click', function () { if (lockSample(ev)) return; ev.area = readArea($('#sArea', el), $('#sAreaOther', el)); ev.areaChosen = true; saveEvent(ev); close(); rerender(); toast(ev.area ? 'Venues near ' + ev.area : 'Venues anywhere in ' + ev.city.split(',')[0]); });
      });
    }); });
  }

  /* ---------- Your finished plan: everything in one place, to save as a PDF, print or share ---------- */
  TAB_VIEWS.plan = function (ev, b) {
    if (preview(ev)) return '<div class="stack"><div class="lock-card big"><h3>Your finished plan</h3><p class="muted">Everything you chose, in one place: your look, every cost, the venue and vendors you booked, the menu, what to buy, the playlist and your day-of schedule. Save it as a PDF, print it or share it with a co-host.</p><button class="btn" data-keep>Keep my plan to see it</button></div></div>';
    var c = ev.concept, ros = ev.ros || E.runOfShow(ev);
    var stTxt = function (cat) { var st = statusOf(ev, cat), ov = (ev.overrides || {})[cat]; return st === 'booked' ? 'Booked' + (ov && ov.note ? ': ' + ov.note : '') : st === 'quote' ? (ov && ov.opt ? 'Front-runner: ' + ov.note + ', quoted ' + money(ov.amount) : (ov && ov.source === 'vendor' ? 'Published price ' : 'Price added ') + money(ov.amount) + (ov && ov.note ? ' (' + ov.note + ')' : '')) : st === 'short' ? (function () { var pk = pickOf(ev, cat), o = savedFor(ev, cat).filter(function (x) { return x !== pk; }).map(function (x) { return x.name; }); return 'Front-runner: ' + pk.name + (o.length ? ' (also considering ' + o.join(' and ') + ')' : ''); })() : 'Still to book'; };
    var vend = [venueCat(ev)].concat(bookLines(ev, b).map(function (i) { return i.id; })).filter(function (x, i, a) { return a.indexOf(x) === i && b.items.some(function (it) { return it.id === x; }); });
    var skey = window.EC_SONG_KEY ? window.EC_SONG_KEY(c.music, ev.type, ev.kids) : '', plName = (E.culture(ev) && window.EC_CULTURE_SONGS && window.EC_CULTURE_SONGS[ev.culture] || {}).name || c.playlistName || (window.EC_SONG_NAMES && window.EC_SONG_NAMES[skey]) || 'Party Playlist';
    var todo = E.checklist(ev).filter(function (x) { return !checkDone(ev, x.text); }).slice(0, 6);
    var pieces = lookList(ev);
    var go = '#/e/' + ev.id + '/';
    var sec = function (h, inner, edit) { return '<section class="ps-sec"><div class="ps-h"><h3>' + h + '</h3>' + (edit && !ev.sample ? '<a class="ps-edit link small" href="' + go + edit[0] + '">' + edit[1] + '</a>' : '') + '</div>' + inner + '</section>'; };
    return '<div class="stack plan-sheet">' +
      '<div class="panel plan-save"><div><b>Save your plan</b><p class="small muted">Keep a copy as a PDF, email it to yourself or send it to a co-host. ' + (ev.sample ? '' : 'Don\u2019t love something? Tap Change or Replace next to it.') + '</p></div><div class="row plan-actions"><button class="btn gold small" id="pdfPlan">Save as PDF</button><button class="btn ghost small" id="mailPlan">Email it to me</button><button class="btn ghost small" id="sharePlan">Share</button>' + (window.ECNative && window.ECNative.isNative ? '' : '<button class="btn ghost small" id="printPlan">Print</button>') + '</div></div>' +
      '<div class="ps-head"><span class="small muted">' + esc(E.typeName(ev)) + '</span><h2>' + esc(ev.name) + '</h2><p>' + (ev.date ? esc(fmtDate(ev.date)) + (ev.time ? ' at ' + esc(fmtTime(ev.time)) : '') : 'Date to be set') + ' \u00b7 ' + esc(whereText(ev)) + ' \u00b7 ' + esc(settingName(ev)) + ' \u00b7 ' + plural(ev.guests, 'guest') + '</p><p class="small muted">Dress code: ' + esc(E.dressCode(ev, ev.tier)) + '</p>' + (ev.sample ? '' : '<button class="ps-edit link small" data-plan-when>Change date or time</button>') + '</div>' +
      sec('Your look', dots(c.palette, c.styleName + ' colors') + '<p><b>' + esc(c.styleName) + '.</b> ' + esc(moodFor(c, ev)) + '</p><ul class="incl">' + decorFor(c, ev).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>', ['concepts', 'Choose a different look']) +
      sec('Budget, ' + esc(tierName(b.tier.id)), '<div class="table-wrap"><table class="qty"><thead><tr><th>Item</th><th>Status</th><th>Amount</th></tr></thead><tbody>' + b.items.map(function (i) { var st = statusOf(ev, i.id); var oo = (ev.overrides || {})[i.id]; return '<tr><td>' + esc(i.name) + '</td><td class="small muted">' + (st === 'booked' ? (oo && oo.amount > 0 ? 'Booked' : 'Booked, estimate') : st === 'quote' ? 'Quote' : 'Estimate') + '</td><td class="n">' + money(i.mid) + '</td></tr>'; }).join('') + '<tr><td><b>Estimated total</b></td><td class="small muted">' + (ev.budget ? 'Budget ' + money(ev.budget) : '') + '</td><td class="n"><b>' + money(b.total) + '</b></td></tr></tbody></table></div><p class="small muted">Includes tax, service' + (tipsHere(ev) ? ', tips' : '') + ' and a 10% cushion. Amounts marked Quote or Booked are the prices you entered.</p>', ['budget', 'Change level or prices']) +
      sec('Venue and vendors', '<div class="list">' + vend.map(function (id) { var it = b.items.find(function (x) { return x.id === id; }), n = savedFor(ev, id).length; return '<div class="it"><span class="grow"><b>' + esc(catName(id, ev)) + '</b><span class="small muted"> ' + esc(stTxt(id)) + '</span></span><span class="num">' + money(it.mid) + '</span>' + (ev.sample ? '' : '<button class="ps-edit link small" data-plan-replace="' + id + '">' + (n > 1 ? 'Compare or replace' : n ? 'Replace' : 'Find one') + '</button>') + '</div>'; }).join('') + '</div>') +
      sec(ev.setting === 'restaurant' ? 'Look for these on the menu' : 'Menu', '<ul class="incl">' + menuItems(ev).map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>', ['food', 'Change menu']) +
      (pieces.length ? sec('Get this look', '<ul class="incl">' + pieces.map(function (p2) { return '<li>' + esc(p2.name) + (p2.hire ? ' <span class="small muted">(hire)</span>' : '') + '</li>'; }).join('') + '</ul>', ['style', 'Change pieces']) : '') +
      (ev.setting === 'restaurant' ? '' : sec('Music', '<p>' + esc(plName) + ': 25 songs on the Style and music page.</p>', ['style', 'Change music'])) +
      sec('Day-of schedule', '<div class="ros">' + ros.map(function (r) { return '<div><b>' + esc(r.time) + '</b><span>' + esc(r.text) + '</span></div>'; }).join('') + '</div>', ['timeline', 'Change schedule']) +
      (todo.length ? sec('Still to do', '<ul class="incl">' + todo.map(function (x) { return '<li>' + esc(x.text) + (x.due ? ' <span class="small muted">by ' + esc(fmtDate(x.due)) + '</span>' : '') + '</li>'; }).join('') + '</ul>') : '') +
      '<p class="small muted">Planned with Event Couture by Always Luxe. Prices are estimates unless marked Quote or Booked.</p></div>';
  };
  /* The finished plan as plain data, for the PDF, email and share. */
  function planData(ev) {
    var b = E.budget(ev, ev.tier), c = ev.concept, ros = ev.ros || E.runOfShow(ev);
    var st = function (cat) { var s2 = statusOf(ev, cat), ov = (ev.overrides || {})[cat], pk = pickOf(ev, cat), o = savedFor(ev, cat).filter(function (x) { return x !== pk; }).map(function (x) { return x.name; });
      return s2 === 'booked' ? 'Booked' + (ov && ov.note ? ': ' + ov.note : '') : s2 === 'quote' ? (ov && ov.opt ? 'Front-runner: ' + ov.note + ', quoted ' + money(ov.amount) : (ov && ov.source === 'vendor' ? 'Published price ' : 'Price added ') + money(ov.amount) + (ov && ov.note ? ' (' + ov.note + ')' : '')) : s2 === 'short' ? 'Front-runner: ' + pk.name + (o.length ? ' (also considering ' + o.join(' and ') + ')' : '') : 'Still to book'; };
    var vend = [venueCat(ev)].concat(bookLines(ev, b).map(function (i) { return i.id; })).filter(function (x, i, a) { return a.indexOf(x) === i && b.items.some(function (it) { return it.id === x; }); });
    var skey = window.EC_SONG_KEY ? window.EC_SONG_KEY(c.music, ev.type, ev.kids) : '', plName = (E.culture(ev) && window.EC_CULTURE_SONGS && window.EC_CULTURE_SONGS[ev.culture] || {}).name || c.playlistName || (window.EC_SONG_NAMES && window.EC_SONG_NAMES[skey]) || 'Party Playlist';
    var todo = E.checklist(ev).filter(function (x) { return !checkDone(ev, x.text); }).slice(0, 8);
    var hex = function (h) { return /^#[0-9a-f]{3}$/i.test(h) ? '#' + h.slice(1).split('').map(function (x) { return x + x; }).join('') : h; };
    var sections = [
      { h: 'Your look', p: c.styleName + '. ' + moodFor(c, ev), bullets: decorFor(c, ev) },
      { h: 'Budget, ' + tierName(b.tier.id), rows: b.items.map(function (i) { var s2 = statusOf(ev, i.id); var oo = (ev.overrides || {})[i.id]; return [i.name, s2 === 'booked' ? (oo && oo.amount > 0 ? 'Booked' : 'Booked, estimate') : s2 === 'quote' ? 'Quote' : 'Estimate', money(i.mid)]; }), total: ['Estimated total' + (ev.budget ? ' (budget ' + money(ev.budget) + ')' : ''), money(b.total)] },
      { h: 'Venue and vendors', rows: vend.map(function (id) { var it = b.items.find(function (x) { return x.id === id; }); var sv = savedFor(ev, id); var ct = sv.filter(function (x) { return siteOf(x) || x.phone; }).map(function (x) { return x.name + ', ' + String(siteOf(x) || x.phone).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''); }); return [catName(id, ev), st(id) + (ct.length ? '\nContact: ' + ct.join(' \u00b7 ') : ''), money(it.mid)]; }) },
      { h: ev.setting === 'restaurant' ? 'Look for these on the menu' : 'Menu', bullets: menuItems(ev) }
    ];
    var pieces = lookList(ev); if (pieces.length) sections.push({ h: 'Get this look', bullets: pieces.map(function (p2) { return p2.name + (p2.hire ? ' (hire)' : ''); }) });
    if (ev.setting !== 'restaurant') sections.push({ h: 'Music', p: plName + ': 25 songs on the Style and music page.' });
    sections.push({ h: 'Day-of schedule', times: ros.map(function (r) { return [r.time, r.text]; }) });
    if (todo.length) sections.push({ h: 'Still to do', bullets: todo.map(function (x) { return x.text + (x.due ? ' (by ' + fmtDate(x.due) + ')' : ''); }) });
    return { kicker: E.typeName(ev), title: ev.name, palette: (Array.isArray(c.palette) ? c.palette : []).filter(function (h) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h); }).map(hex),
      lines: [(ev.date ? fmtDate(ev.date) + (ev.time ? ' at ' + fmtTime(ev.time) : '') : 'Date to be set') + ' \u00b7 ' + whereText(ev) + ' \u00b7 ' + settingName(ev) + ' \u00b7 ' + plural(ev.guests, 'guest'), 'Dress code: ' + E.dressCode(ev, ev.tier)],
      sections: sections, foot: 'Planned with Event Couture by Always Luxe. Prices are estimates unless marked Quote or Booked. You pay vendors directly.' };
  }
  function planText(d, short) {
    var out = [d.title, d.lines.join('\n'), ''];
    d.sections.forEach(function (s) {
      if (short && /schedule|Still to do|Get this look/.test(s.h)) return;
      out.push(s.h.toUpperCase());
      if (s.p) out.push(s.p);
      (s.bullets || []).forEach(function (x) { out.push('- ' + x); });
      (s.rows || []).forEach(function (r) { out.push('- ' + r[0] + (r[2] ? ': ' + r[2] : '') + (r[1] ? ' (' + String(r[1]).replace(/\n/g, '; ') + ')' : '')); });
      (s.times || []).forEach(function (r) { out.push(r[0] + '  ' + r[1]); });
      if (s.total) out.push(s.total[0] + ': ' + s.total[1]);
      out.push('');
    });
    out.push(d.foot); return out.join('\n');
  }
  function fileName(ev) { return (String(ev.name || 'Event plan').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'Event-plan') + '-plan.pdf'; }
  function savePlanPdf(ev) {
    var bytes; try { bytes = window.ECPDF.plan(planData(ev)); } catch (e) { return toast('Could not make the PDF. Try Print instead.'); }
    var name = fileName(ev);
    T('plan_pdf_saved', { event_type: ev.type });
    if (window.ECNative && window.ECNative.shareFile) { var bin = ''; for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]); return window.ECNative.shareFile(name, btoa(bin), 'application/pdf', ev.name).catch(function () { toast('Could not open the share sheet. Try again.'); }); }
    if (window.ECNative && window.ECNative.isNative) { if (navigator.share) navigator.share({ title: ev.name, text: planText(planData(ev)) }).catch(function () {}); return; }
    var blob = new Blob([bytes], { type: 'application/pdf' }), file = null;
    try { file = new File([blob], name, { type: 'application/pdf' }); } catch (e) {}
    var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (touch && file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title: ev.name }).catch(function () {});
    var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast('Saved ' + name + ' to your downloads');
  }
  /* Go find a replacement for one venue or vendor category. */
  var PENDING_FIND = null;
  function findAnother(ev, cat) {
    PENDING_FIND = cat; var to = '#/e/' + ev.id + '/' + (AI.live && (ev.packages || []).some(function (pk) { return pk.items[cat]; }) ? 'budget' : cat === venueCat(ev) ? 'places' : 'vendors');
    if (location.hash === to) setTimeout(route, 0); else location.hash = to;
  }
  function runPendingFind(ev) {
    var cat = PENDING_FIND; PENDING_FIND = null; if (!cat) return;
    setTimeout(function () {
      var bar = document.querySelector('[data-optbar="' + cat + '"]'), btn = document.querySelector('[data-vendor="' + cat + '"]');
      var target = btn ? btn.closest('.it') : bar; if (target) target.scrollIntoView({ block: 'center' });
      if (btn && AI.live) btn.click(); else if (!btn && AI.live) { var lb = ev.lastVenue && document.querySelector('[data-live="' + ev.lastVenue.replace(/"/g, '') + '"]'); if (lb) lb.click(); }
      toast(savedFor(ev, cat).length >= MAX_OPTIONS ? 'Remove one of your 3 to make room, or save a new one to replace it.' : 'Save a new ' + E.lc(catName(cat, ev)) + ' option, or add one you found.');
    }, 60);
  }
  TAB_BIND.plan = function (ev, save, rerender) {
    if (!$('#pdfPlan')) return;
    ['#pdfPlan', '#mailPlan', '#sharePlan', '#printPlan'].forEach(function (sel) { var el = $(sel); if (el) el.addEventListener('click', function (e) { if (ev.sample || isKept(ev)) return; e.stopImmediatePropagation(); keepSheet(ev, 'Keep your plan to save or share it', function () { rerender(); }); }); });
    $('#pdfPlan').addEventListener('click', function () { savePlanPdf(ev); });
    $('#mailPlan').addEventListener('click', function () {
      var d = planData(ev), body = planText(d, true) + '\n\nTip: tap Save as PDF in Event Couture for the full plan with your schedule and shopping list.';
      var subj = 'My Event Couture plan: ' + ev.name, enc = function (t) { return encodeURIComponent(t).length; };
      if (enc(subj) + enc(body) > 1900) { var ch = Array.from(body), tail = '\n...\n\nSave as PDF in Event Couture for the full plan.'; while (ch.length && enc(subj) + enc(ch.join('') + tail) > 1900) ch = ch.slice(0, Math.floor(ch.length * 0.9)); body = ch.join('') + tail; }
      T('plan_emailed', { event_type: ev.type });
      (window.ECMailTo || function (u) { location.href = u; })('mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body));
    });
    var pw = $('[data-plan-when]'); if (pw) pw.addEventListener('click', function () { var w = $('#when'); if (w) w.click(); });
    $$('[data-plan-replace]').forEach(function (bt) { bt.addEventListener('click', function () { var cat = bt.dataset.planReplace; if (savedFor(ev, cat).length) compareSheet(ev, cat, rerender); else findAnother(ev, cat); }); });
    var pp = $('#printPlan'); if (pp) pp.addEventListener('click', function () { document.body.classList.add('printing-plan'); window.print(); setTimeout(function () { document.body.classList.remove('printing-plan'); }, 500); });
    var sp = $('#sharePlan'); if (sp) sp.addEventListener('click', function () {
      var txt = planText(planData(ev)); T('plan_shared', { event_type: ev.type });
      if (navigator.share) navigator.share({ title: ev.name, text: txt }).catch(function () {}); else copyText(txt, 'Plan');
    });
  };

  /* Overview: three budget versions, pros and cons, guardian, concierge */
  TAB_VIEWS.overview = function (ev, b) {
    var all = E.allBudgets(ev);
    var picked = ev.budget && ev.tier && ev.tier !== 'F';   /* she chose a spending level over her budget plan */
    if (ev.budget && !picked) all = [E.budgetFit(ev)];   /* with a budget, one clear answer; the three levels stay available below */
    if (picked) all = all.filter(function (t) { return t.tier.id === ev.tier; });
    var g = E.guardian(ev, b);
    var pkgCta = AI.live && !ev.sample && !ev.settingOpen && pkgCats(ev, b).length ? ((ev.packages || []).length
      ? '<div class="panel pkg-cta"><div><b>Your booking package is ready</b><p class="small muted">Change anything, compare packages and mark what you book.</p></div><a class="btn" href="#/e/' + ev.id + '/budget">Open my package</a></div>'
      : '<div class="panel pkg-cta"><div><b>Next: book everything in one place</b><p class="small muted">One tap picks a top-rated ' + (pkgCats(ev, b)[0].kind === 'venue' ? 'venue and every vendor' : 'vendor for everything') + ' in ' + esc(ev.city.split(',')[0]) + '. Change anything you like.</p></div><button class="btn gold" id="pkgStart">Create my package</button></div>') : '';
    return pkgCta + (hasTradition(ev) ? '<div class="stack">' + cultureRow(ev) + '</div>' : '') + stepsCard(ev, b) + (ev.settingOpen ? whereCompare(ev) : '') + '<div class="stack"><h3>' + (ev.budget ? 'Your plan' : 'Your budget versions') + '</h3><p class="muted">' + (picked ? 'You\u2019re using the ' + esc(tierName(ev.tier)) + ' version: about ' + money(all[0].total) + (all[0].total > ev.budget ? ', ' + money(all[0].total - ev.budget) + ' over your ' + money(ev.budget) + ' maximum.' : ', within your ' + money(ev.budget) + ' maximum.') + ' <button class="link small" data-tier="F">Back to my budget plan</button> <button class="link small" id="cmpLevels">Compare spending levels</button>' : ev.budget ? (all[0] && all[0].shortBy && all[0].shortBy <= ev.budget * 0.1 ? 'Your plan comes to ' + money(all[0].total) + ', about ' + money(all[0].shortBy) + ' over your ' + money(ev.budget) + ' maximum. One of the swaps below brings it under.' : all[0] && all[0].shortBy ? (/^[aeiou]/i.test(E.typeName(ev)) ? 'An ' : 'A ') + esc(E.typeName(ev).toLowerCase()) + ' for ' + plural(ev.guests, 'guest') + ' usually costs more than ' + money(ev.budget) + ' in ' + esc(ev.city.split(',')[0]) + '. This is the closest plan, kept as lean as the look allows. The budget guardian below shows ways to close the gap, like fewer guests or a different setting.' : 'Your plan, built to stay within your ' + money(ev.budget) + ' maximum' + ((ev.priorities || []).length ? ' while protecting your must-haves' : '') + '. Leftover money stays yours; it is not spent just because it is there.') + ' <button class="link small" id="cmpLevels">Compare spending levels</button>' : '') + (ev.budget ? '' : 'The same ' + esc(ev.concept.styleName) + ' look at three spending levels. Add a budget to get a plan made for it.') + '</p><div class="tiers">' +
      all.map(function (t) { var pc = E.prosCons(ev, t);
        return '<button class="tier" data-tier="' + t.tier.id + '" aria-pressed="' + (t.tier.id === ev.tier) + '"><span class="muted small">' + esc(t.tier.name) + '</span><span class="amt num">' + money(t.total) + '</span><span class="small muted">estimated</span><span class="small muted">' + (ev.setting === 'restaurant' ? 'About ' + money(t.perGuest) + ' a person all in: the menu bill, cake and table decor, with a 10% cushion' : 'Includes a 10% cushion for surprises') + '</span>' +
          '<div class="pc"><b>Pros</b><ul>' + pc.pros.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><b>Cons</b><ul>' + pc.cons.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' + (all.length > 1 ? '<span class="tier-pick">' + (t.tier.id === ev.tier ? '\u2713 Your plan uses this version' : 'Use this version') + '</span>' : '') + '</button>'; }).join('') + '</div></div>' +
      (g.over > 0 ? '<div class="panel stack"><div class="row" style="justify-content:space-between"><h3>Budget guardian</h3><span class="badge bad">' + money(g.over) + ' over</span></div><p class="muted">These swaps keep the look and bring the total down.</p><div class="list">' +
        g.swaps.map(function (s, i) { return '<div class="it"><span class="grow">' + esc(s.text) + '</span>' + (s.save ? '<span class="num muted">saves about ' + money(s.save) + '</span>' : '') + '<button class="btn small ghost" data-swap="' + i + '">Apply</button></div>'; }).join('') + '</div></div>' : '') +
      '<div class="panel stack"><h3>Ask the concierge</h3><p class="muted small">Type a change in plain words, like “make it 25 guests”, “budget ' + money(niceAmount(b.total * 0.9)) + '”, “move it outdoors”, “skip the photographer” or “add a photo booth”.</p>' +
      '<div class="chat" id="chat"></div><form id="ask" class="row"><input class="input" aria-label="Change to your plan" id="q" style="flex:1 1 220px" placeholder="What would you like to change?" autocomplete="off"><button class="btn">Send</button></form></div>' +
      '<div class="panel stack"><h3>Your concept</h3>' + dots(ev.concept.palette, ev.concept.styleName + ' colors') + '<p>' + esc(moodFor(ev.concept, ev)) + '</p><ul class="incl">' + decorFor(ev.concept, ev).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' + dressBlock(ev, 'muted small') + (ev.sample ? '' : '<div><a class="btn ghost small" href="#/e/' + ev.id + '/concepts">Change concept</a></div>') + '</div>';
  };
  TAB_BIND.overview = function (ev, save, rerender) {
    bindCulture(ev, save, rerender);
    var ps = $('#pkgStart'); if (ps) ps.addEventListener('click', function () { if (lockSample(ev)) return; AUTO_PKG = true; location.hash = '#/e/' + ev.id + '/budget'; });
    bindWhere(ev, rerender); bindSteps(ev, rerender);
    var cl = $('#cmpLevels'); if (cl) cl.addEventListener('click', function () {
      var levels = E.allBudgets(ev);
      sheet('<h3>Spending levels for this look</h3><p class="muted">The same concept at three levels, for comparison. Your plan stays within your maximum unless you pick one of these.</p>' + levels.map(function (t) { return '<div class="it"><span class="grow"><b>' + esc(t.tier.name) + '</b><span class="muted small"> ' + esc(t.tier.blurb) + '</span></span><span class="num">about ' + money(t.total) + '</span><button class="btn small ghost" data-pick="' + t.tier.id + '">Use</button></div>'; }).join('') + '<button class="btn ghost block" data-pick="F">Keep my budget plan</button>', function (el, close) {
        el.addEventListener('click', function (e) { var bt = e.target.closest('[data-pick]'); if (!bt) return; var bf = snap(ev); ev.tier = bt.dataset.pick; save(); close(); rerender(); if (bf.tier !== ev.tier) undoToast(ev, bf, 'Switched to ' + tierName(ev.tier), rerender); });
      });
    });
    $$('[data-tier]').forEach(function (btn) { btn.addEventListener('click', function () { var bf = snap(ev); ev.tier = btn.dataset.tier; save(); rerender(); if (bf.tier !== ev.tier) undoToast(ev, bf, 'Your plan now uses ' + tierName(ev.tier) + ': ' + money(E.budget(ev, ev.tier).total), rerender); }); });
    var g = E.guardian(ev, E.budget(ev, ev.tier));
    $$('[data-swap]').forEach(function (btn) { btn.addEventListener('click', function () {
      if (lockSample(ev)) return;
      var s = g.swaps[+btn.dataset.swap]; var bf = snap(ev);
      if (s.kind === 'drop') ev.exclude = (ev.exclude || []).concat(s.id);
      else if (s.kind === 'hours') ev.hours = Math.max(1, (ev.hours || 3) - 1);
      else if (s.kind === 'tier') ev.tier = s.to || (ev.tier === 'U' ? 'S' : 'L');
      else if (s.kind === 'guests') { ev.guests = s.to; ev.expected = Math.min(ev.expected || s.to, s.to); }
      else if (s.kind === 'setting') ev.setting = s.to;
      else ev.overrides = Object.assign({}, ev.overrides, (function () { var o = {}; var it = E.budget(ev, ev.tier).items.find(function (i) { return i.id === s.id; }); if (it) o[s.id] = { amount: Math.round(it.mid - s.save), source: 'yours', note: s.text }; return o; })());
      save(); rerender(); undoToast(ev, bf, 'Applied: ' + s.text, rerender);
    }); });
    $('#ask').addEventListener('submit', function (e) {
      e.preventDefault(); var q = $('#q').value.trim(); if (!q) return;
      var bf = snap(ev); var reply = concierge(ev, q); var chat = $('#chat');
      var bubbles = '<div class="bubble me">' + esc(q) + '</div><div class="bubble ai">' + esc(reply.text) + '</div>';
      chat.insertAdjacentHTML('beforeend', bubbles);
      $('#q').value = '';
      if (reply.changed && !ev.sample) { save(); setTimeout(function () { rerender(); var c2 = $('#chat'); if (c2) c2.insertAdjacentHTML('beforeend', bubbles); undoToast(ev, bf, 'Plan updated', rerender); }, 1100); }   /* the answer stays visible after the plan redraws */
    });
  };

  /* Concierge: simple edits run in ordinary software; bigger requests use AI. */
  function concierge(ev, q) {
    if (ev.sample) return { text: 'This is a sample plan. Start your own plan and I can change anything for you.' };
    var s = q.toLowerCase().replace(/(\d),(\d{3})/g, '$1$2'); var m; var changes = []; var beforeTotal = E.budget(ev, ev.tier).total;
    var before = { guests: ev.guests, expected: ev.expected, setting: ev.setting };
    /* each part of the request is read on its own: "skip the photographer and add a photo booth" is two changes */
    var parts = s.split(/\s*(?:,|;|\.(?!\d)|\band\b|\bbut\b|\bthen\b|\bplus\b|\balso\b)\s*/).filter(Boolean);
    if ((m = s.match(/(\d+)\s*(guests|people|person)/))) {
      var n = +m[1];
      if (n < 1) return { text: 'A plan needs at least 1 guest. How many people are you inviting?' };
      if (n > 20000) return { text: 'Event Couture plans events for up to 20,000 people. Try a smaller number.' };
      if ((CFG.app || CFG.launchFree) && ev.paid && ev.paid.max && n > ev.paid.max) ev.paid.max = E.passFor(n).max;   /* free in the app */
      if (ev.paid && ev.paid.max && n > ev.paid.max) { var up = E.upgradeCost(ev.paid.price, n); return { text: plural(n, 'guest') + ' is more than your pass covers (' + ev.paid.max + '). Moving up costs ' + money(up.due) + '. Open Overview, Your pass to move up; your plan stays as it is.' }; }
      ev.guests = n; ev.expected = Math.min(ev.expected || n, n); changes.push('guest count is now ' + n);
    }
    /* "$3k budget", "budget $3,000", "keep it under 5k" (but "under 50 guests" is about guests, not money) */
    var bm = s.match(/(?:budget|under|max(?:imum)?|spend|limit)[^\d$]{0,20}\$?\s*(\d+(?:\.\d+)?)\s*(k|thousand)?\b(?!\s*(?:guests|people|person|hours?|hrs?|kids|children))/) || s.match(/\$\s*(\d+(?:\.\d+)?)\s*(k|thousand)?\b[^\d]{0,12}(?:budget|max|total)/) || s.match(/\b(\d+(?:\.\d+)?)\s*(k|thousand)\s*(?:dollar\s*)?budget/);
    var budgetSet = false;
    if (bm) { var amt = Math.round(+bm[1] * (bm[2] ? 1000 : 1)); if (amt >= 100) { ev.budget = amt; budgetSet = true; changes.push('budget is now ' + money(ev.budget)); } }
    if (/my budget|fit (it|the plan)|plan to (my|the) budget/.test(s) || (budgetSet && !/luxe for less|cheaper version|lowest|signature|ultra|splurge|fanciest/.test(s))) { ev.tier = 'F'; changes.push('fitted the plan to your budget'); }
    else if (/luxe for less|cheaper version|lowest/.test(s)) { ev.tier = 'L'; changes.push('switched to Luxe for Less'); }
    else if (/signature/.test(s)) { ev.tier = 'S'; changes.push('switched to Signature'); }
    else if (/ultra|splurge|fanciest/.test(s)) { ev.tier = 'U'; changes.push('switched to Ultra Luxe'); }
    if (/no alcohol|alcohol[- ]free|dry event|no drinking/.test(s)) { ev.alcohol = 'none'; changes.push('set to no alcohol'); }
    else if (/beer and wine|wine only/.test(s)) { ev.alcohol = 'wine'; changes.push('set to beer and wine'); }
    if (/private (dining )?room/.test(s)) { ev.setting = 'privateRoom'; changes.push('moved to a private room at a restaurant'); }
    else if (/restaurant|order(ing)? from the menu/.test(s)) { ev.setting = 'restaurant'; changes.push('moved to a restaurant, ordering from the menu (no venue, catering or rentals)'); }
    else if (/outdoor|outside/.test(s)) { ev.setting = 'outdoor'; changes.push('moved outdoors (tent, permits and restrooms added)'); }
    else if (/indoor|inside/.test(s)) { ev.setting = 'indoor'; changes.push('moved indoors'); }
    else if (/at home|my house|backyard/.test(s)) { ev.setting = 'home'; changes.push('set at home'); }
    if ((m = s.match(/(\d+)\s*hours?/))) { ev.hours = Math.min(16, Math.max(1, +m[1])); changes.push('length is now ' + ev.hours + ' hours'); }
    var city = D.CITIES.find(function (c) { var nm = c.name.toLowerCase().split(',')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return new RegExp('\\b(in|to|city( is)?|move( it)? to|change( the)? city to)\\s+' + nm + '\\b').test(s); });
    if (city && city.name !== ev.city) { ev.city = city.name; changes.push('city is now ' + city.name); }
    Object.keys(D.CATEGORIES).forEach(function (id) {
      var name = E.lc(D.CATEGORIES[id].name).split(' (')[0];
      var short = { photographer: 'photographer', videographer: 'videographer', dj: 'dj', photoBooth: 'photo booth', effects: 'special effects', danceFloor: 'dance floor', chocolateFountain: 'chocolate fountain', dessertBar: 'dessert bar', iceCreamCart: 'ice cream cart', coffeeBar: 'coffee bar', foodTruck: 'food truck', popcornCart: 'popcorn cart', booth360: '360 booth', livePainter: 'live painter', caricature: 'caricature artist', flowerWall: 'flower wall', bounceHouse: 'bounce house', facePainter: 'face painter', characterVisit: 'party character', gameTruck: 'game truck', magician: 'magician', balloonTwister: 'balloon twister', craftStation: 'craft station', pettingZoo: 'petting zoo', liveMusic: 'live music', florals: 'flowers', balloons: 'balloons', lighting: 'lighting', coordinator: 'coordinator', hairMakeup: 'makeup', favors: 'favors', transport: 'transportation', bar: 'bar', cake: 'cake', mc: 'mc', security: 'security', kids: 'kids', entertainment: 'entertainment' }[id] || name;
      var re = new RegExp('\\b(skip|remove|no|drop|without)\\b[^.]*\\b' + short.replace(/ /g, '\\s') + '\\b');
      var add = new RegExp('\\b(add|include|want|with)\\b[^.]*\\b' + short.replace(/ /g, '\\s') + '\\b');
      var hitRe = parts.some(function (pt) { return re.test(pt); }), hitAdd = parts.some(function (pt) { return add.test(pt); });
      if (hitRe) { ev.exclude = (ev.exclude || []).concat(id); ev.include = (ev.include || []).filter(function (x) { return x !== id; }); changes.push('removed ' + E.lc(D.CATEGORIES[id].name)); }
      else if (hitAdd) { ev.include = (ev.include || []).concat(id); ev.exclude = (ev.exclude || []).filter(function (x) { return x !== id; }); changes.push('added ' + E.lc(D.CATEGORIES[id].name)); }
    });
    var lim = tooBigFor(ev.setting, ev.guests);
    if (lim) { var txt = tooBigText(ev.setting, ev.guests, lim); ev.guests = before.guests; ev.expected = before.expected; ev.setting = before.setting; return { text: txt + ' Nothing was changed.' }; }
    if (changes.length) {
      var nb = E.budget(ev, ev.tier);
      var why = nb.tier.id === 'F' && nb.total > beforeTotal && ev.budget ? ' The rest of your plan no longer has to be trimmed as much, so it moves back up, still within your ' + money(ev.budget) + ' maximum.' : '';
      return { changed: true, text: 'Done: ' + changes.join('; ') + '. New estimated total: ' + money(nb.total) + '.' + why + ' Updating your plan…' };
    }
    if (AI.live) return { text: 'For a bigger redesign, open Change concept to see new looks. Your budget and details carry over.' };
    return { text: 'For bigger redesigns like that, choose “Show three different concepts” on the concept page. ' + (CFG.app ? '' : 'Smart redesigns by AI turn on when the app launches.') + '' };
  }

  /* Bookings: save businesses to a shortlist, then record a quote or a booking. Status comes from what the host saved. */
  var FOUND = {};
  function venueCat(ev) { var b = E.budget(ev, ev.tier); var ids = b.items.map(function (i) { return i.id; }); return ['venue', 'privateDining', 'restaurantFood'].filter(function (x) { return ids.indexOf(x) >= 0; })[0] || 'venue'; }
  function savedFor(ev, cat) { return (ev.shortlist || []).filter(function (x) { return x && x.cat === cat && x.name; }); }
  function statusOf(ev, cat) {
    var ov = (ev.overrides || {})[cat];
    if (ov && ov.source === 'booking') return 'booked';
    if (ov && (ov.source === 'quote' || ov.source === 'vendor')) return 'quote';
    return savedFor(ev, cat).length ? 'short' : 'todo';
  }
  var STATUS_TXT = { booked: 'Booked', quote: 'Got a price', short: 'Shortlisted', todo: 'To book' };
  function statusBadge(ev, cat) { var st = statusOf(ev, cat); return '<span class="badge st-' + st + '" data-stbadge="' + cat + '">' + STATUS_TXT[st] + (st === 'short' ? ' (' + savedFor(ev, cat).length + ')' : '') + '</span>'; }
  function saveBtn(ev, p, cat) {
    var key = cat + '|' + p.id;
    FOUND[key] = { id: p.id, name: p.name, cat: cat, rating: p.rating || 0, reviews: p.reviews || 0, url: p.website || p.mapsUrl || '', site: p.website || '', maps: p.mapsUrl || '', address: p.address || '', price: p.priceLevel || '' };
    var on = (ev.shortlist || []).some(function (x) { return x.id === p.id && x.cat === cat; });
    var pks = ev.packages || [], k = Math.min(ev.pkgView || 0, pks.length - 1), inPk = pks.length && pks[k].items[cat] === p.id;
    return '<button class="btn small' + (on ? ' gold' : ' ghost') + '" data-short="' + esc(key) + '" aria-pressed="' + on + '">' + (on ? 'Saved' : 'Save') + '</button>' +
      (pks.length && !ev.sample ? (inPk ? '<span class="badge ok">In package ' + (k + 1) + '</span>' : '<button class="btn small" data-topkg="' + esc(key) + '">Put in package ' + (k + 1) + '</button>') : '');
  }
  /* Hotel class by brand. Google's data has no official star rating, so only well-known brands are labeled. */
  var LUX5 = /four seasons|ritz[- ]carlton|st\.? regis|waldorf astoria|mandarin oriental|the peninsula|rosewood|\baman\b|park hyatt|montage|bulgari|raffles|fairmont|\bconrad\b|jw marriott|\bedition\b|the langham|shangri-la|post oak hotel|auberge|pendry|four seasons/i;
  var LUX4 = /marriott(?! (courtyard|fairfield|residence|springhill|towneplace))|\bhilton\b(?! (garden|homewood|hampton|home2))|hyatt regency|grand hyatt|\bwestin\b|sheraton|intercontinental|kimpton|^w [a-z]|\bw hotel|\bomni\b|le m[e\u00e9]ridien|renaissance|\bloews\b|thompson|autograph collection|curio collection|hard rock hotel|royal sonesta|the joule|hotel zaza|four points/i;
  function hotelClass(name) { name = String(name || ''); if (!/hotel|resort|inn|suites|lodge|ritz|regis|seasons|waldorf|marriott|hilton|hyatt|westin|sheraton|kimpton|omni|loews|peninsula|rosewood|fairmont|conrad|langham|zaza|\bw\b/i.test(name)) return ''; if (/courtyard|fairfield|residence inn|springhill|towneplace|hampton|garden inn|homewood|home2|aloft|\bac hotel|four points|element|tru by|moxy|doubletree|embassy suites/i.test(name)) return ''; return LUX5.test(name) ? '5-star luxury brand' : LUX4.test(name) && !/four points/i.test(name) ? '4-star brand' : ''; }
  function hotelBadge(name) { var c = hotelClass(name); return c ? ' <span class="badge est hotel-class" title="Hotel class by brand. Confirm with the hotel.">' + (c[0] === '5' ? '\u2605\u2605\u2605\u2605\u2605 ' : '\u2605\u2605\u2605\u2605 ') + c + '</span>' : ''; }
  function placeFromFound(f) { return { id: f.id, name: f.name, rating: f.rating, reviews: f.reviews, website: f.site, mapsUrl: f.maps, address: f.address, priceLevel: f.price }; }
  /* Up to three options per category; one is the front-runner (the first saved, until she stars another). */
  var MAX_OPTIONS = 3;
  var OPT_NAME = { venue: 'Venue', privateDining: 'Private dining room', restaurantFood: 'Restaurant' };
  function catName(cat, ev) { if (OPT_NAME[cat]) return OPT_NAME[cat]; if (ev && (cat === 'bar' || cat === 'restaurantDrinks') && ev.alcohol === 'none') return ev.kids && /birthday/.test(ev.type || '') ? 'Drinks' : 'Non-alcoholic drinks'; if (ev && cat === 'bar' && ev.alcohol === 'wine') return 'Beer and wine'; var c = D.CATEGORIES[cat]; return c ? c.name.split(' (')[0] : 'Option'; }
  function pickOf(ev, cat) { var l = savedFor(ev, cat); return l.find(function (x) { return x.pick; }) || l[0] || null; }
  function setPick(ev, cat, id) { savedFor(ev, cat).forEach(function (x) { x.pick = x.id === id; }); }
  function removeOption(ev, id, cat) { var list = ev.shortlist = ev.shortlist || [], k = list.findIndex(function (o) { return o.id === id && o.cat === cat; }); var x = k >= 0 ? list.splice(k, 1)[0] : null; var ov0 = (ev.overrides || {})[cat]; if (x && ov0 && !ov0.opt && ov0.note === x.name) ov0.opt = x.id; if (x && x.pick) { var n = savedFor(ev, x.cat)[0]; if (n) n.pick = true; } }
  function addOption(ev, item) { ev.shortlist = ev.shortlist || []; var first = !savedFor(ev, item.cat).length; ev.shortlist.push(Object.assign({}, item, { pick: first })); return first; }
  function bindSave(ev, box, after) {
    box.addEventListener('click', function (e) {
      var tp = e.target.closest('[data-topkg]');
      if (tp) { if (lockSample(ev)) return; var f = FOUND[tp.dataset.topkg], k = Math.min(ev.pkgView || 0, (ev.packages || []).length - 1); if (!f || k < 0) return;
        if (!putInPackage(ev, k, f.cat, placeFromFound(f))) return toast('Remove one of your 3 saved ' + E.lc(catName(f.cat, ev)) + ' options first.');
        saveEvent(ev); tp.outerHTML = '<span class="badge ok">In package ' + (k + 1) + '</span>'; toast(f.name + ' is in package ' + (k + 1) + '. See it under Book and budget.'); if (after) after(); return; }
      var bt = e.target.closest('[data-short]'); if (!bt) return;
      if (lockSample(ev)) return;
      var id = bt.dataset.short, list = ev.shortlist = ev.shortlist || [];
      var i = list.findIndex(function (x) { return x.cat + '|' + x.id === id; });
      var mark = function (on) { bt.textContent = on ? 'Saved' : 'Save'; bt.className = 'btn small ' + (on ? 'gold' : 'ghost'); bt.setAttribute('aria-pressed', on); };
      if (i >= 0) { var cat0 = list[i].cat; removeOption(ev, list[i].id, cat0); syncPrice(ev, cat0); mark(false); toast('Removed from your options'); saveEvent(ev); if (after) after(); return; }
      var item = FOUND[id]; if (!item) return;
      var mine = savedFor(ev, item.cat);
      if (mine.length >= MAX_OPTIONS) {
        /* three is the limit: swap one out, so the choice stays focused */
        return sheet('<h3>You have 3 ' + esc(E.lc(catName(item.cat, ev))) + ' options</h3><p class="muted">Choose one to replace with ' + esc(item.name) + ', or keep your three.</p><div class="list">' + mine.map(function (x) { return '<div class="it"><span class="grow"><b>' + esc(x.name) + '</b>' + (x.pick ? ' <span class="badge est">Front-runner</span>' : '') + '</span><button class="btn small ghost" data-swap-out="' + esc(x.id) + '">Replace</button></div>'; }).join('') + '</div><button class="btn ghost block" data-close>Keep my three</button>', function (el, close) {
          el.addEventListener('click', function (ev2) { var sw = ev2.target.closest('[data-swap-out]'); if (!sw) return; var out = mine.find(function (x) { return x.id === sw.dataset.swapOut; }); var wasPick = out && out.pick; removeOption(ev, sw.dataset.swapOut, item.cat); ev.shortlist.push(Object.assign({}, item, { pick: false })); if (wasPick || savedFor(ev, item.cat).length === 1) setPick(ev, item.cat, item.id); syncPrice(ev, item.cat); saveEvent(ev); close(); mark(true); var ob = document.querySelector('[data-short="' + (item.cat + '|' + sw.dataset.swapOut).replace(/"/g, '') + '"]'); if (ob) { ob.textContent = 'Save'; ob.className = 'btn small ghost'; ob.setAttribute('aria-pressed', 'false'); } toast('Replaced. Compare your three under Budget & bookings.'); if (after) after(); });
        });
      }
      var first = addOption(ev, item); mark(true); saveEvent(ev);
      toast(first ? item.name + ' is your front-runner. Save up to 2 more to compare.' : 'Saved: ' + (mine.length + 1) + ' of 3 ' + E.lc(catName(item.cat, ev)) + ' options');
      if (after) after();
    });
  }
  /* A small bar on Venues and Vendors: how many options she has for this category, and the way into the comparison. */
  function optBar(ev, cat, wide) {
    var l = savedFor(ev, cat), pk = pickOf(ev, cat), st = statusOf(ev, cat), ov = (ev.overrides || {})[cat] || {};
    var txt = st === 'booked' ? '<span class="badge ok">Booked</span> ' + esc(ov.note || '') : l.length ? '\u2605 <b>' + esc(pk.name) + '</b> <span class="muted">is your front-runner \u00b7 ' + l.length + ' of 3 saved</span>' : '<span class="muted">' + (wide ? 'Save up to 3 ' + E.lc(catName(cat, ev)) + ' options from the results below, or add one you found, then compare them side by side.' : 'Save up to 3 options to compare') + '</span>';
    if (!l.length && !wide && st !== 'booked') return '<div class="optbar small" data-optbar="' + cat + '" hidden></div>';
    return '<div class="optbar small" data-optbar="' + cat + '"><span class="grow">' + txt + '</span><button class="link small" data-compare="' + cat + '">' + (l.length > 1 ? 'Compare ' + l.length + ' side by side' : l.length ? 'Open' : 'Add your own') + '</button></div>';
  }
  function bindCompare(ev, rerender) { $('#tab').addEventListener('click', function (e) { var b = e.target.closest('[data-optbar] [data-compare]'); if (b) compareSheet(ev, b.dataset.compare, rerender); }); }
  function refreshBars(ev) { $$('[data-short]').forEach(function (bt) { var on = (ev.shortlist || []).some(function (x) { return x && x.cat + '|' + x.id === bt.dataset.short; }); bt.textContent = on ? 'Saved' : 'Save'; bt.className = 'btn small ' + (on ? 'gold' : 'ghost'); bt.setAttribute('aria-pressed', on); }); $$('[data-stbadge]').forEach(function (el) { el.outerHTML = statusBadge(ev, el.dataset.stbadge); }); $$('[data-optbar]').forEach(function (el) { el.outerHTML = optBar(ev, el.dataset.optbar, el.classList.contains('wide')).replace('class="optbar', 'class="optbar' + (el.classList.contains('wide') ? ' wide' : '')); }); }
  /* The budget follows the front-runner's quote until something is booked. */
  /* Prices that belong to a saved option carry its id (opt), so removing the option removes its price or booking too.
     A price typed on the Budget page for no particular option is left alone unless the front-runner has a quote. */
  function syncPrice(ev, cat) {
    var o = ev.overrides = ev.overrides || {}, ov = o[cat], l = savedFor(ev, cat);
    var has = function (id) { return l.some(function (x) { return x.id === id; }); };
    if (ov && !ov.opt && ov.source === 'booking' && ov.note) { var m = l.find(function (x) { return x.name === ov.note; }); if (m) ov.opt = m.id; }
    if (ov && ov.opt && !has(ov.opt)) { delete o[cat]; ov = null; }
    if (ov && ov.source === 'booking') return;
    var pk = pickOf(ev, cat);
    if (pk && pk.quote) o[cat] = { amount: pk.quote, source: 'quote', note: pk.name, opt: pk.id };
    else if (ov && ov.opt) delete o[cat];
  }
  /* Restaurants: book a table where it's booked. OpenTable where it operates (search by name and city), otherwise the Google Maps listing, which shows the restaurant's own booking partner. */
  var OPENTABLE = ['US', 'CA', 'GB', 'IE', 'DE', 'NL', 'AU', 'JP', 'MX', 'AE', 'IT', 'ES'];
  function reserveLink(ev, x) {
    var co = E.countryOf(ev.city), city = ev.city.replace(/^Other (US city|city in .+)$/, '').split(',')[0];
    if (OPENTABLE.indexOf(co.id) >= 0) return 'https://www.opentable.com/s?term=' + encodeURIComponent(x.name + ' ' + city) + (CFG.opentableRef ? '&ref=' + encodeURIComponent(CFG.opentableRef) : '');
    return x.maps || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(x.name + ' ' + city);
  }
  /* tipping is a US and Canada custom; elsewhere the wording says service instead */
  /* a round example amount in her currency: 2 significant digits */
  function niceAmount(n) { n = Math.max(1, n || 1); var p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1)); return Math.round(n / p) * p; }
  function tipsHere(ev) { return E.countryOf((ev && ev.city) || '').tip !== false; }
  function isRestaurantPick(ev, cat, x) { return x && !/^(ig|rec|own|ec):/.test(String(x.id || '')) && (['privateDining', 'restaurantFood'].indexOf(cat) >= 0 || (ev.setting === 'restaurant' || ev.setting === 'privateRoom') && cat === venueCat(ev)); }   /* only the restaurant itself: never a venue, caterer or bakery */
  function siteOf(x) { return x.site || (x.url && !/google\.[a-z.]+\/maps|maps\.google|goo\.gl/i.test(x.url) ? x.url : ''); }
  function isBooked(ev, cat, x) { var ov = (ev.overrides || {})[cat]; return !!(ov && ov.source === 'booking' && (ov.opt ? ov.opt === x.id : ov.note === x.name)); }
  /* Side by side: her up to three options for one category, with the facts that matter and one front-runner. */
  var PRICE_TXT = { PRICE_LEVEL_INEXPENSIVE: 'Budget-friendly', PRICE_LEVEL_MODERATE: 'Moderate prices', PRICE_LEVEL_EXPENSIVE: 'Upscale', PRICE_LEVEL_VERY_EXPENSIVE: 'Luxury prices' };
  function compareSheet(ev, cat, rerender, opts) {
    var mode = opts && opts.book ? { kind: 'book', id: opts.book } : null, direct = !!mode;   /* direct: opened from the package's I booked it, so it closes when done */   /* null = the comparison; { kind: 'quote' | 'book', id } = a price form for one option */
    var priceForm = function (el, x) {
      var book = mode.kind === 'book', booked = isBooked(ev, cat, x), meal = cat === 'restaurantFood', ov = (ev.overrides || {})[cat] || {};
      var val = book ? (booked && ov.amount ? ov.amount : x.quote || '') : (x.quote || '');
      el.innerHTML = '<h3 tabindex="-1">' + (book ? (booked ? 'Booked: ' : 'Mark as booked: ') : 'Quote from ') + esc(x.name) + '</h3>' +
        '<p class="muted small">' + (book ? (meal ? 'Great choice. Add what you expect to spend if you know it; otherwise your meal estimate stays in the budget.' : 'Add the total you agreed to, including fees. Your budget uses it instead of the estimate.') : 'Add the price they quoted, including fees. ' + (pickOf(ev, cat) && pickOf(ev, cat).id === x.id ? 'This is your front-runner, so your budget uses it.' : 'Your budget uses it if you make them your front-runner.')) + '</p>' +
        '<label class="field"><span>' + (book ? (meal ? 'Expected total (' + E.currency() + ', optional)' : 'Total you agreed to (' + E.currency() + ')') : 'Quoted total (' + E.currency() + ')') + '</span><input class="input num" type="number" min="0" inputmode="decimal" id="pamt" value="' + esc(String(val)) + '"></label>' +
        '<button class="btn gold block" id="psave">' + (book ? (booked ? 'Save' : 'Mark as booked') : 'Save quote') + '</button>' +
        (book && booked ? '<button class="btn ghost block" id="punbook">Not booked after all</button>' : '') + (!book && x.quote ? '<button class="btn ghost block" id="pclear">Remove this quote</button>' : '') +
        '<button class="btn ghost block" id="pback">' + (direct ? 'Cancel' : 'Back to comparison') + '</button>';
    };
    var draw = function (el) {
      if (mode) { var mx = savedFor(ev, cat).find(function (x) { return x.id === mode.id; }); if (mx) { priceForm(el, mx); var h = el.querySelector('h3'); if (h) h.focus(); return; } mode = null; }
      var l = savedFor(ev, cat), pk = pickOf(ev, cat), ov = (ev.overrides || {})[cat] || {};
      var row = function (label, fn) { return '<div class="cmp-row"><span class="cmp-l">' + label + '</span>' + l.map(function (x) { return '<span class="cmp-c' + (pk && x.id === pk.id ? ' on' : '') + '">' + fn(x) + '</span>'; }).join('') + '</div>'; };
      var outside = ov.source === 'booking' && !l.some(function (x) { return isBooked(ev, cat, x); });
      el.innerHTML = '<h3 tabindex="-1">Compare ' + esc(E.lc(catName(cat, ev))) + ' options</h3><p class="muted small">Your ' + (l.length === 1 ? 'option' : l.length + ' options') + ', side by side. Star your front-runner; contact them, then mark the one you book.</p>' +
        (outside ? '<div class="note">You marked this booked on your Budget page' + (ov.note ? ': ' + esc(ov.note) : '') + '. Tap I booked this on an option below to switch.</div>' : '') +
        (l.length ? '<div class="cmp" style="--n:' + l.length + '">' +
          row('', function (x) { return '<b>' + esc(x.name) + '</b>' + (isBooked(ev, cat, x) ? '<span class="badge ok">Booked</span>' : pk && x.id === pk.id ? '<span class="badge est">\u2605 Front-runner</span>' : ''); }) +
          row('Rating', function (x) { return x.rating ? '\u2605 ' + (Math.round(x.rating * 10) / 10) + (x.reviews ? ' <span class="muted small">(' + Number(x.reviews).toLocaleString('en-US') + ')</span>' : '') : '<span class="muted">\u2014</span>'; }) +
          row('Price', function (x) { return isBooked(ev, cat, x) && ov.amount ? '<b class="num">' + money(ov.amount) + '</b> <span class="muted small">booked</span>' : x.quote ? '<span class="num">' + money(x.quote) + '</span> <span class="muted small">quote</span>' : PRICE_TXT[x.price] ? PRICE_TXT[x.price] : '<span class="muted">Ask for a quote</span>'; }) +
          row('Where', function (x) { return x.address ? esc(x.address.split(',').slice(0, 2).join(',')) : '<span class="muted">\u2014</span>'; }) +
          row('', function (x) { return (siteOf(x) ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(siteOf(x)) + '">Website</a>' : '') + (x.maps ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(x.maps) + '">Map</a>' : '') + (x.phone ? '<a class="btn small ghost" href="tel:' + esc(x.phone.replace(/[^\d+]/g, '')) + '">Call</a>' : ''); }) +
          row('', function (x) { var top = pk && x.id === pk.id; return '<span class="cmp-acts">' + (top ? '' : '<button class="btn small ghost" data-pick-opt="' + esc(x.id) + '">\u2605 Make front-runner</button>') + '<button class="btn small ghost" data-quote-opt="' + esc(x.id) + '">' + (x.quote ? 'Change quote' : 'Add quote') + '</button><button class="btn small' + (top && !isBooked(ev, cat, x) ? '' : ' ghost') + '" data-book-opt="' + esc(x.id) + '">' + (isBooked(ev, cat, x) ? 'Booked \u2713 Edit' : 'I booked this') + '</button><span class="cmp-links"><button class="link small" data-replace-opt="' + esc(x.id) + '">Replace</button><button class="link small" data-rm-opt="' + esc(x.id) + '">Remove</button></span></span>'; }) +
          '</div>' + (l.length > 2 ? '<p class="muted small cmp-swipe">Swipe sideways to see all ' + l.length + '.</p>' : '') : '<p class="muted">No options saved yet. Tap Save on any result, or add one you found yourself.</p>') +
        (l.length < MAX_OPTIONS ? '<details class="cmp-add"' + (l.length ? '' : ' open') + '><summary class="link small">Add one you found yourself</summary><div class="grid2"><label class="field"><span>Business name</span><input class="input" id="oname"></label><label class="field"><span>Website or phone (optional)</span><input class="input" id="olink"></label></div><button class="btn small" id="oadd">Add option</button></details>' : '') +
        '<button class="btn ghost block" data-close>Done</button>';
    };
    sheet('<div id="cmpBox"></div>', function (el, close) {
      var box = $('#cmpBox', el); draw(box);
      var again = function (sel) { draw(box); var f = sel && box.querySelector(sel); (f || box.querySelector('h3')).focus(); };
      box.addEventListener('click', function (e) {
        var t = e.target.closest('button'); if (!t || lockSample(ev)) return;
        var find = function (id) { return savedFor(ev, cat).find(function (x) { return x.id === id; }); };
        var cur = mode && find(mode.id);
        if (t.id === 'pback') { if (direct) return close(); mode = null; again(); }
        else if (t.id === 'psave' && cur) {
          var a = +$('#pamt', box).value || 0;
          if (mode.kind === 'quote') { if (!(a > 0)) return toast('Enter the quoted amount'); cur.quote = a; syncPrice(ev, cat); toast('Quote saved'); }
          else { if (!(a > 0) && cat !== 'restaurantFood') return toast('Enter the amount you agreed to'); ev.overrides = ev.overrides || {}; ev.overrides[cat] = { amount: a > 0 ? a : 0, source: 'booking', note: cur.name, opt: cur.id }; setPick(ev, cat, cur.id); toast(cur.name + ' is booked' + (a > 0 ? '. Totals updated.' : '')); }
          saveEvent(ev); if (direct && mode.kind === 'book') { t.disabled = true; return close(); } mode = null; again();
        }
        else if (t.id === 'punbook' && cur) { delete ev.overrides[cat]; syncPrice(ev, cat); saveEvent(ev); toast('Marked as not booked'); if (direct) return close(); mode = null; again(); }
        else if (t.id === 'pclear' && cur) { delete cur.quote; syncPrice(ev, cat); saveEvent(ev); mode = null; again(); toast('Quote removed'); }
        else if (t.dataset.pickOpt) { setPick(ev, cat, t.dataset.pickOpt); syncPrice(ev, cat); saveEvent(ev); again('[data-book-opt="' + t.dataset.pickOpt.replace(/"/g, '') + '"]'); toast(find(t.dataset.pickOpt).name + ' is your front-runner'); }
        else if (t.dataset.replaceOpt) { var gone = find(t.dataset.replaceOpt), wasB = isBooked(ev, cat, gone); removeOption(ev, t.dataset.replaceOpt, cat); syncPrice(ev, cat); saveEvent(ev); close(); toast('Removed ' + gone.name + (wasB ? ' and its booking' : '') + '. Now pick a new one.'); findAnother(ev, cat); }
        else if (t.dataset.rmOpt) { var rm = find(t.dataset.rmOpt), wasBk = isBooked(ev, cat, rm); removeOption(ev, t.dataset.rmOpt, cat); syncPrice(ev, cat); saveEvent(ev); again(); toast('Removed ' + rm.name + (wasBk ? '. Its booking was taken out of your budget.' : '')); }
        else if (t.dataset.quoteOpt || t.dataset.bookOpt) { mode = { kind: t.dataset.bookOpt ? 'book' : 'quote', id: t.dataset.quoteOpt || t.dataset.bookOpt }; draw(box); setTimeout(function () { var i = $('#pamt', box); if (i) i.focus(); }, 30); }
        else if (t.id === 'oadd') { var n = $('#oname', box).value.trim(); if (!n) return toast('Enter the business name'); var lk = $('#olink', box).value.trim(); var phone = /^[\d\s().+-]{7,}$/.test(lk); addOption(ev, { id: 'own-' + uid(), name: n.slice(0, 120), cat: cat, site: !phone && /^https?:\/\/|\.[a-z]{2,}/i.test(lk) ? (/^https?:\/\//i.test(lk) ? lk.replace(/^https?/i, function (m) { return m.toLowerCase(); }) : 'https://' + lk) : '', phone: phone ? lk : '' }); saveEvent(ev); again(); }
      });
      box.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'pamt') { e.preventDefault(); var b = $('#psave', box); if (b) b.click(); } });
    });
    var openedAt = location.hash, soft = /\/(places|vendors)$/.test(openedAt);   /* if she leaves the page (back button), don't redraw the old one */
    var onClose = new MutationObserver(function () { if (!document.querySelector('#cmpBox')) { onClose.disconnect(); if (location.hash !== openedAt) return; if (soft) refreshBars(ev); else rerender(); } }); onClose.observe(document.body, { childList: true });
  }
  function bookingsPanel(ev, b) {
    var lines = b.items.filter(function (i) { return D.CATEGORIES[i.id]; });
    var booked = lines.filter(function (i) { return statusOf(ev, i.id) === 'booked'; });
    var quoted = lines.filter(function (i) { return statusOf(ev, i.id) === 'quote'; });
    var bookedAmt = booked.reduce(function (t, i) { var o = (ev.overrides || {})[i.id]; return t + (o && o.amount > 0 ? o.amount : 0); }, 0);
    var sl = (ev.shortlist || []).filter(function (x) { return x && x.name && D.CATEGORIES[x.cat]; });
    return '<div class="panel stack bookings"><div class="row" style="justify-content:space-between"><h3>Bookings</h3><span class="small muted num">' + booked.length + ' of ' + lines.length + ' booked</span></div>' +
      '<div class="meter"><i style="width:' + (lines.length ? Math.round(booked.length / lines.length * 100) : 0) + '%"></i></div>' +
      '<div class="bk-stats"><div><b class="num">' + money(bookedAmt) + '</b><span class="small muted">confirmed</span></div><div><b class="num">' + quoted.length + '</b><span class="small muted">with a price</span></div><div><b class="num">' + sl.length + '</b><span class="small muted">saved</span></div></div>' +
      (sl.length ? '<div class="list">' + sl.map(function (x) { return x && x.cat; }).filter(function (c, i, a) { return c && D.CATEGORIES[c] && a.indexOf(c) === i; }).map(function (cat) { var l = savedFor(ev, cat), pk = pickOf(ev, cat), st = statusOf(ev, cat), ov = (ev.overrides || {})[cat] || {};
          return '<div class="it"><div class="grow"><b>' + esc(catName(cat, ev)) + '</b><div class="small">' + (st === 'booked' ? '<span class="badge ok">Booked</span> ' + esc(ov.note || '') : '\u2605 ' + esc(pk.name) + ' <span class="muted">front-runner</span>') + '</div><div class="small muted">' + plural(l.length, 'option') + ' saved' + (l.length < MAX_OPTIONS && st !== 'booked' ? ', save up to ' + (MAX_OPTIONS - l.length) + ' more' : '') + '</div></div><span class="acts"><button class="btn small" data-compare="' + cat + '">' + (l.length > 1 ? 'Compare ' + l.length : 'Open') + '</button></span></div>'; }).join('') + '</div>'
        : '<p class="muted small">Save up to 3 options for each venue or vendor. They show here side by side so you can pick a front-runner, add quotes and mark the one you book.</p>') +
      '</div>';
  }

  /* Budget: every line labeled; add your own prices */
  /* ---------- Book everything in one place: a package with a top-rated venue and every vendor, in one tap ---------- */
  var PKG_SKIP = ['venue', 'privateDining', 'tent', 'restrooms', 'generator', 'permits', 'insurance', 'parking', 'restaurantFood', 'restaurantDrinks', 'cakeFee', 'tableDecor'];
  function pkgCats(ev, b) {
    var lvl = venueLevel(ev, b), vc = venueCat(ev), out = [];
    if (ev.setting !== 'home' && !ev.settingOpen && b.items.some(function (i) { return i.id === vc; })) { var vt = themeVenue(ev, venueTypesFor(ev)); if (vt) out.push({ cat: vc, kind: 'venue', type: vt, q: venueQuery(vt, ev, b), lvl: lvl }); }
    b.items.forEach(function (i) { if (PKG_SKIP.indexOf(i.id) < 0 && NO_SEARCH.indexOf(i.id) < 0) out.push({ cat: i.id, kind: 'vendor', q: vendorQuery(ev, i, lvl), lvl: lvl }); });
    return out;
  }
  /* The kind of venue that suits the look: chandeliers and velvet mean a ballroom, greenery a garden, a skyline a rooftop. */
  var VENUE_CUES = [[/ballroom|chandelier|velvet|crystal|grand|gilded|royal|black tie|old hollywood/, /ballroom|banquet|mansion/i], [/garden|greenery|botanical|floral arch|outdoor|pergola|vine/, /garden|estate|lawn|patio|cafe/i],
    [/rooftop|skyline|city lights|terrace/, /rooftop/i], [/rustic|barn|vineyard|wood|country|boho/, /vineyard|barn/i], [/industrial|loft|modern|minimal|neon|disco/, /loft|lounge|gallery/i], [/beach|coastal|ocean|seaside|waterfront|nautical/, /beach|waterfront/i],
    [/museum|art|gallery/, /museum|gallery/i], [/tea|brunch|high tea/, /tea|brunch|cafe/i], [/steak|supper|dinner/, /steakhouse|dining/i]];
  function themeVenue(ev, types) {
    if (ev.venueKind === 'ballroom') { var hb = types.find(function (v) { return /ballroom/i.test(v); }) || types.find(function (v) { return /hotel/i.test(v); }); return hb || 'Hotel ballroom'; }
    var c = ev.concept || {}, t = [c.name, c.styleName, c.mood, (c.decor || []).join(' '), (c.outline || []).join(' '), ev.inspiration && ev.inspiration.text].join(' ').toLowerCase();
    var best = types[0], bs = 0;
    types.forEach(function (v, i) { var sc = VENUE_CUES.reduce(function (a, cue) { return a + (cue[0].test(t) && cue[1].test(v) ? (t.match(new RegExp(cue[0].source, 'g')) || []).length : 0); }, 0) - i * 0.01; if (sc > bs) { bs = sc; best = v; } });
    return best;
  }
  /* Only the venue follows her area; vendors travel to her, so they're searched across the whole city. */
  /* Vendors Always Luxe recommends for this city and line, shaped like a search result. */
  function recFor(ev, cat) {
    return (D.RECOMMENDED || []).filter(function (r) { var st = (ev.city || '').split(', ')[1] || ''; return r.cats.indexOf(cat) >= 0 && (!r.cities || r.cities.indexOf(ev.city) >= 0) && (!r.states || r.states.indexOf(st) >= 0) && (!r.notCities || r.notCities.indexOf(ev.city) < 0) && (!r.notStates || r.notStates.indexOf(st) < 0) && (!r.onlyCities || r.onlyCities.indexOf(ev.city) >= 0) && (!r.country || E.countryOf(ev.city).id === r.country) && (r.cities || r.states || r.country || ['US', 'CA'].indexOf(E.countryOf(ev.city).id) >= 0)   /* no place given: the US and Canada */ && (!r.cultures || r.cultures.indexOf(ev.culture || '') >= 0 || r.cultures.indexOf('parties') >= 0 && ev.type !== 'wedding' || r.types && r.types.indexOf(ev.type) >= 0); })
      .sort(function (a, b) { var w = function (r) { return r.weight != null ? r.weight : (r.first ? 100 : 0) + (r.cities ? 20 : r.states ? 10 : 0) + (r.top ? 5 : 0); }; return w(b) - w(a); })   /* this city first, then this state, then everywhere */
      .map(function (r) { var mp = !r.ig && 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(r.maps || r.name); return { id: r.ig ? 'ig:' + r.ig : 'rec:' + r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: r.name, website: r.ig ? 'https://instagram.com/' + r.ig : mp, rec: true, note: r.note, ig: r.ig, late: !!(r.notTop && r.notTop.indexOf(ev.city) >= 0) }; })
      .filter(function (r, i, a) { return a.findIndex(function (o) { return o.id === r.id; }) === i; });   /* one person listed twice (top in their state, and everywhere) shows once */
  }
  function pkgSearch(ev, c) {
    if (c.kind === 'venue') { var vr = c.cat === 'venue' && ev.setting === 'indoor' ? recFor(ev, 'venue') : []; return findPlaces(ev, { query: c.q, level: c.lvl, city: (ev.area ? ev.area + ', ' : '') + ev.city }).catch(function (e) { if (vr.length) return []; throw e; }).then(function (l) { return vr.concat(l.filter(function (x) { return !vr.some(function (r) { return E.lc(r.name) === E.lc(x.name); }); })); }); }   /* a recommended venue leads, for an event-venue plan */
    var ask = function (q) { return findPlaces(ev, { query: q, level: c.lvl, kind: 'vendor', cat: c.cat, hint: occasionHint(ev), city: ev.city }).catch(function () { return []; }); };
    var backups = (PKG_FALLBACK[c.cat] || []).concat([VENDOR_SEARCH[c.cat] || '']).filter(function (q, i, a) { return q && q !== c.q && a.indexOf(q) === i; }), got = [];
    var add = function (list) { var seen = got.map(function (x) { return x.id; }); got = got.concat(rankLine(ev, c.cat, list).filter(function (x) { return seen.indexOf(x.id) < 0; })); };
    var early = function () { return got.filter(function (x) { return !x.late; }).length; };
    var more = function () { if (early() >= 3 || !backups.length) return got; return ask(backups.shift()).then(function (l) { add(l); return more(); }); };
    got = recFor(ev, c.cat);
    /* someone marked notTop for this city never takes one of the first 3 spots; they wait further down the list */
    var settle = function (list) { var late = list.filter(function (x) { return x.late; }), rest = list.filter(function (x) { return !x.late; }); return rest.length ? rest.slice(0, 3).concat(late, rest.slice(3)) : list; };
    if (early() >= 3) return Promise.resolve(settle(got));   /* three recommended businesses already: no Google search needed */
    backups = backups.slice(0, 1);   /* one backup search at most, to save Google searches */
    return ask(c.q).then(function (l) { add(l); return more(); }).then(settle);
  }
  function asOption(p, cat) { return { id: p.id, name: p.name, cat: cat, rec: p.rec || undefined, rating: p.rating || 0, reviews: p.reviews || 0, url: p.website || p.mapsUrl || '', site: p.website || '', maps: p.mapsUrl || '', address: p.address || '', price: p.priceLevel || '', reservable: p.reservable || undefined }; }
  function usedIn(ev, cat, id, except) { return (ev.packages || []).some(function (pk, k) { return k !== except && pk.items[cat] === id; }); }
  function putInPackage(ev, k, cat, p) {
    var pk = ev.packages[k], old = pk.items[cat], mine = savedFor(ev, cat);
    if (!mine.some(function (x) { return x.id === p.id; })) {
      if (mine.length >= MAX_OPTIONS) { var spare = mine.find(function (x) { return x.id !== old && !usedIn(ev, cat, x.id, k) && !isBooked(ev, cat, x); }) || mine.find(function (x) { return x.id === old && !usedIn(ev, cat, x.id, k) && !isBooked(ev, cat, x); }); if (!spare) return false; removeOption(ev, spare.id, cat); }
      addOption(ev, asOption(p, cat));
    }
    pk.items[cat] = p.id;
    if (old && old !== p.id && !usedIn(ev, cat, old)) { var ox = savedFor(ev, cat).find(function (x) { return x.id === old; }); if (ox && !isBooked(ev, cat, ox)) removeOption(ev, old, cat); }
    if ((ev.pkgChosen || 0) === k && !savedFor(ev, cat).some(function (x) { return isBooked(ev, cat, x); })) setPick(ev, cat, p.id);
    syncPrice(ev, cat);
    return true;
  }
  /* One search per category (remembered for a week); a second package reuses the same results, so it costs nothing extra. */
  function buildPackage(ev, onStep) {
    var b = E.budget(ev, ev.tier), cats = pkgCats(ev, b); ev.packages = ev.packages || [];
    var k = ev.packages.length; ev.packages.push({ items: {}, at: Date.now() }); if (k === 0) ev.pkgChosen = 0; ev.pkgView = k;
    var done = 0, miss = [];
    var one = function (c) {
      var bk = savedFor(ev, c.cat).find(function (x) { return isBooked(ev, c.cat, x); });
      if (bk && k === 0) { ev.packages[k].items[c.cat] = bk.id; done++; if (onStep) onStep(done, cats.length); return Promise.resolve(); }   /* what she already booked stays */
      return pkgSearch(ev, c).then(function (list) {
        var taken = ev.packages.map(function (pk) { return pk.items[c.cat]; });
        var p = list.find(function (x) { return taken.indexOf(x.id) < 0; }) || list[0];   /* fewer good businesses than packages: share the best one rather than leave it empty */
        if (!p || !putInPackage(ev, k, c.cat, p)) miss.push(c.cat);
      }).catch(function () { miss.push(c.cat); }).then(function () { done++; if (onStep) onStep(done, cats.length); });
    };
    var i = 0; var next = function () { if (i >= cats.length) return Promise.resolve(); var batch = cats.slice(i, i + 3); i += 3; return Promise.all(batch.map(one)).then(next); };
    return next().then(function () { ev.packages[k].miss = miss; saveEvent(ev); return k; });
  }
  var PRICE_SIGN = { PRICE_LEVEL_INEXPENSIVE: 'Budget-friendly', PRICE_LEVEL_MODERATE: 'Moderate prices', PRICE_LEVEL_EXPENSIVE: 'Upscale', PRICE_LEVEL_VERY_EXPENSIVE: 'Luxury prices' };
  var ORDINAL = ['first', 'second', 'third'];
  var HOWTO_PKG = '<ol class="howto"><li><b>Create</b> your package: a top-rated pick for everything, in one tap</li><li><b>Change</b> anything, or make a second package to compare</li><li><b>Book</b>: contact them and tap I booked it</li></ol>';
  var AUTO_PKG = false, PKG_BUSY = false;   /* PKG_BUSY: a second tap while a package is being made is ignored */
  function AREA_LINE(ev) { return '<p class="small pkg-area">Venue area: <b>' + esc(ev.area || 'Anywhere in ' + ev.city.split(',')[0]) + '</b>' + (ev.sample ? '' : ' <button class="link small" id="pkgArea">Change area</button>') + '</p>'; }
  function packagePanel(ev, b) {
    var cats = pkgCats(ev, b), pks = ev.packages || [];
    if (!cats.length) return bookingsPanel(ev, b);
    var bookedN = cats.filter(function (c) { return statusOf(ev, c.cat) === 'booked'; }).length;
    if (!pks.length) {
      var hasVenue = cats[0].kind === 'venue';
      return '<div class="panel stack pkg" id="pkg">' + PKG_STEPS(1) + '<div class="pkg-top"><h3>Build your booking package</h3></div>' +
        '<p class="pkg-guide">We pick a top-rated ' + (hasVenue ? E.lc(catName(cats[0].cat, ev)) + ' and ' + plural(cats.length - 1, 'vendor') : plural(cats.length, 'vendor')) + ' for your plan in ' + esc(ev.city.split(',')[0]) + '. Make up to 3 packages and compare them side by side.</p>' +
        '<ol class="howto pkg-pre"><li><b>Your date</b><div class="row" style="margin-top:6px"><span>' + esc(whenText(ev)) + '</span>' + (ev.sample ? '' : '<button class="btn small ghost" data-pkwhen>' + (ev.date || ev.dateFrom ? 'Change' : 'Set your date') + '</button>') + '</div></li>' +
        (hasVenue ? '<li><b>Where should your venue be?</b><div style="margin-top:6px">' + areaField(ev.city, ev.area || '', ['pkArea', 'pkAreaOther']) + '</div></li>' : '') +
        '<li><b>Create package 1</b>, then a second and a third to compare.</li></ol>' +
        (ev.sample ? '' : '<button class="btn gold block pkg-go" id="pkgGo">Create package 1</button>') + '<p class="small muted" id="pkgMsg" aria-live="polite"></p></div>';
    }
    var k = Math.min(ev.pkgView || 0, pks.length - 1), pk = pks[k];
    var bizOf = function (pkx, cat) { var id = pkx.items[cat]; return id && savedFor(ev, cat).find(function (o) { return o.id === id; }); };
    var line = function (x) { return (x.rec ? '<span class="badge rec">\u2605 Recommended</span> ' : '') + hotelBadge(x.name).replace(/^ /, '') + [x.rec && /^ig:/.test(x.id) ? '@' + esc(String(x.id).slice(3)) : '',x.rating ? '★ ' + (Math.round(x.rating * 10) / 10) + (x.reviews ? ' (' + Number(x.reviews).toLocaleString('en-US') + ')' : '') : '', PRICE_SIGN[x.price] || '', x.address ? esc(x.address.split(',').slice(0, 2).join(',')) : ''].filter(Boolean).join(' · '); };
    var est = function (cat) { var it = b.items.find(function (i) { return i.id === cat; }); return it ? 'est. ' + money(it.mid) : ''; };
    var links = function (x, cat) { return (cat && isRestaurantPick(ev, cat, x) ? '<a class="btn small gold" target="_blank" rel="noopener" href="' + esc(reserveLink(ev, x)) + '">Reserve a table</a>' : '') + (siteOf(x) ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(siteOf(x)) + '">' + (/^ig:/.test(x.id) ? 'Instagram' : /^rec:/.test(x.id) ? 'Map' : 'Website') + '</a>' : '') + (x.maps ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(x.maps) + '">Map</a>' : ''); };
    var row = function (c, pkx, mode) {
      var x = bizOf(pkx, c.cat), bk = x && isBooked(ev, c.cat, x);
      return '<div class="pk-row" data-pkrow="' + c.cat + '"><div class="pk-h"><b>' + esc(catName(c.cat, ev)) + '</b>' + (bk ? '<span class="badge ok">Booked</span>' : '') + (mode === 'book' && !bk && !ev.sample ? '<button class="pk-x" data-pkx="' + c.cat + '" aria-label="Remove ' + esc(catName(c.cat, ev)) + ' from my plan" title="Don\u2019t need it">\u00d7</button>' : '') + '<span class="num muted small">' + est(c.cat) + '</span></div>' +
        (x ? '<div class="pk-biz"><b>' + esc(x.name) + '</b><span class="small muted">' + line(x) + '</span></div>' +
          '<div class="pk-acts">' + links(x, c.cat) + (ev.sample ? '' : (bk || mode === 'book' ? '' : '<button class="btn small ghost" data-pkswap="' + c.cat + '">Change</button>') + (mode === 'book' ? '<button class="btn small' + (bk ? ' ghost' : '') + '" data-pkbook="' + c.cat + '">' + (bk ? 'Booked ✓' : 'I booked it') + '</button>' : '')) + '</div>'
        : '<p class="small muted">No top-rated match came back yet. ' + (ev.sample ? '' : '<button class="link small" data-pkswap="' + c.cat + '">See options</button> \u00b7 ' + mapsBtn(ev, c.cat, c.q)) + '</p>') +
        '<div class="pk-swap" data-pkswapbox="' + c.cat + '"></div></div>';
    };
    /* Step 2: every package side by side; swap anything, remove what isn't needed, choose one. */
    if (!ev.pkgConfirmed || ev.sample) {
      var ncol = pks.length + (pks.length < 3 && !ev.sample ? 1 : 0) + 1;
      var head = '<tr><th class="pk-corner"><span class="small muted">' + plural(cats.length, 'item') + '</span></th>' + pks.map(function (x, i) { return '<th class="pk-colh"><span class="pk-coln">Package ' + (i + 1) + '</span>' + (ev.sample ? '' : '<button class="btn small gold" data-pkuse="' + i + '">Choose</button>' + (pks.length > 1 ? '<button class="link small quiet" data-pkdel="' + i + '">Remove</button>' : '')) + '</th>'; }).join('') +
        (pks.length < 3 && !ev.sample ? '<th class="pk-colh pk-addcol"><button class="btn small ghost" id="pkgMore">+ Create package ' + (pks.length + 1) + '</button><span class="small muted">Different picks to compare</span></th>' : '') + '</tr>';
      var rowsH = cats.map(function (c) {
        return '<tr data-pkrow="' + c.cat + '"><th scope="row"><div class="pk-rh"><b>' + esc(catName(c.cat, ev)) + '</b>' + (ev.sample ? '' : '<button class="pk-x" data-pkx="' + c.cat + '" aria-label="Remove ' + esc(catName(c.cat, ev)) + ' from my plan" title="Don’t need it">×</button>') + '</div><span class="small muted num">' + est(c.cat) + '</span></th>' +
          pks.map(function (x, i) { var biz = bizOf(x, c.cat); return '<td>' + (biz ? '<b>' + esc(biz.name) + '</b><span class="small muted">' + line(biz) + '</span><div class="pk-cell-acts">' + (siteOf(biz) ? '<a class="link small" target="_blank" rel="noopener" href="' + esc(siteOf(biz)) + '">' + (/^ig:/.test(biz.id) ? 'Instagram' : /^rec:/.test(biz.id) ? 'Map' : 'Website') + '</a>' : '') + (ev.sample ? '' : '<button class="link small" data-pkswap="' + c.cat + '" data-pk="' + i + '">Swap</button>') + '</div>' : '<span class="small muted">No match yet</span><br>' + mapsBtn(ev, c.cat, c.q) + '<br>' + (ev.sample ? '' : ' <button class="link small" data-pkswap="' + c.cat + '" data-pk="' + i + '">Find one</button>')) + '</td>'; }).join('') +
          (pks.length < 3 && !ev.sample ? '<td class="pk-addcol"></td>' : '') + '</tr><tr class="pk-swaprow"><td colspan="' + ncol + '"><div class="pk-swap" data-pkswapbox="' + c.cat + '"></div></td></tr>';
      }).join('');
      var ex = (ev.exclude || []).filter(function (id) { return D.CATEGORIES[id]; });
      return '<div class="panel stack pkg" id="pkg">' + PKG_STEPS(2) + '<div class="pkg-top"><h3>Compare your packages</h3></div>' + AREA_LINE(ev) +
        '<p class="pkg-guide">Each package has a top-rated pick for every part of your plan. Tap <b>Swap</b> on anything you don’t like. When you’re happy, tap <b>Choose</b> on the one you like best: it becomes your <b>final package</b>, and we walk you through booking it.</p>' +
        '<p class="note small pkg-x-note">Don\u2019t need something? Tap <b>\u00d7</b> to remove it. It comes out of every package and your budget, and your estimated total goes down to match. You can add it back anytime.</p>' +
        '<div class="pkg-cmp-wrap"><table class="pkg-cmp" style="--pkn:' + (ncol - 1) + '"><thead>' + head + '</thead><tbody>' + rowsH + '</tbody></table></div>' +
        (ex.length && !ev.sample ? '<p class="small muted">Removed: ' + ex.map(function (id) { return esc(catName(id, ev)) + ' <button class="link small" data-pkunx="' + id + '">Add back</button>'; }).join(' · ') + '</p>' : '') +
        pkgExtras(ev, b) + '<p class="small muted" id="pkgMsg" aria-live="polite"></p></div>';
    }
    var cp = pks[Math.min(ev.pkgChosen || 0, pks.length - 1)], skipped = ev.pkgSkipped || [];
    var open = cats.filter(function (c) { return statusOf(ev, c.cat) !== 'booked'; });
    var exB = (ev.exclude || []).filter(function (id) { return D.CATEGORIES[id]; });
    var all = '<details class="pkg-all" open><summary>Book each one (' + bookedN + ' of ' + cats.length + ' booked)</summary>' +
      (ev.sample ? '' : '<p class="note small pkg-x-note">Don\u2019t need something? Tap <b>\u00d7</b> to remove it. It comes out of your package and your budget, and your estimated total goes down to match.</p>') +
      '<div class="pkg-rows">' + cats.map(function (c) { return row(c, cp, 'book'); }).join('') + '</div>' +
      (exB.length && !ev.sample ? '<p class="small muted">Removed: ' + exB.map(function (id) { return esc(catName(id, ev)) + ' <button class="link small" data-pkunx="' + id + '">Add back</button>'; }).join(' \u00b7 ') + '</p>' : '') + '</details>';
    var summary = pkgSummaryCard(ev, b, cats, cp);
    var back = '<button class="link small quiet" data-pkback>Change my choice: go back to comparing packages</button>';
    /* Step 4: everything booked. */
    if (!open.length) return '<div class="panel stack pkg" id="pkg">' + PKG_STEPS(4) + '<div class="pkg-top"><h3>Everything is booked</h3></div><div class="meter"><i style="width:100%"></i></div><p class="pkg-guide">All ' + cats.length + ' parts of your package are booked. Next, invite your guests.</p><a class="btn gold block" href="#/e/' + esc(ev.id) + '/invite">Invite my guests</a>' + summary + all + '</div>';
    /* Step 3: one vendor at a time. */
    var next = open.find(function (c) { return skipped.indexOf(c.cat) < 0; }) || open[0], x = bizOf(cp, next.cat), pos = cats.indexOf(next) + 1;
    return '<div class="panel stack pkg" id="pkg">' + PKG_STEPS(3) + '<div class="pkg-top"><h3>Your final package: Package ' + (Math.min(ev.pkgChosen || 0, pks.length - 1) + 1) + '</h3><span class="small muted num">' + bookedN + ' of ' + cats.length + ' booked</span></div><div class="meter"><i style="width:' + Math.round(bookedN / cats.length * 100) + '%"></i></div>' +
      (ev.date || ev.dateFrom || ev.sample ? '' : '<div class="note pkg-date"><b>Set your date first</b> so each vendor can check they\u2019re free. <button class="btn small" data-pkwhen>Set your date</button></div>') +
      '<div class="note small pkg-final"><b>Next: book it.</b> Contact each one, agree on the price, then tap <b>I booked it</b>. We\u2019ll take you through them one at a time. You can save or send your package anytime, booked or not.</div>' +
      '<div class="pkg-next" data-pkrow="' + next.cat + '"><p class="eyebrow">Next up · ' + pos + ' of ' + cats.length + '</p><h3>' + esc(catName(next.cat, ev)) + '</h3>' +
        (x ? '<div class="pk-biz"><b>' + esc(x.name) + '</b><span class="small muted">' + line(x) + (est(next.cat) ? ' · ' + est(next.cat) : '') + '</span></div>' +
          '<ol class="howto"><li><b>Contact them</b> to check your date and ask for a quote.<div class="row" style="margin-top:6px">' + links(x, next.cat) + '</div></li>' +
          '<li><b>Send your details.</b> We wrote the message for you.<div class="row" style="margin-top:6px"><button class="btn small ghost" data-pkcopy="' + next.cat + '">Copy my message</button></div></li>' +
          '<li><b>Booked?</b> Tap below and add the price you agreed on.</li></ol>' +
          '<button class="btn gold block" data-pkbook="' + next.cat + '">I booked ' + esc(x.name) + '</button>' +
          '<div class="row pkg-foot"><button class="link small quiet" data-pkskip="' + next.cat + '">Skip for now</button>' + (ev.sample ? '' : '<button class="link small quiet" data-pkx="' + next.cat + '">Don\u2019t need this? Remove it</button>') + '</div>'
        : '<p class="muted">We don’t have a top-rated pick for this yet.</p><button class="btn gold block" data-pkswap="' + next.cat + '">See options</button>' + mapsBtn(ev, next.cat, next.q, 'btn ghost block') + '<div class="row pkg-foot"><button class="link small quiet" data-pkskip="' + next.cat + '">Skip for now</button></div>') +
        '<div class="pk-swap" data-pkswapbox="' + next.cat + '"></div></div>' +
      summary + all + back + '</div>';
  }
  /* The chosen package as one clear summary she can save, email or forward, booked or not. */
  function pkgData(ev, b, cats, cp) {
    var bizOf = function (cat) { var id = cp.items[cat]; return id && savedFor(ev, cat).find(function (o) { return o.id === id; }); };
    var tot = 0, rows = cats.map(function (c) {
      var x = bizOf(c.cat), it = b.items.find(function (i) { return i.id === c.cat; }), bk = statusOf(ev, c.cat) === 'booked', ov = (ev.overrides || {})[c.cat];
      var amt = ov && ov.amount > 0 ? ov.amount : it ? it.mid : 0; tot += amt;
      var info = x ? [x.name + (hotelClass(x.name) ? ' (' + hotelClass(x.name) + ')' : ''), x.address ? x.address.split(',').slice(0, 2).join(',') : '', siteOf(x) ? String(siteOf(x)).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : (x.phone || '')].filter(Boolean).join('\n') : 'Still to choose';
      return { cat: catName(c.cat, ev), name: x ? x.name : '', rec: !!(x && x.rec), info: info, status: bk ? 'Booked' : 'Not booked yet', amt: amt, est: !(ov && ov.amount > 0) };
    });
    var ex = (ev.exclude || []).filter(function (id) { return D.CATEGORIES[id]; }).map(function (id) { return catName(id, ev); });
    return { rows: rows, total: tot, removed: ex, n: Math.min(ev.pkgChosen || 0, (ev.packages || []).length - 1) + 1, booked: rows.filter(function (r) { return r.status === 'Booked'; }).length };
  }
  function pkgSummaryCard(ev, b, cats, cp) {
    var d = pkgData(ev, b, cats, cp);
    return '<div class="pkg-sum" id="pkgSum"><div class="pkg-sum-h"><p class="eyebrow">\u2713 Your final package</p><h3>Package ' + d.n + ' \u00b7 ' + esc(ev.name) + '</h3><p class="small muted">' + esc(whenText(ev)) + ' \u00b7 ' + esc(whereText(ev)) + ' \u00b7 ' + plural(ev.guests, 'guest') + '</p></div>' +
      '<div class="pkg-sum-rows">' + d.rows.map(function (r) { return '<div class="pkg-sum-r"><span class="pkg-sum-c">' + esc(r.cat) + '</span><span class="pkg-sum-n"><b>' + (r.name ? esc(r.name) : '<span class="muted">Still to choose</span>') + '</b>' + (r.rec ? ' <span class="badge rec">\u2605 Recommended</span>' : '') + (r.status === 'Booked' ? ' <span class="badge ok">Booked</span>' : '') + '</span><span class="num pkg-sum-a">' + (r.est ? 'est. ' : '') + money(r.amt) + '</span></div>'; }).join('') + '</div>' +
      '<div class="pkg-sum-t"><span>' + (d.booked === d.rows.length ? 'Package total, all booked' : 'Package total') + '<span class="small muted pkg-sum-note">Your plan\u2019s estimate also keeps a 10% cushion for surprises.</span>' + (ev.budget ? ' <span class="small muted">(budget ' + money(ev.budget) + ')</span>' : '') + '</span><b class="num">' + money(d.total) + '</b></div>' +
      pkgExtras(ev, b) +
      '<p class="small muted">' + d.booked + ' of ' + d.rows.length + ' booked' + (d.removed.length ? ' \u00b7 Not needed: ' + d.removed.map(esc).join(', ') : '') + '</p>' +
      '<p class="small">This is your package. Save it as a PDF, email it to yourself or forward it to a co-host anytime, booked or not.</p><div class="row pkg-sum-acts"><button class="btn gold small" data-pksum="pdf">Save as PDF</button><button class="btn ghost small" data-pksum="mail">Email it</button><button class="btn ghost small" data-pksum="share">Share</button></div></div>';
  }
  /* The playlist and optional add-ons, right in the package. */
  /* Add-ons she can put in her package, grouped, and only the ones that suit this occasion and setting. */
  var ADD_LABEL = { characterVisit: 'Character visit', gameTruck: 'Game truck or games', magician: 'Magician or bubble show', craftStation: 'Craft or slime station', pettingZoo: 'Petting zoo or pony rides', dessertBar: 'Dessert bar', iceCreamCart: 'Ice cream cart', coffeeBar: 'Coffee bar', popcornCart: 'Popcorn and cotton candy', livePainter: 'Live painter', flowerWall: 'Flower wall', lighting: 'Uplighting', invitations: 'Printed invitations', coordinator: 'Day-of coordinator', bounceHouse: 'Bounce house', favors: 'Favors', balloons: 'Balloons', hairMakeup: 'Hair and makeup', florals: 'Florals', decor: 'Decor' };
  function addOnsFor(ev, have) {
    var rest = ev.setting === 'restaurant' || ev.setting === 'privateRoom';
    var fits = function (it) { return D.CATEGORIES[it.id] && have.indexOf(it.id) < 0 && (it.kids ? (ev.type === 'kids-birthday' || ev.kids && /birthday/.test(ev.type || '')) && !rest && (!it.settings || it.settings.indexOf(ev.setting) >= 0) : rest ? D.PKG_ADDONS_RESTAURANT.indexOf(it.id) >= 0 : (!it.only || it.only.indexOf(ev.type) >= 0) && (!it.not || it.not.indexOf(ev.type) < 0) && (!it.settings || it.settings.indexOf(ev.setting) >= 0)) ; };
    return D.PKG_ADDONS.map(function (g) { return { group: g.group, items: g.items.filter(fits).map(function (it) { return it.id; }) }; }).filter(function (g) { return g.items.length; });
  }
  function pkgExtras(ev, b) {
    var pl = ev.setting === 'restaurant' ? null : playlistOf(ev), have = b.items.map(function (i) { return i.id; });
    var groups = ev.sample ? [] : addOnsFor(ev, have);
    return (pl ? '<div class="pkg-pl"><span aria-hidden="true">\u266b</span><span class="grow"><b>Playlist: ' + esc(pl.name) + '</b><span class="small muted"> \u00b7 ' + pl.songs.length + ' songs, part of your package</span></span><a class="btn small ghost" href="#/e/' + esc(ev.id) + '/style" data-goto="playlist">See the songs</a></div>' : '') +
      (groups.length ? '<div class="pkg-adds"><b class="small">Add to your package</b><span class="small muted"> Optional extras for your ' + esc(E.culture(ev) ? E.typeName(ev).replace(/ (Wedding|Engagement)/, function (m) { return m.toLowerCase(); }) : E.lc(E.typeName(ev))) + '. Each one adds a line, a price and top-rated local businesses that offer it.</span>' + groups.map(function (g) { return '<p class="pkg-add-g small muted">' + esc(g.group) + '</p><div class="chips">' + g.items.map(function (id) { return '<button type="button" class="chip" data-pkadd="' + id + '">+ ' + esc(ADD_LABEL[id] || catName(id, ev).replace(/ \(.*\)$/, '')) + '</button>'; }).join('') + '</div>'; }).join('') + '</div>' : '');
  }
  function pkgSumDoc(ev) {
    var b = E.budget(ev, ev.tier), cats = pkgCats(ev, b), pks = ev.packages || [], cp = pks[Math.min(ev.pkgChosen || 0, pks.length - 1)], d = pkgData(ev, b, cats, cp);
    var secs = [{ h: 'Your package: Package ' + d.n + ' (' + d.booked + ' of ' + d.rows.length + ' booked)', rows: d.rows.map(function (r) { return [r.cat, r.info + '\n' + r.status, (r.est ? 'est. ' : '') + money(r.amt)]; }), total: ['Package total' + (ev.budget ? ' (budget ' + money(ev.budget) + ')' : ''), money(d.total)] }];
    if (d.removed.length) secs.push({ h: 'Not needed', bullets: d.removed });
    if (ev.setting !== 'restaurant') { var pl = playlistOf(ev); secs.push({ h: 'Playlist: ' + pl.name, bullets: pl.songs.map(function (x) { return x[0] + (x[1] ? ' \u2014 ' + x[1] : ''); }) }); }
    secs.push({ h: 'Next steps', bullets: ['Contact each one to check your date and get a quote.', 'Agree on the price, then mark it booked in Event Couture.', 'Pay vendors directly. Prices are estimates until you book.'] });
    return { kicker: E.typeName(ev) + ' package', title: ev.name, palette: [], lines: [whenText(ev) + ' \u00b7 ' + whereText(ev) + ' \u00b7 ' + plural(ev.guests, 'guest')], sections: secs, foot: 'Planned with Event Couture by Always Luxe. Prices are estimates unless marked Booked. You pay vendors directly.' };
  }
  function pkgSumAction(ev, kind) {
    var d = pkgSumDoc(ev), name = fileName(ev).replace(/-plan\.pdf$/, '-package.pdf');
    if (kind === 'pdf') {
      var bytes; try { bytes = window.ECPDF.plan(d); } catch (e) { return toast('Could not make the PDF right now.'); }
      T('package_pdf_saved', { event_type: ev.type });
      if (window.ECNative && window.ECNative.shareFile) { var bin = ''; for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]); return window.ECNative.shareFile(name, btoa(bin), 'application/pdf', ev.name).catch(function () {}); }
      var blob = new Blob([bytes], { type: 'application/pdf' }), file = null; try { file = new File([blob], name, { type: 'application/pdf' }); } catch (e) {}
      var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
      if (touch && file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title: ev.name }).catch(function () {});
      var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      return toast('Saved ' + name + ' to your downloads');
    }
    var txt = planText(d);
    if (kind === 'mail') { T('package_emailed', { event_type: ev.type }); return (window.ECMailTo || function (u) { location.href = u; })('mailto:?subject=' + encodeURIComponent('My Event Couture package: ' + ev.name) + '&body=' + encodeURIComponent(txt.slice(0, 1700))); }
    T('package_shared', { event_type: ev.type });
    if (navigator.share) navigator.share({ title: ev.name, text: txt }).catch(function () {}); else copyText(txt, 'Your package');
  }
  function PKG_STEPS(on) {
    return '<ol class="pkg-steps" aria-label="Step ' + on + ' of 4">' + ['Create', 'Choose', 'Book', 'Done'].map(function (t, i) { var n = i + 1; return '<li class="' + (n < on ? 'done' : n === on ? 'on' : '') + '"' + (n === on ? ' aria-current="step"' : '') + '><span>' + (n < on ? '✓' : n) + '</span>' + t + '</li>'; }).join('') + '</ol>';
  }
  function bindPackage(ev, save, rerender) {
    var build = function (btn) {
      if (lockSample(ev) || PKG_BUSY) return; PKG_BUSY = true; setTimeout(function () { PKG_BUSY = false; }, 60000); btn.disabled = true; var msg = $('#pkgMsg');
      buildPackage(ev, function (d, n) { if (msg) msg.textContent = 'Finding top-rated picks\u2026 ' + d + ' of ' + n; }).then(function (k) {
        setTimeout(function () { PKG_BUSY = false; }, 450); var m = ev.packages[k].miss || []; rerender();   /* a double tap's second tap doesn't start another package */
        toast('Package ' + (k + 1) + ' is ready' + (m.length ? (LIVE_RESTING ? '. Live search is resting until next month: tap Search on Google Maps on each line.' : '. ' + plural(m.length, 'item') + ' had no top-rated match; tap See options there.') : ''));
        var el = $('#pkg'); if (el) el.scrollIntoView({ block: 'start' });
      });
    };
    var pa = $('#pkgArea'); if (pa) pa.addEventListener('click', function () {
      sheet('<h3>Where should your venue be?</h3><p class="muted small">Pick a neighborhood in ' + esc(ev.city.split(',')[0]) + ' or type your own. ' + ((ev.packages || []).length ? 'We\u2019ll find a top-rated venue there for your package.' : 'Your package will look there first.') + '</p>' + areaField(ev.city, ev.area || '', ['parea', 'pareaOther']) + '<button class="btn gold block" id="ok">Save area</button><button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        bindArea($('#parea', el), $('#pareaOther', el));
        $('#ok', el).addEventListener('click', function () {
          var a = readArea($('#parea', el), $('#pareaOther', el)); if (lockSample(ev)) return; ev.area = a; save(); close();
          var pks = ev.packages || [], b0 = E.budget(ev, ev.tier), vc = pkgCats(ev, b0).find(function (c) { return c.kind === 'venue'; });
          if (!pks.length || !vc) { rerender(); return toast(a ? 'Venues will be near ' + a : 'Venues anywhere in ' + ev.city.split(',')[0]); }
          var k = Math.min(ev.pkgView || 0, pks.length - 1), bk = savedFor(ev, vc.cat).some(function (x) { return isBooked(ev, vc.cat, x); });
          if (bk) { rerender(); return toast('Area saved. Your venue is already booked, so it stays.'); }
          toast('Finding a top-rated venue' + (a ? ' near ' + a : '') + '\u2026');
          pkgSearch(ev, vc).then(function (list) {
            var inOther = pks.map(function (x) { return x.items[vc.cat]; }).filter(function (id, i) { return i !== k; }), p = list.find(function (x) { return inOther.indexOf(x.id) < 0; });
            if (p && putInPackage(ev, k, vc.cat, p)) { save(); rerender(); toast('Your venue is now ' + p.name); } else { rerender(); toast('No top-rated venue came back there. Try a nearby area.'); }
          }).catch(function (e) { rerender(); toast(e.message || 'Search isn\u2019t available right now.'); });
        });
      });
    });
    $$('[data-pkx]').forEach(function (bt) { bt.addEventListener('click', function () { if (lockSample(ev)) return; var cat = bt.dataset.pkx, bf = snap(ev); ev.exclude = (ev.exclude || []).concat([cat]); ev.priorities = (ev.priorities || []).filter(function (x) { return x !== cat; }); save(); rerender(); undoToast(ev, bf, catName(cat, ev) + ' removed from your plan', rerender); }); });
    $$('[data-pkunx]').forEach(function (bt) { bt.addEventListener('click', function () { ev.exclude = (ev.exclude || []).filter(function (x) { return x !== bt.dataset.pkunx; }); save(); rerender(); toast(catName(bt.dataset.pkunx, ev) + ' is back in your plan'); }); });
    var pw = $('[data-pkwhen]'); if (pw) pw.addEventListener('click', function () { var w = $('#when'); if (w) w.click(); });
    var pas = $('#pkArea'); if (pas) { bindArea(pas, $('#pkAreaOther')); var saveA = function () { ev.area = readArea($('#pkArea'), $('#pkAreaOther')); ev.areaChosen = true; save(); }; pas.addEventListener('change', function () { if (pas.value !== '__other') saveA(); }); var pao = $('#pkAreaOther'); if (pao) pao.addEventListener('change', saveA); }
    var go = $('#pkgGo'), more = $('#pkgMore');
    if (go) go.addEventListener('click', function () { build(go); });
    if (go && AUTO_PKG) { AUTO_PKG = false; go.scrollIntoView({ block: 'start' }); build(go); }   /* she tapped Create my package on the Summary page */
    if (more) more.addEventListener('click', function () { build(more); });
    $$('[data-pkview]').forEach(function (bt) { bt.addEventListener('click', function () { ev.pkgView = +bt.dataset.pkview; save(); rerender(); }); });
    $$('[data-pkuse]').forEach(function (bt) { bt.addEventListener('click', function () {
      if (lockSample(ev)) return; var k = +bt.dataset.pkuse, pk = ev.packages[k]; ev.pkgChosen = k; ev.pkgView = k; ev.pkgConfirmed = true; ev.pkgSkipped = [];
      Object.keys(pk.items).forEach(function (cat) { if (!savedFor(ev, cat).some(function (x) { return isBooked(ev, cat, x); })) setPick(ev, cat, pk.items[cat]); syncPrice(ev, cat); });
      save(); rerender(); toast('Package ' + (k + 1) + ' it is. Now let\u2019s book it, one at a time.'); var el = $('#pkg'); if (el) el.scrollIntoView({ block: 'start' });
    }); });
    $$('[data-pkdel]').forEach(function (bt) { bt.addEventListener('click', function () {
      if (lockSample(ev)) return; var k = +bt.dataset.pkdel, pk = ev.packages[k];
      Object.keys(pk.items).forEach(function (cat) { var id = pk.items[cat], x = savedFor(ev, cat).find(function (o) { return o.id === id; }); if (x && !usedIn(ev, cat, id, k) && !isBooked(ev, cat, x)) removeOption(ev, id, cat); syncPrice(ev, cat); });
      ev.packages.splice(k, 1); var ch = ev.pkgChosen || 0; ev.pkgChosen = ch === k ? 0 : ch > k ? ch - 1 : ch; ev.pkgView = Math.max(0, Math.min((ev.pkgView || 0), ev.packages.length - 1));
      if (ev.packages.length && ch === k) { var np = ev.packages[ev.pkgChosen]; Object.keys(np.items).forEach(function (cat) { if (!savedFor(ev, cat).some(function (x) { return isBooked(ev, cat, x); })) setPick(ev, cat, np.items[cat]); syncPrice(ev, cat); }); }
      save(); rerender(); toast('Package removed');
    }); });
    $$('[data-goto]').forEach(function (a) { a.addEventListener('click', function () { var id = a.dataset.goto; setTimeout(function () { var el = document.getElementById(id); if (el) el.scrollIntoView({ block: 'start' }); }, 350); }); });
    $$('[data-pkadd]').forEach(function (bt) { bt.addEventListener('click', function () {
      if (lockSample(ev) || bt.disabled) return; var cat = bt.dataset.pkadd; bt.disabled = true;
      ev.exclude = (ev.exclude || []).filter(function (x) { return x !== cat; }); ev.include = (ev.include || []).filter(function (x) { return x !== cat; }).concat([cat]); save();
      var c = pkgCats(ev, E.budget(ev, ev.tier)).find(function (x) { return x.cat === cat; });
      toast(catName(cat, ev) + ' added. Finding top-rated picks\u2026');
      (c ? pkgSearch(ev, c) : Promise.resolve([])).then(function (list) {
        (ev.packages || []).forEach(function (pk, k) { var taken = ev.packages.map(function (q) { return q.items[cat]; }); var p = list.find(function (x) { return taken.indexOf(x.id) < 0; }) || list[0]; if (p) putInPackage(ev, k, cat, p); });
        save(); rerender(); toast(catName(cat, ev) + ' is in your package');
      }).catch(function () { save(); rerender(); toast(catName(cat, ev) + ' added. Tap Find one to choose a business.'); });
    }); });
    $$('[data-pksum]').forEach(function (bt) { bt.addEventListener('click', function () { var k = bt.dataset.pksum; if (ev.sample || isKept(ev)) return pkgSumAction(ev, k); keepSheet(ev, 'Keep your plan to save or share your package', function () { rerender(); pkgSumAction(ev, k); }); }); });
    $$('[data-pkskip]').forEach(function (bt) { bt.addEventListener('click', function () { if (lockSample(ev)) return; ev.pkgSkipped = (ev.pkgSkipped || []).filter(function (c) { return c !== bt.dataset.pkskip; }).concat([bt.dataset.pkskip]); save(); rerender(); }); });
    $$('[data-pkcopy]').forEach(function (bt) { bt.addEventListener('click', function () { copyText(vendorAsk(ev, bt.dataset.pkcopy), 'Your message'); }); });
    $$('[data-pkback]').forEach(function (bt) { bt.addEventListener('click', function () { if (lockSample(ev)) return; ev.pkgConfirmed = false; ev.pkgView = ev.pkgChosen || 0; save(); rerender(); }); });
    $$('[data-pkbook]').forEach(function (bt) { bt.addEventListener('click', function () { var cat = bt.dataset.pkbook, pk = ev.packages[Math.min((ev.pkgConfirmed ? ev.pkgChosen : ev.pkgView) || 0, ev.packages.length - 1)]; compareSheet(ev, cat, rerender, { book: pk.items[cat] }); }); });
    $$('[data-pkswap]').forEach(function (bt) { bt.addEventListener('click', function () {
      if (bt.dataset.pk) ev.pkgView = +bt.dataset.pk;
      var cat = bt.dataset.pkswap, box = document.querySelector('[data-pkswapbox="' + cat + '"]'), k = Math.min(ev.pkgView || 0, ev.packages.length - 1), pk = ev.packages[k];
      if (box.innerHTML && box.dataset.k === String(k)) { box.innerHTML = ''; return; } box.dataset.k = String(k);
      var c = pkgCats(ev, E.budget(ev, ev.tier)).find(function (x) { return x.cat === cat; }); if (!c) return;
      box.innerHTML = '<p class="small muted">Finding other top-rated options\u2026</p>';
      pkgSearch(ev, c).then(function (list) {
        var inOther = (ev.packages || []).map(function (x) { return x.items[cat]; }); var others = list.filter(function (p) { return inOther.indexOf(p.id) < 0; }).slice(0, 5);   /* never the same business in two packages */
        box.innerHTML = '<div class="curated">' + (others.length ? '<p class="eyebrow">Other top-rated choices</p>' + others.map(function (p) { return '<div class="it"><div class="grow"><b>' + esc(p.name) + '</b>' + hotelBadge(p.name) + '<div class="small muted">' + [p.rating ? '\u2605 ' + (Math.round(p.rating * 10) / 10) + ' (' + Number(p.reviews || 0).toLocaleString('en-US') + ')' : '', PRICE_SIGN[p.priceLevel] || '', p.address ? esc(p.address.split(',').slice(0, 2).join(',')) : ''].filter(Boolean).join(' \u00b7 ') + '</div></div><span class="acts">' + (p.website ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(p.website) + '">Website</a>' : '') + '<button class="btn small" data-pkpick="' + esc(p.id) + '">Use this</button></span></div>'; }).join('') : '<p class="muted small">No other top-rated matches nearby.</p>') +
          '<p class="small"><a class="link" href="' + (ev.sample ? '#/sample/' + ev.id.split('-')[1] : '#/e/' + ev.id) + '/' + (c.kind === 'venue' ? 'places">See every kind of venue, by area and drive time' : 'vendors">See more businesses for every category') + '</a></p>' +
          '<details class="cmp-add"><summary class="link small">Add one you found yourself</summary><div class="grid2"><label class="field"><span>Business name</span><input class="input" data-ownname></label><label class="field"><span>Website or phone (optional)</span><input class="input" data-ownlink></label></div><button class="btn small" data-ownadd>Put it in package ' + (k + 1) + '</button></details></div>';
        var oa = box.querySelector('[data-ownadd]'); if (oa) oa.addEventListener('click', function () { if (lockSample(ev)) return; var nm = box.querySelector('[data-ownname]').value.trim(); if (!nm) return toast('Enter the business name'); var lk = box.querySelector('[data-ownlink]').value.trim(), phone = /^[\d\s().+-]{7,}$/.test(lk);
          var own = { id: 'own-' + uid(), name: nm.slice(0, 120), website: !phone && /^https?:\/\/|\.[a-z]{2,}/i.test(lk) ? (/^https?:\/\//i.test(lk) ? lk : 'https://' + lk) : '' };
          if (!putInPackage(ev, k, cat, own)) return toast('Remove one of your 3 saved options for this first.');
          if (phone) { var so = savedFor(ev, cat).find(function (x) { return x.id === own.id; }); if (so) so.phone = lk; }
          save(); rerender(); toast(nm + ' is in package ' + (k + 1)); });
        $$('[data-pkpick]', box).forEach(function (pb) { pb.addEventListener('click', function () { if (lockSample(ev)) return; var p = list.find(function (x) { return x.id === pb.dataset.pkpick; }); if (!putInPackage(ev, k, cat, p)) return toast('Remove one of your saved options for this first.'); save(); rerender(); toast('Swapped in ' + p.name); }); });
      }).catch(function (e) { box.innerHTML = '<p class="muted small">' + esc(e.message || 'Search isn\u2019t available right now.') + ' ' + mapsBtn(ev, cat) + '</p>'; });
    }); });
  }
  TAB_VIEWS.budget = function (ev, b) {
    var groups = {}; cut(b.items, 3, ev).forEach(function (i) { (groups[i.group] = groups[i.group] || []).push(i); });
    var excluded = (ev.exclude || []).filter(function (id) { return D.CATEGORIES[id]; });
    return (hasTradition(ev) ? '<div class="stack" id="musicPlan">' + cultureRow(ev) + musicChips(ev) + '</div>' : E.culture(ev) ? '<div class="stack" id="musicPlan">' + musicChips(ev) + '</div>' : '') + (AI.live ? packagePanel(ev, b) : '') + '<div class="stack"><div class="row" style="justify-content:space-between"><h3>' + (b.tier.id === 'F' ? 'Your budget plan' : esc(b.tier.name) + ' budget') + '</h3><div class="seg" id="tierseg">' + (ev.budget ? [{ id: 'F', name: 'My budget' }] : []).concat(D.TIERS).map(function (t) { return '<button data-tier="' + t.id + '" aria-pressed="' + (t.id === ev.tier) + '">' + t.name + '</button>'; }).join('') + '</div></div>' +
      (ev.payer === 'own' ? (function () { var rest = ev.setting === 'restaurant' || ev.setting === 'privateRoom';
        /* at a restaurant guests pay their own bill; anywhere else they chip in for food and drinks */
        var own = b.items.filter(function (i) { return rest ? (i.id === 'restaurantFood' || i.id === 'restaurantDrinks' || i.id === 'privateDining') : ['catering', 'bar', 'bartender'].indexOf(i.id) >= 0; }).reduce(function (t, i) { return t + i.mid; }, 0); return own ? '<div class="note">Everyone pays their own ' + (rest ? 'meal and drinks' : 'share of the food and drinks') + ': about <b>' + money(own / Math.max(1, ev.expected || ev.guests)) + ' a person</b>' + (rest ? ', with tax and tip' : ', with tax and service') + '. You cover the rest (cake, decor and the 10% cushion), about <b>' + money(Math.max(0, b.total - own)) + '</b>. The total below is still the full cost of the event.</div>' : ''; })() : '') +
      (ev.payer === 'shared' ? '<div class="note">Splitting the cost: about <b>' + money(b.total / Math.max(1, ev.guests)) + ' a person</b> if everyone shares equally. Track who has paid under Guests & invitations.</div>' : '') +
      '<p class="muted small"><b>All prices are estimates</b>, not quotes. Real prices come from each venue and vendor. Estimates are sized to ' + esc(ev.city) + ' and ' + plural(ev.guests, 'guest') + ', and include tax' + (tipsHere(ev) ? ', service charges and tips' : ' and service charges') + ' where they apply. Add a real quote anytime and the totals update.</p>' +
      (ev.budget ? '<div class="stack" style="gap:6px"><div class="meter' + (b.total > ev.budget ? ' over' : '') + '"><i style="width:' + Math.min(100, b.total / ev.budget * 100) + '%"></i></div><span class="small muted num">' + money(b.total) + ' of your ' + money(ev.budget) + ' budget</span></div>' : '') +
      (AI.live && (ev.packages || []).length ? '' : bookingsPanel(ev, b)) +
      '<div class="panel"><div class="lines">' + Object.keys(groups).map(function (gname) {
        return '<div class="group-h">' + esc(gname) + '</div>' + groups[gname].map(function (i) {
          return '<div class="ln"><span>' + esc(i.name) + '</span><span class="amt">' + (i.lo === i.hi ? money(i.mid) : money(i.mid) + '<br><span class="small muted">' + money(i.lo) + ' to ' + money(i.hi) + '</span>') + '</span>' +
            '<div class="sub">' + statusBadge(ev, i.id) + '<span class="badge ' + (i.label === 'Planning estimate' ? 'est' : 'ok') + '">' + esc(i.label) + '</span><span class="small muted">' + esc([i.source].concat(i.extras.length ? [i.extras.join(', ')] : []).filter(Boolean).join('; ')) + '</span>' +

            '<button class="link small" data-price="' + i.id + '">Add quote or booking</button><button class="link small" data-drop="' + i.id + '">Remove</button>' + (i.id === 'hairMakeup' ? FC_LINK : '') + '</div></div>';
        }).join('');
      }).join('') + '</div></div>' + more(ev, b.items.length, Math.min(3, b.items.length), 'budget lines, with quantities and sources') +
      '<div class="panel sum"><div><span>Subtotal</span><span class="num">' + money(b.mid) + '</span></div><div><span>Cushion for surprises (10%)</span><span class="num">' + money(b.contingency) + '</span></div><div class="grand"><span>Estimated total</span><span class="num">' + money(b.total) + '</span></div><div class="small muted"><span>Range</span><span class="num">' + money(b.lo * 1.1) + ' to ' + money(b.hi * 1.1) + '</span></div></div>' +
      (excluded.length ? '<div class="stack"><b>Removed from this plan</b><div class="chips">' + excluded.map(function (id) { return '<button class="chip" data-restore="' + id + '">Add back ' + esc(E.lc(D.CATEGORIES[id].name)) + '</button>'; }).join('') + '</div></div>' : '') +
      '<p class="muted small">Estimates are a starting point. Always confirm prices, minimums and availability with each venue and vendor before you book.</p></div>';
  };
  TAB_BIND.budget = function (ev, save, rerender) {
    var mp = $('#musicPlan'); if (mp) bindMusic(mp, ev, function () { save(); rerender(); toast('Music updated'); });
    bindCulture(ev, save, rerender);
    if (AI.live) bindPackage(ev, save, rerender);
    if (PENDING_FIND && AI.live) { var pf = PENDING_FIND; PENDING_FIND = null; setTimeout(function () { var sb = document.querySelector('[data-pkswap="' + pf + '"]'); if (sb) { sb.closest('.pk-row').scrollIntoView({ block: 'center' }); sb.click(); } }, 60); }
    $$('#tierseg [data-tier]').forEach(function (btn) { btn.addEventListener('click', function () { var bf = snap(ev); ev.tier = btn.dataset.tier; save(); rerender(); if (bf.tier !== ev.tier) undoToast(ev, bf, 'Switched to ' + tierName(ev.tier), rerender); }); });
    $$('[data-drop]').forEach(function (btn) { btn.addEventListener('click', function () { if (lockSample(ev)) return; var bf = snap(ev); ev.exclude = (ev.exclude || []).concat(btn.dataset.drop); ev.include = (ev.include || []).filter(function (x) { return x !== btn.dataset.drop; }); save(); rerender(); undoToast(ev, bf, 'Removed ' + E.lc(D.CATEGORIES[btn.dataset.drop].name), rerender); }); });
    $$('[data-restore]').forEach(function (btn) { btn.addEventListener('click', function () { ev.exclude = ev.exclude.filter(function (x) { return x !== btn.dataset.restore; }); ev.include = (ev.include || []).concat(btn.dataset.restore); save(); rerender(); }); });
    var priceSheet = function (id, note) {
      if (lockSample(ev)) return; var cur = (ev.overrides || {})[id] || {}; if (note && !cur.note) cur = Object.assign({}, cur, { note: note, source: cur.source || 'quote' });
      sheet('<h3>Add a price for ' + esc(E.lc(D.CATEGORIES[id].name)) + '</h3><p class="muted small">Add a quote you received or a confirmed booking. Your budget uses this instead of the estimate.</p><label class="field"><span>Total amount (' + E.currency() + '), including fees</span><input class="input num" type="number" min="0" id="amt" value="' + (cur.amount || '') + '"></label>' +
        '<label class="field"><span>What is this price?</span><select class="input" id="src"><option value="quote">Quote I received</option><option value="booking"' + (cur.source === 'booking' ? ' selected' : '') + '>Booked and confirmed</option><option value="vendor"' + (cur.source === 'vendor' ? ' selected' : '') + '>Price published by the vendor</option></select></label>' +
        '<label class="field"><span>Vendor or note (optional)</span><input class="input" id="nt" value="' + esc(cur.note || '') + '"></label><button class="btn gold block" id="ok">Save price</button>' + ((ev.overrides || {})[id] ? '<button class="btn ghost block" id="clr">Use the estimate again</button>' : '') + '<button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        $('#ok', el).addEventListener('click', function () { var a = +$('#amt', el).value; if (!(a > 0)) return toast('Enter an amount'); var bf = snap(ev); ev.overrides = ev.overrides || {}; var src = $('#src', el).value, nt = $('#nt', el).value.trim(), m = savedFor(ev, id).find(function (x) { return nt && x.name.toLowerCase() === nt.toLowerCase(); });
          ev.overrides[id] = { amount: a, source: src, note: m ? m.name : nt }; if (m) { ev.overrides[id].opt = m.id; setPick(ev, id, m.id); if (src !== 'booking') m.quote = a; } save(); close(); rerender(); undoToast(ev, bf, 'Price saved. Totals updated.', rerender); });
        var c = $('#clr', el); if (c) c.addEventListener('click', function () { var bf = snap(ev); var o = ev.overrides[id], m = o && o.opt && savedFor(ev, id).find(function (x) { return x.id === o.opt; }); if (m && o.source !== 'booking') delete m.quote; delete ev.overrides[id]; save(); close(); rerender(); undoToast(ev, bf, 'Back to the estimate', rerender); });
      });
    };
    $$('[data-price]').forEach(function (btn) { btn.addEventListener('click', function () { priceSheet(btn.dataset.price); }); });
    $$('[data-compare]').forEach(function (btn) { btn.addEventListener('click', function () { compareSheet(ev, btn.dataset.compare, rerender); }); });
  };

  /* Venues: types that fit, live search links, drive times */
  /* The kinds of venue that fit this event, best first. */
  function venueTypesFor(ev) {
    var t = E.typeOf(ev.type); var types = (D.VENUE_TYPES[ev.setting] || D.VENUE_TYPES[t.style] || D.VENUE_TYPES.party).slice();
    var hr = E.startHour(ev), daytime = hr < 16;
    if (ev.setting === 'outdoor') types = ev.type === 'wedding' || ev.type === 'engagement' ? ['Estate or garden venue', 'Vineyard or barn', 'Event lawn or estate grounds', 'Beach or waterfront venue', 'Rooftop terrace'] : ['Park pavilion or picnic area', 'Garden venue', 'Event lawn or estate grounds', 'Rooftop terrace', 'Beach or waterfront venue'];
    if (ev.setting === 'restaurant' || ev.setting === 'privateRoom') {
      types = types.filter(function (v) { return daytime ? !/steakhouse|wine bar|dinner spot|lounge/i.test(v) : !/brunch|tea room/i.test(v); });
      types = (daytime ? ['Upscale brunch or lunch spot', 'Hotel brunch or afternoon tea', 'Garden cafe or patio'] : ['Private dining room', 'Steakhouse or chophouse', 'Rooftop restaurant'].concat(ev.type === 'bachelorette' ? ['Cocktail lounge or speakeasy'] : [])).concat(types).filter(function (v, i, a) { return a.indexOf(v) === i; });
      if (ev.setting === 'privateRoom') types = types.filter(function (v) { return !/trendy dinner/i.test(v); });
    }
    if ((ev.kids && /birthday/.test(ev.type)) || /\b([1-9]|1[0-2])(st|nd|rd|th)\b.*birthday|kids'? party/i.test((ev.inspiration && ev.inspiration.text) || '')) { types = types.filter(function (v) { return !/lounge|wine bar|speakeasy|steakhouse/i.test(v); }); if (ev.setting === 'indoor') types.unshift('Kids party venue or play space'); }
    if (ev.alcohol === 'none') types = types.filter(function (v) { return !/wine bar|lounge|speakeasy/i.test(v); });   /* no bars for an alcohol-free event */
    if (ev.setting === 'outdoor' && /\b(park|picnic)\b/i.test((ev.inspiration && ev.inspiration.text) || '')) types = ['Park pavilion or picnic area'].concat(types.filter(function (v) { return v !== 'Park pavilion or picnic area'; }));
    return types;
  }
  TAB_VIEWS.places = function (ev, b) {
    var t = E.typeOf(ev.type), types = venueTypesFor(ev), hr = E.startHour(ev), daytime = hr < 16;
    if (ev.setting === 'home') {
      return '<div class="stack"><h3>Your venue: home</h3><div class="panel stack"><p>Your event is at home, so there is no venue to book. ' + (function () { var ids = b.items.map(function (i) { return i.id; }), inc = [];
        if (ids.indexOf('rentals') >= 0) inc.push('rentals with enough seating for ' + plural(ev.guests, 'guest')); if (ids.indexOf('cleanup') >= 0) inc.push('a setup and cleanup crew');
        return inc.length ? 'Your plan includes ' + inc.join(' and ') + '.' + (ids.indexOf('cleanup') < 0 ? ' Setup and cleanup are on you and your helpers.' : '') : 'Setup and cleanup are on you and your helpers; you can add a cleanup crew on the Budget page.'; })() + '</p><ul class="incl"><li>Check parking and let neighbors know</li><li>Plan restrooms: one for every 25 to 30 guests</li><li>Clear a spot for food, drinks and gifts</li>' + (ev.guests > 40 ? '<li>Consider a small tent or canopy for overflow</li>' : '') + '</ul><div class="row"><button class="btn ghost small" id="whereAgain">Change where it is</button><a class="btn ghost small" href="' + (ev.sample ? '#/sample/' + ev.id.split('-')[1] : '#/e/' + ev.id) + '/vendors">See rentals and vendors</a></div></div></div>';
    }
    /* Put the kinds of place the host asked for first (e.g. "hotel", "rooftop", "garden") */
    var said = ((ev.inspiration && ev.inspiration.text) || '').toLowerCase() + ' ' + ((ev.inspiration && ev.inspiration.vibes) || []).join(' ').toLowerCase() + (ev.venueKind === 'ballroom' ? ' hotel ballroom' : '');
    var WANT = [['hotel', /hotel|ballroom/], ['rooftop', /rooftop|skyline|view/], ['garden', /garden|outdoor|estate/], ['mansion', /mansion|historic/], ['vineyard', /vineyard|winery|barn|rustic/], ['loft', /loft|industrial/], ['museum', /museum|gallery|art/], ['steakhouse', /steak/], ['tea', /tea\b|tea party|high tea/], ['wine', /wine/], ['brunch', /brunch/], ['private dining', /private (dining|room)/], ['park', /\bpark\b|picnic/], ['beach', /beach|waterfront|lake/]];
    var score = function (v) { var lv = v.toLowerCase(); return WANT.reduce(function (n, w) { return n + (lv.indexOf(w[0]) >= 0 && w[1].test(said) ? 1 : 0); }, 0); };
    if (/hotel|ballroom/.test(said) && !types.some(function (v) { return /hotel/i.test(v); })) types.unshift(ev.setting === 'restaurant' || ev.setting === 'privateRoom' ? 'Hotel tea room' : 'Hotel ballroom');
    var dinner = E.startHour(ev) >= 15;
    types = types.filter(function (v) { return dinner ? !/brunch or lunch|tea room/i.test(v) || /tea/.test(said) : !/dinner spot/i.test(v); });
    types.sort(function (x, y) { return score(y) - score(x); });
    var typesAll = types.length; types = cut(types, 2, ev);
    var venueLine = b.items.find(function (i) { return i.id === 'venue' || i.id === 'privateDining'; });
    var city = ev.city.replace(/^Other (US city|city in .+)$/, '');
    var foodLine = b.items.filter(function (i) { return i.id === 'restaurantFood' || i.id === 'restaurantDrinks'; }).reduce(function (s2, i) { return s2 + i.mid; }, 0);
    var intro = ev.setting === 'restaurant'
      ? 'Your food and drinks come to about ' + money(foodLine / Math.max(1, ev.guests)) + ' per person with tax and ' + (tipsHere(ev) ? 'tip' : 'service') + '. Look for restaurants that take reservations for ' + plural(ev.guests, 'guest') + '.'
      : (venueLine ? 'Your venue budget is about ' + money(venueLine.mid) + '. ' : '') + 'Look for spaces that hold ' + plural(ev.guests, 'guest') + (ev.setting === 'outdoor' ? ' outdoors' : '') + '.';
    var filters = '<details class="vf-wrap"' + (ev.area || ev.start ? ' open' : '') + '><summary class="link small">' + (ev.area ? 'Showing places near ' + esc(ev.area) + ' \u00b7 change' : 'Narrow by area or add drive times') + '</summary><form class="panel venue-filter" id="vfilter"><label class="field"><span>Area or neighborhood (optional)</span><input class="input" id="varea" list="vareaList" value="' + esc(ev.area || '') + '" placeholder="e.g. Uptown, The Woodlands, Downtown"><datalist id="vareaList">' + (D.AREAS[ev.city] || []).map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist></label>' +
      '<label class="field"><span>Your starting point, for drive times (optional)</span><input class="input" id="start" value="' + esc(ev.start || '') + '" placeholder="Home, hotel or ceremony address"></label>' +
      '<div><button class="btn small">Apply</button></div></form></details>';
    return (ev.settingOpen ? whereCompare(ev) : '') + '<div class="stack"><h3>' + (ev.setting === 'restaurant' ? 'Restaurants that fit this plan' : 'Venues that fit this plan') + '</h3><p class="muted">' + intro + '</p>' +
      (AI.live ? HOWTO('venue') : '') + filters + '<p class="small muted">' + (AI.live ? 'Tap See venues on any kind of place to see top-rated options in ' + esc(city) + '. Open any one for photos, hours and contact details, then reach out to schedule a tour. ' : '') + 'Every list is matched to ' + (b.tier.id === 'F' ? 'your budget' : 'your ' + esc({ L: 'Luxe for Less', S: 'Signature', U: 'Ultra Luxe' }[venueLevel(ev, b)]) + ' level') + ': well-reviewed, polished places only, never budget chains.</p>' +
      optBar(ev, venueCat(ev), true).replace('class="optbar', 'class="optbar wide') + newVenues(ev) + (AI.live ? '' : '<div class="note">' + (CFG.app ? 'Live venue details couldn\u2019t load right now, so each idea opens a map search. Check your connection and try again.' : 'Live venue photos, ratings, hours and drive times appear here when venue search is connected at launch. For now, each idea opens a live map search.') + '</div>') +
      '<div class="list panel">' + types.map(function (v) {
        var q = venueQuery(v, ev, b) + ' in ' + (ev.area ? ev.area + ', ' : '') + city;
        var dir = ev.start ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(ev.start) + '&destination=' + encodeURIComponent(q) + '">Drive time</a>' : '';
        var pc = venueProsCons(v, ev);
        if (AI.live) return '<div class="it"><div class="grow"><b>' + esc(v) + '</b><div class="small muted">Pros: ' + esc(pc[0]) + '. Cons: ' + esc(pc[1]) + '.</div></div><span class="acts"><button class="btn small" data-live="' + esc(v) + '" data-q="' + esc(venueQuery(v, ev, b)) + '" data-level="' + venueLevel(ev, b) + '">See venues</button></span></div><div class="live-res" data-for="' + esc(v) + '"></div>';
        return '<div class="it"><div class="grow"><b>' + esc(v) + '</b><div class="small muted">Pros: ' + esc(pc[0]) + '. Cons: ' + esc(pc[1]) + '.</div></div><span class="acts"><a class="btn small ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) + '">View on map</a>' + dir + '</span></div>';
      }).join('') + '</div>' + more(ev, typesAll, types.length, 'venue styles') + '<div id="live"></div></div>';
  };
  /* Newly opened venues we checked by hand, shown when they fit the city, the kind of event and the guest count. */
  function newVenues(ev) {
    var dining = E.typeOf(ev.type).style === 'dining' || ['wedding', 'gala', 'quince', 'anniversary'].indexOf(ev.type) >= 0;
    var list = (D.NEW_VENUES || []).filter(function (v) {
      return v.city === ev.city && (ev.settingOpen || v.settings.indexOf(ev.setting) >= 0) && v.types.indexOf(ev.type) >= 0 && ev.guests <= (dining ? v.seated : v.standing);
    });
    if (!list.length) return '';
    return '<div class="stack"><h3>New in ' + esc(ev.city.split(',')[0]) + '</h3>' + list.map(function (v) {
      return '<div class="panel stack new-venue"><div class="row" style="justify-content:space-between"><b>' + esc(v.name) + '</b><span class="badge est">Newly opened</span></div><span class="muted small">' + esc(v.area) + ' \u00b7 ' + esc(v.address) + '</span><p>' + esc(v.about) + '</p><ul class="incl">' + v.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' +
        '<div class="row"><a class="btn small" target="_blank" rel="noopener" href="' + esc(v.site) + '">Visit their website</a><a class="btn small ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v.name + ' ' + v.address) + '">View on map</a></div>' +
        '<p class="muted small">Details from the venue\u2019s website. Event Couture isn\u2019t paid to show it. Confirm availability, pricing and what\u2019s included when you reach out.</p></div>';
    }).join('') + '</div>';
  }
  /* Turn a venue type into a search that finds polished places at the plan's level, never budget chains. */
  var VENUE_SEARCH = {
    'Hotel ballroom': 'hotel ballroom event venue', 'Hotel tea room': 'hotel afternoon tea room', 'Private dining room': 'restaurant private dining room',
    'Rooftop restaurant': 'rooftop restaurant', 'Wine bar with a private space': 'wine bar private event space', 'Event loft': 'event loft venue',
    'Garden venue': 'garden event venue', 'Tea room or bistro': 'tea room', 'Community or clubhouse room': 'clubhouse event room', 'Rooftop lounge': 'rooftop lounge private events',
    'Restaurant buyout': 'restaurant private events buyout', 'Banquet hall': 'banquet hall', 'Museum or gallery': 'museum event venue', 'Historic mansion': 'historic mansion event venue',
    'Estate or garden venue': 'estate wedding venue', 'Vineyard or barn': 'vineyard wedding venue', 'Rooftop with skyline views': 'rooftop event venue skyline view',
    'Upscale brunch or lunch spot': 'brunch restaurant', 'Park pavilion or picnic area': 'park pavilion rental', 'Event lawn or estate grounds': 'outdoor event lawn venue', 'Rooftop terrace': 'rooftop terrace event space', 'Beach or waterfront venue': 'waterfront event venue', 'Kids party venue or play space': 'kids party venue', 'Hotel brunch or afternoon tea': 'hotel brunch afternoon tea', 'Garden cafe or patio': 'garden cafe patio restaurant', 'Cocktail lounge or speakeasy': 'cocktail lounge private room', 'Steakhouse or chophouse': 'steakhouse', 'Wine bar or bistro': 'wine bar bistro', 'Trendy dinner spot with a large table': 'trendy restaurant large groups'
  };
  var LEVEL_WORD = { L: 'stylish highly rated', S: 'upscale', U: 'luxury five-star', F: 'upscale' };
  function venueLevel(ev, b) { var t = (b && b.tier && b.tier.id) || ev.tier || 'S'; if (t === 'F') { var pp = (b && b.total || 0) / Math.max(1, ev.guests || 1); t = pp > 250 ? 'U' : pp < 70 ? 'L' : 'S'; } return t; }
  function venueQuery(v, ev, b) { var q = VENUE_SEARCH[v] || v; if (ev.type !== 'wedding' && /\bwedding venue\b/.test(q)) q = q.replace(/\bwedding venue\b/, (OCCASION_WORD[ev.type] || 'event') + ' venue');   /* an engagement party searches for an engagement party venue */ return ((ev.type === 'kids-birthday' ? '' : LEVEL_WORD[venueLevel(ev, b)] + ' ') + q).trim(); }
  function venueProsCons(v, ev) {
    var m = {
      'Private dining room': ['food and space in one booking, no setup', 'food and drink minimums, set end time'],
      'Upscale brunch or lunch spot': ['bright, pretty and great for photos', 'busy on weekends, book ahead'],
      'Steakhouse or chophouse': ['polished service and big portions', 'higher prices per person'],
      'Wine bar or bistro': ['intimate and stylish', 'smaller tables for big groups'],
      'Trendy dinner spot with a large table': ['lively atmosphere', 'can be loud; may add a service charge for groups'],
      'Rooftop restaurant': ['views and built-in atmosphere', 'weather risk and higher minimums'],
      'Hotel tea room': ['elegant, quiet and polished', 'fewer decor options'],
      'Wine bar with a private space': ['intimate and stylish', 'smaller capacity'],
      'Event loft': ['a blank canvas for your concept', 'you bring rentals, food and setup'],
      'Garden venue': ['beautiful natural backdrop', 'needs a rain plan'],
      'Tea room or bistro': ['charming and affordable', 'limited hours'],
      'Community or clubhouse room': ['lowest cost', 'needs the most decor'],
      'Rooftop lounge': ['nightlife energy and views', 'weather and noise rules'],
      'Restaurant buyout': ['food, staff and drinks included', 'higher minimum spend'],
      'Backyard or home': ['free space and personal', 'rentals, restrooms and cleanup fall on you'],
      'Hotel ballroom': ['handles big groups with full service', 'can feel generic without decor'],
      'Banquet hall': ['good value for large groups', 'needs styling to feel luxe'],
      'Museum or gallery': ['unforgettable setting', 'strict decor and catering rules'],
      'Historic mansion': ['grand architecture for photos', 'early booking and strict rules'],
      'Estate or garden venue': ['romantic outdoor ceremony and reception', 'rain plan and rentals needed'],
      'Vineyard or barn': ['scenic and relaxed', 'often outside the city'],
      'Rooftop with skyline views': ['dramatic evening photos', 'weather risk and capacity limits'],
      'Park pavilion or picnic area': ['low cost with shade and space to play', 'reserve early; rules on music and decor'],
      'Event lawn or estate grounds': ['room for a tent, games and a big table', 'needs a tent, restrooms and power'],
      'Rooftop terrace': ['open air with a view', 'weather and capacity limits'],
      'Beach or waterfront venue': ['breezy and unforgettable photos', 'wind, permits and a rain plan'],
      'Kids party venue or play space': ['activities and staff for children', 'set time slots and package menus'],
      'Hotel brunch or afternoon tea': ['elegant and calm for daytime', 'set menus and seatings'],
      'Garden cafe or patio': ['bright and pretty for photos', 'weather on the patio'],
      'Cocktail lounge or speakeasy': ['moody and intimate for the night', 'smaller space, 21 and over']
    };
    return m[v] || ['fits your guest count', 'check what is included'];
  }
  /* Place searches are remembered on the plan for a week, so results come back instantly and nothing is paid for twice. */
  function HOWTO(kind) { return '<ol class="howto" aria-label="How to choose"><li><b>See</b> real, top-rated ' + (kind === 'venue' ? 'places' : 'businesses') + ' near you</li><li><b>Save</b> up to 3 you like</li><li><b>Compare</b> them, then mark the one you book</li></ol>'; }
  /* Free fallback: the same search on Google Maps, opened by the guest (costs nothing). */
  function mapsSearch(ev, cat, q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((q || VENDOR_SEARCH[cat] || catName(cat, ev)).replace(/^(upscale|luxury|affordable|budget-friendly) /i, '') + ' near ' + (ev.city || '').replace(/^Other (US city|city in )/, '')); }
  function mapsBtn(ev, cat, q, cls) { return '<a class="' + (cls || 'link small') + '" target="_blank" rel="noopener" href="' + esc(mapsSearch(ev, cat, q)) + '">Search on Google Maps</a>'; }
  var LIVE_RESTING = false;   /* the month's free searches are used up */
  function findPlaces(ev, body) {
    var key = JSON.stringify(['v4', body.cat || '', body.query, body.level, body.kind || '', body.city]), c = ev.placeCache = ev.placeCache || {}, hit = c[key];
    if (hit && Date.now() - hit.at < 7 * 864e5) return Promise.resolve(hit.places);
    var sendBody = Object.assign({}, body); var sco = E.countryOf(ev.city); if (sco.id === 'CA' && !/canada/i.test(sendBody.city || '')) sendBody.city = (sendBody.city || '') + ', Canada'; else if (sco.id !== 'US' && sco.id !== 'CA' && (sendBody.city || '').toLowerCase().indexOf(sco.name.toLowerCase()) < 0 && (sendBody.city || '').indexOf(sco.short) < 0) sendBody.city = (sendBody.city || '') + ', ' + sco.name;   /* London, ON is not London, England */
    return fetch(CFG.apiUrl + '/api/places', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sendBody) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) { if (j.code === 'limit') LIVE_RESTING = true; throw new Error(j.error); } return j.places || []; }); })
      .then(function (list) { if (!ev.sample) { c[key] = { at: Date.now(), places: list }; var ks = Object.keys(c).sort(function (a, b) { return c[b].at - c[a].at; }); ks.slice(30).forEach(function (k) { delete c[k]; }); saveEvent(ev); } return list; });
  }
  TAB_BIND.places = function (ev, save, rerender) {
    bindSave(ev, $('#tab'), function () { refreshBars(ev); }); bindWhere(ev, rerender); bindCompare(ev, rerender); runPendingFind(ev);
    $$('[data-live]').forEach(function (btn) { btn.addEventListener('click', function () {
      $$('.live-res').forEach(function (x) { x.innerHTML = ''; }); ev.lastVenue = btn.dataset.live;
      var box = document.querySelector('.live-res[data-for="' + btn.dataset.live.replace(/"/g, '') + '"]') || $('#live'); box.innerHTML = '<p class="muted small" style="padding:8px 0">Finding venues\u2026</p>';
      findPlaces(ev, { query: btn.dataset.q || btn.dataset.live, level: btn.dataset.level || 'S', city: (ev.area ? ev.area + ', ' : '') + ev.city })
        .then(function (list) {
          if (!list.length) { box.innerHTML = '<p class="muted">No well-reviewed matches nearby for this type. Try another venue type, or switch to a different budget version.</p>'; return; }
          var placesAll = list.length; list = cut(list, 3, ev);
          var ids = list.map(function (p) { return p.id; });
          box.innerHTML = '<div class="curated"><p class="eyebrow">Top-rated ' + esc(btn.dataset.live.toLowerCase()) + 's in ' + esc(ev.city.split(',')[0]) + '</p>' + list.map(function (p) { return '<div class="it"><div class="grow"><b>' + esc(p.name) + '</b>' + hotelBadge(p.name) + '<div class="small muted">' + (p.rating ? '\u2605 ' + p.rating + ' \u00b7 ' + Number(p.reviews || 0).toLocaleString('en-US') + ' reviews \u00b7 ' : '') + esc(p.address || '') + '</div><div class="small muted" data-dt="' + esc(p.id) + '"></div></div><span class="acts">' + saveBtn(ev, p, venueCat(ev)) + (isRestaurantPick(ev, venueCat(ev), { id: p.id, name: p.name, maps: p.mapsUrl, reservable: p.reservable }) && (ev.setting === 'restaurant' || ev.setting === 'privateRoom') ? '<a class="btn small gold" target="_blank" rel="noopener" href="' + esc(reserveLink(ev, { name: p.name, maps: p.mapsUrl })) + '">Reserve a table</a>' : '') + '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(p.mapsUrl) + '">View details</a></span></div>'; }).join('') + '<p class="muted small">Ratings from Google. Pricing and availability come directly from each venue when you inquire.</p></div>' + more(ev, placesAll, list.length, 'top-rated places');
          $$('[data-keep]', box).forEach(function (k) { k.addEventListener('click', function () { keepSheet(ev, 'Keep your plan', function () { location.reload(); }); }); });
          if (ev.start && ids.length) {
            var origin = /,|\d{5}/.test(ev.start) ? ev.start : ev.start + ', ' + ev.city;
            fetch(CFG.apiUrl + '/api/drive', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ origin: origin, placeIds: ids }) })
              .then(function (r) { return r.json(); }).then(function (j) {
                var times = j.times || [];
                if (!times.length) { box.querySelector('.curated').insertAdjacentHTML('beforeend', '<p class="small" style="color:var(--warn)">We couldn\u2019t find your starting point. Try a full street address.</p>'); return; }
                times.forEach(function (t) { var el = box.querySelector('[data-dt="' + t.placeId + '"]'); if (el) { el.textContent = t.minutes + ' min drive \u00b7 ' + (E.countryOf(ev.city).km ? Math.round(t.miles * 16.09) / 10 + ' km' : t.miles + ' mi'); el.closest('.it').dataset.min = t.minutes; } });
                var wrap = box.querySelector('.curated'); var rows = [].slice.call(wrap.querySelectorAll('.it')).sort(function (a, c) { return (+a.dataset.min || 999) - (+c.dataset.min || 999); });
                var note = wrap.querySelector('p.muted.small'); rows.forEach(function (r) { wrap.insertBefore(r, note); });
              }).catch(function () {});
          }
        }).catch(function (e) { box.innerHTML = '<p class="muted">' + esc(e.message || 'Venue search isn\u2019t available right now.') + '</p>'; });
    }); });
    if (AI.live) { var first = (ev.lastVenue && document.querySelector('[data-live="' + ev.lastVenue.replace(/"/g, '') + '"]')) || document.querySelector('[data-live]'); if (first && !document.querySelector('.live-res .curated')) first.click(); }   /* real places show right away */
    var wa = $('#whereAgain'); if (wa) wa.addEventListener('click', function () { var w = $('#where'); if (w) w.click(); else lockSample(ev); });
    if (!$('#vfilter')) return;
    $('#vfilter').addEventListener('submit', function (e) {
      e.preventDefault();
      ev.area = $('#varea').value.trim(); ev.start = $('#start').value.trim(); save();
      var last = ev.lastVenue; rerender();
      toast(ev.area || ev.start ? 'Updated' + (ev.area ? ' for ' + ev.area : '') : 'Filters cleared');
      if (last) { var bt = document.querySelector('[data-live="' + last.replace(/"/g, '') + '"]'); if (bt) bt.click(); }
    });
  };

  /* Vendors: by category with estimates; ask for a price */
  var NO_SEARCH = ['venue', 'privateDining', 'restrooms', 'generator', 'permits', 'insurance', 'parking', 'restaurantFood', 'restaurantDrinks', 'cakeFee', 'tableDecor', 'contingency'];
  /* Searches name the occasion and, where it matters, the theme: a wedding photographer, a quinceañera DJ,
     red and gold wedding decor, unicorn party balloons, catering for 150 guests. */
  var OCCASION_WORD = { wedding: 'wedding', engagement: 'engagement party', quince: 'quincea\u00f1era', sweet16: 'sweet 16', 'baby-shower': 'baby shower', 'bridal-shower': 'bridal shower', 'gender-reveal': 'gender reveal', 'kids-birthday': 'kids party', birthday: 'birthday party', milestone: 'birthday party', graduation: 'graduation party', corporate: 'corporate event', gala: 'gala', christmas: 'holiday party', holiday: 'holiday party', brunch: 'brunch', dinner: 'private dinner', anniversary: 'anniversary party', retirement: 'retirement party', bachelorette: 'bachelorette party' };
  var BY_OCCASION = ['photographer', 'videographer', 'dj', 'florals', 'cake', 'catering', 'hairMakeup', 'decor', 'balloons', 'liveMusic', 'entertainment', 'kids'];
  var BY_THEME = ['decor', 'balloons', 'kids', 'entertainment'];
  function occasionHint(ev) { var hc = E.culture(ev); if (hc) return hc.hint; return { wedding: 'wedding,bridal', quince: 'quince,quincea\u00f1era,xv', 'kids-birthday': 'kids,party', 'baby-shower': 'baby,shower', 'bridal-shower': 'bridal,wedding', corporate: 'corporate,event' }[ev.type] || ''; }
  function vendorQuery(ev, i, lvl) {
    if (i.id === 'characterVisit') { var THEMES = [[/princess|frozen|elsa|cinderella|belle|rapunzel|ariel/i, 'princess party characters'], [/super ?hero|spider|batman|marvel|avengers/i, 'superhero party characters'], [/mermaid/i, 'mermaid party entertainment'], [/unicorn/i, 'unicorn party entertainment'], [/pirate/i, 'pirate party entertainment'], [/dino/i, 'dinosaur party entertainment'], [/fairy/i, 'fairy party entertainment']]; var th = null; [(ev.inspiration && ev.inspiration.text) || '', ev.name || '', (ev.concept && ev.concept.name) || ''].some(function (said) { th = THEMES.find(function (t) { return t[0].test(said); }); return th; }); return th ? th[1] : 'kids party character entertainment'; }   /* her own words first, then the look's name */   /* her theme's characters */
    var vcu = E.culture(ev); if (vcu && vcu.search[i.id]) return vcu.search[i.id];
    var cw = vcu && cultureWord(ev); if (cw && CULTURE_CATS[i.id]) return cw + CULTURE_CATS[i.id];
    var vs = ev.alcohol === 'none' && i.id === 'bar' ? 'mocktail bar service' : ev.alcohol === 'none' && i.id === 'bartender' ? 'mocktail bartender service' : VENDOR_SEARCH[i.id];
    var base = (vs || i.name.split(' (')[0]), occ = OCCASION_WORD[ev.type] || '';
    if (BY_OCCASION.indexOf(i.id) >= 0 && occ) {
      base = base.replace(/^event /, '').replace(/^kids party /, '').replace(/ for events$/, '');
      if (i.id === 'hairMakeup') base = /wedding|quince|bridal|engagement|bachelorette/.test(ev.type) ? 'bridal hair and makeup artist' : 'hair and makeup artist for events';
      else if (i.id === 'cake') base = occ + (ev.type === 'wedding' ? ' cakes bakery' : ' cake bakery');
      else if (i.id === 'catering') base = occ + ' catering' + (ev.guests >= 100 ? ' for large events' : '');
      else base = occ + ' ' + base;
    }
    var kidsy = /kids|baby|gender/.test(ev.type);
    if (i.id === 'florals' && kidsy) base = 'florist';
    var theme = themeWords(ev);
    if ((BY_THEME.indexOf(i.id) >= 0 || (kidsy && i.id === 'cake')) && theme && base.indexOf(theme) < 0) base = theme + ' ' + base;
    return ((ev.type === 'kids-birthday' ? '' : LEVEL_WORD[lvl] + ' ') + base).replace('luxury five-star', 'luxury').replace(/\s+/g, ' ').trim();
  }
  /* A cultural wedding searches its own way for the things that differ by culture: Indian bridal wear, not a formalwear store. */
  var CULTURE_CATS = { attire: ' bridal wear boutique', favors: ' wedding favors', decor: ' wedding decor', hairMakeup: ' bridal makeup artist', photographer: ' wedding photographer', videographer: ' wedding videographer', catering: ' catering', dj: ' wedding DJ', liveMusic: ' wedding band', singer: ' wedding singer', officiant: ' wedding officiant', invitations: ' wedding invitations', florals: ' wedding florist' };
  function cultureWord(ev) { return ev.culture && ev.culture !== 'africanamerican' && D.CULTURES[ev.culture] ? D.CULTURES[ev.culture].name.replace(/ wedding$/i, '').toLowerCase() : ''; }
  /* When the first search comes back short, these searches fill the gaps, so no line is left empty. */
  var PKG_FALLBACK = { characterVisit: ['princess party characters', 'superhero party characters', 'kids party entertainment'], gameTruck: ['video game truck', 'kids party games entertainment'], magician: ['magician for kids', 'bubble show'], balloonTwister: ['balloon artist kids party'], craftStation: ['kids craft party', 'slime party'], pettingZoo: ['petting zoo', 'pony rides'], chocolateFountain: ['chocolate fountain catering', 'dessert catering'], dessertBar: ['dessert table catering', 'candy buffet'], iceCreamCart: ['gelato catering', 'ice cream truck'], coffeeBar: ['coffee cart catering', 'espresso catering'], foodTruck: ['food truck'], popcornCart: ['cotton candy machine rental', 'concession rentals'], booth360: ['360 booth', 'photo booth rental'], livePainter: ['live wedding painter', 'event painter'], caricature: ['caricature artist'], flowerWall: ['flower wall rental', 'event backdrop rental'], bounceHouse: ['party inflatables rental'], facePainter: ['face painting'], effects: ['cold spark machine rental', 'dancing on a cloud'], danceFloor: ['dance floor rental', 'LED dance floor rental'], baraat: ['wedding horse rental', 'dhol player'], dhol: ['dhol player', 'indian wedding DJ'], liveMusic: ['live wedding band', 'live band for events'], singer: ['wedding singer', 'live wedding band'],
    cake: ['wedding cake bakery'], mehndi: ['henna artist', 'mehndi artist'], mandap: ['indian wedding decor', 'wedding stage decor'], kosha: ['wedding stage decor'], sofreh: ['persian wedding decor'], officiant: ['wedding officiant'],
    attire: ['bridal boutique'], favors: ['wedding favors'], zaffe: ['zaffe', 'arabic wedding entertainment'], dabke: ['dabke dance group'], qawwali: ['qawwali'], mariachi: ['mariachi band'], lionDance: ['lion dance'],
    teaCeremony: ['tea ceremony wedding'], giftTrays: ['wedding gift trays'], gele: ['gele tying'], flamenco: ['flamenco dancers'], gospel: ['gospel choir', 'gospel singer'], secondLine: ['brass band'] };
  /* Businesses that are the wrong kind for the line, by name: a venue is not an officiant, a DJ company is not a singer. */
  var PKG_REJECT = {
    officiant: /gardens?\b|event (center|centre|hall|venue)|ballroom|banquet|\bvenue|hotel|estate|manor|reception|\bhall\b/i,
    singer: /\bdjs?\b|event (center|centre|hall)|banquet|ballroom|\bvenue|rentals?\b|tents?\b/i,
    liveMusic: /\bdjs?\b(?!.*\bband)|event (center|centre|hall)|banquet|ballroom|\bvenue|rentals?\b|tents?\b|zaff|zeff|dabk|folklor|dance (theat|troupe|group|company)/i,
    mehndi: /\bnails?\b|lash|brow|barber|salon\b(?!.*henna)/i,
    baraat: /\bdjs?\b(?!.*(horse|baraat|dhol))|banquet|ballroom/i,
    attire: /pi[ñn]ata|costume|party (city|supply|supplies)|uniform|thrift|resale/i,
    favors: /hanbok|bridal|boutique|dress|gown|tailor|alteration|salon|art (supply|supplies|materials)|blick|michaels|hobby lobby|office/i,
    cleanup: /cater|bakery|restaurant|florist|carpet|maid|house ?keeping|home cleaning|janitorial/i
  };
  var NOT_A_VENDOR = /\b(islamic|society|mosque|masjid|church|temple|mandir|synagogue|gurdwara|parish|ministr(y|ies)|community cent(er|re)|school|academy|university|college)\b/i;
  var STAGE_CATS = ['kosha', 'mandap', 'sofreh', 'decor', 'backdrop'];
  var NOT_STAGE = /photo|foto|video|film|portrait|headshot/i;
  /* The state or province in a Google address ("..., Englewood, NJ 07631, USA"); a business in another state is never local. */
  function stateOf(addr) { var m = /,\s([A-Z]{2})\s(\d{5}|[A-Z]\d[A-Z])/.exec(addr || ''); return m ? m[1] : ''; }
  function sameState(ev, p) { if (['US', 'CA'].indexOf(E.countryOf(ev.city).id) < 0) return true; var want = (ev.city || '').split(', ')[1] || '', got = stateOf(p.address); return !want || !got || want === got || /orange county/i.test(ev.city) && got === 'CA'; }
  var ADULT_FAVORS = /pi[ñn]ata|balloon|party (city|supply|supplies|store)|\btoys?\b|kids/i;
  var PKG_PREFER = { characterVisit: /princess|character|hero|party|entertain|fairy|mascot/i, gameTruck: /game|truck|play/i, magician: /magic|bubble|illusion/i, balloonTwister: /balloon/i, craftStation: /craft|slime|art|diy/i, pettingZoo: /zoo|pony|farm|animal/i, chocolateFountain: /fountain|chocolate|dessert|cater/i, dessertBar: /dessert|candy|sweet|treat|cater/i, iceCreamCart: /ice cream|gelato|cream|frozen/i, coffeeBar: /coffee|espresso|barista|latte|brew/i, foodTruck: /truck|food|grill|taco|kitchen/i, popcornCart: /popcorn|cotton candy|concession|rental/i, booth360: /360|booth|photo/i, livePainter: /paint|art|canvas/i, caricature: /caricatur|artist|draw/i, flowerWall: /flower|floral|wall|backdrop/i, bounceHouse: /bounce|inflat|jump|rental/i, facePainter: /face|paint/i, effects: /spark|fog|cloud|effect|fx|sound|light/i, danceFloor: /floor|dance|rental|led/i, kosha: /stage|kosha|decor|design|backdrop|event/i, mandap: /mandap|stage|decor|design/i, sofreh: /sofreh|aghd|decor|design/i, mehndi: /henna|mehndi|mehendi|mehandi/i, baraat: /horse|baraat|carriage|dhol/i, dhol: /dhol/i, officiant: /officiant|minister|priest|pandit|pujari|imam|maulvi|rabbi|reverend|pastor|temple|mandir|masjid|mosque|church|celebrant|ceremon/i,
    singer: /sing|vocal|voice|music|band/i, liveMusic: /band|music|orchestra|ensemble|live/i, zaffe: /zaff|zeff|zafe|dabke|arab/i, mariachi: /mariachi/i, lionDance: /lion|dragon|kung fu|martial/i, gele: /gele/i, qawwali: /qawwal/i };
  function fitsLine(ev, cat, p) {
    var n = p.name || '';
    if (PKG_REJECT[cat] && PKG_REJECT[cat].test(n)) return false;
    if (cat !== 'officiant' && NOT_A_VENDOR.test(n)) return false;
    if (STAGE_CATS.indexOf(cat) >= 0 && NOT_STAGE.test(n)) return false;
    if (!sameState(ev, p)) return false;
    if (cat === 'favors' && !/kids|baby|gender/.test(ev.type) && ADULT_FAVORS.test(n)) return false;
    return true;
  }
  function rankLine(ev, cat, list) {
    var pref = PKG_PREFER[cat], hc = E.culture(ev), words = hc && hc.hint ? new RegExp('\\b(' + hc.hint.split(',').map(function (w) { return w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).filter(Boolean).join('|') + ')', 'i') : null;
    var score = function (p) { return (pref && pref.test(p.name || '') ? 2 : 0) + (words && words.test(p.name || '') ? 1 : 0); };
    return list.filter(function (p) { return fitsLine(ev, cat, p); }).map(function (p, i) { return { p: p, s: score(p), i: i }; }).sort(function (a, b) { return b.s - a.s || a.i - b.i; }).map(function (x) { return x.p; });
  }
  /* The theme in plain search words: a motif for kids' parties (unicorn, princess), otherwise the look's two main colors. */
  var KID_MOTIF = /\b(unicorn|princess|space|rainbow|mermaid|dinosaur|safari|superhero|fairy|pirate|carnival|jungle|under the sea|butterfly|construction|cowboy)\b/i;
  var HEX_NAMES = [['red', 200, 30, 40], ['burgundy', 122, 14, 27], ['gold', 212, 175, 55], ['pink', 247, 198, 217], ['blush', 236, 196, 190], ['lavender', 200, 182, 255], ['light blue', 184, 224, 246], ['navy', 20, 30, 80], ['blue', 40, 90, 200], ['sage', 156, 175, 136], ['emerald', 10, 110, 70], ['green', 60, 150, 60], ['silver', 192, 192, 200], ['black', 17, 17, 17], ['white', 250, 250, 248], ['ivory', 247, 241, 227], ['orange', 240, 140, 40], ['yellow', 245, 215, 60], ['purple', 110, 40, 140], ['teal', 20, 130, 130], ['brown', 110, 70, 40]];
  function hexName(h) { var m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return ''; var n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, best = '', d = 1e9; HEX_NAMES.forEach(function (c) { var e = (r - c[1]) * (r - c[1]) + (g - c[2]) * (g - c[2]) + (b - c[3]) * (b - c[3]); if (e < d) { d = e; best = c[0]; } }); return best; }
  function themeWords(ev) {
    var c = ev.concept || {}; if (c.shop) return String(c.shop).replace(/ party$/, '');
    var label = String(c.styleName || c.name || '');
    if (/kids/.test(ev.type)) { var k = KID_MOTIF.exec(label + ' ' + (ev.text || '')); if (k) return k[1].toLowerCase(); }
    var cols = [];
    (c.palette || []).forEach(function (h) { var n = hexName(h); if (n && cols.indexOf(n) < 0 && !/^(white|ivory|black)$/.test(n)) cols.push(n); });
    if (cols.indexOf('burgundy') >= 0 && cols.indexOf('red') >= 0) cols.splice(cols.indexOf('red'), 1);
    return cols.slice(0, 2).join(' and ');
  }
  /* Real, top-rated businesses for one category, shown under the button that asked for them (Vendors and Budget pages). */
  /* Around Google's results: Event Couture vendors first, then Get quotes and Instagram vendors. */
  function openVendorResults(ev, btn) {
    googleVendorResults(ev, btn);
    $$('.live-extra').forEach(function (x) { x.remove(); });
    var cat = btn.dataset.vendor, box = document.querySelector('.live-res[data-for="v-' + cat + '"]'); if (!box) return;
    box.insertAdjacentHTML('beforebegin', '<div class="live-extra ecv" data-ecv="' + esc(cat) + '"></div>');
    box.insertAdjacentHTML('afterend', '<div class="live-extra mk" data-mk="' + esc(cat) + '">' + marketBlock(ev, cat) + '</div>');
    bindMarket(ev, cat);
    if (SHARING) apiMarket('vendors?city=' + encodeURIComponent(ev.city) + '&cat=' + encodeURIComponent(cat)).then(function (j) {
      var el = document.querySelector('[data-ecv="' + cat + '"]'), list = (j.vendors || []).slice(0, 4); if (!el || !list.length) return;
      el.innerHTML = '<div class="curated"><p class="eyebrow">Event Couture vendors</p>' + list.map(function (x) {
        var p = { id: 'ec:' + x.id, name: x.name, website: x.ig ? 'https://instagram.com/' + x.ig : x.site, mapsUrl: siteBase() + '#/v/' + x.id };
        return '<div class="it"><div class="grow"><b>' + esc(x.name) + '</b> <span class="badge est">' + (x.featured ? 'Recommended' : x.founding ? 'Founding vendor' : 'Event Couture vendor') + '</span><div class="small muted">' + (x.price ? esc(x.priceType || 'From') + ' ' + money(x.price) + ' \u00b7 ' : '') + esc(x.bio ? x.bio.slice(0, 90) : x.cats.map(catLabel).join(', ')) + '</div></div><span class="acts">' + saveBtn(ev, p, cat) + (x.ig ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://instagram.com/' + esc(x.ig) + '">Instagram</a>' : '') + '<a class="btn small ghost" href="#/v/' + esc(x.id) + '">View page</a></span></div>';
      }).join('') + '</div>';
    }).catch(function () {});
  }
  function vendorAsk(ev, cat) {
    var need = E.lc(catName(cat, ev)).replace(/ \(.*\)$/, ''); if (['dj', 'mc', 'singer', 'zaffe', 'dabke', 'dhol', 'photographer', 'videographer', 'officiant', 'coordinator', 'bartender', 'photoBooth', 'chocolateFountain', 'dessertBar', 'coffeeBar', 'foodTruck', 'booth360', 'livePainter', 'caricature', 'flowerWall', 'bounceHouse', 'facePainter', 'characterVisit', 'gameTruck', 'magician', 'balloonTwister', 'craftStation', 'pettingZoo', 'mehndi', 'kosha', 'mandap'].indexOf(cat) >= 0) need = (/^[aeiou]/i.test(need) ? 'an ' : 'a ') + need;
    var b = E.budget(ev, ev.tier || 'S'), line = b.items.find(function (i) { return i.id === cat; });
    var theme = themeWords(ev);
    var tn = ev.type === 'other' ? 'celebration' : E.typeName(ev);
    return 'Hi! I\u2019m planning ' + (/^[aeiou]/i.test(tn) ? 'an ' : 'a ') + (E.culture(ev) ? tn.charAt(0) + tn.slice(1).toLowerCase() : tn.toLowerCase()) + ' in ' + ev.city.split(',')[0] + (ev.date ? ' on ' + fmtDate(ev.date) : ev.dateFrom ? ' sometime between ' + shortDate(ev.dateFrom) + ' and ' + shortDate(ev.dateTo || ev.dateFrom) : '') + ' for about ' + plural(ev.guests, 'guest') + ', and I\u2019d love a quote for ' + need + '.' + (theme ? ' The theme is ' + theme + '.' : '') + (line && !CFG.app ? ' My budget for this is about ' + money(line.mid) + '.' : '') + ' Are you available?\n\nPlanned with Event Couture by Always Luxe. Vendors: get listed free at ' + siteBase() + '#/vendors';
  }
  function marketBlock(ev, cat) {
    var q = (ev.quotes || {})[cat], reps = ((ev.quoteReplies || {})[cat]) || [];
    var quotes = !SHARING || ev.sample ? '' : q ? '<div class="stack"><b>Quotes from vendors' + (reps.length ? ' (' + reps.length + ')' : '') + '</b>' + (reps.length ? reps.map(function (r) {
        var p = { id: 'ec:' + r.vid, name: r.card.name, website: r.card.ig ? 'https://instagram.com/' + r.card.ig : r.card.site, mapsUrl: siteBase() + '#/v/' + r.vid };
        return '<div class="it"><div class="grow"><b>' + esc(r.card.name) + '</b>' + (r.price ? ' <span class="num">' + money(r.price) + '</span>' : '') + '<div class="small">' + esc(r.msg) + '</div><div class="small muted">' + [r.card.phone, r.email].filter(Boolean).map(esc).join(' \u00b7 ') + '</div></div><span class="acts">' + saveBtn(ev, p, cat) + (r.card.ig ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://ig.me/m/' + esc(r.card.ig) + '">Message</a>' : r.email ? '<a class="btn small ghost" href="mailto:' + esc(r.email) + '">Email</a>' : '') + '</span></div>'; }).join('') : '<span class="muted small">Your request is out. Event Couture vendors in ' + esc(ev.city.split(',')[0]) + ' reply here, usually within a day or two.</span>') + '</div>'
      : '<div class="stack"><button class="btn small" data-getq="' + esc(cat) + '">Get quotes from vendors</button><span class="muted small">Free. Vendors see your date, city, guest count, theme and budget for this, never your name or contact details.</span></div>';
    var ig = (ev.shortlist || []).filter(function (x) { return x.cat === cat && /^ig:/.test(x.id); });
    var recs = recFor(ev, cat);
    var recH = recs.length ? '<div class="stack rec-box"><p class="eyebrow">\u2605 Recommended by Event Couture</p>' + recs.map(function (r) { var saved = savedFor(ev, cat).some(function (x) { return x.id === r.id; }); return '<div class="it"><div class="grow"><b>' + esc(r.name) + '</b> <span class="badge rec">Recommended</span><div class="small muted">' + esc(r.note) + (r.ig ? ' \u00b7 @' + esc(r.ig) : '') + '</div></div><span class="acts"><a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(r.website) + '">' + (r.ig ? 'Instagram' : 'Map') + '</a>' + (ev.sample ? '' : saved ? (r.ig ? '<button class="btn small" data-igmsg="' + esc(r.ig) + '">Message</button>' : '<span class="badge ok">Saved</span>') : '<button class="btn small" data-recadd="' + esc(r.id) + '">Save</button>') + '</span></div>'; }).join('') + '</div>' : '';
    return '<div class="panel stack" style="margin-top:10px">' + recH + quotes +
      '<div class="stack"><b>Found someone on Instagram?</b><span class="muted small">Add them to your options, then message them your request in one tap.</span><div class="row"><input class="input" data-ighandle placeholder="@their.instagram" aria-label="Instagram handle" style="flex:1;min-width:150px" autocapitalize="off" autocorrect="off"><button class="btn small ghost" data-igadd>Add</button></div>' +
      ig.map(function (x) { var h = x.id.slice(3); return '<div class="row small"><b>@' + esc(h) + '</b><button class="btn small" data-igmsg="' + esc(h) + '">Message @' + esc(h) + '</button></div>'; }).join('') + '</div></div>';
  }
  function bindMarket(ev, cat) {
    var el = document.querySelector('[data-mk="' + cat + '"]'); if (!el) return;
    var redraw = function () { el.innerHTML = marketBlock(ev, cat); };
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-getq]')) { if (lockSample(ev)) return; return askQuotes(ev, cat, redraw); }
      var ra = e.target.closest('[data-recadd]');
      if (ra) { if (lockSample(ev)) return; if (savedFor(ev, cat).length >= MAX_OPTIONS) return toast('Remove one of your 3 saved ' + E.lc(catName(cat, ev)) + ' options first.'); var rp = recFor(ev, cat).find(function (r) { return r.id === ra.dataset.recadd || r.ig === ra.dataset.recadd; }); if (rp) { addOption(ev, asOption(rp, cat)); saveEvent(ev); redraw(); toast(rp.name + ' saved to your options'); } return; }
      if (e.target.closest('[data-igadd]')) {
        if (lockSample(ev)) return;
        var h = String($('[data-ighandle]', el).value || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
        if (!/^[A-Za-z0-9._]{1,30}$/.test(h)) { toast('Enter their Instagram handle, like @layali.voice'); $('[data-ighandle]', el).focus(); return; }
        if (savedFor(ev, cat).length >= MAX_OPTIONS) return toast('Remove one of your 3 saved ' + E.lc(catName(cat, ev)) + ' options first.');
        if (!(ev.shortlist || []).some(function (x) { return x.id === 'ig:' + h && x.cat === cat; })) addOption(ev, { id: 'ig:' + h, cat: cat, name: '@' + h, site: 'https://instagram.com/' + h });
        saveEvent(ev); redraw(); refreshBars(ev); toast('@' + h + ' is saved in your ' + E.lc(catName(cat, ev)) + ' options'); return;
      }
      var m = e.target.closest('[data-igmsg]');
      if (m) { var txt = vendorAsk(ev, cat); copyText(txt, 'Your message'); setTimeout(function () { window.open('https://ig.me/m/' + encodeURIComponent(m.dataset.igmsg), '_blank', 'noopener'); }, 400); }
    });
  }
  function askQuotes(ev, cat, done) {
    var b = E.budget(ev, ev.tier || 'S'), line = b.items.find(function (i) { return i.id === cat; });
    sheet('<h3>Get quotes: ' + esc(catName(cat, ev)) + '</h3><p class="muted small">Event Couture vendors in ' + esc(ev.city.split(',')[0]) + ' who offer this see your request and reply with a price. Your name and contact details are never shared; you choose who to reach out to.</p>' +
      '<div class="note small">' + reqLine({ type: E.typeName(ev), date: ev.date, guests: ev.guests, city: ev.city }) + (themeWords(ev) ? ' \u00b7 ' + esc(themeWords(ev)) : '') + '</div>' +
      '<label class="field"><span>Your budget for this (' + E.currency() + ', optional)</span><input class="input num" type="number" min="0" id="qBudget" value="' + (line && !CFG.app ? Math.round(line.mid) : '') + '"></label>' +
      '<label class="field"><span>Anything they should know? (optional)</span><textarea class="input" id="qNotes" placeholder="For example: we want Arabic and English songs"></textarea></label>' +
      '<button class="btn block" id="qSend">Send my request</button><button class="btn ghost block" data-close>Cancel</button>');
    $('#qSend').addEventListener('click', function () {
      var bt = this; bt.disabled = true;
      if (!ev.quoteKey) ev.quoteKey = randKey();
      apiMarket('req/new', { key: ev.quoteKey, req: { city: ev.city, cat: cat, need: catName(cat, ev), type: E.typeName(ev), date: ev.date || '', guests: ev.guests, budget: +$('#qBudget').value || 0, theme: themeWords(ev), notes: ((ev.date || !ev.dateFrom ? '' : 'Flexible dates: ' + whenText(ev).replace(/^Between/, 'between') + '. ') + $('#qNotes').value.trim()).slice(0, 300) } })
        .then(function (j) { ev.quotes = ev.quotes || {}; ev.quotes[cat] = { id: j.id, at: Date.now() }; saveEvent(ev); $$('.sheet-back').forEach(function (x) { x.remove(); }); toast('Request sent. Quotes show up here.'); T('quote_requested', { category: cat }); done(); })
        .catch(function (e) { bt.disabled = false; toast(e.message || 'Couldn\u2019t send right now. Try again.'); });
    });
  }
  /* Vendor replies to her quote requests, fetched when the plan opens. */
  function syncQuotes(ev) {
    if (!SHARING || !ev.quoteKey || !ev.quotes) return;
    var cats = Object.keys(ev.quotes), ids = cats.map(function (c) { return ev.quotes[c].id; });
    apiMarket('req/inbox', { key: ev.quoteKey, ids: ids }).then(function (j) {
      var before = 0, after = 0; ev.quoteReplies = ev.quoteReplies || {};
      cats.forEach(function (c) { before += (ev.quoteReplies[c] || []).length; var r = (j.replies || {})[ev.quotes[c].id]; if (r) { ev.quoteReplies[c] = r; after += r.length; } else after += (ev.quoteReplies[c] || []).length; });
      saveEvent(ev); if (after > before) toast(plural(after - before, 'new quote') + ' from vendors. See them under Vendors.');
    }).catch(function () {});
  }
  function googleVendorResults(ev, btn) {
      $$('.live-res').forEach(function (x) { x.innerHTML = ''; });
      var box = document.querySelector('.live-res[data-for="v-' + btn.dataset.vendor + '"]'); if (!box) return; box.innerHTML = '<p class="muted small" style="padding:8px 0">Finding top-rated businesses\u2026</p>';
      ev.lastVendor = btn.dataset.vendor;
      findPlaces(ev, { query: btn.dataset.q, level: btn.dataset.level || 'S', kind: 'vendor', cat: btn.dataset.vendor, hint: occasionHint(ev), city: ev.city })
        .then(function (list) {
          if (!list.length) { box.innerHTML = '<p class="muted small">No well-reviewed matches nearby. Try a different area on the Venues tab.</p>'; return; }
          var bizAll = list.length; list = cut(list, 3, ev);
          var PL = { PRICE_LEVEL_INEXPENSIVE: 'Budget-friendly', PRICE_LEVEL_MODERATE: 'Moderate prices', PRICE_LEVEL_EXPENSIVE: 'Upscale', PRICE_LEVEL_VERY_EXPENSIVE: 'Luxury prices' };
          box.innerHTML = '<div class="curated">' + list.map(function (p) { return '<div class="it"><div class="grow"><b>' + esc(p.name) + '</b>' + hotelBadge(p.name) + '<div class="small muted">' + (p.rating ? '★ ' + p.rating + ' · ' + Number(p.reviews || 0).toLocaleString('en-US') + ' reviews' : '') + (PL[p.priceLevel] ? ' · ' + PL[p.priceLevel] : '') + (p.address ? ' · ' + esc(p.address.split(',').slice(0, 2).join(',')) : '') + '</div></div><span class="acts">' + saveBtn(ev, p, btn.dataset.vendor) + (p.website ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(p.website) + '">Website</a>' : '') + '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(p.mapsUrl) + '">View details</a></span></div>'; }).join('') + '<p class="muted small">Ratings from Google. Exact pricing comes from each business when you inquire.</p></div>' + more(ev, bizAll, list.length, 'top-rated businesses');
          $$('[data-keep]', box).forEach(function (k) { k.addEventListener('click', function () { keepSheet(ev, 'Keep your plan', function () { location.reload(); }); }); });
        }).catch(function (e) { box.innerHTML = '<p class="muted small">' + esc(e.message || 'Search isn’t available right now.') + '</p>'; });
  }
  /* Vendors: the actual product or service for each category (never planners), with typical local prices. */
  var VENDOR_SEARCH = {
    decor: 'event decor rentals centerpieces backdrops', florals: 'florist', cake: 'custom cake bakery', photographer: 'event photographer',
    videographer: 'event videographer', dj: 'event DJ', liveMusic: 'live band for events', balloons: 'balloon decor installations', lighting: 'event lighting rental',
    rentals: 'party rentals tables chairs linens', catering: 'catering company', bartender: 'mobile bartending service', bar: 'mobile bar service',
    hairMakeup: 'hair and makeup artist', photoBooth: 'photo booth rental', effects: 'cold spark machine rental and dancing on a cloud', danceFloor: 'custom dance floor rental',
    chocolateFountain: 'chocolate fountain rental', dessertBar: 'candy buffet and dessert table', iceCreamCart: 'ice cream cart catering', coffeeBar: 'mobile espresso coffee bar', foodTruck: 'food truck catering for events',
    popcornCart: 'popcorn and cotton candy machine rental', booth360: '360 photo booth rental', livePainter: 'live event painter', caricature: 'caricature artist for events', flowerWall: 'flower wall backdrop rental',
    bounceHouse: 'bounce house rental', facePainter: 'face painter for kids parties', characterVisit: 'kids party character entertainment', gameTruck: 'game truck party', magician: 'kids party magician', balloonTwister: 'balloon twister for kids parties', craftStation: 'kids party craft station', pettingZoo: 'mobile petting zoo pony rides', entertainment: 'event entertainment', kids: 'kids party entertainment', mc: 'event MC host',
    transport: 'luxury transportation limo', security: 'event security', coordinator: 'day-of event coordinator', cleanup: 'event setup and cleanup crew',
    officiant: 'wedding officiant', favors: 'custom party favors', invitations: 'custom invitations stationery', attire: 'formal wear boutique'
  };
  var VENDOR_NOTE = {
    decor: 'Centerpieces, backdrop, linens styling and setup', florals: 'Centerpieces, bouquets and installations', cake: 'Custom cake sized to your guest count',
    photographer: 'Coverage hours, edited gallery', dj: 'Music, sound system and announcements', balloons: 'Garland or arch with install',
    lighting: 'Uplighting and setup', rentals: 'Tables, chairs, linens, tableware, delivery', hairMakeup: 'On-site styling for the guest of honor',
    photoBooth: 'Booth, attendant and prints', effects: 'Cold sparks or low fog for the first dance and grand entrance', danceFloor: 'Floor, custom wrap, delivery and install',
    chocolateFountain: 'Fountain, chocolate, dippers and an attendant', dessertBar: 'Styled table, sweets, jars and setup', iceCreamCart: 'Cart, server and flavors for your guest count', coffeeBar: 'Barista, espresso drinks and setup',
    foodTruck: 'Truck, menu and service for your guests', popcornCart: 'Machines, supplies and an attendant', booth360: 'Platform, attendant and shareable videos', livePainter: 'A painting of your event, finished on the day',
    caricature: 'Quick drawings guests take home', flowerWall: 'Backdrop delivered and set up for photos', bounceHouse: 'Inflatable, delivery and setup', facePainter: 'Face painting for the kids', characterVisit: 'A costumed character for songs, photos and games', gameTruck: 'Video game truck or a host running party games', magician: 'A show for the kids, about 45 minutes', balloonTwister: 'Balloon animals and swords for every kid', craftStation: 'Supplies and a host for a hands-on craft', pettingZoo: 'Animals, handlers and setup', catering: 'Food, staff and service', bartender: 'Licensed bartenders per hour', videographer: 'Coverage and edited film'
  };
  TAB_VIEWS.vendors = function (ev, b) {
    var city = ev.city.replace(/^Other (US city|city in .+)$/, '');
    var cats = b.items.filter(function (i) { return ['venue', 'privateDining', 'tent', 'restrooms', 'generator', 'permits', 'insurance', 'parking', 'restaurantFood', 'restaurantDrinks', 'cakeFee', 'tableDecor'].indexOf(i.id) < 0; });
    var restNote = ev.setting === 'restaurant' ? '<div class="note">Your restaurant handles the food and drinks. Pick the restaurant on the Venues page; table decor is on the Style and music page.</div>' : '';
    if (!cats.length) return '<div class="stack"><h3>Vendors for this plan</h3>' + restNote + '<p class="muted">No other vendors are needed for this plan.</p></div>';
    var lvl = venueLevel(ev, b);
    var catsAll = cats.length; cats = cut(cats, 3, ev);
    return '<div class="stack"><h3>Vendors for this plan</h3>' + restNote + (AI.live ? HOWTO('vendor') : '') + '<p class="muted">Estimated prices in ' + esc(city.split(',')[0] || 'your city') + ' for your guest count and ' + (b.tier.id === 'F' ? 'budget' : esc({ L: 'Luxe for Less', S: 'Signature', U: 'Ultra Luxe' }[lvl]) + ' level') + ', including tax and ' + (tipsHere(ev) ? 'tips' : 'service charges') + ' where they apply. ' + (AI.live ? 'Tap See options on any category to see top-rated businesses that provide it.' : '') + '</p>' +
      '<div class="list panel">' + cats.map(function (i) {
        var q = vendorQuery(ev, i, lvl);
        return '<div class="it"><div class="grow"><b>' + esc(i.name) + '</b> ' + statusBadge(ev, i.id) + '<div class="small">Estimated cost <b class="num">about ' + money(i.lo) + ' to ' + money(i.hi) + '</b></div>' + (VENDOR_NOTE[i.id] ? '<div class="small muted">' + esc(i.id === 'hairMakeup' ? 'On-site styling for ' + honoree(ev) + (ev.type === 'wedding' || /shower|bachelorette|quince/.test(ev.type) ? ' and the party' : '') : VENDOR_NOTE[i.id]) + '</div>' : '') + (i.id === 'hairMakeup' ? '<div>' + FC_LINK + '</div>' : '') + optBar(ev, i.id) + '</div>' +
          '<span class="acts">' + (AI.live ? '<button class="btn small ghost" data-vendor="' + esc(i.id) + '" data-q="' + esc(q) + '" data-level="' + lvl + '">See options</button>' : '<a class="btn small ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q + ' in ' + city) + '">View on map</a>') + '</span></div><div class="live-res" data-for="v-' + esc(i.id) + '"></div>';
      }).join('') + '</div>' + more(ev, catsAll, cats.length, 'vendor categories with prices') + '<p class="muted small"><b>All prices are estimates</b> from typical local rates, not quotes. Real prices come from each vendor. Add a real quote anytime under Budget and your totals update. You pay vendors directly; Event Couture never holds your money.</p></div>';
  };
  TAB_BIND.style = function (ev) {
    var al = $('#allSongs'); if (al) { $('.songs').classList.add('short'); al.addEventListener('click', function () { var open = $('.songs').classList.toggle('short') === false; al.setAttribute('aria-expanded', open); al.textContent = open ? 'Show fewer songs' : 'Show all ' + $$('.songs li').length + ' songs'; }); }
    var b = $('#copySongs'); if (!b) return;
    b.addEventListener('click', function () { var nm = document.querySelector('.pl-name'); copyText((nm ? nm.textContent + '\n\n' : '') + [].slice.call(document.querySelectorAll('.songs li')).map(function (li, i) { var sh = li.querySelector('.sec-h'); return (sh ? (i ? '\n' : '') + sh.textContent + '\n' : '') + (i + 1) + '. ' + li.querySelector('b').textContent + ' \u2014' + li.querySelector('.muted').textContent; }).join('\n')); });
  };
  TAB_BIND.vendors = function (ev, save, rerender) {
    bindSave(ev, $('#tab'), function () { refreshBars(ev); }); bindCompare(ev, rerender); runPendingFind(ev);
    $$('[data-vendor]').forEach(function (btn) { btn.addEventListener('click', function () { openVendorResults(ev, btn); }); });
    if (AI.live && ev.lastVendor && !PENDING_FIND) { var lv = document.querySelector('[data-vendor="' + ev.lastVendor.replace(/"/g, '') + '"]'); if (lv) lv.click(); }   /* reopen the last options she looked at */
  };

  /* Food and drink: menu, dietary needs, quantities */
  /* The menu that fits this event (time of day, kind of event, setting, budget, drinks). */
  function menuItems(ev) {
    var day = E.startHour(ev) < 15;
    var said = ((ev.inspiration && ev.inspiration.text) || '').toLowerCase();
    var mstyle = ev.concept.menuStyle; if (mstyle === 'quince' && ['quince', 'sweet16'].indexOf(ev.type) < 0) mstyle = 'elegant';   /* a quinceañera photo used for another event */
    if (/tea party|high tea|afternoon tea/.test(said)) mstyle = 'sweet';
    else if ((day || ev.type === 'brunch') && ['modern', 'elegant', 'classic', 'party', 'rustic'].indexOf(mstyle) >= 0) mstyle = 'garden';   /* daytime gets brunch and lunch dishes */
    if (mstyle === 'garden' && !day && ev.type !== 'brunch') mstyle = 'gardenDinner';
    if (['gala', 'wedding', 'anniversary'].indexOf(ev.type) >= 0 && ['modern', 'party', 'sweet'].indexOf(mstyle) >= 0) mstyle = 'classic';
    if ((ev.type === 'holiday' || ev.type === 'christmas')) mstyle = 'holiday';
    if (ev.type === 'quince') mstyle = 'quince';
    var mcu = E.culture(ev); if (mcu && D.MENUS[mcu.menu]) mstyle = mcu.menu;   /* a cultural wedding gets its own food */   /* formal dinners get plated food, not sliders */
    if ((ev.setting === 'restaurant' || ev.setting === 'privateRoom') && ['party', 'sweet', 'rustic'].indexOf(mstyle) >= 0) mstyle = day ? 'garden' : 'modern';
    if (ev.budget && ev.budget / Math.max(1, ev.guests) < 60 && ['coastal', 'elegant', 'classic'].indexOf(mstyle) >= 0 && ev.setting !== 'restaurant') mstyle = 'rustic';   /* lean budgets get crowd-pleasers, not lobster */
    if (ev.kids && /birthday/.test(ev.type)) mstyle = 'kids';   /* garden looks at night get a garden dinner, not brunch */
    return drinkSafe(D.MENUS[mstyle] || D.MENUS.party, ev, 'menu');
  }
  TAB_VIEWS.food = function (ev) {
    var day = E.startHour(ev) < 15;
    var menuAll = menuItems(ev); var menu = cut(menuAll, 3, ev);
    var diets = {}; (ev.guestsList || []).forEach(function (g) { (g.diet || []).forEach(function (d) { diets[d] = (diets[d] || 0) + 1; }); });
    var qAll = E.quantities(ev); var q = cut(qAll, 3, ev);
    var rest = ev.setting === 'restaurant';
    return (rest ? '<div class="stack"><h3>Ordering at the restaurant</h3><div class="panel"><ul class="incl"><li>Call ahead: groups of ' + Math.max(6, Math.min(10, ev.guests)) + ' or more often get a set menu or an automatic service charge</li><li>Ask about separate checks before you sit down</li><li>Pre-order a few shared starters so food arrives quickly</li><li>Ask about the cake-cutting fee, or order dessert from the menu instead</li></ul></div></div>' : '') +
      '<div class="stack"><h3>' + (rest ? 'Look for these on the menu' : 'Menu ideas') + '</h3><div class="panel"><ul class="incl">' + menu.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>' + more(ev, menuAll.length, menu.length, 'menu ideas') +
      '<p class="muted small">Menu ideas are suggestions. Confirm every allergy directly with your caterer or restaurant.</p></div>' +
      '<div class="stack"><h3>Dietary needs from RSVPs</h3>' + (Object.keys(diets).length ? '<div class="chips">' + Object.keys(diets).map(function (d) { return '<span class="badge">' + esc(d) + ': ' + diets[d] + '</span>'; }).join('') + '</div>' : '<p class="muted">Guests add these when they RSVP. They’ll show up here.</p>') + '</div>' +
      '<div class="stack"><div class="row" style="justify-content:space-between"><h3>How much to get</h3><label class="row small">Expected guests <input class="input num" type="number" min="1" id="exp" value="' + (ev.expected || ev.guests) + '" style="width:96px;min-height:40px"></label></div>' +
      '<div class="panel table-wrap"><table class="qty"><thead><tr><th>Item</th><th>Amount</th><th>How we got it</th></tr></thead><tbody>' + q.map(function (r) { return '<tr><td>' + esc(r.item) + '</td><td class="n">' + r.qty.toLocaleString('en-US') + ' ' + esc(r.unit) + '</td><td class="muted small">' + esc(r.note) + '</td></tr>'; }).join('') + '</tbody></table></div>' + more(ev, qAll.length, q.length, 'items with exact amounts') + '</div>';
  };
  TAB_BIND.food = function (ev, save, rerender) {
    $('#exp').addEventListener('change', function () { var v = Math.max(1, Math.min(ev.guests, +this.value || 1)); if (!ev.sample) { ev.expected = v; save(); } else ev.expected = v; rerender(); });
  };

  /* Style and music: shopping board, playlist, outfits */
  /* Amazon Associates requires this exact disclosure wherever tagged links appear (US links only; Canada links carry no tag). */
  var SHOP_COUNTRY = null;   /* the plan's country, set when its pages are drawn */
  function amazonNote() { return CFG.amazonTag && (SHOP_COUNTRY ? SHOP_COUNTRY.id === 'US' : E.currency() === 'USD') ? 'As an Amazon Associate, Event Couture earns from qualifying purchases.' : ''; }
  function shopLink(q) {
    var tag = CFG.amazonTag ? '&tag=' + encodeURIComponent(CFG.amazonTag) : '';
    var sco = SHOP_COUNTRY || D.COUNTRIES.find(function (k) { return k.currency === E.currency(); }) || D.COUNTRIES[0];
    if (sco.id !== 'US') return { amazon: 'https://www.' + sco.amazon + '/s?k=' + encodeURIComponent(q), etsy: 'https://www.etsy.com/search?q=' + encodeURIComponent(q) };   /* the Amazon tag is for the US store only */
    return { amazon: 'https://www.amazon.com/s?k=' + encodeURIComponent(q) + tag, etsy: 'https://www.etsy.com/search?q=' + encodeURIComponent(q) };
  }
  /* Get this look: every piece named in the host's words, marked in her photos, or seen in the chosen photo or look, with where to buy it or who to hire. */
  var HIRE_WHO = { florals: 'a florist', cake: 'a baker', balloons: 'a balloon artist', decor: 'a decorator', rentals: 'a rental company', lighting: 'a lighting company', catering: 'a caterer', kids: 'a kids entertainer', liveMusic: 'a band', photoBooth: 'a photo booth company', effects: 'a special effects company', danceFloor: 'a dance floor rental company', chocolateFountain: 'a chocolate fountain company', dessertBar: 'a dessert bar company', iceCreamCart: 'an ice cream cart', coffeeBar: 'a coffee bar company', foodTruck: 'a food truck', popcornCart: 'a concessions rental company', booth360: 'a 360 booth company', livePainter: 'a live painter', caricature: 'a caricature artist', flowerWall: 'a flower wall rental', bounceHouse: 'a bounce house rental', facePainter: 'a face painter', characterVisit: 'a party character company', gameTruck: 'a game truck', magician: 'a magician', balloonTwister: 'a balloon twister', craftStation: 'a craft party host', pettingZoo: 'a petting zoo' };
  var WHY = { asked: 'You asked for this', loved: 'You marked this in your photo', photo: 'In the inspiration photo', ai: 'In your inspiration', look: 'Part of this look' };
  function lookList(ev) {
    var rest = ev.setting === 'restaurant' || ev.setting === 'privateRoom';
    var re = ev.alcohol === 'none' ? ALC : ev.alcohol === 'wine' ? HARD : null;
    return E.lookPieces(ev).filter(function (p) {
      if (re && (re.test(p.name) || re.test(p.q))) return false;
      if (rest && (['rentals', 'decor', 'lighting', 'balloons', 'photoBooth'].indexOf(p.hire) >= 0 || BIG_DECOR.test(p.name))) return false;
      if (ev.kids && /birthday/.test(ev.type) && /candle|neon|disco|nightclub|cocktail|bartender|\bbar\b/i.test(p.name + ' ' + p.q)) return false;
      if (ev.alcohol === 'none' && /bartender|mimosa|sangria|margarita|ros\u00e9|whiske?y|prosecco/i.test(p.name + ' ' + p.q)) return false;
      return true;
    });
  }
  function getLook(ev) {
    var rest = ev.setting === 'restaurant' || ev.setting === 'privateRoom';
    var all = lookList(ev);
    if (!all.length) return '';
    var base = ev.sample ? '#/sample/' + ev.id.split('-')[1] : '#/e/' + ev.id;
    var list = cut(all, 4, ev);
    return '<div class="stack"><h3>Get this look</h3><p class="muted">Everything it takes to bring ' + esc(ev.concept.styleName) + ' to life: the pieces you can buy yourself, and the ones a pro makes for you.' + (rest ? ' Only what a restaurant allows on the table is listed.' : '') + '</p><div class="list panel get-look">' +
      list.map(function (p) {
        var l = p.q ? shopLink(p.q) : null;
        return '<div class="it"><div class="grow"><b>' + esc(p.name) + '</b>' + hotelBadge(p.name) + '<div class="small muted">' + esc(WHY[p.why] || '') + (p.hire ? ' \u00b7 Hire ' + esc(HIRE_WHO[p.hire] || 'a pro') : ' \u00b7 Buy it') + '</div></div><span class="acts">' +
          (l ? '<a class="btn small" target="_blank" rel="noopener" href="' + l.amazon + '">Amazon</a><a class="btn small ghost" target="_blank" rel="noopener" href="' + l.etsy + '">Etsy</a>' : '<a class="btn small ghost" href="' + base + '/vendors">Find ' + esc(HIRE_WHO[p.hire] || 'a pro') + '</a>') + '</span></div>';
      }).join('') + '</div>' + more(ev, all.length, list.length, 'pieces') +
      '<p class="small muted">' + (all.some(function (p) { return p.q; }) ? 'Store links search for that exact piece so you can compare live prices and pick the one you like. ' : '') + 'Show your vendors your inspiration photo so they can match it.' + (amazonNote() && all.some(function (p) { return p.q; }) ? ' ' + amazonNote() : '') + '</p></div>';
  }
  TAB_VIEWS.style = function (ev) {
    var c = ev.concept; var st = D.STYLES.find(function (x) { return x.id === c.id; }) || {}; var color = c.shop || st.shop || String(c.styleName || c.name || 'party').toLowerCase();
    var tables = Math.ceil((ev.expected || ev.guests) / 8), g = ev.expected || ev.guests;
    var rest = ev.setting === 'restaurant';
    var items = rest ? [
      { q: color + ' small floral centerpiece', name: 'Small centerpieces', each: [12, 35], qty: Math.max(1, Math.ceil(g / 6)) },
      { q: color + ' votive candles', name: 'Votive candles (set of 12)', each: [12, 28], qty: 1 },
      { q: color + ' table confetti', name: 'Table confetti', each: [6, 14], qty: 1 },
      { q: color + ' place cards', name: 'Place cards', each: [8, 20], qty: 1 },
      { q: color + ' cake topper', name: 'Cake topper', each: [10, 30], qty: 1 },
      { q: color + ' party favors', name: 'Favors', each: [1.5, 4], qty: g },
      { q: E.dressCode(ev, ev.tier).toLowerCase() + ' outfit', name: 'Your outfit', each: [60, 250], qty: 1 }
    ] : [
      { q: color + ' balloon garland kit', name: 'Balloon garland kit', each: [25, 60], qty: 1 },
      { q: color + ' table runner', name: 'Table runners', each: [10, 28], qty: tables },
      { q: color + ' taper candles', name: 'Taper candles (set of 12)', each: [16, 36], qty: tables },
      { q: color + ' cocktail napkins', name: 'Beverage napkins (pack of 50)', each: [8, 18], qty: Math.ceil(g * 3 / 50) },
      { q: color + ' party backdrop', name: 'Photo backdrop', each: [40, 150], qty: 1 },
      { q: color + ' party favors', name: 'Favors', each: [1.5, 4], qty: g },
      { q: E.dressCode(ev, ev.tier).toLowerCase() + ' outfit', name: 'Your outfit', each: [60, 250], qty: 1 }
    ];
    /* Skip do-it-yourself picks for things a hired pro already covers in this plan. */
    var hired = E.budget(ev, ev.tier).items.map(function (i) { return i.id; });
    if (hired.indexOf('balloons') >= 0 || ['wedding', 'gala', 'anniversary', 'dinner', 'engagement'].indexOf(ev.type) >= 0) items = items.filter(function (it) { return it.name !== 'Balloon garland kit'; });
    if (hired.indexOf('attire') >= 0) items = items.filter(function (it) { return it.name !== 'Your outfit'; });
    if (g <= 4) items = items.filter(function (it) { return it.name !== 'Favors' && it.name !== 'Place cards'; });
    if (ev.type === 'corporate') items = items.filter(function (it) { var inc = ev.include || []; return !(it.name === 'Balloon garland kit' && inc.indexOf('balloons') < 0 || it.name === 'Favors' && inc.indexOf('favors') < 0 || it.name === 'Your outfit'); });   /* a work event: no balloons, favors or outfit unless she adds them */
    if (hired.indexOf('favors') >= 0) items = items.filter(function (it) { return it.name !== 'Favors'; });   /* already in the budget */
    var bigHired = !rest && g >= 100 && hired.indexOf('decor') >= 0;
    if (bigHired) items = items.filter(function (it) { return ['Table runners', 'Taper candles (set of 12)', 'Beverage napkins (pack of 50)', 'Photo backdrop'].indexOf(it.name) < 0; });
    if (E.startHour(ev) < 16) items = items.map(function (it) { return it.name === 'Taper candles (set of 12)' ? { q: color + ' bud vases', name: 'Bud vases (set of 12)', each: [14, 30], qty: Math.max(1, Math.ceil(tables / 2)) } : it; });
    if (ev.kids && /birthday/.test(ev.type)) items = items.map(function (it) { return it.name === 'Votive candles (set of 12)' ? { q: color + ' party hats', name: 'Party hats (pack of 12)', each: [8, 18], qty: Math.max(1, Math.ceil(g / 12)) } : it; });
    if (ev.kids && /birthday/.test(ev.type)) items = items.map(function (it) { return it.name === 'Taper candles (set of 12)' ? { q: color + ' party plates and cups', name: 'Party plates and cups (pack of 24)', each: [10, 22], qty: Math.ceil(g / 24) } : it; });
    var decorLine = E.budget(ev, ev.tier).items.find(function (i) { return i.id === 'tableDecor'; });
    var usd = function (n) { return E.symOf(E.currency()) + (n % 1 ? n.toFixed(2) : Number(n).toLocaleString('en-US')); };
    var shopLo = items.reduce(function (t, it) { return t + it.each[0] * it.qty; }, 0), shopHi = items.reduce(function (t, it) { return t + it.each[1] * it.qty; }, 0);
    var pl = D.PLAYLIST_SEARCH(c.music);
    var itemsAll = items.length; items = cut(items, 2, ev);
    return getLook(ev) + (items.length ? ('<div class="stack"><h3>Table basics, with quantities</h3><p class="muted">' + (rest && decorLine ? 'Your budget includes about ' + money(decorLine.mid) + ' for table decor; these are the basics to buy with it, picked for the ' + esc(c.styleName) + ' look.' : bigHired && items.length ? 'For an event this size your decorator and rental company supply linens, candles and backdrops. These are personal touches to pick up yourself.' : 'Optional do-it-yourself picks for the ' + esc(c.styleName) + ' look. They\u2019re not counted in your budget.') + ' Links open the store, where you\u2019ll see live prices.' + (amazonNote() ? ' ' + amazonNote() + ' It costs you nothing extra.' : '') + '</p>' +
      (!items.length ? '<p class="small muted">Everything for this look is already covered by your hired vendors in the budget.</p></div>' : '<div class="shop">' + items.map(function (it, k) { var l = shopLink(it.q);
        return '<div class="prod"><div class="pimg" aria-hidden="true" style="background:linear-gradient(135deg,' + c.palette[k % c.palette.length] + ',' + c.palette[(k + 2) % c.palette.length] + ')"></div><div class="pbody"><b>' + esc(it.name) + '</b>' + (it.qty > 1 ? '<span class="small muted">' + it.qty + ' \u00d7 ' + usd(it.each[0]) + ' to ' + usd(it.each[1]) + ' each</span>' : '') + '<span class="num">' + money(it.each[0] * it.qty) + ' to ' + money(it.each[1] * it.qty) + '</span><span class="acts"><a class="btn small" target="_blank" rel="noopener" href="' + l.amazon + '">Shop Amazon</a><a class="btn small ghost" target="_blank" rel="noopener" href="' + l.etsy + '">Etsy</a></span></div></div>'; }).join('') + '</div>' + more(ev, itemsAll, items.length, 'shopping picks') +
      '<p class="small muted">Estimated shopping total: <b class="num">' + money(shopLo) + ' to ' + money(shopHi) + '</b>. ' + (bigHired ? '' : rest ? 'Sized to one table of ' + plural(g, 'guest') + '.' : 'Quantities are sized to ' + plural(g, 'guest') + ' and ' + plural(tables, 'table') + '.') + '</p></div>')) : '') +   /* nothing left to buy: no empty heading */
      (rest ? '' : (function () {
        var plo = playlistOf(ev), songs = plo.songs, plName = plo.name;
        var songsAll = songs.length; songs = cut(songs, 3, ev);
        var sp = function (q) { return 'https://open.spotify.com/search/' + encodeURIComponent(q); }, am = function (q) { return 'https://music.apple.com/us/search?term=' + encodeURIComponent(q); };
        return '<div class="stack" id="playlist"><h3>Your playlist</h3><div class="panel stack"><div class="pl-head"><span class="pl-name display">' + esc(plName) + '</span><span class="muted small">' + esc(songsAll) + ' songs for ' + esc(ev.name) + (ev.name.indexOf(c.styleName) >= 0 ? '' : ', picked for the ' + esc(c.styleName) + ' look') + '. Tap a song to play it, or hand this list to your DJ.</span></div><ol class="songs">' +
          songs.map(function (sg) { var q = sg[0] + ' ' + sg[1]; return '<li>' + (sg[2] ? '<span class="sec-h">' + esc(sg[2]) + '</span>' : '') + '<span class="grow"><b>' + esc(sg[0]) + '</b><span class="muted small"> ' + esc(sg[1]) + '</span></span><a class="link small" target="_blank" rel="noopener" href="' + sp(q) + '">Spotify</a><a class="link small" target="_blank" rel="noopener" href="' + am(q) + '">Apple Music</a></li>'; }).join('') +
          '</ol>' + (songs.length > 10 ? '<button class="btn small ghost" id="allSongs" aria-expanded="false">Show all ' + songs.length + ' songs</button>' : '') + more(ev, songsAll, songs.length, 'songs') + (preview(ev) ? '' : '<div class="row"><button class="btn small ghost" id="copySongs">Copy song list</button></div>') + '</div></div>';
      })()) +
      '<div class="stack"><h3>What to wear</h3><div class="panel stack">' + dressBlock(ev) + dots(c.palette, c.styleName + ' colors') + faceCard('look') + '</div></div>';
  };

  /* The plan's playlist: a cultural wedding's own songs, the look's songs, or a ready-made mix for each part of the day. */
  function playlistOf(ev) {
    var c = ev.concept || {};
    var cpl = E.culture(ev) && window.EC_CULTURE_SONGS && window.EC_CULTURE_SONGS[ev.culture];   /* a cultural wedding plays its own music first */
    var songs = cpl ? [] : (c.songs && c.songs.length >= 6 && !(ev.kids && /birthday/.test(ev.type)) ? c.songs.map(function (x) { var t = String(x).split(/ \u2014 | - /); return [t[0], t[1] || '']; }) : []);
    var have = {}; songs.forEach(function (x) { have[x[0].toLowerCase()] = 1; });
    if (cpl) cpl.sections.forEach(function (sec) { sec[1].forEach(function (x, i) { if (!have[x[0].toLowerCase()]) { have[x[0].toLowerCase()] = 1; songs.push([x[0], x[1], i === 0 ? sec[0] : '']); } }); });
    var skey = window.EC_SONG_KEY(c.music, ev.type, ev.kids), wedMix = !cpl && ev.type === 'wedding' && songs.length < 6;
    if (cpl && songs.length < 25) { var fill = 0; window.EC_SONGS['love songs soul'].concat(window.EC_SONGS['pop feel-good']).forEach(function (x) { if (songs.length < 25 && !have[x[0].toLowerCase()]) { have[x[0].toLowerCase()] = 1; songs.push([x[0], x[1], fill++ ? '' : 'More favorites']); } }); }
    if (wedMix) {
    /* A wedding needs music for each part of the day: ceremony, dinner and dancing. */
    var calm = ['string quartet classics', 'jazz brunch acoustic', 'indie acoustic sunset', 'yacht rock bossa nova', 'country folk acoustic'];
    var party = ['afrobeats reggaeton summer', 'r&b lounge house', 'deep house chill', 'pop feel-good', 'disco funk dance', 'r&b soul classics', 'swing jazz motown'];
    [[ev.alcohol === 'none' ? 'Ceremony and welcome hour' : 'Ceremony and cocktail hour', calm.indexOf(skey) >= 0 ? skey : 'string quartet classics', 8], ['Dinner', 'love songs soul', 8], ['Dancing', party.indexOf(skey) >= 0 ? skey : (skey === 'country folk acoustic' ? skey : 'disco funk dance'), 9]].forEach(function (sec) {
    var n = 0; window.EC_SONGS[sec[1]].forEach(function (x) { if (n < sec[2] && !have[x[0].toLowerCase()]) { have[x[0].toLowerCase()] = 1; songs.push([x[0], x[1], n === 0 ? sec[0] : '']); n++; } });
    });
    }
    window.EC_SONGS[skey].forEach(function (x) { if (songs.length < 25 && !have[x[0].toLowerCase()]) { have[x[0].toLowerCase()] = 1; songs.push(x); } });
    songs = songs.slice(0, 25);
    var plName = cpl ? cpl.name : c.playlistName || (wedMix ? 'From Aisle to Dance Floor' : window.EC_SONG_NAMES[skey]) || 'Party Playlist';
    return { name: plName, songs: songs };
  }

  /* Timeline: checklist and run of show */
  TAB_VIEWS.timeline = function (ev) {
    var listAll = E.checklist(ev); var list = cut(listAll, 4, ev);
    var rosAll = ev.ros || E.runOfShow(ev); var ros = cut(rosAll, 3, ev);
    return '<div class="stack"><h3>Checklist</h3>' + (ev.date ? '' : '<p class="muted">Add your event date to see due dates.</p>') + '<div class="panel">' +
      list.map(function (c) { var done = checkDone(ev, c.text); return '<label class="check' + (done ? ' done' : '') + '"><input type="checkbox" data-ck="' + esc(c.text) + '"' + (done ? ' checked' : '') + '><span class="grow"><span class="t">' + esc(c.text) + '</span>' + (c.due ? '<br><span class="small ' + (c.overdue && !done ? '' : 'muted') + '" style="' + (c.overdue && !done ? 'color:var(--bad)' : '') + '">' + (c.overdue && !done ? 'Overdue, was due ' + shortDate(c.due) : c.soon ? 'Do this soon' : 'Due ' + shortDate(c.due)) + '</span>' : '') + '</span></label>'; }).join('') + '</div>' + more(ev, listAll.length, list.length, 'checklist steps with due dates') + '</div>' +
      '<div class="stack"><div class="row" style="justify-content:space-between"><h3>Run of show</h3><label class="row small">Start <input class="input" type="time" id="tm" value="' + esc(ev.time || '18:00') + '" style="width:130px;min-height:40px"></label></div><div class="panel ros">' + ros.map(function (r) { return '<div><b>' + esc(r.time) + '</b><span>' + esc(r.text) + '</span></div>'; }).join('') + '</div>' + more(ev, rosAll.length, ros.length, 'moments in your day-of schedule') +
      '<p class="muted small">Co-hosts see this same timeline on the day.</p></div>';
  };
  TAB_BIND.timeline = function (ev, save, rerender) {
    $$('[data-ck]').forEach(function (cb) { cb.addEventListener('change', function () { if (lockSample(ev)) { cb.checked = !cb.checked; return; } ev.checklistDone = ev.checklistDone || {}; ev.checklistDone[cb.dataset.ck] = cb.checked; save(); cb.closest('.check').classList.toggle('done', cb.checked); }); });
    $('#tm').addEventListener('change', function () { if (lockSample(ev)) return; ev.time = this.value; delete ev.ros; save(); rerender(); });
  };

  /* Guests: list, capacity, waitlist, seating, co-hosts */
  TAB_VIEWS.guests = function (ev) {
    var used = E.placesUsed(ev.guestsList); var cap = placesCap(ev);
    var counts = { yes: 0, invited: 0, declined: 0, waitlist: 0 }; (ev.guestsList || []).forEach(function (g) { counts[g.status] = (counts[g.status] || 0) + 1; });
    var tables = {}; (ev.guestsList || []).filter(function (g) { return g.table; }).forEach(function (g) { (tables[g.table] = tables[g.table] || []).push(g); });
    return '<div class="stack"><div class="row" style="justify-content:space-between"><h3>Guest list</h3><span class="num muted">' + (cap >= 100000 ? plural(used, 'place') + ' used' : used + ' of ' + plural(cap, 'place')) + '</span></div>' +
      '<div class="meter' + (used > cap ? ' over' : '') + '"><i style="width:' + Math.min(100, used / Math.max(1, cap) * 100) + '%"></i></div>' +
      '<div class="chips"><span class="badge ok">' + counts.yes + ' coming</span><span class="badge">' + counts.invited + ' invited</span><span class="badge">' + counts.declined + ' declined</span><span class="badge warn">' + counts.waitlist + ' waitlist</span></div>' +
      '<form id="addg" class="row"><input class="input" aria-label="Guest name" id="gn" placeholder="Guest name" style="flex:2 1 180px"><label class="field" style="flex:0 0 96px"><span class="small muted">Plus-ones</span><input class="input num" id="gp" type="number" min="0" max="10" value="0"></label><button class="btn">Add guest</button></form>' +
      '<button class="link small" id="bulk" style="justify-self:start">Paste a list of names</button>' +
      '<div class="panel list">' + ((ev.guestsList || []).length ? ev.guestsList.map(function (g) {
        return '<div class="it"><div class="grow"><b>' + esc(g.name) + '</b>' + (g.plusOnes ? ' <span class="muted small">+' + g.plusOnes + '</span>' : '') + (g.diet && g.diet.length ? '<div class="small muted">' + esc(g.diet.join(', ')) + '</div>' : '') + '</div>' +
          '<select class="input" data-st="' + g.id + '" style="width:auto;min-height:40px" aria-label="RSVP status for ' + esc(g.name) + '">' + ['invited', 'yes', 'declined', 'waitlist'].map(function (s) { return '<option value="' + s + '"' + (g.status === s ? ' selected' : '') + '>' + { invited: 'Invited', yes: 'Coming', declined: 'Declined', waitlist: 'Waitlist' }[s] + '</option>'; }).join('') + '</select>' +
          '<button class="link small" data-rm="' + g.id + '">Remove</button></div>'; }).join('') : '<p class="muted">Add guests here, or share your event page and let guests RSVP themselves.</p>') + '</div></div>' +
      (ev.setting === 'restaurant' || ev.setting === 'privateRoom' ? '' : '<div class="stack"><div class="row" style="justify-content:space-between"><h3>Seating</h3><button class="btn small ghost" id="seat">Seat everyone who is coming</button></div>' +
      (Object.keys(tables).length ? '<div class="tables">' + Object.keys(tables).sort(function (a, b2) { return a - b2; }).map(function (t) { return '<div class="tbl"><h4>Table ' + t + '</h4><ul>' + tables[t].map(function (g) { return '<li>' + esc(g.name) + (g.plusOnes ? ' +' + g.plusOnes : '') + '</li>'; }).join('') + '</ul></div>'; }).join('') + '</div>' : '<p class="muted">Seats 8 per table, keeping each guest with their plus-ones.</p>') + '</div>') +
      '<div class="stack"><h3>Co-hosts</h3><div class="panel list">' + ((ev.cohosts || []).length ? ev.cohosts.map(function (c, i) { return '<div class="it"><span class="grow">' + esc(c.name) + '</span><span class="badge">' + esc(c.role) + '</span><button class="link small" data-rmc="' + i + '">Remove</button></div>'; }).join('') : '<p class="muted">Add ' + ({ wedding: 'your partner, maid of honor or a parent', 'bridal-shower': 'the maid of honor or a bridesmaid', bachelorette: 'the maid of honor or a bridesmaid', gala: 'a committee member', holiday: 'a coworker or committee member' }[ev.type] || 'a friend or family member') + ' to plan with you.</p>') + '</div>' +
      '<form id="addc" class="row"><input class="input" aria-label="Co-host name" id="cn" placeholder="Co-host name" style="flex:2 1 180px"><select class="input" id="cr" aria-label="What this co-host can do" style="flex:1 1 150px"><option>Can edit</option><option>Can edit, no budget</option><option>Can view and vote</option></select><button class="btn">Add co-host</button></form></div>';
  };
  TAB_BIND.guests = function (ev, save, rerender) {
    function cap() { return placesCap(ev); }
    function addGuest(name, plus) {
      var used = E.placesUsed(ev.guestsList); var status = used + 1 + plus > cap() ? 'waitlist' : 'invited';
      ev.guestsList.push({ id: uid(), name: name, plusOnes: plus, status: status, diet: [] }); return status;
    }
    $('#addg').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var n = $('#gn').value.trim(); if (!n) return toast('Enter a name'); var st = addGuest(n, Math.max(0, +$('#gp').value || 0)); save(); if (st === 'waitlist') toast('Capacity reached: ' + n + ' was added to the waitlist'); rerender(); });
    $('#bulk').addEventListener('click', function () { if (lockSample(ev)) return; sheet('<h3>Paste guest names</h3><textarea class="input" id="names" placeholder="One name per line"></textarea><button class="btn gold block" id="ok">Add guests</button><button class="btn ghost block" data-close>Cancel</button>', function (el, close) { $('#ok', el).addEventListener('click', function () { var w = 0; $('#names', el).value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (n) { if (addGuest(n, 0) === 'waitlist') w++; }); save(); close(); if (w) toast(w + ' went to the waitlist because capacity is full'); rerender(); }); }); });
    $$('[data-st]').forEach(function (s) { s.addEventListener('change', function () { if (lockSample(ev)) return; var g = ev.guestsList.find(function (x) { return x.id === s.dataset.st; }); var prev = g.status; g.status = s.value; if (E.placesUsed(ev.guestsList) > cap() && (s.value === 'yes' || s.value === 'invited')) { g.status = prev; toast('That would go over your ' + cap() + ' places. ' + (CFG.app ? 'Tap the guest count at the top of your plan to raise it (free), or free a place first.' : 'Move up a size under Overview, Your pass, or free a place first.')); } if (g.status === 'declined' || g.status === 'waitlist') promoteWaitlist(ev, cap()); save(); rerender(); }); });
    $$('[data-rm]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; ev.guestsList = ev.guestsList.filter(function (g) { return g.id !== b.dataset.rm; }); promoteWaitlist(ev, cap()); save(); rerender(); }); });
    if ($('#seat')) $('#seat').addEventListener('click', function () { if (lockSample(ev)) return; if (!ev.guestsList.some(function (g) { return g.status === 'yes'; })) return toast('No one has said yes yet. Mark guests as Coming, or wait for RSVPs.'); var t = 1, seats = 0; ev.guestsList.forEach(function (g) { g.table = null; }); ev.guestsList.filter(function (g) { return g.status === 'yes'; }).forEach(function (g) { var need = 1 + (g.plusOnes || 0); if (seats > 0 && seats + need > 8) { t++; seats = 0; } g.table = t; seats += need; }); save(); rerender(); });
    $('#addc').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var n = $('#cn').value.trim(); if (!n) return toast('Enter a name'); ev.cohosts = (ev.cohosts || []).concat({ name: n, role: $('#cr').value }); save(); rerender(); });
    $$('[data-rmc]').forEach(function (b) { b.addEventListener('click', function () { ev.cohosts.splice(+b.dataset.rmc, 1); save(); rerender(); }); });
  };
  /* Guest places: what the Event Pass covers once kept (moving up a size adds places), otherwise the planned guest count. */
  function placesCap(ev) { if (ev.paid && (CFG.app || CFG.launchFree)) return 100000; return ev.paid && ev.paid.max ? ev.paid.max : ev.guests; }   /* free (app or launch): no pass limit, so nobody is waitlisted for it */   /* in the app, places follow the guest count (free) */
  function promoteWaitlist(ev, cap) {
    ev.guestsList.filter(function (g) { return g.status === 'waitlist'; }).forEach(function (g) { if (E.placesUsed(ev.guestsList) + 1 + (g.plusOnes || 0) <= cap) g.status = 'invited'; });
  }

  /* Voting */
  TAB_VIEWS.votes = function (ev) {
    var polls = ev.polls || [];
    return '<div class="stack"><h3>Let everyone vote</h3><p class="muted">Ask about dates, venues, menus or outfits. Guests and co-hosts vote from the event page.</p>' +
      (polls.length ? polls.map(function (p, pi) { var tot = p.options.reduce(function (s, o) { return s + o.votes + (o.rv || 0); }, 0);
        return '<div class="panel stack"><b>' + esc(p.q) + '</b><div class="poll">' + p.options.map(function (o, oi) { var nv = o.votes + (o.rv || 0), pct = tot ? Math.round(nv / tot * 100) : 0;
          return '<button data-vote="' + pi + ':' + oi + '"' + (p.mine === oi ? ' aria-pressed="true"' : '') + '><i style="width:' + pct + '%"></i><span>' + esc(o.t) + '</span><span class="num muted">' + nv + '</span></button>'; }).join('') + '</div><button class="link small" data-rmp="' + pi + '" style="justify-self:start">Delete poll</button></div>'; }).join('') : '<p class="muted">No polls yet.</p>') +
      '<form id="addp" class="panel stack"><b>New poll</b><input class="input" aria-label="Poll question" id="pq" placeholder="Question, e.g. Which date works best?"><textarea class="input" id="po" placeholder="Options, one per line"></textarea><div><button class="btn">Create poll</button></div></form></div>';
  };
  TAB_BIND.votes = function (ev, save, rerender) {
    $$('[data-vote]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; var k = b.dataset.vote.split(':'), p = ev.polls[+k[0]], oi = +k[1];
      /* the host has one vote per poll: tapping another option moves it, tapping hers again takes it back */
      if (p.mine !== undefined && p.options[p.mine]) p.options[p.mine].votes = Math.max(0, p.options[p.mine].votes - 1);
      if (p.mine === oi) delete p.mine; else { p.mine = oi; p.options[oi].votes++; }
      save(); rerender(); }); });
    $$('[data-rmp]').forEach(function (b) { b.addEventListener('click', function () { ev.polls.splice(+b.dataset.rmp, 1); save(); rerender(); }); });
    $('#addp').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var q = $('#pq').value.trim(); var o = $('#po').value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean); if (!q || o.length < 2) return toast('Add a question and at least two options'); ev.polls = (ev.polls || []).concat({ q: q, options: o.map(function (t) { return { t: t, votes: 0 }; }) }); save(); rerender(); });
  };

  /* Invite, event page, registry, cost splitting */
  /* A registry only shows for occasions where gifts are expected. */
  /* Registries are standard for showers, weddings, graduations and quincea\u00f1eras; for birthdays and retirements the host adds a gift list only if she wants one. */
  var GIFT_LIST_OPTIONAL = ['birthday', 'kids-birthday', 'milestone', 'retirement'];
  function hasRegistry(ev) { return ['wedding', 'bridal-shower', 'baby-shower', 'gender-reveal', 'engagement', 'graduation', 'quince', 'sweet16', 'anniversary'].indexOf(ev.type) >= 0 || !!ev.registryOn || ((ev.registry && ev.registry.items) || []).length > 0 || ((ev.registry && ev.registry.funds) || []).length > 0; }
  /* The invitation as a message guests can read anywhere (the app sends this instead of a link). */
  /* ---------- The invitation: formal wording written for this exact event ---------- */
  var ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  var ORD = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth', twenty: 'twentieth', thirty: 'thirtieth' };
  function words(n) { if (n < 20) return ONES[n]; var t = TENS[Math.floor(n / 10)], o = n % 10; return o ? t + '-' + ONES[o] : t; }
  function ordWord(n) { var w = words(n), parts = w.split('-'), last = parts.pop(); return parts.concat([ORD[last] || (/y$/.test(last) ? last.slice(0, -1) + 'ieth' : last + 'th')]).join('-'); }
  function yearWords(y) { return 'two thousand ' + words(y - 2000); }
  var FORMAL_TYPES = ['wedding', 'gala', 'quince', 'anniversary', 'engagement'];
  function formalWhen(ev) {
    if (!ev.date) return ['Date to be announced'];
    var d = new Date(ev.date + 'T12:00:00'), wd = d.toLocaleDateString('en-US', { weekday: 'long' }), mo = d.toLocaleDateString('en-US', { month: 'long' });
    var h = ev.time ? +ev.time.split(':')[0] : null, m = ev.time ? +ev.time.split(':')[1] : 0;
    if (FORMAL_TYPES.indexOf(ev.type) < 0) return [fmtDate(ev.date).replace(/^(\w+), /, '$1, '), ev.time ? 'at ' + fmtTime(ev.time) : ''].filter(Boolean);
    var hw = h === null ? '' : words((h + 11) % 12 + 1), part = h === null ? '' : h < 12 ? ' in the morning' : h < 17 ? ' in the afternoon' : ' in the evening';
    var tw = h === null ? '' : m === 0 ? 'at ' + hw + ' o’clock' + part : m === 30 ? 'at half past ' + hw + part : 'at ' + fmtTime(ev.time).replace(/ (AM|PM)$/, '') + part;
    return [wd + ', the ' + ordWord(d.getDate()) + ' of ' + mo, yearWords(d.getFullYear()), tw].filter(Boolean);
  }
  function rsvpBy(ev) {
    var inv = ev.inv || {}; if (inv.rsvp) return inv.rsvp; if (!ev.date) return '';
    var days = /wedding|quince|gala/.test(ev.type) ? 30 : ev.type === 'kids-birthday' ? 7 : 14, d = new Date(ev.date + 'T12:00:00'); d.setDate(d.getDate() - days);
    return d < new Date() ? '' : d.toISOString().slice(0, 10);
  }
  function inviteFields(ev) {
    var t = ev.type;
    if (['wedding', 'engagement', 'anniversary'].indexOf(t) >= 0) return { names: 'The couple’s names', ph: 'Sara Haddad & Omar Khalil', age: t === 'anniversary' ? 'Years together' : '', host: t === 'wedding' ? 'Opening line (optional)' : 'Hosted by (optional)' };
    if (['corporate', 'gala'].indexOf(t) >= 0) return { names: 'Hosted by (company or organization)', ph: 'Always Luxe', age: '', host: '' };
    if (['dinner', 'brunch', 'holiday', 'christmas', 'other'].indexOf(t) >= 0) return { names: 'Hosted by', ph: 'Demah and Sam', age: '', host: '' };
    return { names: 'Guest of honor’s name', ph: t === 'baby-shower' ? 'Layla Haddad' : 'Sofia', age: ['birthday', 'milestone', 'kids-birthday'].indexOf(t) >= 0 ? 'Turning (age)' : t === 'graduation' ? 'Class of (year)' : '', host: 'Hosted by (optional)' };
  }
  function inviteLines(ev) {
    var inv = ev.inv || {}, names = String(inv.names || '').trim(), host = String(inv.host || '').trim(), age = parseInt(inv.age, 10) || 0, t = ev.type, cu = E.culture(ev);
    if (inv.custom && String(inv.custom).trim()) return String(inv.custom).split('\n').map(function (x) { return { k: 'body', t: x.trim() }; }).filter(function (x) { return x.t; }).concat(tailLines(ev));
    var L = [], pre = function (x) { L.push({ k: 'pre', t: x }); }, big = function (x) { L.push({ k: 'name', t: x }); }, body = function (x) { L.push({ k: 'body', t: x }); };
    var first = names.split(/\s*(?:&| and )\s*/i)[0].split(' ')[0];
    var b = E.budget(ev, ev.tier || 'S'), has = function (id) { return b.items.some(function (i) { return i.id === id; }); };
    var follow = has('catering') || has('privateDining') || has('restaurantFood') ? ((has('dj') || has('liveMusic')) ? 'Dinner and dancing to follow' : 'Dinner to follow') : (has('dj') || has('liveMusic')) ? 'Music and dancing' : '';
    var theme = themeWords(ev);
    if (t === 'wedding') {
      if (names) { pre(host || (cu && cu.pre) || 'Together with their families'); big(names); body('request the honour of your presence'); body('at the celebration of their marriage'); }
      else { pre('The honour of your presence is requested'); body('at'); big(ev.name); }
    } else if (t === 'engagement') { pre(host ? host + ' invite you' : 'Please join us'); body('in celebrating the engagement of'); big(names || ev.name); }
    else if (t === 'anniversary') { pre(host ? host + ' invite you' : 'Please join us'); body('in celebrating ' + (age ? words(age) + ' years of marriage' : 'the anniversary') + ' of'); big(names || ev.name); }
    else if (t === 'quince') { pre(host || 'With the blessing of God and her parents'); big(names || ev.name); body('requests the pleasure of your company'); body('as she celebrates her quinceañera'); }
    else if (t === 'sweet16') { pre('Please join us'); body('as we celebrate'); big(names ? names + '’s Sweet Sixteen' : ev.name); }
    else if (t === 'gala') { pre((names || 'The hosts') + ' request the pleasure of your company at'); big(ev.name); }
    else if (t === 'corporate') { pre((names || 'You are cordially invited') + (names ? ' cordially invites you to' : ' to')); big(ev.name); }
    else if (t === 'kids-birthday' || (ev.kids && t === 'birthday')) { pre('You’re invited!'); big(names ? names + (age ? ' is turning ' + age : '’s birthday') : ev.name); body('Join us for ' + (theme && !/ and /.test(theme) ? (/^[aeio]|^u(?![nk]i|s)/.test(theme) ? 'an ' : 'a ') + theme + ' ' : 'a ') + 'birthday party'); }
    else if (t === 'birthday' || t === 'milestone') { pre('Please join us'); body('in celebrating'); big(names ? names + '’s ' + (age ? ordWord(age).replace(/^\w/, function (m) { return m.toUpperCase(); }) + ' ' : '') + 'Birthday' : ev.name); }
    else if (t === 'baby-shower') { pre('Please join us for a baby shower'); body('honoring'); big(names || 'the parents-to-be'); }
    else if (t === 'bridal-shower') { pre('Please join us for a bridal shower'); body('honoring'); big(names ? names + ', bride-to-be' : 'the bride-to-be'); }
    else if (t === 'gender-reveal') { pre('Boy or girl?'); body('Please join us as ' + (names || 'the parents-to-be') + ' reveal'); big('the big surprise'); }
    else if (t === 'bachelorette') { pre('One last celebration before the ring'); body('Join us in celebrating'); big(names ? names + ', bride-to-be' : ev.name); }
    else if (t === 'graduation') { pre('Please join us'); body('in celebrating the graduation of'); big(names || ev.name); if (age) body('Class of ' + age); }
    else if (t === 'retirement') { pre('Please join us'); body('in honoring'); big(names || ev.name); body('on a wonderful retirement'); }
    else { pre(names ? names + ' invite you to' : 'You are cordially invited to'); big(ev.name); }
    if (host && ['wedding', 'quince', 'engagement', 'anniversary'].indexOf(t) < 0 && fieldsHaveHost(t)) body('Hosted by ' + host);
    formalWhen(ev).forEach(function (x) { L.push({ k: 'when', t: x }); });
    var w = whereText(ev); if (w) L.push({ k: 'where', t: w });
    if (follow && t !== 'kids-birthday' && !(ev.kids && t === 'birthday')) L.push({ k: 'note', t: follow });
    return L.concat(tailLines(ev));
  }
  function fieldsHaveHost(t) { return !!inviteFields({ type: t }).host; }
  function tailLines(ev) {
    var out = [], dc = E.dressCode(ev, ev.tier), r = rsvpBy(ev), casual = ev.type === 'kids-birthday';
    if (dc && !casual) out.push({ k: 'dress', t: /^\w+$/.test(dc) && !/^Black/.test(dc) ? dc + ' attire' : dc });
    if (ev.inviteNote) out.push({ k: 'body', t: ev.inviteNote });
    if (r) { var d = new Date(r + 'T12:00:00'); out.push({ k: 'rsvp', t: (casual ? 'Please RSVP by ' : 'Kindly reply by ') + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) }); }
    return out;
  }
  function monogram(ev) { var n = String((ev.inv || {}).names || '').trim(); if (!n || ['corporate', 'gala', 'dinner', 'brunch', 'holiday', 'christmas', 'other'].indexOf(ev.type) >= 0) return ''; var parts = n.split(/\s*(?:&| and )\s*/i).filter(Boolean); return parts.slice(0, 2).map(function (x) { return x.trim().charAt(0).toUpperCase(); }).join(parts.length > 1 ? ' & ' : ''); }
  function safeHex(c) { return /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#ccc'; }
  function inviteCard(lines, palette, mono, extra) {
    var pal = (palette || []).map(safeHex).filter(Boolean), accent = pal[2] || pal[1] || '#C9A86A';
    return '<div class="card invite-card" style="--inv-accent:' + accent + '"><div class="swatch" aria-hidden="true">' + pal.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div><div class="in"><div class="inv-frame">' +
      (mono ? '<div class="inv-mono" aria-hidden="true">' + esc(mono) + '</div>' : '<div class="inv-orn" aria-hidden="true">❦</div>') +
      lines.map(function (l) { return '<p class="inv-' + l.k + '">' + esc(l.t) + '</p>'; }).join('') + (extra || '') + '</div></div></div>';
  }
  function inviteEditor(ev) {
    if (ev.sample) return '';
    var f = inviteFields(ev), inv = ev.inv || {};
    return '<details class="panel stack inv-edit"' + (inv.names ? '' : ' open') + '><summary><b>Personalize your invitation</b> <span class="muted small">' + (inv.names ? 'names, wording and reply date' : 'add names for a personal invitation') + '</span></summary>' +
      '<div class="grid2"><label class="field"><span>' + esc(f.names) + '</span><input class="input" id="invNames" maxlength="80" placeholder="' + esc(f.ph) + '" value="' + esc(inv.names || '') + '"></label>' +
      (f.age ? '<label class="field"><span>' + esc(f.age) + '</span><input class="input num" type="number" min="1" max="2100" id="invAge" value="' + esc(inv.age || '') + '"></label>' : '') +
      (f.host ? '<label class="field"><span>' + esc(f.host) + '</span><input class="input" id="invHost" maxlength="80" placeholder="' + esc(ev.type === 'wedding' ? 'Together with their families' : ev.type === 'quince' ? 'With the blessing of God and her parents' : 'Her family') + '" value="' + esc(inv.host || '') + '"></label>' : '') +
      '<label class="field"><span>Reply by</span><input class="input" type="date" id="invRsvp" value="' + esc(rsvpBy(ev)) + '"></label></div>' +
      '<details class="inv-own"><summary class="small">Write your own wording</summary><label class="field"><span class="small muted">One line per row. The dress code and reply date are added for you.</span><textarea class="input" id="invCustom" rows="8">' + esc(inv.custom || inviteLines(Object.assign({}, ev, { inv: Object.assign({}, inv, { custom: '' }) })).filter(function (l) { return ['dress', 'rsvp'].indexOf(l.k) < 0; }).map(function (l) { return l.t; }).join('\n')) + '</textarea></label><div class="row"><button class="btn small" id="invUse">Use my wording</button>' + (inv.custom ? '<button class="link small" id="invReset">Go back to our wording</button>' : '') + '</div></details></details>';
  }
  /* Every guest who opens an invitation sees, once, how it was made: the event's best way to bring in new hosts. */
  /* Hair and makeup: try the glam look first on Face Couture, the sister app. */
  var FC_LINK = '<a class="fc-try small" href="https://facecouture.app/" target="_blank" rel="noopener" data-fc>\u2728 Try your glam look first on Face Couture</a>';
  /* After the party: the photos get their finish on Face Couture, the sister app. */
  function fcFinish(guest) {
    return '<div class="panel fc-finish"><img src="img/brand/facecouture-icon-128.png" alt="" width="52" height="52"><div><span class="eyebrow">' + (guest ? 'Before you post' : 'After the party') + '</span><b>' + (guest ? 'Edit your photos from tonight with Face Couture' : 'Edit your event photos with Face Couture') + '</b><p class="small muted">' + (guest ? 'Glow, glam and a flawless finish in seconds, so every photo from tonight is ready to share.' : 'Glow, glam and a flawless finish for every photo from your celebration, in seconds. Picture perfect, every time.') + '</p><div class="row"><a class="btn small gold" href="https://facecouture.app/" target="_blank" rel="noopener" data-fc>Edit on the website</a>' + (CFG.faceCoutureApp ? '<a class="btn small ghost" href="' + esc(CFG.faceCoutureApp) + '" target="_blank" rel="noopener" data-fc>Get the app</a>' : '<span class="badge">iPhone app coming soon</span>') + '</div></div></div>';
  }
  function guestPromo() {
    return '<div class="panel guest-promo"><img src="img/brand/ec-mark-128.png" alt="" width="44" height="44"><div><b>Planning something of your own?</b><p class="small muted">This celebration was planned with Event Couture by Always Luxe. Share one photo or a few words and get the whole event: the look, the budget, venues, vendors and an invitation like this one. Free to plan.</p><a class="btn small gold" href="#/new/1" data-promo>Plan my event</a></div></div>';
  }
  function inviteText(ev, live) {
    var pl = ev.payLinks || {}, out = inviteLines(ev).map(function (l) { return l.k === 'dress' ? 'Dress code: ' + l.t : l.t; });
    out.push('', live ? 'RSVP, vote and see the details here: ' + inviteLink(ev) : 'Please reply to let me know if you can make it' + (ev.date ? '' : ' once the date is set') + '.');
    if (canSplit(ev)) out.push('', 'Each person\u2019s share: ' + money(splitShare(ev)) + '.');
    var pays = [pl.venmo ? 'Venmo @' + pl.venmo : '', pl.cashapp ? 'Cash App $' + pl.cashapp : '', pl.paypal ? 'paypal.me/' + pl.paypal : ''].filter(Boolean);
    if (pays.length && (canSplit(ev) || hasRegistry(ev))) out.push((canSplit(ev) ? 'Pay me by ' : 'Cash gifts: ') + pays.join(', '));
    if (hasRegistry(ev)) { var it = (ev.registry.items || []).map(function (x) { return '- ' + x.name + (x.url ? ': ' + x.url : ''); }), fu = (ev.registry.funds || []).map(function (f) { return '- ' + f.name; }); if (it.length || fu.length) out.push('', 'Gift ideas:', it.concat(fu).join('\n')); }
    return out.join('\n');
  }
  function inviteLink(ev) { return (CFG.siteUrl || location.href.split('#')[0]) + '#/g/' + ev.id; }
  var FUND_IDEA = { wedding: 'Honeymoon fund', engagement: 'Honeymoon fund', 'bridal-shower': 'New home fund', 'baby-shower': 'Diaper and nursery fund', 'gender-reveal': 'Nursery fund', graduation: 'College or first apartment fund', quince: 'College fund', sweet16: 'First car or college fund', anniversary: 'Anniversary trip fund', retirement: 'Retirement trip fund' };
  /* Each person's share: the amount (the plan total unless the host typed one) divided by everyone sharing it. */
  function splitTotal(ev) { var sp = ev.split || {}; return sp.total || E.budget(ev, ev.tier).total; }
  function splitCount(ev) { var sp = ev.split || {}; return Math.max(1, sp.count || ev.expected || ev.guests || 1); }
  function splitShare(ev) { return canSplit(ev) ? splitTotal(ev) / splitCount(ev) : 0; }
  TAB_VIEWS.invite = function (ev, b) {
    var link = inviteLink(ev);
    var pl = ev.payLinks || {}; var split = ev.split || { people: [] };
    var share = splitShare(ev);
    return '<div class="stack"><h3>' + (hasRegistry(ev) ? 'Invitation and event page' : 'Your invitation') + '</h3>' + inviteEditor(ev) + '<div class="invite" id="invCard">' + inviteCard(inviteLines(ev), ev.concept.palette, monogram(ev)) + '</div>' +
      (ev.date || ev.sample ? '' : '<div class="note">Add your date (tap \u201cAdd your date\u201d at the top) before you send the invitation, so guests can save it.</div>') + '<div class="row"><button class="btn gold" id="copy">' + (CFG.app ? 'Send invitation' : 'Copy invite link') + '</button><a class="btn ghost" href="#/g/' + ev.id + '">Preview as a guest</a></div>' +
      (SHARING ? '<p class="muted small">' + (CFG.app ? 'Sends your invitation by text, email or any app with a link to your event page. ' : 'Copies the link to your event page. ') + 'Guests open it on any phone, no app needed, to RSVP' + ((ev.polls || []).length ? ', vote' : '') + (hasRegistry(ev) ? ' and see your gift list' : '') + '. Their RSVPs come into your Guests list.' + (ev.published ? ' Changes you make here update the page automatically.' : '') + '</p>' : CFG.app ? '<p class="muted small">Sends your invitation by text, email or any app, with the date, place, dress code' + (hasRegistry(ev) ? ', your gift list' : '') + (canSplit(ev) ? ', each person\u2019s share' : '') + '. Guests reply to you to RSVP; add their answers under Guests.</p>' : CFG.preview ? '<p class="muted small">For now this link opens on this device only, so you can preview what guests will see. Sending it to guests on their own phones turns on when accounts launch.</p>' : '<p class="muted small">Guests open it in any browser; no app needed.</p>') + '</div>' +
      (!canSplit(ev) && !hasRegistry(ev) ? '' : '<div class="stack"><h3>Your payment links</h3><p class="muted small">' + (canSplit(ev) ? 'Friends pay you directly for their share, and guests can send cash gifts.' : 'For cash gifts and funds from your registry.') + ' Event Couture never holds the money.</p><div class="grid3">' +
      [['venmo', 'Venmo username'], ['cashapp', 'Cash App $cashtag'], ['paypal', 'PayPal.me name']].filter(function (x) { return x[0] === 'paypal' || E.countryOf(ev.city).id === 'US' || pl[x[0]]; }).map(function (x) { return '<label class="field"><span>' + x[1] + '</span><input class="input" data-pay="' + x[0] + '" value="' + esc(pl[x[0]] || '') + '"></label>'; }).join('') + '</div><div><button class="btn small" id="savePay">Save payment links</button></div></div>') +
      (!canSplit(ev) ? '' : '<div class="stack"><h3>Cost splitting</h3><div class="panel stack"><div class="grid2"><label class="field"><span>Amount to split (' + E.currency() + ')</span><input class="input num" type="number" id="stot" value="' + Math.round(splitTotal(ev)) + '"></label><label class="field"><span>Number of people sharing it</span><input class="input num" type="number" min="1" id="scount" value="' + splitCount(ev) + '"></label></div><p class="small">Each person\u2019s share: <b class="num">' + money(splitShare(ev)) + '</b>. Starts from your plan\u2019s estimated total; change it to what you actually spent.</p><div class="grid2"><label class="field"><span>Add a person</span><form id="sadd" class="row"><input class="input" id="sname" style="flex:1"><button class="btn small">Add</button></form></label></div>' +
      (split.people.length ? '<div class="list">' + split.people.map(function (p, i) { return '<label class="check' + (p.paid ? ' done' : '') + '"><input type="checkbox" data-paid="' + i + '"' + (p.paid ? ' checked' : '') + '><span class="grow"><span class="t">' + esc(p.name) + '</span></span><span class="num">' + money(share) + '</span></label>'; }).join('') + '</div><p class="small muted">' + split.people.filter(function (p) { return p.paid; }).length + ' of ' + split.people.length + ' paid</p>' : '<p class="muted small">Add the people sharing the cost; each sees their share and your payment links on the event page.</p>') + '</div></div>') +
      (!hasRegistry(ev) ? '' : '<div class="stack"><div class="row" style="justify-content:space-between"><h3>Registry</h3>' + (ev.registryOn && !((ev.registry && ev.registry.items) || []).length && !((ev.registry && ev.registry.funds) || []).length && ['wedding', 'bridal-shower', 'baby-shower', 'gender-reveal', 'engagement', 'graduation', 'quince', 'sweet16', 'anniversary'].indexOf(ev.type) < 0 ? '<button class="link small" id="giftOff">Turn off gift list</button>' : '') + '</div><div class="panel list">' + ((ev.registry.items || []).length ? ev.registry.items.map(function (it, i) { return '<div class="it"><div class="grow"><b>' + esc(it.name) + '</b>' + (it.price ? ' <span class="muted num">' + money(it.price) + '</span>' : '') + (it.bought ? ' <span class="badge ok">Purchased</span>' : '') + '</div>' + (it.url ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(it.url) + '">View</a>' : '') + '<button class="link small" data-rmr="' + i + '">Remove</button></div>'; }).join('') : '<p class="muted">Add gifts from any store, or a cash fund like ' + (function (f) { return (/^[aeiou]/.test(f) ? 'an ' : 'a ') + esc(f); })((FUND_IDEA[ev.type] || 'celebration fund').toLowerCase()) + '.</p>') + '</div>' +
      '<form id="radd" class="grid3"><input class="input" aria-label="Gift name" id="rn" placeholder="Gift name"><input class="input" aria-label="Store link" id="ru" placeholder="Store link (optional)"><input class="input num" aria-label="Gift price" id="rp" type="number" min="0" placeholder="Price (optional)"><button class="btn">Add gift</button></form>' +
      '<form id="fadd" class="row"><input class="input" aria-label="Cash fund name" id="fn" placeholder="Cash fund, e.g. ' + esc(FUND_IDEA[ev.type] || 'Celebration fund') + '" style="flex:1 1 220px"><button class="btn ghost">Add cash fund</button></form>' +
      ((ev.registry.funds || []).length ? '<div class="chips">' + ev.registry.funds.map(function (f, i) { return '<span class="badge">' + esc(f.name) + ' <button class="link small" data-rmf="' + i + '" aria-label="Remove ' + esc(f.name) + '">×</button></span>'; }).join('') + '</div>' : '') +
      '<p class="muted small">Cash funds go straight to your payment links above.</p></div>') +
      (!hasRegistry(ev) && GIFT_LIST_OPTIONAL.indexOf(ev.type) >= 0 ? '<div class="row"><button class="link small" id="giftOn">Add a gift list (optional)</button><span class="muted small">For gift ideas or a cash fund; guests see it on your event page.</span></div>' : '');
  };
  TAB_BIND.invite = function (ev, save, rerender) {
    var pubT = null, redraw = function () { var c = $('#invCard'); if (c) c.innerHTML = inviteCard(inviteLines(ev), ev.concept.palette, monogram(ev)); save(); if (ev.published) { clearTimeout(pubT); pubT = setTimeout(function () { publishInvite(ev).catch(function () {}); }, 1500); } };
    [['invNames', 'names'], ['invAge', 'age'], ['invHost', 'host'], ['invRsvp', 'rsvp']].forEach(function (x) { var el = $('#' + x[0]); if (el) el.addEventListener('input', function () { if (lockSample(ev)) return; ev.inv = ev.inv || {}; ev.inv[x[1]] = el.value.trim(); redraw(); }); });
    var iu = $('#invUse'); if (iu) iu.addEventListener('click', function () { ev.inv = ev.inv || {}; ev.inv.custom = $('#invCustom').value.trim(); redraw(); toast('Your wording is on the invitation'); });
    var ir = $('#invReset'); if (ir) ir.addEventListener('click', function () { ev.inv = ev.inv || {}; ev.inv.custom = ''; save(); rerender(); toast('Back to our wording'); });
    $('#copy').addEventListener('click', function () { var btn = this; var send = function () {
        if (!ev.sample) { ev.invited = true; save(); }
        var deliver = function (live) { if (!CFG.app) return copyText(live || !SHARING ? inviteLink(ev) : inviteText(ev), live || !SHARING ? undefined : 'Invitation'); var t = inviteText(ev, live); if (navigator.share) navigator.share({ title: ev.name, text: t }).catch(function () {}); else copyText(t, 'Invitation'); };
        if (!SHARING || ev.sample) return deliver(false);
        btn.disabled = true; var lbl = btn.textContent; btn.textContent = 'Getting your link ready\u2026';
        publishInvite(ev, true).then(function () { deliver(true); }).catch(function () { toast('Couldn\u2019t get your link ready, so we copied the invitation as a message instead. Check your connection and try again for a link.'); deliver(false); }).then(function () { btn.disabled = false; btn.textContent = lbl; });
      }; if (!isKept(ev)) return keepSheet(ev, 'Keep your plan to share it', send); send(); });
    if ($('#giftOn')) $('#giftOn').addEventListener('click', function () { if (lockSample(ev)) return; ev.registryOn = true; save(); rerender(); });
    if ($('#giftOff')) $('#giftOff').addEventListener('click', function () { if (lockSample(ev)) return; ev.registryOn = false; save(); rerender(); });
    if ($('#savePay')) $('#savePay').addEventListener('click', function () { if (lockSample(ev)) return; ev.payLinks = {}; $$('[data-pay]').forEach(function (i) { ev.payLinks[i.dataset.pay] = i.value.trim().replace(/^[@$]/, ''); }); save(); toast('Payment links saved'); });
    if ($('#stot')) $('#stot').addEventListener('change', function () { if (lockSample(ev)) return; ev.split = ev.split || { people: [] }; ev.split.total = Math.max(0, +this.value || 0); save(); rerender(); });
    if ($('#scount')) $('#scount').addEventListener('change', function () { if (lockSample(ev)) return; ev.split = ev.split || { people: [] }; ev.split.count = Math.max(1, Math.round(+this.value || 1)); save(); rerender(); });
    if ($('#sadd')) $('#sadd').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var n = $('#sname').value.trim(); if (!n) return; ev.split.people.push({ name: n, paid: false }); save(); rerender(); });
    $$('[data-paid]').forEach(function (c) { c.addEventListener('change', function () { if (lockSample(ev)) return; ev.split.people[+c.dataset.paid].paid = c.checked; save(); rerender(); }); });
    if ($('#radd')) $('#radd').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var n = $('#rn').value.trim(); if (!n) return toast('Enter a gift name'); var u = $('#ru').value.trim(); if (u && !/^https?:\/\//.test(u)) u = 'https://' + u; ev.registry.items.push({ name: n, url: u, price: +$('#rp').value || 0, bought: false }); save(); rerender(); });
    if ($('#fadd')) $('#fadd').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var n = $('#fn').value.trim(); if (!n) return; ev.registry.funds = (ev.registry.funds || []).concat({ name: n }); save(); rerender(); });
    $$('[data-rmr]').forEach(function (b) { b.addEventListener('click', function () { ev.registry.items.splice(+b.dataset.rmr, 1); save(); rerender(); }); });
    $$('[data-rmf]').forEach(function (b) { b.addEventListener('click', function () { ev.registry.funds.splice(+b.dataset.rmf, 1); save(); rerender(); }); });
  };

  /* After: album and thank-yous */
  TAB_VIEWS.after = function (ev) {
    return fcFinish(false) + '<div class="stack"><div class="row" style="justify-content:space-between"><h3>Shared album</h3><label class="btn small"><input type="file" accept="image/*" multiple id="alb" class="sr">Add photos</label></div>' +
      ((ev.album || []).length ? '<div class="album">' + ev.album.map(function (s, i) { return '<figure class="ph"><img src="' + esc(s) + '" alt="Event photo ' + (i + 1) + '"><button type="button" class="ph-rm" data-rmph="' + i + '" aria-label="Remove photo ' + (i + 1) + '">\u00d7</button></figure>'; }).join('') + '</div>' : '<p class="muted">Guests can add photos from the event page after the party.</p>') + '</div>' +
      '<div class="stack"><h3>Gifts and thank-yous</h3><div class="panel list">' + ((ev.gifts || []).length ? ev.gifts.map(function (g, i) { return '<label class="check' + (g.thanked ? ' done' : '') + '"><input type="checkbox" data-th="' + i + '"' + (g.thanked ? ' checked' : '') + '><span class="grow"><span class="t">' + esc(g.from) + '</span><br><span class="small muted">' + esc(g.gift) + '</span></span><button class="link small" type="button" data-draft="' + i + '">Thank-you note</button><button class="link small" type="button" data-rmg="' + i + '" aria-label="Remove gift from ' + esc(g.from) + '">Remove</button></label>'; }).join('') : '<p class="muted">Track who gave what, then tick each one off when you’ve said thank you.</p>') + '</div>' +
      '<form id="gadd" class="row"><input class="input" aria-label="Gift from" id="gf" placeholder="From" style="flex:1 1 150px"><input class="input" aria-label="Gift" id="gg" placeholder="Gift" style="flex:2 1 180px"><button class="btn">Add</button></form></div>';
  };
  TAB_BIND.after = function (ev, save, rerender) {
    $('#alb').addEventListener('change', function () { if (lockSample(ev)) return; Promise.all(Array.prototype.slice.call(this.files).map(function (f) { return readPhoto(f).catch(function () { return null; }); })).then(function (ps) { ev.album = (ev.album || []).concat(ps.filter(Boolean).map(function (p) { return p.src; })); save(); rerender(); }); });
    $('#gadd').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var f = $('#gf').value.trim(), g = $('#gg').value.trim(); if (!f) return toast('Enter who it’s from'); ev.gifts = (ev.gifts || []).concat({ from: f, gift: g, thanked: false }); save(); rerender(); });
    $$('[data-rmph]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; var bf = snap(ev); ev.album = (ev.album || []).filter(function (_, k) { return k !== +b.dataset.rmph; }); save(); rerender(); undoToast(ev, bf, 'Photo removed', rerender); }); });
    $$('[data-rmg]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); if (lockSample(ev)) return; ev.gifts = (ev.gifts || []).filter(function (_, k) { return k !== +b.dataset.rmg; }); save(); rerender(); toast('Gift removed'); }); });
    $$('[data-th]').forEach(function (c) { c.addEventListener('change', function () { ev.gifts[+c.dataset.th].thanked = c.checked; save(); c.closest('.check').classList.toggle('done', c.checked); }); });
    $$('[data-draft]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); var g = ev.gifts[+b.dataset.draft];
      var fw = g.from.trim().replace(/^the\s+/i, '').split(/\s+/), nm = /^(aunt|auntie|uncle|grandma|grandpa|granny|nana|papa|cousin|mr\.?|mrs\.?|ms\.?|miss|dr\.?|pastor|rev\.?)$/i.test(fw[0]) && fw[1] ? fw[0] + ' ' + fw[1] : fw[0];
      var note = 'Dear ' + nm + ',\n\nThank you so much for ' + (g.gift ? 'the ' + (function (gf) { gf = gf.replace(/^(a|an|the|some|my)\s+/i, ''); return /^[A-Z][a-z]*(\s+[a-z][^A-Z]*)?$/.test(gf) ? gf.charAt(0).toLowerCase() + gf.slice(1) : gf; })(g.gift) : 'your generous gift') + ' and for celebrating ' + ev.name + ' with us. It meant so much to have you there.\n\nWith love,';
      sheet('<h3>Thank-you note</h3><textarea class="input" id="note" aria-label="Thank-you note" style="min-height:180px">' + esc(note) + '</textarea><button class="btn gold block" id="cp">Copy note</button><button class="btn ghost block" data-close>Close</button>', function (el) { $('#cp', el).addEventListener('click', function () { copyText($('#note', el).value, 'Note'); }); });
    }); });
  };

  /* Extras: Event Pass, upgrades, receipts (credits, packages and add-ons hidden until they deliver) */
  TAB_VIEWS.extras = function (ev) {
    var w = wallet(); var nextPass = E.passFor((ev.paid && ev.paid.max || ev.guests) + 1);
    var mine = w.ledger.filter(function (l) { return !ev.sample && l.event === ev.name; });
    if (!ev.sample && !isKept(ev)) return '<div class="stack"><h3>' + (CFG.app ? 'Plan details' : 'Your Event Pass') + '</h3><div class="panel stack"><p>Your plan isn\u2019t kept yet. Keep it to save every edit and share it with guests.</p>' + (CFG.app || CFG.launchFree ? '<p class="muted small">Free' + (CFG.app ? ' in the app' : ' during our launch') + '.</p>' : '<div class="price-big num">$' + E.passFor(ev.guests).price.toFixed(2) + '</div><p class="muted small">' + esc(E.passFor(ev.guests).label) + ', one time, no subscription.</p>') + '<div><button class="btn" id="keepX">Keep my plan</button></div></div></div>' +
      '<div class="stack"><h3>Delete this event</h3><p class="muted small">Removes the plan, guest list and photos from this device.</p><div><button class="btn small ghost" id="del" style="color:var(--bad)">Delete event</button></div></div>';
    return '<div class="stack"><h3>' + (CFG.app ? 'Plan details' : 'Your Event Pass') + '</h3><div class="panel stack"><div class="row" style="justify-content:space-between"><span>' + (ev.sample ? 'Sample plan' : esc(E.passFor(ev.paid.max || ev.guests).label)) + '</span><span class="badge ok">Active</span></div>' + (ev.sample ? '' : '<p class="small muted">Available until ' + esc(accessUntil(ev, ev.paid && ev.paid.at)) + '.</p>') +
      (CFG.app || CFG.launchFree ? '<p class="muted small">Inviting more people? Tap the guest count at the top of your plan to change it; it\u2019s free' + (CFG.app ? ' in the app' : ' during our launch') + '.</p></div></div>' : '<p class="muted small">Inviting more people? Moving up to ' + esc(nextPass.label.toLowerCase()) + ' costs the difference, ' + money(Math.max(0, nextPass.price - (ev.paid ? ev.paid.price : 0))) + '.</p><div><button class="btn small ghost" id="upg">Move up a size</button></div></div></div>') +
      (!SELL_EXTRAS ? '' : '<div class="stack"><div class="row" style="justify-content:space-between"><h3>AI credits</h3><span class="num">' + w.credits + ' credits</span></div><p class="muted small">For extra AI work beyond what your pass includes. The exact credit cost is shown before every action, and credits never top up automatically.</p><div class="packs">' +
      D.CREDIT_PACKS.map(function (p, i) { return '<button class="tier" data-pack="' + i + '"><span class="amt num">' + p.credits + '</span><span class="muted">credits</span><b class="num">$' + p.price.toFixed(2) + '</b></button>'; }).join('') + '</div></div>' +
      '<div class="stack"><h3>Creative packages</h3><div class="list panel">' + D.PACKAGES.map(function (p, i) { return '<div class="it"><div class="grow"><b>' + esc(p.name) + '</b>' + hotelBadge(p.name) + '<div class="small muted">' + esc(p.desc) + '</div></div><span class="num">$' + p.price.toFixed(2) + '</span><button class="btn small" data-pkg="' + i + '">Choose</button></div>'; }).join('') + '</div></div>' +
      '<div class="stack"><h3>Optional add-ons</h3><p class="muted small">Never needed to finish your plan.</p><div class="list panel">' + D.ADDONS.map(function (a, i) { return '<div class="it"><div class="grow"><b>' + esc(a.name) + '</b><div class="small muted">' + esc(a.desc) + '</div></div><span class="num">$' + a.price.toFixed(2) + '</span><button class="btn small ghost" data-add="' + i + '">Choose</button></div>'; }).join('') + '</div></div>') +
      (ev.sample ? '' : '<div class="stack"><h3>Delete this event</h3><p class="muted small">Removes the plan, guest list and photos from this device.' + (CFG.app ? '' : ' Purchases can\u2019t be reused after deleting') + '.</p><div><button class="btn small ghost" id="del" style="color:var(--bad)">Delete event</button></div></div>') +
      (CFG.app ? '' : '<div class="stack"><h3>Receipts</h3><div class="panel list">' + (mine.length ? mine.map(function (l) { return '<div class="it"><span class="grow">' + esc(l.kind) + '<br><span class="small muted">' + new Date(l.at).toLocaleDateString('en-US') + (l.note ? ', ' + esc(l.note) : '') + '</span></span><span class="num">' + money(l.amount) + '</span></div>'; }).join('') : '<p class="muted">Purchases for this event show here.</p>') + '</div></div>');
  };
  TAB_BIND.extras = function (ev, save, rerender) {
    $$('[data-pack]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; var p = D.CREDIT_PACKS[+b.dataset.pack];
      buySheet({ name: p.credits + ' AI credits', price: p.price, desc: 'Prepaid credits for extra AI work on any of your events. No automatic top-ups.' }, ev, function () { var w = wallet(); w.credits += p.credits; saveWallet(w); rerender(); }); }); });
    $$('[data-pkg]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; var p = D.PACKAGES[+b.dataset.pkg];
      buySheet(p, ev, function () { if (p.id === 'concepts3') { ev.seen = (ev.seen || []).concat((ev.concepts || []).map(function (c) { return c.id; })); AI.concepts(ev, ev.seen).then(function (list) { ev.concepts = list; save(); location.hash = '#/e/' + ev.id + '/concepts'; }); } }); }); });
    $$('[data-add]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; buySheet(D.ADDONS[+b.dataset.add], ev, rerender); }); });
    var del = $('#del'); if (del) del.addEventListener('click', function () { sheet('<h3>Delete ' + esc(ev.name) + '?</h3><p class="muted">This can\u2019t be undone.</p><button class="btn block" id="yes" style="background:var(--bad);border-color:var(--bad)">Delete event</button><button class="btn ghost block" data-close>Keep it</button>', function (el, close) { $('#yes', el).addEventListener('click', function () { T('event_deleted', { event_type: ev.type }); if (SHARING && ev.published) apiInv(ev.id, 'delete', { key: shareKey(ev) }).catch(function () {}); var all = events(); delete all[ev.id]; store.set('events', all); close(); toast('Event deleted'); location.hash = '#/events'; }); }); });
    var kx = $('#keepX'); if (kx) { kx.addEventListener('click', function () { keepSheet(ev, 'Keep your plan', rerender); }); return; }
    if ($('#upg')) $('#upg').addEventListener('click', function () { if (lockSample(ev)) return; var cur = ev.paid.max || ev.guests; var nx = E.passFor(cur + 1); var due = Math.max(0, Math.round((nx.price - ev.paid.price) * 100) / 100);
      buySheet({ name: 'Move up to ' + nx.label.toLowerCase(), price: due, desc: 'Your plan, guests and purchases stay exactly as they are.' }, ev, function () { ev.paid = { price: nx.price, max: nx.max, at: new Date().toISOString() }; save(); rerender(); }); });
  };

  function calLink(ev) {
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var st = new Date(ev.date + 'T' + (ev.time || '18:00')); var en = new Date(st.getTime() + (ev.hours || 3) * 36e5);
    var f = function (d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00'; };
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(ev.name) + '&dates=' + f(st) + '/' + f(en) + '&location=' + encodeURIComponent(ev.city);
  }
  /* ---------- guest page (no app needed) ---------- */
  /* The booked venue's name (from the host's booking) when there is one, then the city. */
  function whereText(ev) { var ov = (ev.overrides || {})[venueCat(ev)]; return ov && ov.source === 'booking' && ov.note ? ov.note + ', ' + ev.city : ev.city; }
  /* ---------- Shared invitations: guests open the link on their own phones (needs the Event Couture server) ---------- */
  var SHARING = !!CFG.apiUrl;
  function apiInv(id, action, body) {
    return fetch(CFG.apiUrl + '/api/inv/' + id + (action ? '/' + action : ''), body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {})
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Request failed'); e.status = r.status; throw e; } return j; }); });
  }
  function shareKey(ev) { if (!ev.shareKey) { var a = new Uint8Array(18); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; }); ev.shareKey = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); } return ev.shareKey; }
  /* Only what guests need: never the budget, the guest list or anyone's private notes. */
  function inviteSnapshot(ev) {
    var pl = ev.payLinks || {}, reg = hasRegistry(ev) ? ev.registry || {} : {};
    return { v: 1, cur: E.countryOf(ev.city).currency, lines: inviteLines(ev), mono: monogram(ev), name: ev.name, type: ev.type, date: ev.date || '', time: ev.time || '', hours: ev.hours || 3, when: ev.date ? fmtDate(ev.date) + (ev.time ? ' at ' + fmtTime(ev.time) : '') : '', where: whereText(ev), dress: E.dressCode(ev, ev.tier), palette: (ev.concept.palette || []).slice(0, 6),
      cal: ev.date ? calLink(ev) : '', polls: (ev.polls || []).map(function (p) { return { q: p.q, options: p.options.map(function (o) { return { t: o.t }; }) }; }),
      registry: { items: (reg.items || []).map(function (it) { return { name: it.name, url: it.url || '', bought: !!it.bought }; }), funds: (reg.funds || []).map(function (f) { return { name: f.name }; }) },
      pay: canSplit(ev) || hasRegistry(ev) ? { venmo: pl.venmo || '', cashapp: pl.cashapp || '', paypal: pl.paypal || '' } : {}, share: canSplit(ev) ? Math.round(splitShare(ev) * 100) / 100 : 0 };
  }
  function publishInvite(ev, force) {
    if (!SHARING || ev.sample || !isKept(ev)) return Promise.resolve(false);
    var snap1 = inviteSnapshot(ev), h = JSON.stringify(snap1);
    if (!force && (!ev.published || ev.pubHash === h)) return Promise.resolve(true);
    return apiInv(ev.id, 'publish', { key: shareKey(ev), inv: snap1 }).then(function () { ev.published = true; ev.pubHash = h; saveEvent(ev); return true; });
  }
  /* RSVPs, votes and gifts guests sent from their phones come back into the plan. */
  var LAST_SYNC = {};
  function syncInbox(ev, done) {
    if (!SHARING || !ev.published || ev.sample || Date.now() - (LAST_SYNC[ev.id] || 0) < 45000) return;
    LAST_SYNC[ev.id] = Date.now();
    apiInv(ev.id, 'inbox', { key: shareKey(ev) }).then(function (box) {
      var fresh = 0, changed = false, cap = placesCap(ev); ev.guestsList = ev.guestsList || [];
      (box.rsvps || []).forEach(function (r) {
        if (r.at <= (ev.rsvpSeen || 0)) return;
        var g = ev.guestsList.find(function (x) { return x.name.toLowerCase() === r.name.toLowerCase(); });
        if (!g) { g = { id: uid(), name: r.name }; ev.guestsList.push(g); }
        g.plusOnes = r.plus || 0; g.diet = r.diet || []; g.online = true;
        g.status = r.status === 'declined' ? 'declined' : 'yes'; if (g.status === 'yes' && E.placesUsed(ev.guestsList) > cap) g.status = 'waitlist';
        if (g.status === 'declined') promoteWaitlist(ev, cap);
        ev.rsvpSeen = Math.max(ev.rsvpSeen || 0, r.at); fresh++; changed = true;
      });
      (ev.polls || []).forEach(function (p, pi) { p.options.forEach(function (o, oi) { var n = (box.votes || {})[pi + ':' + oi] || 0; if ((o.rv || 0) !== n) { o.rv = n; changed = true; } }); });
      (box.bought || []).forEach(function (i) { var it = ev.registry && (ev.registry.items || [])[i]; if (it && !it.bought) { it.bought = true; changed = true; } });
      if (changed) { saveEvent(ev); if (fresh) toast(plural(fresh, 'new RSVP') + ' from your invitation'); if (done) done(); }
    }).catch(function () {});
  }
  function guestPage(id) {
    var ev = getEvent(id) || (/^sample-\d+$/.test(id || '') ? sampleEvent(+id.split('-')[1]) : null);
    if (ev && !ev.concept) ev = null;
    if (ev) E.useCountry(ev.city);
    if (!ev && SHARING && /^[a-z0-9]{6,32}$/.test(id || '')) return remoteGuestPage(id);
    if (!ev) return frame('<div class="invite"><h2>This invitation isn’t available here yet</h2><p class="muted">' + (CFG.preview && !SHARING ? 'Event Couture is in preview, so invitations open only on the phone or computer where they were made. Sending invitations to guests turns on soon.' : 'The host may have made it private. Ask them for a new link.') + '</p><div><a class="btn ghost" href="#/">Explore Event Couture</a></div></div>');
    var pl = ev.payLinks || {}; var split = ev.split || { people: [] }; var share = splitShare(ev);
    var payBtns = [pl.venmo ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://venmo.com/u/' + encodeURIComponent(pl.venmo) + '">Venmo</a>' : '', pl.cashapp ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://cash.app/$' + encodeURIComponent(pl.cashapp) + '">Cash App</a>' : '', pl.paypal ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://paypal.me/' + encodeURIComponent(pl.paypal) + '">PayPal</a>' : ''].join('');
    var hostView = !!events()[ev.id] || ev.sample;
    frame((hostView ? '<div class="note invite-host">You\u2019re previewing what guests see. <a href="' + (ev.sample ? '#/sample/' + ev.id.split('-')[1] : '#/e/' + ev.id) + '/invite">Back to your plan</a></div>' : '') + '<div class="invite">' + inviteCard(inviteLines(ev), ev.concept.palette, monogram(ev), ev.date ? '<div><a class="btn small ghost" target="_blank" rel="noopener" href="' + calLink(ev) + '">Add to calendar</a></div>' : '') +
      '<form id="rsvp" class="panel stack" style="text-align:left"><h3>RSVP</h3><label class="field"><span>Your name</span><input class="input" id="rn" required autocomplete="name"></label><div class="seg" id="ans"><button type="button" data-v="yes" aria-pressed="true">I’ll be there</button><button type="button" data-v="declined" aria-pressed="false">Can’t make it</button></div>' +
      '<label class="field"><span>Plus-ones</span><input class="input num" type="number" min="0" max="5" id="rp" value="0"></label><div class="stack"><span class="muted small">Dietary needs</span><div class="chips" id="rd">' + D.DIETS.map(function (d) { return '<button type="button" class="chip" aria-pressed="false">' + esc(d) + '</button>'; }).join('') + '</div></div><button class="btn gold">Send RSVP</button></form>' +
      ((ev.polls || []).length ? '<div class="panel stack" style="text-align:left"><h3>Vote</h3>' + ev.polls.map(function (p, pi) { return '<b>' + esc(p.q) + '</b><div class="poll">' + p.options.map(function (o, oi) { return '<button data-vote="' + pi + ':' + oi + '"><span>' + esc(o.t) + '</span></button>'; }).join('') + '</div>'; }).join('') + '</div>' : '') +
      ((ev.registry.items || []).length || (ev.registry.funds || []).length ? '<div class="panel stack" style="text-align:left"><h3>Registry</h3><div class="list">' + ev.registry.items.map(function (it, i) { return '<div class="it"><span class="grow">' + esc(it.name) + (it.bought ? ' <span class="badge ok">Purchased</span>' : '') + '</span>' + (it.url ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(it.url) + '">View</a>' : '') + (it.bought ? '' : '<button class="btn small" data-buy="' + i + '">I bought this</button>') + '</div>'; }).join('') +
        (ev.registry.funds || []).map(function (f) { return '<div class="it"><span class="grow">' + esc(f.name) + '</span>' + (payBtns || '<span class="muted small">Ask the host how to give</span>') + '</div>'; }).join('') + '</div></div>' : '') +
      (canSplit(ev) && share ? '<div class="panel stack" style="text-align:left"><h3>Your share</h3><p>Each person’s share is <b class="num">' + money(share) + '</b>.</p><div class="row">' + (payBtns || '<span class="muted small">The host will share how to pay.</span>') + '</div><p class="muted small">Payments go straight to the host.</p></div>' : '') +
      (ev.date && ev.date <= todayISO() ? fcFinish(true) : '') + '<div class="panel stack" style="text-align:left"><h3>Share your photos</h3><p class="muted small">Add your pictures from the celebration to the host\u2019s album.</p><div><label class="btn small"><input type="file" accept="image/*" multiple id="galb" class="sr">Add photos</label></div><p class="small muted" id="galbMsg" aria-live="polite"></p></div>' +
      guestPromo() + '</div>', { noRibbon: false });
    $('#galb').addEventListener('change', function () { if (ev.sample) return toast('This is a sample plan, so photos aren\u2019t saved'); var files = Array.prototype.slice.call(this.files);
      Promise.all(files.map(function (f) { return readPhoto(f).catch(function () { return null; }); })).then(function (ps) { ps = ps.filter(Boolean); var prevAlb = (ev.album || []).slice(); ev.album = prevAlb.concat(ps.map(function (p) { return p.src; })); if (ps.length && !saveEvent(ev)) { ev.album = prevAlb; $('#galbMsg').textContent = 'This device is out of space, so those photos weren\u2019t added. Try fewer photos.'; return; } $('#galbMsg').textContent = ps.length ? 'Thank you! ' + plural(ps.length, 'photo') + ' added to the album.' : 'Those files couldn\u2019t be added. Choose photos.'; }); });
    $('#ans').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $$('#ans button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });
    $('#rd').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
    $('#rsvp').addEventListener('submit', function (e) { e.preventDefault(); var n = $('#rn').value.trim(); if (!n) return toast('Enter your name');
      if (ev.sample) { $('#rsvp').innerHTML = '<h3>Thank you!</h3><p class="muted">This is a sample plan, so RSVPs aren\u2019t saved. Start your own plan to collect real ones.</p>'; return; }
      var ans = $('#ans [aria-pressed="true"]').dataset.v; var plus = Math.max(0, +$('#rp').value || 0); var diet = $$('#rd [aria-pressed="true"]').map(function (b) { return b.textContent; });
      var cap = placesCap(ev);
      var existing = ev.guestsList.find(function (g) { return g.name.toLowerCase() === n.toLowerCase(); });
      var g = existing || { id: uid(), name: n }; g.plusOnes = plus; g.diet = diet;
      if (!existing) ev.guestsList.push(g);
      g.status = ans; if (ans === 'yes' && E.placesUsed(ev.guestsList) > cap) g.status = 'waitlist';
      if (ans === 'declined') promoteWaitlist(ev, cap);
      saveEvent(ev);
      $('#rsvp').innerHTML = '<h3>' + (g.status === 'yes' ? 'Thank you, see you there!' : g.status === 'waitlist' ? 'You’re on the waitlist' : 'Thanks for letting us know') + '</h3><p class="muted">' + (g.status === 'waitlist' ? 'The event is full right now. The host will let you know if a place opens up.' : (CFG.preview ? 'Your RSVP is saved. ' + (CFG.app ? 'For now it\u2019s saved on this device.' : 'In this preview it stays on this device; at launch it goes straight to the host.') + '' : 'Your RSVP was sent to the host.')) + '</p>';
    });
    $$('[data-vote]').forEach(function (b) { b.addEventListener('click', function () { var k = b.dataset.vote.split(':'); if (!ev.sample) { ev.polls[+k[0]].options[+k[1]].votes++; saveEvent(ev); } b.closest('.poll').innerHTML = '<p class="muted">Thanks for voting.</p>'; }); });
    $$('[data-buy]').forEach(function (b) { b.addEventListener('click', function () { ev.registry.items[+b.dataset.buy].bought = true; saveEvent(ev); b.outerHTML = '<span class="badge ok">Purchased</span>'; }); });
  }

  /* A guest on her own phone: the invitation comes from the server, and her RSVP and votes go back to the host. */
  function remoteGuestPage(id) {
    frame('<div class="invite"><p class="muted">Opening your invitation\u2026</p></div>', { noRibbon: true });
    apiInv(id).then(function (j) {
      var v = j.inv || {}, pay = v.pay || {}, reg = v.registry || { items: [], funds: [] };
      if (v.cur && v.cur !== 'USD') { var vco = D.COUNTRIES.find(function (k) { return k.currency === v.cur; }); if (vco) E.useCountry(vco.other); }
      var payBtns = [pay.venmo ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://venmo.com/u/' + encodeURIComponent(pay.venmo) + '">Venmo</a>' : '', pay.cashapp ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://cash.app/$' + encodeURIComponent(pay.cashapp) + '">Cash App</a>' : '', pay.paypal ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://paypal.me/' + encodeURIComponent(pay.paypal) + '">PayPal</a>' : ''].join('');
      var vLines = Array.isArray(v.lines) && v.lines.length ? v.lines.slice(0, 40).map(function (l) { return { k: /^(pre|name|body|when|where|note|dress|rsvp)$/.test(l.k) ? l.k : 'body', t: String(l.t || '').slice(0, 200) }; }) : [{ k: 'pre', t: 'You\u2019re invited to' }, { k: 'name', t: v.name }, { k: 'when', t: v.when || 'Date to be announced' }, { k: 'where', t: v.where || '' }].concat(v.dress ? [{ k: 'dress', t: v.dress }] : []);
      frame('<div class="invite">' + inviteCard(vLines, v.palette, String(v.mono || '').slice(0, 7), (/^https:\/\/calendar\.google\.com\//.test(v.cal || '') ? '<div><a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(v.cal) + '">Add to calendar</a></div>' : '')) +
        '<form id="rsvp" class="panel stack" style="text-align:left"><h3>RSVP</h3><label class="field"><span>Your name</span><input class="input" id="rn" required autocomplete="name" maxlength="80"></label><div class="seg" id="ans"><button type="button" data-v="yes" aria-pressed="true">I\u2019ll be there</button><button type="button" data-v="declined" aria-pressed="false">Can\u2019t make it</button></div>' +
        '<label class="field"><span>Plus-ones</span><input class="input num" type="number" min="0" max="5" id="rp" value="0"></label><div class="stack"><span class="muted small">Dietary needs</span><div class="chips" id="rd">' + D.DIETS.map(function (d) { return '<button type="button" class="chip" aria-pressed="false">' + esc(d) + '</button>'; }).join('') + '</div></div><button class="btn gold">Send RSVP</button></form>' +
        ((v.polls || []).length ? '<div class="panel stack" style="text-align:left"><h3>Vote</h3>' + v.polls.map(function (p, pi) { return '<b>' + esc(p.q) + '</b><div class="poll">' + p.options.map(function (o, oi) { return '<button data-vote="' + pi + ':' + oi + '"><span>' + esc(o.t) + '</span></button>'; }).join('') + '</div>'; }).join('') + '</div>' : '') +
        ((reg.items || []).length || (reg.funds || []).length ? '<div class="panel stack" style="text-align:left"><h3>Gift list</h3><div class="list">' + reg.items.map(function (it, i) { return '<div class="it"><span class="grow">' + esc(it.name) + (it.bought ? ' <span class="badge ok">Purchased</span>' : '') + '</span>' + (/^https?:\/\//i.test(it.url || '') ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(it.url) + '">View</a>' : '') + (it.bought ? '' : '<button class="btn small" data-buy="' + i + '">I bought this</button>') + '</div>'; }).join('') +
          (reg.funds || []).map(function (f) { return '<div class="it"><span class="grow">' + esc(f.name) + '</span>' + (payBtns || '<span class="muted small">Ask the host how to give</span>') + '</div>'; }).join('') + '</div></div>' : '') +
        (v.share ? '<div class="panel stack" style="text-align:left"><h3>Your share</h3><p>Each person\u2019s share is <b class="num">' + money(v.share) + '</b>.</p><div class="row">' + (payBtns || '<span class="muted small">The host will share how to pay.</span>') + '</div><p class="muted small">Payments go straight to the host.</p></div>' : '') +
        guestPromo() + '</div>', { noRibbon: true });
      $('#ans').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $$('#ans button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });
      $('#rd').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
      $('#rsvp').addEventListener('submit', function (e) {
        e.preventDefault(); var n = $('#rn').value.trim(); if (!n) return toast('Enter your name');
        var btn = $('#rsvp .btn.gold'); btn.disabled = true; btn.textContent = 'Sending\u2026';
        var ans = $('#ans [aria-pressed="true"]').dataset.v;
        apiInv(id, 'rsvp', { name: n, status: ans, plus: Math.max(0, +$('#rp').value || 0), diet: $$('#rd [aria-pressed="true"]').map(function (b) { return b.textContent; }) })
          .then(function () { $('#rsvp').innerHTML = '<h3>' + (ans === 'yes' ? 'Thank you, see you there!' : 'Thanks for letting us know') + '</h3><p class="muted">Your RSVP was sent to the host. To change it, send it again with the same name.</p>'; })
          .catch(function (err) { btn.disabled = false; btn.textContent = 'Send RSVP'; toast(err.message || 'Couldn\u2019t send. Check your connection and try again.'); });
      });
      $$('[data-vote]').forEach(function (b) { b.addEventListener('click', function () { var k = b.dataset.vote.split(':'); var box = b.closest('.poll'); apiInv(id, 'vote', { poll: +k[0], option: +k[1] }).then(function () { box.innerHTML = '<p class="muted">Thanks for voting.</p>'; }).catch(function (err) { toast(err.message || 'Couldn\u2019t send your vote. Try again.'); }); }); });
      $$('[data-buy]').forEach(function (b) { b.addEventListener('click', function () { apiInv(id, 'bought', { item: +b.dataset.buy }).then(function () { b.outerHTML = '<span class="badge ok">Purchased</span>'; }).catch(function (err) { toast(err.message || 'Couldn\u2019t save that. Try again.'); }); }); });
    }).catch(function (err) {
      frame('<div class="invite"><h2>This invitation isn\u2019t available</h2><p class="muted">' + (err && err.status === 404 ? 'The host may have removed it, or the event has passed. Ask them for a new link.' : 'We couldn\u2019t open it right now. Check your connection and try again.') + '</p><div class="row"><button class="btn ghost" id="again">Try again</button><a class="btn ghost" href="#/">Explore Event Couture</a></div></div>', { noRibbon: true });
      var a = $('#again'); if (a) a.addEventListener('click', function () { remoteGuestPage(id); });
    });
  }

  /* ---------- vendor sign-up (structured, saved as you go) ---------- */
  var VFIELDS = [
    ['Business basics', [['name', 'Business name', 'text', 1], ['email', 'Business email', 'text', 1], ['phone', 'Business phone', 'text'], ['cats', 'Categories', 'cats', 1], ['bio', 'Short description', 'area', 1], ['years', 'Years in business', 'number'], ['ig', 'Instagram handle (like @yourbusiness)', 'text'], ['site', 'Website', 'text']]],
    ['Service area', [['cities', 'Cities you serve', 'citylist', 1], ['radius', 'Travel radius (miles or km)', 'number', 1], ['travelFee', 'Travel fee (your currency, 0 if none)', 'number']]],
    ['Packages and prices', [['pkgName', 'Main package name', 'text', 1], ['pkgIncl', 'What it includes', 'area', 1], ['priceType', 'How it’s priced', 'select:Fixed price|Starting at|Per person|Per hour', 1], ['price', 'Price (your currency)', 'number', 1], ['minSpend', 'Minimum spend (your currency)', 'number'], ['peak', 'Weekend or peak-season increase (%)', 'number'], ['overtime', 'Overtime rate per hour (your currency)', 'number']]],
    ['Fees and payment terms', [['deposit', 'Deposit (% of total)', 'number', 1], ['schedule', 'When the balance is due', 'select:At booking|30 days before|14 days before|7 days before|On the day'], ['service', 'Service charge (%)', 'number'], ['tax', 'Do you charge sales tax?', 'select:Yes|No'], ['setupFee', 'Setup, delivery or cleanup fees (your currency)', 'number']]],
    ['Capacity and logistics', [['minGuests', 'Smallest event you take (guests)', 'number', 1], ['maxGuests', 'Largest event you take (guests)', 'number', 1], ['setupTime', 'Setup time needed (hours)', 'number'], ['indoor', 'Where you work', 'select:Indoors and outdoors|Indoors only|Outdoors only']]],
    ['Booking and availability', [['lead', 'Book at least this many weeks ahead', 'number', 1], ['reply', 'Typical reply time', 'select:Within a few hours|Within a day|Within 2 to 3 days'], ['blocked', 'Dates you’re already booked (one per line)', 'area']]],
    ['Limitations and rules', [['notIncl', 'What’s not included', 'area', 1], ['rules', 'Rules (outside catering, alcohol, noise curfew, confetti or candles)', 'area']]],
    ['Policies', [['cancel', 'Cancellation and refund policy', 'area', 1], ['weather', 'Weather or rain plan', 'area']]],
    ['Style and portfolio', [['styles', 'Styles you do best', 'styles'], ['events', 'Event types you serve', 'types', 1], ['langs', 'Languages spoken', 'text']]],
    ['Trust', [['reviews', 'Link to your reviews elsewhere', 'text'], ['insured', 'Are you insured?', 'select:Yes|No|Not required for my service']]],
    ['Agreement', [['agree', 'I confirm my listed prices are accurate and I’ll keep them up to date', 'check', 1]]]
  ];
  /* Live vendor listings and quote requests (needs the Event Couture server). */
  function apiMarket(path, body) {
    return fetch(CFG.apiUrl + '/api/' + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {})
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Request failed'); e.status = r.status; throw e; } return j; }); });
  }
  function randKey() { var a = new Uint8Array(18); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function vendorKey(v) { if (!v.key) { v.key = randKey(); store.set('vendor', v); } return v.key; }
  var CAT_BY_NAME = {}; Object.keys(D.CATEGORIES).forEach(function (k) { CAT_BY_NAME[D.CATEGORIES[k].name.split(' (')[0]] = k; });
  function catLabel(id) { var c = D.CATEGORIES[id]; return c ? c.name.split(' (')[0] : id; }
  function listingOut(v) { return Object.assign({}, v, { cats: [].concat(v.cats || []).map(function (n) { return CAT_BY_NAME[n] || n; }).filter(function (k) { return D.CATEGORIES[k]; }), key: undefined, serverId: undefined }); }
  function siteBase() { return CFG.siteUrl || location.href.split('#')[0]; }
  function vendorLiveSheet(v) {
    var link = siteBase() + '#/v/' + v.serverId, join = siteBase() + '#/vendors';
    var bio = 'Book me on Event Couture \u2192 ' + link;
    var invite = 'I\u2019m listed on Event Couture by Always Luxe, where clients planning weddings and events send quote requests for free. Vendors join free here: ' + join;
    sheet('<h3>You\u2019re live' + (v.founding ? ' \u00b7 Founding vendor' : '') + '</h3><p class="muted">Clients planning events in your city now see you' + (v.founding ? ' first, with a Founding vendor badge' : '') + '. Check <b>Client requests</b> for people asking for quotes.</p>' +
      '<div class="stack"><b>Add this to your Instagram bio</b><div class="note small" style="word-break:break-all">' + esc(bio) + '</div><button class="btn small" id="cpBio">Copy for my bio</button></div>' +
      '<div class="stack"><b>Bring the vendors you work with</b><span class="muted small">Your DJ, decorator, zaffe group or photographer: when they join, clients can book your whole team.</span><button class="btn small ghost" id="invV">Invite vendors</button></div>' +
      '<div class="row"><a class="btn" href="#/vendors/requests" data-close>See client requests</a><button class="btn ghost" data-close>Done</button></div>');
    $('#cpBio').addEventListener('click', function () { copyText(bio, 'Bio link'); });
    $('#invV').addEventListener('click', function () { if (navigator.share) navigator.share({ title: 'Event Couture', text: invite }).catch(function () {}); else copyText(invite, 'Invitation'); });
  }
  function reqLine(r) { return [r.type, r.date ? fmtDate(r.date) : 'Date not set', r.guests ? plural(r.guests, 'guest') : '', r.city].filter(Boolean).map(esc).join(' \u00b7 '); }
  function vendorRequests() {
    var v = store.get('vendor', {});
    if (!SHARING || !v.serverId) { frame('<div class="stack"><h2>Client requests</h2><p class="muted">List your business first; requests from clients in your city show up here once you\u2019re live.</p><div><a class="btn" href="#/vendors">List my business</a></div></div>'); return; }
    frame('<div class="stack-lg"><div class="stack"><h2>Client requests</h2><p class="muted">Clients planning events in your city and category. Reply with your price and a short note; your contact details go with your reply, and the client reaches out to book.</p><div class="row"><a class="btn small ghost" href="#/vendors">Edit my listing</a></div></div><div id="reqs"><p class="muted">Loading\u2026</p></div></div>');
    apiMarket('req/list', { key: vendorKey(v), vid: v.serverId }).then(function (j) {
      var list = j.requests || [];
      if (!list.length) { $('#reqs').innerHTML = '<div class="panel stack"><b>No requests yet</b><p class="muted small">New requests appear here as clients plan. Share your bio link so your followers plan with you.</p></div>'; return; }
      $('#reqs').innerHTML = list.map(function (r) {
        return '<div class="panel stack" data-req="' + esc(r.id) + '"><div class="row" style="justify-content:space-between"><b>' + esc(r.need || catLabel(r.cat)) + '</b>' + (r.replied ? '<span class="badge">You replied</span>' : '') + '</div><div class="small muted">' + reqLine(r) + '</div>' +
          (r.budget ? '<div class="small">Budget for this: <b>' + E.moneyIn(r.budget, r.city) + '</b></div>' : '') + (r.theme ? '<div class="small">Theme: ' + esc(r.theme) + '</div>' : '') + (r.notes ? '<div class="small">' + esc(r.notes) + '</div>' : '') +
          '<label class="field"><span>Your reply</span><textarea class="input" data-msg placeholder="Available? What\u2019s included? Anything they should know?"></textarea></label><label class="field"><span>Your price (' + E.countryOf(r.city).currency + ', optional)</span><input class="input num" type="number" min="0" data-price></label><button class="btn small" data-send>' + (r.replied ? 'Update my reply' : 'Send my reply') + '</button><span class="muted small">' + (r.replies ? plural(r.replies, 'vendor') + ' replied so far' : 'Be the first to reply') + '</span></div>';
      }).join('');
      $$('[data-send]').forEach(function (b) { b.addEventListener('click', function () {
        var box = b.closest('[data-req]'), msg = $('[data-msg]', box).value.trim(); if (!msg) { toast('Write a short reply'); $('[data-msg]', box).focus(); return; }
        b.disabled = true; apiMarket('req/reply', { key: vendorKey(v), vid: v.serverId, id: box.dataset.req, msg: msg, price: +$('[data-price]', box).value || 0 }).then(function () { b.disabled = false; b.textContent = 'Update my reply'; toast('Reply sent'); }).catch(function (e) { b.disabled = false; toast(e.message); });
      }); });
    }).catch(function (e) { $('#reqs').innerHTML = '<p class="muted">' + esc(e.message || 'Requests aren\u2019t available right now.') + '</p>'; });
  }
  function vendorProfile(id) {
    frame('<div class="stack" id="vp"><p class="muted">Loading\u2026</p></div>');
    if (!SHARING) { $('#vp').innerHTML = '<h2>Vendor pages open when Event Couture launches</h2>'; return; }
    apiMarket('vendor/' + encodeURIComponent(id)).then(function (j) {
      var x = j.vendor;
      $('#vp').innerHTML = '<div class="stack-lg"><div class="stack"><span class="small muted">' + (x.founding ? 'Founding Event Couture vendor' : 'Event Couture vendor') + '</span><h2>' + esc(x.name) + '</h2><div class="small muted">' + esc(x.cats.map(catLabel).join(', ')) + ' \u00b7 ' + esc(x.cities.join(', ')) + '</div></div>' +
        (x.bio ? '<p>' + esc(x.bio) + '</p>' : '') +
        (x.pkgName || x.price ? '<div class="panel stack"><b>' + esc(x.pkgName || 'Packages') + '</b>' + (x.price ? '<span>' + esc(x.priceType || 'From') + ' ' + E.moneyIn(x.price, x.cities[0]) + '</span>' : '') + (x.pkgIncl ? '<span class="small muted">' + esc(x.pkgIncl) + '</span>' : '') + '</div>' : '') +
        (x.langs ? '<div class="small">Languages: ' + esc(x.langs) + '</div>' : '') +
        '<div class="row">' + (x.ig ? '<a class="btn small" target="_blank" rel="noopener" href="https://instagram.com/' + esc(x.ig) + '">Instagram</a>' : '') + (x.site ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(x.site) + '">Website</a>' : '') + (x.phone ? '<a class="btn small ghost" href="tel:' + esc(x.phone.replace(/[^0-9+]/g, '')) + '">Call</a>' : '') + '</div>' +
        '<div class="panel stack"><b>Planning an event?</b><span class="muted small">Event Couture plans the whole thing from one photo or a few words: looks, budget, venues and vendors.</span><a class="btn gold" href="#/new/1">Plan my event free</a></div>' +
        '<button class="link small muted" id="rpt">Report this listing</button></div>';
      $('#rpt').addEventListener('click', function () { apiMarket('vendor/report', { id: id }).then(function () { toast('Thanks. We\u2019ll take a look.'); }).catch(function () {}); });
    }).catch(function (e) { $('#vp').innerHTML = '<h2>This vendor isn\u2019t listed right now</h2><p class="muted"><a href="#/new/1">Plan your event</a></p>'; });
  }
  function vendorJoin() {
    var v = store.get('vendor', {});
    function req() { return VFIELDS.reduce(function (a, s) { return a.concat(s[1].filter(function (f) { return f[3]; })); }, []); }
    function done() { var r = req(); return r.filter(function (f) { var x = v[f[0]]; return Array.isArray(x) ? x.length : (f[2] === 'check' ? x === true : x !== undefined && String(x).trim() !== ''); }).length / r.length; }
    function input(f) {
      var id = 'v_' + f[0], val = v[f[0]];
      if (f[2] === 'area') return '<textarea class="input" id="' + id + '" aria-label="' + esc(f[1]) + '">' + esc(val || '') + '</textarea>';
      if (f[2] === 'number') return '<input class="input num" type="number" min="0" id="' + id + '" aria-label="' + esc(f[1]) + '" value="' + esc(val == null ? '' : val) + '">';
      if (f[2] === 'check') return '<label class="row"><input type="checkbox" id="' + id + '"' + (val ? ' checked' : '') + '> ' + esc(f[1]) + '</label>';
      if (f[2].indexOf('select:') === 0) return '<select class="input" id="' + id + '" aria-label="' + esc(f[1]) + '"><option value="">Choose</option>' + f[2].slice(7).split('|').map(function (o) { return '<option' + (val === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
      var opts = f[2] === 'cats' ? Object.keys(D.CATEGORIES).filter(function (k) { return ['restaurantFood', 'restaurantDrinks', 'cakeFee', 'tableDecor', 'permits'].indexOf(k) < 0; }).map(function (k) { return D.CATEGORIES[k].name.split(' (')[0]; }) : f[2] === 'citylist' ? D.CITIES.map(function (c) { return c.name; }) : f[2] === 'styles' ? D.STYLES.map(function (s) { return s.name; }) : f[2] === 'types' ? D.EVENT_TYPES.map(function (t) { return t.name; }).concat(Object.keys(D.CULTURES).map(function (k) { return D.CULTURES[k].name; })) : null;
      if (opts) return '<div class="chips" id="' + id + '" role="group" aria-label="' + esc(f[1]) + '" data-multi>' + opts.map(function (o) { return '<button type="button" class="chip" aria-pressed="' + ((val || []).indexOf(o) >= 0) + '">' + esc(o) + '</button>'; }).join('') + '</div>';
      return '<input class="input" id="' + id + '" aria-label="' + esc(f[1]) + '" value="' + esc(val || '') + '">';
    }
    var pct = Math.round(done() * 100);
    frame('<div class="wizard stack-lg"><div class="stack"><h2>List your business on Event Couture</h2><p class="muted">' + (SHARING ? 'Listing is free. Once your listing is complete, it goes live: clients planning events in your city see you first, and you can answer their quote requests.' : 'Listing is free. Once vendor accounts launch, hosts planning events in your area will see your packages and prices inside their plans. Until then your listing saves on this device as you go.') + '</p>' + (SHARING && v.serverId ? '<div class="row"><a class="btn small" href="#/vendors/requests">See client requests</a>' + (v.live ? '<a class="btn small ghost" href="#/v/' + esc(v.serverId) + '">View my page</a>' : '') + '</div>' : '') + '</div>' +
      '<div class="panel stack"><div class="row" style="justify-content:space-between"><b>Listing complete</b><span class="num" id="pct">' + pct + '%</span></div><div class="meter"><i id="bar" style="width:' + pct + '%"></i></div><p class="muted small">Complete listings with full prices will show first in hosts\u2019 plans.</p>' +
      '</div>' +
      VFIELDS.map(function (s) { return '<fieldset class="panel stack" style="border:1px solid var(--line)"><legend class="display" style="font-size:1.15rem;padding:0 6px">' + esc(s[0]) + '</legend>' + s[1].map(function (f) { return f[2] === 'check' ? input(f) : '<div class="field"><span>' + esc(f[1]) + (f[3] ? '' : ' (optional)') + '</span>' + input(f) + '</div>'; }).join('') + '</fieldset>'; }).join('') +
      '<button class="btn gold block" id="submit">Save my listing</button><p class="muted small">You can update prices anytime from this page.</p></div>');
    function collect() {
      VFIELDS.forEach(function (s) { s[1].forEach(function (f) { var el = document.getElementById('v_' + f[0]); if (!el) return;
        if (el.hasAttribute('data-multi')) v[f[0]] = $$('[aria-pressed="true"]', el).map(function (b) { return b.textContent; });
        else if (f[2] === 'check') v[f[0]] = el.checked; else v[f[0]] = el.value; }); });
      store.set('vendor', v); var p = Math.round(done() * 100); $('#pct').textContent = p + '%'; $('#bar').style.width = p + '%';
    }
    $('#main').addEventListener('input', collect); $('#main').addEventListener('change', collect);
    $$('[data-multi]').forEach(function (box) { box.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); collect(); }); });
    if ($('#autofill')) $('#autofill').addEventListener('click', function () { sheet('<h3>Fill in from your website</h3><p class="muted">Paste your website or Instagram link and the AI fills in the form for you to check. This turns on when the app launches.</p><button class="btn block" data-close>OK</button>'); });
    $('#submit').addEventListener('click', function () { collect(); if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v.email).trim())) { toast('Enter a valid business email'); var em = document.getElementById('v_email'); if (em) em.focus(); return; } if (done() < 1) { var missing = req().filter(function (f) { var x = v[f[0]]; return Array.isArray(x) ? !x.length : (f[2] === 'check' ? x !== true : !x || !String(x).trim()); }); toast('Still needed: ' + missing.slice(0, 3).map(function (f) { return f[1].toLowerCase(); }).join(', ')); var el = document.getElementById('v_' + missing[0][0]); if (el) el.scrollIntoView({ block: 'center' }); return; }
      v.published = new Date().toISOString(); store.set('vendor', v); T('vendor_listing_published', { categories: [].concat(v.cats || []).join(',') });
      if (!SHARING) return sheet('<h3>Your listing is saved</h3><p class="muted">It\u2019s saved on this device for now. Listings open to hosts when vendor accounts launch; you\u2019ll be able to sign in, confirm it and go live then. Nothing is shared before you do.</p><button class="btn block" data-close>Done</button>');
      var btn = $('#submit'); btn.disabled = true; btn.textContent = 'Saving\u2026';
      apiMarket('vendor/save', { key: vendorKey(v), id: v.serverId, listing: listingOut(v) }).then(function (j) {
        v.serverId = j.id; v.live = j.live; v.founding = j.founding; store.set('vendor', v); btn.disabled = false; btn.textContent = 'Save my listing';
        if (!j.live) return sheet('<h3>Saved, almost live</h3><p class="muted">Add ' + esc((j.missing || []).map(function (m) { return { ig: 'your Instagram or website', agree: 'the price agreement at the bottom', name: 'your business name', cats: 'what you offer', cities: 'the cities you serve' }[m] || m; }).join(' and ')) + ' and save again to go live.</p><button class="btn block" data-close>OK</button>');
        vendorLiveSheet(v);
      }).catch(function (e) { btn.disabled = false; btn.textContent = 'Save my listing'; toast(e.message || 'Couldn\u2019t save right now. Try again.'); });
    });
  }

  /* ---------- help assistant ---------- */
  var FAQ = [
    ['How do I invite guests?', 'Open your plan, then Guests & invitations, Invite and registry. Copy your invite link and send it by text, email or social media. Guests RSVP, vote and see the details from the link, with no app needed. Keep your plan first to share it.', 'invite invitation invitations send link rsvp guests share'],
    ['Can guests add photos?', 'Yes. Guests open your invite link and tap Add photos under Share your photos. Everyone\u2019s pictures land in your plan under Photos and thank-yous.', 'photos photo pictures album upload add'],
    ['Is there a subscription?', 'No. Planning is free, and you pay once per event only if you want to keep and share your plan. Nothing renews automatically.', 'subscription subscribe monthly recurring renew renewal'],
    ['How much does it cost?', 'You pay once per event, based on how many people you invite, in US dollars: US$9.99 up to 25 guests, US$19.99 up to 75, US$39.99 up to 150, US$69.99 up to 350, and more for larger events. Guests never pay to view, RSVP or vote.', 'price cost pay pass much'],
    ['What if my guest list grows?', 'Move up a size under Overview, Your pass. You pay only the difference, and your plan stays exactly as it is.', 'grow grows growing more upgrade capacity bigger places full waitlist'],
  ];
  FAQ = FAQ.concat([
    ['Which countries does it work in?', 'Over 60, including the UK, Europe, the Middle East, India, Asia, Australia, Mexico, Latin America and Africa. Choose your country, then your city. Prices are estimated in your local currency with local tax, drive distances are in kilometres (miles in the UK), and venues and vendors are searched in your city. Tips are only added in the US and Canada.', 'country countries international abroad worldwide dubai uae london uk europe india mexico australia jordan saudi currency'],
    ['Does it work in Canada?', 'Yes. Choose Canada, then your city. Prices are estimated in Canadian dollars with your province\u2019s GST, HST, PST or QST, drive distances are in kilometres (miles in the UK), and venue and vendor searches stay in Canada.', 'canada canadian cad toronto vancouver montreal calgary ottawa province hst gst'],
    ['How do I get quotes from vendors?', 'Open your plan, then Budget & bookings, Vendors, and tap See options on what you need. Tap Get quotes from vendors: Event Couture vendors in your city see your date, guest count, theme and budget, never your name or contact, and reply with prices right there. Found someone on Instagram? Add their handle and message them your request in one tap.', 'quote quotes vendor request price instagram singer dj'],
    ['Can I get a refund?', 'Planning is free, so you see your whole plan before you pay. If something you paid for doesn\u2019t work, contact us and we\u2019ll make it right. Purchases made in the iPhone or Android app are refunded through Apple or Google from your purchase history.', 'refund money back cancel charged'],
    ['How do I contact you?', CFG.supportEmail ? 'Email us at ' + CFG.supportEmail + '. We reply within one business day.' : 'Start with the answers on this page. If you still need help, use the contact details on the Event Couture website.', 'contact support email phone talk person help reach'],
    ['Is my data safe?', 'Yes. Your plans, guest lists and photos stay on your device. To create your concepts, your details and inspiration go through our server to Google\u2019s AI and aren\u2019t kept by Event Couture. We never sell your data, and guest details are never shown to vendors. Google Analytics counts visits and which buttons are tapped, never names, photos or what you type. See Privacy for the details.', 'safe secure privacy data private sell share'],
    ['How long do I keep my plan?', 'Until 12 months after you keep it, or 30 days after your event, whichever is later. The exact date is shown before you pay and under Overview, Your pass.', 'expire expiry how long access keep'],
    ['Are the prices real?', 'Each price is labeled. Planning estimates are sized to your city and guest count and include tax, service charges and, where tipping is customary, tips. Vendor-published prices, quotes and bookings are marked as such. Add any quote you get under Budget & bookings, Add quote or booking.', 'real accurate estimate price quote'],
    ['Do my guests need the app?', 'No. Once accounts launch, guests open your invite link in any browser to see the details, RSVP, vote and view the registry. Right now the link previews on your own device.', 'guests app download link rsvp'],
    ['How does cost splitting work?', 'Add your Venmo, Cash App or PayPal under Invite and registry. Each person sees their share and pays you directly; you tick them off as paid. Event Couture never holds the money.', 'split venmo cash share pay'],
    ['How do I add a co-host?', 'Open Guests & invitations, Guests, and add them under Co-hosts. Choose whether they can edit, edit without seeing the budget, or only view and vote.', 'cohost co-host partner share plan'],
    ['Can I change my concept?', 'Yes. Open Overview, Change concept. You can also see three different concepts once, for free.', 'concept theme change different'],
    ['How do I delete my data?', 'Open the event, go to Overview, Your pass, and choose Delete event. The plan, guest list and photos are removed from your device.', 'delete data privacy remove account'],
    ['How do vendors join?', SHARING ? 'Vendors list their business for free at For vendors (at the bottom of every page), with their Instagram, packages and prices. Complete listings go live right away: clients planning in their city see them first and can send them quote requests.' : 'Vendors list their business for free at For vendors, with packages, prices and policies. Listings appear to hosts planning events in their area once vendor accounts launch.', 'vendor business list join instagram']
  ]);
  if (SHARING) FAQ = FAQ.map(function (q) {   /* invitations open on guests' own phones */
    if (/^Do my guests need the app/.test(q[0])) return [q[0], 'No. Guests open your invitation link in any browser to see the details, RSVP, vote and see your gift list. Their RSVPs come into your Guests list.', q[2]];
    if (/^How do I invite guests/.test(q[0])) return [q[0], 'Keep your plan, then open Guests & invitations, Invitation. ' + (CFG.app ? 'Tap Send invitation to send it by text, email or any app.' : 'Copy your invite link and send it by text, email or social media.') + ' Guests RSVP and vote from the link on their own phones, with no app needed, and their answers come into your Guests list.', q[2]];
    if (/^Can guests add photos/.test(q[0])) return [q[0], 'Guests can send you their photos, and you add them to your album under Photos and thank-yous.', q[2]];
    return q;
  });
  if (CFG.launchFree && !CFG.app) FAQ = FAQ.map(function (q) {   /* the website is free during launch: its help answers carry no prices either */
    if (/^Is there a subscription/.test(q[0])) return [q[0], 'No. Planning and keeping your plan are free during our launch. Nothing renews automatically.', q[2]];
    if (/^How much does it cost/.test(q[0])) return [q[0], 'Planning and keeping your plan are free during our launch. Guests never pay to view, RSVP or vote. After the launch, prices are on the Pricing page.', q[2]];
    if (/^What if my guest list grows/.test(q[0])) return [q[0], 'Tap the guest count at the top of your plan to change it. During our launch it\u2019s free, and your plan stays exactly as it is.', q[2]];
    if (/^How long do I keep my plan/.test(q[0])) return [q[0], 'Until 12 months after you keep it, or 30 days after your event, whichever is later. The exact date is shown when you keep it and under Overview, Your pass.', q[2]];
    if (/^Can I get a refund/.test(q[0])) return [q[0], 'There\u2019s nothing to pay during our launch. If anything doesn\u2019t work, contact us and we\u2019ll make it right.', q[2]];
    return q;
  });
  if (CFG.app) FAQ = FAQ.map(function (q) {   /* the app is free for now, so its help answers carry no prices */
    if (/^Is there a subscription/.test(q[0])) return [q[0], 'No. Planning and keeping your plan are free in the app. Nothing renews automatically.', q[2]];
    if (/^How much does it cost/.test(q[0])) return [q[0], 'Planning and keeping your plan are free in the app. Guests never pay to view, RSVP or vote.', q[2]];
    if (/^What if my guest list grows/.test(q[0])) return [q[0], 'Tap the guest count at the top of your plan to change it. In the app it\u2019s free, and your plan stays exactly as it is.', q[2]];
    if (/^Can I get a refund/.test(q[0])) return [q[0], 'There are no purchases in the app right now. If anything doesn\u2019t work, contact us and we\u2019ll make it right.', q[2]];
    if (SHARING && /^(Do my guests need the app|How do I invite guests|Can guests add photos)/.test(q[0])) return q;   /* the shared-invitation answers below apply */
    if (/^Do my guests need the app/.test(q[0])) return [q[0], 'No. Tap Send invitation on the Invitation page to send the details by text, email or any app. Guests reply to you to RSVP, and you add their answers under Guests.', q[2]];
    if (/^How do I invite guests/.test(q[0])) return [q[0], 'Open your plan, then Guests & invitations, Invitation. Tap Send invitation to share the date, place and dress code by text, email or any app. Guests reply to you, and you track RSVPs under Guests.', q[2]];
    if (/^Can guests add photos/.test(q[0])) return [q[0], 'Guests can send you their photos, and you add them to your album under Photos and thank-yous.', q[2]];
    if (/^How do vendors join/.test(q[0])) return null;
    if (/^How long do I keep my plan/.test(q[0])) return [q[0], 'Until 12 months after you keep it, or 30 days after your event, whichever is later. The exact date is under Overview, Plan details.', q[2]];
    if (/^How do I delete my data/.test(q[0])) return [q[0], q[1].replace('Overview, Your pass', 'Overview, Plan details'), q[2]];
    return q;
  }).filter(Boolean);
  function help() {
    frame('<div class="wizard stack-lg"><div class="stack"><h2>Help</h2><p class="muted">Ask a question or pick one below. Answers come from the help center and your own events.</p></div>' +
      '<div class="panel stack"><div class="chat" id="chat"></div><form id="ask" class="row"><input class="input" aria-label="Your question" id="q" style="flex:1 1 220px" placeholder="Type your question" autocomplete="off"><button class="btn">Ask</button></form></div>' +
      '<div class="stack">' + FAQ.map(function (f) { return '<details class="panel"><summary style="cursor:pointer;font-weight:500">' + esc(f[0]) + '</summary><p class="muted" style="margin-top:10px">' + esc(f[1]) + '</p></details>'; }).join('') + '</div></div>');
    $('#ask').addEventListener('submit', function (e) { e.preventDefault(); var q = $('#q').value.trim(); if (!q) return;
      var STOP = ['how', 'the', 'can', 'get', 'you', 'what', 'does', 'and', 'for', 'are', 'with', 'this', 'that', 'there', 'when', 'why', 'who', 'will', 'your', 'about'];
      var words = q.toLowerCase().split(/\W+/).filter(function (w) { return STOP.indexOf(w) < 0; }); var best = FAQ.map(function (f) { return { f: f, s: words.filter(function (w) { return w.length > 2 && f[2].indexOf(w) >= 0; }).length }; }).sort(function (a, b) { return b.s - a.s; })[0];
      var a = best.s ? best.f[1] : 'I couldn’t find an answer to that. Try asking about ' + (CFG.app ? '' : 'pricing, refunds, ') + 'guests, co-hosts, cost splitting, how long you keep your plan, or deleting your data.';
      $('#chat').insertAdjacentHTML('beforeend', '<div class="bubble me">' + esc(q) + '</div><div class="bubble ai">' + esc(a) + '</div>'); $('#q').value = ''; });
  }

  /* ---------- legal ---------- */
  function legal(kind) {
    var L = window.EC_LEGAL || {};
    frame('<div class="wizard stack legal">' + (kind === 'privacy' ? L.privacy : L.terms) + '<p class="small muted"><a href="#/' + (kind === 'privacy' ? 'terms">Terms of Use' : 'privacy">Privacy Policy') + '</a> \u00b7 <a href="#/help">Help</a></p></div>');
  }


  /* In the phone app, outside links open in an in-app window that returns to the plan when closed. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[target="_blank"]'); if (!a) return;
    var B = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser;
    if (B && B.open) { e.preventDefault(); B.open({ url: a.href, presentationStyle: 'popover' }); }
  });

  route();
})();
