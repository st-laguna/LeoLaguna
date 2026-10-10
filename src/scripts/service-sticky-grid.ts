import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isPhoneViewport, phoneMedia, isPhonePortrait, phonePortraitMedia } from './responsive-layout';
gsap.registerPlugin(ScrollTrigger);

// Original portfolio implementation of Codrops' reveal → expand → content concept.
// It uses the existing gallery's native scroller, never a second Lenis instance.
export function mountServiceStickyGrid(section: HTMLElement, scroller: HTMLElement, isCurrent: () => boolean = () => true) {
  const events = new AbortController();
  const { signal } = events;
  // This mount owns these listeners. Reverting a GSAP context alone does not
  // unregister the native MediaQueryList listeners created by matchMedia().
  const queries = {
    phone: window.matchMedia(phoneMedia),
    portrait: window.matchMedia(phonePortraitMedia),
    compact: window.matchMedia('(max-width:1100px), (any-pointer:coarse)'),
    reduced: window.matchMedia('(prefers-reduced-motion:reduce)'),
  };
  let mediaCleanup: (() => void) | undefined;
  let mediaGeneration = 0;
  let mediaState = '';
  const grid = section.querySelector<HTMLElement>('[data-sticky-grid]')!;
  const columns = Array.from(section.querySelectorAll<HTMLElement>('[data-sticky-column]'));
  const title = section.querySelector<HTMLElement>('[data-sticky-title]')!;
  const content = section.querySelector<HTMLElement>('[data-sticky-content]')!;
  const eyebrow=section.querySelector<HTMLElement>('[data-sticky-eyebrow]')!;
  const intro=section.querySelector<HTMLElement>('[data-service-intro-block]')!;
  const placement=section.querySelector<HTMLElement>('.service-grid-placement')!;
  const number=section.querySelector<HTMLElement>('[data-service-number]');
  let introHeight=0;
  const hint=section.querySelector<HTMLElement>('[data-sticky-hint]')!;
  const slots=Array.from(section.parentElement!.querySelectorAll<HTMLElement>('[data-service-lead]'));
  const lower=columns.map(column=>column.lastElementChild as HTMLElement);
  const largeTablet=()=>document.documentElement.hasAttribute('data-large-tablet-landscape');
  let handedOff=false;
  function restoreRow(){if(!handedOff)return;lower.forEach((item,index)=>{columns[index].append(item);item.classList.remove('gallery-item');});handedOff=false;}
  let returning:{finished:Promise<void>;finish():void;dispose():void}|undefined;
  let master: gsap.core.Timeline | undefined;
  let refreshGeometry:(()=>void)|undefined;
  let viewport = scroller.clientHeight;
  let width = scroller.clientWidth;
  let resizePosition: {progress:number;tail:number} | undefined;
  window.addEventListener('resize',()=>{
    if(signal.aborted||!isCurrent()||!master||resizePosition)return;
    if(width===scroller.clientWidth&&viewport===scroller.clientHeight)return;
    resizePosition={progress:master.progress(),tail:Math.max(0,scroller.scrollTop-(master.scrollTrigger?.end??0))};
  },{capture:true,signal});
  section.style.setProperty('--service-viewport', `${viewport}px`);
  function hydrate() {
    grid.querySelectorAll<HTMLImageElement>('img[data-src]:not([src])').forEach(image => {
      if (image.parentElement?.getClientRects().length) { image.loading='eager';image.src=image.dataset.src!; }
    });
  }
  function configureMedia() {
    if (signal.aborted || !isCurrent()) return;
    const state = `${queries.phone.matches}/${isPhonePortrait()}/${queries.compact.matches}/${queries.reduced.matches}`;
    // Several queries can change in one resize; rebuild once for that state.
    if (state === mediaState) return;
    mediaState = state;
    mediaCleanup?.();
    const generation = ++mediaGeneration;
    const live = () => !signal.aborted && isCurrent() && generation === mediaGeneration;
    // Own timelines and styles directly: page matchMedia contexts cannot adopt
    // or revert this dialog's animation when their breakpoints change.
    const build = () => {
    let cleaned = false;
    const targets = [grid, ...columns, ...columns.flatMap(column => Array.from(column.children) as HTMLElement[]), title, content, eyebrow, intro, hint, placement, ...(number ? [number] : []), ...lower.map(item => item.firstElementChild as HTMLElement)];
    const properties = ['transform','translate','scale','rotate','transform-origin','height','justify-content','opacity','visibility','will-change','clip-path'];
    const saved = targets.map(target => properties.map(property => [property, target.style.getPropertyValue(property), target.style.getPropertyPriority(property)]));
    const restoreStyles = () => targets.forEach((target, index) => {
      gsap.set(target, {clearProps: properties.join(',')});
      saved[index].forEach(([property, value, priority]) => {if(value)target.style.setProperty(property,value,priority);});
    });
    const compact = queries.compact.matches, reduced = queries.reduced.matches;
    const phone=queries.phone.matches && isPhoneViewport();
    restoreRow();section.removeAttribute('data-grid-revealed');
    // Phone portrait has a normal-flow intro and the complete two-column list.
    // Do not create a timeline or hydrate the hidden cinematic sample.
    if(isPhonePortrait()){slots.forEach(slot=>slot.hidden=true);return;}
    slots.forEach(slot=>{slot.hidden=!!reduced;});hydrate();
    if (reduced) return () => { if(cleaned)return;cleaned=true;slots.forEach(slot=>slot.hidden=true); };
    section.setAttribute('data-animated', '');
    section.toggleAttribute('data-phone-intro',phone);
    const items = columns.map(column => Array.from(column.querySelectorAll<HTMLElement>('[data-sticky-item]')).filter(item => getComputedStyle(item).display !== 'none'));
    const allItems = items.flat();
    const scale=compact?1.35:1.2,side=compact?40:15;
    const baseGap=()=>parseFloat(getComputedStyle(grid).columnGap);
    gsap.set(columns,{justifyContent:'flex-start',height:()=>columns[0].clientWidth*2+baseGap()});
    function shift(){return (title.offsetHeight*.72+52+eyebrow.offsetHeight-content.offsetHeight)/2;}
    const initialScale=compact?1.45:1.8;
    const scene=section.querySelector<HTMLElement>('.service-sticky-scene')!;
    const list=slots[0].parentElement!;
    let center={x:0,y:0};
    let bases:{x:number;y:number;width:number}[]=[];
    let entrances:number[]=[];
    function measureGeometry(){
      if(phone)introHeight=intro.offsetHeight;
      gsap.set(grid,{scale:1});
      gsap.set(columns,{y:0,xPercent:0,height:()=>columns[0].clientWidth*2+baseGap()});
      gsap.set(allItems,{x:0,y:0,yPercent:0,scale:1});
      const frame=scene.getBoundingClientRect(),g=grid.getBoundingClientRect();
      center={x:g.left+g.width/2-frame.left,y:g.top+g.height/2-frame.top};
      bases=lower.map(item=>{const r=item.getBoundingClientRect();return {x:r.left+r.width/2-g.left-g.width/2,y:r.top+r.height/2-g.top-g.height/2,width:r.width};});
      entrances=items.map((column,index)=>{
        const boxes=column.map(item=>item.getBoundingClientRect());
        const top=Math.min(...boxes.map(r=>r.top))-g.top-g.height/2;
        const bottom=Math.max(...boxes.map(r=>r.bottom))-g.top-g.height/2;
        return index===1?(viewport-center.y)/initialScale-top:-center.y/initialScale-bottom;
      });
      const padding=parseFloat(getComputedStyle(list).paddingTop);
      // Preserve the expanded side cards' top edge throughout alignment.
      const rowTop=center.y+scale*(bases[0].y-bases[0].width/2);
      section.parentElement!.style.setProperty('--service-lead-overlap',`${viewport+padding-rowTop}px`);
    }
    // Avoid transferring nested 3D compositing layers between clipped parents.
    if(largeTablet())gsap.set([grid,...columns,...allItems],{force3D:false});
    measureGeometry();
    function cell(index:number){
      const slot=slots[index],box=slot.getBoundingClientRect(),base=bases[index];
      const x=box.left+box.width/2-scroller.getBoundingClientRect().left;
      // At the sticky section's end, the following list overlaps the lower scene.
      const padding=parseFloat(getComputedStyle(list).paddingTop);
      const overlap=parseFloat(section.parentElement!.style.getPropertyValue('--service-lead-overlap'));
      const y=viewport-overlap+padding+box.width/2;
      return {x:(x-center.x)/scale-base.x-(index-1)*base.width*side/100,
        y:(y-center.y)/scale-base.y,scale:box.width/base.width/scale};
    }
    const layers = [grid, ...columns, ...allItems, content, title, eyebrow, hint];
    const promote = (active: boolean) => layers.forEach(layer => layer.style.willChange = active && !largeTablet() && !layer.closest('[data-service-lead]') ? 'transform,opacity' : 'auto');
    gsap.set(content, { autoAlpha:0, y:20 });
    gsap.set(title, { xPercent:-50, yPercent:-50, y:0, scale:1, opacity:1 });
    gsap.set(eyebrow,{xPercent:-50,yPercent:-100,y:()=>-title.offsetHeight/2-24});
    if(number&&!phone)gsap.set(number,{xPercent:-50,yPercent:-100,y:()=>-innerWidth*.07-54});
    gsap.set(hint,{xPercent:-50,y:()=>title.offsetHeight/2+24,autoAlpha:1});
    if(phone){
      gsap.set([title,eyebrow,content,...(number?[number]:[])],{xPercent:0,yPercent:0,x:0,y:0,scale:1,autoAlpha:1});
      gsap.set(intro,{xPercent:-50,yPercent:-50,x:0,y:0});
      gsap.set(hint,{y:()=>introHeight/2+24});
    }
    grid.inert=true;
    content.inert = true;
    const reveal = gsap.timeline().fromTo(grid, {scale:initialScale}, {scale:1,duration:.38,ease:'power2.inOut'},0);
    if(phone)reveal.to(intro,{y:()=>-(viewport/2+introHeight/2+20),duration:.38,ease:'power2.inOut'},0);
    columns.forEach((column, index) => {
      reveal.fromTo(column, { y:() => entrances[index] }, { y:0, duration:.38, ease:'power1.out' }, 0);
      reveal.fromTo(items[index], { y: index === 1 ? 28 : -28 }, { y:0, duration:.32, stagger:{each:.035,from:index===1?'start':'end'}, ease:'power1.inOut' }, .02);
    });
    const expand = gsap.timeline().to(grid, { scale, duration:.25, ease:'power2.inOut' }, 0)
      .to(columns[0], { xPercent:-side, duration:.25, ease:'power2.inOut' }, 0)
      .to(columns[2], { xPercent:side, duration:.25, ease:'power2.inOut' }, 0);
    items[1].forEach((item,index) => expand.to(item, { yPercent:(index===0?-1:1)*(compact?100:40), duration:.25, ease:'power2.inOut' }, 0));
    const finish = gsap.timeline();
    if(!phone)finish.to(eyebrow,{y:()=>shift()-(title.offsetHeight*.72+52),duration:.12,ease:'power2.inOut'},0).to(title,{scale:.72,y:()=>shift()-(title.offsetHeight*.72/2+28),duration:.12,ease:'power2.inOut'},0)
      .to(content, { autoAlpha:1, y:shift, duration:.12, ease:'power2.out' }, .04);
    if(!phone&&number)finish.to(number,{y:()=>shift()-(title.offsetHeight*.72+52)-eyebrow.offsetHeight-12,duration:.12,ease:'power2.inOut'},0);
    const lift=()=>largeTablet()?Math.max(0,content.getBoundingClientRect().bottom-scene.getBoundingClientRect().top+32-(viewport-parseFloat(section.parentElement!.style.getPropertyValue('--service-lead-overlap')))):0;
    const handoff=gsap.timeline().to([title,eyebrow,content,...(number?[number]:[])],{y:(index,target)=>Number(gsap.getProperty(target,'y'))-lift(),duration:.22,ease:'power2.inOut'},0);lower.forEach((item,index)=>handoff.to(item,{x:()=>cell(index).x,y:()=>cell(index).y,yPercent:0,scale:()=>cell(index).scale,duration:.22,ease:'power2.inOut'},0));
    master = gsap.timeline({ scrollTrigger: {
      id:'service-sticky-grid', trigger:section, scroller, start:'top top', end:'bottom bottom', scrub:compact?.3:.65, invalidateOnRefresh:true,
      onToggle:self => {if(live())promote(self.isActive);},
      // Refresh restores the timeline with suppressed callbacks. Reconcile its
      // DOM handoff/inert state with that restored progress before painting.
      onRefresh:()=>{if(live())master?.eventCallback('onUpdate')?.();},
      // Finish the handoff before normal scrolling leaves the clipped scene.
      // A fast scroll must not wait for the scrub tail to reparent this row.
      onLeave:self=>{if(!live())return;self.getTween()?.progress(1);master?.progress(1);},
    }, onUpdate:()=>{if(!live())return;const progress=master?.progress()??0;if(phone){const safeTop=Math.max(0,viewport/2+introHeight/2+Number(gsap.getProperty(intro,'y'))+12);placement.style.clipPath=`inset(${safeTop}px 0 0)`;}section.toggleAttribute('data-grid-revealed',progress>0);content.inert=progress<.65;grid.inert=progress<.005;if(progress>=.999&&!handedOff){lower.forEach((item,index)=>{slots[index].append(item);item.classList.add('gallery-item');
      // The real row owns natural layout after handoff, not a forced CSS
      // transform competing with the scrub tween's composited state.
      gsap.set(item,{x:0,y:0,yPercent:0,scale:1,force3D:false,clearProps:'willChange'});
      // These already revealed cards do not participate in the list entrance.
      gsap.set(item.firstElementChild,{clearProps:'clipPath',autoAlpha:1});});handedOff=true;}else if(progress<.999&&handedOff)restoreRow();} })
      .add(reveal,0).to(hint,{autoAlpha:0,duration:.04,ease:'none'},0).add(expand,.4).add(finish,.61).addLabel('gallery-handoff',.88).add(handoff,'gallery-handoff');
    refreshGeometry=()=>{
      if(!live())return;
      const position=resizePosition;resizePosition=undefined;
      const progress=position?.progress??master!.progress();
      master!.progress(0);restoreRow();measureGeometry();
      master!.invalidate().progress(progress);
      const trigger=master!.scrollTrigger;trigger?.refresh();
      if(position&&trigger){
        scroller.scrollTop=trigger.start+progress*(trigger.end-trigger.start)+position.tail;
        trigger.update();trigger.getTween()?.progress(1);
      }
      master!.eventCallback('onUpdate')?.();
    };
    master.scrollTrigger?.refresh();
    promote(master.scrollTrigger?.isActive ?? false);
    // Cleanup belongs only to this media generation and runs once.
    return () => { if(cleaned)return;cleaned=true;master?.scrollTrigger?.kill();master?.kill();reveal.kill();expand.kill();finish.kill();handoff.kill();restoreRow();restoreStyles();slots.forEach(slot=>slot.hidden=true);master = undefined;refreshGeometry=undefined;section.parentElement!.style.removeProperty('--service-lead-overlap'); content.inert=false;grid.inert=false; promote(false); section.removeAttribute('data-animated');section.removeAttribute('data-phone-intro');if(phone)placement.style.removeProperty('clip-path');section.removeAttribute('data-grid-revealed'); };
    };
    const parentContext = gsap.context();
    if (parentContext) parentContext.ignore(() => {mediaCleanup = build();}); else mediaCleanup = build();
  }
  Object.values(queries).forEach(query => query.addEventListener('change', configureMedia, {signal}));
  configureMedia();
  // Width/orientation changes rebuild distances; mobile toolbar-only changes do not.
  let resizeTimer: ReturnType<typeof setTimeout>;
  const geometryObserver = new ResizeObserver(() => {
    if(signal.aborted || !isCurrent())return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if(signal.aborted || !isCurrent())return;
      if((!section.hasAttribute('data-phone-intro') || introHeight===intro.offsetHeight) && width === scroller.clientWidth && (!document.documentElement.hasAttribute('data-large-tablet-landscape') || viewport===scroller.clientHeight)) return;
      width = scroller.clientWidth; viewport = scroller.clientHeight;
      section.style.setProperty('--service-viewport', `${viewport}px`);
      hydrate();refreshGeometry?.();
    }, 180);
  });
  geometryObserver.observe(scroller);
  geometryObserver.observe(intro);
  function returnToIntro(){
    master?.scrollTrigger?.getTween()?.pause();master?.scrollTrigger?.disable(false);
    const block=(event:Event)=>{event.preventDefault();event.stopImmediatePropagation();};
    scroller.addEventListener('wheel',block,{capture:true,passive:false});
    scroller.addEventListener('touchmove',block,{capture:true,passive:false});
    scroller.addEventListener('keydown',block,{capture:true});
    let resolve!:()=>void,cleaned=false;
    const finished=new Promise<void>(done=>resolve=done);
    const clean=()=>{if(cleaned)return;cleaned=true;scroller.removeEventListener('wheel',block,true);scroller.removeEventListener('touchmove',block,true);scroller.removeEventListener('keydown',block,true);resolve();};
    const tween=gsap.to(master??{}, {time:0,duration:master && master.time()>0 ? .35 : 0,ease:'power3.inOut',onComplete:clean});
    returning={finished,finish:()=>{tween.progress(1);clean();},dispose:()=>{tween.kill();clean();}};
    return returning;
  }
  const dispose=()=>{if(signal.aborted)return;returning?.dispose();geometryObserver.disconnect();clearTimeout(resizeTimer);events.abort();mediaCleanup?.();mediaCleanup=undefined;mediaGeneration++;restoreRow();section.style.removeProperty('--service-viewport');};
  return Object.assign(dispose,{
    // The handoff phase marks the switch from the intro composition to the list.
    freeze(){master?.scrollTrigger?.getTween()?.pause();master?.scrollTrigger?.disable(false);},
    isNearIntro:()=>{const trigger=master?.scrollTrigger;return !!master&&!!trigger&&!handedOff&&(trigger.scroll()-trigger.start)/(trigger.end-trigger.start)<master.labels['gallery-handoff']/master.duration();},
    returnToIntro,
  });
}
