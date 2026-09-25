import { isIOS } from './ipad-layout';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
// Safari's retracting toolbar is not a layout rotation. Avoid refresh scroll restoration.
if (isIOS()) ScrollTrigger.config({ignoreMobileResize:true,autoRefreshEvents:'visibilitychange,DOMContentLoaded,load'});
window.addEventListener('leo:orientation-ready', () => ScrollTrigger.refresh());
let lenis: Lenis | null = null;
let locked = false;
let transitioning = false;
let committing = false;
const events = new AbortController();
const signal = events.signal;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const tick = (seconds: number) => lenis?.raf(seconds * 1000);

export function isScrollLocked() { return locked || transitioning; }
export function isCommittingScrollJump() { return committing; }
export function beginScrollTransition() {
  if (isScrollLocked()) return false;
  transitioning = true;
  lenis?.stop();
  return true;
}
export function endScrollTransition() {
  transitioning = false;
  if (!locked) lenis?.start();
}
export function commitScrollJump(changePosition: () => void) {
  if (locked) return;
  committing = true;
  try {
    changePosition();
    ScrollTrigger.update();
    ScrollTrigger.getAll().forEach((trigger) => {
  const tween = trigger.getTween();

  if (tween && typeof tween.progress === 'function') {
    tween.progress(1);
  }
});
  } finally { committing = false; }
}
// Existing callers (project arrows, galleries, etc.) keep their current API.
export function scrollPage( top: number, smooth = true, duration?: number ) {
  if (locked || (transitioning && !committing)) return;
  const immediate = committing || !smooth || reduced.matches;
  const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const destination = Math.max(0, Math.min(top, max));
  if (lenis) {
    // Sticky sections can change page height before Lenis observes their size.
    if (immediate) lenis.resize();
    lenis.scrollTo(destination, { immediate, force: committing, ...(duration !== undefined && !immediate ? { duration, lerp: 0, easing: (t: number) => t * t * (3 - 2 * t), } : {}), });
  } else {
    window.scrollTo({ top: destination, behavior: immediate ? 'instant' : 'smooth' });
  }
}

function configure() {
  gsap.ticker.remove(tick);
  lenis?.destroy();
  lenis = null;
  if (!media.matches || isIOS()) return;
  lenis = new Lenis({
    autoRaf: false,
    smoothWheel: true,
    syncTouch: false,
    lerp: 0.1,
    anchors: false,
    prevent: element => Boolean(element.closest('dialog')),
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  if (locked || transitioning) lenis.stop();
}

window.addEventListener('leo:gallery-lock', () => {
  locked = true;
  lenis?.stop();
}, { signal });
window.addEventListener('leo:gallery-unlock', (event) => {
  const top = (event as CustomEvent<{scroll:number}>).detail?.scroll ?? window.scrollY;
  locked = false;
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(top, { immediate: true, force: true });
    if (!transitioning) lenis.start();
  }
  ScrollTrigger.update();
}, { signal });

// Other anchors (ABOUT, etc.) keep the existing behavior for now.
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || locked || transitioning) return;
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link || link.hash.length < 2) return;
  let target: HTMLElement | null;
  try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { return; }
  if (!target) return;
  event.preventDefault();
  scrollPage(target.getBoundingClientRect().top + window.scrollY);
}, { signal });

const preventScroll = (event: Event) => { if (transitioning) event.preventDefault(); };
window.addEventListener('wheel', preventScroll, { passive: false, capture: true, signal });
window.addEventListener('touchmove', preventScroll, { passive: false, capture: true, signal });
document.addEventListener('keydown', event => {
  if (transitioning && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Tab', 'Enter'].includes(event.key)) event.preventDefault();
}, { capture: true, signal });
media.addEventListener('change', configure, { signal });
configure();
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    events.abort(); gsap.ticker.remove(tick); lenis?.destroy(); lenis = null;
  });
}
