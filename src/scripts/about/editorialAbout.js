import gsap from 'gsap';
import { message } from './messages.js';

export const editorialMedia = '(min-width:1001px) and (min-height:501px) and (hover:hover) and (pointer:fine), (min-width:1367px) and (min-height:701px) and (orientation:landscape) and (any-pointer:coarse)';
export function isEditorialAbout() {
  const root=document.documentElement;
  return !root.hasAttribute('data-tablet-portrait') && (root.hasAttribute('data-large-tablet-landscape') || (matchMedia(editorialMedia).matches&&!root.hasAttribute('data-ipad')));
}
export function mountEditorialAbout(section, getScene, on, reduced) {
  if(!isEditorialAbout())return null;
  const query=s=>section.querySelector(s),ui=query('[data-editorial-ui]');
  const restored=[],content=new Map(Object.entries({leo:{description:"Part marine biologist, part art nerd, and very easily distracted by new technology. I love traveling, animals, the ocean, and discovering things I didn’t know I’d be obsessed with yet."},morena:{description:"Two years old, endlessly playful, and usually waiting outside my door with a toy before I’m fully awake. She also decided Simba needed a lot more fun in his life — whether he agreed or not."},simba:{description:"Almost nine, slightly grumpy, ridiculously smart, and somehow still very athletic. No one warned him that Morena would arrive with this much energy, but he ended up becoming her favorite playmate anyway."}}));let statusTween,rollTween;let selected=null,state='loading',entered=false,entrance;
  function move(node,slot){const marker=document.createComment('about-original-position');node.before(marker);slot.append(node);restored.push(()=>marker.replaceWith(node));}
  section.setAttribute('data-editorial','');section.dataset.aboutState=state;
  section.setAttribute('aria-labelledby','about-editorial-title');
  move(query('.about__loading'),query('[data-editorial-status]'));
  move(query('.page-controls'),query('[data-editorial-preferences]'));
  move(query('[data-editorial-preferences] .site-controls>.action-pill'),query('[data-editorial-project]'));
  move(query('[data-return]'),query('[data-editorial-return]'));
  move(query('[data-picker]'),query('[data-editorial-access]'));
  move(query('[data-pause]'),query('[data-editorial-access]'));
  move(query('.box--clock'),query('[data-editorial-clock]'));
  // Reuse the supplied biography already present in the responsive About.
  query('[data-editorial-copy]').replaceChildren(...Array.from(query('.about-mobile-intro').children,node=>node.cloneNode(true)));
  const details=Array.from(query('.about-mobile-copy dl').children,node=>node.cloneNode(true));
  if(details[1]){const label=details[1].querySelector('dt');label.dataset.en='Capabilities';label.dataset.es='Especialidades';label.textContent=document.documentElement.lang==='es'?'Especialidades':'Capabilities';}
  query('[data-editorial-details]').replaceChildren(...[details[0],details[2],details[1]].filter(Boolean));
  const city=query('.clock__city'),cityText=city.firstChild,originalCity=cityText.textContent;cityText.textContent='Lima, Perú ';move(query('[data-local-time]'),city);restored.push(()=>cityText.textContent=originalCity);
  const date=document.createElement('span');date.className='about-editorial__date';query('.clock__detail').append(date);
  const panel=query('.about-editorial__context'),back=query('[data-return]'),zoom=query('[data-about-zoom]'),close=query('[data-context-close]');
  const originalArrow=back.firstElementChild.textContent;back.firstElementChild.textContent='←';
  function setState(next){state=next;section.dataset.aboutState=next;const busy=next==='object-transitioning'||next==='returning';zoom.disabled=busy||next==='loading';back.disabled=!selected||busy;close.disabled=busy;query('[data-explore]').inert=busy;for(const button of roller.querySelectorAll('button'))button.disabled=busy||next==='loading';}
  const title=query('#about-editorial-title');
  let fittedWidth=-1;
  // Ignore height-only observer notifications caused by our own font fitting.
  function fitTitle(){const widthNow=title.clientWidth;if(widthNow===fittedWidth)return;fittedWidth=widthNow;for(const line of title.children){line.style.fontSize='100px';const range=document.createRange();range.selectNodeContents(line);const width=range.getBoundingClientRect().width;line.style.fontSize=(100*title.clientWidth/width)+'px';for(let i=0;i<3;i++){const measured=range.getBoundingClientRect().width;line.style.fontSize=(parseFloat(line.style.fontSize)*title.clientWidth/measured)+'px';}}}
  const titleObserver=new ResizeObserver(fitTitle);titleObserver.observe(title);document.fonts.ready.then(()=>{if(section.hasAttribute('data-editorial')){fittedWidth=-1;fitTitle();}});
  const picker=query('[data-picker]');
  const choices=Array.from(query('[data-explore]').querySelectorAll('button'));
  const ordered=choices.filter(b=>b.dataset.id!=='morena').concat(choices.filter(b=>b.dataset.id==='morena'));
  let options=[null,...ordered];let optionIndex=0;
  const roller=document.createElement('div');roller.className='about-editorial__roller';roller.innerHTML='<button type="button" data-roll-prev aria-label="Previous model">↑</button><span data-roll-neighbor="prev" aria-hidden="true"></span><span class="about-editorial__roll-current" data-roll-current aria-live="polite">All</span><span data-roll-neighbor="next" aria-hidden="true"></span><button type="button" data-roll-next aria-label="Next model">↓</button>';
  query('[data-editorial-access]').append(roller);
  function updateRoll(direction=0){optionIndex=selected?options.findIndex(b=>b?.dataset.id===selected.id):0;if(optionIndex<0)optionIndex=0;const label=b=>b?message(b.dataset.label):(document.documentElement.lang==='es'?'Todo':'All');query('[data-roll-neighbor="prev"]').textContent=label(options[(optionIndex-1+options.length)%options.length]);query('[data-roll-neighbor="next"]').textContent=label(options[(optionIndex+1)%options.length]);const current=query('[data-roll-current]');rollTween?.kill();current.textContent=label(options[optionIndex]);if(!reduced&&direction)rollTween=gsap.fromTo(current,{y:direction*16,opacity:0},{y:0,opacity:1,duration:.4,ease:'power3.out'});}
  let rollDirection=0;
  function step(direction){if(state==='loading'||state==='object-transitioning'||state==='returning')return;rollDirection=direction;const next=options[(optionIndex+direction+options.length)%options.length];if(next)next.click();else getScene()?.reset();}
  on(query('[data-roll-prev]'),'click',()=>step(-1));on(query('[data-roll-next]'),'click',()=>step(1));on(roller,'keydown',event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();step(event.key==='ArrowUp'?-1:1);}});
  function changeStatus(text){const node=query('[data-status]');if(node.textContent===text)return;statusTween?.kill();if(reduced){node.textContent=text;return;}statusTween=gsap.timeline().to(node,{y:-6,opacity:0,duration:.15}).add(()=>node.textContent=text).to(node,{y:0,opacity:1,duration:.25,ease:'power3.out'});}
  function language(){const spanish=document.documentElement.lang==='es';zoom.setAttribute('aria-label',spanish?'Zoom de la escena':'Scene zoom');close.setAttribute('aria-label',spanish?'Cerrar objeto seleccionado':'Close selected object');panel.setAttribute('aria-label',spanish?'Objeto seleccionado':'Selected object');if(selected)query('[data-context-title]').textContent=message(selected.label);query('[data-roll-prev]').setAttribute('aria-label',spanish?'Modelo anterior':'Previous model');query('[data-roll-next]').setAttribute('aria-label',spanish?'Modelo siguiente':'Next model');updateRoll();fittedWidth=-1;fitTitle();if(state==='selected'||state==='overview')changeStatus(spanish?'LISTO PARA EXPLORAR':'READY TO EXPLORE');}
  function select(item){
    const returnFocused=panel.contains(document.activeElement)||document.activeElement===back;
    selected=item;updateRoll(rollDirection);rollDirection=0;
    if(item){
      panel.tabIndex=-1;
      // Entries intentionally reserve final image, alt, description and metadata.
      const data=content.get(item.id)||{id:item.id,displayName:item.label,image:null,alt:'',description:null,metadata:null};content.set(item.id,data);
      query('[data-context-title]').textContent=message(item.label);const description=query('[data-context-description]');description.textContent=data.description||'Content to be provided.';description.removeAttribute('data-en');description.removeAttribute('data-es');const media=query('.about-editorial__image-placeholder');media.replaceChildren();if(data.description){const img=document.createElement('img');img.src='/about/img/'+item.id+'.webp';img.alt=item.label;img.width=400;img.height=400;media.append(img);}else media.textContent='IMAGE TO BE PROVIDED';
      section.setAttribute('data-context-open','');panel.inert=false;panel.setAttribute('aria-hidden','false');
      back.tabIndex=0;back.setAttribute('aria-hidden','false');gsap.set(back,{autoAlpha:1,y:0});
      setState('object-transitioning');
      if(query('[data-picker]').contains(document.activeElement)){query('[data-picker]').open=false;panel.focus({preventScroll:true});}
    }else{
      section.removeAttribute('data-context-open');panel.inert=true;panel.setAttribute('aria-hidden','true');
      back.tabIndex=-1;back.setAttribute('aria-hidden','true');gsap.set(back,{autoAlpha:0,y:0});setState('returning');
      if(returnFocused)query('[data-roll-prev]').focus({preventScroll:true});
    }
    query('[data-picker]').open=false;
    for(const button of query('[data-explore]').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.id===item?.id));
  }
  function settled(){setState(selected?'selected':'overview');changeStatus(document.documentElement.lang==='es'?'LISTO PARA EXPLORAR':'READY TO EXPLORE');}
  function status(text){
    const spanish=document.documentElement.lang==='es';let output=message(text);
    if(text==='Loading my little world…'||text==='Preparing the 3D scene…')output=spanish?'CARGANDO MODELOS 3D':'LOADING 3D MODELS';
    else if(text==='Ready to explore.'||text==='Back to the full scene.')output=spanish?'LISTO PARA EXPLORAR':'READY TO EXPLORE';
    else if(text.startsWith('Inspecting '))output=state==='selected'?(spanish?'LISTO PARA EXPLORAR':'READY TO EXPLORE'):(spanish?'ABRIENDO ':'OPENING ')+message(text.slice(11));
    changeStatus(output.toUpperCase());
  }
  function ready(interactive){const buttons=Array.from(query('[data-explore]').querySelectorAll('button'));options=[null,...buttons.filter(b=>b.dataset.id==='laptop'),...buttons.filter(b=>!['laptop','morena'].includes(b.dataset.id)),...buttons.filter(b=>b.dataset.id==='morena')];updateRoll();setState('overview');zoom.disabled=!interactive;}
  function enter(){if(document.documentElement.hasAttribute("data-about-loading")||entered)return;entered=true;if(reduced)return;// Animate blend layers themselves, never their transparent header/footer ancestors.
    const groups=ui.querySelectorAll('.about__loading,.about-editorial__top .about-editorial__links,[data-editorial-preferences],.about-editorial__top .about-editorial__cta-cell,.about-editorial__bio,.about-editorial__stage-ui,.about-editorial__clock,.about-editorial__bottom .about-editorial__links,.about-editorial__bottom .about-editorial__cta-cell');entrance=gsap.timeline().fromTo(groups,{opacity:0,y:12,clipPath:'inset(0 0 100% 0)'},{opacity:1,y:0,clipPath:'inset(0 0 0% 0)',duration:.7,stagger:.08,ease:'power3.inOut',onComplete:()=>gsap.set(groups,{clearProps:'transform,opacity,clipPath'})}).fromTo(ui.querySelectorAll('.about-editorial__lines i'),{opacity:0},{opacity:.5,duration:.5,stagger:.04},0);}
  for(const button of ui.querySelectorAll('.about-editorial__links a,.about-editorial__cta-cell a,[data-return]'))on(button,'click',()=>{if(!reduced)button.animate([{scale:'1.04'},{scale:'1.1'},{scale:'1'}],{duration:350,easing:'cubic-bezier(.76,0,.24,1)'});});
  on(close,'click',()=>getScene()?.reset());
  on(zoom,'input',()=>getScene()?.setZoom(Number(zoom.value)/100));
  on(window,'leo:language-change',language);
  on(window,'leo:page-reveal',enter);
  language();
  return {select,settled,status,ready,enter,pause(paused){const button=query('[data-pause]');button.replaceChildren();const icon=document.createElement('span');icon.className='about-editorial__motion-icon';icon.style.maskImage=`url('/icons/${paused?'play':'pause'}.svg')`;button.append(icon);button.setAttribute('aria-label',message(paused?'Play motion':'Pause motion'));},zoom(value){zoom.value=String(Math.round(value*100));},clock(now){date.textContent=new Intl.DateTimeFormat(document.documentElement.lang==='es'?'es-PE':'en-US',{timeZone:'America/Lima',weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(now)+' (UTC−5)';},dispose(){titleObserver.disconnect();statusTween?.kill();rollTween?.kill();roller.remove();entrance?.revert();date.remove();back.firstElementChild.textContent=originalArrow;query('[data-explore]').inert=false;restored.reverse().forEach(restore=>restore());section.removeAttribute('data-editorial');section.removeAttribute('data-context-open');delete section.dataset.aboutState;section.setAttribute('aria-labelledby','about-title');}};
}
