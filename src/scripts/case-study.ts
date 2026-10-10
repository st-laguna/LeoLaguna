import gsap from 'gsap';
import {mountTabletHorizontalGesture} from './tablet-horizontal-gesture';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {scrollPage} from './smooth-scroll';
gsap.registerPlugin(ScrollTrigger);
const host=document.querySelector<HTMLElement>('[data-case-study]');
const rail=host?.querySelector<HTMLElement>('[data-case-rail]');
// Warm adjacent panels in both horizontal and vertical layouts, retaining full-quality sources.
if(host){
  const images=new IntersectionObserver(entries=>{for(const entry of entries){
    if(!entry.isIntersecting)continue;
    const image=entry.target as HTMLImageElement;
    image.src=image.dataset.caseSrc!;images.unobserve(image);
  }},{rootMargin:'100% 100%'});
  host.querySelectorAll<HTMLImageElement>('img[data-case-src]').forEach(image=>images.observe(image));
  if(import.meta.hot)import.meta.hot.dispose(()=>images.disconnect());
}
if(host&&rail){
  const media=gsap.matchMedia();
  const endPanel=host.querySelector<HTMLElement>('.case-study__end');
  // Safari can expose the document canvas while bouncing the coral end panel.
  // Match that context only while the panel is substantially visible.
  const root=document.documentElement;
  const endSurface=new IntersectionObserver(([entry])=>{
    root.toggleAttribute('data-case-coral',entry.isIntersecting&&entry.intersectionRatio>=.5);
  },{threshold:[0,.5,1]});
  if(endPanel)endSurface.observe(endPanel);
  if(import.meta.hot)import.meta.hot.dispose(()=>{endSurface.disconnect();root.removeAttribute('data-case-coral');});
  function endEntrance(){
    if(!endPanel)return null;
    const items=endPanel.querySelectorAll<HTMLElement>('.case-study__others > span, .case-study__others > a > span:first-child, .case-study__next-label, .case-study__next-heading > *, .case-study__preview > img, .case-study__next-meta');
    return gsap.timeline({paused:true}).fromTo(items,{y:28,clipPath:'inset(100% 0 0 0)'},{y:0,clipPath:'inset(0% 0 0 0)',duration:.9,stagger:.12,ease:'power3.inOut'});
  }
  media.add('(min-width:701px) and (orientation:landscape) and (prefers-reduced-motion:no-preference), (max-width:700px) and (prefers-reduced-motion:no-preference), (any-pointer:coarse) and (prefers-reduced-motion:no-preference)',()=>{
    host.setAttribute('data-horizontal','');
    const distance=()=>Math.max(0,rail.scrollWidth-innerWidth);
    const measure=()=>host.style.setProperty('--case-scroll-height',(host.querySelector<HTMLElement>('.case-study__stage')!.clientHeight+distance())+'px');
    measure();
    // Toolbar changes resize dvh without rebuilding the rail or resetting progress.
    const stageSize=new ResizeObserver(measure);
    stageSize.observe(host.querySelector<HTMLElement>('.case-study__stage')!);
    const entrance=endEntrance();
    let panelEntered=false;
    const updateEnd=()=>{
      if(!endPanel||!entrance)return;
      const rect=endPanel.getBoundingClientRect();
      const visible=rect.left<innerWidth*.92 && rect.right>0;
      if(visible===panelEntered)return;
      panelEntered=visible;
      if(visible)entrance.play();else entrance.reverse();
    };
    const tween=gsap.to(rail,{x:()=>-distance(),ease:matchMedia('(any-pointer:coarse)').matches?'none':'power1.inOut',scrollTrigger:{
      id:'case-study-rail',trigger:host,start:'top top',end:()=>'+='+distance(),scrub:.65,
      invalidateOnRefresh:true,onRefreshInit:measure,onRefresh:updateEnd,
    },onUpdate:updateEnd});
    updateEnd();
    const removeGesture=mountTabletHorizontalGesture(host.querySelector<HTMLElement>('.case-study__stage')!,()=>tween.scrollTrigger,[0,1],()=>matchMedia('(any-pointer:coarse)').matches);
    // Tab navigation follows a panel outside the transformed viewport.
    const focus=(event:FocusEvent)=>{
      if(!(event.target instanceof Element)||!event.target.closest('.case-study__end, .case-study__model'))return;
      if(!event.target.matches(':focus-visible'))return;
      const trigger=tween.scrollTrigger;
      if(trigger){const panel=event.target.closest<HTMLElement>('.case-study__model, .case-study__end')!;scrollPage(panelScroll(panel),false);}
    };
    rail.addEventListener('focusin',focus);
    return()=>{stageSize.disconnect();removeGesture();entrance?.revert();rail.removeEventListener('focusin',focus);host.removeAttribute('data-horizontal');host.style.removeProperty('--case-scroll-height');};
  });
  media.add('(min-width:701px) and (orientation:portrait) and (any-pointer:fine) and (not (any-pointer:coarse)) and (prefers-reduced-motion:no-preference)',()=>{
    const entrance=endEntrance();
    if(!endPanel||!entrance)return;
    const trigger=ScrollTrigger.create({id:'case-end-entry',trigger:endPanel,start:'top 90%',end:'bottom top',onEnter:()=>entrance.play(),onLeave:()=>entrance.reverse(),onEnterBack:()=>entrance.play(),onLeaveBack:()=>entrance.reverse()});
    return()=>{trigger.kill();entrance.revert();};
  });
  void document.fonts.ready.then(()=>ScrollTrigger.refresh());
  if(import.meta.hot)import.meta.hot.dispose(()=>media.revert());
}

function panelScroll(panel:HTMLElement){
  const trigger=ScrollTrigger.getById('case-study-rail');
  if(!trigger||!rail)return panel.getBoundingClientRect().top+scrollY;
  const distance=Math.max(0,rail.scrollWidth-innerWidth);
  const desired=distance?Math.min(1,panel.offsetLeft/distance):0;
  const ease=gsap.parseEase(matchMedia('(any-pointer:coarse)').matches?'none':'power1.inOut');
  let low=0,high=1;
  for(let i=0;i<20;i++){const middle=(low+high)/2;if(ease(middle)<desired)low=middle;else high=middle;}
  return trigger.start+(low+high)/2*(trigger.end-trigger.start);
}
const modelViewport=host?.querySelector<HTMLElement>('[data-case-model]');
if(modelViewport){
  let scrollMotion:gsap.core.Tween|undefined;
  const bringIntoView=()=>{
    const trigger=ScrollTrigger.getById('case-study-rail');
    const target=panelScroll(modelViewport);
    scrollMotion?.kill();
    if(matchMedia('(prefers-reduced-motion:reduce)').matches){scrollPage(target,false);return;}
    if(Math.abs(scrollY-target)<2)return;
    const position={y:scrollY};
    scrollMotion=gsap.to(position,{y:target,duration:1.2,ease:'power3.inOut',onUpdate:()=>scrollPage(position.y,false)});
  };
  let cleanup:(()=>void)|undefined,cancelled=false;
  const proximity=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    proximity.disconnect();
    void import('./case-model').then(({mountCaseModel})=>{if(!cancelled)cleanup=mountCaseModel(modelViewport,bringIntoView);}).catch(()=>{
      if(cancelled)return;
      const status=modelViewport.querySelector<HTMLElement>('[data-model-status]');
      if(status){status.dataset.i18n='model.unavailable';status.textContent=document.documentElement.lang==='es'?'Modelo 3D no disponible.':'3D model unavailable.';}
    });
  },{rootMargin:'300px'});
  proximity.observe(modelViewport);
  if(import.meta.hot)import.meta.hot.dispose(()=>{cancelled=true;proximity.disconnect();scrollMotion?.kill();cleanup?.();});
}
const video=host?.querySelector<HTMLVideoElement>('[data-case-video]');
if(video){
  let visible=false,pending=false,suspended=false;
  const events=new AbortController();
  const allowed=()=>visible&&!document.hidden&&!suspended;
  function update(){
    if(!allowed()){video!.pause();return;}
    if(video!.paused&&!pending){pending=true;void video!.play().catch(()=>{}).finally(()=>{pending=false;if(!allowed())video!.pause();});}
  }
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();});
  observer.observe(video);
  document.addEventListener('visibilitychange',update,{signal:events.signal});
  window.addEventListener('pagehide',()=>{suspended=true;update();},{signal:events.signal});
  window.addEventListener('pageshow',()=>{suspended=false;update();},{signal:events.signal});
  if(import.meta.hot)import.meta.hot.dispose(()=>{suspended=true;update();events.abort();observer.disconnect();});
}
