import {isPhonePortrait,phonePortraitMedia} from './responsive-layout';
import gsap from 'gsap';
import Lenis from 'lenis';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {openServiceCover,closeServiceGallery} from './service-cover-transition';
import {mountServiceStickyGrid} from './service-sticky-grid';
import {mountGalleryReturn} from './gallery-return';
const gallery=document.querySelector<HTMLDialogElement>('.gallery-dialog');
const lightbox=document.querySelector<HTMLDialogElement>('.project-lightbox');
const section=document.querySelector<HTMLElement>('[data-projects]');
if(gallery&&lightbox&&section){
  const g=gallery,l=lightbox,s=section;
  const events=new AbortController();
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const portrait=matchMedia(phonePortraitMedia);
  const configurePhone=()=>g.toggleAttribute('data-phone-portrait',isPhonePortrait());
  configurePhone();portrait.addEventListener('change',configurePhone,{signal:events.signal});
  const shell=g.querySelector<HTMLElement>('.gallery-shell')!;
  const scroller=g.querySelector<HTMLElement>('.gallery-scroll')!;
  const image=l.querySelector<HTMLImageElement>('[data-lightbox-image]')!;
  const figure=l.querySelector<HTMLElement>('.lightbox-figure')!;
  const closeGalleryButton=g.querySelector<HTMLButtonElement>('[data-gallery-close]')!;
  let locks=0,scroll=0,previousOverflow='';
  let galleryBusy=false,lightboxBusy=false;
  let galleryOpener:HTMLElement|null=null,lightboxOpener:HTMLElement|null=null;
  let observer:IntersectionObserver|undefined;
  let generation=0;
  type GalleryOwner={id:number;events:AbortController};
  let activeOwner:GalleryOwner|undefined;
  const owns=(owner:GalleryOwner)=>activeOwner===owner&&!owner.events.signal.aborted;
  let disposeSticky:ReturnType<typeof mountServiceStickyGrid>|undefined;
  let disposeReturn:(()=>void)|undefined;
  let opening:ReturnType<typeof openServiceCover>|undefined;
  let clockTimer:ReturnType<typeof setInterval>|undefined;
  const mouseScroll=matchMedia('(hover:hover) and (pointer:fine)');
  let galleryScroll:Lenis|undefined;
  let galleryContent:HTMLDivElement|undefined;
  const galleryTick=(seconds:number)=>galleryScroll?.raf(seconds*1000);
  function destroyGalleryScroll(){
    gsap.ticker.remove(galleryTick);galleryScroll?.destroy();galleryScroll=undefined;
  }
  function configureGalleryScroll(){
    destroyGalleryScroll();
    if(!g.open||l.open||galleryBusy||reduced.matches||!mouseScroll.matches||navigator.maxTouchPoints>0||document.documentElement.hasAttribute('data-ipad'))return;
    if(!galleryContent){
      galleryContent=document.createElement('div');
      galleryContent.className='gallery-scroll-content';
      while(scroller.firstChild)galleryContent.append(scroller.firstChild);
      scroller.append(galleryContent);
    }
    // The page's Lenis is stopped while this dialog is open: only one scroller
    // is active. Native scroll coordinates remain ScrollTrigger's authority.
    galleryScroll=new Lenis({wrapper:scroller,content:galleryContent,eventsTarget:scroller,autoRaf:false,smoothWheel:true,syncTouch:false,lerp:.1});
    galleryScroll.on('scroll',()=>ScrollTrigger.update());
    gsap.ticker.add(galleryTick);
  }
  function updateGalleryClock(){const now=new Date(),locale=document.documentElement.lang==='es'?'es-PE':'en-US';g.querySelectorAll('[data-gallery-clock]').forEach(node=>node.textContent=new Intl.DateTimeFormat(locale,{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(now));g.querySelectorAll('[data-gallery-date]').forEach(node=>node.textContent=new Intl.DateTimeFormat(locale,{timeZone:'America/Lima',weekday:'long',month:'short',day:'numeric',year:'numeric'}).format(now));g.querySelectorAll('[data-gallery-year]').forEach(node=>node.textContent=String(now.getFullYear()));}
  g.addEventListener('click',event=>{if((event.target as Element).closest('[data-gallery-top]')){if(galleryScroll)galleryScroll.scrollTo(0);else scroller.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});}},{signal:events.signal});
  function lock(){
    if(locks++===0){
      scroll=window.scrollY;
      window.dispatchEvent(new Event('leo:gallery-lock'));
      previousOverflow=document.documentElement.style.overflow;
      // No tocar body: cambiar su overflow altera el ancestro de position:sticky.
      document.documentElement.style.overflow='hidden';
    }
  }
  function unlock(){
    locks=Math.max(0,locks-1);
    if(locks===0){
      document.documentElement.style.overflow=previousOverflow;
      window.scrollTo({top:scroll,behavior:'instant'});
      window.dispatchEvent(new CustomEvent('leo:gallery-unlock',{detail:{scroll}}));
    }
  }
  function pause(root:Element){root.querySelectorAll('video').forEach(video=>video.pause());}
  function disconnectItems(){
    observer?.disconnect();observer=undefined;
  }
  function clearItemAnimations(){
    gsap.killTweensOf(Array.from(g.querySelectorAll('[data-gallery] .gallery-item')).map(item=>item.firstElementChild));
  }
  function animateItems(owner:GalleryOwner){
    disconnectItems();
    const items=Array.from(g.querySelectorAll<HTMLElement>('[data-gallery]:not([hidden]) .gallery-item'));
    gsap.set(items.map(item=>item.firstElementChild),{clipPath:reduced.matches?'inset(0)':'inset(100% 0 0)'});
    const itemObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!owns(owner))return;
      if(entry.isIntersecting){entry.target.querySelectorAll<HTMLImageElement>('img[data-src]:not([src])').forEach(img=>img.src=img.dataset.src!);if(!reduced.matches)gsap.to(entry.target.firstElementChild,{clipPath:'inset(0% 0 0)',duration:.65,ease:'power3.inOut'});itemObserver.unobserve(entry.target);}
    }),{root:scroller,threshold:.05});
    observer=itemObserver;items.forEach(item=>itemObserver.observe(item));
  }
  async function openGallery(button:HTMLElement){
    if(galleryBusy||g.open)return;
    const owner:GalleryOwner={id:++generation,events:new AbortController()};
    activeOwner=owner;
    galleryBusy=true;galleryOpener=button;pause(s);
    const index=button.dataset.open==='current'?Number(s.dataset.current||0):Number(button.dataset.open);
    const preparation:Promise<void>[]=[];
    window.dispatchEvent(new CustomEvent('leo:prepare-gallery',{detail:{index,waitUntil:(promise:Promise<void>)=>preparation.push(promise)}}));
    await Promise.all(preparation);
    if(events.signal.aborted||!owns(owner))return;
    g.querySelectorAll<HTMLElement>('[data-gallery]').forEach((grid,i)=>{
      grid.hidden=i!==index;
    });
    gsap.set(shell,{yPercent:0});
    g.removeAttribute('data-media-closing');
    g.toggleAttribute('data-sticky-gallery',index!==3);closeGalleryButton.classList.toggle('action-pill',index===3);
    // Prepare the return entrance before exposing the dialog (no visible flash).
    gsap.set(g.querySelector('.gallery-return-entry'),{opacity:reduced.matches?1:0,y:reduced.matches?0:-12});
    lock();g.showModal();scroller.scrollTop=0;
    window.scrollTo({top:scroll,behavior:'instant'});
    const sticky=g.querySelector<HTMLElement>('[data-gallery]:not([hidden]) [data-service-sticky]');
    if(sticky)disposeSticky=mountServiceStickyGrid(sticky,scroller,()=>owns(owner));
    updateGalleryClock();clockTimer=setInterval(()=>{if(owns(owner))updateGalleryClock();},1000);
    animateItems(owner);
    s.querySelectorAll('[data-open]').forEach(button=>button.setAttribute('aria-expanded','true'));
    closeGalleryButton.focus({preventScroll:true});
    if(!reduced.matches&&!isPhonePortrait()){
      const title=g.querySelector<HTMLElement>('[data-gallery]:not([hidden]) [data-sticky-title]');
      opening=openServiceCover(g,shell,title,s,index);
      await opening.finished;
      if(!owns(owner))return;
      opening=undefined;
    }
    galleryBusy=false;configureGalleryScroll();
    disposeReturn=mountGalleryReturn(g,scroller,reduced,()=>owns(owner));
  }
  async function closeGallery(){
    if(galleryBusy||!g.open||l.open||!activeOwner)return;
    const owner=activeOwner;
    destroyGalleryScroll();
    galleryBusy=true;shell.inert=true;g.setAttribute('data-media-closing','');pause(g);disconnectItems();
    if(!reduced.matches&&!isPhonePortrait()){
      // Choose the exit from the actual intro handoff, never from global page scroll.
      const active=g.querySelector<HTMLElement>('[data-gallery]:not([hidden])');
      const index=Number(active?.dataset.gallery||0);
      const title=active?.querySelector<HTMLElement>('[data-sticky-title]')||null;
      const viewport=scroller.getBoundingClientRect();
      const videoIntro=active?.querySelector<HTMLElement>('.service-video-intro');
      const videoRect=videoIntro?.getBoundingClientRect();
      const nearIntro=disposeSticky?disposeSticky.isNearIntro():!!videoRect&&videoRect.top>=viewport.top-viewport.height*.5&&videoRect.bottom>viewport.top;
      disposeSticky?.freeze();
      if(nearIntro&&disposeSticky){
        opening=disposeSticky.returnToIntro();
        await opening.finished;if(!owns(owner))return;opening=undefined;
      }
      if(!reduced.matches&&!document.hidden){
        opening=nearIntro?openServiceCover(g,shell,title,s,index,true):closeServiceGallery(g,shell,s,index,scroller);
        await opening.finished;if(!owns(owner))return;opening=undefined;
      }

    }
    disposeReturn?.();disposeReturn=undefined;
    disposeSticky?.();disposeSticky=undefined;clearInterval(clockTimer);
    owner.events.abort();activeOwner=undefined;g.close();shell.inert=false;clearItemAnimations();unlock();
    s.querySelectorAll('[data-open]').forEach(button=>button.setAttribute('aria-expanded','false'));
    galleryOpener?.focus({preventScroll:true});galleryOpener=null;galleryBusy=false;
  }
  async function openImage(button:HTMLElement){
    if(lightboxBusy||l.open)return;lightboxBusy=true;lightboxOpener=button;
    image.src=button.dataset.zoomSrc!;image.alt=button.dataset.zoomAlt||'';
    figure.querySelector('figcaption')!.textContent=image.alt;
    gsap.set(figure,{clipPath:reduced.matches?'inset(0)':'inset(100% 0 0)',y:reduced.matches?0:35});
    galleryScroll?.stop();
    lock();l.showModal();window.scrollTo({top:scroll,behavior:'instant'});
    l.querySelector<HTMLButtonElement>('[data-lightbox-close]')!.focus({preventScroll:true});
    await gsap.fromTo(figure,{clipPath:reduced.matches?'inset(0)':'inset(100% 0 0)',y:reduced.matches?0:35},{clipPath:'inset(0% 0 0)',y:0,duration:reduced.matches?0:.55,ease:'power3.inOut'});
    lightboxBusy=false;
  }
  async function closeImage(){
    if(lightboxBusy||!l.open)return;lightboxBusy=true;
    await gsap.to(figure,{clipPath:reduced.matches?'inset(0)':'inset(0 0 100%)',y:reduced.matches?0:-30,duration:reduced.matches?0:.45,ease:'power3.inOut'});
    l.close();unlock();if(galleryScroll)galleryScroll.start();else configureGalleryScroll();lightboxOpener?.focus({preventScroll:true});lightboxOpener=null;lightboxBusy=false;
  }
  document.addEventListener('click',event=>{
    const button=(event.target as Element).closest<HTMLElement>('button');
    if(!button)return;
    if(button.hasAttribute('data-open'))void openGallery(button);
    if(button.hasAttribute('data-gallery-close'))void closeGallery();
    if(button.hasAttribute('data-zoom-src'))void openImage(button);
    if(button.hasAttribute('data-lightbox-close'))void closeImage();
  },{signal:events.signal});
  g.addEventListener('cancel',event=>{event.preventDefault();void closeGallery();},{signal:events.signal});
  l.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();void closeImage();},{signal:events.signal});
  l.addEventListener('click',event=>{if(event.target===l)void closeImage();},{signal:events.signal});
  reduced.addEventListener('change',()=>{if(reduced.matches)opening?.finish();configureGalleryScroll();},{signal:events.signal});
  mouseScroll.addEventListener('change',configureGalleryScroll,{signal:events.signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){opening?.finish();galleryScroll?.stop();}else if(!l.open&&!galleryBusy)galleryScroll?.start();},{signal:events.signal});
  if(import.meta.hot)import.meta.hot.dispose(()=>{
    destroyGalleryScroll();opening?.dispose();disposeReturn?.();
    activeOwner?.events.abort();activeOwner=undefined;events.abort();clearInterval(clockTimer);disposeSticky?.();disconnectItems();clearItemAnimations();gsap.killTweensOf([shell,figure]);pause(g);
    if(l.open)l.close();if(g.open)g.close();while(locks)unlock();
  });
}
