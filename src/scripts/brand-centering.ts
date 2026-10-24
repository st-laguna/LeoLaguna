// Measure the visible group, including text rather than its unused column width.
// This translates the existing layout; it never changes logo sizes or grid gaps.
export function centerBrandComposition(section:HTMLElement){
  const layout=section.querySelector<HTMLElement>('.brands-layout')!;
  const grid=section.querySelector<HTMLElement>('.brands-grid')!;
  const info=section.querySelector<HTMLElement>('.brands-info')!;
  let frame=0,disposed=false;
  function measure(){
    frame=0;if(disposed)return;
    if(matchMedia('(orientation:portrait)').matches||innerWidth<1001||section.hasAttribute('data-mobile-streams')){
      layout.style.removeProperty('--brands-center-x');return;
    }
    const offset=parseFloat(layout.style.getPropertyValue('--brands-center-x'))||0;
    const bounds=grid.getBoundingClientRect();let left=bounds.left,right=bounds.right;
    const walker=document.createTreeWalker(info,NodeFilter.SHOW_TEXT);let node:Node|null;
    while((node=walker.nextNode())){
      if(!node.textContent?.trim())continue;
      const range=document.createRange();range.selectNodeContents(node);
      for(const rect of range.getClientRects())if(rect.width&&rect.height){left=Math.min(left,rect.left);right=Math.max(right,rect.right);}
    }
    const host=section.getBoundingClientRect();
    const shift=offset+(host.left+host.width/2)-(left+right)/2;
    layout.style.setProperty('--brands-center-x',`${Math.round(shift*100)/100}px`);
  }
  const schedule=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(measure);};
  const observer=new ResizeObserver(schedule);observer.observe(layout);observer.observe(info);
  const language=new MutationObserver(schedule);language.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('resize',schedule,{passive:true});
  document.fonts.ready.then(schedule);schedule();
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();language.disconnect();window.removeEventListener('resize',schedule);layout.style.removeProperty('--brands-center-x');};
}
