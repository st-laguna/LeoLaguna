import gsap from 'gsap';
import { isPhoneViewport } from './responsive-layout';

export function openServiceCover(dialog:HTMLDialogElement,shell:HTMLElement,title:HTMLElement|null,source:HTMLElement,index:number,reverse=false){
  const horizontal=source.hasAttribute('data-horizontal');
  const origin=source.querySelector<HTMLElement>(horizontal?'.projects-footer':`[data-panel="${index}"] .project-mobile-copy`);
  const sourceTitle=source.querySelector<HTMLElement>(horizontal?`[data-copy="${index}"] h2`:`[data-panel="${index}"] .project-mobile-copy h2`);
  const sourceNumber=source.querySelector<HTMLElement>(horizontal?'.projects-number':`[data-panel="${index}"] .project-mobile-copy>span`);
  const number=dialog.querySelector<HTMLElement>('[data-gallery]:not([hidden]) [data-service-number]');
  const styles=getComputedStyle(dialog),finalColor=styles.getPropertyValue('--background').trim(),panelColor=styles.getPropertyValue('--service-panel-color').trim();
  const panel=document.createElement('div');panel.className='service-opening-panel';panel.setAttribute('aria-hidden','true');dialog.append(panel);
  const rect=origin?.getBoundingClientRect(),valid=rect&&rect.width>0&&rect.height>0&&rect.top<innerHeight&&rect.bottom>0;
  // Start with the actual source surface, not the destination's black token.
  const sourceColor=origin?getComputedStyle(origin).backgroundColor:panelColor;
  gsap.set(panel,{backgroundColor:sourceColor,x:valid?rect.left:0,y:valid?Math.max(0,rect.top):innerHeight,width:valid?rect.width:innerWidth,height:valid?rect.height:1,transformOrigin:'0 0'});
  gsap.set(shell,{yPercent:0,visibility:'hidden'});
  const hidden:HTMLElement[]=[],clones:HTMLElement[]=[];
  const lineTargets:{node:HTMLElement,x:number}[]=[];
  const targets:{clone:HTMLElement,x:number,y:number,scale:number}[]=[];
  function shared(destination:HTMLElement|null,from:HTMLElement|null){
    if(!destination)return;
    const end=destination.getBoundingClientRect(),start=from?.getBoundingClientRect();
    const usable=from&&start&&start.width>0&&start.height>0&&start.top<innerHeight&&start.bottom>0;
    const style=getComputedStyle(usable?from:destination);
    const clone=document.createElement('div');clone.className='service-opening-shared';clone.setAttribute('aria-hidden','true');
    // Copy the source's rendered line breaks, rather than re-typesetting the
    // destination at the first frame. Only position and uniform scale change.
    let text=destination.textContent||'',width=usable?start.width:end.width,left=usable?start.left:end.left,top=usable?start.top:end.top;
    if(usable&&destination===title){
      const walker=document.createTreeWalker(from,NodeFilter.SHOW_TEXT);let node:Node|null;let lineTop:number|undefined;let rendered='';let minX=Infinity,maxX=-Infinity,minY=Infinity;
      while((node=walker.nextNode()))for(let i=0;i<(node.textContent||'').length;i++){
        const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();
        if(!r.height)continue;
        if(lineTop!==undefined&&Math.abs(r.top-lineTop)>2)rendered+='\n';
        rendered+=(node.textContent||'')[i];lineTop=r.top;minX=Math.min(minX,r.left);maxX=Math.max(maxX,r.right);minY=Math.min(minY,r.top);
      }
      if(rendered){text=rendered;width=maxX-minX;left=minX;top=minY;}
    }
    Object.assign(clone.style,{position:'absolute',left:`${left}px`,top:`${top}px`,width:`${width}px`,fontFamily:style.fontFamily,fontSize:style.fontSize,fontWeight:style.fontWeight,fontStyle:style.fontStyle,fontStretch:style.fontStretch,fontFeatureSettings:style.fontFeatureSettings,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,textTransform:style.textTransform,textAlign:'left',whiteSpace:'pre',color:'#fff',mixBlendMode:'difference',margin:'0'});
    clone.textContent=text;dialog.append(clone);clones.push(clone);hidden.push(destination);
    const scale=Math.min(end.width/width,parseFloat(getComputedStyle(destination).fontSize)/parseFloat(style.fontSize));
    const height=clone.getBoundingClientRect().height;
    if(destination===title&&text.includes('\n')){
      clone.textContent='';
      text.split('\n').forEach(line=>{
        const row=document.createElement('div'),inner=document.createElement('span');
        inner.textContent=line.trimEnd();inner.style.display='inline-block';row.append(inner);clone.append(row);
        lineTargets.push({node:inner,x:(width-inner.getBoundingClientRect().width)/2});
      });
    }
    // Preserve exactly the same face, weight, tracking and line structure when
    // handing the temporary element back to the actual gallery heading.
    destination.textContent=text;
    Object.assign(destination.style,{fontFamily:style.fontFamily,fontWeight:style.fontWeight,fontStyle:style.fontStyle,fontStretch:style.fontStretch,fontFeatureSettings:style.fontFeatureSettings,fontSize:`${parseFloat(style.fontSize)*scale}px`,lineHeight:`${parseFloat(style.lineHeight)*scale}px`,letterSpacing:style.letterSpacing==='normal'?'normal':`${parseFloat(style.letterSpacing)*scale}px`,textTransform:style.textTransform,whiteSpace:'pre',width:`${width*scale}px`,textAlign:'center'});
    if(destination===title){const phoneBlock=isPhoneViewport() && destination.closest('[data-service-intro-block]');gsap.set(destination,{x:0,y:0,xPercent:phoneBlock?0:-50,yPercent:phoneBlock?0:-50});}
    targets.push({clone,x:end.left+end.width/2-width*scale/2-left,y:end.top+end.height/2-height*scale/2-top,scale});
    gsap.set(clone,{transformOrigin:'0 0'});
    // A Range measures glyph bounds, not the line box. Match the actual glyph
    // origin at both ends; never use a guessed pixel compensation.
    const glyphs=(element:HTMLElement)=>{const range=document.createRange();range.selectNodeContents(element);return range.getBoundingClientRect();};
    if(usable&&destination===title){
      const sourceGlyphs=glyphs(from),cloneGlyphs=glyphs(clone);
      left+=sourceGlyphs.left-cloneGlyphs.left;top+=sourceGlyphs.top-cloneGlyphs.top;
      clone.style.left=`${left}px`;clone.style.top=`${top}px`;
    }
    const target=targets[targets.length-1];
    target.x=end.left+end.width/2-width*scale/2-left;
    target.y=end.top+end.height/2-height*scale/2-top;
    // Temporarily measure the completed visual state, then restore the exact
    // source state before the browser can paint either intermediate position.
    gsap.set(clone,{x:target.x,y:target.y,scale});
    lineTargets.forEach(({node,x})=>{if(clone.contains(node))gsap.set(node,{x});});
    const actual=glyphs(clone),expected=glyphs(destination);
    target.x+=expected.left-actual.left;target.y+=expected.top-actual.top;
    gsap.set(clone,{x:0,y:0,scale:1});
    lineTargets.forEach(({node})=>{if(clone.contains(node))gsap.set(node,{x:0});});
  }
  shared(title,sourceTitle);shared(number,sourceNumber);
  const originals=[sourceTitle,sourceNumber].filter((node):node is HTMLElement=>!!node);
  const originalVisibility=originals.map(node=>node.style.visibility);
  originals.forEach(node=>node.style.visibility="hidden");
  const paragraph=source.querySelector<HTMLElement>(horizontal?`[data-copy="${index}"] p`:`[data-panel="${index}"] .project-mobile-copy p`);
  let outgoing:HTMLElement|null=null;
  if(paragraph){const r=paragraph.getBoundingClientRect();if(r.width&&r.top<innerHeight&&r.bottom>0){
    outgoing=paragraph.cloneNode(true) as HTMLElement;outgoing.removeAttribute('data-i18n');outgoing.className='service-opening-shared';outgoing.setAttribute('aria-hidden','true');
    const css=getComputedStyle(paragraph);Object.assign(outgoing.style,{position:'absolute',left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,margin:'0',fontFamily:css.fontFamily,fontSize:css.fontSize,fontWeight:css.fontWeight,lineHeight:css.lineHeight,letterSpacing:css.letterSpacing,textTransform:css.textTransform,color:css.color});dialog.append(outgoing);clones.push(outgoing);
  }}
  const labels=Array.from(dialog.querySelectorAll<HTMLElement>('[data-gallery]:not([hidden]) [data-sticky-eyebrow], [data-gallery]:not([hidden]) [data-sticky-hint]'));
  const controls=Array.from(source.querySelectorAll<HTMLElement>('[data-open], .projects-paging')),saved=controls.map(node=>node.style.opacity);
  hidden.forEach(node=>node.style.visibility='hidden');gsap.set(labels,{opacity:0});dialog.setAttribute('data-service-opening','');
  const prevent=(event:Event)=>event.preventDefault();dialog.addEventListener('wheel',prevent,{passive:false});dialog.addEventListener('touchmove',prevent,{passive:false});
  let resolve!:()=>void;const finished=new Promise<void>(done=>resolve=done);let cleaned=false;
  function clean(){
    if(cleaned)return;cleaned=true;originals.forEach((node,i)=>node.style.visibility=originalVisibility[i]);panel.remove();clones.forEach(node=>node.remove());hidden.forEach(node=>node.style.removeProperty('visibility'));
    labels.forEach(node=>node.style.removeProperty('opacity'));controls.forEach((node,i)=>node.style.opacity=saved[i]);
    gsap.set(shell,{yPercent:0,clearProps:'visibility'});shell.style.removeProperty('--service-opening-background');dialog.removeAttribute('data-service-opening');dialog.removeEventListener('wheel',prevent);dialog.removeEventListener('touchmove',prevent);resolve();
  }
  shell.style.setProperty('--service-opening-background',panelColor);
  const timeline=gsap.timeline({paused:true,onComplete:reverse?undefined:clean,onReverseComplete:reverse?clean:undefined});
  timeline.to(panel,{backgroundColor:panelColor,duration:.4,ease:'power2.inOut'},0)
    .to(controls,{opacity:0,duration:.2},0).to(panel,{x:0,y:0,scaleX:innerWidth/(valid?rect.width:innerWidth),scaleY:innerHeight/(valid?rect.height:1),duration:.95,ease:'power3.inOut'},0)
    .to({}, {duration:.95},.08)
    // Color only starts after the Services panel has reached the viewport top.
    .set(shell,{visibility:'visible'},1.03).set(panel,{visibility:'hidden'},1.03)
    .to(shell,{'--service-opening-background':finalColor,duration:.5,ease:'power2.inOut'},1.03)
    .to(labels,{opacity:1,duration:.35,stagger:.08,ease:'power2.out'},1.08);
  if(outgoing)timeline.to(outgoing,{y:-20,opacity:0,clipPath:'inset(0 0 100%)',duration:.4,ease:'power2.in'},0);
  lineTargets.forEach(({node,x})=>timeline.to(node,{x,duration:.95,ease:'power3.inOut'},.08));
  targets.forEach(({clone,x,y,scale})=>timeline.to(clone,{x,y,scale,duration:.95,ease:'power3.inOut'},.08));
  if(reverse){timeline.progress(1,true);timeline.reverse();}
  else timeline.play();
  return {finished,finish:()=>{timeline.pause(reverse?0:timeline.duration());clean();},dispose:()=>{timeline.kill();clean();}};
}
