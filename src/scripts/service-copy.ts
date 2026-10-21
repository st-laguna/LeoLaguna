import {isMobileAbout} from './about/mobileAboutDevice.js';

type Dictionaries=Record<'en'|'es',Record<string,string>>;
const context=document.createElement('canvas').getContext('2d')!;
function baseline(style:CSSStyleDeclaration,size:number,lineHeight:number){
 const probe=document.createElement('div'),marker=document.createElement('span');
 Object.assign(probe.style,{position:'absolute',visibility:'hidden',pointerEvents:'none',left:'0',top:'0',padding:'0',border:'0',fontFamily:style.fontFamily,fontWeight:style.fontWeight,fontSize:`${size}px`,lineHeight:`${lineHeight}px`});
 probe.textContent='Hg';
 Object.assign(marker.style,{display:'inline-block',width:'0',height:'0',padding:'0',border:'0',verticalAlign:'baseline'});
 probe.append(marker);document.body.append(probe);
 const value=marker.getBoundingClientRect().top-probe.getBoundingClientRect().top;
 probe.remove();return value;
}
// The split is typography, not a second copy source. Every word comes from i18n.
function split(text:string,count=2){
 const words=text.split(' ');let lines=['',text],width=Infinity;
 for(let i=1;i<words.length;i++){
  const pair=[words.slice(0,i).join(' '),words.slice(i).join(' ')];
  if(count===3){
  const tail=split(pair[1]);
  if(tail.lines.every(Boolean))pair.splice(1,1,...tail.lines);else continue;
 }
 const next=Math.max(...pair.map(line=>context.measureText(line).width));
  if(next<width){width=next;lines=pair;}
 }
 return {lines,width};
}
export function fitDesktopServiceCopy(dictionaries:Dictionaries){
 const stack=document.querySelector<HTMLElement>('.projects-copy-stack');
 const number=document.querySelector<HTMLElement>('.projects-number');
 if(!stack||!number)return;
 const copies=Array.from(stack.querySelectorAll<HTMLElement>('.projects-copy'));
 if(isMobileAbout()){
  stack.style.removeProperty('--service-copy-height');stack.style.removeProperty('width');
  copies.forEach(copy=>{copy.style.removeProperty('--title-top');copy.style.removeProperty('--paragraph-top');});
  copies.forEach(copy=>{copy.querySelector<HTMLElement>('h2')!.style.removeProperty('font-size');copy.querySelector<HTMLElement>('h2')!.style.removeProperty('margin-bottom');copy.querySelector<HTMLElement>('p')!.style.removeProperty('font-size');});
  return;
 }
 // Use the space before the actual actions, rather than a fixed 180px reserve.
 const actions=document.querySelector<HTMLElement>('.projects-actions');
 if(actions&&stack.clientWidth){
  const available=actions.getBoundingClientRect().left-stack.getBoundingClientRect().left-16;
  if(available>0)stack.style.width=`${available}px`;
 }
 const width=stack.clientWidth;if(!width)return;
 const headingStyle=getComputedStyle(copies[0].querySelector('h2')!);
 const paragraphStyle=getComputedStyle(copies[0].querySelector('p')!);
 // Preserve the desktop title/paragraph hierarchy with one shared scale for EN + ES.
 const ratio=Math.min(62,Math.max(26,innerWidth*.0245))/((innerWidth<=1600||innerHeight<=850)?11:Math.min(16,Math.max(11,innerWidth*.0068)));
 const titleLine=1.04,paragraphLine=1.3,gapRatio=.73;
 const numberStyle=getComputedStyle(number);
 const numberHeight=parseFloat(numberStyle.lineHeight);
 context.font=`${numberStyle.fontWeight} ${numberStyle.fontSize} ${numberStyle.fontFamily}`;
 const numberInk=context.measureText('01234');
 const numberBaseline=baseline(numberStyle,parseFloat(numberStyle.fontSize),numberHeight);
 const inkTop=numberBaseline-numberInk.actualBoundingBoxAscent;
 const inkBottom=numberBaseline+numberInk.actualBoundingBoxDescent;
 stack.style.setProperty('--service-copy-height',`${numberHeight}px`);
 // Align actual glyph bounds, not line boxes with different font metrics.
 const targetHeight=numberHeight*1.10;
 let size=targetHeight/(ratio*titleLine+2*paragraphLine+gapRatio);
 let maxLine=0,maxTitle=0,maxTitleInk=0,maxParagraphInk=0;
 for(const dictionary of Object.values(dictionaries))for(let i=1;i<=4;i++){
  context.font=`${paragraphStyle.fontWeight} 100px ${paragraphStyle.fontFamily}`;
  const paragraphText=dictionary[`projects.desktop.0${i}.description`];
  maxLine=Math.max(maxLine,split(paragraphText).width/100);
  const paragraphInk=context.measureText(paragraphText);
  maxParagraphInk=Math.max(maxParagraphInk,(paragraphInk.actualBoundingBoxAscent+paragraphInk.actualBoundingBoxDescent)/100);
  context.font=`${headingStyle.fontWeight} 100px ${headingStyle.fontFamily}`;
  const titleInk=context.measureText(dictionary[`projects.desktop.0${i}.title`]);
  maxTitle=Math.max(maxTitle,titleInk.width/100);
  maxTitleInk=Math.max(maxTitleInk,(titleInk.actualBoundingBoxAscent+titleInk.actualBoundingBoxDescent)/100);
 }
 size=Math.min(size,(width-2)/maxLine,(width-2)/(maxTitle*ratio),(inkBottom-inkTop)/(maxTitleInk*ratio+paragraphLine+maxParagraphInk+.5));
 // Size text for reading; let its band grow when number ink is too short.
 size=Math.max(size,Math.min(16,Math.max(12,innerWidth*.0068)));
 const lineCount=maxLine*size>width-2?3:2;
 const paragraphSpan=(lineCount-1)*paragraphLine;
 const titleSize=Math.min(size*ratio,(width-2)/maxTitle,Math.max(18,(inkBottom-inkTop-size*(paragraphSpan+maxParagraphInk+.5))/maxTitleInk));
 const copyInkHeight=Math.max(inkBottom-inkTop,titleSize*maxTitleInk+size*(paragraphSpan+maxParagraphInk+.5));
 const copyBottom=inkTop+copyInkHeight;
 stack.style.setProperty('--service-copy-height',`${numberHeight+copyInkHeight-(inkBottom-inkTop)}px`);
 const paragraphBaseline=baseline(paragraphStyle,size,size*paragraphLine);
 const titleBaseline=baseline(headingStyle,titleSize,titleSize*titleLine);
 const dictionary=dictionaries[document.documentElement.lang==='es'?'es':'en'];
 copies.forEach((copy,i)=>{
  const heading=copy.querySelector<HTMLElement>('h2')!,paragraph=copy.querySelector<HTMLElement>('p')!;
  heading.style.fontSize=`${titleSize}px`;heading.style.marginBottom='0px';
  paragraph.style.fontSize=`${size}px`;
  context.font=`${paragraphStyle.fontWeight} ${size}px ${paragraphStyle.fontFamily}`;
  const text=split(dictionary[`projects.desktop.0${i+1}.description`],lineCount).lines.join('\n');
  if(paragraph.textContent!==text)paragraph.textContent=text;
  const lastLine=context.measureText(text.split('\n')[lineCount-1]);

  copy.style.setProperty('--paragraph-top',`${copyBottom-size*paragraphSpan-paragraphBaseline-lastLine.actualBoundingBoxDescent}px`);
  context.font=`${headingStyle.fontWeight} ${titleSize}px ${headingStyle.fontFamily}`;
  const titleInk=context.measureText(dictionary[`projects.desktop.0${i+1}.title`]);

  copy.style.setProperty('--title-top',`${inkTop-titleBaseline+titleInk.actualBoundingBoxAscent}px`);
 });
}