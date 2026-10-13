import gsap from 'gsap';
import { isPhoneViewport } from './responsive-layout';

export function openServiceCover(dialog:HTMLDialogElement,shell:HTMLElement,title:HTMLElement|null,source:HTMLElement,index:number,reverse=false){
  const horizontal=source.hasAttribute('data-horizontal');
  const origin=source.querySelector<HTMLElement>(horizontal?'.projects-footer':`[data-panel="${index}"] .project-mobile-copy`);
  const sourceTitle=source.querySelector<HTMLElement>(horizontal?`[data-copy="${index}"] h2`:`[data-panel="${index}"] .project-mobile-copy h2`);
  const sourceNumber=source.querySelector<HTMLElement>(horizontal?'.projects-number':`[data-panel="${index}"] .project-mobile-copy>span`);
  const number=dialog.querySelector<HTMLElement>('[data-gallery]:not([hidden]) [data-service-number]');
  if(index===3&&document.documentElement.hasAttribute('data-services-desktop')&&!reverse&&title){return openVideoCover(dialog,shell,title,source,origin,sourceTitle);}
  const styles=getComputedStyle(dialog),finalColor=styles.getPropertyValue('--background').trim(),panelColor=styles.getPropertyValue('--service-panel-color').trim();
  const panel=document.createElement('div');panel.className='service-opening-panel';panel.setAttribute('aria-hidden','true');dialog.append(panel);
  const rect=origin?.getBoundingClientRect(),valid=rect&&rect.width>0&&rect.height>0&&rect.top<innerHeight&&rect.bottom>0;
  // Start with the actual source surface, not the destination's black token.
  const videoDesktop=index===3&&document.documentElement.hasAttribute('data-services-desktop');
  const sourceColor=origin?getComputedStyle(origin).backgroundColor:panelColor;
  gsap.set(panel,{backgroundColor:sourceColor,x:valid?rect.left:0,y:valid?Math.max(0,rect.top):innerHeight,width:valid?rect.width:innerWidth,height:valid?rect.height:1,transformOrigin:'0 0'});
  gsap.set(shell,{yPercent:0,visibility:'hidden'});
  const hidden:HTMLElement[]=[],clones:HTMLElement[]=[];
  const lineTargets:{node:HTMLElement,x:number}[]=[];
  const targets:{clone:HTMLElement,x:number,y:number,scale:number}[]=[];
  function shared(destination:HTMLElement|null,from:HTMLElement|null){
    if(!destination)return;
    const end=destination.getBoundingClientRect(),start=from?.getBoundingClientRect();
    // Closing from the list/footer keeps the current scroll; only morph visible text.
    if(reverse && (end.bottom<=0 || end.top>=innerHeight))return;
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
    if(videoDesktop&&destination===title){const finalStyle=getComputedStyle(destination);Object.assign(clone.style,{fontFamily:finalStyle.fontFamily,fontWeight:finalStyle.fontWeight,color:finalStyle.color,mixBlendMode:'normal',webkitTextStrokeWidth:'0px',webkitTextFillColor:finalStyle.color});}
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
  if(paragraph&&!videoDesktop){const r=paragraph.getBoundingClientRect();if(r.width&&r.top<innerHeight&&r.bottom>0){
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
  const footer=videoDesktop?dialog.querySelector<HTMLElement>('[data-gallery]:not([hidden]) .gallery-footer'):null;
  shell.style.setProperty('--service-opening-background',panelColor);
  const timeline=gsap.timeline({paused:true,onComplete:reverse?undefined:clean,onReverseComplete:reverse?clean:undefined});
  timeline.to(panel,{backgroundColor:panelColor,duration:.4,ease:'power2.inOut'},0)
    .to(controls,{opacity:0,duration:.2},0).to(panel,{x:0,y:0,scaleX:innerWidth/(valid?rect.width:innerWidth),scaleY:innerHeight/(valid?rect.height:1),duration:.95,ease:'power3.inOut'},0)
    .to({}, {duration:.95},.08)
    // Color only starts after the Services panel has reached the viewport top.
    .set(shell,{visibility:'visible'},1.03).set(panel,{visibility:'hidden'},1.03)
    .to(shell,{'--service-opening-background':finalColor,duration:.5,ease:'power2.inOut'},1.03)
    .to(labels,{opacity:1,duration:.35,stagger:.08,ease:'power2.out'},1.08);
  if(footer)timeline.fromTo(footer,{y:80},{y:0,duration:.45,ease:'power3.out',clearProps:'transform'},1.03);
  if(outgoing)timeline.to(outgoing,{y:-20,opacity:0,clipPath:'inset(0 0 100%)',duration:.4,ease:'power2.in'},0);
  lineTargets.forEach(({node,x})=>timeline.to(node,{x,duration:.95,ease:'power3.inOut'},.08));
  targets.forEach(({clone,x,y,scale})=>timeline.to(clone,{x,y,scale,duration:.95,ease:'power3.inOut'},.08));
  if(reverse){timeline.progress(1,true);timeline.reverse();}
  else timeline.play();
  return {finished,finish:()=>{timeline.pause(reverse?0:timeline.duration());clean();},dispose:()=>{timeline.kill();clean();}};
}

// Universal exits start at the current viewport after the intro handoff.
export function closeServiceGallery(dialog:HTMLDialogElement,shell:HTMLElement,source:HTMLElement,index:number,scroller:HTMLElement){
  const active=dialog.querySelector<HTMLElement>('[data-gallery]:not([hidden])')!;
  const footer=active.querySelector<HTMLElement>('.gallery-footer')!;
  const horizontal=source.hasAttribute('data-horizontal');
  const origin=source.querySelector<HTMLElement>(horizontal?'.projects-footer':`[data-panel="${index}"] .project-mobile-copy`)!;
  // Match the actual responsive/theme Services surface, including touch palettes.
  const destinationColor=getComputedStyle(origin).backgroundColor;
  const viewport=scroller.getBoundingClientRect();
  const media=Array.from(active.querySelectorAll<HTMLElement>('.gallery-item,.service-grid-image')).filter(item=>{
    const rect=item.getBoundingClientRect();
    return rect.bottom>viewport.top && rect.top<viewport.bottom && rect.right>viewport.left && rect.left<viewport.right;
  });
  const footerRect=footer.getBoundingClientRect();
  const footerVisible=footerRect.bottom>viewport.top&&footerRect.top<viewport.bottom;
  const button=dialog.querySelector<HTMLElement>('.gallery-return-motion')!;
  const copy=Array.from(origin.children).filter((node):node is HTMLElement=>node instanceof HTMLElement);
  const previousInert=shell.inert;
  shell.inert=true;
  const block=(event:Event)=>{event.preventDefault();event.stopImmediatePropagation();};
  dialog.addEventListener('wheel',block,{passive:false,capture:true});
  dialog.addEventListener('touchmove',block,{passive:false,capture:true});
  dialog.addEventListener('keydown',block,{capture:true});
  let resolve!:()=>void,cleaned=false;
  const finished=new Promise<void>(done=>resolve=done);
  let timeline!:gsap.core.Timeline;
  const context=gsap.context(()=>{
    gsap.set(copy,{opacity:0});
    timeline=gsap.timeline({paused:true,onComplete:clean})
      .to(footerVisible?[footer,button]:[button],{y:footerVisible?'+=80':'-=20',opacity:0,duration:.45,ease:'power3.in'},0)
      .to(media,{y:'-=60',opacity:0,duration:.45,stagger:{amount:.02},ease:'power3.in'},0)
      // Start color after motion begins; never replace the gallery with an opaque panel.
      .to(shell,{backgroundColor:destinationColor,duration:.4,ease:'power2.inOut'},.08)
      .to(shell,{opacity:0,duration:.12,ease:'power2.inOut'},.46)
      .fromTo(copy,{y:20,opacity:0},{y:0,opacity:1,duration:.5,ease:'power3.out'},.5);
  });
  function clean(){
    if(cleaned)return;cleaned=true;
    // The awaiting close controller removes the dialog in the same microtask turn.
    context.revert();shell.inert=previousInert;
    dialog.removeEventListener('wheel',block,true);
    dialog.removeEventListener('touchmove',block,true);
    dialog.removeEventListener('keydown',block,true);
    resolve();
  }
  timeline.play();
  return {finished,finish:()=>{timeline.progress(1);clean();},dispose:()=>{timeline.kill();clean();}};
}
const videoCovers=new WeakMap<HTMLDialogElement,{reverse:()=>{finished:Promise<void>;finish:()=>void;dispose:()=>void}}>();
export function reverseVideoCover(dialog:HTMLDialogElement){return videoCovers.get(dialog)?.reverse();}
// The desktop video intro owns exactly one title at a time. The generic
// shared-text morph mutates destination typography and also morphs the number.
function openVideoCover(dialog:HTMLDialogElement,shell:HTMLElement,title:HTMLElement,source:HTMLElement,origin:HTMLElement|null,sourceTitle:HTMLElement|null){
  const start=sourceTitle?.getBoundingClientRect(),savedTitleStyle=title.getAttribute('style');
  const valid=start&&start.width>0&&start.height>0&&start.top<innerHeight&&start.bottom>0;
  const destinationSize=parseFloat(getComputedStyle(title).fontSize);
  const css=getComputedStyle(sourceTitle||title),ratio=destinationSize/parseFloat(css.fontSize);
  const typography={fontFamily:css.fontFamily,fontWeight:css.fontWeight,fontStyle:css.fontStyle,fontStretch:css.fontStretch,fontFeatureSettings:css.fontFeatureSettings,letterSpacing:css.letterSpacing,lineHeight:css.lineHeight,color:'#fff',webkitTextFillColor:'currentColor',webkitTextStrokeWidth:'0px',mixBlendMode:'difference'};
  Object.assign(title.style,typography,{fontSize:`${destinationSize}px`,lineHeight:css.lineHeight==='normal'?'normal':`${parseFloat(css.lineHeight)*ratio}px`,letterSpacing:css.letterSpacing==='normal'?'normal':`${parseFloat(css.letterSpacing)*ratio}px`});
  const end=title.getBoundingClientRect();
  const surface=getComputedStyle(dialog).getPropertyValue('--av-surface').trim();
  const panel=document.createElement('div');panel.className='service-opening-panel';panel.setAttribute('aria-hidden','true');
  const rect=origin?.getBoundingClientRect();
  gsap.set(panel,{x:0,y:rect?Math.max(0,rect.top):innerHeight,width:innerWidth,height:rect?.height||1,backgroundColor:origin?getComputedStyle(origin).backgroundColor:surface});
  const clone=document.createElement('div');clone.className='service-opening-shared';clone.dataset.videoTitleClone='';clone.setAttribute('aria-hidden','true');clone.textContent=title.textContent;
  Object.assign(clone.style,{position:'absolute',left:`${end.left}px`,top:`${end.top}px`,width:`${end.width/ratio}px`,...typography,fontSize:css.fontSize,whiteSpace:'nowrap',transformOrigin:'0 0',margin:'0'});
  source.setAttribute('data-video-title-owned','');dialog.setAttribute('data-video-title-owner','clone');dialog.setAttribute('data-service-opening','');
  gsap.set(shell,{visibility:'hidden'});dialog.append(panel,clone);
  gsap.set(clone,{x:valid?start.left-end.left:0,y:valid?start.top-end.top:0,scale:valid?1:ratio});
  const footer=title.closest('[data-gallery]')!.querySelector('.gallery-footer');
  let resolve!:()=>void,resolveExit:(()=>void)|undefined,cleaned=false;
  const finished=new Promise<void>(done=>resolve=done);
  const block=(e:Event)=>e.preventDefault();
  function lock(){dialog.addEventListener('wheel',block,{passive:false});dialog.addEventListener('touchmove',block,{passive:false});}
  function unlock(){dialog.removeEventListener('wheel',block);dialog.removeEventListener('touchmove',block);}
  function clean(){if(cleaned)return;cleaned=true;timeline.kill();panel.remove();clone.remove();if(savedTitleStyle===null)title.removeAttribute('style');else title.setAttribute('style',savedTitleStyle);gsap.set(shell,{clearProps:'visibility'});if(footer)gsap.set(footer,{clearProps:'transform'});dialog.removeAttribute('data-service-opening');dialog.removeAttribute('data-video-title-owner');source.removeAttribute('data-video-title-owned');videoCovers.delete(dialog);unlock();resolve();resolveExit?.();}
  lock();
  const timeline=gsap.timeline({onComplete:()=>{dialog.removeAttribute('data-service-opening');unlock();resolve();},onReverseComplete:clean});
  timeline.to(panel,{backgroundColor:surface,y:0,height:innerHeight,duration:.95,ease:'power3.inOut'},0)
    .to(clone,{x:0,y:0,scale:ratio,duration:.95,ease:'power3.inOut'},0)
    .set(shell,{visibility:'visible'},.95)
    .call(()=>dialog.setAttribute('data-video-title-owner',timeline.reversed()?'clone':'final'),[],.95)
    .set(clone,{visibility:'hidden'},.95).set(panel,{visibility:'hidden'},.95);
  if(footer)timeline.fromTo(footer,{y:80},{y:0,duration:.45,ease:'power3.out'},.95);
  videoCovers.set(dialog,{reverse:()=>{
    const finished=new Promise<void>(done=>resolveExit=done);lock();
    timeline.reverse();
    return {finished,finish:()=>{timeline.progress(0);clean();},dispose:clean};
  }});
  return {finished,finish:()=>{timeline.progress(1);dialog.removeAttribute('data-service-opening');unlock();resolve();},dispose:clean};
}
