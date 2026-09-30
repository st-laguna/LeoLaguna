import { initBrandPreview } from './brand-preview';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { registerScrollStops } from './scroll-pacing';
gsap.registerPlugin(ScrollTrigger);
const section=document.querySelector<HTMLElement>('[data-brands]');
if(section){
  const removeStop = registerScrollStops(section);
  if(import.meta.hot)import.meta.hot.dispose(removeStop);
  function updateLogos(){
    const dark=document.documentElement.dataset.theme==='dark';
    section!.querySelectorAll<HTMLImageElement>('[data-brand-white]').forEach(img=>{
      img.src=dark?img.dataset.brandWhite!:img.dataset.brandOriginal!;
      img.setAttribute('data-authored-variant','');
    });
  }
  const themeObserver=new MutationObserver(updateLogos);
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  updateLogos();
  let media: ReturnType<typeof gsap.matchMedia>;
  function configureLayout(){
    media?.revert();
    media=gsap.matchMedia();
    const tabletPortrait=document.documentElement.hasAttribute('data-tablet-portrait');
    media.add('(min-width:1001px), (min-width:701px) and (min-height:501px)',()=>{
      if(!tabletPortrait)return initBrandPreview(section);
    });
    media.add(tabletPortrait?'all':'(max-width:700px), (max-width:1000px) and (max-height:500px)',()=>{
    section.setAttribute('data-mobile-streams','');
    const cells=Array.from(section.querySelectorAll<HTMLButtonElement>('.brands-cell'));
    cells.forEach(cell=>{cell.disabled=true;});
    const columns=Array.from(section.querySelectorAll<HTMLElement>('[data-brand-column]'));
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const clones=columns.flatMap(column=>Array.from(column.children).map(child=>{
      const clone=child.cloneNode(true) as HTMLElement;clone.setAttribute('aria-hidden','true');clone.inert=true;clone.removeAttribute('data-reveal');column.append(clone);return clone;
    }));
    const tweens=reduced?[]:columns.map((column,index)=>gsap.fromTo(column,{yPercent:index===0?0:-50},{yPercent:index===0?-50:0,ease:'none',duration:28,repeat:-1}));
    const observer=new IntersectionObserver(([entry])=>tweens.forEach(t=>t.paused(!entry.isIntersecting)));observer.observe(section);
    return()=>{cells.forEach(cell=>{cell.disabled=false;});observer.disconnect();tweens.forEach(t=>t.kill());clones.forEach(c=>c.remove());columns.forEach(c=>c.style.removeProperty('transform'));section.removeAttribute('data-mobile-streams');};
    });
  }
  configureLayout();
  const layoutObserver=new MutationObserver(configureLayout);
  layoutObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-tablet-portrait']});
  if(import.meta.hot)import.meta.hot.dispose(()=>{layoutObserver.disconnect();media.revert();themeObserver.disconnect();});
}
