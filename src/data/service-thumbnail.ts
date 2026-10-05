import type {ProjectAsset} from './projects';
export function serviceThumbnail(asset:ProjectAsset,size:320|640){
 const src=asset.kind==='video'?asset.src.replace(/\.webm$/i,'.webp'):asset.src;
 const name=src.split('/').pop()!.replace(/\.webp$/i,'');
 return `/img/service-thumbs/${name}.${size}.webp`;
}
