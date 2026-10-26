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
  const shade=document.createElement('div');shade.className='brands-entry-shade';shade.setAttribute('aria-hidden','true');brands.append(shade);
  let frame=0,measureFrame=0,disposed=false,height=0,limit=0,featuredEnd=0,lastTop=NaN,uncovered=false;
  function position(){
   frame=0;if(disposed)return;
   const end=featuredEnd-scrollY;
   const top=Math.max(limit,Math.min(0,end));
   if(top!==lastTop){brands.style.top=top+'px';lastTop=top;}
   const ready=end<=0;
   if(ready!==uncovered){uncovered=ready;brands.toggleAttribute('data-brands-uncovered',ready);if(ready)brands.dispatchEvent(new Event('brands:uncovered'));}
  }
  function measure(){
   measureFrame=0;if(disposed)return;
   height=brands.offsetHeight;
   const overlap=Math.min(innerHeight,height);
   featuredEnd=scrollY+featured!.getBoundingClientRect().bottom;
   limit=Math.min(0,innerHeight-height);
   runway.style.setProperty('--brands-entry-overlap',overlap+'px');
   spacer.style.height=overlap+'px';position();
  }
  const schedule=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(position)};
  const scheduleMeasure=()=>{if(!measureFrame&&!disposed)measureFrame=requestAnimationFrame(measure)};
  const resize=new ResizeObserver(scheduleMeasure);resize.observe(brands);resize.observe(featured!);
  window.addEventListener('resize',scheduleMeasure,{passive:true});
  window.addEventListener('scroll',schedule,{passive:true});
  ScrollTrigger.addEventListener('refresh',measure);measure();
  const motion=gsap.matchMedia();
  motion.add('(prefers-reduced-motion:no-preference)',()=>{
   gsap.fromTo(shade,{opacity:1},{opacity:0,ease:'none',scrollTrigger:{id:'mobile-works-brands-shadow',trigger:featured,start:'bottom bottom',end:'bottom top',scrub:true,invalidateOnRefresh:true}});
  });
  return()=>{disposed=true;cancelAnimationFrame(frame);cancelAnimationFrame(measureFrame);resize.disconnect();ScrollTrigger.removeEventListener('refresh',measure);window.removeEventListener('resize',scheduleMeasure);window.removeEventListener('scroll',schedule);motion.revert();shade.remove();brands.style.removeProperty('top');brands.removeAttribute('data-brands-uncovered');if(footer)runway.after(footer);runway.before(brands);runway.remove();};
 });
 return()=>media.revert();
}

