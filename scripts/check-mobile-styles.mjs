import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import postcss from 'postcss';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['mobile-home.css','compact-services.css','unified-home.css'];
const errors=[];
const rootLimits={'mobile-home.css':9,'compact-services.css':3,'unified-home.css':4};
for(const name of files){
  const file=path.join(root,'src/styles',name);
  const ast=postcss.parse(fs.readFileSync(file,'utf8'),{from:file});
  const seen=new Map();
  ast.walkRules(rule=>{
    for(const selector of rule.selectors){
      if((selector.match(/:root\b/g)||[]).length>rootLimits[name])
        errors.push(`${name}:${rule.source.start.line}: selector exceeds the existing specificity limit; edit the owning rule instead of adding another override.`);
    }
  });
  ast.walkDecls(declaration=>{
    const rule=declaration.parent;
    if(rule.type!=='rule')return;
    const context=[];
    for(let parent=rule.parent;parent&&parent.type!=='root';parent=parent.parent)
      context.unshift(`${parent.name}:${parent.params}`);
    const key=JSON.stringify([context,rule.selector,declaration.prop,!!declaration.important]);
    const previous=seen.get(key);
    if(previous?.value===declaration.value)
      errors.push(`${name}:${declaration.source.start.line}: redundant ${declaration.prop} (previous declaration at line ${previous.line})`);
    seen.set(key,{value:declaration.value,line:declaration.source.start.line});
  });
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log('Mobile styles: no repeated declarations in identical selectors and conditions.');
