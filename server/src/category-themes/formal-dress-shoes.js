import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-formal-dress-shoes',
  name: 'The Evening Register',
  for: 'Formal dress shoes and occasion footwear',
  vibe: 'Lacquered oxblood, old-paper ivory, and the composed ceremony of a private shoe salon',
  category: 'Formal dress shoes',
  group: 'fashion',
  display: 'Bodoni Moda',
  body: 'Manrope',
  displayWeight: 600,
  tracking: '-.04em',
  colors: {
    bg: '#EEE9DC',
    surface: '#F8F5EE',
    ink: '#18251E',
    muted: '#657168',
    line: '#C6C7B8',
    accent: '#9A3B2D',
    onAccent: '#FFF9F2',
    panel: '#D9DDCE',
    onPanel: '#18251E',
    foot: '#18251E',
    onFoot: '#F4EEDF',
    bar: '#183F32',
    onBar: '#F6F2E9',
    badge: '#D9AF63',
    onBadge: '#18251E',
  },
  header: 'center',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'The formal register',
    collection: 'The entrance edit',
    cta: 'View the collection',
    title: 'Make an entrance in good form.',
    subtitle: 'A composed edit for the moments that call for ceremony.',
  },
});

export function hero(ctx) {
  const hasDetail = Boolean(ctx.pics[1]);
  const titleClass = ctx.head.length > 56 ? ' class="long"' : '';
  const detail = hasDetail
    ? `<figure class="fds-detail-frame">
        ${ctx.media(1, { lazy: true, decorative: true })}
        <figcaption>Second look</figcaption>
      </figure>`
    : `<aside class="fds-detail-empty" aria-hidden="true"><span></span><i></i></aside>`;

  return `<section class="hero category-hero fds-proscenium${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="fds-hero-topline">
      <p>${ctx.esc(ctx.eyebrow || 'The formal register')}</p>
      <span aria-hidden="true">01</span>
      <p>${ctx.esc(ctx.store.store_name)}</p>
    </div>
    <p class="fds-spine" aria-hidden="true">FORMAL / SHOES</p>
    <figure class="fds-hero-arch">
      ${ctx.media(0, { priority: true, lazy: false })}
      <figcaption><span>For the room ahead</span><i aria-hidden="true"></i></figcaption>
    </figure>
    <div class="fds-copy-sheet">
      <div class="txt fds-copy">
        ${ctx.eyebrow ? `<p class="eyebrow">${ctx.esc(ctx.eyebrow)}</p>` : ''}
        <h1${titleClass}>${ctx.esc(ctx.head)}</h1>
        ${ctx.sub ? `<p class="sub">${ctx.esc(ctx.sub)}</p>` : ''}
        <div class="ctas"><a class="btn" href="#shop">${ctx.esc(ctx.ctaLabel)}</a></div>
      </div>
      <p class="fds-copy-note">The details arrive before the introduction.</p>
    </div>
    <div class="fds-detail-slot">${detail}</div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const collection = ctx.t.copy?.collection || 'The entrance edit';

  if (ctx.cats.length >= 2) {
    const entries = ctx.cats.slice(0, 4).map((cat, index) => `<a class="fds-ledger-entry" href="${ctx.esc(ctx.categoryLink(cat.name))}">
      <span class="fds-ledger-number" aria-hidden="true">0${index + 1}</span>
      <span class="fds-ledger-photo">${cat.image ? `<img src="${ctx.esc(cat.image)}" alt="" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}</span>
      <span class="fds-ledger-name">${ctx.esc(cat.name)}</span>
      <span class="fds-ledger-count">${cat.count} ${cat.count === 1 ? 'piece' : 'pieces'}</span>
      <span class="fds-ledger-arrow" aria-hidden="true">↗</span>
    </a>`).join('');

    return `<section class="theme-discovery fds-ledger" aria-labelledby="fds-ledger-title">
      <header class="fds-ledger-intro">
        <p>${ctx.esc(collection)}</p>
        <h2 id="fds-ledger-title">Choose the line<br>you carry in.</h2>
        <a href="#shop">See all available pieces <span aria-hidden="true">→</span></a>
      </header>
      <div class="fds-ledger-list">${entries}</div>
    </section>`;
  }

  if (!ctx.products.length) return '';

  const pieces = ctx.products.slice(0, 3).map((product, index) => `<a class="fds-specimen" href="${ctx.esc(ctx.productLink(product))}">
    <span class="fds-specimen-number" aria-hidden="true">0${index + 1}</span>
    <span class="fds-specimen-media">${product.image_url ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title)}" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}</span>
    <span class="fds-specimen-copy"><b>${ctx.esc(product.title)}</b>${product.category ? `<small>${ctx.esc(product.category)}</small>` : ''}${product.price_cents != null ? `<em>${ctx.esc(ctx.money(product.price_cents, product.currency))}</em>` : ''}</span>
  </a>`).join('');

  return `<section class="theme-discovery fds-specimen-sheet" aria-labelledby="fds-specimen-title">
    <div class="fds-specimen-intro">
      <p>${ctx.esc(collection)}</p>
      <h2 id="fds-specimen-title">A closer<br>consideration.</h2>
      <a href="#shop">View all available pieces <span aria-hidden="true">→</span></a>
    </div>
    <div class="fds-specimen-list">${pieces}</div>
  </section>`;
}

export const css = `
.th-p-formal-dress-shoes{background:var(--bg);color:var(--ink)}
.th-p-formal-dress-shoes .hd{background:color-mix(in srgb,var(--bg) 94%,transparent);border-bottom-color:var(--line)}
.th-p-formal-dress-shoes .hd .wrap{min-height:72px;max-width:1540px;padding-inline:clamp(18px,3.8vw,64px)}
.th-p-formal-dress-shoes .brand{font-family:var(--display);font-size:calc(28px*var(--ts));font-weight:600;letter-spacing:.055em}
.th-p-formal-dress-shoes .nav{gap:clamp(14px,2.2vw,34px);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.th-p-formal-dress-shoes .nav a{background-size:0 1px;background-position:0 100%}
.th-p-formal-dress-shoes .nav a:hover,.th-p-formal-dress-shoes .nav a[aria-current]{background-size:100% 1px}
.th-p-formal-dress-shoes .cart{width:42px;height:42px;border:1px solid var(--ink);border-radius:50%;background:transparent}
.th-p-formal-dress-shoes .cart b{border-radius:50%;background:var(--accent);color:var(--on-accent)}

.th-p-formal-dress-shoes .fds-proscenium{display:grid;position:relative;grid-template-columns:minmax(34px,.17fr) minmax(0,1.1fr) minmax(160px,.54fr) minmax(0,.8fr) minmax(34px,.17fr);grid-template-rows:auto minmax(340px,1fr) auto;min-height:min(820px,calc(100svh - 74px));margin:clamp(12px,1.6vw,26px);overflow:hidden;border:1px solid var(--line);background:var(--surface);isolation:isolate}
.th-p-formal-dress-shoes .fds-proscenium::before{position:absolute;z-index:-1;top:calc(clamp(42px,5.7vw,84px) + 1px);bottom:0;left:clamp(34px,4.8vw,76px);width:1px;background:var(--line);content:""}
.th-p-formal-dress-shoes .fds-proscenium::after{position:absolute;z-index:-1;right:0;bottom:0;left:0;height:clamp(154px,21vh,210px);background:linear-gradient(90deg,#183f32 0%,#183f32 53%,#dce0d3 53%,#dce0d3 100%);content:""}
.th-p-formal-dress-shoes .fds-hero-topline{grid-column:1/-1;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;min-height:clamp(42px,5.7vw,84px);padding-inline:clamp(16px,3.5vw,56px);border-bottom:1px solid var(--line);font-size:10px;font-weight:700;letter-spacing:.15em;line-height:1.3;text-transform:uppercase}
.th-p-formal-dress-shoes .fds-hero-topline p{min-width:0;overflow-wrap:anywhere}
.th-p-formal-dress-shoes .fds-hero-topline p:last-child{text-align:right}
.th-p-formal-dress-shoes .fds-hero-topline span{color:var(--accent);font-family:var(--display);font-size:clamp(20px,2vw,30px);font-weight:600;letter-spacing:0}
.th-p-formal-dress-shoes .fds-spine{grid-column:1;grid-row:2;align-self:stretch;justify-self:stretch;display:flex;align-items:center;justify-content:center;min-width:0;padding:10px 0;color:var(--muted);font-size:9px;font-weight:700;letter-spacing:.18em;line-height:1.25;text-transform:uppercase;writing-mode:vertical-rl}
.th-p-formal-dress-shoes .fds-hero-arch{position:relative;grid-column:2/4;grid-row:2;align-self:end;min-width:0;height:min(62vh,600px);min-height:330px;overflow:hidden;border:1px solid color-mix(in srgb,var(--ink) 20%,transparent);border-bottom:0;border-radius:999px 999px 0 0;background:#315344}
.th-p-formal-dress-shoes .fds-hero-arch>.hero-media,.th-p-formal-dress-shoes .fds-hero-arch>.theme-empty-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.th-p-formal-dress-shoes .fds-hero-arch>.hero-media{object-position:center center;filter:saturate(.88) contrast(1.04)}
.th-p-formal-dress-shoes .fds-hero-arch>.theme-empty-media{min-height:100%;background:linear-gradient(145deg,#193a31,#a5ad98);color:#f8f5ee}
.th-p-formal-dress-shoes .fds-hero-arch::after{position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,28,23,.13),transparent 42%,rgba(12,28,23,.25));content:"";pointer-events:none}
.th-p-formal-dress-shoes .fds-hero-arch figcaption{position:absolute;z-index:1;right:clamp(18px,2.8vw,42px);bottom:clamp(18px,2.7vw,38px);display:flex;align-items:center;gap:10px;color:#fffaf1;font-size:10px;font-weight:700;letter-spacing:.14em;text-shadow:0 1px 10px rgba(8,18,14,.65);text-transform:uppercase}
.th-p-formal-dress-shoes .fds-hero-arch figcaption i{display:block;width:30px;height:1px;background:currentColor}
.th-p-formal-dress-shoes .fds-copy-sheet{z-index:1;grid-column:2/4;grid-row:3;display:grid;grid-template-columns:minmax(0,1fr) clamp(64px,12%,100px);gap:16px;min-width:0;padding:clamp(23px,3.4vw,48px) clamp(20px,3.8vw,58px) clamp(26px,3.8vw,52px);color:#f8f5ee}
.th-p-formal-dress-shoes .fds-copy{display:grid;justify-items:start;gap:clamp(9px,1.2vw,15px);min-width:0}
.th-p-formal-dress-shoes .fds-copy .eyebrow{font-size:10px;font-weight:700;letter-spacing:.16em;line-height:1.35;text-transform:uppercase;color:#d6e0d3}
.th-p-formal-dress-shoes .fds-copy h1{max-width:12ch;font-size:calc(clamp(45px,5.1vw,84px)*var(--hero));font-weight:600;letter-spacing:-.05em;line-height:.86;text-wrap:balance;overflow-wrap:anywhere}
.th-p-formal-dress-shoes .fds-copy h1.long{max-width:15ch;font-size:calc(clamp(33px,3.7vw,58px)*min(var(--hero),1.12));line-height:.94}
.th-p-formal-dress-shoes .fds-copy .sub{max-width:42ch;font-size:clamp(13px,1.05vw,16px);line-height:1.55;color:#e1e9df}
.th-p-formal-dress-shoes .fds-copy .ctas{margin-top:4px}
.th-p-formal-dress-shoes .fds-copy .btn{min-height:46px;padding-inline:20px;border:1px solid #f5efe3;border-radius:0;background:#f5efe3;color:#183f32;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
.th-p-formal-dress-shoes .fds-copy .btn:hover{border-color:#d9af63;background:#d9af63;color:#18251e}
.th-p-formal-dress-shoes .fds-copy-note{align-self:end;min-width:0;padding-bottom:2px;color:#d6e0d3;font-size:9px;font-weight:700;letter-spacing:.14em;line-height:1.55;text-transform:uppercase;writing-mode:vertical-rl}
.th-p-formal-dress-shoes .fds-detail-slot{z-index:1;grid-column:4/5;grid-row:2/4;align-self:end;justify-self:start;width:clamp(116px,14vw,220px);margin-bottom:clamp(22px,3.3vw,50px)}
.th-p-formal-dress-shoes .fds-detail-frame{position:relative;aspect-ratio:4/5;overflow:hidden;border:8px solid var(--surface);background:var(--panel);box-shadow:0 12px 32px rgba(19,37,30,.16);transform:rotate(3deg)}
.th-p-formal-dress-shoes .fds-detail-frame>.hero-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.7) contrast(1.05)}
.th-p-formal-dress-shoes .fds-detail-frame figcaption{position:absolute;right:8px;bottom:8px;left:8px;padding:7px;background:color-mix(in srgb,var(--surface) 88%,transparent);color:var(--ink);font-size:8px;font-weight:800;letter-spacing:.13em;text-align:center;text-transform:uppercase}
.th-p-formal-dress-shoes .fds-detail-empty{position:relative;display:grid;aspect-ratio:4/5;place-items:center;overflow:hidden;border:1px solid color-mix(in srgb,var(--ink) 36%,transparent);background:#dce0d3;transform:rotate(3deg)}
.th-p-formal-dress-shoes .fds-detail-empty::before{position:absolute;width:70%;height:88%;border:1px solid var(--accent);border-radius:999px 999px 0 0;content:""}
.th-p-formal-dress-shoes .fds-detail-empty span{position:relative;width:48%;height:18%;border:1px solid var(--ink);border-radius:999px 32px 26px 38px;transform:rotate(-11deg)}
.th-p-formal-dress-shoes .fds-detail-empty i{position:absolute;right:12%;bottom:14%;width:38%;height:1px;background:var(--accent);transform:rotate(-12deg)}
.th-p-formal-dress-shoes .fds-proscenium .motion-toggle{position:absolute;z-index:3;right:clamp(12px,1.7vw,26px);bottom:clamp(12px,1.7vw,26px);border:1px solid color-mix(in srgb,var(--ink) 34%,transparent);border-radius:0;background:color-mix(in srgb,var(--surface) 88%,transparent);color:var(--ink);font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}

.th-p-formal-dress-shoes .fds-ledger{display:grid;grid-template-columns:minmax(250px,.72fr) minmax(0,1.55fr);gap:0;max-width:1540px;margin:0 auto;padding:clamp(60px,9vw,140px) clamp(18px,4vw,64px) clamp(48px,7vw,108px)}
.th-p-formal-dress-shoes .fds-ledger-intro{display:grid;align-content:start;justify-items:start;gap:clamp(14px,1.6vw,24px);padding:clamp(24px,3.4vw,50px) clamp(24px,3.7vw,58px) 42px 0;border-top:1px solid var(--ink)}
.th-p-formal-dress-shoes .fds-ledger-intro>p,.th-p-formal-dress-shoes .fds-specimen-intro>p{color:var(--accent);font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.th-p-formal-dress-shoes .fds-ledger-intro h2,.th-p-formal-dress-shoes .fds-specimen-intro h2{max-width:10ch;font-size:calc(clamp(39px,4.1vw,68px)*var(--ts));font-weight:600;letter-spacing:-.05em;line-height:.89;overflow-wrap:anywhere}
.th-p-formal-dress-shoes .fds-ledger-intro a,.th-p-formal-dress-shoes .fds-specimen-intro a{display:inline-flex;align-items:center;gap:9px;min-height:44px;margin-top:4px;border-bottom:1px solid currentColor;color:var(--ink);font-size:11px;font-weight:800;letter-spacing:.1em;line-height:1.25;text-decoration:none;text-transform:uppercase}
.th-p-formal-dress-shoes .fds-ledger-intro a:hover,.th-p-formal-dress-shoes .fds-specimen-intro a:hover{color:var(--accent)}
.th-p-formal-dress-shoes .fds-ledger-intro a span,.th-p-formal-dress-shoes .fds-specimen-intro a span{font-size:16px;line-height:1}
.th-p-formal-dress-shoes .fds-ledger-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--ink);border-left:1px solid var(--ink)}
.th-p-formal-dress-shoes .fds-ledger-entry{display:grid;position:relative;grid-template-columns:auto minmax(70px,.74fr);grid-template-rows:auto auto 1fr;gap:5px 12px;min-width:0;min-height:255px;padding:clamp(16px,2vw,28px);border-right:1px solid var(--ink);border-bottom:1px solid var(--ink);background:var(--surface);color:var(--ink);text-decoration:none}
.th-p-formal-dress-shoes .fds-ledger-entry:nth-child(4n+2),.th-p-formal-dress-shoes .fds-ledger-entry:nth-child(4n+3){background:var(--panel)}
.th-p-formal-dress-shoes .fds-ledger-entry::after{position:absolute;right:0;bottom:0;left:0;height:5px;background:var(--accent);content:"";opacity:0}
.th-p-formal-dress-shoes .fds-ledger-entry:hover::after{opacity:1}
.th-p-formal-dress-shoes .fds-ledger-number{grid-column:1;grid-row:1;color:var(--accent);font-size:10px;font-weight:800;letter-spacing:.14em}
.th-p-formal-dress-shoes .fds-ledger-photo{grid-column:2;grid-row:1/4;position:relative;min-width:0;overflow:hidden;background:#b7c1b2}
.th-p-formal-dress-shoes .fds-ledger-photo img{width:100%;height:100%;object-fit:cover;filter:saturate(.72)}
.th-p-formal-dress-shoes .fds-ledger-photo i{position:absolute;top:22%;right:20%;bottom:0;left:20%;border:1px solid color-mix(in srgb,var(--ink) 65%,transparent);border-bottom:0;border-radius:999px 999px 0 0}
.th-p-formal-dress-shoes .fds-ledger-name{grid-column:1;grid-row:2;align-self:end;min-width:0;font-family:var(--display);font-size:clamp(24px,2.25vw,37px);font-weight:600;letter-spacing:-.04em;line-height:.9;overflow-wrap:anywhere}
.th-p-formal-dress-shoes .fds-ledger-count{grid-column:1;grid-row:3;align-self:end;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.11em;line-height:1.45;text-transform:uppercase}
.th-p-formal-dress-shoes .fds-ledger-arrow{position:absolute;bottom:clamp(16px,2vw,28px);left:clamp(16px,2vw,28px);color:var(--accent);font-size:22px;line-height:1}

.th-p-formal-dress-shoes .fds-specimen-sheet{display:grid;grid-template-columns:minmax(220px,.65fr) minmax(0,1.35fr);max-width:1540px;margin:0 auto;padding:clamp(60px,9vw,140px) clamp(18px,4vw,64px) clamp(48px,7vw,108px)}
.th-p-formal-dress-shoes .fds-specimen-intro{display:grid;align-content:start;justify-items:start;gap:clamp(14px,1.6vw,24px);padding:clamp(24px,3.4vw,50px) clamp(24px,3.7vw,58px) 42px 0;border-top:1px solid var(--ink)}
.th-p-formal-dress-shoes .fds-specimen-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(10px,1.4vw,20px);padding-top:clamp(24px,3.4vw,50px);border-top:1px solid var(--ink)}
.th-p-formal-dress-shoes .fds-specimen{display:grid;grid-template-rows:auto auto;gap:12px;position:relative;min-width:0;color:var(--ink);text-decoration:none}
.th-p-formal-dress-shoes .fds-specimen-number{position:absolute;z-index:1;top:10px;left:10px;padding:5px 6px;background:var(--surface);color:var(--accent);font-size:9px;font-weight:800;letter-spacing:.12em}
.th-p-formal-dress-shoes .fds-specimen-media{position:relative;display:grid;aspect-ratio:4/5;place-items:center;overflow:hidden;background:var(--panel)}
.th-p-formal-dress-shoes .fds-specimen-media img{width:100%;height:100%;object-fit:cover;filter:saturate(.8)}
.th-p-formal-dress-shoes .fds-specimen-media i{display:block;width:52%;height:18%;border:1px solid var(--muted);border-radius:999px 32px 26px 38px;transform:rotate(-12deg)}
.th-p-formal-dress-shoes .fds-specimen-copy{display:grid;gap:4px;min-width:0;padding-bottom:12px;border-bottom:1px solid var(--line)}
.th-p-formal-dress-shoes .fds-specimen-copy b{font-family:var(--display);font-size:clamp(20px,1.7vw,28px);font-weight:600;letter-spacing:-.035em;line-height:.98;overflow-wrap:anywhere}
.th-p-formal-dress-shoes .fds-specimen-copy small{color:var(--muted);font-size:11px;line-height:1.35;overflow-wrap:anywhere}
.th-p-formal-dress-shoes .fds-specimen-copy em{margin-top:2px;color:var(--accent);font-size:12px;font-style:normal;font-weight:800}

.th-p-formal-dress-shoes #shop.sec{max-width:1540px;margin:0 auto;padding:clamp(54px,8vw,112px) clamp(18px,4vw,64px) clamp(66px,8vw,120px);border-top:1px solid var(--line)}
.th-p-formal-dress-shoes #shop .sec-h{align-items:end;margin-bottom:clamp(24px,4vw,52px)}
.th-p-formal-dress-shoes #shop .sec-h h2{max-width:11ch;font-size:calc(clamp(40px,4.5vw,72px)*var(--ts));font-weight:600;letter-spacing:-.05em;line-height:.9}
.th-p-formal-dress-shoes .chips{gap:0;border:1px solid var(--ink);border-radius:0;overflow-x:auto;scrollbar-width:none}
.th-p-formal-dress-shoes .chip{min-height:44px;padding-inline:15px;border:0;border-right:1px solid var(--ink);border-radius:0;background:var(--surface);font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.th-p-formal-dress-shoes .chip:last-child{border-right:0}
.th-p-formal-dress-shoes .chip[aria-current]{background:var(--accent);color:var(--on-accent)}
.th-p-formal-dress-shoes .grid{gap:clamp(28px,4vw,62px) clamp(14px,2vw,30px)}
.th-p-formal-dress-shoes .pc{gap:13px;padding-top:11px;border-top:1px solid var(--ink);text-align:left}
.th-p-formal-dress-shoes .pc .im{border-radius:0;background:var(--panel)}
.th-p-formal-dress-shoes .pc .im img{filter:saturate(.84)}
.th-p-formal-dress-shoes .pc .tag{top:0;left:0;border-radius:0;background:var(--badge);color:var(--on-badge);font-size:9px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
.th-p-formal-dress-shoes .pc .bd{grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:start}
.th-p-formal-dress-shoes .pc h3{font-family:var(--display);font-size:calc(23px*var(--ts));font-weight:600;letter-spacing:-.035em;line-height:1}
.th-p-formal-dress-shoes .pc .pr{grid-column:2;grid-row:1;color:var(--accent);font-size:13px;font-weight:800}
.th-p-formal-dress-shoes .pc .rt{grid-column:1/-1;color:var(--muted)}
.th-p-formal-dress-shoes .pc .go{border-radius:0;background:var(--accent);color:var(--on-accent);font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.th-p-formal-dress-shoes .perks{background:var(--panel);border-color:var(--line)}
.th-p-formal-dress-shoes .perk svg{color:var(--accent)}
.th-p-formal-dress-shoes .ft{background:var(--foot);color:var(--on-foot)}

@media(max-width:1020px){
  .th-p-formal-dress-shoes .fds-proscenium{grid-template-columns:36px minmax(0,1.1fr) minmax(130px,.5fr) minmax(0,.75fr);min-height:720px}
  .th-p-formal-dress-shoes .fds-hero-arch{height:min(58vh,525px)}
  .th-p-formal-dress-shoes .fds-detail-slot{width:clamp(98px,15vw,150px)}
  .th-p-formal-dress-shoes .fds-ledger{grid-template-columns:minmax(210px,.62fr) minmax(0,1.38fr)}
  .th-p-formal-dress-shoes .fds-ledger-entry{min-height:225px;padding:18px}
}
@media(max-width:720px){
  .th-p-formal-dress-shoes .hd .wrap{min-height:64px;padding-inline:16px}
  .th-p-formal-dress-shoes .brand{font-size:23px}
  .th-p-formal-dress-shoes .fds-proscenium{display:grid;grid-template-columns:30px minmax(0,1fr);grid-template-rows:auto minmax(340px,92vw) auto auto;min-height:0;margin:0;border-inline:0}
  .th-p-formal-dress-shoes .fds-proscenium::before{top:55px;bottom:auto;left:30px;height:calc(100% - 55px)}
  .th-p-formal-dress-shoes .fds-proscenium::after{height:clamp(230px,66vw,300px);background:#183f32}
  .th-p-formal-dress-shoes .fds-hero-topline{grid-column:1/-1;grid-template-columns:minmax(0,1fr) auto;padding-inline:16px;min-height:55px;font-size:9px}
  .th-p-formal-dress-shoes .fds-hero-topline p:last-child{display:none}
  .th-p-formal-dress-shoes .fds-spine{grid-column:1;grid-row:2/5;font-size:8px}
  .th-p-formal-dress-shoes .fds-hero-arch{grid-column:2;grid-row:2;align-self:stretch;height:auto;min-height:0;margin-right:16px;border-radius:999px 999px 0 0}
  .th-p-formal-dress-shoes .fds-hero-arch figcaption{right:18px;bottom:18px;font-size:9px}
  .th-p-formal-dress-shoes .fds-copy-sheet{grid-column:2;grid-row:3;grid-template-columns:minmax(0,1fr) 48px;gap:12px;padding:34px 22px 40px 20px}
  .th-p-formal-dress-shoes .fds-copy h1{max-width:12ch;font-size:calc(clamp(45px,12.5vw,62px)*var(--hero))}
  .th-p-formal-dress-shoes .fds-copy h1.long{font-size:calc(clamp(33px,9vw,45px)*min(var(--hero),1.12))}
  .th-p-formal-dress-shoes .fds-copy .sub{font-size:14px}
  .th-p-formal-dress-shoes .fds-copy .ctas{width:100%}
  .th-p-formal-dress-shoes .fds-copy .btn{width:100%;min-height:46px;text-align:center}
  .th-p-formal-dress-shoes .fds-copy-note{font-size:8px}
  .th-p-formal-dress-shoes .fds-detail-slot{grid-column:2;grid-row:4;justify-self:end;align-self:start;width:112px;margin:-22px 22px 26px 0}
  .th-p-formal-dress-shoes .fds-detail-frame{border-width:6px}
  .th-p-formal-dress-shoes .fds-proscenium .motion-toggle{right:15px;bottom:15px}
  .th-p-formal-dress-shoes .fds-ledger,.th-p-formal-dress-shoes .fds-specimen-sheet{display:block;padding:58px 18px 64px}
  .th-p-formal-dress-shoes .fds-ledger-intro,.th-p-formal-dress-shoes .fds-specimen-intro{padding:25px 0 34px}
  .th-p-formal-dress-shoes .fds-ledger-intro h2,.th-p-formal-dress-shoes .fds-specimen-intro h2{font-size:calc(clamp(40px,11vw,56px)*var(--ts))}
  .th-p-formal-dress-shoes .fds-ledger-list{grid-template-columns:1fr;border-top:1px solid var(--ink)}
  .th-p-formal-dress-shoes .fds-ledger-entry{grid-template-columns:30px minmax(104px,.65fr) minmax(0,1fr);grid-template-rows:auto auto;min-height:135px;padding:12px;border-right:1px solid var(--ink)}
  .th-p-formal-dress-shoes .fds-ledger-entry:nth-child(4n+2),.th-p-formal-dress-shoes .fds-ledger-entry:nth-child(4n+3){background:var(--surface)}
  .th-p-formal-dress-shoes .fds-ledger-entry:nth-child(even){background:var(--panel)}
  .th-p-formal-dress-shoes .fds-ledger-number{grid-column:1;grid-row:1}
  .th-p-formal-dress-shoes .fds-ledger-photo{grid-column:2;grid-row:1/3}
  .th-p-formal-dress-shoes .fds-ledger-name{grid-column:3;grid-row:1;align-self:end;font-size:clamp(25px,7.5vw,34px)}
  .th-p-formal-dress-shoes .fds-ledger-count{grid-column:3;grid-row:2;align-self:start}
  .th-p-formal-dress-shoes .fds-ledger-arrow{right:14px;bottom:10px;left:auto}
  .th-p-formal-dress-shoes .fds-specimen-list{grid-template-columns:repeat(2,minmax(0,1fr));padding-top:20px}
  .th-p-formal-dress-shoes .fds-specimen:last-child{grid-column:1/-1;grid-template-columns:minmax(0,.74fr) minmax(0,1fr);align-items:end;gap:14px}
  .th-p-formal-dress-shoes .fds-specimen:last-child .fds-specimen-copy{padding-bottom:6px}
  .th-p-formal-dress-shoes #shop.sec{padding:58px 18px 74px}
  .th-p-formal-dress-shoes #shop .sec-h{align-items:start;gap:18px;margin-bottom:30px}
  .th-p-formal-dress-shoes #shop .sec-h h2{font-size:calc(clamp(40px,10vw,58px)*var(--ts))}
  .th-p-formal-dress-shoes .chips{width:100%}
  .th-p-formal-dress-shoes .chip{flex:1 0 auto}
  .th-p-formal-dress-shoes .pc h3{font-size:calc(20px*var(--ts))}
  .th-p-formal-dress-shoes .pc .bd{display:block}
  .th-p-formal-dress-shoes .pc .pr{display:block;margin-top:5px}
}
@media(max-width:390px){
  .th-p-formal-dress-shoes .fds-copy-sheet{grid-template-columns:1fr;padding-right:20px}
  .th-p-formal-dress-shoes .fds-copy-note{display:none}
  .th-p-formal-dress-shoes .fds-detail-slot{width:100px;margin-right:16px}
  .th-p-formal-dress-shoes .fds-ledger-entry{grid-template-columns:27px 90px minmax(0,1fr);min-height:126px}
  .th-p-formal-dress-shoes .fds-specimen:last-child{display:block}
  .th-p-formal-dress-shoes .fds-specimen:last-child .fds-specimen-copy{padding-top:12px;padding-bottom:12px}
}
`; 
