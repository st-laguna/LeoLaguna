// Shared before first paint. Layout depends on geometry, never device identity.
(() => {
  const root = document.documentElement;
  // Device identity only gates iPad fixes; existing layout breakpoints stay intact.
  root.toggleAttribute('data-ipad', /iPad/.test(navigator.userAgent) ||
    (/Mac/.test(navigator.platform || navigator.userAgent) && navigator.maxTouchPoints > 1));
  const tablet = matchMedia('(min-width:701px) and (max-width:1400px) and (orientation:portrait)');
  const portrait = matchMedia('(orientation:portrait)');
  if (root.hasAttribute('data-ipad')) {
    // Keep the scroll runway independent of Safari's browser chrome. Read the
    // authored small viewport only at startup and after a window-width change.
    let layoutWidth = innerWidth, viewportTimer;
    function measureViewport() {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
      root.append(probe);
      const height = probe.getBoundingClientRect().height;
      probe.remove();
      if (height > 0) root.style.setProperty('--ipad-svh', `${height / 100}px`);
      layoutWidth = innerWidth;
    }
    function resizeViewport() {
      if (innerWidth === layoutWidth) return;
      clearTimeout(viewportTimer);
      viewportTimer = setTimeout(() => {
        if (innerWidth === layoutWidth) return;
        measureViewport();
        window.dispatchEvent(new Event('leo:ipad-viewport-ready'));
      }, 180);
    }
    measureViewport();
    window.addEventListener('resize', resizeViewport, { passive: true });
    window.addEventListener('pageshow', resizeViewport);
  }
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
