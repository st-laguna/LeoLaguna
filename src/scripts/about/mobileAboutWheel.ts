/** The wheel owns slot transforms only; content and its float remain independent. */
export function mountMobileAboutWheel(root: HTMLElement, open: (button: HTMLButtonElement) => void, announce: (text: string) => void) {
  const events = new AbortController();
  const { signal } = events;
  const slots = [...root.querySelectorAll<HTMLElement>('[data-wheel-slot]')];
  const buttons = slots.map(slot => slot.querySelector<HTMLButtonElement>('[data-mobile-interest]')!);
  const portrait = matchMedia('(orientation:portrait)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const count = slots.length;
  let enabled = false, obscured = false, visible = true, disposed = false;
  let position = 0, target = 0, velocity = 0, frame = 0, previousTime = 0;
  let radius = 180, pixelsPerItem = 150, horizontal = portrait.matches;
  let suppressClick = false;
  type Drag = {id:number; button:HTMLButtonElement; x:number; y:number; origin:number; last:number; time:number; locked:boolean; rejected:boolean};
  let drag: Drag | undefined;
  const modulo = (n: number) => ((n % count) + count) % count;
  const offset = (n: number) => modulo(n + count / 2) - count / 2;
  const clamp = (n:number,min:number,max:number) => Math.max(min,Math.min(max,n));
  const awake = () => enabled && visible && !obscured && !document.hidden && !disposed;
  function render() {
    const active = modulo(Math.round(position));
    root.dataset.activeInterest = buttons[active].dataset.mobileInterest;
    slots.forEach((slot, index) => {
      const distance = offset(index - position), absolute = Math.abs(distance);
      const shown = absolute < 1.6;
      slot.style.visibility = shown ? '' : 'hidden';
      slot.inert = !shown;
      slot.setAttribute('aria-hidden', String(!shown));
      const angle = distance * 58, radians = angle * Math.PI / 180;
      const displacement = Math.sin(radians) * radius;
      const depth = (Math.cos(radians) - 1) * radius;
      const scale = 1 - Math.min(absolute, 2) * .17;
      // Actual axis switch: X/Z + rotateY in portrait; Y/Z + rotateX in landscape.
      slot.style.transform = `translate(-50%, -50%) translate3d(${horizontal ? displacement : 0}px,${horizontal ? 0 : displacement}px,${depth}px) ${horizontal ? 'rotateY' : 'rotateX'}(${horizontal ? angle : -angle}deg) scale(${scale})`;
      slot.style.opacity = String(1 - Math.min(absolute, 2) * .23);
      slot.style.zIndex = String(100 - Math.round(absolute * 20));
      slot.dataset.active = String(index === active);
      buttons[index].tabIndex = index === active ? 0 : -1;
      if(index === active)buttons[index].setAttribute('aria-current','true');
      else buttons[index].removeAttribute('aria-current');
    });
  }
  function cancelMotion() { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
  function releasePointer() {
    const previous = drag; drag = undefined;
    if(previous?.button.hasPointerCapture(previous.id))previous.button.releasePointerCapture(previous.id);
  }
  function finish() {
    cancelMotion(); position = modulo(Math.round(target)); target = position; velocity = 0;
    root.dataset.motion = 'idle'; render();
    if(enabled)announce(`${buttons[modulo(position)].querySelector('img')?.alt || buttons[modulo(position)].getAttribute('aria-label')}, ${modulo(position)+1} of ${count}. Tap to open.`);
  }
  function animateWheel(time:number) {
    frame = 0;
    if(!awake()) { finish(); return; }
    const dt = Math.min(.05, Math.max(.001, (time - previousTime) / 1000)); previousTime = time;
    // Critically damped continuation of the release velocity. No perpetual ticker.
    const omega = reduced.matches ? 38 : 12;
    const difference = position - target, c = velocity + omega * difference, decay = Math.exp(-omega * dt);
    position = target + (difference + c * dt) * decay;
    velocity = (velocity - omega * c * dt) * decay;
    render();
    if(Math.abs(position-target)<.001 && Math.abs(velocity)<.012)finish();
    else frame = requestAnimationFrame(animateWheel);
  }
  function settle(destination:number, speed=0) {
    cancelMotion(); target = destination; velocity = reduced.matches ? 0 : clamp(speed,-9,9);
    if(!awake() || Math.abs(target-position)<.001 && Math.abs(velocity)<.012) { finish(); return; }
    root.dataset.motion = 'settling'; previousTime = performance.now(); frame = requestAnimationFrame(animateWheel);
  }
  function syncAwake() {
    root.dataset.awake = String(awake());
    if(!awake()) { releasePointer(); target = Math.round(position); finish(); }
  }
  function measure() {
    if(disposed)return;
    const bounds = root.getBoundingClientRect();
    horizontal = portrait.matches;
    root.dataset.axis = horizontal ? 'horizontal' : 'vertical';
    root.setAttribute('aria-label', horizontal ? 'Interests carousel. Swipe left or right; swipe vertically to scroll.' : 'Interests carousel. Swipe up or down on a sticker; scroll outside the stickers.');
    radius = horizontal ? Math.min(bounds.width * .62, 460) : bounds.height * .62;
    pixelsPerItem = Math.max(80, radius * .78);
    // Rotation changes geometry, not selection, and cancels an in-flight gesture.
    releasePointer(); cancelMotion(); position = Math.round(position); target = position; velocity = 0;
    root.dataset.motion = 'idle'; render();
  }
  root.addEventListener('pointerdown', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-mobile-interest]');
    if(!awake()||!button||!event.isPrimary||event.button!==0||drag)return;
    cancelMotion(); velocity = 0; suppressClick = false;
    drag = {id:event.pointerId,button,x:event.clientX,y:event.clientY,origin:position,last:horizontal?event.clientX:event.clientY,time:event.timeStamp,locked:false,rejected:false};
    button.setPointerCapture(event.pointerId);
  },{signal});
  root.addEventListener('pointermove', event => {
    if(!drag||event.pointerId!==drag.id||drag.rejected)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    const primary=horizontal?dx:dy,cross=horizontal?dy:dx;
    if(!drag.locked){
      if(Math.max(Math.abs(primary),Math.abs(cross))<10)return;
      if(Math.abs(primary)<Math.abs(cross)*1.25){drag.rejected=true;suppressClick=true;return;}
      drag.locked=true;suppressClick=true;root.dataset.motion='dragging';
    }
    // This handler is local to a gesture begun on a sticker, never the document.
    if(event.cancelable)event.preventDefault();
    const coordinate=horizontal?event.clientX:event.clientY;
    const dt=Math.max(8,event.timeStamp-drag.time)/1000;
    velocity=velocity*.3+(-(coordinate-drag.last)/pixelsPerItem/dt)*.7;
    position=drag.origin-primary/pixelsPerItem;
    drag.last=coordinate;drag.time=event.timeStamp;render();
  },{signal,passive:false});
  function end(event:PointerEvent,cancelled:boolean){
    if(!drag||event.pointerId!==drag.id)return;
    const locked=drag.locked,old=drag;
    const speed=cancelled||event.timeStamp-old.time>100?0:velocity;
    releasePointer();
    if(locked)settle(Math.round(position+(reduced.matches?0:clamp(speed*.18,-1.7,1.7))),speed);
    else if(cancelled)settle(Math.round(position));
  }
  root.addEventListener('pointerup',event=>end(event,false),{signal});
  root.addEventListener('pointercancel',event=>end(event,true),{signal});
  root.addEventListener('lostpointercapture',event=>{if(drag?.id===event.pointerId)end(event,true);},{signal});
  root.addEventListener('click',event=>{
    const button=(event.target as Element).closest<HTMLButtonElement>('[data-mobile-interest]');
    if(!button||!enabled||obscured)return;
    if(suppressClick&&event.detail!==0){suppressClick=false;event.preventDefault();return;}
    const index=buttons.indexOf(button),distance=offset(index-position);
    if(Math.abs(distance)<.025 && !frame)open(button);
    else settle(position+distance);
  },{signal});
  root.addEventListener('keydown',event=>{
    if(!awake())return;
    const direction=event.key===(horizontal?'ArrowRight':'ArrowDown')?1:event.key===(horizontal?'ArrowLeft':'ArrowUp')?-1:0;
    if(direction){event.preventDefault();settle(Math.round(position)+direction);}
  },{signal});
  portrait.addEventListener('change',measure,{signal});
  reduced.addEventListener('change',()=>{releasePointer();settle(Math.round(position));},{signal});
  document.addEventListener('visibilitychange',syncAwake,{signal});
  root.addEventListener('dragstart',event=>event.preventDefault(),{signal});
  const resize=new ResizeObserver(measure);resize.observe(root);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncAwake();});intersection.observe(root);
  measure();syncAwake();
  return {
    setEnabled(value:boolean){enabled=value;syncAwake();},
    setObscured(value:boolean){obscured=value;syncAwake();},
    dispose(){disposed=true;releasePointer();cancelMotion();events.abort();resize.disconnect();intersection.disconnect();root.dataset.awake='false';root.dataset.motion='idle';},
  };
}


