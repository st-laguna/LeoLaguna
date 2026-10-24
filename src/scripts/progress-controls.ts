export const playIcon='<path d="M4 2.5v13l11-6.5z" fill="currentColor"/>';
const pauseIcon='<path d="M3 2h4v14H3zM11 2h4v14h-4z" fill="currentColor"/>';
export function mountProgressControls(host:HTMLElement,dots:HTMLButtonElement[],play:HTMLButtonElement,getIndex:()=>number,select:(i:number)=>void,enabled:()=>boolean){
 const events=new AbortController(),signal=events.signal,icon=play.querySelector('svg')!;
 let running=false,visible=false,frame=0,last=0,progress=0;
 function pause(){running=false;cancelAnimationFrame(frame);play.setAttribute('aria-label','Play gallery');icon.innerHTML=playIcon;}
 function sync(){const active=getIndex();dots.forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===active));b.querySelector<HTMLElement>('i')!.style.transform=`scaleX(${i===active?progress:0})`});if(!enabled()||!visible||document.hidden)pause()}
 function reset(){progress=0;sync()}
 function tick(t:number){if(!running)return;progress+=(t-last)/5000;last=t;if(progress>=1){progress=0;select((getIndex()+1)%dots.length)}sync();if(running)frame=requestAnimationFrame(tick)}
 dots.forEach((b,i)=>b.addEventListener('click',()=>{pause();progress=0;select(i);sync()},{signal}));
 play.addEventListener('click',()=>{if(running){pause();return}if(!enabled()||!visible)return;running=true;last=performance.now();play.setAttribute('aria-label','Pause gallery');icon.innerHTML=pauseIcon;frame=requestAnimationFrame(tick)},{signal});
 const observer=new IntersectionObserver(es=>{visible=es[0].isIntersecting;sync()});observer.observe(host);
 document.addEventListener('visibilitychange',sync,{signal});sync();
 return{pause,reset,sync,dispose(){pause();events.abort();observer.disconnect()}};
}
