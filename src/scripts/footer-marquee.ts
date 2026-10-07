import { createFooterRefraction } from './footer-refraction';
import { glyphs } from './footer-glyphs';

export const MARQUEE_VIEW = { height: 200, top: -32 };
export const FOOTER_MOTION = { speed: 100, expansion: 145, response: 7, gap: 110 };
const NS = 'http://www.w3.org/2000/svg';
export function initFooterMarquee(host: HTMLElement) {
  const svg = host.querySelector<SVGSVGElement>('[data-marquee-svg]')!;
  const track = svg.querySelector<SVGGElement>('[data-marquee-track]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const abort = new AbortController();
  const signal = abort.signal;

  // Allocate the below-fold renderer only when its existing effect is visible.
  let glass:ReturnType<typeof createFooterRefraction>=null;
  let glassInitialized=false;
  const glassThemeObserver=new MutationObserver(()=>{resize();});
  glassThemeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

  const period = 1242.8 + FOOTER_MOTION.gap;
  let viewWidth = 1400, phase = -35, velocity = 1, active = -1, hovered = false;
  let visible = false, raf = 0, previous = 0, anchor = 0;
  const amounts = glyphs.map(() => 0);
  const copies: {group: SVGGElement; paths: SVGPathElement[]}[] = [];
  const message=host.querySelector<HTMLElement>(':scope > .footer__mobile-message')!;
  let htmlSource=false;
  const mobileRows=Array.from(message.querySelectorAll<HTMLElement>('.footer__mobile-row')).map(row=>{
    const moving=row.querySelector<HTMLElement>('.footer__mobile-track')!;
    const spans=Array.from(moving.children) as HTMLElement[];
    const bitmap=document.createElement('canvas');
    // A zero-size inline box exposes the actual HTML baseline, including this font's metrics.
    const baseline=document.createElement('span');
    baseline.setAttribute('aria-hidden','true');
    baseline.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline;';
    spans[0].append(baseline);
    return {row,moving,spans,bitmap,baseline,x:0,y:0,px:0,py:0,spanWidth:0,bitmapScale:1,bitmapBaseline:0,bitmapKey:''};
  });
  function translation(element:Element){
    const transform=getComputedStyle(element).transform;
    return new DOMMatrixReadOnly(transform==='none'?undefined:transform);
  }
  function measureMobile(){
    const bounds=host.getBoundingClientRect();
    mobileRows.forEach(item=>{
      const style=getComputedStyle(item.moving), transform=translation(item.row);
      item.x=item.row.getBoundingClientRect().left-bounds.left-transform.e;
      item.y=item.baseline.getBoundingClientRect().top-bounds.top-transform.f;
      item.spanWidth=item.spans[0].getBoundingClientRect().width;
      const text=item.spans[0].textContent||'';
      const bitmapKey=[item.spanWidth,style.fontSize,style.fontFamily,style.fontWeight,style.letterSpacing,text,devicePixelRatio].join('|');
      if(bitmapKey===item.bitmapKey)return;
      item.bitmapKey=bitmapKey;
      const size=parseFloat(style.fontSize);
      item.bitmapBaseline=size*1.3;
      item.bitmapScale=Math.min(devicePixelRatio||1,1.5,2048/Math.max(1,item.spanWidth));
      item.bitmap.width=Math.max(1,Math.ceil(item.spanWidth*item.bitmapScale));
      item.bitmap.height=Math.max(1,Math.ceil(size*1.8*item.bitmapScale));
      const ctx=item.bitmap.getContext('2d')!;
      ctx.scale(item.bitmapScale,item.bitmapScale);
      ctx.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
      ctx.letterSpacing=style.letterSpacing;
      ctx.fillStyle='#fff';
      const measured=ctx.measureText(text).width;
      ctx.save();ctx.scale(item.spanWidth/Math.max(1,measured),1);
      ctx.fillText(text,0,item.bitmapBaseline);ctx.restore();
    });
  }
  function drawMobile(){
    if(!visible||document.hidden||!glass?.available)return;
    // These six transform reads synchronize the existing CSS loop and GSAP entrance.
    // Glyph bitmaps and all layout measurements are cached outside the frame loop.
    for(const item of mobileRows){
      const row=translation(item.row),moving=translation(item.moving);
      item.px=item.x+row.e+moving.e;item.py=item.y+row.f+moving.f;
    }
    renderGlass();
  }
  let canvasPaths:Path2D[]=[], opticalScale=1;
  function paintGlass(ctx:CanvasRenderingContext2D){
    if(htmlSource){
      for(const item of mobileRows)for(let i=0;i<item.spans.length;i++){
        ctx.drawImage(item.bitmap,item.px+i*item.spanWidth,item.py-item.bitmapBaseline,
          item.bitmap.width/item.bitmapScale,item.bitmap.height/item.bitmapScale);
      }
      return;
    }
    ctx.scale(opticalScale,opticalScale);ctx.translate(0,-MARQUEE_VIEW.top);
    const total=amounts.reduce((a,b)=>a+b,0),cycle=period+total;
    for(let k=0;k<copies.length;k++){
      ctx.save();ctx.translate(phase+(k-1)*cycle-total/2,0);
      let offset=0;
      for(let i=0;i<canvasPaths.length;i++){
        ctx.save();ctx.translate(offset+amounts[i]/2,0);ctx.fill(canvasPaths[i]);ctx.restore();offset+=amounts[i];
      }
      ctx.restore();
    }
  }
  function renderGlass(){if(visible&&!document.hidden)glass?.render(paintGlass);}
  function pathData(index: number, amount: number) {
    const g = glyphs[index];
    if (g.id === 'N') {
      const l=454.7-amount/2, r=564.9+amount/2, s=24.4;
      const dx=r-l-s, dy=131.4;
      // Keep the perpendicular thickness of the diagonal as its angle changes.
      const t=24.4*Math.hypot(dx,dy)/Math.hypot(85.8,dy);
      return `M${l} 133.6V2.2H${l+t}L${r-s} 94.1V2.2H${r}V133.6H${r-t}L${l+s} 41.8V133.6Z`;
    }
    let cursor=0;
    return g.commands.map(command => {
      const count=command==='C'?6:command==='Z'?0:2;
      const coords=g.base.slice(cursor,cursor+count).map((v,j)=>(v+g.offsets[cursor+j]*amount).toFixed(3));
      cursor+=count; return command+coords.join(' ');
    }).join('');
  }
  function resize() {
    if(!visible)return;
    if(!glassInitialized){glassInitialized=true;glass=createFooterRefraction(host);}
    htmlSource=getComputedStyle(message).display!=='none';
    opticalScale=host.clientHeight/MARQUEE_VIEW.height;
    glass?.resize(htmlSource);
    if(htmlSource){measureMobile();drawMobile();return;}
    const height=Math.max(1,host.clientHeight);
    viewWidth=host.clientWidth/height*MARQUEE_VIEW.height;
    svg.setAttribute('viewBox',`0 ${MARQUEE_VIEW.top} ${viewWidth} ${MARQUEE_VIEW.height}`);
    const count=Math.ceil(viewWidth/period)+4;
    while(copies.length<count){
      const group=document.createElementNS(NS,'g');
      const paths=glyphs.map((g,i)=>{
        const path=document.createElementNS(NS,'path');path.dataset.letter=g.id;
        path.setAttribute('d',pathData(i,0));group.append(path);return path;
      });
      track.append(group);copies.push({group,paths});
    }
    draw();
  }
  let shapeKey='';
  function draw() {
    if(htmlSource){drawMobile();return;}
    const total=amounts.reduce((a,b)=>a+b,0), cycle=period+total;

    const key=amounts.map(a=>a.toFixed(3)).join(',')+':'+copies.length;
    const changed=key!==shapeKey;shapeKey=key;
    const paths=changed?glyphs.map((_,i)=>pathData(i,amounts[i])):[];
    if(changed)canvasPaths=paths.map(d=>new Path2D(d));
    for(let k=0;k<copies.length;k++){
      copies[k].group.setAttribute('transform',`translate(${phase+(k-1)*cycle-total/2} 0)`);
      let offset=0;
      if(changed)glyphs.forEach((_,i)=>{
        const a=amounts[i];
        copies[k].paths[i].setAttribute('d',paths[i]);
        copies[k].paths[i].setAttribute('transform',`translate(${offset+a/2} 0)`);
        offset+=a;
      });
    }
    renderGlass();
  }
  function frame(now:number){
    raf=0;if(!visible||document.hidden||reduced.matches)return;
    if(htmlSource){if(!glass?.available)return;drawMobile();raf=requestAnimationFrame(frame);return;}
    const dt=Math.min((now-(previous||now))/1000,.04);previous=now;
    const ease=1-Math.exp(-FOOTER_MOTION.response*dt);
    velocity+=((hovered?0:1)-velocity)*ease;
    // Compensate the active copy so expansion pushes equally left and right.
    const oldCycle=period+amounts.reduce((a,b)=>a+b,0);

    amounts.forEach((a,i)=>amounts[i]=a+((i===active?FOOTER_MOTION.expansion:0)-a)*ease);
    const cycle=period+amounts.reduce((a,b)=>a+b,0);
    phase-=anchor*(cycle-oldCycle)+FOOTER_MOTION.speed*velocity*dt;
    if(!hovered && amounts.every(a=>a<.01)){phase=((phase%cycle)+cycle)%cycle-cycle;anchor=0;}
    draw();raf=requestAnimationFrame(frame);
  }
  function start(){if(!raf&&visible&&!document.hidden&&!reduced.matches){previous=0;raf=requestAnimationFrame(frame);}}
  function stop(){cancelAnimationFrame(raf);raf=0;previous=0;}
  host.addEventListener('pointermove',event=>{
    if(htmlSource||!fine.matches||reduced.matches)return;
    hovered=true;
    // Bounding boxes include the inner voids (the O is interactive in its centre).
    if(active>=0){
      const inside=copies.some(c=>{const b=c.paths[active].getBoundingClientRect();return event.clientX>=b.left-4&&event.clientX<=b.right+4;});
      if(inside)return;
    }
    let found=-1;
    copies.forEach((c,k)=>c.paths.forEach((p,i)=>{const b=p.getBoundingClientRect();if(event.clientX>=b.left&&event.clientX<=b.right){found=i;anchor=k-1;}}));
    active=found;
  },{signal});
  host.addEventListener('pointerleave',()=>{hovered=false;active=-1;},{signal});
  host.addEventListener('focusin',()=>{hovered=true;},{signal});
  host.addEventListener('focusout',()=>{hovered=false;active=-1;},{signal});
  reduced.addEventListener('change',()=>{stop();amounts.fill(0);active=-1;draw();start();},{signal});
  document.addEventListener('visibilitychange',()=>{stop();start();},{signal});

  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;host.toggleAttribute('data-optics-visible',visible);if(visible){resize();draw();start();}else stop();});observer.observe(host);
  resize();
  return {resize,dispose:()=>{
    stop();abort.abort();glassThemeObserver.disconnect();observer.disconnect();
    host.removeAttribute('data-optics-visible');
    track.replaceChildren();glass?.dispose();
    mobileRows.forEach(item=>item.baseline.remove());
  }};
}
