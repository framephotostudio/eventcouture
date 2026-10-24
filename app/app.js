/* Event Couture app: bottom tab bar, Android back button, offline notice and store review prompt. */
(function () {
  'use strict';
  var N = window.ECNative || {}, Cap = window.Capacitor || null, P = (Cap && Cap.Plugins) || {};
  var I = {
    home: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z"/>',
    inspo: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.5L12 15l-1.8-4.5L5.5 9l4.7-1.4z"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    plan: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
    events: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.5"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>'
  };
  var TABS = [['home', 'Home', '#/'], ['inspo', 'Inspiration', '#/inspiration/all'], ['plan', 'Plan', '#/new'], ['events', 'My events', '#/events'], ['help', 'Help', '#/help']];
  var bar = document.createElement('nav'); bar.className = 'tab-ec'; bar.setAttribute('aria-label', 'Main');
  bar.innerHTML = TABS.map(function (t) { return '<a href="' + t[2] + '" data-tab="' + t[0] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[t[0]] + '</svg><span>' + t[1] + '</span></a>'; }).join('');
  document.body.appendChild(bar);
  function which() {
    var h = location.hash || '#/';
    if (/^#\/inspiration/.test(h)) return 'inspo';
    if (/^#\/new/.test(h)) return 'plan';
    if (/^#\/(events|e\/)/.test(h)) return 'events';
    if (/^#\/help/.test(h)) return 'help';
    if (h === '#/' || h === '#' || h === '') return 'home';
    return '';
  }
  function mark() { var w = which(); Array.prototype.forEach.call(bar.querySelectorAll('a'), function (a) { if (a.dataset.tab === w) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }
  window.addEventListener('hashchange', mark); mark();
  /* Android back button: close a pop-up first, then go back, and leave the app from Home. */
  try {
    if (P.App) P.App.addListener('backButton', function () {
      var sheet = document.querySelector('.sheet-back'); if (sheet) { var c = sheet.querySelector('[data-close]'); if (c) c.click(); else sheet.remove(); return; }
      if (which() === 'home') P.App.exitApp(); else history.back();
    });
  } catch (e) {}
  /* Offline: plans, drafts and samples still open; new concepts and venue searches need a connection. */
  var note = document.createElement('div'); note.className = 'offline-ec'; note.setAttribute('role', 'status'); note.hidden = true;
  note.textContent = 'You’re offline. Your plans still open; new concepts and venue searches come back when you reconnect.';
  document.body.appendChild(note);
  function net(on) { note.hidden = !!on; }
  try { if (P.Network) { P.Network.getStatus().then(function (s) { net(s.connected); }); P.Network.addListener('networkStatusChange', function (s) { net(s.connected); }); } else { window.addEventListener('online', function () { net(true); }); window.addEventListener('offline', function () { net(false); }); } } catch (e) {}
  /* Ask for a store rating once, after a host keeps her third plan (never on first use). */
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('#keepPay')) return;
    try { var n = +(localStorage.getItem('ec.kept') || 0) + 1; localStorage.setItem('ec.kept', n); if (n === 3 && P.InAppReview) setTimeout(function () { P.InAppReview.requestReview(); }, 1500); } catch (x) {}
  }, true);
})();
