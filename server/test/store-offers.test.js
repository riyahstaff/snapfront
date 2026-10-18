import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sf-offers-'));
process.env.DATA_DIR=dir;process.env.PUBLIC_URL='https://shop.example';process.env.STRIPE_SECRET_KEY='sk_test_fake';process.env.STRIPE_WEBHOOK_SECRET='whsec_fake';process.env.PLATFORM_FEE_PERCENT='5';
const {app,reconcileStripe}=await import('../src/index.js');
const {db}=await import('../src/db.js');
const pay=await import('../src/payments.js');
const commerce=await import('../src/commerce.js');
const memberships=await import('../src/store-subscriptions.js');
const {miraProposal}=await import('../src/mira.js');
const sessions=new Map(),subs=new Map(),calls=[];
let server,base,token,seller,account,first,second,bundle,offer,order;
let failStripe=false;
pay.setStripeClient({
 accounts:{retrieve:async()=>({charges_enabled:true})},
 checkout:{sessions:{create:async(params,opts)=>{const id=`cs_${sessions.size+1}`;calls.push({params,opts});sessions.set(id,{id,status:'open',payment_status:'unpaid',...params});return {id,url:`https://checkout.stripe.com/${id}`};},retrieve:async(id)=>sessions.get(id)}},
 subscriptions:{retrieve:async(id,params,opts)=>{if(failStripe)throw Error('transient');assert.equal(opts.stripeAccount,'acct_store');return subs.get(id);}},
 billingPortal:{configurations:{list:async()=>({data:[]}),create:async(p,o)=>{assert.equal(o.stripeAccount,'acct_store');assert.equal(p.features.subscription_cancel.mode,'at_period_end');return{id:'bpc'};}},sessions:{create:async(p,o)=>{assert.equal(o.stripeAccount,'acct_store');assert.equal(p.customer,'cus_buyer');return{url:'https://billing.stripe.com/session'};}}},
 webhooks:{constructEvent:(raw)=>JSON.parse(raw.toString())}
});
before(async()=>{server=app.listen(0);await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;});
after(()=>{server.close();db.close();fs.rmSync(dir,{recursive:true,force:true});});
async function call(method,url,body,expected=200,auth=true){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(auth&&token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});const j=await r.json();assert.equal(r.status,expected,JSON.stringify(j));return j;}
async function webhook(type,object,account='acct_store',expected=200){return call('POST','/api/stripe/webhook',{type,account,data:{object}},expected,false);}
function makeSub(status='active',cancel=false){return{id:'sub_store',object:'subscription',customer:'cus_buyer',status,cancel_at_period_end:cancel,metadata:{snapfront_order:order.id},items:{data:[{current_period_end:Math.floor(Date.now()/1000)+86400}]},latest_invoice:{id:'in_first',status:status==='past_due'?'open':'paid',amount_paid:1900,currency:'usd',created:Math.floor(Date.now()/1000)}};}

test('bundle ownership, validation, publishing and checkout snapshots',async()=>{
 const reg=await call('POST','/api/sellers',{store_name:'Chef Library'},201);token=reg.token;seller=reg.seller;account=reg.account;
 db.prepare("UPDATE sellers SET stripe_account_id='acct_store',stripe_ready=1 WHERE id=?").run(seller.id);db.prepare("UPDATE accounts SET plan='pro' WHERE id=?").run(account.id);
 first=await call('POST','/api/products',{title:'Cooking guide',kind:'digital',price:12,delivery_url:'https://files.example/cook.pdf'},201);
 second=await call('POST','/api/products',{title:'Weekly planner',kind:'digital',price:10,delivery_url:'https://files.example/plan.pdf'},201);
 await call('POST','/api/store-offers',{title:'Invalid',price:15,product_ids:[first.id,first.id]},400);
 await call('POST','/api/store-offers',{title:'Invalid',price:15,product_ids:[first.id,'foreign']},400);
 bundle=await call('POST','/api/store-offers',{title:'Chef bundle',price:15,product_ids:[first.id,second.id]},201);
 await call('POST',`/api/products/${bundle.id}/publish`,{},400);
 for(const p of [first,second,bundle])await call('POST',`/api/products/${p.id}/publish`,{});
 await call('DELETE',`/api/products/${first.id}`,undefined,409);
 const checkout=await call('POST',`/s/${seller.store_slug}/checkout`,{items:[{product_id:bundle.id,qty:1,unit_cents:1}]});
 const params=calls.at(-1);assert.equal(params.opts.stripeAccount,'acct_store');assert.equal(params.params.mode,'payment');assert.equal(params.params.line_items[0].price_data.unit_amount,1500);
 const row=db.prepare('SELECT * FROM orders WHERE id=?').get(checkout.order_id);
 assert.equal(commerce.downloadsFor(row).length,0);
 await call('PATCH',`/api/products/${first.id}`,{delivery_url:'https://files.example/new.pdf'});
 const session={...sessions.get(row.checkout_session_id),object:'checkout.session',payment_status:'paid',customer_details:{email:'buyer@example.com'}};sessions.set(session.id,session);
 await webhook('checkout.session.completed',session);
 const paid=db.prepare('SELECT * FROM orders WHERE id=?').get(row.id);assert.equal(commerce.downloadsFor(paid).length,2);
 assert.equal(commerce.downloadFor(row.id,first.id).delivery_url,'https://files.example/cook.pdf');
 assert.equal(commerce.downloadFor(row.id,'foreign'),null);
});

test('monthly checkout, retry before fulfillment, customer portal and recurring state',async()=>{
 offer=await call('POST','/api/store-offers',{title:'Chef Club',price:19,product_ids:[first.id,second.id],billing_interval:'month'},201);
 await call('POST',`/api/products/${offer.id}/publish`,{});
 await call('POST',`/s/${seller.store_slug}/checkout`,{items:[{product_id:offer.id},{product_id:bundle.id}]},400);
 await call('POST',`/s/${seller.store_slug}/checkout`,{items:[{product_id:offer.id}],code:'SAVE'},400);
 const checkout=await call('POST',`/s/${seller.store_slug}/checkout`,{items:[{product_id:offer.id}]});
 const params=calls.at(-1).params;assert.equal(params.mode,'subscription');assert.equal(params.line_items[0].price_data.recurring.interval,'month');assert.equal(params.subscription_data.application_fee_percent,5);assert.equal(params.payment_intent_data,undefined);
 order=db.prepare('SELECT * FROM orders WHERE id=?').get(checkout.order_id);
 subs.set('sub_store',makeSub());
 const session={...sessions.get(order.checkout_session_id),object:'checkout.session',status:'complete',payment_status:'paid',subscription:'sub_store',customer:'cus_buyer',customer_details:{email:'buyer@example.com'}};sessions.set(session.id,session);
 await webhook('checkout.session.completed',session,'acct_wrong');assert.equal(db.prepare('SELECT status FROM orders WHERE id=?').get(order.id).status,'pending');
 failStripe=true;await webhook('checkout.session.completed',session,'acct_store',500);assert.equal(db.prepare('SELECT status FROM orders WHERE id=?').get(order.id).status,'pending');failStripe=false;
 await webhook('checkout.session.completed',session);order=db.prepare('SELECT * FROM orders WHERE id=?').get(order.id);
 assert.equal(order.status,'paid');assert.equal(commerce.downloadsFor(order).length,2);
 assert.equal(commerce.downloadFor(order.id,first.id).delivery_url,'https://files.example/new.pdf');
 const publicSub=memberships.publicSubscription(order.id);const t=new URL(publicSub.manage_url).searchParams.get('t');assert.equal(await memberships.portal(t),'https://billing.stripe.com/session');
 await assert.rejects(()=>memberships.portal('bad'),/expired/);
 await call('PUT',`/api/store-offers/${offer.id}`,{title:'Updated Club',price:29,product_ids:[second.id],billing_interval:'year'});
 assert.equal(commerce.downloadsFor(order).length,2); // existing membership scope is pinned
 const sub=makeSub('active',true);subs.set(sub.id,sub);await webhook('customer.subscription.updated',sub);assert.equal(memberships.access(order),true);assert.equal(memberships.publicSubscription(order.id).cancel_at_period_end,true);
 sub.status='past_due';sub.latest_invoice={id:'in_second',status:'open'};await webhook('invoice.payment_failed',{object:'invoice',parent:{subscription_details:{subscription:sub.id}}});assert.equal(commerce.downloadsFor(order).length,0);assert.equal(commerce.downloadFor(order.id,first.id),null);
 sub.status='active';sub.cancel_at_period_end=false;sub.latest_invoice={id:'in_second',object:'invoice',status:'paid',parent:{subscription_details:{subscription:sub.id}},amount_paid:1900,currency:'usd'};
 await webhook('invoice.paid',sub.latest_invoice);await webhook('invoice.paid',sub.latest_invoice);assert.equal(memberships.access(order),true);assert.equal(memberships.list(seller)[0].revenue_cents,3800);
 sub.status='canceled';await webhook('customer.subscription.deleted',sub);await webhook('customer.subscription.updated',{...sub,status:'active'});assert.equal(memberships.access(order),false); // old event cannot restore access
});

test('yearly pricing and Mira proposals are scoped and do not mutate the store',async()=>{
 const checkout=await call('POST',`/s/${seller.store_slug}/checkout`,{items:[{product_id:offer.id}]});assert.ok(checkout.url);assert.equal(calls.at(-1).params.line_items[0].price_data.recurring.interval,'year');
 const before=db.prepare('SELECT * FROM sellers WHERE id=?').get(seller.id);
 process.env.SNAPFRONT_FAKE_AI=JSON.stringify({reply:'A warm cooking design will suit your collection.',photo_tip:'Use a bright overhead food photo.',patch:{theme:'p-digital-cooking',hero_motion:'drift',hero_title:'Cook with confidence',stripe_account_id:'evil',store_slug:'evil'}});
 const result=await call('POST','/api/storefront/mira',{message:'Make my cooking shop warm',draft:{theme:'classic'}});
 assert.deepEqual(Object.keys(result.patch).sort(),['hero_motion','hero_title','theme']);assert.equal(result.patch.theme,'p-digital-cooking');
 assert.deepEqual(db.prepare('SELECT * FROM sellers WHERE id=?').get(seller.id),before);
 process.env.SNAPFRONT_FAKE_AI=JSON.stringify({reply:'x',patch:{theme:'not-real'}});await assert.rejects(()=>miraProposal(before,{message:'Make it warm'}),/doesn't exist/);
 delete process.env.SNAPFRONT_FAKE_AI;
});
