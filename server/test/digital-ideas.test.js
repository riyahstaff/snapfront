import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'snapfront-ideas-'));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = 'http://ideas.test';
process.env.STRIPE_SECRET_KEY = '';
const { app } = await import('../src/index.js');
const { db } = await import('../src/db.js');
const { ideaCatalog, ideaDocument } = await import('../src/digital-ideas.js');
let server, base, a, b;
const call = async (token, method, url, body) => fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
const read = async (r, status) => { const j = await r.json(); assert.equal(r.status,status,JSON.stringify(j)); return j; };
before(async () => {
 server=app.listen(0); await new Promise(r=>server.once('listening',r)); base=`http://127.0.0.1:${server.address().port}`;
 a=await read(await call(null,'POST','/api/sellers',{store_name:'Idea Store A'}),201);
 b=await read(await call(null,'POST','/api/sellers',{store_name:'Idea Store B'}),201);
});
after(()=>{server.close();fs.rmSync(tmp,{recursive:true,force:true});});
test('all 500 ideas have unique IDs, sources, categories and valid editable source',()=>{
 assert.equal(ideaCatalog.ideas.length,500); assert.equal(ideaCatalog.categories.length,25);
 assert.equal(new Set(ideaCatalog.ideas.map(i=>i.id)).size,500);
 assert.equal(new Set(ideaCatalog.ideas.map(i=>i.title.toLowerCase())).size,500);
 const sources=new Set(ideaCatalog.sources.map(s=>s.id));
 for(const idea of ideaCatalog.ideas){
   assert.ok(ideaCatalog.categories.some(c=>c.id===idea.category_id));
   assert.ok(idea.source_ids.length && idea.source_ids.every(id=>sources.has(id)));
   const document=ideaDocument(idea,'Test Store');
   assert.equal(document.title,idea.title); assert.equal(document.pages.length,4);
 }
 assert.equal(ideaCatalog.ideas.filter(i=>i.external_requirement).length,80);
});
test('one click makes a private owned draft; retries do not create duplicates',async()=>{
 const catalog=await read(await call(null,'GET','/api/digital-ideas'),200);assert.equal(catalog.ideas.length,500);
 const input={idea_id:'cooking-01',request_id:'test-cooking-request-01'};
 await read(await call(null,'POST','/api/digital-ideas/start',input),401);
 const [first,retry]=await Promise.all([call(a.token,'POST','/api/digital-ideas/start',input),call(a.token,'POST','/api/digital-ideas/start',input)]).then(rs=>Promise.all(rs.map(r=>read(r,201))));
 assert.equal(first.product.id,retry.product.id);
 const row=db.prepare('SELECT * FROM products WHERE id=?').get(first.product.id);
 assert.equal(row.status,'draft');assert.equal(row.kind,'digital');assert.equal(row.delivery_file,null);assert.equal(row.delivery_url,null);
 assert.equal(first.design.document.title,'Weekly meal planner with grocery lists');
 const p=await read(await call(a.token,'GET',`/api/products/${row.id}/digital-idea`),200);assert.equal(p.idea.id,'cooking-01');
 await read(await call(b.token,'GET',`/api/products/${row.id}/digital-idea`),404);
 await read(await call(a.token,'POST','/api/digital-ideas/start',{...input,idea_id:'money-01'}),409);
 await read(await call(a.token,'POST','/api/digital-ideas/start',{...input,idea_id:'missing'}),400);
 const other=await read(await call(b.token,'POST','/api/digital-ideas/start',input),201);assert.notEqual(other.product.id,row.id);
 const external=await read(await call(a.token,'POST','/api/digital-ideas/start',{idea_id:'spreadsheets-01',request_id:'test-spreadsheet-request'}),201);
 assert.match(external.design.document.pages[0].blocks.at(-1).text,/separately/);
 assert.equal(db.prepare('SELECT status FROM products WHERE id=?').get(external.product.id).status,'draft');
});
test('designer proposes a valid page without saving, publishing or changing unrelated pages',async()=>{
 const made=await read(await call(a.token,'POST','/api/digital-ideas/start',{idea_id:'planning-01',request_id:'test-assistant-request'}),201);
 const body={document:made.design.document,page_index:0,message:'Develop the first page with a practical example.'};
 await read(await call(a.token,'POST',`/api/products/${made.product.id}/digital-designer`,body),402);
 db.prepare("UPDATE accounts SET comp_plan='pro' WHERE id=?").run(db.prepare('SELECT account_id FROM sellers WHERE id=?').get(a.seller?.id || a.id).account_id);
 db.prepare("UPDATE accounts SET comp_plan='pro' WHERE id=?").run(db.prepare('SELECT account_id FROM sellers WHERE id=?').get(b.seller?.id || b.id).account_id);
 process.env.SNAPFRONT_FAKE_AI=JSON.stringify({reply:'Review this suggested exercise.',page:{title:'Choose your priorities',blocks:[{kind:'paragraph',text:'Choose one important task for tomorrow.'},{kind:'writing',text:'My first step'}]}});
 await read(await call(b.token,'POST',`/api/products/${made.product.id}/digital-designer`,body),404);
 const proposal=await read(await call(a.token,'POST',`/api/products/${made.product.id}/digital-designer`,body),200);
 assert.equal(proposal.changed,true);assert.equal(proposal.document.pages[0].title,'Choose your priorities');
 assert.deepEqual(proposal.document.pages.slice(1),made.design.document.pages.slice(1));
 const saved=await read(await call(a.token,'GET',`/api/products/${made.product.id}/digital-design`),200);
 assert.deepEqual(saved.document,made.design.document);assert.equal(saved.revision,0);
 const row=db.prepare('SELECT * FROM products WHERE id=?').get(made.product.id);assert.equal(row.status,'draft');assert.equal(row.delivery_file,null);
 await read(await call(a.token,'POST',`/api/products/${made.product.id}/digital-designer`,{...body,page_index:99}),400);
 process.env.SNAPFRONT_FAKE_AI=JSON.stringify({reply:'Invalid',page:{title:'No',blocks:[{kind:'script',text:'bad'}]}});
 await read(await call(a.token,'POST',`/api/products/${made.product.id}/digital-designer`,body),502);
 delete process.env.SNAPFRONT_FAKE_AI;
});
test('topic art is local, varied, owned and accepted by the actual preview renderer',async()=>{
 const {topicStyles}=await import('../src/digital-topic-styles.js');
 const {ownedDocument}=await import('../src/digital-document.js');
 assert.equal(Object.keys(topicStyles).length,25);
 assert.ok(new Set(Object.values(topicStyles).map(s=>s.variant)).size>=8);
 for(const cat of ideaCatalog.categories){assert.ok(fs.existsSync(new URL(`../assets/themes/${topicStyles[cat.id].asset}`,import.meta.url)),cat.id);assert.match(cat.image_url,/\/theme-assets\/.*-hero\.webp$/);}
 const made=await read(await call(a.token,'POST','/api/digital-ideas/start',{idea_id:'cooking-02',request_id:'test-topic-artwork-01'}),201);
 assert.ok(ownedDocument(a.seller?.id||a.id,made.design.document));
 assert.throws(()=>ownedDocument(b.seller?.id||b.id,made.design.document));
 assert.equal(made.design.document.palette.accent,'#A95632');assert.equal(made.design.document.show_artwork,false);
 const preview=await read(await call(a.token,'POST',`/api/products/${made.product.id}/digital-design/preview`,{document:made.design.document}),200);assert.ok(preview.document_hash);
});
test('Mira develops the whole product and proposes targeted rose and river image jobs',async()=>{
 const made=await read(await call(a.token,'POST','/api/digital-ideas/start',{idea_id:'planning-02',request_id:'test-whole-product-01'}),201),document=made.design.document;
 const body={document,page_index:0,scope:'product',message:'Create a student planner for an introverted young woman with roses and river pictures.'};
 const answer={reply:'A gentle student planner with two images to create.',title:'Quiet Days Student Planner',pages:document.pages.map(p=>({id:p.id,title:p.title,blocks:[{kind:'paragraph',text:'Plan a quiet study break.'},{kind:'writing',text:'My small next step'}]})),image_requests:[{page_id:document.pages[0].id,prompt:'Blush roses in a sunlit vase, no text',aspect:'wide',replace_block_id:'topic-image'},{page_id:document.pages[2].id,prompt:'Peaceful flowing river in a green woodland, no text',aspect:'wide'}]};
 process.env.SNAPFRONT_FAKE_AI=JSON.stringify(answer);
 const result=await read(await call(a.token,'POST',`/api/products/${made.product.id}/digital-designer`,body),200);
 assert.equal(result.document.title,'Quiet Days Student Planner');assert.equal(result.image_requests.length,2);
 assert.ok(result.document.pages.every(p=>p.blocks.some(b=>b.text?.includes('quiet study'))));
 assert.equal(result.document.pages[0].blocks.find(b=>b.kind==='image').image_file,document.pages[0].blocks.find(b=>b.kind==='image').image_file);
 const saved=await read(await call(a.token,'GET',`/api/products/${made.product.id}/digital-design`),200);assert.deepEqual(saved.document,document);
 await read(await call(a.token,'POST',`/api/products/${made.product.id}/digital-designer`,{...body,scope:'page'}),502);
 for(const invalid of [{...answer,image_requests:[{...answer.image_requests[0],page_id:'foreign-page'}]},{...answer,image_requests:[{...answer.image_requests[0],replace_block_id:'idea-heading-1'}]},{...answer,image_requests:Array(4).fill(answer.image_requests[0])},{...answer,pages:[{...answer.pages[0],id:'foreign-page'}]}]){
  process.env.SNAPFRONT_FAKE_AI=JSON.stringify(invalid);await read(await call(a.token,'POST',`/api/products/${made.product.id}/digital-designer`,body),502);
 }
 delete process.env.SNAPFRONT_FAKE_AI;
});
