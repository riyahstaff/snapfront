// The Snapfront membership sales page: snapfront.app/join, and snapfront.app/join/CODE when a
// partner shares it. A long, phone-first page in the order creators' link-in-bio offers use
// (the problem, a better day, why courses stall, what's different, objections, what's inside,
// price, FAQ), with Snapfront's angle: the AI does the heavy lifting instead of handing you homework.
//
// Rules this page keeps on purpose:
// - No income claims, no invented results, no fake "was" prices. It sells what the tools do.
// - When a partner shared the link, the page says they earn a commission (FTC disclosure).
// - Prices and partner terms are read from billing and the partner program, never typed in here.
// - "Pay in 4" is only mentioned when PLAN_PAY_LATER says Klarna/Afterpay are switched on in Stripe.
import { PLANS } from "./plans.js";
import { PLANS as PRICES } from "./webbilling.js";
import * as partners from "./partners.js";
import { THEMES, publicThemes } from "./themes.js";
import { config } from "./config.js";

const webAppUrl = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);
const usd = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (v) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[v]));

/** Klarna / Afterpay, if Snapfront has switched them on for Lifetime in Stripe (PLAN_PAY_LATER=klarna,afterpay). */
export function payLater() {
  const names = { klarna: "Klarna", afterpay: "Afterpay", affirm: "Affirm" };
  const on = String(process.env.PLAN_PAY_LATER || "").toLowerCase().split(/[\s,]+/).filter((n) => names[n]);
  if (!on.length) return null;
  const quarter = Math.ceil(PRICES.lifetime.cents / 4);
  return { providers: on.map((n) => names[n]), per: usd(quarter), line: `Or split Lifetime into 4 payments of ${usd(quarter)} with ${on.map((n) => names[n]).join(" or ")} at checkout, if you're approved.` };
}

/** Where the plan buttons go: the website's plan screen, which opens Stripe Checkout. */
export function buyUrl(plan, code) {
  const u = new URL(`${webAppUrl()}/plans`);
  u.searchParams.set("buy", plan);
  if (code) u.searchParams.set("via", code);
  return u.href;
}

export function salesPage({ code = null } = {}) {
  const web = webAppUrl();
  const life = usd(PRICES.lifetime.cents), month = usd(PRICES.pro.cents);
  const later = payLater();
  const rate = partners.RATE(), perSale = usd(Math.round(PRICES.lifetime.cents * rate / 100)), perMonth = usd(partners.MONTHLY_CENTS());
  const pro = PLANS.pro;
  const buyLife = esc(buyUrl("lifetime", code)), buyMonth = esc(buyUrl("pro", code));
  const free = esc(code ? `${web}/sign-in?via=${encodeURIComponent(code)}` : `${web}/sign-in`);
  const canonical = `${config.publicUrl}/join${code ? `/${encodeURIComponent(code)}` : ""}`;
  const shots = ["p-skincare", "p-streetwear", "p-chocolate", "p-furniture"]
    .map((id) => publicThemes().find((t) => t.id === id)).filter((t) => t?.preview_url).slice(0, 3);
  const year = new Date().getFullYear();
  const compare = [
    ["Your product page", "A video on how to write one", "Snap a photo. The AI writes the page and checks your price against the big retailers."],
    ["Your storefront", "“Buy a theme and set it up”", `${THEMES.length} designs, filled in with your own photos and words.`],
    ["Your content", "A list of hook ideas", "Posts, stories, faceless videos and faceless avatars made for your actual products."],
    ["Your DMs", "“Reply to every comment”", "Instagram AutoDM answers comments with your link for you."],
    ["Learning", "Hours of video, then you're on your own", "Academy lessons inside the same app you build in."],
    ["Getting unstuck", "A group chat", "A store assistant that can make the change in your store, not just explain it."],
  ];
  const faq = [
    ["Is this another course?", "No. There's an Academy inside, but the point of Snapfront is that the tools do the work the lessons describe: the page, the store, the posts and the replies."],
    ["Do I need experience?", "No. Everything starts as a draft the AI writes. You read it, change what you want and publish."],
    ["Do I need followers?", "No, but people can't buy what they never see, so plan to post. Snapfront makes the posts and videos. Posting them is your part."],
    ["Do I have to show my face?", "No. Faceless videos use your product photos, captions and an AI voice, and faceless avatars give your posts and stories a character that isn't you."],
    ["Do I need my own product?", "No. Make digital products in the studio, or connect CJdropshipping, AliExpress or Printful and they ship for you. Your own stock works too."],
    ["Do I have to go live?", "No. The Academy covers live selling for whenever you want to try it."],
    ["Will I make money?", "That depends on your product, your price and how consistently you share it. Snapfront gives you the tools and the training; nobody can honestly promise you sales, and we won't."],
    ["Refunds?", "All sales are final. That's why there's a free account: try the tools with free credits before you pay anything."],
    ["Is there a community?", "Yes, and it's built into Snapfront. Post wins and questions, get feedback on your store, climb the leaderboard and join live coaching calls with other members. No separate Skool or Discord subscription needed."],
    ["Does it work on my phone?", "Yes. Snapfront runs in your browser on any phone or computer, and the Android app is included free with your membership."],
  ];
  const caps = [
    ["✧", "Store & checkout", "Theme customization, your own store address, Stripe checkout, orders, discounts and reviews."],
    ["◈", "Creative & digital", "AI product pages, photo cleanup, AI lifestyle photos and video, and a digital product studio."],
    ["⌁", "Products & suppliers", "Product ideas, retailer price checks, CJdropshipping, AliExpress, Printful or your own stock."],
    ["↗", "Content & marketing", "AI posts and stories, faceless videos and avatars, email automations, Instagram AutoDM and ad pixels."],
    ["◇", "Earn with creators", "Affiliates for your own products, a UGC creator kit, and the Snapfront partner program."],
    ["✦", "Learn & get help", "The full Academy, daily post ideas, the store assistant and a private members' community with live coaching."],
  ];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Snapfront membership: skip the course, let the AI do the work</title>
<meta name="description" content="Snapfront builds your product pages, storefront and posts for you, and teaches you the rest. ${esc(life)} once for life, or ${esc(month)} a month.">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="Skip the course. Let the AI do the work."><meta property="og:description" content="Product pages, a storefront, posts and faceless videos, made for you. Snapfront membership.">
<meta property="og:image" content="${esc(config.publicUrl)}/site/chrome-hero.webp"><meta property="og:url" content="${esc(canonical)}">
${code ? '<meta name="robots" content="noindex">' : ""}
<meta name="theme-color" content="#090B0E"><meta name="color-scheme" content="dark">
<link rel="icon" href="/site/mark.png"><link rel="apple-touch-icon" href="/site/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700;800&display=swap">
<style>
:root{--bg:#090B0E;--surface:#14171C;--sunk:#1D2128;--ink:#F5F6F8;--muted:#ADB4BF;--line:#363C46;--platinum:#E5E9F0;--on-platinum:#11151B;--copper:#D99568;--good:#76D8B3;--bad:#E8838A;color-scheme:dark}
*{box-sizing:border-box}html{background:var(--bg);scroll-behavior:smooth;scroll-padding-top:80px}
body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.6 Figtree,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;padding-bottom:84px}
a{color:inherit}.wrap{max-width:760px;margin:0 auto;padding-inline:20px}.wide{max-width:1040px}
.via{background:#12161c;border-bottom:1px solid var(--sunk);font-size:14px;color:var(--muted);text-align:center;padding:9px 16px}.via b{color:var(--ink)}
header{padding-block:16px;border-bottom:1px solid rgba(54,60,70,.5)}header .wrap{display:flex;justify-content:space-between;align-items:center;gap:16px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;font-size:20px;letter-spacing:-.02em}.brand img{width:30px;height:30px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:12px 26px;border-radius:999px;font-weight:700;font-size:17px;text-decoration:none;border:1px solid var(--platinum);background:var(--platinum);color:var(--on-platinum);transition:transform .15s ease;text-align:center}
.btn:hover{transform:translateY(-1px)}.btn.ghost{background:transparent;color:var(--ink);border-color:var(--line)}.btn.small{min-height:40px;padding:8px 18px;font-size:15px}.btn.block{width:100%}
a:focus-visible,.btn:focus-visible,summary:focus-visible{outline:2px solid var(--platinum);outline-offset:3px}
.eyebrow{color:var(--copper);font-weight:700;font-size:13px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 14px}
h1{font-weight:800;font-size:clamp(42px,8.5vw,72px);line-height:.98;letter-spacing:-.045em;margin:0;text-wrap:balance}
h1 span,h2 .chrome{background:linear-gradient(180deg,#FFFFFF 0%,#C9CFD8 55%,#8D96A3 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
h2{font-weight:800;font-size:clamp(30px,5.6vw,46px);line-height:1.05;letter-spacing:-.035em;margin:0 0 22px;text-wrap:balance}
.hero{padding-block:48px 56px}.lede{font-size:clamp(19px,2.6vw,22px);color:var(--muted);margin:22px 0 0}
.pricechip{display:inline-flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;margin-top:26px;padding:12px 18px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.pricechip b{font-size:28px;letter-spacing:-.02em}.pricechip span{color:var(--muted);font-size:16px}
.ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.note{color:var(--muted);font-size:15px;margin:12px 0 0}
.shots{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:36px}.shots img{width:100%;aspect-ratio:3/4;object-fit:cover;object-position:top;border-radius:14px;border:1px solid var(--line);display:block;background:var(--surface)}
.shots figcaption{grid-column:1/-1;font-size:13px;color:var(--muted)}
section{padding-block:60px;border-top:1px solid var(--sunk)}
.beats p{margin:0 0 18px;font-size:clamp(19px,2.6vw,22px)}.beats p.dim{color:var(--muted)}.beats p.big{font-size:clamp(23px,3.4vw,28px);font-weight:700;letter-spacing:-.01em}
.beats .stack{display:grid;gap:4px;margin:0 0 18px}.beats .stack p{margin:0}
.fine{font-size:14px;color:var(--muted);border-left:2px solid var(--line);padding-left:14px;margin-top:26px}
.cmp{display:grid;gap:12px}.row{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:18px 20px;display:grid;gap:10px}
.row h3{margin:0;font-size:18px;letter-spacing:-.01em}.row .them,.row .us{display:flex;gap:10px;align-items:flex-start;font-size:16px;line-height:1.45}
.row .them{color:var(--muted)}.row .them i{color:var(--bad);font-style:normal;flex:none;width:18px}.row .us i{color:var(--good);font-style:normal;flex:none;width:18px}
.row .lab{display:block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
@media(min-width:760px){.row{grid-template-columns:170px 1fr 1fr;align-items:start;gap:20px}}
.answer{display:grid;gap:12px;background:linear-gradient(160deg,#181d24,#11151a);border:1px solid var(--line);border-radius:22px;padding:26px}
.answer .no{font-size:44px;font-weight:800;letter-spacing:-.04em;line-height:1}
.caps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.caps div{background:var(--surface);border:1px solid var(--line);border-radius:17px;padding:20px}
.caps span{font-size:22px;color:var(--copper)}.caps h3{font-size:18px;margin:10px 0 6px}.caps p{font-size:15px;line-height:1.5;color:var(--muted);margin:0}
.earn{border:1px solid #2f3d33;background:radial-gradient(circle at 85% 20%,#26352a,#12171a 70%);border-radius:22px;padding:26px}
.earn .num{font-size:64px;font-weight:800;letter-spacing:-.05em;line-height:1}.earn .num small{font-size:26px;color:var(--good)}
.earn p{margin:12px 0 0;color:var(--muted)}.earn p b{color:var(--ink)}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.plan{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:26px;display:grid;gap:10px;align-content:start}
.plan.best{border:2px solid var(--platinum);position:relative}.plan.best:before{content:"Best value";position:absolute;top:-12px;left:22px;background:var(--platinum);color:var(--on-platinum);font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;letter-spacing:.04em}
.plan h3{margin:0;font-size:22px}.price{font-weight:800;font-size:44px;line-height:1;letter-spacing:-.03em}.price small{font-weight:400;font-size:16px;color:var(--muted);letter-spacing:0}
.plan ul{margin:6px 0 10px;padding-left:20px;color:var(--muted);font-size:16px}.plan li{margin:4px 0}.plan .later{font-size:14px;color:var(--muted);margin:0}
details{border-bottom:1px solid var(--sunk);padding-block:4px}summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:16px;align-items:center;padding-block:16px;font-weight:700;font-size:19px}
summary::-webkit-details-marker{display:none}summary:after{content:"+";font-weight:400;font-size:26px;color:var(--muted);flex:none}details[open] summary:after{content:"–"}
details p{margin:0 0 18px;color:var(--muted)}
.final{text-align:center}.final .ctas{justify-content:center}
.sticky{position:fixed;left:0;right:0;bottom:0;z-index:10;background:rgba(9,11,14,.92);backdrop-filter:blur(12px);border-top:1px solid var(--line);padding:12px 16px calc(12px + env(safe-area-inset-bottom))}
.sticky .wrap{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0}.sticky b{display:block;font-size:16px}.sticky span{font-size:13px;color:var(--muted)}.sticky .btn{min-height:46px;padding:10px 22px;flex:none}
footer{padding-block:30px 40px;color:var(--muted);font-size:14px;border-top:1px solid var(--sunk)}footer nav{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:10px}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn{transition:none}.btn:hover{transform:none}}
</style></head><body>
${code ? `<div class="via">Shared by <b>${esc(code)}</b>, a Snapfront partner who earns a commission if you join.</div>` : ""}
<header><div class="wrap"><a class="brand" href="/"><img src="/site/mark.png" alt="" width="30" height="30">snapfront</a><a class="btn small" href="#pricing">Join</a></div></header>
<main>
<div class="wrap hero">
  <p class="eyebrow">Snapfront membership</p>
  <h1>Skip the course.<br><span>Let the AI do the work.</span></h1>
  <p class="lede">Snapfront writes your product pages, designs your storefront and makes your posts, then teaches you the rest. You make the calls. The AI does the heavy lifting.</p>
  <div class="pricechip"><b>${esc(life)}</b><span>once, for life</span><span aria-hidden="true">·</span><span>or ${esc(month)} a month</span></div>
  <div class="ctas"><a class="btn" href="${buyLife}">Get Lifetime for ${esc(life)}</a><a class="btn ghost" href="${free}">Try it free first</a></div>
  ${later ? `<p class="note">${esc(later.line)}</p>` : `<p class="note">No card needed for the free account.</p>`}
  ${shots.length ? `<figure class="shots" style="margin-block-end:0">${shots.map((t) => `<img src="${esc(t.preview_url)}" alt="${esc(t.name)} storefront design" loading="lazy">`).join("")}<figcaption>Real Snapfront storefront designs. Yours gets your photos and words.</figcaption></figure>` : ""}
</div>

<section><div class="wrap beats">
  <p class="eyebrow">Be honest</p>
  <h2>You've probably bought a course already.</h2>
  <div class="stack"><p>You watched every module.</p><p>You took the notes.</p></div>
  <p>Then you opened a blank listing… a blank design… a blank store…</p>
  <p class="big">…and stalled.</p>
  <p class="dim">Not because you're lazy. Because the course stopped right where the real work starts: actually making the thing.</p>
  <p>Every step was on you. The words. The photos. The store. The posts. The replies.</p>
  <p class="dim">So it turned into: watch, guess, overthink, repeat.</p>
</div></section>

<section><div class="wrap beats">
  <p class="eyebrow">Now picture this</p>
  <h2>A morning where the work is already started.</h2>
  <p>Your coffee's still hot.</p>
  <p>You open Snapfront and today's post idea is waiting for you.</p>
  <p>You snap the candle on your desk. The product page writes itself, and the price is checked against Amazon, Walmart and Target.</p>
  <p>A faceless video of it is rendering while you finish your coffee.</p>
  <p>The comments on yesterday's post? AutoDM already sent everyone your link.</p>
  <p class="big">You're not starting from a blank page anymore. You're editing a draft.</p>
  <p class="fine">That's what the tools do. Whether it sells depends on your product, your price and how often you share it. No app can promise sales, and we won't.</p>
</div></section>

<section><div class="wrap wide">
  <p class="eyebrow">The difference</p>
  <h2>Courses tell you what to do.<br><span class="chrome">Snapfront does it with you.</span></h2>
  <div class="cmp">${compare.map(([what, them, us]) => `<div class="row"><h3>${esc(what)}</h3><div class="them"><i aria-hidden="true">✕</i><div><span class="lab">A typical course</span>${esc(them)}</div></div><div class="us"><i aria-hidden="true">✓</i><div><span class="lab">Snapfront</span>${esc(us)}</div></div></div>`).join("")}</div>
</div></section>

<section><div class="wrap">
  <p class="eyebrow">The question everyone asks</p>
  <h2>“Do I have to show my face?”</h2>
  <div class="answer"><div class="no">No.</div>
    <p style="margin:0">Faceless videos turn your product photos into short videos with big captions and a natural AI voice. Faceless avatars give your posts and stories an original character to present your products, so you never have to be on camera.</p>
    <p style="margin:0;color:var(--muted)">If you ever want to go live, the Academy shows you how. It's never required.</p>
  </div>
</div></section>

<section><div class="wrap wide">
  <p class="eyebrow">Inside the membership</p>
  <h2>Everything works together.</h2>
  <div class="caps">${caps.map(([icon, h, p]) => `<div><span aria-hidden="true">${icon}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("")}</div>
</div></section>

<section><div class="wrap">
  <p class="eyebrow">Included</p>
  <h2>A private community.<br><span class="chrome">No extra subscription.</span></h2>
  <p class="lede" style="margin-top:0">Communities like this usually come with their own monthly fee on platforms like Skool. Yours is built right into Snapfront, on the web and in the app.</p>
  <div class="caps" style="margin-top:26px">${[
    ["💬", "The feed", "Share wins, ask questions and post your store for feedback from people doing the same thing."],
    ["🏆", "Leaderboard & levels", "Every like on your posts is a point. Climb nine levels from Newcomer to Icon."],
    ["🎙", "Live coaching", "Calls on the community calendar, with the join link right there for members."],
    ["👥", "Members", "Meet other sellers, see what they make and visit their stores."],
  ].map(([icon, h, p]) => `<div><span aria-hidden="true">${icon}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("")}</div>
</div></section>

<section><div class="wrap">
  <p class="eyebrow">Optional</p>
  <h2>Earn while you build.</h2>
  <div class="earn"><div class="num">${esc(rate)}<small>%</small></div>
    <p>Every member gets their own Snapfront link. When someone you send buys Lifetime, you earn <b>${esc(rate)}% (${esc(perSale)})</b>. When they choose Monthly, you earn <b>${esc(perMonth)}</b> for every month they pay.</p>
    <p>You're paid once Snapfront is paid. It's completely optional, and what you earn depends only on who buys through your link. You always say you earn a commission when you share it.</p>
  </div>
</div></section>

<section id="pricing"><div class="wrap wide">
  <p class="eyebrow">Your membership</p>
  <h2>Pick how you want to pay.</h2>
  <div class="plans">
    <div class="plan best"><h3>Lifetime</h3><div class="price">${esc(life)} <small>once, for life</small></div>
      <ul><li>Up to ${pro.liveStores} live stores, 0% Snapfront fees</li><li>${pro.photo} AI product pages and ${pro.product} AI digital products a month</li><li>AI photos, video, faceless videos and avatars</li><li>Email marketing, affiliates and Instagram AutoDM</li><li>The full Academy and the private members' community</li><li>Every new feature we add</li></ul>
      <a class="btn block" href="${buyLife}">Get Lifetime for ${esc(life)}</a>${later ? `<p class="later">${esc(later.line)}</p>` : ""}</div>
    <div class="plan"><h3>Monthly</h3><div class="price">${esc(month)} <small>a month</small></div>
      <ul><li>Everything in Lifetime</li><li>Billed monthly</li><li>Cancel any time</li><li>Switch to Lifetime whenever you like</li></ul>
      <a class="btn ghost block" href="${buyMonth}">Start Monthly for ${esc(month)}</a></div>
  </div>
  <p class="note">Secure checkout with Stripe. All sales are final. Not sure yet? <a href="${free}">Start with a free account</a> and try the tools first.</p>
</div></section>

<section><div class="wrap">
  <p class="eyebrow">FAQ</p>
  <h2>Straight answers.</h2>
  ${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}
</div></section>

<section class="final"><div class="wrap">
  <h2>You don't need more videos.<br><span class="chrome">You need it built.</span></h2>
  <p class="lede" style="margin-top:0">Snap a photo and watch the first draft of your store appear.</p>
  <div class="ctas"><a class="btn" href="${buyLife}">Get Lifetime for ${esc(life)}</a><a class="btn ghost" href="${free}">Try it free first</a></div>
</div></section>
</main>
<footer><div class="wrap">© ${year} Snapfront${code ? ` · ${esc(code)} earns a commission on purchases made through this page.` : ""}
<nav><a href="/">snapfront.app</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:support@snapfront.app">support@snapfront.app</a></nav></div></footer>
<div class="sticky" role="region" aria-label="Join Snapfront"><div class="wrap"><div><b>Snapfront Lifetime · ${esc(life)}</b><span>${later ? `or 4 × ${esc(later.per)}` : `or ${esc(month)} a month`}</span></div><a class="btn" href="${buyLife}">Join now</a></div></div>
</body></html>`;
}
