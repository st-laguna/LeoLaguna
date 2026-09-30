// A finite, shared WAAPI entrance. Geometry transforms remain owned by Hero.
export function prepareHomeEntrance(hero, { delay = 0 } = {}) {
  const empty = { play() {}, clean() {}, finished: () => Promise.resolve() };
  if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return empty;
  const phone = matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)').matches;
  const duration = phone ? 900 : 1000;
  const distance = phone ? 8 : 16;
  const entries = [
    [hero.querySelector('.hero__artwork'), 0],
    [hero.querySelector('[data-hero-anchor="location"]'), 180],
    [hero.querySelector('[data-hero-anchor="capabilities"]'), 340],
    [hero.querySelector('[data-hero-anchor="hour"]'), 510],
    [hero.querySelector('.hero__scroll'), 700],
    ...Array.from(document.querySelectorAll('.site-header .site-nav__items > :not(.mobile-only), .site-header .site-controls > *, .site-header .mobile-menu-toggle')).map((el, i) => [el, 540 + i * 160]),
  ].filter(([el]) => el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  const animations = entries.map(([el, offset], index) => {
    const animation = el.animate([
      { translate: '0 ' + distance + 'px', clipPath: 'inset(0 0 100% 0)' },
      { translate: '0 0', clipPath: 'inset(0 0 -1em 0)' },
    ], { duration, delay: delay + offset * (phone ? .9 : 1), easing: index % 2 ? 'cubic-bezier(.22,.8,.3,1)' : 'cubic-bezier(.25,.8,.25,1)', fill: 'both' });
    animation.pause();
    return animation;
  });
  let played = false;
  return {
    play() { if (played) return; played = true; animations.forEach(a => a.play()); },
    clean() { animations.forEach(a => a.cancel()); },
    finished: () => Promise.all(animations.map(a => a.finished.catch(() => {}))),
  };
}
