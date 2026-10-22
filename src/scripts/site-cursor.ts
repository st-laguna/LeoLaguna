import '../styles/site-cursor.css';
const root=document.documentElement;
const fine=matchMedia('(hover:hover) and (pointer:fine)');
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const abort=new AbortController(),{signal}=abort;
const cursor=document.createElement('div');cursor.className='site-cursor';cursor.setAttribute('aria-hidden','true');
const label=document.createElement('span');cursor.append(label);document.body.append(cursor);
const ring=document.createElement('div');ring.className='site-cursor-ring';ring.setAttribute('aria-hidden','true');document.body.append(ring);
let x=0,y=0,inside=false,frame=0;
let pulse:Animation|undefined;
// Carry only the last mouse position across same-tab document navigation.
const positionKey='leo-cursor-position';
try{const saved=JSON.parse(sessionStorage.getItem(positionKey)||'null');sessionStorage.removeItem(positionKey);if(saved&&Date.now()-saved.time<30000&&fine.matches&&saved.x>=0&&saved.y>=0&&saved.x<innerWidth&&saved.y<innerHeight){x=saved.x;y=saved.y;inside=true;}}catch{}
window.addEventListener('pagehide',()=>{try{if(inside)sessionStorage.setItem(positionKey,JSON.stringify({x,y,time:Date.now()}));}catch{}},{signal});
window.addEventListener('pageshow',schedule,{signal});
window.addEventListener('leo:page-reveal',schedule,{signal});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true,signal});else schedule();
function hide(){cursor.classList.remove('is-visible');ring.classList.remove('is-visible');root.removeAttribute('data-site-cursor');}
function paint(){
 frame=0;
 if(!fine.matches||!inside||document.hidden){hide();return;}
 const el=document.elementFromPoint(x,y);
 if(!el||el.closest('input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea,[contenteditable=true],iframe')){hide();return;}
 const parent=el.closest('dialog[open]')||document.body;if(cursor.parentElement!==parent)parent.append(cursor);if(ring.parentElement!==parent)parent.append(ring);
 const drag=el.closest('.workflow__card,.case-study__model canvas,.about canvas,[data-cursor="drag"],[draggable="true"]');
 const zoom=el.closest('.project-enlarge:not(:disabled),.gallery-item button,.service-grid-image button,[data-cursor="zoom"]');
 const click=el.closest('a[href],button:not(:disabled),summary,[role=button],input[type=range],input[type=checkbox],input[type=radio],[data-footer-click-target]');
 // Large labels belong to visual interaction surfaces, never generic text links.
 const visualClick=el.closest('.featured-work__cover,.av-desktop-item,[data-footer-click-target],[data-cursor="click"]') || (click && el.closest('.case-study__next img,.service-preview-nav img,.av-clips img'));
 const brand=el.closest('[data-brand-preview]');
 const aboutCanvas=el.closest('canvas[data-about-cursor],.about canvas');
 const aboutText=!click&&!aboutCanvas&&!!el.closest('.about p,.about h1,.about h2,.about h3,.about dt,.about dd,.about [data-i18n]')&&getComputedStyle(el).userSelect!=='none';
 const object=aboutCanvas?.getAttribute('data-about-cursor')==='object';
 ring.classList.toggle('is-visible',!!aboutCanvas);ring.classList.toggle('is-object',object);
 cursor.classList.toggle('is-about-scene',!!aboutCanvas);cursor.classList.toggle('is-text',aboutText);
 const text=brand||aboutCanvas||aboutText?'':drag?'DRAG':zoom?'ZOOM':visualClick?'CLICK':'';
 if(label.textContent!==text)label.textContent=text;
 cursor.classList.toggle('is-expanded',!!text);
 cursor.classList.toggle('is-control',!!click&&!text&&!brand&&!aboutCanvas&&!aboutText);
 // Position is independent of the click transform; scaling must never scale screen coordinates.
 cursor.style.left=x+'px';cursor.style.top=y+'px';ring.style.left=x+'px';ring.style.top=y+'px';
 cursor.classList.add('is-visible');root.setAttribute('data-site-cursor','');
}
function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
document.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'){inside=false;hide();return;}x=e.clientX;y=e.clientY;inside=true;schedule();},{passive:true,signal});
document.addEventListener('pointerover',schedule,{passive:true,signal});
window.addEventListener('scroll',schedule,{passive:true,signal});
window.addEventListener('leo:cursor-update',schedule,{signal});
window.addEventListener('resize',schedule,{passive:true,signal});
document.documentElement.addEventListener('mouseleave',()=>{inside=false;hide();},{signal});
window.addEventListener('blur',()=>{inside=false;hide();},{signal});
document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();else schedule();},{signal});
fine.addEventListener('change',schedule,{signal});
document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&!reduced.matches&&cursor.classList.contains('is-visible')){pulse?.cancel();pulse=cursor.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(-50%,-50%) scale(.85)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:300,easing:'ease-out'});}},{signal});
if(import.meta.hot)import.meta.hot.dispose(()=>{abort.abort();pulse?.cancel();cancelAnimationFrame(frame);hide();cursor.remove();ring.remove();});
