/* Event Couture analytics: Google Analytics 4, the same property as Face Couture, so both sites show up together
   (every Event Couture event carries app_name = event_couture, and pages live under /eventcouture/).
   Only page names, button names and general choices are sent: never names, guest lists, photos, typed descriptions or
   event ids. Nothing is sent when the browser asks not to be tracked, or anywhere but the live site. */
(function () {
  'use strict';
  var GA_ID = 'G-JNY27DLF0Z';
  var noop = function () {};
  window.ecTrack = noop;
  try {
    var live = /(^|\.)facecouture\.app$/.test(location.hostname);
    var optOut = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
    if (!live || optOut || !/^G-[A-Z0-9]{6,}$/.test(GA_ID)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    var app = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    var platform = app ? (window.Capacitor.getPlatform ? window.Capacitor.getPlatform() : 'app') : 'web';
    /* GA reads the page title and address on every event; both can hold an event's name or id, so we always give it clean ones. */
    function clean() { var path = pagePath(); var t = 'Event Couture ' + path.replace('/eventcouture/', '').replace(/\//g, ' / '); gtag('set', { page_title: t, page_location: location.origin + path, page_path: path, page_referrer: '' }); return { path: path, title: t }; }
    gtag('js', new Date());
    gtag('config', GA_ID, { send_page_view: false, page_title: 'Event Couture', page_location: location.origin + '/eventcouture/', allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(s);

    /* one tap = one event */
    var last = {};
    function track(name, params) {
      try {
        var p = {}; Object.keys(params || {}).forEach(function (k) { if (params[k] !== undefined && params[k] !== null && params[k] !== '') p[k] = typeof params[k] === 'string' ? params[k].slice(0, 90) : params[k]; });
        p.app_name = 'event_couture'; p.app_platform = platform;
        var key = name + JSON.stringify(p), now = Date.now(); if (last[key] && now - last[key] < 800) return; last[key] = now;
        clean(); gtag('event', name, p);
      } catch (e) {}
    }
    window.ecTrack = track;

    /* Pages: hash routes become readable paths with no event ids, e.g. #/e/abc123/budget -> /eventcouture/plan/budget */
    function pagePath() {
      var h = (location.hash || '#/').slice(1).split('/').filter(Boolean), out = [];
      if (!h.length) out = ['home'];
      else if (h[0] === 'e') out = ['plan', h[2] || 'overview'];
      else if (h[0] === 'new') out = ['new', 'step-' + (h[1] || 1)];
      else if (h[0] === 'g') out = ['guest-page'];
      else if (h[0] === 'sample') out = ['sample', h[1] || '0', h[2] || 'overview'];
      else if (h[0] === 'inspiration') out = ['inspiration', h[1] || 'all'];
      else out = [h[0]];
      return '/eventcouture/' + out.join('/');
    }
    var lastPath = '';
    function pageView() {
      var c = clean(); if (c.path === lastPath) return; lastPath = c.path;
      gtag('event', 'page_view', { page_path: c.path, page_location: location.origin + c.path, page_title: c.title, app_name: 'event_couture', app_platform: platform });
    }
    window.addEventListener('hashchange', pageView); window.addEventListener('load', pageView);
    if (app) track('app_open');

    /* Taps, counted by what was tapped (never by what was typed). */
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target : null; if (!t) return; var b;
      var page = pagePath();
      if (b = t.closest('#ifilter [data-t]')) track('inspiration_filter', { occasion: b.dataset.t || 'all' });
      else if (b = t.closest('[data-inspo]')) track('inspiration_open', { photo: b.dataset.inspo });
      else if (b = t.closest('a.icard.more')) track('inspiration_see_all');
      else if (b = t.closest('#browseInspo, [data-scroll=inspo]')) track('inspiration_browse', { from: page });
      else if (b = t.closest('a[href^="#/sample/"]')) track('sample_open', { sample: (b.getAttribute('href').split('/')[2] || '') });
      else if (b = t.closest('a[href="#/new"]')) track('plan_start_click', { from: page });
      else if (b = t.closest('#speak')) track('voice_input');
      else if (b = t.closest('#later')) track('save_for_later', { step: page });
      else if (b = t.closest('#more')) track('concepts_more');
      else if (b = t.closest('#keepBtn, [data-keep]')) track('keep_plan_open', { from: page });
      else if (b = t.closest('#cmpLevels')) track('levels_compare');
      else if (b = t.closest('[data-pick]')) track('level_chosen', { level: b.dataset.pick });
      else if (b = t.closest('[data-pickwhere]')) track('where_chosen', { setting: b.dataset.pickwhere });
      else if (b = t.closest('[data-live]')) track('venues_view', { kind: b.dataset.live });
      else if (b = t.closest('.new-venue a')) track('new_venue_click', { venue: (b.closest('.new-venue').querySelector('b') || {}).textContent, link: /maps/.test(b.href) ? 'map' : 'website' });
      else if (b = t.closest('a[href*="amazon.com"], a[href*="etsy.com"]')) track('shop_click', { store: /amazon/.test(b.href) ? 'amazon' : 'etsy', list: b.closest('.get-look') ? 'get_this_look' : 'table_basics', item: (b.closest('.it, .prod') && (b.closest('.it, .prod').querySelector('b') || {}).textContent) || '' });
      else if (b = t.closest('a[href*="spotify.com"], a[href*="music.apple.com"]')) track('song_play', { service: /spotify/.test(b.href) ? 'spotify' : 'apple_music' });
      else if (b = t.closest('#copySongs')) track('playlist_copy');
      else if (b = t.closest('#allSongs')) track('playlist_show_all');
      else if (b = t.closest('a[href*="google.com/maps"]')) track('map_open', { from: page });
      else if (b = t.closest('a[href$="/vendors"]')) track('find_pro_click', { from: page });
      else if (b = t.closest('#copy')) track('invite_copy');
      else if (b = t.closest('#seat')) track('seating_made');
      else if (b = t.closest('#bulk')) track('guests_paste');
      else if (b = t.closest('#upg')) track('pass_upgrade_open');
      else if (b = t.closest('.sister')) track('face_couture_click', { from: page });
      else if (b = t.closest('#del')) track('event_delete_open');
      else if (b = t.closest('.rail a, .groupbar a')) track('plan_section', { to: (b.getAttribute('href') || '').split('/').pop() });
    }, true);
    document.addEventListener('submit', function (e) {
      var f = e.target; if (!f || !f.id) return;
      if (f.id === 'ask') track(location.hash.indexOf('#/help') === 0 ? 'help_question' : 'concierge_change');
      else if (f.id === 'rsvp') track('rsvp_sent');
      else if (f.id === 'vfilter') track('venue_area_filter');
      else if (f.id === 'addg') track('guest_added');
    }, true);
    document.addEventListener('change', function (e) {
      var t = e.target; if (!t) return;
      if (t.id === 'files' && t.files && t.files.length) track('photo_uploaded', { count: t.files.length });
      else if (t.id === 'alb' && t.files && t.files.length) track('album_photos_added', { count: t.files.length });
      else if (t.matches && t.matches('[data-ck]') && t.checked) track('checklist_done');
    }, true);
  } catch (e) { window.ecTrack = noop; }
})();
