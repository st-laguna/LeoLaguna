(() => {
  const root = document.documentElement;
  const ipad = /iPad/.test(navigator.userAgent) || (/Mac/.test(navigator.platform || navigator.userAgent) && navigator.maxTouchPoints > 1);
  root.toggleAttribute('data-ipad', ipad);
  root.toggleAttribute('data-ios', ipad || /iPhone|iPod/.test(navigator.userAgent));
  const tablet = matchMedia('(min-width:701px) and (max-width:1100px) and (orientation:portrait)');
  const portrait = matchMedia('(orientation:portrait)');
  let timer;
  function apply() {
    root.toggleAttribute('data-ipad-portrait', ipad && portrait.matches);
    root.toggleAttribute('data-tablet-portrait', ipad ? portrait.matches : tablet.matches);
  }
  function resize() {
    apply();
    clearTimeout(timer);
    timer = setTimeout(() => {
      window.dispatchEvent(new Event('leo:ipad-layout'));
      window.dispatchEvent(new Event('leo:orientation-ready'));
    }, 150);
  }
  apply();
  portrait.addEventListener('change', resize);
  tablet.addEventListener('change', resize);
  window.addEventListener('DOMContentLoaded', apply, {once:true});
  window.addEventListener('pageshow', apply);
})();
