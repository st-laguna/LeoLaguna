import { aboutInterests } from './mobileAboutContent';
import { mountMobileAboutWheel } from './mobileAboutWheel';

type State = 'closed' | 'opening' | 'intro' | 'leaving-intro' | 'stickers' | 'closing';
type Point = [number, number];
const W = 1200, H = 1330;
// The shared fracture and all manually tuned layer distances come from the lab.
const portraitRuns: Point[] = [[240,0],[272,1],[368,0],[400,-1],[512,0],[544,1],[656,0],[688,-1],[800,0],[832,1],[944,0],[976,-1],[1200,0]];
const landscapeRuns: Point[] = [[208,0],[240,1],[368,0],[400,-1],[528,0],[560,1],[704,0],[736,-1],[880,0],[912,1],[1056,0],[1088,-1],[1330,0]];

export function mountMobileAbout(section: HTMLElement) {
  const abort = new AbortController();
  const on = (target: EventTarget, name: string, handler: EventListener) => target.addEventListener(name, handler, { signal: abort.signal });
  const root = section.querySelector<HTMLElement>('[data-mobile-about-ui]')!;
  const query = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const frame = query('[data-mobile-frame]');
  const head = query<SVGSVGElement>('[data-mobile-head]');
  const artwork = query<HTMLButtonElement>('[data-mobile-artwork]');

  const next = query<HTMLButtonElement>('[data-mobile-next]');
  const intro = query('#mobile-about-intro');
  const stickers = query('#mobile-about-stickers');
  const dialog = query<HTMLDialogElement>('.mobile-about__info');
  const hint = query('[data-mobile-hint]');
  const hintAction = query<HTMLButtonElement>('[data-mobile-hint-action]');
  const menuToggle = query<HTMLButtonElement>('[data-mobile-menu-toggle]');
  const status = query('[data-mobile-status]');
  const layers = [...root.querySelectorAll<SVGGElement>('[data-mobile-layer]')];
  const orientation = matchMedia('(orientation:portrait)');
  const tablet = matchMedia('(min-width:768px) and (min-height:600px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let state: State = 'closed', destroyed = false, ready = false, assetFamily = '';
  let lastSize = '', lastLauncher: HTMLButtonElement | null = null;
  const originalLabel = section.getAttribute('aria-labelledby');
  // Preferences stay in the desktop subtree, unavailable in this English-only UI.
  const desktopComposition = section.querySelector<HTMLElement>('.about__composition')!;
  const originalDesktopInert = desktopComposition.inert;
  desktopComposition.inert = true;
  section.setAttribute('aria-labelledby', 'mobile-about-title');
  section.setAttribute('data-mobile-about', '');
  document.documentElement.setAttribute('data-about-mobile', '');
  root.dataset.settled = 'true';
  layers.forEach(layer => { layer.dataset.settled = 'true'; });

  function later(fn: () => void, delay: number) {
    const timer = setTimeout(() => { timers.delete(timer); if (!destroyed) fn(); }, delay);
    timers.add(timer);
    return timer;
  }
  function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }
  const busy = () => state === 'opening' || state === 'closing' || state === 'leaving-intro';
  const wheel = mountMobileAboutWheel(stickers, openInterest, text => {status.textContent = text;});
  function setState(value: State) {
    state = value;
    wheel.setEnabled(value === 'stickers');
    root.dataset.state = value;
    root.setAttribute('aria-busy', String(busy()));
    artwork.disabled = busy() || !ready;


    next.disabled = busy();
    menuToggle.disabled = !ready;
    intro.inert = value !== 'intro'; intro.setAttribute('aria-hidden', String(value !== 'intro'));
    stickers.inert = value !== 'stickers'; stickers.setAttribute('aria-hidden', String(value !== 'stickers'));
    hint.textContent = value === 'closed' ? 'tap to explore' : value === 'stickers' ? 'Tap to explore' : '';
    hintAction.hidden = value !== 'closed' && value !== 'stickers';
    hintAction.disabled = value !== 'closed' || !ready;
    artwork.setAttribute('aria-expanded', String(root.dataset.open === 'true'));
    artwork.setAttribute('aria-label', value === 'closed' ? 'Explore About' : value === 'intro' ? 'Explore my interests' : 'Close About exploration');
  }
  const tuning = getComputedStyle(root);
  const unit = parseFloat(tuning.getPropertyValue('--split-unit')) || 8;
  function boundary(runs: Point[], baseline: number, vertical: boolean): Point[] {
    let start = 0;
    return runs.flatMap(([end, offset]) => {
      const cross = baseline + offset * unit;
      const pair: Point[] = vertical ? [[cross,start],[cross,end]] : [[start,cross],[end,cross]];
      start = end; return pair;
    });
  }
  function polygon(side: string, points: Point[]) { query(`#ma-split-${side} polygon`).setAttribute('points', points.map(p => p.join(',')).join(' ')); }
  const horizontal = boundary(portraitRuns, 416, false), vertical = boundary(landscapeRuns, 608, true);
  polygon('top', [[0,0],[W,0], ...horizontal.slice().reverse()]);
  polygon('bottom', [...horizontal, [W,H],[0,H]]);
  polygon('left', [[0,0], ...vertical, [0,H]]);
  polygon('right', [[W,0],[W,H], ...vertical.slice().reverse()]);
  // Static gradient rims clipped to source alpha: no blur or animated filters.
  const softness = parseFloat(tuning.getPropertyValue('--contact-shadow-softness')) || 0;
  const inset = parseFloat(tuning.getPropertyValue('--contact-shadow-offset')) || 0;
  root.querySelectorAll<SVGGElement>('.mobile-about__shadow').forEach(shadow => {
    const first = shadow.parentElement!.classList.contains('first');
    for (const landscape of [false, true]) {
      const runs = landscape ? landscapeRuns : portraitRuns;
      const target = shadow.querySelector(landscape ? '.mobile-about__shadow-landscape' : '.mobile-about__shadow-portrait')!;
      target.replaceChildren();
      let start = 0;
      for (const [end, step] of runs) {
        const edge = (landscape ? 608 : 416) + step * unit;
        const cross = first ? edge - inset - softness : edge + inset;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const attrs = { x: landscape ? cross : start, y: landscape ? start : cross, width: landscape ? softness : end - start, height: landscape ? end - start : softness };
        Object.entries(attrs).forEach(([key, value]) => rect.setAttribute(key, String(value)));
        rect.setAttribute('fill', `url(#ma-contact-${landscape ? (first ? 'left' : 'right') : (first ? 'up' : 'down')})`);
        target.append(rect); start = end;
      }
    }
  });
  function syncAssets() {
    const family = tablet.matches || document.documentElement.hasAttribute('data-ipad') ? 'ipad-a8' : 'mobile-a8';
    if (family === assetFamily) return [] as Promise<unknown>[];
    assetFamily = family;
    return layers.map(layer => {
      const url = `/about/img/${family}/${layer.dataset.mobileLayer}.webp`;
      layer.querySelectorAll('image').forEach(image => image.setAttribute('href', url));
      root.querySelector(`[data-mobile-shadow-source="${layer.dataset.mobileLayer}"]`)?.setAttribute('href', url);
      const image = new Image(); image.src = url;
      return image.decode().catch(() => { if (!destroyed) status.textContent = 'Some artwork could not load. You can still explore About.'; });
    });
  }
  function syncComposition() {
    if (destroyed || busy()) return;
    const size = frame.getBoundingClientRect();
    const mode = orientation.matches ? 'portrait' : 'landscape';
    const sizeKey = `${size.width}:${size.height}:${mode}`;
    if (sizeKey === lastSize || !size.width || !size.height) return;
    lastSize = sizeKey;
    root.dataset.orientation = mode;
    // Read geometry once per resize; no animation-frame measurements.
    const scale = head.getBoundingClientRect().width / W;
    const style = getComputedStyle(root);
    root.style.setProperty('--split-distance-portrait', `${size.height * parseFloat(style.getPropertyValue('--portrait-gap')) / (2 * scale)}px`);
    root.style.setProperty('--split-distance-landscape', `${size.width * parseFloat(style.getPropertyValue('--landscape-gap')) / (2 * scale)}px`);
    syncAssets();
  }
  function loadStickers() {
    root.querySelectorAll<HTMLImageElement>('[data-sticker-asset]').forEach(image => {
      if (image.hasAttribute('src')) return;
      const asset = image.dataset.stickerAsset;
      image.sizes = orientation.matches ? '42vw' : '20vw';
      image.srcset = `/about/img/about_mobile/responsive/${asset}-640.webp 640w, /about/img/about_mobile/responsive/${asset}-960.webp 960w`;
      image.src = `/about/img/about_mobile/responsive/${asset}-640.webp`;
    });
  }
  const milliseconds = (value: string) => parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
  function totalTime(piece: Element) {
    const style = getComputedStyle(piece);
    return milliseconds(style.transitionDuration) + milliseconds(style.transitionDelay);
  }
  function settleLayer(layer: SVGGElement) { if (state === 'closing') layer.dataset.settled = 'true'; }
  function finishSplit() {
    if (state !== 'opening' && state !== 'closing') return;
    clearTimers();
    const closed = root.dataset.open === 'false';
    root.dataset.finishing = 'true';
    root.dataset.settled = String(closed);
    layers.forEach(layer => { layer.dataset.settled = String(closed); });
    setState(closed ? 'closed' : 'intro');
    lastSize = ''; syncComposition();
    root.getBoundingClientRect(); // Commit any deferred rotation without a second transition.
    delete root.dataset.finishing;
    if (closed) { artwork.focus({ preventScroll: true }); status.textContent = 'About closed.'; }
    else { loadStickers(); status.textContent = 'About open. Tap to explore my interests.'; }
  }
  function split(open: boolean) {
    if (!ready || busy()) return;
     dialog.close(); clearTimers();
    root.dataset.settled = 'false';
    layers.forEach(layer => { layer.dataset.settled = 'false'; });
    root.dataset.open = String(open);
    setState(open ? 'opening' : 'closing');
    if (!open) layers.forEach(layer => { const time = totalTime(layer.querySelector('.first')!); later(() => settleLayer(layer), time ? time + 20 : 0); });
    const total = Math.max(...layers.map(layer => totalTime(layer.querySelector('.first')!)));
    later(finishSplit, total ? total + 34 : 0);
  }
  function showStickers() {
    if (state !== 'intro') return;
    loadStickers(); setState('leaving-intro');
    later(() => {
      setState('stickers'); status.textContent = 'Six interests. Swipe to choose; tap the centered sticker to learn more.';
      if (document.activeElement === next) query<HTMLButtonElement>('[data-active="true"] [data-mobile-interest]').focus({ preventScroll: true });
    }, reduced.matches ? 0 : 260);
  }
  function autoOpen() {
    const delay = reduced.matches ? 0 : parseFloat(getComputedStyle(root).getPropertyValue('--split-start-delay')) || 0;
    hintAction.hidden = true;
    later(() => { if (state === 'closed') split(true); }, delay);
  }
  function activate() { if (state === 'closed') split(true); else if (state === 'intro') showStickers(); else if (state === 'stickers') split(false); }
  on(artwork, 'click', activate);
  on(hintAction, 'click', () => { if (state === 'closed') split(true); });
  on(next, 'click', showStickers);
  on(intro, 'click', event => { if (!(event.target as Element).closest('button')) showStickers(); });

  on(artwork, 'keydown', event => { const key = event as KeyboardEvent; if (key.repeat && (key.key === 'Enter' || key.key === ' ')) key.preventDefault(); });
  on(head, 'transitionend', event => {
    const transition = event as TransitionEvent;
    if (transition.propertyName === 'transform' && (event.target as Element).matches('.mobile-about__piece.first')) settleLayer((event.target as Element).closest<SVGGElement>('[data-mobile-layer]')!);
  });
  function openInterest(button: HTMLButtonElement) {
    const interest = aboutInterests.find(item => item.id === button?.dataset.mobileInterest);
    if (!button || !interest || state !== 'stickers') return;
    lastLauncher = button;
    query('#mobile-about-info-title').textContent = interest.title;
    query('[data-mobile-info-copy]').textContent = interest.copy;
    const image = query<HTMLImageElement>('[data-mobile-info-image]');
    image.alt = `${interest.title.toLowerCase()} — a little part of my life`;
    image.src = `/about/img/about_mobile/${interest.photo}.webp`;
    if (!dialog.open) {wheel.setObscured(true);dialog.showModal();}
  }
  on(query('[data-mobile-info-close]'), 'click', () => dialog.close());
  on(dialog, 'click', event => { if (event.target !== dialog) return; const mouse = event as MouseEvent; const box = dialog.getBoundingClientRect(); if (mouse.clientX < box.left || mouse.clientX > box.right || mouse.clientY < box.top || mouse.clientY > box.bottom) dialog.close(); });
  on(dialog, 'close', () => { wheel.setObscured(false); if (!destroyed && state === 'stickers') lastLauncher?.focus({ preventScroll: true }); });
  on(root, 'keydown', event => {
    const key = event as KeyboardEvent;
    if (root.hasAttribute('data-menu-open')) return; // Shared menu owns its keys.
    if (key.key === 'Escape' && !dialog.open && !busy() && state !== 'closed') split(false);
  });
  on(orientation, 'change', () => { if (state === 'opening' || state === 'closing') finishSplit(); else syncComposition(); });
  on(tablet, 'change', () => { syncAssets(); });
  on(reduced, 'change', () => { if (reduced.matches) { if (state === 'leaving-intro') { clearTimers(); setState('stickers'); } else finishSplit(); } });
  on(document, 'visibilitychange', () => { if (document.hidden) { if (state === 'leaving-intro') { clearTimers(); setState('stickers'); } else finishSplit(); } });
  on(window, 'pagehide', () => { if (state === 'leaving-intro') { clearTimers(); setState('stickers'); } else finishSplit(); if (state === 'closed') clearTimers();  dialog.close(); });
  on(window, 'pageshow', event => { if ((event as PageTransitionEvent).persisted && ready && state === 'closed') autoOpen(); });
  const observer = new ResizeObserver(syncComposition); observer.observe(frame);
  setState('closed');
  const assets = syncAssets(); syncComposition();
  // Bounded first-paint gate, shared with desktop's existing loading indicator.
  let revealing = false;
  const reveal = () => {
    if (revealing) return;
    if (destroyed || ready) return;
    revealing = true;
    clearTimeout((window as Window & { __aboutLoadingFallback?: number }).__aboutLoadingFallback);
    document.documentElement.removeAttribute('data-about-loading');
    section.closest<HTMLElement>('[data-page-content]')?.style.removeProperty('opacity');
    // No second entrance overlay or waiting for a tap: open as soon as ready.
    ready = true; setState(state); autoOpen();
  };
  const revealFallback = later(reveal, 4000);
  Promise.allSettled(assets).then(() => { clearTimeout(revealFallback); timers.delete(revealFallback); reveal(); });
  return {
    mode: 'mobile',
    dispose() {
      destroyed = true; wheel.dispose(); abort.abort(); observer.disconnect(); clearTimers(); dialog.close();
      
      desktopComposition.inert = originalDesktopInert;
      if (originalLabel) section.setAttribute('aria-labelledby', originalLabel);
      section.removeAttribute('data-mobile-about');
      root.dataset.state = 'closed'; root.dataset.open = 'false'; root.dataset.settled = 'true';
      root.querySelectorAll<HTMLImageElement>('[data-sticker-asset]').forEach(image => { image.removeAttribute('src'); image.removeAttribute('srcset'); });
    },
  };
}
