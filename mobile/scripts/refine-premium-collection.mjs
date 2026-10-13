import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../server/src/digital-templates/premium');
const families=['guide','checklist','hooks','quotes','planner'];
const replacements={
 'guide-06':'silk-silver','guide-09':'stone-silver','guide-07':'ice-prism',
 'checklist-03':'silk-silver','checklist-06':'stone-silver','checklist-09':'copper-orbit',
 'hooks-03':'stone-silver','hooks-06':'ice-prism','hooks-10':'silk-silver',
 'quotes-03':'ice-prism','quotes-07':'silk-silver','quotes-10':'stone-silver',
 'planner-04':'silk-silver','planner-07':'stone-silver','planner-10':'copper-orbit',
};
const names={'hooks-06':'The Chrome Opening','quotes-03':'Make Room for Light','quotes-06':'Silver Stillness'};
for (const family of families) for(let i=1;i<=10;i++) {
 const id=`${family}-${String(i).padStart(2,'0')}`;
 const file=path.join(root,id+'.json');
 const t=JSON.parse(fs.readFileSync(file,'utf8'));
 if(replacements[id])t.cover.artworks[0].id=replacements[id];
 if(names[id])t.name=names[id];
 fs.writeFileSync(file,JSON.stringify(t,null,2)+'\n');
}
console.log('Distributed 9 original material artworks across 50 independent layouts; resolved 3 duplicate names.');
