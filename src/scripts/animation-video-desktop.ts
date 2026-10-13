import gsap from 'gsap';
import {isMobileAbout,mobileAboutMedia} from './about/mobileAboutDevice.js';
import '../styles/animation-video-desktop.css';

const root=document.querySelector<HTMLElement>('[data-av-desktop]');
if(root){
 const gallery=root.closest<HTMLElement>('[data-gallery]')!,dialog=root.closest<HTMLDialogElement>('dialog')!;
 const track=root.querySelector<HTMLElement>('[data-desktop-track]')!;
 const strip=root.querySelector<HTMLElement>('[data-av-clips]')!;
 // Three bounded copies permit invisible rebasing; the dataset stays at ten.
 for(const host of [track,strip]){const originals=Array.from(host.children);for(let copy=0;copy<2;copy++)originals.forEach(node=>host.append(node.cloneNode(true)));}
 const items=Array.from(track.querySelectorAll<HTMLButtonElement>('[data-desktop-item]'));
 const clips=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-av-clip]'));
 const media=items.map(item=>item.firstElementChild as HTMLElement);
 const video=document.createElement('video');video.playsInline=true;video.preload='metadata';video.muted=true;video.controls=false;
 const control=(name:string)=>root.querySelector<HTMLButtonElement>(`[data-av-action=${name}]`)!;
 const events=new AbortController(),options={signal:events.signal},reduced=matchMedia('(prefers-reduced-motion:reduce)'),device=matchMedia(mobileAboutMedia);
 let active=11,centers:number[]=[],width=0,frameId=0,scrollFrame=0,settle:ReturnType<typeof setTimeout>,visible=false,opened=false,moving=false,clipStart=0,clipWidth=0,stripCycle=0;
 const bar=root.querySelector<HTMLElement>('.av-controls')!;
 const loop=document.createElement('button');loop.type='button';loop.setAttribute('aria-label','Loop / Repetir');loop.setAttribute('aria-pressed','false');loop.dataset.avAction='loop';loop.innerHTML='<svg viewBox="320 0 64 64" aria-hidden="true"><use href="/icons/iconos_reproductor.svg#loop" /></svg>';bar.insertBefore(loop,control('fullscreen'));
 const volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='1';volume.step='.01';volume.value='0';volume.hidden=true;volume.className='av-volume';volume.setAttribute('aria-label','Volume / Volumen');bar.append(volume);
 const zoom=document.createElement('dialog');zoom.className='av-video-zoom';zoom.setAttribute('aria-label','Video preview / Vista ampliada');zoom.innerHTML='<button type="button" aria-label="Close preview / Cerrar vista ampliada">×</button><div></div>';document.body.append(zoom);
 function closeZoom(){if(!zoom.open)return;const playing=!video.paused;zoom.close();media[active].append(video);if(playing)void play();control('fullscreen').focus({preventScroll:true});}
 zoom.querySelector('button')!.addEventListener('click',closeZoom,options);zoom.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();closeZoom();},options);zoom.addEventListener('click',e=>{if(e.target===zoom)closeZoom();},options);
 loop.addEventListener('click',()=>{video.loop=!video.loop;loop.setAttribute('aria-pressed',String(video.loop));},options);
 volume.addEventListener('input',()=>{video.volume=Number(volume.value);video.muted=video.volume===0;},options);
 let tween:gsap.core.Tween|undefined;
 const enabled=()=>!isMobileAbout();
 let entering=false;
 const allowed=()=>enabled()&&dialog.open&&!gallery.hidden&&!dialog.hasAttribute('data-media-closing')&&!document.hidden&&(visible||zoom.open)&&!moving&&!entering;
 function refreshVisibility(){const rect=track.getBoundingClientRect();visible=rect.width>0&&rect.height>0&&Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0)>rect.height*.25;}
 const code=(n:number)=>{n=Number.isFinite(n)?Math.floor(n):0;return [Math.floor(n/3600),Math.floor(n/60)%60,n%60,0].map(v=>String(v).padStart(2,'0')).join(':');};
 function draw(){const progress=Number.isFinite(video.duration)&&video.duration>0?video.currentTime/video.duration:0;root!.style.setProperty('--av-progress',`${clipStart-strip.scrollLeft+clipWidth*progress}px`);root!.querySelector('[data-av-current]')!.textContent=code(video.currentTime);root!.querySelector('[data-av-end]')!.textContent=code(video.duration);}
 function tick(){frameId=0;draw();if(!video.paused&&allowed())frameId=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frameId);frameId=0;root!.toggleAttribute('data-playing',!video.paused);control('play').setAttribute('aria-label',video.paused?'Play / Reproducir':'Pause / Pausar');draw();if(!video.paused&&allowed())frameId=requestAnimationFrame(tick);}
 async function play(){if(!allowed())return;try{await video.play();}catch{video.muted=true;try{await video.play();}catch{}}}
 function sound(){const mute=video.muted||video.volume===0;volume.value=String(mute?0:video.volume);control('sound').querySelector('svg')!.setAttribute('viewBox',`${mute?448:384} 0 64 64`);control('sound').querySelector('use')!.setAttribute('href',`/icons/iconos_reproductor.svg#sound-${mute?'off':'on'}`);control('sound').setAttribute('aria-label','Volume / Volumen');}
 function parallax(){scrollFrame=0;const center=track.scrollLeft+width/2;media.forEach((node,i)=>{const offset=reduced.matches?0:Math.max(-1,Math.min(1,(centers[i]-center)/width))*8;node.style.transform=`translateX(${offset}%)`;});}
 function clipGeometry(){clipStart=clips[active].offsetLeft-strip.offsetLeft;clipWidth=clips[active].offsetWidth;stripCycle=clips[10].offsetLeft-clips[0].offsetLeft;draw();}
 function measure(){width=track.clientWidth;centers=items.map(item=>item.offsetLeft+item.offsetWidth/2);if(width&&!moving){track.scrollLeft=centers[active]-width/2;parallax();clipGeometry();strip.scrollLeft=stripCycle;}}
 function activate(index:number){active=10+((index%10)+10)%10;index=active;moving=false;items.forEach((item,i)=>item.setAttribute('aria-pressed',String(i%10===index%10)));clips.forEach((clip,i)=>clip.setAttribute('aria-pressed',String(i%10===index%10)));media[index].append(video);video.poster=clips[index].dataset.poster!;video.src=clips[index].dataset.src!;video.load();track.scrollLeft=centers[index]-width/2;parallax();clipGeometry();strip.scrollLeft=stripCycle;draw();void play();}
 function go(index:number){index=Math.max(0,Math.min(29,index));video.pause();moving=true;tween?.kill();clearTimeout(settle);const position={x:track.scrollLeft};tween=gsap.to(position,{x:centers[index]-width/2,duration:reduced.matches?0:.65,ease:'power3.inOut',onUpdate:()=>{track.scrollLeft=position.x;parallax();},onComplete:()=>{tween=undefined;activate(index);}});}
 function onScroll(){if(!enabled())return;if(!moving && Math.abs(track.scrollLeft-(centers[active]-width/2))<2)return;if(!scrollFrame)scrollFrame=requestAnimationFrame(parallax);if(tween)return;video.pause();moving=true;clearTimeout(settle);settle=setTimeout(()=>{const center=track.scrollLeft+width/2;const index=centers.reduce((best,n,i)=>Math.abs(n-center)<Math.abs(centers[best]-center)?i:best,0);go(index);},140);}
 track.addEventListener('scroll',onScroll,options);
 track.addEventListener('wheel',event=>{event.preventDefault();event.stopPropagation();tween?.kill();tween=undefined;track.scrollLeft+=(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*(event.deltaMode===1?16:1);},{...options,passive:false});
 track.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(active+(event.key==='ArrowRight'?1:-1));}},options);
 items.forEach((item,i)=>item.addEventListener('click',()=>go(i),options));clips.forEach((clip,i)=>clip.addEventListener('click',()=>{let delta=(i%10)-(active%10);if(delta>5)delta-=10;if(delta< -5)delta+=10;go(active+delta);},options));
 strip.addEventListener('scroll',()=>{if(stripCycle){if(strip.scrollLeft<stripCycle*.5)strip.scrollLeft+=stripCycle;else if(strip.scrollLeft>stripCycle*1.5)strip.scrollLeft-=stripCycle;}draw();},options);
 strip.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();strip.scrollLeft+=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;},{...options,passive:false});
 control('previous').addEventListener('click',()=>go(active-1),options);control('next').addEventListener('click',()=>go(active+1),options);
 control('play').addEventListener('click',()=>{refreshVisibility();if(video.paused)void play();else video.pause();},options);
 control('sound').addEventListener('click',()=>{volume.hidden=!volume.hidden;control('sound').setAttribute('aria-expanded',String(!volume.hidden));if(!volume.hidden)volume.focus();},options);
 control('fullscreen').setAttribute('aria-label','Enlarge video / Ampliar video');
 control('fullscreen').addEventListener('click',()=>{const playing=!video.paused;zoom.querySelector('div')!.append(video);zoom.showModal();if(playing)void play();},options);
 for(const event of ['play','pause','ended','loadedmetadata','timeupdate','emptied'])video.addEventListener(event,sync,options);
 video.addEventListener('volumechange',sound,options);
 const intersection=new IntersectionObserver(entries=>{const latest=entries[entries.length-1];visible=latest.intersectionRatio>.25;if(entering||dialog.hasAttribute('data-service-opening'))return;if(!visible&&!zoom.open)video.pause();else if(opened&&video.currentTime===0)void play();},{threshold:[0,.25,.5]});intersection.observe(track);
 function configure(){const desktop=enabled();document.documentElement.toggleAttribute('data-services-desktop',desktop);root!.hidden=!desktop;gallery.toggleAttribute('data-av-desktop-layout',desktop);const open=desktop&&dialog.open&&!gallery.hidden&&!dialog.hasAttribute('data-media-closing');if(open&&!opened){opened=true;measure();go(active);}else if(!open){opened=false;video.pause();tween?.kill();tween=undefined;clearTimeout(settle);moving=false;if(!desktop)video.remove();}}
 const mutation=new MutationObserver(()=>{
   configure();
   if(!opened){closeZoom();entering=false;gsap.killTweensOf(root);root!.removeAttribute('data-entered');root!.style.removeProperty('clip-path');return;}
   if(dialog.hasAttribute('data-service-opening')){entering=true;video.pause();gsap.killTweensOf(root);root!.removeAttribute('data-entered');gsap.set(root,{clipPath:'inset(0 0 100% 0)'});return;}
   requestAnimationFrame(measure);
   if(!root!.hasAttribute('data-entered')){
     root!.setAttribute('data-entered','');entering=true;video.pause();
     const finish=()=>{entering=false;refreshVisibility();void play();};
     gsap.fromTo(root,{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:reduced.matches?0:.8,ease:'power2.inOut',clearProps:'clipPath',onComplete:finish});
   }
 });mutation.observe(dialog,{attributes:true,attributeFilter:['open','data-media-closing','data-service-opening']});mutation.observe(gallery,{attributes:true,attributeFilter:['hidden']});
 const resize=new ResizeObserver(measure);resize.observe(track);device.addEventListener('change',configure,options);window.addEventListener('resize',configure,options);document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();},options);
 configure();sound();
 if(import.meta.hot)import.meta.hot.dispose(()=>{events.abort();mutation.disconnect();resize.disconnect();intersection.disconnect();tween?.kill();gsap.killTweensOf(root);clearTimeout(settle);cancelAnimationFrame(frameId);cancelAnimationFrame(scrollFrame);video.pause();video.remove();zoom.remove();loop.remove();volume.remove();for(const host of [track,strip])Array.from(host.children).slice(10).forEach(node=>node.remove());});
}
