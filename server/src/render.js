// Server-rendered public storefront pages: plain HTML and one inline stylesheet, so stores load fast,
// rank in search and share well from a link in bio. The look comes from the store's theme (themes.js).
import { storeUrl } from "./urls.js";
import { config } from "./config.js";
import { themeOf, themeCss, fontsUrl, bodyClass } from "./themes.js";
import { CSS } from "./storefront-css.js";
import { CATEGORY_CSS } from "./category-storefront-css.js";
import { reviewsFor, ratingsBySeller, reviewToken, linksOf } from "./growth.js";
import { isAiImage } from "./aimedia.js";
import { CATEGORY_REGISTRY } from "./premium-themes.js";
import { categoryContext, CATEGORY_BASE_CSS } from "./category-theme-kit.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (cents, cur = "usd") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(cents / 100);

const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  bag: svg('<path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  truck: svg('<path d="M2.5 6.5h11v10h-11z"/><path d="M13.5 9.5h4l3 3.2v3.8h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  download: svg('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>'),
};

/** Path prefix for links inside a store: "" on its own address (pawplace.snapfront.app), "/s/<slug>" otherwise. */
const base = (store) => (store._base ?? `/s/${store.store_slug}`);
const home = (store) => base(store) || "/";
const catHref = (store, cat) => `${base(store)}/?c=${encodeURIComponent(cat)}#shop`;
const bannerUrl = (store) => (store.banner_file ? `${config.publicUrl}/img/${store.banner_file}` : null);

/* ---------- facts the page can state truthfully ---------- */
/** $75 rather than $75.00 in marketing copy. */
const short = (cents) => money(cents).replace(/\.00$/, "");
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function shipping(store) {
  const free = store.free_shipping_over_cents, flat = store.shipping_flat_cents ?? 0;
  const title = free != null ? (free === 0 ? "Free shipping" : `Free shipping over ${short(free)}`) : flat === 0 ? "Free shipping" : `${short(flat)} flat-rate shipping`;
  const codes = String(store.ship_countries || "").split(",").filter(Boolean);
  const names = codes.map((c) => { try { return c === "US" ? "the US" : c === "GB" ? "the UK" : regionNames.of(c); } catch { return c; } });
  const where = !names.length ? "" : names.length <= 3 ? `Ships to ${names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0]}` : `Ships to ${names.length} countries`;
  return { title, where };
}
function storeFacts(store, products) {
  const physical = !products.length || products.some((p) => p.kind === "physical");
  const digital = products.some((p) => p.kind === "digital");
  const ship = shipping(store);
  const perks = [];
  if (physical) perks.push([ICON.truck, ship.title, ship.where || "Packed and shipped by us"]);
  if (digital) perks.push([ICON.download, "Instant download", "Your files arrive as soon as you pay"]);
  perks.push([ICON.lock, "Secure checkout", "Payments handled safely by Stripe"]);
  const notes = [store.announcement, physical ? `${ship.title}${ship.where ? ` · ${ship.where.replace("Ships", "ships")}` : ""}` : null, digital ? "Instant download after checkout" : null, "Secure checkout with Stripe"]
    .filter(Boolean);
  return { perks, notes, ship, physical };
}
function categories(products) {
  const m = new Map();
  for (const p of products) {
    const c = String(p.category || "").trim();
    if (!c) continue;
    const e = m.get(c.toLowerCase()) || { name: c, count: 0, image: null };
    e.count++; e.image ||= p.image_url; m.set(c.toLowerCase(), e);
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
}
const priceLabel = (p) => {
  const prices = (p.variants || []).map((v) => v.price_cents ?? p.price_cents);
  return `${prices.length && new Set(prices).size > 1 ? "From " : ""}${money(Math.min(p.price_cents, ...prices), p.currency)}`;
};
const img = (src, alt, extra = "") => (src ? `<img src="${esc(src)}" alt="${esc(alt)}"${extra}>` : `<div class="noimg"></div>`);

/* ---------- the frame every page shares ---------- */
function shell({ title, description, store, image, body, canonical, cats = [], facts = null, current = null }) {
  const t = themeOf(store._theme || store.theme);
  const preview = Boolean(store._theme);
  const module = CATEGORY_REGISTRY.get(t.id);
  const demo = Boolean(store._themeDemo);
  const notes = facts?.notes || [store.announcement || "Secure checkout with Stripe"];
  const ann = t.announce === "marquee"
    ? `<div class="ann mq" aria-label="${esc(notes.join(". "))}"><div class="trk" aria-hidden="true">${[0, 1].map(() => notes.concat(notes).map((n) => `<span>${esc(n)}</span><i>✦</i>`).join("")).join("")}</div></div>`
    : `<div class="ann">${esc(notes[0])}</div>`;
  const nav = [`<a href="${esc(base(store))}/#shop"${current === "all" ? ' aria-current="page"' : ""}>Shop all</a>`,
    ...cats.slice(0, 3).map((c) => `<a href="${esc(catHref(store, c.name))}"${current === c.name ? ' aria-current="page"' : ""}>${esc(c.name)}</a>`),
    store.about ? `<a href="${esc(base(store))}/#about">About</a>` : ""].join("");
  const year = new Date().getFullYear();
  const ship = facts?.ship || shipping(store);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">${preview || demo ? `<meta name="robots" content="noindex">` : ""}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ""}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="${t.c.bg}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${esc(fontsUrl(t))}">
<style>${themeCss(t)}${module ? CATEGORY_CSS + CATEGORY_BASE_CSS + module.css : CSS}</style></head><body class="${bodyClass(t)}">
${demo ? `<div class="pv" role="note">Illustrative ${esc(t.name)} theme demo — photos, products and prices are examples, not a live seller store. <a href="/themes" style="color:inherit">Browse all themes</a></div>` : ""}${preview ? `<div class="pv" role="note">${store._draftPreview ? "Private draft preview — your cover, words and motion are not live. Product links open your currently applied store." : `Previewing the ${esc(t.name)} look. Buyers still see your current look until you choose this one in the app.`}</div>` : ""}${ann}
<header class="hd"><div class="wrap"><a class="brand" href="${esc(home(store))}">${esc(store.store_name)}</a><nav class="nav" aria-label="Shop">${nav}</nav>
<div class="acts"><a class="cart" href="${esc(base(store))}/cart" aria-label="Cart">${ICON.bag}<b data-cart-count></b></a></div></div></header>
${CART_JS(store.store_slug)}<main>${body}</main>
<footer class="ft"><div class="wrap top"><div><a class="brand" href="${esc(home(store))}">${esc(store.store_name)}</a>${store.tagline ? `<p>${esc(store.tagline)}</p>` : ""}</div>
<nav aria-label="Shop links"><h4>Shop</h4><a href="${esc(base(store))}/#shop">All products</a>${cats.slice(0, 5).map((c) => `<a href="${esc(catHref(store, c.name))}">${esc(c.name)}</a>`).join("")}</nav>
<nav aria-label="Help"><h4>Help</h4><a href="${esc(base(store))}/cart">Your cart</a>${store.about ? `<a href="${esc(base(store))}/#about">About us</a>` : ""}${facts?.physical !== false ? `<span>${esc(ship.title)}</span>${ship.where ? `<span>${esc(ship.where)}</span>` : ""}` : ""}<span>Secure checkout by Stripe</span></nav></div>
<div class="wrap bot"><span>© ${year} ${esc(store.store_name)}</span><span>Made with Snapfront</span></div></footer>
${module ? `<script>(function(){var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;document.querySelectorAll("[data-hero-motion-control]").forEach(function(btn){var hero=btn.closest(".hero");if(!hero||reduce)return;btn.addEventListener("click",function(){var paused=hero.classList.toggle("is-motion-paused");btn.setAttribute("aria-pressed",String(paused));btn.setAttribute("aria-label",paused?"Play hero motion":"Pause hero motion");btn.textContent=paused?"Play motion":"Pause motion"})})})();</script>` : `<script>(function(){if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var els=document.querySelectorAll(".sec-h,.pc,.cat-c,.cat-t,.perk,.feat .pic,.feat .txt,.story .pic,.story .txt,.rev,.lk,.strip a");
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});
els.forEach(function(el){var sib=el.parentElement?Array.prototype.indexOf.call(el.parentElement.children,el):0;el.style.setProperty("--d",Math.min(sib,6)*0.07+"s");el.classList.add("rv");io.observe(el)});
var hero=document.querySelector(".h-ov>img");if(hero){var tick=false;addEventListener("scroll",function(){if(tick)return;tick=true;requestAnimationFrame(function(){hero.style.transform="translateY("+Math.min(scrollY*0.25,200)+"px) scale(1.06)";tick=false})},{passive:true})}})();</script>`}
${preview && !store._draftPreview ? `<script>document.querySelectorAll('a[href^="/"]').forEach(function(a){var u=new URL(a.href);u.searchParams.set("theme",${JSON.stringify(t.id)});a.href=u.pathname+u.search+u.hash})</script>` : ""}</body></html>`;
}

/* ---------- sections ---------- */
const stars = (avg) => `<span class="stars" aria-label="${avg} out of 5 stars">${[1, 2, 3, 4, 5].map((i) => `<i class="${avg >= i - 0.25 ? "on" : avg >= i - 0.75 ? "half" : ""}">★</i>`).join("")}</span>`;
function card(store, p) {
  const r = store._ratings?.get(p.id);
  const category = CATEGORY_REGISTRY.has(store._theme || store.theme);
  return `<a class="pc${category ? " product-card" : ""}" href="${esc(base(store))}/${esc(p.slug)}"><div class="im${category ? " product-image" : ""}">${img(p.image_url, p.alt_text || p.title, ' loading="lazy"')}
${!p.in_stock ? `<span class="tag out">Sold out</span>` : p.label ? `<span class="tag">${esc(p.label)}</span>` : p.kind === "digital" ? `<span class="tag">Digital</span>` : ""}<span class="go" aria-hidden="true">View product</span></div>
<div class="bd"><h3>${esc(p.title)}</h3><span class="pr">${priceLabel(p)}</span>${r ? `<span class="rt">${stars(r.avg)} <small>${r.count}</small></span>` : ""}</div></a>`;
}

function hero(store, t, products) {
  const module = CATEGORY_REGISTRY.get(t.id);
  if (module) return module.hero(categoryContext(store, t, products, categories(products), card));
  const pics = [bannerUrl(store), ...products.map((p) => p.image_url)].filter(Boolean);
  const head = store.tagline || store.store_name;
  const long = head.length > (t.hero === "type" ? 26 : 56);
  const sub = store.tagline ? (store.about ? store.about.split(/(?<=[.!?])\s/)[0].slice(0, 180) : "") : "";
  const ctas = `<div class="ctas"><a class="btn" href="#shop">Shop now</a>${store.about ? `<a class="btn ghost" href="#about">Our story</a>` : ""}</div>`;
  const txt = (h = "h1") => `<div class="txt"><${h}${long ? ' class="long"' : ""}>${esc(head)}</${h}>${sub ? `<p class="sub">${esc(sub)}</p>` : ""}${ctas}</div>`;
  const alt = `${store.store_name}`;
  let kind = t.hero;
  if (!pics.length) kind = t.hero === "type" ? "type" : "plain";
  else if (kind === "collage" && pics.length < 2) kind = "editorial";
  switch (kind) {
    case "overlay": return `<section class="hero h-ov ${t.heroAlign === "center" ? "center" : ""}">${img(pics[0], alt, ' fetchpriority="high"')}<div class="wrap">${txt()}</div></section>`;
    case "split": return `<section class="hero h-sp">${txt()}<div class="pic">${img(pics[0], alt, ' fetchpriority="high"')}</div></section>`;
    case "collage": return `<section class="hero h-co"><div class="wrap">${txt()}<div class="pics${pics.length === 2 ? " n2" : ""}">${pics.slice(0, 3).map((u, i) => img(u, i ? "" : alt, i ? ' loading="lazy"' : "")).join("")}</div></div></section>`;
    case "editorial": return `<section class="hero h-ed"><div class="wrap">${txt()}<div class="pic">${img(pics[0], alt, ' fetchpriority="high"')}</div></div></section>`;
    case "spotlight": return `<section class="hero h-spot"><div class="wrap">${txt()}<div class="pic">${img(products.find((p) => p.image_url)?.image_url || pics[0], alt, ' fetchpriority="high"')}</div></div></section>`;
    case "type": return `<section class="hero h-ty"><div class="wrap"><h1${long ? ' class="long"' : ""}>${esc(head)}</h1><div class="row">${sub ? `<p class="sub">${esc(sub)}</p>` : `<span></span>`}${ctas}</div></div>
${products.length ? `<div class="strip">${products.slice(0, 8).map((p) => `<a href="${esc(base(store))}/${esc(p.slug)}">${img(p.image_url, p.alt_text || p.title, ' loading="lazy"')}<span><span>${esc(p.title)}</span><span>${priceLabel(p)}</span></span></a>`).join("")}</div>` : ""}</section>`;
    default: return `<section class="hero h-plain"><div class="wrap">${txt()}</div></section>`;
  }
}

function catsSection(store, t, cats) {
  if (cats.length < 2 || t.cats === "pill") return "";
  const body = t.cats === "tile"
    ? `<div class="cats-t">${cats.slice(0, 4).map((c) => `<a class="cat-t" href="${esc(catHref(store, c.name))}">${c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : ""}<span>${esc(c.name)}<small>${c.count} ${c.count === 1 ? "product" : "products"}</small></span></a>`).join("")}</div>`
    : `<div class="cats-c">${cats.slice(0, 8).map((c) => `<a class="cat-c" href="${esc(catHref(store, c.name))}">${img(c.image, "", ' loading="lazy"')}<span>${esc(c.name)}</span></a>`).join("")}</div>`;
  return `<section class="sec tight"><div class="wrap"><div class="sec-h"><h2>Shop by category</h2></div>${body}</div></section>`;
}

const chips = (store, cats, current) => (cats.length < 2 ? "" : `<nav class="chips" aria-label="Categories"><a class="chip" href="${esc(base(store))}/#shop"${!current ? ' aria-current="page"' : ""}>All</a>${cats.map((c) =>
  `<a class="chip" href="${esc(catHref(store, c.name))}"${current === c.name ? ' aria-current="page"' : ""}>${esc(c.name)}</a>`).join("")}</nav>`);

export function storePage(store, products, baseUrl, { category } = {}) {
  const t = themeOf(store._theme || store.theme);
  if (store.id) store = { ...store, _ratings: ratingsBySeller(store.id) };
  const cats = categories(products);
  const module = CATEGORY_REGISTRY.get(t.id);
  const facts = storeFacts(store, products);
  const current = category ? cats.find((c) => c.name.toLowerCase() === String(category).toLowerCase())?.name : null;
  const shown = current ? products.filter((p) => String(p.category || "").trim().toLowerCase() === current.toLowerCase()) : products;
  const grid = shown.length ? `<div class="grid">${shown.map((p) => card(store, p)).join("")}</div>` : `<div class="empty">New products are on the way. Check back soon.</div>`;
  const meta = { title: current ? `${current} · ${store.store_name}` : store.store_name, description: store.tagline || store.about || `Shop ${store.store_name}`, store, cats, facts,
    image: bannerUrl(store) || products[0]?.image_url, canonical: storeUrl(store.store_slug) };
  if (current) {
    return shell({ ...meta, current, body: `<div class="wrap"><section class="pagehead"><h1>${esc(current)}</h1><p>${shown.length} ${shown.length === 1 ? "product" : "products"}</p></section>
<section id="shop" class="sec tight">${cats.length > 1 ? `<div class="sec-h">${chips(store, cats, current)}</div>` : ""}${grid}</section></div>` });
  }
  const feat = products.length >= 4 ? products.find((p) => p.image_url && p.in_stock) : null;
  const band = t.band ? `<div class="band" aria-hidden="true"><div class="trk">${[0, 1].map(() => [store.tagline || store.store_name, store.store_name, facts.perks[0][1]].concat([store.tagline || store.store_name, store.store_name, facts.perks[0][1]])
    .map((x) => `<span>${esc(x)}</span><i>✦</i>`).join("")).join("")}</div></div>` : "";
  const aboutPic = bannerUrl(store) && t.hero !== "overlay" && t.hero !== "split" && t.hero !== "editorial" ? bannerUrl(store) : (products[1] || products[0])?.image_url;
  const shopHeading = t.collection === "premium" ? (t.copy?.collection || "Shop all") : (products.length > 8 ? "Latest arrivals" : "Shop all");
  const body = `${hero(store, t, products)}
<section class="perks" aria-label="Why shop here"><div class="wrap">${facts.perks.map(([i, b, s]) => `<div class="perk">${i}<div><b>${esc(b)}</b><span>${esc(s)}</span></div></div>`).join("")}</div></section>
${module ? module.discovery(categoryContext(store, t, products, cats, card)) : catsSection(store, t, cats).replace('class="sec tight"', 'class="sec"')}
<section id="shop" class="sec${cats.length >= 2 && t.cats !== "pill" ? " tight" : ""}"><div class="wrap"><div class="sec-h"><h2>${esc(shopHeading)}</h2>${chips(store, cats, null)}</div>${grid}</div></section>
${feat ? `<section class="sec feat"><div class="wrap"><div class="pic">${img(feat.image_url, feat.alt_text || feat.title, ' loading="lazy"')}</div><div class="txt">${feat.category ? `<span class="kick">${esc(feat.category)}</span>` : ""}<h2>${esc(feat.title)}</h2>
${feat.tagline ? `<p class="tl">${esc(feat.tagline)}</p>` : ""}<div class="price">${priceLabel(feat)}</div><a class="btn" href="${esc(base(store))}/${esc(feat.slug)}">Shop now</a></div></div></section>` : ""}
${band}
${store.about ? `<section id="about" class="sec story${aboutPic ? "" : " solo"}"><div class="wrap">${aboutPic ? `<div class="pic">${img(aboutPic, "", ' loading="lazy"')}</div>` : ""}<div class="txt"><h2>About ${esc(store.store_name)}</h2><p>${esc(store.about)}</p></div></div></section>` : ""}`;
  return shell({ ...meta, current: null, body });
}

export function productPage(store, p, baseUrl, others = []) {
  const sellable = p.status === "live" && store.stripe_ready;
  const cats = categories([p, ...others]);
  const facts = storeFacts(store, [p, ...others]);
  const variants = p.variants || [];
  const firstAvail = variants.find((v) => v.inventory == null || v.inventory > 0);
  const startPrice = firstAvail?.price_cents ?? variants[0]?.price_cents ?? p.price_cents;
  const opts = variants.length ? `<fieldset><legend>${esc(p.option_name || "Option")}</legend><div class="opts">${variants.map((v) => {
    const out = v.inventory != null && v.inventory <= 0;
    return `<label><input type="radio" name="variant" value="${esc(v.id)}" data-price="${v.price_cents ?? p.price_cents}" data-stock="${v.inventory ?? ""}" data-name="${esc(v.name)}"${out ? " disabled" : ""}${v === firstAvail ? " checked" : ""}><span>${esc(v.name)}${out ? " (sold out)" : ""}</span></label>`;
  }).join("")}</div></fieldset>` : "";
  const qty = p.kind === "physical" ? `<div class="qty" role="group" aria-label="Quantity"><button type="button" data-q="-1" aria-label="Fewer">−</button><output id="q" aria-live="polite">1</output><button type="button" data-q="1" aria-label="More">+</button></div>` : "";
  const buy = !sellable ? `<span class="buy off">Available soon</span>`
    : !p.in_stock ? `<span class="buy off">Sold out</span>`
    : `<div class="actions">${qty}<button class="buy" type="button" id="add">Add to cart</button></div><button class="buy alt" type="button" id="now">Buy it now</button>`;
  const item = { product_id: p.id, title: p.title, kind: p.kind, image: p.image_url || "", unit: p.price_cents, inventory: p.inventory };
  const script = sellable && p.in_stock ? `<script>(function(){var P=${JSON.stringify(item).replace(/</g, "\\u003c")},OPT=${JSON.stringify(p.option_name || "Option").replace(/</g, "\\u003c")},q=1,cur=${JSON.stringify(p.currency)};
var fmt=function(c){return new Intl.NumberFormat("en-US",{style:"currency",currency:cur.toUpperCase()}).format(c/100)};
function sel(){return document.querySelector('input[name=variant]:checked')}
function limit(){var v=sel();var s=v?v.dataset.stock:(P.inventory==null?"":String(P.inventory));return s===""?20:Math.min(20,Number(s))}
function sync(){var v=sel();document.getElementById("price").textContent=fmt(v?Number(v.dataset.price):P.unit);q=Math.min(q,limit());var o=document.getElementById("q");if(o)o.textContent=q;
var st=document.getElementById("stock"),l=v?v.dataset.stock:(P.inventory==null?"":String(P.inventory));st.textContent=l!==""&&Number(l)<=5?"Only "+l+" left":"";st.className="stock"+(l!==""&&Number(l)<=5?" low":"")}
document.querySelectorAll("input[name=variant]").forEach(function(r){r.addEventListener("change",sync)});
document.querySelectorAll("[data-q]").forEach(function(b){b.addEventListener("click",function(){q=Math.max(1,Math.min(limit(),q+Number(b.dataset.q)));sync()})});
function add(){var v=sel();sfCart.add({product_id:P.id||P.product_id,variant_id:v?v.value:null,variant:v?OPT+": "+v.dataset.name:null,qty:P.kind==="digital"?1:q,title:P.title,kind:P.kind,image:P.image,unit:v?Number(v.dataset.price):P.unit})}
document.getElementById("add").addEventListener("click",function(){add();var t=document.getElementById("toast");t.hidden=false;clearTimeout(t._h);t._h=setTimeout(function(){t.hidden=true},4000)});
document.getElementById("now").addEventListener("click",function(){add();location.href="${esc(base(store))}/cart"});sync()})();</script>` : "";
  const rv = p.id ? reviewsFor(p.id) : { count: 0, list: [] };
  if (store.id) store = { ...store, _ratings: ratingsBySeller(store.id) };
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: p.title, description: p.seo_description || p.tagline, image: p.image_url || undefined, sku: p.sku || undefined,
    ...(rv.count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rv.avg, reviewCount: rv.count } } : {}),
    offers: { "@type": "Offer", price: (startPrice / 100).toFixed(2), priceCurrency: p.currency.toUpperCase(), availability: `https://schema.org/${p.in_stock ? "InStock" : "OutOfStock"}`, url: storeUrl(store.store_slug, `/${p.slug}`) } };
  const reviewsHtml = rv.count ? `<section class="sec tight" id="reviews"><div class="wrap"><div class="sec-h"><h2>Reviews</h2><span class="rt big">${stars(rv.avg)} ${rv.avg} · ${rv.count} ${rv.count === 1 ? "review" : "reviews"}</span></div>
<div class="revs">${rv.list.map((r) => `<figure class="rev">${stars(r.rating)}${r.body ? `<blockquote>${esc(r.body)}</blockquote>` : ""}<figcaption>${esc(r.name)} · Verified buyer</figcaption></figure>`).join("")}</div></div></section>` : "";
  const mini = [p.kind === "digital" ? [ICON.download, "Instant download after you pay"] : [ICON.truck, `${facts.ship.title}${facts.ship.where ? `. ${facts.ship.where}.` : ""}`], [ICON.lock, "Secure checkout by Stripe"]];
  const related = others.filter((o) => o.id !== p.id).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 4);
  return shell({
    title: `${p.title} · ${store.store_name}`, description: p.seo_description || p.tagline, store, image: p.image_url, cats, facts,
    canonical: storeUrl(store.store_slug, `/${p.slug}`),
    body: `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="${esc(home(store))}">Home</a><span>/</span>${p.category ? `<a href="${esc(catHref(store, p.category))}">${esc(p.category)}</a><span>/</span>` : ""}<span aria-current="page">${esc(p.title)}</span></nav>
<article class="pd"><div class="media"><div class="pic">${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.alt_text || p.title)}" fetchpriority="high">` : ""}${p.label && p.in_stock ? `<span class="tag">${esc(p.label)}</span>` : ""}</div>${isAiImage(p.image_file) ? `<p class="fine ai">Photo created with AI. The product is shown as sold.</p>` : ""}</div>
<div class="info"><div class="cat">${p.kind === "digital" ? "Digital download" : esc(p.category || store.store_name)}</div><h1>${esc(p.title)}</h1>${rv.count ? `<a class="rt" href="#reviews">${stars(rv.avg)} ${rv.avg} (${rv.count})</a>` : ""}
<div class="price" id="price">${money(startPrice, p.currency)}</div>${p.tagline ? `<p class="tl">${esc(p.tagline)}</p>` : ""}${opts}${buy}<div id="stock" class="stock" aria-live="polite"></div>
<div class="mini">${mini.map(([i, t]) => `<div>${i}<span>${esc(t)}</span></div>`).join("")}</div>
${p.description ? `<div class="desc">${String(p.description).split(/\n\s*\n/).filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
${p.bullets.length ? `<ul class="b">${p.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
<div>${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}${p.kind === "physical" ? `<details><summary>Shipping</summary><p>${esc(facts.ship.title)}.${facts.ship.where ? ` ${esc(facts.ship.where)}.` : ""} You'll see the shipping cost before you pay.</p></details>` : ""}</div>
${p.tags.length ? `<div class="tags">${p.tags.map((t) => `<span>#${esc(t)}</span>`).join("")}</div>` : ""}</div></article></div>
${related.length ? `<section class="sec feat"><div class="wrap" style="display:block"><div class="sec-h"><h2>You may also like</h2><a class="more" href="${esc(base(store))}/#shop">Shop all</a></div><div class="grid">${related.map((o) => card(store, o)).join("")}</div></div></section>` : ""}
${reviewsHtml}
<div class="toast" id="toast" role="status" hidden>Added to your cart <a href="${esc(base(store))}/cart">View cart</a></div>${script}`,
  });
}

// Cart lives in the buyer's browser (per store). Only ids and quantities are trusted by the server.
const CART_JS = (slug) => `<script>
(function(){var K="sf_cart_${slug}";
function read(){try{return JSON.parse(localStorage.getItem(K))||[]}catch(e){return[]}}
function write(c){try{localStorage.setItem(K,JSON.stringify(c))}catch(e){}badge()}
function badge(){var n=read().reduce(function(s,l){return s+l.qty},0);document.querySelectorAll("[data-cart-count]").forEach(function(b){b.textContent=n?String(n):""})}
window.sfCart={read:read,write:write,add:function(item){var c=read(),k=item.product_id+":"+(item.variant_id||"");var f=c.find(function(l){return l.product_id+":"+(l.variant_id||"")===k});
if(f){f.qty=item.kind==="digital"?1:Math.min(20,f.qty+item.qty)}else c.push(item);write(c)}};badge();})();</script>`;

export function cartPage(store, baseUrl) {
  const slug = esc(store.store_slug);
  return shell({
    title: `Your cart · ${store.store_name}`, description: `Your cart at ${store.store_name}`, store, canonical: storeUrl(store.store_slug, "/cart"),
    body: `<div class="wrap page"><section class="pagehead"><h1>Your cart</h1></section>
<div id="empty" hidden><p>Your cart is empty.</p><p><a class="buy" href="${esc(base(store) || "/")}">Keep shopping</a></p></div>
<div class="cartw" id="full" hidden><div class="lines" id="lines"></div>
<aside class="sum" aria-labelledby="sumh"><h2 id="sumh">Order summary</h2>
<div class="row"><span>Subtotal</span><span id="sub"></span></div>
<div class="row" id="discrow" hidden><span id="disclabel">Discount</span><span id="disc"></span></div>
<div class="row" id="shiprow" hidden><span>Shipping</span><span id="ship"></span></div>
<div class="row t"><span>Total</span><span id="tot"></span></div><p class="fine" id="taxnote" hidden></p>
<form class="code" id="codef"><label for="code" class="fine" style="position:absolute;left:-9999px">Discount code</label><input id="code" placeholder="Discount code" autocomplete="off" maxlength="32"><button type="submit">Apply</button></form>
<p id="msg" role="status" class="fine" hidden></p>
<button class="buy" type="button" id="go">Check out</button><p class="fine">You'll pay on Stripe's secure checkout.</p></aside></div>
</div><script>(function(){var S="${esc(base(store))}",code="",fmt=function(d){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(d)};
try{code=sessionStorage.getItem("sf_code_${slug}")||""}catch(e){}document.getElementById("code").value=code;
function msg(t,ok){var m=document.getElementById("msg");m.hidden=!t;m.textContent=t||"";m.className=ok?"ok":"err"}
function items(){return sfCart.read().map(function(l){return{product_id:l.product_id,variant_id:l.variant_id,qty:l.qty}})}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function draw(){var c=sfCart.read();document.getElementById("empty").hidden=c.length>0;document.getElementById("full").hidden=!c.length;var L=document.getElementById("lines");L.textContent="";
c.forEach(function(l,i){var row=el("div","line");if(l.image){var im=el("img");im.src=l.image;im.alt="";row.appendChild(im)}else row.appendChild(el("div","noimg"));
var mid=el("div");mid.appendChild(el("h3",null,l.title));if(l.variant)mid.appendChild(el("div","v",l.variant));if(l.kind==="digital")mid.appendChild(el("div","v","Digital download"));row.appendChild(mid);
var r=el("div","r");r.appendChild(el("strong",null,fmt(l.unit*l.qty/100)));
if(l.kind!=="digital"){var q=el("div","qty");q.setAttribute("role","group");q.setAttribute("aria-label","Quantity for "+l.title);
[["−",-1,"Fewer"],[null],["+",1,"More"]].forEach(function(b){if(!b[0]){q.appendChild(el("output",null,String(l.qty)));return}var bt=el("button",null,b[0]);bt.type="button";bt.setAttribute("aria-label",b[2]);
bt.onclick=function(){var cc=sfCart.read();cc[i].qty=Math.max(1,Math.min(20,cc[i].qty+b[1]));sfCart.write(cc);draw()};q.appendChild(bt)});r.appendChild(q)}
var rm=el("button","rm","Remove");rm.type="button";rm.onclick=function(){var cc=sfCart.read();cc.splice(i,1);sfCart.write(cc);draw()};r.appendChild(rm);row.appendChild(r);L.appendChild(row)});
if(c.length)quote()}
function quote(){fetch(S+"/cart/quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:items(),code:code})}).then(function(r){return r.json().then(function(j){return[r.ok,j]})}).then(function(x){var ok=x[0],q=x[1];
document.getElementById("go").disabled=!ok;if(!ok){msg(q.error||"Something went wrong.");if(code&&/code/i.test(q.error||"")){code="";try{sessionStorage.removeItem("sf_code_${slug}")}catch(e){};setTimeout(quote,1200)}return}
document.getElementById("sub").textContent=fmt(q.subtotal);document.getElementById("discrow").hidden=!q.discount;document.getElementById("disc").textContent="−"+fmt(q.discount);document.getElementById("disclabel").textContent=q.discount_label?"Discount ("+q.discount_label+")":"Discount";
var ph=q.lines.some(function(l){return l.kind==="physical"});document.getElementById("shiprow").hidden=!ph;document.getElementById("ship").textContent=q.shipping?fmt(q.shipping):"Free";
document.getElementById("tot").textContent=fmt(q.total_before_tax);var tn=document.getElementById("taxnote");tn.hidden=!q.tax_note;tn.textContent=q.tax_note||"";
var cc=sfCart.read();q.lines.forEach(function(l){var f=cc.find(function(c){return c.product_id===l.product_id&&(c.variant_id||null)===(l.variant_id||null)});if(f){f.unit=l.unit_cents;f.title=l.title}});sfCart.write(cc);
if(code&&q.discount)msg("Code applied: "+q.discount_label,true);else if(!code)msg("")}).catch(function(){msg("Couldn't reach the store. Check your connection.")})}
document.getElementById("codef").addEventListener("submit",function(e){e.preventDefault();code=document.getElementById("code").value.trim().toUpperCase();try{sessionStorage.setItem("sf_code_${slug}",code)}catch(x){}quote()});
document.getElementById("go").addEventListener("click",function(){var b=this;b.disabled=true;b.textContent="Opening checkout…";
fetch(S+"/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:items(),code:code})}).then(function(r){return r.json().then(function(j){return[r.ok,j]})}).then(function(x){
if(x[0]&&x[1].url){location.href=x[1].url;return}msg(x[1].error||"Checkout couldn't start.");b.disabled=false;b.textContent="Check out"}).catch(function(){msg("Couldn't reach the store.");b.disabled=false;b.textContent="Check out"})});
draw()})();</script>`,
  });
}

export function orderPage(store, o, downloads) {
  const pending = o.status === "pending";
  const rows = o.items.map((l) => `<div class="row"><span>${esc(l.title)}${l.variant ? ` (${esc(l.variant)})` : ""}${l.qty > 1 ? ` × ${l.qty}` : ""}</span><span>${money(Math.round(l.unit * 100) * l.qty)}</span></div>`).join("");
  const money$ = (d) => money(Math.round(d * 100));
  const body = o.status === "canceled"
    ? `<h1>Payment didn't go through</h1><p>Your order wasn't charged. <a href="${esc(base(store))}/cart">Return to your cart</a> to try again.</p>`
    : `<h1>${pending ? "Almost there" : "Thank you!"}</h1>
<p>${pending ? "We're waiting for Stripe to confirm your payment. This page refreshes on its own." : `Your order is confirmed${o.email ? ` and a receipt is on its way to <strong>${esc(o.email)}</strong>` : ""}.`}</p>
${!pending && o.status !== "canceled" && o._reviewToken ? `<p><a href="${esc(base(store))}/review?t=${esc(o._reviewToken)}">Leave a review</a> when it arrives. It helps a small shop a lot.</p>` : ""}
${downloads.length ? `<div class="dl">${downloads.map((d) => `<a class="buy" href="${esc(d.url)}">Download ${esc(d.title)}</a>`).join("")}<p class="fine">Download links work for 7 days. Bookmark this page to get fresh ones.</p></div>` : ""}
${o.items.some((l) => l.kind === "physical") && !pending ? `<p>${o.status === "fulfilled" ? "Your order has shipped." : `${esc(store.store_name)} will ship your order soon.`}${o.tracking ? ` Tracking number: <a href="${esc(o.tracking.url)}" rel="noopener">${esc(o.tracking.number)}</a>${o.tracking.carrier ? ` (${esc(o.tracking.carrier)})` : ""}.` : ""}</p>` : ""}
<div class="sum" style="position:static">${rows}
<div class="row"><span>Subtotal</span><span>${money$(o.subtotal)}</span></div>
${o.discount ? `<div class="row"><span>Discount${o.discount_code ? ` (${esc(o.discount_code)})` : ""}</span><span>−${money$(o.discount)}</span></div>` : ""}
${o.shipping || o.items.some((l) => l.kind === "physical") ? `<div class="row"><span>Shipping</span><span>${o.shipping ? money$(o.shipping) : "Free"}</span></div>` : ""}
${o.tax ? `<div class="row"><span>Tax</span><span>${money$(o.tax)}</span></div>` : ""}
<div class="row t"><span>Total</span><span>${money$(o.total)}</span></div><p class="fine">Order ${esc(o.id)}</p></div>`;
  const clear = !pending && o.status !== "canceled" ? `<script>sfCart.write([]);try{sessionStorage.removeItem("sf_code_${esc(store.store_slug)}")}catch(e){}</script>` : "";
  return shell({ title: pending ? "Confirming payment" : "Thank you", description: `Your order from ${store.store_name}`, store,
    body: `${pending ? `<meta http-equiv="refresh" content="4">` : ""}<div class="wrap page"><div class="order">${body}</div></div>${clear}` });
}

/** Stripe's embedded tax settings + registrations components, opened from the app. */
export function taxSetupPage(store, token, publishableKey) {
  return shell({
    title: "Set up sales tax", description: "Sales tax setup", store,
    body: `<div class="wrap page"><div class="order" style="max-width:760px"><h1>Set up sales tax</h1>
<p>Stripe works out the right tax for each order from your business address and the places you're registered to collect tax. Add both below, then go back to Snapfront and turn on automatic sales tax.</p>
<p class="fine">Not sure where you're registered? Your accountant or state tax agency can tell you. In the US you usually register in your home state first.</p>
<h2 style="font-size:22px">1. Business address</h2><div id="settings"><p class="fine" id="l1">Loading…</p></div>
<h2 style="font-size:22px">2. Where you collect tax</h2><div id="regs"><p class="fine" id="l2">Loading…</p></div>
<p class="err" id="err" hidden></p><p class="fine">When you're done, close this page and return to the app.</p></div>
<script src="https://connect-js.stripe.com/v1.0/connect.js" async></script>
<script>window.StripeConnect=window.StripeConnect||{};StripeConnect.onLoad=function(){
var T=${JSON.stringify(token)};function fail(m){var e=document.getElementById("err");e.hidden=false;e.textContent=m}
var sc=StripeConnect.init({publishableKey:${JSON.stringify(publishableKey)},fetchClientSecret:function(){return fetch("/stripe/tax/session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({t:T})}).then(function(r){return r.json().then(function(j){if(!r.ok){fail(j.error||"Couldn't start tax setup.");return undefined}return j.client_secret})})},
appearance:{variables:{colorPrimary:${JSON.stringify(themeOf(store.theme).c.accent)},fontFamily:${JSON.stringify(themeOf(store.theme).fonts.body[0] + ", system-ui, sans-serif")},borderRadius:"10px"}},fonts:[{cssSrc:${JSON.stringify(fontsUrl(themeOf(store.theme)))}}]});
[["tax-settings","settings","l1"],["tax-registrations","regs","l2"]].forEach(function(c){var el=sc.create(c[0]);el.setOnLoaderStart&&el.setOnLoaderStart(function(){var l=document.getElementById(c[2]);l&&l.remove()});
el.setOnLoadError&&el.setOnLoadError(function(e){fail("Stripe couldn't load this section: "+(e.error&&e.error.message||"try again."))});document.getElementById(c[1]).appendChild(el)})};</script></div>`,
  });
}

/** Link-in-bio: one page for Instagram and TikTok bios. */
export function linksPage(store, products, links) {
  const btn = (href, label, cls = "") => `<a class="lk ${cls}" href="${esc(href)}"${/^https?:/.test(href) ? ' rel="noopener" target="_blank"' : ""}>${esc(label)}</a>`;
  return shell({ title: `${store.store_name} · Links`, description: store.tagline || `Shop ${store.store_name}`, store, canonical: storeUrl(store.store_slug, "/links"),
    body: `<div class="wrap links"><header>${store.banner_file ? `<img class="av" src="${esc(`${config.publicUrl}/img/${store.banner_file}`)}" alt="">` : ""}<h1>${esc(store.store_name)}</h1>${store.tagline ? `<p>${esc(store.tagline)}</p>` : ""}</header>
${btn(`${home(store)}?utm_source=bio`, "Shop the store", "main")}
${products.map((p) => `<a class="lk prod" href="${esc(base(store))}/${esc(p.slug)}?utm_source=bio">${img(p.image_url, "", ' loading="lazy"')}<span>${esc(p.title)}</span><b>${priceLabel(p)}</b></a>`).join("")}
${links.map((l) => btn(l.url, l.label)).join("")}</div>` });
}

/** Review form for a buyer, from the link in their order page or email. */
export function reviewPage(store, token, items, done) {
  const open = items.filter((i) => !i.reviewed);
  const form = (i) => `<form class="revf" method="post" action="${esc(base(store))}/review"><input type="hidden" name="t" value="${esc(token)}"><input type="hidden" name="product_id" value="${esc(i.product_id)}">
<h2>${esc(i.title)}</h2><fieldset class="starpick"><legend>Your rating</legend>${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="s${n}-${esc(i.product_id)}" name="rating" value="${n}" required><label for="s${n}-${esc(i.product_id)}" title="${n} star${n > 1 ? "s" : ""}">★</label>`).join("")}</fieldset>
<label>What did you think? <textarea name="body" rows="4" maxlength="1000" placeholder="How was the quality, the fit, the delivery?"></textarea></label>
<label>Your first name <input name="name" maxlength="40" autocomplete="given-name" placeholder="Shown with your review"></label><button class="btn" type="submit">Post review</button></form>`;
  return shell({ title: `Review · ${store.store_name}`, description: `Review your order from ${store.store_name}`, store,
    body: `<div class="wrap page"><div class="order">${done ? `<p class="ok">Thank you! Your review is posted.</p>` : ""}<h1>${open.length ? "How was your order?" : "Thanks for your reviews"}</h1>
${open.length ? open.map(form).join("") : `<p>You've reviewed everything in this order. <a href="${esc(home(store))}">Back to the store</a></p>`}</div></div>` });
}

export function notePage(store, title, html) {
  return shell({ title, description: title, store, body: `<div class="wrap"><div class="note">${html}</div></div>` });
}
export { esc, money };
