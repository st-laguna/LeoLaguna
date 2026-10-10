import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// One button exits above the header, relocates while hidden, and enters at the footer.
export function mountGalleryReturn(dialog:HTMLDialogElement,scroller:HTMLElement,reduced:MediaQueryList) {
  const motion=dialog.querySelector<HTMLElement>('.gallery-return-motion')!;
  const entry=dialog.querySelector<HTMLElement>('.gallery-return-entry')!;
  const button=motion.querySelector<HTMLButtonElement>('button')!;
  const slot=dialog.querySelector<HTMLElement>('[data-gallery]:not([hidden]) [data-gallery-return-slot]');
  const footer=slot?.closest<HTMLElement>('.gallery-footer');
  const state={p:0};
  let originX=0,originY=0,targetX=0,targetY=0,exitDistance=0;
  gsap.set(motion,{x:0,y:0});
  const entrance=gsap.fromTo(entry,{y:reduced.matches?0:-12,opacity:reduced.matches?1:0},{y:0,opacity:1,duration:reduced.matches?0:.6,ease:'power3.out'});
  if(!slot||!footer) return ()=>{entrance.kill();gsap.set([motion,entry],{clearProps:'transform,opacity'});};
  function measure(){
    // Reads happen only on refresh/resize, never in the scroll animation callback.
    const base=motion.getBoundingClientRect();
    originX=base.left-Number(gsap.getProperty(motion,'x'));
    originY=base.top-Number(gsap.getProperty(motion,'y'));
    const bounds=button.getBoundingClientRect();
    exitDistance=Math.max(14,originY+bounds.height+6);
    slot!.style.setProperty('--gallery-return-width',`${bounds.width}px`);
    slot!.style.setProperty('--gallery-return-height',`${bounds.height}px`);
    const destination=slot!.getBoundingClientRect();
    targetX=destination.left;
    targetY=destination.top+scroller.scrollTop;
  }
  const setX=gsap.quickSetter(motion,'x','px'),setY=gsap.quickSetter(motion,'y','px');
  const setOpacity=gsap.quickSetter(motion,'opacity');
  const easeOut=gsap.parseEase('power3.out'),easeIn=gsap.parseEase('power3.in');
  function render(){
    const p=state.p;
    const dockY=targetY-scroller.scrollTop-originY;
    if(reduced.matches){
      setOpacity(1);setX(p<.5?0:targetX-originX);setY(p<.5?0:dockY);return;
    }
    if(p<.4){
      const progress=easeIn(Math.max(0,p/.4));
      setX(0);setY(-exitDistance*progress);setOpacity(1-progress);
    }else if(p<.5){
      // Change anchors only at opacity zero: no visible cross-screen trajectory.
      setOpacity(0);setX(targetX-originX);setY(dockY+14);
    }else{
      const progress=easeOut(Math.min(1,(p-.5)/.5));
      setX(targetX-originX);setY(dockY+14*(1-progress));setOpacity(progress);
    }
  }
  measure();
  const tween=gsap.timeline({onUpdate:render,scrollTrigger:{
    id:'gallery-return-dock',trigger:footer,scroller,start:'top bottom',end:'bottom bottom',
    scrub:reduced.matches?true:.3,invalidateOnRefresh:true,onRefreshInit:measure,
    onUpdate:render,onRefresh:render,
  }}).to(state,{p:.4,duration:.3,ease:'none'})
    .to(state,{p:.5,duration:.05,ease:'none'})
    .to(state,{p:1,duration:.4,ease:'none'});
  const resize=new ResizeObserver(()=>{measure();tween.scrollTrigger?.refresh();render();});
  resize.observe(scroller);resize.observe(button);resize.observe(footer);
  // Lazy media can move the footer without resizing the footer itself.
  resize.observe(slot.closest<HTMLElement>('[data-gallery]')!);
  const onMotionChange=()=>{entrance.progress(1);tween.scrollTrigger!.vars.scrub=reduced.matches?true:.3;tween.scrollTrigger!.refresh();};
  reduced.addEventListener('change',onMotionChange);
  return ()=>{
    resize.disconnect();reduced.removeEventListener('change',onMotionChange);
    tween.scrollTrigger?.kill();tween.kill();entrance.kill();
    gsap.set([motion,entry],{clearProps:'transform,opacity'});
    slot!.style.removeProperty('--gallery-return-width');slot!.style.removeProperty('--gallery-return-height');
  };
}
