import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import { scrollPage, isCommittingScrollJump } from './smooth-scroll';
gsap.registerPlugin(ScrollTrigger);
const root=document.querySelector<HTMLElement>('.home-journey');
if(root){
  const host=root;
  const hero=host.querySelector<HTMLElement>('.hero')!;
  const mask=host.querySelector<HTMLElement>('.hero__mask')!;
  const fish=host.querySelector<HTMLElement>('.hero__parallax')!;
  const mobileOverlay=host.querySelector<SVGElement>('.hero__mobile-overlay');
  const intermediateImages = [1, 2, 3, 4].map(index => {
  const image = new Image();

  image.src = `/imgs/hero/in_${index}.webp`;
  image.alt = '';
  image.decoding = 'async';
  image.draggable = false;
  image.className = 'journey-intermediate-image';

  fish.append(image);
  return image;
});
  const workflow=host.querySelector<HTMLElement>('.workflow')!;
  const heading=workflow.querySelector<HTMLElement>('.workflow__heading')!;
  const grid=workflow.querySelector<HTMLElement>('.workflow__grid')!;
  const slots=Array.from(workflow.querySelectorAll<HTMLElement>('.workflow__slot'));
  const track=workflow.querySelector<HTMLElement>('.workflow__track')!;
  const texts=Array.from(hero.querySelectorAll<HTMLElement>('.hero__blend'));
  const back=new Image();back.className='journey-card-image';back.src='/imgs/workflow/1.webp';back.alt='';back.setAttribute('aria-hidden','true');mask.append(back);
  const cover=document.createElementNS('http://www.w3.org/2000/svg','svg');
  cover.classList.add('journey-cover');cover.setAttribute('aria-hidden','true');
  cover.setAttribute('preserveAspectRatio','none');
  cover.innerHTML='<defs><mask id="journey-cutout" maskUnits="userSpaceOnUse" x="0" y="0"><rect width="100%" height="100%" fill="white"/><g fill="black"><polygon/><polygon/><polygon/><polygon/></g></mask></defs><rect width="100%" height="100%" fill="var(--background)" mask="url(#journey-cutout)"/>';
  hero.append(cover);
  const cutout=cover.querySelector('g')!;
  const polygons=Array.from(cutout.querySelectorAll('polygon'));
  const media=gsap.matchMedia();
  const clamp=(v:number)=>Math.max(0,Math.min(1,v));
  const ease=(v:number)=>{const x=clamp(v);return x*x*(3-2*x);};
  media.add('(min-width:1001px) and (min-height:681px) and (prefers-reduced-motion:no-preference)',()=>{
    host.setAttribute('data-journey','');
    // El Timeline controla estos nodos; no comparte transforms con el drag de las cartas.
    gsap.killTweensOf([mask,...texts,heading,track,...slots]);
    [mask,...texts,heading,track,...slots].forEach(el=>el.style.clipPath='none');
    let active=true;
    let width=0,height=0,target={x:0,y:0,w:0,h:0},offsets:number[]=[];
    const state={p:0};
    // Keep the original 320svh entrance; the remaining 120svh is exploration.
    const returnFloor={p:0};
    let returning: gsap.core.Timeline | null = null;
    function measure(){
      if(!active)return;
      const stage=host.querySelector<HTMLElement>('.journey-stage')!.getBoundingClientRect();
      width=stage.width;height=stage.height;
      const h=height/width*1366,factor=Math.min(1,h/768),offset=(h-768*factor)/2;
      const y=(v:number)=>v*factor+offset;
      cover.setAttribute('viewBox',`0 0 1366 ${h}`);
      cover.querySelector('mask')!.setAttribute('width','1366');
      cover.querySelector('mask')!.setAttribute('height',String(h));
      const points=[`262.25,0 0,${y(450.9)} 334.91,${y(450.9)} 597.09,0`,
        `334.91,${y(450.9)} 196.28,${y(689.77)} 643.29,${y(689.77)} 781.63,${y(450.9)}`,
        `1031.29,${y(308.79)} 1170.53,${y(69.9)} 723.52,${y(69.9)} 584.97,${y(308.79)}`,
        `1031.29,${y(308.79)} 761.25,${h} 1096.53,${h} 1366,${y(308.79)}`];
      polygons.forEach((polygon,i)=>polygon.setAttribute('points',points[i]));
      // offsetLeft/Top no incluyen las animaciones aplicadas a cada slot.
      const image=slots[0].querySelector<HTMLImageElement>('.workflow__front img')!;
      target={x:grid.offsetLeft+slots[0].offsetLeft,y:grid.offsetTop+slots[0].offsetTop,w:image.offsetWidth,h:image.offsetHeight};
      // Los slots tienen como offsetParent workflow (el grid no tiene position).
      target.x=slots[0].offsetLeft;target.y=slots[0].offsetTop;
      offsets=slots.map(slot=>slot.offsetLeft-slots[0].offsetLeft);
      render();
    }

    function render(){
      if(!width)return;
      const requested=clamp(state.p);
      if(isCommittingScrollJump()) {
        returning?.kill();returning=null;returnFloor.p=0;
        workflow.dispatchEvent(new Event('workflow:reset'));
      }
      if (requested < .995 && !returning &&
          workflow.querySelector('.workflow__card[aria-pressed="true"]')) {
        // Complete the existing 650ms CSS flip before moving or hiding slots.
        returnFloor.p=1;
        workflow.dispatchEvent(new Event('workflow:reset'));
        returning=gsap.timeline({onComplete:()=>{returning=null;render();}})
          .to(returnFloor,{p:1,duration:.65})
          .to(returnFloor,{p:0,duration:.45,ease:'power2.in',onUpdate:render});
      }
      const p=Math.max(requested,returnFloor.p);
        // El encogimiento comienza en .42.
        // Las imágenes empiezan a cambiar después.
        const imageStarts = [.47, .53, .59, .65];
        const saturations = [.25, .50, .75, 1];

        intermediateImages.forEach((image, index) => {
          const ready = image.complete && image.naturalWidth > 0;
          const progress = ease((p - imageStarts[index]) / .04);

          image.style.opacity = ready ? String(progress) : '0';
          image.style.filter = `saturate(${saturations[index]})`;
        });
      const staggerStep=.025,exitDuration=.09;
    texts.forEach((text,i)=>{
      const local=ease(clamp((p-i*staggerStep)/exitDuration));
      text.style.translate=`0 ${-(70+i*18)*local}px`;
      text.style.clipPath=`inset(0 0 ${local*100}% 0)`;
    });
      const zoom=ease((p-.08)/.34);
      const scale=1+zoom*13;
      // Punto dentro del brazo izquierdo. Al atravesarlo, el vacío sale del encuadre.
      const svgHeight=height/width*1366;
      const y450=450.9*Math.min(1,svgHeight/768)+(svgHeight-768*Math.min(1,svgHeight/768))/2;
      const focalY=y450*.5/svgHeight;
      const focalX=((262.25*.5)+(334.91+(597.09-334.91)*.5))/2/1366;
      const px=zoom*(width*.5-focalX*width)-(scale-1)*focalX*width;
      const py=zoom*(height*.5-focalY*height)-(scale-1)*focalY*height;
      // El SVG conserva un buffer del tamaño de la pantalla: solo cambian sus vectores.
      cutout.setAttribute('transform',`translate(${px/width*1366} ${py/width*1366}) scale(${scale})`);
      cover.style.visibility=p<.42?'visible':'hidden';
      mask.style.maskImage='none';


const shrink = ease((p - .42) / .29);

// El giro empieza después de mostrar las cuatro imágenes.
const turn = ease((p - .72) / .12);

// La última imagen se apaga antes de llegar a medio giro.
const blackout = ease(turn / .5);

hero.style.width = `${width + (target.w - width) * shrink}px`;
hero.style.height = `${height + (target.h - height) * shrink}px`;
hero.style.left = `${target.x * shrink}px`;
hero.style.top = `${target.y * shrink}px`;
hero.style.borderRadius = `${18 * shrink}px`;
hero.style.transform = `rotateY(${180 * turn}deg)`;

hero.style.backgroundColor = p >= .72 ? '#000' : '';

fish.style.top = `${-20 * (1 - shrink)}%`;
fish.style.height = `${140 - 40 * shrink}%`;
fish.style.transform =
  `translateY(${height * .05 * zoom * (1 - shrink)}px)`;

fish.style.opacity = String(1 - blackout);
fish.style.visibility = blackout < 1 ? 'visible' : 'hidden';

// No mostrar una copia de la primera imagen durante el giro.
back.style.visibility = 'hidden';

// Entregar el lugar a la carta real al terminar el giro.
const handoff = .84;

hero.style.visibility = p < handoff ? 'visible' : 'hidden';
hero.style.opacity = p < handoff ? '1' : '0';
hero.inert = p > .15;

workflow.style.visibility = p >= .42 ? 'visible' : 'hidden';
workflow.inert = requested < .995 || returning !== null;

heading.style.clipPath =
  `inset(${(1 - ease((p - .49) / .19)) * 100}% 0 0)`;

const spread = ease((p - .86) / .14);

track.style.clipPath = `inset(0 ${(1 - spread) * 100}% 0 0)`;

slots.forEach((slot, i) => {
  if (i === 0) {
    const revealFirst = ease((p - handoff) / .06);

    slot.style.visibility = p >= handoff ? 'visible' : 'hidden';
    slot.style.opacity = '1';
    slot.style.translate = '0 0';
    slot.style.rotate = '0deg';

    const image = slot.querySelector<HTMLElement>(
      '.workflow__front img'
    );

    const title = slot.querySelector<HTMLElement>(
      '.workflow__front strong'
    );

    if (image) {
      image.style.opacity = String(revealFirst);
    }

    if (title) {
      title.style.clipPath = 'none';
      title.style.opacity = String(revealFirst);
    }
  } else {
    // Cada carta comienza después de la anterior.
    const start = .86 + (i - 1) * .025;
    const local = ease((p - start) / .09);

    slot.style.visibility = local > 0 ? 'visible' : 'hidden';
    slot.style.opacity = String(local);

    slot.style.translate =
      `${-offsets[i] * (1 - local)}px ${24 * (1 - local)}px`;

    slot.style.rotate =
      `${(i - 1.5) * 5 * (1 - local)}deg`;
  }

  // La primera permanece delante mientras se despliegan.
  // Al terminar, vuelve el comportamiento normal de hover.
  slot.style.zIndex = p < .999 ? String(slots.length - i) : '';
});
    }
    const animation=gsap.to(state,{p:1,ease:'none',scrollTrigger:{trigger:host,start:'top top',end:()=>`+=${host.querySelector<HTMLElement>('.journey-stage')!.offsetHeight*3.2}`,scrub:1,invalidateOnRefresh:true,onRefresh:measure},onUpdate:render});
    const resize=new ResizeObserver(measure);resize.observe(host.querySelector('.journey-stage')!);
    void document.fonts.ready.then(measure);
    const jump = (event: Event) => { event.preventDefault(); const trigger = animation.scrollTrigger; if (trigger) { scrollPage(trigger.end, true); } };
    hero.querySelector('a[href="#workflow"]')?.addEventListener('click',jump);
    measure();ScrollTrigger.refresh();
    return()=>{
      active=false;
      returning?.kill();
      workflow.dispatchEvent(new Event('workflow:reset'));
      animation.scrollTrigger?.kill();animation.kill();resize.disconnect();
      hero.querySelector('a[href="#workflow"]')?.removeEventListener('click',jump);
      host.removeAttribute('data-journey');hero.inert=false;workflow.inert=false;
      [hero,fish,workflow,heading,track,...texts,...slots].forEach(el=>{
        ['width','height','left','top','border-radius','transform','translate','rotate','visibility','clip-path','opacity'].forEach(prop=>el.style.removeProperty(prop));
      });
      hero.style.removeProperty('background-color');
      slots[0].querySelector<HTMLElement>('.workflow__front img')!.style.removeProperty('opacity');
      slots[0].querySelector<HTMLElement>('.workflow__front strong')!.style.removeProperty('opacity');
      mask.style.removeProperty('mask-size');mask.style.removeProperty('mask-position');
      mask.style.maskImage=mask.dataset.portalMask||'';
      slots[0].querySelector<HTMLElement>('.workflow__front strong')!.style.removeProperty('clip-path');
    };
  });

  media.add('((max-width:700px) or ((max-width:1000px) and (max-height:500px))) and (prefers-reduced-motion:no-preference)',()=>{
    host.setAttribute('data-mobile-journey','');
    host.removeAttribute('data-journey');
    const stage=host.querySelector<HTMLElement>('.journey-stage')!;
    const turns=slots.map(slot=>slot.querySelector<HTMLElement>('.workflow__turn')!);
    const backs=slots.map(slot=>slot.querySelector<HTMLElement>('.workflow__back')!);
    const cards=slots.map(slot=>slot.querySelector<HTMLButtonElement>('.workflow__card')!);
    const state={p:0};
    let width=0,height=0,target={x:0,y:0,w:0,h:0};
    const clamp=(v:number)=>Math.max(0,Math.min(1,v));
    const ease=(v:number)=>{const x=clamp(v);return x*x*(3-2*x);};

    function measure(){
      const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;
      const w=cards[0].offsetWidth,h=cards[0].offsetHeight;
      target={x:grid.offsetLeft+(grid.clientWidth-w)/2,y:grid.offsetTop+(grid.clientHeight-h)/2,w,h};
      render();
    }

    function render(){
      if(!width)return;
      const p=clamp(state.p);
      const portal=ease(p/.2);
      texts.filter(text=>text!==mobileOverlay).forEach((text,i)=>{
        const out=ease((p-i*.012)/.075);
        text.style.translate=`0 ${-70*out}px`;
        text.style.clipPath=`inset(0 0 ${out*100}% 0)`;
      });
      if(mobileOverlay){
        mobileOverlay.style.translate='none';mobileOverlay.style.clipPath='none';
        mobileOverlay.querySelectorAll('use').forEach((part,i)=>{
          const out=ease((p-i*.008)/.026);
          part.style.opacity=String(1-out);
          part.style.transform=`translateY(${-100*out}px)`;
        });
      }
      // Grow only the aperture; the illustration keeps its viewport dimensions.
      const portalScale=1+portal*18;
      const fit=Math.min(width/1365.7,height/2462.68);
      const mw=1365.7*fit, mh=2462.68*fit;
      const focalX=.3, focalY=.36;
      mask.style.maskSize=mask.style.webkitMaskSize=`${mw*portalScale}px ${mh*portalScale}px`;
      mask.style.maskPosition=mask.style.webkitMaskPosition=`${(width-mw)/2-(portalScale-1)*mw*focalX}px ${(height-mh)/2-(portalScale-1)*mh*focalY}px`;
      mask.style.transform='none';fish.style.transform='none';
      if(p>.2){mask.style.maskImage='none';mask.style.webkitMaskImage='none';}
      else {const url='url("/icons/logo_phn_mask.svg")';mask.style.maskImage=url;mask.style.webkitMaskImage=url;}

      const imageStarts=[.105,.135,.165,.195];
      intermediateImages.forEach((img,index)=>{
        const reveal=ease((p-imageStarts[index])/.025);
        const replaced=index<intermediateImages.length-1&&p>=imageStarts[index+1]+.025;
        img.style.opacity='1';
        img.style.visibility=replaced||reveal<=0?'hidden':'visible';
        img.style.clipPath=`inset(${(1-reveal)*100}% 0 0)`;
        img.style.filter='grayscale(1)';
      });

      const shrink=ease((p-.21)/.08);
      hero.style.width=`${width+(target.w-width)*shrink}px`;
      hero.style.height=`${height+(target.h-height)*shrink}px`;
      hero.style.left=`${target.x*shrink}px`;
      hero.style.top=`${target.y*shrink}px`;
      hero.style.borderRadius=`${18*shrink}px`;
      const handoff=.32;
      const crossfade=ease((p-.29)/.03);
      fish.style.filter='none';
      hero.style.visibility=p<handoff?'visible':'hidden';
      hero.style.opacity=String(1-crossfade);
      hero.inert=p>.03;
      workflow.style.visibility=p>.22?'visible':'hidden';
      workflow.inert=true;
      const headingIn=ease((p-.23)/.07),headingOut=ease((p-.94)/.04);
      heading.style.opacity='1';
      heading.style.clipPath=`inset(${(1-headingIn)*100}% 0 ${headingOut*100}% 0)`;

      const cardsStart=.29;
      const cardsEnd=.97;
      const span=(cardsEnd-cardsStart)/slots.length;
      slots.forEach((slot,i)=>{
        const local=(p-(cardsStart+i*span))/(span*1.12);
        const enter=ease(local/(i===0?.16:.22));
        const flip=ease((local-.28)/.28);
        const leave=ease((local-.68)/.32);
        const visible=local>-.02&&local<1.03;
        slot.style.visibility=visible?'visible':'hidden';
        slot.style.opacity='1';
        slot.style.clipPath=`inset(${(1-enter)*100}% 0 ${leave*100}% 0 round 18px)`;
        slot.style.transform=`translate3d(0,${(1-enter)*42-leave*90}px,${(1-enter)*-170-leave*170}px) scale(${.86+.14*enter-.12*leave})`;
        slot.style.zIndex=String(10-i);
        turns[i].style.transform=`rotateY(${180*flip}deg)`;
        const showingBack=flip>.5;
        cards[i].setAttribute('aria-pressed',String(showingBack));
        backs[i].setAttribute('aria-hidden',String(!showingBack));
      });
    }

    const animation=gsap.to(state,{p:1,ease:'none',scrollTrigger:{trigger:host,start:'top top',end:'bottom bottom',scrub:.45,invalidateOnRefresh:true,onRefresh:measure},onUpdate:render});
    const resize=new ResizeObserver(measure);resize.observe(stage);
    measure();ScrollTrigger.refresh();
    return()=>{
      animation.scrollTrigger?.kill();animation.kill();resize.disconnect();
      host.removeAttribute('data-mobile-journey');hero.inert=false;workflow.inert=false;
      workflow.dispatchEvent(new Event('workflow:reset'));
      [hero,mask,fish,workflow,heading,...texts,...slots,...turns,...(mobileOverlay?[mobileOverlay]:[])].forEach(el=>{
        ['width','height','left','top','border-radius','transform','translate','visibility','opacity','z-index','transform-origin','clip-path','filter','mask-size','mask-position','-webkit-mask-size','-webkit-mask-position'].forEach(prop=>el.style.removeProperty(prop));
      });
      mobileOverlay?.querySelectorAll('use').forEach(part=>{part.style.removeProperty('opacity');part.style.removeProperty('transform');});
      intermediateImages.forEach(img=>{img.style.removeProperty('opacity');img.style.removeProperty('filter');});
      const url=mask.dataset.portalMask||'';mask.style.maskImage=url;mask.style.webkitMaskImage=url;
    };
  });
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        media.revert();
        back.remove();
        cover.remove();
        intermediateImages.forEach(image => image.remove());
      });
    }
}
