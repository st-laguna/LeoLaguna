import {ScrollTrigger} from 'gsap/ScrollTrigger';
// CSS/ResizeObservers update live sizes immediately. Refresh scroll boundaries
// once native scrolling/rubber-banding settles, never during the gesture.
const events=new AbortController();
let refreshTimer:ReturnType<typeof setTimeout>|undefined;
function refreshWhenSettled(){
  clearTimeout(refreshTimer);
  if(!document.documentElement.hasAttribute('data-large-tablet-landscape'))return;
  const dialog=document.querySelector('dialog[open]');
  if(dialog){dialog.addEventListener('close',refreshWhenSettled,{once:true,signal:events.signal});return;}
  const max=ScrollTrigger.maxScroll(window);
  if(ScrollTrigger.isScrolling()||scrollY<0||scrollY>max+1||document.documentElement.hasAttribute('data-section-transition')){
    refreshTimer=setTimeout(refreshWhenSettled,150);return;
  }
  ScrollTrigger.refresh();
}
window.addEventListener('leo:tablet-viewport-ready',refreshWhenSettled,{signal:events.signal});
if(import.meta.hot)import.meta.hot.dispose(()=>{clearTimeout(refreshTimer);events.abort();});
