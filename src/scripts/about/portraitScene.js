import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Resources, toonMaterials } from './sceneUtils.js';

// Mobile only. Each portrait has its own crop and rotates about its head centre.
const framing = {
  leo: { neck: /mixamorig[:_]?Neck$/i, cut: .18, fill: .88, profile: 0 },
  simba: { neck: /^Neck03_/i, cut: -.04, fill: .86, profile: Math.PI / 2 },
  morena: { neck: /^Neck03_/i, cut: -.06, fill: .86, profile: Math.PI / 2 },
};

export function createAboutScene(section, callbacks = {}) {
  const container=section.querySelector('[data-scene]');
  const resources=new Resources(), events=new AbortController();
  const scene=new THREE.Scene(), camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,100);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.localClippingEnabled=true;
  renderer.domElement.setAttribute('aria-label','Leo, Simba and Morena — 3D portraits');
  renderer.domElement.style.touchAction='pan-y';container.append(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2));
  const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(3,6,5);scene.add(light);
  const draco=new DRACOLoader();draco.setDecoderPath('/about/draco/');draco.setWorkerLimit(1);
  const loader=new GLTFLoader().setDRACOLoader(draco), actors=[];
  camera.position.set(0,0,10);camera.lookAt(0,0,0);
  let disposed=false,visible=true,paused=false,reduced=false,lost=false,raf=0,aspect=1;
  const clamp=v=>Math.max(0,Math.min(1,v));
  function request(){if(!disposed&&!lost&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);}
  function theme(){scene.background=new THREE.Color(document.documentElement.dataset.theme==='dark'?'#181818':'#f7f7f7');request();}
  function resize(){
    const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);aspect=w/h;request();
  }
  function frame(){
    raf=0;if(disposed||lost||!visible||document.hidden)return;
    const composition=section.querySelector('.about__composition');
    const distance=Math.max(1,section.offsetHeight-composition.clientHeight);
    const progress=clamp(-section.getBoundingClientRect().top/distance);
    const phase=progress*3,index=Math.min(2,Math.floor(phase)),local=phase-index;
    // Keep the last loaded portrait while another asset is pending or unavailable.
    const actor=actors[index] || actors.slice(0,index+1).filter(Boolean).at(-1) || actors.find(Boolean);
    actors.forEach(a=>{if(a)a.pivot.visible=a===actor;});
    if(actor){
      actor.pivot.rotation.y=actor.profile+(reduced||paused?0:local*Math.PI*2);
      // Constant bounds for the entire turn, including the ears and muzzle in profile.
      const halfHeight=Math.max(actor.height/2,actor.radius/aspect)/actor.fill;
      camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;
      camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();
      container.dataset.character=actor.id;
    }
    renderer.render(scene,camera);
  }
  async function load(){
    let failed=0,completed=0;
    for(const [index,id] of ['leo','simba','morena'].entries()){
      try{
        const gltf=await loader.loadAsync('/about/models/'+id+'.glb');resources.track(gltf.scene);
        if(disposed){resources.dispose();return;}
        const model=gltf.scene;toonMaterials(model);resources.track(model);
        // Pose once: idle animation must not move the head or change its size during a turn.
        const mixer=new THREE.AnimationMixer(model);
        const clip=gltf.animations.find(c=>id==='leo'?/^(idle|iddle)$/i.test(c.name):c.name==='idle_to_idle_sit');
        if(clip){const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.update(id==='leo'?0:clip.duration);}
        const config=framing[id];let head=null,neck=null;
        model.traverse(n=>{if(n.isBone&&/^(mixamorig[:_]?)?head(?:_\d+)?$/i.test(n.name))head=n;if(n.isBone&&config.neck.test(n.name))neck=n;});
        model.updateMatrixWorld(true);
        if(!head)throw new Error('Missing head bone: '+id);
        const headBox=new THREE.Box3(),vertex=new THREE.Vector3();
        model.traverse(mesh=>{
          if(!mesh.isSkinnedMesh)return;
          mesh.skeleton.update();
          const {skinIndex,skinWeight,position}=mesh.geometry.attributes;
          if(!skinIndex||!skinWeight)return;
          const belongs=mesh.skeleton.bones.map(bone=>{
            for(let node=bone;node;node=node.parent)if(node===head)return true;
            return false;
          });
          for(let i=0;i<position.count;i++){
            let weight=0;
            for(let j=0;j<4;j++)if(belongs[skinIndex.getComponent(i,j)])weight+=skinWeight.getComponent(i,j);
            if(weight<.5)continue;
            mesh.getVertexPosition(i,vertex);vertex.applyMatrix4(mesh.matrixWorld);headBox.expandByPoint(vertex);
          }
        });
        if(headBox.isEmpty())throw new Error('Missing head geometry: '+id);
        const size=headBox.getSize(new THREE.Vector3());
        const neckY=neck?neck.getWorldPosition(new THREE.Vector3()).y:headBox.min.y;
        const cutY=neckY+size.y*config.cut;
        const centre=headBox.getCenter(new THREE.Vector3());
        centre.y=(headBox.max.y+cutY)/2;
        const pivot=new THREE.Group();
        model.position.sub(centre);pivot.add(model);scene.add(pivot);pivot.visible=false;
        const crop=new THREE.Plane(new THREE.Vector3(0,1,0),centre.y-cutY);
        model.traverse(mesh=>{
          if(!mesh.isMesh)return;
          for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){material.clippingPlanes=[crop];material.needsUpdate=true;}
        });
        actors[index]={id,pivot,mixer,height:headBox.max.y-cutY,radius:Math.hypot(size.x,size.z)/2,...config};
      }catch(error){failed++;console.warn('[About] '+id+' could not load',error);}
      completed++;callbacks.onProgress?.({completed,total:3});request();
    }
    if(!disposed)callbacks.onReady?.({failed,interactive:actors.filter(Boolean).length});
  }
  const observer=new ResizeObserver(resize);observer.observe(container);
  window.addEventListener('scroll',request,{passive:true,signal:events.signal});
  window.addEventListener('leo:theme-change',theme,{signal:events.signal});
  document.addEventListener('visibilitychange',request,{signal:events.signal});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;callbacks.onError?.('The 3D scene is temporarily unavailable.');},{signal:events.signal});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;request();},{signal:events.signal});
  theme();resize();
  return {load,setVisible(v){visible=v;if(v)request();},setPaused(v){paused=v;request();},setReducedMotion(v){reduced=v;request();},resume(){visible=true;request();},leave(){visible=false;},reset(){request();},dispose(){disposed=true;events.abort();cancelAnimationFrame(raf);observer.disconnect();actors.forEach(a=>a?.mixer.stopAllAction());resources.dispose();draco.dispose();renderer.dispose();renderer.domElement.remove();}};
}
