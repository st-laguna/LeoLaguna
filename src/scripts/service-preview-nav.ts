import gsap from 'gsap';
import {isMobileAbout} from './about/mobileAboutDevice.js';
const section=document.querySelector<HTMLElement>('.projects');
if(section){
 const nav=section.querySelector<HTMLElement>('.service-preview-nav')!;
 const buttons=Array.from(nav.querySelectorAll<HTMLButtonElement>('[data-service-preview]'));
 const video=nav.querySelector<HTMLVideoElement>('video')!;
 // Hover animates only its own offsets; CSS adds them to the scroll offset.
 const hoverQuery=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
 let hoverEnabled=false;
 const hoverItems=buttons.map(button=>{
  const media=button.querySelector<HTMLElement>('img,video')!;
  const offset={x:0,y:0};
  let width=0,height=0;
  const draw=()=>{
   media.style.setProperty('--service-hover-x',`${offset.x}px`);
   media.style.setProperty('--service-hover-y',`${offset.y}px`);
  };
  const move=(event:PointerEvent)=>{
   if(!hoverEnabled||event.pointerType!=='mouse'||!width||!height)return;
   // Media ignores hit testing while enabled, so offsets belong to the fixed button.
   // ResizeObserver supplies dimensions without layout reads in pointer handlers.
   const x=(Math.max(0,Math.min(1,event.offsetX/width))-.5)*4;
   const y=(Math.max(0,Math.min(1,event.offsetY/height))-.5)*4;
   gsap.to(offset,{x,y,duration:.4,ease:'power3.out',overwrite:true,onUpdate:draw});
  };
  const leave=()=>{if(!hoverEnabled)return;gsap.to(offset,{x:0,y:0,duration:.5,ease:'power3.out',overwrite:true,onUpdate:draw});};
  const reset=()=>{gsap.killTweensOf(offset);offset.x=offset.y=0;media.style.removeProperty('--service-hover-x');media.style.removeProperty('--service-hover-y');};
  const size=new ResizeObserver(entries=>{width=entries[0].contentRect.width;height=entries[0].contentRect.height;});
  size.observe(button);
  button.addEventListener('pointerenter',move);
  button.addEventListener('pointermove',move);
  button.addEventListener('pointerleave',leave);
  button.addEventListener('pointercancel',leave);
  return {reset,dispose:()=>{reset();size.disconnect();button.removeEventListener('pointerenter',move);button.removeEventListener('pointermove',move);button.removeEventListener('pointerleave',leave);button.removeEventListener('pointercancel',leave);}};
 });
 let visible=false;
 let initialFrameRequested=false;
 const prepareInitialFrame=()=>{
  if(initialFrameRequested||video.readyState<HTMLMediaElement.HAVE_METADATA)return;
  initialFrameRequested=true;
  // Decode a visible frame without playing; never rewind after activation.
  if(video.paused&&video.currentTime===0)video.currentTime=.01;
 };
 video.addEventListener('loadedmetadata',prepareInitialFrame);
 video.addEventListener('loadeddata',prepareInitialFrame);
 video.addEventListener('canplay',prepareInitialFrame);
 const sync=()=>{
  const enabled=section.hasAttribute('data-horizontal')&&(!isMobileAbout()||document.documentElement.hasAttribute('data-ipad-home'));section.toggleAttribute('data-service-preview',enabled);
  const nextHover=enabled&&hoverQuery.matches;
  if(hoverEnabled!==nextHover){
   hoverEnabled=nextHover;
   section.toggleAttribute('data-service-preview-hover',hoverEnabled);
   if(!hoverEnabled)hoverItems.forEach(item=>item.reset());
  }
  if(enabled&&!video.getAttribute('src')){
   video.preload='auto';
   video.src=video.dataset.src!;
   video.load();
  }
  const active=Number(section.dataset.current||0);
  buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===active)));
  nav.style.setProperty('--service-preview-progress',String((active+1)/4));
  if(enabled&&visible&&active===3&&!document.hidden&&!document.querySelector<HTMLDialogElement>('#projects-expanded')?.open){if(video.paused)void video.play().catch(()=>{});}else video.pause();
 };
 buttons.forEach((button,i)=>button.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('leo:project-jump',{detail:i}))));
 const observer=new MutationObserver(sync);observer.observe(section,{attributes:true,attributeFilter:['data-current','data-horizontal']});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-ipad','data-about-mobile','data-large-tablet-landscape']});const dialog=document.querySelector('#projects-expanded');if(dialog)observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 const intersection=new IntersectionObserver(entries=>{visible=entries[entries.length-1].isIntersecting;sync();});intersection.observe(nav);
 hoverQuery.addEventListener('change',sync);
 window.addEventListener('resize',sync);document.addEventListener('visibilitychange',sync);sync();
 if(import.meta.hot)import.meta.hot.dispose(()=>{hoverQuery.removeEventListener('change',sync);hoverItems.forEach(item=>item.dispose());section.removeAttribute('data-service-preview-hover');observer.disconnect();intersection.disconnect();video.removeEventListener('loadedmetadata',prepareInitialFrame);video.removeEventListener('loadeddata',prepareInitialFrame);video.removeEventListener('canplay',prepareInitialFrame);window.removeEventListener('resize',sync);document.removeEventListener('visibilitychange',sync);video.pause();});
}
