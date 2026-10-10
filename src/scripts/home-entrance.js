// A finite, shared WAAPI entrance. Geometry transforms remain owned by Hero.
export function prepareHomeEntrance(hero, { delay = 0 } = {}) {
  const empty = { play() {}, clean() {}, finished: () => Promise.resolve() };
  if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return empty;
  const phone = matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)').matches;
  const duration = phone ? 900 : 1000;
  const distance = phone ? 8 : 16;
  const headers=Array.from(document.querySelectorAll('.site-header .site-nav__items > :not(.mobile-only), .site-header .site-controls > *, .site-header .mobile-menu-toggle'));
  const entries = [
    ...headers.map((el,i)=>[el,i*65]).filter(([el])=>!el.matches('[data-shared-nav-link]')),
  ].filter(([el])=>el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
  const animations = entries.map(([el, offset], index) => {
    const animation = el.animate([
      { translate: '0 ' + distance + 'px', clipPath: 'inset(0 0 100% 0)' },
      { translate: '0 0', clipPath: 'inset(0 0 -1em 0)' },
    ], { duration, delay: delay + offset * (phone ? .9 : 1), easing: 'cubic-bezier(.76,0,.24,1)', fill: 'both' });
    animation.pause();
    return animation;
  });
  // Markers sit outside each link's box; clipping the link hid them until cleanup.
  // Animate its authored children instead, preserving marker geometry and hover.
  headers.forEach((link,index) => {
    if (!link.matches('[data-shared-nav-link]') || !link.getClientRects().length || getComputedStyle(link).visibility === 'hidden') return;
    const start = delay + index * 65 * (phone ? .9 : 1);
    const add = (element, frames, offset = 0) => {
      if (!element) return;
      const animation = element.animate(frames, {
        duration: 550, delay: start + offset,
        easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both',
      });
      animation.pause();
      animations.push(animation);
    };
    add(link.querySelector('[data-nav-entry-label]'), [
      { transform: 'translateY(10px)', opacity: 0 },
      { transform: 'translateY(0px)', opacity: 1 },
    ]);
    link.querySelectorAll('[data-nav-entry-bracket]').forEach(bracket => add(bracket, [
      { transform: `translateX(${bracket.dataset.navEntryBracket === 'left' ? -6 : 6}px)`, opacity: 0 },
      { transform: 'translateX(0px)', opacity: 1 },
    ], 75));
    // Rotation remains owned by the existing plus hover/focus styles.
    add(link.querySelector('.nav-plus'), [{ opacity: 0 }, { opacity: 1 }], 75);
  });
  // The SVG viewports retain the original clipping and responsive geometry.
  // Percentage transforms use each path's fill-box, so the rise scales per letter.
  const letters = Array.from(hero.querySelectorAll('[data-hero-char]'));
  letters.forEach((letter, index) => {
    const animation = letter.animate([
      { transform: 'translateY(90%)', opacity: 0 },
      { transform: 'translateY(0%)', opacity: 1 },
    ], {
      duration: 900,
      delay: delay + 900 + index * 90,
      easing: 'cubic-bezier(.215,.61,.355,1)',
      fill: 'both',
    });
    animation.pause();
    animations.push(animation);
  });
  const info=createHeroInfoTimeline(hero);
  info.reset(delay);
  let played = false;
  return {
    play() { if (played) return; played = true; animations.forEach(a => a.play()); info.playInitial(); },
    clean() { animations.forEach(a => a.cancel()); info.settle(); },
    finished: () => Promise.all([...animations.map(a => a.finished.catch(() => {})),info.finished()]),
  };
}

// Shared between the parser-time entrance and the deferred Journey module.
export function createHeroInfoTimeline(hero) {
  const key=Symbol.for('leo.heroInfoTimeline');
  if(hero[key])return hero[key];
  const phone=matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)').matches;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const factor=phone?.9:1,duration=phone?900:1000,distance=phone?8:16;
  const entries=[['[data-hero-anchor="capabilities"]',900],['[data-hero-anchor="location"]',1050],['[data-hero-anchor="hour"]',1200],['.hero__scroll',1450]]
    .map(([selector,offset])=>[hero.querySelector(selector),offset*factor])
    .filter(([el])=>el&&el.getClientRects().length&&getComputedStyle(el).display!=='none');
  let lead=900*factor,total=0,direction=1;
  const animations=entries.map(([el,offset])=>{
    // Individual translate leaves the authored anchor rotation untouched.
    const a=el.animate([{translate:`0 ${distance}px`,opacity:0},{translate:'0 0',opacity:1}],
      {duration,delay:offset,easing:'cubic-bezier(.76,0,.24,1)',fill:'both'});
    a.pause();return a;
  });
  function time(){return Math.max(0,...animations.map(a=>Number(a.currentTime)||0));}
  function visible(){animations.forEach(a=>{a.currentTime=total;a.pause();});}
  function change(next){
    if(reduced()){visible();return;}
    let current=time();
    if(next<0&&current===0){controller.hide();return;}
    if(next>0&&current>=total){visible();return;}
    if(next>0&&current===0)current=lead;
    // Finished short tracks are aligned with the longest one before reversal.
    animations.forEach(a=>{a.currentTime=current;a.updatePlaybackRate(next>0?1:-2.5);a.play();});
    direction=next;
  }
  const controller={
    reset(delay=0){direction=1;lead=delay+900*factor;
      total=Math.max(0,...entries.map(([,offset])=>delay+offset+duration));
      animations.forEach((a,i)=>{
        const offset=delay+entries[i][1];
        // Equal track lengths retain the stagger when playback runs backwards.
        a.effect.updateTiming({delay:offset,endDelay:total-offset-duration});
        a.currentTime=0;a.pause();
      });if(reduced())visible();},
    playInitial(){if(direction<0)return;if(!reduced())animations.forEach(a=>{a.updatePlaybackRate(1);a.play();});else visible();},
    play(){change(1);},reverse(){change(-1);},
    show:visible,
    hide(){direction=-1;animations.forEach(a=>{a.currentTime=0;a.pause();});},
    settle(){if(reduced()||document.hidden)visible();else if(direction>0&&time()>=total)visible();},
    finished:()=>direction<0?Promise.resolve():Promise.all(animations.map(a=>a.finished.catch(()=>{}))),
    dispose(){animations.forEach(a=>a.cancel());delete hero[key];},
  };
  hero[key]=controller;controller.reset();return controller;
}