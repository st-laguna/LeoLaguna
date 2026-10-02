import type { WorkCategory } from './work-categories';
export type CaseImages = [string|null,string|null,string|null,string|null,string|null];
export type CaseMedia = {kind:'image';src:string}|{kind:'video';src:string;width:number;height:number};
export interface CaseStudy {
  slug:string; client:string; title:string; categoryId:WorkCategory;
  location:string|null; year:string; cover:string; images:CaseImages;
  nextProject:string; nextPreview?:string;
  media?:CaseMedia[]; model?:string; imageColumns?:number[][];
}
// Replace the five null entries with confirmed public image paths for each project.
export const caseStudies:CaseStudy[] = [
  {slug:'wewhale',client:'WeWhale',title:'Whale Watching Education',categoryId:'educational',location:'Spain',year:'2025-2026',cover:'/img/FWWW.webp',images:[null,null,null,null,null],
    media:[1,2,3,4,5,6].map(number=>({kind:'image' as const,src:'/img/FW/04/'+number+'.webp'})),nextProject:'groaqua'},
  {slug:'groaqua',client:'GroAqua',title:'Visualizing Aquaculture Engineering',categoryId:'technical',location:'Islas Feroe',year:'2024-2026',cover:'/img/FWGRO.webp',
    images:['/img/FW/01/1.webp','/img/FW/01/2.webp','/img/FW/01/3.webp','/img/FW/01/4.webp','/img/FW/01/5.webp'],
    nextProject:'exo-environmental',nextPreview:'/img/FW/01/06.webp'},
  {slug:'exo-environmental',client:'EXO Environmental',title:'Marine Habitat Engineering',categoryId:'technical',location:'United Kingdom',year:'2023-2026',cover:'/img/FWEXO.webp',images:[null,null,null,null,null],
    media:[1,2,3,4,5,6].map(number=>({kind:'image' as const,src:'/img/FW/03/'+number+'.webp'})),
    imageColumns:[[0],[1],[2,3],[4],[5]],nextProject:'wwf'},
  {slug:'wwf',client:'WWF',title:'Whale Science & Conservation',categoryId:'educational',location:'Peru',year:'2025-2026',cover:'/img/FWWWF.webp',images:[null,null,null,null,null],
    // 3.webm: encoded 1440x1080 with 4:3 pixel aspect; display ratio is 16:9.
    media:[{kind:'image',src:'/img/FW/02/1.webp'},{kind:'image',src:'/img/FW/02/2.webp'},{kind:'video',src:'/img/FW/02/3.webm',width:1920,height:1080}],
    model:'/models/caseta.glb',nextProject:'sperm-whales-of-dominica'},
  {slug:'sperm-whales-of-dominica',client:'Sperm Whales of Dominica',title:'Cataloguing Dominica’s Sperm Whales',categoryId:'scientific',location:'USA and Dominica',year:'2022-2025',cover:'/img/FWSPM.webp',images:[null,null,null,null,null],
    media:[1,2,3,4,5,6].map(number=>({kind:'image' as const,src:'/img/FW/05/'+number+'.webp'})),nextProject:'wewhale'},
];
