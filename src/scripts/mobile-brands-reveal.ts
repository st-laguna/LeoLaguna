import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {mobileJourneyMedia} from './responsive-layout';

// A separate runway holds Brands while Works uncovers it, then releases tall content.
export function mountMobileBrandsReveal(brands:HTMLElement){
 const featured=brands.closest('[data-featured-brands]')?.querySelector<HTMLElement>('[data-featured-works]');
 if(!featured)return ()=>{};
 const media=gsap.matchMedia();
 media.add(mobileJourneyMedia,()=>{
  const runway=document.createElement('div');
  runway.setAttribute('data-mobile-brands-reveal','');
  const footer=brands.closest('[data-featured-brands]')!.querySelector<HTMLElement>('[data-brands-footer-handoff]');
  const spacer=document.createElement('div');spacer.setAttribute('aria-hidden','true');
  brands.before(runway);runway.append(brands,spacer);
  if(footer)runway.append(footer);
  let frame=0,disposed=false;
  function measure(){
   frame=0;if(disposed)return;
   const overlap=Math.min(innerHeight,brands.offsetHeight);
   runway.style.setProperty('--brands-entry-overlap',overlap+'px');
   spacer.style.height=overlap+'px';
   const end=featured!.getBoundingClientRect().bottom;
   const limit=Math.min(0,innerHeight-brands.offsetHeight);
   runway.style.setProperty('--brands-hold-top',Math.max(limit,Math.min(0,end))+'px');
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure)};
  const resize=new ResizeObserver(schedule);resize.observe(brands);
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('scroll',schedule,{passive:true});measure();
  const motion=gsap.matchMedia();
  motion.add('(prefers-reduced-motion:no-preference)',()=>{
   gsap.fromTo(brands,{'--handoff-shade':1},{'--handoff-shade':0,ease:'none',scrollTrigger:{id:'mobile-works-brands-shadow',trigger:featured,start:'bottom bottom',end:'bottom top',scrub:true,invalidateOnRefresh:true}});
  });
  return()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule);motion.revert();if(footer)runway.after(footer);runway.before(brands);runway.remove();};
 });
 return()=>media.revert();
}

