import gsap from 'gsap';
import {PROPS} from './sceneConfig.js';
import {message} from './messages.js';
import {isPhoneViewport} from '../responsive-layout';
const characters={leo:"Part marine biologist, part art nerd, and very easily distracted by new technology. I love traveling, animals, the ocean, and discovering things I didn’t know I’d be obsessed with yet.",simba:"Almost nine, slightly grumpy, ridiculously smart, and somehow still very athletic. No one warned him that Morena would arrive with this much energy, but he ended up becoming her favorite playmate anyway.",morena:"Two years old, endlessly playful, and usually waiting outside my door with a toy before I’m fully awake. She also decided Simba needed a lot more fun in his life, whether he agreed or not."};
export function mountMobileAbout3D(section,getScene,on,reduced){
 const q=s=>section.querySelector(s),panel=q('.mobile-3d-panel'),toggle=q('[data-mobile-3d-toggle]'),bio=q('[data-mobile-3d-bio]'),selection=q('[data-mobile-3d-selection]');
 section.setAttribute('data-mobile-3d','');
 const moves=[];function move(node,target){const marker=document.createComment('mobile-3d-original');node.before(marker);target.append(node);moves.push(()=>marker.replaceWith(node));}
 move(q('.about__loading'),q('[data-mobile-3d-status]'));
 const title=q('#about-editorial-title').cloneNode(true);title.id='mobile-3d-title';bio.append(title);
 for(const p of q('.about-mobile-intro').children)bio.append(p.cloneNode(true));
 const details=q('.about-mobile-copy dl').cloneNode(true);const rows=[...details.children];if(rows[1]){const dt=rows[1].querySelector('dt');dt.dataset.en='Specialties';dt.dataset.es='Especialidades';dt.textContent=document.documentElement.lang==='es'?'Especialidades':'Specialties';}details.replaceChildren(...[rows[0],rows[2],rows[1]].filter(Boolean));bio.append(details);
 const menu=q('[data-menu-context="about"][data-shared-menu-toggle]');menu.disabled=false;
 let open=false,selected=null,ready=false,version=0,timer,animation,framing;
 let targetOpen=false,panelTimeline;
 let panelProgress=0,panelWidth=panel.offsetWidth;
 const statusChrome=q('[data-mobile-3d-status]'),hints=q('[data-mobile-3d-hints]'),dial=q('[data-shadow-controls]');
 const chrome=[statusChrome,hints,dial].filter(Boolean);
 const roller=q('[data-mobile-3d-roller]');let options=[null],rollTween,busy=true,rollDirection=0;
 function syncViewerControls(){roller.hidden=open||isPhoneViewport();roller.inert=roller.hidden;}
 syncViewerControls();
 on(window,'resize',syncViewerControls);
 function setRollBusy(value){busy=value;for(const button of roller.querySelectorAll('button'))button.disabled=value||!ready;}
 function rollLabel(button){const es=document.documentElement.lang==='es';const prop=PROPS.find(p=>p.id===button?.dataset.id);return prop?prop.objectName[es?'es':'en']:button?message(button.dataset.label):(es?'Todo':'All');}
 function updateRoll(direction=0){let index=selected?options.findIndex(b=>b?.dataset.id===selected.id):0;if(index<0)index=0;roller.querySelector('[data-mobile-roll-neighbor="prev"]').textContent=rollLabel(options[(index-1+options.length)%options.length]);roller.querySelector('[data-mobile-roll-neighbor="next"]').textContent=rollLabel(options[(index+1)%options.length]);const current=roller.querySelector('[data-mobile-roll-current]');rollTween?.kill();current.textContent=rollLabel(options[index]);if(direction&&!reduced)rollTween=gsap.fromTo(current,{y:direction*12,opacity:0},{y:0,opacity:1,duration:.4,ease:'power3.out'});}
 function step(direction){if(busy||!ready)return;const index=selected?Math.max(0,options.findIndex(b=>b?.dataset.id===selected.id)):0;const next=options[(index+direction+options.length)%options.length];rollDirection=direction;if(next)next.click();else getScene()?.reset();}
 on(q('[data-mobile-roll-prev]'),'click',()=>step(-1));on(q('[data-mobile-roll-next]'),'click',()=>step(1));
 on(roller,'keydown',event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();step(event.key==='ArrowUp'?-1:1);}});
 function rollLanguage(){const es=document.documentElement.lang==='es';roller.setAttribute('aria-label',es?'Explorar modelos':'Explore models');q('[data-mobile-roll-prev]').setAttribute('aria-label',es?'Modelo anterior':'Previous model');q('[data-mobile-roll-next]').setAttribute('aria-label',es?'Modelo siguiente':'Next model');updateRoll();}
 on(window,'leo:language-change',rollLanguage);rollLanguage();

 function setOpen(value){
  if(targetOpen===value&&panelTimeline?.isActive())return panelTimeline;
  if(open===value&&targetOpen===value&&!panelTimeline?.isActive())return;
  targetOpen=value;panelTimeline?.kill();framing?.kill();
  toggle.disabled=true;
  chrome.forEach(node=>{node.inert=true;node.setAttribute('aria-hidden','true');});
  const state={value:panelProgress};
  const commit=()=>{
    open=value;syncViewerControls();section.toggleAttribute('data-mobile-panel-open',open);
    panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));
    toggle.setAttribute('aria-expanded',String(open));
    const es=document.documentElement.lang==='es';
    toggle.setAttribute('aria-label',open?(es?'Ocultar información':'Hide information'):(es?'Mostrar información':'Show information'));
    toggle.textContent=open?'←':'→';
    section.dataset.mobilePanelPhase=open?'opening':'closing';
  };
  // Only these controls consume progress; keep it out of the section's subtree.
  const update=()=>{panelProgress=state.value;const progress=String(panelProgress);toggle.style.setProperty('--mobile-panel-progress',progress);statusChrome.style.setProperty('--mobile-panel-progress',progress);getScene()?.setPanelOffset(panelWidth/innerWidth/2*panelProgress);};
  const finish=()=>{
    toggle.disabled=false;section.dataset.mobilePanelPhase=value?'open':'closed';
    if(!value){chrome.forEach(node=>{node.inert=false;node.removeAttribute('aria-hidden');});syncViewerControls();}
  };
  panelTimeline=gsap.timeline({onComplete:finish});
  if(reduced){
    gsap.set(chrome,{autoAlpha:value?0:1});
    gsap.set(dial,{scale:1,clipPath:'circle(75% at 50% 50%)'});
    gsap.set(hints.children,{opacity:1,y:0});commit();state.value=value?1:0;update();finish();return panelTimeline;
  }
  if(value){
    section.dataset.mobilePanelPhase='clearing';
    panelTimeline.to(statusChrome,{autoAlpha:0,y:-10,duration:.28,ease:'power2.in'},0)
      .to(hints.children,{opacity:0,y:8,duration:.22,stagger:.035,ease:'power2.in'},0)
      .to(hints,{autoAlpha:0,duration:.2},.1)
      .to(dial,{autoAlpha:0,scale:.78,clipPath:'circle(0% at 50% 50%)',duration:.36,ease:'power3.inOut'},0)
      .to(roller,{autoAlpha:0,duration:.2},0)
      .call(commit,[],.4)
      .to(state,{value:1,duration:.7,ease:'power3.inOut',onUpdate:update},.4);
  }else{
    panelTimeline.call(commit)
      .to(state,{value:0,duration:.7,ease:'power3.inOut',onUpdate:update})
      .to(statusChrome,{autoAlpha:1,y:0,duration:.32,ease:'power3.out'},.74)
      .to(hints,{autoAlpha:1,duration:.2},.74)
      .to(hints.children,{opacity:1,y:0,duration:.32,stagger:.045,ease:'power3.out'},.74)
      .to(dial,{autoAlpha:1,scale:1,clipPath:'circle(75% at 50% 50%)',duration:.42,ease:'power3.out'},.74)
      .to(roller,{autoAlpha:1,duration:.3},.74);
  }
  return panelTimeline;
 }
 on(toggle,'click',()=>{version++;clearTimeout(timer);setOpen(!targetOpen)});
 on(q('[data-mobile-3d-reset]'),'click',()=>getScene()?.reset());
 function render(item){selected=item;bio.hidden=!!item;selection.hidden=!item;if(!item)return;const prop=PROPS.find(p=>p.id===item.id);q('[data-mobile-3d-title]').textContent=message(item.label);q('[data-mobile-3d-description]').textContent=prop?.text||characters[item.id]||item.description||'';const img=q('[data-mobile-3d-image]');img.src=prop?.image||'/about/img/'+item.id+'.webp';img.alt=item.label;img.hidden=false;}
 function select(item){
  selected=item;setRollBusy(true);updateRoll(rollDirection);rollDirection=0;
  const token=++version;clearTimeout(timer);animation?.kill();
  if(open&&targetOpen){
    const previous=bio.hidden?selection:bio;
    animation=gsap.to(previous,{opacity:reduced?1:0,y:reduced?0:-8,duration:reduced?0:.2,ease:'power2.in',onComplete:()=>{
      if(token!==version)return;
      gsap.set([bio,selection],{clearProps:'opacity,transform'});render(item);
      if(!reduced)animation=gsap.fromTo(item?selection:bio,{opacity:0,y:12},{opacity:1,y:0,duration:.45,ease:'power3.out'});
    }});
  }else{
    render(item);const opening=setOpen(true);
    if(!reduced)opening?.fromTo(item?selection:bio,{opacity:0,y:12},{opacity:1,y:0,duration:.5,ease:'power3.out'},.4);
  }
 }
 const fitHeading=()=>{const line=title.querySelector('span');line.style.transform='none';line.style.transform=`scaleX(${Math.min(1,(title.clientWidth-36)/line.scrollWidth)})`;};
 const language=new MutationObserver(fitHeading);language.observe(title,{subtree:true,childList:true,characterData:true});
 const resize=new ResizeObserver(()=>{panelWidth=panel.offsetWidth;fitHeading();getScene()?.setPanelOffset(open?panelWidth/innerWidth/2:0)});resize.observe(panel);
 on(q('[data-mobile-3d-image]'),'error',()=>q('[data-mobile-3d-image]').hidden=true);
 return {select,enter(){},ready(interactive){ready=interactive>0;const choices=[...q('[data-explore]').querySelectorAll('button')];options=[null,...choices.filter(b=>b.dataset.id==='laptop'),...choices.filter(b=>!['laptop','morena'].includes(b.dataset.id)),...choices.filter(b=>b.dataset.id==='morena')];updateRoll();setRollBusy(false);clearTimeout(timer);const schedule=()=>{timer=setTimeout(()=>{if(version||!ready)return;const opening=setOpen(true);if(!reduced)opening?.fromTo(bio.children,{opacity:0,y:14},{opacity:1,y:0,duration:.65,stagger:.1,ease:'power3.out'},.4);},reduced?0:1800);};if(document.documentElement.hasAttribute('data-page-transition'))on(window,'leo:page-reveal',schedule,{once:true});else schedule();if(!ready)setOpen(true);},status(text){section.toggleAttribute('data-mobile-3d-busy',/Loading|Preparing|Inspecting|Opening/i.test(text));if(/unavailable|could not/i.test(text)&&!ready)setOpen(true);},settled(){section.removeAttribute('data-mobile-3d-busy');setRollBusy(false);},pause(){},zoom(){},clock(){},dispose(){version++;clearTimeout(timer);animation?.kill();framing?.kill();panelTimeline?.kill();gsap.set([...chrome,roller,...hints.children],{clearProps:'opacity,visibility,transform,clipPath'});chrome.forEach(node=>{node.inert=false;node.removeAttribute('aria-hidden');});delete section.dataset.mobilePanelPhase;rollTween?.kill();resize.disconnect();language.disconnect();moves.reverse().forEach(f=>f());bio.replaceChildren();section.removeAttribute('data-mobile-3d');section.removeAttribute('data-mobile-panel-open');section.style.removeProperty('--mobile-panel-progress');toggle.style.removeProperty('--mobile-panel-progress');statusChrome.style.removeProperty('--mobile-panel-progress');}};
}
