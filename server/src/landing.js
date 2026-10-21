// snapfront.app home page: what Snapfront does, what it costs, where to get it. Styled in the
// app's Liquid Chrome look (graphite, platinum, the silver aperture mark and the chrome gateway art).
import { vierraTag } from "./vierra-widget.js";
import { PLANS } from "./plans.js";
import { PLANS as PRICES, longPlan, lifetimeLeft, LIFETIME_LIMIT } from "./webbilling.js";
import { THEMES, publicThemes } from "./themes.js";
import { config } from "./config.js";
import { QUESTIONS } from "./start-plan.js";
import { PROMO_CSS, promoSection } from "./promo-video.js";

const webAppUrl = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);

const usd = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const ART_VERSION = 2;   // same as the web app's tool cards (mobile/src/web/tool-card.tsx)
/** A short silent loop from assets/site/tools (the web app's tool-card animations). It plays only while on screen. */
const art = (key, cls = "card-art") => `<div class="${cls}" aria-hidden="true"><video class="loop" muted loop playsinline preload="none" disablepictureinpicture poster="/site/tools/${key}.webp?v=${ART_VERSION}"><source src="/site/tools/${key}.webm?v=${ART_VERSION}" type="video/webm"><source src="/site/tools/${key}.mp4?v=${ART_VERSION}" type="video/mp4"></video></div>`;
const DESCRIPTION = "Snapfront is an AI online store builder. Snap a photo to get a product page, open a storefront, sell digital downloads, and make posts, videos and emails. Start free.";

/** Structured data for Google: the organization, the site, the app with its prices, and the promo film. */
function structuredData() {
  const base = config.publicUrl;
  const long = longPlan();
  const offers = [
    { "@type": "Offer", name: long === "lifetime" ? "Snapfront Lifetime" : "Snapfront Yearly", price: (PRICES[long].cents / 100).toFixed(2), priceCurrency: "USD", url: `${base}/#pricing` },
    { "@type": "Offer", name: "Snapfront Monthly", price: (PRICES.pro.cents / 100).toFixed(2), priceCurrency: "USD", url: `${base}/#pricing` },
  ];
  const graph = [
    { "@type": "Organization", "@id": `${base}/#org`, name: "Snapfront", url: `${base}/`, logo: `${base}/site/apple-touch-icon.png`, email: "support@snapfront.app" },
    { "@type": "WebSite", "@id": `${base}/#site`, name: "Snapfront", url: `${base}/`, publisher: { "@id": `${base}/#org` } },
    { "@type": "SoftwareApplication", name: "Snapfront", applicationCategory: "BusinessApplication", operatingSystem: "Web, Android", url: `${base}/`, description: DESCRIPTION,
      image: `${base}/site/chrome-hero.webp`, publisher: { "@id": `${base}/#org` }, offers },
    { "@type": "VideoObject", name: "Snapfront: everything it does, in one quick film", description: "A quick tour of Snapfront: AI product pages from a photo, storefront themes, digital products, marketing posts, faceless videos, email, Instagram AutoDM, affiliates and the Academy.",
      thumbnailUrl: [`${base}/site/promo/promo.jpg`], contentUrl: `${base}/site/promo/promo-1080.mp4`, uploadDate: "2026-10-18T12:00:00-04:00", duration: "PT1M23S", publisher: { "@id": `${base}/#org` } },
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}

export function landingPage() {
  const year = new Date().getFullYear();
  const web = webAppUrl();
  // Lifetime is a founding offer for the first LIFETIME_LIMIT members; then Yearly takes its place.
  const long = longPlan(), isLife = long === "lifetime", left = lifetimeLeft(), limit = LIFETIME_LIMIT();
  const taken = Math.min(100, Math.max(2, Math.round((limit - left) / Math.max(1, limit) * 100)));
  const featured = ['p-bridal-dresses','p-gaming-monitors','p-sneakers','p-chocolate','p-furniture','p-streetwear','p-skincare','p-surfboards']
    .map((id) => publicThemes().find((theme) => theme.id === id)).filter((theme) => theme?.preview_url);
  const safe = (s) => String(s ?? '').replace(/[&<>"']/g, (v) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[v]));
  const showcaseSlides = featured.map((theme, i) => '<article class="theme-slide'+(i===0?' active':'')+'" data-slide="'+i+'" aria-hidden="false"><a href="'+safe(theme.demo_url)+'" aria-label="View the '+safe(theme.name)+' storefront theme (read-only demo)"><img loading="'+(i<4?'eager':'lazy')+'" src="'+safe(theme.preview_url)+'" alt="'+safe(theme.name)+' actual Snapfront storefront theme preview"><div class="theme-caption"><span>'+safe(theme.name)+'</span><small>'+safe(theme.category||theme.for)+'</small></div></a></article>').join('');
  const themeDots = featured.map((_,i) => '<button class="carousel-dot'+(i===0?' active':'')+'" type="button" aria-label="Show theme '+(i+1)+'" data-dot="'+i+'"></button>').join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Snapfront: AI store builder. Snap a photo, open a store, sell anything</title>
<meta name="description" content="${DESCRIPTION}">
<link rel="canonical" href="${config.publicUrl}/">
<meta name="robots" content="index,follow,max-image-preview:large,max-video-preview:-1">
<meta property="og:type" content="website"><meta property="og:site_name" content="Snapfront"><meta property="og:url" content="${config.publicUrl}/">
<meta property="og:title" content="Snapfront: snap a photo, open a store"><meta property="og:description" content="AI product pages, 100+ storefront themes, digital products, posts, faceless videos, email and affiliates in one place. Start free.">
<meta property="og:image" content="${config.publicUrl}/site/chrome-hero.webp"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="900"><meta property="og:image:alt" content="Snapfront: a chrome doorway into online storefronts">
<meta property="og:video" content="${config.publicUrl}/site/promo/promo-720.mp4"><meta property="og:video:type" content="video/mp4">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Snapfront: snap a photo, open a store"><meta name="twitter:description" content="AI product pages, storefronts, digital products, posts and videos in one place. Start free."><meta name="twitter:image" content="${config.publicUrl}/site/chrome-hero.webp">
<script type="application/ld+json">${structuredData()}</script>
<meta name="theme-color" content="#090B0E"><meta name="color-scheme" content="dark">
<link rel="icon" href="/site/mark.png"><link rel="apple-touch-icon" href="/site/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700;800&display=swap">
<style>
:root{--bg:#090B0E;--surface:#14171C;--sunk:#1D2128;--ink:#F5F6F8;--muted:#ADB4BF;--line:#363C46;--platinum:#E5E9F0;--on-platinum:#11151B;--copper:#D99568;--good:#76D8B3;color-scheme:dark}
*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 Figtree,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}main{overflow-x:clip}.wrap{max-width:1840px;margin:0 auto;padding-inline:clamp(20px,3vw,48px)}
header{padding-block:18px;position:sticky;top:0;z-index:5;background:rgba(9,11,14,.82);backdrop-filter:blur(12px);border-bottom:1px solid rgba(54,60,70,.5)}
header .wrap{display:flex;justify-content:space-between;align-items:center;gap:16px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;font-size:21px;letter-spacing:-.02em}
.brand img{width:32px;height:32px}
header nav{display:flex;align-items:center;gap:22px;font-weight:500;font-size:15px}header nav a{text-decoration:none;color:var(--muted)}header nav a:hover{color:var(--ink)}
header nav .btn{color:var(--on-platinum)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:12px 24px;border-radius:12px;font-weight:700;font-size:16px;text-decoration:none;border:1px solid var(--platinum);background:var(--platinum);color:var(--on-platinum);transition:transform .15s ease}
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
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.chips span{border:1px solid var(--line);border-radius:10px;padding:7px 14px;font-weight:500;font-size:15px;color:var(--muted)}
.devices{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.device{border:1px solid var(--line);border-radius:20px;padding:24px;display:grid;gap:10px;align-content:start;background:linear-gradient(180deg,var(--surface),var(--bg))}
.device h3{margin:0;font-size:20px;letter-spacing:-.01em}.device p{margin:0;color:var(--muted)}.device .btn{justify-self:start;margin-top:8px}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;max-width:820px}
.plan{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:26px;display:grid;gap:10px;align-content:start;grid-template-rows:auto auto 1fr auto}
.plan.pro{border:2px solid var(--platinum)}.plan h3{margin:0;font-size:22px}
.price{font-weight:800;font-size:40px;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.price small{font-weight:400;font-size:15px;color:var(--muted);letter-spacing:0}
.plan ul{margin:6px 0 8px;padding-left:18px;color:var(--muted)}.plan li{margin:4px 0}.plan .btn{justify-self:start;margin-top:auto}
.zero{color:var(--good)}
footer{padding-block:36px 48px;color:var(--muted);font-size:15px;border-top:1px solid var(--sunk)}footer .wrap{display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between;align-items:center}
footer nav{display:flex;flex-wrap:wrap;gap:18px}
@media(max-width:640px){header nav a:not(.btn){display:none}}
.note a{color:var(--ink)}
@media(prefers-reduced-motion:reduce){.btn{transition:none}.btn:hover{transform:none}}

/* Funnel additions — keep the existing Liquid Chrome palette and typography. */
html{scroll-behavior:smooth;scroll-padding-top:96px}body{overflow-x:hidden}
.hero{position:relative}.hero:before{content:"";position:absolute;inset:0 -15vw auto;background:radial-gradient(ellipse at 70% 35%,rgba(181,194,213,.075),transparent 60%);height:100%;pointer-events:none}
.hero-showcase{position:relative;border:1px solid var(--line);border-radius:28px;background:linear-gradient(145deg,#202630,#0d1015 65%);box-shadow:0 38px 110px rgba(0,0,0,.48);padding:14px;min-width:0}
.stage-top{display:flex;align-items:center;gap:10px;padding:5px 8px 15px;font-size:10px;font-weight:800;letter-spacing:.16em;color:#dce2ea}.stage-count{margin-left:auto;color:var(--muted)}.live-pulse{width:7px;height:7px;border-radius:50%;background:var(--good);box-shadow:0 0 15px var(--good)}
.theme-stage{height:clamp(265px,35vw,440px);border:1px solid #373c45;border-radius:18px;overflow:hidden;position:relative;background:#181b20}.theme-slide{display:none;position:absolute;inset:0}.theme-slide.active{display:block;animation:themeIn .7s ease both}.theme-slide img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}.theme-slide:after{content:"";position:absolute;inset:30% 0 0;background:linear-gradient(transparent,rgba(6,7,10,.92))}
.theme-caption{position:absolute;z-index:1;bottom:20px;left:22px;display:grid;gap:2px}.theme-caption span{font-size:27px;font-weight:800;letter-spacing:-.04em;color:#fff}.theme-caption small{font-size:12px;font-weight:700;color:#e0e5ef}
.stage-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 5px 1px}.stage-controls>span{color:var(--muted);font-size:11px;max-width:200px}.stage-actions{display:flex;align-items:center;gap:9px}.stage-actions button{background:#222831;color:#fff;border:1px solid #4a505d;border-radius:100px;min-width:32px;height:32px;cursor:pointer}.stage-actions button:hover{background:#48505e}.carousel-dots{display:flex;gap:4px;align-items:center}.carousel-dots button{height:7px;min-width:7px;width:7px;padding:0;background:#555e6b;border:0}.carousel-dots button.active{width:20px;background:#eff2f7}@keyframes themeIn{from{opacity:.45;transform:scale(1.025)}to{opacity:1;transform:scale(1)}}
.soft{color:#9ca8b8}.features-section{background:linear-gradient(180deg,#0c0f13,#11151b 55%,#0a0d11)}.feature-showcase{display:grid;grid-template-columns:1fr 1.1fr;align-items:center;gap:50px;margin:55px 0 85px}.feature-showcase.reverse .feature-copy{order:2}.feature-copy h3{font-size:clamp(27px,3vw,42px);line-height:1.08;letter-spacing:-.035em;margin:0 0 20px}.feature-copy p{color:var(--muted);margin:0 0 22px}.feature-tags{display:flex;flex-wrap:wrap;gap:8px}.feature-tags span{font-size:12px;border:1px solid var(--line);background:#1b2028;padding:7px 10px;border-radius:100px;color:#d9e0e9}.quiet-link{display:inline-flex;margin-top:24px;text-decoration:none;font-weight:700;color:var(--platinum)}.quiet-link:hover{text-decoration:underline}
.mock-browser{border:1px solid #424a56;background:#0d1015;border-radius:19px;overflow:hidden;box-shadow:0 25px 70px #0008;min-width:0;transform:perspective(1400px) rotateY(-3deg)}.reverse .mock-browser{order:1;transform:perspective(1400px) rotateY(3deg)}.mock-titlebar{height:37px;border-bottom:1px solid #333945;display:flex;align-items:center;gap:6px;padding:0 16px}.mock-titlebar i{width:7px;height:7px;border-radius:50%;background:#596371}.mock-titlebar span{color:#929eae;font-size:10px;margin-left:12px;letter-spacing:.06em}.mock-body{padding:18px;display:grid;grid-template-columns:1.05fr 1fr;gap:17px}.mock-photo{height:285px;position:relative;border-radius:12px;overflow:hidden;background:#222831}.mock-photo img{width:100%;height:100%;object-fit:cover}.mock-photo span{position:absolute;bottom:10px;left:12px;background:#0d1015cc;padding:4px 9px;border-radius:20px;font-size:10px;color:white}.mock-info{display:flex;flex-direction:column;gap:12px;padding:10px 0;min-width:0}.mock-info small,.mock-analytics small{font-size:10px;color:var(--copper);font-weight:700;letter-spacing:.08em}.mock-info strong,.mock-analytics strong{font-size:22px;line-height:1.17}.mock-line{height:8px;background:#38404b;border-radius:10px;width:78%}.mock-line.long{width:96%}.mock-line.medium{width:56%}.mock-pill{background:#16352c;color:#92e7c6;border:1px solid #235441;border-radius:8px;font-size:11px;padding:9px}.mock-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:auto}.mock-grid>div{border:1px solid #333b45;border-radius:9px;padding:9px;font-size:10px;color:#929eac}.mock-grid b{font-size:12px;color:#e2e8f1}
.mock-analytics{padding:24px;display:grid;gap:12px}.mock-analytics>div:first-child{display:grid;gap:5px}.mock-analytics>div:first-child span{font-size:11px;color:var(--muted)}.mock-bars{height:120px;padding:15px 15px 0;display:flex;align-items:end;gap:9px;border-radius:12px;background:linear-gradient(180deg,#202831,#141920);border:1px solid #303b48}.mock-bars i{display:block;flex:1;border-radius:6px 6px 0 0;background:linear-gradient(180deg,#e7ecf2,#65758a)}.mock-task{display:flex;align-items:center;gap:8px;border:1px solid #34404b;border-radius:9px;padding:9px 12px;font-size:12px}.mock-task span{color:var(--copper)}.mock-task b{font-size:10px;color:var(--good);margin-left:auto}
.ai-team{background:radial-gradient(70% 60% at 85% 0%,rgba(255,140,40,.10),transparent 60%),linear-gradient(180deg,#0b0e12,#0e1217)}.ai-team .learn-card{display:flex;flex-direction:column}.ai-team .learn-card .btn,.ai-team .learn-card .quiet-link{margin:16px 9px 0;align-self:flex-start}
.vierra-visual{background:radial-gradient(circle at 50% 42%,rgba(255,150,50,.38),#1a0f07 62%);align-items:center}.vierra-visual .lock-label{align-self:flex-start}.v-orb{width:96px;height:96px;border-radius:50%;display:grid;place-items:center;margin:auto auto 10px;background:radial-gradient(circle at 35% 30%,#ffd08a,#ff9a3c 45%,#e8662a);box-shadow:0 0 0 14px rgba(255,150,60,.12),0 0 0 30px rgba(255,150,60,.06),0 0 70px rgba(255,140,40,.55)}.v-bars{display:flex;gap:5px;align-items:center;height:30px;margin-bottom:auto}.v-bars i{display:block;width:4px;border-radius:3px;background:linear-gradient(#ffb15c,#e8662a);height:30%}.v-bars i:nth-child(2n){height:70%}.v-bars i:nth-child(3n){height:100%}.v-bars i:nth-child(5){height:85%}.vierra-visual small{color:#ffd9b0}
@media (prefers-reduced-motion:no-preference){.v-bars i{animation:vbar 1.2s ease-in-out infinite alternate}.v-bars i:nth-child(2n){animation-delay:-.4s}.v-bars i:nth-child(3n){animation-delay:-.8s}@keyframes vbar{from{transform:scaleY(.45)}to{transform:scaleY(1)}}}
.connector-visual{background:radial-gradient(circle at 50% 35%,#2b3442,#0f1318 72%)}.c-row{display:flex;align-items:center;justify-content:center;gap:10px;margin:auto 0 18px}.c-row span{font-size:13px;font-weight:700;border:1px solid #4a5462;background:#181d24;border-radius:10px;padding:8px 12px;color:#e5e9f0}.c-row b{flex:0 1 34px;height:2px;background:linear-gradient(90deg,#5d6878,#e5e9f0)}.c-row img{border-radius:12px;background:#0c0f13;padding:6px;border:1px solid #4a5462}.connector-visual>strong{font-size:15px;line-height:1.35}
.prompts-visual{background:radial-gradient(circle at 60% 25%,#2d3a2f,#0f1411 75%)}.prompts-visual .partner-number{font-size:74px}
.capability-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.capability-grid>div{background:linear-gradient(160deg,#181d24,#11151a);border:1px solid #333944;border-radius:17px;padding:22px}.capability-grid span{font-size:25px;color:var(--copper)}.capability-grid h3{font-size:18px;margin:12px 0 7px}.capability-grid p{font-size:14px;line-height:1.55;color:var(--muted);margin:0}
.learn-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.learn-card{border:1px solid var(--line);border-radius:21px;padding:12px 12px 20px;background:var(--surface)}.learn-card h3{font-size:21px;line-height:1.25;padding:0 9px;margin:18px 0 10px}.learn-card>p{font-size:14px;line-height:1.6;color:var(--muted);margin:0;padding:0 9px}.learn-visual{height:260px;padding:17px;border:1px solid #424b57;border-radius:14px;display:flex;flex-direction:column;background:radial-gradient(circle at 60% 25%,#303b49,#101419 75%);overflow:hidden}.lock-label{font-size:11px;letter-spacing:.12em;color:#d5dce5;font-weight:700}.lesson-play{width:78px;height:78px;display:grid;place-items:center;border-radius:50%;background:#e5e9f0;color:#101318;font-size:22px;margin:auto;box-shadow:0 0 70px #fff3}.learn-visual>strong{line-height:1.2}.learn-visual>small{font-size:11px;color:#b6c1ce;margin-top:7px}.lesson-progress{height:4px;background:#485364;border-radius:5px;margin-top:15px}.lesson-progress i{display:block;background:#e5e9f0;width:44%;height:100%}
.ugc-visual{background:radial-gradient(circle at 50% 40%,#43404e,#17151e 78%)}.ugc-profile{margin:auto 0;display:grid;justify-items:center;text-align:center;gap:8px}.ugc-avatar{background:linear-gradient(135deg,#e8c5cc,#9e829c);color:#211a27;border-radius:50%;width:65px;height:65px;display:grid;place-items:center;font-size:16px;font-weight:800}.ugc-profile strong{font-size:20px}.ugc-profile small{font-size:11px;color:#e2dce4}.ugc-samples{display:flex;gap:8px;margin-top:8px}.ugc-samples i{display:block;width:52px;height:55px;border-radius:6px;background:linear-gradient(135deg,#dfc2ca,#62516c)}.ugc-samples i:nth-child(2){background:linear-gradient(135deg,#a4b2c5,#3f4a57)}.ugc-samples i:nth-child(3){background:linear-gradient(135deg,#cbb78b,#65573a)}
.partner-visual{background:radial-gradient(circle at 70% 30%,#394637,#141a15 75%)}.partner-number{font-size:90px;font-weight:800;letter-spacing:-.06em;line-height:1;margin:auto 0 8px}.partner-number span{font-size:36px;color:var(--good)}.partner-visual strong{font-size:15px}
.difference-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.difference-grid>div{border-left:2px solid #8793a5;padding-left:19px}.difference-grid strong{font-size:19px}.difference-grid p{color:var(--muted);font-size:15px}.vault-section{background:radial-gradient(ellipse at 80% 10%,#28323b 0%,#0d1117 46%,#090b0e 80%)}.vault-heading{display:flex;align-items:center;gap:32px}.vault-emblem{flex-shrink:0;position:relative;width:115px;height:115px;border:1px solid #8494a7;border-radius:30px;display:grid;place-items:center;font-size:52px;background:linear-gradient(135deg,#4c5c6c,#131920);box-shadow:0 0 80px #becbd025}.vault-emblem span{position:absolute;font-size:30px;bottom:-8px;right:-8px;border-radius:14px;padding:10px;background:#11171f}.vault-section .plans{max-width:none}.vault-section .plan{box-shadow:0 18px 55px #0005}.free-entry{display:flex;align-items:center;justify-content:space-between;gap:22px;margin-top:30px;padding:23px;border:1px dashed #697481;border-radius:16px;background:#111820}.free-entry strong{font-size:19px}.free-entry p{color:var(--muted);font-size:14px;max-width:65ch;margin:5px 0 0}
@media(max-width:1050px){.feature-showcase{gap:24px}.learn-grid,.capability-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.hero{gap:28px}.feature-showcase,.feature-showcase.reverse{grid-template-columns:1fr}.feature-showcase.reverse .feature-copy,.feature-showcase.reverse .mock-browser{order:initial}.learn-grid,.capability-grid,.difference-grid{grid-template-columns:1fr}.vault-heading{align-items:start;gap:16px}.vault-emblem{width:70px;height:70px;font-size:35px;border-radius:17px}.vault-emblem span{font-size:17px}.mock-browser,.reverse .mock-browser{transform:none}.theme-stage{height:350px}.free-entry{flex-direction:column;align-items:start}}
@media(max-width:640px){header nav a:not(.btn){display:none}.hero{padding-block:44px}.theme-stage{height:300px}.stage-controls{flex-wrap:wrap}.mock-body{grid-template-columns:1fr}.mock-photo{height:220px}.mock-info{min-height:245px}.feature-showcase{margin:35px 0 60px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.theme-slide.active{animation:none}}

/* Carousel BELOW the restored original Snapfront hero. */
.featured-stores{background:linear-gradient(180deg,#11161e,#090b0e)}.featured-heading{display:flex;align-items:end;justify-content:space-between;gap:22px}.featured-heading>div{max-width:700px}.featured-heading .sub{margin-bottom:0}.featured-heading>a{flex-shrink:0}
.hero-showcase.carousel-below{margin-top:30px}.carousel-below .theme-stage{--deck-gap:14px;display:flex;gap:var(--deck-gap);height:auto;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;border:0;background:transparent;padding-bottom:2px}.carousel-below .theme-stage::-webkit-scrollbar{display:none}
.carousel-below .theme-slide,.carousel-below .theme-slide.active{display:block;position:relative;flex:0 0 calc((100% - 3 * var(--deck-gap))/4);min-width:0;scroll-snap-align:start;border:1px solid #44505f;border-radius:16px;overflow:hidden;animation:none;background:#1a2029}
.carousel-below .theme-slide img{display:block;width:100%;height:265px;object-fit:cover;object-position:top center}.carousel-below .theme-slide:after{inset:42% 0 0}.carousel-below .theme-caption{bottom:14px;left:13px;right:13px}.carousel-below .theme-caption span{font-size:18px;line-height:1.15}.carousel-below .theme-caption small{font-size:10px}.carousel-below .theme-slide a{display:block;position:relative;height:100%;text-decoration:none}.carousel-below .theme-slide a:focus-visible{outline:3px solid #e5e9f0;outline-offset:-4px}.carousel-below .theme-slide:hover img{transform:scale(1.025);transition:transform .4s}
.carousel-below .stage-controls>span{max-width:none}.carousel-below .carousel-dot[hidden]{display:none}.carousel-below .stage-top{padding:3px 7px 14px}
@media(max-width:1050px){.carousel-below .theme-slide,.carousel-below .theme-slide.active{flex-basis:calc((100% - var(--deck-gap))/2)}.featured-heading{align-items:start;flex-direction:column}.carousel-below .theme-slide img{height:290px}}
@media(max-width:600px){.carousel-below .theme-slide,.carousel-below .theme-slide.active{flex-basis:85%}.carousel-below .theme-slide img{height:340px}}
@media(prefers-reduced-motion:reduce){.carousel-below .theme-stage{scroll-behavior:auto}.carousel-below .theme-slide:hover img{transform:none}}
.quiz{width:min(560px,calc(100vw - 32px));max-height:calc(100vh - 32px);border:1px solid var(--line);border-radius:22px;background:var(--surface);color:var(--ink);padding:0;box-shadow:0 40px 120px rgba(0,0,0,.6)}
.quiz::backdrop{background:rgba(5,6,8,.72);backdrop-filter:blur(4px)}
.quiz .in{padding:24px;display:grid;gap:16px}.quiz .top{display:flex;justify-content:space-between;align-items:center;gap:12px;color:var(--muted);font-size:14px}
.quiz .x,.quiz .back{background:none;border:0;color:var(--muted);font:inherit;cursor:pointer;padding:6px;min-height:40px}.quiz .x{font-size:22px;line-height:1}
.quiz .bar{height:6px;border-radius:6px;background:var(--sunk);overflow:hidden}.quiz .bar i{display:block;height:100%;background:var(--copper);transition:width .25s ease}
.quiz h2{margin:0;font-size:clamp(23px,4.5vw,29px);line-height:1.15;letter-spacing:-.02em}
.quiz .opt{display:grid;gap:2px;text-align:left;width:100%;padding:16px 18px;border-radius:16px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;cursor:pointer}
.quiz .opt:hover,.quiz .opt:focus-visible{border-color:var(--platinum);outline:none}.quiz .opt b{font-size:17px}.quiz .opt span{color:var(--muted);font-size:14px}
.quiz ol{margin:0;padding:0;list-style:none;display:grid;gap:10px;counter-reset:s}.quiz li{counter-increment:s;display:grid;grid-template-columns:30px 1fr;gap:12px;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--bg)}
.quiz li:before{content:counter(s);width:28px;height:28px;border-radius:50%;background:var(--sunk);display:grid;place-items:center;font-weight:700;font-size:13px;color:var(--muted)}
.quiz li b{display:block}.quiz li span{color:var(--muted);font-size:14px}.quiz .sum{color:var(--muted);margin:0}.quiz .eyebrow{margin:0}

/* Color and motion: looping card art (the web app's tool animations), a livelier hero, founding spots. */
:root{--mango:#FFB347;--coral:#FF7A59;--violet:#9B8CFF;--glow:linear-gradient(100deg,var(--mango),var(--coral) 45%,var(--violet))}
.card-art{position:relative;aspect-ratio:16/10;border-radius:14px;overflow:hidden;background:#1d2128;isolation:isolate}
.card-art video{width:100%;height:100%;object-fit:cover;display:block;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.card-art:after{content:"";position:absolute;inset:55% 0 0;background:linear-gradient(transparent,rgba(20,23,28,.85));pointer-events:none}
.steps.with-art li{position:relative;padding:12px 12px 22px}.steps.with-art li::before{position:absolute;top:22px;left:22px;z-index:2;box-shadow:0 6px 20px rgba(0,0,0,.45)}
.steps.with-art li b,.steps.with-art li span{padding:0 10px}.steps.with-art .card-art{margin-bottom:8px}
.steps li,.capability-grid>div,.learn-card{transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease}
.steps li:hover,.capability-grid>div:hover,.learn-card:hover{transform:translateY(-4px);border-color:#6b7584;box-shadow:0 24px 60px rgba(0,0,0,.5)}
.steps li:hover video,.capability-grid>div:hover video,.learn-card:hover video{transform:scale(1.06)}
.capability-grid>div{padding:12px 12px 22px}.capability-grid h3,.capability-grid p{padding:0 10px}.capability-grid h3{margin-top:16px}
.learn-visual.media{position:relative;padding:0;justify-content:flex-end}.learn-visual.media .card-art{position:absolute;inset:0;aspect-ratio:auto;border-radius:0}
.learn-visual.media .card-art:after{inset:30% 0 0;background:linear-gradient(transparent,rgba(9,11,14,.92))}
.learn-visual.media>*:not(.card-art){position:relative;z-index:1;margin-inline:17px}.learn-visual.media>.lock-label{position:absolute;top:17px;left:0;padding:5px 10px;border-radius:999px;background:rgba(9,11,14,.65);backdrop-filter:blur(8px)}
.learn-visual.media>small:last-child,.learn-visual.media>.lesson-progress:last-child{margin-bottom:17px}
.learn-visual.media .partner-number{margin:0 17px 6px}
.hero h1 span{background:linear-gradient(180deg,#FFFFFF 0%,#FFE2B8 45%,#FF9F68 100%);-webkit-background-clip:text;background-clip:text}
.hero:after{content:"";position:absolute;z-index:-1;inset:-10% -20% auto auto;width:60vw;height:60vw;max-width:780px;max-height:780px;border-radius:50%;background:radial-gradient(circle,rgba(255,150,70,.16),rgba(155,140,255,.08) 45%,transparent 70%);filter:blur(10px);pointer-events:none}
.hero{isolation:isolate}
.art{overflow:visible}.art img{border-radius:28px}
.float{position:absolute;display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:14px;background:rgba(20,23,28,.86);backdrop-filter:blur(12px);border:1px solid #3d4450;box-shadow:0 18px 50px rgba(0,0,0,.55);font-size:14px;font-weight:700;white-space:nowrap}
.float small{display:block;font-weight:500;font-size:12px;color:var(--muted)}.float i{font-style:normal;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}
.float.f1{top:8%;left:-4%}.float.f1 i{background:#16352c;color:#92e7c6}
.float.f2{top:44%;right:-5%}.float.f2 i{background:#3a2614;color:var(--mango)}
.float.f3{bottom:7%;left:6%}.float.f3 i{background:linear-gradient(135deg,var(--mango),var(--coral));color:#2a1405}
@media(max-width:900px){.float.f1{left:2%}.float.f2{right:2%}}
@media(max-width:520px){.float{font-size:12px;padding:8px 10px}.float small{display:none}.float i{width:24px;height:24px}.float.f2{display:none}}
.spots{display:grid;gap:6px;margin:2px 0 4px}.spots-bar{height:8px;border-radius:8px;background:var(--sunk);overflow:hidden;position:relative}
.spots-bar i{display:block;height:100%;border-radius:8px;background:var(--glow)}
.spots small{color:var(--muted);font-size:13px}.spots b{color:var(--mango)}
.plan.pro{position:relative;border-color:transparent;background:linear-gradient(var(--surface),var(--surface)) padding-box,var(--glow) border-box;border:2px solid transparent}
.badge{justify-self:start;font-size:12px;font-weight:800;letter-spacing:.06em;color:#2a1405;background:var(--glow);padding:4px 10px;border-radius:999px}
@media (prefers-reduced-motion:no-preference){
 .float{animation:floatIn .7s cubic-bezier(.2,.8,.2,1) both,bob 6s ease-in-out infinite}.float.f2{animation-delay:.25s,1.5s}.float.f3{animation-delay:.5s,3s}
 @keyframes floatIn{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
 @keyframes bob{0%,100%{translate:0 0}50%{translate:0 -7px}}
 .spots-bar i{background-size:200% 100%;animation:shine 3s linear infinite}@keyframes shine{from{background-position:0 0}to{background-position:-200% 0}}
 .hero:after{animation:drift 18s ease-in-out infinite alternate}@keyframes drift{from{transform:translate(0,0)}to{transform:translate(-6%,8%)}}
}
@media(prefers-reduced-motion:reduce){.steps li:hover,.capability-grid>div:hover,.learn-card:hover{transform:none}.card-art video{transition:none}}
${PROMO_CSS}</style></head><body>
<header><div class="wrap"><a class="brand" href="/"><img src="/site/mark.png" alt="" width="32" height="32">snapfront</a>
<nav><a href="#features">Features</a><a href="#ai-team">AI team</a><a href="#themes">Themes</a><a href="#learn">Learn &amp; earn</a><a href="#pricing">Pricing</a><a href="${web}/sign-in">Sign in</a><a class="btn small" href="#pricing">Unlock Snapfront</a></nav></div></header>
<main>
<div class="wrap hero">
  <div>
    <p class="eyebrow">Creative commerce studio</p>
    <h1><span>Snap a photo.</span><br>Open a store.</h1>
    <p class="lede">Point your phone at a product, or upload a photo from your computer. Snapfront helps build a product page, design a storefront, create marketing, and learn how to grow — all in one place.</p>
    <div class="ctas"><button class="btn" type="button" id="start-here">Start here: find your first step <span aria-hidden="true">→</span></button><a class="btn ghost" href="${web}/sign-in">Start free — create account <span aria-hidden="true">↗</span></a></div>
    <p class="note">Explore the showcase without an account. Verify your email to use the free tools. Upgrade when you are ready to launch.</p>
  </div>
  <figure class="art" style="margin:0"><img src="/site/chrome-hero.webp" alt="A brushed-chrome Snapfront doorway opening onto jewelry and furniture storefronts" width="1200" height="900" fetchpriority="high">
    <div class="float f1" aria-hidden="true"><i>✓</i><span>Product page ready<small>Title, photos, price checked</small></span></div>
    <div class="float f2" aria-hidden="true"><i>$</i><span>New order<small>Paid with Stripe, 0% Snapfront fees</small></span></div>
    <div class="float f3" aria-hidden="true"><i>🥭</i><span>Ask Vierra<small>“Where do I add a discount?”</small></span></div></figure>
</div>
${promoSection()}
<section id="themes" class="featured-stores"><div class="wrap"><div class="featured-heading"><div><p class="eyebrow">Original storefront designs</p><h2>Sleek, modern, eye-catching stores. Endless possibilities</h2><p class="sub">Give your brand a stunning storefront that captures attention and turns visitors into customers.</p></div><a class="btn ghost small" href="/themes">See over 100 themes ↗</a></div><div class="hero-showcase carousel-below"><div class="stage-top"><span class="live-pulse"></span> PREMIUM STOREFRONTS <span class="stage-count">OVER 100 DESIGNS</span></div><div class="theme-stage" id="theme-stage" aria-label="Animated showcase of storefront themes">${showcaseSlides}</div><div class="stage-controls"><span>Read-only previews · use arrows to explore</span><div class="stage-actions"><button type="button" id="prev-theme" aria-label="Previous theme">←</button><div class="carousel-dots" id="carousel-dots">${themeDots}</div><button type="button" id="next-theme" aria-label="Next theme">→</button></div></div></div></div></section>
<section><div class="wrap">
  <h2>From photo to paid in three steps</h2>
  <p class="sub">Everything a small shop needs, written and set up for you.</p>
  <ol class="steps with-art">
    <li>${art("snap")}<b>Snap or pick a product</b><span>Take a photo, upload a supplier screenshot, or add something from your supplier’s catalog.</span></li>
    <li>${art("digital")}<b>Get the page and the price</b><span>Title, description, options and a price checked against the big retailers, ready to edit.</span></li>
    <li>${art("buyers")}<b>Share your store</b><span>Your store gets its own address, like yourshop.snapfront.app. Buyers pay with Stripe and your supplier ships.</span></li>
  </ol>
  <div class="chips" aria-label="Suppliers you can connect"><span>CJdropshipping</span><span>Printful</span><span>AliExpress</span><span>Your own stock</span></div>
</div></section>
<section id="membership"><div class="wrap">
  <h2>Join here. Take it everywhere.</h2>
  <p class="sub">Your membership starts on this website. The Snapfront app comes with it, free, so you can snap products and check orders on the go.</p>
  <ol class="steps">
    <li><b>Pick your access</b><span>Verify your email for a limited free account, or choose ${isLife ? "Lifetime" : "Yearly"} or Monthly for full Pro access.</span></li>
    <li><b>Open your workspace</b><span>Create and test on your browser; paid plans unlock published storefronts and higher creative allowances.</span></li>
    <li><b>Get the free app</b><span>Download Snapfront on Android and sign in with the same email. Your stores, products and membership are already there.</span></li>
  </ol>
  <div class="ctas"><a class="btn" href="#pricing">Become a member</a><a class="btn ghost" href="${web}/sign-in">Already have an account? Sign in</a></div>
</div></section>

<section id="features" class="features-section"><div class="wrap">
  <p class="eyebrow">More than a store builder</p>
  <h2>An entire business studio.<br><span class="soft">One beautiful workspace.</span></h2>
  <p class="sub">These are previews of the tools waiting inside. Browse the story here; open a free account to try creation tools, or become a member for the full workspace.</p>
  <div class="feature-showcase">
    <div class="feature-copy"><span class="eyebrow">01 / CREATE &amp; DESIGN</span><h3>From one photo to something worth selling.</h3><p>Snap a product photo and generate a draft listing with editable copy. Build digital planners, checklists, guides and wall art, clean product photos, and style an entire storefront without starting from a blank page.</p><div class="feature-tags"><span>AI product pages</span><span>Digital product studio</span><span>Photo cleanup</span><span>AI lifestyle scenes</span><span>Storefront builder</span><span>Custom domains</span></div><a href="${web}/sign-in" class="quiet-link">Try the creative tools free ↗</a></div>
    <div class="mock-browser" role="img" aria-label="Illustrative Snapfront AI studio workspace showing a product image, generated listing and product tools"><div class="mock-titlebar"><i></i><i></i><i></i><span>snapfront / creative studio</span></div><div class="mock-body"><div class="mock-photo"><img src="/theme-assets/sneakers-preview.webp" alt="" loading="lazy"><span>PRODUCT PHOTO</span></div><div class="mock-info"><small>AI PRODUCT STUDIO · PREVIEW</small><strong>From photo to product page</strong><div class="mock-line long"></div><div class="mock-line"></div><div class="mock-line medium"></div><div class="mock-pill">Description drafted ✓</div><div class="mock-grid"><div>Product page<br><b>Ready to edit</b></div><div>Storefront<br><b>Theme ready</b></div></div></div></div></div>
  </div>
  <div class="feature-showcase reverse">
    <div class="feature-copy"><span class="eyebrow">02 / FIND &amp; GROW</span><h3>Go from finding a product to finding customers.</h3><p>Research products and suppliers, compare retail pricing, design marketing posts and faceless videos, and run retention and social discovery tools from the same store.</p><div class="feature-tags"><span>CJdropshipping, AliExpress &amp; Printful</span><span>Price comparisons</span><span>Marketing posts</span><span>Email flows</span><span>Instagram AutoDM</span><span>Ad pixels</span><span>Link-in-bio &amp; QR codes</span><span>Sales analytics</span></div><a href="#pricing" class="quiet-link">See membership access ↗</a></div>
    <div class="mock-browser" role="img" aria-label="Illustrative marketing and sales dashboard mockup"><div class="mock-titlebar"><i></i><i></i><i></i><span>snapfront / growth studio</span></div><div class="mock-analytics"><div><small>GROWTH TOOLS</small><strong>Reach. Convert. Repeat.</strong><span>Illustrative dashboard — no live business data</span></div><div class="mock-bars"><i style="height:28%"></i><i style="height:48%"></i><i style="height:41%"></i><i style="height:65%"></i><i style="height:55%"></i><i style="height:83%"></i><i style="height:75%"></i></div><div class="mock-task"><span>✦</span> Email welcome sequence <b>Automate</b></div><div class="mock-task"><span>✦</span> Instagram reply-to-DM <b>Engage</b></div><div class="mock-task"><span>✦</span> Creator affiliate links <b>Grow</b></div></div></div>
  </div>
</div></section>
<section class="capabilities"><div class="wrap"><p class="eyebrow">Inside the membership</p><h2>Everything works together.</h2><div class="capability-grid">
  <div>${art("sales-profit")}<h3>Store &amp; checkout</h3><p>Theme customization, custom store address, Stripe checkout, orders, discounts, reviews and multi-store management.</p></div>
  <div>${art("ai-media")}<h3>Creative &amp; digital</h3><p>AI listings, photo enhancement, AI product photos and video, digital designs, editable documents and downloadable products.</p></div>
  <div>${art("suppliers")}<h3>Products &amp; suppliers</h3><p>Product discovery, trending ideas, retailer price checks, CJdropshipping, AliExpress, Printful and your own inventory.</p></div>
  <div>${art("marketing")}<h3>Audience &amp; marketing</h3><p>AI posts, faceless videos, email campaigns and automations, Instagram AutoDM, growth channels, ad pixels and sales insights.</p></div>
  <div>${art("faceless")}<h3>Earn through creators</h3><p>Store affiliates, UGC creator portfolios and brand pitches, and the separate Snapfront referral partner program.</p></div>
  <div>${art("community")}<h3>Help &amp; education</h3><p>Snapfront Academy, guided lessons, daily content ideas, the store assistant, Vierra the voice guide, a full Help &amp; FAQ and a private members’ community with live coaching.</p></div>
</div></div></section>
<section id="ai-team" class="ai-team"><div class="wrap"><p class="eyebrow">New: your AI team</p><h2>Ask, talk and hand off the busywork.<br><span class="soft">Snapfront works with the AI you already use.</span></h2><p class="sub">A voice guide who knows the whole app, a connector that lets Claude or ChatGPT work on your store, and a bonus library of 1,000 ready-to-send prompts.</p><div class="learn-grid">
 <div class="learn-card"><div class="learn-visual vierra-visual"><span class="lock-label">ASK VIERRA</span><div class="v-orb" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34"><path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5z" fill="none" stroke="#2a1405" stroke-width="1.8"/><path d="M18.5 11a6.5 6.5 0 0 1-13 0M12 17.5V21" fill="none" stroke="#2a1405" stroke-width="1.8" stroke-linecap="round"/></svg></div><div class="v-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><small>Talk or type · answers in seconds</small></div><h3>Talk to someone who knows it all.</h3><p>Vierra is Snapfront’s voice guide. Ask how anything works or where to find it, out loud or by typing, and she answers with the steps and a tip to make it easier.</p><button class="btn small v-try" type="button" data-open-vierra>Talk to Vierra</button></div>
 <div class="learn-card"><div class="learn-visual connector-visual"><span class="lock-label">CLAUDE &amp; CHATGPT</span><div class="c-row" aria-hidden="true"><span>Claude</span><b></b><img src="/site/mark.png" alt="" width="46" height="46"><b></b><span>ChatGPT</span></div><strong>“Check my store and fix my product pages.”</strong><small>Your assistant previews changes and waits for your OK</small></div><h3>Your assistant, working on your store.</h3><p>Connect Snapfront to Claude or ChatGPT once. Then ask it to check your store, redesign it, write product pages, set sale prices or make faceless videos, on the AI plan you already pay for.</p><a class="quiet-link" href="/connect-ai">See how to connect ↗</a></div>
 <div class="learn-card"><div class="learn-visual prompts-visual"><span class="lock-label">MEMBERS’ BONUS</span><div class="partner-number">1,000</div><strong>Ready-to-send prompts</strong><small>Products · store · videos · side hustles · money · career</small></div><h3>Bonus: 1k Prompts, one tap away.</h3><p>Pick a prompt, fill in your details, and it opens in Claude or ChatGPT already typed in. Hundreds of them use the Snapfront connector, so your assistant can build the product right in your store.</p><a class="quiet-link" href="#pricing">Included with membership ↓</a></div>
</div></div></section>
<section id="learn" class="learn-section"><div class="wrap"><p class="eyebrow">Learn it. Use it. Earn with it.</p><h2>Tools build the store.<br><span class="soft">Skills build the business.</span></h2><p class="sub">Snapfront is a creation studio and a place to learn the work behind a thriving shop.</p><div class="learn-grid">
 <div class="learn-card"><div class="learn-visual media">${art("academy")}<span class="lock-label">SNAPFRONT ACADEMY</span><strong>From first product to first campaign.</strong><small>Short video lessons, step by step</small></div><h3>Follow lessons, not guesses.</h3><p>Understand store setup, creative selling, marketing fundamentals, live social selling and the practical next steps. The first module is open; the full Academy comes with membership.</p></div>
 <div class="learn-card"><div class="learn-visual media">${art("ugc")}<span class="lock-label">UGC CREATOR KIT</span><strong>Your creator portfolio</strong><small>Portfolio, rate card and brand pitches</small></div><h3>Become the creator brands find.</h3><p>Make a UGC portfolio, organize your rates, build video scripts and send stronger pitches to brands — separate from selling products in your store.</p></div>
 <div class="learn-card"><div class="learn-visual media">${art("affiliates")}<span class="lock-label">AFFILIATE OPPORTUNITIES</span><div class="partner-number">40<span>%</span></div><strong>Of every membership payment you refer</strong><small>Lifetime, Monthly or Yearly. Program terms apply and may change.</small></div><h3>Two ways to grow with affiliates.</h3><p>Recruit promoters for your own products, or join the Snapfront partner program to refer new members and earn on qualifying membership purchases.</p></div>
</div></div></section>
<section class="differentiator"><div class="wrap"><p class="eyebrow">Why Snapfront?</p><h2>Less switching tabs.<br>More creating momentum.</h2><div class="difference-grid"><div><strong>One connected workflow</strong><p>Product pages, theme design, checkout, content, marketing and education live together — without piecing together disconnected tools.</p></div><div><strong>Built for beginners and builders</strong><p>Start with limited free creation credits, explore polished examples and graduate to more production capacity as you grow.</p></div><div><strong>Your brand takes center stage</strong><p>Customize your storefront, use your own photos and connect Stripe. Snapfront charges 0% platform transaction fees; payment processing still applies.</p></div></div></div></section>
<section id="pricing" class="vault-section"><div class="wrap">
  <div class="vault-heading"><div class="vault-emblem" aria-hidden="true">✦<span>🔒</span></div><div><p class="eyebrow">Your access key</p><h2>Unlock the full studio.<br><span class="soft">Everything is waiting inside.</span></h2></div></div><p class="sub">Peek inside with a verified free account. Open the vault with ${isLife ? "Lifetime" : "Yearly"} or Monthly to unlock the full Pro allowances, live storefront selling, the complete Academy and the connected business toolkit.</p>
  <p class="sub">Buyers pay you directly through Stripe. Stripe’s standard processing fees apply.</p>
  <div class="plans">
    <div class="plan pro">${isLife ? `<span class="badge">FOUNDING 500</span>` : ""}<h3>${isLife ? "Lifetime" : "Yearly"}</h3><div class="price">${usd(PRICES[long].cents)} <small>${isLife ? "once, for life" : "a year"}</small></div>${isLife ? `<div class="spots"><div class="spots-bar" role="img" aria-label="${limit - left} of ${limit} founding Lifetime memberships taken"><i style="width:${taken}%"></i></div><small><b>${left} of ${limit}</b> founding spots left. After that, Lifetime is replaced by Yearly at ${usd(PRICES.yearly.cents)} a year.</small></div>` : ""}<ul><li>Up to ${PLANS.pro.liveStores} live stores, 0% Snapfront fees</li><li>${PLANS.pro.photo} AI product pages and ${PLANS.pro.product} AI digital products a month</li><li>AI photos and video, marketing posts</li><li>Email marketing, affiliates and Instagram AutoDM</li><li>Sales &amp; profit, ad pixels, the store assistant</li><li>The Snapfront Android app, free</li><li>Academy lessons, daily post ideas and the members’ community</li><li>Bonus: 1,000 prompts for Claude and ChatGPT</li><li>Works with Claude and ChatGPT through the Snapfront connector</li><li>Every new feature we add</li>${isLife ? "<li>No monthly bill, ever</li>" : "<li>Billed once a year, cancel any time</li>"}</ul><a class="btn small" href="${web}/plans?buy=${long}">Join for ${usd(PRICES[long].cents)}${isLife ? "" : " a year"}</a></div>
    <div class="plan"><h3>Monthly</h3><div class="price">${usd(PRICES.pro.cents)} <small>a month</small></div><ul><li>Up to ${PLANS.pro.liveStores} live stores, 0% Snapfront fees</li><li>${PLANS.pro.photo} AI product pages and ${PLANS.pro.product} AI digital products a month</li><li>AI photos and video, marketing posts</li><li>Email marketing, affiliates and Instagram AutoDM</li><li>Sales &amp; profit, ad pixels, the store assistant</li><li>The Snapfront Android app, free</li><li>Academy lessons, daily post ideas and the members’ community</li><li>Bonus: 1,000 prompts for Claude and ChatGPT</li><li>Works with Claude and ChatGPT through the Snapfront connector</li><li>Cancel any time</li></ul><a class="btn ghost small" href="${web}/plans?buy=pro">Join for ${usd(PRICES.pro.cents)} a month</a></div>
  </div>
  <p class="note">Pay here with Stripe, then get the Snapfront app free on Android and sign in with the same email. All sales are final.</p>
  <div class="free-entry"><div><strong>Not ready to purchase?</strong><p>Register a free account with a verified email to explore the studio and use limited free credits. A free account does not include a live, selling storefront.</p></div><a class="btn ghost small" href="${web}/sign-in">Create a free account ↗</a></div>
</div></section>
</main>
<footer><div class="wrap"><span>© ${year} Snapfront</span><nav><a href="${web}/sign-in">Sign in</a><a href="#features">Features</a><a href="#learn">Academy, UGC &amp; affiliates</a><a href="${web}/sign-in">Create an account</a><a href="/connect-ai">Claude &amp; ChatGPT</a><a href="/tools">Tools</a><a href="/help">Help &amp; FAQ</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/delete-account">Delete account</a><span>support@snapfront.app</span></nav></div></footer>
<script>
(function(){
 const stage=document.getElementById('theme-stage');
 const slides=stage?Array.from(stage.querySelectorAll('[data-slide]')):[];
 const dots=Array.from(document.querySelectorAll('[data-dot]'));
 const prev=document.getElementById('prev-theme'),next=document.getElementById('next-theme');
 if(!stage||!slides.length)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let index=0,timer=null,paused=false;
 const perPage=()=>window.innerWidth<=600?1:window.innerWidth<=1050?2:4;
 const maxStart=()=>Math.max(0,slides.length-perPage());
 function show(n){
   index=Math.max(0,Math.min(n,maxStart()));
   stage.scrollTo({left:slides[index].offsetLeft-slides[0].offsetLeft,behavior:reduced?'auto':'smooth'});
   slides.forEach((slide)=>slide.setAttribute('aria-hidden','false'));
   dots.forEach((dot,i)=>{dot.hidden=i>maxStart();dot.classList.toggle('active',i===index);dot.setAttribute('aria-pressed',String(i===index));});
   if(prev)prev.disabled=index===0;if(next)next.disabled=index===maxStart();
 }
 function stop(){if(timer){clearInterval(timer);timer=null;}}
 function play(){stop();if(!reduced&&!paused&&!document.hidden&&maxStart()>0)timer=setInterval(()=>show(index===maxStart()?0:index+1),4500);}
 prev?.addEventListener('click',()=>{show(index-1);play();});next?.addEventListener('click',()=>{show(index+1);play();});
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i);play();}));
 stage.addEventListener('mouseenter',()=>{paused=true;stop();});stage.addEventListener('mouseleave',()=>{paused=false;play();});
 stage.addEventListener('focusin',()=>{paused=true;stop();});stage.addEventListener('focusout',()=>{paused=false;play();});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():play());
 window.addEventListener('resize',()=>{show(Math.min(index,maxStart()));play();});
 show(0);play();
})();
</script>
<script>
(function(){
 const vids=Array.from(document.querySelectorAll('video.loop'));
 if(!vids.length||!('IntersectionObserver' in window))return;
 const calm=window.matchMedia('(prefers-reduced-motion: reduce)');
 const seen=new Set();
 const sync=(v)=>{ if(seen.has(v)&&!calm.matches&&document.visibilityState==='visible'){v.muted=true;v.play().catch(()=>{});} else v.pause(); };
 const io=new IntersectionObserver((entries)=>entries.forEach((e)=>{ if(e.isIntersecting)seen.add(e.target); else seen.delete(e.target); sync(e.target); }),{rootMargin:'120px 0px'});
 vids.forEach((v)=>io.observe(v));
 const all=()=>vids.forEach(sync);
 document.addEventListener('visibilitychange',all); calm.addEventListener?.('change',all);
})();
</script>
<dialog class="quiz" id="quiz" aria-labelledby="quiz-title"><div class="in" id="quiz-body"></div></dialog>
<script>
(function(){
 const Q=${JSON.stringify(QUESTIONS).replace(/</g, "\\u003c")}, WEB=${JSON.stringify(web)};
 const dlg=document.getElementById('quiz'), body=document.getElementById('quiz-body'), open=document.getElementById('start-here');
 if(!dlg||!open||!dlg.showModal)return;
 let i=0, answers={};
 const el=(tag,attrs,...kids)=>{const n=document.createElement(tag);for(const k in attrs||{}){if(k==='text')n.textContent=attrs[k];else if(k.startsWith('on'))n.addEventListener(k.slice(2),attrs[k]);else n.setAttribute(k,attrs[k]);}kids.forEach(c=>n.append(c));return n;};
 const close=()=>dlg.close();
 function top(left){return el('div',{class:'top'},left||el('span'),el('button',{class:'x',type:'button','aria-label':'Close',onclick:close,text:'×'}));}
 function question(){
  const q=Q[i];
  body.replaceChildren(
   top(i>0?el('button',{class:'back',type:'button',onclick:()=>{i--;question();},text:'← Back'}):el('span',{text:'Question '+(i+1)+' of '+Q.length})),
   el('div',{class:'bar','aria-hidden':'true'},el('i',{style:'width:'+Math.round(i/Q.length*100)+'%'})),
   el('h2',{id:'quiz-title',text:q.title}),
   ...q.options.map(o=>el('button',{class:'opt',type:'button',onclick:()=>{answers[q.id]=o.id;if(i<Q.length-1){i++;question();}else plan();}},el('b',{text:o.label}),el('span',{text:o.hint})))
  );
  const first=body.querySelector('.opt'); if(first)first.focus();
 }
 async function plan(){
  body.replaceChildren(top(),el('h2',{id:'quiz-title',text:'Making your plan…'}));
  try{
   const r=await fetch('/api/start-plan/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers})});
   const p=await r.json(); if(!r.ok)throw new Error(p.error||'failed');
   const a=Q.map(q=>answers[q.id]).join(',');
   body.replaceChildren(top(el('p',{class:'eyebrow',text:'Your plan'})),
    el('h2',{id:'quiz-title',text:p.title}), el('p',{class:'sum',text:p.summary}),
    el('ol',{},...p.steps.map(s=>el('li',{},el('div',{},el('b',{text:s.title}),el('span',{text:s.why}))))),
    el('a',{class:'btn',href:WEB+'/start?a='+encodeURIComponent(a),text:'Save my plan and start free →'}),
    el('button',{class:'back',type:'button',onclick:()=>{i=0;answers={};question();},text:'Start over'}));
  }catch(e){body.replaceChildren(top(),el('h2',{id:'quiz-title',text:"Couldn't make your plan"}),el('p',{class:'sum',text:'Check your connection and try again.'}),el('button',{class:'btn',type:'button',onclick:plan,text:'Try again'}));}
 }
 open.addEventListener('click',()=>{i=0;answers={};question();dlg.showModal();});
 dlg.addEventListener('click',e=>{if(e.target===dlg)close();});
})();
</script>${vierraTag()}</body></html>`;
}
