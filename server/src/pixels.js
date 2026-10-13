// Ad pixels on the storefront: Meta (Facebook and Instagram ads), TikTok, Google Analytics 4 and
// Pinterest. Sellers paste their IDs; every store page loads the matching tags and reports the
// standard shopping events (page view, product view, add to cart, checkout, purchase, sign-up).
import { db } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";

const addCol = (t, name, def) => { if (!db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === name)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${name} ${def}`); };
addCol("sellers", "meta_pixel_id", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "tiktok_pixel_id", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "ga4_id", "TEXT NOT NULL DEFAULT ''");
addCol("sellers", "pinterest_tag_id", "TEXT NOT NULL DEFAULT ''");

export const PIXELS = [
  { key: "meta_pixel_id", name: "Meta Pixel", hint: "15 or 16 digits, from Meta Events Manager", re: /^\d{10,20}$/, clean: (s) => s.replace(/\D/g, "") },
  { key: "tiktok_pixel_id", name: "TikTok Pixel", hint: "Letters and numbers, from TikTok Ads Manager > Events", re: /^[A-Z0-9]{12,30}$/, clean: (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "") },
  { key: "ga4_id", name: "Google Analytics 4", hint: "Starts with G-, from GA4 Admin > Data streams", re: /^G-[A-Z0-9]{4,16}$/, clean: (s) => s.toUpperCase().replace(/[^A-Z0-9-]/g, "") },
  { key: "pinterest_tag_id", name: "Pinterest Tag", hint: "13 digits, from Pinterest Ads > Conversions", re: /^\d{10,16}$/, clean: (s) => s.replace(/\D/g, "") },
];
const allowed = (seller) => (seller.account_id ? plans.effectivePlan(plans.getAccount(seller.account_id)) !== "free" : true);

export function view(seller) {
  return { allowed: allowed(seller), pixels: PIXELS.map((p) => ({ key: p.key, name: p.name, hint: p.hint, id: seller[p.key] || "" })) };
}
export function update(seller, b = {}) {
  const set = {};
  for (const p of PIXELS) {
    if (b[p.key] === undefined) continue;
    const raw = String(b[p.key] || "").trim();
    const v = p.clean(raw);
    if (raw && !p.re.test(v)) throw httpError(400, `That ${p.name} ID doesn't look right. ${p.hint}.`);
    if (v && !allowed(seller)) throw httpError(402, "Ad pixels come with Launch and Pro.", { upgrade: "launch" });
    set[p.key] = v;
  }
  const keys = Object.keys(set);
  if (keys.length) db.prepare(`UPDATE sellers SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`).run(...keys.map((k) => set[k]), seller.id);
  return view(db.prepare("SELECT * FROM sellers WHERE id = ?").get(seller.id));
}

/**
 * The <head> tags for a store page, plus window.sfTrack(event, data) that sends one event to every
 * pixel in its own vocabulary. Nothing loads for stores without pixels, previews or theme demos.
 */
export function headTags(store) {
  if (!store?.id || store._theme || store._themeDemo || store._draftPreview || store._templatePreview) return "";
  const ids = Object.fromEntries(PIXELS.map((p) => [p.key, p.re.test(store[p.key] || "") ? store[p.key] : ""]));
  if (!Object.values(ids).some(Boolean)) return "";
  const j = (v) => JSON.stringify(v);
  const parts = [];
  if (ids.meta_pixel_id) parts.push(`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${j(ids.meta_pixel_id)});fbq('track','PageView');`);
  if (ids.tiktok_pixel_id) parts.push(`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(${j(ids.tiktok_pixel_id)});ttq.page()}(window,document,'ttq');`);
  if (ids.ga4_id) parts.push(`(function(){var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+${j(ids.ga4_id)};document.head.appendChild(s)})();window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${j(ids.ga4_id)});`);
  if (ids.pinterest_tag_id) parts.push(`!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load',${j(ids.pinterest_tag_id)});pintrk('page');`);
  // One call, four vocabularies. d: {id, name, value (dollars), qty, order}.
  const track = `window.sfTrack=function(ev,d){d=d||{};try{var v=d.value!=null?Number(d.value):undefined,cur="USD",ids=d.id?[String(d.id)]:undefined;
if(window.fbq){var fm={view:"ViewContent",add:"AddToCart",checkout:"InitiateCheckout",purchase:"Purchase",lead:"Lead"}[ev];if(fm)fbq("track",fm,{content_ids:ids,content_name:d.name,content_type:ids?"product":undefined,value:v,currency:cur,num_items:d.qty},d.order?{eventID:d.order}:undefined)}
if(window.ttq){var tm={view:"ViewContent",add:"AddToCart",checkout:"InitiateCheckout",purchase:"CompletePayment",lead:"Subscribe"}[ev];if(tm)ttq.track(tm,{contents:ids?[{content_id:ids[0],content_name:d.name,quantity:d.qty||1}]:undefined,content_type:"product",value:v,currency:cur},d.order?{event_id:d.order}:undefined)}
if(window.gtag){var gm={view:"view_item",add:"add_to_cart",checkout:"begin_checkout",purchase:"purchase",lead:"generate_lead"}[ev];if(gm)gtag("event",gm,{currency:cur,value:v,transaction_id:d.order,items:ids?[{item_id:ids[0],item_name:d.name,quantity:d.qty||1}]:undefined})}
if(window.pintrk){var pm={view:"pagevisit",add:"addtocart",purchase:"checkout",lead:"lead"}[ev];if(pm)pintrk("track",pm,{value:v,currency:cur,order_quantity:d.qty,order_id:d.order,product_id:ids&&ids[0]})}}catch(e){}};`;
  return `<script>${parts.join("\n")}\n${track}</script>`;
}
