// Shared before first paint. Layout depends on geometry, never device identity.
(() => {
  const root = document.documentElement;
  const tablet = matchMedia('(min-width:701px) and (max-width:1100px) and (orientation:portrait)');
  const portrait = matchMedia('(orientation:portrait)');
  let timer;
  function apply() { root.toggleAttribute('data-tablet-portrait', tablet.matches); }
  function resize() {
    apply();
    clearTimeout(timer);
    timer = setTimeout(() => window.dispatchEvent(new Event('leo:orientation-ready')), 180);
  }
  apply();
  tablet.addEventListener('change', resize);
  portrait.addEventListener('change', resize);
  window.addEventListener('pageshow', apply);
})();
