import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Resources } from './sceneUtils.js';

type Item = { id:string; model:string; rotation:number[]; baseRotation?:number[] };
type Layout = { distance:number; x:number; z:number; scale:number; opacity:number; visible:boolean };
/** One live scene/canvas for all seven catalog objects. DOM slots still own input. */
export function prepareMobileAboutModels(root:HTMLElement, items:Item[]) {
  const wheel=root.querySelector<HTMLElement>('.mobile-about__wheel')!;
  const abort=new AbortController(), resources=new Resources();
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(35,1,.1,5000);
  const groups=items.map(()=>new THREE.Group());
  const rotations=items.map(()=>new THREE.Quaternion());
  const dragRotation=new THREE.Quaternion();
  groups.forEach(group=>scene.add(group));
  scene.add(new THREE.HemisphereLight(0xffffff,0x777788,2.5));
  const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,6,5);scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,1.5);fill.position.set(-4,1,2);scene.add(fill);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  renderer.domElement.className='mobile-about__models';renderer.domElement.setAttribute('aria-hidden','true');
  wheel.prepend(renderer.domElement);wheel.dataset.modelSystem='live';
  const draco=new DRACOLoader();draco.setDecoderPath('/about/draco/');draco.setWorkerLimit(1);
  const loader=new GLTFLoader().setDRACOLoader(draco);
  let disposed=false,frame=0,last=0,time=0,width=0,height=0;
  let layout:Layout[]=[];
  const awake=()=>!disposed&&wheel.dataset.awake==='true'&&!document.hidden&&root.isConnected;
  function draw(now:number){
    frame=0;if(!awake())return;
    if(!last||now-last>=1000/30){
      time+=last?Math.min((now-last)/1000,.05):0;last=now;
      const slots=[...wheel.querySelectorAll<HTMLElement>('[data-wheel-slot]')];
      const size=(slots[0]?.clientWidth||180)*.84;
      groups.forEach((group,index)=>{
        const slot=layout[index];group.visible=!!slot?.visible;if(!slot)return;
        const phase=index*1.73, t=reduced.matches?0:time;
        const motion=reduced.matches?0:1;
        group.position.set(slot.x+Math.sin(t*.31+phase)*size*.012*motion,Math.sin(t*.37+phase)*size*.018*motion,slot.z+Math.cos(t*.29+phase)*size*.018*motion);
        group.rotation.set(Math.sin(t*.28+phase)*.055*motion,slot.distance*.26+Math.sin(t*.32+phase)*.085*motion,Math.cos(t*.26+phase)*.045*motion);
        group.quaternion.premultiply(rotations[index]);
        group.scale.setScalar(size*slot.scale);
      });
      renderer.render(scene,camera);
    }
    if(!reduced.matches)frame=requestAnimationFrame(draw);
  }
  function invalidate(){if(awake()&&!frame){last=0;frame=requestAnimationFrame(draw);}}
  function sync(){cancelAnimationFrame(frame);frame=0;last=0;invalidate();}
  function resize(){
    width=wheel.clientWidth;height=wheel.clientHeight;if(!width||!height)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.position.set(0,0,height/(2*Math.tan(THREE.MathUtils.degToRad(35/2))));camera.updateProjectionMatrix();invalidate();
  }
  const receive=(event:Event)=>{layout=(event as CustomEvent<Layout[]>).detail;invalidate();};
  wheel.addEventListener('wheel:rotate-model',event=>{
    const {index,deltaX,deltaY}=(event as CustomEvent<{index:number;deltaX:number;deltaY:number}>).detail;
    if(index<0||index>=groups.length||!Number.isFinite(deltaX)||!Number.isFinite(deltaY))return;
    dragRotation.setFromEuler(new THREE.Euler(deltaY,deltaX,0,'YXZ'));
    rotations[index].premultiply(dragRotation).normalize();invalidate();
  },{signal:abort.signal});
  wheel.addEventListener('wheel:layout',receive,{signal:abort.signal});
  wheel.addEventListener('wheel:awake',sync,{signal:abort.signal});
  document.addEventListener('visibilitychange',sync,{signal:abort.signal});
  reduced.addEventListener('change',sync,{signal:abort.signal});
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(wheel);
  // Request the current geometry even if the carousel is already settled.
  wheel.dispatchEvent(new Event('wheel:measure'));resize();
  async function load(){
    for(let index=0;index<items.length&&!disposed;index++){
      const item=items[index];
      try{
        const response=await fetch(item.model,{signal:abort.signal,priority:'low'});
        if(!response.ok)throw new Error(`${item.model}: ${response.status}`);
        const gltf=await loader.parseAsync(await response.arrayBuffer(),'/about/models/');
        if(disposed){const late=new Resources();late.track(gltf.scene);late.dispose();break;}
        const model=gltf.scene;resources.track(model);
        model.rotation.set(item.rotation[0],item.rotation[1],item.rotation[2]);
        // Mobile presentation offsets only; desktop sceneConfig stays authoritative.
        if(item.id==='laptop'){model.rotation.x=-.3;model.rotation.y+=.42;model.rotation.z=-.04;}
        if(item.id==='dog-bone'){model.rotation.x=.25;model.rotation.y=Math.PI/2+.25;model.rotation.z=-.18;}
        if(item.baseRotation)model.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...item.baseRotation as [number,number,number])));
        const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
        const scale=1/Math.max(size.x,size.y,size.z);model.scale.multiplyScalar(scale);model.position.addScaledVector(center,-scale);
        groups[index].add(model);
        wheel.querySelector<HTMLElement>(`[data-mobile-interest="${item.id}"]`)!.dataset.modelReady='true';invalidate();
      }catch(error){if(!disposed){console.error('About model failed',item.id,error);wheel.dataset.modelError=item.id;}}
    }
  }
  void load();
  return {dispose(){disposed=true;cancelAnimationFrame(frame);abort.abort();resizeObserver.disconnect();resources.dispose();draco.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();delete wheel.dataset.modelSystem;}};
}
