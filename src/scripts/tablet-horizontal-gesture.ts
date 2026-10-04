import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {scrollPage} from './smooth-scroll';

// Writes only the existing vertical scroll coordinate; the master owns rendering.
export function mountTabletHorizontalGesture(host:HTMLElement,getTrigger:()=>ScrollTrigger|undefined){
  const events=new AbortController(),signal=events.signal;
  let x=0,y=0,lastX=0,lastTime=0,velocity=0,intent='',tracking=false;
  let inertia:gsap.core.Tween|undefined;
  const enabled=()=>document.documentElement.hasAttribute('data-large-tablet-landscape');
  host.addEventListener('touchstart',event=>{
    inertia?.kill();tracking=false;
    if(!enabled()||event.touches.length!==1||(event.target as Element).closest('input,textarea,a,button:not(.project-enlarge),[data-case-model]:not([data-touch-preview])'))return;
    const trigger=getTrigger();if(!trigger||scrollY<trigger.start-2||scrollY>trigger.end+2)return;
    const finger=event.touches[0];x=lastX=finger.clientX;y=finger.clientY;lastTime=performance.now();velocity=0;intent='';tracking=true;
  },{passive:true,signal});
  host.addEventListener('touchmove',event=>{
    if(!tracking||!enabled()||event.touches.length!==1)return;
    const finger=event.touches[0],dx=finger.clientX-x,dy=finger.clientY-y;
    if(!intent){if(Math.max(Math.abs(dx),Math.abs(dy))<12)return;intent=Math.abs(dx)>Math.abs(dy)*1.3?'horizontal':'vertical';}
    if(intent!=='horizontal')return;
    const trigger=getTrigger();if(!trigger)return;
    event.preventDefault();const now=performance.now(),step=lastX-finger.clientX;
    velocity=step/Math.max(8,now-lastTime);lastX=finger.clientX;lastTime=now;
    scrollPage(gsap.utils.clamp(trigger.start,trigger.end,scrollY+step),false);
  },{passive:false,signal});
  host.addEventListener('touchend',()=>{
    if(tracking&&intent==='horizontal'&&enabled()&&performance.now()-lastTime<100){
      const trigger=getTrigger();if(trigger){const state={y:scrollY};inertia=gsap.to(state,{y:gsap.utils.clamp(trigger.start,trigger.end,scrollY+gsap.utils.clamp(-2,2,velocity)*180),duration:.35,ease:'power2.out',onUpdate:()=>scrollPage(state.y,false)});}
    }tracking=false;
  },{passive:true,signal});
  host.addEventListener('touchcancel',()=>{tracking=false;inertia?.kill();},{passive:true,signal});
  return()=>{events.abort();inertia?.kill();};
}
