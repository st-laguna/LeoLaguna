import gsap from 'gsap';
import { contactCopy } from '../data/contact';

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile; } }
const modal=document.querySelector<HTMLDialogElement>('[data-contact-modal]');
if(modal && typeof modal.showModal==='function') {
  const events=new AbortController();const signal=events.signal;
  const card=modal.querySelector<HTMLFormElement>('[data-contact-form]')!;
  const email=card.querySelector<HTMLInputElement>('[name=email]')!;
  const message=card.querySelector<HTMLTextAreaElement>('[name=message]')!;
  const submit=card.querySelector<HTMLButtonElement>('[data-contact-submit]')!;
  const closeButton=card.querySelector<HTMLButtonElement>('[data-contact-close]')!;
  const status=card.querySelector<HTMLElement>('[data-contact-status]')!;
  const verification=modal.querySelector<HTMLElement>('[data-contact-verification]')!;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  let settled=false;
  const material=card.querySelector<HTMLElement>('.contact-card__front')!;
  const backMaterial=card.querySelector<HTMLElement>('.contact-card__back')!;
  const foilState={x:50,y:50,strength:0};
  function paintFoil(){
    material.style.setProperty('--foil-x',`${foilState.x}%`);material.style.setProperty('--foil-y',`${foilState.y}%`);
    // Material travel/angles are tuned in the CSS FRONT FX TUNING block.
    material.style.setProperty('--fx-pointer-x',String(foilState.x-50));
    material.style.setProperty('--fx-pointer-y',String(foilState.y-50));
    material.style.setProperty('--foil-strength',String(foilState.strength));
  }
  const foilX=gsap.quickTo(foilState,'x',{duration:.35,ease:'power3.out',onUpdate:paintFoil});
  const foilY=gsap.quickTo(foilState,'y',{duration:.35,ease:'power3.out',onUpdate:paintFoil});
  const foilStrength=gsap.quickTo(foilState,'strength',{duration:.45,ease:'power2.out',onUpdate:paintFoil});
  function resetFoil(){foilX(50);foilY(50);foilStrength(0);}

  const tiltX=gsap.quickTo(card,'rotationX',{duration:.35,ease:'power3.out'});
  const tiltY=gsap.quickTo(card,'rotationY',{duration:.35,ease:'power3.out'});
  function stopTilt(){settled=false;tiltX.tween.pause();tiltY.tween.pause();foilX.tween.pause();foilY.tween.pause();foilStrength.tween.pause();foilState.x=50;foilState.y=50;foilState.strength=0;paintFoil();}
  function resetTilt(){resetFoil();if(settled&&!closing){tiltX(0);tiltY(0);}}
  card.addEventListener('pointermove',event=>{
    if(!settled||closing||reduced.matches||!fine.matches||event.pointerType==='touch')return;
    const bounds=card.getBoundingClientRect();
    const x=gsap.utils.clamp(-1,1,((event.clientX-bounds.left)/bounds.width-.5)*2);
    const y=gsap.utils.clamp(-1,1,((event.clientY-bounds.top)/bounds.height-.5)*2);
    foilX((x+1)*50);foilY((y+1)*50);foilStrength(Math.max(0,Math.min(1,(Math.hypot(x,y)-.12)/.88)));
    tiltX(-y*7);tiltY(x*7);
  },{signal});
  card.addEventListener('pointerleave',resetTilt,{signal});
  // Keep typing/selection steady; resume following the pointer after editing.
  card.addEventListener('focusin',event=>{if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement){resetTilt();settled=false;}},{signal});
  card.addEventListener('focusout',()=>{if(!closing&&modal!.open&&!animation)settled=true;},{signal});
  fine.addEventListener('change',()=>{if(!fine.matches)resetTilt();},{signal});
  let opener:HTMLElement|null=null,animation:gsap.core.Timeline|null=null,widget:string|undefined,token='',busy=false,closing=false,generation=0;
  let openingFrame=0;
  let originalGutter='';
  let originalOverflow='',originalPadding='',request:AbortController|undefined;
  let loading:Promise<void>|undefined;
  let statusKey:keyof typeof contactCopy.en|undefined;
  const copy=()=>contactCopy[document.documentElement.lang==='es'?'es':'en'];
  const say=(key:keyof typeof contactCopy.en|undefined)=>{statusKey=key;status.textContent=key?copy()[key]:'';};
  function translate(){
    card.querySelectorAll<HTMLElement>('[data-contact-text]').forEach(n=>{n.textContent=copy()[n.dataset.contactText as keyof typeof contactCopy.en];});
    message.placeholder=copy().placeholder;closeButton.setAttribute('aria-label',copy().close);
    card.querySelector('[data-contact-counter]')!.setAttribute('aria-label',copy().count);
    card.querySelectorAll('[data-contact-copy]').forEach(button=>button.setAttribute('aria-label',copy().copy));
    if(busy)submit.textContent=copy().sending;say(statusKey);
  }
  function update(){submit.disabled=busy;card.querySelector('[data-contact-counter]')!.textContent=`${message.value.length} / 500`;}
  function loadTurnstile(){
    if(window.turnstile)return Promise.resolve();
    if(loading)return loading;
    loading=new Promise<void>((resolve,reject)=>{
      const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
      const timeout=setTimeout(()=>{script.remove();loading=undefined;reject(new Error('Turnstile timeout'));},12000);
      script.onload=()=>{clearTimeout(timeout);window.turnstile?resolve():reject(new Error('Turnstile unavailable'));};
      script.onerror=()=>{clearTimeout(timeout);script.remove();loading=undefined;reject(new Error('Turnstile unavailable'));};
      document.head.append(script);
    });return loading;
  }
  async function mountVerification(){
    const current=++generation;token='';update();say('verifying');
    try {
      if(!modal!.dataset.siteKey)throw new Error('Missing Site Key');
      await loadTurnstile();if(!modal!.open||closing||current!==generation)return;
      widget=window.turnstile!.render(verification,{sitekey:modal!.dataset.siteKey,action:'contact',theme:'light',size:'flexible',appearance:'interaction-only',language:document.documentElement.lang==='es'?'es':'en',
        callback:(value:string)=>{if(current!==generation)return;token=value;update();if(statusKey==='verifying'||statusKey==='verification')say(undefined);},
        'expired-callback':()=>{token='';update();say('verification');},
        'error-callback':()=>{token='';update();say('verification');},
      });
    }catch{if(modal!.open&&current===generation)say('unavailable');}
  }
  function release(){
    cancelAnimationFrame(openingFrame);openingFrame=0;modal!.removeAttribute('data-contact-moving');
    stopTilt();generation++;if(widget!==undefined){window.turnstile?.remove(widget);widget=undefined;}verification.replaceChildren();token='';update();
    document.documentElement.style.overflow=originalOverflow;document.documentElement.style.paddingRight=originalPadding;document.documentElement.style.scrollbarGutter=originalGutter;
    window.dispatchEvent(new Event('leo:contact-close'));
    opener?.focus({preventScroll:true});opener=null;closing=false;
  }
  function finishClose(){animation?.kill();animation=null;if(modal!.open)modal!.close();}
  function close(){if(!modal!.open||closing)return;closing=true;stopTilt();
    if(reduced.matches||openingFrame){cancelAnimationFrame(openingFrame);openingFrame=0;finishClose();return;}
    modal!.setAttribute('data-contact-moving','');
    animation?.kill();animation=gsap.timeline({onComplete:finishClose})
      .to(card,{rotateY:180,rotateX:0,rotateZ:-7,duration:.55,ease:'power3.inOut'},0)
      // Back reflections move with the existing flip, without another loop.
      .fromTo(backMaterial,{'--fx-pointer-x':-25,'--fx-pointer-y':15,'--foil-x':'25%','--foil-y':'65%'},{'--fx-pointer-x':30,'--fx-pointer-y':-20,'--foil-x':'80%','--foil-y':'30%',duration:.55,ease:'power3.inOut'},0)
      // Hold the fully turned back for one second before returning below the viewport.
      .to(card,{y:window.innerHeight*1.2,scale:.95,duration:.65,ease:'power3.in'},0.65)
      .to(modal,{'--contact-backdrop':0,'--contact-blur':'0px',duration:.5},0.6);
  }
  function open(link:HTMLElement){
    if(modal!.open||closing)return false;
    // Prepare before showModal: no centered card or stale backdrop can be painted.
    animation?.kill();stopTilt();
    modal!.setAttribute('data-contact-moving','');
    gsap.set(modal,{'--contact-backdrop':0,'--contact-blur':'0px'});
    gsap.set(card,{rotateY:0,autoAlpha:reduced.matches?1:0,y:reduced.matches?0:window.innerHeight*1.2,rotateZ:reduced.matches?0:-7,rotateX:reduced.matches?0:7,scale:reduced.matches?1:.95});
    try{modal!.showModal();}catch{modal!.removeAttribute('data-contact-moving');return false;}
    opener=link;window.dispatchEvent(new Event('leo:close-menu'));
    originalOverflow=document.documentElement.style.overflow;originalPadding=document.documentElement.style.paddingRight;originalGutter=document.documentElement.style.scrollbarGutter;
    const gutter=window.innerWidth-document.documentElement.clientWidth;
    // Reserve a classic scrollbar's space while locking; no Hero width/resize jump.
    if(gutter>0){
      if(CSS.supports('scrollbar-gutter','stable'))document.documentElement.style.scrollbarGutter='stable';
      else document.documentElement.style.paddingRight=`${gutter}px`;
    }
    document.documentElement.style.overflow='hidden';
    window.dispatchEvent(new Event('leo:contact-open'));translate();say(undefined);
    const blur=fine.matches?'5px':'2px';
    animation=gsap.timeline({paused:true,onComplete:()=>{
      animation=null;settled=true;modal!.removeAttribute('data-contact-moving');
      if(!closing){card.querySelector<HTMLElement>('#contact-card-title')!.focus({preventScroll:true});void mountVerification();}
    }})
      .set(card,{autoAlpha:1},0)
      .to(modal,{'--contact-backdrop':.22,'--contact-blur':blur,duration:reduced.matches?0:.45,ease:'power2.inOut'},0)
      .to(card,{y:0,scale:1,duration:reduced.matches?0:.9,ease:'power3.inOut'},0)
      .to(card,{rotateZ:0,rotateX:0,duration:reduced.matches?0:.8,ease:'power3.inOut'},reduced.matches?0:.1);
    if(reduced.matches)animation.play(0);
    else {
      // Give dialog/layout/compositing a frame before the timeline clock starts.
      openingFrame=requestAnimationFrame(()=>{
        openingFrame=requestAnimationFrame(()=>{openingFrame=0;if(modal!.open&&!closing)animation?.play(0);});
      });
    }
    return true;
  }
  // Delegation also covers gallery footers and controls moved into About's UI.
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href^="mailto:"]'):null;
    if(link&&open(link))event.preventDefault();
  },{signal});
  card.querySelectorAll<HTMLElement>('.contact-card__close,[data-contact-copy],[data-contact-submit]').forEach(button=>{
    button.addEventListener('pointerdown',()=>button.removeAttribute('data-contact-released'),{signal});
    button.addEventListener('pointerup',()=>button.setAttribute('data-contact-released',''),{signal});
    button.addEventListener('pointerleave',()=>button.removeAttribute('data-contact-released'),{signal});
    button.addEventListener('pointercancel',()=>button.removeAttribute('data-contact-released'),{signal});
  });
  closeButton.addEventListener('click',close,{signal});
  modal.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();close();},{signal});
  // Require both pointer ends on the backdrop; dragging out of a field never closes it.
  let backdropDown=false;
  modal.addEventListener('pointerdown',event=>{backdropDown=event.target===modal||event.target===modal.querySelector('.contact-modal__stage');},{signal});
  modal.addEventListener('click',event=>{if(backdropDown&&(event.target===modal||event.target===modal.querySelector('.contact-modal__stage')))close();backdropDown=false;},{signal});
  modal.addEventListener('close',()=>{animation?.kill();animation=null;release();},{signal});
  message.addEventListener('input',update,{signal});
  window.addEventListener('leo:language-change',translate,{signal});
  reduced.addEventListener('change',()=>{if(reduced.matches){stopTilt();if(animation){if(closing)finishClose();else animation.progress(1);}gsap.set(card,{rotateX:0,rotateY:0});}}, {signal});
  card.querySelectorAll('[data-contact-copy]').forEach(button=>button.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText('hello@leolaguna.com');say('copied');}catch{say('copyFailed');}
  },{signal}));
  card.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    if(!token){say('verification');return;}
    if(!card.reportValidity())return;
    busy=true;update();submit.textContent=copy().sending;say(undefined);
    request=new AbortController();const timeout=setTimeout(()=>request?.abort(),20000);
    try {
      const response=await fetch(modal!.dataset.endpoint!,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.value.trim(),message:message.value,token}),signal:request.signal});
      const result=await response.json().catch(()=>({}));
      if(!response.ok||result.ok!==true){say(response.status===429?'limited':response.status===503?'unavailable':result.code==='verification'?'verification':'failed');}
      else{card.reset();say('sent');}
    }catch{say('failed');}
    finally{clearTimeout(timeout);busy=false;token='';submit.textContent=copy().send;update();if(widget!==undefined)window.turnstile?.reset(widget);}
  },{signal});
  window.addEventListener('pagehide',()=>{if(modal.open)finishClose();},{signal});
  if(import.meta.hot)import.meta.hot.dispose(()=>{request?.abort();if(modal.open)finishClose();animation?.kill();tiltX.tween.kill();tiltY.tween.kill();foilX.tween.kill();foilY.tween.kill();foilStrength.tween.kill();events.abort();});
}
