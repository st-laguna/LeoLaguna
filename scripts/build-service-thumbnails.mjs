// Run with Node 22.18+ (native TypeScript import); only service overview assets, never the full gallery.
import sharp from 'sharp';
import {mkdir,stat} from 'node:fs/promises';
import {projects} from '../src/data/projects.ts';
const folder='public/img/service-thumbs';await mkdir(folder,{recursive:true});
let originalBytes=0,smallBytes=0,largeBytes=0,count=0;
for(const project of projects){
 for(const asset of project.assets.slice(0,project.id==='04'?8:9)){
  const src=asset.kind==='video'?asset.src.replace('/videos/','/videos/mini/').replace(/\.webm$/i,'.webp'):asset.src;
  const name=src.split('/').pop().replace(/\.webp$/i,'');
  originalBytes+=(await stat('public'+src)).size;
  for(const size of [320,640]){
   const target=`${folder}/${name}.${size}.webp`;
   await sharp('public'+src).resize(size,size,{fit:'cover'}).webp({quality:82,effort:5}).toFile(target);
   const bytes=(await stat(target)).size;if(size===320)smallBytes+=bytes;else largeBytes+=bytes;
  }count++;
 }
}
console.log(JSON.stringify({count,originalBytes,smallBytes,largeBytes}));
