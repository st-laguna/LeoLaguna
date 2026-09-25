(() => {
  const root = document.documentElement;
  const ipad = /iPad/.test(navigator.userAgent) || (/Mac/.test(navigator.platform || navigator.userAgent) && navigator.maxTouchPoints > 1);
  root.toggleAttribute('data-ipad', ipad);
  const tablet = matchMedia('(min-width:701px) and (max-width:1100px) and (orientation:portrait)');
  let timer, revision = 0, rotating = false, anchor;
  function orientation() {
    const type = screen.orientation?.type;
    return type ? type.startsWith('portrait') : typeof window.orientation === 'number' ? Math.abs(window.orientation) % 180 === 0 : screen.height > screen.width;
  }
  let lastOrientation = orientation();
  function apply() {
    root.toggleAttribute('data-ipad-portrait', ipad && orientation());
    root.toggleAttribute('data-tablet-portrait', ipad ? orientation() : tablet.matches);
  }
  apply();
  function settle() {
    const token = ++revision;
    clearTimeout(timer);
    timer = setTimeout(() => {
      root.setAttribute('data-ipad-settling','');
      apply();
      window.dispatchEvent(new Event('leo:ipad-layout'));
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (token !== revision) return;
        if (anchor?.element.isConnected) {
          const element = anchor.element;
          const top = element.getBoundingClientRect().top + scrollY;
          window.scrollTo({ top: top + anchor.progress * Math.max(0, element.offsetHeight - innerHeight), behavior: 'instant' });
        }
        window.dispatchEvent(new Event('leo:orientation-ready'));
        root.removeAttribute('data-ipad-rotating');
        root.removeAttribute('data-ipad-settling');
        rotating = false; anchor = null;
      }));
    }, 320);
  }
  function rotate() {
    if (!ipad) { apply(); window.dispatchEvent(new Event('leo:ipad-layout')); return; }
    if (!rotating) {
      const sections = [...document.querySelectorAll('.home-journey,#work,#brands,#contact,[data-about]')];
      const element = sections.find(e => {const r=e.getBoundingClientRect();return r.top <= innerHeight*.5 && r.bottom > innerHeight*.5;});
      if (element) anchor = {element, progress:Math.max(0,Math.min(1,-element.getBoundingClientRect().top / Math.max(1,element.offsetHeight-innerHeight)))};
      rotating = true;
      root.setAttribute('data-ipad-rotating','');
    }
    root.removeAttribute('data-ipad-settling');
    lastOrientation = orientation(); settle();
  }
  window.addEventListener('orientationchange', rotate);
  screen.orientation?.addEventListener('change', rotate);
  window.addEventListener('resize', () => {
    if (ipad && (rotating || orientation() !== lastOrientation)) rotate();
  });
  tablet.addEventListener('change', () => {if (!ipad) rotate();});
  window.addEventListener('pageshow', apply);
})();
