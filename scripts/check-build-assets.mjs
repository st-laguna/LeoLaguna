import {readdir,readFile} from 'node:fs/promises';
import {resolve,relative,posix} from 'node:path';
const root=resolve(process.argv[2]||'dist');
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?walk(resolve(dir,e.name)):[resolve(dir,e.name)]))).flat();}
const files=await walk(root),names=new Set(files.map(f=>relative(root,f).replaceAll('\\','/'))),missing=new Set();let checked=0;
for(const file of files){
 const name=relative(root,file).replaceAll('\\','/');
 if(!name.endsWith('.html')&&!(name.startsWith('_astro/')&&/\.(js|css)$/.test(name)))continue;
 const source=await readFile(file,'utf8');
 const patterns=[/["'`](\/_astro\/[^"'`?#\s<>]+)(?:[?#][^"'`\s<>]*)?["'`]/g];
 if(name.startsWith('_astro/'))patterns.push(/["']((?:\.\/|\.\.\/)[^"'\s?]+\.(?:js|css))(?:\?[^"']*)?["']/g);
 for(const pattern of patterns)for(const match of source.matchAll(pattern)){
  const asset=decodeURIComponent(match[1].startsWith('/')?match[1].slice(1):posix.normalize(posix.join(posix.dirname(name),match[1])));
  checked++;if(!names.has(asset))missing.add(`${name} -> ${asset}`);
 }
}
if(missing.size){console.error('Missing generated assets (including case mismatches):\n'+[...missing].join('\n'));process.exitCode=1;}
else console.log(`Build assets: ${checked} references verified; no missing generated JS/CSS/media.`);
