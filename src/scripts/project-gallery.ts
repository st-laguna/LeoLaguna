import gsap from 'gsap';
const gallery=document.querySelector<HTMLDialogElement>('.gallery-dialog');
const lightbox=document.querySelector<HTMLDialogElement>('.project-lightbox');
const section=document.querySelector<HTMLElement>('[data-projects]');
if(gallery&&lightbox&&section){
  const g=gallery,l=lightbox,s=section;
  const events=new AbortController();
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const shell=g.querySelector<HTMLElement>('.gallery-shell')!;
  const scroller=g.querySelector<HTMLElement>('.gallery-scroll')!;
  const image=l.querySelector<HTMLImageElement>('[data-lightbox-image]')!;
  const figure=l.querySelector<HTMLElement>('.lightbox-figure')!;
  const closeGalleryButton=g.querySelector<HTMLButtonElement>('[data-gallery-close]')!;
  let locks=0,scroll=0,previousOverflow='';
  let galleryBusy=false,lightboxBusy=false;
  let galleryOpener:HTMLElement|null=null,lightboxOpener:HTMLElement|null=null;
  let observer:IntersectionObserver|undefined;
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
      window.dispatchEvent(new Event('leo:gallery-unlock'));
    }
  }
  function pause(root:Element){root.querySelectorAll('video').forEach(video=>video.pause());}
  function animateItems(){
    observer?.disconnect();
    const items=Array.from(g.querySelectorAll<HTMLElement>('[data-gallery]:not([hidden]) .gallery-item'));
    gsap.set(items.map(item=>item.firstElementChild),{clipPath:reduced.matches?'inset(0)':'inset(100% 0 0)'});
    if(reduced.matches)return;
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){gsap.to(entry.target.firstElementChild,{clipPath:'inset(0% 0 0)',duration:.65,ease:'power3.inOut'});observer?.unobserve(entry.target);}
    }),{root:scroller,threshold:.05});
    items.forEach(item=>observer!.observe(item));
  }
  async function openGallery(button:HTMLElement){
    if(galleryBusy||g.open)return;
    galleryBusy=true;galleryOpener=button;pause(s);
    const index=button.dataset.open==='current'?Number(s.dataset.current||0):Number(button.dataset.open);
    g.querySelectorAll<HTMLElement>('[data-gallery]').forEach((grid,i)=>grid.hidden=i!==index);
    gsap.set(shell,{yPercent:reduced.matches?0:100});
    lock();g.showModal();scroller.scrollTop=0;
    window.scrollTo({top:scroll,behavior:'instant'});
    animateItems();
    s.querySelectorAll('[data-open]').forEach(button=>button.setAttribute('aria-expanded','true'));
    closeGalleryButton.focus({preventScroll:true});
    await gsap.to(shell,{yPercent:0,duration:reduced.matches?0:.7,ease:'power3.inOut'});
    galleryBusy=false;
  }
  async function closeGallery(){
    if(galleryBusy||!g.open||l.open)return;
    galleryBusy=true;pause(g);observer?.disconnect();
    await gsap.to(shell,{yPercent:reduced.matches?0:100,duration:reduced.matches?0:.65,ease:'power3.inOut'});
    g.close();unlock();
    s.querySelectorAll('[data-open]').forEach(button=>button.setAttribute('aria-expanded','false'));
    galleryOpener?.focus({preventScroll:true});galleryBusy=false;
  }
  async function openImage(button:HTMLElement){
    if(lightboxBusy||l.open)return;lightboxBusy=true;lightboxOpener=button;
    image.src=button.dataset.zoomSrc!;image.alt=button.dataset.zoomAlt||'';
    figure.querySelector('figcaption')!.textContent=image.alt;
    gsap.set(figure,{clipPath:reduced.matches?'inset(0)':'inset(100% 0 0)',y:reduced.matches?0:35});
    lock();l.showModal();window.scrollTo({top:scroll,behavior:'instant'});
    l.querySelector<HTMLButtonElement>('[data-lightbox-close]')!.focus({preventScroll:true});
    await gsap.fromTo(figure,{clipPath:reduced.matches?'inset(0)':'inset(100% 0 0)',y:reduced.matches?0:35},{clipPath:'inset(0% 0 0)',y:0,duration:reduced.matches?0:.55,ease:'power3.inOut'});
    lightboxBusy=false;
  }
  async function closeImage(){
    if(lightboxBusy||!l.open)return;lightboxBusy=true;
    await gsap.to(figure,{clipPath:reduced.matches?'inset(0)':'inset(0 0 100%)',y:reduced.matches?0:-30,duration:reduced.matches?0:.45,ease:'power3.inOut'});
    l.close();unlock();lightboxOpener?.focus({preventScroll:true});lightboxBusy=false;
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
  if(import.meta.hot)import.meta.hot.dispose(()=>{
    events.abort();observer?.disconnect();gsap.killTweensOf([shell,figure]);pause(g);
    if(l.open)l.close();if(g.open)g.close();while(locks)unlock();
  });
}
