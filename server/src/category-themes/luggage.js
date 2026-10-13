import { defineTheme } from '../category-theme-kit.js';

export const theme = defineTheme({
  id: 'p-luggage',
  name: 'FIELD — luggage',
  for: 'Travel with intent',
  vibe: 'Railway modernism, warm paper, and quietly capable travel pieces',
  category: 'Travel luggage',
  group: 'lifestyle',
  display: 'Cormorant Garamond',
  body: 'DM Sans',
  displayWeight: 500,
  tracking: '-.045em',
  colors: {
    bg: '#10281F',
    surface: '#18342A',
    ink: '#F2E9D7',
    muted: '#B6AE9D',
    line: '#516356',
    accent: '#D9B879',
    onAccent: '#15261E',
    panel: '#E7D7B8',
    onPanel: '#1E2D25',
    foot: '#0B1B16',
    onFoot: '#EDE1CA',
    bar: '#122C23',
    onBar: '#F5ECD9',
    badge: '#C9904B',
    onBadge: '#1C281F',
  },
  header: 'split',
  hero: 'editorial',
  card: 'boxed',
  ratio: '4/5',
  rCard: 2,
  rBtn: 1,
  motion: 'pan',
  copy: {
    eyebrow: 'The journey edit',
    collection: 'Departure pieces',
    cta: 'Choose your case',
    title: 'Made for the way there.',
    subtitle: 'Thoughtful forms for the miles ahead.',
  },
});

export function hero(ctx) {
  return `<section class="hero category-hero luggage-platform${ctx.heroClass}"${ctx.heroAttrs}>
    <div class="luggage-hero-stage">
      <div class="luggage-image-frame">
        ${ctx.media(0, { priority: true, lazy: false, decorative: true })}
        <div class="luggage-image-rail" aria-hidden="true">
          <span>Journey notes</span>
          <i></i>
          <span>Arrival / departure</span>
        </div>
      </div>
      <div class="luggage-paper-panel">
        <p class="luggage-panel-kicker" aria-hidden="true">Departure / 01</p>
        <div class="luggage-panel-rule" aria-hidden="true"></div>
        ${ctx.copy('luggage-copy')}
        <p class="luggage-panel-tail" aria-hidden="true">A considered companion for every kind of way.</p>
      </div>
    </div>
    ${ctx.controls}
  </section>`;
}

export function discovery(ctx) {
  const categories = Array.isArray(ctx.cats)
    ? ctx.cats.filter((category) => category && category.name).slice(0, 4)
    : [];

  if (categories.length >= 2) {
    const routes = categories.map((category, index) => {
      const count = Number(category.count);
      const countLabel = Number.isFinite(count)
        ? `${count} ${count === 1 ? 'piece' : 'pieces'}`
        : 'View collection';
      const number = String(index + 1).padStart(2, '0');
      return `<a class="luggage-departure-row" href="${ctx.categoryLink(category.name)}" aria-label="Shop ${ctx.esc(category.name)}">
        <span class="luggage-route-number">${number}</span>
        <span class="luggage-route-name">${ctx.esc(category.name)}</span>
        <span class="luggage-route-count">${ctx.esc(countLabel)}</span>
        <span class="luggage-route-arrow" aria-hidden="true">→</span>
      </a>`;
    }).join('');

    return `<section class="theme-discovery luggage-discovery" aria-labelledby="luggage-discovery-title">
      <div class="luggage-discovery-intro">
        <p class="luggage-departure-label">Departures</p>
        <div>
          <h2 id="luggage-discovery-title">Choose your passage.</h2>
          <p>Browse the store by the kind of journey you are taking.</p>
        </div>
        <span class="luggage-intro-mark" aria-hidden="true">↗</span>
      </div>
      <div class="luggage-departure-board" role="list">
        <div class="luggage-board-head" aria-hidden="true">
          <span>Route</span><span>Collection</span><span>Available</span><span>Go</span>
        </div>
        <div class="luggage-board-routes">${routes}</div>
      </div>
    </section>`;
  }

  const products = Array.isArray(ctx.products) ? ctx.products : [];
  if (products.length < 2) return '';

  return `<section class="theme-discovery luggage-discovery luggage-product-discovery" aria-labelledby="luggage-discovery-title">
    <div class="luggage-discovery-intro">
      <p class="luggage-departure-label">The departure edit</p>
      <div>
        <h2 id="luggage-discovery-title">Ready for the next way.</h2>
        <p>A selection from the current store collection.</p>
      </div>
      <span class="luggage-intro-mark" aria-hidden="true">↗</span>
    </div>
    <div class="luggage-product-rail">${products.slice(0, 3).map((product) => ctx.productCard(product)).join('')}</div>
  </section>`;
}

export const css = `
.th-p-luggage{
  background:var(--bg);
  color:var(--ink);
}
.th-p-luggage .category-hero.luggage-platform{
  position:relative;
  padding:clamp(16px,2vw,30px);
  background:var(--bar);
  isolation:isolate;
}
.th-p-luggage .luggage-hero-stage{
  display:grid;
  grid-template-columns:minmax(0,1.64fr) minmax(310px,.86fr);
  min-height:clamp(580px,50vw,720px);
  overflow:hidden;
  border:1px solid #f4e8ce3d;
  background:#10281f;
}
.th-p-luggage .luggage-image-frame{
  position:relative;
  min-height:0;
  overflow:hidden;
  background:#24352c;
}
.th-p-luggage .luggage-image-frame::after{
  position:absolute;
  inset:0;
  z-index:1;
  pointer-events:none;
  content:"";
  background:linear-gradient(90deg,#07171052 0%,transparent 28%,transparent 70%,#07171045 100%),linear-gradient(0deg,#06140f68 0%,transparent 38%);
}
.th-p-luggage .luggage-image-frame .hero-media,
.th-p-luggage .luggage-image-frame .theme-empty-media{
  display:block;
  width:100%;
  height:100%;
  min-height:100%;
  object-fit:cover;
  object-position:42% center;
}
.th-p-luggage .luggage-image-frame .theme-empty-media{
  display:grid;
  place-items:center;
  padding:48px;
  background:radial-gradient(circle at 37% 41%,#6c6757 0%,#33463a 28%,#14271f 68%);
  color:#ece0c7;
}
.th-p-luggage .luggage-image-rail{
  position:absolute;
  z-index:2;
  top:clamp(20px,3vw,46px);
  left:clamp(18px,3vw,44px);
  display:flex;
  flex-direction:column;
  gap:14px;
  width:min(118px,25%);
  color:#f4e6ca;
  font:500 9px/1.6 var(--body);
  letter-spacing:.19em;
  text-transform:uppercase;
}
.th-p-luggage .luggage-image-rail i{
  display:block;
  width:36px;
  height:1px;
  background:var(--accent);
}
.th-p-luggage .luggage-paper-panel{
  position:relative;
  display:flex;
  flex-direction:column;
  justify-content:center;
  min-width:0;
  padding:clamp(42px,6vw,92px) clamp(28px,4.4vw,72px);
  overflow:hidden;
  color:var(--onPanel);
  background:linear-gradient(115deg,#efe1c5 0%,#e4d0aa 55%,#d3b783 100%);
}
.th-p-luggage .luggage-paper-panel::before,
.th-p-luggage .luggage-paper-panel::after{
  position:absolute;
  z-index:0;
  pointer-events:none;
  content:"";
}
.th-p-luggage .luggage-paper-panel::before{
  top:-14%;
  right:-24%;
  width:86%;
  aspect-ratio:1;
  border:1px solid #4c5b4138;
  border-radius:50%;
}
.th-p-luggage .luggage-paper-panel::after{
  right:0;
  bottom:0;
  left:0;
  height:8px;
  background:repeating-linear-gradient(90deg,#1c362b 0 5px,transparent 5px 12px);
  opacity:.64;
}
.th-p-luggage .luggage-panel-kicker,
.th-p-luggage .luggage-panel-tail,
.th-p-luggage .luggage-paper-panel .txt{
  position:relative;
  z-index:1;
}
.th-p-luggage .luggage-panel-kicker{
  margin:0 0 15px;
  color:#425046;
  font:600 10px/1.2 var(--body);
  letter-spacing:.17em;
  text-transform:uppercase;
}
.th-p-luggage .luggage-panel-rule{
  position:relative;
  z-index:1;
  width:48px;
  height:1px;
  margin:0 0 29px;
  background:#485447;
}
.th-p-luggage .luggage-copy{
  max-width:18ch;
}
.th-p-luggage .luggage-copy .eyebrow{
  margin:0 0 13px;
  color:#566257;
  font:600 10px/1.3 var(--body);
  letter-spacing:.16em;
  text-transform:uppercase;
}
.th-p-luggage .luggage-copy h1,
.th-p-luggage .luggage-copy h1.long{
  max-width:100%;
  margin:0;
  color:var(--onPanel);
  font:var(--displayWeight) clamp(47px,5.2vw,81px)/.88 var(--display);
  letter-spacing:var(--dt);
  overflow-wrap:anywhere;
}
.th-p-luggage .luggage-copy .sub{
  max-width:31ch;
  margin:24px 0 0;
  color:#455045;
  font:400 clamp(15px,1.25vw,19px)/1.48 var(--display);
}
.th-p-luggage .luggage-copy .ctas{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:31px;
}
.th-p-luggage .luggage-copy .btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:46px;
  padding:12px 18px;
  border:1px solid #213e32;
  border-radius:var(--rBtn);
  color:#f5ead4;
  background:#17362b;
  font:600 11px/1.2 var(--body);
  letter-spacing:.09em;
  text-align:center;
  text-decoration:none;
  text-transform:uppercase;
}
.th-p-luggage .luggage-copy .btn.ghost{
  color:#1e392e;
  background:transparent;
}
.th-p-luggage .luggage-copy .btn:hover{
  color:#17362b;
  background:#f5ead4;
}
.th-p-luggage .luggage-panel-tail{
  max-width:24ch;
  margin:42px 0 0;
  padding-top:16px;
  border-top:1px solid #31453969;
  color:#526055;
  font:500 9px/1.62 var(--body);
  letter-spacing:.12em;
  text-transform:uppercase;
}
.th-p-luggage .luggage-platform .motion-toggle{
  position:absolute;
  z-index:4;
  right:clamp(26px,3vw,50px);
  bottom:clamp(26px,3vw,50px);
  min-height:44px;
  padding:10px 13px;
  border:1px solid #f3e4c259;
  border-radius:var(--rBtn);
  color:#f6ead7;
  background:#10281fc7;
  font:600 9px/1 var(--body);
  letter-spacing:.12em;
  text-transform:uppercase;
}
.th-p-luggage .theme-discovery.luggage-discovery{
  max-width:1440px;
  margin:0 auto;
  padding:clamp(62px,8vw,126px) clamp(20px,4vw,64px);
}
.th-p-luggage .luggage-discovery-intro{
  display:grid;
  grid-template-columns:minmax(130px,.48fr) minmax(0,1.5fr) auto;
  gap:24px;
  align-items:start;
  margin-bottom:25px;
}
.th-p-luggage .luggage-departure-label{
  display:flex;
  gap:10px;
  align-items:center;
  margin:8px 0 0;
  color:var(--accent);
  font:600 10px/1 var(--body);
  letter-spacing:.18em;
  text-transform:uppercase;
}
.th-p-luggage .luggage-departure-label::before{
  width:23px;
  height:1px;
  content:"";
  background:currentColor;
}
.th-p-luggage .luggage-discovery-intro h2{
  max-width:18ch;
  margin:0;
  color:var(--ink);
  font:var(--displayWeight) clamp(38px,4.5vw,66px)/.93 var(--display);
  letter-spacing:var(--dt);
  overflow-wrap:anywhere;
}
.th-p-luggage .luggage-discovery-intro div > p{
  max-width:41ch;
  margin:16px 0 0;
  color:var(--muted);
  font:400 14px/1.55 var(--body);
}
.th-p-luggage .luggage-intro-mark{
  display:grid;
  width:44px;
  aspect-ratio:1;
  place-items:center;
  border:1px solid var(--line);
  color:var(--accent);
  font:400 24px/1 var(--display);
}
.th-p-luggage .luggage-departure-board{
  border:1px solid #d9b87966;
  background:#0b1e17;
  box-shadow:16px 17px 0 #d9b87914;
}
.th-p-luggage .luggage-board-head,
.th-p-luggage .luggage-departure-row{
  display:grid;
  grid-template-columns:82px minmax(0,1fr) 120px 57px;
  align-items:center;
}
.th-p-luggage .luggage-board-head{
  min-height:38px;
  padding:0 20px;
  border-bottom:1px solid #d9b8793d;
  color:#b8ac90;
  font:600 8px/1 var(--body);
  letter-spacing:.16em;
  text-transform:uppercase;
}
.th-p-luggage .luggage-board-routes{
  display:grid;
}
.th-p-luggage .luggage-departure-row{
  min-height:90px;
  padding:0 20px;
  border-bottom:1px solid #d9b8792e;
  color:var(--ink);
  text-decoration:none;
}
.th-p-luggage .luggage-departure-row:last-child{
  border-bottom:0;
}
.th-p-luggage .luggage-departure-row:hover{
  color:#15291f;
  background:var(--accent);
}
.th-p-luggage .luggage-route-number{
  color:var(--accent);
  font:500 10px/1 var(--body);
  letter-spacing:.14em;
}
.th-p-luggage .luggage-departure-row:hover .luggage-route-number{
  color:#244131;
}
.th-p-luggage .luggage-route-name{
  min-width:0;
  padding-right:16px;
  font:var(--displayWeight) clamp(23px,2.5vw,34px)/1 var(--display);
  letter-spacing:var(--dt);
  overflow-wrap:anywhere;
}
.th-p-luggage .luggage-route-count{
  color:var(--muted);
  font:600 9px/1.3 var(--body);
  letter-spacing:.12em;
  text-align:right;
  text-transform:uppercase;
}
.th-p-luggage .luggage-departure-row:hover .luggage-route-count{
  color:#315040;
}
.th-p-luggage .luggage-route-arrow{
  padding-left:21px;
  color:var(--accent);
  font:400 28px/1 var(--display);
  text-align:right;
}
.th-p-luggage .luggage-departure-row:hover .luggage-route-arrow{
  color:#16372a;
}
.th-p-luggage .luggage-product-rail{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:14px;
  padding-top:8px;
}
.th-p-luggage .luggage-product-rail .product-card{
  border:1px solid var(--line);
  border-radius:var(--rCard);
  background:var(--surface);
  box-shadow:none;
}
.th-p-luggage .luggage-product-rail .product-card img{
  filter:saturate(.8) contrast(1.03);
}
.th-p-luggage :is(.luggage-copy .btn,.luggage-departure-row):focus-visible{
  outline:3px solid var(--accent);
  outline-offset:3px;
}
@media (max-width:900px){
  .th-p-luggage .luggage-hero-stage{
    grid-template-columns:1fr;
    min-height:0;
    overflow:visible;
    border:0;
    background:transparent;
  }
  .th-p-luggage .luggage-image-frame{
    min-height:clamp(430px,73vw,580px);
    border:1px solid #f4e8ce3d;
  }
  .th-p-luggage .luggage-paper-panel{
    min-height:0;
    margin:-63px clamp(14px,4vw,38px) 0;
    border:1px solid #9b835e;
    padding:clamp(37px,7vw,62px) clamp(25px,6vw,57px);
  }
  .th-p-luggage .luggage-platform .motion-toggle{
    right:clamp(30px,7vw,64px);
    bottom:clamp(25px,5vw,43px);
  }
  .th-p-luggage .luggage-discovery-intro{
    grid-template-columns:minmax(112px,.38fr) minmax(0,1fr) auto;
  }
}
@media (max-width:620px){
  .th-p-luggage .category-hero.luggage-platform{
    padding:12px 0 0;
  }
  .th-p-luggage .luggage-image-frame{
    min-height:422px;
    border-right:0;
    border-left:0;
  }
  .th-p-luggage .luggage-image-frame .hero-media{
    object-position:39% center;
  }
  .th-p-luggage .luggage-image-rail{
    top:21px;
    left:19px;
    gap:10px;
    width:118px;
    font-size:8px;
  }
  .th-p-luggage .luggage-paper-panel{
    margin:-28px 14px 0;
    padding:34px 23px 42px;
  }
  .th-p-luggage .luggage-panel-kicker{
    font-size:8px;
  }
  .th-p-luggage .luggage-panel-rule{
    margin-bottom:22px;
  }
  .th-p-luggage .luggage-copy h1,
  .th-p-luggage .luggage-copy h1.long{
    font-size:clamp(45px,14vw,61px);
  }
  .th-p-luggage .luggage-copy .sub{
    margin-top:18px;
    font-size:16px;
  }
  .th-p-luggage .luggage-copy .ctas{
    width:100%;
    margin-top:24px;
  }
  .th-p-luggage .luggage-copy .btn{
    flex:1 1 170px;
  }
  .th-p-luggage .luggage-panel-tail{
    margin-top:31px;
  }
  .th-p-luggage .luggage-platform .motion-toggle{
    right:25px;
    bottom:18px;
    padding:9px 10px;
    font-size:8px;
  }
  .th-p-luggage .theme-discovery.luggage-discovery{
    padding:66px 18px;
  }
  .th-p-luggage .luggage-discovery-intro{
    grid-template-columns:1fr auto;
    gap:15px;
  }
  .th-p-luggage .luggage-departure-label{
    grid-column:1 / -1;
    margin:0;
  }
  .th-p-luggage .luggage-discovery-intro h2{
    font-size:clamp(37px,11vw,50px);
  }
  .th-p-luggage .luggage-discovery-intro div > p{
    font-size:13px;
  }
  .th-p-luggage .luggage-intro-mark{
    width:40px;
  }
  .th-p-luggage .luggage-board-head{
    display:none;
  }
  .th-p-luggage .luggage-departure-row{
    grid-template-columns:43px minmax(0,1fr) 28px;
    min-height:78px;
    padding:0 14px;
  }
  .th-p-luggage .luggage-route-count{
    display:none;
  }
  .th-p-luggage .luggage-route-name{
    padding-right:10px;
    font-size:clamp(23px,7.2vw,31px);
  }
  .th-p-luggage .luggage-route-arrow{
    padding-left:4px;
    font-size:25px;
  }
  .th-p-luggage .luggage-product-rail{
    grid-template-columns:1fr;
    gap:12px;
  }
}
@media (prefers-reduced-motion:reduce){
  .th-p-luggage .luggage-platform.has-hero-motion .hero-media{
    animation:none;
    transform:none;
  }
}
`;
