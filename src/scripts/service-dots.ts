import {compactServices} from './compact-services';
import {mountProgressControls} from './progress-controls';
export function mountServiceDots(section:HTMLElement){
 const panels=[...section.querySelectorAll<HTMLElement>('[data-panel]')],dots=[...section.querySelectorAll<HTMLButtonElement>('[data-service-dot]')];
 const current=()=>Math.max(0,Math.min(3,Number(section.dataset.current||0)));
 const selected=()=>Number(panels[current()].querySelector<HTMLElement>('[data-select][aria-selected="true"]')?.dataset.select||0);
 let service=current();
 const controls=mountProgressControls(section.querySelector('.service-gallery-controls')!,dots,section.querySelector('.service-play')!,selected,i=>panels[current()].querySelector<HTMLButtonElement>(`[data-select="${i}"]`)?.click(),()=>compactServices()&&!document.querySelector<HTMLDialogElement>('#projects-expanded')?.open);
 const changes=new MutationObserver(()=>{if(service!==current()){service=current();controls.pause();controls.reset()}controls.sync()});changes.observe(section,{subtree:true,attributes:true,attributeFilter:['data-current','aria-selected','data-compact-services']});
 const gallery=document.querySelector('#projects-expanded');if(gallery)changes.observe(gallery,{attributes:true,attributeFilter:['open']});
 window.addEventListener('leo:gallery-lock',controls.pause);
 return()=>{controls.dispose();changes.disconnect();window.removeEventListener('leo:gallery-lock',controls.pause)};
}
