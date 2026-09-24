import { isIPadPortrait, isRotating } from './ipad-layout';
import { scrollPage } from './smooth-scroll';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import './project-gallery';
gsap.registerPlugin(ScrollTrigger);
const section=document.querySelector<HTMLElement>('[data-projects]');
if(section){
  const panels=Array.from(section.querySelectorAll<HTMLElement>('[data-panel]'));
  const copies=Array.from(section.querySelectorAll<HTMLElement>('[data-copy]'));
  const rail=section.querySelector<HTMLElement>('.projects-rail')!;
  const digits=section.querySelector<HTMLElement>('.projects-digits')!;
  const bar=section.querySelector<HTMLElement>('.projects-progress > span')!;
  const main=section.querySelector<HTMLElement>('.projects-main')!;
  const sidebar=section.querySelector<HTMLElement>('.projects-sidebar')!;
  const nav=document.querySelector<HTMLElement>('.site-nav');
  const stage=section.querySelector<HTMLElement>('.projects-stage')!;
  const guidesRail=section.querySelector<HTMLElement>('.projects-guides-rail')!;
  const guidePages=Array.from(section.querySelectorAll<HTMLElement>('[data-guide-page]'));
  const menuToggle=section.querySelector<HTMLButtonElement>('.glass-toggle');
  const menu=section.querySelector<HTMLElement>('#glass-project-menu');
  const menuLinks=Array.from(section.querySelectorAll<HTMLElement>('#glass-project-menu a'));
  const stepButtons=Array.from(section.querySelectorAll<HTMLButtonElement>('[data-step]'));
  let sidebarTravel=200;
  function closeMenu() {
    sidebar.removeAttribute('data-open');
    menu?.removeAttribute('data-open');
    if(menu) menu.inert=true;
    menuToggle?.setAttribute('aria-expanded','false');
  }
  // Solo medimos al cambiar la geometría, nunca en cada fotograma de scroll.
  function measureLayout() {
    sidebarTravel=sidebar.offsetLeft+sidebar.offsetWidth+16;
    if(!(motion.matches && !isIPadPortrait()))return;
    const height=main.clientHeight;
    const controls=document.querySelector<HTMLElement>('.site-controls');
    const rect=controls?.getBoundingClientRect();
    const controlsVisible=!!rect && rect.height>0 && rect.top>=0 && rect.bottom<height*.25;
    const top=controlsVisible?rect!.top:height*.018;
    const bottom=controlsVisible?rect!.bottom:height*.045;
    const mediaTop=Math.max(68,height*.059,bottom+24);
    section!.style.setProperty('--project-top',`${mediaTop}px`);
    panels.forEach((panel,i)=>{
      const media=panel.querySelector<HTMLElement>('.project-media')!;
      const thumbs=panel.querySelector<HTMLElement>('.project-thumbs')!;
      const guide=guidePages[i];
      if(!guide)return;
      const gapAbove=(media.offsetTop-bottom)/2;
      const values={
        '--guide-x1':media.offsetLeft/2,
        '--guide-x2':(media.offsetLeft+media.offsetWidth+thumbs.offsetLeft)/2,
        '--guide-x3':(thumbs.offsetLeft+thumbs.offsetWidth+panel.clientWidth)/2,
        '--guide-y1':top/2,
        '--guide-y2':media.offsetTop-gapAbove,
        '--guide-y3':media.offsetTop+media.offsetHeight+gapAbove,
        '--guide-y4':height*.9556,
      };
      Object.entries(values).forEach(([key,value])=>guide.style.setProperty(key,`${value}px`));
    });
  }
  const motion=matchMedia('(min-width:1001px) and (min-height:681px) and (orientation:landscape) and (prefers-reduced-motion:no-preference), (min-width:1101px) and (min-height:681px) and (prefers-reduced-motion:no-preference)');
  const tabletPortrait=matchMedia('(min-width:701px) and (max-width:1100px) and (orientation:portrait)');
  const mobileMotion=matchMedia('((max-width:700px) or ((max-width:1000px) and (max-height:500px))) and (prefers-reduced-motion:no-preference)');
  const events=new AbortController();
  const state={position:0,exit:0};
  const brandsLayout =
  section?.nextElementSibling?.querySelector<HTMLElement>('.brands-layout');
  let entrance=0,current=0,frozen=false;
  let timeline:gsap.core.Timeline|undefined;
  let mobileTimeline:gsap.core.Tween|undefined;
  let entry:ScrollTrigger|undefined;
  let mobileTweens:gsap.core.Tween[]=[];
  const clamp=(v:number)=>Math.max(0,Math.min(1,v));
  const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
  // Segundos virtuales: cada unidad equivale a una altura de pantalla de scroll.
  const stops = [.45, 2.25, 4.05, 5.95];
  const total = 7.5;
  function pause(){section!.querySelectorAll('video').forEach(video=>video.pause());}
  function render(){
    if(frozen)return;
    const rounded=Math.max(0,Math.min(3,Math.round(state.position)));
    if(rounded!==current)pause();current=rounded;
    section!.dataset.current=String(current);
    rail.style.transform=`translate3d(${-state.position*100}%,0,0)`;
    guidesRail.style.transform=rail.style.transform;
    digits.style.transform=`translateY(${-state.position*25}%)`;
    bar.style.transform=`scaleX(${state.position/3})`;
    copies.forEach((copy,i)=>{
      copy.style.transform=`translateY(${(i-state.position)*115}%)`;
      copy.setAttribute('aria-hidden',String(i!==current));
    });
    panels.forEach((panel,i)=>{panel.inert=i!==current;panel.setAttribute('aria-hidden',String(i!==current));});
    const incoming=ease(entrance/.90);
    const outgoing=ease((state.exit-.3)/.7);
    // Marcas empieza a revelarse cuando la salida visual llega a la mitad.
const brandsReveal = ease((outgoing - .5) / .5);

if (brandsLayout) {
  brandsLayout.style.clipPath =
    `inset(${(1 - brandsReveal) * 100}% 0 0 0)`;

  brandsLayout.inert = brandsReveal < .01;
}
    main.style.clipPath=`inset(${(1-incoming)*100}% 0% ${outgoing*100}% 0%)`;
    const sideIn=ease((entrance-.82)/.18);
    const sideOut=ease(state.exit/.3);
    sidebar.style.transform=`translateX(${-sidebarTravel*(1-sideIn+sideOut)}px)`;
    sidebar.inert=sideIn<.95||sideOut>.05;
    if(menuToggle){
      menuToggle.style.transform=`${sidebar.style.transform} translateY(-50%)`;
      menuToggle.disabled=sidebar.inert;
    }
    if(sidebar.inert && menu?.hasAttribute('data-open'))closeMenu();
    menuLinks.forEach((link,index)=>{
      const progress=ease((entrance-.8-index*.025)/.12)*(1-sideOut);
      link.style.translate=`${-25*(1-progress)}px 0`;
      link.style.clipPath=`inset(0 ${100*(1-progress)}% 0 0)`;
    });
    const away = entrance > .12 && outgoing < .5;
    document.documentElement.classList.toggle('projects-active',away);
    if(nav)nav.inert=away;
    stepButtons.forEach(button=>button.disabled=Number(button.dataset.step)<0?current===0:current===3);
  }
  function disposeScroll(){
    mobileTweens.forEach(t=>{t.scrollTrigger?.kill();t.kill();});mobileTweens=[];
    entry?.kill();entry=undefined;timeline?.scrollTrigger?.kill();timeline?.kill();timeline=undefined;
    mobileTimeline?.scrollTrigger?.kill();mobileTimeline?.kill();mobileTimeline=undefined;
    section!.removeAttribute('data-mobile-stack');
    panels.forEach(panel=>{['top','height','left','width','visibility','--compression'].forEach(p=>panel.style.removeProperty(p));panel.removeAttribute('data-compressed');panel.removeAttribute('data-overview');});
    if(brandsLayout){brandsLayout.style.removeProperty('clip-path');brandsLayout.inert=false;}
    document.documentElement.classList.remove('projects-active');if(nav)nav.inert=false;
  }
  const mobileState={p:0};
  function renderMobile(){
    if(frozen)return;
    const landscape=matchMedia('(max-width:1000px) and (max-height:500px) and (orientation:landscape)').matches;
    const height=landscape?main.clientWidth:main.clientHeight;
    const strip=landscape?48:Math.max(62,Math.min(82,height*.09));
    const p=clamp(mobileState.p);
    const position=Math.min(3,p/.86*3);
    const active=Math.min(3,Math.floor(position));
    current=active;section!.dataset.current=String(current);
    panels.forEach((panel,i)=>{
      const enter=i===0?1:ease(position-(i-1));
      const compress=i===3?0:ease(position-i);
      const top=i*strip+(height-i*strip)*(1-enter);
      panel.style.top=landscape?'0px':`${top}px`;
      panel.style.left=landscape?`${top}px`:'0px';
      const extent=`${height-i*strip-(height-(i+1)*strip)*compress-2*compress}px`;
      panel.style.height=landscape?'100%':extent;
      panel.style.width=landscape?extent:'100%';
      panel.style.setProperty('--compression',String(compress));
      panel.style.visibility=enter>0?'visible':'hidden';
      panel.toggleAttribute('data-compressed',compress>.99);
      const back=panel.querySelector<HTMLButtonElement>('[data-panel-back]');
      if(back){back.disabled=compress<=.99;back.tabIndex=compress>.99?0:-1;}
      panel.inert=enter<=0;
      panel.setAttribute('aria-hidden',String(enter<=0));
    });
  }

  function configureMobile(){
    section!.setAttribute('data-mobile-stack','');
    section!.removeAttribute('data-horizontal');
    [main,sidebar,rail,guidesRail,digits,...copies,...(menuToggle?[menuToggle]:[])].forEach(el=>{
      el.style.removeProperty('transform');el.style.removeProperty('clip-path');
    });
    sidebar.inert=true;
    gsap.set(section!.querySelectorAll('.project-media,.project-thumbs,.project-mobile-copy'),{clearProps:'clipPath'});
    mobileState.p=0;
    mobileTimeline=gsap.to(mobileState,{p:1,ease:'none',scrollTrigger:{trigger:section,start:'top top',end:'bottom bottom',scrub:.35,invalidateOnRefresh:true,onRefresh:renderMobile},onUpdate:renderMobile});
    renderMobile();ScrollTrigger.refresh();
  }
  function configure(){
    if (isRotating()) return;
    disposeScroll();pause();closeMenu();
    const videoPanel=panels.find(panel=>panel.classList.contains('project-panel--video'));
    if(videoPanel) {
      const selected=Number(videoPanel.querySelector<HTMLElement>('[aria-selected="true"]')?.dataset.select || 0);
      videoPanel.querySelectorAll<HTMLElement>('[data-slide]').forEach((slide,i)=>{
        gsap.killTweensOf(slide);
        gsap.set(slide,{clearProps:'transform,clipPath'});
        slide.hidden=i!==selected;
      });
    }
    if(menuToggle)menuToggle.disabled=false;
    section!.toggleAttribute('data-horizontal',(motion.matches && !isIPadPortrait()));
    if(!(motion.matches && !isIPadPortrait())){
      if((mobileMotion.matches || (isIPadPortrait() && !matchMedia('(prefers-reduced-motion:reduce)').matches))){configureMobile();return;}
      if (brandsLayout) {
  brandsLayout.style.removeProperty('clip-path');
  brandsLayout.inert = false;
}
      section!.style.removeProperty('--project-top');
      [main,sidebar,rail,guidesRail,digits,...copies,...(menuToggle?[menuToggle]:[])].forEach(el=>{el.style.removeProperty('transform');el.style.removeProperty('clip-path');});
      menuLinks.forEach(link=>{link.style.removeProperty('translate');link.style.removeProperty('clip-path');});
      panels.forEach(panel=>{panel.inert=false;panel.removeAttribute('aria-hidden');});sidebar.inert=false;
      const parts=Array.from(section!.querySelectorAll<HTMLElement>('.project-media,.project-thumbs,.project-mobile-copy'));
      if(!matchMedia('(prefers-reduced-motion:reduce)').matches){
        gsap.set(parts,{clipPath:'inset(100% 0 0)'});
        mobileTweens=parts.map(el=>gsap.to(el,{clipPath:'inset(0% 0 0)',duration:.8,ease:'power3.inOut',scrollTrigger:{trigger:el,start:'top 90%',once:true}}));
      } else gsap.set(parts,{clearProps:'clipPath'});
      ScrollTrigger.refresh();
      return;
    }
    gsap.set(section!.querySelectorAll('.project-media,.project-thumbs,.project-mobile-copy'),{clearProps:'clipPath'});
    measureLayout();
    state.position=0;state.exit=0;entrance=0;
    entry=ScrollTrigger.create({trigger:section,start:'top 100%',end:'top top',onUpdate:self=>{entrance=self.progress;render();},onRefresh:self=>{entrance=self.progress;render();}});
    timeline=gsap.timeline({onUpdate:render,scrollTrigger:{trigger:section,start:'top top',end:'bottom top',scrub:.7,invalidateOnRefresh:true}});
    timeline.to(state,{position:.035,duration:.9,ease:'none'},0)
      .to(state,{position:.965,duration:.9,ease:'power3.inOut'},.9)
      .to(state,{position:1.035,duration:.9,ease:'none'},1.8)
      .to(state,{position:1.965,duration:.9,ease:'power3.inOut'},2.7)
      .to(state,{position:2.035,duration:.9,ease:'none'},3.6)
      .to(state,{position:2.965,duration:.9,ease:'power3.inOut'},4.5)
      .to(state, { position: 3, duration: 1.1, ease: 'none' }, 5.4)
      .to(state, { exit: 1, duration: 1, ease: 'none' }, 6.5);
    render();ScrollTrigger.refresh();
  }
  function select(panel:HTMLElement,index:number){
    const slides=Array.from(panel.querySelectorAll<HTMLElement>('[data-slide]'));
    const previous=slides.findIndex(slide=>!slide.hidden&&slide.dataset.leaving!=='true');
    if(previous===index)return;
    const direction=index>previous?1:-1;
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    slides.forEach((slide,i)=>{
      gsap.killTweensOf(slide);delete slide.dataset.leaving;
      slide.querySelector('video')?.pause();
      slide.style.clipPath='none';
      if(i===index){
        slide.hidden=false;
        if(reduced)gsap.set(slide,{xPercent:0});
        else gsap.fromTo(slide,{xPercent:direction*100},{xPercent:0,duration:.55,ease:'power3.inOut'});
      }else if(i===previous&&!reduced){
        slide.dataset.leaving='true';
        gsap.to(slide,{xPercent:-direction*100,duration:.55,ease:'power3.inOut',onComplete:()=>{slide.hidden=true;delete slide.dataset.leaving;}});
      }else slide.hidden=true;
    });
    panel.querySelectorAll<HTMLElement>('[data-select]').forEach(button=>{const selected=Number(button.dataset.select)===index;button.setAttribute('aria-pressed',String(selected));button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
  }
  section.addEventListener('click',event=>{
    const button=(event.target as Element).closest<HTMLElement>('button');if(!button)return;

    if(button.hasAttribute('data-select'))select(button.closest<HTMLElement>('[data-panel]')!,Number(button.dataset.select));
    if(button.hasAttribute('data-step')){
      const target=Math.max(0,Math.min(3,current+Number(button.dataset.step)));
      const trigger=timeline?.scrollTrigger;
      if (trigger) { scrollPage( trigger.start + stops[target] / total * (trigger.end - trigger.start) ); }
    }
  },{signal:events.signal});
  section.addEventListener('click',event=>{
    if(!(mobileMotion.matches || (isIPadPortrait() && !matchMedia('(prefers-reduced-motion:reduce)').matches)))return;
    const panel=(event.target as Element).closest<HTMLElement>('[data-panel][data-compressed]');
    if(!panel||((event.target as Element).closest('button')&&!(event.target as Element).closest('[data-panel-back]')))return;
    const index=Number(panel.dataset.panel);const trigger=mobileTimeline?.scrollTrigger;
    if(trigger)scrollPage(trigger.start+(index/3*.86)*(trigger.end-trigger.start));
  },{signal:events.signal});

  panels.forEach(panel=>{
    const media=panel.querySelector<HTMLElement>('.project-media');if(!media)return;
    let startX=0,startY=0,pointer:number|null=null;
    media.addEventListener('pointerdown',event=>{if((!(mobileMotion.matches || (isIPadPortrait() && !matchMedia('(prefers-reduced-motion:reduce)').matches))&&!(tabletPortrait.matches || isIPadPortrait()))||!event.isPrimary)return;pointer=event.pointerId;startX=event.clientX;startY=event.clientY;},{signal:events.signal});
    media.addEventListener('pointerup',event=>{
      if(pointer!==event.pointerId)return;pointer=null;
      const dx=event.clientX-startX,dy=event.clientY-startY;if(Math.abs(dx)<42||Math.abs(dx)<Math.abs(dy)*1.2)return;
      const slides=Array.from(panel.querySelectorAll<HTMLElement>('[data-slide]'));
      const active=Math.max(0,slides.findIndex(slide=>!slide.hidden));
      select(panel,Math.max(0,Math.min(slides.length-1,active+(dx<0?1:-1))));
    },{signal:events.signal});
    media.addEventListener('pointercancel',()=>{pointer=null;},{signal:events.signal});
  });
  // Shared by the footer category menu and the existing horizontal timeline.
  window.addEventListener('leo:project-jump', ((event: CustomEvent<number>) => {
    const index = Math.max(0, Math.min(panels.length - 1, Number(event.detail)));
    if (!Number.isInteger(index) || !panels[index]) return;
    const trigger = timeline?.scrollTrigger;
    if ((motion.matches && !isIPadPortrait()) && trigger) {
      scrollPage(trigger.start + stops[index] / total * (trigger.end - trigger.start));
    } else if ((mobileMotion.matches || (isIPadPortrait() && !matchMedia('(prefers-reduced-motion:reduce)').matches)) && mobileTimeline?.scrollTrigger) {
      const mobileTrigger = mobileTimeline.scrollTrigger;
      scrollPage(mobileTrigger.start + (index / 3 * .86) * (mobileTrigger.end - mobileTrigger.start));
    } else {
      scrollPage(panels[index].getBoundingClientRect().top + window.scrollY);
    }
  }) as EventListener, { signal: events.signal });
  // HOME evita pasar lentamente por todo el recorrido al volver al inicio.
  section.querySelector<HTMLAnchorElement>('nav a[href="#home"]')?.addEventListener('click',event=>{
    event.preventDefault();scrollPage(0, false);history.replaceState(null,'','#home');
  },{signal:events.signal});
  window.addEventListener('leo:gallery-lock',()=>{
    frozen=true;
    timeline?.scrollTrigger?.getTween()?.pause();
    mobileTimeline?.scrollTrigger?.getTween()?.pause();
  },{signal:events.signal});
  window.addEventListener('leo:gallery-unlock',()=>{
    frozen=false;
    // Resume el seguimiento desde el mismo fotograma; nunca reconstruye el pin.
    if((mobileMotion.matches || (isIPadPortrait() && !matchMedia('(prefers-reduced-motion:reduce)').matches))){
      // Update only the mobile stack: the desktop render clips the whole main.
      ScrollTrigger.update();
      mobileTimeline?.scrollTrigger?.getTween()?.play();
      renderMobile();
    }else if((motion.matches && !isIPadPortrait())){
      timeline?.scrollTrigger?.getTween()?.play();
      render();
    }
  },{signal:events.signal});
  motion.addEventListener('change',configure,{signal:events.signal});
  mobileMotion.addEventListener('change',configure,{signal:events.signal});
  tabletPortrait.addEventListener('change',configure,{signal:events.signal});
  const resizeObserver=new ResizeObserver(()=>{measureLayout();if((motion.matches && !isIPadPortrait()))render();else if((mobileMotion.matches || (isIPadPortrait() && !matchMedia('(prefers-reduced-motion:reduce)').matches)))renderMobile();});
  resizeObserver.observe(stage);
  const controlsElement=document.querySelector<HTMLElement>('.site-controls');
  if(controlsElement)resizeObserver.observe(controlsElement);
  ScrollTrigger.addEventListener('refreshInit',measureLayout);
  window.addEventListener('leo:orientation-ready', configure, {signal:events.signal});
  window.addEventListener('leo:ipad-layout', configure, {signal:events.signal});
  configure();void document.fonts.ready.then(()=>{if(!events.signal.aborted)ScrollTrigger.refresh();});
  if(import.meta.hot)import.meta.hot.dispose(()=>{events.abort();resizeObserver.disconnect();ScrollTrigger.removeEventListener('refreshInit',measureLayout);disposeScroll();});
}
