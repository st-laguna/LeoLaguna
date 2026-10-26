import {isMobileJourneyLayout, mobileJourneyMedia, mobileJourneyMotionMedia} from './responsive-layout';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const section = document.querySelector<HTMLElement>('[data-featured-works]');
if (section) {
  const media = gsap.matchMedia();
  // Move the one existing heading onto the phone's first animated surface.
  media.add(mobileJourneyMedia, () => {
    const heading=section.querySelector<HTMLElement>('#featured-works-heading')!;
    const composition=section.querySelector('.featured-works__composition')!;
    const surface=section.querySelector('.featured-work--groaqua .featured-work__content')!;
    surface.prepend(heading);
    section.setAttribute('data-integrated-heading','');
    return () => { section.insertBefore(heading,composition);section.removeAttribute('data-integrated-heading'); };
  });
  media.add('(orientation:landscape) and (prefers-reduced-motion:no-preference)', () => {
    if(isMobileJourneyLayout())return;
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
  media.add(mobileJourneyMotionMedia,()=>{
    const cards=[...section.querySelectorAll<HTMLElement>('.featured-work')].sort((a,b)=>Number(getComputedStyle(a).order)-Number(getComputedStyle(b).order)).slice(0,-1);
    cards.forEach((card,i)=>{const surface=card.querySelector<HTMLElement>('.featured-work__content')!;
      // Keep the receding motion on one compositor plane; no huge 3D blend surfaces.
      gsap.to(surface,{x:i%2?26:-26,y:-14,rotationZ:i%2?2:-2,scale:.94,force3D:true,ease:'none',scrollTrigger:{trigger:card,start:'top top',end:'80% top',scrub:true,onUpdate:self=>card.toggleAttribute('data-card-exiting',self.progress>0),onToggle:self=>{surface.style.willChange=self.isActive?'transform':'';}}});
    });
    gsap.fromTo(section.querySelectorAll('h2 > span'),{opacity:0},{opacity:1,duration:.7,scrollTrigger:{trigger:section,start:'top 90%',once:true}});
    return()=>cards.forEach(card=>{card.removeAttribute('data-card-exiting');(card.querySelector('.featured-work__content') as HTMLElement).style.removeProperty('will-change');});
  });
  const covers=[...section.querySelectorAll<HTMLElement>('.featured-work__cover')];
  const visible=new Set<HTMLElement>();
  const events=new AbortController();
  const syncCue=(cover:HTMLElement)=>{
    const img=cover.querySelector('img')!;
    const root=document.documentElement;
    cover.toggleAttribute('data-cue-visible',visible.has(cover)&&img.complete&&img.naturalWidth>0&&!root.hasAttribute('data-page-transition')&&!root.hasAttribute('data-section-transition'));
  };
  const cueObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const cover=entry.target as HTMLElement;
    if(entry.isIntersecting&&entry.intersectionRatio>=.15)visible.add(cover);else visible.delete(cover);
    syncCue(cover);
  }),{threshold:[0,.15]});
  covers.forEach(cover=>{
    cueObserver.observe(cover);
    cover.querySelector('img')!.addEventListener('load',()=>syncCue(cover),{signal:events.signal});
  });
  const cueState=new MutationObserver(()=>covers.forEach(syncCue));
  cueState.observe(document.documentElement,{attributes:true,attributeFilter:['data-page-transition','data-section-transition']});
  if (import.meta.hot) import.meta.hot.dispose(() => {media.revert();cueObserver.disconnect();cueState.disconnect();events.abort();covers.forEach(cover=>cover.removeAttribute('data-cue-visible'));});
}
