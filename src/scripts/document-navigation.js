// Inlined in each document's head, alongside the shared motion functions.
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
// Interactive can still precede deferred modules; their responsive layout and
// ScrollTriggers must exist before resolving a cross-document section anchor.
const documentReady = document.readyState === 'complete' ? Promise.resolve()
  : new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once:true}));
// A network/module failure is different from a slow, still valid download.
let rejectInitialization;
const initializationFailed = new Promise((_, reject) => { rejectInitialization = reject; });
void initializationFailed.catch(() => {});
window.addEventListener('error', event => {
  if (event.target instanceof HTMLScriptElement && event.target.type === 'module') {
    rejectInitialization(new Error('A navigation module could not load.'));
  // Optional 3D/assets and browser extensions can report global errors before
  // load completes. Their owners recover independently; they do not invalidate
  // the destination document or its explicit About readiness signal.
  }
}, true);
let themeInitialized = false;
function restorePreferences() {
  try {
    root.lang = localStorage.getItem('leo-language') === 'es' ? 'es' : 'en';
  } catch {
    root.lang = 'en';
  }
  // Every document entry starts light. Later reveals must preserve toggle input.
  if(!themeInitialized){
    root.dataset.globalTheme='light';
    root.dataset.theme='light';
    themeInitialized=true;
  }
}
restorePreferences();
// Prepare only the destination document on explicit pointer/keyboard intent.
// The 3D runtime is never imported or instantiated in Home/CV.
let aboutPrefetched = false;
function prefetchAbout(event) {
  if (aboutPrefetched || navigator.connection?.saveData) return;
  const link = event.target instanceof Element && event.target.closest('a[href]');
  if (!link) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.pathname !== '/about/' || location.pathname === '/about/') return;
  aboutPrefetched = true;
  const hint = document.createElement('link');
  hint.rel = 'prefetch'; hint.href = url.href; hint.as = 'document';
  document.head.append(hint);
}
document.addEventListener('pointerover', prefetchAbout, {passive:true});
document.addEventListener('focusin', prefetchAbout);
const navType = performance.getEntriesByType('navigation')[0]?.type;
const sectionHistory = ['/', '/index.html'].includes(location.pathname);
const entryDestination = sectionHistory && ['#work', '#featured-works', '#contact'].includes(location.hash) ? location.hash : null;
if (sectionHistory) {
  root.setAttribute('data-section-history', '');
  history.scrollRestoration = 'manual';
}
// A retry belongs to the failed destination operation. Carry that intent across
// its reload without changing ordinary reloads, URLs, or history entries.
let retryDestination = null;
try {
  const retry = sessionStorage.getItem('leo-destination-retry');
  sessionStorage.removeItem('leo-destination-retry');
  if (navType === 'reload' && retry === location.href && ['#work', '#featured-works', '#contact'].includes(location.hash)) {
    retryDestination = location.hash;
  }
} catch { /* Storage can be unavailable; the browser can still reload. */ }
try {
  const pending = JSON.parse(sessionStorage.getItem('leo-page-destination') || 'null');
  sessionStorage.removeItem('leo-page-destination');
  if (navType !== 'reload' && pending?.path === location.pathname && Date.now()-pending.time < 30000) {
    root.setAttribute('data-cross-page', '');
    if (pending.projectReturn) root.setAttribute('data-project-return', '');
  }
} catch { /* Navigation and preferences still work without storage. */ }
if (navType === 'back_forward') root.setAttribute('data-cross-page', '');
let activeTransition, activeNavigation, entrance, arrowEntrance, timer, coverage;
let navigationId = 0, restoredFromCache = false;
let animations = [];
let aboutCovering = false;
let physicalNavigationStyle;
function ownPhysicalNavigation() {
  if(physicalNavigationStyle)return;
  physicalNavigationStyle=document.createElement('style');
  physicalNavigationStyle.textContent='@view-transition { navigation: none; }';
  document.head.append(physicalNavigationStyle);
}
let coveredNavigationDuration=650;
let mobileWorkWipe = null;
const workWipeOptions = DOUBLE_SWEEP;
const workWipeFrames = doubleSweepFrames;
// About reports actual scene readiness to the shared navigation coordinator.
if (root.dataset.page === 'about') {
  window.__leoAboutReady = new Promise(resolve => {
    if (root.hasAttribute('data-about-ready')) resolve();
    else window.addEventListener('leo:about-ready', resolve, {once:true});
  });
  // Direct visits and browsers without cross-document snapshots share the gate.
  // Native navigation removes this cover only after the scene has rendered.
  root.setAttribute('data-page-transition','');
  coverNavigation(); coverage.style.background = 'var(--page-transition-contrast, #000)';
}
function coverNavigation() {
  if (!coverage?.isConnected) {
    coverage = document.createElement('div');
    coverage.dataset.navigationCoverage = '';
    coverage.setAttribute('aria-hidden', 'true');
    Object.assign(coverage.style, {
      position:'fixed', inset:'0', zIndex:'2147483647',
      background:'var(--foreground, #1C1C1C)', pointerEvents:'auto',
    });
    // A dialog is in the browser's top layer, above any root z-index.
    // Cross-page menu navigation must cover that dialog before handing off.
    (document.querySelector('dialog[open]') || root).append(coverage);
  }
}
// Read at first paint AND lifecycle restoration: BFCache does not rerun the head.
function restoreCoveredNavigation() {
  try {
    const pending=JSON.parse(sessionStorage.getItem('leo-covered-navigation')||'null');
    if(pending?.path!==location.pathname||Date.now()-pending.time>=30000)return false;
    sessionStorage.removeItem('leo-covered-navigation');
    root.setAttribute('data-covered-navigation-entry','');root.setAttribute('data-page-transition','');
    root.setAttribute('data-cross-page','');root.removeAttribute('data-hero-intro');
    mobileWorkWipe=['enter','return'].includes(pending.workWipe)?pending.workWipe:null;
    if(mobileWorkWipe==='return')root.setAttribute('data-project-return','');
    coverNavigation();coverage.style.background=mobileWorkWipe?'#EDEDED':pending.color;
    coveredNavigationDuration=pending.duration||650;
    if(mobileWorkWipe)coverage.dataset.workWipe=mobileWorkWipe;
    return true;
  } catch { return false; }
}
restoreCoveredNavigation();
let pageRevealed=false;
function recoverNavigation(nav) {
  if (activeNavigation !== nav || nav.failed) return;
  // Install a real cover BEFORE dropping the browser's snapshot. The timeout
  // owns only the visual effect, never the destination operation.
  coverNavigation();
  nav.fallback = true;
  clearTimeout(timer);
  nav.transition?.skipTransition();
  animations.forEach(animation => animation.cancel());
  entrance?.clean();
}
function cleanNavigation(nav) {
  if (nav && activeNavigation !== nav) return;
  clearTimeout(timer);
  activeNavigation?.controller?.dispose();
  activeNavigation = undefined;
  animations.forEach(animation => animation.cancel());
  animations = [];
  entrance?.clean(); entrance = undefined;
  arrowEntrance?.clean(); arrowEntrance = undefined;
  activeTransition = undefined;
  coverage?.remove(); coverage = undefined;
  root.removeAttribute('data-page-transition');
  root.removeAttribute('data-covered-navigation-entry');
  root.removeAttribute('data-project-return');
  mobileWorkWipe = null;
  physicalNavigationStyle?.remove();physicalNavigationStyle=undefined;
  window.dispatchEvent(new Event('leo:page-reveal'));
}
function failNavigation(nav, error) {
  if (activeNavigation !== nav || nav.failed) return;
  recoverNavigation(nav);
  nav.failed = true;
  nav.controller?.dispose();
  root.removeAttribute('data-page-transition');
  coverage.removeAttribute('aria-hidden');
  coverage.dataset.navigationError = '';
  coverage.setAttribute('role', 'alert');
  Object.assign(coverage.style, {background:'var(--background, #fff)', color:'var(--foreground, #171717)', display:'grid', placeContent:'center', gap:'1rem', padding:'2rem'});
  const message = document.createElement('p');
  message.textContent = root.lang === 'es' ? 'No se pudo cargar esta sección.' : 'This section could not be loaded.';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = root.lang === 'es' ? 'Reintentar' : 'Retry';
  retry.addEventListener('click', () => {
    try { sessionStorage.setItem('leo-destination-retry', location.href); } catch {}
    location.reload();
  }, {once:true});
  coverage.replaceChildren(message, retry);
  retry.focus({preventScroll:true});
  console.error('Destination initialization failed:', error);
}
// Direct anchors and reloads need the same ready/commit barrier as a cross-page
// destination. Install coverage in the head, before the first visible frame.
if (retryDestination || (entryDestination && (!root.hasAttribute('data-cross-page') || navType === 'reload'))) {
  root.setAttribute('data-cross-page', '');
  root.setAttribute('data-page-transition', '');
  coverNavigation();
}
window.addEventListener('pageswap', event => {
  const destination = event.activation?.entry?.url;
  if (destination) {
    try {
      const url = new URL(destination);
      const projectReturn = root.dataset.page === 'case-study' && ['/', '/index.html'].includes(url.pathname) && ['', '#home', '#work', '#featured-works', '#contact'].includes(url.hash);
      sessionStorage.setItem('leo-page-destination', JSON.stringify({path:url.pathname,time:Date.now(),projectReturn}));
    } catch { /* Optional Hero-intro suppression only. */ }
  }
  if (!event.viewTransition) return;
  if (aboutCovering || mobileWorkWipe || reduced.matches) { event.viewTransition.ready.catch(() => {}); event.viewTransition.skipTransition(); return; }
  root.setAttribute('data-page-transition', '');
  // The browser owns unload/BFCache; do not replace the document or its history.
});
// Also works in browsers that navigate normally without cross-document snapshots.
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element && event.target.closest('a[href]');
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.pathname === location.pathname) return;
  const projectReturn = root.dataset.page === 'case-study' && ['/', '/index.html'].includes(url.pathname) && ['', '#home', '#work', '#featured-works', '#contact'].includes(url.hash);
  try { sessionStorage.setItem('leo-page-destination', JSON.stringify({path:url.pathname,time:Date.now(),projectReturn})); } catch {}
  // Mobile projects use one physical curtain on both sides of the document
  // handoff, including Safari versions without cross-document snapshots.
  const projectNavigation = root.dataset.page === 'case-study' || /^\/work\//.test(url.pathname);
  if (isMobileAbout() && projectNavigation && !reduced.matches) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (aboutCovering) return;
    aboutCovering = true;
    window.dispatchEvent(new Event('leo:close-menu'));
    const direction = projectReturn ? 'return' : 'enter';
    coverNavigation();
    // This literal color crosses the handoff unchanged; theme initialization
    // and recovery must never replace it with the foreground/black surface.
    coverage.style.background = '#EDEDED';
    coverage.dataset.workWipe = direction;
    // Set the offscreen pose before exposing the element to the compositor.
    coverage.style.transform=direction==='return'?'translateY(-100%)':'translateY(100%)';
    ownPhysicalNavigation();
    const wipe = coverage.animate(workWipeFrames(direction, false), workWipeOptions);
    animations.push(wipe);
    wipe.finished.then(() => {
      try {
        sessionStorage.setItem('leo-covered-navigation', JSON.stringify({
          path:url.pathname, color:'#EDEDED', duration:workWipeOptions.duration,
          workWipe:direction, time:Date.now(),
        }));
      } catch {}
      location.assign(url.href);
    }).catch(() => { aboutCovering=false; cleanNavigation(); });
    return;
  }
  if(isMobileAbout()&&!reduced.matches){
    event.preventDefault();
    if(aboutCovering)return;
    aboutCovering=true;window.dispatchEvent(new Event('leo:close-menu'));
    coverNavigation();
    const color=getComputedStyle(root).getPropertyValue('--foreground').trim()||'#1C1C1C';
    coverage.style.background=color;
    const duration=SECTION_TRANSITION.duration*1000;
    const wipe=coverage.animate(snapshotFrames().newFrames.map(({offset,clipPath})=>({offset,clipPath})),{duration,fill:'both'});
    animations.push(wipe);
    wipe.finished.then(()=>{
      try{sessionStorage.setItem('leo-covered-navigation',JSON.stringify({path:url.pathname,color,duration,time:Date.now()}));}catch{}
      location.assign(url.href);
    }).catch(()=>{aboutCovering=false;cleanNavigation();});
    return;
  }

}, {capture:true});
function revealPage(event) {
  restoreCoveredNavigation();
  if(activeNavigation || pageRevealed)return;
  pageRevealed=true;
  restorePreferences();
  const aboutEntry = root.dataset.page === 'about';
  // Direct loads/reloads have no browser snapshot. Reuse destination readiness
  // under the physical cover installed in the head.
  const initialDestination = retryDestination || (!restoredFromCache ? entryDestination : null);
  const coveredEntry=root.hasAttribute('data-covered-navigation-entry');
  const projectReturn=root.hasAttribute('data-project-return');
  if(coveredEntry){event.viewTransition?.ready.catch(()=>{});event.viewTransition?.skipTransition();}
  const transition = (!coveredEntry&&event.viewTransition) || ((initialDestination||coveredEntry||projectReturn||aboutEntry) ? {
    skipTransition() {}, ready:Promise.resolve(), finished:Promise.resolve(),
  } : null);
  if (!transition) { cleanNavigation(); return; }
  root.setAttribute('data-cross-page', '');
  root.removeAttribute('data-hero-intro');
  if (reduced.matches && !initialDestination && !aboutEntry) { transition.skipTransition(); cleanNavigation(); return; }
  if ((initialDestination||coveredEntry||projectReturn||aboutEntry) && (!event.viewTransition || reduced.matches || coveredEntry)) coverNavigation();
  activeTransition = transition;
  const nav = {id:++navigationId, transition, fallback:coveredEntry || !!retryDestination || !event.viewTransition || reduced.matches, failed:false, visualStarted:false, controller:undefined};
  activeNavigation = nav;
  root.setAttribute('data-page-transition', '');
  // Content enters inside the new snapshot; it is not a second page overlay.
  const anchorHash = initialDestination || (!restoredFromCache && navType !== 'back_forward' && ['#work', '#featured-works', '#contact'].includes(location.hash) ? location.hash : null);
  if (reduced.matches) transition.skipTransition();
  retryDestination = null;
  restoredFromCache = false;
  const destinationReady = (async () => {
    if(coveredEntry||projectReturn||aboutEntry||root.dataset.page==='case-study')await Promise.race([documentReady,initializationFailed]);
    if(aboutEntry) await Promise.race([window.__leoAboutReady,initializationFailed]);
    const prepareWorkSurface = async () => {
      if (!mobileWorkWipe) return;
      await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,800))]);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const visibleImages = [...document.querySelectorAll('[data-page-content] img')].filter(image => {
        const rect = image.getBoundingClientRect();
        return image.currentSrc && rect.width && rect.height && rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0;
      });
      await Promise.all(visibleImages.map(image => image.decode().catch(() => {})));
    };
    if (!anchorHash) { await prepareWorkSurface(); return; }
    await Promise.race([documentReady, initializationFailed]);
    if (activeNavigation !== nav) return;
    // The module supplies the same logical-destination guard as section links.
    // Its absence after DOMContentLoaded is a real initialization failure.
    const request = {selector:anchorHash, onInvalidate:() => {
      // Initial font/layout changes belong to preparation, not recovery.
      // The destination controller waits for these changes to settle itself.
      if (nav.visualStarted) recoverNavigation(nav);
    }, controller:undefined};
    window.dispatchEvent(new CustomEvent('leo:destination-request', {detail:request}));
    if (!request.controller) throw new Error('Destination controller is unavailable.');
    nav.controller = request.controller;
    await nav.controller.ready();
    await prepareWorkSurface();
    if (activeNavigation === nav) window.dispatchEvent(new Event('leo:page-position'));
  })();
  void destinationReady.catch(error => failNavigation(nav, error));
  const {oldFrames,newFrames} = snapshotFrames();
  // Keep the source intact beneath the opening destination mask so the
  // contrast background never appears between the two project snapshots.
  const projectNavigation = root.dataset.page === 'case-study' || projectReturn;
  const sourceFrames = projectNavigation
    ? [{clipPath:'inset(0)',opacity:1},{clipPath:'inset(0)',opacity:1}]
    : oldFrames;
  transition.ready.then(async () => {
    if (activeNavigation !== nav || nav.fallback || nav.failed) return;
    // Register synchronously: CSS disables the default snapshot animations, so
    // awaiting layout first lets the browser finish and discard the transition.
    animations = [
      root.animate(sourceFrames,{duration:SECTION_TRANSITION.duration*1000,fill:'both',pseudoElement:'::view-transition-old(root)'}),
      root.animate(newFrames,{duration:SECTION_TRANSITION.duration*1000,delay:SECTION_TRANSITION.followDelay*1000,fill:'both',pseudoElement:'::view-transition-new(root)'}),
    ];
    // About may load slowly: move the leading mask immediately, then hold
    // the destination mask at its first frame until the scene is ready.
    animations.forEach((animation,index) => {if(!aboutEntry||index>0)animation.pause();});
    await destinationReady;
    if (activeNavigation !== nav || nav.fallback || nav.failed) return;
    if (aboutEntry) { coverage?.remove(); coverage=undefined; }
    const anchor = anchorHash ? document.querySelector(anchorHash) : null;
    window.dispatchEvent(new Event('leo:page-position'));
    entrance = root.dataset.page === 'about' ? undefined : prepareEntrances(anchor || document.querySelector('[data-page-content], .hero'));
    arrowEntrance = prepareReturnEntrance(); arrowEntrance.play();
    nav.visualStarted = true;
    animations.forEach((animation,index) => {if(!aboutEntry||index>0)animation.play();});
    entrance?.play();
  }).catch(() => recoverNavigation(nav));
  transition.finished.catch(() => {}).then(async () => {
    await destinationReady;
    if (activeNavigation !== nav || nav.failed) return;
    await nav.controller?.ready();
    if (activeNavigation !== nav || nav.failed) return;
    if (!mobileWorkWipe) root.removeAttribute('data-page-transition');
    if (!nav.fallback) await entrance?.finished();
    // Resize can invalidate layout during the text entrance as well.
    await nav.controller?.ready();
    if(nav.fallback&&coverage&&!reduced.matches){
      // A skipped/unsupported native snapshot must still reveal geometrically.
      // Never remove an opaque recovery cover in a single frame.
      window.dispatchEvent(new Event('leo:section-reveal'));
      arrowEntrance = prepareReturnEntrance(document, mobileWorkWipe ? DOUBLE_SWEEP.duration-120 : undefined); arrowEntrance.play();
      const wipe = mobileWorkWipe
        ? coverage.animate(workWipeFrames(mobileWorkWipe, true), workWipeOptions)
        : coverage.animate(snapshotFrames().oldFrames.map(({offset,clipPath})=>({offset,clipPath})),{duration:coveredEntry ? coveredNavigationDuration : SECTION_TRANSITION.duration*1000,fill:'both'});
      animations.push(wipe);await wipe.finished.catch(()=>{});
    }
    await arrowEntrance?.finished();
    if (activeNavigation === nav) cleanNavigation(nav);
  }).catch(error => failNavigation(nav, error));
  timer = setTimeout(() => recoverNavigation(nav), aboutEntry ? 20000 : 8000);
}
window.addEventListener('pagereveal', revealPage);
// Browsers without the lifecycle event still release direct-anchor coverage
// through the same initialization barrier, after their deferred modules mount.
if (!('onpagereveal' in window)) void documentReady.then(() => revealPage({}));
window.addEventListener('pageshow', event => {
  if(event.persisted)themeInitialized=false;
  restorePreferences();
  if(event.persisted && aboutCovering) {
    // The outgoing curtain stays painted through pagehide. Release it only
    // when this exact document is restored from BFCache.
    animations.forEach(animation=>animation.cancel());animations=[];
    coverage?.remove();coverage=undefined;
    physicalNavigationStyle?.remove();physicalNavigationStyle=undefined;
  }
  aboutCovering = false;
  if (event.persisted) root.setAttribute('data-cross-page', '');
  restoredFromCache = event.persisted;
  const pendingCover=restoreCoveredNavigation();
  if(!activeNavigation && (!pageRevealed||pendingCover)) {
    pageRevealed=false;
    void documentReady.then(()=>revealPage({}));
  }
  // pagereveal starts the new animation after BFCache restoration.
  if (!activeTransition) root.removeAttribute('data-page-transition');
});
reduced.addEventListener('change', () => {
  if (reduced.matches && activeNavigation) recoverNavigation(activeNavigation);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && activeNavigation) recoverNavigation(activeNavigation);
});
window.addEventListener('pagehide', () => {
  pageRevealed=false;
  // Do not uncover the outgoing page during its last paint. The full curtain
  // and its fill pose survive unload/BFCache until the destination takes over.
  if(aboutCovering) {clearTimeout(timer);return;}
  clearTimeout(timer);
  activeNavigation?.controller?.dispose();
  activeNavigation = undefined;
  activeTransition = undefined;
  coverage?.remove(); coverage = undefined;
});
