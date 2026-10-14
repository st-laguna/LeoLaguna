// Geometry and easing from public/icons/logo_loader.html; owned by About's
// existing pre-paint gate, never by the scene's asset-loading lifecycle.
(() => {
  const root = document.documentElement;
  const overlay = document.querySelector('.about-loading-indicator');
  if (!overlay || root.hasAttribute('data-about-mobile') || !root.hasAttribute('data-about-loading')) return;
  const logo = overlay.querySelector('[data-loader-logo]');
  const stems = [...overlay.querySelectorAll('[data-loader-stem]')];
  const feet = [...overlay.querySelectorAll('[data-loader-foot]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const on = (target, type, callback) => target.addEventListener(type, callback, {signal:events.signal});
  const CX = 2566.45, CY = 1665.75, FULL = 5132.9;
  const kl = 1172.9/1961.3, kr = 1175.2/1961.3, ks = (kl+kr)/2;
  const xl = y => 1172.9-kl*y, xr = y => 2418-kr*y;
  const clamp = x => Math.max(0, Math.min(1, x));
  function bez(x1,y1,x2,y2) {
    const cx=3*x1, bx=3*(x2-x1)-cx, ax=1-cx-bx;
    const cy=3*y1, by=3*(y2-y1)-cy, ay=1-cy-by;
    const X=t=>((ax*t+bx)*t+cx)*t, Y=t=>((ay*t+by)*t+cy)*t;
    return x => {
      if(x<=0)return 0;if(x>=1)return 1;
      let lo=0, hi=1, t=x;
      for(let i=0;i<24;i++){if(X(t)<x)lo=t;else hi=t;t=(lo+hi)/2;}
      return Y(t);
    };
  }
  const easeIn=bez(.42,0,.06,1), easeOut=bez(.7,0,.84,0);
  // Preserve a readable assembly and complete-logo hold before exiting.
  // A slower About keeps the assembled logo still, without a RAF.
  const entryDuration=1400, holdDuration=400, exitDuration=650;
  const timings=[[0,1.8],[.5,2.1],[1.4,1.8],[1.95,2.1]];
  let geometry, values, exitValues, frame=0, exiting=false, disposed=false;
  const started=performance.now();
  let exitStarted=0, finishTimer=0, exitWipe;
  function layout(){
    const W=innerWidth,H=innerHeight,s=60/FULL,hw=W/(2*s),hh=H/(2*s),m=1800;
    logo.setAttribute('transform',`translate(${W/2} ${H/2}) scale(${s}) translate(${-CX} ${-CY})`);
    geometry={ys:Math.max(CY-hh-m,(1795.45-(CX+hw+m))/ks),ye:Math.min(CY+hh+m,(1795.45-CX+hw+m)/ks),fs:CX-hw-m-2899.7,fe:CX+hw+m-717.7};
  }
  function draw(v){
    values=v;
    const [y2,y1,head,tail]=v;
    const sp=`${xl(y1)},${y1} ${xr(y1)},${y1} ${xr(y2)},${y2} ${xl(y2)},${y2}`;
    const fp=`${1242.8+tail},1961.3 ${2899.7+head},1961.3 ${2377.3+head},2846.1 ${717.7+tail},2846.1`;
    stems.forEach(p=>p.setAttribute('points',sp));feet.forEach(p=>p.setAttribute('points',fp));
  }
  function cancel(){cancelAnimationFrame(frame);frame=0;}
  function dispose(){
    if(disposed)return;disposed=true;cancel();clearTimeout(finishTimer);events.abort();observer.disconnect();
    exitWipe?.cancel();
    overlay.removeAttribute('data-loader-visible');
  }
  function loaderFrame(now){
    frame=0;
    if(disposed||document.hidden)return;
    if(exiting){
      const t=clamp((now-exitStarted)/exitDuration);
      const targets=[geometry.ye,geometry.ye,geometry.fe,geometry.fe];
      draw(exitValues.map((v,i)=>v+(targets[i]-v)*easeOut(clamp((t-i*.045)/(1-i*.045)))));
      // The opaque cover is removed geometrically by the shared wipe.
      if(t>=1){dispose();return;}
    }else{
      const t=clamp((now-started)/entryDuration)*4.05;
      const from=[geometry.ys,geometry.ys,geometry.fs,geometry.fs],to=[1961.3,0,0,0];
      draw(from.map((v,i)=>v+(to[i]-v)*easeIn((t-timings[i][0])/timings[i][1])));
      if(t>=4.05)return;
    }
    frame=requestAnimationFrame(loaderFrame);
  }
  function finish(){
    if(disposed||exiting)return;
    clearTimeout(finishTimer);
    if(motion.matches||document.hidden||root.hasAttribute('data-about-mobile')){dispose();return;}
    const remaining=started+entryDuration+holdDuration-performance.now();
    if(remaining>0){finishTimer=setTimeout(finish,remaining);return;}
    cancel();
    exiting=true;exitStarted=performance.now();exitValues=[...values];
    exitWipe=overlay.animate(window.__aboutLoaderWipeFrames,{duration:exitDuration,fill:'both'});
    frame=requestAnimationFrame(loaderFrame);
  }
  const observer=new MutationObserver(()=>{
    if(root.hasAttribute('data-about-mobile'))dispose();
    else if(!root.hasAttribute('data-about-loading'))finish();
  });
  overlay.dataset.loaderTheme=root.dataset.theme||'dark';
  overlay.setAttribute('aria-label',root.lang==='es'?'Cargando':'Loading');
  overlay.setAttribute('data-loader-visible','');
  layout();
  draw([1961.3,0,0,0]);
  observer.observe(root,{attributes:true,attributeFilter:['data-about-loading','data-about-mobile']});
  on(window,'resize',()=>{layout();if(!exiting&&!motion.matches&&!document.hidden){cancel();loaderFrame(performance.now());}});
  on(motion,'change',()=>{cancel();if(exiting)dispose();else if(motion.matches){draw([1961.3,0,0,0]);if(!root.hasAttribute('data-about-loading'))finish();}else if(!document.hidden)loaderFrame(performance.now());});
  on(document,'visibilitychange',()=>{cancel();if(exiting)dispose();else if(!document.hidden&&!motion.matches)loaderFrame(performance.now());});
  on(window,'pagehide',()=>{dispose();root.removeAttribute('data-about-loading');});
  if(!motion.matches&&!document.hidden)loaderFrame(started);
})();
