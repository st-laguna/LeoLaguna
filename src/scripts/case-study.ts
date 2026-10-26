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
  const casePage=host;
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
    return gsap.timeline({paused:true,onUpdate:()=>casePage.dispatchEvent(new Event('case:reveal-frame'))}).fromTo(items,{y:28,clipPath:'inset(100% 0 0 0)'},{y:0,clipPath:'inset(0% 0 0 0)',duration:.9,stagger:.12,ease:'power3.inOut'});
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
// The cover's advance control moves to the first real project panel.
const introNext=host?.querySelector<HTMLButtonElement>('[data-case-intro-next]');
let introScrollMotion:gsap.core.Tween|undefined;
const advanceIntroduction=()=>{
  const panel=host?.querySelector<HTMLElement>('[data-case-model], .case-study__images');
  if(!panel)return;
  introScrollMotion?.kill();
  const target=panelScroll(panel);
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){scrollPage(target,false);return;}
  const position={y:scrollY};
  introScrollMotion=gsap.to(position,{y:target,duration:1.2,ease:'power3.inOut',onUpdate:()=>scrollPage(position.y,false)});
};
introNext?.addEventListener('click',advanceIntroduction);
if(import.meta.hot)import.meta.hot.dispose(()=>{introNext?.removeEventListener('click',advanceIntroduction);introScrollMotion?.kill();});
// Prefer balanced phrases at a large size; two or three lines are both valid.
const coverTitle=host?.querySelector<HTMLElement>('#case-title');
const coverTitleLines:Record<string,Record<string,string[]>>={
  en:{groaqua:['Visualizing','Aquaculture','Engineering'],'exo-environmental':['Marine','Habitat','Engineering'],wewhale:['Whale','Watching','Education'],wwf:['Whale','Science &','Conservation'],'sperm-whales-of-dominica':['Cataloguing','Dominica’s','Sperm Whales']},
  es:{groaqua:['Visualización','de ingeniería','acuícola'],'exo-environmental':['Ingeniería','de hábitats','marinos'],wewhale:['Educación','para avistar','ballenas'],wwf:['Ciencia y','conservación','de ballenas'],'sperm-whales-of-dominica':['Catálogo de','cachalotes','de Dominica']},
};
let titleFrame=0;
function layoutCoverTitle(){
  if(!coverTitle)return;
  cancelAnimationFrame(titleFrame);
  titleFrame=requestAnimationFrame(()=>{
    const language=document.documentElement.lang==='es'?'es':'en';
    const slug=location.pathname.split('/').filter(Boolean).at(-1)!;
    let lines=coverTitleLines[language][slug];
    if(!lines)return;
    if(!isMobileAbout()){
      if(coverTitle.hasAttribute('data-cover-lines'))coverTitle.textContent=lines.join(' ');
      coverTitle.removeAttribute('data-cover-lines');coverTitle.removeAttribute('aria-label');coverTitle.style.removeProperty('font-size');return;
    }
    const fullTitle=lines.join(' ');
    coverTitle.dataset.coverLines='';coverTitle.setAttribute('aria-label',fullTitle);
    coverTitle.style.removeProperty('font-size');
    const size=parseFloat(getComputedStyle(coverTitle).fontSize);
    const heightLimit=innerHeight*(matchMedia('(orientation:portrait)').matches?.2333:.5276);
    const render=(parts:string[])=>{
      coverTitle.replaceChildren(...parts.map((line,index)=>{
        const span=document.createElement('span');span.textContent=line+(index<parts.length-1?' ':'');span.setAttribute('aria-hidden','true');return span;
      }));
      const widest=Math.max(...Array.from(coverTitle.children,span=>span.getBoundingClientRect().width));
      return Math.min(size,size*coverTitle.clientWidth/widest,heightLimit/(parts.length*1.03));
    };
    const threeLineSize=render(lines);
    const words=fullTitle.split(/\s+/);
    let bestTwo:string[]|undefined,twoLineSize=0,bestBalance=Infinity;
    for(let split=1;split<words.length;split++){
      const parts=[words.slice(0,split).join(' '),words.slice(split).join(' ')];
      // A conjunction is attached to its phrase, never left on its own line.
      if(parts.some(part=>/^(?:&|and|y|de|para)$/i.test(part)))continue;
      const candidateSize=render(parts);
      const balance=Math.abs(parts[0].length-parts[1].length);
      if(candidateSize>twoLineSize+.1||(Math.abs(candidateSize-twoLineSize)<=.1&&balance<bestBalance)){
        bestTwo=parts;twoLineSize=candidateSize;bestBalance=balance;
      }
    }
    // Keep the approved large scale; do not make a title small just to use two lines.
    if(bestTwo&&twoLineSize>=threeLineSize*.95){lines=bestTwo;}
    const fitted=render(lines);
    coverTitle.style.fontSize=Math.floor(fitted*100)/100+'px';
  });
}
layoutCoverTitle();
void document.fonts.ready.then(layoutCoverTitle);
window.addEventListener('resize',layoutCoverTitle);
window.addEventListener('leo:language-change',layoutCoverTitle);
if(import.meta.hot)import.meta.hot.dispose(()=>{cancelAnimationFrame(titleFrame);window.removeEventListener('resize',layoutCoverTitle);window.removeEventListener('leo:language-change',layoutCoverTitle);});
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
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const originalPoster=video.getAttribute('poster');
  const allowed=()=>visible&&!document.hidden&&!suspended;
  function update(){
    video!.controls=reduced.matches;
    if(reduced.matches&&video!.dataset.casePoster)video!.poster=video!.dataset.casePoster;
    else if(originalPoster===null)video!.removeAttribute('poster');
    if(!allowed()){video!.pause();return;}
    // Reduced motion permits explicit native controls, never autoplay.
    if(reduced.matches)return;
    if(video!.paused&&!pending){pending=true;void video!.play().catch(()=>{}).finally(()=>{pending=false;if(!allowed())video!.pause();});}
  }
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();});
  observer.observe(video);
  reduced.addEventListener('change',()=>{if(reduced.matches)video!.pause();update();},{signal:events.signal});
  update();
  document.addEventListener('visibilitychange',update,{signal:events.signal});
  window.addEventListener('pagehide',()=>{suspended=true;update();},{signal:events.signal});
  window.addEventListener('pageshow',()=>{suspended=false;update();},{signal:events.signal});
  if(import.meta.hot)import.meta.hot.dispose(()=>{suspended=true;update();events.abort();observer.disconnect();});
}
