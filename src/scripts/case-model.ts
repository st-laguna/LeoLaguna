import en from '../i18n/en.json';
import es from '../i18n/es.json';
import * as THREE from 'three';
import gsap from 'gsap';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export function mountCaseModel(viewport:HTMLElement,bringIntoView:()=>void=()=>{}){
  const events=new AbortController(),signal=events.signal;
  const button=viewport.querySelector<HTMLButtonElement>('[data-explode]')!;
  const status=viewport.querySelector<HTMLElement>('[data-model-status]')!;
  const translated=(key:string)=>(document.documentElement.lang==='es'?es:en)[key as keyof typeof en]||key;
  function setStatus(key:string){status.dataset.i18n=key;status.textContent=translated(key);}
  const zoom=viewport.querySelector<HTMLInputElement>('[data-model-zoom]')!;
  const zoomSteps=Array.from(viewport.querySelectorAll<HTMLButtonElement>('[data-zoom-step]'));
  const zoomState={amount:0};let zoomMotion:gsap.core.Tween|undefined;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const scene=new THREE.Scene(),root=new THREE.Group();root.name='MODEL_ROOT';scene.add(root);
  const camera=new THREE.PerspectiveCamera(35,1,.05,100);
  camera.position.set(3,2.1,3.5);camera.lookAt(0,0,0);
  const viewDirection=camera.position.clone().normalize();
  const orbitCamera=camera.clone();
  let defaultDistance=4.6;
  const zoomRange=.55;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'default'});}
  catch{setStatus('model.unavailable');return()=>events.abort();}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.dataset.i18nAriaLabel='model.canvas';canvas.setAttribute('aria-label',translated('model.canvas'));
  viewport.prepend(canvas);
  const controls=new OrbitControls(orbitCamera,canvas);
  controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.dampingFactor=.09;controls.rotateSpeed=.55;
  canvas.style.touchAction='pan-y';
  controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  const initialRotation=orbitCamera.quaternion.clone();
  scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.0));
  const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(3,5,4);scene.add(light);
  const touchDevice=matchMedia('(pointer:coarse)').matches||document.documentElement.hasAttribute('data-ipad');
  renderer.shadowMap.enabled=!touchDevice;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  light.castShadow=!touchDevice;light.shadow.mapSize.set(1024,1024);
  Object.assign(light.shadow.camera,{left:-1.8,right:1.8,top:1.8,bottom:-1.8,near:.1,far:15});
  light.shadow.bias=-.0002;light.shadow.normalBias=.015;
  let shadowTime=0,shadowFrames=0;

  const draco=new DRACOLoader().setDecoderPath('/about/draco/').setWorkerLimit(1);
  const loader=new GLTFLoader().setDRACOLoader(draco);
  // Axes verified against caseta.glb mesh bounds: right -Z, front +X, up +Y.
  const specs:Record<string,[number,number,number,number,number]>={
    circle_r:[0,0,-1,.6,0],aro_r:[0,0,-1,.4,.1],wall_r:[0,0,-1,.2,.2],
    circle_l:[0,0,1,.6,0],aro_l:[0,0,1,.4,.1],wall_l:[0,0,1,.2,.2],
    circle_back:[-1,0,0,.6,0],aro_back:[-1,0,0,.4,.1],wall_back:[-1,0,0,.2,.2],
    front_door:[1,0,0,.6,0],front_aro_d:[1,0,0,.4,.1],front_aro_l:[1,0,0,.4,.1],wall_f:[1,0,0,.2,.2],
    zocalo_top:[0,1,0,.6,0],techo_top:[0,1,0,.4,.1],zocalo_down:[0,-1,0,.4,0],
  };
  type Part={object:THREE.Object3D;position:THREE.Vector3;quaternion:THREE.Quaternion;scale:THREE.Vector3;offset:THREE.Vector3;progress:number;delay:number;phase:number;period:number};
  const parts:Part[]=[];const floating={amount:0};const deltaRotation=new THREE.Quaternion(),angles=new THREE.Euler();
  let loaded=false,loading=false,disposed=false,visible=false,frame=0,time=0,last=0,exploded=false;
  let motion:gsap.core.Timeline|undefined;
  function request(){if(!disposed&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(render);}
  function render(now:number){
    frame=0;if(disposed||!visible||document.hidden)return;
    time+=last?Math.min((now-last)/1000,.05):0;last=now;
    const moving=controls.update();
    const distance=THREE.MathUtils.clamp(controls.getDistance(),controls.minDistance,controls.maxDistance);
    camera.position.copy(viewDirection).multiplyScalar(distance);

    root.quaternion.copy(initialRotation).multiply(orbitCamera.quaternion.clone().invert());
    parts.forEach(part=>{
      const wave=time/part.period*Math.PI*2+part.phase,amount=floating.amount;
      part.object.position.copy(part.position).addScaledVector(part.offset,part.progress);
      if(amount){
        part.object.position.add(new THREE.Vector3(Math.sin(wave)*.014,Math.sin(wave*.83+1)*.012,Math.sin(wave*.91+2)*.014).multiplyScalar(amount));
        angles.set(Math.sin(wave*.78)*.035*amount,Math.sin(wave*.91+1)*.045*amount,Math.sin(wave*.87+2)*.028*amount);
        deltaRotation.setFromEuler(angles);part.object.quaternion.copy(part.quaternion).multiply(deltaRotation);
      }else part.object.quaternion.copy(part.quaternion);
      part.object.scale.copy(part.scale);
    });
    const renderStart=performance.now();renderer.render(scene,camera);
    // Fall back to lighting alone on sustained slow render calls.
    if(renderer.shadowMap.enabled&&++shadowFrames<=48){
      shadowTime+=performance.now()-renderStart;
      if(shadowFrames===48&&shadowTime/shadowFrames>32){renderer.shadowMap.enabled=false;light.castShadow=false;light.shadow.map?.dispose();request();}
    }
    if(moving||zoomMotion?.isActive()||motion?.isActive()||(exploded&&!reduced.matches))request();
  }
  function resize(){
    const width=viewport.clientWidth,height=viewport.clientHeight;if(!width||!height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;
    defaultDistance=1.45*Math.max(1,1/camera.aspect)/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    controls.minDistance=defaultDistance/(1+zoomRange);controls.maxDistance=defaultDistance;
    orbitCamera.position.sub(controls.target).normalize().multiplyScalar(defaultDistance/(1+zoomRange*zoomState.amount)).add(controls.target);
    controls.update();camera.updateProjectionMatrix();request();
  }
  function applyZoom(){
    const distance=defaultDistance/(1+zoomRange*zoomState.amount);
    orbitCamera.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);
    controls.update();request();
  }
  zoom.addEventListener('input',()=>{
    if(!loaded)return;zoomMotion?.kill();zoomState.amount=Number(zoom.value)/100;applyZoom();
  },{signal});
  zoomSteps.forEach(step=>step.addEventListener('click',()=>{
    if(!loaded)return;
    const target=THREE.MathUtils.clamp(Number(zoom.value)+Number(step.dataset.zoomStep)*10,0,100);
    zoom.value=String(target);zoomMotion?.kill();
    if(reduced.matches){zoomState.amount=target/100;applyZoom();return;}
    zoomMotion=gsap.to(zoomState,{amount:target/100,duration:.45,ease:'power3.inOut',onUpdate:applyZoom});
  },{signal}));
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);
  controls.addEventListener('change',request);
  async function load(){
    if(loading||loaded||disposed)return;loading=true;
    try{
      const gltf=await loader.loadAsync(viewport.dataset.model!);
      if(disposed){disposeObject(gltf.scene);return;}
      root.add(gltf.scene);gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse(object=>{
        if(!(object instanceof THREE.Mesh))return;
        object.castShadow=/^(wall_|techo_top|front_door)/.test(object.name);
        object.receiveShadow=/^(wall_|techo_top|zocalo_)/.test(object.name);
      });
      const center=new THREE.Box3().setFromObject(gltf.scene).getCenter(new THREE.Vector3());
      gltf.scene.position.sub(center);gltf.scene.updateMatrixWorld(true);
      Object.entries(specs).forEach(([name,[x,y,z,distance,delay]],index)=>{
        const object=gltf.scene.getObjectByName(name);if(!object)throw new Error('Missing model part: '+name);
        const inverseParent=new THREE.Matrix3().setFromMatrix4(object.parent!.matrixWorld.clone().invert());
        parts.push({object,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone(),offset:new THREE.Vector3(x,y,z).multiplyScalar(distance).applyMatrix3(inverseParent),progress:0,delay,phase:index*2.399,period:22+index*.65});
      });
      loaded=true;button.disabled=false;zoom.disabled=false;zoomSteps.forEach(step=>step.disabled=false);delete status.dataset.i18n;status.textContent='';viewport.dataset.modelReady='';request();
    }catch(error){setStatus('model.error');console.error(error);}
  }
  const proximity=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){void load();proximity.disconnect();}},{rootMargin:'300px'});proximity.observe(viewport);
  let visibleRatio=0,expandedWasInView=false;
  const visibility=new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;visibleRatio=entry.intersectionRatio;last=0;
    // Arm only once the requested exploded view has reached its viewing area.
    if(exploded&&visibleRatio>=.6)expandedWasInView=true;
    if(exploded&&expandedWasInView&&visibleRatio<.6)setExploded(false);
    if(visible){motion?.resume();request();}
    else{
      motion?.pause();cancelAnimationFrame(frame);frame=0;
      if(!exploded)restoreAssembly();
    }
  },{threshold:[0,.6,1]});
  visibility.observe(viewport);
  document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){motion?.pause();cancelAnimationFrame(frame);frame=0;}else if(visible){motion?.resume();request();}},{signal});
  function restoreAssembly(){
    motion?.kill();floating.amount=0;
    parts.forEach(part=>{part.progress=0;part.object.position.copy(part.position);part.object.quaternion.copy(part.quaternion);part.object.scale.copy(part.scale);});
  }
  function setExploded(next:boolean){
    if(!loaded||exploded===next)return;
    exploded=next;expandedWasInView=next&&visibleRatio>=.6;button.setAttribute('aria-pressed',String(exploded));button.dataset.i18nAriaLabel=exploded?'model.assemble':'model.explode';button.setAttribute('aria-label',translated(button.dataset.i18nAriaLabel));
    if(exploded)bringIntoView();
    motion?.kill();
    if(!exploded&&!visible){restoreAssembly();return;}
    if(reduced.matches){floating.amount=0;parts.forEach(part=>part.progress=exploded?1:0);request();return;}
    motion=gsap.timeline({onUpdate:request,onComplete:request});
    if(!exploded)motion.to(floating,{amount:0,duration:.3,ease:'power2.inOut'},0);
    parts.forEach(part=>motion!.to(part,{progress:exploded?1:0,duration:1.1,ease:'power3.inOut'},(exploded?0:.15)+part.delay));
    if(exploded)motion.to(floating,{amount:1,duration:1,ease:'power2.inOut'},1.3);
    request();
  }
  button.addEventListener('click',()=>setExploded(!exploded),{signal});
  canvas.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const axis=new THREE.Vector3(event.key==='ArrowUp'||event.key==='ArrowDown'?1:0,event.key==='ArrowLeft'||event.key==='ArrowRight'?1:0,0);const angle=event.key==='ArrowLeft'||event.key==='ArrowUp'?.12:-.12;orbitCamera.position.applyAxisAngle(axis,angle);orbitCamera.lookAt(0,0,0);request();},{signal});
  reduced.addEventListener('change',()=>{zoomMotion?.kill();zoomState.amount=Number(zoom.value)/100;applyZoom();motion?.kill();floating.amount=0;parts.forEach(part=>part.progress=exploded?1:0);request();},{signal});
  function disposeObject(object:THREE.Object3D){const textures=new Set<THREE.Texture>(),materials=new Set<THREE.Material>();object.traverse(item=>{if(!(item instanceof THREE.Mesh))return;item.geometry.dispose();(Array.isArray(item.material)?item.material:[item.material]).forEach(material=>materials.add(material));});materials.forEach(material=>{Object.values(material).forEach(value=>{if(value instanceof THREE.Texture)textures.add(value);});material.dispose();});textures.forEach(texture=>{const data=texture.source.data;if(typeof ImageBitmap!=='undefined'&&data instanceof ImageBitmap)data.close();texture.dispose();});}
  return()=>{disposed=true;events.abort();motion?.kill();zoomMotion?.kill();cancelAnimationFrame(frame);proximity.disconnect();visibility.disconnect();resizeObserver.disconnect();controls.dispose();draco.dispose();disposeObject(root);light.shadow.dispose();renderer.dispose();canvas.remove();};
}
