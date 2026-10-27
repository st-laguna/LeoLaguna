import {getImage} from 'astro:assets';
import type {ImageMetadata} from 'astro';
const sources=import.meta.glob<{default:ImageMetadata}>('../../public/img/**/*.webp',{eager:true});
const cache=new Map<string,Promise<{src:string;srcset:string;width:number;height:number}>>();
export function responsiveWorkImage(src:string){
 let result=cache.get(src);if(result)return result;
 result=(async()=>{
  const metadata=sources['../../public'+src]?.default;
  if(!metadata)throw new Error('Unknown work image: '+src);
  const widths=[640,960,1440,1920].filter(width=>width<=metadata.width*.8);
  const variants=await Promise.all(widths.map(async width=>{const image=await getImage({src:metadata,width,format:'webp',quality:88});return image.src+' '+width+'w';}));
  variants.push(src+' '+metadata.width+'w');
  return {src,srcset:variants.join(', '),width:metadata.width,height:metadata.height};
 })();cache.set(src,result);return result;
}


