import { ScrollTrigger } from 'gsap/ScrollTrigger';

type StopGroup = { host: HTMLElement; offsets: () => number[]; markers: HTMLElement[] };
const groups = new Set<StopGroup>();
let observe: ResizeObserver | undefined;
let schedule = () => {};

// Offsets come from the actual animation, not duplicated responsive breakpoints.
export function registerScrollStops(host: HTMLElement, offsets: () => number[] = () => [0]) {
  if (document.documentElement.hasAttribute('data-ipad')) return () => {};
  const group = { host, offsets, markers: [] as HTMLElement[] };
  groups.add(group); observe?.observe(host); schedule();
  return () => {
    groups.delete(group); observe?.unobserve(host);
    group.markers.forEach(marker => marker.remove()); schedule();
  };
}

// Convert wheel effort to distance. Friction rises toward each point and falls
// afterwards; the result always retains the input direction and never overshoots.
export function paceWheel(from: number, delta: number, stops: number[], height: number) {
  if (!delta || !stops.length || height <= 0) return delta;
  const direction = Math.sign(delta);
  let effort = Math.abs(delta);
  const next = stops.filter(stop => (stop - from) * direction > height * .12)
    .sort((a, b) => (a - b) * direction)[0];
  // A single extreme wheel event cannot leap over the next featured section.
  if (next !== undefined) effort = Math.min(effort, Math.abs(next - from) + height * .18);
  const end = from + effort * direction;
  const low = Math.min(from, end), high = Math.max(from, end);
  const bands = stops.flatMap(stop => [.75, .5, .3, .5, .75].map((factor, i) => ({
    start: stop + (i - 2.5) * height * .18,
    end: stop + (i - 1.5) * height * .18, factor,
  })));
  const edges = [from, end, ...bands.flatMap(band => [band.start, band.end])
    .filter(edge => edge > low && edge < high)].sort((a, b) => (a - b) * direction);
  let distance = 0;
  for (let i = 1; i < edges.length; i++) {
    const middle = (edges[i - 1] + edges[i]) / 2;
    const factor = Math.min(1, ...bands.filter(band => middle >= band.start && middle <= band.end).map(band => band.factor));
    const span = Math.abs(edges[i] - edges[i - 1]);
    const travel = Math.min(span, effort * factor);
    distance += travel; effort -= travel / factor;
    if (effort <= .001) break;
  }
  return distance * direction;
}

export function createScrollPacing(blocked: () => boolean) {
  const root = document.documentElement;
  // Native iPad scrolling has no snap markers, observers, or rearming loop.
  if (root.hasAttribute('data-ipad')) {
    root.removeAttribute('data-scroll-pacing');
    return {
      setNative(_value: boolean) {},
      suspend() {},
      wheel(_from: number, delta: number) { return delta; },
      dispose() {},
    };
  }
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const events = new AbortController();
  const { signal } = events;
  let native = true, nativeInput = false, bypass = false, frame = 0;
  let stops: number[] = [], viewportHeight = innerHeight;
  function apply() {
    const enabled = (native || nativeInput) && !bypass && !blocked() && !reduced.matches && stops.length > 0;
    if (enabled && root.getAttribute('data-scroll-pacing') !== 'native') root.setAttribute('data-scroll-pacing', 'native');
    else if (!enabled && root.hasAttribute('data-scroll-pacing')) root.removeAttribute('data-scroll-pacing');
  }
  function measure() {
    frame = 0;
    viewportHeight = innerHeight;
    // Batch geometry reads before changing the invisible snap markers.
    const geometry = [...groups].filter(group => group.host.isConnected).map(group => ({
      group, top: group.host.getBoundingClientRect().top + scrollY,
      offsets: group.offsets().filter(Number.isFinite),
    }));
    stops = geometry.flatMap(item => item.offsets.map(offset => item.top + offset)).sort((a, b) => a - b);
    for (const { group, offsets } of geometry) {
      while (group.markers.length > offsets.length) group.markers.pop()!.remove();
      offsets.forEach((offset, index) => {
        let marker = group.markers[index];
        if (!marker) {
          marker = document.createElement('span');
          marker.setAttribute('data-scroll-stop', '');
          marker.setAttribute('aria-hidden', 'true');
          group.host.append(marker); group.markers.push(marker);
        }
        const top = `${offset.toFixed(3)}px`;
        if (marker.style.top !== top) marker.style.top = top;
      });
    }
    apply();
  }
  schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
  observe = new ResizeObserver(schedule);
  groups.forEach(group => observe!.observe(group.host));
  ScrollTrigger.addEventListener('refresh', schedule);
  window.addEventListener('resize', schedule, { passive: true, signal });

  // Explicit navigation stays exact. Only a subsequent user gesture rearms pacing.
  const suspend = () => { bypass = true; apply(); };
  const resume = () => {
    if (blocked()) return;

    bypass = false;
    apply();
  };
  window.addEventListener('touchstart', () => { nativeInput = true; resume(); }, { passive: true, signal });
  window.addEventListener('wheel', () => {
    nativeInput = false;

    resume();
  }, { passive: true, signal });
  window.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(event.key)) {
      nativeInput = true;
      resume();
    }
    else if (['Home', 'End', 'Tab'].includes(event.key)) suspend();
  }, { signal });
  window.addEventListener('leo:orientation-ready', () => { suspend(); schedule(); }, { signal });
  reduced.addEventListener('change', apply, { signal });
  schedule();
  return {
    setNative(value: boolean) { native = value; nativeInput = false; apply(); },
    suspend,
    wheel(from: number, delta: number) {
      return reduced.matches || blocked() || bypass ? delta : paceWheel(from, delta, stops, viewportHeight);
    },
    dispose() {
      events.abort(); cancelAnimationFrame(frame); observe?.disconnect(); observe = undefined;
      ScrollTrigger.removeEventListener('refresh', schedule); schedule = () => {};
      groups.forEach(group => { group.markers.forEach(marker => marker.remove()); group.markers = []; });
      root.removeAttribute('data-scroll-pacing');
    },
  };
}
