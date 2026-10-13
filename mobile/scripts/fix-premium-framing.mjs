import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../server/src/digital-templates/premium');
const overlaps=(a,b)=>Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x)+.00001&&Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y)+.00001;
for(const name of fs.readdirSync(dir).filter(x=>x.endsWith('.json'))){
 const file=path.join(dir,name),t=JSON.parse(fs.readFileSync(file,'utf8'));
 let hollow=0,rules=0;
 t.cover.shapes=t.cover.shapes.filter(s=>{
  if(s.kind==='rect'&&s.stroke&&t.cover.artworks.some(a=>s.x<=a.x+.002&&s.y<=a.y+.002&&s.x+s.w>=a.x+a.w-.002&&s.y+s.h>=a.y+a.h-.002)){
   s.hollow=true;hollow++;
  }
  if(s.kind==='line'){
   const bounds={...s,x:s.x-.001,y:s.y-.001,w:s.w+.002,h:s.h+.002};
   if(['title','subtitle','eyebrow','brand'].some(f=>overlaps(bounds,t.cover[f]))){rules++;return false;}
  }
  return true;
 });
 // Keep at least three distinct frame marks after removing text-intersecting rules.
 while(t.cover.shapes.length<3){
  const i=t.cover.shapes.length;
  t.cover.shapes.push({kind:'line',x:.025,y:.965-i*.014,w:.025+i*.008,h:0,fill:'accent',stroke:.6,opacity:.6});
 }
 // Premium ornamental furniture is already generated in safe margins by the renderer.
 // Remove template-supplied top shapes across chapter/headline region only.
 t.interior.shapes=t.interior.shapes.filter(s=>s.y>=.14||s.y+s.h<=.043||s.x+s.w<.06||s.x>.95);
 fs.writeFileSync(file,JSON.stringify(t,null,2)+'\n');
 if(hollow||rules)console.log(`${t.id}: ${hollow} hollow artwork frames, ${rules} removed text-crossing rules`);
}
