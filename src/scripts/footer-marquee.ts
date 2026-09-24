import { glyphs } from './footer-glyphs';

export const MARQUEE_VIEW = { height: 200, top: -32 };
export const FOOTER_MOTION = { speed: 100, expansion: 145, response: 7, gap: 110 };
const NS = 'http://www.w3.org/2000/svg';
export function initFooterMarquee(host: HTMLElement) {
  const svg = host.querySelector<SVGSVGElement>('[data-marquee-svg]')!;
  const track = svg.querySelector<SVGGElement>('[data-marquee-track]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const abort = new AbortController();
  const signal = abort.signal;

function updateGlassColors() {
  const dark = document.documentElement.dataset.theme === 'dark';

  const colors = dark
    ? [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    : [[0, 1, 1], [1, 0, 1], [1, 1, 0]];

  host.querySelectorAll<SVGFilterElement>(
    'filter[id^="footer-refraction-"]'
  ).forEach(filter => {
    ['r', 'g', 'b'].forEach((channel, index) => {
      const [r, g, b] = colors[index];

      filter.querySelector(`[result="${channel}"]`)?.setAttribute(
        'values',
        `0 0 0 ${r} 0
         0 0 0 ${g} 0
         0 0 0 ${b} 0
         0 0 0 1 0`
      );
    });

    filter.querySelectorAll('feBlend').forEach(blend => {
      blend.setAttribute('mode', dark ? 'screen' : 'multiply');
    });
  });
}

const glassThemeObserver = new MutationObserver(updateGlassColors);

glassThemeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});

updateGlassColors();

  const period = 1242.8 + FOOTER_MOTION.gap;
  let viewWidth = 1400, phase = -35, velocity = 1, active = -1, hovered = false;
  let visible = false, raf = 0, previous = 0, anchor = 0;
  const amounts = glyphs.map(() => 0);
  const copies: {group: SVGGElement; paths: SVGPathElement[]}[] = [];
  function pathData(index: number, amount: number) {
    const g = glyphs[index];
    if (g.id === 'N') {
      const l=454.7-amount/2, r=564.9+amount/2, s=24.4;
      const dx=r-l-s, dy=131.4;
      // Keep the perpendicular thickness of the diagonal as its angle changes.
      const t=24.4*Math.hypot(dx,dy)/Math.hypot(85.8,dy);
      return `M${l} 133.6V2.2H${l+t}L${r-s} 94.1V2.2H${r}V133.6H${r-t}L${l+s} 41.8V133.6Z`;
    }
    let cursor=0;
    return g.commands.map(command => {
      const count=command==='C'?6:command==='Z'?0:2;
      const coords=g.base.slice(cursor,cursor+count).map((v,j)=>(v+g.offsets[cursor+j]*amount).toFixed(3));
      cursor+=count; return command+coords.join(' ');
    }).join('');
  }
  function resize() {
    const height=Math.max(1,host.clientHeight);
    viewWidth=host.clientWidth/height*MARQUEE_VIEW.height;
    svg.setAttribute('viewBox',`0 ${MARQUEE_VIEW.top} ${viewWidth} ${MARQUEE_VIEW.height}`);
    const count=Math.ceil(viewWidth/period)+4;
    while(copies.length<count){
      const group=document.createElementNS(NS,'g');
      const paths=glyphs.map((g,i)=>{
        const path=document.createElementNS(NS,'path');path.dataset.letter=g.id;
        path.setAttribute('d',pathData(i,0));group.append(path);return path;
      });
      track.append(group);copies.push({group,paths});
    }
    draw();
  }
  let shapeKey='';
  function draw() {
    const total=amounts.reduce((a,b)=>a+b,0), cycle=period+total;

    const key=amounts.map(a=>a.toFixed(3)).join(',')+':'+copies.length;
    const changed=key!==shapeKey;shapeKey=key;
    const paths=changed?glyphs.map((_,i)=>pathData(i,amounts[i])):[];
    for(let k=0;k<copies.length;k++){
      copies[k].group.setAttribute('transform',`translate(${phase+(k-1)*cycle-total/2} 0)`);
      let offset=0;
      if(changed)glyphs.forEach((_,i)=>{
        const a=amounts[i];
        copies[k].paths[i].setAttribute('d',paths[i]);
        copies[k].paths[i].setAttribute('transform',`translate(${offset+a/2} 0)`);
        offset+=a;
      });
    }
  }
  function frame(now:number){
    raf=0;if(!visible||document.hidden||reduced.matches)return;
    const dt=Math.min((now-(previous||now))/1000,.04);previous=now;
    const ease=1-Math.exp(-FOOTER_MOTION.response*dt);
    velocity+=((hovered?0:1)-velocity)*ease;
    // Compensate the active copy so expansion pushes equally left and right.
    const oldCycle=period+amounts.reduce((a,b)=>a+b,0);

    amounts.forEach((a,i)=>amounts[i]=a+((i===active?FOOTER_MOTION.expansion:0)-a)*ease);
    const cycle=period+amounts.reduce((a,b)=>a+b,0);
    phase-=anchor*(cycle-oldCycle)+FOOTER_MOTION.speed*velocity*dt;
    if(!hovered && amounts.every(a=>a<.01)){phase=((phase%cycle)+cycle)%cycle-cycle;anchor=0;}
    draw();raf=requestAnimationFrame(frame);
  }
  function start(){if(!raf&&visible&&!document.hidden&&!reduced.matches){previous=0;raf=requestAnimationFrame(frame);}}
  function stop(){cancelAnimationFrame(raf);raf=0;previous=0;}
  host.addEventListener('pointermove',event=>{
    if(!fine.matches||reduced.matches)return;
    hovered=true;
    // Bounding boxes include the inner voids (the O is interactive in its centre).
    if(active>=0){
      const inside=copies.some(c=>{const b=c.paths[active].getBoundingClientRect();return event.clientX>=b.left-4&&event.clientX<=b.right+4;});
      if(inside)return;
    }
    let found=-1;
    copies.forEach((c,k)=>c.paths.forEach((p,i)=>{const b=p.getBoundingClientRect();if(event.clientX>=b.left&&event.clientX<=b.right){found=i;anchor=k-1;}}));
    active=found;
  },{signal});
  host.addEventListener('pointerleave',()=>{hovered=false;active=-1;},{signal});
  host.addEventListener('focusin',()=>{hovered=true;},{signal});
  host.addEventListener('focusout',()=>{hovered=false;active=-1;},{signal});
  reduced.addEventListener('change',()=>{stop();amounts.fill(0);active=-1;draw();start();},{signal});
  document.addEventListener('visibilitychange',()=>{stop();start();},{signal});
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();});observer.observe(host);
  resize();
  return () => { stop(); abort.abort(); glassThemeObserver.disconnect(); resizeObserver.disconnect(); observer.disconnect(); track.replaceChildren(); };
}
