// Experimental Work adapter. Optics, Gaussian passes and GPU resources belong to
// the footer renderer; only its source painter changes from glyphs to color media.
import {createFooterRefraction} from './footer-refraction';
function mountCaseEdgeGlass(host:HTMLElement){
 const stage=host.parentElement!,page=host.closest<HTMLElement>('[data-case-study]')!,rail=page.querySelector<HTMLElement>('[data-case-rail]')!;
 const glass=createFooterRefraction(host,{colorSource:true,canvasSelector:'[data-case-glass-canvas]',bandSelector:'[data-case-glass-side]'});
 if(!glass)return ()=>{};
 const abort=new AbortController(),{signal}=abort;
 let dead=false,visible=true,frame=0;
 const media=[...page.querySelectorAll<HTMLImageElement|HTMLVideoElement>('img,video')];
 const styles=new WeakMap<Element,{cover:boolean;radius:number}>();
 function schedule(){if(!dead&&glass!.available&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(paint);}
 function resize(){glass!.resize(true);schedule();}
 function paint(){frame=0;if(dead||!glass!.available||!visible||document.hidden)return;
  const bounds=host.getBoundingClientRect();
  const band=host.querySelector<HTMLElement>('[data-case-glass-side]')!.offsetWidth,padding=64;
  const items=media.map(node=>({node,rect:node.getBoundingClientRect()})).filter(({node,rect})=>rect.width&&rect.height&&rect.bottom>bounds.top&&rect.top<bounds.bottom&&(rect.left<bounds.left+band+padding||rect.right>bounds.right-band-padding)&&rect.right>bounds.left-padding&&rect.left<bounds.right+padding&&('naturalWidth'in node?node.complete&&node.naturalWidth:node.readyState>=2));
  glass!.render(ctx=>{
   for(const {node,rect}of items){
    let style=styles.get(node);if(!style){const css=getComputedStyle(node);style={cover:css.objectFit==='cover',radius:parseFloat(css.borderTopLeftRadius)||0};styles.set(node,style);}
    const x=rect.left-bounds.left,y=rect.top-bounds.top,iw='naturalWidth'in node?node.naturalWidth:node.videoWidth,ih='naturalHeight'in node?node.naturalHeight:node.videoHeight;
    const appearance=getComputedStyle(node);
    if(appearance.visibility==='hidden'||Number(appearance.opacity)===0)continue;
    ctx.save();ctx.globalAlpha*=Number(appearance.opacity);
    // The DOM reveal clips the image before the glass samples it. Preserve that
    // same inset in the source texture; rounded corners alone reveal it too soon.
    const inset=appearance.clipPath.match(/^inset\((.*?)\)$/)?.[1].split(/\s+round\s+/)[0].trim().split(/\s+/);
    if(inset){
     const [top,right=top,bottom=top,left=right]=inset;
     const pixels=(value:string,size:number)=>parseFloat(value)*(value.endsWith('%')?size/100:1);
     const t=pixels(top,rect.height),r=pixels(right,rect.width),b=pixels(bottom,rect.height),l=pixels(left,rect.width);
     ctx.beginPath();ctx.rect(x+l,y+t,Math.max(0,rect.width-l-r),Math.max(0,rect.height-t-b));ctx.clip();
    }
    ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,rect.width,rect.height,Math.min(style.radius,rect.width/2,rect.height/2));else ctx.rect(x,y,rect.width,rect.height);ctx.clip();
    const scale=style.cover?Math.max(rect.width/iw,rect.height/ih):Math.min(rect.width/iw,rect.height/ih),dw=iw*scale,dh=ih*scale;
    ctx.drawImage(node,x+(rect.width-dw)/2,y+(rect.height-dh)/2,dw,dh);ctx.restore();
   }
  });
 }
 // GSAP has already applied its transforms and clip at this point. Paint now,
 // in the same frame, including reverse playback after the scroll has stopped.
 page.addEventListener('case:reveal-frame',()=>{cancelAnimationFrame(frame);frame=0;paint();},{signal});
 const railObserver=new MutationObserver(schedule);railObserver.observe(rail,{attributes:true,attributeFilter:['style']});
 const size=new ResizeObserver(resize);size.observe(stage);
 const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){resize();}else {cancelAnimationFrame(frame);frame=0;}});visibility.observe(stage);
 media.forEach(node=>{node.addEventListener('load',schedule,{signal});node.addEventListener('loadeddata',schedule,{signal});node.addEventListener('seeked',schedule,{signal});});
 const videos=media.filter((node):node is HTMLVideoElement=>node instanceof HTMLVideoElement),callbacks=new Map<HTMLVideoElement,number>();
 videos.forEach(video=>{const update=()=>{if(dead)return;const rect=video.getBoundingClientRect(),band=host.querySelector<HTMLElement>('[data-case-glass-side]')!.offsetWidth;if(!video.paused&&(rect.left<band||rect.right>host.clientWidth-band))schedule();callbacks.set(video,video.requestVideoFrameCallback(update));};if(video.requestVideoFrameCallback)callbacks.set(video,video.requestVideoFrameCallback(update));});
 window.addEventListener('scroll',schedule,{passive:true,signal});window.addEventListener('resize',resize,{signal});document.addEventListener('visibilitychange',schedule,{signal});
 function dispose(){dead=true;abort.abort();cancelAnimationFrame(frame);railObserver.disconnect();size.disconnect();visibility.disconnect();callbacks.forEach((id,video)=>video.cancelVideoFrameCallback(id));glass!.dispose();}
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;},{signal});window.addEventListener('pageshow',resize,{signal});
 resize();void document.fonts.ready.then(schedule);return dispose;
}
const cleanups=[...document.querySelectorAll<HTMLElement>('[data-case-edge-prototype]')].map(mountCaseEdgeGlass);
if(import.meta.hot)import.meta.hot.dispose(()=>cleanups.forEach(dispose=>dispose()));
