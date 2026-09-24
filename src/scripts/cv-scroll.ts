import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 810px)');
const events = new AbortController();
let instances: Lenis[] = [];
let frame = 0;
function stop() {
  cancelAnimationFrame(frame); frame = 0;
  instances.forEach(instance => instance.destroy()); instances = [];
}
function configure() {
  stop();
  if (reduced.matches || document.hidden) return;
  if (desktop.matches) {
    for (const selector of ['.cv-sidebar', '.cv-content']) {
      const wrapper = document.querySelector<HTMLElement>(selector);
      const content = wrapper?.querySelector<HTMLElement>(`${selector}-inner`);
      if (wrapper && content) instances.push(new Lenis({wrapper,content,lerp:.08}));
    }
  } else instances.push(new Lenis({lerp:.08}));
  const tick = (time: number) => {
    instances.forEach(instance => instance.raf(time));
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}
const options = {signal:events.signal};
reduced.addEventListener('change', configure, options);
desktop.addEventListener('change', configure, options);
window.addEventListener('pagehide', stop, options);
window.addEventListener('pageshow', configure, options);
document.addEventListener('visibilitychange', configure, options);
configure();
if (import.meta.hot) import.meta.hot.dispose(() => {stop();events.abort();});
