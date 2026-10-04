import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { initFooterMarquee } from './footer-marquee';
import { scrollPage } from './smooth-scroll';
export function initFooter() {
  const footer=document.querySelector<HTMLElement>('.footer');
  if(!footer)return ()=>{};
  const entranceMedia=gsap.matchMedia();
  entranceMedia.add('(max-width:700px) and (prefers-reduced-motion:no-preference), (max-width:1000px) and (max-height:500px) and (prefers-reduced-motion:no-preference)',()=>{
    footer.querySelectorAll<HTMLElement>('.footer__marquee > .footer__mobile-message > .footer__mobile-row').forEach((row,i)=>{
      gsap.fromTo(row,{xPercent:i%2?100:-100},{xPercent:0,ease:'none',scrollTrigger:{trigger:row,start:'top bottom',end:'top 65%',scrub:.8}});
    });
    const brands=document.querySelector('.brands-layout');
    if(brands)gsap.fromTo(brands,{clipPath:'inset(100% 0 0)'},{clipPath:'inset(0% 0 0)',ease:'none',scrollTrigger:{trigger:brands,start:'top 95%',end:'top 35%',scrub:.8}});
  });
  // One reversible reveal; measure the stationary seam only on refresh.
  entranceMedia.add('(prefers-reduced-motion: no-preference)', () => {
    const pieces = footer.querySelectorAll<HTMLElement>('.footer__bottom');
    const desktopSeam = footer.querySelector<HTMLElement>('.footer__strip-window')!;
    const compactSeam = footer.querySelector<HTMLElement>('.footer__compact-window')!;
    gsap.fromTo(pieces, {yPercent:-35}, {
      yPercent:0,
      ease:'none',
      force3D:true,
      scrollTrigger:{
        id:'footer-strip-reveal',
        trigger:footer,
        start:() => {
          const seam = getComputedStyle(desktopSeam).display === 'none' ? compactSeam : desktopSeam;
          const top = seam.getBoundingClientRect().top + window.scrollY;
          return Math.min(top - innerHeight * 1.1, ScrollTrigger.maxScroll(window) - 1);
        },
        end:() => ScrollTrigger.maxScroll(window),
        scrub:.65,
        invalidateOnRefresh:true,
      },
    });
  });
  const mobileVisibility=new IntersectionObserver(([entry])=>footer.toggleAttribute('data-mobile-visible',entry.isIntersecting));
  mobileVisibility.observe(footer);

  const root=document.documentElement;
  const abort=new AbortController();const signal=abort.signal;
  signal.addEventListener('abort',()=>{entranceMedia.revert();mobileVisibility.disconnect();});
  footer.querySelector<HTMLAnchorElement>('.footer__mark')
    ?.addEventListener('click', event => {
      if (
        event.ctrlKey || event.metaKey ||
        event.shiftKey || event.altKey
      ) return;

      event.preventDefault();
      scrollPage(0, false);
    }, { signal });

  const marquee=footer.querySelector<HTMLElement>('[data-footer-marquee]')!;
  const marqueeRenderer=initFooterMarquee(marquee);

  const clickTarget=footer.querySelector<HTMLElement>('[data-footer-click-target]');
const clickCursor=footer.querySelector<HTMLElement>('[data-footer-click-cursor]');
const cursorHome=clickCursor?.parentElement;
const cursorLabel=clickCursor?.querySelector('span');
const cursorArrow=clickCursor?.querySelector<HTMLElement>('.footer__click-arrow');
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');

let px=0,py=0,cx=0,cy=0,hasPointer=false,cursorFrame=0,scrollTimer=0,isScrolling=false;
const cursorSize={scale:1};
let cursorPulse:gsap.core.Timeline|undefined;

function setCursor(show:boolean){
  if(!clickCursor)return;
  clickCursor.classList.toggle('is-visible',show&&finePointer.matches);
}

function checkCursor(){
  if(!clickTarget||!hasPointer)return;
  const el=document.elementFromPoint(px,py);
  const show=!!el&&(clickTarget.contains(el)||!!el.closest('.workflow__card, .project-enlarge:not(:disabled), .gallery-item button, .featured-work__cover, .featured-work a[href]'));
  // Keep the current label and arrow throughout the fade out.
  if(!show||!finePointer.matches){setCursor(false);return;}
  const zoom=!!el?.closest('.projects .project-media .project-enlarge');
  const label=zoom?'ZOOM':'CLICK';
  if(cursorLabel&&cursorLabel.textContent!==label)cursorLabel.textContent=label;
  if(cursorArrow)cursorArrow.style.display=zoom?'none':'';
  // Reuse the same circle inside an open native dialog's top layer.
  const cursorParent=el?.closest('dialog[open]')||document.body;
  if(clickCursor&&cursorParent&&clickCursor.parentElement!==cursorParent)cursorParent.append(clickCursor);
  setCursor(true);
}

function pulseCursor(event:PointerEvent){
  if(event.button!==0||event.pointerType==='touch'||!finePointer.matches||!clickCursor?.classList.contains('is-visible')||reduced.matches)return;
  cursorPulse?.kill();
  const scale=cursorLabel?.textContent==='ZOOM'?.76:.84;
  // Scale after translation so the cursor shrinks around its current center.
  cursorPulse=gsap.timeline()
    .to(cursorSize,{scale,duration:.184,ease:'power2.inOut'})
    .to(cursorSize,{scale:1,duration:.276,ease:'power2.inOut'});
}

function animateCursor(){
  if(!clickCursor)return;
  cx+=(px-cx)*.18;
  cy+=(py-cy)*.18;
  clickCursor.style.transform=`translate3d(${cx}px,${cy}px,0) translate(-50%,-50%) scale(${cursorSize.scale})`;
  cursorFrame=requestAnimationFrame(animateCursor);
}

document.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  px=e.clientX;py=e.clientY;
  if(!hasPointer){hasPointer=true;cx=px;cy=py;}
  checkCursor();
},{passive:true,signal});

window.addEventListener('scroll',checkCursor,{passive:true,signal});

document.documentElement.addEventListener('mouseleave',()=>setCursor(false),{signal});
window.addEventListener('blur',()=>setCursor(false),{signal});

if(clickCursor&&clickTarget&&finePointer.matches)
  cursorFrame=requestAnimationFrame(animateCursor);

  const nav=document.querySelector<HTMLElement>('.site-nav');
  const work=document.querySelector<HTMLButtonElement>('[data-footer-work]');
  const submenu=document.querySelector<HTMLElement>('#site-work-options');

const navItems = Array.from(
  document.querySelectorAll<HTMLElement>(
    '.site-nav__items > .hover-option'
  )
);

let navigationWidth=0;
function setFooterNavigation(active: boolean) {
  navigationWidth=innerWidth;
  const controls=document.querySelector<HTMLElement>('.site-header .site-controls');
  const mark=footer?.querySelector<HTMLElement>('.footer__mark');
  if(controls && mark) {
    const left=mark.getBoundingClientRect().right;
    const right=controls.getBoundingClientRect().left;
    root.style.setProperty('--footer-nav-center',((left+right)/2)+'px');
  }
  // Reduced motion only needs the final layout, not FLIP geometry.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.toggle('footer-active', active);
    return;
  }
  const previousPositions = navItems.map(
    item => item.getBoundingClientRect()
  );

  root.classList.toggle('footer-active', active);

  const nextPositions = navItems.map(
    item => item.getBoundingClientRect()
  );

  navItems.forEach((item, index) => {
    const previous = previousPositions[index];
    const next = nextPositions[index];
    if(!previous.width || !next.width)return;

    item.animate(
      [
        {
          transform: `translate(
            ${previous.left - next.left}px,
            ${previous.top - next.top}px
          )`,
        },
        {
          transform: 'translate(0, 0)',
        },
      ],
      {
        duration: 750,
        easing: 'cubic-bezier(.22, 1, .36, 1)',
      }
    );
  });
}

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const animations=new Set<Animation>();
  function reveal(element:HTMLElement,delay=0){
    element.setAttribute('data-entered','');
    if(reduced.matches)return;
    const animation=element.animate([
      {opacity:0,translate:'0 26px'},
      {opacity:1,translate:'0 0'},
    ],{duration:850,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
    animations.add(animation);
    animation.onfinish=()=>{animation.cancel();animations.delete(animation);};
  }
  const entranceElements=Array.from(footer.querySelectorAll<HTMLElement>('[data-footer-enter]'));
  footer.setAttribute('data-entrance-ready','');
  const entranceObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const element=entry.target as HTMLElement;
      if(entry.isIntersecting&&!element.hasAttribute('data-entered')){
        reveal(element,Number(element.dataset.footerEnter)||0);
      }
    });
  },{threshold:.05});
  entranceElements.forEach(el => {
  if (!el.matches('.footer__name, .footer__mark')) {
    entranceObserver.observe(el);
  }
});
  reduced.addEventListener('change',()=>{
    animations.forEach(a=>a.cancel());animations.clear();
    entranceElements.forEach(el=>el.setAttribute('data-entered',''));
  },{signal});
  const formatter=new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  let dateLocale=document.documentElement.lang==='es'?'es-PE':'en-US';
  let dateFormatter=new Intl.DateTimeFormat(dateLocale,{timeZone:'America/Lima',weekday:'long',month:'short',day:'numeric',year:'numeric'});
  const clock=footer.querySelector<HTMLElement>('[data-footer-clock]');
  const date=footer.querySelector<HTMLElement>('[data-footer-date]');
  const year=footer.querySelector<HTMLElement>('[data-footer-year]');
  if(year)year.textContent=String(new Date().getFullYear());
  function updateClock(){const locale=document.documentElement.lang==='es'?'es-PE':'en-US';if(locale!==dateLocale){dateLocale=locale;dateFormatter=new Intl.DateTimeFormat(locale,{timeZone:'America/Lima',weekday:'long',month:'short',day:'numeric',year:'numeric'});}const now=new Date();if(clock)clock.textContent=formatter.format(now);if(date)date.textContent=dateFormatter.format(now);}
  updateClock();const timer=setInterval(updateClock,1000);
  function setOpen(open:boolean){
    work?.setAttribute('aria-expanded',String(open));
    if(submenu){
      submenu.hidden=!open;
      if(open){
        // Do not allow an older global reveal animation to crop the dropdown.
        nav?.style.setProperty('clip-path','none');
        nav?.style.setProperty('overflow','visible');
        submenu.querySelectorAll<HTMLElement>('a').forEach((el,i)=>reveal(el,i*70));
      }
    }
  }
  work?.addEventListener('click',()=>setOpen(work.getAttribute('aria-expanded')!=='true'),{signal});
  document.addEventListener('pointerdown',event=>{pulseCursor(event);if(!nav?.contains(event.target as Node))setOpen(false);},{signal});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&work?.getAttribute('aria-expanded')==='true'){setOpen(false);work.focus();}},{signal});
  nav?.addEventListener('click',event=>{
    const link=(event.target as Element).closest<HTMLAnchorElement>('a');
    if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    setOpen(false);
    if(link.dataset.projectJump!==undefined){
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('leo:project-jump',{detail:Number(link.dataset.projectJump)}));
    }
  },{signal});
  const featured=document.querySelector<HTMLElement>('[data-featured-works]');
  let scheduled=0,wasActive=false;
  function position(){
    scheduled=0;
    const featuredRect=featured?.getBoundingClientRect();
    root.toggleAttribute('data-featured-header',!!featuredRect && featuredRect.top<=120 && featuredRect.bottom>60);
    const viewport=window.visualViewport;
    const visibleHeight=viewport?.height ?? innerHeight;
    const viewportTop=viewport?.offsetTop ?? 0;
    const scroller=document.scrollingElement || document.documentElement;
    const remaining=Math.max(0,scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop);
    // Read before reveal() changes attributes and starts entrance animations.
    const rect=footer!.getBoundingClientRect();
    const headerBottom=document.querySelector('.site-header .site-nav')?.getBoundingClientRect().bottom ?? 60;
    root.toggleAttribute('data-contact-hidden',rect.top<=viewportTop+headerBottom+24 && rect.bottom>viewportTop);

      if (remaining <= 4 && getComputedStyle(footer!.querySelector('.footer__compact-piece')!).display === 'contents') {
        const name = footer?.querySelector<HTMLElement>('.footer__name');


        if (name && !name.hasAttribute('data-entered')) {
          reveal(name, 0);
        }


      }
    
    // A short footer can finish below the top edge when browser chrome retracts.
    const finalTop=viewportTop+Math.max(0,visibleHeight-rect.height);
    const inView=rect.top<viewportTop+visibleHeight && rect.bottom>viewportTop+100;
    const directMenu=nav && getComputedStyle(nav).position==='fixed' && !root.hasAttribute('data-tablet-portrait');
    const active=directMenu ? inView : inView&&(rect.top<=finalTop+24||remaining<=8);
    if((rect.top>innerHeight+40||rect.bottom<0)&&!reduced.matches){
      animations.forEach(a=>a.cancel());animations.clear();
      entranceElements.forEach(el=>el.removeAttribute('data-entered'));
    }
      if (active !== wasActive || (active && navigationWidth!==innerWidth)) {
    setFooterNavigation(active);
}
if (!active && wasActive) {
  setOpen(false);
}

wasActive = active;

const headerY = `${Math.max(16, rect.top + 24)}px`;
if (root.style.getPropertyValue('--footer-header-y') !== headerY) {
  root.style.setProperty('--footer-header-y', headerY);
}

if (active && nav && !root.classList.contains('projects-active')) {
  nav.inert = false;
}
} // Cierra position()
function schedule() {
  if (!scheduled) {
    scheduled = requestAnimationFrame(position);
  }
}

window.addEventListener('scroll', schedule, {
  passive: true,
  signal,
});

window.visualViewport?.addEventListener('resize',schedule,{passive:true,signal});
window.visualViewport?.addEventListener('scroll',schedule,{passive:true,signal});
window.addEventListener('resize', schedule, {
  passive: true,
  signal,
});

function updateGlass() {
  const compact= !root.hasAttribute('data-large-tablet-landscape') && (root.hasAttribute('data-ipad') || root.hasAttribute('data-tablet-portrait') || matchMedia('(max-width:700px), (any-pointer:coarse) and (max-width:1366px), (max-width:1000px) and (max-height:500px)').matches);
  footer!.toggleAttribute('data-compact-layout',compact);
  const phoneLandscape=!root.hasAttribute('data-ipad') && matchMedia('(orientation:landscape) and (max-width:1000px) and (max-height:500px) and (any-pointer:coarse)').matches;
  footer!.toggleAttribute('data-phone-landscape',phoneLandscape);
  if(compact){const info=footer!.querySelector<HTMLElement>('.footer__contact-info')!;const height=info.getBoundingClientRect().height+'px';if(footer!.style.getPropertyValue('--footer-contact-height')!==height)footer!.style.setProperty('--footer-contact-height',height);}
  const compactPortrait=matchMedia('(orientation:portrait)').matches && (root.hasAttribute('data-tablet-portrait') || matchMedia('(max-width:700px)').matches);
  footer!.toggleAttribute('data-compact-portrait',compactPortrait);
  const message=marquee.querySelector<HTMLElement>(':scope > .footer__mobile-message');
  const htmlSource=!!message && getComputedStyle(message).display!=='none';
  footer!.setAttribute('data-footer-refraction',htmlSource?'html':'svg');
  marqueeRenderer.resize();

  schedule();
}
window.addEventListener('leo:orientation-ready',updateGlass,{signal});
const resizeObserver = new ResizeObserver(updateGlass);
resizeObserver.observe(marquee);
resizeObserver.observe(footer.querySelector('.footer__contact-info')!);
const glassLayoutObserver=new MutationObserver(updateGlass);
glassLayoutObserver.observe(root,{attributes:true,attributeFilter:['data-tablet-portrait']});
void document.fonts.ready.then(()=>{if(!signal.aborted)updateGlass();});
position();

return () => {
  entranceObserver.disconnect();
  animations.forEach(animation=>animation.cancel());
  footer.removeAttribute('data-entrance-ready');
  footer.removeAttribute('data-compact-portrait');
  footer.removeAttribute('data-compact-layout');
  footer.removeAttribute('data-phone-landscape');
  footer.style.removeProperty('--footer-contact-height');
  footer.removeAttribute('data-footer-refraction');
  entranceElements.forEach(element=>element.removeAttribute('data-entered'));

  cancelAnimationFrame(cursorFrame);
  cursorPulse?.kill();
  clickCursor?.classList.remove('is-visible');
  if(clickCursor&&cursorHome)cursorHome.append(clickCursor);

  abort.abort();
  clearInterval(timer);
  cancelAnimationFrame(scheduled);
  resizeObserver.disconnect();
  glassLayoutObserver.disconnect();
  marqueeRenderer.dispose();
  setOpen(false);
  root.classList.remove('footer-active');
  root.removeAttribute('data-featured-header');
  root.removeAttribute('data-contact-hidden');
  root.style.removeProperty('--footer-header-y');
  root.style.removeProperty('--footer-nav-center');
};

}
