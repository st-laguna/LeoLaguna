// Localized, temporary enhancement of the first masked Hero image.
// Codrops technique: persistent displacement grid sampled by an image shader.
// A tiny CPU-updated texture avoids extra GPU simulation passes/render targets.
export function mountHeroDistortion(hero: HTMLElement) {
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const mouse = matchMedia('(any-hover:hover) and (any-pointer:fine)');
  const coarse = matchMedia('(pointer:coarse)');
  const nav = navigator as Navigator & {deviceMemory?:number;connection?:{saveData?:boolean}};
  const ua = navigator.userAgent;
  const touch = navigator.maxTouchPoints > 0;
  const ipad = document.documentElement.hasAttribute('data-ipad') || /iPad/.test(ua) || (/Macintosh/.test(ua) && touch);
  const mobile = !ipad && (/Android.*Mobile|iPhone|iPod/.test(ua) ||
    (touch && coarse.matches && Math.min(screen.width,screen.height) <= 600));
  const tablet = ipad || (touch && document.documentElement.hasAttribute('data-tablet-portrait')) ||
    (/Android/.test(ua) && !/Mobile/.test(ua)) || (touch && coarse.matches && !mobile);
  const limited = (nav.deviceMemory !== undefined && nav.deviceMemory < 4) ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency < 4) || !!nav.connection?.saveData;
  const full = !tablet && mouse.matches && !limited;
  const maxDisplacement = full ? .085 : .018;
  const force = full ? .5 : .2;
  let ended = false, initial = true, visible = true, loading = false, generation = 0, covered=false;
  let release: (() => void) | undefined;
  let resume: (() => void) | undefined;
  let pause: (() => void) | undefined;
  let strength=1;
  let selectedSource='';
  let recoveryTimer:ReturnType<typeof setTimeout>|undefined;
  let recoveryAttempts=0;
  let unavailable=false;
  const currentImage=()=>hero.querySelector<HTMLImageElement>(document.documentElement.dataset.theme==='dark'?'.hero__image--dark':'.hero__image--light')!;
  let updateStrength: (()=>void) | undefined;
  const events = new AbortController();
  const { signal } = events;
  function deactivate() {
    generation++; loading=false;clearTimeout(recoveryTimer);recoveryTimer=undefined;
    release?.(); release = resume = pause = undefined; updateStrength=undefined;
  }
  function finish() {
    if (ended) return;
    ended = true;
    events.abort(); observer.disconnect(); themeObserver.disconnect();
    deactivate();
  }
  function sync() {
    if (ended || !initial || unavailable) return;
    if (reduced.matches || mobile || (!tablet && !mouse.matches)) { deactivate(); return; }
    if (!visible || document.hidden || covered) { pause?.(); return; }
    if (resume) resume(); else void init();
  }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  observer.observe(hero);
  // Keep the existing theme wipe entirely owned by the original images.
  const themeObserver = new MutationObserver(() => { unavailable=false;recoveryAttempts=0;deactivate(); sync(); });
  themeObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
  reduced.addEventListener('change', sync, { signal });
  mouse.addEventListener('change', sync, { signal });
  document.addEventListener('visibilitychange', sync, { signal });
  window.addEventListener('leo:section-cover',()=>{covered=true;sync();},{signal});
  window.addEventListener('leo:section-reveal',()=>{covered=false;sync();},{signal});
  window.addEventListener('pagehide', event => { if(event.persisted) pause?.(); else finish(); }, { signal });
  window.addEventListener('pageshow', event => { if(event.persisted) sync(); }, { signal });
  function sourceChanged(){
    if(ended||!initial)return;
    if(currentImage().currentSrc && currentImage().currentSrc!==selectedSource){
      unavailable=false;recoveryAttempts=0;deactivate();sync();
    }
  }
  hero.addEventListener('load',event=>{if(event.target===currentImage())sourceChanged();},{signal,capture:true});
  window.addEventListener('resize',sourceChanged,{signal,passive:true});

  async function init() {
    if (loading || ended) return;
    loading = true;
    const token=++generation;
    const theme=document.documentElement.dataset.theme;
    const image=currentImage();
    selectedSource=image.currentSrc;
    try {
      await image.decode();
      if (token!==generation || ended || !initial) return;
      if (!visible || document.hidden) { loading=false; return; }
      // Do not upload the responsive DOM img: naturalWidth is density-corrected
      // by srcset and can exceed the selected file's actual decoded pixel size.
      selectedSource=image.currentSrc;
      const decoded=new Image();
      decoded.decoding='async';decoded.src=selectedSource;
      await decoded.decode();
      if(token!==generation || ended || !initial)return;
      if(image.currentSrc!==selectedSource){loading=false;sourceChanged();return;}
      const THREE = await import('three');
      if (token!==generation || ended || !initial) return;
      if (!visible || document.hidden) { loading=false; return; }
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden','true');
      canvas.dataset.heroDistortion = '';
      canvas.className = image.className;
      image.getAttributeNames().filter(name=>name.startsWith('data-astro-cid-')).forEach(name=>canvas.setAttribute(name,''));
      canvas.style.pointerEvents = 'none';
      Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'fill'});
      // Probe first so unsupported devices quietly retain the normal image.
      const context = canvas.getContext('webgl2', { alpha:false, antialias:false, powerPreference:full?'high-performance':'low-power' });
      if (!context) { loading=false;unavailable=true;return; }
      const renderer = new THREE.WebGLRenderer({canvas, context, alpha:false, antialias:false});
      release=()=>{renderer.dispose();renderer.forceContextLoss();canvas.remove();};
      renderer.setPixelRatio(Math.min(devicePixelRatio, full ? 1.5 : 1));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,2);
      camera.position.z = 1;
      const size = full ? 48 : 24;
      canvas.dataset.distortionProfile = tablet ? 'tablet' : full ? 'desktop' : 'light';
      // Convert the base sample to monochrome in the shader before splitting RGB.
      // A grayscale CSS filter after the shader would erase all chromatic separation.
      const mono = getComputedStyle(image).filter.includes('grayscale(1)');
      if(full) canvas.style.filter='none';
      const data = new Float32Array(size*size*4);
      const grid = new THREE.DataTexture(data,size,size,THREE.RGBAFormat,THREE.FloatType);
      grid.minFilter=grid.magFilter=THREE.LinearFilter;
      grid.needsUpdate=true;
      const texture = new THREE.Texture(decoded);
      texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true;
      const geometry = new THREE.PlaneGeometry(2,2);
      const material = new THREE.ShaderMaterial({
        defines:full?{HERO_RGB:1}:{},
        uniforms:{uImage:{value:texture},uGrid:{value:grid},uCover:{value:new THREE.Vector2(1,1)},uMono:{value:full&&mono?1:0},uMotion:{value:0},uStrength:{value:strength}},
        vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
        fragmentShader:`uniform sampler2D uImage; uniform sampler2D uGrid; uniform vec2 uCover;
          uniform float uMono; uniform float uMotion; uniform float uStrength; varying vec2 vUv;
          vec4 sampleImage(vec2 uv){vec4 color=texture2D(uImage,clamp(uv,vec2(.001),vec2(.999)));
            color.rgb=mix(color.rgb,vec3(dot(color.rgb,vec3(.2126,.7152,.0722))),uMono);return color;}
          void main(){vec2 displacement=texture2D(uGrid,vUv).rg*uStrength;
            vec2 uv=(vUv-.5)*uCover+.5+displacement*uCover;
            vec4 color=sampleImage(uv);
            #ifdef HERO_RGB
              vec2 split=displacement*uCover*.32*uMotion;
              color.r=sampleImage(uv+split).r;
              color.b=sampleImage(uv-split).b;
            #endif
            gl_FragColor=color;
            #include <colorspace_fragment>
          }`,
        depthTest:false,depthWrite:false,
      });
      scene.add(new THREE.Mesh(geometry,material));
      let frame=0, last=0, tracking=false, previous: {x:number;y:number;time:number} | undefined;
      let x=.5,y=.5,dx=0,dy=0;
      const originalVisibility=image.style.visibility;
      function stop(){cancelAnimationFrame(frame);frame=0;last=0;previous=undefined;dx=dy=0;
        if(tracking){window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerdown',start,true);window.removeEventListener('pointerup',leave,true);window.removeEventListener('pointercancel',leave,true);tracking=false;}}
      function draw(time:number){
        frame=0;if(ended||!visible||document.hidden||covered)return;
        const dt=Math.min(last?(time-last)/1000:1/60,.05);last=time;
        const decay=Math.exp(-dt*(full?2.7:3.3)),aspect=canvas.clientWidth/canvas.clientHeight;
        let energy=0;
        for(let j=0;j<size;j++)for(let i=0;i<size;i++){
          const k=(j*size+i)*4;
          const distance=Math.hypot((i/(size-1)-x)*aspect,j/(size-1)-y);
          const influence=Math.exp(-distance*distance/(2*.11*.11));
          data[k]=Math.max(-maxDisplacement,Math.min(maxDisplacement,data[k]*decay+dx*influence*dt*force));
          data[k+1]=Math.max(-maxDisplacement,Math.min(maxDisplacement,data[k+1]*decay+dy*influence*dt*force));
          energy=Math.max(energy,Math.abs(data[k]),Math.abs(data[k+1]));
        }
        const motion=material.uniforms.uMotion;
        const targetMotion=full?Math.min(1,Math.hypot(dx,dy)*1.4):0;
        motion.value+=(targetMotion-motion.value)*(1-Math.exp(-dt*(targetMotion>motion.value?16:5)));
        dx*=Math.exp(-dt*10);dy*=Math.exp(-dt*10);
        if(energy<.00002 && Math.abs(dx)+Math.abs(dy)<.00002 && motion.value<.00002){data.fill(0);last=0;}
        else frame=requestAnimationFrame(draw);
        grid.needsUpdate=true;renderer.render(scene,camera);
      }
      function wake(){if(!frame&&!ended&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
      function start(event:PointerEvent){previous=undefined;move(event);}
      function move(event:PointerEvent){
        if(event.pointerType!=='mouse' && !(tablet && ['touch','pen'].includes(event.pointerType)))return;
        // Capture at window, then gate by Hero bounds. Masks, overlays and inert
        // descendants cannot swallow input; no default gesture/scroll is prevented.
        const area=hero.getBoundingClientRect();
        if(event.clientX<area.left||event.clientX>area.right||event.clientY<area.top||event.clientY>area.bottom){leave();return;}
        const box=canvas.getBoundingClientRect();
        x=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width));
        y=1-Math.max(0,Math.min(1,(event.clientY-box.top)/box.height));
        if(previous){
          const dt=Math.max(.008,Math.min(.1,(event.timeStamp-previous.time)/1000));
          const limit=full?2:1;
          const vx=Math.max(-limit,Math.min(limit,(x-previous.x)/dt));
          const vy=Math.max(-limit,Math.min(limit,(y-previous.y)/dt));
          dx=dx*.35+vx*.65;dy=dy*.35+vy*.65;
        }
        previous={x,y,time:event.timeStamp};wake();
      }
      function leave(){previous=undefined;}
      const localEvents=new AbortController();
      let renderWidth=0,renderHeight=0;
      function resize(){
        const box=getComputedStyle(image);const width=parseFloat(box.width),height=parseFloat(box.height);if(!width||!height)return;
        if(width===renderWidth&&height===renderHeight)return;
        renderWidth=width;renderHeight=height;
        renderer.setSize(width,height,false);
        renderer.setViewport(0,0,canvas.width/renderer.getPixelRatio(),canvas.height/renderer.getPixelRatio());
        const container=width/height,source=decoded.naturalWidth/decoded.naturalHeight;
        material.uniforms.uCover.value.set(Math.min(container/source,1),Math.min(source/container,1));
        // Resizing clears WebGL's drawing buffer. Repaint in this same layout
        // callback, before Safari can composite an empty first image.
        renderer.render(scene,camera);
      }
      updateStrength=()=>{material.uniforms.uStrength.value=strength;wake();};
      const resizeObserver=new ResizeObserver(resize);
      release=()=>{stop();localEvents.abort();resizeObserver.disconnect();image.style.visibility=originalVisibility;
        geometry.dispose();material.dispose();texture.dispose();grid.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();};
      pause=stop;
      resume=()=>{if(tracking)return;window.addEventListener('pointermove',move,{passive:true,capture:true});window.addEventListener('pointerdown',start,{passive:true,capture:true});window.addEventListener('pointerup',leave,{passive:true,capture:true});window.addEventListener('pointercancel',leave,{passive:true,capture:true});tracking=true;wake();};
      canvas.addEventListener('webglcontextlost',event=>{
        event.preventDefault();
        if(token!==generation)return;
        deactivate();
        // Bound automatic recovery; unsupported/unstable GPUs retain the img.
        if(++recoveryAttempts<=2){recoveryTimer=setTimeout(()=>{recoveryTimer=undefined;sync();},100);}
        else unavailable=true;
      },{signal:localEvents.signal});
      image.parentElement!.append(canvas);resize();renderer.render(scene,camera);
      image.style.visibility='hidden';resizeObserver.observe(image);sync();
    } catch { if(token===generation){deactivate();unavailable=true;} }
  }
  sync();
  // Re-entering the initial masked state creates one fresh, temporary renderer.
  return {setInitialState(active:boolean,intensity=1){if(strength!==intensity){strength=intensity;updateStrength?.();}if(initial===active){if(active&&!resume&&!loading&&!recoveryTimer)sync();return;}initial=active;if(active){unavailable=false;recoveryAttempts=0;sync();}else deactivate();},dispose:finish};
}
