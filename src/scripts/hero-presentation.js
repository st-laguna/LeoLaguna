// Inline presentation: reuse authored geometry without waiting for module downloads.
function initHeroPresentation(getHeroFrame, prepareHomeEntrance) {

  const isTabletPortrait = () => document.documentElement.hasAttribute('data-tablet-portrait');
  const hero = document.querySelector('.hero');
  const stage = hero.closest('.journey-stage') || hero;
  const journey = hero.closest('.home-journey');
  const journeyReady = () => !journey || journey.hasAttribute('data-journey') || journey.hasAttribute('data-mobile-journey');
  const compositions = Array.from(hero.querySelectorAll('.hero__composition'));
  const masters = JSON.parse(hero.dataset.heroMasters);
  const anchors = Array.from(hero.querySelectorAll('[data-hero-anchor]'));
  const deviceShortSide=Math.min(screen.width,screen.height);
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
    const adaptive = document.documentElement.hasAttribute('data-adaptive-hero');
    const portraitOffset = tabletPortrait && !adaptive ? Math.min(32, height * .02) : 0;
    const m = f.mode === 'ipad-portrait' ? masters.ip : adaptive ? (f.portrait ? masters.mp : masters.ml) : (f.portrait ? masters.v : masters.h);
    if (hero.dataset.heroFrame !== f.mode) hero.dataset.heroFrame = f.mode;
    hero.style.setProperty('--hero-mask-size', `${f.masterWidth * f.scale}px ${f.masterHeight * f.scale}px`);
    hero.style.setProperty('--hero-mask-position', `${f.x}px ${f.y - portraitOffset}px`);
    compositions.forEach(composition => composition.style.transform = `translate(${f.x}px,${f.y - portraitOffset}px) scale(${f.scale})`);
    if (adaptive) {
      hero.style.setProperty('--hero-mask', m.mask);
      compositions.forEach(c => {c.style.transform='none';c.style.width='100%';c.style.height='100%';});
      // Browser chrome changes height, not the authored type scale.
      const shortSide=deviceShortSide||Math.min(width,height);
      const left=parseFloat(getComputedStyle(anchors.find(el=>el.dataset.heroAnchor==='laguna')).left)||12;
      const right=parseFloat(getComputedStyle(hero.querySelector('.hero-services')).right)||12;
      // Portrait fills the safe width. Landscape retains the device's short-side scale.
      const available=f.portrait?width:Math.min(width,shortSide);
      const size=Math.max(.1,(available-left-right)/365);
      hero.style.setProperty('--hero-title-scale',String(size));
      anchors.forEach(el=>{el.removeAttribute('style');});
      hero.setAttribute('data-hero-layout-ready','');
      return;
    }
    // Authored anchors and the mask source only change with the artwork master.
    if (lastPortrait === f.portrait) { hero.setAttribute('data-hero-layout-ready', ''); return; }
    lastPortrait = f.portrait;
    hero.style.setProperty('--hero-mask', m.mask);
    compositions.forEach(composition => composition.style.width = `${f.masterWidth}px`);
    compositions.forEach(composition => composition.style.height = `${f.masterHeight}px`);
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
  // Inline setup can precede the stylesheet's first valid layout. Commit again
  // after parsing; readiness must never depend on a scroll or theme event.
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',measure,{once:true});
  else requestAnimationFrame(measure);
  document.fonts.ready.then(measure);
  // Also covers a responsive attribute change without a stage-size change.
  window.addEventListener('leo:orientation-ready', measure);

  const root = document.documentElement;
  if(root.hasAttribute('data-adaptive-hero')) {
    const button=hero.querySelector('.hero-project');
    const sync=()=>{const hidden=scrollY>24;button.toggleAttribute('data-away',hidden);button.inert=hidden;};
    window.addEventListener('scroll',sync,{passive:true});
    window.addEventListener('pageshow',sync);sync();
  }
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
  let wipe, finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    entrance.clean();
    wipe?.cancel();
    root.removeAttribute('data-home-entry');
    hero.removeAttribute('data-hero-pending');
    window.dispatchEvent(new Event('leo:hero-entry-ready'));
    if (!root.hasAttribute('data-section-history')) history.scrollRestoration = 'auto';
    events.abort();
  }
  const options = { signal: events.signal };
  reduced.addEventListener('change', () => { if (reduced.matches) finish(); }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); }, options);
  window.addEventListener('pagehide', finish, options);
  if (reduced.matches || document.hidden) { finish(); return; }
  // Readable content must not wait for a decorative image to decode.
  void Promise.resolve().then(async () => {
    if (finished) return;
    wipe = curtain?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
      { duration, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'both' });
    entrance.play();
    await Promise.all([entrance.finished(), wipe?.finished.catch(() => {})]);
  }).then(finish).catch(finish);
}



