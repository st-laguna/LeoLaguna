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
    return()=>{cells.forEach(cell=>{cell.disabled=false;});section.removeAttribute('data-mobile-streams');};
    });
    media.add('(prefers-reduced-motion:no-preference)',()=>{
      const logos=Array.from(section!.querySelectorAll<HTMLElement>('.brands-cell img'));
      const compact=tabletPortrait || matchMedia('(any-pointer:coarse)').matches;
      const counters=Array.from(section!.querySelectorAll<HTMLElement>('[data-count-to]'));
      const presentation=gsap.timeline({scrollTrigger:{id:'brands-logos',trigger:section!.querySelector('.brands-layout')!,start:()=>matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)').matches?'top 30%':section!.hasAttribute('data-mobile-streams')?'top 75%':'top 85%',toggleActions:'play none none reverse'}});
      presentation.fromTo(logos,{translate:compact?'0 12px':'0 22px',clipPath:'inset(100% 0 0)'},{translate:'0 0',clipPath:'inset(0% 0 0)',duration:compact?.8:.9,stagger:compact?.09:.11,ease:'power2.out'},0);
      presentation.fromTo(section!.querySelectorAll('.brands-stats > div, .brands-statement'),{translate:'0 12px',clipPath:'inset(100% 0 0)'},{translate:'0 0',clipPath:'inset(0% 0 0)',duration:.85,stagger:.14,ease:'power2.out'},0);
      counters.forEach((element,index)=>{
        const state={value:0},goal=Number(element.dataset.countTo);
        presentation.fromTo(state,{value:0},{value:goal,duration:1.6,ease:'none',onUpdate:()=>{
          const text=String(Math.round(state.value));
          if(element.textContent!==text)element.textContent=text;
        }},index*.12);
      });
      // Text mutations are not CSS properties: restore them explicitly on teardown.
      return()=>counters.forEach(element=>{element.textContent=element.dataset.countTo!;});
    });
  }
  configureLayout();
  const layoutObserver=new MutationObserver(configureLayout);
  layoutObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-tablet-portrait']});
  if(import.meta.hot)import.meta.hot.dispose(()=>{layoutObserver.disconnect();media.revert();themeObserver.disconnect();});
}
