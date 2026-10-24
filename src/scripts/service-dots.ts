import {compactServices} from './compact-services';
import {mountSurfaceSwipe} from './surface-swipe';
export function mountServiceDots(section:HTMLElement){
 const events=new AbortController(),signal=events.signal,panels=[...section.querySelectorAll<HTMLElement>('[data-panel]')],dots=[...section.querySelectorAll<HTMLButtonElement>('[data-service-dot]')],reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const current=()=>Math.max(0,Math.min(3,Number(section.dataset.current||0)));
 const selected=()=>Number(panels[current()].querySelector<HTMLElement>('[data-select][aria-selected="true"]')?.dataset.select||0);
 const viewAll=section.querySelector<HTMLElement>('.projects-view-all')!,origin=document.createComment('View All original position');viewAll.before(origin);
 const controlRow=section.querySelector<HTMLElement>('.service-gallery-controls')!;
 function positionAction(){if(compactServices()){if(viewAll.parentElement!==controlRow)controlRow.append(viewAll)}else origin.after(viewAll)}
 positionAction();const orientation=matchMedia('(orientation:portrait)');orientation.addEventListener('change',positionAction,{signal});
 let timer:ReturnType<typeof setTimeout>|undefined,visible=false,deadline=0,service=current(),disposed=false;
 const allowed=()=>!disposed&&visible&&compactServices()&&!reduced.matches&&!document.hidden&&!document.querySelector<HTMLDialogElement>('#projects-expanded')?.open;
 function paint(){dots.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected())))}
 function choose(index:number){panels[current()].querySelector<HTMLButtonElement>(`[data-select="${(index+dots.length)%dots.length}"]`)?.click();paint()}
 function schedule(){clearTimeout(timer);timer=undefined;if(!allowed())return;timer=setTimeout(()=>{timer=undefined;if(!allowed())return;choose(selected()+1);deadline=performance.now()+5000;schedule()},Math.max(0,deadline-performance.now()))}
 function manual(){deadline=performance.now()+7000;schedule()}
 dots.forEach((b,i)=>b.addEventListener('click',()=>{manual();choose(i)},{signal}));
 section.addEventListener('pointerdown',e=>{if(e.isTrusted)manual()},{passive:true,signal});section.addEventListener('touchstart',manual,{passive:true,signal});section.addEventListener('keydown',manual,{signal});
 const swipes=panels.map(panel=>mountSurfaceSwipe(panel.querySelector('.project-media')!,()=>compactServices()&&!panel.inert,d=>{manual();choose(selected()+d)}));
 swipes.push(mountSurfaceSwipe(section.querySelector('.projects-footer')!,compactServices,d=>{manual();window.dispatchEvent(new CustomEvent('leo:project-jump',{detail:(current()+d+panels.length)%panels.length}))}));
 const changes=new MutationObserver(()=>{if(service!==current()){service=current();deadline=performance.now()+7000}paint();schedule()});changes.observe(section,{subtree:true,attributes:true,attributeFilter:['data-current','aria-selected','data-compact-services']});
 const gallery=document.querySelector('#projects-expanded');if(gallery)changes.observe(gallery,{attributes:true,attributeFilter:['open']});
 const footer=section.querySelector<HTMLElement>('.projects-footer')!,thumb=section.querySelector<HTMLElement>('.service-preview-nav button')!;
 const sizing=new ResizeObserver(()=>footer.style.setProperty('--preview-height',thumb.offsetHeight+'px'));sizing.observe(thumb);
 const observer=new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)deadline=Math.max(deadline,performance.now()+5000);schedule()});observer.observe(section.querySelector('.service-gallery-controls')!);
 document.addEventListener('visibilitychange',()=>{deadline=performance.now()+5000;schedule()},{signal});reduced.addEventListener('change',schedule,{signal});window.addEventListener('leo:gallery-lock',manual,{signal});paint();
 return()=>{disposed=true;origin.after(viewAll);origin.remove();clearTimeout(timer);events.abort();changes.disconnect();observer.disconnect();sizing.disconnect();swipes.forEach(dispose=>dispose())};
}
