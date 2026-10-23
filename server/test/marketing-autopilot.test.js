import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"snapfront-autopilot-"));
Object.assign(process.env,{ ANTHROPIC_API_KEY:"test-not-a-real-key",DATA_DIR:tmp,PUBLIC_URL:"https://snapfront.app",OWNER_EMAILS:"owner@example.test",META_APP_ID:"1234",META_APP_SECRET:"test",META_LOGIN_CONFIG_ID:"config",META_TOKEN_ENCRYPTION_KEY:Buffer.alloc(32,9).toString("base64"),META_PUBLISHING_ENABLED:"true" });
const {app}=await import("../src/index.js");
const {db}=await import("../src/db.js");
const plans=await import("../src/plans.js");
const center=await import("../src/marketing-center.js");
const auto=await import("../src/marketing-autopilot.js");
const faceless=await import("../src/faceless.js");
const social=await import("../src/social.js");
let server,base,owner,other,campaign;
const root="/api/admin/owner/marketing/autopilot";
const future=(mins=20)=>new Date(Date.now()+mins*60000).toISOString();
function blog(title="A practical first product") { return {title,description:"A practical guide to creating a useful digital product.",body:("Start with a specific audience and a problem you understand. Outline a useful resource, test it with readers, and improve its instructions before sharing it. Snapfront offers digital-product creation and editing with Mira. ").repeat(15)}; }
function video() {return {title:"Start with one useful product",caption:"Explore Snapfront at snapfront.app",hook:"One useful product",feature:"digital",scenes:[{text:"Choose your audience",say:"Start with an audience you understand and one practical problem you can help them solve."},{text:"Create something useful",say:"Snapfront offers digital product creation and editing with Mira, so you can shape your first resource."},{text:"Make the store yours",say:"Customize a ready designed storefront with your own words and images, then keep improving your offer."}]};}
function config(body={}) {return {campaign_id:campaign.id,enabled:true,revision:auto.status(owner.account,owner.store).settings.revision,timezone:"America/New_York",social_times:[],article_days:[2,5],article_time:"10:00",account_ids:[],daily_ai_limit:4,confirm:true,...body};}
function job(kind="blog",due=future(),key=`manual-${Math.random()}`) {
 const s=auto.status(owner.account,owner.store).settings,id=`autojob_${Math.random().toString(36).slice(2)}`;
 db.prepare("INSERT INTO owner_autopilot_jobs(id,seller_id,account_id,campaign_id,settings_revision,kind,slot_key,due_at,state,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,'queued',datetime('now'),datetime('now'))").run(id,owner.store.id,owner.account.id,campaign.id,s.revision,kind,key,due);
 return id;
}
const get=(id)=>db.prepare("SELECT * FROM owner_autopilot_jobs WHERE id=?").get(id);
async function call(method,url,body,token=owner.token) {const r=await fetch(base+url,{method,headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:await r.json()};}
before(async()=>{
 owner=plans.createAccountWithStore("Owner");other=plans.createAccountWithStore("Other");db.prepare("UPDATE accounts SET email='owner@example.test' WHERE id=?").run(owner.account.id);owner.account.email="owner@example.test";
 campaign=center.createCampaign(owner.account,owner.store,{title:"Snapfront marketing",audience:"New digital creators",goal:"Explore Snapfront"});
 db.prepare("INSERT INTO social_connections(id,seller_id,meta_user_id,platform,remote_id,name,access_token_enc,created_at,updated_at) VALUES ('owned-page',?,'owner','facebook','page','Snapfront Page','not-used',datetime('now'),datetime('now'))").run(owner.store.id);
 social.setMetaTransport(async()=>{throw new Error("No live posting in tests");});
 server=app.listen(0);await new Promise(r=>server.once("listening",r));base=`http://127.0.0.1:${server.address().port}`;
});
beforeEach(()=>{
 db.prepare("DELETE FROM owner_autopilot_jobs").run();db.prepare("DELETE FROM owner_autopilot").run();db.prepare("DELETE FROM owner_marketing_runs").run();
 process.env.SNAPFRONT_FAKE_AI=JSON.stringify(blog());
});
after(()=>{server.close();social.setMetaTransport(null);db.close();fs.rmSync(tmp,{recursive:true,force:true});});

test("owner-only API and standing authorization are required; deployment defaults to off",async()=>{
 assert.equal((await call("GET",root,undefined,other.token)).status,403);
 assert.equal((await call("PUT",root,config(),other.token)).status,403);
 assert.equal((await call("POST",root+"/pause",{revision:0},other.token)).status,403);
 assert.equal((await call("GET",root)).body.running,false);
 assert.equal((await call("PUT",root,config({confirm:false}))).status,400);
 const enabled=await call("PUT",root,config());assert.equal(enabled.status,200);assert.equal(enabled.body.running,true);
 assert.equal((await call("PUT",root,config({revision:0}))).status,409);
 assert.throws(()=>auto.status(owner.account,other.store),{status:403});
});

test("time zones and daylight saving preserve local posting times without duplicate fall-back slots",()=>{
 assert.equal(auto.timeInZone("2026-10-23","09:00","America/New_York"),"2026-10-23T13:00:00.000Z");
 assert.equal(auto.timeInZone("2026-11-02","09:00","America/New_York"),"2026-11-02T14:00:00.000Z");
 assert.equal(auto.timeInZone("2027-03-14","02:30","America/New_York"),null);
 const slots=auto.slots({...config(),social_times:["01:30"],article_days:[]},new Date("2026-11-01T12:00:00Z"),1).filter(s=>s.slot_key.startsWith("2026-11-01"));
 assert.equal(slots.length,1);
 assert.throws(()=>auto.save(owner.account,owner.store,config({timezone:"invalid/time"})),{status:400});
 assert.throws(()=>auto.save(owner.account,owner.store,config({social_times:["25:00"]})),{status:400});
});

test("social destinations must be connected and owned; budgets are bounded",()=>{
 assert.throws(()=>auto.save(owner.account,owner.store,config({social_times:["09:00"],account_ids:["foreign"]})),{status:400});
 assert.throws(()=>auto.save(owner.account,owner.store,config({social_times:["09:00"],account_ids:[]})),{status:400});
 for(const n of [0,7,2.5])assert.throws(()=>auto.save(owner.account,owner.store,config({daily_ai_limit:n})),{status:400});
 assert.equal(auto.save(owner.account,owner.store,config({social_times:["09:00"],account_ids:["owned-page"]})).running,true);
});

test("a scheduled article is written and approved automatically once, with no per-post click",async()=>{
 auto.save(owner.account,owner.store,config());const id=job();
 await auto.tick();let j=get(id);assert.equal(j.state,"submitted");assert.equal(j.attempts,1);
 const item=db.prepare("SELECT * FROM owner_content WHERE id=?").get(j.content_id);assert.equal(item.status,"scheduled");
 await auto.tick();assert.equal(get(id).content_id,j.content_id);assert.equal(get(id).attempts,1);
 assert.equal(db.prepare("SELECT COUNT(*) n FROM owner_marketing_runs WHERE id LIKE 'auto_%'").get().n,1);
 db.prepare("UPDATE owner_content SET scheduled_at=? WHERE id=?").run(new Date(Date.now()-1000).toISOString(),item.id);
 center.publishDue();assert.match(center.blog(item.slug),/A practical first product/);
});

test("pause cancels queued articles and jobs; re-enable revives future slots only",async()=>{
 auto.save(owner.account,owner.store,config());const id=job();await auto.tick();const contentId=get(id).content_id;
 let state=auto.status(owner.account,owner.store);auto.pause(owner.account,owner.store,{revision:state.settings.revision});
 assert.equal(get(id).state,"canceled");assert.equal(db.prepare("SELECT status FROM owner_content WHERE id=?").get(contentId).status,"draft");
 await auto.tick();assert.equal(get(id).state,"canceled");
 const now=new Date(), s=config();s.social_times=[];s.article_days=[0,1,2,3,4,5,6].filter(d=>d===new Date(now.getTime()+86400000).getUTCDay());
 auto.save(owner.account,owner.store,s);await auto.tick();
 const futureRow=db.prepare("SELECT * FROM owner_autopilot_jobs WHERE state='queued' ORDER BY due_at DESC LIMIT 1").get();assert.ok(futureRow);
 state=auto.status(owner.account,owner.store);auto.pause(owner.account,owner.store,{revision:state.settings.revision});
 auto.save(owner.account,owner.store,config({article_days:s.article_days}));await auto.tick();
 assert.equal(get(futureRow.id).state,"queued");
});

test("daily call limits include failures and prevent further generation",async()=>{
 auto.save(owner.account,owner.store,config({daily_ai_limit:1}));const first=job();await auto.tick();assert.equal(get(first).attempts,1);
 const second=job();await auto.tick();assert.equal(get(second).state,"failed");assert.equal(get(second).attempts,0);assert.match(get(second).error,/limit/);
});

test("unsafe claims are held and old missed slots are skipped, never catch-up published",async()=>{
 process.env.SNAPFRONT_FAKE_AI=JSON.stringify(blog("Become a millionaire"));auto.save(owner.account,owner.store,config());
 const bad=job(),old=job("blog",new Date(Date.now()-3*3600000).toISOString());await auto.tick();
 assert.equal(get(bad).state,"held");assert.equal(get(bad).content_id,null);assert.equal(get(old).state,"skipped");assert.equal(get(old).attempts,0);
});

test("one social slot creates one durable brand video and queues each destination only once",async()=>{
 process.env.SNAPFRONT_FAKE_AI=JSON.stringify(video());auto.save(owner.account,owner.store,config({social_times:["09:00"],account_ids:["owned-page"]}));
 const id=job("social");await auto.tick();let j=get(id);assert.equal(j.state,"rendering");assert.ok(j.video_id);
 const stored=db.prepare("SELECT * FROM faceless_jobs WHERE id=?").get(j.video_id);assert.equal(stored.product_id,null);assert.equal(JSON.parse(stored.script).brand,"snapfront");
 assert.equal(faceless.startBrand(owner.store,video(),id).id,j.video_id);await auto.tick();assert.equal(get(id).video_id,j.video_id);
 // Provider-free MP4 header fixture exercises owned media validation and the real publishing queue.
 const bytes=Buffer.alloc(256);bytes.write("ftyp",4);fs.writeFileSync(path.join(tmp,"media","autopilot-test.mp4"),bytes);
 db.prepare("UPDATE faceless_jobs SET status='done',file='autopilot-test.mp4',seconds=20 WHERE id=?").run(j.video_id);
 const before=db.prepare("SELECT COUNT(*) n FROM social_posts").get().n;
 await auto.tick();j=get(id);assert.equal(j.state,"submitted");assert.equal(db.prepare("SELECT COUNT(*) n FROM social_posts").get().n,before+1);
 await auto.tick();assert.equal(db.prepare("SELECT COUNT(*) n FROM social_posts").get().n,before+1);
 const state=auto.status(owner.account,owner.store);auto.pause(owner.account,owner.store,{revision:state.settings.revision});assert.equal(get(id).state,"canceled");
});

test("externally edited generated content is held instead of being silently auto-published",async()=>{
 process.env.SNAPFRONT_FAKE_AI=JSON.stringify(video());auto.save(owner.account,owner.store,config({social_times:["09:00"],account_ids:["owned-page"]}));
 const id=job("social");await auto.tick();const j=get(id);assert.equal(j.state,"rendering");
 db.prepare("UPDATE owner_content SET caption='A changed caption',revision=revision+1 WHERE id=?").run(j.content_id);
 const bytes=Buffer.alloc(256);bytes.write("ftyp",4);fs.writeFileSync(path.join(tmp,"media","autopilot-edit.mp4"),bytes);
 db.prepare("UPDATE faceless_jobs SET status='done',file='autopilot-edit.mp4' WHERE id=?").run(j.video_id);
 await auto.tick();assert.equal(get(id).state,"held");assert.match(get(id).error,/changed/);
});

test("expired leases recover interrupted generation; a live lease prevents duplicate workers",async()=>{
 auto.save(owner.account,owner.store,config());const id=job();
 db.prepare("UPDATE owner_autopilot_jobs SET state='writing',attempts=1,lease_token='old',lease_until=? WHERE id=?").run(future(),id);
 await auto.tick();assert.equal(get(id).content_id,null);
 db.prepare("UPDATE owner_autopilot_jobs SET lease_until=? WHERE id=?").run(new Date(Date.now()-1000).toISOString(),id);
 await auto.tick();assert.equal(get(id).state,"submitted");assert.equal(get(id).attempts,2);
});

test("removing owner status disables the automation before any AI work",async()=>{
 auto.save(owner.account,owner.store,config());const id=job();
 db.prepare("UPDATE accounts SET email='former@example.test' WHERE id=?").run(owner.account.id);
 try {await auto.tick();assert.equal(get(id).attempts,0);assert.equal(db.prepare("SELECT enabled FROM owner_autopilot WHERE seller_id=?").get(owner.store.id).enabled,0);}
 finally {db.prepare("UPDATE accounts SET email='owner@example.test' WHERE id=?").run(owner.account.id);}
});

test("pause while the writer is awaiting a reply prevents content and publication",async()=>{
 auto.save(owner.account,owner.store,config());const id=job();
 const {claudeClient}=await import("../src/claude.js"),client=claudeClient(),original=client.messages.create;
 delete process.env.SNAPFRONT_FAKE_AI;
 let resolveReply,started;const ready=new Promise(r=>{started=r;});
 client.messages.create=async(_body,options)=>{assert.equal(options.maxRetries,0);started();return new Promise(r=>{resolveReply=r;});};
 try {
  const running=auto.tick();await ready;
  const s=auto.status(owner.account,owner.store);auto.pause(owner.account,owner.store,{revision:s.settings.revision});
  resolveReply({stop_reason:"tool_use",content:[{type:"tool_use",input:blog()}]});await running;
  assert.equal(get(id).state,"canceled");assert.equal(get(id).content_id,null);
 } finally {client.messages.create=original;}
});

test("each budget reservation makes at most one provider call and retries are bounded",async()=>{
 auto.save(owner.account,owner.store,config());const id=job();
 const {claudeClient}=await import("../src/claude.js"),client=claudeClient(),original=client.messages.create;
 delete process.env.SNAPFRONT_FAKE_AI;let calls=0;
 client.messages.create=async(_body,options)=>{calls++;assert.equal(options.maxRetries,0);return {stop_reason:"max_tokens",content:[{type:"tool_use",input:{}}]};};
 try {
  await auto.tick();assert.equal(calls,1);assert.equal(get(id).state,"queued");
  db.prepare("UPDATE owner_autopilot_jobs SET retry_at=? WHERE id=?").run(new Date(Date.now()-1000).toISOString(),id);
  await auto.tick();assert.equal(calls,2);assert.equal(get(id).state,"failed");
  await auto.tick();assert.equal(calls,2);
 } finally {client.messages.create=original;}
});

test("expired destinations hold a social slot before it spends an AI call",async()=>{
 auto.save(owner.account,owner.store,config({social_times:["09:00"],account_ids:["owned-page"]}));const id=job("social");
 db.prepare("UPDATE social_connections SET token_expires_at=? WHERE id='owned-page'").run(new Date(Date.now()-1000).toISOString());
 try {await auto.tick();assert.equal(get(id).state,"held");assert.equal(get(id).attempts,0);assert.match(get(id).error,/Reconnect|expired/);}
 finally {db.prepare("UPDATE social_connections SET token_expires_at=NULL WHERE id='owned-page'").run();}
});

test("pause cancels remaining destinations even when another destination is already processing",async()=>{
 db.prepare("UPDATE social_connections SET status='connected' WHERE id='owned-page'").run();
 db.prepare("INSERT INTO social_connections(id,seller_id,meta_user_id,platform,remote_id,name,access_token_enc,created_at,updated_at) VALUES ('second-page',?,'owner','facebook','second','Second Page','not-used',datetime('now'),datetime('now'))").run(owner.store.id);
 process.env.SNAPFRONT_FAKE_AI=JSON.stringify(video());auto.save(owner.account,owner.store,config({social_times:["09:00"],account_ids:["owned-page","second-page"]}));
 const id=job("social");await auto.tick();const j=get(id);
 db.prepare("UPDATE faceless_jobs SET status='done',file='autopilot-test.mp4' WHERE id=?").run(j.video_id);
 await auto.tick();assert.equal(get(id).state,"submitted");
 const item=db.prepare("SELECT * FROM owner_content WHERE id=?").get(j.content_id),[first,second]=JSON.parse(item.social_ids);
 db.prepare("UPDATE social_posts SET status='processing' WHERE id=?").run(second);
 db.prepare("UPDATE social_publish_jobs SET status='processing',lease_owner='mock' WHERE post_id=?").run(second);
 const state=auto.status(owner.account,owner.store),paused=auto.pause(owner.account,owner.store,{revision:state.settings.revision});
 assert.equal(paused.in_flight,1);assert.equal(db.prepare("SELECT status FROM social_posts WHERE id=?").get(first).status,"canceled");
 assert.equal(db.prepare("SELECT status FROM social_posts WHERE id=?").get(second).status,"processing");
 db.prepare("UPDATE social_posts SET status='published' WHERE id=?").run(second);
 assert.equal(auto.status(owner.account,owner.store).jobs.find((r)=>r.id===id).state,"partially_published");
});
