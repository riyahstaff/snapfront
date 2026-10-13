import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-jewelry',
  name: 'AURE / VALE',
  for: 'Fine-jewelry collections',
  vibe: 'Candlelit atelier, quiet gold, and cinematic portraiture',
  category: 'Fine jewelry',
  group: 'fashion',
  display: 'Cormorant Garamond',
  body: 'DM Sans',
  displayWeight: 500,
  tracking: '-.045em',
  colors: {
    bg: '#F7F2E9',
    surface: '#EAE0D1',
    ink: '#211B19',
    muted: '#766A61',
    line: '#CFC1AF',
    accent: '#9A6C2F',
    onAccent: '#FFF8EF',
    panel: '#2B2421',
    onPanel: '#F8F0E4',
    foot: '#211B19',
    onFoot: '#F4EADD',
    bar: '#7D562B',
    onBar: '#FFF8EF',
    badge: '#E8C878',
    onBadge: '#211B19',
  },
  header: 'center',
  hero: 'editorial',
  card: 'minimal',
  ratio: '3/4',
  rCard: 0,
  rBtn: 0,
  motion: 'pan',
  copy: {
    eyebrow: 'The atelier edit',
    collection: 'Find your signature.',
    cta: 'Explore the collection',
    title: 'Light, held in gold.',
    subtitle: 'A considered study in warm metal and quiet stones.',
  },
});

export function hero(ctx) {
  const heading = String(ctx.head || '');
  const eyebrow = ctx.eyebrow
    ? `<p class="jewelry-atelier">${ctx.esc(ctx.eyebrow)}</p>`
    : '';
  const sub = ctx.sub
    ? `<p class="jewelry-sub">${ctx.esc(ctx.sub)}</p>`
    : '';
  const longClass = heading.length > 56 ? ' long' : '';

  return `<section class="hero category-hero p-jewelry jewelry-hero${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="jewelry-stage">
      <div class="jewelry-photo">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
        ${eyebrow}
      </div>
      <div class="jewelry-copy">
        <h1 class="jewelry-title${longClass}">${ctx.esc(heading)}</h1>
        ${sub}
        ${ctx.ctas}
      </div>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const products = Array.isArray(ctx.products) ? ctx.products : [];
  if (!products.length) return '';

  const categories = (Array.isArray(ctx.cats) ? ctx.cats : [])
    .filter((category) => category?.name)
    .slice(0, 3);
  const title = ctx.esc(ctx.t.copy?.collection || 'Explore the collection');

  if (categories.length >= 2) {
    const orbits = categories.map((category) => {
      const count = Number(category.count);
      const countLabel = Number.isFinite(count) && count >= 0
        ? `<span class="jewelry-orbit-count">${count} ${count === 1 ? 'piece' : 'pieces'}</span>`
        : '';
      const media = category.image
        ? `<img src="${ctx.esc(category.image)}" alt="${ctx.esc(category.name)}" loading="lazy" decoding="async">`
        : `<div class="theme-empty-media" aria-hidden="true"><span>${ctx.esc(category.name)}</span></div>`;
      return `<a class="jewelry-orbit" href="${ctx.esc(ctx.categoryLink(category.name))}">
        <span class="jewelry-orbit-photo">${media}</span>
        <span class="jewelry-orbit-name">${ctx.esc(category.name)}</span>
        ${countLabel}
      </a>`;
    }).join('');

    return `<section class="theme-discovery jewelry-discovery" aria-label="Shop by collection">
      <div class="jewelry-discovery-inner">
        <header class="jewelry-discovery-heading">
          <p class="jewelry-discovery-kicker">Collections in focus</p>
          <h2>${title}</h2>
        </header>
        <div class="jewelry-orbits">${orbits}</div>
      </div>
    </section>`;
  }

  return `<section class="theme-discovery jewelry-discovery jewelry-discovery-fallback" aria-label="Featured pieces">
    <div class="jewelry-discovery-inner">
      <header class="jewelry-discovery-heading">
        <p class="jewelry-discovery-kicker">The current edit</p>
        <h2>${title}</h2>
      </header>
      <div class="jewelry-product-notes">${products.slice(0, 3).map(ctx.productCard).join('')}</div>
    </div>
  </section>`;
}

export const css = `
.th-p-jewelry .hd{
  background:color-mix(in srgb,var(--bg) 92%,transparent);
  border-bottom-color:color-mix(in srgb,var(--line) 82%,transparent);
}
.th-p-jewelry .brand{
  font-size:calc(27px * var(--ts));
  letter-spacing:clamp(.07em,.45vw,.13em);
}
.th-p-jewelry .nav{
  font-size:13px;
  letter-spacing:.055em;
}
.th-p-jewelry .jewelry-hero{
  isolation:isolate;
  overflow:hidden;
  padding:clamp(18px,2.4vw,34px) clamp(10px,1vw,18px) clamp(38px,5vw,78px);
  background:var(--bg);
}
.th-p-jewelry .jewelry-stage{
  position:relative;
  max-width:1680px;
  margin-inline:auto;
}
.th-p-jewelry .jewelry-photo{
  position:relative;
  min-height:clamp(340px,34vw,560px);
  aspect-ratio:5.15 / 1;
  overflow:hidden;
  background:var(--panel);
  isolation:isolate;
}
.th-p-jewelry .jewelry-photo::after{
  position:absolute;
  inset:0;
  z-index:1;
  content:"";
  pointer-events:none;
  background:linear-gradient(90deg,rgba(24,19,17,.22),transparent 48%),linear-gradient(0deg,rgba(21,17,15,.22),transparent 44%);
}
.th-p-jewelry .jewelry-photo .hero-media{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:68% 44%;
}
.th-p-jewelry .jewelry-photo .theme-empty-media{
  width:100%;
  height:100%;
  min-height:0;
  color:var(--on-panel);
  background:radial-gradient(circle at 72% 30%,#6C553C 0,transparent 26%),linear-gradient(115deg,#191615,#413329);
}
.th-p-jewelry .jewelry-atelier{
  position:absolute;
  z-index:2;
  left:clamp(18px,2.1vw,38px);
  bottom:clamp(16px,2vw,32px);
  max-width:min(28ch,52%);
  color:#F9EEDB;
  font-size:10px;
  font-weight:700;
  letter-spacing:.2em;
  line-height:1.45;
  text-transform:uppercase;
  text-shadow:0 1px 14px rgba(0,0,0,.55);
}
.th-p-jewelry .jewelry-copy{
  position:relative;
  z-index:2;
  display:grid;
  justify-items:center;
  gap:clamp(13px,1.5vw,20px);
  width:min(100%,1120px);
  margin:-clamp(46px,5.3vw,90px) auto 0;
  padding-inline:clamp(10px,2vw,32px);
  text-align:center;
}
.th-p-jewelry .jewelry-copy .jewelry-title{
  max-width:15ch;
  color:var(--accent);
  font-size:calc(clamp(64px,8.4vw,148px) * var(--hero));
  font-weight:500;
  letter-spacing:calc(var(--dt) - .018em);
  line-height:.76;
  text-shadow:0 1px 0 rgba(255,248,239,.56);
}
.th-p-jewelry .jewelry-copy .jewelry-title.long{
  max-width:19ch;
  font-size:calc(clamp(42px,5.3vw,86px) * min(var(--hero),1.15));
  line-height:.88;
}
.th-p-jewelry .jewelry-sub{
  max-width:56ch;
  color:var(--muted);
  font-size:clamp(14px,1.15vw,17px);
  line-height:1.55;
  white-space:pre-line;
}
.th-p-jewelry .jewelry-copy .ctas{
  justify-content:center;
  gap:10px;
  margin-top:clamp(3px,.7vw,10px);
}
.th-p-jewelry .jewelry-copy .btn{
  min-height:48px;
  padding-inline:25px;
  border-color:var(--accent);
  background:var(--accent);
  box-shadow:none;
  font-size:11px;
  font-weight:700;
  letter-spacing:.13em;
  text-transform:uppercase;
}
.th-p-jewelry .jewelry-copy .btn.ghost{
  background:transparent;
  color:var(--ink);
  border-color:color-mix(in srgb,var(--ink) 42%,transparent);
}
.th-p-jewelry .jewelry-hero .motion-toggle{
  top:clamp(18px,2vw,30px);
  right:auto;
  bottom:auto;
  left:clamp(20px,2.5vw,42px);
  color:#F9EEDB;
  border-color:rgba(249,238,219,.5);
  background:rgba(25,20,18,.4);
}
.th-p-jewelry .jewelry-discovery{
  padding:clamp(12px,2.5vw,36px) clamp(16px,4vw,48px) clamp(62px,8vw,124px);
  background:var(--bg);
}
.th-p-jewelry .jewelry-discovery-inner{
  width:min(100%,1110px);
  margin-inline:auto;
}
.th-p-jewelry .jewelry-discovery-heading{
  display:grid;
  justify-items:center;
  gap:8px;
  margin-bottom:clamp(28px,3vw,44px);
  text-align:center;
}
.th-p-jewelry .jewelry-discovery-kicker{
  color:var(--accent);
  font-size:10px;
  font-weight:700;
  letter-spacing:.19em;
  line-height:1.35;
  text-transform:uppercase;
}
.th-p-jewelry .jewelry-discovery h2{
  max-width:20ch;
  color:var(--ink);
  font-size:calc(clamp(34px,3.6vw,58px) * var(--ts));
  font-weight:500;
  line-height:.92;
}
.th-p-jewelry .jewelry-orbits{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(22px,5vw,80px);
  align-items:start;
  justify-items:center;
}
.th-p-jewelry .jewelry-orbit{
  display:grid;
  justify-items:center;
  gap:9px;
  min-width:0;
  min-height:44px;
  color:var(--ink);
  text-align:center;
  text-decoration:none;
}
.th-p-jewelry .jewelry-orbit-photo{
  position:relative;
  display:block;
  width:min(100%,218px);
  aspect-ratio:1;
  overflow:hidden;
  border-radius:50%;
  background:var(--surface);
  box-shadow:0 0 0 1px var(--line),0 12px 34px -28px rgba(33,27,25,.7);
}
.th-p-jewelry .jewelry-orbit-photo img{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  transition:transform .35s ease;
}
.th-p-jewelry .jewelry-orbit:hover .jewelry-orbit-photo img{
  transform:scale(1.045);
}
.th-p-jewelry .jewelry-orbit-photo .theme-empty-media{
  width:100%;
  height:100%;
  min-height:0;
  padding:18px;
  color:var(--muted);
  background:linear-gradient(145deg,#EFE6D9,#D7C5AE);
  font-size:clamp(16px,1.7vw,22px);
}
.th-p-jewelry .jewelry-orbit-name{
  max-width:18ch;
  font-family:var(--display);
  font-size:calc(20px * var(--ts));
  font-weight:500;
  letter-spacing:var(--dt);
  line-height:1.1;
  overflow-wrap:anywhere;
}
.th-p-jewelry .jewelry-orbit-count{
  color:var(--muted);
  font-size:10px;
  font-weight:700;
  letter-spacing:.15em;
  line-height:1.3;
  text-transform:uppercase;
}
.th-p-jewelry .jewelry-product-notes{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(14px,2.4vw,32px);
}
.th-p-jewelry .jewelry-product-notes .pc{
  gap:11px;
}
.th-p-jewelry .jewelry-product-notes .pc .im{
  border:1px solid var(--line);
  background:var(--surface);
}
.th-p-jewelry .jewelry-product-notes .pc h3{
  font-family:var(--display);
  font-size:calc(20px * var(--ts));
  font-weight:500;
  letter-spacing:var(--dt);
}
.th-p-jewelry .jewelry-product-notes .pc .pr{
  color:var(--muted);
  font-weight:500;
}
@media (max-width:720px){
  .th-p-jewelry .brand{font-size:calc(23px * var(--ts));letter-spacing:.07em}
  .th-p-jewelry .jewelry-hero{padding:0 0 42px}
  .th-p-jewelry .jewelry-stage{width:100%}
  .th-p-jewelry .jewelry-photo{min-height:0;aspect-ratio:4 / 5}
  .th-p-jewelry .jewelry-photo .hero-media{object-position:65% 42%}
  .th-p-jewelry .jewelry-atelier{bottom:18px;left:18px;max-width:30ch;font-size:9px}
  .th-p-jewelry .jewelry-copy{gap:15px;margin-top:-42px;padding-inline:20px}
  .th-p-jewelry .jewelry-copy .jewelry-title{max-width:11.5ch;font-size:calc(clamp(48px,15.4vw,72px) * var(--hero));line-height:.79}
  .th-p-jewelry .jewelry-copy .jewelry-title.long{max-width:14ch;font-size:calc(clamp(35px,10.8vw,51px) * min(var(--hero),1.15));line-height:.88}
  .th-p-jewelry .jewelry-sub{max-width:32ch;font-size:14px}
  .th-p-jewelry .jewelry-copy .ctas{width:100%}
  .th-p-jewelry .jewelry-copy .btn{flex:1 1 170px;min-height:48px;padding-inline:18px}
  .th-p-jewelry .jewelry-hero .motion-toggle{top:16px;left:16px}
  .th-p-jewelry .jewelry-discovery{padding:10px 20px 68px}
  .th-p-jewelry .jewelry-discovery-heading{margin-bottom:27px}
  .th-p-jewelry .jewelry-orbits{grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 18px}
  .th-p-jewelry .jewelry-orbit-photo{width:min(100%,156px)}
  .th-p-jewelry .jewelry-orbit-name{font-size:calc(18px * var(--ts))}
  .th-p-jewelry .jewelry-product-notes{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 14px}
}
@media (max-width:390px){
  .th-p-jewelry .jewelry-copy{padding-inline:16px}
  .th-p-jewelry .jewelry-copy .jewelry-title{font-size:calc(45px * var(--hero))}
  .th-p-jewelry .jewelry-copy .jewelry-title.long{font-size:calc(32px * min(var(--hero),1.15))}
  .th-p-jewelry .jewelry-orbits{gap:24px 12px}
  .th-p-jewelry .jewelry-orbit-photo{width:min(100%,138px)}
}
`;
