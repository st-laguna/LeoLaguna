import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const section = document.querySelector<HTMLElement>('[data-featured-works]');
if (section) {
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion:no-preference)', () => {
    const services=document.querySelector<HTMLElement>('[data-projects] .projects-stage');
    const brands=section.closest('[data-featured-brands]')?.querySelector<HTMLElement>('[data-brands]');
    // Follow the native sticky overlaps; these layers change paint, not layout.
    if(services)gsap.fromTo(services,{'--handoff-shade':0},{'--handoff-shade':1,ease:'none',scrollTrigger:{id:'works-services-shadow',trigger:section,start:'top bottom',end:'top top',scrub:true,invalidateOnRefresh:true}});
    if(brands)gsap.fromTo(brands,{'--handoff-shade':1},{'--handoff-shade':0,ease:'none',scrollTrigger:{id:'works-brands-shadow',trigger:section,start:'bottom bottom',end:'bottom top',scrub:true,invalidateOnRefresh:true}});

    gsap.fromTo(section.querySelector('h2'), { y:40 }, { y:0, duration:1, ease:'power3.inOut', scrollTrigger:{id:'works-heading',trigger:section.querySelector('h2'),start:'top 85%',toggleActions:'play none none reverse'} });
    const closing=section.querySelector<HTMLElement>('.featured-works__closing');
    if(closing) gsap.fromTo(closing.querySelectorAll(':scope > span > span'),{yPercent:120},{yPercent:0,duration:1,ease:'power3.inOut',stagger:.2,scrollTrigger:{id:'featured-closing',trigger:closing,start:'top 90%',end:'bottom top',toggleActions:'play reverse play reverse'}});
    section.querySelectorAll<HTMLElement>('.featured-work').forEach((figure, index) => {
      gsap.fromTo(figure.querySelector('.featured-work__content'), { y:60, scale:.985 }, {
        y:0, scale:1, duration:1, ease:'power3.inOut',
        scrollTrigger: { id:'featured-entry-' + index, trigger:figure, start:'top 90%', toggleActions:'play none none reverse' },
      });
    });
  });
  if (import.meta.hot) import.meta.hot.dispose(() => media.revert());
}
