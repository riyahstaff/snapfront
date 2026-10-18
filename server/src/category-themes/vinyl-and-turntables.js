import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-vinyl-and-turntables',
  name: 'Needle / Room',
  for: 'Vinyl records, turntables, and listening-room pieces',
  vibe: 'Night-library listening room with paper labels, lacquer black, and amber walnut glow',
  category: 'Vinyl records and turntables',
  group: 'technology',
  display: 'Bodoni Moda',
  body: 'Space Grotesk',
  displayWeight: 600,
  tracking: '-.045em',
  colors: {
    bg: '#E9E0D1',
    surface: '#F6F0E6',
    ink: '#191714',
    muted: '#746D63',
    line: '#C9BDAA',
    accent: '#9E3C2D',
    onAccent: '#FFF8EF',
    panel: '#25201C',
    onPanel: '#F5EBD9',
    foot: '#171411',
    onFoot: '#EADFCC',
    bar: '#9E3C2D',
    onBar: '#FFF8EF',
    badge: '#D7A146',
    onBadge: '#191714',
  },
  header: 'stack',
  hero: 'editorial',
  card: 'bold',
  ratio: '4/5',
  rCard: 0,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'Side A · For the listening room',
    collection: 'The crate index',
    cta: 'Browse the shelf',
    title: 'The room begins at the needle.',
    subtitle: 'A considered edit for setting the record down and staying awhile.',
  },
});

const countLabel = (count) => `${Number(count) || 0} ${Number(count) === 1 ? 'piece' : 'pieces'}`;

function crateDivider(ctx, category, index) {
  const image = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : `<span class="vinyl-crate-fallback" aria-hidden="true"><i></i><i></i><i></i></span>`;
  return `<a class="vinyl-crate-divider" href="${ctx.categoryLink(category.name)}">
    <span class="vinyl-crate-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="vinyl-crate-media">${image}</span>
    <span class="vinyl-crate-copy"><strong>${ctx.esc(category.name)}</strong><small>${countLabel(category.count)}</small></span>
    <span class="vinyl-crate-arrow" aria-hidden="true">↗</span>
  </a>`;
}

function recordRow(ctx, product, index) {
  const photo = product.image_url
    ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">`
    : '<span class="vinyl-record-empty" aria-hidden="true"><i></i></span>';
  const price = Number.isFinite(Number(product.price_cents))
    ? `<small>${ctx.money(Number(product.price_cents), product.currency || 'usd', product?.billing_interval)}</small>`
    : '';
  const category = product.category ? `<em>${ctx.esc(product.category)}</em>` : '';
  return `<a class="vinyl-record-row" href="${ctx.productLink(product)}">
    <span class="vinyl-record-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="vinyl-record-cover">${photo}</span>
    <span class="vinyl-record-copy"><strong>${ctx.esc(product.title)}</strong>${category}${price}</span>
    <span class="vinyl-record-arrow" aria-hidden="true">→</span>
  </a>`;
}

export function hero(ctx) {
  return `<section class="hero category-hero vinyl-gatefold${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="vinyl-gatefold-frame">
      <div class="vinyl-spine" aria-hidden="true"><span>33</span><i></i><span>RPM</span></div>
      <div class="vinyl-hero-media">${ctx.media(0, { priority: true, lazy: false, decorative: true })}</div>
      <div class="vinyl-hero-shade" aria-hidden="true"></div>
      <div class="vinyl-record-orbit" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
      <div class="vinyl-copy-panel">${ctx.copy('vinyl-copy')}</div>
      <p class="vinyl-catalogue-mark" aria-hidden="true"><span>Needle room</span><b>Side A</b><span>Listen slowly</span></p>
      <div class="vinyl-motion-control">${ctx.controls}</div>
    </div>
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 4);
  const products = (ctx.products || []).filter((product) => product?.title).slice(0, 4);

  if (categories.length >= 2) {
    return `<section class="theme-discovery vinyl-crate-index" aria-labelledby="vinyl-index-title">
      <div class="vinyl-index-heading">
        <p class="eyebrow">${ctx.esc(ctx.t.copy?.collection || 'The crate index')}</p>
        <h2 id="vinyl-index-title">Pull a divider. Find your next side.</h2>
        <p>Browse the real shelves available from this collection.</p>
      </div>
      <div class="vinyl-divider-list">${categories.map((category, index) => crateDivider(ctx, category, index)).join('')}</div>
    </section>`;
  }

  if (products.length >= 2) {
    return `<section class="theme-discovery vinyl-crate-index vinyl-now-spinning" aria-labelledby="vinyl-index-title">
      <div class="vinyl-index-heading">
        <p class="eyebrow">${ctx.esc(ctx.t.copy?.collection || 'The crate index')}</p>
        <h2 id="vinyl-index-title">A few pieces from the shelf.</h2>
        <p>Choose from the pieces currently available in this collection.</p>
      </div>
      <div class="vinyl-record-list">${products.map((product, index) => recordRow(ctx, product, index)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-vinyl-and-turntables{background:var(--bg);color:var(--ink);}
.th-p-vinyl-and-turntables .site-header,.th-p-vinyl-and-turntables .store-header,.th-p-vinyl-and-turntables .hd{background:var(--bg);border-color:var(--line);box-shadow:none;}
.th-p-vinyl-and-turntables .hd .wrap{min-height:72px;}
.th-p-vinyl-and-turntables .hd .brand{font-family:var(--display);font-size:clamp(18px,1.7vw,25px);font-weight:var(--dw);letter-spacing:.025em;}
.th-p-vinyl-and-turntables .hd .nav a{font-family:var(--body);font-size:11px;letter-spacing:.11em;text-transform:uppercase;}
.th-p-vinyl-and-turntables .hd .cart{border:1px solid var(--ink);border-radius:999px;padding:8px 12px;}
.th-p-vinyl-and-turntables .vinyl-gatefold{padding:clamp(12px,2vw,30px);background:var(--bg);color:#FFF8ED;}
.th-p-vinyl-and-turntables .vinyl-gatefold-frame{position:relative;isolation:isolate;min-height:clamp(570px,57vw,780px);max-width:1680px;margin:0 auto;overflow:hidden;background:#211B17;box-shadow:0 22px 50px #4A39261C;}
.th-p-vinyl-and-turntables .vinyl-hero-media{position:absolute;inset:0;z-index:-4;overflow:hidden;background:radial-gradient(circle at 72% 42%,#BC7B3F 0 6%,#5A3323 31%,#1C1714 66%);}
.th-p-vinyl-and-turntables .vinyl-hero-media .hero-media{display:block;width:100%;height:100%;max-width:none;object-fit:cover;object-position:center;filter:saturate(.76) contrast(1.09) brightness(.77);}
.th-p-vinyl-and-turntables .vinyl-hero-media .theme-empty-media{width:100%;height:100%;min-height:0;background:radial-gradient(circle at 74% 47%,#B26A35 0 4%,#513222 25%,#1C1815 64%);color:#EBD9BF;}
.th-p-vinyl-and-turntables .vinyl-hero-shade{position:absolute;z-index:-3;inset:0;background:linear-gradient(90deg,#171310 0%,#171310F2 29%,#171310B8 47%,#17131042 70%,#17131020),linear-gradient(0deg,#130F0DF2 0%,transparent 44%,#130F0D58 100%);pointer-events:none;}
.th-p-vinyl-and-turntables .vinyl-spine{position:absolute;z-index:3;top:0;bottom:0;left:0;display:flex;width:clamp(42px,5vw,76px);flex-direction:column;align-items:center;justify-content:space-between;padding:clamp(18px,2vw,30px) 0;border-right:1px solid #F5E7D350;color:#F5E7D3;font:600 9px/1 var(--body);letter-spacing:.18em;}
.th-p-vinyl-and-turntables .vinyl-spine span:first-child{font-size:12px;}
.th-p-vinyl-and-turntables .vinyl-spine span:last-child{writing-mode:vertical-rl;transform:rotate(180deg);}
.th-p-vinyl-and-turntables .vinyl-spine i{width:1px;min-height:30%;background:linear-gradient(transparent,#E8D6BB,transparent);}
.th-p-vinyl-and-turntables .vinyl-record-orbit{position:absolute;z-index:-1;right:clamp(-300px,-18vw,-100px);top:50%;width:clamp(520px,66vw,990px);aspect-ratio:1;transform:translateY(-50%);border:1px solid #F5E8D322;border-radius:50%;box-shadow:inset 0 0 0 clamp(22px,3vw,48px) #14100E5C,inset 0 0 0 clamp(76px,9vw,135px) #E8D6B80E,0 0 0 clamp(22px,3vw,48px) #E8D6B80C;pointer-events:none;}
.th-p-vinyl-and-turntables .vinyl-record-orbit::before,.th-p-vinyl-and-turntables .vinyl-record-orbit::after{content:'';position:absolute;border:1px solid #F5E8D318;border-radius:50%;}
.th-p-vinyl-and-turntables .vinyl-record-orbit::before{inset:12%;}
.th-p-vinyl-and-turntables .vinyl-record-orbit::after{inset:26%;}
.th-p-vinyl-and-turntables .vinyl-record-orbit i{position:absolute;border:1px solid #F5E8D314;border-radius:50%;}
.th-p-vinyl-and-turntables .vinyl-record-orbit i:nth-child(1){inset:4%;}
.th-p-vinyl-and-turntables .vinyl-record-orbit i:nth-child(2){inset:39%;border-color:#B84433A8;background:#9E3C2D91;box-shadow:0 0 0 10px #E9DDCC2B;}
.th-p-vinyl-and-turntables .vinyl-record-orbit i:nth-child(3){inset:49%;border-color:#EADBC8A6;background:#201814;}
.th-p-vinyl-and-turntables .vinyl-record-orbit b{position:absolute;inset:50%;width:5px;height:5px;border-radius:50%;background:#EDDEC9;transform:translate(-50%,-50%);}
.th-p-vinyl-and-turntables .vinyl-copy-panel{position:relative;z-index:2;display:flex;min-height:inherit;align-items:center;width:min(100% - clamp(106px,13vw,206px),710px);margin-left:clamp(68px,9.5vw,150px);padding:clamp(72px,9vw,136px) 0 clamp(78px,9vw,140px);}
.th-p-vinyl-and-turntables .vinyl-copy{max-width:100%;}
.th-p-vinyl-and-turntables .vinyl-copy .eyebrow{display:flex;align-items:center;gap:11px;margin:0 0 18px;color:#E5BF88;font:600 10px/1.2 var(--body);letter-spacing:.21em;text-transform:uppercase;}
.th-p-vinyl-and-turntables .vinyl-copy .eyebrow::before{content:'';width:24px;height:1px;background:currentColor;}
.th-p-vinyl-and-turntables .vinyl-copy h1{max-width:10.5ch;margin:0;color:#FFF8ED;font:var(--dw) clamp(50px,6.8vw,104px)/.88 var(--display);letter-spacing:var(--dt);text-wrap:balance;text-shadow:0 3px 18px #100D0AA8;}
.th-p-vinyl-and-turntables .vinyl-copy h1.long{max-width:13.5ch;font-size:clamp(40px,5vw,74px);line-height:.94;}
.th-p-vinyl-and-turntables .vinyl-copy .sub{max-width:43ch;margin:25px 0 0;color:#F0E4D2;font:400 clamp(14px,1.2vw,18px)/1.55 var(--body);}
.th-p-vinyl-and-turntables .vinyl-copy .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:29px;}
.th-p-vinyl-and-turntables .vinyl-copy .btn{display:inline-flex;min-height:46px;align-items:center;justify-content:center;border:1px solid #F8EDDB;border-radius:999px;padding:0 20px;background:#F8EDDB;color:#211B17;font:600 11px/1 var(--body);letter-spacing:.07em;text-decoration:none;text-transform:uppercase;}
.th-p-vinyl-and-turntables .vinyl-copy .btn:hover{border-color:var(--accent);background:var(--accent);color:var(--on-accent);}
.th-p-vinyl-and-turntables .vinyl-copy .btn.ghost{border-color:#F8EDDB8A;background:#211B1766;color:#FFF8ED;}
.th-p-vinyl-and-turntables .vinyl-copy .btn.ghost:hover{border-color:#F8EDDB;background:#F8EDDB;color:#211B17;}
.th-p-vinyl-and-turntables .vinyl-catalogue-mark{position:absolute;z-index:2;right:clamp(24px,4vw,70px);bottom:clamp(24px,4vw,62px);display:grid;gap:4px;margin:0;color:#F7E9D5;font:500 9px/1.3 var(--body);letter-spacing:.16em;text-align:right;text-transform:uppercase;opacity:.88;}
.th-p-vinyl-and-turntables .vinyl-catalogue-mark b{color:#E7B37A;font:600 11px/1.2 var(--body);letter-spacing:.22em;}
.th-p-vinyl-and-turntables .vinyl-motion-control{position:absolute;z-index:4;right:clamp(20px,2.5vw,40px);top:clamp(20px,2.5vw,38px);}
.th-p-vinyl-and-turntables .vinyl-motion-control .motion-toggle{position:static;inset:auto;min-height:44px;border:1px solid #F5E7D38C;border-radius:999px;padding:0 13px;background:#17120FBB;color:#F7EAD6;font:600 9px/1 var(--body);letter-spacing:.12em;text-transform:uppercase;}
.th-p-vinyl-and-turntables .vinyl-motion-control .motion-toggle:hover{background:#F5E7D3;color:#201914;}
.th-p-vinyl-and-turntables .vinyl-gatefold.has-hero-motion[data-hero-motion="pan"] .vinyl-hero-media .hero-media{animation:vinyl-and-turntables-pan 18s ease-in-out infinite alternate;}
.th-p-vinyl-and-turntables .vinyl-gatefold.has-hero-motion[data-hero-motion="drift"] .vinyl-hero-media .hero-media{animation:vinyl-and-turntables-drift 15s ease-in-out infinite alternate;}
@keyframes vinyl-and-turntables-pan{from{transform:scale(1.03) translate3d(-1%,0,0);}to{transform:scale(1.1) translate3d(1.2%,-.5%,0);}}
@keyframes vinyl-and-turntables-drift{from{transform:scale(1.035) translate3d(-.55%,-.35%,0);}to{transform:scale(1.085) translate3d(.7%,.45%,0);}}
.th-p-vinyl-and-turntables .theme-discovery{max-width:1680px;margin:0 auto;padding:clamp(66px,8vw,128px) clamp(22px,7.5vw,128px);}
.th-p-vinyl-and-turntables .vinyl-crate-index{position:relative;background:linear-gradient(135deg,#E9E0D1 0%,#F6F0E6 68%,#E2D3C0 100%);}
.th-p-vinyl-and-turntables .vinyl-crate-index::before{content:'';position:absolute;top:0;left:clamp(22px,7.5vw,128px);right:clamp(22px,7.5vw,128px);height:5px;background:linear-gradient(90deg,var(--accent) 0 11%,var(--ink) 11% 30%,#D3A048 30% 45%,var(--line) 45% 100%);}
.th-p-vinyl-and-turntables .vinyl-index-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,30%);column-gap:clamp(32px,7vw,120px);align-items:end;margin-bottom:clamp(34px,5vw,70px);padding-top:clamp(10px,2vw,22px);}
.th-p-vinyl-and-turntables .vinyl-index-heading .eyebrow{grid-column:1/-1;margin:0 0 13px;color:var(--accent);font:700 10px/1.2 var(--body);letter-spacing:.2em;text-transform:uppercase;}
.th-p-vinyl-and-turntables .vinyl-index-heading h2{max-width:13ch;margin:0;color:var(--ink);font:var(--dw) clamp(39px,4.6vw,68px)/.96 var(--display);letter-spacing:var(--dt);text-wrap:balance;}
.th-p-vinyl-and-turntables .vinyl-index-heading>p:last-child{max-width:34ch;margin:0 0 4px;color:var(--muted);font:400 15px/1.55 var(--body);}
.th-p-vinyl-and-turntables .vinyl-divider-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--ink);background:var(--ink);gap:1px;}
.th-p-vinyl-and-turntables .vinyl-crate-divider{position:relative;display:flex;min-height:clamp(330px,32vw,490px);flex-direction:column;justify-content:flex-end;overflow:hidden;padding:clamp(17px,2vw,28px);background:#5B3E2A;color:#FFF8ED;text-decoration:none;isolation:isolate;}
.th-p-vinyl-and-turntables .vinyl-crate-media{position:absolute;z-index:-2;inset:0;overflow:hidden;background:linear-gradient(145deg,#3B2A20,#A06B42);}
.th-p-vinyl-and-turntables .vinyl-crate-media::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,#17110DEB 0%,#17110D35 61%,#17110D0D 100%);}
.th-p-vinyl-and-turntables .vinyl-crate-media img{display:block;width:100%;height:100%;object-fit:cover;filter:saturate(.68) contrast(1.05);}
.th-p-vinyl-and-turntables .vinyl-crate-divider:hover .vinyl-crate-media img{filter:saturate(.92) contrast(1.02);}
.th-p-vinyl-and-turntables .vinyl-crate-fallback{display:grid;width:100%;height:100%;place-items:center;background:radial-gradient(circle at center,#9E3C2D 0 8%,#D9C6AB 8.5% 10%,#2B211B 10.5% 35%,#5C3D29 35.5% 36%,#221914 37% 70%);}
.th-p-vinyl-and-turntables .vinyl-crate-fallback i{position:absolute;width:54%;aspect-ratio:1;border:1px solid #E9D9C344;border-radius:50%;}
.th-p-vinyl-and-turntables .vinyl-crate-fallback i:nth-child(1){transform:scale(.68);}
.th-p-vinyl-and-turntables .vinyl-crate-fallback i:nth-child(2){transform:scale(.84);}
.th-p-vinyl-and-turntables .vinyl-crate-fallback i:nth-child(3){transform:scale(1.02);}
.th-p-vinyl-and-turntables .vinyl-crate-number{position:absolute;top:18px;left:19px;color:#FFF4E2;font:600 10px/1 var(--body);letter-spacing:.15em;}
.th-p-vinyl-and-turntables .vinyl-crate-copy{position:relative;z-index:1;display:flex;max-width:88%;flex-direction:column;gap:6px;}
.th-p-vinyl-and-turntables .vinyl-crate-copy strong{overflow-wrap:anywhere;font:var(--dw) clamp(25px,2.45vw,38px)/.98 var(--display);letter-spacing:var(--dt);}
.th-p-vinyl-and-turntables .vinyl-crate-copy small{color:#E7D7C3;font:600 10px/1.2 var(--body);letter-spacing:.11em;text-transform:uppercase;}
.th-p-vinyl-and-turntables .vinyl-crate-arrow{position:absolute;right:18px;bottom:19px;z-index:1;display:grid;width:39px;height:39px;place-items:center;border:1px solid #FFF4E294;border-radius:50%;color:#FFF9F0;font:400 18px/1 var(--body);}
.th-p-vinyl-and-turntables .vinyl-crate-divider:hover .vinyl-crate-arrow{background:#FFF4E2;color:#271C15;}
.th-p-vinyl-and-turntables .vinyl-record-list{border-top:1px solid var(--ink);}
.th-p-vinyl-and-turntables .vinyl-record-row{display:grid;grid-template-columns:54px minmax(120px,200px) minmax(0,1fr) 52px;min-height:128px;align-items:center;gap:clamp(15px,2.5vw,42px);border-bottom:1px solid var(--ink);color:var(--ink);text-decoration:none;}
.th-p-vinyl-and-turntables .vinyl-record-index{align-self:stretch;display:grid;place-items:center;border-right:1px solid var(--ink);color:var(--accent);font:700 10px/1 var(--body);letter-spacing:.15em;}
.th-p-vinyl-and-turntables .vinyl-record-cover{align-self:stretch;position:relative;display:block;overflow:hidden;background:#C8AD8A;}
.th-p-vinyl-and-turntables .vinyl-record-cover img{display:block;width:100%;height:100%;object-fit:cover;}
.th-p-vinyl-and-turntables .vinyl-record-empty{display:grid;width:100%;height:100%;place-items:center;background:radial-gradient(circle,#A13D2E 0 11%,#E5D5BC 11.5% 14%,#2B211A 14.5% 43%,#BF9E76 43.5% 45%,#2B211A 45.5% 70%);}
.th-p-vinyl-and-turntables .vinyl-record-empty i{width:11px;height:11px;border:2px solid #EADBC8;border-radius:50%;}
.th-p-vinyl-and-turntables .vinyl-record-copy{display:flex;min-width:0;flex-direction:column;gap:5px;padding:18px 0;}
.th-p-vinyl-and-turntables .vinyl-record-copy strong{overflow-wrap:anywhere;font:var(--dw) clamp(24px,2.2vw,34px)/1 var(--display);letter-spacing:var(--dt);}
.th-p-vinyl-and-turntables .vinyl-record-copy em{color:var(--muted);font:600 10px/1.2 var(--body);letter-spacing:.12em;text-transform:uppercase;}
.th-p-vinyl-and-turntables .vinyl-record-copy small{color:var(--accent);font:700 13px/1.2 var(--body);}
.th-p-vinyl-and-turntables .vinyl-record-arrow{display:grid;width:44px;height:44px;place-items:center;color:var(--accent);font:400 24px/1 var(--body);}
.th-p-vinyl-and-turntables #shop{padding-top:clamp(58px,8vw,118px);background:linear-gradient(180deg,#25201C 0 118px,var(--bg) 118px);}
.th-p-vinyl-and-turntables #shop .sec-h{align-items:end;margin-bottom:clamp(26px,4vw,54px);}
.th-p-vinyl-and-turntables #shop .sec-h h2{color:#F8EEDC;font:var(--dw) clamp(39px,4.6vw,66px)/.92 var(--display);letter-spacing:var(--dt);}
.th-p-vinyl-and-turntables #shop .chips{justify-content:flex-end;}
.th-p-vinyl-and-turntables #shop .chip{min-height:44px;border:1px solid #F8EEDC88;border-radius:999px;background:transparent;color:#F8EEDC;font:600 11px/1 var(--body);letter-spacing:.04em;}
.th-p-vinyl-and-turntables #shop .chip.on,.th-p-vinyl-and-turntables #shop .chip:hover{border-color:#D7A146;background:#D7A146;color:#191714;}
.th-p-vinyl-and-turntables #shop .grid{gap:clamp(18px,2.4vw,34px) clamp(12px,1.8vw,24px);}
.th-p-vinyl-and-turntables #shop .pc{overflow:hidden;border:1px solid var(--line);border-radius:0;background:var(--surface);box-shadow:none;}
.th-p-vinyl-and-turntables #shop .pc:hover{box-shadow:7px 8px 0 #9E3C2D;}
.th-p-vinyl-and-turntables #shop .pc .im{position:relative;overflow:hidden;background:#D9C8B0;}
.th-p-vinyl-and-turntables #shop .pc .bd{display:grid;gap:8px;padding:17px 16px 19px;}
.th-p-vinyl-and-turntables #shop .pc h3{font:var(--dw) clamp(20px,1.9vw,29px)/1 var(--display);letter-spacing:var(--dt);}
.th-p-vinyl-and-turntables #shop .pc .pr{color:var(--accent);font:700 13px/1.2 var(--body);}
.th-p-vinyl-and-turntables #shop .pc .tag{border-radius:0;background:#25201C;color:#F8EEDC;font:700 9px/1 var(--body);letter-spacing:.09em;text-transform:uppercase;}
.th-p-vinyl-and-turntables #shop .pc .go{border-radius:50%;background:#F8EEDC;color:#25201C;}
.th-p-vinyl-and-turntables .ft{background:var(--foot);color:var(--on-foot);}
.th-p-vinyl-and-turntables :is(.vinyl-copy .btn,.vinyl-crate-divider,.vinyl-record-row):focus-visible{outline:3px solid var(--accent);outline-offset:3px;}
@media (max-width:980px){
  .th-p-vinyl-and-turntables .vinyl-gatefold-frame{min-height:650px;}
  .th-p-vinyl-and-turntables .vinyl-hero-shade{background:linear-gradient(90deg,#171310E8 0%,#171310C4 49%,#17131042 82%),linear-gradient(0deg,#130F0DDC 0%,transparent 46%);}
  .th-p-vinyl-and-turntables .vinyl-copy-panel{width:min(100% - 130px,620px);margin-left:clamp(66px,10vw,110px);}
  .th-p-vinyl-and-turntables .vinyl-record-orbit{right:-290px;width:760px;}
  .th-p-vinyl-and-turntables .vinyl-index-heading{grid-template-columns:1fr;gap:16px;}
  .th-p-vinyl-and-turntables .vinyl-divider-list{grid-template-columns:repeat(2,minmax(0,1fr));}
  .th-p-vinyl-and-turntables .vinyl-crate-divider{min-height:340px;}
  .th-p-vinyl-and-turntables #shop{background:linear-gradient(180deg,#25201C 0 95px,var(--bg) 95px);}
  .th-p-vinyl-and-turntables #shop .chips{justify-content:flex-start;}
}
@media (max-width:620px){
  .th-p-vinyl-and-turntables .hd .wrap{min-height:64px;}
  .th-p-vinyl-and-turntables .hd .brand{font-size:17px;}
  .th-p-vinyl-and-turntables .vinyl-gatefold{padding:0;}
  .th-p-vinyl-and-turntables .vinyl-gatefold-frame{min-height:630px;}
  .th-p-vinyl-and-turntables .vinyl-hero-media .hero-media{object-position:59% center;}
  .th-p-vinyl-and-turntables .vinyl-hero-shade{background:linear-gradient(0deg,#171310F2 0%,#171310AA 50%,#17131029 100%);}
  .th-p-vinyl-and-turntables .vinyl-spine{width:39px;padding:16px 0;border-right-color:#F5E7D342;}
  .th-p-vinyl-and-turntables .vinyl-spine span:first-child{font-size:10px;}
  .th-p-vinyl-and-turntables .vinyl-record-orbit{right:-174px;top:37%;width:530px;opacity:.78;}
  .th-p-vinyl-and-turntables .vinyl-copy-panel{width:calc(100% - 72px);align-items:flex-end;margin-left:52px;padding:86px 0 90px;}
  .th-p-vinyl-and-turntables .vinyl-copy h1,.th-p-vinyl-and-turntables .vinyl-copy h1.long{max-width:10.7ch;font-size:clamp(43px,12vw,61px);line-height:.91;}
  .th-p-vinyl-and-turntables .vinyl-copy .sub{max-width:34ch;margin-top:19px;font-size:14px;}
  .th-p-vinyl-and-turntables .vinyl-copy .ctas{width:100%;margin-top:24px;}
  .th-p-vinyl-and-turntables .vinyl-copy .btn{flex:1 1 155px;padding:0 13px;}
  .th-p-vinyl-and-turntables .vinyl-catalogue-mark{right:18px;bottom:20px;font-size:8px;}
  .th-p-vinyl-and-turntables .vinyl-catalogue-mark b{font-size:9px;}
  .th-p-vinyl-and-turntables .vinyl-motion-control{right:14px;top:14px;}
  .th-p-vinyl-and-turntables .vinyl-motion-control .motion-toggle{padding:0 10px;font-size:8px;}
  .th-p-vinyl-and-turntables .theme-discovery{padding:62px 18px;}
  .th-p-vinyl-and-turntables .vinyl-crate-index::before{left:18px;right:18px;}
  .th-p-vinyl-and-turntables .vinyl-index-heading h2{font-size:clamp(36px,10.5vw,49px);}
  .th-p-vinyl-and-turntables .vinyl-divider-list{grid-template-columns:1fr;}
  .th-p-vinyl-and-turntables .vinyl-crate-divider{min-height:255px;}
  .th-p-vinyl-and-turntables .vinyl-crate-copy strong{font-size:34px;}
  .th-p-vinyl-and-turntables .vinyl-record-row{grid-template-columns:38px 92px minmax(0,1fr) 32px;min-height:108px;gap:12px;}
  .th-p-vinyl-and-turntables .vinyl-record-copy{padding-block:13px;}
  .th-p-vinyl-and-turntables .vinyl-record-copy strong{font-size:24px;}
  .th-p-vinyl-and-turntables .vinyl-record-copy em{font-size:9px;}
  .th-p-vinyl-and-turntables .vinyl-record-arrow{width:32px;height:40px;font-size:20px;}
  .th-p-vinyl-and-turntables #shop{padding-top:62px;background:linear-gradient(180deg,#25201C 0 78px,var(--bg) 78px);}
  .th-p-vinyl-and-turntables #shop .sec-h{margin-bottom:28px;}
  .th-p-vinyl-and-turntables #shop .sec-h h2{font-size:43px;}
  .th-p-vinyl-and-turntables #shop .chips{gap:7px;}
  .th-p-vinyl-and-turntables #shop .chip{padding-inline:12px;}
  .th-p-vinyl-and-turntables #shop .pc .bd{padding:14px 12px 16px;}
}
@media (prefers-reduced-motion:reduce){
  .th-p-vinyl-and-turntables .vinyl-gatefold.has-hero-motion .vinyl-hero-media .hero-media{animation:none;transform:none;}
}
`;
