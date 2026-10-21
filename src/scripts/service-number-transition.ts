import gsap from 'gsap';

const travelDuration=.95;
const bracketDuration=.55;
const typography=['font-family','font-size','font-weight','font-style','font-stretch','font-feature-settings','font-variation-settings','line-height','letter-spacing','text-transform'] as const;

function glyphBounds(element:HTMLElement){
  const text=document.createTreeWalker(element,NodeFilter.SHOW_TEXT).nextNode();
  const range=document.createRange();
  if(text){range.setStart(text,0);range.setEnd(text,text.textContent?.length||0);}
  else range.selectNodeContents(element);
  return range.getBoundingClientRect();
}

// Destinations come from each gallery's rendered layout. Only motion is shared.
export function animateServiceNumber(dialog:HTMLDialogElement,target:HTMLElement,source:HTMLElement,timeline:gsap.core.Timeline,at=0){
  const sourceStyle=getComputedStyle(source),targetStyle=getComputedStyle(target);
  const scale=parseFloat(sourceStyle.fontSize)/parseFloat(targetStyle.fontSize);
  const sourceWeight=sourceStyle.fontWeight,finalWeight=targetStyle.fontWeight;
  const finalTracking=targetStyle.letterSpacing==='normal'?'0px':targetStyle.letterSpacing;
  const sourceTracking=(parseFloat(sourceStyle.letterSpacing)||0)/scale;
  const savedStyle=target.getAttribute('style');
  const expected=glyphBounds(target);
  const start=glyphBounds(source.matches('.projects-number')?source.querySelector<HTMLElement>(':scope > span')!:source);
  const appearance=typography.map(property=>[property,targetStyle.getPropertyValue(property)]);
  const placeholder=target.cloneNode(true) as HTMLElement;
  placeholder.setAttribute('aria-hidden','true');
  placeholder.style.setProperty('visibility','hidden','important');
  const layer=document.createElement('div');
  layer.dataset.serviceNumberLayer='';layer.setAttribute('aria-hidden','true');layer.inert=true;
  Object.assign(layer.style,{position:'absolute',left:'0',top:'0',zIndex:'5',pointerEvents:'none',transformOrigin:'0 0',mixBlendMode:'difference'});
  target.replaceWith(placeholder);layer.append(target);dialog.append(layer);
  appearance.forEach(([property,value])=>target.style.setProperty(property,value));
  // Remove the layout hook while floating, so its !important font rules
  // cannot override the timeline's weight and spacing. The placeholder keeps it.
  target.removeAttribute('data-service-number');
  target.setAttribute('data-service-number-morph','');
  Object.assign(target.style,{display:'block',position:'relative',inset:'auto',margin:'0',padding:'0',whiteSpace:'nowrap',width:'max-content',height:'auto',transform:'none',translate:'none',visibility:'visible',opacity:'1',animation:'none',mixBlendMode:'normal',color:'#fff',webkitTextFillColor:'currentColor'});
  const actual=glyphBounds(target),origin=layer.getBoundingClientRect();
  const x=expected.left-actual.left,y=expected.top-actual.top;
  gsap.set(target,{fontWeight:sourceWeight,letterSpacing:`${sourceTracking}px`,'--number-bracket-reveal':'100%','--number-bracket-offset':'-.45em'});
  const initial=glyphBounds(target);
  gsap.set(layer,{x:start.left-origin.left-(initial.left-origin.left)*scale,y:start.top-origin.top-(initial.top-origin.top)*scale,scale});
  timeline.to(layer,{x,y,scale:1,duration:travelDuration,ease:'power3.inOut'},at)
    .to(target,{fontWeight:finalWeight,letterSpacing:finalTracking,duration:travelDuration,ease:'power3.inOut'},at)
    .to(target,{'--number-bracket-reveal':'0%','--number-bracket-offset':'0em',duration:bracketDuration,ease:'power2.inOut'},at+travelDuration);
  let restored=false;
  return ()=>{
    if(restored)return;restored=true;
    placeholder.replaceWith(target);target.setAttribute('data-service-number','');target.removeAttribute('data-service-number-morph');
    if(savedStyle===null)target.removeAttribute('style');else target.setAttribute('style',savedStyle);
    layer.remove();
  };
}
