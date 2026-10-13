import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'snapfront-classic-parity-'));
process.env.PUBLIC_URL='https://snapfront.app';
process.env.STORE_DOMAIN='';
const render=await import('../src/render.js');
const {THEMES}=await import('../src/themes.js');
const expected=JSON.parse(fs.readFileSync(new URL('./fixtures/classic-page-hashes.json',import.meta.url),'utf8'));
const product={id:'',slug:'real-piece',title:'Real product',image_url:'https://seller.test/real.jpg',alt_text:'Seller product',price_cents:7800,currency:'usd',variants:[],in_stock:true,status:'live',kind:'physical',tagline:'Seller details',category:'Category one',bullets:[],tags:[],faq:[],description:'Real product description.'};
const products=Array.from({length:5},(_,i)=>({...product,slug:'real-'+i,category:i%2?'Category two':'Category one'}));

test('all 20 original themes preserve exact baseline HTML, CSS, entrance motion, parallax and commerce markup',()=>{
  assert.equal(Object.keys(expected).length,100);
  for(const t of THEMES.slice(0,20)){
    const store={store_name:'Seller store',store_slug:'fixture',_base:'/s/fixture',theme:t.id,tagline:'Seller words.',about:'The actual seller story.',stripe_ready:true,banner_file:'seller-cover.jpg'};
    const pages=[['store',()=>render.storePage(store,products)],['empty-store',()=>render.storePage({...store,banner_file:null},[])],['category',()=>render.storePage(store,products,undefined,{category:'Category two'})],['product',()=>render.productPage(store,product,undefined,products)],['cart',()=>render.cartPage(store)]];
    for(const [name,fn]of pages){
      const html=fn().replace(/© \d{4}/g,'© YEAR');
      const hash=crypto.createHash('sha256').update(html).digest('hex');
      assert.equal(hash,expected[`${t.id}:${name}`],`${t.id} ${name} differs from original production baseline`);
    }
  }
});
