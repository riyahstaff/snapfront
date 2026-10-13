import { defineTheme } from "../category-theme-kit.js";

export const theme = defineTheme({
  id: "p-womenswear",
  name: "Vespera Atelier",
  for: "Women's tailoring, dresses, and quiet occasionwear",
  vibe: "Sun-warmed limestone, dark plum tailoring, and an unhurried editorial arrival",
  category: "Editorial womenswear and occasion separates",
  group: "fashion",
  display: "Cormorant Garamond",
  body: "DM Sans",
  displayWeight: 500,
  tracking: "-.018em",
  colors: {
    bg: "#F5F2EC",
    surface: "#FBF9F4",
    ink: "#221D1A",
    muted: "#6F655E",
    line: "#D8D0C5",
    accent: "#44252D",
    onAccent: "#FFFFFF",
    panel: "#EDE7DF",
    onPanel: "#221D1A",
    foot: "#2D211F",
    onFoot: "#F2EAE2",
    bar: "#44252D",
    onBar: "#FFFFFF",
    badge: "#D8C2A8",
    onBadge: "#221D1A",
  },
  header: "split",
  hero: "editorial",
  card: "minimal",
  ratio: "3/4",
  rCard: 0,
  rBtn: 0,
  motion: "pan",
  copy: {
    eyebrow: "Seasonal edit",
    collection: "The arrival edit",
    cta: "Discover the collection",
    title: "A quieter kind of arrival",
    subtitle: "Modern forms, soft structure, and pieces chosen for the season ahead.",
  },
});

export function hero(ctx) {
  const hasCampaign = Boolean(ctx.pics[1]);
  const campaign = hasCampaign
    ? `<div class="ww-campaign">${ctx.media(1, { lazy: true, decorative: true })}</div>`
    : "";
  const season = ctx.eyebrow || "Seasonal edit";

  return `<section class="hero category-hero ww-arrival${ctx.heroClass}"${ctx.heroAttrs}>
  <div class="ww-portrait">
    ${ctx.media(0, { priority: true, lazy: false })}
    <p class="ww-portrait-label">${ctx.esc(season)}</p>
    <span class="ww-portrait-rule" aria-hidden="true"></span>
  </div>
  <div class="ww-right${hasCampaign ? " has-campaign" : " is-single"}">
    ${campaign}
    <div class="ww-words">
      ${ctx.copy("ww-copy")}
      <p class="ww-margin-note">Chosen with room to arrive.</p>
    </div>
  </div>
  ${ctx.controls}
</section>`;
}

export function discovery(ctx) {
  if (!ctx.products.length) return "";

  const selected = ctx.products.slice(0, 3);
  const hasCategories = ctx.cats.length >= 2;
  const categories = hasCategories
    ? `<nav class="ww-category-list" aria-label="Browse womenswear categories">${ctx.cats.slice(0, 4).map((category) =>
      `<a href="${ctx.esc(ctx.categoryLink(category.name))}"><span>${ctx.esc(category.name)}</span><small>${category.count} ${category.count === 1 ? "piece" : "pieces"}</small></a>`
    ).join("")}</nav>`
    : "";
  const count = ctx.products.length;
  const collection = ctx.t.copy?.collection || "The arrival edit";

  return `<section class="theme-discovery ww-edit${hasCategories ? " has-categories" : ""}" aria-labelledby="ww-edit-title">
  <div class="ww-edit-intro">
    <p class="ww-kicker">${ctx.esc(collection)}</p>
    <h2 id="ww-edit-title">Pieces to carry the moment.</h2>
    <p class="ww-edit-summary">A considered selection from ${count} ${count === 1 ? "available piece" : "available pieces"}.</p>
    <a class="ww-all-link" href="#shop">View all pieces <span aria-hidden="true">→</span></a>
  </div>
  <div class="ww-product-rail">
    ${selected.map((product) => `<div class="ww-product">${ctx.productCard(product)}</div>`).join("")}
  </div>
  ${categories}
</section>`;
}

export const css = `
.th-p-womenswear{background:var(--bg);color:var(--ink)}
.th-p-womenswear .hd{background:color-mix(in srgb,var(--bg) 94%,transparent);border-bottom-color:var(--line)}
.th-p-womenswear .hd .wrap{max-width:none;padding-inline:clamp(18px,3.2vw,52px)}
.th-p-womenswear .brand{font-size:calc(23px*var(--ts));letter-spacing:.09em}
.th-p-womenswear .nav{gap:clamp(18px,2.2vw,34px);font-size:13px}
.th-p-womenswear .nav a{letter-spacing:.02em}
.th-p-womenswear .cart{border:1px solid transparent}
.th-p-womenswear .cart:hover{background:transparent;border-color:var(--line)}

.th-p-womenswear .ww-arrival{display:grid;grid-template-columns:minmax(0,.94fr) minmax(0,1.06fr);min-height:min(720px,calc(100svh - 74px));margin-inline:clamp(12px,1.85vw,28px);border-inline:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--surface);isolation:isolate}
.th-p-womenswear .ww-portrait{position:relative;min-height:100%;overflow:hidden;background:#5A4B40}
.th-p-womenswear .ww-portrait .hero-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:40% center}
.th-p-womenswear .ww-portrait .theme-empty-media{height:100%;min-height:460px;background:linear-gradient(145deg,#4F4039,#8E7A68);color:#F8F2E8}
.th-p-womenswear .ww-portrait::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(14,10,8,.30),transparent 28%,transparent 70%,rgba(14,10,8,.40))}
.th-p-womenswear .ww-portrait-label{position:absolute;z-index:2;top:clamp(24px,3vw,46px);left:clamp(20px,3vw,46px);max-width:13ch;color:#FFF9F0;font:500 11px/1.35 var(--body);letter-spacing:.18em;text-transform:uppercase;overflow-wrap:anywhere}
.th-p-womenswear .ww-portrait-rule{position:absolute;z-index:2;bottom:clamp(26px,4vw,56px);left:clamp(20px,3vw,46px);width:22px;height:1px;background:#FFF9F0}
.th-p-womenswear .ww-right{display:grid;min-width:0;background:var(--surface)}
.th-p-womenswear .ww-right.has-campaign{grid-template-rows:minmax(230px,1.05fr) minmax(320px,.95fr)}
.th-p-womenswear .ww-right.is-single{grid-template-rows:1fr}
.th-p-womenswear .ww-campaign{position:relative;overflow:hidden;border-bottom:1px solid var(--line);background:var(--panel)}
.th-p-womenswear .ww-campaign .hero-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 44%}
.th-p-womenswear .ww-campaign .theme-empty-media{height:100%;min-height:230px;background:linear-gradient(130deg,#CBBCA9,#EEE7DB);color:var(--muted)}
.th-p-womenswear .ww-words{position:relative;display:grid;align-content:center;min-width:0;padding:clamp(38px,6vw,88px) clamp(26px,7vw,112px);background:var(--surface)}
.th-p-womenswear .ww-words::after{content:"";position:absolute;right:clamp(18px,3vw,44px);top:clamp(24px,4vw,56px);bottom:clamp(24px,4vw,56px);width:1px;background:var(--line)}
.th-p-womenswear .ww-arrival .ww-copy{display:grid;justify-items:start;gap:clamp(15px,1.8vw,24px);max-width:min(100%,650px);padding-right:clamp(14px,4vw,68px)}
.th-p-womenswear .ww-arrival .ww-copy .eyebrow{font:500 11px/1.35 var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.th-p-womenswear .ww-arrival .ww-copy h1{max-width:12ch;font-size:clamp(48px,5.1vw,91px);font-weight:500;line-height:.91;letter-spacing:-.035em;text-wrap:balance;overflow-wrap:anywhere}
.th-p-womenswear .ww-arrival .ww-copy h1.long{max-width:15ch;font-size:clamp(38px,4vw,66px);line-height:1}
.th-p-womenswear .ww-arrival .ww-copy .sub{max-width:44ch;font-size:clamp(15px,1.18vw,18px);line-height:1.55;color:var(--muted)}
.th-p-womenswear .ww-arrival .ctas{gap:10px;margin-top:4px}
.th-p-womenswear .ww-arrival .btn{min-height:48px;padding-inline:25px;background:var(--accent);color:var(--on-accent);font:500 12px/1 var(--body);letter-spacing:.04em}
.th-p-womenswear .ww-arrival .btn.ghost{border-color:var(--line);background:transparent;color:var(--ink)}
.th-p-womenswear .ww-arrival .btn:hover{background:#2E171E;color:#FFFFFF}
.th-p-womenswear .ww-margin-note{position:absolute;right:clamp(22px,3.5vw,54px);bottom:clamp(28px,4vw,58px);width:1.15em;writing-mode:vertical-rl;font:500 9px/1.4 var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.th-p-womenswear .ww-arrival .motion-toggle{right:clamp(16px,3vw,44px);bottom:clamp(16px,3vw,36px);min-height:44px;border-radius:0;border-color:var(--line);background:color-mix(in srgb,var(--surface) 90%,transparent);color:var(--ink)}

.th-p-womenswear .ww-edit{display:grid;grid-template-columns:minmax(220px,.68fr) minmax(0,1.72fr);gap:0;margin-inline:clamp(12px,1.85vw,28px);border-bottom:1px solid var(--line);background:var(--bg)}
.th-p-womenswear .ww-edit.has-categories{grid-template-columns:minmax(210px,.62fr) minmax(0,1.55fr) minmax(170px,.48fr)}
.th-p-womenswear .ww-edit-intro{display:grid;align-content:start;justify-items:start;gap:clamp(15px,1.6vw,22px);padding:clamp(38px,5vw,80px) clamp(20px,3vw,48px);border-right:1px solid var(--line)}
.th-p-womenswear .ww-kicker{font:600 10px/1.35 var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.th-p-womenswear .ww-edit h2{max-width:9ch;font-size:clamp(36px,3.25vw,56px);font-weight:500;line-height:.94;letter-spacing:-.03em;overflow-wrap:anywhere}
.th-p-womenswear .ww-edit-summary{max-width:25ch;font-size:14px;line-height:1.55;color:var(--muted)}
.th-p-womenswear .ww-all-link{display:inline-flex;align-items:center;gap:12px;min-height:44px;margin-top:8px;font:600 12px/1 var(--body);letter-spacing:.08em;text-decoration:none;text-transform:uppercase;border-bottom:1px solid currentColor}
.th-p-womenswear .ww-all-link:hover{color:var(--accent)}
.th-p-womenswear .ww-all-link span{font-size:17px;line-height:1}
.th-p-womenswear .ww-product-rail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));min-width:0}
.th-p-womenswear .ww-product{min-width:0;border-right:1px solid var(--line)}
.th-p-womenswear .ww-product:last-child{border-right:0}
.th-p-womenswear .ww-product .pc{display:block;height:100%;padding:clamp(12px,1.6vw,24px);text-decoration:none}
.th-p-womenswear .ww-product .pc .im{position:relative;overflow:hidden;aspect-ratio:3/4;background:var(--panel)}
.th-p-womenswear .ww-product .pc .im img{width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
.th-p-womenswear .ww-product .pc:hover .im img{transform:scale(1.025)}
.th-p-womenswear .ww-product .pc .bd{display:grid;gap:5px;padding-top:14px}
.th-p-womenswear .ww-product .pc h3{font-size:clamp(18px,1.45vw,24px);font-weight:500;line-height:1.06;letter-spacing:-.02em;overflow-wrap:anywhere}
.th-p-womenswear .ww-product .pc .pr{font:500 13px/1.35 var(--body);color:var(--muted)}
.th-p-womenswear .ww-product .pc .go{border-radius:0}
.th-p-womenswear .ww-category-list{display:grid;align-content:start;padding:clamp(30px,4vw,62px) clamp(18px,2.5vw,38px);border-left:1px solid var(--line)}
.th-p-womenswear .ww-category-list a{display:flex;align-items:baseline;justify-content:space-between;gap:12px;min-height:46px;padding-block:12px;border-bottom:1px solid var(--line);font-size:14px;line-height:1.25;text-decoration:none}
.th-p-womenswear .ww-category-list a:first-child{border-top:1px solid var(--line)}
.th-p-womenswear .ww-category-list a:hover{color:var(--accent)}
.th-p-womenswear .ww-category-list span{overflow-wrap:anywhere}
.th-p-womenswear .ww-category-list small{flex:0 0 auto;font-size:10px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase}

.th-p-womenswear #shop{padding-top:clamp(52px,7vw,100px)}
.th-p-womenswear #shop .sec-h{margin-inline:clamp(12px,1.85vw,28px);padding-bottom:clamp(18px,2vw,28px);border-bottom:1px solid var(--line)}
.th-p-womenswear #shop .sec-h h2{font-size:clamp(38px,4vw,66px);font-weight:500;letter-spacing:-.035em}
.th-p-womenswear #shop .grid{gap:0;margin-inline:clamp(12px,1.85vw,28px);border-top:1px solid var(--line);border-left:1px solid var(--line)}
.th-p-womenswear #shop .pc{padding:clamp(12px,1.7vw,25px);border-right:1px solid var(--line);border-bottom:1px solid var(--line);text-decoration:none}
.th-p-womenswear #shop .pc .im{overflow:hidden;background:var(--panel)}
.th-p-womenswear #shop .pc .im img{transition:transform .35s ease}
.th-p-womenswear #shop .pc:hover .im img{transform:scale(1.02)}
.th-p-womenswear #shop .pc .bd{padding-top:14px}
.th-p-womenswear #shop .pc h3{font-size:clamp(18px,1.5vw,24px);font-weight:500;line-height:1.08;letter-spacing:-.02em}
.th-p-womenswear #shop .pc .pr{font:500 13px/1.3 var(--body);color:var(--muted)}

@media (max-width:1040px){
  .th-p-womenswear .ww-arrival{grid-template-columns:minmax(0,.84fr) minmax(0,1.16fr)}
  .th-p-womenswear .ww-right.has-campaign{grid-template-rows:minmax(210px,.9fr) minmax(340px,1.1fr)}
  .th-p-womenswear .ww-arrival .ww-copy h1{font-size:clamp(46px,5.2vw,70px)}
  .th-p-womenswear .ww-edit.has-categories{grid-template-columns:minmax(195px,.55fr) minmax(0,1.45fr) minmax(155px,.42fr)}
  .th-p-womenswear .ww-product .pc{padding:14px}
}
@media (max-width:820px){
  .th-p-womenswear .ww-arrival{grid-template-columns:minmax(0,.78fr) minmax(0,1.22fr);min-height:620px}
  .th-p-womenswear .ww-right.has-campaign{grid-template-rows:minmax(190px,.75fr) minmax(370px,1.25fr)}
  .th-p-womenswear .ww-words{padding:clamp(32px,5vw,52px) clamp(24px,5vw,44px)}
  .th-p-womenswear .ww-words::after{display:none}
  .th-p-womenswear .ww-arrival .ww-copy{padding-right:0}
  .th-p-womenswear .ww-margin-note{display:none}
  .th-p-womenswear .ww-edit,.th-p-womenswear .ww-edit.has-categories{grid-template-columns:minmax(190px,.7fr) minmax(0,1.3fr)}
  .th-p-womenswear .ww-category-list{grid-column:1/-1;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;padding:0;border-top:1px solid var(--line);border-left:0}
  .th-p-womenswear .ww-category-list a{padding:16px;border-top:0;border-right:1px solid var(--line)}
  .th-p-womenswear .ww-category-list a:first-child{border-top:0}
}
@media (max-width:680px){
  .th-p-womenswear .hd .wrap{padding-inline:16px}
  .th-p-womenswear .brand{font-size:20px;letter-spacing:.065em}
  .th-p-womenswear .ww-arrival{grid-template-columns:1fr;min-height:0;margin-inline:0;border-inline:0}
  .th-p-womenswear .ww-portrait{min-height:0;aspect-ratio:5/6}
  .th-p-womenswear .ww-portrait .theme-empty-media{min-height:0}
  .th-p-womenswear .ww-right.has-campaign{grid-template-rows:minmax(180px,47vw) auto}
  .th-p-womenswear .ww-right.is-single{min-height:350px}
  .th-p-womenswear .ww-campaign .theme-empty-media{min-height:0}
  .th-p-womenswear .ww-words{padding:40px 24px 46px}
  .th-p-womenswear .ww-arrival .ww-copy h1{max-width:12ch;font-size:clamp(47px,13vw,64px)}
  .th-p-womenswear .ww-arrival .ww-copy h1.long{font-size:clamp(34px,9.2vw,48px)}
  .th-p-womenswear .ww-arrival .ww-copy .sub{font-size:15px}
  .th-p-womenswear .ww-arrival .ctas{width:100%}
  .th-p-womenswear .ww-arrival .btn{flex:1 1 190px;min-height:48px}
  .th-p-womenswear .ww-arrival .motion-toggle{bottom:auto;top:calc(100% - 52px);right:12px}
  .th-p-womenswear .ww-edit,.th-p-womenswear .ww-edit.has-categories{display:block;margin-inline:0;border-inline:0}
  .th-p-womenswear .ww-edit-intro{padding:42px 22px 32px;border-right:0;border-bottom:1px solid var(--line)}
  .th-p-womenswear .ww-edit h2{max-width:12ch;font-size:clamp(38px,10vw,52px)}
  .th-p-womenswear .ww-product-rail{grid-template-columns:repeat(2,minmax(0,1fr));border-bottom:1px solid var(--line)}
  .th-p-womenswear .ww-product:nth-child(2){border-right:0}
  .th-p-womenswear .ww-product:nth-child(3){grid-column:1/-1;border-top:1px solid var(--line)}
  .th-p-womenswear .ww-product:nth-child(3) .pc{display:grid;grid-template-columns:minmax(0,.72fr) minmax(0,1fr);align-items:end;gap:14px}
  .th-p-womenswear .ww-product:nth-child(3) .pc .bd{padding-top:0;padding-bottom:4px}
  .th-p-womenswear .ww-category-list{grid-template-columns:1fr;padding:0}
  .th-p-womenswear .ww-category-list a{padding:14px 22px;border-right:0}
  .th-p-womenswear #shop{padding-top:56px}
  .th-p-womenswear #shop .sec-h{margin-inline:0;padding-inline:22px}
  .th-p-womenswear #shop .grid{margin-inline:0;border-left:0}
  .th-p-womenswear #shop .pc{padding:12px}
}
@media (max-width:390px){
  .th-p-womenswear .ww-product:nth-child(3) .pc{display:block}
  .th-p-womenswear .ww-product:nth-child(3) .pc .bd{padding-top:12px}
  .th-p-womenswear .ww-arrival .btn{flex-basis:100%}
}
`;
