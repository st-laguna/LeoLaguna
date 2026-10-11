import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Resources } from './sceneUtils.js';

type Item = { id:string; model:string; image:string; rotation:number[] };
/** One temporary context, sequential GLBs, one render per item. CSS owns all motion. */
export function prepareMobileAboutModels(root:HTMLElement, items:Item[]) {
  const abort = new AbortController(), urls:string[]=[];
  let disposed=false, renderer:THREE.WebGLRenderer|undefined, draco:DRACOLoader|undefined;
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1.15,1.15,1.15,-1.15,.01,30);
  camera.position.set(3,2.4,5);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x888899,2.5));
  const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,6,5);scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,1.5);fill.position.set(-4,1,-2);scene.add(fill);
  let visible=true, resume:(()=>void)|undefined;
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;resume?.();});observer.observe(root);
  const wake=()=>resume?.();document.addEventListener('visibilitychange',wake,{signal:abort.signal});
  function available(){return !disposed && visible && !document.hidden && root.isConnected;}
  async function waitUntilVisible(){
    while(!disposed&&!available())await new Promise<void>(resolve=>{resume=resolve;});
    resume=undefined;
  }
  async function run(){
    try {
      await waitUntilVisible();if(disposed)return;
      renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
      renderer.setSize(640,640,false);renderer.setPixelRatio(1);
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
      draco=new DRACOLoader();draco.setDecoderPath('/about/draco/');draco.setWorkerLimit(1);
      const loader=new GLTFLoader().setDRACOLoader(draco);
      for(const item of items){
        await waitUntilVisible();if(disposed)break;
        const resources=new Resources();let model:THREE.Object3D|undefined;
        try {
          const response=await fetch(item.model,{signal:abort.signal,priority:'low'});
          if(!response.ok)throw new Error(`Model response ${response.status}`);
          const gltf=await loader.parseAsync(await response.arrayBuffer(),'/about/models/');
          model=gltf.scene;resources.track(model);
          await waitUntilVisible();if(disposed)break;
          model.rotation.set(item.rotation[0],item.rotation[1],item.rotation[2]);
          const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
          const center=box.getCenter(new THREE.Vector3()),scale=1.65/Math.max(size.x,size.y,size.z);
          model.scale.multiplyScalar(scale);model.position.addScaledVector(center,-scale);scene.add(model);
          renderer.render(scene,camera);
          const blob=await new Promise<Blob|null>(resolve=>renderer!.domElement.toBlob(resolve,'image/png'));
          if(disposed)break;
          const image=root.querySelector<HTMLImageElement>(`[data-mobile-interest="${item.id}"] [data-wheel-model]`);
          if(blob&&image){const url=URL.createObjectURL(blob);urls.push(url);image.src=url;image.dataset.modelReady='true';}
        }catch(error){
          if(!disposed){const image=root.querySelector<HTMLElement>(`[data-mobile-interest="${item.id}"] [data-wheel-model]`);if(image)image.dataset.modelReady='fallback';}
        }finally{if(model)scene.remove(model);resources.dispose();}
        // Yield to input between assets, without maintaining an animation loop.
        await new Promise(resolve=>setTimeout(resolve,0));
      }
    }catch{if(!disposed)root.dataset.modelViews='fallback';}
    finally{renderer?.dispose();renderer?.forceContextLoss();renderer=undefined;draco?.dispose();observer.disconnect();}
  }
  void run();
  return {dispose(){disposed=true;abort.abort();observer.disconnect();resume?.();renderer?.dispose();renderer?.forceContextLoss();urls.forEach(URL.revokeObjectURL);for(const item of items){const image=root.querySelector<HTMLImageElement>(`[data-mobile-interest="${item.id}"] [data-wheel-model]`);if(image){image.src=item.image;delete image.dataset.modelReady;}}}};
}
