import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {scrollPage} from './smooth-scroll';

// Writes only the existing vertical scroll coordinate; the master owns rendering.
export function mountTabletHorizontalGesture(host:HTMLElement,getTrigger:()=>ScrollTrigger|undefined,range:[number,number]=[0,1],enabled=()=>document.documentElement.hasAttribute('data-large-tablet-landscape')){
  const events=new AbortController(),signal=events.signal;
  let x=0,y=0,lastX=0,lastTime=0,velocity=0,intent='',tracking=false,targetScroll=0,suppressClick=false;
  const bounds=(trigger:ScrollTrigger)=>[trigger.start+(trigger.end-trigger.start)*range[0],trigger.start+(trigger.end-trigger.start)*range[1]];
  const drive=(trigger:ScrollTrigger,position:number)=>{if(!enabled()){inertia?.kill();return;}const [start,end]=bounds(trigger);targetScroll=gsap.utils.clamp(start,end,position);scrollPage(targetScroll,false);ScrollTrigger.update();trigger.getTween()?.progress(1);};
  let inertia:gsap.core.Tween|undefined;
  host.addEventListener('touchstart',event=>{
    inertia?.kill();tracking=false;
    if(!enabled()||event.touches.length!==1||(event.target as Element).closest('input,textarea,a:not(.case-study__next),button:not(.project-enlarge),[data-case-model]:not([data-touch-preview])'))return;
    const trigger=getTrigger();if(!trigger)return;const [start,end]=bounds(trigger);if(scrollY<start-2||scrollY>end+2)return;targetScroll=scrollY;suppressClick=false;
    const finger=event.touches[0];x=lastX=finger.clientX;y=finger.clientY;lastTime=performance.now();velocity=0;intent='';tracking=true;
  },{passive:true,signal});
  host.addEventListener('touchmove',event=>{
    if(!tracking||!enabled()||event.touches.length!==1)return;
    const finger=event.touches[0],dx=finger.clientX-x,dy=finger.clientY-y;
    if(!intent){if(Math.max(Math.abs(dx),Math.abs(dy))<12)return;intent=Math.abs(dx)>Math.abs(dy)*1.3?'horizontal':'vertical';}
    if(intent!=='horizontal')return;
    suppressClick=true;
    const trigger=getTrigger();if(!trigger)return;
    event.preventDefault();const now=performance.now(),step=lastX-finger.clientX;
    velocity=step/Math.max(8,now-lastTime);lastX=finger.clientX;lastTime=now;
    drive(trigger,targetScroll+step);
  },{passive:false,signal});
  host.addEventListener('touchend',()=>{
    if(tracking&&intent==='horizontal'&&enabled()&&performance.now()-lastTime<100){
      const trigger=getTrigger();if(trigger){const [start,end]=bounds(trigger),state={y:targetScroll};inertia=gsap.to(state,{y:gsap.utils.clamp(start,end,targetScroll+gsap.utils.clamp(-2,2,velocity)*180),duration:.35,ease:'power2.out',onUpdate:()=>drive(trigger,state.y)});}
    }tracking=false;
  },{passive:true,signal});
  host.addEventListener('touchcancel',()=>{tracking=false;inertia?.kill();},{passive:true,signal});
  host.addEventListener('click',event=>{if(suppressClick&&event.detail!==0){event.preventDefault();event.stopPropagation();suppressClick=false;}},{capture:true,signal});
  return()=>{events.abort();inertia?.kill();};
}
