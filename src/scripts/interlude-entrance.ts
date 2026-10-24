import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const media=gsap.matchMedia();
media.add('(prefers-reduced-motion:no-preference)',()=>{
 for(const section of document.querySelectorAll<HTMLElement>('.services-intro,.science-interlude')){
  const services=section.matches('.services-intro');
  const variants=services?[section.querySelector('p')!]:[...section.querySelectorAll('.science-desktop,.science-mobile')];
  const first:Element[]=[],second:Element[]=[];
  for(const variant of variants){
   first.push(...variant.querySelectorAll(services?':scope > span:not(.nexo__second)':':scope > span'));
   const line=variant.querySelector(services?'.nexo__second':'em');
   if(line)second.push(line);
  }
  const enter=gsap.timeline({paused:true});
  enter.fromTo(first,{autoAlpha:0,y:32,clipPath:'inset(100% 0 0)'},{autoAlpha:1,y:0,clipPath:'inset(0% 0 0)',duration:.85,ease:'power3.out'},0)
   .fromTo(second,{autoAlpha:0,y:32,clipPath:'inset(100% 0 0)'},{autoAlpha:1,y:0,clipPath:'inset(0% 0 0)',duration:.85,ease:'power3.out'},.18);
  ScrollTrigger.create({trigger:section,start:'top 85%',end:'bottom 15%',onEnter:()=>enter.restart(),onEnterBack:()=>enter.restart(),onLeaveBack:()=>{enter.pause(0);},invalidateOnRefresh:true});
 }
});
if(import.meta.hot)import.meta.hot.dispose(()=>media.revert());
