// Horizontal intent owns only this surface; vertical gestures stay native.
export function mountSurfaceSwipe(host:HTMLElement,enabled:()=>boolean,onSwipe:(direction:number)=>void){
 const events=new AbortController(),signal=events.signal;let x=0,y=0,dx=0,intent='',tracking=false,suppress=false;
 host.addEventListener('touchstart',e=>{tracking=enabled()&&e.touches.length===1;intent='';dx=0;if(tracking){x=e.touches[0].clientX;y=e.touches[0].clientY}},{passive:true,signal});
 host.addEventListener('touchmove',e=>{if(!tracking||e.touches.length!==1)return;dx=e.touches[0].clientX-x;const dy=e.touches[0].clientY-y;if(!intent&&Math.max(Math.abs(dx),Math.abs(dy))>12)intent=Math.abs(dx)>Math.abs(dy)*1.3?'x':'y';if(intent==='x')e.preventDefault()},{passive:false,signal});
 host.addEventListener('touchend',()=>{if(tracking&&intent==='x'&&Math.abs(dx)>36){suppress=true;onSwipe(dx<0?1:-1)}tracking=false},{passive:true,signal});
 host.addEventListener('touchcancel',()=>{tracking=false},{passive:true,signal});
 host.addEventListener('click',e=>{if(suppress){suppress=false;e.preventDefault();e.stopImmediatePropagation()}},{capture:true,signal});
 return()=>events.abort();
}
