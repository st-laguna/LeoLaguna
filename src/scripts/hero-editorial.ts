const host=document.querySelector<HTMLElement>('[data-hero-editorial]');
if(host){
 const abort=new AbortController(),{signal}=abort;
 const desktop=matchMedia('(min-width:1001px) and (orientation:landscape)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const links=Array.from(host.querySelectorAll<HTMLAnchorElement>('[data-hero-service]'));
 const panels=Array.from(host.querySelectorAll<HTMLElement>('[data-hero-story]'));
 const dots=Array.from(host.querySelectorAll<HTMLButtonElement>('[data-story-select]'));
 let service=0,story=0,visible=false;
 let serviceElapsed=0,storyElapsed=0,engaged=false;
 // Keep the first composition stable while reading. Autoplay starts on intent,
 // so a background timer does not replace the primary content during loading.
 const engage=()=>{engaged=true;};
 for(const type of ['pointerdown','wheel','touchstart','keydown'])window.addEventListener(type,engage,{once:true,passive:true,signal});
 const bars=dots.map(dot=>dot.querySelector<HTMLElement>('i')!);
 let barAnimations:Animation[]=[];
 function showStory(index:number){
  if(index===story)return;
  const previous=story;story=index;
  barAnimations.forEach(animation=>animation.cancel());barAnimations=[];
  panels.forEach((panel,i)=>{panel.toggleAttribute('data-active',i===index);panel.setAttribute('aria-hidden',String(i!==index));panel.inert=i!==index;});
  dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));
  if(!reduced.matches){
   const timing={duration:550,easing:'cubic-bezier(.76,0,.24,1)'};
   barAnimations=[
    bars[previous].animate([{transform:'translateX(0)'},{transform:'translateX(100%)'}],timing),
    bars[index].animate([{transform:'translateX(-100%)'},{transform:'translateX(0)'}],timing),
   ];
  }
  host!.querySelector('[data-story-count]')!.textContent=String(index+1).padStart(2,'0')+' / 03';
 }
 // Match the displacement to one language button, including responsive sizing.
 const languageButton=document.querySelector<HTMLElement>('.site-header .language button');
 const measureShift=()=>{if(languageButton){const width=languageButton.getBoundingClientRect().width;if(width>0)host!.style.setProperty('--hero-service-shift',width+'px');}};
 const sizeObserver=new ResizeObserver(measureShift);
 if(languageButton)sizeObserver.observe(languageButton);
 measureShift();
 const adaptive=document.documentElement.hasAttribute('data-adaptive-hero');
 function showService(index:number){service=index;links.forEach((a,i)=>{a.toggleAttribute('data-active',i===index);if(adaptive){a.inert=i!==index;a.setAttribute('aria-hidden',String(i!==index));}});}
 showService(0);
 links.forEach((a,i)=>a.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();event.stopPropagation();serviceElapsed=0;showService(i);window.dispatchEvent(new CustomEvent('leo:project-jump',{detail:i}));},{signal}));
 dots.forEach((b,i)=>b.addEventListener('click',()=>{showStory(i);storyElapsed=0;},{signal}));
 links.forEach((a,i)=>{
  const select=()=>{showService(i);serviceElapsed=0;};
  a.addEventListener('pointerenter',select,{signal});
  a.addEventListener('focus',select,{signal});
 });
 const hero=host.closest<HTMLElement>('.hero')!;
 const masters=JSON.parse(hero.dataset.heroMasters||'{}');
 const horizontal=masters.h;
 const inPolygon=(x:number,y:number,points:number[][])=>{let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
 const syncHeader=()=>{
  const rect=hero.getBoundingClientRect(),root=document.documentElement;
  const active=desktop.matches&&!root.hasAttribute('data-ipad')&&!root.hasAttribute('data-tablet-layout')&&rect.top<=48&&rect.bottom>innerHeight*.75&&rect.width>innerWidth*.9;
  if(!active||!horizontal){root.toggleAttribute('data-hero-nav-white',active);return;}
  const css=getComputedStyle(hero),size=css.getPropertyValue('--hero-mask-size').trim().split(/\s+/).map(parseFloat),position=css.getPropertyValue('--hero-mask-position').trim().split(/\s+/).map(parseFloat),view=horizontal.viewBox.split(/\s+/).map(Number);
  const updates:Array<[HTMLElement,boolean]>=[];
  for(const link of document.querySelectorAll<HTMLElement>('.site-header [data-shared-nav-link]')){
   const box=link.getBoundingClientRect(),x=(box.x+box.width/2-rect.x-position[0])*view[2]/size[0],y=(box.y+box.height/2-rect.y-position[1])*view[3]/size[1];
   updates.push([link,horizontal.polygons.some((polygon:number[][])=>inPolygon(x,y,polygon))]);
  }
  root.toggleAttribute('data-hero-nav-white',active);
  updates.forEach(([link,inside])=>link.toggleAttribute('data-hero-image-link',inside));
 };
 window.addEventListener('scroll',syncHeader,{passive:true,signal});window.addEventListener('resize',syncHeader,{passive:true,signal});syncHeader();
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncHeader();},{threshold:.2});observer.observe(host.closest('.hero')!);
 const timer=setInterval(()=>{
  if(!engaged||(!adaptive&&(!desktop.matches||(document.documentElement.hasAttribute('data-ipad')||document.documentElement.hasAttribute('data-tablet-layout'))))||reduced.matches||document.hidden||!visible)return;
  serviceElapsed+=250;storyElapsed+=250;
  if(serviceElapsed>=2200){showService((service+1)%links.length);serviceElapsed=0;}
  if(!adaptive&&storyElapsed>=7000){showStory((story+1)%panels.length);storyElapsed=0;}
 },250);
 if(import.meta.hot)import.meta.hot.dispose(()=>{clearInterval(timer);observer.disconnect();sizeObserver.disconnect();barAnimations.forEach(animation=>animation.cancel());abort.abort();});
}
