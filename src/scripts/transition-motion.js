// All timings are seconds. Insets are percentages of the viewport.
export const SECTION_TRANSITION = {
  width: 80,
  startTop: 81,
  startBottom: 19,
  cover: 1.65,
  covered: 0.08,
  reveal: 1.05,
  // Snapshot sequence: the destination follows the leading block immediately.
  duration: 1.25,
  followDelay: 0.16,
  contentDelay: 0.38,
  letterStagger: 0.018,
};

// Two overlapping impulses. Each starts/ends with zero velocity AND
// acceleration; the overlap avoids a stop between the vertical and lateral move.
export function smoothPulse(progress, start, end) {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function openingClip(progress) {
  const rise = smoothPulse(progress, 0, 0.76);
  const spread = smoothPulse(progress, 0.38, 1);
  const top = SECTION_TRANSITION.startTop * (1 - 0.88 * rise - 0.12 * spread);
  const side = (100 - SECTION_TRANSITION.width) / 2 * (1 - 0.16 * rise - 0.84 * spread);
  const bottom = SECTION_TRANSITION.startBottom * (1 - 0.28 * rise - 0.72 * spread);
  return `inset(${Math.max(0, top)}% ${Math.max(0, side)}% ${Math.max(0, bottom)}%)`;
}

// Start each entrance just before the moving edge reaches its position.
// A heading near the top must not finish animating while it is still masked.
function entranceDelay(element) {
  const y = Math.max(0, Math.min(100, element.getBoundingClientRect().top / innerHeight * 100));
  let p = 0;
  while (p < 1 && Number(openingClip(p).match(/[\d.]+/)[0]) > y) p += 0.005;
  return Math.max(SECTION_TRANSITION.contentDelay,
    SECTION_TRANSITION.followDelay + p * SECTION_TRANSITION.duration - 0.12) * 1000;
}


export function prepareEntrances(section) {
  const restores = [];
  const animations = [];
  const scope = section ?? document.querySelector('.hero, #home');
  if (!scope) return { play() {}, clean() {}, finished: () => Promise.resolve() };
  const visible = (element) => {
    const r = element.getBoundingClientRect();
    const css = getComputedStyle(element);
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight &&
      r.right > 0 && r.left < innerWidth && css.visibility !== 'hidden' &&
      Number(css.opacity) > 0 && !element.closest('[hidden], [inert]');
  };
  const animate = (element, delay, distance) => {
    const animation = element.animate([
      { opacity: 0, translate: `0 ${distance}` },
      { opacity: getComputedStyle(element).opacity, translate: '0 0' },
    ], { duration: 700, delay, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' });
    animation.pause();
    animations.push(animation);
  };
  const headings = Array.from(scope.querySelectorAll('h1, h2, [data-transition-title]'))
    .filter(visible).filter(el => !el.closest('[data-footer-enter]'));
  headings.forEach((heading, titleIndex) => {
    const delay = entranceDelay(heading) + titleIndex * 40;
    // Keep rich titles, links and SVGs intact. Plain titles get word-safe
    // character staggering; original text nodes are restored after the reveal.
    const text = heading.textContent ?? '';
    if (heading.children.length || text.length > 140) {
      animate(heading, delay, '30px');
      return;
    }
    const nodes = Array.from(heading.childNodes);
    const label = heading.getAttribute('aria-label');
    heading.setAttribute('aria-label', text);
    const fragment = document.createDocumentFragment();
    let index = 0;
    const letters = [];
    for (const word of text.split(/(\s+)/)) {
      if (/^\s*$/.test(word)) { fragment.append(document.createTextNode(word)); continue; }
      const group = document.createElement('span');
      group.style.cssText = 'display:inline-block;white-space:nowrap;';
      group.setAttribute('aria-hidden', 'true');
      for (const char of Array.from(word)) {
        const letter = document.createElement('span');
        letter.style.cssText = 'display:inline-block;';
        letter.textContent = char;
        group.append(letter); letters.push(letter);
      }
      fragment.append(group);
    }
    heading.replaceChildren(fragment);
    // Limit the stagger span so long titles finish before the snapshot settles.
    const step = Math.min(SECTION_TRANSITION.letterStagger * 1000, 320 / Math.max(1, letters.length));
    letters.forEach(letter => animate(letter, delay + index++ * step, '0.85em'));
    restores.push(() => {
      heading.replaceChildren(...nodes);
      if (label === null) heading.removeAttribute('aria-label');
      else heading.setAttribute('aria-label', label);
    });
  });
  const candidates = Array.from(scope.querySelectorAll(
    '[data-transition-enter], p, .project-media, [data-copy], [data-marquee-svg], .hero__subtitle'
  )).filter(visible).filter(el => !el.closest('[data-footer-enter], h1, h2, [data-transition-title]'));
  candidates.filter(el => !candidates.some(parent => parent !== el && parent.contains(el)))
    .slice(0, 10).forEach((el, index) => animate(el,
      entranceDelay(el) + Math.min(index * 40, 180), '24px'));
  return {
    play: () => animations.forEach(animation => animation.play()),
    clean: () => { animations.forEach(animation => animation.cancel()); restores.forEach(restore => restore()); },
    finished: () => Promise.all(animations.map(animation => animation.finished.catch(() => {}))),
  };
}

export function snapshotFrames() {
  const oldFrames = [], newFrames = [];
  for (let index = 0; index <= 120; index++) {
    const p = index / 120;
    const [top, side, bottom] = openingClip(p).match(/[\d.]+/g).map(Number);
    const right = 100-side, lower = 100-bottom;
    oldFrames.push({offset:p,
      clipPath: `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${side}% ${top}%, ${side}% ${lower}%, ${right}% ${lower}%, ${right}% ${top}%, ${side}% ${top}%)`,
      filter: `brightness(${1-0.015*smoothPulse(p,0,0.12)})`});
    newFrames.push({offset:p,clipPath:openingClip(p)});
  }
  return {oldFrames,newFrames};
}
