// snapfront.app home page: what Snapfront does, what it costs, where to get it.
import { PLANS } from "./plans.js";

const PLAY_URL = process.env.PLAY_STORE_URL || "";   // set once the Google Play listing is public

export function landingPage() {
  const year = new Date().getFullYear();
  const cta = PLAY_URL
    ? `<a class="play" href="${PLAY_URL}">Get it on Google Play</a>`
    : `<span class="play soon">Coming soon to Google Play</span>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Snapfront: snap a photo, open a store</title>
<meta name="description" content="Snap a product photo and Snapfront writes the page, sets a price that beats Amazon and Walmart, and takes payments with Stripe. Dropship from CJ, Printful or AliExpress.">
<meta property="og:title" content="Snapfront: snap a photo, open a store"><meta property="og:description" content="A full product page and checkout from one photo. No fees on your sales.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;600;700&display=swap">
<style>
:root{--paper:#F2F3F7;--card:#fff;--ink:#16152E;--muted:#5D5F78;--line:#D6D9E5;--cobalt:#2C47F5;--flash:#FFD84A;--on-cobalt:#fff}
@media(prefers-color-scheme:dark){:root{--paper:#0F0F1C;--card:#191A2B;--ink:#EEEEF7;--muted:#A3A5BE;--line:#2F3149;--cobalt:#7C8CFF;--on-cobalt:#0F0F1C}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.55 Figtree,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:inherit}.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header{padding:22px 0}header .wrap{display:flex;justify-content:space-between;align-items:center}
.logo{font:800 24px/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.02em;text-decoration:none}
.hero{padding:48px 0 72px;display:grid;gap:28px}
.frame{position:relative;padding:28px 30px;justify-self:start;max-width:100%}
.frame i{position:absolute;width:34px;height:34px;border:0 solid var(--cobalt)}
.frame i:nth-child(1){top:0;left:0;border-top-width:5px;border-left-width:5px}.frame i:nth-child(2){top:0;right:0;border-top-width:5px;border-right-width:5px}
.frame i:nth-child(3){bottom:0;left:0;border-bottom-width:5px;border-left-width:5px}.frame i:nth-child(4){bottom:0;right:0;border-bottom-width:5px;border-right-width:5px}
h1{font:800 clamp(44px,9vw,104px)/.95 "Bricolage Grotesque",sans-serif;letter-spacing:-.045em;margin:0;text-wrap:balance}
.lede{font-size:clamp(18px,2.2vw,21px);color:var(--muted);max-width:56ch;margin:0}
.play{display:inline-flex;align-items:center;gap:10px;background:var(--ink);color:var(--paper);font-weight:700;padding:15px 24px;border-radius:999px;text-decoration:none;justify-self:start}
.play.soon{background:var(--card);color:var(--ink);border:1px solid var(--line)}
h2{font:800 clamp(28px,4vw,40px)/1.05 "Bricolage Grotesque",sans-serif;letter-spacing:-.03em;margin:0 0 20px}
section{padding:56px 0;border-top:1px solid var(--line)}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:28px;list-style:none;padding:0;margin:0;counter-reset:s}
.steps li{counter-increment:s;display:grid;gap:6px}.steps li::before{content:counter(s);font:800 44px/1 "Bricolage Grotesque",sans-serif;color:var(--cobalt)}
.steps b{font-size:19px}.steps span{color:var(--muted)}
.suppliers{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.suppliers span{border:1px solid var(--line);background:var(--card);border-radius:999px;padding:7px 14px;font-weight:600;font-size:15px}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.plan{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px;display:grid;gap:8px;align-content:start}
.plan.pro{border:2px solid var(--cobalt)}.plan h3{margin:0;font:800 22px/1 "Bricolage Grotesque",sans-serif}
.price{font:800 38px/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.02em}.price small{font:400 15px Figtree,sans-serif;color:var(--muted);letter-spacing:0}
.plan ul{margin:6px 0 0;padding-left:18px;color:var(--muted)}.plan li{margin:3px 0}
.zero{background:var(--flash);color:#16152E;display:inline-block;font-weight:700;padding:2px 10px;border-radius:6px}
footer{padding:36px 0 48px;color:var(--muted);font-size:15px;border-top:1px solid var(--line)}footer .wrap{display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between}
footer nav{display:flex;gap:18px}
</style></head><body>
<header><div class="wrap"><a class="logo" href="/">Snapfront</a></div></header>
<main>
<div class="wrap hero">
  <div class="frame"><i></i><i></i><i></i><i></i><h1>Snap a photo.<br>Open a store.</h1></div>
  <p class="lede">Point your phone at a product. Snapfront writes the page, finds what Amazon and Walmart charge, sets a price that beats them, and takes payments straight into your Stripe account.</p>
  ${cta}
</div>
<section><div class="wrap">
  <h2>From photo to paid in three steps</h2>
  <ol class="steps">
    <li><b>Snap or pick a product</b><span>Take a photo, upload a supplier screenshot, or add something from your supplier’s catalog.</span></li>
    <li><b>Get the page and the price</b><span>Title, description, options and a price checked against the big retailers, ready to edit.</span></li>
    <li><b>Share your store</b><span>Your store gets its own address, like yourshop.snapfront.app. Buyers pay with Stripe and your supplier ships.</span></li>
  </ol>
  <div class="suppliers" aria-label="Suppliers you can connect"><span>CJdropshipping</span><span>Printful</span><span>AliExpress</span><span>Your own stock</span></div>
</div></section>
<section><div class="wrap">
  <h2>Simple pricing. <span class="zero">0% fees</span> on your sales.</h2>
  <div class="plans">
    <div class="plan"><h3>Free</h3><div class="price">$0</div><ul><li>Build your store and try the AI</li><li>${PLANS.free.photo} AI product pages</li><li>${PLANS.free.research} price checks</li></ul></div>
    <div class="plan"><h3>Launch</h3><div class="price">$29 <small>one time</small></div><ul><li>Publish one store and take payments</li><li>${PLANS.launch.photo} AI product pages a month</li><li>${PLANS.launch.research} price checks a month</li></ul></div>
    <div class="plan pro"><h3>Pro</h3><div class="price">$14.99 <small>a month</small></div><ul><li>Up to ${PLANS.pro.liveStores} live stores</li><li>${PLANS.pro.photo} AI product pages a month</li><li>The store assistant</li></ul></div>
  </div>
</div></section>
</main>
<footer><div class="wrap"><span>© ${year} Snapfront</span><nav><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav></div></footer>
</body></html>`;
}
