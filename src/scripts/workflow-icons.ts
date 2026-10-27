// Reuse the bounded decoder queue; loading is triggered before the cards arrive.
import {prepareImage} from './image-readiness';
const warmed=new WeakMap<Element,Promise<boolean[]>>();
export function prepareWorkflowIcons(section:Element){
 const current=warmed.get(section);if(current)return current;
 const ready=Promise.all(Array.from(section.querySelectorAll<HTMLImageElement>('img[data-workflow-icon]'),image=>prepareImage(image,1,()=>section.isConnected))).then(results=>{if(results.some(result=>!result))warmed.delete(section);return results;});
 warmed.set(section,ready);return ready;
}
