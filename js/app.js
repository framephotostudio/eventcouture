/* Event Couture: the app. Hash routes, local storage, every screen. */
(function () {
  'use strict';
  var D = window.EC_DATA, E = window.EC_ENGINE, CFG = window.EC_CONFIG || {};
  var money = E.money;
  var app = document.getElementById('app');

  /* ---------- small utilities ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function uid() { return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
  function sw(p) { return '<div class="swatch" aria-hidden="true">' + p.map(function (c) { return '<i style="background:' + esc(c) + '"></i>'; }).join('') + '</div>'; }
  /* Small palette dots: the photo carries the mood, the dots name the colors. */
  function dots(p, label) { return '<span class="dots" role="img" aria-label="' + esc(label || 'Color palette') + '">' + p.slice(0, 5).map(function (c) { return '<i style="background:' + esc(c) + '"></i>'; }).join('') + '</span>'; }
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
  var ALC = /martini|spritz|mimosa|\bwine\b|cocktail|sangria|margarita|champagne|prosecco|\bbeer\b|bourbon|whiskey|tequila|rum punch|bellini|negroni|old fashioned|bar setup|bar cart/i;
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
    var h = +String(ev.time || '18:00').split(':')[0];
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
  function thumb(photo, cls) { return photo ? '<div class="thumb ' + (cls || '') + '"><img src="' + srcOf(photo.src) + '" alt="' + esc(photo.alt) + '" loading="lazy" onerror="this.parentNode.classList.add(\'noimg\');this.remove()">' + (photo.ai ? AI_TAG : '') + '</div>' : ''; }
  /* Every AI-made picture says so, so no one mistakes it for a real event we organized. */
  var AI_TAG = '<span class="ai-tag">AI-generated inspiration</span>';
  function fmtDate(d) { if (!d) return 'Date not set'; var x = new Date(d + 'T12:00:00'); return x.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }); }
  function shortDate(d) { if (!d) return ''; return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function fmtTime(t) { if (!t) return ''; var p = t.split(':'); var h = +p[0]; return ((h + 11) % 12 + 1) + ':' + p[1] + (h < 12 ? ' AM' : ' PM'); }
  function plural(n, w) { return (typeof n === 'number' ? n.toLocaleString('en-US') : n) + ' ' + w + (n === 1 ? '' : 's'); }
  function clearToasts() { $$('.toast').forEach(function (t) { t.remove(); }); }
  function toast(msg) {
    clearToasts();
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  /* Undo: big plan changes show a message with an Undo button for 8 seconds. */
  var UNDO_KEYS = ['tier', 'exclude', 'include', 'overrides', 'hours', 'guests', 'expected', 'budget', 'alcohol', 'setting', 'city', 'shortlist', 'date', 'time', 'ros', 'settingOpen'];
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
    function close() { back.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
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
      var ip = E.inspoOf(ev); if (ip) { ip.palette.forEach(function (h) { colors.push(hexRgb(h)); }); text += ' ' + E.inspoText(ip).toLowerCase(); }
      var fin = function (list) { return E.withInspo(ev, list, skip); };
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
  var BRAND = { mark: 'img/brand/ec-mark-128.png', logo: 'img/brand/logo-full.jpg', compact: 'img/brand/logo-compact.jpg', banner: 'img/brand/logo-banner-wide.jpg', letters: 'img/brand/logo-letters.png' };
  var lastHash = null;
  function frame(inner, opts) {
    opts = opts || {};
    var ribbon = CFG.preview && !opts.noRibbon ? '<div class="preview-ribbon">Preview version: no real charges, and sharing works on this device only.</div>' : '';
    app.innerHTML = ribbon +
      '<header class="topbar"><a class="brand logo-banner" href="#/" aria-label="Event Couture by Always Luxe, home"><span class="frame-outer"><span class="frame" style="background-image:url(' + srcOf(BRAND.banner) + ')"><img src="' + srcOf(BRAND.letters) + '" alt="Event Couture by Always Luxe" width="900" height="540"></span></span></a>' +
      '<nav><a class="icon-btn" href="#/events" aria-label="My events" title="My events">' + ICON.events + '</a><a class="icon-btn" href="#/help" aria-label="Help" title="Help">' + ICON.help + '</a></nav></header>' +
      '<main id="main"' + (location.hash !== lastHash ? ' class="fade"' : '') + '>' + inner + '</main>' +
      '<footer class="site"><img src="' + srcOf(BRAND.mark) + '" alt="" loading="lazy"><nav><a href="#/help">Help</a><a href="#/pricing">Pricing</a><a href="#/vendors">For vendors</a><a href="#/privacy">Privacy</a><a href="#/terms">Terms</a></nav><div class="name">Event Couture by Always Luxe</div><div class="small">Also from Always Luxe: <a href="https://facecouture.app/" target="_blank" rel="noopener">Face Couture</a></div></footer>';
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
    var h = (location.hash || '#/').slice(1); var p = h.split('/').filter(Boolean);
    try {
      if (!p.length) return home();
      if (p[0] === 'new') return wizard(+(p[1] || 1), p[2]);
      if (p[0] === 'events') return myEvents();
      if (p[0] === 'inspiration') return inspirationPage(p[1] && p[1] !== 'all' ? decodeURIComponent(p[1]) : '', p[2]);
      if (p[0] === 'sample') { var se = sampleEvent(+p[1] || 0); return se ? planView(se, p[2] || 'overview') : notFound(); }
      if (p[0] === 'e' && p[2] === 'concepts') return conceptsView(p[1]);
      if (p[0] === 'e') { var ev = getEvent(p[1]); if (!ev) return notFound(); return planView(ev, p[2] || 'overview'); }
      if (p[0] === 'g') return guestPage(p[1]);
      if (p[0] === 'vendors') return vendorJoin();
      if (p[0] === 'help') return help();
      if (p[0] === 'pricing') return pricing();
      if (p[0] === 'privacy') return legal('privacy');
      if (p[0] === 'terms') return legal('terms');
      notFound();
    } catch (err) { console.error(err); frame('<div class="stack"><h2>Something went wrong on this screen</h2><p class="muted">Your events are saved. Go back to <a href="#/events">My events</a> and open it again.</p></div>'); }
  }
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
  function inspoFor(type) { return type ? INSPO.filter(function (p) { return p.types.indexOf(type) >= 0; }).sort(function (a, b) { return a.types.indexOf(type) - b.types.indexOf(type); }) : INSPO; }
  function inspoCards(type, limit) {
    var list = inspoFor(type), shown = limit ? list.slice(0, limit) : list;
    return shown.map(function (p) { return '<button type="button" class="icard" data-inspo="' + p.id + '" aria-label="' + esc(p.name) + ', AI-generated inspiration photo"><div class="thumb"><img src="' + srcOf(INSPO_IMG + 'sm/' + p.id + '.jpg') + '" alt="' + esc(p.alt) + '" loading="lazy">' + AI_TAG + '</div><span class="iname">' + esc(p.name) + '</span></button>'; }).join('') +
      (limit && list.length > limit ? '<a class="icard more" href="#/inspiration' + (type ? '/' + type : '') + '"><span>See all ' + list.length + (type ? ' ' + esc(E.typeOf(type).name.toLowerCase().replace(/christmas/, 'Christmas')) : '') + ' photos</span></a>' : '');
  }
  function inspoGallery(type, limit) {
    return '<div class="chips iscroll" id="ifilter" role="group" aria-label="Filter by occasion"><button type="button" class="chip" data-t="" aria-pressed="' + !type + '">All occasions</button>' +
      inspoTypes().map(function (t) { return '<button type="button" class="chip" data-t="' + t.id + '" aria-pressed="' + (t.id === type) + '">' + esc(t.name) + '</button>'; }).join('') + '</div>' +
      '<div class="igrid" id="igrid">' + inspoCards(type, limit) + '</div>' +
      '<p class="muted small">Every photo here is AI-generated inspiration, not a real event we organized. Venues, vendors and prices in your plan are real and matched to your city.</p>';
  }
  function bindInspo(limit, onType) {
    var cur = ($('#ifilter [aria-pressed="true"]') || {}).dataset; cur = cur ? cur.t : '';
    $('#ifilter').addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; cur = b.dataset.t; $$('#ifilter [data-t]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $('#igrid').innerHTML = inspoCards(cur, limit); if (onType) onType(cur); });
    $('#igrid').addEventListener('click', function (e) { var b = e.target.closest('[data-inspo]'); if (b) openInspo(b.dataset.inspo, cur); });
  }
  function openInspo(id, type) {
    var p = INSPO.find(function (x) { return x.id === id; }); if (!p) return;
    var pick = type && p.types.indexOf(type) >= 0 ? type : p.types[0];
    sheet('<div class="thumb ibig"><img src="' + srcOf(INSPO_IMG + p.id + '.jpg') + '" alt="' + esc(p.alt) + '">' + AI_TAG + '</div>' +
      '<div class="stack"><h3>' + esc(p.name) + '</h3>' + dots(p.palette, p.name + ' colors') + '<p class="muted">' + esc(p.mood) + '</p></div>' +
      '<div class="stack"><b class="small">In this photo</b><ul class="incl">' + p.decor.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="stack"><b class="small" id="iforLbl">Plan it for</b><div class="chips" id="ifor" role="group" aria-labelledby="iforLbl">' + p.types.map(function (t) { return '<button type="button" class="chip" data-t="' + t + '" aria-pressed="' + (t === pick) + '">' + esc(E.typeOf(t).name) + '</button>'; }).join('') + '</div><span class="muted small">Planning something else? Choose any occasion on the next steps.</span></div>' +
      '<p class="muted small">Your concepts, decor, shopping list, menu and playlist follow this photo. Next, add anything you want different, like colors, guest count or budget. Your words always win.</p>' +
      '<button class="btn gold block" id="useInspo">Use this inspiration</button><button class="btn ghost block" data-close>Keep browsing</button>', function (el, close) {
      $('#ifor', el).addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; pick = b.dataset.t; $$('#ifor [data-t]', el).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });
      $('#useInspo', el).addEventListener('click', function () { close(); startFromInspo(p, pick); });
    });
  }
  var inspoFor_ = null;   /* the draft a host is choosing a different photo for */
  function startFromInspo(p, type) {
    var keep = inspoFor_ && drafts()[inspoFor_]; inspoFor_ = null;
    var d = keep || newDraft(), tt = E.typeOf(type);
    d.inspiration.inspo = p.id;
    if (d.type !== type) { d.type = type; d.hours = tt.hours; if (!d.guestsTouched) d.guests = d.expected = tt.defaultGuests; }
    d.typeChosen = true;
    if (!d.settingChosen) { d.setting = p.setting; if ((d.setting === 'restaurant' || d.setting === 'privateRoom') && d.hours > 3) d.hours = 3; }
    if (type === 'kids-birthday') d.kids = true;
    if (!saveDraft(d)) return;
    location.hash = '#/new/1/' + d.id;
  }
  function inspirationPage(type, forId) {
    inspoFor_ = forId && drafts()[forId] ? forId : null;
    if (type && !inspoTypes().some(function (t) { return t.id === type; })) type = '';
    frame('<div class="stack-lg"><div class="stack"><h2>Inspiration by occasion</h2><p class="muted">Tap a photo you love. Your plan, from the decor to the playlist, is built around what’s in it.</p></div>' + inspoGallery(type) + '</div>');
    bindInspo(0, function (t) { history.replaceState(null, '', '#/inspiration/' + (t || 'all') + (inspoFor_ ? '/' + inspoFor_ : '')); });
  }

  function home() {
    var demoEv = { type: 'wedding', guests: 150, city: 'Houston, TX' };
    var demo = E.budget(demoEv, 'S');
    var pick = function (id) { return demo.items.find(function (i) { return i.id === id; }) || { mid: 0 }; };
    var tags = [['Candles and decor', pick('decor').mid, 36, 30], ['Cake', pick('cake').mid, 80, 36], ['Florals', pick('florals').mid, 52, 62], ['Linens and tableware', pick('rentals').mid, 34, 86]];
    var lines = [['Venue', 'venue'], ['Catering', 'catering'], ['Florals', 'florals'], ['Candles and decor', 'decor'], ['Cake', 'cake'], ['Photographer', 'photographer']].map(function (l) { return '<div class="line"><span>' + l[0] + '</span><span class="num">' + money(pick(l[1]).mid) + '</span></div>'; }).join('') +
      (function () { var shown = ['venue', 'catering', 'florals', 'decor', 'cake', 'photographer'].reduce(function (t, id) { return t + pick(id).mid; }, 0); return '<div class="line"><span>Bar, rentals, music, attire and more, plus a 10% cushion</span><span class="num">' + money(demo.total - shown) + '</span></div>'; })();
    frame(
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
      '<section id="inspo" class="stack section"><h2>What are you celebrating?</h2><p class="muted">No idea yet? Pick your occasion and tap a photo you love. Your whole plan is built around it.</p>' + inspoGallery('', 8) + '</section>' +
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
    bindInspo(8);
    $('#allSamples').addEventListener('click', function () { var m = $('#moreSamples'), open = m.hidden; m.hidden = !open; this.setAttribute('aria-expanded', open); this.textContent = open ? 'Show fewer' : 'See all ' + SAMPLES.length + ' sample plans'; });
  }

  function pricing() {
    frame('<div class="stack-lg"><div class="stack"><h2>Pricing</h2><p class="muted">Planning is free: build your concepts, budget and plan at no cost. You pay once per event, only if you want to keep your plan. No subscription.</p></div>' +
      '<section class="stack"><h3>Event Pass</h3><p class="muted">Based on how many people you invite, including plus-ones. This is what Event Couture costs, separate from your event budget.</p>' +
      '<div class="panel price-grid">' + D.PASSES.map(function (ps) { return '<div><span class="muted small">Up to ' + ps.max.toLocaleString('en-US') + ' guests</span><b class="num">$' + ps.price.toFixed(2) + '</b></div>'; }).join('') + '<div><span class="muted small">Each extra 5,000</span><b class="num">+$150</b></div></div>' +
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
        return '<a class="sample" href="#/e/' + ev.id + (ev.concept ? '' : '/concepts') + '">' + (thumb(eventPhoto(ev)) || '<div class="thumb noimg" aria-hidden="true" style="background:linear-gradient(120deg,' + pal.slice(0, 4).join(',') + ')"></div>') + '<div class="in"><h3>' + esc(ev.name) + '</h3>' + dots(pal) + '<span class="muted small">' + esc(fmtDate(ev.date)) + ' \u00b7 ' + esc(ev.city.split(',')[0]) + ' \u00b7 ' + plural(ev.guests, 'guest') + '</span><span class="small">' + (ev.concept ? esc(ev.concept.styleName) : 'Choose a concept') + ' ' + (isKept(ev) ? '<span class="badge ok">Kept</span>' : '<span class="badge">Free preview</span>') + '</span></div></a>'; }).join('') + '</div>'
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
  var VIBE_NOUN = { Romantic: 'Romance', Glam: 'Glamour', Garden: 'A Garden Party', Modern: 'Modern Luxe', Classic: 'Classic Elegance', Boho: 'Boho Dreams', Rustic: 'Rustic Charm', Tropical: 'A Tropical Escape', Coastal: 'A Coastal Breeze', Playful: 'Sweet Moments', Minimal: 'Quiet Luxury', Vintage: 'Vintage Glamour', Disco: 'Disco Nights', Moody: 'Moody Elegance' };
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
    var style = E.matchStyles(colors, text, [])[0].style;
    var word = TYPE_WORD[type] || 'Celebration';
    /* Names use real colors: the ones picked, else the ones typed, else the look's main color. */
    var typed = ['Blush', 'Pink', 'Ivory', 'Cream', 'Gold', 'Champagne', 'Sage', 'Emerald', 'Black', 'White', 'Navy', 'Silver', 'Lavender', 'Plum', 'Purple', 'Burgundy', 'Red', 'Terracotta', 'Blue', 'Pastel'].filter(function (w) { return new RegExp('\\b' + w + '\\b', 'i').test(text); }).sort(function (a, b) { return text.toLowerCase().indexOf(a.toLowerCase()) - text.toLowerCase().indexOf(b.toLowerCase()); });
    var STYLE_COLOR = { 'champagne-garden': 'Sage', 'modern-noir': 'Black', 'blush-romance': 'Blush', 'boho-sunset': 'Terracotta', 'coastal-linen': 'Blue', 'tropical-glam': 'Tropical', 'old-hollywood': 'Red', 'pastel-whimsy': 'Pastel', 'ivory-ballroom': 'Ivory', 'minimal-white': 'White', 'disco-glam': 'Silver', 'moody-floral': 'Burgundy', 'rustic-elegance': 'Rustic', 'royal-purple': 'Plum', 'midnight-celestial': 'Midnight' };
    picked = picked.concat(typed.filter(function (w) { return picked.indexOf(w) < 0; }));
    var c1 = picked[0] || STYLE_COLOR[style.id] || 'Gold', c2 = picked[1];
    var hr = +String(d.timeTouched && d.time ? d.time : defaultTime(type, d.kids)).split(':')[0];
    var partOfDay = (d.kids && /birthday/.test(type)) ? 'A Party' : hr < 12 ? 'A Morning' : hr < 16 ? 'An Afternoon' : 'An Evening';
    var vibe = vibes.filter(function (v) { return VIBE_NOUN[v]; })[0];
    var art = function (w) { return /^[AEIOU]/i.test(w) ? 'An ' : 'A '; };
    var out = [style.name + ' ' + word,
      c2 ? art(c1) + c1 + ' and ' + c2 + ' ' + (type === 'wedding' ? 'Affair' : word) : art(c1) + c1 + ' ' + word,
      (vibe ? VIBE_NOUN[vibe] : partOfDay) + ' in ' + c1,
      'The ' + c1 + ' ' + (type === 'wedding' || type === 'gala' || / Party$/.test(word) ? 'Soir\u00e9e' : word + ' Soir\u00e9e')];
    var ip = E.inspoOf(d); if (ip) out.unshift(ip.name);
    return out.filter(function (n, i) { return out.indexOf(n) === i; });
  }
  var VIBE_COLORS = [['Blush', '#F2C9CF'], ['Ivory', '#F7F1E3'], ['Gold', '#C9A86A'], ['Champagne', '#E8D9BC'], ['White', '#FFFFFF'], ['Black', '#151515'], ['Sage', '#A9B89A'], ['Burgundy', '#7B2D3B'], ['Lavender', '#C9B3DD'], ['Dusty blue', '#A9C7D3'], ['Terracotta', '#C47C4E'], ['Silver', '#C0C0C8'], ['Pastels', '#F9E1EC'], ['Bright colors', '#F2B544']];
  var VIBES = ['Romantic', 'Glam', 'Garden', 'Modern', 'Classic', 'Boho', 'Rustic', 'Tropical', 'Coastal', 'Playful', 'Minimal', 'Vintage', 'Disco', 'Moody'];
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
  function guessType(text) {
    text = (text || '').toLowerCase();
    var rules = [['wedding', /wedding|reception|bride and groom/], ['bachelorette', /bachelorette|bach party/], ['bridal-shower', /bridal shower/], ['baby-shower', /baby shower|sprinkle/],
      ['gender-reveal', /gender reveal/], ['quince', /quince/], ['sweet16', /sweet 16|sweet sixteen|16th birthday/], ['corporate', /corporate|company|office|client|team (event|dinner|party)|product launch|conference/], ['graduation', /graduat/], ['engagement', /engagement/], ['anniversary', /anniversary/],
      ['retirement', /retire/], ['kids-birthday', /\b([1-9]|1[0-2])(st|nd|rd|th)\b.*birthday|kids'? (party|birthday)|birthday for my (son|daughter)|(son|daughter)'s birthday/], ['milestone', /\b(30|40|50|60|70)th\b|milestone/], ['birthday', /birthday|bday/], ['gala', /gala|fundraiser/], ['christmas', /christmas|xmas/], ['holiday', /holiday|new year/],
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
  function wizard(step, id) {
    var done = id && events()[id]; if (done) { location.replace('#/e/' + id + (done.concept ? '' : '/concepts')); return; }   /* Back from the concepts page returns to the plan, not a blank form */
    if (!id || (!drafts()[id] && !(pendingDraft && pendingDraft.id === id))) { pendingDraft = newDraft(); location.replace('#/new/1/' + pendingDraft.id); return; }
    draft = drafts()[id] || pendingDraft;   /* a new draft is saved only once the host adds something or continues */
    var W = '#/new/';
    function persist() { draft.step = Math.max(draft.step || 1, step); return saveDraft(draft); }
    function laterBtn() { return '<button type="button" class="link" id="later">Save and finish later</button>'; }
    var prog = '<div class="progress" aria-label="Step ' + step + ' of 3">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('') + '</div>';
    if (step === 1) {
      var ip = E.inspoOf(draft);
      frame('<div class="wizard stack-lg">' + prog + (ip ? '<div class="stack"><h2>Your inspiration</h2><p class="muted">Your plan starts from this photo. Add your own photos or words below for anything you want different.</p></div>' +
        '<div class="panel inspo-chosen">' + thumb({ src: INSPO_IMG + 'sm/' + ip.id + '.jpg', alt: ip.alt, ai: true }) + '<div class="stack"><b>' + esc(ip.name) + '</b><span class="muted small">' + esc(ip.mood) + '</span><div class="row"><a class="btn ghost small" href="#/inspiration/' + esc(draft.type || 'all') + '/' + draft.id + '">Choose a different photo</a><button type="button" class="link small" id="noInspo">Remove</button></div></div></div>'
        : '<div class="stack"><h2>Share your inspiration</h2><p class="muted">Add as many photos as you like: Pinterest saves, Instagram or TikTok screenshots, or your own pictures. Then tap the parts you love in each one.</p></div>') +
        '<label class="drop" id="drop"><input type="file" id="files" accept="image/*" multiple class="sr"><b>Add inspiration photos</b><span class="muted small">Tap to choose, or drop photos here</span></label>' +
        '<div class="photos" id="photos"></div>' +
        '<div class="field"><span>Links to posts or boards (optional)</span><textarea class="input" id="links" placeholder="Paste Pinterest, Instagram or TikTok links, one per line">' + esc(draft.inspiration.links.join('\n')) + '</textarea><span class="muted small">If a link can’t be opened, add a screenshot of it as a photo.</span></div>' +
        '<div class="field"><span>' + (ip ? 'Anything you\u2019d change or add? (optional)' : 'Describe your dream event (optional)') + '</span><textarea class="input" id="text" placeholder="' + (ip ? 'Example: same look in navy and silver, 40 guests, at home, under $5,000' : 'Example: pink and gold girls’ brunch for 10, chic and girly, under $2,000') + '">' + esc(draft.inspiration.text) + '</textarea>' +
        '<div class="row"><button type="button" class="btn ghost small" id="speak" aria-pressed="false">' + MIC + '<span>Speak it</span></button><span class="muted small" id="speakHint">Talk about your colors, vibe, guests and budget.</span></div></div>' +
        (ip ? '' : '<div class="panel row inspo-nudge"><span class="grow"><b>No inspiration yet?</b> <span class="muted small">Browse AI-generated photos by occasion and start from one you love.</span></span><a class="btn small" id="browseInspo" href="#/inspiration/' + esc(draft.type || 'all') + '/' + draft.id + '">Browse inspiration</a></div>') + '<div class="stack"><h3>' + (ip ? 'Change the colors or vibe (optional)' : 'Or pick the colors and vibe you like') + '</h3><span class="muted small">Colors</span><div class="chips" id="vcolors">' + VIBE_COLORS.map(function (c) { return '<button type="button" class="chip vchip" aria-pressed="' + ((draft.inspiration.vibes || []).indexOf(c[0]) >= 0) + '" data-vibe="' + esc(c[0]) + '"><i style="background:' + c[1] + '"></i>' + esc(c[0]) + '</button>'; }).join('') + '</div>' +
        '<span class="muted small">Vibe</span><div class="chips" id="vvibes">' + VIBES.map(function (v) { return '<button type="button" class="chip" aria-pressed="' + ((draft.inspiration.vibes || []).indexOf(v) >= 0) + '" data-vibe="' + esc(v) + '">' + esc(v) + '</button>'; }).join('') + '</div></div>' +
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
      if ($('#browseInspo')) $('#browseInspo').addEventListener('click', function () { var t = $('#text').value.trim(); if (t || draft.inspiration.photos.length) { draft.inspiration.text = t; persist(); } });
      if ($('#noInspo')) $('#noInspo').addEventListener('click', function () { draft.inspiration.text = $('#text').value.trim(); delete draft.inspiration.inspo; persist(); wizard(1, draft.id); });
      $('#next').addEventListener('click', function () {
        draft.inspiration.links = $('#links').value.split(/\s+/).filter(function (s) { return /^https?:\/\//.test(s); });
        draft.inspiration.text = $('#text').value.trim();
        if (!E.inspoOf(draft) && !draft.inspiration.photos.length && !draft.inspiration.text && !draft.inspiration.links.length && !(draft.inspiration.vibes || []).length) return toast('Add a photo, a description, or pick a few colors and a vibe');
        if (!draft.typeChosen) { var gt = guessType(draft.inspiration.text); if (gt) { draft.type = gt; var tt = E.typeOf(gt); if (!draft.guestsTouched) { draft.guests = tt.defaultGuests; draft.expected = tt.defaultGuests; } draft.hours = tt.hours; } }
        persist(); location.hash = W + '2/' + draft.id;
      });
      $('#later').addEventListener('click', function () { draft.inspiration.links = $('#links').value.split(/\s+/).filter(function (x) { return /^https?:\/\//.test(x); }); draft.inspiration.text = $('#text').value.trim(); persist(); location.hash = '#/events'; setTimeout(function () { toast('Saved. Pick it up anytime from My events.'); }, 80); });
      return;
    }
    if (step === 2) {
      if (!draft.kidsTouched && /\b([1-9]|1[0-2])(st|nd|rd|th)\b.*birthday|for my (son|daughter|kids?)\b|kids'? party|children/i.test((draft.inspiration && draft.inspiration.text) || '')) draft.kids = true;
      /* Must-haves the host already named in her description are pre-selected (she can untick them). */
      if (!draft.mustsGuessed && !(draft.priorities || []).length) {
        var said2 = ((draft.inspiration && draft.inspiration.text) || '').toLowerCase();
        draft.priorities = [['liveMusic', /live (band|music)|\bband\b|orchestra|string quartet|mariachi|jazz trio/], ['photoBooth', /photo ?booth/], ['dj', /\bdj\b|dance floor|dancing/], ['videographer', /video/], ['florals', /flowers|roses|florals|peonies|floral/], ['bar', /open bar/], ['hairMakeup', /hair and makeup|glam squad|makeup artist/], ['photographer', /photographer|great photos/], ['lighting', /lighting|uplighting/]].filter(function (r) { return r[1].test(said2); }).map(function (r) { return r[0]; });
        draft.mustsGuessed = true;
      }
      frame('<div class="wizard stack-lg">' + prog + '<div class="stack"><h2>The details</h2><p class="muted">These set your prices, quantities and timeline. You can change them later.</p></div>' +
        '<div class="panel stack"><label class="field"><span>Name your event</span><input class="input" id="name" value="' + esc(draft.name) + '" placeholder="Name it, or tap an idea below" maxlength="80"></label><span class="muted small">Ideas from your inspiration</span><div class="chips" id="names"></div><span class="muted small">Your event saves under this name in My events, so you can come back and finish anytime.</span></div>' +
        '<div class="grid2">' +
        '<label class="field"><span>Event type</span><select class="input" id="type">' + (draft.type ? '' : '<option value="" selected disabled>Choose your event type</option>') + D.EVENT_TYPES.map(function (t) { return '<option value="' + t.id + '"' + (t.id === draft.type ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '</select></label>' +
        '<label class="field"><span>City</span><select class="input" id="city">' + (function () {
          if (!draft.city) { var said = ((draft.inspiration && draft.inspiration.text) || '').toLowerCase(); var hit = D.CITIES.find(function (c) { return c.name !== 'Other US city' && said.indexOf(c.name.split(',')[0].toLowerCase()) >= 0; }); if (hit) draft.city = hit.name; }
          var known = !draft.city || D.CITIES.some(function (c) { return c.name === draft.city; }); return (draft.city ? '' : '<option value="" selected disabled>Choose your city</option>') + D.CITIES.map(function (c) { return '<option' + (c.name === draft.city || (!known && c.name === 'Other US city') ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join(''); })() + '</select></label>' +
        '<label class="field" id="cityOtherWrap"' + (!draft.city || D.CITIES.some(function (c) { return c.name === draft.city && c.name !== 'Other US city'; }) ? ' hidden' : '') + '><span>Your city and state</span><input class="input" id="cityOther" placeholder="e.g. Boise, ID" value="' + esc(!draft.city || D.CITIES.some(function (c) { return c.name === draft.city; }) ? '' : draft.city) + '"></label>' +
        '<label class="field"><span>Date</span><input class="input" type="date" id="date" value="' + esc(draft.date) + '"></label>' +
        '<label class="field"><span>Start time</span><input class="input" type="time" id="time" value="' + esc(draft.timeTouched ? draft.time : (draft.time && draft.time !== '18:00' ? draft.time : defaultTime(draft.type, draft.kids))) + '"></label>' +
        '<label class="field"><span>How many hours</span><input class="input" type="number" min="1" max="16" id="hours" value="' + draft.hours + '"></label>' +
        '<label class="field"><span>How many people are you inviting? (include plus-ones and yourself)</span><input class="input num" type="number" min="1" max="100000" id="guests" value="' + draft.guests + '"></label>' +
        '<label class="field"><span>Expected to attend</span><input class="input num" type="number" min="1" id="expected" value="' + draft.expected + '"></label>' +
        '<label class="field"><span>Maximum budget for the event (USD, optional)</span><input class="input num" type="number" min="0" step="50" id="budget" value="' + (draft.budget || '') + '" placeholder="Leave blank to see typical prices"></label>' +
        '<label class="field"><span>Your starting point for drive times (optional)</span><input class="input" id="start" value="' + esc(draft.start) + '" placeholder="Home, hotel or ceremony address"></label>' +
        '</div><div class="stack"><h3 id="whereLbl">Where is it? <span class="muted small" style="font-family:var(--body)">(required)</span></h3><span class="muted small">Restaurant: everyone orders from the menu, so we price what the bill will look like, with no venue or catering fees. Event venue: you rent the space and pay food per person, so we price the venue, catering and rentals. Not sure yet? Choose it and your plan compares every option for you.</span><div class="chips" id="setting" role="group" aria-labelledby="whereLbl">' + D.SETTINGS.map(function (st) { return '<button type="button" class="chip" data-v="' + st.id + '" aria-pressed="' + (draft.setting === st.id && !draft.settingOpen) + '">' + esc(st.name) + '</button>'; }).join('') + '<button type="button" class="chip" data-v="unsure" aria-pressed="' + !!draft.settingOpen + '">Not sure yet</button>' + '</div>' +
        '<label class="row small"><input type="checkbox" id="kids"' + (draft.kids ? ' checked' : '') + '> Children will attend</label></div>' +
        '<div class="grid2"><div class="stack"><h3 id="alcLbl">Drinks</h3><div class="chips" id="alcohol" role="group" aria-labelledby="alcLbl">' + [['none', 'No alcohol'], ['wine', 'Beer and wine'], ['full', 'Full bar or cocktails']].map(function (o) { return '<button type="button" class="chip" data-v="' + o[0] + '" aria-pressed="' + ((draft.alcohol || defaultAlcohol(draft.type, draft.inspiration && draft.inspiration.text)) === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>' +
        '<div class="stack"><h3 id="payLbl">Who\u2019s paying?</h3><div class="chips" id="payer" role="group" aria-labelledby="payLbl">' + [['host', 'I\u2019m hosting and paying'], ['own', 'Everyone pays their own'], ['shared', 'We\u2019re splitting the cost']].map(function (o) { return '<button type="button" class="chip" data-v="' + o[0] + '" aria-pressed="' + ((draft.payer || 'host') === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div></div>' +
        '<div class="stack"><h3>Your must-haves</h3><span class="muted small">These are protected first when the plan is fitted to your budget.' + ((draft.priorities || []).length && draft.mustsGuessed && !draft.mustsTouched ? ' We picked the highlighted ones from your description; tap to change.' : '') + '</span><div class="chips" id="musts">' + MUSTS.map(function (m) { return '<button type="button" class="chip" data-must="' + m[0] + '" aria-pressed="' + ((draft.priorities || []).indexOf(m[0]) >= 0) + '">' + esc(m[1]) + '</button>'; }).join('') + '</div></div>' +
        '<div class="wiz-act"><button class="btn gold" id="next">Review details</button><a class="btn ghost" href="' + W + '1/' + draft.id + '">Back</a>' + laterBtn() + '</div></div>');
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
      $('#type').addEventListener('change', function () { draft.typeChosen = true; var t = E.typeOf(this.value); if (this.value === 'kids-birthday') $('#kids').checked = true; $('#hours').value = t.hours; if (!draft.guestsTouched) { $('#guests').value = t.defaultGuests; $('#expected').value = t.defaultGuests; }
        if (!draft.timeTouched) $('#time').value = defaultTime(this.value, $('#kids').checked);
        if (!draft.alcoholTouched) { var da = defaultAlcohol(this.value, draft.inspiration && draft.inspiration.text); $$('#alcohol button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.v === da); }); } });
      $('#time').addEventListener('input', function () { draft.timeTouched = true; });
      $('#hours').addEventListener('input', function () { draft.hoursTouched = true; });
      $('#kids').addEventListener('change', function () { draft.kidsTouched = true; if (!draft.timeTouched) $('#time').value = defaultTime($('#type').value, this.checked); });
      /* Everything typed here is saved as you go, so a refresh never loses it. */
      var autoT; ['input', 'change', 'click'].forEach(function (evt) { $('#main').addEventListener(evt, function () { clearTimeout(autoT); autoT = setTimeout(saveNow, 150); }); });
      function saveNow() { if (!$('#guests') || !(+$('#guests').value >= 1)) return; var typedName = $('#name').value.trim(); collect2(); if (!typedName) draft.name = ''; persist(); }
      window.addEventListener('pagehide', saveNow, { once: true }); window.addEventListener('beforeunload', saveNow, { once: true });
      $('#city').addEventListener('change', function () { $('#cityOtherWrap').hidden = this.value !== 'Other US city'; if (this.value === 'Other US city') $('#cityOther').focus(); });
      $('#alcohol').addEventListener('click', function () { draft.alcoholTouched = true; });
      ['alcohol', 'payer'].forEach(function (g) { $('#' + g).addEventListener('click', function (e) { var bt = e.target.closest('button'); if (!bt) return; $$('#' + g + ' button').forEach(function (x) { x.setAttribute('aria-pressed', x === bt); }); }); });
      $('#musts').addEventListener('click', function (e) { var b = e.target.closest('[data-must]'); if (b) draft.mustsTouched = true; if (b) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
      $('#setting').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; draft.settingChosen = true; $$('#setting button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); if ((b.dataset.v === 'restaurant' || b.dataset.v === 'privateRoom') && +$('#hours').value > 3 && !draft.hoursTouched) $('#hours').value = b.dataset.v === 'restaurant' ? 2 : 3; });
      function collect2() {
        var g = Math.round(+$('#guests').value), ex = Math.round(+$('#expected').value);
        draft.type = $('#type').value || ''; draft.nameAuto = !$('#name').value.trim() || draft.nameAuto && $('#name').value.trim() === draft.name; draft.name = $('#name').value.trim() || (suggestNames(draft, draft.type)[0]) || E.typeOf(draft.type).name; draft.city = !$('#city').value ? '' : $('#city').value === 'Other US city' ? ($('#cityOther').value.trim() || 'Other US city') : $('#city').value; draft.date = $('#date').value; draft.time = $('#time').value || defaultTime(draft.type);
        draft.hours = Math.max(1, +$('#hours').value || 3); draft.guests = g; draft.expected = ex || g; draft.budget = Math.max(0, +$('#budget').value || 0); draft.start = $('#start').value.trim();
        var sb = $('#setting [aria-pressed="true"]'); draft.settingOpen = !!(sb && sb.dataset.v === 'unsure'); draft.setting = sb ? (draft.settingOpen ? 'indoor' : sb.dataset.v) : null; draft.kids = $('#kids').checked || draft.type === 'kids-birthday'; draft.priorities = $$('#musts [aria-pressed="true"]').map(function (b) { return b.dataset.must; }); draft.tier = draft.budget ? 'F' : 'S';
        var ab = $('#alcohol [aria-pressed="true"]'); draft.alcohol = ab ? ab.dataset.v : defaultAlcohol(draft.type, draft.inspiration && draft.inspiration.text);
        var pb = $('#payer [aria-pressed="true"]'); draft.payer = pb ? pb.dataset.v : 'host';
      }
      $('#later').addEventListener('click', function () { collect2(); if (!$('#name').value.trim()) draft.name = ''; persist(); var nm = draft.name || 'your event'; location.hash = '#/events'; setTimeout(function () { toast('Saved ' + nm + '. Pick it up anytime from My events.'); }, 80); });
      $('#next').addEventListener('click', function () {
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
        if (ex > g) return toast('Expected to attend can’t be more than the number of people you’re inviting');
        if (!$('#setting [aria-pressed="true"]')) { $('#whereLbl').scrollIntoView({ block: 'center' }); return toast('Choose where it is: a restaurant, a venue, outdoors or at home'); }
        collect2(); persist(); location.hash = W + '3/' + draft.id;
      });
      return;
    }
    // step 3: confirm the details before anything is generated. Planning is free; payment comes at the end, to keep and share.
    var setName = (D.SETTINGS.find(function (x) { return x.id === draft.setting; }) || {}).name || 'Not chosen';
    var rowsHtml = [
      ['Event', esc(E.typeOf(draft.type).name) + (draft.name && draft.name !== E.typeOf(draft.type).name ? ' · ' + esc(draft.name) : '')],
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
      '<p class="muted small">Planning is free. You only pay if you want to keep your plan and share it with guests.</p>' +
      '<div class="wiz-act"><button class="btn gold" id="go">Create my concepts</button><a class="btn ghost" href="' + W + '2/' + draft.id + '">Edit details</a>' + laterBtn() + '</div></div>');
    $('#later').addEventListener('click', function () { persist(); location.hash = '#/events'; setTimeout(function () { toast('Saved. Pick it up anytime from My events.'); }, 80); });
    if (AI.live) AI.concepts(draft, []);   /* start the AI now; it's usually ready by the time the host taps Create */
    $('#go').addEventListener('click', function () {
      var btn = this; if (btn.disabled) return; btn.disabled = true; btn.textContent = 'Starting…';   // no double submits
      var ev = draft; ev.paid = null; ev.created = ev.created || new Date().toISOString().slice(0, 10);
      if (!saveEvent(ev)) { btn.disabled = false; btn.textContent = 'Create my concepts'; return; }
      removeDraft(ev.id); draft = null;
      location.hash = '#/e/' + ev.id + '/concepts';
    });
  }

  /* ---------- concepts ---------- */
  function conceptsView(id) {
    var ev = getEvent(id); if (!ev) return notFound();
    frame('<div class="stack-lg"><div class="stack"><h2>Three looks for ' + (ev.nameAuto ? 'your ' + esc(E.typeOf(ev.type).name.toLowerCase().replace(/christmas/, 'Christmas')) : esc(ev.name)) + '</h2><p class="muted">Each look has its own colors, atmosphere and decor. Pick one to see what it costs, venues in your city, vendors, menu and timeline.</p><p class="small muted">' + (function () { var ins = ev.inspiration || {}, src = []; if (ins.inspo) src.push('the inspiration photo you chose'); if ((ins.photos || []).length) src.push('your photos'); if (ins.text) src.push('your description'); if ((ins.vibes || []).length) src.push('the colors and vibes you picked'); return src.length ? 'Built from ' + (src.length > 1 ? src.slice(0, -1).join(', ') + ' and ' + src[src.length - 1] : src[0]) + '.' : 'Built from your event details.'; })() + '</p></div><div id="cs" class="concepts"><div class="loading-concepts" role="status"><span class="spin" aria-hidden="true"></span><span id="lmsg">Reading your inspiration…</span></div></div>' +
      '<p class="small muted" id="srcNote" hidden></p><div class="row"><button class="btn ghost" id="more">Show three different concepts</button><span class="muted small">You can see three new looks once, free.</span></div></div>');
    var msgs = ['Reading your inspiration…', 'Choosing colors and decor…', 'Matching the look to your event…', 'Almost ready…'], mi = 0;
    var tick = setInterval(function () { var m = $('#lmsg'); if (!m) return clearInterval(tick); mi = Math.min(msgs.length - 1, mi + 1); m.textContent = msgs[mi]; }, 2500);
    function render(list) {
      clearInterval(tick);
      $('#cs').innerHTML = list.map(function (c, i) {
        var sel = ev.concept && ev.concept.id === c.id;
        return '<article class="concept' + (sel ? ' selected' : '') + '">' + (c.img ? thumb({ src: c.img.replace(INSPO_IMG, INSPO_IMG + 'sm/'), alt: 'The inspiration photo you chose', ai: true }) : '') + '<div class="in"><span class="concept-num">Concept ' + (i + 1) + ' of ' + list.length + '</span><span class="badge est">' + esc(sel ? 'Your current choice' : c.fit) + '</span><h3>' + esc(c.name) + '</h3>' + dots(c.palette, c.styleName + ' colors') + '<p class="muted">' + esc(moodFor(c, ev)) + '</p><ul>' + outlineFor(c, ev).map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul><button class="btn ' + (i === 0 ? 'gold' : '') + ' block" data-i="' + i + '" aria-label="Choose ' + esc(c.name) + '">Choose this concept</button></div></article>';
      }).join('');
    }
    function load(skip) {
      AI.concepts(ev, skip).then(function (list) {
        ev.concepts = list; saveEvent(ev); render(list);
        var n = $('#srcNote'); if (n) { n.hidden = !(AI.live && AI.source === 'library'); n.textContent = 'Our AI is busy right now, so these three come from the Event Couture style library. Nothing extra was used. Try again later for fresh AI ideas.'; }
      });
    }
    if (ev.concepts && ev.concepts.length) render(ev.concepts); else load([]);
    $('#cs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]'); if (!b) return;
      ev.concept = ev.concepts[+b.dataset.i]; if (ev.nameAuto) ev.name = ev.concept.name; saveEvent(ev); location.hash = '#/e/' + ev.id;
    });
    $('#more').addEventListener('click', function () {
      ev.seen = (ev.seen || []).concat(ev.concepts.map(function (c) { return c.id; }));
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
  function preview(ev) { return !isKept(ev); }
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
  function usd2(n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function keepSheet(ev, why, onDone) {
    var pass = E.passFor(ev.guests);
    sheet('<h3>' + esc(why || 'Keep your plan') + '</h3><p class="muted">One payment for ' + esc(ev.name) + ', ' + esc(pass.label.toLowerCase()) + '. No subscription. Guests never pay to view, RSVP or vote.</p>' +
      '<div class="price-big num">$' + pass.price.toFixed(2) + '</div>' +
      '<ul class="incl"><li><span>Your full plan unlocked: every budget line, all venues and vendors, the menu, shopping and playlist</span></li><li><span>Saved with every edit until <b>' + esc(accessUntil(ev)) + '</b></span></li><li><span>Guest list, RSVPs' + (ev.setting === 'restaurant' ? '' : ', seating') + ', voting' + (hasRegistry(ev) ? ' and registry' : '') + (canSplit(ev) ? ' and cost splitting' : '') + '</span></li><li><span>Checklist with due dates and your day-of schedule</span></li></ul>' +
      (CFG.preview ? '<p class="muted small">Right now your plan is saved on this device. Sending your invitation to guests on their own phones turns on when accounts launch.</p>' : '') +
      '<p class="muted small">Guest list grows past ' + pass.max.toLocaleString('en-US') + '? You pay only the difference.</p>' +
      (CFG.preview ? '<div class="note">Preview version: no payment is taken.</div>' : '') +
      '<button class="btn gold block" id="keepPay">' + (CFG.preview ? 'Keep my plan' : 'Pay ' + usd2(pass.price) + ' and keep my plan') + '</button><button class="btn ghost block" data-close>Not now</button>', function (el, close) {
      $('#keepPay', el).addEventListener('click', function () {
        ev.paid = { price: pass.price, max: pass.max, at: new Date().toISOString() };
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
      (CFG.preview ? '<div class="note">Preview version: no payment is taken.</div>' : '') +
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
    ['Overview', [['overview', 'Summary'], ['style', 'Style and music'], ['extras', 'Your pass']]],
    ['Budget & bookings', [['budget', 'Budget'], ['places', 'Venues'], ['vendors', 'Vendors'], ['food', 'Food and drink']]],
    ['Guests & invitations', [['guests', 'Guests'], ['invite', 'Invite and registry'], ['votes', 'Voting'], ['after', 'Photos and thank-yous']]],
    ['Tasks & timeline', [['timeline', 'Checklist and schedule']]]
  ];
  function tierName(id) { if (id === 'F') return 'Your budget plan'; var t = D.TIERS.find(function (x) { return x.id === id; }); return t ? t.name : id; }
  function groupOf(tab) { for (var i = 0; i < TAB_GROUPS.length; i++) if (TAB_GROUPS[i][1].some(function (t) { return t[0] === tab; })) return i; return 0; }
  function planView(ev, tab) {
    if (!ev.concept) { location.hash = '#/e/' + ev.id + '/concepts'; return; }
    var base = ev.sample ? '#/sample/' + ev.id.split('-')[1] : '#/e/' + ev.id;
    var save = function () { if (!ev.sample) saveEvent(ev); };
    var b = E.budget(ev, ev.tier);
    var hp = eventPhoto(ev);
    var head = '<div class="plan-head">' + (hp ? thumb(hp, 'banner') : '<div class="swatch" aria-hidden="true">' + ev.concept.palette.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div>') +
      '<div class="plan-row"><div style="min-width:0"><h2>' + esc(ev.name) + (ev.sample ? '' : ' <button class="link small" id="rename" style="font-family:var(--body)">Rename</button>') + '</h2><div class="meta">' + (ev.concept.styleName && ev.concept.styleName !== ev.name ? '<span>' + esc(ev.concept.styleName) + '</span>' : '') + '<span>' + (ev.sample ? esc(fmtDate(ev.date)) + (ev.time && ev.date ? ', ' + fmtTime(ev.time) : '') : '<button class="link small" id="when" aria-label="Date and time: ' + esc(ev.date ? fmtDate(ev.date) : 'not set') + '. Change">' + (ev.date ? esc(fmtDate(ev.date)) + (ev.time ? ', ' + fmtTime(ev.time) : '') : 'Add your date') + '</button>') + '</span><span>' + esc(ev.city) + '</span><span>' + plural(ev.guests, 'guest') + '</span><span>' + (ev.sample ? esc(settingName(ev)) : '<button class="link small" id="where" aria-label="Where it happens: ' + esc(settingName(ev)) + '. Change">' + esc(settingName(ev)) + '</button>') + '</span></div></div>' +
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
    var keepBar = isKept(ev) ? '' : '<div class="keep-bar"><span><b>' + (b.shortBy ? 'Keep this plan' : 'Love this plan?') + '</b> <span class="muted">Keep it to unlock every detail and plan with guests for ' + usd2(E.passFor(ev.guests).price) + ', one time.</span></span><button class="btn small" id="keepBtn">Keep my plan</button></div>';
    frame(head + keepBar + groupBar + '<div class="workspace">' + rail + '<section id="tab" class="stack-lg" style="min-width:0">' + body + '</section></div>');
    var kb = $('#keepBtn'); if (kb) kb.addEventListener('click', function () { keepSheet(ev, 'Keep your plan', function () { planView(ev, tab); }); });
    var cur = $('.rail [aria-current]'); if (cur && cur.scrollIntoView && window.innerWidth < 960) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
    var rn = $('#rename'); if (rn) rn.addEventListener('click', function () {
      sheet('<h3>Rename your event</h3><input class="input" id="nn" maxlength="80" value="' + esc(ev.name) + '"><div class="chips">' + suggestNames(ev, ev.type).map(function (n) { return '<button type="button" class="chip" data-name="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') + '</div><button class="btn gold block" id="ok">Save name</button><button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        el.addEventListener('click', function (e) { var b = e.target.closest('[data-name]'); if (b) $('#nn', el).value = b.dataset.name; });
        $('#ok', el).addEventListener('click', function () { var n = $('#nn', el).value.trim(); if (!n) return toast('Enter a name'); ev.name = n; ev.nameAuto = false; save(); close(); planView(ev, tab); });
      });
    });
    var wn = $('#when'); if (wn) wn.addEventListener('click', function () {
      sheet('<h3>When is it?</h3><p class="muted">Your checklist due dates and day-of schedule update to match.</p><label class="field"><span>Date</span><input class="input" type="date" id="wd" value="' + esc(ev.date || '') + '"></label><label class="field"><span>Start time</span><input class="input" type="time" id="wt" value="' + esc(ev.time || '18:00') + '"></label><label class="field"><span>How many hours</span><input class="input" type="number" min="1" max="16" id="wh" value="' + (ev.hours || 3) + '"></label><button class="btn gold block" id="ok">Save</button><button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        $('#ok', el).addEventListener('click', function () { var bf = snap(ev); bf.date = ev.date; bf.time = ev.time; ev.date = $('#wd', el).value; ev.time = $('#wt', el).value || ev.time; ev.hours = Math.min(16, Math.max(1, +$('#wh', el).value || ev.hours || 3)); delete ev.ros; save(); close(); planView(ev, tab); undoToast(ev, bf, 'Date and time updated', function () { planView(ev, tab); }); });
      });
    });
    var wh = $('#where'); if (wh) wh.addEventListener('click', function () {
      sheet('<h3>Where is it?</h3><p class="muted">Prices, venues, checklist and timeline update to match.</p><div class="stack">' + D.SETTINGS.map(function (st) { return '<button class="btn ' + (st.id === (ev.setting || 'indoor') ? 'gold' : 'ghost') + ' block" data-set="' + st.id + '">' + esc(st.name) + '</button>'; }).join('') + '</div><button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        el.addEventListener('click', function (e) { var bt = e.target.closest('[data-set]'); if (!bt) return; var bf = snap(ev); ev.setting = bt.dataset.set; ev.settingOpen = false; if (ev.setting === 'restaurant' && ev.hours > 3) ev.hours = 2; save(); close(); planView(ev, tab); undoToast(ev, bf, 'Updated for ' + settingName(ev).toLowerCase(), function () { planView(ev, tab); }); });
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
  function settingName(ev) { if (ev.settingOpen) return 'Not decided yet'; var st = D.SETTINGS.find(function (x) { return x.id === (ev.setting || 'indoor'); }); return st ? st.short : 'Event venue'; }

  function lockSample(ev) { if (ev.sample) { toast('This is a sample. Start your own plan to make changes.'); return true; } return false; }

  var TAB_VIEWS = {}, TAB_BIND = {};

  /* Overview: three budget versions, pros and cons, guardian, concierge */
  TAB_VIEWS.overview = function (ev, b) {
    var all = E.allBudgets(ev);
    if (ev.budget) all = [E.budgetFit(ev)];   /* with a budget, one clear answer; the three levels stay available below */
    var g = E.guardian(ev, b);
    return (ev.settingOpen ? whereCompare(ev) : '') + '<div class="stack"><h3>' + (ev.budget ? 'Your plan' : 'Your budget versions') + '</h3><p class="muted">' + (ev.budget ? (all[0] && all[0].shortBy && all[0].shortBy <= ev.budget * 0.1 ? 'Your plan comes to ' + money(all[0].total) + ', about ' + money(all[0].shortBy) + ' over your ' + money(ev.budget) + ' maximum. One of the swaps below brings it under.' : all[0] && all[0].shortBy ? (/^[aeiou]/i.test(E.typeOf(ev.type).name) ? 'An ' : 'A ') + esc(E.typeOf(ev.type).name.toLowerCase()) + ' for ' + plural(ev.guests, 'guest') + ' usually costs more than ' + money(ev.budget) + ' in ' + esc(ev.city.split(',')[0]) + '. This is the closest plan, kept as lean as the look allows. The budget guardian below shows ways to close the gap, like fewer guests or a different setting.' : 'Your plan, built to stay within your ' + money(ev.budget) + ' maximum' + ((ev.priorities || []).length ? ' while protecting your must-haves' : '') + '. Leftover money stays yours; it is not spent just because it is there.') + ' <button class="link small" id="cmpLevels">Compare spending levels</button>' : '') + (ev.budget ? '' : 'The same ' + esc(ev.concept.styleName) + ' look at three spending levels. Add a budget to get a plan made for it.') + '</p><div class="tiers">' +
      all.map(function (t) { var pc = E.prosCons(ev, t);
        return '<button class="tier" data-tier="' + t.tier.id + '" aria-pressed="' + (t.tier.id === ev.tier) + '"><span class="muted small">' + esc(t.tier.name) + '</span><span class="amt num">' + money(t.total) + '</span><span class="small muted">estimated</span><span class="small muted">' + (ev.setting === 'restaurant' ? 'About ' + money(t.perGuest) + ' a person all in: the menu bill, cake and table decor, with a 10% cushion' : 'Includes a 10% cushion for surprises') + '</span>' +
          '<div class="pc"><b>Pros</b><ul>' + pc.pros.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><b>Cons</b><ul>' + pc.cons.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' + (all.length > 1 ? '<span class="tier-pick">' + (t.tier.id === ev.tier ? '\u2713 Your plan uses this version' : 'Use this version') + '</span>' : '') + '</button>'; }).join('') + '</div></div>' +
      (g.over > 0 ? '<div class="panel stack"><div class="row" style="justify-content:space-between"><h3>Budget guardian</h3><span class="badge bad">' + money(g.over) + ' over</span></div><p class="muted">These swaps keep the look and bring the total down.</p><div class="list">' +
        g.swaps.map(function (s, i) { return '<div class="it"><span class="grow">' + esc(s.text) + '</span>' + (s.save ? '<span class="num muted">saves about ' + money(s.save) + '</span>' : '') + '<button class="btn small ghost" data-swap="' + i + '">Apply</button></div>'; }).join('') + '</div></div>' : '') +
      '<div class="panel stack"><h3>Ask the concierge</h3><p class="muted small">Type a change in plain words, like “make it 25 guests”, “budget $3,000”, “move it outdoors”, “skip the photographer” or “add a photo booth”.</p>' +
      '<div class="chat" id="chat"></div><form id="ask" class="row"><input class="input" aria-label="Change to your plan" id="q" style="flex:1 1 220px" placeholder="What would you like to change?" autocomplete="off"><button class="btn">Send</button></form></div>' +
      '<div class="panel stack"><h3>Your concept</h3>' + dots(ev.concept.palette, ev.concept.styleName + ' colors') + '<p>' + esc(moodFor(ev.concept, ev)) + '</p><ul class="incl">' + decorFor(ev.concept, ev).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' + dressBlock(ev, 'muted small') + (ev.sample ? '' : '<div><a class="btn ghost small" href="#/e/' + ev.id + '/concepts">Change concept</a></div>') + '</div>';
  };
  TAB_BIND.overview = function (ev, save, rerender) {
    bindWhere(ev, rerender);
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
      chat.insertAdjacentHTML('beforeend', '<div class="bubble me">' + esc(q) + '</div><div class="bubble ai">' + esc(reply.text) + '</div>');
      $('#q').value = '';
      if (reply.changed && !ev.sample) { save(); setTimeout(function () { rerender(); undoToast(ev, bf, 'Plan updated', rerender); }, 1100); }
    });
  };

  /* Concierge: simple edits run in ordinary software; bigger requests use AI. */
  function concierge(ev, q) {
    if (ev.sample) return { text: 'This is a sample plan. Start your own plan and I can change anything for you.' };
    var s = q.toLowerCase().replace(/,/g, ''); var m; var changes = []; var beforeTotal = E.budget(ev, ev.tier).total;
    if ((m = s.match(/(\d+)\s*(guests|people|person)/))) {
      var n = +m[1];
      if (n < 1) return { text: 'A plan needs at least 1 guest. How many people are you inviting?' };
      if (n > 20000) return { text: 'Event Couture plans events for up to 20,000 people. Try a smaller number.' };
      if (ev.paid && ev.paid.max && n > ev.paid.max) { var up = E.upgradeCost(ev.paid.price, n); return { text: plural(n, 'guest') + ' is more than your pass covers (' + ev.paid.max + '). Moving up costs ' + money(up.due) + '. Open Overview, Your pass to move up; your plan stays as it is.' }; }
      ev.guests = n; ev.expected = Math.min(ev.expected || n, n); changes.push('guest capacity is now ' + n);
    }
    if ((m = s.match(/(budget|under|max|spend)[^\d]*\$?\s*(\d+)(k)?/))) { ev.budget = +m[2] * (m[3] ? 1000 : 1); changes.push('budget is now ' + money(ev.budget)); }
    if (/my budget|fit (it|the plan)|plan to (my|the) budget/.test(s)) { ev.tier = 'F'; changes.push('fitted the plan to your budget'); }
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
    var city = D.CITIES.find(function (c) { return s.indexOf(c.name.toLowerCase().split(',')[0]) >= 0; });
    if (city && city.name !== ev.city) { ev.city = city.name; changes.push('city is now ' + city.name); }
    Object.keys(D.CATEGORIES).forEach(function (id) {
      var name = E.lc(D.CATEGORIES[id].name).split(' (')[0];
      var short = { photographer: 'photographer', videographer: 'videographer', dj: 'dj', photoBooth: 'photo booth', liveMusic: 'live music', florals: 'flowers', balloons: 'balloons', lighting: 'lighting', coordinator: 'coordinator', hairMakeup: 'makeup', favors: 'favors', transport: 'transportation', bar: 'bar', cake: 'cake', mc: 'mc', security: 'security', kids: 'kids', entertainment: 'entertainment' }[id] || name;
      var re = new RegExp('\\b(skip|remove|no|drop|without)\\b[^.]*\\b' + short.replace(/ /g, '\\s') + '\\b');
      var add = new RegExp('\\b(add|include|want|with)\\b[^.]*\\b' + short.replace(/ /g, '\\s') + '\\b');
      if (re.test(s)) { ev.exclude = (ev.exclude || []).concat(id); ev.include = (ev.include || []).filter(function (x) { return x !== id; }); changes.push('removed ' + E.lc(D.CATEGORIES[id].name)); }
      else if (add.test(s)) { ev.include = (ev.include || []).concat(id); ev.exclude = (ev.exclude || []).filter(function (x) { return x !== id; }); changes.push('added ' + E.lc(D.CATEGORIES[id].name)); }
    });
    if (changes.length) {
      var nb = E.budget(ev, ev.tier);
      var why = nb.tier.id === 'F' && nb.total > beforeTotal && ev.budget ? ' The rest of your plan no longer has to be trimmed as much, so it moves back up, still within your ' + money(ev.budget) + ' maximum.' : '';
      return { changed: true, text: 'Done: ' + changes.join('; ') + '. New estimated total: ' + money(nb.total) + '.' + why + ' Updating your plan…' };
    }
    if (AI.live) return { text: 'For a bigger redesign, open Change concept to see new looks. Your budget and details carry over.' };
    return { text: 'For bigger redesigns like that, choose “Show three different concepts” on the concept page. Smart redesigns by AI turn on when the app launches.' };
  }

  /* Bookings: save businesses to a shortlist, then record a quote or a booking. Status comes from what the host saved. */
  var FOUND = {};
  function venueCat(ev) { var b = E.budget(ev, ev.tier); var ids = b.items.map(function (i) { return i.id; }); return ['venue', 'privateDining', 'restaurantFood'].filter(function (x) { return ids.indexOf(x) >= 0; })[0] || 'venue'; }
  function savedFor(ev, cat) { return (ev.shortlist || []).filter(function (x) { return x.cat === cat; }); }
  function statusOf(ev, cat) {
    var ov = (ev.overrides || {})[cat];
    if (ov && ov.source === 'booking') return 'booked';
    if (ov && (ov.source === 'quote' || ov.source === 'vendor')) return 'quote';
    return savedFor(ev, cat).length ? 'short' : 'todo';
  }
  var STATUS_TXT = { booked: 'Booked', quote: 'Got a price', short: 'Shortlisted', todo: 'To book' };
  function statusBadge(ev, cat) { var st = statusOf(ev, cat); return '<span class="badge st-' + st + '">' + STATUS_TXT[st] + (st === 'short' ? ' (' + savedFor(ev, cat).length + ')' : '') + '</span>'; }
  function saveBtn(ev, p, cat) {
    FOUND[p.id] = { id: p.id, name: p.name, cat: cat, rating: p.rating || 0, reviews: p.reviews || 0, url: p.website || p.mapsUrl || '', maps: p.mapsUrl || '', address: p.address || '' };
    var on = (ev.shortlist || []).some(function (x) { return x.id === p.id; });
    return '<button class="btn small' + (on ? ' gold' : ' ghost') + '" data-short="' + esc(p.id) + '" aria-pressed="' + on + '">' + (on ? 'Saved' : 'Save') + '</button>';
  }
  function bindSave(ev, box) {
    box.addEventListener('click', function (e) {
      var bt = e.target.closest('[data-short]'); if (!bt) return;
      if (lockSample(ev)) return;
      var id = bt.dataset.short, list = ev.shortlist = ev.shortlist || [];
      var i = list.findIndex(function (x) { return x.id === id; });
      if (i >= 0) { list.splice(i, 1); bt.textContent = 'Save'; bt.className = 'btn small ghost'; bt.setAttribute('aria-pressed', 'false'); toast('Removed from your shortlist'); }
      else if (FOUND[id]) { list.push(FOUND[id]); bt.textContent = 'Saved'; bt.className = 'btn small gold'; bt.setAttribute('aria-pressed', 'true'); toast('Saved to your shortlist. See it under Budget.'); }
      saveEvent(ev);
    });
  }
  function bookingsPanel(ev, b) {
    var lines = b.items.filter(function (i) { return D.CATEGORIES[i.id]; });
    var booked = lines.filter(function (i) { return statusOf(ev, i.id) === 'booked'; });
    var quoted = lines.filter(function (i) { return statusOf(ev, i.id) === 'quote'; });
    var bookedAmt = booked.reduce(function (t, i) { return t + i.mid; }, 0);
    var sl = ev.shortlist || [];
    return '<div class="panel stack bookings"><div class="row" style="justify-content:space-between"><h3>Bookings</h3><span class="small muted num">' + booked.length + ' of ' + lines.length + ' booked</span></div>' +
      '<div class="meter"><i style="width:' + (lines.length ? Math.round(booked.length / lines.length * 100) : 0) + '%"></i></div>' +
      '<div class="bk-stats"><div><b class="num">' + money(bookedAmt) + '</b><span class="small muted">confirmed</span></div><div><b class="num">' + quoted.length + '</b><span class="small muted">with a price</span></div><div><b class="num">' + sl.length + '</b><span class="small muted">saved</span></div></div>' +
      (sl.length ? '<div class="list">' + sl.map(function (x, k) { var cat = D.CATEGORIES[x.cat]; return '<div class="it"><div class="grow"><b>' + esc(x.name) + '</b><div class="small muted">' + esc(cat ? cat.name : '') + (x.rating ? ' · ★ ' + x.rating : '') + '</div>' + (((ev.overrides || {})[x.cat] || {}).note === x.name ? '<div style="margin-top:4px">' + statusBadge(ev, x.cat) + '</div>' : '') + '</div><span class="acts">' + (x.url ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(x.url) + '">Contact</a>' : '') + '<button class="btn small" data-bookit="' + k + '">Add price</button><button class="link small" data-unsave="' + k + '">Remove</button></span></div>'; }).join('') + '</div>'
        : '<p class="muted small">Tap Save on any venue or vendor in Venues or Vendors to build your shortlist here. When you get a quote or book, add the price and your totals update.</p>') +
      '</div>';
  }

  /* Budget: every line labeled; add your own prices */
  TAB_VIEWS.budget = function (ev, b) {
    var groups = {}; cut(b.items, 3, ev).forEach(function (i) { (groups[i.group] = groups[i.group] || []).push(i); });
    var excluded = (ev.exclude || []).filter(function (id) { return D.CATEGORIES[id]; });
    return '<div class="stack"><div class="row" style="justify-content:space-between"><h3>' + (b.tier.id === 'F' ? 'Your budget plan' : esc(b.tier.name) + ' budget') + '</h3><div class="seg" id="tierseg">' + (ev.budget ? [{ id: 'F', name: 'My budget' }] : []).concat(D.TIERS).map(function (t) { return '<button data-tier="' + t.id + '" aria-pressed="' + (t.id === ev.tier) + '">' + t.name + '</button>'; }).join('') + '</div></div>' +
      (ev.payer === 'own' ? (function () { var own = b.items.filter(function (i) { return i.id === 'restaurantFood' || i.id === 'restaurantDrinks' || i.id === 'privateDining'; }).reduce(function (t, i) { return t + i.mid; }, 0); return own ? '<div class="note">Everyone pays their own meal and drinks: about <b>' + money(own / Math.max(1, ev.guests)) + ' a person</b>, with tax and tip. You cover the rest (cake, decor and the 10% cushion), about <b>' + money(Math.max(0, b.total - own)) + '</b>. The total below is still the full cost of the event.</div>' : ''; })() : '') +
      (ev.payer === 'shared' ? '<div class="note">Splitting the cost: about <b>' + money(b.total / Math.max(1, ev.guests)) + ' a person</b> if everyone shares equally. Track who has paid under Guests & invitations.</div>' : '') +
      '<p class="muted small"><b>All prices are estimates</b>, not quotes. Real prices come from each venue and vendor. Estimates are sized to ' + esc(ev.city) + ' and ' + plural(ev.guests, 'guest') + ', and include tax, service charges and tips where they apply. Add a real quote anytime and the totals update.</p>' +
      (ev.budget ? '<div class="stack" style="gap:6px"><div class="meter' + (b.total > ev.budget ? ' over' : '') + '"><i style="width:' + Math.min(100, b.total / ev.budget * 100) + '%"></i></div><span class="small muted num">' + money(b.total) + ' of your ' + money(ev.budget) + ' budget</span></div>' : '') +
      bookingsPanel(ev, b) +
      '<div class="panel"><div class="lines">' + Object.keys(groups).map(function (gname) {
        return '<div class="group-h">' + esc(gname) + '</div>' + groups[gname].map(function (i) {
          return '<div class="ln"><span>' + esc(i.name) + '</span><span class="amt">' + (i.lo === i.hi ? money(i.mid) : money(i.mid) + '<br><span class="small muted">' + money(i.lo) + ' to ' + money(i.hi) + '</span>') + '</span>' +
            '<div class="sub">' + statusBadge(ev, i.id) + '<span class="badge ' + (i.label === 'Planning estimate' ? 'est' : 'ok') + '">' + esc(i.label) + '</span><span class="small muted">' + esc([i.source].concat(i.extras.length ? [i.extras.join(', ')] : []).filter(Boolean).join('; ')) + '</span>' +
            '<button class="link small" data-price="' + i.id + '">Add quote or booking</button><button class="link small" data-drop="' + i.id + '">Remove</button></div></div>';
        }).join('');
      }).join('') + '</div></div>' + more(ev, b.items.length, Math.min(3, b.items.length), 'budget lines, with quantities and sources') +
      '<div class="panel sum"><div><span>Subtotal</span><span class="num">' + money(b.mid) + '</span></div><div><span>Cushion for surprises (10%)</span><span class="num">' + money(b.contingency) + '</span></div><div class="grand"><span>Estimated total</span><span class="num">' + money(b.total) + '</span></div><div class="small muted"><span>Range</span><span class="num">' + money(b.lo * 1.1) + ' to ' + money(b.hi * 1.1) + '</span></div></div>' +
      (excluded.length ? '<div class="stack"><b>Removed from this plan</b><div class="chips">' + excluded.map(function (id) { return '<button class="chip" data-restore="' + id + '">Add back ' + esc(E.lc(D.CATEGORIES[id].name)) + '</button>'; }).join('') + '</div></div>' : '') +
      '<p class="muted small">Estimates are a starting point. Always confirm prices, minimums and availability with each venue and vendor before you book.</p></div>';
  };
  TAB_BIND.budget = function (ev, save, rerender) {
    $$('#tierseg [data-tier]').forEach(function (btn) { btn.addEventListener('click', function () { var bf = snap(ev); ev.tier = btn.dataset.tier; save(); rerender(); if (bf.tier !== ev.tier) undoToast(ev, bf, 'Switched to ' + tierName(ev.tier), rerender); }); });
    $$('[data-drop]').forEach(function (btn) { btn.addEventListener('click', function () { if (lockSample(ev)) return; var bf = snap(ev); ev.exclude = (ev.exclude || []).concat(btn.dataset.drop); ev.include = (ev.include || []).filter(function (x) { return x !== btn.dataset.drop; }); save(); rerender(); undoToast(ev, bf, 'Removed ' + E.lc(D.CATEGORIES[btn.dataset.drop].name), rerender); }); });
    $$('[data-restore]').forEach(function (btn) { btn.addEventListener('click', function () { ev.exclude = ev.exclude.filter(function (x) { return x !== btn.dataset.restore; }); ev.include = (ev.include || []).concat(btn.dataset.restore); save(); rerender(); }); });
    var priceSheet = function (id, note) {
      if (lockSample(ev)) return; var cur = (ev.overrides || {})[id] || {}; if (note && !cur.note) cur = Object.assign({}, cur, { note: note, source: cur.source || 'quote' });
      sheet('<h3>Add a price for ' + esc(E.lc(D.CATEGORIES[id].name)) + '</h3><p class="muted small">Add a quote you received or a confirmed booking. Your budget uses this instead of the estimate.</p><label class="field"><span>Total amount (USD), including fees</span><input class="input num" type="number" min="0" id="amt" value="' + (cur.amount || '') + '"></label>' +
        '<label class="field"><span>What is this price?</span><select class="input" id="src"><option value="quote">Quote I received</option><option value="booking"' + (cur.source === 'booking' ? ' selected' : '') + '>Booked and confirmed</option><option value="vendor"' + (cur.source === 'vendor' ? ' selected' : '') + '>Price published by the vendor</option></select></label>' +
        '<label class="field"><span>Vendor or note (optional)</span><input class="input" id="nt" value="' + esc(cur.note || '') + '"></label><button class="btn gold block" id="ok">Save price</button>' + (cur.amount ? '<button class="btn ghost block" id="clr">Use the estimate again</button>' : '') + '<button class="btn ghost block" data-close>Cancel</button>', function (el, close) {
        $('#ok', el).addEventListener('click', function () { var a = +$('#amt', el).value; if (!(a > 0)) return toast('Enter an amount'); var bf = snap(ev); ev.overrides = ev.overrides || {}; ev.overrides[id] = { amount: a, source: $('#src', el).value, note: $('#nt', el).value.trim() }; save(); close(); rerender(); undoToast(ev, bf, 'Price saved. Totals updated.', rerender); });
        var c = $('#clr', el); if (c) c.addEventListener('click', function () { var bf = snap(ev); delete ev.overrides[id]; save(); close(); rerender(); undoToast(ev, bf, 'Back to the estimate', rerender); });
      });
    };
    $$('[data-price]').forEach(function (btn) { btn.addEventListener('click', function () { priceSheet(btn.dataset.price); }); });
    $$('[data-bookit]').forEach(function (btn) { btn.addEventListener('click', function () { var x = ev.shortlist[+btn.dataset.bookit]; if (x) priceSheet(x.cat, x.name); }); });
    $$('[data-unsave]').forEach(function (btn) { btn.addEventListener('click', function () { if (lockSample(ev)) return; var bf = snap(ev); ev.shortlist.splice(+btn.dataset.unsave, 1); save(); rerender(); undoToast(ev, bf, 'Removed from your shortlist', rerender); }); });
  };

  /* Venues: types that fit, live search links, drive times */
  TAB_VIEWS.places = function (ev, b) {
    var t = E.typeOf(ev.type); var types = (D.VENUE_TYPES[ev.setting] || D.VENUE_TYPES[t.style] || D.VENUE_TYPES.party).slice();
    var hr = +String(ev.time || '18:00').split(':')[0], daytime = hr < 16;
    if (ev.setting === 'outdoor') types = ev.type === 'wedding' || ev.type === 'engagement' ? ['Estate or garden venue', 'Vineyard or barn', 'Event lawn or estate grounds', 'Beach or waterfront venue', 'Rooftop terrace'] : ['Park pavilion or picnic area', 'Garden venue', 'Event lawn or estate grounds', 'Rooftop terrace', 'Beach or waterfront venue'];
    if (ev.setting === 'restaurant' || ev.setting === 'privateRoom') {
      types = types.filter(function (v) { return daytime ? !/steakhouse|wine bar|dinner spot|lounge/i.test(v) : !/brunch|tea room/i.test(v); });
      types = (daytime ? ['Upscale brunch or lunch spot', 'Hotel brunch or afternoon tea', 'Garden cafe or patio'] : ['Private dining room', 'Steakhouse or chophouse', 'Rooftop restaurant'].concat(ev.type === 'bachelorette' ? ['Cocktail lounge or speakeasy'] : [])).concat(types).filter(function (v, i, a) { return a.indexOf(v) === i; });
      if (ev.setting === 'privateRoom') types = types.filter(function (v) { return !/trendy dinner/i.test(v); });
    }
    if ((ev.kids && /birthday/.test(ev.type)) || /\b([1-9]|1[0-2])(st|nd|rd|th)\b.*birthday|kids'? party/i.test((ev.inspiration && ev.inspiration.text) || '')) { types = types.filter(function (v) { return !/lounge|wine bar|speakeasy|steakhouse/i.test(v); }); if (ev.setting === 'indoor') types.unshift('Kids party venue or play space'); }
    if (ev.setting === 'outdoor' && /\b(park|picnic)\b/i.test((ev.inspiration && ev.inspiration.text) || '')) types = ['Park pavilion or picnic area'].concat(types.filter(function (v) { return v !== 'Park pavilion or picnic area'; }));
    if (ev.setting === 'home') {
      return '<div class="stack"><h3>Your venue: home</h3><div class="panel stack"><p>Your event is at home, so there is no venue to book. Your plan already includes what a home event needs: ' + (ev.guests > 20 ? 'rentals, ' : '') + 'setup and cleanup, and enough seating for ' + plural(ev.guests, 'guest') + '.</p><ul class="incl"><li>Check parking and let neighbors know</li><li>Plan restrooms: one for every 25 to 30 guests</li><li>Clear a spot for food, drinks and gifts</li>' + (ev.guests > 40 ? '<li>Consider a small tent or canopy for overflow</li>' : '') + '</ul><div class="row"><button class="btn ghost small" id="whereAgain">Change where it is</button><a class="btn ghost small" href="' + (ev.sample ? '#/sample/' + ev.id.split('-')[1] : '#/e/' + ev.id) + '/vendors">See rentals and vendors</a></div></div></div>';
    }
    /* Put the kinds of place the host asked for first (e.g. "hotel", "rooftop", "garden") */
    var said = ((ev.inspiration && ev.inspiration.text) || '').toLowerCase() + ' ' + ((ev.inspiration && ev.inspiration.vibes) || []).join(' ').toLowerCase();
    var WANT = [['hotel', /hotel|ballroom/], ['rooftop', /rooftop|skyline|view/], ['garden', /garden|outdoor|estate/], ['mansion', /mansion|historic/], ['vineyard', /vineyard|winery|barn|rustic/], ['loft', /loft|industrial/], ['museum', /museum|gallery|art/], ['steakhouse', /steak/], ['tea', /tea\b|tea party|high tea/], ['wine', /wine/], ['brunch', /brunch/], ['private dining', /private (dining|room)/], ['park', /\bpark\b|picnic/], ['beach', /beach|waterfront|lake/]];
    var score = function (v) { var lv = v.toLowerCase(); return WANT.reduce(function (n, w) { return n + (lv.indexOf(w[0]) >= 0 && w[1].test(said) ? 1 : 0); }, 0); };
    if (/hotel|ballroom/.test(said) && !types.some(function (v) { return /hotel/i.test(v); })) types.unshift(ev.setting === 'restaurant' || ev.setting === 'privateRoom' ? 'Hotel tea room' : 'Hotel ballroom');
    var dinner = +String(ev.time || '18:00').split(':')[0] >= 15;
    types = types.filter(function (v) { return dinner ? !/brunch or lunch|tea room/i.test(v) || /tea/.test(said) : !/dinner spot/i.test(v); });
    types.sort(function (x, y) { return score(y) - score(x); });
    var typesAll = types.length; types = cut(types, 2, ev);
    var venueLine = b.items.find(function (i) { return i.id === 'venue' || i.id === 'privateDining'; });
    var city = ev.city.replace('Other US city', '');
    var foodLine = b.items.filter(function (i) { return i.id === 'restaurantFood' || i.id === 'restaurantDrinks'; }).reduce(function (s2, i) { return s2 + i.mid; }, 0);
    var intro = ev.setting === 'restaurant'
      ? 'Your food and drinks come to about ' + money(foodLine / Math.max(1, ev.guests)) + ' per person with tax and tip. Look for restaurants that take reservations for ' + plural(ev.guests, 'guest') + '.'
      : (venueLine ? 'Your venue budget is about ' + money(venueLine.mid) + '. ' : '') + 'Look for spaces that hold ' + plural(ev.guests, 'guest') + (ev.setting === 'outdoor' ? ' outdoors' : '') + '.';
    var filters = '<form class="panel venue-filter" id="vfilter"><label class="field"><span>Area or neighborhood (optional)</span><input class="input" id="varea" value="' + esc(ev.area || '') + '" placeholder="e.g. Uptown, The Woodlands, Downtown"></label>' +
      '<label class="field"><span>Your starting point, for drive times (optional)</span><input class="input" id="start" value="' + esc(ev.start || '') + '" placeholder="Home, hotel or ceremony address"></label>' +
      '<div><button class="btn small">Apply</button></div></form>';
    return (ev.settingOpen ? whereCompare(ev) : '') + '<div class="stack"><h3>' + (ev.setting === 'restaurant' ? 'Restaurants that fit this plan' : 'Venues that fit this plan') + '</h3><p class="muted">' + intro + '</p>' + filters +
      '<p class="small muted">' + (AI.live ? 'Tap View venues to see top-rated places in ' + esc(city) + '. Open any one to see photos, hours and contact details, then reach out to schedule a tour. ' : '') + 'Every list is matched to ' + (b.tier.id === 'F' ? 'your budget' : 'your ' + esc({ L: 'Luxe for Less', S: 'Signature', U: 'Ultra Luxe' }[venueLevel(ev, b)]) + ' level') + ': well-reviewed, polished places only, never budget chains.</p>' +
      newVenues(ev) + (AI.live ? '' : '<div class="note">Live venue photos, ratings, hours and drive times appear here when venue search is connected at launch. For now, each idea opens a live map search.</div>') +
      '<div class="list panel">' + types.map(function (v) {
        var q = venueQuery(v, ev, b) + ' in ' + (ev.area ? ev.area + ', ' : '') + city;
        var dir = ev.start ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(ev.start) + '&destination=' + encodeURIComponent(q) + '">Drive time</a>' : '';
        var pc = venueProsCons(v, ev);
        if (AI.live) return '<div class="it"><div class="grow"><b>' + esc(v) + '</b><div class="small muted">Pros: ' + esc(pc[0]) + '. Cons: ' + esc(pc[1]) + '.</div></div><span class="acts"><button class="btn small" data-live="' + esc(v) + '" data-q="' + esc(venueQuery(v, ev, b)) + '" data-level="' + venueLevel(ev, b) + '">View venues</button></span></div><div class="live-res" data-for="' + esc(v) + '"></div>';
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
  function venueQuery(v, ev, b) { return LEVEL_WORD[venueLevel(ev, b)] + ' ' + (VENUE_SEARCH[v] || v); }
  function venueProsCons(v, ev) {
    var m = {
      'Private dining room': ['food and space in one booking, no setup', 'food and drink minimums, set end time'],
      'Upscale brunch or lunch spot': ['bright, pretty and great for photos', 'busy on weekends, book ahead'],
      'Steakhouse or chophouse': ['polished service and big portions', 'higher prices per person'],
      'Wine bar or bistro': ['intimate and stylish', 'smaller tables for big groups'],
      'Trendy dinner spot with a large table': ['lively atmosphere', 'can be loud; may add an automatic tip'],
      'Rooftop restaurant': ['views and built-in atmosphere', 'weather risk and higher minimums'],
      'Hotel tea room': ['elegant, quiet and polished', 'fewer decor options'],
      'Wine bar with a private space': ['intimate and stylish', 'smaller capacity'],
      'Event loft': ['a blank canvas for your concept', 'you bring rentals, food and setup'],
      'Garden venue': ['beautiful natural backdrop', 'needs a rain plan'],
      'Tea room or bistro': ['charming and affordable', 'limited hours'],
      'Community or clubhouse room': ['lowest cost', 'needs the most decor'],
      'Rooftop lounge': ['nightlife energy and views', 'weather and noise rules'],
      'Restaurant buyout': ['food, staff and bar included', 'higher minimum spend'],
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
  TAB_BIND.places = function (ev, save, rerender) {
    bindSave(ev, $('#tab')); bindWhere(ev, rerender);
    $$('[data-live]').forEach(function (btn) { btn.addEventListener('click', function () {
      $$('.live-res').forEach(function (x) { x.innerHTML = ''; }); ev.lastVenue = btn.dataset.live;
      var box = document.querySelector('.live-res[data-for="' + btn.dataset.live.replace(/"/g, '') + '"]') || $('#live'); box.innerHTML = '<p class="muted small" style="padding:8px 0">Finding venues\u2026</p>';
      fetch(CFG.apiUrl + '/api/places', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: btn.dataset.q || btn.dataset.live, level: btn.dataset.level || 'S', city: (ev.area ? ev.area + ', ' : '') + ev.city }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); return j.places; }); })
        .then(function (list) {
          if (!list.length) { box.innerHTML = '<p class="muted">No well-reviewed matches nearby for this type. Try another venue type, or switch to a different budget version.</p>'; return; }
          var placesAll = list.length; list = cut(list, 3, ev);
          var ids = list.map(function (p) { return p.id; });
          box.innerHTML = '<div class="curated"><p class="eyebrow">Top-rated ' + esc(btn.dataset.live.toLowerCase()) + 's in ' + esc(ev.city.split(',')[0]) + '</p>' + list.map(function (p) { return '<div class="it"><div class="grow"><b>' + esc(p.name) + '</b><div class="small muted">' + (p.rating ? '\u2605 ' + p.rating + ' \u00b7 ' + Number(p.reviews || 0).toLocaleString('en-US') + ' reviews \u00b7 ' : '') + esc(p.address || '') + '</div><div class="small muted" data-dt="' + esc(p.id) + '"></div></div><span class="acts">' + saveBtn(ev, p, venueCat(ev)) + '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(p.mapsUrl) + '">View details</a></span></div>'; }).join('') + '<p class="muted small">Ratings from Google. Pricing and availability come directly from each venue when you inquire.</p></div>' + more(ev, placesAll, list.length, 'top-rated places');
          $$('[data-keep]', box).forEach(function (k) { k.addEventListener('click', function () { keepSheet(ev, 'Keep your plan', function () { location.reload(); }); }); });
          if (ev.start && ids.length) {
            var origin = /,|\d{5}/.test(ev.start) ? ev.start : ev.start + ', ' + ev.city;
            fetch(CFG.apiUrl + '/api/drive', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ origin: origin, placeIds: ids }) })
              .then(function (r) { return r.json(); }).then(function (j) {
                var times = j.times || [];
                if (!times.length) { box.querySelector('.curated').insertAdjacentHTML('beforeend', '<p class="small" style="color:var(--warn)">We couldn\u2019t find your starting point. Try a full street address.</p>'); return; }
                times.forEach(function (t) { var el = box.querySelector('[data-dt="' + t.placeId + '"]'); if (el) { el.textContent = t.minutes + ' min drive \u00b7 ' + t.miles + ' mi'; el.closest('.it').dataset.min = t.minutes; } });
                var wrap = box.querySelector('.curated'); var rows = [].slice.call(wrap.querySelectorAll('.it')).sort(function (a, c) { return (+a.dataset.min || 999) - (+c.dataset.min || 999); });
                var note = wrap.querySelector('p.muted.small'); rows.forEach(function (r) { wrap.insertBefore(r, note); });
              }).catch(function () {});
          }
        }).catch(function (e) { box.innerHTML = '<p class="muted">' + esc(e.message || 'Venue search isn\u2019t available right now.') + '</p>'; });
    }); });
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
  /* Vendors: the actual product or service for each category (never planners), with typical local prices. */
  var VENDOR_SEARCH = {
    decor: 'event decor rentals centerpieces backdrops', florals: 'florist', cake: 'custom cake bakery', photographer: 'event photographer',
    videographer: 'event videographer', dj: 'event DJ', liveMusic: 'live band for events', balloons: 'balloon decor installations', lighting: 'event lighting rental',
    rentals: 'party rentals tables chairs linens', catering: 'catering company', bartender: 'mobile bartending service', bar: 'mobile bar service',
    hairMakeup: 'hair and makeup artist', photoBooth: 'photo booth rental', entertainment: 'event entertainment', kids: 'kids party entertainment', mc: 'event MC host',
    transport: 'luxury transportation limo', security: 'event security', coordinator: 'day-of event coordinator', cleanup: 'event setup and cleanup crew',
    officiant: 'wedding officiant', favors: 'custom party favors', invitations: 'custom invitations stationery', attire: 'formal wear boutique'
  };
  var VENDOR_NOTE = {
    decor: 'Centerpieces, backdrop, linens styling and setup', florals: 'Centerpieces, bouquets and installations', cake: 'Custom cake sized to your guest count',
    photographer: 'Coverage hours, edited gallery', dj: 'Music, sound system and announcements', balloons: 'Garland or arch with install',
    lighting: 'Uplighting and setup', rentals: 'Tables, chairs, linens, tableware, delivery', hairMakeup: 'On-site styling for the guest of honor',
    photoBooth: 'Booth, attendant and prints', catering: 'Food, staff and service', bartender: 'Licensed bartenders per hour', videographer: 'Coverage and edited film'
  };
  TAB_VIEWS.vendors = function (ev, b) {
    var city = ev.city.replace('Other US city', '');
    var cats = b.items.filter(function (i) { return ['venue', 'privateDining', 'tent', 'restrooms', 'generator', 'permits', 'insurance', 'parking', 'restaurantFood', 'restaurantDrinks', 'cakeFee', 'tableDecor'].indexOf(i.id) < 0; });
    var restNote = ev.setting === 'restaurant' ? '<div class="note">Your restaurant handles the food and drinks. Pick the restaurant on the Venues page; table decor is on the Style and music page.</div>' : '';
    if (!cats.length) return '<div class="stack"><h3>Vendors for this plan</h3>' + restNote + '<p class="muted">No other vendors are needed for this plan.</p></div>';
    var lvl = venueLevel(ev, b);
    var catsAll = cats.length; cats = cut(cats, 3, ev);
    return '<div class="stack"><h3>Vendors for this plan</h3>' + restNote + '<p class="muted">Estimated prices in ' + esc(city.split(',')[0] || 'your city') + ' for your guest count and ' + (b.tier.id === 'F' ? 'budget' : esc({ L: 'Luxe for Less', S: 'Signature', U: 'Ultra Luxe' }[lvl]) + ' level') + ', including tax and tips where they apply. ' + (AI.live ? 'Tap a category to see top-rated businesses that provide it.' : '') + '</p>' +
      '<div class="list panel">' + cats.map(function (i) {
        var q = (LEVEL_WORD[lvl] + ' ' + (VENDOR_SEARCH[i.id] || i.name.split(' (')[0])).replace('luxury five-star', 'luxury');
        return '<div class="it"><div class="grow"><b>' + esc(i.name) + '</b> ' + statusBadge(ev, i.id) + '<div class="small">Estimated cost <b class="num">about ' + money(i.lo) + ' to ' + money(i.hi) + '</b></div>' + (VENDOR_NOTE[i.id] ? '<div class="small muted">' + esc(i.id === 'hairMakeup' ? 'On-site styling for ' + honoree(ev) + (ev.type === 'wedding' || /shower|bachelorette|quince/.test(ev.type) ? ' and the party' : '') : VENDOR_NOTE[i.id]) + '</div>' : '') + '</div>' +
          '<span class="acts">' + (AI.live ? '<button class="btn small ghost" data-vendor="' + esc(i.id) + '" data-q="' + esc(q) + '" data-level="' + lvl + '">View top-rated</button>' : '<a class="btn small ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q + ' in ' + city) + '">View on map</a>') + '</span></div><div class="live-res" data-for="v-' + esc(i.id) + '"></div>';
      }).join('') + '</div>' + more(ev, catsAll, cats.length, 'vendor categories with prices') + '<p class="muted small"><b>All prices are estimates</b> from typical local rates, not quotes. Real prices come from each vendor. Add a real quote anytime under Budget and your totals update. You pay vendors directly; Event Couture never holds your money.</p></div>';
  };
  TAB_BIND.style = function (ev) {
    var al = $('#allSongs'); if (al) { $('.songs').classList.add('short'); al.addEventListener('click', function () { var open = $('.songs').classList.toggle('short') === false; al.setAttribute('aria-expanded', open); al.textContent = open ? 'Show fewer songs' : 'Show all ' + $$('.songs li').length + ' songs'; }); }
    var b = $('#copySongs'); if (!b) return;
    b.addEventListener('click', function () { var nm = document.querySelector('.pl-name'); copyText((nm ? nm.textContent + '\n\n' : '') + [].slice.call(document.querySelectorAll('.songs li')).map(function (li, i) { var sh = li.querySelector('.sec-h'); return (sh ? (i ? '\n' : '') + sh.textContent + '\n' : '') + (i + 1) + '. ' + li.querySelector('b').textContent + ' \u2014' + li.querySelector('.muted').textContent; }).join('\n')); });
  };
  TAB_BIND.vendors = function (ev) {
    bindSave(ev, $('#tab'));
    $$('[data-vendor]').forEach(function (btn) { btn.addEventListener('click', function () {
      $$('.live-res').forEach(function (x) { x.innerHTML = ''; });
      var box = document.querySelector('.live-res[data-for="v-' + btn.dataset.vendor + '"]'); box.innerHTML = '<p class="muted small" style="padding:8px 0">Finding top-rated businesses…</p>';
      fetch(CFG.apiUrl + '/api/places', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: btn.dataset.q, level: btn.dataset.level || 'S', kind: 'vendor', city: (ev.area ? ev.area + ', ' : '') + ev.city }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); return j.places; }); })
        .then(function (list) {
          if (!list.length) { box.innerHTML = '<p class="muted small">No well-reviewed matches nearby. Try a different area on the Venues tab.</p>'; return; }
          var bizAll = list.length; list = cut(list, 3, ev);
          var PL = { PRICE_LEVEL_INEXPENSIVE: '$', PRICE_LEVEL_MODERATE: '$$', PRICE_LEVEL_EXPENSIVE: '$$$', PRICE_LEVEL_VERY_EXPENSIVE: '$$$$' };
          box.innerHTML = '<div class="curated">' + list.map(function (p) { return '<div class="it"><div class="grow"><b>' + esc(p.name) + '</b><div class="small muted">' + (p.rating ? '★ ' + p.rating + ' · ' + Number(p.reviews || 0).toLocaleString('en-US') + ' reviews' : '') + (PL[p.priceLevel] ? ' · ' + PL[p.priceLevel] : '') + (p.address ? ' · ' + esc(p.address.split(',').slice(0, 2).join(',')) : '') + '</div></div><span class="acts">' + saveBtn(ev, p, btn.dataset.vendor) + (p.website ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(p.website) + '">Website</a>' : '') + '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(p.mapsUrl) + '">View details</a></span></div>'; }).join('') + '<p class="muted small">Ratings from Google. Exact pricing comes from each business when you inquire.</p></div>' + more(ev, bizAll, list.length, 'top-rated businesses');
          $$('[data-keep]', box).forEach(function (k) { k.addEventListener('click', function () { keepSheet(ev, 'Keep your plan', function () { location.reload(); }); }); });
        }).catch(function (e) { box.innerHTML = '<p class="muted small">' + esc(e.message || 'Search isn’t available right now.') + '</p>'; });
    }); });
  };

  /* Food and drink: menu, dietary needs, quantities */
  TAB_VIEWS.food = function (ev) {
    var day = +String(ev.time || '18:00').split(':')[0] < 15;
    var said = ((ev.inspiration && ev.inspiration.text) || '').toLowerCase();
    var mstyle = ev.concept.menuStyle;
    if (/tea party|high tea|afternoon tea/.test(said)) mstyle = 'sweet';
    else if ((day || ev.type === 'brunch') && ['modern', 'elegant', 'classic', 'party', 'rustic'].indexOf(mstyle) >= 0) mstyle = 'garden';   /* daytime gets brunch and lunch dishes */
    if (mstyle === 'garden' && !day && ev.type !== 'brunch') mstyle = 'gardenDinner';
    if (['gala', 'wedding', 'anniversary'].indexOf(ev.type) >= 0 && ['modern', 'party', 'sweet'].indexOf(mstyle) >= 0) mstyle = 'classic';
    if ((ev.type === 'holiday' || ev.type === 'christmas')) mstyle = 'holiday';
    if (ev.type === 'quince') mstyle = 'quince';   /* formal dinners get plated food, not sliders */
    if ((ev.setting === 'restaurant' || ev.setting === 'privateRoom') && ['party', 'sweet', 'rustic'].indexOf(mstyle) >= 0) mstyle = day ? 'garden' : 'modern';
    if (ev.budget && ev.budget / Math.max(1, ev.guests) < 60 && ['coastal', 'elegant', 'classic'].indexOf(mstyle) >= 0 && ev.setting !== 'restaurant') mstyle = 'rustic';   /* lean budgets get crowd-pleasers, not lobster */
    if (ev.kids && /birthday/.test(ev.type)) mstyle = 'kids';   /* garden looks at night get a garden dinner, not brunch */
    var menuAll = drinkSafe(D.MENUS[mstyle] || D.MENUS.party, ev, 'menu'); var menu = cut(menuAll, 3, ev);
    var diets = {}; (ev.guestsList || []).forEach(function (g) { (g.diet || []).forEach(function (d) { diets[d] = (diets[d] || 0) + 1; }); });
    var qAll = E.quantities(ev); var q = cut(qAll, 3, ev);
    var rest = ev.setting === 'restaurant';
    return (rest ? '<div class="stack"><h3>Ordering at the restaurant</h3><div class="panel"><ul class="incl"><li>Call ahead: groups of ' + Math.max(6, Math.min(10, ev.guests)) + ' or more often get a set menu or an automatic tip</li><li>Ask about separate checks before you sit down</li><li>Pre-order a few shared starters so food arrives quickly</li><li>Ask about the cake-cutting fee, or order dessert from the menu instead</li></ul></div></div>' : '') +
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
  function shopLink(q) {
    var tag = CFG.amazonTag ? '&tag=' + encodeURIComponent(CFG.amazonTag) : '';
    return { amazon: 'https://www.amazon.com/s?k=' + encodeURIComponent(q) + tag, etsy: 'https://www.etsy.com/search?q=' + encodeURIComponent(q) };
  }
  /* Get this look: every piece named in the host's words, marked in her photos, or seen in the chosen photo or look, with where to buy it or who to hire. */
  var HIRE_WHO = { florals: 'a florist', cake: 'a baker', balloons: 'a balloon artist', decor: 'a decorator', rentals: 'a rental company', lighting: 'a lighting company', catering: 'a caterer', kids: 'a kids entertainer', liveMusic: 'a band', photoBooth: 'a photo booth company' };
  var WHY = { asked: 'You asked for this', loved: 'You marked this in your photo', photo: 'In the inspiration photo', ai: 'In your inspiration', look: 'Part of this look' };
  function getLook(ev) {
    var rest = ev.setting === 'restaurant' || ev.setting === 'privateRoom';
    var re = ev.alcohol === 'none' ? ALC : ev.alcohol === 'wine' ? HARD : null;
    var all = E.lookPieces(ev).filter(function (p) {
      if (re && (re.test(p.name) || re.test(p.q))) return false;
      if (rest && (['rentals', 'decor', 'lighting', 'balloons', 'photoBooth'].indexOf(p.hire) >= 0 || BIG_DECOR.test(p.name))) return false;
      return true;
    });
    if (!all.length) return '';
    var base = ev.sample ? '#/sample/' + ev.id.split('-')[1] : '#/e/' + ev.id;
    var list = cut(all, 4, ev);
    return '<div class="stack"><h3>Get this look</h3><p class="muted">Everything it takes to bring ' + esc(ev.concept.styleName) + ' to life: the pieces you can buy yourself, and the ones a pro makes for you.' + (rest ? ' Only what a restaurant allows on the table is listed.' : '') + '</p><div class="list panel get-look">' +
      list.map(function (p) {
        var l = p.q ? shopLink(p.q) : null;
        return '<div class="it"><div class="grow"><b>' + esc(p.name) + '</b><div class="small muted">' + esc(WHY[p.why] || '') + (p.hire ? ' \u00b7 Hire ' + esc(HIRE_WHO[p.hire] || 'a pro') : ' \u00b7 Buy it') + '</div></div><span class="acts">' +
          (l ? '<a class="btn small" target="_blank" rel="noopener" href="' + l.amazon + '">Amazon</a><a class="btn small ghost" target="_blank" rel="noopener" href="' + l.etsy + '">Etsy</a>' : '<a class="btn small ghost" href="' + base + '/vendors">Find ' + esc(HIRE_WHO[p.hire] || 'a pro') + '</a>') + '</span></div>';
      }).join('') + '</div>' + more(ev, all.length, list.length, 'pieces') +
      '<p class="small muted">Store links search for that exact piece so you can compare live prices and pick the one you like. Show your florist, baker or decorator your inspiration photo so they can match it.</p></div>';
  }
  TAB_VIEWS.style = function (ev) {
    var c = ev.concept; var st = D.STYLES.find(function (x) { return x.id === c.id; }) || {}; var color = c.shop || st.shop || c.styleName.toLowerCase();
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
    if (hired.indexOf('favors') >= 0) items = items.filter(function (it) { return it.name !== 'Favors'; });   /* already in the budget */
    var bigHired = !rest && g >= 100 && hired.indexOf('decor') >= 0;
    if (bigHired) items = items.filter(function (it) { return ['Table runners', 'Taper candles (set of 12)', 'Beverage napkins (pack of 50)', 'Photo backdrop'].indexOf(it.name) < 0; });
    if (+String(ev.time || '18:00').split(':')[0] < 16) items = items.map(function (it) { return it.name === 'Taper candles (set of 12)' ? { q: color + ' bud vases', name: 'Bud vases (set of 12)', each: [14, 30], qty: Math.max(1, Math.ceil(tables / 2)) } : it; });
    if (ev.kids && /birthday/.test(ev.type)) items = items.map(function (it) { return it.name === 'Taper candles (set of 12)' ? { q: color + ' party plates and cups', name: 'Party plates and cups (pack of 24)', each: [10, 22], qty: Math.ceil(g / 24) } : it; });
    var decorLine = E.budget(ev, ev.tier).items.find(function (i) { return i.id === 'tableDecor'; });
    var usd = function (n) { return '$' + (n % 1 ? n.toFixed(2) : n); };
    var shopLo = items.reduce(function (t, it) { return t + it.each[0] * it.qty; }, 0), shopHi = items.reduce(function (t, it) { return t + it.each[1] * it.qty; }, 0);
    var pl = D.PLAYLIST_SEARCH(c.music);
    var itemsAll = items.length; items = cut(items, 2, ev);
    return getLook(ev) + '<div class="stack"><h3>Table basics, with quantities</h3><p class="muted">' + (rest && decorLine ? 'Your budget includes about ' + money(decorLine.mid) + ' for table decor; these are the basics to buy with it, picked for the ' + esc(c.styleName) + ' look.' : bigHired && items.length ? 'For an event this size your decorator and rental company supply linens, candles and backdrops. These are personal touches to pick up yourself.' : 'Optional do-it-yourself picks for the ' + esc(c.styleName) + ' look. They\u2019re not counted in your budget.') + ' Links open the store, where you\u2019ll see live prices.' + (CFG.amazonTag ? ' Some links earn Event Couture a small commission at no cost to you.' : '') + '</p>' +
      (!items.length ? '<p class="small muted">Everything for this look is already covered by your hired vendors in the budget.</p></div>' : '<div class="shop">' + items.map(function (it, k) { var l = shopLink(it.q);
        return '<div class="prod"><div class="pimg" aria-hidden="true" style="background:linear-gradient(135deg,' + c.palette[k % c.palette.length] + ',' + c.palette[(k + 2) % c.palette.length] + ')"></div><div class="pbody"><b>' + esc(it.name) + '</b>' + (it.qty > 1 ? '<span class="small muted">' + it.qty + ' \u00d7 ' + usd(it.each[0]) + ' to ' + usd(it.each[1]) + ' each</span>' : '') + '<span class="num">' + money(it.each[0] * it.qty) + ' to ' + money(it.each[1] * it.qty) + '</span><span class="acts"><a class="btn small" target="_blank" rel="noopener" href="' + l.amazon + '">Shop Amazon</a><a class="btn small ghost" target="_blank" rel="noopener" href="' + l.etsy + '">Etsy</a></span></div></div>'; }).join('') + '</div>' + more(ev, itemsAll, items.length, 'shopping picks') +
      '<p class="small muted">Estimated shopping total: <b class="num">' + money(shopLo) + ' to ' + money(shopHi) + '</b>. ' + (bigHired ? '' : rest ? 'Sized to one table of ' + plural(g, 'guest') + '.' : 'Quantities are sized to ' + plural(g, 'guest') + ' and ' + plural(tables, 'table') + '.') + '</p></div>') +
      (rest ? '' : (function () {
        var songs = (c.songs && c.songs.length >= 6 && !(ev.kids && /birthday/.test(ev.type)) ? c.songs.map(function (x) { var t = String(x).split(/ \u2014 | - /); return [t[0], t[1] || '']; }) : []);
        var have = {}; songs.forEach(function (x) { have[x[0].toLowerCase()] = 1; });
        var skey = window.EC_SONG_KEY(c.music, ev.type, ev.kids), wedMix = ev.type === 'wedding' && songs.length < 6;
        if (wedMix) {
          /* A wedding needs music for each part of the day: ceremony, dinner and dancing. */
          var calm = ['string quartet classics', 'jazz brunch acoustic', 'indie acoustic sunset', 'yacht rock bossa nova', 'country folk acoustic'];
          var party = ['afrobeats reggaeton summer', 'r&b lounge house', 'deep house chill', 'pop feel-good', 'disco funk dance', 'r&b soul classics', 'swing jazz motown'];
          [['Ceremony and cocktail hour', calm.indexOf(skey) >= 0 ? skey : 'string quartet classics', 8], ['Dinner', 'love songs soul', 8], ['Dancing', party.indexOf(skey) >= 0 ? skey : (skey === 'country folk acoustic' ? skey : 'disco funk dance'), 9]].forEach(function (sec) {
            var n = 0; window.EC_SONGS[sec[1]].forEach(function (x) { if (n < sec[2] && !have[x[0].toLowerCase()]) { have[x[0].toLowerCase()] = 1; songs.push([x[0], x[1], n === 0 ? sec[0] : '']); n++; } });
          });
        }
        window.EC_SONGS[skey].forEach(function (x) { if (songs.length < 25 && !have[x[0].toLowerCase()]) { have[x[0].toLowerCase()] = 1; songs.push(x); } });
        songs = songs.slice(0, 25);
        var songsAll = songs.length; songs = cut(songs, 3, ev);
        var sp = function (q) { return 'https://open.spotify.com/search/' + encodeURIComponent(q); }, am = function (q) { return 'https://music.apple.com/us/search?term=' + encodeURIComponent(q); };
        var plName = c.playlistName || (wedMix ? 'From Aisle to Dance Floor' : window.EC_SONG_NAMES[skey]) || 'Party Playlist';
        return '<div class="stack"><h3>Your playlist</h3><div class="panel stack"><div class="pl-head"><span class="pl-name display">' + esc(plName) + '</span><span class="muted small">' + esc(songsAll) + ' songs for ' + esc(ev.name) + (ev.name.indexOf(c.styleName) >= 0 ? '' : ', picked for the ' + esc(c.styleName) + ' look') + '. Tap a song to play it, or hand this list to your DJ.</span></div><ol class="songs">' +
          songs.map(function (sg) { var q = sg[0] + ' ' + sg[1]; return '<li>' + (sg[2] ? '<span class="sec-h">' + esc(sg[2]) + '</span>' : '') + '<span class="grow"><b>' + esc(sg[0]) + '</b><span class="muted small"> ' + esc(sg[1]) + '</span></span><a class="link small" target="_blank" rel="noopener" href="' + sp(q) + '">Spotify</a><a class="link small" target="_blank" rel="noopener" href="' + am(q) + '">Apple Music</a></li>'; }).join('') +
          '</ol>' + (songs.length > 10 ? '<button class="btn small ghost" id="allSongs" aria-expanded="false">Show all ' + songs.length + ' songs</button>' : '') + more(ev, songsAll, songs.length, 'songs') + (preview(ev) ? '' : '<div class="row"><button class="btn small ghost" id="copySongs">Copy song list</button></div>') + '</div></div>';
      })()) +
      '<div class="stack"><h3>What to wear</h3><div class="panel stack">' + dressBlock(ev) + dots(c.palette, c.styleName + ' colors') + faceCard('look') + '</div></div>';
  };

  /* Timeline: checklist and run of show */
  TAB_VIEWS.timeline = function (ev) {
    var listAll = E.checklist(ev); var list = cut(listAll, 4, ev);
    var rosAll = ev.ros || E.runOfShow(ev); var ros = cut(rosAll, 3, ev);
    return '<div class="stack"><h3>Checklist</h3>' + (ev.date ? '' : '<p class="muted">Add your event date to see due dates.</p>') + '<div class="panel">' +
      list.map(function (c) { var done = (ev.checklistDone && ev.checklistDone[c.text]) || (c.text.indexOf('Choose your concept') === 0 && ev.concept) || (c.text === 'Set the budget and guest count' && ev.guests && (ev.budget || ev.tier)) || (/^Book the venue|^Reserve/.test(c.text) && statusOf(ev, venueCat(ev)) === 'booked'); return '<label class="check' + (done ? ' done' : '') + '"><input type="checkbox" data-ck="' + esc(c.text) + '"' + (done ? ' checked' : '') + '><span class="grow"><span class="t">' + esc(c.text) + '</span>' + (c.due ? '<br><span class="small ' + (c.overdue && !done ? '' : 'muted') + '" style="' + (c.overdue && !done ? 'color:var(--bad)' : '') + '">' + (c.overdue && !done ? 'Overdue, was due ' + shortDate(c.due) : c.soon ? 'Do this soon' : 'Due ' + shortDate(c.due)) + '</span>' : '') + '</span></label>'; }).join('') + '</div>' + more(ev, listAll.length, list.length, 'checklist steps with due dates') + '</div>' +
      '<div class="stack"><div class="row" style="justify-content:space-between"><h3>Run of show</h3><label class="row small">Start <input class="input" type="time" id="tm" value="' + esc(ev.time || '18:00') + '" style="width:130px;min-height:40px"></label></div><div class="panel ros">' + ros.map(function (r) { return '<div><b>' + esc(r.time) + '</b><span>' + esc(r.text) + '</span></div>'; }).join('') + '</div>' + more(ev, rosAll.length, ros.length, 'moments in your day-of schedule') +
      '<p class="muted small">Co-hosts see this same timeline on the day.</p></div>';
  };
  TAB_BIND.timeline = function (ev, save, rerender) {
    $$('[data-ck]').forEach(function (cb) { cb.addEventListener('change', function () { if (lockSample(ev)) { cb.checked = !cb.checked; return; } ev.checklistDone = ev.checklistDone || {}; ev.checklistDone[cb.dataset.ck] = cb.checked; save(); cb.closest('.check').classList.toggle('done', cb.checked); }); });
    $('#tm').addEventListener('change', function () { if (lockSample(ev)) return; ev.time = this.value; delete ev.ros; save(); rerender(); });
  };

  /* Guests: list, capacity, waitlist, seating, co-hosts */
  TAB_VIEWS.guests = function (ev) {
    var used = E.placesUsed(ev.guestsList); var cap = ev.paid && ev.paid.max ? Math.min(ev.guests, ev.paid.max) : ev.guests;
    var counts = { yes: 0, invited: 0, declined: 0, waitlist: 0 }; (ev.guestsList || []).forEach(function (g) { counts[g.status] = (counts[g.status] || 0) + 1; });
    var tables = {}; (ev.guestsList || []).filter(function (g) { return g.table; }).forEach(function (g) { (tables[g.table] = tables[g.table] || []).push(g); });
    return '<div class="stack"><div class="row" style="justify-content:space-between"><h3>Guest list</h3><span class="num muted">' + used + ' of ' + cap + ' places</span></div>' +
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
    function cap() { return ev.paid && ev.paid.max ? Math.min(ev.guests, ev.paid.max) : ev.guests; }
    function addGuest(name, plus) {
      var used = E.placesUsed(ev.guestsList); var status = used + 1 + plus > cap() ? 'waitlist' : 'invited';
      ev.guestsList.push({ id: uid(), name: name, plusOnes: plus, status: status, diet: [] }); return status;
    }
    $('#addg').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var n = $('#gn').value.trim(); if (!n) return toast('Enter a name'); var st = addGuest(n, Math.max(0, +$('#gp').value || 0)); save(); if (st === 'waitlist') toast('Capacity reached: ' + n + ' was added to the waitlist'); rerender(); });
    $('#bulk').addEventListener('click', function () { if (lockSample(ev)) return; sheet('<h3>Paste guest names</h3><textarea class="input" id="names" placeholder="One name per line"></textarea><button class="btn gold block" id="ok">Add guests</button><button class="btn ghost block" data-close>Cancel</button>', function (el, close) { $('#ok', el).addEventListener('click', function () { var w = 0; $('#names', el).value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (n) { if (addGuest(n, 0) === 'waitlist') w++; }); save(); close(); if (w) toast(w + ' went to the waitlist because capacity is full'); rerender(); }); }); });
    $$('[data-st]').forEach(function (s) { s.addEventListener('change', function () { if (lockSample(ev)) return; var g = ev.guestsList.find(function (x) { return x.id === s.dataset.st; }); var prev = g.status; g.status = s.value; if (E.placesUsed(ev.guestsList) > cap() && (s.value === 'yes' || s.value === 'invited')) { g.status = prev; toast('That would go over your ' + cap() + ' places. Move up a size under Overview, Your pass, or free a place first.'); } save(); rerender(); }); });
    $$('[data-rm]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; ev.guestsList = ev.guestsList.filter(function (g) { return g.id !== b.dataset.rm; }); promoteWaitlist(ev, cap()); save(); rerender(); }); });
    if ($('#seat')) $('#seat').addEventListener('click', function () { if (lockSample(ev)) return; if (!ev.guestsList.some(function (g) { return g.status === 'yes'; })) return toast('No one has said yes yet. Mark guests as Coming, or wait for RSVPs.'); var t = 1, seats = 0; ev.guestsList.forEach(function (g) { g.table = null; }); ev.guestsList.filter(function (g) { return g.status === 'yes'; }).forEach(function (g) { var need = 1 + (g.plusOnes || 0); if (seats + need > 8) { t++; seats = 0; } g.table = t; seats += need; }); save(); rerender(); });
    $('#addc').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var n = $('#cn').value.trim(); if (!n) return toast('Enter a name'); ev.cohosts = (ev.cohosts || []).concat({ name: n, role: $('#cr').value }); save(); rerender(); });
    $$('[data-rmc]').forEach(function (b) { b.addEventListener('click', function () { ev.cohosts.splice(+b.dataset.rmc, 1); save(); rerender(); }); });
  };
  function promoteWaitlist(ev, cap) {
    ev.guestsList.filter(function (g) { return g.status === 'waitlist'; }).forEach(function (g) { if (E.placesUsed(ev.guestsList) + 1 + (g.plusOnes || 0) <= cap) g.status = 'invited'; });
  }

  /* Voting */
  TAB_VIEWS.votes = function (ev) {
    var polls = ev.polls || [];
    return '<div class="stack"><h3>Let everyone vote</h3><p class="muted">Ask about dates, venues, menus or outfits. Guests and co-hosts vote from the event page.</p>' +
      (polls.length ? polls.map(function (p, pi) { var tot = p.options.reduce(function (s, o) { return s + o.votes; }, 0);
        return '<div class="panel stack"><b>' + esc(p.q) + '</b><div class="poll">' + p.options.map(function (o, oi) { var pct = tot ? Math.round(o.votes / tot * 100) : 0;
          return '<button data-vote="' + pi + ':' + oi + '"><i style="width:' + pct + '%"></i><span>' + esc(o.t) + '</span><span class="num muted">' + o.votes + '</span></button>'; }).join('') + '</div><button class="link small" data-rmp="' + pi + '" style="justify-self:start">Delete poll</button></div>'; }).join('') : '<p class="muted">No polls yet.</p>') +
      '<form id="addp" class="panel stack"><b>New poll</b><input class="input" aria-label="Poll question" id="pq" placeholder="Question, e.g. Which date works best?"><textarea class="input" id="po" placeholder="Options, one per line"></textarea><div><button class="btn">Create poll</button></div></form></div>';
  };
  TAB_BIND.votes = function (ev, save, rerender) {
    $$('[data-vote]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; var k = b.dataset.vote.split(':'); ev.polls[+k[0]].options[+k[1]].votes++; save(); rerender(); }); });
    $$('[data-rmp]').forEach(function (b) { b.addEventListener('click', function () { ev.polls.splice(+b.dataset.rmp, 1); save(); rerender(); }); });
    $('#addp').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var q = $('#pq').value.trim(); var o = $('#po').value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean); if (!q || o.length < 2) return toast('Add a question and at least two options'); ev.polls = (ev.polls || []).concat({ q: q, options: o.map(function (t) { return { t: t, votes: 0 }; }) }); save(); rerender(); });
  };

  /* Invite, event page, registry, cost splitting */
  /* A registry only shows for occasions where gifts are expected. */
  function hasRegistry(ev) { return ['wedding', 'bridal-shower', 'baby-shower', 'gender-reveal', 'engagement', 'graduation', 'quince', 'sweet16', 'birthday', 'kids-birthday', 'milestone', 'anniversary', 'retirement'].indexOf(ev.type) >= 0 || ((ev.registry && ev.registry.items) || []).length > 0; }
  var FUND_IDEA = { wedding: 'Honeymoon fund', engagement: 'Honeymoon fund', 'bridal-shower': 'New home fund', 'baby-shower': 'Diaper and nursery fund', 'gender-reveal': 'Nursery fund', graduation: 'College or first apartment fund', quince: 'College fund', sweet16: 'First car or college fund', anniversary: 'Anniversary trip fund', retirement: 'Retirement trip fund' };
  /* Each person's share: the amount (the plan total unless the host typed one) divided by everyone sharing it. */
  function splitTotal(ev) { var sp = ev.split || {}; return sp.total || E.budget(ev, ev.tier).total; }
  function splitCount(ev) { var sp = ev.split || {}; return Math.max(1, sp.count || ev.expected || ev.guests || 1); }
  function splitShare(ev) { return canSplit(ev) ? splitTotal(ev) / splitCount(ev) : 0; }
  TAB_VIEWS.invite = function (ev, b) {
    var link = location.href.split('#')[0] + '#/g/' + ev.id;
    var pl = ev.payLinks || {}; var split = ev.split || { people: [] };
    var share = splitShare(ev);
    return '<div class="stack"><h3>' + (hasRegistry(ev) ? 'Invitation and event page' : 'Your invitation') + '</h3><div class="invite"><div class="card">' + '<div class="swatch" aria-hidden="true">' + ev.concept.palette.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div><div class="in"><span class="muted">You’re invited to</span><h1>' + esc(ev.name) + '</h1><p>' + (ev.date ? esc(fmtDate(ev.date)) + (ev.time ? ' at ' + fmtTime(ev.time) : '') : 'Date to be announced') + '</p><p class="muted">' + esc(whereText(ev)) + '</p><p class="small muted">Dress code: ' + esc(E.dressCode(ev, ev.tier)) + '</p></div></div></div>' +
      (ev.date || ev.sample ? '' : '<div class="note">Add your date (tap \u201cAdd your date\u201d at the top) before you send the invitation, so guests can save it.</div>') + '<div class="row"><button class="btn gold" id="copy">Copy invite link</button><a class="btn ghost" href="#/g/' + ev.id + '">Preview as a guest</a></div>' +
      (CFG.preview ? '<p class="muted small">For now this link opens on this device only, so you can preview what guests will see. Sending it to guests on their own phones turns on when accounts launch.</p>' : '<p class="muted small">Guests open it in any browser; no app needed.</p>') + '</div>' +
      (!canSplit(ev) && !hasRegistry(ev) ? '' : '<div class="stack"><h3>Your payment links</h3><p class="muted small">' + (canSplit(ev) ? 'Friends pay you directly for their share, and guests can send cash gifts.' : 'For cash gifts and funds from your registry.') + ' Event Couture never holds the money.</p><div class="grid3">' +
      [['venmo', 'Venmo username'], ['cashapp', 'Cash App $cashtag'], ['paypal', 'PayPal.me name']].map(function (x) { return '<label class="field"><span>' + x[1] + '</span><input class="input" data-pay="' + x[0] + '" value="' + esc(pl[x[0]] || '') + '"></label>'; }).join('') + '</div><div><button class="btn small" id="savePay">Save payment links</button></div></div>') +
      (!canSplit(ev) ? '' : '<div class="stack"><h3>Cost splitting</h3><div class="panel stack"><div class="grid2"><label class="field"><span>Amount to split (USD)</span><input class="input num" type="number" id="stot" value="' + Math.round(splitTotal(ev)) + '"></label><label class="field"><span>Number of people sharing it</span><input class="input num" type="number" min="1" id="scount" value="' + splitCount(ev) + '"></label></div><p class="small">Each person\u2019s share: <b class="num">' + money(splitShare(ev)) + '</b>. Starts from your plan\u2019s estimated total; change it to what you actually spent.</p><div class="grid2"><label class="field"><span>Add a person</span><form id="sadd" class="row"><input class="input" id="sname" style="flex:1"><button class="btn small">Add</button></form></label></div>' +
      (split.people.length ? '<div class="list">' + split.people.map(function (p, i) { return '<label class="check' + (p.paid ? ' done' : '') + '"><input type="checkbox" data-paid="' + i + '"' + (p.paid ? ' checked' : '') + '><span class="grow"><span class="t">' + esc(p.name) + '</span></span><span class="num">' + money(share) + '</span></label>'; }).join('') + '</div><p class="small muted">' + split.people.filter(function (p) { return p.paid; }).length + ' of ' + split.people.length + ' paid</p>' : '<p class="muted small">Add the people sharing the cost; each sees their share and your payment links on the event page.</p>') + '</div></div>') +
      (!hasRegistry(ev) ? '' : '<div class="stack"><h3>Registry</h3><div class="panel list">' + ((ev.registry.items || []).length ? ev.registry.items.map(function (it, i) { return '<div class="it"><div class="grow"><b>' + esc(it.name) + '</b>' + (it.price ? ' <span class="muted num">' + money(it.price) + '</span>' : '') + (it.bought ? ' <span class="badge ok">Purchased</span>' : '') + '</div>' + (it.url ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(it.url) + '">View</a>' : '') + '<button class="link small" data-rmr="' + i + '">Remove</button></div>'; }).join('') : '<p class="muted">Add gifts from any store, or a cash fund like a ' + esc((FUND_IDEA[ev.type] || 'celebration fund').toLowerCase()) + '.</p>') + '</div>' +
      '<form id="radd" class="grid3"><input class="input" aria-label="Gift name" id="rn" placeholder="Gift name"><input class="input" aria-label="Store link" id="ru" placeholder="Store link (optional)"><input class="input num" aria-label="Gift price" id="rp" type="number" min="0" placeholder="Price (optional)"><button class="btn">Add gift</button></form>' +
      '<form id="fadd" class="row"><input class="input" aria-label="Cash fund name" id="fn" placeholder="Cash fund, e.g. ' + esc(FUND_IDEA[ev.type] || 'Celebration fund') + '" style="flex:1 1 220px"><button class="btn ghost">Add cash fund</button></form>' +
      ((ev.registry.funds || []).length ? '<div class="chips">' + ev.registry.funds.map(function (f, i) { return '<span class="badge">' + esc(f.name) + ' <button class="link small" data-rmf="' + i + '" aria-label="Remove ' + esc(f.name) + '">×</button></span>'; }).join('') + '</div>' : '') +
      '<p class="muted small">Cash funds go straight to your payment links above.</p></div>');
  };
  TAB_BIND.invite = function (ev, save, rerender) {
    $('#copy').addEventListener('click', function () { if (!isKept(ev)) return keepSheet(ev, 'Keep your plan to share it', function () { copyText(location.href.split('#')[0] + '#/g/' + ev.id); }); copyText(location.href.split('#')[0] + '#/g/' + ev.id); });
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
    return '<div class="stack"><div class="row" style="justify-content:space-between"><h3>Shared album</h3><label class="btn small"><input type="file" accept="image/*" multiple id="alb" class="sr">Add photos</label></div>' +
      ((ev.album || []).length ? '<div class="album">' + ev.album.map(function (s) { return '<img src="' + s + '" alt="Event photo">'; }).join('') + '</div>' : '<p class="muted">Guests can add photos from the event page after the party.</p>') + '</div>' +
      '<div class="stack"><h3>Gifts and thank-yous</h3><div class="panel list">' + ((ev.gifts || []).length ? ev.gifts.map(function (g, i) { return '<label class="check' + (g.thanked ? ' done' : '') + '"><input type="checkbox" data-th="' + i + '"' + (g.thanked ? ' checked' : '') + '><span class="grow"><span class="t">' + esc(g.from) + '</span><br><span class="small muted">' + esc(g.gift) + '</span></span><button class="link small" type="button" data-draft="' + i + '">Thank-you note</button></label>'; }).join('') : '<p class="muted">Track who gave what, then tick each one off when you’ve said thank you.</p>') + '</div>' +
      '<form id="gadd" class="row"><input class="input" aria-label="Gift from" id="gf" placeholder="From" style="flex:1 1 150px"><input class="input" aria-label="Gift" id="gg" placeholder="Gift" style="flex:2 1 180px"><button class="btn">Add</button></form></div>';
  };
  TAB_BIND.after = function (ev, save, rerender) {
    $('#alb').addEventListener('change', function () { if (lockSample(ev)) return; Promise.all(Array.prototype.slice.call(this.files).map(function (f) { return readPhoto(f).catch(function () { return null; }); })).then(function (ps) { ev.album = (ev.album || []).concat(ps.filter(Boolean).map(function (p) { return p.src; })); save(); rerender(); }); });
    $('#gadd').addEventListener('submit', function (e) { e.preventDefault(); if (lockSample(ev)) return; var f = $('#gf').value.trim(), g = $('#gg').value.trim(); if (!f) return toast('Enter who it’s from'); ev.gifts = (ev.gifts || []).concat({ from: f, gift: g, thanked: false }); save(); rerender(); });
    $$('[data-th]').forEach(function (c) { c.addEventListener('change', function () { ev.gifts[+c.dataset.th].thanked = c.checked; save(); c.closest('.check').classList.toggle('done', c.checked); }); });
    $$('[data-draft]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); var g = ev.gifts[+b.dataset.draft];
      var note = 'Dear ' + g.from.split(' ')[0] + ',\n\nThank you so much for ' + (g.gift ? 'the ' + g.gift.toLowerCase() : 'your generous gift') + ' and for celebrating ' + ev.name + ' with us. It meant so much to have you there.\n\nWith love,';
      sheet('<h3>Thank-you note</h3><textarea class="input" id="note" aria-label="Thank-you note" style="min-height:180px">' + esc(note) + '</textarea><button class="btn gold block" id="cp">Copy note</button><button class="btn ghost block" data-close>Close</button>', function (el) { $('#cp', el).addEventListener('click', function () { copyText($('#note', el).value, 'Note'); }); });
    }); });
  };

  /* Extras: Event Pass, upgrades, receipts (credits, packages and add-ons hidden until they deliver) */
  TAB_VIEWS.extras = function (ev) {
    var w = wallet(); var nextPass = E.passFor((ev.paid && ev.paid.max || ev.guests) + 1);
    var mine = w.ledger.filter(function (l) { return !ev.sample && l.event === ev.name; });
    if (!ev.sample && !isKept(ev)) return '<div class="stack"><h3>Your Event Pass</h3><div class="panel stack"><p>Your plan isn\u2019t kept yet. Keep it to save every edit and share it with guests.</p><div class="price-big num">$' + E.passFor(ev.guests).price.toFixed(2) + '</div><p class="muted small">' + esc(E.passFor(ev.guests).label) + ', one time, no subscription.</p><div><button class="btn" id="keepX">Keep my plan</button></div></div></div>';
    return '<div class="stack"><h3>Your Event Pass</h3><div class="panel stack"><div class="row" style="justify-content:space-between"><span>' + (ev.sample ? 'Sample plan' : esc(E.passFor(ev.paid.max || ev.guests).label)) + '</span><span class="badge ok">Active</span></div>' + (ev.sample ? '' : '<p class="small muted">Available until ' + esc(accessUntil(ev, ev.paid && ev.paid.at)) + '.</p>') +
      '<p class="muted small">Inviting more people? Moving up to ' + esc(nextPass.label.toLowerCase()) + ' costs the difference, ' + money(Math.max(0, nextPass.price - (ev.paid ? ev.paid.price : 0))) + (Math.max(0, nextPass.price - (ev.paid ? ev.paid.price : 0)) % 1 ? '' : '') + '.</p><div><button class="btn small ghost" id="upg">Move up a size</button></div></div></div>' +
      (!SELL_EXTRAS ? '' : '<div class="stack"><div class="row" style="justify-content:space-between"><h3>AI credits</h3><span class="num">' + w.credits + ' credits</span></div><p class="muted small">For extra AI work beyond what your pass includes. The exact credit cost is shown before every action, and credits never top up automatically.</p><div class="packs">' +
      D.CREDIT_PACKS.map(function (p, i) { return '<button class="tier" data-pack="' + i + '"><span class="amt num">' + p.credits + '</span><span class="muted">credits</span><b class="num">$' + p.price.toFixed(2) + '</b></button>'; }).join('') + '</div></div>' +
      '<div class="stack"><h3>Creative packages</h3><div class="list panel">' + D.PACKAGES.map(function (p, i) { return '<div class="it"><div class="grow"><b>' + esc(p.name) + '</b><div class="small muted">' + esc(p.desc) + '</div></div><span class="num">$' + p.price.toFixed(2) + '</span><button class="btn small" data-pkg="' + i + '">Choose</button></div>'; }).join('') + '</div></div>' +
      '<div class="stack"><h3>Optional add-ons</h3><p class="muted small">Never needed to finish your plan.</p><div class="list panel">' + D.ADDONS.map(function (a, i) { return '<div class="it"><div class="grow"><b>' + esc(a.name) + '</b><div class="small muted">' + esc(a.desc) + '</div></div><span class="num">$' + a.price.toFixed(2) + '</span><button class="btn small ghost" data-add="' + i + '">Choose</button></div>'; }).join('') + '</div></div>') +
      (ev.sample ? '' : '<div class="stack"><h3>Delete this event</h3><p class="muted small">Removes the plan, guest list and photos from this device. Purchases can\u2019t be reused after deleting.</p><div><button class="btn small ghost" id="del" style="color:var(--bad)">Delete event</button></div></div>') +
      '<div class="stack"><h3>Receipts</h3><div class="panel list">' + (mine.length ? mine.map(function (l) { return '<div class="it"><span class="grow">' + esc(l.kind) + '<br><span class="small muted">' + new Date(l.at).toLocaleDateString('en-US') + (l.note ? ', ' + esc(l.note) : '') + '</span></span><span class="num">' + money(l.amount) + '</span></div>'; }).join('') : '<p class="muted">Purchases for this event show here.</p>') + '</div></div>';
  };
  TAB_BIND.extras = function (ev, save, rerender) {
    $$('[data-pack]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; var p = D.CREDIT_PACKS[+b.dataset.pack];
      buySheet({ name: p.credits + ' AI credits', price: p.price, desc: 'Prepaid credits for extra AI work on any of your events. No automatic top-ups.' }, ev, function () { var w = wallet(); w.credits += p.credits; saveWallet(w); rerender(); }); }); });
    $$('[data-pkg]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; var p = D.PACKAGES[+b.dataset.pkg];
      buySheet(p, ev, function () { if (p.id === 'concepts3') { ev.seen = (ev.seen || []).concat((ev.concepts || []).map(function (c) { return c.id; })); AI.concepts(ev, ev.seen).then(function (list) { ev.concepts = list; save(); location.hash = '#/e/' + ev.id + '/concepts'; }); } }); }); });
    $$('[data-add]').forEach(function (b) { b.addEventListener('click', function () { if (lockSample(ev)) return; buySheet(D.ADDONS[+b.dataset.add], ev, rerender); }); });
    var del = $('#del'); if (del) del.addEventListener('click', function () { sheet('<h3>Delete ' + esc(ev.name) + '?</h3><p class="muted">This can\u2019t be undone.</p><button class="btn block" id="yes" style="background:var(--bad);border-color:var(--bad)">Delete event</button><button class="btn ghost block" data-close>Keep it</button>', function (el, close) { $('#yes', el).addEventListener('click', function () { var all = events(); delete all[ev.id]; store.set('events', all); close(); toast('Event deleted'); location.hash = '#/events'; }); }); });
    var kx = $('#keepX'); if (kx) { kx.addEventListener('click', function () { keepSheet(ev, 'Keep your plan', rerender); }); return; }
    $('#upg').addEventListener('click', function () { if (lockSample(ev)) return; var cur = ev.paid.max || ev.guests; var nx = E.passFor(cur + 1); var due = Math.max(0, Math.round((nx.price - ev.paid.price) * 100) / 100);
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
  function guestPage(id) {
    var ev = getEvent(id);
    if (!ev) return frame('<div class="invite"><h2>This invitation isn’t available</h2><p class="muted">The host may have made it private. Ask them for a new link.</p></div>');
    var pl = ev.payLinks || {}; var split = ev.split || { people: [] }; var share = splitShare(ev);
    var payBtns = [pl.venmo ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://venmo.com/u/' + encodeURIComponent(pl.venmo) + '">Venmo</a>' : '', pl.cashapp ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://cash.app/$' + encodeURIComponent(pl.cashapp) + '">Cash App</a>' : '', pl.paypal ? '<a class="btn small ghost" target="_blank" rel="noopener" href="https://paypal.me/' + encodeURIComponent(pl.paypal) + '">PayPal</a>' : ''].join('');
    var hostView = !!events()[ev.id] || ev.sample;
    frame((hostView ? '<div class="note invite-host">You\u2019re previewing what guests see. <a href="' + (ev.sample ? '#/sample/' + ev.id.split('-')[1] : '#/e/' + ev.id) + '/invite">Back to your plan</a></div>' : '') + '<div class="invite"><div class="card">' + '<div class="swatch" aria-hidden="true">' + ev.concept.palette.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div><div class="in"><span class="muted">You’re invited to</span><h1>' + esc(ev.name) + '</h1><p>' + (ev.date ? esc(fmtDate(ev.date)) + (ev.time ? ' at ' + fmtTime(ev.time) : '') : 'Date to be announced') + '</p><p class="muted">' + esc(whereText(ev)) + '</p><p class="small muted">Dress code: ' + esc(E.dressCode(ev, ev.tier)) + '</p>' +
      (ev.date ? '<div><a class="btn small ghost" target="_blank" rel="noopener" href="' + calLink(ev) + '">Add to calendar</a></div>' : '') + '</div></div>' +
      '<form id="rsvp" class="panel stack" style="text-align:left"><h3>RSVP</h3><label class="field"><span>Your name</span><input class="input" id="rn" required autocomplete="name"></label><div class="seg" id="ans"><button type="button" data-v="yes" aria-pressed="true">I’ll be there</button><button type="button" data-v="declined" aria-pressed="false">Can’t make it</button></div>' +
      '<label class="field"><span>Plus-ones</span><input class="input num" type="number" min="0" max="5" id="rp" value="0"></label><div class="stack"><span class="muted small">Dietary needs</span><div class="chips" id="rd">' + D.DIETS.map(function (d) { return '<button type="button" class="chip" aria-pressed="false">' + esc(d) + '</button>'; }).join('') + '</div></div><button class="btn gold">Send RSVP</button></form>' +
      ((ev.polls || []).length ? '<div class="panel stack" style="text-align:left"><h3>Vote</h3>' + ev.polls.map(function (p, pi) { return '<b>' + esc(p.q) + '</b><div class="poll">' + p.options.map(function (o, oi) { return '<button data-vote="' + pi + ':' + oi + '"><span>' + esc(o.t) + '</span></button>'; }).join('') + '</div>'; }).join('') + '</div>' : '') +
      ((ev.registry.items || []).length || (ev.registry.funds || []).length ? '<div class="panel stack" style="text-align:left"><h3>Registry</h3><div class="list">' + ev.registry.items.map(function (it, i) { return '<div class="it"><span class="grow">' + esc(it.name) + (it.bought ? ' <span class="badge ok">Purchased</span>' : '') + '</span>' + (it.url ? '<a class="btn small ghost" target="_blank" rel="noopener" href="' + esc(it.url) + '">View</a>' : '') + (it.bought ? '' : '<button class="btn small" data-buy="' + i + '">I bought this</button>') + '</div>'; }).join('') +
        (ev.registry.funds || []).map(function (f) { return '<div class="it"><span class="grow">' + esc(f.name) + '</span>' + (payBtns || '<span class="muted small">Ask the host how to give</span>') + '</div>'; }).join('') + '</div></div>' : '') +
      (canSplit(ev) && share ? '<div class="panel stack" style="text-align:left"><h3>Your share</h3><p>Each person’s share is <b class="num">' + money(share) + '</b>.</p><div class="row">' + (payBtns || '<span class="muted small">The host will share how to pay.</span>') + '</div><p class="muted small">Payments go straight to the host.</p></div>' : '') +
      '<p class="muted small">Planned with Event Couture. <a href="#/new">Host your own event</a></p></div>', { noRibbon: false });
    $('#ans').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $$('#ans button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });
    $('#rd').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
    $('#rsvp').addEventListener('submit', function (e) { e.preventDefault(); var n = $('#rn').value.trim(); if (!n) return toast('Enter your name');
      var ans = $('#ans [aria-pressed="true"]').dataset.v; var plus = Math.max(0, +$('#rp').value || 0); var diet = $$('#rd [aria-pressed="true"]').map(function (b) { return b.textContent; });
      var cap = ev.paid && ev.paid.max ? Math.min(ev.guests, ev.paid.max) : ev.guests;
      var existing = ev.guestsList.find(function (g) { return g.name.toLowerCase() === n.toLowerCase(); });
      var g = existing || { id: uid(), name: n }; g.plusOnes = plus; g.diet = diet;
      if (!existing) ev.guestsList.push(g);
      g.status = ans; if (ans === 'yes' && E.placesUsed(ev.guestsList) > cap) g.status = 'waitlist';
      saveEvent(ev);
      $('#rsvp').innerHTML = '<h3>' + (g.status === 'yes' ? 'Thank you, see you there!' : g.status === 'waitlist' ? 'You’re on the waitlist' : 'Thanks for letting us know') + '</h3><p class="muted">' + (g.status === 'waitlist' ? 'The event is full right now. The host will let you know if a place opens up.' : (CFG.preview ? 'Your RSVP is saved. In this preview it stays on this device; at launch it goes straight to the host.' : 'Your RSVP was sent to the host.')) + '</p>';
    });
    $$('[data-vote]').forEach(function (b) { b.addEventListener('click', function () { var k = b.dataset.vote.split(':'); ev.polls[+k[0]].options[+k[1]].votes++; saveEvent(ev); b.closest('.poll').innerHTML = '<p class="muted">Thanks for voting.</p>'; }); });
    $$('[data-buy]').forEach(function (b) { b.addEventListener('click', function () { ev.registry.items[+b.dataset.buy].bought = true; saveEvent(ev); b.outerHTML = '<span class="badge ok">Purchased</span>'; }); });
  }

  /* ---------- vendor sign-up (structured, saved as you go) ---------- */
  var VFIELDS = [
    ['Business basics', [['name', 'Business name', 'text', 1], ['email', 'Business email', 'text', 1], ['phone', 'Business phone', 'text'], ['cats', 'Categories', 'cats', 1], ['bio', 'Short description', 'area', 1], ['years', 'Years in business', 'number'], ['site', 'Website or Instagram link', 'text']]],
    ['Service area', [['cities', 'Cities you serve', 'citylist', 1], ['radius', 'Travel radius (miles)', 'number', 1], ['travelFee', 'Travel fee (USD, 0 if none)', 'number']]],
    ['Packages and prices', [['pkgName', 'Main package name', 'text', 1], ['pkgIncl', 'What it includes', 'area', 1], ['priceType', 'How it’s priced', 'select:Fixed price|Starting at|Per person|Per hour', 1], ['price', 'Price (USD)', 'number', 1], ['minSpend', 'Minimum spend (USD)', 'number'], ['peak', 'Weekend or peak-season increase (%)', 'number'], ['overtime', 'Overtime rate per hour (USD)', 'number']]],
    ['Fees and payment terms', [['deposit', 'Deposit (% of total)', 'number', 1], ['schedule', 'When the balance is due', 'select:At booking|30 days before|14 days before|7 days before|On the day'], ['service', 'Service charge (%)', 'number'], ['tax', 'Do you charge sales tax?', 'select:Yes|No'], ['setupFee', 'Setup, delivery or cleanup fees (USD)', 'number']]],
    ['Capacity and logistics', [['minGuests', 'Smallest event you take (guests)', 'number', 1], ['maxGuests', 'Largest event you take (guests)', 'number', 1], ['setupTime', 'Setup time needed (hours)', 'number'], ['indoor', 'Where you work', 'select:Indoors and outdoors|Indoors only|Outdoors only']]],
    ['Booking and availability', [['lead', 'Book at least this many weeks ahead', 'number', 1], ['reply', 'Typical reply time', 'select:Within a few hours|Within a day|Within 2 to 3 days'], ['blocked', 'Dates you’re already booked (one per line)', 'area']]],
    ['Limitations and rules', [['notIncl', 'What’s not included', 'area', 1], ['rules', 'Rules (outside catering, alcohol, noise curfew, confetti or candles)', 'area']]],
    ['Policies', [['cancel', 'Cancellation and refund policy', 'area', 1], ['weather', 'Weather or rain plan', 'area']]],
    ['Style and portfolio', [['styles', 'Styles you do best', 'styles'], ['events', 'Event types you serve', 'types', 1], ['langs', 'Languages spoken', 'text']]],
    ['Trust', [['reviews', 'Link to your reviews elsewhere', 'text'], ['insured', 'Are you insured?', 'select:Yes|No|Not required for my service']]],
    ['Agreement', [['agree', 'I confirm my listed prices are accurate and I’ll keep them up to date', 'check', 1]]]
  ];
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
      var opts = f[2] === 'cats' ? Object.keys(D.CATEGORIES).filter(function (k) { return ['restaurantFood', 'restaurantDrinks', 'cakeFee', 'tableDecor', 'permits'].indexOf(k) < 0; }).map(function (k) { return D.CATEGORIES[k].name.split(' (')[0]; }) : f[2] === 'citylist' ? D.CITIES.map(function (c) { return c.name; }) : f[2] === 'styles' ? D.STYLES.map(function (s) { return s.name; }) : f[2] === 'types' ? D.EVENT_TYPES.map(function (t) { return t.name; }) : null;
      if (opts) return '<div class="chips" id="' + id + '" role="group" aria-label="' + esc(f[1]) + '" data-multi>' + opts.map(function (o) { return '<button type="button" class="chip" aria-pressed="' + ((val || []).indexOf(o) >= 0) + '">' + esc(o) + '</button>'; }).join('') + '</div>';
      return '<input class="input" id="' + id + '" aria-label="' + esc(f[1]) + '" value="' + esc(val || '') + '">';
    }
    var pct = Math.round(done() * 100);
    frame('<div class="wizard stack-lg"><div class="stack"><h2>List your business on Event Couture</h2><p class="muted">Listing is free. When the app launches, hosts planning events in your area will see your packages and prices inside their plans. Your progress saves on this device as you go.</p></div>' +
      '<div class="panel stack"><div class="row" style="justify-content:space-between"><b>Listing complete</b><span class="num" id="pct">' + pct + '%</span></div><div class="meter"><i id="bar" style="width:' + pct + '%"></i></div><p class="muted small">Complete listings with full prices will show first in hosts\u2019 plans.</p>' +
      '</div>' +
      VFIELDS.map(function (s) { return '<fieldset class="panel stack" style="border:1px solid var(--line)"><legend class="display" style="font-size:1.15rem;padding:0 6px">' + esc(s[0]) + '</legend>' + s[1].map(function (f) { return f[2] === 'check' ? input(f) : '<div class="field"><span>' + esc(f[1]) + (f[3] ? '' : ' (optional)') + '</span>' + input(f) + '</div>'; }).join('') + '</fieldset>'; }).join('') +
      '<button class="btn gold block" id="submit">Publish my listing</button><p class="muted small">You can update prices anytime. We’ll email you every few months to keep them current.</p></div>');
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
      v.published = new Date().toISOString(); store.set('vendor', v);
      sheet('<h3>Your listing is ready</h3><p class="muted">' + (CFG.preview ? 'Preview version: listings go live for hosts when the app launches.' : 'Hosts planning events in your area can now see your packages.') + '</p><button class="btn block" data-close>Done</button>'); });
  }

  /* ---------- help assistant ---------- */
  var FAQ = [
    ['How much does it cost?', 'You pay once per event, based on how many people you invite: $9.99 up to 25 guests, $19.99 up to 75, $39.99 up to 150, $69.99 up to 350, and more for larger events. Guests never pay to view, RSVP or vote.', 'price cost pay pass much'],
    ['What if my guest list grows?', 'Move up a size under Overview, Your pass. You pay only the difference, and your plan stays exactly as it is.', 'grow more guests upgrade capacity bigger'],
    ['Can I get a refund?', 'Planning is free, so you see your whole plan before you pay. If something you paid for doesn\u2019t work, contact us and we\u2019ll make it right. Purchases made in the iPhone or Android app are refunded through Apple or Google from your purchase history.', 'refund money back cancel charged'],
    ['How do I contact you?', CFG.supportEmail ? 'Email us at ' + CFG.supportEmail + '. We reply within one business day.' : 'Start with the answers on this page. If you still need help, use the contact details on the Event Couture website.', 'contact support email phone talk person help reach'],
    ['Is my data safe?', 'Yes. Your plans, guest lists and photos stay on your device. To create your concepts, your details and inspiration go through our server to Google\u2019s AI and aren\u2019t kept by Event Couture. We never sell your data, and guest details are never shown to vendors. See Privacy for the details.', 'safe secure privacy data private sell share'],
    ['How long do I keep my plan?', 'Until 12 months after you keep it, or 30 days after your event, whichever is later. The exact date is shown before you pay and under Overview, Your pass.', 'expire expiry how long access keep'],
    ['Are the prices real?', 'Each price is labeled. Planning estimates are sized to your city and guest count and include tax, service charges and tips. Vendor-published prices, quotes and bookings are marked as such. Add any quote you get under Budget & bookings, Add quote or booking.', 'real accurate estimate price quote'],
    ['Do my guests need the app?', 'No. Once accounts launch, guests open your invite link in any browser to see the details, RSVP, vote and view the registry. Right now the link previews on your own device.', 'guests app download link rsvp'],
    ['How does cost splitting work?', 'Add your Venmo, Cash App or PayPal under Invite and registry. Each person sees their share and pays you directly; you tick them off as paid. Event Couture never holds the money.', 'split venmo cash share pay'],
    ['How do I add a co-host?', 'Open Guests & invitations, Guests, and add them under Co-hosts. Choose whether they can edit, edit without seeing the budget, or only view and vote.', 'cohost co-host partner share plan'],
    ['Can I change my concept?', 'Yes. Open Overview, Change concept. You can also see three different concepts once, for free.', 'concept theme change different'],
    ['How do I delete my data?', 'Open the event, go to Overview, Your pass, and choose Delete event. The plan, guest list and photos are removed from your device.', 'delete data privacy remove account'],
    ['How do vendors join?', 'Vendors list their business for free at For vendors, with packages, prices and policies. Listings appear to hosts planning events in their area once the app launches.', 'vendor business list join']
  ];
  function help() {
    frame('<div class="wizard stack-lg"><div class="stack"><h2>Help</h2><p class="muted">Ask a question or pick one below. Answers come from the help center and your own events.</p></div>' +
      '<div class="panel stack"><div class="chat" id="chat"></div><form id="ask" class="row"><input class="input" aria-label="Your question" id="q" style="flex:1 1 220px" placeholder="Type your question" autocomplete="off"><button class="btn">Ask</button></form></div>' +
      '<div class="stack">' + FAQ.map(function (f) { return '<details class="panel"><summary style="cursor:pointer;font-weight:500">' + esc(f[0]) + '</summary><p class="muted" style="margin-top:10px">' + esc(f[1]) + '</p></details>'; }).join('') + '</div></div>');
    $('#ask').addEventListener('submit', function (e) { e.preventDefault(); var q = $('#q').value.trim(); if (!q) return;
      var STOP = ['how', 'the', 'can', 'get', 'you', 'what', 'does', 'and', 'for', 'are', 'with', 'this', 'that', 'there', 'when', 'why', 'who', 'will', 'your', 'about'];
      var words = q.toLowerCase().split(/\W+/).filter(function (w) { return STOP.indexOf(w) < 0; }); var best = FAQ.map(function (f) { return { f: f, s: words.filter(function (w) { return w.length > 2 && f[2].indexOf(w) >= 0; }).length }; }).sort(function (a, b) { return b.s - a.s; })[0];
      var a = best.s ? best.f[1] : 'I couldn’t find an answer to that. Try asking about pricing, refunds, guests, co-hosts, cost splitting, how long you keep your plan, or deleting your data.';
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
