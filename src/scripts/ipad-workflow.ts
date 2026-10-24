import {compactServices} from './compact-services';
import {mountProgressControls,playIcon} from './progress-controls';
export function mountIPadWorkflow(section:HTMLElement,cards:HTMLButtonElement[],flip:(card:HTMLButtonElement)=>void){
 const grid=section.querySelector<HTMLElement>('.workflow__grid')!,events=new AbortController(),signal=events.signal,media=matchMedia('(orientation:portrait)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const host=document.createElement('div');host.className='unified-workflow-controls';host.innerHTML='<div class="unified-dots">'+cards.map((_,i)=>'<button type="button" aria-label="Workflow '+(i+1)+'" aria-pressed="'+(i===0)+'"><span><i></i></span></button>').join('')+'</div><button class="unified-play" type="button" aria-label="Play gallery"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">'+playIcon+'</svg></button>';section.append(host);
 let active=0;
 function choose(i:number){cards.forEach(c=>{if(c.getAttribute('aria-pressed')==='true')flip(c)});const slot=cards[i].parentElement!;grid.scrollTo({left:slot.offsetLeft-(grid.clientWidth-slot.clientWidth)/2,behavior:reduced.matches?'instant':'smooth'})}
 const controls=mountProgressControls(host,[...host.querySelectorAll<HTMLButtonElement>('.unified-dots button')],host.querySelector('.unified-play')!,()=>active,choose,()=>compactServices()&&!section.inert);
 function sync(){const center=grid.scrollLeft+grid.clientWidth/2;active=cards.reduce((best,c,i)=>Math.abs(c.parentElement!.offsetLeft+c.parentElement!.clientWidth/2-center)<Math.abs(cards[best].parentElement!.offsetLeft+cards[best].parentElement!.clientWidth/2-center)?i:best,0);controls.sync()}
 cards.forEach((card,i)=>{card.addEventListener('pointerdown',e=>{if(compactServices()){e.stopImmediatePropagation();controls.pause()}},{capture:true,signal});card.addEventListener('click',e=>{if(!compactServices())return;e.stopImmediatePropagation();if(section.inert)return;controls.pause();if(i!==active){choose(i);controls.reset()}else flip(card)},{capture:true,signal})});
 grid.addEventListener('scroll',sync,{passive:true,signal});grid.addEventListener('touchstart',controls.pause,{passive:true,signal});media.addEventListener('change',sync,{signal});reduced.addEventListener('change',controls.pause,{signal});
 const resize=new ResizeObserver(sync);resize.observe(grid);section.addEventListener('workflow:reset',()=>{controls.pause();grid.scrollTo({left:0,behavior:'instant'});active=0;controls.reset()},{signal});sync();return()=>{controls.dispose();events.abort();resize.disconnect();host.remove()};
}
