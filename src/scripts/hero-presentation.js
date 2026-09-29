// Inline presentation: reuse authored geometry without waiting for module downloads.
function initHeroPresentation(getHeroFrame) {

  const isTabletPortrait = () => document.documentElement.hasAttribute('data-tablet-portrait');
  const hero = document.querySelector('.hero');
  const stage = hero.closest('.journey-stage') || hero;
  const composition = hero.querySelector('.hero__composition');
  const masters = JSON.parse(hero.dataset.heroMasters);
  const anchors = Array.from(hero.querySelectorAll('[data-hero-anchor]'));
  let lastWidth = 0, lastHeight = 0;
  let lastTabletPortrait;
  let lastPortrait;
  function layout(width, height) {
    if (!width || !height) return;
    const tabletPortrait = isTabletPortrait();
    if (width === lastWidth && height === lastHeight && tabletPortrait === lastTabletPortrait) return;
    lastWidth = width;
    lastHeight = height;
    lastTabletPortrait = tabletPortrait;
    const f = getHeroFrame(width, height);
    const portraitOffset = tabletPortrait ? Math.min(32, height * .02) : 0;
    const m = f.portrait ? masters.v : masters.h;
    if (hero.dataset.heroFrame !== f.mode) hero.dataset.heroFrame = f.mode;
    hero.style.setProperty('--hero-mask-size', `${f.masterWidth * f.scale}px ${f.masterHeight * f.scale}px`);
    hero.style.setProperty('--hero-mask-position', `${f.x}px ${f.y - portraitOffset}px`);
    composition.style.transform = `translate(${f.x}px,${f.y - portraitOffset}px) scale(${f.scale})`;
    // Authored anchors and the mask source only change with the artwork master.
    if (lastPortrait === f.portrait) return;
    lastPortrait = f.portrait;
    hero.style.setProperty('--hero-mask', m.mask);
    composition.style.width = `${f.masterWidth}px`;
    composition.style.height = `${f.masterHeight}px`;
    anchors.forEach(element => {
      const name = element.dataset.heroAnchor;
      const id = f.portrait ? `anchor-${name === 'location' ? 'lima-peru' : name}_v` : `anchor-${name === 'hour' ? 'location' : name}_h`;
      const a = { ...m.anchors[id] };
      if (!f.portrait && (name === 'location' || name === 'hour')) {
        a.h /= 2;
        if (name === 'hour') a.y += a.h;
      }
      element.dataset.anchorId = id;
      Object.assign(element.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${a.w}px`, height: `${a.h}px`, transform: `rotate(${a.angle}deg)`, fontSize: `${name === 'capabilities' ? a.w / 13 : a.w / 11}px`, lineHeight: `${a.h}px` });
    });
    hero.setAttribute('data-hero-layout-ready', '');
  }
  const measure = () => {
    const { width, height } = stage.getBoundingClientRect();
    layout(width, height);
  };
  const observer = new ResizeObserver(([entry]) => {
    // Reuse the browser's completed layout instead of measuring after DOM writes.
    const box = entry.borderBoxSize?.[0];
    if (box) layout(box.inlineSize, box.blockSize);
    else measure();
  });
  observer.observe(stage, { box: 'border-box' });
  measure();
  // Also covers a responsive attribute change without a stage-size change.
  window.addEventListener('leo:orientation-ready', measure);

  const root = document.documentElement;
  if (!root.hasAttribute('data-hero-intro')) return;
  // Consume initial entry before deferred navigation modules run; navigation is unchanged.
  hero.setAttribute('data-hero-pending', '');
  hero.setAttribute('data-hero-artwork-pending', '');
  hero.setAttribute('data-hero-media-pending', '');
  root.removeAttribute('data-hero-intro');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const animations = [];
  const timers = new Set();
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();
    hero.removeAttribute('data-hero-artwork-pending');
    hero.removeAttribute('data-hero-media-pending');
    hero.removeAttribute('data-hero-pending');
    history.scrollRestoration = 'auto';
    animations.forEach(animation => animation.cancel());
    events.abort();
  }
  const options = { signal: events.signal };
  reduced.addEventListener('change', () => { if (reduced.matches) finish(); }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, options);
  window.addEventListener('pagehide', finish, options);
  if (reduced.matches || document.hidden) { finish(); return; }
  const activeImage = hero.querySelector(root.dataset.theme === 'dark' ? '.hero__image--dark' : '.hero__image--light');
  const artworkImages = [...hero.querySelectorAll('.hero__artwork img')];
  const artworkReady = Promise.allSettled(artworkImages.map(image => Promise.resolve().then(() => image.decode())));
  const mediaReady = Promise.resolve().then(() => activeImage?.decode()).catch(() => {});
  async function reveal(selector, pending, ready) {
    let timer, animation;
    try {
      const timeout = new Promise(resolve => { timer = setTimeout(resolve, 800); });
      timers.add(timer);
      await Promise.race([ready, timeout]);
      clearTimeout(timer);
      timers.delete(timer);
      if (finished) return;
      const element = hero.querySelector(selector);
      if (!element) return;
      animation = element.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 700, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both',
      });
      animations.push(animation);
      await animation.finished;
    } finally {
      clearTimeout(timer);
      timers.delete(timer);
      hero.removeAttribute(pending);
      animation?.cancel();
    }
  }
  void Promise.allSettled([
    reveal('.hero__artwork', 'data-hero-artwork-pending', artworkReady),
    reveal('.hero__mask', 'data-hero-media-pending', mediaReady),
  ]).then(finish).catch(finish);
}
