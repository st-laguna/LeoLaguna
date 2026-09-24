export function initBrandPreview(section:HTMLElement){
  const preview = section.querySelector<HTMLElement>('#brand-preview')!;
  const imageHost = preview.querySelector<HTMLElement>('.brand-preview-image')!;
  const caption = preview.querySelector<HTMLElement>('figcaption')!;
  const close = preview.querySelector<HTMLButtonElement>('.brand-preview-close')!;
  const buttons = section.querySelectorAll<HTMLButtonElement>('[data-brand-preview]');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  const events = new AbortController();
  const options = {signal:events.signal};
  const cache = new Map<string,Promise<HTMLImageElement | null>>();
  let active: HTMLButtonElement | null = null;
  let request = 0;
  let frame = 0;
  let touch = false;
  let targetX = 0, targetY = 0, x = 0, y = 0;
  let pointerX = 0, pointerY = 0;
  function load(src:string) {
    if(!cache.has(src)) {
      cache.set(src,new Promise(resolve=>{
        const image = new Image();
        image.decoding='async';
        image.onload=()=>resolve(image);
        image.onerror=()=>resolve(null);
        image.src=src;
      }));
    }
    return cache.get(src)!;
  }

  function paint() {
    frame=0;
    if(preview.hidden)return;
    const factor=reduced.matches?1:.18;
    x+=(targetX-x)*factor;y+=(targetY-y)*factor;
    preview.style.transform=`translate3d(${x}px,${y}px,0)`;
    if(Math.abs(targetX-x)+Math.abs(targetY-y)>.4) frame=requestAnimationFrame(paint);
  }

  function position(immediate=false) {
    const width=preview.offsetWidth;
    const height=preview.offsetHeight;
    if(touch) {
      targetX=(window.innerWidth-width)/2;
      targetY=Math.max(16,window.innerHeight-height-24);
    } else {
      targetX=pointerX+24;
      targetY=pointerY-height-20;
      if(targetX+width>window.innerWidth-16) targetX=pointerX-width-24;
      if(targetY<90) targetY=pointerY+24;
      targetX=Math.max(16,Math.min(targetX,window.innerWidth-width-16));
      targetY=Math.max(16,Math.min(targetY,window.innerHeight-height-16));
    }
    if(immediate){x=targetX;y=targetY;}
    if(!frame)frame=requestAnimationFrame(paint);
  }

  function hide() {
    request++;
    active?.setAttribute('aria-expanded','false');
    active=null;
    preview.hidden=true;
    cancelAnimationFrame(frame);frame=0;
  }

  async function show(button:HTMLButtonElement,isTouch=false) {
    if(active!==button)hide();
    active=button;touch=isTouch;
    const token=++request;
    const image=await load(button.dataset.brandPreview!);
    if(token!==request||active!==button)return;
    if(!image){hide();return;}
    image.alt=button.dataset.brandName || '';
    imageHost.replaceChildren(image);
    caption.textContent=button.dataset.brandName || '';
    preview.toggleAttribute('data-touch',touch);
    preview.hidden=false;
    if(!reduced.matches)preview.querySelector('figure')?.animate([{clipPath:'inset(100% 0 0)'},{clipPath:'inset(0% 0 0)'}],{duration:450,easing:'cubic-bezier(.76,0,.24,1)'});
    button.setAttribute('aria-expanded','true');
    position(true);
  }

  buttons.forEach(button=>{
    button.addEventListener('pointerenter',event=>{
      if(event.pointerType!=='mouse'||!finePointer.matches)return;
      pointerX=event.clientX;pointerY=event.clientY;
      void show(button);
    },options);
    button.addEventListener('pointermove',event=>{
      if(active!==button||touch||event.pointerType!=='mouse')return;
      pointerX=event.clientX;pointerY=event.clientY;
      if(!preview.hidden)position();
    },options);
    button.addEventListener('pointerleave',()=>{
      if(active===button&&!touch)hide();
    },options);
    button.addEventListener('focus',()=>{
      if(!button.matches(':focus-visible'))return;
      const bounds=button.getBoundingClientRect();
      pointerX=bounds.left+bounds.width/2;pointerY=bounds.top;
      void show(button);
    },options);
    button.addEventListener('blur',event=>{
      if(event.relatedTarget instanceof Node && preview.contains(event.relatedTarget))return;
      if(active===button)hide();
    },options);
    button.addEventListener('click',event=>{
      if(finePointer.matches && event.detail!==0)return;
      if(active===button&&!preview.hidden){hide();return;}
      const bounds=button.getBoundingClientRect();
      pointerX=bounds.left+bounds.width/2;pointerY=bounds.top;
      void show(button,!finePointer.matches);
    },options);
  });
  close.addEventListener('click',()=>{
    const previous=active;hide();previous?.focus({preventScroll:true});hide();
  },options);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();},options);
  document.addEventListener('pointerdown',event=>{
    const target=event.target as Node;
    if(active&&!active.contains(target)&&!preview.contains(target))hide();
  },options);
  window.addEventListener('scroll',hide,{passive:true,signal:events.signal});
  window.addEventListener('resize',hide,options);
  window.addEventListener('blur',hide,options);
  return()=>{hide();events.abort();cache.clear();};
}
