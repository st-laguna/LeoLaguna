import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { initFooterMarquee, MARQUEE_VIEW } from './footer-marquee';
import { scrollPage } from './smooth-scroll';
export function initFooter() {
  const footer=document.querySelector<HTMLElement>('.footer');
  if(!footer)return ()=>{};
  const entranceMedia=gsap.matchMedia();
  entranceMedia.add('(max-width:700px) and (prefers-reduced-motion:no-preference), (max-width:1000px) and (max-height:500px) and (prefers-reduced-motion:no-preference)',()=>{
    footer.querySelectorAll<HTMLElement>('.footer__mobile-row').forEach((row,i)=>{
      gsap.fromTo(row,{xPercent:i%2?100:-100},{xPercent:0,ease:'none',scrollTrigger:{trigger:row,start:'top bottom',end:'top 65%',scrub:.8}});
    });
    const brands=document.querySelector('.brands-layout');
    if(brands)gsap.fromTo(brands,{clipPath:'inset(100% 0 0)'},{clipPath:'inset(0% 0 0)',ease:'none',scrollTrigger:{trigger:brands,start:'top 95%',end:'top 35%',scrub:.8}});
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
  const disposeMarquee=initFooterMarquee(marquee);

  const clickTarget=footer.querySelector<HTMLElement>('[data-footer-click-target]');
const clickCursor=footer.querySelector<HTMLElement>('[data-footer-click-cursor]');
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');

let px=0,py=0,cx=0,cy=0,hasPointer=false,cursorFrame=0,scrollTimer=0,isScrolling=false;

function setCursor(show:boolean){
  if(!clickCursor)return;
  clickCursor.classList.toggle('is-visible',show&&finePointer.matches);
}

function checkCursor(){
  if(!clickTarget||!hasPointer)return;
  const el=document.elementFromPoint(px,py);
  setCursor(!!el&&clickTarget.contains(el));
}

function animateCursor(){
  if(!clickCursor)return;
  cx+=(px-cx)*.18;
  cy+=(py-cy)*.18;
  clickCursor.style.transform=`translate3d(${cx}px,${cy}px,0) translate(-50%,-50%)`;
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

function setFooterNavigation(active: boolean) {
  const previousPositions = navItems.map(
    item => item.getBoundingClientRect()
  );

  root.classList.toggle('footer-active', active);

  const nextPositions = navItems.map(
    item => item.getBoundingClientRect()
  );

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  navItems.forEach((item, index) => {
    const previous = previousPositions[index];
    const next = nextPositions[index];

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
  const formatter=new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const clock=footer.querySelector<HTMLElement>('[data-footer-clock]');
  const year=footer.querySelector<HTMLElement>('[data-footer-year]');
  if(year)year.textContent=String(new Date().getFullYear());
  function updateClock(){if(clock)clock.textContent=formatter.format(new Date());}
  updateClock();const timer=setInterval(updateClock,15000);
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
  document.addEventListener('pointerdown',event=>{if(!nav?.contains(event.target as Node))setOpen(false);},{signal});
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
  let scheduled=0,wasActive=false;
  function position(){
    scheduled=0;
    const viewport=window.visualViewport;
    const visibleHeight=viewport?.height ?? innerHeight;
    const viewportTop=viewport?.offsetTop ?? 0;
    const scroller=document.scrollingElement || document.documentElement;
    const remaining=Math.max(0,scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop);

      if (remaining <= 4) {
        const name = footer?.querySelector<HTMLElement>('.footer__name');
        const logo = footer?.querySelector<HTMLElement>('.footer__mark');

        if (name && !name.hasAttribute('data-entered')) {
          reveal(name, 0);
        }

        if (logo && !logo.hasAttribute('data-entered')) {
          reveal(logo, 160);
        }
      }
    
    const rect=footer!.getBoundingClientRect();
    // A short footer can finish below the top edge when browser chrome retracts.
    const finalTop=viewportTop+Math.max(0,visibleHeight-rect.height);
    const inView=rect.top<viewportTop+visibleHeight && rect.bottom>viewportTop+100;
    const active=inView&&(rect.top<=finalTop+24||remaining<=8);
    if((rect.top>innerHeight+40||rect.bottom<0)&&!reduced.matches){
      animations.forEach(a=>a.cancel());animations.clear();
      entranceElements.forEach(el=>el.removeAttribute('data-entered'));
    }
      if (active !== wasActive) {
    setFooterNavigation(active);
}
if (!active && wasActive) {
  setOpen(false);
}

wasActive = active;

root.style.setProperty(
  '--footer-header-y',
  `${Math.max(16, rect.top + 24)}px`
);

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

const resizeObserver = new ResizeObserver(() => {
  footer!
    .querySelectorAll<HTMLElement>('[data-footer-glass]')
    .forEach(edge => {
      const filter = footer!.querySelector<SVGFilterElement>(
        `#footer-refraction-${edge.dataset.footerGlass}`
      );

      if (!filter) return;

      const height = Math.max(1, marquee.clientHeight);

      const viewWidth =
        (marquee.clientWidth / height) * MARQUEE_VIEW.height;

      const edgeWidth =
        (edge.clientWidth / height) * MARQUEE_VIEW.height;

      // Amplía el filtro y sus mapas por arriba y por abajo.
      const paddingY = 70;
      const mapTop = MARQUEE_VIEW.top - paddingY;
      const mapHeight = MARQUEE_VIEW.height + paddingY * 2;

      filter.setAttribute('width', String(viewWidth + 300));
      filter.setAttribute('y', String(mapTop));
      filter.setAttribute('height', String(mapHeight));

      filter
        .querySelectorAll('[data-footer-lens-map]')
        .forEach(map => {
          const x =
            edge.dataset.footerGlass === 'right'
              ? viewWidth - edgeWidth
              : 0;

          map.setAttribute('x', String(x));
          map.setAttribute('y', String(mapTop));
          map.setAttribute('width', String(edgeWidth));
          map.setAttribute('height', String(mapHeight));
        });
    });

  schedule();
});

resizeObserver.observe(marquee);
position();

return () => {
  entranceObserver.disconnect();
  animations.forEach(animation=>animation.cancel());
  footer.removeAttribute('data-entrance-ready');
  entranceElements.forEach(element=>element.removeAttribute('data-entered'));

  cancelAnimationFrame(cursorFrame);
  clickCursor?.classList.remove('is-visible');

  abort.abort();
  clearInterval(timer);
  cancelAnimationFrame(scheduled);
  resizeObserver.disconnect();
  disposeMarquee();
  setOpen(false);
  root.classList.remove('footer-active');
  root.style.removeProperty('--footer-header-y');
};

}
