/* Event Couture app bridge, loaded first: native share sheet, links opening in an in-app browser,
   light haptics, status bar and splash. Everything else is the same code as the website. */
(function () {
  'use strict';
  document.documentElement.classList.add('ec-app');
  var Cap = window.Capacitor || null, P = (Cap && Cap.Plugins) || {};
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  function tap(style) { try { if (isNative && P.Haptics) P.Haptics.impact({ style: style || 'LIGHT' }); } catch (e) {} }
  function openLink(url) {
    if (!/^https?:/i.test(url)) return false;
    try { if (P.Browser) { P.Browser.open({ url: url, presentationStyle: 'popover', toolbarColor: '#FAF8F4' }); return true; } } catch (e) {}
    return false;
  }
  window.ECNative = { isNative: isNative, tap: tap, open: openLink, platform: isNative && Cap.getPlatform ? Cap.getPlatform() : 'web' };
  if (!isNative) return;
  /* Store, map, music and venue links open in an in-app browser, so hosts come straight back to their plan. */
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('a[href]'); if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^mailto:|^tel:|^sms:/i.test(href)) return;   /* the phone handles these */
    if (/^https?:/i.test(href) && openLink(a.href)) { ev.preventDefault(); tap('LIGHT'); }
  }, true);
  var winOpen = window.open; window.open = function (u) { if (u && openLink(String(u))) return null; return winOpen.apply(window, arguments); };
  /* Sharing (invites, song lists) uses the phone's own share sheet. */
  var nativeShare = function (data) { data = data || {}; return P.Share ? P.Share.share({ title: data.title, text: data.text, url: data.url, dialogTitle: data.title || 'Share' }).catch(function (e) { if (!/cancel/i.test(String(e && e.message || e))) throw e; }) : Promise.reject(new Error('share unavailable')); };
  try { Object.defineProperty(navigator, 'share', { value: nativeShare, configurable: true }); Object.defineProperty(navigator, 'canShare', { value: function () { return true; }, configurable: true }); } catch (e) {}
  /* light haptic on choices */
  document.addEventListener('click', function (ev) { var el = ev.target && ev.target.closest && ev.target.closest('.chip,.btn,.icard,.tab-ec a,[data-pick],[data-i]'); if (el) tap(el.classList.contains('gold') ? 'MEDIUM' : 'LIGHT'); }, true);
  try { if (P.StatusBar) { P.StatusBar.setStyle({ style: 'LIGHT' }); if (P.StatusBar.setBackgroundColor) P.StatusBar.setBackgroundColor({ color: '#FAF8F4' }); } } catch (e) {}
  try { if (P.SplashScreen) setTimeout(function () { P.SplashScreen.hide(); }, 350); } catch (e) {}
})();
