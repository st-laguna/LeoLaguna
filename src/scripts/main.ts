import { isIPadPortrait } from './ipad-layout';
import './entrances';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './smooth-scroll';
import './page-transition';

gsap.registerPlugin(ScrollTrigger);

const hero = document.querySelector<HTMLElement>('.hero');
const mask = hero?.querySelector<HTMLElement>('.hero__mask');
const image = hero?.querySelector<HTMLElement>('.hero__parallax');
const clock = document.querySelector<HTMLElement>('[data-lima-clock]');

if (clock) {
  const formatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const updateClock = () => {
    clock.textContent = formatter.format(new Date());
  };

  updateClock();
  const timer = window.setInterval(updateClock, 1000);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => window.clearInterval(timer));
  }
}
if (hero && mask && image) {
  const phoneMask = window.matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px), (min-width:701px) and (max-width:1100px) and (orientation:portrait)');
  // Ajusta la geometría del logo al tamaño real de la portada.
  function updateMask() {
    hero?.querySelectorAll<HTMLSourceElement>('picture source').forEach(source => {
      source.dataset.originalMedia ||= source.media;
      source.media = isIPadPortrait() ? 'all' : source.dataset.originalMedia;
    });
    if (!hero || !mask) return;
    if(hero.closest('[data-journey],[data-mobile-journey]'))return;

    if ((phoneMask.matches || isIPadPortrait())) {
      if(hero.closest('[data-mobile-journey]')) return;
      const url = isIPadPortrait() ? hero.dataset.ipadMask! : hero.dataset.phoneMask!;
      mask.dataset.portalMask = url;
      mask.style.setProperty('mask-image', url);
      mask.style.setProperty('-webkit-mask-image', url);
      return;
    }

    const { width, height } = hero.getBoundingClientRect();
    if (!width || !height) return;

    const w = 1366;
    const h = (height / width) * w;

    // Conserva el centro del diseño y adapta los brazos exteriores.
    const factor = Math.min(1, h / 768);
    const offset = (h - 768 * factor) / 2;
    const y = (value: number) => value * factor + offset;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 ${w} ${h}">
        <g fill="white">
          <!-- Brazo superior: toca el borde de arriba -->
          <polygon points="
            262.25,0
            0,${y(450.9)}
            334.91,${y(450.9)}
            597.09,0
          "/>

          <!-- Pie de la L izquierda -->
          <polygon points="
            334.91,${y(450.9)}
            196.28,${y(689.77)}
            643.29,${y(689.77)}
            781.63,${y(450.9)}
          "/>

          <!-- Parte superior de la figura derecha -->
          <polygon points="
            1031.29,${y(308.79)}
            1170.53,${y(69.9)}
            723.52,${y(69.9)}
            584.97,${y(308.79)}
          "/>

          <!-- Brazo inferior: toca el borde de abajo -->
          <polygon points="
            1031.29,${y(308.79)}
            761.25,${h}
            1096.53,${h}
            1366,${y(308.79)}
          "/>
        </g>
      </svg>
    `;

    const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

    mask.dataset.portalMask=url;
    if(!hero.closest('[data-journey]'))mask.style.setProperty('mask-image', url);

  }

  updateMask();

  const observer = new ResizeObserver(updateMask);
  observer.observe(hero);
  phoneMask.addEventListener('change', updateMask);
  window.addEventListener('leo:ipad-layout', updateMask);

  // Mueve únicamente la imagen, respetando movimiento reducido.
  const media = gsap.matchMedia();

  media.add(hero.closest('.home-journey')?'(prefers-reduced-motion: no-preference) and (max-width:1000px), (prefers-reduced-motion: no-preference) and (max-height:680px)':'(prefers-reduced-motion: no-preference)', () => {
    if ((phoneMask.matches || isIPadPortrait())) return;
    gsap.fromTo(
      image,
      { y: 0 },
      {
        y: () => hero.clientHeight * 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
          invalidateOnRefresh: true,
        },
      }
    );
  });

  // Limpieza cuando Vite actualiza este módulo durante el desarrollo.
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      observer.disconnect();
      phoneMask.removeEventListener('change', updateMask);
      window.removeEventListener('leo:ipad-layout', updateMask);
      media.revert();
    });
  }
}
