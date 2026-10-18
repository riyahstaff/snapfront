import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-yoga-equipment',
  name: 'Liminal Practice',
  for: 'Yoga practice equipment',
  vibe: 'Sunlit movement atelier, warm mineral surfaces, cork, olive, and an unhurried daily ritual',
  category: 'Yoga equipment',
  group: 'lifestyle',
  display: 'Marcellus',
  body: 'Manrope',
  displayWeight: 400,
  tracking: '-.035em',
  colors: {
    bg: '#F3EBDD',
    surface: '#FBF7F0',
    ink: '#28372E',
    muted: '#6D776D',
    line: '#D8CDBC',
    accent: '#A34E35',
    onAccent: '#FFF9F0',
    panel: '#DCE0CB',
    onPanel: '#28372E',
    foot: '#28372E',
    onFoot: '#F5EEDF',
    bar: '#F3EBDD',
    onBar: '#28372E',
    badge: '#D5A567',
    onBadge: '#28372E',
  },
  header: 'stack',
  hero: 'spotlight',
  card: 'pastel',
  ratio: '4/5',
  rCard: 20,
  rBtn: 999,
  motion: 'drift',
  copy: {
    eyebrow: 'Tools for an unhurried practice',
    collection: 'Begin where you are',
    cta: 'Explore the collection',
    title: 'Make room to return.',
    subtitle: 'Considered yoga essentials for the rhythm that is yours.',
  },
});

const countLabel = (count) => `${count} ${count === 1 ? 'item' : 'items'}`;

const categoryTile = (ctx, category, index) => {
  const count = Number(category.count) || 0;
  const media = category.image
    ? `<img src="${ctx.esc(category.image)}" alt="" loading="lazy" decoding="async">`
    : '<span class="yoga-category-empty" aria-hidden="true"><i></i><i></i></span>';
  return `<a class="yoga-category-tile" href="${ctx.esc(ctx.categoryLink(category.name))}">
    <span class="yoga-tile-count" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <span class="yoga-category-media">${media}</span>
    <span class="yoga-tile-copy"><small>${ctx.esc(countLabel(count))}</small><strong>${ctx.esc(category.name)}</strong><em>View collection <i aria-hidden="true">→</i></em></span>
  </a>`;
};

const productTile = (ctx, product, index) => {
  const title = product.title || 'Untitled product';
  const price = Number.isFinite(Number(product.price_cents))
    ? ctx.money(Number(product.price_cents), product.currency || 'usd', product?.billing_interval)
    : '';
  const media = product.image_url
    ? `<img src="${ctx.esc(product.image_url)}" alt="${ctx.esc(product.alt_text || title)}" loading="lazy" decoding="async">`
    : '<span class="yoga-product-empty" aria-hidden="true"><i></i></span>';
  return `<a class="yoga-product-tile" href="${ctx.esc(ctx.productLink(product))}">
    <span class="yoga-product-media">${media}</span>
    <span class="yoga-product-copy"><span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><strong>${ctx.esc(title)}</strong>${product.category ? `<em>${ctx.esc(product.category)}</em>` : ''}${price ? `<small>${ctx.esc(price)}</small>` : ''}</span>
    <b aria-hidden="true">↗</b>
  </a>`;
};

export function hero(ctx) {
  return `<section class="hero category-hero yoga-orbit${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="yoga-orbit-field" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="yoga-hero-aperture">${ctx.media(0, { priority: true, lazy: false })}</div>
    <p class="yoga-hero-axis" aria-hidden="true"><span>GROUND</span><i></i><span>GATHER</span></p>
    <div class="yoga-hero-copy-stage">${ctx.copy('yoga-hero-copy')}</div>
    <p class="yoga-hero-mark" aria-hidden="true">PRACTICE<br>IN MOTION</p>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = (ctx.cats || []).filter((category) => category?.name).slice(0, 4);
  const products = (ctx.products || []).filter((product) => product?.title).slice(0, 4);

  if (categories.length >= 2) {
    return `<section class="theme-discovery yoga-paths" aria-labelledby="yoga-paths-title">
      <div class="yoga-paths-head">
        <p class="yoga-section-kicker">${ctx.esc(ctx.t.copy?.collection || 'Begin where you are')}</p>
        <span class="yoga-breath-glyph" aria-hidden="true"><i></i><i></i><i></i></span>
        <h2 id="yoga-paths-title">Gather your practice, one piece at a time.</h2>
        <p>Explore the current collection by category.</p>
      </div>
      <div class="yoga-category-path">${categories.map((category, index) => categoryTile(ctx, category, index)).join('')}</div>
    </section>`;
  }

  if (products.length) {
    return `<section class="theme-discovery yoga-paths yoga-product-paths" aria-labelledby="yoga-paths-title">
      <div class="yoga-paths-head">
        <p class="yoga-section-kicker">CURRENT SELECTION</p>
        <span class="yoga-breath-glyph" aria-hidden="true"><i></i><i></i><i></i></span>
        <h2 id="yoga-paths-title">A few pieces for the practice ahead.</h2>
        <p>Explore what is currently available.</p>
      </div>
      <div class="yoga-product-path">${products.map((product, index) => productTile(ctx, product, index)).join('')}</div>
    </section>`;
  }

  return '';
}

export const css = `
.th-p-yoga-equipment{
  --yoga-ink:#28372E;
  --yoga-forest:#354438;
  --yoga-oat:#F3EBDD;
  --yoga-sand:#E8DDCC;
  --yoga-clay:#A34E35;
  --yoga-olive:#C9D0B4;
  background:var(--yoga-oat);
}
.th-p-yoga-equipment .hd{
  position:relative;
  z-index:8;
  background:var(--yoga-oat);
  border-bottom:1px solid #BFB59F;
  color:var(--yoga-ink);
}
.th-p-yoga-equipment .hd .wrap{min-height:74px}
.th-p-yoga-equipment .hd .brand{
  color:var(--yoga-ink);
  font-family:var(--display);
  font-size:clamp(19px,1.55vw,25px);
  font-weight:400;
  letter-spacing:.08em;
  text-transform:uppercase;
}
.th-p-yoga-equipment .hd .nav a{color:var(--yoga-ink);font:600 11px/1 var(--body);letter-spacing:.13em;text-transform:uppercase}
.th-p-yoga-equipment .hd .cart{border:1px solid #BFB59F;border-radius:999px;color:var(--yoga-ink);font:700 11px/1 var(--body)}
.th-p-yoga-equipment .category-hero.yoga-orbit{
  position:relative;
  isolation:isolate;
  min-height:clamp(620px,55vw,820px);
  overflow:hidden;
  background:var(--yoga-oat);
  color:var(--yoga-ink);
}
.th-p-yoga-equipment .yoga-orbit-field{position:absolute;inset:0;z-index:-3;overflow:hidden;pointer-events:none}
.th-p-yoga-equipment .yoga-orbit-field::before{
  content:'';
  position:absolute;
  width:clamp(710px,78vw,1160px);
  aspect-ratio:1;
  left:50%;
  top:clamp(-285px,-18vw,-140px);
  border:1px solid #A39B8755;
  border-radius:50%;
  transform:translateX(-9%);
}
.th-p-yoga-equipment .yoga-orbit-field i{position:absolute;border:1px solid #A39B8769;border-radius:50%}
.th-p-yoga-equipment .yoga-orbit-field i:nth-child(1){width:clamp(520px,59vw,900px);aspect-ratio:1;left:50%;top:clamp(-210px,-12vw,-94px);transform:translateX(-10%)}
.th-p-yoga-equipment .yoga-orbit-field i:nth-child(2){width:clamp(360px,42vw,620px);aspect-ratio:1;left:50%;top:clamp(-120px,-6vw,-45px);transform:translateX(-10%)}
.th-p-yoga-equipment .yoga-orbit-field i:nth-child(3){width:clamp(160px,19vw,280px);aspect-ratio:1;left:50%;top:clamp(-20px,2vw,30px);transform:translateX(-10%);background:#D9CEB955}
.th-p-yoga-equipment .yoga-hero-aperture{
  position:absolute;
  z-index:-2;
  top:clamp(42px,5vw,82px);
  left:clamp(30%,34vw,44%);
  width:min(61vw,900px);
  height:clamp(438px,45vw,656px);
  overflow:hidden;
  border-radius:50% 50% 3px 3px;
  background:#CFC7B6;
  box-shadow:0 18px 42px #59615420;
}
.th-p-yoga-equipment .yoga-hero-aperture::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#28372E16,transparent 42%,#28372E13),linear-gradient(0deg,#28372E55,transparent 40%);pointer-events:none}
.th-p-yoga-equipment .yoga-hero-aperture .hero-media{display:block;width:100%;height:100%;object-fit:cover;object-position:center 54%}
.th-p-yoga-equipment .yoga-hero-aperture .theme-empty-media{
  width:100%;
  min-height:100%;
  background:radial-gradient(circle at 53% 18%,#F5EFD9 0 12%,transparent 12.4%),radial-gradient(circle at 54% 42%,#BCC4A7 0 22%,transparent 22.5%),linear-gradient(145deg,#D8C9B6,#87917C);
  color:var(--yoga-ink);
}
.th-p-yoga-equipment .yoga-hero-copy-stage{
  position:relative;
  display:flex;
  align-items:flex-end;
  min-height:clamp(620px,55vw,820px);
  width:min(100%,1500px);
  margin:0 auto;
  padding:clamp(96px,12vw,184px) clamp(34px,7.5vw,132px) clamp(50px,6vw,92px);
  pointer-events:none;
}
.th-p-yoga-equipment .yoga-hero-copy{width:min(100%,650px);pointer-events:auto}
.th-p-yoga-equipment .yoga-hero-copy .eyebrow{margin:0 0 17px;color:#506153;font:700 10px/1.2 var(--body);letter-spacing:.2em;text-transform:uppercase}
.th-p-yoga-equipment .yoga-hero-copy h1{
  max-width:8.8ch;
  margin:0;
  color:var(--yoga-ink);
  font:400 clamp(62px,8.4vw,132px)/.83 var(--display);
  letter-spacing:var(--tracking);
  text-wrap:balance;
  overflow-wrap:anywhere;
}
.th-p-yoga-equipment .yoga-hero-copy h1.long{max-width:12ch;font-size:clamp(47px,6vw,92px);line-height:.9}
.th-p-yoga-equipment .yoga-hero-copy .sub{max-width:36ch;margin:24px 0 0;color:#526054;font:500 clamp(14px,1.15vw,17px)/1.58 var(--body)}
.th-p-yoga-equipment .yoga-hero-copy .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:29px}
.th-p-yoga-equipment .yoga-hero-copy .btn{
  display:inline-flex;
  min-height:48px;
  align-items:center;
  justify-content:center;
  padding:12px 20px;
  border:1px solid var(--yoga-ink);
  border-radius:999px;
  background:var(--yoga-ink);
  color:#FFF9F0;
  font:700 11px/1 var(--body);
  letter-spacing:.08em;
  text-decoration:none;
  text-transform:uppercase;
}
.th-p-yoga-equipment .yoga-hero-copy .btn:hover{background:var(--yoga-clay);border-color:var(--yoga-clay)}
.th-p-yoga-equipment .yoga-hero-copy .btn.ghost{background:#F5F0E5B8;color:var(--yoga-ink);border-color:#8D907F}
.th-p-yoga-equipment .yoga-hero-copy .btn.ghost:hover{background:#FFF9F0;color:var(--yoga-clay);border-color:var(--yoga-clay)}
.th-p-yoga-equipment .yoga-hero-axis{position:absolute;top:clamp(30px,4vw,64px);left:clamp(34px,7.5vw,132px);display:flex;align-items:center;gap:10px;margin:0;color:#667061;font:700 9px/1 var(--body);letter-spacing:.18em;text-transform:uppercase}
.th-p-yoga-equipment .yoga-hero-axis i{display:block;width:clamp(31px,4.2vw,68px);height:1px;background:#8B907F}
.th-p-yoga-equipment .yoga-hero-mark{position:absolute;right:clamp(26px,5vw,76px);bottom:clamp(94px,13vw,188px);margin:0;color:#586458;font:700 9px/1.55 var(--body);letter-spacing:.16em;text-align:right}
.th-p-yoga-equipment .yoga-orbit .motion-toggle{position:absolute;right:clamp(18px,3vw,45px);bottom:clamp(17px,2.5vw,32px);min-height:44px;padding:9px 13px;border:1px solid #8B907F;border-radius:999px;background:#F3EBDDDB;color:var(--yoga-ink);font:700 10px/1 var(--body);letter-spacing:.07em;text-transform:uppercase}
.th-p-yoga-equipment .yoga-orbit.has-hero-motion .yoga-hero-aperture .hero-media{animation:yoga-equipment-drift 19s ease-in-out infinite alternate}
.th-p-yoga-equipment .yoga-orbit.is-motion-paused .yoga-hero-aperture .hero-media{animation-play-state:paused}
@keyframes yoga-equipment-drift{from{transform:scale(1.02) translate3d(-.5%,.2%,0)}to{transform:scale(1.09) translate3d(1.2%,-.65%,0)}}
.th-p-yoga-equipment .perks{background:#E4D9C5;border-block:1px solid #C8BCA9}
.th-p-yoga-equipment .perks .wrap{gap:0}
.th-p-yoga-equipment .perks .perk{padding:21px clamp(15px,2vw,29px);border-inline-start:1px solid #C8BCA9;color:var(--yoga-ink)}
.th-p-yoga-equipment .perks .perk:first-child{border-inline-start:0}
.th-p-yoga-equipment .perks .perk svg{color:var(--yoga-clay)}
.th-p-yoga-equipment .perks .perk b{font-family:var(--display);font-weight:400}
.th-p-yoga-equipment .yoga-paths{position:relative;padding:clamp(66px,9vw,136px) max(24px,calc((100vw - 1360px) / 2)) clamp(62px,8vw,116px);overflow:hidden;background:var(--yoga-oat)}
.th-p-yoga-equipment .yoga-paths::before{content:'';position:absolute;top:clamp(74px,9vw,140px);left:-10vw;width:42vw;aspect-ratio:1;border:1px solid #B7AE9C66;border-radius:50%;pointer-events:none}
.th-p-yoga-equipment .yoga-paths-head{position:relative;max-width:670px;margin:0 auto clamp(38px,5vw,72px);text-align:center}
.th-p-yoga-equipment .yoga-section-kicker{margin:0;color:#64705E;font:700 10px/1.2 var(--body);letter-spacing:.2em;text-transform:uppercase}
.th-p-yoga-equipment .yoga-breath-glyph{display:flex;align-items:center;justify-content:center;gap:7px;margin:18px auto 20px}
.th-p-yoga-equipment .yoga-breath-glyph i{display:block;width:7px;height:7px;border:1px solid var(--yoga-clay);border-radius:50%}
.th-p-yoga-equipment .yoga-breath-glyph i:nth-child(2){width:12px;height:12px;background:var(--yoga-clay)}
.th-p-yoga-equipment .yoga-paths-head h2{max-width:12ch;margin:0 auto;color:var(--yoga-ink);font:400 clamp(42px,5.4vw,76px)/.96 var(--display);letter-spacing:var(--tracking);text-wrap:balance;overflow-wrap:anywhere}
.th-p-yoga-equipment .yoga-paths-head>p:last-child{max-width:42ch;margin:18px auto 0;color:#677166;font:500 15px/1.55 var(--body)}
.th-p-yoga-equipment .yoga-category-path{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));max-width:1360px;margin:0 auto;border-top:1px solid #BDB3A0;border-left:1px solid #BDB3A0}
.th-p-yoga-equipment .yoga-category-tile{position:relative;display:flex;min-width:0;min-height:clamp(330px,31vw,468px);align-items:flex-end;overflow:hidden;border-right:1px solid #BDB3A0;border-bottom:1px solid #BDB3A0;background:#D9D8C4;color:#FFF9F0;text-decoration:none;isolation:isolate}
.th-p-yoga-equipment .yoga-category-tile:nth-child(2n){background:#C5CEB1}
.th-p-yoga-equipment .yoga-category-media{position:absolute;inset:0;z-index:-2;overflow:hidden;background:linear-gradient(145deg,#9EAA91,#E3D5BF)}
.th-p-yoga-equipment .yoga-category-media::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,#26352DDE 2%,#26352D42 45%,#26352D08 76%);pointer-events:none}
.th-p-yoga-equipment .yoga-category-media img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-yoga-equipment .yoga-category-empty{display:flex;width:100%;height:100%;align-items:center;justify-content:center;gap:8px;background:radial-gradient(circle at 50% 42%,#EADABF 0 13%,transparent 13.5%),linear-gradient(135deg,#879378,#C7B99F)}
.th-p-yoga-equipment .yoga-category-empty i{width:25%;aspect-ratio:1;border:1px solid #F2E7D4A8;border-radius:50%}
.th-p-yoga-equipment .yoga-category-empty i:nth-child(2){width:46%;background:#F1E5CE26}
.th-p-yoga-equipment .yoga-tile-count{position:absolute;top:18px;left:18px;color:#F8F0E3;font:700 10px/1 var(--body);letter-spacing:.14em}
.th-p-yoga-equipment .yoga-tile-copy{display:flex;min-width:0;flex-direction:column;align-items:flex-start;padding:clamp(18px,2.2vw,30px)}
.th-p-yoga-equipment .yoga-tile-copy small{margin-bottom:9px;color:#E9E6D5;font:700 9px/1.2 var(--body);letter-spacing:.17em;text-transform:uppercase}
.th-p-yoga-equipment .yoga-tile-copy strong{max-width:9ch;color:#FFF9F0;font:400 clamp(29px,3vw,45px)/.95 var(--display);letter-spacing:-.035em;overflow-wrap:anywhere}
.th-p-yoga-equipment .yoga-tile-copy em{margin-top:17px;color:#FFF9F0;font:700 10px/1.2 var(--body);font-style:normal;letter-spacing:.08em;text-transform:uppercase}
.th-p-yoga-equipment .yoga-tile-copy em i{margin-left:5px;color:#E7BB7E;font-size:16px;font-style:normal;vertical-align:-1px}
.th-p-yoga-equipment .yoga-product-path{display:grid;max-width:1060px;margin:0 auto;border-top:1px solid #BDB3A0}
.th-p-yoga-equipment .yoga-product-tile{display:grid;grid-template-columns:clamp(100px,15vw,176px) minmax(0,1fr) 48px;align-items:center;min-height:137px;gap:clamp(16px,3vw,38px);border-bottom:1px solid #BDB3A0;color:var(--yoga-ink);text-decoration:none}
.th-p-yoga-equipment .yoga-product-media{position:relative;align-self:stretch;overflow:hidden;background:#D8D3C0}
.th-p-yoga-equipment .yoga-product-media img{display:block;width:100%;height:100%;object-fit:cover}
.th-p-yoga-equipment .yoga-product-empty{display:grid;width:100%;height:100%;place-items:center;background:radial-gradient(circle,#D3A466 0 17%,transparent 18%),#B5C09E}
.th-p-yoga-equipment .yoga-product-empty i{width:35%;aspect-ratio:1;border:1px solid #F4EBD8;border-radius:50%}
.th-p-yoga-equipment .yoga-product-copy{display:flex;min-width:0;flex-direction:column;align-items:flex-start;gap:5px;padding-block:16px}
.th-p-yoga-equipment .yoga-product-copy>span{color:var(--yoga-clay);font:700 10px/1 var(--body);letter-spacing:.15em}
.th-p-yoga-equipment .yoga-product-copy strong{overflow-wrap:anywhere;font:400 clamp(27px,3vw,43px)/.98 var(--display);letter-spacing:-.03em}
.th-p-yoga-equipment .yoga-product-copy em{color:#6B776B;font:700 10px/1.2 var(--body);font-style:normal;letter-spacing:.12em;text-transform:uppercase}
.th-p-yoga-equipment .yoga-product-copy small{color:var(--yoga-clay);font:700 13px/1.2 var(--body)}
.th-p-yoga-equipment .yoga-product-tile>b{display:grid;width:44px;height:44px;place-items:center;border:1px solid #A6A18E;border-radius:50%;color:var(--yoga-clay);font:400 19px/1 var(--body)}
.th-p-yoga-equipment #shop{padding-block:clamp(64px,8vw,120px);background:linear-gradient(180deg,#354438 0 135px,var(--yoga-oat) 135px)}
.th-p-yoga-equipment #shop .sec-h{align-items:end;margin-bottom:clamp(26px,4vw,52px)}
.th-p-yoga-equipment #shop .sec-h h2{max-width:10ch;color:#FFF8EC;font-family:var(--display);font-size:clamp(42px,4.8vw,68px);font-weight:400;letter-spacing:var(--tracking);line-height:.95}
.th-p-yoga-equipment #shop .chips{max-width:660px;justify-content:flex-end}
.th-p-yoga-equipment #shop .chip{min-height:44px;border:1px solid #F7EDDD8C;border-radius:999px;background:transparent;color:#FFF8EC;font:700 10px/1 var(--body);letter-spacing:.08em;text-transform:uppercase}
.th-p-yoga-equipment #shop .chip.on,.th-p-yoga-equipment #shop .chip:hover{border-color:#D5A567;background:#D5A567;color:var(--yoga-ink)}
.th-p-yoga-equipment #shop .grid{gap:clamp(20px,2.4vw,34px) clamp(13px,1.7vw,24px)}
.th-p-yoga-equipment #shop .pc{overflow:hidden;border:1px solid #C9BDA9;border-radius:20px;background:#FBF7F0;box-shadow:none}
.th-p-yoga-equipment #shop .pc .im{position:relative;overflow:hidden;background:#E2DDCF}
.th-p-yoga-equipment #shop .pc .bd{display:grid;gap:8px;padding:18px 17px 20px}
.th-p-yoga-equipment #shop .pc h3{font-family:var(--display);font-size:clamp(23px,2.1vw,31px);font-weight:400;letter-spacing:-.025em;line-height:1}
.th-p-yoga-equipment #shop .pc .pr{color:var(--yoga-clay);font:700 13px/1.2 var(--body)}
.th-p-yoga-equipment #shop .pc .tag{top:11px;left:11px;border-radius:999px;background:#354438;color:#FFF8EC;font:700 9px/1 var(--body);letter-spacing:.1em;text-transform:uppercase}
.th-p-yoga-equipment #shop .pc .go{right:11px;bottom:11px;border-radius:50%;background:#FFF8EC;color:var(--yoga-ink)}
.th-p-yoga-equipment .feat{background:#DCE0CB}
.th-p-yoga-equipment .feat .pic{position:relative;overflow:hidden;border-radius:20px}
.th-p-yoga-equipment .feat .txt h2,.th-p-yoga-equipment .story .txt h2{font-family:var(--display);font-weight:400;letter-spacing:var(--tracking)}
.th-p-yoga-equipment .ft{background:#28372E;color:#F5EEDF}
.th-p-yoga-equipment .ft a{color:#FFF9F0}
@media (max-width:900px){
  .th-p-yoga-equipment .yoga-hero-aperture{left:34%;width:72vw}
  .th-p-yoga-equipment .yoga-hero-copy-stage{padding-inline:clamp(28px,5vw,54px)}
  .th-p-yoga-equipment .yoga-category-path{grid-template-columns:repeat(2,minmax(0,1fr))}
  .th-p-yoga-equipment .yoga-category-tile{min-height:360px}
  .th-p-yoga-equipment #shop{background:linear-gradient(180deg,#354438 0 112px,var(--yoga-oat) 112px)}
}
@media (max-width:620px){
  .th-p-yoga-equipment .hd .wrap{min-height:64px}
  .th-p-yoga-equipment .hd .brand{font-size:17px}
  .th-p-yoga-equipment .category-hero.yoga-orbit{min-height:620px}
  .th-p-yoga-equipment .yoga-orbit-field::before{width:680px;top:-175px;transform:translateX(-7%)}
  .th-p-yoga-equipment .yoga-orbit-field i:nth-child(1){width:510px;top:-113px;transform:translateX(-7%)}
  .th-p-yoga-equipment .yoga-orbit-field i:nth-child(2){width:360px;top:-46px;transform:translateX(-7%)}
  .th-p-yoga-equipment .yoga-orbit-field i:nth-child(3){width:178px;top:40px;transform:translateX(-7%)}
  .th-p-yoga-equipment .yoga-hero-aperture{top:104px;left:32%;width:94vw;height:438px;border-radius:50% 50% 2px 2px}
  .th-p-yoga-equipment .yoga-hero-aperture .hero-media{object-position:59% 52%}
  .th-p-yoga-equipment .yoga-hero-copy-stage{min-height:620px;align-items:flex-end;padding:90px 18px 72px}
  .th-p-yoga-equipment .yoga-hero-copy{width:min(100%,355px)}
  .th-p-yoga-equipment .yoga-hero-copy .eyebrow{margin-bottom:12px;font-size:9px;letter-spacing:.16em}
  .th-p-yoga-equipment .yoga-hero-copy h1{max-width:8.6ch;font-size:clamp(53px,15vw,69px);line-height:.82}
  .th-p-yoga-equipment .yoga-hero-copy h1.long{max-width:11.5ch;font-size:clamp(39px,10.5vw,51px)}
  .th-p-yoga-equipment .yoga-hero-copy .sub{max-width:29ch;margin-top:18px;font-size:14px;line-height:1.48}
  .th-p-yoga-equipment .yoga-hero-copy .ctas{width:100%;margin-top:21px}
  .th-p-yoga-equipment .yoga-hero-copy .btn{flex:1 1 170px;min-height:46px;padding-inline:15px}
  .th-p-yoga-equipment .yoga-hero-copy .btn.ghost{display:none}
  .th-p-yoga-equipment .yoga-hero-axis{top:28px;left:18px;font-size:8px;letter-spacing:.14em}
  .th-p-yoga-equipment .yoga-hero-axis i{width:28px}
  .th-p-yoga-equipment .yoga-hero-mark{right:17px;bottom:113px;font-size:8px;letter-spacing:.13em}
  .th-p-yoga-equipment .yoga-orbit .motion-toggle{right:14px;bottom:18px}
  .th-p-yoga-equipment .perks .wrap{display:block}
  .th-p-yoga-equipment .perks .perk{border-inline-start:0;border-top:1px solid #C8BCA9;padding:16px 0}
  .th-p-yoga-equipment .perks .perk:first-child{border-top:0}
  .th-p-yoga-equipment .yoga-paths{padding:62px 16px 66px}
  .th-p-yoga-equipment .yoga-paths::before{top:126px;left:-47vw;width:110vw}
  .th-p-yoga-equipment .yoga-paths-head{margin-bottom:31px}
  .th-p-yoga-equipment .yoga-paths-head h2{font-size:clamp(37px,10.5vw,50px)}
  .th-p-yoga-equipment .yoga-paths-head>p:last-child{font-size:14px}
  .th-p-yoga-equipment .yoga-category-path{grid-template-columns:1fr}
  .th-p-yoga-equipment .yoga-category-tile{min-height:272px}
  .th-p-yoga-equipment .yoga-tile-copy{padding:19px}
  .th-p-yoga-equipment .yoga-tile-copy strong{max-width:10ch;font-size:35px}
  .th-p-yoga-equipment .yoga-product-path{margin-inline:-16px}
  .th-p-yoga-equipment .yoga-product-tile{grid-template-columns:96px minmax(0,1fr) 38px;min-height:112px;gap:13px;padding-right:7px}
  .th-p-yoga-equipment .yoga-product-copy{padding-block:13px}
  .th-p-yoga-equipment .yoga-product-copy strong{font-size:26px}
  .th-p-yoga-equipment .yoga-product-tile>b{width:35px;height:35px;font-size:16px}
  .th-p-yoga-equipment #shop{padding-top:62px;background:linear-gradient(180deg,#354438 0 88px,var(--yoga-oat) 88px)}
  .th-p-yoga-equipment #shop .sec-h{margin-bottom:27px}
  .th-p-yoga-equipment #shop .sec-h h2{font-size:44px}
  .th-p-yoga-equipment #shop .chips{justify-content:flex-start;gap:7px}
  .th-p-yoga-equipment #shop .chip{padding-inline:12px}
  .th-p-yoga-equipment #shop .pc .bd{padding:15px 13px 17px}
}
@media (max-width:390px){
  .th-p-yoga-equipment .yoga-hero-aperture{left:28%;width:98vw}
  .th-p-yoga-equipment .yoga-hero-copy-stage{padding-inline:14px}
  .th-p-yoga-equipment .yoga-hero-copy h1{font-size:clamp(48px,14.6vw,58px)}
  .th-p-yoga-equipment .yoga-hero-copy h1.long{font-size:clamp(35px,10vw,43px)}
  .th-p-yoga-equipment .yoga-hero-mark{display:none}
  .th-p-yoga-equipment .yoga-product-tile{grid-template-columns:86px minmax(0,1fr) 35px;gap:10px}
}
@media (prefers-reduced-motion:reduce){
  .th-p-yoga-equipment .yoga-orbit.has-hero-motion .yoga-hero-aperture .hero-media{animation:none;transform:none}
}
`;
