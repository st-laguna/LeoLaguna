import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const section = document.querySelector<HTMLElement>('[data-featured-works]');
if (section) {
  const media = gsap.matchMedia();
  // Move the one existing heading onto the phone's first animated surface.
  media.add('(orientation:portrait), (max-width:700px), (max-width:1000px) and (max-height:500px)', () => {
    const heading=section.querySelector<HTMLElement>('#featured-works-heading')!;
    const composition=section.querySelector('.featured-works__composition')!;
    const surface=section.querySelector('.featured-work--groaqua .featured-work__content')!;
    surface.prepend(heading);
    section.setAttribute('data-integrated-heading','');
    return () => { section.insertBefore(heading,composition);section.removeAttribute('data-integrated-heading'); };
  });
  media.add('(orientation:landscape) and (prefers-reduced-motion:no-preference)', () => {
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
  media.add('(orientation:portrait) and (prefers-reduced-motion:no-preference)',()=>{
    [...section.querySelectorAll<HTMLElement>('.featured-work')].sort((a,b)=>Number(getComputedStyle(a).order)-Number(getComputedStyle(b).order)).slice(0,-1).forEach((card,i)=>{const surface=card.querySelector('.featured-work__content');gsap.to(surface,{x:i%2?26:-26,y:-14,rotationX:-11,rotationY:i%2?14:-14,rotationZ:i%2?3.5:-3.5,scale:.94,ease:'none',scrollTrigger:{trigger:card,start:'top top',end:'80% top',scrub:true}})});
    gsap.fromTo(section.querySelectorAll('h2 > span'),{opacity:0},{opacity:1,duration:.7,scrollTrigger:{trigger:section,start:'top 90%',once:true}});
  });
  if (import.meta.hot) import.meta.hot.dispose(() => media.revert());
}
