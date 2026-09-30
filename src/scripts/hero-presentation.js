// Inline presentation: reuse authored geometry without waiting for module downloads.
function initHeroPresentation(getHeroFrame, prepareHomeEntrance) {

  const isTabletPortrait = () => document.documentElement.hasAttribute('data-tablet-portrait');
  const hero = document.querySelector('.hero');
  const stage = hero.closest('.journey-stage') || hero;
  const journey = hero.closest('.home-journey');
  const journeyReady = () => !journey || journey.hasAttribute('data-journey') || journey.hasAttribute('data-mobile-journey');
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
    const { width, height } = (journeyReady() ? stage : hero).getBoundingClientRect();
    layout(width, height);
  };
  const observer = new ResizeObserver(([entry]) => {
    // Before Journey initializes, the stage includes other content in normal flow.
    if (!journeyReady()) { measure(); return; }
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
  // Consume the flag before deferred navigation runs: only one initial entrance.
  root.removeAttribute('data-hero-intro');
  hero.setAttribute('data-hero-pending', '');
  const curtain = document.querySelector('[data-home-curtain]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const phone = matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)').matches;
  const duration = phone ? 380 : 500;
  const entrance = prepareHomeEntrance(hero, { delay: duration * .7 });
  let wipe, timeout, finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    entrance.clean();
    wipe?.cancel();
    root.removeAttribute('data-home-entry');
    hero.removeAttribute('data-hero-pending');
    history.scrollRestoration = 'auto';
    events.abort();
  }
  const options = { signal: events.signal };
  reduced.addEventListener('change', () => { if (reduced.matches) finish(); }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, options);
  window.addEventListener('pagehide', finish, options);
  if (reduced.matches || document.hidden) { finish(); return; }
  const activeImage = hero.querySelector(root.dataset.theme === 'dark' ? '.hero__image--dark' : '.hero__image--light');
  const critical = [...hero.querySelectorAll('.hero__artwork img'), activeImage].filter(Boolean);
  const ready = Promise.allSettled(critical.map(image => Promise.resolve().then(() => image.decode())));
  const deadline = new Promise(resolve => { timeout = setTimeout(resolve, 450); });
  void Promise.race([ready, deadline]).then(async () => {
    clearTimeout(timeout);
    if (finished) return;
    wipe = curtain?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
      { duration, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'both' });
    entrance.play();
    await Promise.all([entrance.finished(), wipe?.finished.catch(() => {})]);
  }).then(finish).catch(finish);
}
