import { THEMES, THEME_IDS, themeOf, publicThemes } from "./themes.js";
import { config } from "./config.js";
import { storePage, productPage } from "./render.js";

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

/** In-memory illustrative fixtures only. Never create accounts, products or Stripe sessions. */
export function themeDemoFixture(id, { motion } = {}) {
  if (!THEME_IDS.has(id)) return null;
  const t = themeOf(id);
  const asset = t.demoHero ? `${config.publicUrl}${t.demoHero}` : "";
  const store = {
    store_name: t.name, store_slug: `theme-${t.id}`, theme: t.id, _base: `/theme-demo/${t.id}`,
    _themeDemo: true, _demoHero: asset, stripe_ready: false,
    hero_title: t.copy?.title || t.name,
    hero_subtitle: t.copy?.subtitle || t.vibe,
    hero_eyebrow: t.copy?.eyebrow || "ILLUSTRATIVE THEME DEMO",
    hero_cta: t.copy?.cta || "Explore the collection",
    hero_motion: ["drift", "pan", "still"].includes(motion) ? motion : t.group === "digital" ? t.motion : "still",
    tagline: t.copy?.title || t.vibe,
    about: `This ${t.category || t.for} storefront is a read-only design demonstration. In your store, upload your own photos, edit your words and add real products. All items and prices on this page are illustrative examples.`,
    announcement: "Theme preview · illustrative products · no purchases",
    shipping_flat_cents: 500, free_shipping_over_cents: null, ship_countries: "",
  };
  // Product examples make category navigation meaningful; no fabricated specifications or inventory claims.
  // The hero photo is shown only as the first illustrative item. Remaining slots have honest empty-media states.
  const products = Array.from({ length: 3 }, (_, i) => ({
    id: "", slug: `example-${i + 1}`, title: `${t.category || t.for} — example ${i + 1}`,
    category: i === 0 ? "Featured" : "The collection", image_url: i === 0 ? asset : "",
    alt_text: i === 0 ? "Illustrative theme photograph, not seller inventory" : "",
    price_cents: [7800, 4600, 9200][i], currency: "usd", variants: [], in_stock: true,
    status: "live", kind: t.group === "digital" ? "digital" : "physical", tagline: "Illustrative item — replace with your own product",
    description: "This is a demonstration item, not available to purchase. Sellers add their own product photos, titles, descriptions and prices in Snapfront.",
    bullets: [], tags: [], faq: [], label: "Example",
  }));
  return { t, store, products };
}

export function themeDemoPage(id, { category, motion } = {}) {
  const fixture = themeDemoFixture(id, { motion });
  return fixture && storePage(fixture.store, fixture.products, config.publicUrl, { category });
}

export function themeDemoProduct(id, slug) {
  const fixture = themeDemoFixture(id);
  const p = fixture?.products.find((product) => product.slug === slug);
  return p ? productPage(fixture.store, p, config.publicUrl, fixture.products.filter((product) => product !== p)) : null;
}

export function themeDemoCart(id) {
  const t = THEME_IDS.has(id) && themeOf(id);
  return t ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Illustrative cart · ${esc(t.name)}</title><style>body{font:16px/1.6 system-ui;background:#f8f5ef;color:#20241e;margin:0;padding:40px 20px}main{max-width:620px;margin:auto}a{color:inherit}h1{line-height:1.15}</style></head><body><main><h1>This is a theme demonstration</h1><p>Example products are not available to buy. Your real storefront keeps Snapfront’s existing cart and secure Stripe checkout.</p><p><a href="/theme-demo/${esc(id)}">Return to this theme</a> · <a href="/themes">Browse all themes</a></p></main></body></html>` : null;
}

export function themeGalleryPage() {
  const themes = publicThemes();
  const count = THEMES.length;
  const data = JSON.stringify(themes).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Over 100 storefront themes · Snapfront</title><meta name="description" content="Explore over 100 editable Snapfront storefront themes, including product-specific fashion, home, electronics, beauty and outdoor designs."><style>
*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#242720;font:15px/1.55 system-ui,-apple-system,sans-serif}a{color:inherit}button,input{font:inherit}button{cursor:pointer}header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d9dad1;padding:22px 4vw}header>a:first-child{font-size:25px;font-weight:800;letter-spacing:-1px;text-decoration:none}main{max-width:1540px;margin:auto;padding:42px 4vw 80px}h1{font:400 clamp(42px,6.5vw,92px)/1.05 Georgia,serif;letter-spacing:-.045em;max-width:850px;margin:0 0 20px}.lead{max-width:760px;color:#61665c;font-size:17px}.note{padding:18px 20px;background:#ece9df;border-left:3px solid #8d4438;margin:26px 0}.toolbar{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:24px 0}.search{width:min(420px,100%);padding:13px 16px;border:1px solid #cfd1c8;background:white;border-radius:8px;color:#242720}.filters{display:flex;gap:8px;flex-wrap:wrap}.filter{padding:11px 15px;min-height:44px;border:1px solid #d4d6cd;background:transparent;border-radius:999px}.filter[aria-pressed=true]{background:#242720;color:#fff;border-color:#242720}.count{color:#62665d;margin:20px 0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.card{min-width:0;background:#fffefa;border:1px solid #d8dad1;border-radius:9px;overflow:hidden}.card>a{display:block;text-decoration:none}.thumb{aspect-ratio:16/10;background:#e9e7df;position:relative;overflow:hidden}.thumb img{width:100%;height:100%;object-fit:cover}.classic-thumb{padding:22px;display:grid;gap:14px;align-content:center}.classic-thumb b{font:600 31px/1.1 Georgia,serif}.classic-thumb .bars{display:flex;gap:8px}.classic-thumb .bars i{width:28%;height:48px}.badge{position:absolute;bottom:12px;right:12px;padding:7px 12px;background:#fffefa;color:#242720;border-radius:99px;font-size:12px}.body{padding:18px 20px}h2{font:400 29px/1.2 Georgia,serif;margin:4px 0 10px}.eyebrow{color:#885247;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.body p{font-size:13px;color:#6a6d63;margin:0}.links{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px;font-size:13px}.links a{min-height:36px;display:flex;align-items:center}.empty{padding:40px;background:#ece9df;grid-column:1/-1}footer{border-top:1px solid #d9dad1;padding:24px 4vw;color:#62665d}:focus-visible{outline:3px solid #8d4438;outline-offset:3px}@media(max-width:1050px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){main{padding:30px 16px 60px}header{padding:18px 16px}.grid{grid-template-columns:1fr;gap:20px}.toolbar{align-items:stretch}.search{width:100%}.lead{font-size:16px}}
</style></head><body><header><a href="/">snapfront.</a><a href="snapfront://looks">Open in app</a></header><main><p class="eyebrow">Over 100 editable storefront themes</p><h1>Different products.<br>Different storefronts.</h1><p class="lead">Your original 20 classic looks, plus over 100 product-specific designs, including 25 digital-product storefronts with their own compositions, typography and shopping stories. Pick a look, upload photos, edit words and preview your store.</p><div class="note">These previews use the actual editable storefront templates. Demo photography, items and prices are illustrative, not real inventory. Your store uses your own uploaded photos and products. Original classic themes are unchanged.</div><div class="toolbar"><label for="search" class="eyebrow">Find your look</label><input class="search" id="search" type="search" placeholder="Search products, categories or theme names"><div class="filters" id="filters"></div></div><p class="count" id="count" aria-live="polite"></p><div class="grid" id="grid"></div></main><footer>Built with Snapfront · Theme demos do not accept purchases.</footer><script>
const themes=${data};let group='all';const groups=[['all','All ${count}'],['digital','Digital products'],['fashion','Fashion & accessories'],['beauty','Beauty'],['home','Home & living'],['technology','Tech & gaming'],['outdoor','Outdoor & auto'],['lifestyle','Lifestyle & play'],['classic','Original 20']];const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const grid=document.getElementById('grid');const filters=document.getElementById('filters');
function draw(){const query=document.getElementById('search').value.trim().toLowerCase();const found=themes.filter(t=>(group==='all'||(group==='classic'?t.collection==='classic':t.group===group))&&[t.name,t.category,t.for,t.vibe].join(' ').toLowerCase().includes(query));document.getElementById('count').textContent=found.length+' theme'+(found.length===1?'':'s');filters.innerHTML=groups.map(([id,label])=>'<button class="filter" data-group="'+id+'" aria-pressed="'+(group===id)+'">'+label+'</button>').join('');grid.innerHTML=found.length?found.map(t=>'<article class="card"><a href="'+escape(t.demo_url||'/theme-demo/'+t.id)+'"><div class="thumb">'+(t.preview_url?'<img src="'+escape(t.preview_url)+'" alt="'+escape(t.name)+' rendered storefront preview" loading="lazy" decoding="async">':'<div class="classic-thumb" style="background:'+t.colors.bg+';color:'+t.colors.ink+';height:100%"><span style="color:'+t.colors.muted+'">Original classic theme</span><b>'+escape(t.name)+'</b><div class="bars">'+[t.colors.accent,t.colors.panel,t.colors.surface].map(c=>'<i style="background:'+c+'"></i>').join('')+'</div></div>')+'<span class="badge">Open live template</span></div></a><div class="body"><span class="eyebrow">'+escape(t.category||t.for)+'</span><h2>'+escape(t.name)+'</h2><p>'+escape(t.vibe)+'</p><div class="links"><a href="'+escape(t.demo_url||'/theme-demo/'+t.id)+'">Preview template</a>'+(t.preview_url?'<a href="'+escape(t.demo_url)+'?motion=pan">Try hero motion</a>':'')+'</div></div></article>').join(''):'<div class="empty">No themes match. Try a different product or choose All.</div>'}
filters.addEventListener('click',e=>{const b=e.target.closest('[data-group]');if(b){group=b.dataset.group;draw()}});document.getElementById('search').addEventListener('input',draw);draw();
</script></body></html>`;
}
