// snapfront.app home page: what Snapfront does, what it costs, where to get it. Styled in the
// app's Liquid Chrome look (graphite, platinum, the silver aperture mark and the chrome gateway art).
import { PLANS } from "./plans.js";
import { PLANS as PRICES } from "./webbilling.js";
import { THEMES } from "./themes.js";
import { config } from "./config.js";

const PLAY_URL = process.env.PLAY_STORE_URL || "";   // set once the Google Play listing is public
const webAppUrl = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);

const usd = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
export function landingPage() {
  const year = new Date().getFullYear();
  const web = webAppUrl();
  const play = PLAY_URL
    ? `<a class="btn ghost" href="${PLAY_URL}">Get it on Google Play</a>`
    : `<span class="btn ghost soon">Android app coming soon</span>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Snapfront: snap a photo, open a store</title>
<meta name="description" content="Snap a product photo and Snapfront writes the page, sets a price that beats Amazon and Walmart, and takes payments with Stripe. On your phone or in your browser.">
<meta property="og:title" content="Snapfront: snap a photo, open a store"><meta property="og:description" content="A full product page and checkout from one photo. No fees on your sales.">
<meta property="og:image" content="${config.publicUrl}/site/chrome-hero.webp">
<meta name="theme-color" content="#090B0E"><meta name="color-scheme" content="dark">
<link rel="icon" href="/site/mark.png"><link rel="apple-touch-icon" href="/site/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700;800&display=swap">
<style>
:root{--bg:#090B0E;--surface:#14171C;--sunk:#1D2128;--ink:#F5F6F8;--muted:#ADB4BF;--line:#363C46;--platinum:#E5E9F0;--on-platinum:#11151B;--copper:#D99568;--good:#76D8B3;color-scheme:dark}
*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 Figtree,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}.wrap{max-width:1120px;margin:0 auto;padding-inline:20px}
header{padding-block:18px;position:sticky;top:0;z-index:5;background:rgba(9,11,14,.82);backdrop-filter:blur(12px);border-bottom:1px solid rgba(54,60,70,.5)}
header .wrap{display:flex;justify-content:space-between;align-items:center;gap:16px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;font-size:21px;letter-spacing:-.02em}
.brand img{width:32px;height:32px}
header nav{display:flex;align-items:center;gap:22px;font-weight:500;font-size:15px}header nav a{text-decoration:none;color:var(--muted)}header nav a:hover{color:var(--ink)}
header nav .btn{color:var(--on-platinum)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:12px 24px;border-radius:999px;font-weight:700;font-size:16px;text-decoration:none;border:1px solid var(--platinum);background:var(--platinum);color:var(--on-platinum);transition:transform .15s ease}
.btn:hover{transform:translateY(-1px)}.btn.small{min-height:40px;padding:8px 18px;font-size:15px}
.btn.ghost{background:transparent;color:var(--ink);border-color:var(--line)}.btn.soon{color:var(--muted);cursor:default}.btn.soon:hover{transform:none}
a:focus-visible,.btn:focus-visible{outline:2px solid var(--platinum);outline-offset:3px}
.hero{display:grid;grid-template-columns:1fr;gap:40px;align-items:center;padding-block:56px 72px}
@media(min-width:900px){.hero{grid-template-columns:1.02fr 1fr;padding-block:88px 104px}}
.eyebrow{color:var(--copper);font-weight:700;font-size:13px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 18px}
h1{font-weight:800;font-size:clamp(44px,6.2vw,80px);line-height:.96;letter-spacing:-.045em;margin:0;text-wrap:balance}
h1 span{background:linear-gradient(180deg,#FFFFFF 0%,#C9CFD8 55%,#8D96A3 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.lede{font-size:clamp(18px,2.1vw,20px);color:var(--muted);max-width:52ch;margin:22px 0 0}
.ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}.note{color:var(--muted);font-size:14px;margin:14px 0 0}
.art{position:relative;border-radius:28px;overflow:hidden;border:1px solid var(--line);box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 1px rgba(229,233,240,.04) inset;aspect-ratio:4/3;max-width:100%}
.art img{width:100%;height:100%;object-fit:cover;display:block}
.art figcaption{position:absolute;left:14px;bottom:12px;font-size:12px;color:var(--muted);background:rgba(9,11,14,.7);padding:4px 10px;border-radius:999px}
section{padding-block:72px;border-top:1px solid var(--sunk)}
h2{font-weight:800;font-size:clamp(30px,4.2vw,46px);line-height:1.04;letter-spacing:-.035em;margin:0 0 14px;text-wrap:balance}
.sub{color:var(--muted);max-width:60ch;margin:0 0 32px}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;list-style:none;padding:0;margin:0;counter-reset:s}
.steps li{counter-increment:s;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:24px;display:grid;gap:8px;align-content:start}
.steps li::before{content:counter(s);width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:800;color:var(--on-platinum);background:linear-gradient(160deg,#FFFFFF,#AEB6C2)}
.steps b{font-size:19px}.steps span{color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.chips span{border:1px solid var(--line);border-radius:999px;padding:7px 14px;font-weight:500;font-size:15px;color:var(--muted)}
.devices{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.device{border:1px solid var(--line);border-radius:20px;padding:24px;display:grid;gap:10px;align-content:start;background:linear-gradient(180deg,var(--surface),var(--bg))}
.device h3{margin:0;font-size:20px;letter-spacing:-.01em}.device p{margin:0;color:var(--muted)}.device .btn{justify-self:start;margin-top:8px}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
.plan{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:26px;display:grid;gap:10px;align-content:start;grid-template-rows:auto auto 1fr auto}
.plan.pro{border:2px solid var(--platinum)}.plan h3{margin:0;font-size:22px}
.price{font-weight:800;font-size:40px;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.price small{font-weight:400;font-size:15px;color:var(--muted);letter-spacing:0}
.plan ul{margin:6px 0 8px;padding-left:18px;color:var(--muted)}.plan li{margin:4px 0}.plan .btn{justify-self:start;margin-top:auto}
.zero{color:var(--good)}
footer{padding-block:36px 48px;color:var(--muted);font-size:15px;border-top:1px solid var(--sunk)}footer .wrap{display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between;align-items:center}
footer nav{display:flex;flex-wrap:wrap;gap:18px}
@media(max-width:640px){header nav a:not(.btn){display:none}}
@media(prefers-reduced-motion:reduce){.btn{transition:none}.btn:hover{transform:none}}
</style></head><body>
<header><div class="wrap"><a class="brand" href="/"><img src="/site/mark.png" alt="" width="32" height="32">snapfront</a>
<nav><a href="/themes">Themes</a><a href="#pricing">Pricing</a><a class="btn small" href="${web}">Open Snapfront</a></nav></div></header>
<main>
<div class="wrap hero">
  <div>
    <p class="eyebrow">Creative commerce studio</p>
    <h1><span>Snap a photo.</span><br>Open a store.</h1>
    <p class="lede">Point your phone at a product, or upload a photo from your computer. Snapfront writes the page, finds what Amazon and Walmart charge, sets a price that beats them, and takes payments straight into your Stripe account.</p>
    <div class="ctas"><a class="btn" href="${web}">Start in your browser</a>${play}</div>
    <p class="note">Free to try. No fees on your sales.</p>
  </div>
  <figure class="art" style="margin:0"><img src="/site/chrome-hero.webp" alt="A brushed-chrome doorway with a ring and an armchair shown as storefront examples" width="1200" height="900" fetchpriority="high"><figcaption>Concept artwork</figcaption></figure>
</div>
<section><div class="wrap">
  <h2>From photo to paid in three steps</h2>
  <p class="sub">Everything a small shop needs, written and set up for you.</p>
  <ol class="steps">
    <li><b>Snap or pick a product</b><span>Take a photo, upload a supplier screenshot, or add something from your supplier’s catalog.</span></li>
    <li><b>Get the page and the price</b><span>Title, description, options and a price checked against the big retailers, ready to edit.</span></li>
    <li><b>Share your store</b><span>Your store gets its own address, like yourshop.snapfront.app. Buyers pay with Stripe and your supplier ships.</span></li>
  </ol>
  <div class="chips" aria-label="Suppliers you can connect"><span>CJdropshipping</span><span>Printful</span><span>AliExpress</span><span>Your own stock</span></div>
</div></section>
<section><div class="wrap">
  <h2>On your phone or your computer</h2>
  <p class="sub">One account everywhere. Sign in with your email and your stores, products and plan follow you.</p>
  <div class="devices">
    <div class="device"><h3>In your browser</h3><p>Use Snapfront on a laptop, desktop or tablet. Upload product photos, edit pages on a big screen and manage orders.</p><a class="btn ghost small" href="${web}">Open Snapfront</a></div>
    <div class="device"><h3>On Android</h3><p>Snap products with your camera, save marketing posts to your gallery and run your store from anywhere.</p>${PLAY_URL ? `<a class="btn ghost small" href="${PLAY_URL}">Get it on Google Play</a>` : `<span class="btn ghost small soon">Coming soon to Google Play</span>`}</div>
  </div>
</div></section>
<section><div class="wrap">
  <h2>${THEMES.length} themes. Your own storefront.</h2>
  <p class="sub">Choose a product-specific look for fashion, beauty, electronics, home, outdoor goods and more. Upload your photos, edit the words and preview before applying. Your products, prices and checkout stay yours.</p>
  <a class="btn ghost" href="/themes">Explore all ${THEMES.length} themes</a>
</div></section>
<section id="pricing"><div class="wrap">
  <h2>Simple pricing. <span class="zero">0% fees</span> on your sales.</h2>
  <p class="sub">Buyers pay you directly through Stripe. Stripe’s standard processing fees apply.</p>
  <div class="plans">
    <div class="plan"><h3>Free</h3><div class="price">$0</div><ul><li>Build your store and try the AI</li><li>${PLANS.free.photo} AI product pages</li><li>${PLANS.free.research} price checks</li></ul><a class="btn ghost small" href="${web}">Start free</a></div>
    <div class="plan pro"><h3>Lifetime</h3><div class="price">${usd(PRICES.lifetime.cents)} <small>once, for life</small></div><ul><li>Up to ${PLANS.pro.liveStores} live stores, 0% Snapfront fees</li><li>${PLANS.pro.photo} AI product pages and ${PLANS.pro.product} AI digital products a month</li><li>AI photos and video, marketing posts</li><li>Email marketing, affiliates and Instagram AutoDM</li><li>Sales &amp; profit, ad pixels, the store assistant</li><li>Every new feature we add</li></ul><a class="btn small" href="${web}/plans?buy=lifetime">Get Lifetime</a></div>
    <div class="plan"><h3>Monthly</h3><div class="price">${usd(PRICES.pro.cents)} <small>a month</small></div><ul><li>Up to ${PLANS.pro.liveStores} live stores, 0% Snapfront fees</li><li>${PLANS.pro.photo} AI product pages and ${PLANS.pro.product} AI digital products a month</li><li>AI photos and video, marketing posts</li><li>Email marketing, affiliates and Instagram AutoDM</li><li>Sales &amp; profit, ad pixels, the store assistant</li><li>Cancel any time</li></ul><a class="btn small" href="${web}/plans?buy=pro">Start monthly</a></div>
  </div>
  <p class="note">Pay here with Stripe, then sign in to the Android app with the same email. Your plan works in both. All sales are final.</p>
</div></section>
</main>
<footer><div class="wrap"><span>© ${year} Snapfront</span><nav><a href="${web}">Web app</a><a href="${web}/earn">Earn with Snapfront</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/delete-account">Delete account</a><span>support@snapfront.app</span></nav></div></footer>
</body></html>`;
}
