import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const section = document.querySelector<HTMLElement>('[data-featured-works]');
if (section) {
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion:no-preference)', () => {
    gsap.fromTo(section.querySelector('h2'), { y:40 }, { y:0, duration:1, ease:'power3.inOut', scrollTrigger:{id:'works-heading',trigger:section.querySelector('h2'),start:'top 85%',toggleActions:'play none none reverse'} });
    section.querySelectorAll<HTMLElement>('.featured-work').forEach((figure, index) => {
      gsap.fromTo(figure.querySelector('.featured-work__content'), { y:60, scale:.985 }, {
        y:0, scale:1, duration:1, ease:'power3.inOut',
        scrollTrigger: { id:'featured-entry-' + index, trigger:figure, start:'top 90%', toggleActions:'play none none reverse' },
      });
    });
  });
  if (import.meta.hot) import.meta.hot.dispose(() => media.revert());
}
