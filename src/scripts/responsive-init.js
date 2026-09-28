// Shared before first paint. Layout depends on geometry, never device identity.
(() => {
  const root = document.documentElement;
  // Device identity only gates iPad fixes; existing layout breakpoints stay intact.
  root.toggleAttribute('data-ipad', /iPad/.test(navigator.userAgent) ||
    (/Mac/.test(navigator.platform || navigator.userAgent) && navigator.maxTouchPoints > 1));
  const tablet = matchMedia('(min-width:701px) and (max-width:1400px) and (orientation:portrait)');
  const portrait = matchMedia('(orientation:portrait)');
  function apply() { root.toggleAttribute('data-tablet-portrait', tablet.matches); }
  function resize() {
    apply();
    // Shared with ipad-device.js, regardless of which initializer runs first.
    clearTimeout(window.__leoOrientationReadyTimer);
    window.__leoOrientationReadyTimer = setTimeout(() => window.dispatchEvent(new Event('leo:orientation-ready')), 180);
  }
  apply();
  tablet.addEventListener('change', resize);
  portrait.addEventListener('change', resize);
  window.addEventListener('pageshow', apply);
})();
