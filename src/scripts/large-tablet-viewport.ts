import {ScrollTrigger} from 'gsap/ScrollTrigger';
// responsive-init batches browser-chrome changes; no per-scroll refresh.
const events=new AbortController();
window.addEventListener('leo:tablet-viewport-ready',()=>{
  if(document.documentElement.hasAttribute('data-large-tablet-landscape'))ScrollTrigger.refresh();
},{signal:events.signal});
if(import.meta.hot)import.meta.hot.dispose(()=>events.abort());
