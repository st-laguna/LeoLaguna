import {isMobileAbout} from './about/mobileAboutDevice.js';
import {isPhoneViewport} from './responsive-layout';
import gsap from 'gsap';
import {mountTabletHorizontalGesture} from './tablet-horizontal-gesture';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {scrollPage} from './smooth-scroll';
gsap.registerPlugin(ScrollTrigger);
const host=document.querySelector<HTMLElement>('[data-case-study]');
const rail=host?.querySelector<HTMLElement>('[data-case-rail]');
function caseDistance(){
 if(!host||!rail)return 0;
 const stage=host.querySelector<HTMLElement>('.case-study__stage')!,end=host.querySelector<HTMLElement>('.case-study__end')!;
 // Stop at the last panel's real edge, excluding incidental scroll overflow.
 return Math.max(0,end.getBoundingClientRect().right-rail.getBoundingClientRect().left-stage.clientWidth);
}
// Warm adjacent panels in both horizontal and vertical layouts, retaining full-quality sources.
if(host){
  const configureMobile=()=>{document.documentElement.toggleAttribute('data-case-mobile',isMobileAbout());document.documentElement.toggleAttribute('data-case-phone',isMobileAbout()&&isPhoneViewport());};configureMobile();window.addEventListener('resize',configureMobile);window.addEventListener('leo:orientation-ready',configureMobile);
  if(import.meta.hot)import.meta.hot.dispose(()=>{window.removeEventListener('resize',configureMobile);window.removeEventListener('leo:orientation-ready',configureMobile);document.documentElement.removeAttribute('data-case-mobile');document.documentElement.removeAttribute('data-case-phone');});
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
    if(!endPanel||matchMedia('(prefers-reduced-motion:reduce)').matches)return null;
    const items=endPanel.querySelectorAll<HTMLElement>('.case-study__others > span, .case-study__others > a > span:first-child, .case-study__next-label, .case-study__next-heading > *, .case-study__preview > img, .case-study__next-meta');
    return gsap.timeline({paused:true,onUpdate:()=>host.dispatchEvent(new Event('case:reveal-frame'))}).fromTo(items,{y:28,clipPath:'inset(100% 0 0 0)'},{y:0,clipPath:'inset(0% 0 0 0)',duration:.9,stagger:.12,ease:'power3.inOut'});
  }
  media.add('all',()=>{
    host.setAttribute('data-horizontal','');
    const distance=caseDistance;
    const measure=()=>host.style.setProperty('--case-scroll-height',(host.querySelector<HTMLElement>('.case-study__stage')!.clientHeight+distance())+'px');
    measure();

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
      id:'case-study-rail',trigger:host,start:'top top',end:()=>'+='+distance(),scrub:matchMedia('(prefers-reduced-motion:reduce)').matches?true:.65,
      invalidateOnRefresh:true,onRefreshInit:measure,onRefresh:updateEnd,
    },onUpdate:updateEnd});
    updateEnd();
    // Cover/media widths can change without resizing the viewport (styles, fonts).
    // Refresh both the runway and the cached translation as one layout update.
    let refreshFrame=0;
    const stageSize=new ResizeObserver(()=>{cancelAnimationFrame(refreshFrame);refreshFrame=requestAnimationFrame(()=>{measure();tween.scrollTrigger?.refresh();});});
    stageSize.observe(host.querySelector<HTMLElement>('.case-study__stage')!);stageSize.observe(rail);
    const removeGesture=mountTabletHorizontalGesture(host.querySelector<HTMLElement>('.case-study__stage')!,()=>tween.scrollTrigger,[0,1],()=>isMobileAbout());
    // Tab navigation follows a panel outside the transformed viewport.
    const focus=(event:FocusEvent)=>{
      if(!(event.target instanceof Element)||!event.target.closest('.case-study__end, .case-study__model'))return;
      if(!event.target.matches(':focus-visible'))return;
      const trigger=tween.scrollTrigger;
      if(trigger){const panel=event.target.closest<HTMLElement>('.case-study__model, .case-study__end')!;scrollPage(panelScroll(panel),false);}
    };
    rail.addEventListener('focusin',focus);
    return()=>{stageSize.disconnect();cancelAnimationFrame(refreshFrame);removeGesture();entrance?.revert();rail.removeEventListener('focusin',focus);host.removeAttribute('data-horizontal');host.style.removeProperty('--case-scroll-height');};
  });
  void document.fonts.ready.then(()=>ScrollTrigger.refresh());
  if(import.meta.hot)import.meta.hot.dispose(()=>media.revert());
}

function panelScroll(panel:HTMLElement){
  const trigger=ScrollTrigger.getById('case-study-rail');
  if(!trigger||!rail)return panel.getBoundingClientRect().top+scrollY;
  const distance=caseDistance();
  const desired=distance?Math.min(1,panel.offsetLeft/distance):0;
  const ease=gsap.parseEase(matchMedia('(any-pointer:coarse)').matches?'none':'power1.inOut');
  let low=0,high=1;
  for(let i=0;i<20;i++){const middle=(low+high)/2;if(ease(middle)<desired)low=middle;else high=middle;}
  return trigger.start+(low+high)/2*(trigger.end-trigger.start);
}
const modelViewport=host?.querySelector<HTMLElement>('[data-case-model]');
if(modelViewport){
  let scrollMotion:gsap.core.Tween|undefined;
  const bringIntoView=(panel:HTMLElement=modelViewport)=>{
    const trigger=ScrollTrigger.getById('case-study-rail');
    const target=panelScroll(panel);
    scrollMotion?.kill();
    if(matchMedia('(prefers-reduced-motion:reduce)').matches){scrollPage(target,false);return;}
    if(Math.abs(scrollY-target)<2)return;
    const position={y:scrollY};
    scrollMotion=gsap.to(position,{y:target,duration:1.2,ease:'power3.inOut',onUpdate:()=>scrollPage(position.y,false)});
  };
  const advance=modelViewport.querySelector<HTMLButtonElement>('[data-case-advance]');
  const goNext=()=>{const images=host?.querySelector<HTMLElement>('.case-study__images');if(images)bringIntoView(images);};
  advance?.addEventListener('click',goNext);
  const retreat=modelViewport.querySelector<HTMLButtonElement>('[data-case-retreat]');
  const goPrevious=()=>{const intro=host?.querySelector<HTMLElement>('.case-study__intro');if(intro)bringIntoView(intro);};
  retreat?.addEventListener('click',goPrevious);
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
  if(import.meta.hot)import.meta.hot.dispose(()=>{cancelled=true;advance?.removeEventListener('click',goNext);retreat?.removeEventListener('click',goPrevious);proximity.disconnect();scrollMotion?.kill();cleanup?.();});
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
