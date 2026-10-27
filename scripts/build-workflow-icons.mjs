import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const destination=resolve('src/assets/workflow-icons');await mkdir(destination,{recursive:true});
for(let step=1;step<=4;step++){
 const source=await readFile(resolve(`public/icons/stp${step}.svg`),'utf8');
 const output=source.replace(/(<mask\b[^>]*>\s*<rect\b[^>]*\bfill=)"#1c1c1c"/g,'$1"#fff"');
 await writeFile(resolve(destination,`stp${step}.svg`),output);
}
console.log('Workflow: four original animated SVGs prepared with their existing mask correction.');
