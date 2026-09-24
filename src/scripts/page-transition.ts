import gsap from 'gsap';
import { scrollPage, isScrollLocked, beginScrollTransition, endScrollTransition, commitScrollJump } from './smooth-scroll';

import { SECTION_TRANSITION, smoothPulse, openingClip, prepareEntrances, snapshotFrames } from './transition-motion.js';
export { SECTION_TRANSITION } from './transition-motion.js';

let transitioning = false;
let timeline: gsap.core.Timeline | null = null;
let curtain: HTMLDivElement | null = null;
let watchdog: ReturnType<typeof setTimeout> | undefined;
let nativeTransition: { skipTransition(): void } | null = null;
let cleanupEntrance: (() => void) | null = null;
let snapshotStyle: HTMLStyleElement | null = null;
const snapshotAnimations: Animation[] = [];
const events = new AbortController();
const signal = events.signal;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// Native fragment scrolling can precede Lenis/ScrollTrigger initialization.
// Align once after all page modules have mounted, before the destination reveal.
let entryAnchorSettled = false;
let userMoved = false;
for (const type of ['touchstart','wheel','keydown']) window.addEventListener(type, () => {userMoved=true;}, {once:true,passive:true,signal});
function settleEntryAnchor() {
  if (entryAnchorSettled || userMoved) return;
  if (performance.getEntriesByType('navigation').some(entry =>
    (entry as PerformanceNavigationTiming).type === 'back_forward')) return;
  const id = location.hash.slice(1);
  if (id !== 'work' && id !== 'contact') return;
  const target = document.getElementById(id);
  if (target) { entryAnchorSettled=true; commitScrollJump(() => scrollPage(target.getBoundingClientRect().top + scrollY, false)); }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', settleEntryAnchor, {once:true,signal});
} else settleEntryAnchor();
window.addEventListener('leo:page-position', settleEntryAnchor, {signal});
// The responsive sticky sections establish their final height after module setup.
window.addEventListener('load', () => requestAnimationFrame(settleEntryAnchor), {once:true,signal});

function getCurtain() {
  if (curtain?.isConnected) return curtain;
  curtain = document.createElement('div');
  curtain.dataset.sectionCurtain = '';
  curtain.setAttribute('aria-hidden', 'true');
  Object.assign(curtain.style, {
    position: 'fixed', inset: '0', zIndex: '2147483647',
    display: 'none', pointerEvents: 'none',
    background: 'var(--foreground, #171717)',
    willChange: 'clip-path',
  });
  document.body.append(curtain);
  return curtain;
}

function announceReveal() {
  document.documentElement.dataset.sectionTransition = 'revealing';
  window.dispatchEvent(new Event('leo:section-reveal'));
}

function release() {
  timeline?.kill(); timeline = null;
  if (watchdog) clearTimeout(watchdog);
  watchdog = undefined;
  const wasTransitioning = transitioning;
  transitioning = false;
  cleanupEntrance?.(); cleanupEntrance = null;
  snapshotAnimations.splice(0).forEach(animation => animation.cancel());
  snapshotStyle?.remove(); snapshotStyle = null;
  nativeTransition = null;
  if (curtain) {
    gsap.set(curtain, { display: 'none', clearProps: 'transform,clipPath' });
    curtain.style.pointerEvents = 'none';
  }
  delete document.documentElement.dataset.sectionTransition;
  if (wasTransitioning) endScrollTransition();
  if (wasTransitioning) window.dispatchEvent(new Event('leo:section-reveal'));
}

// The old viewport is a browser snapshot, not a DOM clone. Videos/canvas,
// fixed navigation and pinned project sections retain their rendered position.
// The destination stays live inside the second snapshot while its text enters.

function snapshotSequence(commit: () => void, focus?: HTMLElement | null) {
  snapshotStyle = document.createElement('style');
  snapshotStyle.textContent = `
    html[data-section-transition] body * { view-transition-name: none !important; }
    html[data-section-transition]::view-transition { pointer-events: none; }
    html[data-section-transition]::view-transition-group(root) {
      animation: none; transform: none; overflow: clip;
      background: var(--foreground, #171717);
    }
    html[data-section-transition]::view-transition-image-pair(root) { isolation: isolate; }
    html[data-section-transition]::view-transition-old(root),
    html[data-section-transition]::view-transition-new(root) {
      animation: none; mix-blend-mode: normal; width: 100%; height: 100%;
      object-fit: fill;
    }
    html[data-section-transition]::view-transition-old(root) { z-index: 1; }
    html[data-section-transition]::view-transition-new(root) {
      z-index: 2; clip-path: inset(81% 10% 19%);
    }
  `;
  document.head.append(snapshotStyle);
  let entrance: ReturnType<typeof prepareEntrances> | undefined;
  let committed = false;
  let cancelled = false;
  const transition = document.startViewTransition(() => {
    if (cancelled) return;
    commit(); committed = true;
    // Keep this callback synchronous: rendering (including animation frames)
    // is paused by the browser while it captures the destination.
    entrance = prepareEntrances(focus);
    cleanupEntrance = entrance.clean;
  });
  nativeTransition = { skipTransition() { cancelled = true; transition.skipTransition(); } };
  const duration = SECTION_TRANSITION.duration * 1000;
  const delay = SECTION_TRANSITION.followDelay * 1000;
  // Opening a hole in the frozen old image exposes the contrast-colored layer.
  // The new image follows the same path 160 ms behind: both coexist on screen.
  const {oldFrames,newFrames} = snapshotFrames();
  void transition.ready.then(() => {
    if (cancelled) return;
    const root = document.documentElement;
    snapshotAnimations.push(
      root.animate(oldFrames, { duration, fill: 'both', pseudoElement: '::view-transition-old(root)' }),
      root.animate(newFrames, { duration, delay, fill: 'both', pseudoElement: '::view-transition-new(root)' }),
    );
    entrance?.play();
    // Footer's existing entrances also start before the new field fills the view.
    timeline = gsap.timeline().call(announceReveal, [], SECTION_TRANSITION.contentDelay);
  }).catch(error => {
    // A browser may skip snapshots (e.g. duplicate view-transition names).
    // Complete navigation and restore content instead of leaving it hidden.
    if (!cancelled) console.warn('Snapshot transition skipped:', error);
  });
  void transition.finished.catch(() => {}).then(async () => {
    if (cancelled) return;
    if (!committed) commit();

    // Las capas ya terminaron: permitir scroll inmediatamente.
    endScrollTransition();

    await entrance?.finished();
    if (cancelled) return;
    timeline?.kill(); timeline = null;
    release(); focusDestination(focus);
  });
  watchdog = setTimeout(() => {
    nativeTransition?.skipTransition();
    timeline?.kill(); timeline = null; release();
  }, 8000);
}

function focusDestination(element?: HTMLElement | null) {
  if (!element || element.closest('[inert]')) return;
  const temporary = !element.hasAttribute('tabindex');
  if (temporary) element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll: true });
  if (temporary) element.addEventListener('blur', () => {
    element.removeAttribute('tabindex');
  }, { once: true, signal });
}

// Navigation changes position only once the curtain covers the entire viewport.
function transitionTo(changePosition: () => void, focus?: HTMLElement | null) {
  if (transitioning || isScrollLocked()) return;
  const commit = () => commitScrollJump(changePosition);
  if (reduced.matches) {
    commit();
    focusDestination(focus);
    return;
  }
  if (!beginScrollTransition()) return;
  transitioning = true;
  document.documentElement.dataset.sectionTransition = 'covering';
  window.dispatchEvent(new Event('leo:section-cover'));
  if (typeof document.startViewTransition === 'function') {
    snapshotSequence(commit, focus);
    return;
  }
  // Compatibility path for browsers without same-document view transitions.
  const panel = getCurtain();
  const motion = { cover: 0, reveal: 0 };
  gsap.set(panel, {
    display: 'block', opacity: 1, yPercent: 0,
    clipPath: openingClip(0),
  });
  panel.style.pointerEvents = 'auto';
  timeline = gsap.timeline({
    onComplete: () => {
      timeline = null;
      release();
      focusDestination(focus);
    },
  });
  timeline
    .to(motion, {
      cover: 1, duration: SECTION_TRANSITION.cover, ease: 'none',
      onUpdate: () => { panel.style.clipPath = openingClip(motion.cover); },
    })
    .call(() => {
      // Exact full coverage before changing scroll position; no intermediate
      // sections can flash through rounding gaps or a partly open mask.
      panel.style.clipPath = 'inset(0% 0% 0% 0%)';
      try { commit(); }
      catch (error) {
        console.error('Section transition failed:', error);
        timeline?.kill(); timeline = null; release();
      }
    })
    .to({}, { duration: SECTION_TRANSITION.covered })
    .call(announceReveal)
    .to(motion, {
      reveal: 1, duration: SECTION_TRANSITION.reveal, ease: 'none',
      onUpdate: () => {
        // Reveal the actual destination from bottom to top, gently accelerating
        // and settling. Never translate the page or disturb pinned projects.
        const lift = smoothPulse(motion.reveal, 0, 1);
        panel.style.clipPath = `inset(0% 0% ${lift * 100}% 0%)`;
      },
    });
  // Never leave the interface blocked after an interrupted animation.
  watchdog = setTimeout(() => {
    timeline?.kill(); timeline = null; release();
  }, 8000);
}

// Capture runs before the older footer/sidebar handlers: no duplicate jump.
document.addEventListener('click', event => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (transitioning) { event.preventDefault(); event.stopImmediatePropagation(); return; }
  if (event.defaultPrevented || isScrollLocked() || !(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>('a[href]');
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
  let hash: string;
  try { hash = decodeURIComponent(url.hash.slice(1)); } catch { return; }
  const isHome = (!url.hash && url.pathname === '/') || link.matches('.footer__mark, [data-transition-home]') || hash === 'home' || hash === 'hero' || hash === 'hero-top';
  const indexText = link.dataset.projectJump;
  const index = indexText === undefined ? undefined : Number(indexText);
  const category = index !== undefined && Number.isInteger(index) && index >= 0 && index < 4;
  if (!isHome && !category && hash !== 'work' && hash !== 'contact') return;
  const section = isHome
    ? document.querySelector<HTMLElement>('.hero')
    : category
      ? document.querySelector<HTMLElement>('[data-projects]')
      : document.getElementById(hash);
  if (!section && !isHome) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  window.dispatchEvent(new Event('leo:close-menu'));
  // Close menus without altering the WORK button's existing toggle behavior.
  document.querySelector('[data-footer-work]')?.setAttribute('aria-expanded', 'false');
  const options = document.getElementById('site-work-options');
  if (options) options.hidden = true;
  const sidebarMenu = document.getElementById('glass-project-menu');
  sidebarMenu?.removeAttribute('data-open');
  if (sidebarMenu) sidebarMenu.inert = true;
  document.querySelector('[data-glass-sidebar]')?.removeAttribute('data-open');
  document.querySelector('.glass-toggle')?.setAttribute('aria-expanded', 'false');
  transitionTo(() => {
    if (category) {
      // Existing projects.ts computes the exact desktop/mobile category stop.
      window.dispatchEvent(new CustomEvent('leo:project-jump', { detail: index }));
    } else {
      scrollPage(isHome ? 0 : section!.getBoundingClientRect().top + window.scrollY, false);
    }
  }, section);
}, { capture: true, signal });

reduced.addEventListener('change', () => {
  if (reduced.matches) {
    if (nativeTransition) { nativeTransition.skipTransition(); release(); }
    else timeline?.progress(1);
  }
}, { signal });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (nativeTransition) { nativeTransition.skipTransition(); release(); }
    else timeline?.progress(1);
  }
}, { signal });
document.addEventListener('astro:before-swap', () => {
  nativeTransition?.skipTransition();
  timeline?.kill(); timeline = null; release(); curtain?.remove(); curtain = null;
}, { signal });
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    nativeTransition?.skipTransition();
    timeline?.kill(); release(); events.abort(); curtain?.remove();
  });
}
async function startHeroIntro() {
  const root = document.documentElement;
  if (!root.hasAttribute('data-hero-intro')) return;

  const hero = document.querySelector<HTMLElement>('#home.hero');

  const showPage = () => {
    root.removeAttribute('data-hero-intro');
  };

  if (
    !hero ||
    reduced.matches ||
    typeof document.startViewTransition !== 'function'
  ) {
    showPage();
    return;
  }

  const dark = root.dataset.theme === 'dark';
  const image = hero.querySelector<HTMLImageElement>(
    dark ? '.hero__image--dark' : '.hero__image--light'
  );

  // Esperar los recursos principales, con un límite breve.
  // Si ya están cargados, continuar inmediatamente.
  await Promise.race([
    Promise.allSettled([
      document.fonts.ready,
      image ? image.decode() : Promise.resolve(),
    ]),
    new Promise<void>(resolve => setTimeout(resolve, 800)),
  ]);

  // El mecanismo de recuperación pudo haber mostrado ya la página.
  if (!root.hasAttribute('data-hero-intro')) return;

  if (document.hidden || isScrollLocked()) {
    showPage();
    return;
  }

  try {
    transitionTo(() => {
      scrollPage(0, false);

      // Se descubre el Hero dentro de la captura del nuevo contenido,
      // después de capturar el fondo inicial vacío.
      showPage();
    }, hero);
  } catch (error) {
    showPage();
    release();
    console.error('No se pudo iniciar la entrada del Hero:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void startHeroIntro();
  }, { once: true, signal });
} else {
  void startHeroIntro();
}
