import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 810px) and (min-height: 501px), (min-width: 1001px)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const events = new AbortController();
let instances: Lenis[] = [];
let frame = 0;
const animating = () => instances.some(instance => instance.isScrolling === 'smooth');
function tick(time: number) {
  // Keep the pending marker during callbacks so scroll events cannot enqueue twice.
  instances.forEach(instance => instance.raf(time));
  frame = 0;
  if (!document.hidden && animating()) frame = requestAnimationFrame(tick);
}
function wake() {
  if (frame || document.hidden || !animating()) return;
  // Idle time must not become the first animation delta (which would jump to target).
  const now = performance.now();
  instances.forEach(instance => { instance.time = now; });
  frame = requestAnimationFrame(tick);
}
class CVLenis extends Lenis {
  override scrollTo(...args: Parameters<Lenis['scrollTo']>) {
    super.scrollTo(...args);
    // Wheel, sync-touch and programmatic animation all enter through scrollTo.
    wake();
  }
}
function stop() {
  cancelAnimationFrame(frame); frame = 0;
  instances.forEach(instance => instance.destroy()); instances = [];
}
function configure() {
  stop();
  // Touch and single-column layouts keep the native document scroller.
  if (reduced.matches || document.hidden || !desktop.matches || !finePointer.matches) return;
  if (desktop.matches) {
    for (const selector of ['.cv-sidebar', '.cv-content']) {
      const wrapper = document.querySelector<HTMLElement>(selector);
      const content = wrapper?.querySelector<HTMLElement>(`${selector}-inner`);
      if (wrapper && content) instances.push(new CVLenis({wrapper,content,lerp:.08}));
    }
  }
}
const options = {signal:events.signal};
reduced.addEventListener('change', configure, options);
desktop.addEventListener('change', configure, options);
finePointer.addEventListener('change', configure, options);
window.addEventListener('pagehide', stop, options);
window.addEventListener('pageshow', configure, options);
document.addEventListener('visibilitychange', configure, options);
configure();
if (import.meta.hot) import.meta.hot.dispose(() => {stop();events.abort();});
