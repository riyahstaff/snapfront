import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-motorcycle-helmets',
  name: 'ORBIT / VISOR',
  for: 'Motorcycle helmets and riding headwear',
  vibe: 'A quiet industrial helmet observatory: smoked visors, warm alloy, and graphic orbital lines.',
  category: 'Motorcycle helmets',
  group: 'outdoor',
  display: 'Sora',
  body: 'DM Sans',
  displayWeight: 700,
  tracking: '-.055em',
  colors: {
    bg: '#E8E1D5',
    surface: '#F5F0E8',
    ink: '#171816',
    muted: '#6D6B64',
    line: '#BBB3A7',
    accent: '#D96A38',
    onAccent: '#FFF9F0',
    panel: '#20231F',
    onPanel: '#F4EEE3',
    foot: '#151714',
    onFoot: '#EEE7DA',
    bar: '#20231F',
    onBar: '#F7F1E7',
    badge: '#D96A38',
    onBadge: '#FFF9F0',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'boxed',
  ratio: '4/5',
  rCard: 0,
  rBtn: 999,
  motion: 'still',
  copy: {
    eyebrow: 'The visor archive',
    collection: 'Choose a point of view',
    cta: 'Enter the collection',
    title: 'A clear view of the ride.',
    subtitle: 'Helmets held in form, light, and motion.',
  },
});

const productImage = (ctx, product) => product?.image_url
  ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || product.title || '')}" loading="lazy" decoding="async">`
  : '<span class="helmet-empty-product" aria-hidden="true"><i></i></span>';

export function hero(ctx) {
  const shopName = ctx.store?.store_name || 'Helmet collection';

  return `<section class="hero category-hero helmet-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="helmet-hero-stage">
      <div class="helmet-hero-spine" aria-hidden="true">
        <span>01</span><i></i><b>VISOR<br>ARCHIVE</b>
      </div>
      <div class="helmet-portal">
        ${ctx.media(0, { priority: true, lazy: false })}
        <span class="helmet-portal-rim helmet-portal-rim-one" aria-hidden="true"></span>
        <span class="helmet-portal-rim helmet-portal-rim-two" aria-hidden="true"></span>
        <span class="helmet-portal-glint" aria-hidden="true"></span>
      </div>
      <div class="helmet-hero-copy">${ctx.copy('helmet-copy')}</div>
      <aside class="helmet-side-note" aria-label="Collection note">
        <span class="helmet-side-dot" aria-hidden="true"></span>
        <p>Current<br>collection</p>
        <strong>${ctx.esc(shopName)}</strong>
      </aside>
      <div class="helmet-route-line" aria-hidden="true"><i></i><span></span><b></b></div>
      ${ctx.controls}
    </div>
  </section>`;
}

export function discovery(ctx) {
  const categories = Array.isArray(ctx.cats) ? ctx.cats.filter((category) => category?.name).slice(0, 3) : [];
  const products = Array.isArray(ctx.products) ? ctx.products.slice(0, 3) : [];

  if (categories.length >= 2) {
    const entries = categories.map((category, index) => {
      const count = Number(category.count) || 0;
      const countLabel = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
      const image = category.image
        ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
        : '<i class="helmet-collection-empty" aria-hidden="true"></i>';

      return `<a class="helmet-collection" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <span class="helmet-collection-index" aria-hidden="true">0${index + 1}</span>
        <span class="helmet-collection-media">${image}</span>
        <span class="helmet-collection-copy"><b>${ctx.esc(category.name)}</b><small>${ctx.esc(countLabel)}</small></span>
        <span class="helmet-collection-arrow" aria-hidden="true">↗</span>
      </a>`;
    }).join('');

    return `<section class="theme-discovery helmet-discovery" aria-labelledby="helmet-discovery-title">
      <header class="helmet-discovery-intro">
        <p>FIELD OF VIEW / LIVE EDIT</p>
        <h2 id="helmet-discovery-title">${ctx.esc(ctx.t.copy?.collection || 'Choose a point of view')}</h2>
        <a href="#shop">See every helmet <span aria-hidden="true">↓</span></a>
      </header>
      <div class="helmet-collections">${entries}</div>
    </section>`;
  }

  if (!products.length) return '';

  const entries = products.map((product, index) => {
    const price = product?.price_cents != null ? ctx.money(product.price_cents, product.currency, product?.billing_interval) : '';
    const category = product?.category ? `<small>${ctx.esc(product.category)}</small>` : '';
    const pricing = price ? `<em>${ctx.esc(price)}</em>` : '';

    return `<a class="helmet-specimen" href="${ctx.esc(ctx.productLink(product))}">
      <span class="helmet-specimen-number" aria-hidden="true">0${index + 1}</span>
      <span class="helmet-specimen-media">${productImage(ctx, product)}</span>
      <span class="helmet-specimen-copy"><b>${ctx.esc(product?.title || 'Untitled product')}</b>${category}${pricing}</span>
      <span class="helmet-specimen-arrow" aria-hidden="true">↗</span>
    </a>`;
  }).join('');

  return `<section class="theme-discovery helmet-discovery helmet-discovery-specimens" aria-labelledby="helmet-specimens-title">
    <header class="helmet-discovery-intro">
      <p>FIELD OF VIEW / LIVE EDIT</p>
      <h2 id="helmet-specimens-title">Start at the visor.</h2>
      <a href="#shop">See every helmet <span aria-hidden="true">↓</span></a>
    </header>
    <div class="helmet-specimens">${entries}</div>
  </section>`;
}

export const css = `
.th-p-motorcycle-helmets{
  --helmet-ink:#171816;
  --helmet-coal:#20231F;
  --helmet-bone:#E8E1D5;
  --helmet-paper:#F5F0E8;
  --helmet-orange:#D96A38;
  background:var(--bg);
  color:var(--ink);
}
.th-p-motorcycle-helmets .site-header,
.th-p-motorcycle-helmets .store-header,
.th-p-motorcycle-helmets .hd{
  border-bottom:1px solid color-mix(in srgb,var(--line) 82%,transparent);
  background:var(--bar);
  color:var(--onBar);
}
.th-p-motorcycle-helmets .hd .brand,
.th-p-motorcycle-helmets .site-header .brand,
.th-p-motorcycle-helmets .store-header .brand{
  font-family:var(--display);
  font-weight:700;
  letter-spacing:.1em;
}
.th-p-motorcycle-helmets .hd .nav a,
.th-p-motorcycle-helmets .hd .cart{
  color:var(--onBar);
  font-family:var(--body);
  font-size:11px;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
}
.th-p-motorcycle-helmets .hd .nav a:hover,
.th-p-motorcycle-helmets .hd .cart:hover{color:var(--helmet-orange)}
.th-p-motorcycle-helmets .helmet-hero{
  margin:0;
  overflow:hidden;
  background:var(--helmet-bone);
  color:var(--helmet-ink);
}
.th-p-motorcycle-helmets .helmet-hero-stage{
  position:relative;
  isolation:isolate;
  display:grid;
  grid-template-columns:minmax(115px,.36fr) minmax(370px,1.18fr) minmax(180px,.46fr);
  grid-template-rows:minmax(124px,.52fr) minmax(325px,1.18fr) minmax(126px,.42fr);
  min-height:clamp(620px,53vw,790px);
  max-width:1540px;
  margin:0 auto;
  padding:clamp(22px,3vw,48px) clamp(18px,4.6vw,74px);
}
.th-p-motorcycle-helmets .helmet-hero-stage::before{
  position:absolute;
  z-index:-3;
  inset:0;
  content:'';
  background:linear-gradient(90deg,transparent 0 15.7%,#1718161c 15.75% 15.82%,transparent 15.87% 81%,#1718161c 81.05% 81.12%,transparent 81.17%),radial-gradient(circle at 14% 80%,#d96a3826 0 2px,transparent 2.5px),radial-gradient(circle at 82% 17%,#d96a3826 0 2px,transparent 2.5px);
  background-size:auto,76px 76px,92px 92px;
  pointer-events:none;
}
.th-p-motorcycle-helmets .helmet-hero-spine{
  z-index:2;
  grid-column:1;
  grid-row:1 / -1;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:13px;
  padding-top:clamp(6px,1.2vw,17px);
  color:var(--helmet-coal);
}
.th-p-motorcycle-helmets .helmet-hero-spine span{
  display:grid;
  width:31px;
  height:31px;
  place-items:center;
  border:1px solid currentColor;
  border-radius:50%;
  color:var(--helmet-orange);
  font:700 10px/1 var(--body);
}
.th-p-motorcycle-helmets .helmet-hero-spine i{
  width:1px;
  flex:1;
  min-height:128px;
  margin-left:15px;
  background:currentColor;
  opacity:.55;
}
.th-p-motorcycle-helmets .helmet-hero-spine b{
  max-width:7ch;
  margin:0;
  font:700 9px/1.45 var(--body);
  letter-spacing:.19em;
}
.th-p-motorcycle-helmets .helmet-portal{
  position:relative;
  z-index:0;
  grid-column:2 / 4;
  grid-row:1 / 3;
  min-width:0;
  min-height:0;
  overflow:hidden;
  border-radius:48% 48% 3% 3% / 32% 32% 4% 4%;
  background:#5F655F;
}
.th-p-motorcycle-helmets .helmet-portal::after{
  position:absolute;
  z-index:1;
  inset:0;
  content:'';
  background:linear-gradient(180deg,#10120f08 20%,#10120f66 100%),linear-gradient(90deg,#17181622 0%,transparent 42%);
  pointer-events:none;
}
.th-p-motorcycle-helmets .helmet-portal .hero-media,
.th-p-motorcycle-helmets .helmet-portal .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
  min-height:0;
  object-fit:cover;
  object-position:center;
}
.th-p-motorcycle-helmets .helmet-portal .theme-empty-media{
  display:grid;
  place-items:center;
  background:radial-gradient(ellipse at 66% 42%,#a79d8d 0 15%,#272b28 15.4% 27%,transparent 27.4%),linear-gradient(135deg,#9A9488 0%,#444941 47%,#171a17 100%);
  color:#F5F0E8;
}
.th-p-motorcycle-helmets .helmet-portal .theme-empty-media span{
  max-width:10ch;
  font:700 clamp(28px,3.6vw,55px)/.93 var(--display);
  letter-spacing:var(--tracking);
  text-align:center;
  text-transform:uppercase;
}
.th-p-motorcycle-helmets .helmet-portal-rim{
  position:absolute;
  z-index:2;
  border:1px solid #F5F0E866;
  border-radius:50%;
  pointer-events:none;
}
.th-p-motorcycle-helmets .helmet-portal-rim-one{width:59%;height:77%;right:-16%;top:-15%;transform:rotate(-27deg)}
.th-p-motorcycle-helmets .helmet-portal-rim-two{width:34%;height:39%;left:5%;bottom:-17%;border-color:#F5F0E840;transform:rotate(34deg)}
.th-p-motorcycle-helmets .helmet-portal-glint{
  position:absolute;
  z-index:2;
  right:20%;
  top:11%;
  width:12px;
  height:12px;
  border:1px solid #FFF8EC;
  border-radius:50%;
  box-shadow:0 0 0 6px #FFF8EC22;
}
.th-p-motorcycle-helmets .helmet-hero-copy{
  position:relative;
  z-index:3;
  grid-column:1 / 3;
  grid-row:2 / 4;
  align-self:end;
  width:min(100%,650px);
  padding:clamp(24px,3.4vw,52px) clamp(23px,3.4vw,54px) clamp(26px,3.7vw,56px);
  background:var(--helmet-coal);
  color:var(--helmet-paper);
  box-shadow:18px 18px 0 #D96A38;
}
.th-p-motorcycle-helmets .helmet-copy .eyebrow{
  display:flex;
  align-items:center;
  gap:10px;
  margin:0 0 18px;
  color:#F1A17D;
  font:700 10px/1.2 var(--body);
  letter-spacing:.2em;
  text-transform:uppercase;
}
.th-p-motorcycle-helmets .helmet-copy .eyebrow::before{
  width:25px;
  height:1px;
  content:'';
  background:currentColor;
}
.th-p-motorcycle-helmets .helmet-copy h1{
  max-width:11ch;
  margin:0;
  color:#F8F1E5;
  font:700 clamp(48px,6.3vw,100px)/.84 var(--display);
  letter-spacing:var(--tracking);
  overflow-wrap:anywhere;
  text-wrap:balance;
}
.th-p-motorcycle-helmets .helmet-copy h1.long{
  max-width:14ch;
  font-size:clamp(39px,4.7vw,73px);
  line-height:.91;
}
.th-p-motorcycle-helmets .helmet-copy .sub{
  max-width:39ch;
  margin:24px 0 0;
  color:#E2D9CC;
  font:500 clamp(13px,1.15vw,16px)/1.55 var(--body);
  overflow-wrap:anywhere;
}
.th-p-motorcycle-helmets .helmet-copy .ctas{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:26px;
}
.th-p-motorcycle-helmets .helmet-copy .btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:48px;
  padding:0 21px;
  border:1px solid var(--helmet-orange);
  border-radius:999px;
  background:var(--helmet-orange);
  color:#FFF9F0;
  font:700 11px/1 var(--body);
  letter-spacing:.1em;
  text-decoration:none;
  text-transform:uppercase;
  transition:background-color .18s ease,color .18s ease,border-color .18s ease;
}
.th-p-motorcycle-helmets .helmet-copy .btn:hover{border-color:#F5F0E8;background:#F5F0E8;color:var(--helmet-coal)}
.th-p-motorcycle-helmets .helmet-copy .btn.ghost{border-color:#F5F0E899;background:transparent;color:#F5F0E8}
.th-p-motorcycle-helmets .helmet-copy .btn.ghost:hover{border-color:#F5F0E8;background:#F5F0E8;color:var(--helmet-coal)}
.th-p-motorcycle-helmets .helmet-side-note{
  z-index:3;
  grid-column:3;
  grid-row:3;
  align-self:end;
  justify-self:end;
  display:grid;
  grid-template-columns:14px minmax(0,1fr);
  column-gap:9px;
  width:min(100%,165px);
  padding:15px 0 0 12px;
  border-top:1px solid var(--helmet-coal);
  color:var(--helmet-coal);
}
.th-p-motorcycle-helmets .helmet-side-dot{
  grid-row:1 / span 2;
  width:7px;
  height:7px;
  margin-top:3px;
  border-radius:50%;
  background:var(--helmet-orange);
}
.th-p-motorcycle-helmets .helmet-side-note p,
.th-p-motorcycle-helmets .helmet-side-note strong{margin:0;overflow-wrap:anywhere}
.th-p-motorcycle-helmets .helmet-side-note p{font:700 9px/1.45 var(--body);letter-spacing:.15em;text-transform:uppercase}
.th-p-motorcycle-helmets .helmet-side-note strong{grid-column:2;margin-top:8px;font:700 14px/1.05 var(--display);letter-spacing:-.035em}
.th-p-motorcycle-helmets .helmet-route-line{
  position:absolute;
  z-index:2;
  right:clamp(19px,4.6vw,74px);
  top:clamp(33px,5.5vw,82px);
  display:flex;
  align-items:center;
  gap:8px;
  color:#F5F0E8;
}
.th-p-motorcycle-helmets .helmet-route-line i{width:44px;height:1px;background:currentColor}
.th-p-motorcycle-helmets .helmet-route-line span{width:8px;height:8px;border:1px solid currentColor;border-radius:50%}
.th-p-motorcycle-helmets .helmet-route-line b{font:700 9px/1 var(--body);letter-spacing:.16em}
.th-p-motorcycle-helmets .helmet-hero .motion-toggle{
  position:absolute;
  z-index:5;
  right:clamp(18px,4.6vw,74px);
  bottom:clamp(18px,3vw,48px);
  min-height:44px;
  padding:0 13px;
  border:1px solid var(--helmet-coal);
  border-radius:999px;
  background:#E8E1D5d9;
  color:var(--helmet-coal);
  font:700 9px/1 var(--body);
  letter-spacing:.12em;
  text-transform:uppercase;
}
.th-p-motorcycle-helmets .helmet-discovery{
  display:grid;
  grid-template-columns:minmax(250px,.8fr) minmax(0,1.55fr);
  gap:clamp(32px,6vw,108px);
  align-items:start;
  max-width:1540px;
  margin:0 auto;
  padding:clamp(66px,8vw,126px) clamp(20px,4.6vw,74px) clamp(56px,7vw,108px);
  background:var(--helmet-paper);
  color:var(--helmet-ink);
}
.th-p-motorcycle-helmets .helmet-discovery-intro{position:sticky;top:25px}
.th-p-motorcycle-helmets .helmet-discovery-intro p{
  display:flex;
  align-items:center;
  gap:10px;
  margin:0 0 16px;
  color:var(--helmet-orange);
  font:700 10px/1.25 var(--body);
  letter-spacing:.19em;
}
.th-p-motorcycle-helmets .helmet-discovery-intro p::before{width:22px;height:1px;content:'';background:currentColor}
.th-p-motorcycle-helmets .helmet-discovery-intro h2{
  max-width:9ch;
  margin:0;
  font:700 clamp(43px,5vw,80px)/.87 var(--display);
  letter-spacing:var(--tracking);
  overflow-wrap:anywhere;
  text-wrap:balance;
}
.th-p-motorcycle-helmets .helmet-discovery-intro a{
  display:inline-flex;
  align-items:center;
  gap:12px;
  min-height:44px;
  margin-top:28px;
  color:var(--helmet-ink);
  font:700 11px/1 var(--body);
  letter-spacing:.08em;
  text-decoration:none;
  text-transform:uppercase;
}
.th-p-motorcycle-helmets .helmet-discovery-intro a span{color:var(--helmet-orange);font-size:18px;line-height:1}
.th-p-motorcycle-helmets .helmet-discovery-intro a:hover{color:var(--helmet-orange)}
.th-p-motorcycle-helmets .helmet-collections,
.th-p-motorcycle-helmets .helmet-specimens{border-top:1px solid var(--helmet-ink)}
.th-p-motorcycle-helmets .helmet-collection{
  position:relative;
  display:grid;
  grid-template-columns:36px minmax(138px,.68fr) minmax(0,1fr) 38px;
  gap:clamp(14px,2vw,30px);
  align-items:center;
  min-height:178px;
  padding:18px 0;
  border-bottom:1px solid var(--line);
  color:var(--helmet-ink);
  text-decoration:none;
}
.th-p-motorcycle-helmets .helmet-collection-index,
.th-p-motorcycle-helmets .helmet-specimen-number{align-self:start;padding-top:4px;color:var(--helmet-orange);font:700 10px/1 var(--body);letter-spacing:.16em}
.th-p-motorcycle-helmets .helmet-collection-media{
  position:relative;
  display:block;
  height:140px;
  overflow:hidden;
  border-radius:50% 50% 5px 5px / 35% 35% 4px 4px;
  background:#DDD5C8;
}
.th-p-motorcycle-helmets .helmet-collection-media img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  transition:transform .35s ease;
}
.th-p-motorcycle-helmets .helmet-collection:hover .helmet-collection-media img{transform:scale(1.055)}
.th-p-motorcycle-helmets .helmet-collection-empty{
  position:absolute;
  inset:21%;
  display:block;
  border:1px solid #565A54;
  border-radius:48% 48% 38% 42%;
  transform:rotate(-17deg);
}
.th-p-motorcycle-helmets .helmet-collection-empty::after{position:absolute;left:12%;right:12%;top:42%;height:1px;content:'';background:#565A54}
.th-p-motorcycle-helmets .helmet-collection-copy{display:grid;gap:8px;min-width:0}
.th-p-motorcycle-helmets .helmet-collection-copy b{
  max-width:12ch;
  font:700 clamp(26px,2.6vw,42px)/.9 var(--display);
  letter-spacing:var(--tracking);
  overflow-wrap:anywhere;
}
.th-p-motorcycle-helmets .helmet-collection-copy small{color:var(--muted);font:700 10px/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase}
.th-p-motorcycle-helmets .helmet-collection-arrow,
.th-p-motorcycle-helmets .helmet-specimen-arrow{
  display:grid;
  width:38px;
  height:38px;
  place-items:center;
  border:1px solid var(--helmet-ink);
  border-radius:50%;
  font:400 22px/1 var(--display);
  transition:background-color .18s ease,color .18s ease,transform .18s ease;
}
.th-p-motorcycle-helmets .helmet-collection:hover .helmet-collection-arrow,
.th-p-motorcycle-helmets .helmet-specimen:hover .helmet-specimen-arrow{transform:rotate(45deg);background:var(--helmet-orange);border-color:var(--helmet-orange);color:#FFF9F0}
.th-p-motorcycle-helmets .helmet-discovery-specimens{grid-template-columns:minmax(250px,.8fr) minmax(0,1.55fr)}
.th-p-motorcycle-helmets .helmet-specimen{
  display:grid;
  grid-template-columns:34px minmax(110px,.62fr) minmax(0,1fr) 38px;
  gap:clamp(12px,1.8vw,24px);
  align-items:center;
  min-height:164px;
  padding:17px 0;
  border-bottom:1px solid var(--line);
  color:var(--helmet-ink);
  text-decoration:none;
}
.th-p-motorcycle-helmets .helmet-specimen-media{
  position:relative;
  display:block;
  height:128px;
  overflow:hidden;
  border-radius:50% 50% 5px 5px / 35% 35% 4px 4px;
  background:#DDD5C8;
}
.th-p-motorcycle-helmets .helmet-specimen-media img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
.th-p-motorcycle-helmets .helmet-specimen:hover .helmet-specimen-media img{transform:scale(1.055)}
.th-p-motorcycle-helmets .helmet-empty-product{position:absolute;inset:0;display:grid;place-items:center;background:radial-gradient(ellipse at 57% 48%,#656B63 0 21%,#D2CABD 21.5% 44%,transparent 44.5%)}
.th-p-motorcycle-helmets .helmet-empty-product i{width:52%;height:53%;border:1px solid #555950;border-radius:49% 49% 41% 44%;transform:rotate(-18deg)}
.th-p-motorcycle-helmets .helmet-specimen-copy{display:grid;gap:6px;min-width:0}
.th-p-motorcycle-helmets .helmet-specimen-copy b{font:700 clamp(24px,2.4vw,38px)/.92 var(--display);letter-spacing:var(--tracking);overflow-wrap:anywhere}
.th-p-motorcycle-helmets .helmet-specimen-copy small{color:var(--muted);font:700 10px/1.2 var(--body);letter-spacing:.13em;text-transform:uppercase;overflow-wrap:anywhere}
.th-p-motorcycle-helmets .helmet-specimen-copy em{color:var(--helmet-orange);font:700 12px/1.2 var(--body);font-style:normal;letter-spacing:.05em}
.th-p-motorcycle-helmets .shop-section,
.th-p-motorcycle-helmets #shop,
.th-p-motorcycle-helmets .sec{background:var(--bg);color:var(--ink)}
.th-p-motorcycle-helmets .shop-section .section-heading,
.th-p-motorcycle-helmets #shop .section-heading,
.th-p-motorcycle-helmets .sec .sec-h{border-top:1px solid var(--line)}
.th-p-motorcycle-helmets .shop-section h2,
.th-p-motorcycle-helmets #shop h2,
.th-p-motorcycle-helmets .sec .sec-h h2{font-family:var(--display);font-weight:700;letter-spacing:var(--tracking)}
.th-p-motorcycle-helmets .chips .chip{min-height:44px;border-radius:999px;font:700 10px/1 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-motorcycle-helmets .chips .chip[aria-current]{background:var(--helmet-coal);border-color:var(--helmet-coal);color:var(--helmet-paper)}
.th-p-motorcycle-helmets .grid .pc,
.th-p-motorcycle-helmets .product-card{border-radius:0;background:var(--surface);box-shadow:none}
.th-p-motorcycle-helmets .grid .pc .im,
.th-p-motorcycle-helmets .product-card .product-image{border-radius:0;background:#DDD5C8}
.th-p-motorcycle-helmets .grid .pc h3,
.th-p-motorcycle-helmets .product-card h3{font-family:var(--display);font-weight:700;letter-spacing:-.035em}
.th-p-motorcycle-helmets .grid .pc .go{border-radius:50%;background:var(--helmet-orange);color:#FFF9F0}
.th-p-motorcycle-helmets .ft{background:var(--helmet-coal);color:var(--helmet-paper)}
.th-p-motorcycle-helmets .ft a,
.th-p-motorcycle-helmets .ft h4{color:var(--helmet-paper)}
@media (max-width:900px){
  .th-p-motorcycle-helmets .helmet-hero-stage{grid-template-columns:78px minmax(300px,1fr) 130px;grid-template-rows:116px minmax(325px,1fr) 118px;padding-inline:28px}
  .th-p-motorcycle-helmets .helmet-portal{grid-column:2 / 4}
  .th-p-motorcycle-helmets .helmet-hero-copy{width:min(100%,590px)}
  .th-p-motorcycle-helmets .helmet-discovery{gap:42px;grid-template-columns:minmax(205px,.7fr) minmax(0,1.3fr);padding-inline:28px}
  .th-p-motorcycle-helmets .helmet-collection{grid-template-columns:29px minmax(108px,.62fr) minmax(0,1fr) 38px}
}
@media (max-width:640px){
  .th-p-motorcycle-helmets .helmet-hero-stage{display:grid;grid-template-columns:1fr;grid-template-rows:auto minmax(340px,103vw) auto auto;min-height:0;padding:0 20px 24px}
  .th-p-motorcycle-helmets .helmet-hero-stage::before{background:linear-gradient(90deg,transparent 0 10%,#1718161c 10.1% 10.25%,transparent 10.35% 89.6%,#1718161c 89.7% 89.85%,transparent 89.95%)}
  .th-p-motorcycle-helmets .helmet-hero-spine{grid-column:1;grid-row:1;display:grid;grid-template-columns:31px 1fr auto;align-items:center;gap:11px;min-height:56px;padding:0;color:var(--helmet-coal)}
  .th-p-motorcycle-helmets .helmet-hero-spine i{width:auto;min-width:0;min-height:1px;height:1px;margin:0;background:currentColor}
  .th-p-motorcycle-helmets .helmet-hero-spine b{max-width:none;font-size:8px;line-height:1.2;text-align:right}
  .th-p-motorcycle-helmets .helmet-portal{grid-column:1;grid-row:2;min-height:0;border-radius:50% 50% 4% 4% / 25% 25% 3% 3%}
  .th-p-motorcycle-helmets .helmet-portal .hero-media{object-position:58% center}
  .th-p-motorcycle-helmets .helmet-hero-copy{grid-column:1;grid-row:3;align-self:start;width:calc(100% - 16px);margin-top:-46px;padding:25px 23px 28px;box-shadow:12px 12px 0 var(--helmet-orange)}
  .th-p-motorcycle-helmets .helmet-copy .eyebrow{margin-bottom:14px;font-size:9px}
  .th-p-motorcycle-helmets .helmet-copy h1,.th-p-motorcycle-helmets .helmet-copy h1.long{max-width:11ch;font-size:clamp(43px,13vw,64px);line-height:.88}
  .th-p-motorcycle-helmets .helmet-copy .sub{margin-top:17px;font-size:13px}
  .th-p-motorcycle-helmets .helmet-copy .ctas{margin-top:21px}
  .th-p-motorcycle-helmets .helmet-copy .btn{flex:1 1 145px;min-height:48px;padding-inline:14px}
  .th-p-motorcycle-helmets .helmet-side-note{grid-column:1;grid-row:4;justify-self:start;grid-template-columns:14px auto 1fr;width:100%;margin-top:27px;padding:13px 0 0;border-top-color:var(--line)}
  .th-p-motorcycle-helmets .helmet-side-note p{grid-column:2;white-space:nowrap}
  .th-p-motorcycle-helmets .helmet-side-note strong{grid-column:3;margin:0;font-size:14px;text-align:right}
  .th-p-motorcycle-helmets .helmet-route-line{right:34px;top:74px}
  .th-p-motorcycle-helmets .helmet-route-line b{display:none}
  .th-p-motorcycle-helmets .helmet-hero .motion-toggle{right:28px;bottom:33px;background:#E8E1D5e8}
  .th-p-motorcycle-helmets .helmet-discovery{display:block;padding:52px 20px 61px}
  .th-p-motorcycle-helmets .helmet-discovery-intro{position:static;margin-bottom:33px}
  .th-p-motorcycle-helmets .helmet-discovery-intro h2{max-width:10ch;font-size:clamp(43px,13vw,61px)}
  .th-p-motorcycle-helmets .helmet-discovery-intro a{margin-top:20px}
  .th-p-motorcycle-helmets .helmet-collection{grid-template-columns:25px minmax(87px,.6fr) minmax(0,1fr) 32px;gap:12px;min-height:133px;padding:12px 0}
  .th-p-motorcycle-helmets .helmet-collection-media{height:108px}
  .th-p-motorcycle-helmets .helmet-collection-copy b{font-size:clamp(23px,7.4vw,31px)}
  .th-p-motorcycle-helmets .helmet-collection-copy small{font-size:9px;letter-spacing:.1em}
  .th-p-motorcycle-helmets .helmet-collection-arrow,.th-p-motorcycle-helmets .helmet-specimen-arrow{width:32px;height:32px;font-size:18px}
  .th-p-motorcycle-helmets .helmet-specimen{grid-template-columns:25px minmax(83px,.54fr) minmax(0,1fr) 32px;gap:11px;min-height:133px;padding:12px 0}
  .th-p-motorcycle-helmets .helmet-specimen-media{height:107px}
  .th-p-motorcycle-helmets .helmet-specimen-copy b{font-size:clamp(22px,7vw,30px)}
}
@media (max-width:390px){
  .th-p-motorcycle-helmets .helmet-hero-stage{padding-inline:16px}
  .th-p-motorcycle-helmets .helmet-copy h1,.th-p-motorcycle-helmets .helmet-copy h1.long{font-size:clamp(39px,12.7vw,53px)}
  .th-p-motorcycle-helmets .helmet-copy .ctas{display:grid}
  .th-p-motorcycle-helmets .helmet-copy .btn{width:100%}
  .th-p-motorcycle-helmets .helmet-collection{grid-template-columns:20px 78px minmax(0,1fr) 30px;gap:9px}
  .th-p-motorcycle-helmets .helmet-collection-media{height:96px}
  .th-p-motorcycle-helmets .helmet-specimen{grid-template-columns:20px 76px minmax(0,1fr) 30px;gap:9px}
  .th-p-motorcycle-helmets .helmet-specimen-media{height:96px}
}
@media (prefers-reduced-motion:reduce){
  .th-p-motorcycle-helmets .helmet-copy .btn,
  .th-p-motorcycle-helmets .helmet-collection-media img,
  .th-p-motorcycle-helmets .helmet-specimen-media img,
  .th-p-motorcycle-helmets .helmet-collection-arrow,
  .th-p-motorcycle-helmets .helmet-specimen-arrow{transition:none}
}
`;
