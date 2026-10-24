import {isMobileJourneyLayout} from './responsive-layout';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { openingClip } from './transition-motion.js';

// Keep the native sticky Brands layer; no wheel interception or second scroller.
export function mountBrandsFooterHandoff(brands:HTMLElement){
  const host=brands.closest<HTMLElement>('[data-featured-brands]');
  const runway=host?.querySelector<HTMLElement>('[data-brands-footer-handoff]');
  const footer=runway?.querySelector<HTMLElement>('.footer');
  if(!host||!runway||!footer)return ()=>{};
  let context:gsap.Context|undefined;
  let enabled=false,frame=0,disposed=false;
  let portraitMode=false;
  const conditions=matchMedia('(min-width:1001px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  function configure(){
    frame=0;if(disposed)return;
    const fits=brands.scrollHeight<=innerHeight+1;
    const portrait=isMobileJourneyLayout();
    brands.style.setProperty('--brands-sticky-top',Math.min(0,innerHeight-brands.offsetHeight)+'px');
    const next=portrait ? !matchMedia('(prefers-reduced-motion:reduce)').matches : conditions.matches&&fits&&!brands.hasAttribute('data-mobile-streams');
    if(next===enabled&&portrait===portraitMode)return;
    portraitMode=portrait;
    context?.revert();context=undefined;enabled=next;
    if(!next){ScrollTrigger.refresh();return;}
    context=gsap.context(()=>{
      const footerInert=footer!.inert,brandsInert=brands.inert;
      if(portrait)runway!.setAttribute('data-portrait-footer-handoff','');
      else host!.setAttribute('data-footer-handoff','');
      const geometry={width:80,startTop:75,startBottom:25};
      gsap.set(footer!,{clipPath:openingClip(0,geometry)});
      const render=(progress:number)=>{
        footer!.style.clipPath=openingClip(progress,geometry);
        footer!.dataset.handoffProgress=String(progress);
        footer!.inert=progress<.99;
        brands.inert=progress>=.99;
      };
      const timeline=gsap.timeline({scrollTrigger:{
        id:'brands-footer-handoff',trigger:runway!,start:()=>portrait?'top top':'top -80%',end:'bottom bottom',
        scrub:true,invalidateOnRefresh:true,
        onUpdate:self=>render(self.progress),onRefresh:self=>render(self.progress),
      }});
      if(!portrait) timeline.fromTo(footer!,{y:()=>-innerHeight},{y:0,duration:1,ease:'none'},0);
      render(timeline.scrollTrigger?.progress||0);
      return ()=>{
        host!.removeAttribute('data-footer-handoff');
        runway!.removeAttribute('data-portrait-footer-handoff');
        delete footer!.dataset.handoffProgress;
        footer!.inert=footerInert;brands.inert=brandsInert;
      };
    });
    ScrollTrigger.refresh();
  }
  const schedule=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(configure);};
  const observer=new ResizeObserver(schedule);observer.observe(brands);
  conditions.addEventListener('change',schedule);
  window.addEventListener('resize',schedule,{passive:true});
  // The rest of Brands' responsive setup runs synchronously before this frame.
  schedule();
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();conditions.removeEventListener('change',schedule);window.removeEventListener('resize',schedule);context?.revert();};
}
