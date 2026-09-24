// Inlined in each document's head, alongside the shared motion functions.
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
function restorePreferences() {
  try {
    const saved=localStorage.getItem('leo-theme');
    root.dataset.theme = saved==='light'||saved==='dark'?saved:matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)').matches?'dark':'light';
    root.lang = localStorage.getItem('leo-language') === 'es' ? 'es' : 'en';
  } catch {
    root.dataset.theme = matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)').matches?'dark':'light';
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
try {
  const pending = JSON.parse(sessionStorage.getItem('leo-page-destination') || 'null');
  sessionStorage.removeItem('leo-page-destination');
  if (navType !== 'reload' && pending?.path === location.pathname && Date.now()-pending.time < 30000) {
    root.setAttribute('data-cross-page', '');
  }
} catch { /* Navigation and preferences still work without storage. */ }
if (navType === 'back_forward') root.setAttribute('data-cross-page', '');
let activeTransition, entrance, timer;
let animations = [];
function cleanNavigation() {
  clearTimeout(timer);
  animations.forEach(animation => animation.cancel());
  animations = [];
  entrance?.clean(); entrance = undefined;
  activeTransition = undefined;
  root.removeAttribute('data-page-transition');
  window.dispatchEvent(new Event('leo:page-reveal'));
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
window.addEventListener('pagereveal', event => {
  restorePreferences();
  const transition = event.viewTransition;
  if (!transition) { cleanNavigation(); return; }
  root.setAttribute('data-cross-page', '');
  root.removeAttribute('data-hero-intro');
  if (reduced.matches) { transition.skipTransition(); cleanNavigation(); return; }
  activeTransition = transition;
  root.setAttribute('data-page-transition', '');
  window.dispatchEvent(new Event('leo:page-position'));
  // Content enters inside the new snapshot; it is not a second page overlay.
  const anchor = ['#work', '#contact'].includes(location.hash) ? document.querySelector(location.hash) : null;
  entrance = prepareEntrances(anchor || document.querySelector('[data-page-content], .hero'));
  const {oldFrames,newFrames} = snapshotFrames();
  transition.ready.then(() => {
    if (activeTransition !== transition) return;
    animations = [
      root.animate(oldFrames,{duration:SECTION_TRANSITION.duration*1000,fill:'both',pseudoElement:'::view-transition-old(root)'}),
      root.animate(newFrames,{duration:SECTION_TRANSITION.duration*1000,delay:SECTION_TRANSITION.followDelay*1000,fill:'both',pseudoElement:'::view-transition-new(root)'}),
    ];
    entrance?.play();
  }).catch(() => cleanNavigation());
  transition.finished.catch(() => {}).then(async () => {
    root.removeAttribute('data-page-transition');
    await entrance?.finished();
    if (activeTransition === transition) cleanNavigation();
  });
  timer = setTimeout(() => { transition.skipTransition(); cleanNavigation(); }, 8000);
});
window.addEventListener('pageshow', event => {
  restorePreferences();
  if (event.persisted) root.setAttribute('data-cross-page', '');
  // pagereveal starts the new animation after BFCache restoration.
  if (!activeTransition) root.removeAttribute('data-page-transition');
});
reduced.addEventListener('change', () => {
  if (reduced.matches) { activeTransition?.skipTransition(); cleanNavigation(); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && activeTransition) { activeTransition.skipTransition(); cleanNavigation(); }
});
