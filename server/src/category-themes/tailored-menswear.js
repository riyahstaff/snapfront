import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-tailored-menswear',
  name: 'THE LINE ROOM',
  for: 'Tailored menswear, suiting, and considered separates',
  vibe: 'A measured cutting-table folio in ink, parchment, walnut, and muted brass',
  category: 'Tailored menswear / suiting and separates',
  group: 'fashion',
  display: 'Bodoni Moda',
  body: 'Manrope',
  displayWeight: 600,
  tracking: '-.045em',
  colors: {
    bg: '#EEE9DE',
    surface: '#F8F5EE',
    ink: '#17242D',
    muted: '#68716F',
    line: '#B9B5AA',
    accent: '#9A4D35',
    onAccent: '#FFF9F0',
    panel: '#D9D4C7',
    onPanel: '#17242D',
    foot: '#17242D',
    onFoot: '#F7F3E9',
    bar: '#D8C3A6',
    onBar: '#17242D',
    badge: '#B78C4B',
    onBadge: '#17242D',
  },
  header: 'stack',
  hero: 'editorial',
  card: 'boxed',
  ratio: '3/4',
  rCard: 2,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'The line room',
    collection: 'The working selection',
    cta: 'View the collection',
    title: 'Cut for the life in front of you.',
    subtitle: 'A considered edit of tailoring and the pieces that hold their line.',
  },
  collection: 'premium',
  family: 'tailored-menswear',
  demoPhoto: '/assets/themes/tailored-menswear-hero.webp',
});

const twoDigits = (index) => String(index + 1).padStart(2, '0');
const countLabel = (count) => `${count} ${Number(count) === 1 ? 'piece' : 'pieces'}`;

export function hero(ctx) {
  return `<section class="hero category-hero tailored-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="tailored-hero-mast" aria-hidden="true">
      <span>Atelier edition</span><i></i><span>01 — 03</span>
    </div>
    <div class="tailored-hero-board">
      <aside class="tailored-hero-margin" aria-label="${ctx.esc(ctx.store.store_name)} editorial note">
        <p class="tailored-margin-number" aria-hidden="true">01</p>
        <p class="tailored-margin-word">Proportion<br>is the<br>first gesture.</p>
        <i aria-hidden="true"></i>
        <p class="tailored-margin-store">${ctx.esc(ctx.store.store_name)}</p>
      </aside>
      <div class="tailored-hero-picture">
        ${ctx.media(0, { priority: true, lazy: false })}
        <span class="tailored-picture-rule tailored-picture-rule-a" aria-hidden="true"></span>
        <span class="tailored-picture-rule tailored-picture-rule-b" aria-hidden="true"></span>
      </div>
      <div class="tailored-hero-copy-area">
        <div class="tailored-hero-copy">${ctx.copy('tailored-copy')}</div>
        <p class="tailored-copy-caption">An edit arranged around line, ease, and return.</p>
      </div>
      <aside class="tailored-hero-notes" aria-label="Editorial details">
        <span class="tailored-notes-kicker">The folio</span>
        <span class="tailored-notes-disc" aria-hidden="true"></span>
        <p>Jacket<br>trouser<br>finishing</p>
        <i aria-hidden="true"></i>
        <span class="tailored-notes-index" aria-hidden="true">03</span>
      </aside>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  if (ctx.cats.length >= 2) {
    const categories = ctx.cats.slice(0, 4);
    return `<section class="theme-discovery tailored-discovery" aria-labelledby="tailored-discovery-title">
      <div class="tailored-discovery-title">
        <p class="tailored-section-mark">The cloth board</p>
        <h2 id="tailored-discovery-title">Choose the part<br>of the wardrobe<br>that leads.</h2>
        <p>Browse the live collections currently available from ${ctx.esc(ctx.store.store_name)}.</p>
      </div>
      <div class="tailored-category-board">
        ${categories.map((category, index) => `<a class="tailored-category-entry" href="${ctx.esc(ctx.categoryLink(category.name))}">
          <span class="tailored-category-index" aria-hidden="true">${twoDigits(index)}</span>
          <span class="tailored-category-media">${category.image ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}</span>
          <span class="tailored-category-copy"><b>${ctx.esc(category.name)}</b><small>${ctx.esc(countLabel(category.count))}</small></span>
          <span class="tailored-category-arrow" aria-hidden="true">↗</span>
        </a>`).join('')}
      </div>
    </section>`;
  }

  if (!ctx.products.length) return '';

  const products = ctx.products.slice(0, 4);
  return `<section class="theme-discovery tailored-discovery tailored-piece-discovery" aria-labelledby="tailored-discovery-title">
    <div class="tailored-discovery-title">
      <p class="tailored-section-mark">The current rail</p>
      <h2 id="tailored-discovery-title">Begin with the<br>pieces in view.</h2>
    </div>
    <div class="tailored-piece-board">
      ${products.map((product, index) => `<a class="tailored-piece-entry" href="${ctx.esc(ctx.productLink(product))}">
        <span class="tailored-piece-index" aria-hidden="true">${twoDigits(index)}</span>
        <span class="tailored-piece-media">${product.image_url ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}</span>
        <span class="tailored-piece-copy"><b>${ctx.esc(product.title)}</b>${product.category ? `<small>${ctx.esc(product.category)}</small>` : ''}${product.price_cents != null ? `<em>${ctx.esc(ctx.money(product.price_cents, product.currency || 'usd'))}</em>` : ''}</span>
      </a>`).join('')}
    </div>
  </section>`;
}

export const css = `
.th-p-tailored-menswear{
  --tailored-paper:#eee9de;
  --tailored-ink:#17242d;
  --tailored-rust:#9a4d35;
  --tailored-gold:#b78c4b;
  --tailored-line:#b9b5aa;
  background:var(--tailored-paper);
  color:var(--tailored-ink);
}
.th-p-tailored-menswear .hd{background:color-mix(in srgb,var(--bg) 92%,transparent);border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}
.th-p-tailored-menswear .hd .wrap{min-height:72px;max-width:1480px}
.th-p-tailored-menswear .brand{font-family:var(--display);font-size:calc(30px * var(--ts));font-weight:600;letter-spacing:-.045em}
.th-p-tailored-menswear .nav{gap:clamp(14px,2.4vw,33px);font-size:10px;font-weight:700;letter-spacing:.17em;text-transform:uppercase}
.th-p-tailored-menswear .nav a{background-size:100% 1px;background-position:0 100%;background-repeat:no-repeat;background-image:linear-gradient(currentColor,currentColor);transition:background-size .2s ease}
.th-p-tailored-menswear .nav a:not(:hover):not([aria-current]){background-size:0 1px}
.th-p-tailored-menswear .cart{width:42px;height:42px;border:1px solid var(--line);border-radius:50%;background:transparent}
.th-p-tailored-menswear .cart b{border-radius:50%;background:var(--accent);color:var(--on-accent)}
.th-p-tailored-menswear .category-hero.tailored-hero{position:relative;isolation:isolate;overflow:hidden;min-height:clamp(600px,56vw,810px);padding:clamp(17px,2vw,30px) clamp(18px,3.6vw,62px) clamp(24px,2.8vw,44px);background:var(--tailored-paper);color:var(--tailored-ink)}
.th-p-tailored-menswear .tailored-hero::before{position:absolute;z-index:-1;top:0;right:0;bottom:0;left:0;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(25% - 1px),rgba(23,36,45,.07) calc(25% - 1px),rgba(23,36,45,.07) 25%);content:"";pointer-events:none}
.th-p-tailored-menswear .tailored-hero-mast{display:flex;align-items:center;gap:14px;height:24px;margin:0 0 clamp(11px,1.7vw,25px);color:var(--tailored-ink);font:700 9px/1 var(--body);letter-spacing:.19em;text-transform:uppercase}
.th-p-tailored-menswear .tailored-hero-mast i{display:block;flex:1;height:1px;background:var(--tailored-line)}
.th-p-tailored-menswear .tailored-hero-mast span:last-child{color:var(--tailored-rust)}
.th-p-tailored-menswear .tailored-hero-board{display:grid;grid-template-columns:minmax(140px,.6fr) minmax(330px,1.55fr) minmax(210px,.9fr);grid-template-rows:minmax(0,1fr);min-height:clamp(520px,49vw,720px);border-top:1px solid var(--tailored-ink);border-bottom:1px solid var(--tailored-ink)}
.th-p-tailored-menswear .tailored-hero-margin{display:flex;flex-direction:column;justify-content:space-between;min-width:0;padding:clamp(18px,2vw,30px) clamp(12px,2vw,30px) clamp(17px,2vw,28px) 0;border-right:1px solid var(--tailored-line)}
.th-p-tailored-menswear .tailored-margin-number{margin:0;color:var(--tailored-rust);font:700 11px/1 var(--body);letter-spacing:.18em}
.th-p-tailored-menswear .tailored-margin-word{margin:0;font-family:var(--display);font-size:clamp(25px,2.65vw,46px);font-weight:600;letter-spacing:-.055em;line-height:.86}
.th-p-tailored-menswear .tailored-hero-margin i{width:28px;height:28px;border:1px solid var(--tailored-rust);border-radius:50% 50% 0 50%;transform:rotate(45deg)}
.th-p-tailored-menswear .tailored-margin-store{max-width:9ch;margin:0;font:700 9px/1.55 var(--body);letter-spacing:.15em;overflow-wrap:anywhere;text-transform:uppercase}
.th-p-tailored-menswear .tailored-hero-picture{position:relative;min-width:0;overflow:hidden;background:#1c2a30}
.th-p-tailored-menswear .tailored-hero-picture>.hero-media,.th-p-tailored-menswear .tailored-hero-picture>.theme-empty-media{display:block;width:100%;height:100%;min-height:0;object-fit:cover}
.th-p-tailored-menswear .tailored-hero-picture>.hero-media{object-position:center center;filter:saturate(.77) contrast(1.04)}
.th-p-tailored-menswear .tailored-hero-picture>.theme-empty-media{background:linear-gradient(135deg,#1b2a31 0%,#516062 47%,#c5a87a 48%,#28363a 50%,#142127 100%);color:#f2e7d5}
.th-p-tailored-menswear .tailored-picture-rule{position:absolute;z-index:1;display:block;width:clamp(70px,9vw,135px);height:1px;background:#e7d5b3;opacity:.85;transform:rotate(-37deg);transform-origin:left center}
.th-p-tailored-menswear .tailored-picture-rule-a{top:18%;left:0}
.th-p-tailored-menswear .tailored-picture-rule-b{right:-3%;bottom:23%;transform:rotate(143deg)}
.th-p-tailored-menswear .tailored-hero-copy-area{display:flex;flex-direction:column;justify-content:flex-end;min-width:0;padding:clamp(22px,3vw,52px) clamp(18px,3vw,52px) clamp(20px,2.8vw,44px);border-right:1px solid var(--tailored-line);background:var(--tailored-paper)}
.th-p-tailored-menswear .tailored-copy .txt{display:grid;gap:clamp(11px,1.35vw,18px);justify-items:start}
.th-p-tailored-menswear .tailored-copy .eyebrow{margin:0;color:var(--tailored-rust);font:700 10px/1.35 var(--body);letter-spacing:.2em;text-transform:uppercase}
.th-p-tailored-menswear .tailored-copy h1{max-width:9ch;margin:0;font-family:var(--display);font-size:calc(clamp(47px,5.7vw,99px) * var(--hero));font-weight:600;letter-spacing:-.072em;line-height:.78;overflow-wrap:anywhere;text-wrap:balance}
.th-p-tailored-menswear .tailored-copy h1.long{max-width:11ch;font-size:calc(clamp(37px,4.15vw,69px) * min(var(--hero),1.1));line-height:.86}
.th-p-tailored-menswear .tailored-copy .sub{max-width:30ch;margin:0;color:var(--muted);font:400 clamp(13px,1.05vw,16px)/1.56 var(--body)}
.th-p-tailored-menswear .tailored-copy .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:5px}
.th-p-tailored-menswear .tailored-copy .btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 17px;border:1px solid var(--tailored-ink);border-radius:0;background:var(--tailored-ink);color:#f8f4eb;font:700 10px/1 var(--body);letter-spacing:.13em;text-align:center;text-transform:uppercase}
.th-p-tailored-menswear .tailored-copy .btn:hover{background:var(--tailored-rust);border-color:var(--tailored-rust)}
.th-p-tailored-menswear .tailored-copy .btn.ghost{background:transparent;color:var(--tailored-ink)}
.th-p-tailored-menswear .tailored-copy .btn.ghost:hover{background:var(--tailored-ink);color:#f8f4eb}
.th-p-tailored-menswear .tailored-copy-caption{max-width:26ch;margin:clamp(25px,5vw,84px) 0 0;padding-top:11px;border-top:1px solid var(--tailored-line);color:var(--muted);font:600 9px/1.55 var(--body);letter-spacing:.12em;text-transform:uppercase}
.th-p-tailored-menswear .tailored-hero-notes{display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;min-width:0;padding:clamp(18px,2vw,30px) 0 clamp(17px,2vw,28px) clamp(13px,2vw,29px);background:linear-gradient(180deg,rgba(216,195,166,.52),rgba(238,233,222,.1))}
.th-p-tailored-menswear .tailored-notes-kicker{font:700 9px/1.2 var(--body);letter-spacing:.2em;text-transform:uppercase}
.th-p-tailored-menswear .tailored-notes-disc{width:clamp(64px,6.5vw,104px);aspect-ratio:1;border:1px solid var(--tailored-rust);border-radius:50%;background:repeating-conic-gradient(from -10deg,rgba(154,77,53,.82) 0deg 1deg,transparent 1deg 15deg);box-shadow:inset 0 0 0 13px rgba(238,233,222,.55)}
.th-p-tailored-menswear .tailored-hero-notes p{margin:0;color:var(--tailored-ink);font-family:var(--display);font-size:clamp(22px,2.2vw,38px);font-weight:600;letter-spacing:-.055em;line-height:.85}
.th-p-tailored-menswear .tailored-hero-notes i{width:1px;height:clamp(35px,4vw,68px);background:var(--tailored-rust)}
.th-p-tailored-menswear .tailored-notes-index{color:var(--tailored-rust);font:700 11px/1 var(--body);letter-spacing:.17em}
.th-p-tailored-menswear .tailored-hero .motion-toggle{position:absolute;z-index:3;right:clamp(18px,3.6vw,62px);bottom:clamp(17px,2.8vw,44px);min-height:44px;border:1px solid var(--tailored-ink);border-radius:0;padding:0 11px;background:rgba(238,233,222,.82);color:var(--tailored-ink);font:700 9px/1 var(--body);letter-spacing:.12em;text-transform:uppercase}
.th-p-tailored-menswear .tailored-hero .motion-toggle:hover{background:var(--tailored-ink);color:var(--tailored-paper)}
.th-p-tailored-menswear .tailored-discovery{display:grid;grid-template-columns:minmax(230px,.72fr) minmax(0,1.8fr);gap:clamp(30px,7vw,132px);max-width:1480px;margin:0 auto;padding:clamp(58px,8vw,126px) clamp(18px,4vw,62px);border-bottom:1px solid var(--tailored-line)}
.th-p-tailored-menswear .tailored-discovery-title{align-self:start;max-width:330px;padding-top:clamp(0px,2vw,28px)}
.th-p-tailored-menswear .tailored-section-mark{margin:0 0 15px;color:var(--tailored-rust);font:700 10px/1.35 var(--body);letter-spacing:.2em;text-transform:uppercase}
.th-p-tailored-menswear .tailored-discovery h2{margin:0;font-family:var(--display);font-size:calc(clamp(39px,4vw,71px) * var(--ts));font-weight:600;letter-spacing:-.07em;line-height:.82;text-wrap:balance}
.th-p-tailored-menswear .tailored-discovery-title>p:last-child{max-width:29ch;margin:24px 0 0;color:var(--muted);font:400 14px/1.6 var(--body)}
.th-p-tailored-menswear .tailored-category-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-self:start;border-top:1px solid var(--tailored-ink);border-left:1px solid var(--tailored-line)}
.th-p-tailored-menswear .tailored-category-entry{position:relative;display:grid;grid-template-rows:auto 1fr auto;min-width:0;min-height:clamp(310px,28vw,410px);padding:17px 15px 19px;border-right:1px solid var(--tailored-line);border-bottom:1px solid var(--tailored-line);background:var(--tailored-paper);color:var(--tailored-ink);text-decoration:none}
.th-p-tailored-menswear .tailored-category-entry:nth-child(even){background:#e4ded2}
.th-p-tailored-menswear .tailored-category-entry:hover{background:#d7c3a6}
.th-p-tailored-menswear .tailored-category-index{color:var(--tailored-rust);font:700 10px/1 var(--body);letter-spacing:.16em}
.th-p-tailored-menswear .tailored-category-media{position:relative;display:grid;min-height:116px;place-items:center;overflow:hidden;margin:23px 0 20px;background:#bcc2ba}
.th-p-tailored-menswear .tailored-category-media img{width:100%;height:100%;object-fit:cover;filter:saturate(.68) contrast(1.04);transition:transform .45s ease}
.th-p-tailored-menswear .tailored-category-entry:hover .tailored-category-media img{transform:scale(1.045)}
.th-p-tailored-menswear .tailored-category-media i{width:62%;height:62%;border:1px solid rgba(23,36,45,.6);border-radius:50% 50% 5% 50%;transform:rotate(45deg)}
.th-p-tailored-menswear .tailored-category-copy{display:grid;gap:7px;align-content:start;padding-right:10px}
.th-p-tailored-menswear .tailored-category-copy b{overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(22px,1.85vw,31px);font-weight:600;letter-spacing:-.055em;line-height:.88}
.th-p-tailored-menswear .tailored-category-copy small{color:var(--muted);font:700 9px/1.35 var(--body);letter-spacing:.12em;text-transform:uppercase}
.th-p-tailored-menswear .tailored-category-arrow{position:absolute;right:14px;bottom:17px;color:var(--tailored-rust);font:400 23px/1 var(--display)}
.th-p-tailored-menswear .tailored-piece-discovery{align-items:start}
.th-p-tailored-menswear .tailored-piece-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(11px,1.5vw,22px)}
.th-p-tailored-menswear .tailored-piece-entry{display:grid;grid-template-rows:auto 1fr auto;gap:11px;min-width:0;color:var(--tailored-ink);text-decoration:none}
.th-p-tailored-menswear .tailored-piece-index{color:var(--tailored-rust);font:700 10px/1 var(--body);letter-spacing:.16em}
.th-p-tailored-menswear .tailored-piece-media{position:relative;display:grid;aspect-ratio:3/4;place-items:center;overflow:hidden;background:#d9d4c7}
.th-p-tailored-menswear .tailored-piece-media img{width:100%;height:100%;object-fit:cover;filter:saturate(.72);transition:transform .45s ease}
.th-p-tailored-menswear .tailored-piece-entry:hover .tailored-piece-media img{transform:scale(1.04)}
.th-p-tailored-menswear .tailored-piece-media i{width:38%;height:54%;border:1px solid var(--tailored-rust);border-radius:48% 48% 7% 7%;transform:rotate(-9deg)}
.th-p-tailored-menswear .tailored-piece-copy{display:grid;gap:4px;min-width:0}
.th-p-tailored-menswear .tailored-piece-copy b{overflow-wrap:anywhere;font-family:var(--display);font-size:clamp(19px,1.65vw,28px);font-weight:600;letter-spacing:-.045em;line-height:.92}
.th-p-tailored-menswear .tailored-piece-copy small{color:var(--muted);font:500 11px/1.35 var(--body)}
.th-p-tailored-menswear .tailored-piece-copy em{margin-top:2px;color:var(--tailored-rust);font:700 11px/1.3 var(--body);font-style:normal;letter-spacing:.04em}
.th-p-tailored-menswear #shop.sec{max-width:1480px;margin:0 auto;padding:clamp(48px,6vw,92px) clamp(18px,4vw,62px) clamp(70px,8vw,120px)}
.th-p-tailored-menswear #shop .sec-h{align-items:end;margin-bottom:clamp(28px,4vw,54px);padding-top:0;border-top:0}
.th-p-tailored-menswear #shop .sec-h h2{font-family:var(--display);font-size:calc(clamp(42px,4.8vw,76px) * var(--ts));font-weight:600;letter-spacing:-.07em;line-height:.86}
.th-p-tailored-menswear .chips{gap:7px;border:0;border-radius:0;overflow-x:auto;scrollbar-width:none}
.th-p-tailored-menswear .chip{min-height:44px;border:1px solid var(--tailored-line);border-radius:0;padding:0 13px;background:transparent;color:var(--tailored-ink);font:700 10px/1 var(--body);letter-spacing:.11em;text-transform:uppercase}
.th-p-tailored-menswear .chip[aria-current]{border-color:var(--tailored-ink);background:var(--tailored-ink);color:var(--tailored-paper)}
.th-p-tailored-menswear .grid{gap:clamp(28px,4vw,64px) clamp(14px,2.3vw,34px)}
.th-p-tailored-menswear .pc{gap:12px;padding-top:11px;border-top:1px solid var(--tailored-ink);text-align:left}
.th-p-tailored-menswear .pc .im{border-radius:0;background:var(--panel)}
.th-p-tailored-menswear .pc .tag{top:0;left:0;border-radius:0;background:var(--tailored-rust);color:#fff9f0;font:700 9px/1 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-tailored-menswear .pc .bd{grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:start}
.th-p-tailored-menswear .pc h3{font-family:var(--display);font-size:calc(24px * var(--ts));font-weight:600;letter-spacing:-.045em;line-height:.95}
.th-p-tailored-menswear .pc .pr{grid-column:2;grid-row:1;color:var(--tailored-rust);font-size:13px;font-weight:700}
.th-p-tailored-menswear .pc .rt{grid-column:1/-1;color:var(--muted)}
.th-p-tailored-menswear .pc .go{border-radius:0;background:var(--tailored-ink);color:var(--tailored-paper);font:700 10px/1 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-tailored-menswear .perks{border-color:var(--tailored-line);background:var(--surface)}
.th-p-tailored-menswear .perk svg{color:var(--tailored-rust)}
.th-p-tailored-menswear .ft{background:var(--tailored-ink)}
@media (max-width:1000px){
  .th-p-tailored-menswear .tailored-hero-board{grid-template-columns:minmax(112px,.48fr) minmax(300px,1.35fr) minmax(170px,.72fr)}
  .th-p-tailored-menswear .tailored-copy h1{font-size:calc(clamp(43px,6.7vw,77px) * var(--hero))}
  .th-p-tailored-menswear .tailored-copy h1.long{font-size:calc(clamp(35px,5.3vw,58px) * min(var(--hero),1.1))}
  .th-p-tailored-menswear .tailored-category-board{grid-template-columns:repeat(2,minmax(0,1fr))}
  .th-p-tailored-menswear .tailored-category-entry{min-height:310px}
  .th-p-tailored-menswear .tailored-piece-board{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:720px){
  .th-p-tailored-menswear .hd .wrap{min-height:64px}
  .th-p-tailored-menswear .category-hero.tailored-hero{min-height:0;padding:12px 16px 20px}
  .th-p-tailored-menswear .tailored-hero::before{background:repeating-linear-gradient(90deg,transparent 0,transparent calc(50% - 1px),rgba(23,36,45,.06) calc(50% - 1px),rgba(23,36,45,.06) 50%)}
  .th-p-tailored-menswear .tailored-hero-mast{margin-bottom:13px;font-size:8px}
  .th-p-tailored-menswear .tailored-hero-board{display:grid;grid-template-columns:1fr;grid-template-rows:auto minmax(390px,112vw) auto;min-height:0;border-bottom:0}
  .th-p-tailored-menswear .tailored-hero-margin{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:16px;min-height:55px;padding:0;border-right:0;border-bottom:1px solid var(--tailored-line)}
  .th-p-tailored-menswear .tailored-margin-word{font-family:var(--body);font-size:9px;font-weight:700;letter-spacing:.16em;line-height:1.4;text-align:center;text-transform:uppercase}
  .th-p-tailored-menswear .tailored-margin-word br{display:none}
  .th-p-tailored-menswear .tailored-hero-margin i{width:18px;height:18px;justify-self:end}
  .th-p-tailored-menswear .tailored-margin-store{display:none}
  .th-p-tailored-menswear .tailored-hero-picture{grid-row:2}
  .th-p-tailored-menswear .tailored-hero-picture>.hero-media{object-position:55% center}
  .th-p-tailored-menswear .tailored-hero-copy-area{position:relative;z-index:1;grid-row:3;margin:-68px 12px 0;padding:24px 17px 20px;border:1px solid var(--tailored-ink);background:rgba(248,245,238,.97)}
  .th-p-tailored-menswear .tailored-copy h1{max-width:10ch;font-size:calc(clamp(45px,14vw,64px) * var(--hero));line-height:.81}
  .th-p-tailored-menswear .tailored-copy h1.long{max-width:13ch;font-size:calc(clamp(34px,10.1vw,47px) * min(var(--hero),1.1))}
  .th-p-tailored-menswear .tailored-copy .sub{max-width:35ch;font-size:13px}
  .th-p-tailored-menswear .tailored-copy-caption{display:none}
  .th-p-tailored-menswear .tailored-hero-notes{display:none}
  .th-p-tailored-menswear .tailored-hero .motion-toggle{top:82px;right:27px;bottom:auto;background:rgba(238,233,222,.86)}
  .th-p-tailored-menswear .tailored-discovery{grid-template-columns:1fr;gap:30px;padding:54px 20px 67px}
  .th-p-tailored-menswear .tailored-discovery-title{max-width:420px;padding-top:0}
  .th-p-tailored-menswear .tailored-discovery h2{font-size:calc(clamp(41px,12vw,58px) * var(--ts))}
  .th-p-tailored-menswear .tailored-category-entry{min-height:260px;padding:14px 12px 15px}
  .th-p-tailored-menswear .tailored-category-media{min-height:96px;margin:18px 0 15px}
  .th-p-tailored-menswear .tailored-category-copy b{font-size:25px}
  .th-p-tailored-menswear .tailored-piece-board{gap:21px 13px}
  .th-p-tailored-menswear #shop.sec{padding:50px 20px 76px}
  .th-p-tailored-menswear #shop .sec-h{align-items:start}
  .th-p-tailored-menswear #shop .sec-h h2{font-size:calc(clamp(42px,12vw,58px) * var(--ts))}
  .th-p-tailored-menswear .chips{width:100%}
  .th-p-tailored-menswear .chip{flex:1 0 auto}
  .th-p-tailored-menswear .pc h3{font-size:calc(21px * var(--ts))}
  .th-p-tailored-menswear .pc .bd{display:block}
  .th-p-tailored-menswear .pc .pr{display:block;margin-top:5px}
}
@media (max-width:390px){
  .th-p-tailored-menswear .tailored-hero-board{grid-template-rows:auto minmax(375px,112vw) auto}
  .th-p-tailored-menswear .tailored-copy .ctas{display:grid;width:100%}
  .th-p-tailored-menswear .tailored-copy .btn{width:100%}
  .th-p-tailored-menswear .tailored-category-copy b{font-size:22px}
}
@media (prefers-reduced-motion:reduce){
  .th-p-tailored-menswear .tailored-hero-picture .hero-media{transform:none !important}
}
`;
