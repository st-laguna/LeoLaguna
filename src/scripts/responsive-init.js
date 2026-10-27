// Shared before first paint. Layout depends on geometry, never device identity.
(() => {
  const root = document.documentElement;
  // Native iPad identity and tablet-shaped previews share the mobile composition.
  root.toggleAttribute('data-ipad', /iPad/.test(navigator.userAgent) ||
    (/Mac/.test((navigator.platform || '') + ' ' + navigator.userAgent) && navigator.maxTouchPoints > 1));
  // Every viewport selects an approved composition before its first paint.
  const tablet = matchMedia(tabletPortraitMedia);
  const compactViewport = matchMedia(compactLayoutMedia);
  const phoneViewport = matchMedia(phoneLayoutMedia);
  const tabletLandscape = matchMedia(tabletLandscapeMedia);
  root.toggleAttribute('data-tablet-layout',root.hasAttribute('data-ipad')||tablet.matches||tabletLandscape.matches);
  const ipadPreview = new URLSearchParams(location.search).get('layout') === 'ipad-portrait';
  root.toggleAttribute('data-adaptive-hero', (compactViewport.matches || ipadPreview || root.hasAttribute('data-tablet-layout')) && ['/', '/index.html'].includes(location.pathname));
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
  const largeLandscape = matchMedia('(min-width:1367px) and (min-height:701px) and (orientation:landscape)');
  const touch = matchMedia('(any-pointer:coarse)');
  let dynamicTimer, lastHeight=0;
  function dynamicViewport() {
    const liveViewport=window.visualViewport;
    if(!liveViewport || Math.abs(liveViewport.scale-1)<.01){
      root.style.setProperty('--live-viewport-height', (liveViewport?.height || innerHeight)+'px');
      root.style.setProperty('--live-viewport-top', (liveViewport?.offsetTop || 0)+'px');
    }
    if (!root.hasAttribute('data-large-tablet-landscape')) return;
    const viewport=window.visualViewport;
    if (viewport && Math.abs(viewport.scale-1)>.01) return;
    const height=viewport?.height || innerHeight;
    if(Math.abs(height-lastHeight)<1)return;
    lastHeight=height;
    root.style.setProperty('--tablet-viewport', `${height}px`);
    clearTimeout(dynamicTimer);
    dynamicTimer=setTimeout(()=>window.dispatchEvent(new Event('leo:tablet-viewport-ready')),220);
  }
  let previousLayout;
  let previousHeroLayout;
  function apply() {
    const tabletLayout=root.hasAttribute('data-ipad')||tablet.matches||tabletLandscape.matches;
    root.toggleAttribute('data-tablet-layout',tabletLayout);
    root.toggleAttribute('data-adaptive-hero',(compactViewport.matches||ipadPreview||tabletLayout)&&['/','/index.html'].includes(location.pathname));
    root.toggleAttribute('data-tablet-portrait', tablet.matches || root.hasAttribute('data-ipad')&&portrait.matches);
    // This composition is exclusive to the iPad home page; inner routes retain their layouts.
    root.toggleAttribute('data-ipad-home', (tabletLayout || ipadPreview) && portrait.matches && ['/', '/index.html'].includes(location.pathname));
    const large=largeLandscape.matches && tabletLayout;
    root.toggleAttribute('data-large-tablet-landscape',large);
    const family=root.hasAttribute('data-ipad')||ipadPreview?'tablet':phoneViewport.matches?'phone':tabletLayout?'tablet':'desktop';
    root.dataset.layoutFamily=family;
    root.dataset.layoutOrientation=portrait.matches?'portrait':'landscape';
    root.toggleAttribute('data-layout-short',innerHeight<501);
    const key=family+':'+root.dataset.layoutOrientation+':'+tabletLayout;
    if(previousLayout!==undefined&&previousLayout!==key)window.dispatchEvent(new CustomEvent('leo:layout-change',{detail:{family,previous:previousLayout}}));
    previousLayout=key;
    const heroKey=root.hasAttribute('data-adaptive-hero')+':'+root.hasAttribute('data-ipad-home')+':'+root.dataset.layoutOrientation;
    if(previousHeroLayout!==undefined && previousHeroLayout!==heroKey){
      document.querySelector('.hero')?.removeAttribute('data-hero-layout-ready');
      window.dispatchEvent(new Event('leo:hero-layout-change'));
    }
    previousHeroLayout=heroKey;
    if(large)dynamicViewport();else {clearTimeout(dynamicTimer);lastHeight=0;root.style.removeProperty('--tablet-viewport');}
  }
  largeLandscape.addEventListener('change',resize);
  touch.addEventListener('change',resize);
  window.visualViewport?.addEventListener('resize',dynamicViewport,{passive:true});
  window.visualViewport?.addEventListener('scroll',dynamicViewport,{passive:true});
  window.addEventListener('resize',dynamicViewport,{passive:true});
  function resize() {
    apply();
    // Shared with ipad-device.js, regardless of which initializer runs first.
    clearTimeout(window.__leoOrientationReadyTimer);
    window.__leoOrientationReadyTimer = setTimeout(() => window.dispatchEvent(new Event('leo:orientation-ready')), 180);
  }
  apply();dynamicViewport();
  tablet.addEventListener('change', resize);
  portrait.addEventListener('change', resize);
  tabletLandscape.addEventListener('change', resize);
  compactViewport.addEventListener('change',resize);
  phoneViewport.addEventListener('change',resize);
  window.addEventListener('pageshow', apply);
})();
