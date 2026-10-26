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

 function setOpen(value){open=value;syncViewerControls();section.toggleAttribute('data-mobile-panel-open',open);panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Hide information':'Show information');toggle.textContent=open?'←':'→';
  framing?.kill();const state={value:parseFloat(section.style.getPropertyValue('--mobile-panel-progress'))||0};framing=gsap.to(state,{value:open?1:0,duration:reduced?0:.7,ease:'power3.inOut',onUpdate:()=>{section.style.setProperty('--mobile-panel-progress',String(state.value));getScene()?.setPanelOffset(panel.offsetWidth/innerWidth/2*state.value);}});
 }
 on(toggle,'click',()=>{version++;clearTimeout(timer);setOpen(!open)});
 on(q('[data-mobile-3d-reset]'),'click',()=>getScene()?.reset());
 function render(item){selected=item;bio.hidden=!!item;selection.hidden=!item;if(!item)return;const prop=PROPS.find(p=>p.id===item.id);q('[data-mobile-3d-title]').textContent=message(item.label);q('[data-mobile-3d-description]').textContent=prop?.text||characters[item.id]||item.description||'';const img=q('[data-mobile-3d-image]');img.src=prop?.image||'/about/img/'+item.id+'.webp';img.alt=item.label;img.hidden=false;}
 function select(item){selected=item;setRollBusy(true);updateRoll(rollDirection);rollDirection=0;const token=++version;clearTimeout(timer);animation?.kill();const show=()=>{if(token!==version)return;render(item);setOpen(true);if(!reduced)animation=gsap.fromTo(item?selection:bio,{opacity:0,y:12},{opacity:1,y:0,duration:.55,ease:'power3.out'});};if(open){setOpen(false);timer=setTimeout(show,reduced?0:650)}else show();}
 const fitHeading=()=>{const line=title.querySelector('span');line.style.transform='none';line.style.transform=`scaleX(${Math.min(1,(title.clientWidth-36)/line.scrollWidth)})`;};
 const language=new MutationObserver(fitHeading);language.observe(title,{subtree:true,childList:true,characterData:true});
 const resize=new ResizeObserver(()=>{fitHeading();getScene()?.setPanelOffset(open?panel.offsetWidth/innerWidth/2:0)});resize.observe(panel);
 on(q('[data-mobile-3d-image]'),'error',()=>q('[data-mobile-3d-image]').hidden=true);
 return {select,enter(){},ready(interactive){ready=interactive>0;const choices=[...q('[data-explore]').querySelectorAll('button')];options=[null,...choices.filter(b=>b.dataset.id==='laptop'),...choices.filter(b=>!['laptop','morena'].includes(b.dataset.id)),...choices.filter(b=>b.dataset.id==='morena')];updateRoll();setRollBusy(false);clearTimeout(timer);timer=setTimeout(()=>{if(version||!ready)return;setOpen(true);if(!reduced)animation=gsap.fromTo(bio.children,{opacity:0,y:14},{opacity:1,y:0,duration:.65,stagger:.1,ease:'power3.out'});},reduced?0:1800);if(!ready)setOpen(true);},status(text){section.toggleAttribute('data-mobile-3d-busy',/Loading|Preparing|Inspecting|Opening/i.test(text));if(/unavailable|could not/i.test(text)&&!ready)setOpen(true);},settled(){section.removeAttribute('data-mobile-3d-busy');setRollBusy(false);},pause(){},zoom(){},clock(){},dispose(){version++;clearTimeout(timer);animation?.kill();framing?.kill();rollTween?.kill();resize.disconnect();language.disconnect();moves.reverse().forEach(f=>f());bio.replaceChildren();section.removeAttribute('data-mobile-3d');section.removeAttribute('data-mobile-panel-open');section.style.removeProperty('--mobile-panel-progress');}};
}
