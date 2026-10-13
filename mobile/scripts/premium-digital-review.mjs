import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '../../server/node_modules/@resvg/resvg-js/index.js';
import { digitalTemplates,fontPaths } from '../../server/src/digital-catalog.js';
import { starterDocument } from '../../server/src/digital-document.js';
import { renderDigitalExport } from '../../server/src/digital-renderer.js';
const out=path.resolve(process.argv[2]||'/home/ubuntu/snapfront-delivery/premium-digital-v2');
fs.mkdirSync(path.join(out,'covers'),{recursive:true});fs.mkdirSync(path.join(out,'interiors'),{recursive:true});
const results=[];
for(const t of digitalTemplates){
 const doc=starterDocument(t.id,{design_revision:2});
 const exported=await renderDigitalExport(doc);
 fs.writeFileSync(path.join(out,'covers',t.id+'.png'),exported.cover);
 const interior=exported.preview.pages[1];
 const image=new Resvg(interior.svg,{fitTo:{mode:'width',value:612},font:{fontFiles:Object.values(fontPaths),loadSystemFonts:false}}).render().asPng();
 fs.writeFileSync(path.join(out,'interiors',t.id+'.png'),image);
 const extracted=t.format==='quotes'?doc.pages[0].blocks[0].text:doc.title;
 fs.writeFileSync(path.join(out,t.id+'.pdf'),exported.pdf);
 results.push({id:t.id,name:t.name,format:t.format,title:extracted,revision:doc.design_revision,page_count:exported.preview.page_count,pdf_bytes:exported.pdf.length,cover_bytes:exported.cover.length,max_svg_bytes:Math.max(...exported.preview.pages.map(p=>Buffer.byteLength(p.svg))),art_count:(exported.preview.pages[0].svg.match(/<image /g)||[]).length});
 console.log(`Verified premium ${t.id}: ${t.name}, ${exported.preview.page_count} pages`);
}
fs.writeFileSync(path.join(out,'renderer-results.json'),JSON.stringify(results,null,2)+'\n');
const esc=x=>String(x).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const groups=['guide','checklist','hooks','quotes','planner'];
const sections=groups.map(g=>`<section><h2>${esc(g.toUpperCase())} / 10 SIGNATURE DESIGNS</h2><div class="cards">${results.filter(t=>t.format===g).map(t=>`<article><a href="${t.id}.pdf"><img src="covers/${t.id}.png" alt="${esc(t.name)} actual editable cover"></a><div class="meta"><span>${t.id.toUpperCase()}</span><h3>${esc(t.name)}</h3><p>Actual editable design · ${t.page_count} pages</p><details><summary>See the matching interior</summary><img src="interiors/${t.id}.png" alt="Actual interior"></details></div></article>`).join('')}</div></section>`).join('');
fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Snapfront / Signature digital collection</title><style>*{box-sizing:border-box}body{margin:0;background:#090B0E;color:#EEF0F4;font-family:Arial,sans-serif}main{max-width:1580px;margin:auto;padding:50px 34px}small{font-size:12px;letter-spacing:.24em;color:#A8B2C0}h1{font-size:clamp(36px,5vw,72px);font-weight:500;letter-spacing:-.05em;margin:22px 0}header p{color:#A8B2C0;max-width:680px;line-height:1.7}section{margin-top:56px}h2{font-size:13px;letter-spacing:.15em;border-bottom:1px solid #333A43;padding-bottom:18px}.cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:24px;margin-top:24px}article{min-width:0;background:#12161C;border:1px solid #333A43;border-radius:12px;overflow:hidden}article img{display:block;width:100%;height:auto}.meta{padding:16px}.meta span{font-size:10px;letter-spacing:.14em;color:#A8B2C0}h3{font-size:16px;line-height:1.4;margin:10px 0}.meta p{font-size:11px;color:#A8B2C0;line-height:1.5}summary{cursor:pointer;font-size:12px;margin:12px 0;color:#D3DBE9}details img{border:1px solid #3A414D}@media(max-width:950px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}main{padding:28px 20px}}a{color:inherit}</style></head><body><main><header><small>SNAPFRONT / SIGNATURE COLLECTION 02</small><h1>Digital, with distinction.</h1><p>50 original premium designs. Real editable type, artwork and matching interiors rendered by the same engine used in the app and downloadable PDFs. Select a cover to inspect its actual PDF. These are sample designs—not seller products or a released app build.</p></header>${sections}</main></body></html>\n`);
console.log('Complete real-renderer review gallery:',out);
