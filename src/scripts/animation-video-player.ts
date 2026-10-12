import { isMobileAbout, mobileAboutMedia } from './about/mobileAboutDevice.js';
import '../styles/animation-video-player.css';

const editor=document.querySelector<HTMLElement>('[data-av-editor]');
if(editor){
 const root=editor, gallery=root.closest<HTMLElement>('[data-gallery]')!, dialog=root.closest<HTMLDialogElement>('dialog')!;
 const screen=root.querySelector<HTMLElement>('[data-av-screen]')!, strip=root.querySelector<HTMLElement>('[data-av-clips]')!;
 const clips=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-av-clip]'));
 const control=(name:string)=>root.querySelector<HTMLButtonElement>(`[data-av-action="${name}"]`)!;
 const current=root.querySelector<HTMLElement>('[data-av-current]')!, end=root.querySelector<HTMLElement>('[data-av-end]')!;
 const status=root.querySelector<HTMLElement>('[data-av-status]')!;
 const desktopVideos=Array.from(gallery.querySelectorAll<HTMLVideoElement>('.gallery-masonry video')).map(original=>{const poster=document.createElement('img');poster.src=original.poster;poster.alt=original.getAttribute('aria-label')||'';return {original,poster};});
 const events=new AbortController(), options={signal:events.signal};
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'), media=matchMedia(mobileAboutMedia);
 let video:HTMLVideoElement|undefined, selected=0, raf=0, visible=false, muted=true;
 const timecode=(value:number)=>{const s=Number.isFinite(value)?Math.max(0,Math.floor(value)):0;return [Math.floor(s/3600),Math.floor(s/60)%60,s%60,0].map(v=>String(v).padStart(2,'0')).join(':');};
 function draw(){
   const time=video?.currentTime||0,duration=video?.duration||0;
   root.style.setProperty('--av-progress',`${Number.isFinite(duration)&&duration>0?Math.min(100,time/duration*100):0}%`);
   current.textContent=timecode(time);end.textContent=timecode(duration);
 }
 function stopFrame(){cancelAnimationFrame(raf);raf=0;}
 function allowed(){return visible&&!document.hidden&&dialog.open&&!dialog.hasAttribute('data-media-closing')&&!gallery.hidden;}
 function frame(){raf=0;draw();if(video&&!video.paused&&!video.ended&&allowed())raf=requestAnimationFrame(frame);}
 function sync(){
   const playing=!!video&&!video.paused&&!video.ended;
   root.toggleAttribute('data-playing',playing);
   control('play').setAttribute('aria-label',playing?'Pause / Pausar':'Play / Reproducir');
   stopFrame();draw();if(playing&&allowed())raf=requestAnimationFrame(frame);
 }
 function showClip(){
   const clip=clips[selected],left=clip.offsetLeft-strip.offsetLeft,right=left+clip.offsetWidth;
   let target=strip.scrollLeft;
   if(left<target)target=left;else if(right>target+strip.clientWidth)target=right-strip.clientWidth;
   if(target!==strip.scrollLeft)strip.scrollTo({left:target,behavior:reduced.matches?'instant':'smooth'});
 }
 function syncSound(){
   if(!video)return;
   muted=video.muted;
   const hasAudio=clips[selected].dataset.hasAudio==='true',button=control('sound');
   button.disabled=!hasAudio;
   button.setAttribute('aria-label',!hasAudio?'No audio / Sin audio':muted?'Enable sound / Activar sonido':'Mute / Silenciar');
   button.setAttribute('aria-pressed',String(!muted));
   button.querySelector('svg')!.setAttribute('viewBox',`${muted?448:384} 0 64 64`);
   button.querySelector('use')!.setAttribute('href',`/icons/iconos_reproductor.svg#sound-${muted?'off':'on'}`);
 }
 function select(index:number){
   selected=Math.max(0,Math.min(clips.length-1,index));
   video?.pause();stopFrame();status.textContent='';
   clips.forEach((clip,i)=>clip.setAttribute('aria-pressed',String(i===selected)));
   control('previous').disabled=selected===0;control('next').disabled=selected===clips.length-1;
   if(video){video.muted=clips[selected].dataset.hasAudio!=='true';syncSound();video.poster=clips[selected].dataset.poster!;video.src=clips[selected].dataset.src!;video.load();}
   root.style.setProperty('--av-progress','0%');current.textContent=end.textContent='00:00:00:00';showClip();
 }
 // A square screen can exceed a landscape phone's height. Keep its controls
 // usable while the lower part of the picture remains in view.
 const observer=new IntersectionObserver(entries=>{visible=entries[0].intersectionRatio>=.05;if(!visible)video?.pause();sync();},{threshold:[0,.05,.25,.5,1]});
 function configure(){
   const mobile=isMobileAbout();gallery.toggleAttribute('data-av-layout',mobile);root.hidden=!mobile;
   desktopVideos.forEach(({original,poster})=>{if(mobile&&original.isConnected){original.pause();original.replaceWith(poster);}else if(!mobile&&poster.isConnected)poster.replaceWith(original);});
   if(!mobile){if(video){observer.unobserve(video);video.pause();video.removeAttribute('src');video.load();video.remove();video=undefined;}stopFrame();return;}
   if(video||!dialog.open||gallery.hidden)return;
   video=document.createElement('video');video.playsInline=true;video.controls=false;video.preload='metadata';video.muted=muted;video.setAttribute('aria-label','Animation & Video');
   screen.append(video);observer.observe(video);
   for(const name of ['play','pause','ended','loadedmetadata','durationchange','timeupdate','seeked','emptied'])video.addEventListener(name,sync,options);
   video.addEventListener('play',()=>{if(!allowed())video?.pause();},options);
   video.addEventListener('volumechange',syncSound,options);
   video.addEventListener('error',()=>{status.textContent='Video unavailable / Video no disponible';stopFrame();},options);
   select(selected);
 }
 clips.forEach((clip,i)=>clip.addEventListener('click',()=>select(i),options));
 control('previous').addEventListener('click',()=>select(selected-1),options);
 control('next').addEventListener('click',()=>select(selected+1),options);
 control('play').addEventListener('click',()=>{if(!video)return;if(video.paused&&allowed())void video.play().catch(()=>{status.textContent='Tap play to retry / Toca reproducir para reintentar';});else video.pause();},options);
 control('sound').addEventListener('click',()=>{if(video)video.muted=!video.muted;},options);
 control('fullscreen').addEventListener('click',async()=>{
   if(!video)return;
   const fallback=()=>{const native=video as HTMLVideoElement & {webkitEnterFullscreen?:()=>void};if(native.webkitEnterFullscreen)native.webkitEnterFullscreen();else status.textContent='Fullscreen unavailable / Pantalla completa no disponible';};
   try{if(document.fullscreenElement)await document.exitFullscreen();else if(video.requestFullscreen)await video.requestFullscreen();else fallback();}catch{try{fallback();}catch{status.textContent='Fullscreen unavailable / Pantalla completa no disponible';}}
 },options);
 const mutation=new MutationObserver(()=>{configure();if(!allowed())video?.pause();});
 mutation.observe(dialog,{attributes:true,attributeFilter:['open','data-media-closing']});
 mutation.observe(gallery,{attributes:true,attributeFilter:['hidden']});
 const device=new MutationObserver(configure);device.observe(document.documentElement,{attributes:true,attributeFilter:['data-ipad','data-tablet-portrait','data-large-tablet-landscape']});
 media.addEventListener('change',configure,options);
 window.addEventListener('resize',showClip,options);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video?.pause();},options);
 configure();
 if(import.meta.hot)import.meta.hot.dispose(()=>{events.abort();observer.disconnect();mutation.disconnect();device.disconnect();video?.pause();video?.remove();stopFrame();});
}
