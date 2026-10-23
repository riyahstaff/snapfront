const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/lib/mira-images.ts'),'utf8'),module_={exports:{}};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:module_,exports:module_.exports});
const {applyMiraImages}=module_.exports;
const document={pages:[{id:'one',blocks:[{id:'heading',kind:'heading',text:'My week'},{id:'topic-image',kind:'image',image_file:'starter.webp'}]},{id:'two',blocks:[{id:'text',kind:'paragraph',text:'Quiet study time'}]}]};
const requests=[{page_id:'one',replace_block_id:'topic-image',prompt:'Roses',aspect:'wide'},{page_id:'two',prompt:'River',aspect:'wide'}];
const done=(id,file)=>({id,status:'done',context:'digital',operation:'digital-art',product_id:'product-a',image_file:file});
test('rose and river images reach their target pages without losing writing or mutating the source',()=>{
 const result=applyMiraImages(document,requests,[done('rose','rose.jpg'),done('river','river.jpg')],'product-a');
 assert.equal(result.pages[0].blocks[1].image_file,'rose.jpg');assert.equal(result.pages[1].blocks[1].image_file,'river.jpg');
 assert.equal(result.pages[1].blocks[0].text,'Quiet study time');assert.equal(document.pages[0].blocks[1].image_file,'starter.webp');
});
test('only finished images can be applied after a partial generation failure',()=>{
 const result=applyMiraImages(document,requests,[done('rose','rose.jpg'),{status:'running'}],'product-a');
 assert.equal(result.pages[0].blocks[1].image_file,'rose.jpg');assert.equal(result.pages[1].blocks.length,1);
});
test('reject foreign products, unsafe filenames and removed targets',()=>{
 assert.throws(()=>applyMiraImages(document,requests,[done('rose','rose.jpg')],'other-product'));
 assert.throws(()=>applyMiraImages(document,requests,[done('rose','../../other.jpg')],'product-a'));
 assert.throws(()=>applyMiraImages(document,[{...requests[0],page_id:'removed'}],[done('rose','rose.jpg')],'product-a'));
 assert.throws(()=>applyMiraImages(document,[{...requests[0],replace_block_id:'heading'}],[done('rose','rose.jpg')],'product-a'));
});
