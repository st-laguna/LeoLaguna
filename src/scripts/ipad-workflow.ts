import gsap from 'gsap';

// The existing card owns its faces and flip. This controller owns only iPad selection geometry.
export function mountIPadWorkflow(section: HTMLElement, cards: HTMLButtonElement[], flip: (card: HTMLButtonElement)=>void) {
  const grid=section.querySelector<HTMLElement>('.workflow__grid')!;
  const slots=cards.map(card=>card.parentElement!);
  const enabled=()=>document.documentElement.hasAttribute('data-ipad-home');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const events=new AbortController();
  let active=-1, requested=-1, revision=0, timer:ReturnType<typeof setTimeout>|undefined;
  let wasEnabled=false;
  const cancel=()=>{revision++;clearTimeout(timer);gsap.killTweensOf(slots);};
  function arrange(animate=true) {
    const gap=parseFloat(getComputedStyle(grid).columnGap)||12.5;
    const available=grid.clientWidth-gap*3;
    const collapsed=Math.max(44,grid.clientWidth*.075);
    const order=cards.map((_,i)=>i);
    let left=0;
    order.forEach(index=>{
      const width=active<0?available/4:index===active?available-collapsed*3:collapsed;
      gsap.to(slots[index],{x:left,width,duration:animate && !reduced.matches ? .6 : 0,ease:'power3.inOut',overwrite:true});
      slots[index].toggleAttribute('data-collapsed',active>=0&&index!==active);
      cards[index].setAttribute('aria-expanded',String(index===active));
      left+=width+gap;
    });
  }
  function select(index:number) {
    if(requested===index){
      if(active!==index)return;
      const selected=cards[index];
      if(selected.getAttribute('aria-pressed')!=='true'){flip(selected);return;}
      cancel();requested=-1;const token=revision;
      const card=cards[index],back=card.getAttribute('aria-pressed')==='true';
      if(back)flip(card);
      const restore=()=>{if(token===revision&&enabled()){active=-1;arrange();}};
      if(back&&!reduced.matches)timer=setTimeout(restore,650);else restore();
      return;
    }
    requested=index;
    cancel();const token=revision;
    const back=cards.find(card=>card.getAttribute('aria-pressed')==='true');
    if(back)flip(back);
    const expand=()=>{
      if(token!==revision||!enabled())return;
      active=index;arrange();

    };
    if(back&&!reduced.matches)timer=setTimeout(expand,650);else expand();
  }
  cards.forEach((card,index)=>{
    // Keep the existing drag/hover controller out of this touch interaction only.
    card.addEventListener('pointerdown',event=>{if(enabled())event.stopImmediatePropagation();},{capture:true,signal:events.signal});
    card.addEventListener('click',event=>{
      if(!enabled()||section.inert)return;
      event.stopImmediatePropagation();select(index);
    },{capture:true,signal:events.signal});
  });
  function sync() {
    if(enabled()) {wasEnabled=true;arrange(false);}
    else if(wasEnabled) {
      cancel();active=-1;requested=-1;wasEnabled=false;
      slots.forEach(slot=>{gsap.set(slot,{clearProps:'width,transform'});slot.removeAttribute('data-collapsed');});
      cards.forEach(card=>{card.removeAttribute('aria-expanded');if(card.getAttribute('aria-pressed')==='true')flip(card);});
    }
  }
  let resetFrame=0;
  section.addEventListener('workflow:reset',()=>{
    cancel();active=-1;requested=-1;
    cancelAnimationFrame(resetFrame);
    // Journey clears inline widths after dispatching its reset event.
    resetFrame=requestAnimationFrame(sync);
  },{signal:events.signal});
  const resize=new ResizeObserver(sync);resize.observe(grid);
  window.addEventListener('leo:orientation-ready',sync,{signal:events.signal});
  reduced.addEventListener('change',sync,{signal:events.signal});
  sync();
  return()=>{cancel();cancelAnimationFrame(resetFrame);resize.disconnect();events.abort();};
}
