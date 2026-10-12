import gsap from 'gsap';
import {isMobileAbout,mobileAboutMedia} from './about/mobileAboutDevice.js';
import '../styles/animation-video-desktop.css';

const root=document.querySelector<HTMLElement>('[data-av-desktop]');
if(root){
 const gallery=root.closest<HTMLElement>('[data-gallery]')!,dialog=root.closest<HTMLDialogElement>('dialog')!;
 const track=root.querySelector<HTMLElement>('[data-desktop-track]')!;
 const items=Array.from(track.querySelectorAll<HTMLButtonElement>('[data-desktop-item]'));
 const clips=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-av-clip]'));
 const media=items.map(item=>item.firstElementChild as HTMLElement);
 const video=document.createElement('video');video.playsInline=true;video.preload='metadata';video.muted=true;video.controls=false;
 const control=(name:string)=>root.querySelector<HTMLButtonElement>(`[data-av-action=${name}]`)!;
 const events=new AbortController(),options={signal:events.signal},reduced=matchMedia('(prefers-reduced-motion:reduce)'),device=matchMedia(mobileAboutMedia);
 let active=1,centers:number[]=[],width=0,frameId=0,scrollFrame=0,settle:ReturnType<typeof setTimeout>,visible=false,opened=false,moving=false;
 let tween:gsap.core.Tween|undefined;
 const enabled=()=>!isMobileAbout();
 const allowed=()=>enabled()&&dialog.open&&!gallery.hidden&&!dialog.hasAttribute('data-media-closing')&&!document.hidden&&visible&&!moving;
 const code=(n:number)=>{n=Number.isFinite(n)?Math.floor(n):0;return [Math.floor(n/3600),Math.floor(n/60)%60,n%60,0].map(v=>String(v).padStart(2,'0')).join(':');};
 function draw(){root!.style.setProperty('--av-progress',`${video.duration?100*video.currentTime/video.duration:0}%`);root!.querySelector('[data-av-current]')!.textContent=code(video.currentTime);root!.querySelector('[data-av-end]')!.textContent=code(video.duration);}
 function tick(){frameId=0;draw();if(!video.paused&&allowed())frameId=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frameId);frameId=0;root!.toggleAttribute('data-playing',!video.paused);control('play').setAttribute('aria-label',video.paused?'Play / Reproducir':'Pause / Pausar');draw();if(!video.paused&&allowed())frameId=requestAnimationFrame(tick);}
 async function play(){if(!allowed())return;try{await video.play();}catch{video.muted=true;try{await video.play();}catch{}}}
 function sound(){const mute=video.muted;control('sound').querySelector('svg')!.setAttribute('viewBox',`${mute?448:384} 0 64 64`);control('sound').querySelector('use')!.setAttribute('href',`/icons/iconos_reproductor.svg#sound-${mute?'off':'on'}`);control('sound').setAttribute('aria-label',mute?'Enable sound / Activar sonido':'Mute / Silenciar');control('sound').setAttribute('aria-pressed',String(!mute));}
 function parallax(){scrollFrame=0;const center=track.scrollLeft+width/2;media.forEach((node,i)=>{const offset=reduced.matches?0:Math.max(-1,Math.min(1,(centers[i]-center)/width))*8;node.style.transform=`translateX(${offset}%)`;});}
 function measure(){width=track.clientWidth;centers=items.map(item=>item.offsetLeft+item.offsetWidth/2);if(width&&!moving){track.scrollLeft=centers[active]-width/2;parallax();}}
 function activate(index:number){active=index;moving=false;items.forEach((item,i)=>item.setAttribute('aria-pressed',String(i===index)));clips.forEach((clip,i)=>clip.setAttribute('aria-pressed',String(i===index)));control('previous').disabled=index===0;control('next').disabled=index===9;media[index].append(video);video.poster=clips[index].dataset.poster!;video.src=clips[index].dataset.src!;video.load();track.scrollLeft=centers[index]-width/2;parallax();draw();clips[index].scrollIntoView({block:'nearest',inline:'nearest',behavior:reduced.matches?'instant':'smooth'});void play();}
 function go(index:number){index=Math.max(0,Math.min(9,index));video.pause();moving=true;tween?.kill();clearTimeout(settle);const position={x:track.scrollLeft};tween=gsap.to(position,{x:centers[index]-width/2,duration:reduced.matches?0:.65,ease:'power3.inOut',onUpdate:()=>{track.scrollLeft=position.x;parallax();},onComplete:()=>{tween=undefined;activate(index);}});}
 function onScroll(){if(!enabled())return;if(!moving && Math.abs(track.scrollLeft-(centers[active]-width/2))<2)return;if(!scrollFrame)scrollFrame=requestAnimationFrame(parallax);if(tween)return;video.pause();moving=true;clearTimeout(settle);settle=setTimeout(()=>{const center=track.scrollLeft+width/2;const index=centers.reduce((best,n,i)=>Math.abs(n-center)<Math.abs(centers[best]-center)?i:best,0);go(index);},140);}
 track.addEventListener('scroll',onScroll,options);
 track.addEventListener('wheel',event=>{event.preventDefault();event.stopPropagation();tween?.kill();tween=undefined;track.scrollLeft+=(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*(event.deltaMode===1?16:1);},{...options,passive:false});
 track.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(active+(event.key==='ArrowRight'?1:-1));}},options);
 items.forEach((item,i)=>item.addEventListener('click',()=>go(i),options));clips.forEach((clip,i)=>clip.addEventListener('click',()=>go(i),options));
 control('previous').addEventListener('click',()=>go(active-1),options);control('next').addEventListener('click',()=>go(active+1),options);
 control('play').addEventListener('click',()=>{if(video.paused)void play();else video.pause();},options);
 control('sound').addEventListener('click',()=>video.muted=!video.muted,options);
 control('fullscreen').addEventListener('click',()=>{void video.requestFullscreen?.().catch(()=>{});},options);
 for(const event of ['play','pause','ended','loadedmetadata','timeupdate','emptied'])video.addEventListener(event,sync,options);
 video.addEventListener('volumechange',sound,options);
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].intersectionRatio>.25;if(!visible)video.pause();else if(opened&&video.currentTime===0)void play();},{threshold:[0,.25,.5]});intersection.observe(track);
 function configure(){const desktop=enabled();document.documentElement.toggleAttribute('data-services-desktop',desktop);root!.hidden=!desktop;gallery.toggleAttribute('data-av-desktop-layout',desktop);const open=desktop&&dialog.open&&!gallery.hidden&&!dialog.hasAttribute('data-media-closing');if(open&&!opened){opened=true;measure();go(active);}else if(!open){opened=false;video.pause();tween?.kill();tween=undefined;clearTimeout(settle);moving=false;if(!desktop)video.remove();}}
 const mutation=new MutationObserver(()=>{configure();if(opened&&!dialog.hasAttribute("data-service-opening"))requestAnimationFrame(measure);});mutation.observe(dialog,{attributes:true,attributeFilter:['open','data-media-closing','data-service-opening']});mutation.observe(gallery,{attributes:true,attributeFilter:['hidden']});
 const resize=new ResizeObserver(measure);resize.observe(track);device.addEventListener('change',configure,options);window.addEventListener('resize',configure,options);document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();},options);
 configure();sound();
 if(import.meta.hot)import.meta.hot.dispose(()=>{events.abort();mutation.disconnect();resize.disconnect();intersection.disconnect();tween?.kill();clearTimeout(settle);cancelAnimationFrame(frameId);cancelAnimationFrame(scrollFrame);video.pause();video.remove();});
}
