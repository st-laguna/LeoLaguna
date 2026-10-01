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
      const featured=section!.parentElement?.querySelector<HTMLElement>('[data-featured-works]');
      const presentation=gsap.timeline({paused:true});
      presentation.fromTo(logos,{translate:compact?'0 12px':'0 22px',clipPath:'inset(100% 0 0)'},{translate:'0 0',clipPath:'inset(0% 0 0)',duration:compact?.9:1,stagger:compact?.09:.11,ease:'power3.inOut'},0);
      const informationStart=presentation.duration();
      const informationTweens: Array<{tween:gsap.core.Animation;offset:number}> = [];
      presentation.addLabel('information',informationStart);
      // Pause the existing presentation between phases until the cover is 70% gone.
      presentation.addPause(informationStart);
      presentation.fromTo(section!.querySelectorAll('.brands-stats > div, .brands-statement'),{translate:'0 12px',clipPath:'inset(100% 0 0)'},{translate:'0 0',clipPath:'inset(0% 0 0)',duration:1,stagger:.14,ease:'power3.inOut'},informationStart);
      informationTweens.push({tween:presentation.recent(),offset:0});
      counters.forEach((element,index)=>{
        const state={value:0},goal=Number(element.dataset.countTo);
        presentation.fromTo(state,{value:0},{value:goal,duration:1.6,ease:'power2.inOut',onUpdate:()=>{
          const text=String(Math.round(state.value));
          if(element.textContent!==text)element.textContent=text;
        }},informationStart+index*.12);
        informationTweens.push({tween:presentation.recent(),offset:index*.12});
      });
      let phase=0;
      function reveal(progress:number){
        if(progress<=0){
          if(phase===0)return;
          // Reset only once WORKS has completely covered Brands again.
          presentation.removePause(informationStart);
          informationTweens.forEach(({tween,offset})=>tween.startTime(informationStart+offset));
          presentation.addPause(informationStart).pause(0);
          counters.forEach(element=>{element.textContent='0';});
          phase=0;
          return;
        }
        if(phase===0){phase=1;presentation.play(0);}
        if(progress>=.7 && phase===1){
          phase=2;
          // Schedule the information at the current clock time, never seek past logos.
          const now=presentation.time();
          presentation.removePause(informationStart);
          informationTweens.forEach(({tween,offset})=>tween.startTime(now+.08+offset));
          presentation.play();
        }
      }
      ScrollTrigger.create({id:'brands-logos',trigger:featured ?? section!.querySelector('.brands-layout')!,
        start:featured?'bottom bottom':'top 85%',end:'bottom top',
        onUpdate:self=>reveal(self.progress),onRefresh:self=>reveal(self.progress),
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
