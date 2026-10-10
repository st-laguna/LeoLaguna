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
  } else if (document.readyState !== 'complete' && event instanceof ErrorEvent && event.error) {
    rejectInitialization(event.error);
  }
}, true);
function restorePreferences() {
  try {
    const saved=localStorage.getItem('leo-theme');
    root.dataset.theme = saved==='light'||saved==='dark'?saved:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    root.lang = localStorage.getItem('leo-language') === 'es' ? 'es' : 'en';
  } catch {
    root.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    root.lang = 'en';
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
  }
} catch { /* Navigation and preferences still work without storage. */ }
if (navType === 'back_forward') root.setAttribute('data-cross-page', '');
let activeTransition, activeNavigation, entrance, timer, coverage;
let navigationId = 0, restoredFromCache = false;
let animations = [];
function coverNavigation() {
  if (!coverage?.isConnected) {
    coverage = document.createElement('div');
    coverage.dataset.navigationCoverage = '';
    coverage.setAttribute('aria-hidden', 'true');
    Object.assign(coverage.style, {
      position:'fixed', inset:'0', zIndex:'2147483647',
      background:'var(--page-transition-contrast, #000)', pointerEvents:'auto',
    });
    root.append(coverage);
  }
}
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
  activeTransition = undefined;
  coverage?.remove(); coverage = undefined;
  root.removeAttribute('data-page-transition');
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
      sessionStorage.setItem('leo-page-destination', JSON.stringify({path:new URL(destination).pathname,time:Date.now()}));
    } catch { /* Optional Hero-intro suppression only. */ }
  }
  if (!event.viewTransition) return;
  if (reduced.matches) { event.viewTransition.skipTransition(); return; }
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
  try { sessionStorage.setItem('leo-page-destination', JSON.stringify({path:url.pathname,time:Date.now()})); } catch {}
}, {capture:true});
function revealPage(event) {
  restorePreferences();
  // Direct loads/reloads have no browser snapshot. Reuse destination readiness
  // under the physical cover installed in the head.
  const initialDestination = retryDestination || (!restoredFromCache ? entryDestination : null);
  const transition = event.viewTransition || (initialDestination ? {
    skipTransition() {}, ready:Promise.resolve(), finished:Promise.resolve(),
  } : null);
  if (!transition) { cleanNavigation(); return; }
  root.setAttribute('data-cross-page', '');
  root.removeAttribute('data-hero-intro');
  if (reduced.matches && !initialDestination) { transition.skipTransition(); cleanNavigation(); return; }
  if (initialDestination && (!event.viewTransition || reduced.matches)) coverNavigation();
  activeTransition = transition;
  const nav = {id:++navigationId, transition, fallback:!!retryDestination || !event.viewTransition || reduced.matches, failed:false, controller:undefined};
  activeNavigation = nav;
  root.setAttribute('data-page-transition', '');
  // Content enters inside the new snapshot; it is not a second page overlay.
  const anchorHash = initialDestination || (!restoredFromCache && navType !== 'back_forward' && ['#work', '#featured-works', '#contact'].includes(location.hash) ? location.hash : null);
  if (reduced.matches) transition.skipTransition();
  retryDestination = null;
  restoredFromCache = false;
  const destinationReady = (async () => {
    if (!anchorHash) return;
    await Promise.race([documentReady, initializationFailed]);
    if (activeNavigation !== nav) return;
    // The module supplies the same logical-destination guard as section links.
    // Its absence after DOMContentLoaded is a real initialization failure.
    const request = {selector:anchorHash, onInvalidate:() => recoverNavigation(nav), controller:undefined};
    window.dispatchEvent(new CustomEvent('leo:destination-request', {detail:request}));
    if (!request.controller) throw new Error('Destination controller is unavailable.');
    nav.controller = request.controller;
    await nav.controller.ready();
    if (activeNavigation === nav) window.dispatchEvent(new Event('leo:page-position'));
  })();
  void destinationReady.catch(error => failNavigation(nav, error));
  const {oldFrames,newFrames} = snapshotFrames();
  transition.ready.then(async () => {
    if (activeNavigation !== nav || nav.fallback || nav.failed) return;
    // Register synchronously: CSS disables the default snapshot animations, so
    // awaiting layout first lets the browser finish and discard the transition.
    animations = [
      root.animate(oldFrames,{duration:SECTION_TRANSITION.duration*1000,fill:'both',pseudoElement:'::view-transition-old(root)'}),
      root.animate(newFrames,{duration:SECTION_TRANSITION.duration*1000,delay:SECTION_TRANSITION.followDelay*1000,fill:'both',pseudoElement:'::view-transition-new(root)'}),
    ];
    if (anchorHash) animations.forEach(animation => animation.pause());
    await destinationReady;
    if (activeNavigation !== nav || nav.fallback || nav.failed) return;
    const anchor = anchorHash ? document.querySelector(anchorHash) : null;
    window.dispatchEvent(new Event('leo:page-position'));
    entrance = root.dataset.page === 'about' ? undefined : prepareEntrances(anchor || document.querySelector('[data-page-content], .hero'));
    animations.forEach(animation => animation.play());
    entrance?.play();
  }).catch(() => recoverNavigation(nav));
  transition.finished.catch(() => {}).then(async () => {
    await destinationReady;
    if (activeNavigation !== nav || nav.failed) return;
    await nav.controller?.ready();
    if (activeNavigation !== nav || nav.failed) return;
    root.removeAttribute('data-page-transition');
    if (!nav.fallback) await entrance?.finished();
    // Resize can invalidate layout during the text entrance as well.
    await nav.controller?.ready();
    if (activeNavigation === nav) cleanNavigation(nav);
  }).catch(error => failNavigation(nav, error));
  timer = setTimeout(() => recoverNavigation(nav), 8000);
}
window.addEventListener('pagereveal', revealPage);
// Browsers without the lifecycle event still release direct-anchor coverage
// through the same initialization barrier, after their deferred modules mount.
if (!('onpagereveal' in window)) void documentReady.then(() => revealPage({}));
window.addEventListener('pageshow', event => {
  restorePreferences();
  if (event.persisted) root.setAttribute('data-cross-page', '');
  restoredFromCache = event.persisted;
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
  clearTimeout(timer);
  activeNavigation?.controller?.dispose();
  activeNavigation = undefined;
  activeTransition = undefined;
  coverage?.remove(); coverage = undefined;
});
