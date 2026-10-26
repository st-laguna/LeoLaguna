import {isMobileJourneyLayout, mobileJourneyMedia} from './responsive-layout';
import {scrollPage} from './smooth-scroll';
import {mountProgressControls,playIcon} from './progress-controls';

export function mountIPadWorkflow(section:HTMLElement,cards:HTMLButtonElement[],flip:(card:HTMLButtonElement)=>void){
 const grid=section.querySelector<HTMLElement>('.workflow__grid')!;
 const journey=section.closest<HTMLElement>('.home-journey')!;
 const events=new AbortController(),signal=events.signal;
 const media=matchMedia(mobileJourneyMedia),orientation=matchMedia('(orientation:portrait)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const host=document.createElement('div');
 host.className='unified-workflow-controls';
 host.innerHTML='<div class="unified-dots">'+cards.map((_,i)=>'<button type="button" aria-label="Workflow '+(i+1)+'" aria-pressed="'+(i===0)+'"><span><i></i></span></button>').join('')+'</div><button class="unified-play" type="button" aria-label="Play gallery"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">'+playIcon+'</svg></button>';
 section.append(host);
 let active=0,portrait=orientation.matches,rotationPending=false;
 let restoreTimer:ReturnType<typeof setTimeout>|undefined;
 let lastPosition:{progress:number;active:number}|null=null;
 function choose(i:number,instant=false){
  cards.forEach(c=>{if(c.getAttribute('aria-pressed')==='true')flip(c)});
  const slot=cards[i].parentElement!;
  grid.scrollTo({left:slot.offsetLeft-(grid.clientWidth-slot.clientWidth)/2,behavior:instant||reduced.matches?'instant':'smooth'});
 }
 const controls=mountProgressControls(host,[...host.querySelectorAll<HTMLButtonElement>('.unified-dots button')],host.querySelector('.unified-play')!,()=>active,choose,()=>isMobileJourneyLayout()&&!section.inert);
 function remember(){
  if(rotationPending||orientation.matches!==portrait)return;
  const bounds=section.getBoundingClientRect();
  if(section.inert||bounds.bottom<=0||bounds.top>=innerHeight){lastPosition=null;return;}
  lastPosition={active,progress:Math.max(0,Math.min(1,(scrollY-journey.offsetTop)/Math.max(1,journey.offsetHeight-innerHeight)))};
 }
 function sync(){
  if(rotationPending||orientation.matches!==portrait)return;
  const center=grid.scrollLeft+grid.clientWidth/2;
  active=cards.reduce((best,c,i)=>Math.abs(c.parentElement!.offsetLeft+c.parentElement!.clientWidth/2-center)<Math.abs(cards[best].parentElement!.offsetLeft+cards[best].parentElement!.clientWidth/2-center)?i:best,0);
  cards.forEach((card,index)=>{
    const ideal=card.parentElement!.offsetLeft+card.parentElement!.clientWidth/2-grid.clientWidth/2;
    const settled=Math.max(0,Math.min(grid.scrollWidth-grid.clientWidth,ideal));
    const delta=Math.abs(grid.scrollLeft-settled);
    const centered=index===active&&delta<Math.max(6,grid.clientWidth*.025);
    card.toggleAttribute('data-cue-centered',centered);
  });
  controls.sync();remember();
 }
 cards.forEach((card,i)=>{
  card.addEventListener('pointerdown',e=>{if(isMobileJourneyLayout()){e.stopImmediatePropagation();controls.pause()}},{capture:true,signal});
  card.addEventListener('click',e=>{if(!isMobileJourneyLayout())return;e.stopImmediatePropagation();if(section.inert)return;controls.pause();if(i!==active){choose(i);controls.reset()}else flip(card)},{capture:true,signal});
 });
 grid.addEventListener('scroll',sync,{passive:true,signal});
 grid.addEventListener('touchstart',controls.pause,{passive:true,signal});
 media.addEventListener('change',sync,{signal});
 reduced.addEventListener('change',controls.pause,{signal});
 window.addEventListener('scroll',remember,{passive:true,signal});
 window.addEventListener('resize',()=>{
  if(orientation.matches===portrait)return;
  portrait=orientation.matches;
  const saved=lastPosition;
  if(!saved||!isMobileJourneyLayout()||reduced.matches){rotationPending=false;return;}
  rotationPending=true;controls.pause();clearTimeout(restoreTimer);
  // Let GSAP and Services rebuild their runways before restoring this scene.
  restoreTimer=setTimeout(()=>{
   scrollPage(journey.offsetTop+(journey.offsetHeight-innerHeight)*saved.progress,false);
   active=saved.active;choose(active,true);rotationPending=false;controls.sync();
  },350);
 },{passive:true,signal});
 const heading=section.querySelector<HTMLElement>('.workflow__heading')!;
 function layout(){if(isMobileJourneyLayout())section.style.setProperty('--workflow-grid-top',(heading.offsetTop+heading.offsetHeight+25)+'px');sync()}
 const resize=new ResizeObserver(layout);resize.observe(grid);resize.observe(heading);
 section.addEventListener('workflow:reset',()=>{
  if(rotationPending||orientation.matches!==portrait)return;
  controls.pause();grid.scrollTo({left:0,behavior:'instant'});active=0;controls.reset();
 },{signal});
 const cueObserver=new IntersectionObserver(([entry])=>section.toggleAttribute('data-cue-visible',entry.isIntersecting&&!section.inert),{threshold:.3});cueObserver.observe(section);
 const cueState=new MutationObserver(()=>section.toggleAttribute('data-cue-visible',!section.inert&&section.getBoundingClientRect().bottom>0&&section.getBoundingClientRect().top<innerHeight));cueState.observe(section,{attributes:true,attributeFilter:['inert']});
 sync();
 return()=>{cueObserver.disconnect();cueState.disconnect();clearTimeout(restoreTimer);controls.dispose();events.abort();resize.disconnect();host.remove();cards.forEach(card=>card.removeAttribute('data-cue-centered'))};
}
