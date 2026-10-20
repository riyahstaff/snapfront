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
import { storefrontMediaSlots, storefrontPreviewMediaSlots } from "./storefront-media.js";
import { headTags as pixelTags } from "./pixels.js";
import { signupBox } from "./audience.js";
import { programLive } from "./affiliates.js";

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
  return `${prices.length && new Set(prices).size > 1 ? "From " : ""}${money(Math.min(p.price_cents, ...prices), p.currency)}${p.billing_interval ? ` / ${p.billing_interval}` : ""}`;
};
/** The crossed-out original price and "Save N%", when the seller set one above what's charged now. */
const savePct = (was, now) => Math.floor((1 - now / was) * 100);
const wasPrice = (p, now, keep = false) => {
  const was = Number(p.compare_at_cents) || 0;
  if (!was || (!keep && !(was > now))) return "";
  const pct = savePct(was, now);
  return ` <s class="pwas"><span class="vh">Original price </span>${money(was, p.currency)}</s>${pct >= 1 || keep ? ` <span class="psave"${pct >= 1 ? "" : " hidden"}>Save ${pct}%</span>` : ""}`;
};
// Added only to pages that show a sale, so every theme's stylesheet gets it and others are unchanged.
const SALE_CSS = `
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.pwas{font-family:var(--body,inherit);font-size:.62em;font-weight:400;letter-spacing:0;color:var(--muted);text-decoration:line-through;text-decoration-thickness:1px;margin-left:.35em;white-space:nowrap}
.pc .pwas{font-size:.9em}
.psave{display:inline-block;vertical-align:middle;font-family:var(--body,inherit);font-size:12px;font-weight:600;letter-spacing:.01em;line-height:1;padding:4px 7px;border-radius:999px;background:var(--accent);color:var(--on-accent,#fff);margin-left:.4em;white-space:nowrap}
`;
const cardPrice = (p) => {
  const prices = (p.variants || []).map((v) => v.price_cents ?? p.price_cents);
  return priceLabel(p) + wasPrice(p, Math.min(p.price_cents, ...prices));
};
const img = (source, alt, extra = "") => {
  const src = typeof source === "object" && source ? source.url : source;
  const slot = typeof source === "object" && source && source.preview && Number.isInteger(source.index) && source.index >= 0 && source.index <= 2
    ? ` data-sf-photo="${source.index}"` : "";
  return src ? `<img src="${esc(src)}" alt="${esc(alt)}"${slot}${extra}>` : `<div class="noimg"${slot}></div>`;
};

/* ---------- the frame every page shares ---------- */
function shell({ title, description, store, image, body, canonical, cats = [], facts = null, current = null, signup = false }) {
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
<style>${themeCss(t)}${module ? CATEGORY_CSS + CATEGORY_BASE_CSS + module.css : CSS}${store.id ? SIGNUP_CSS : ""}${String(body).includes('class="pwas"') ? SALE_CSS : ""}</style>${pixelTags(store)}</head><body class="${bodyClass(t)}">
${demo ? `<div class="pv" role="note">Illustrative ${esc(t.name)} theme demo — photos, products and prices are examples, not a live seller store. <a href="/themes" style="color:inherit">Browse all themes</a></div>` : ""}${preview ? `<div class="pv" role="note">${store._draftPreview ? "Private draft preview — your cover, words and motion are not live. Product links open your currently applied store." : `Previewing the ${esc(t.name)} look. Buyers still see your current look until you choose this one in the app.`}</div>` : ""}${ann}
<header class="hd"><div class="wrap"><a class="brand" href="${esc(home(store))}">${esc(store.store_name)}</a><nav class="nav" aria-label="Shop">${nav}</nav>
<div class="acts"><a class="cart" href="${esc(base(store))}/cart" aria-label="Cart">${ICON.bag}<b data-cart-count></b></a></div></div></header>
${CART_JS(store.store_slug)}${STORE_JS(store)}<main>${body}</main>
${signup && !preview && !demo ? signupSection(store) : ""}<footer class="ft"><div class="wrap top"><div><a class="brand" href="${esc(home(store))}">${esc(store.store_name)}</a>${store.tagline ? `<p>${esc(store.tagline)}</p>` : ""}</div>
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
  const photo = p._sfPhotoSlot == null ? p.image_url : { url: p.image_url, index: p._sfPhotoSlot, preview: Boolean(store._templatePreview) };
  return `<a class="pc${category ? " product-card" : ""}" href="${esc(base(store))}/${esc(p.slug)}"><div class="im${category ? " product-image" : ""}">${img(photo, p.alt_text || p.title, ' loading="lazy"')}
${!p.in_stock ? `<span class="tag out">Sold out</span>` : p.label ? `<span class="tag">${esc(p.label)}</span>` : p.kind === "digital" ? `<span class="tag">Digital</span>` : ""}<span class="go" aria-hidden="true">View product</span></div>
<div class="bd"><h3>${esc(p.title)}</h3><span class="pr">${cardPrice(p)}</span>${r ? `<span class="rt">${stars(r.avg)} <small>${r.count}</small></span>` : ""}</div></a>`;
}

function hero(store, t, products) {
  const module = CATEGORY_REGISTRY.get(t.id);
  if (module) return module.hero(categoryContext(store, t, products, categories(products), card));
  const pics = store._templatePreview
    ? storefrontPreviewMediaSlots(store, products).map((slot) => ({ ...slot, alt: slot.alt || `${store.store_name}` }))
    : [
      ...storefrontMediaSlots(store).map((slot) => ({ ...slot })),
      ...products.filter((p) => p.image_url).map((p) => ({ url: p.image_url, alt: p.alt_text || p.title })),
    ];
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
<section id="shop" class="sec tight">${cats.length > 1 ? `<div class="sec-h">${chips(store, cats, current)}</div>` : ""}${grid}</section></div>`, signup: true });
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
${feat.tagline ? `<p class="tl">${esc(feat.tagline)}</p>` : ""}<div class="price">${cardPrice(feat)}</div><a class="btn" href="${esc(base(store))}/${esc(feat.slug)}">Shop now</a></div></div></section>` : ""}
${band}
${store.about ? `<section id="about" class="sec story${aboutPic ? "" : " solo"}"><div class="wrap">${aboutPic ? `<div class="pic">${img(aboutPic, "", ' loading="lazy"')}</div>` : ""}<div class="txt"><h2>About ${esc(store.store_name)}</h2><p>${esc(store.about)}</p></div></div></section>` : ""}`;
  return shell({ ...meta, current: null, body, signup: true });
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
    : `<div class="actions">${qty}<button class="buy" type="button" id="add">Add to cart</button></div><button class="buy alt" type="button" id="now">${p.billing_interval ? "Subscribe now" : "Buy it now"}</button>`;
  const item = { product_id: p.id, title: p.title, kind: p.kind, image: p.image_url || "", unit: p.price_cents, billing_interval:p.billing_interval, inventory: p.inventory };
  const script = sellable && p.in_stock ? `<script>(function(){var P=${JSON.stringify(item).replace(/</g, "\\u003c")},OPT=${JSON.stringify(p.option_name || "Option").replace(/</g, "\\u003c")},q=1,cur=${JSON.stringify(p.currency)};
var fmt=function(c){return new Intl.NumberFormat("en-US",{style:"currency",currency:cur.toUpperCase()}).format(c/100)};
function sel(){return document.querySelector('input[name=variant]:checked')}
function limit(){var v=sel();var s=v?v.dataset.stock:(P.inventory==null?"":String(P.inventory));return s===""?20:Math.min(20,Number(s))}
${p.compare_at_cents ? `function was(u){var w=document.getElementById("was"),c=${Number(p.compare_at_cents)},n=Math.floor((1-u/c)*100),b=w.querySelector(".psave");w.hidden=!(c>u);if(b){b.textContent="Save "+n+"%";b.hidden=n<1}}
` : ""}function sync(){var v=sel();${p.compare_at_cents ? "was(v?Number(v.dataset.price):P.unit);" : ""}document.getElementById("price").textContent=fmt(v?Number(v.dataset.price):P.unit)${p.billing_interval ? '+(P.billing_interval?" / "+P.billing_interval:"")' : ""};q=Math.min(q,limit());var o=document.getElementById("q");if(o)o.textContent=q;
var st=document.getElementById("stock"),l=v?v.dataset.stock:(P.inventory==null?"":String(P.inventory));st.textContent=l!==""&&Number(l)<=5?"Only "+l+" left":"";st.className="stock"+(l!==""&&Number(l)<=5?" low":"")}
document.querySelectorAll("input[name=variant]").forEach(function(r){r.addEventListener("change",sync)});
document.querySelectorAll("[data-q]").forEach(function(b){b.addEventListener("click",function(){q=Math.max(1,Math.min(limit(),q+Number(b.dataset.q)));sync()})});
function add(){var v=sel();sfCart.add({product_id:P.id||P.product_id,variant_id:v?v.value:null,variant:v?OPT+": "+v.dataset.name:null,qty:P.kind==="digital"?1:q,title:P.title,kind:P.kind,${p.billing_interval ? "billing_interval:P.billing_interval," : ""}image:P.image,unit:v?Number(v.dataset.price):P.unit})}
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
${p.compare_at_cents ? `<div class="price"><span id="price">${money(startPrice, p.currency)}${p.billing_interval ? ` / ${esc(p.billing_interval)}` : ""}</span><span id="was"${p.compare_at_cents > startPrice ? "" : " hidden"}>${wasPrice(p, startPrice, true)}</span></div>` : `<div class="price" id="price">${money(startPrice, p.currency)}${p.billing_interval ? ` / ${esc(p.billing_interval)}` : ""}</div>`}${p.billing_interval ? `<p class="fine">Renews automatically ${p.billing_interval === "year" ? "yearly" : "monthly"} until canceled. Access lasts through your paid period. Manage or cancel from your order confirmation.</p>` : ""}${p.bundle_items?.length ? `<section aria-label="Included products"><h2>What's included</h2><ul>${p.bundle_items.map((item)=>`<li>${esc(item.title)}</li>`).join("")}</ul></section>` : ""}${p.tagline ? `<p class="tl">${esc(p.tagline)}</p>` : ""}${opts}${buy}<div id="stock" class="stock" aria-live="polite"></div>
<div class="mini">${mini.map(([i, t]) => `<div>${i}<span>${esc(t)}</span></div>`).join("")}</div>
${p.description ? `<div class="desc">${String(p.description).split(/\n\s*\n/).filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
${p.bullets.length ? `<ul class="b">${p.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
<div>${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}${p.kind === "physical" ? `<details><summary>Shipping</summary><p>${esc(facts.ship.title)}.${facts.ship.where ? ` ${esc(facts.ship.where)}.` : ""} You'll see the shipping cost before you pay.</p></details>` : ""}</div>
${p.tags.length ? `<div class="tags">${p.tags.map((t) => `<span>#${esc(t)}</span>`).join("")}</div>` : ""}</div></article></div>
${related.length ? `<section class="sec feat"><div class="wrap" style="display:block"><div class="sec-h"><h2>You may also like</h2><a class="more" href="${esc(base(store))}/#shop">Shop all</a></div><div class="grid">${related.map((o) => card(store, o)).join("")}</div></div></section>` : ""}
${reviewsHtml}
<div class="toast" id="toast" role="status" hidden>Added to your cart <a href="${esc(base(store))}/cart">View cart</a></div>${script}${store.id ? `\n<script>window.sfTrack&&sfTrack("view",${JSON.stringify({ id: p.id, name: p.title, value: startPrice / 100 }).replace(/</g, "\\u003c")})</script>` : ""}`, signup: true,
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

// The email sign-up band above the footer, and the per-store script for it, affiliate links and ad events.
const SIGNUP_CSS = `.sfn{background:var(--surface);color:var(--ink);border-top:1px solid var(--line);padding-block:clamp(40px,6vw,72px)}
.sfn-in{max-width:1320px;margin-inline:auto;padding-inline:clamp(16px,4vw,48px);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px 56px;align-items:center}
.sfn h2{font-family:var(--display);font-weight:var(--dw);letter-spacing:var(--dt);font-size:clamp(26px,3.2vw,40px);line-height:1.1;margin:0 0 10px;text-wrap:balance}
.sfn-t p{margin:0;color:var(--muted);font-size:16px;line-height:1.55;max-width:46ch}
.sfn-f{display:flex;flex-wrap:wrap;gap:10px;margin:0}
.sfn-f input[type=email]{flex:1 1 220px;min-width:0;height:52px;padding:0 18px;border:1px solid var(--line);border-radius:var(--r-btn);background:var(--bg);color:var(--ink);font:inherit;font-size:16px}
.sfn-f input:focus-visible,.sfn-f button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.sfn-f button{height:52px;padding:0 26px;border:0;border-radius:var(--r-btn);background:var(--accent);color:var(--on-accent);font:inherit;font-weight:700;font-size:16px;cursor:pointer}
.sfn-f button:disabled{opacity:.6;cursor:default}
.sfn-m{flex-basis:100%;margin:0;font-size:15px;line-height:1.5}.sfn-m:empty{display:none}
.sfn-m.ok{color:var(--ink)}.sfn-m.err{color:var(--danger)}.sfn-m b{letter-spacing:.06em}
.sfn-sr,.sfn-hp{position:absolute!important;left:-9999px;width:1px;height:1px;overflow:hidden}
@media(max-width:760px){.sfn-in{grid-template-columns:1fr}}
.sfa{display:grid;gap:14px;padding:24px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card)}
.sfa label{display:grid;gap:6px;font-weight:600}.sfa label small{font-weight:400;color:var(--muted)}
.sfa input,.sfa textarea{font:inherit;font-weight:400;padding:12px;border:1.5px solid var(--line);border-radius:var(--r-in);background:var(--bg);color:var(--ink)}
.sfa button{justify-self:start;height:50px;padding:0 26px;border:0;border-radius:var(--r-btn);background:var(--accent);color:var(--on-accent);font:inherit;font-weight:700;cursor:pointer}
.sfa-link{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:14px 16px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-in);font-weight:600;word-break:break-all}
.sfa-link code{flex:1 1 240px;font:inherit}.sfa-link button{height:40px;padding:0 18px;border:1px solid var(--line);border-radius:var(--r-btn);background:var(--bg);color:var(--ink);font:inherit;font-weight:600;cursor:pointer}
.sfa-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin:0}
.sfa-stats div{padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-in);background:var(--surface)}.sfa-stats dt{color:var(--muted);font-size:14px}.sfa-stats dd{margin:4px 0 0;font-size:24px;font-weight:700;font-variant-numeric:tabular-nums}
.sfa-tbl{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}.sfa-tbl th,.sfa-tbl td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--line)}.sfa-tbl th{color:var(--muted);font-weight:500;font-size:14px}.sfa-tbl td:last-child,.sfa-tbl th:last-child{text-align:right}`;
function signupSection(store) {
  const box = signupBox(store);
  if (!box) return "";
  return `<section class="sfn" aria-labelledby="sfn-h"><div class="sfn-in"><div class="sfn-t"><h2 id="sfn-h">${esc(box.title)}</h2><p>${esc(box.text)}</p></div>
<form id="sfn-form" class="sfn-f" novalidate><label for="sfn-e" class="sfn-sr">Email address</label><input id="sfn-e" type="email" name="email" autocomplete="email" placeholder="Your email address" required maxlength="254">
<input type="text" name="website" tabindex="-1" autocomplete="off" class="sfn-hp" aria-hidden="true"><button type="submit">${box.offer ? "Get my code" : "Sign up"}</button><p class="sfn-m" id="sfn-m" role="status" aria-live="polite"></p></form></div></section>`;
}
const STORE_JS = (store) => {
  if (!store.id) return "";
  const slug = esc(store.store_slug);
  const days = Number(store.aff_cookie_days) || 30;
  return `<script>(function(){var S=${JSON.stringify(base(store))},K="sf_ref_${slug}";
${programLive(store) ? `try{var m=/[?&]ref=([A-Za-z0-9]{1,16})(&|$)/.exec(location.search);if(m)localStorage.setItem(K,JSON.stringify({code:m[1].toUpperCase(),at:Date.now()}))}catch(e){}` : ""}
window.sfRef=function(){try{var r=JSON.parse(localStorage.getItem(K)||"null");return r&&Date.now()-r.at<${days}*864e5?r:null}catch(e){return null}};
var add=sfCart.add;sfCart.add=function(i){add(i);window.sfTrack&&sfTrack("add",{id:i.product_id,name:i.title,value:i.unit*i.qty/100,qty:i.qty})};
document.addEventListener("DOMContentLoaded",function(){var f=document.getElementById("sfn-form");if(!f)return;var m=document.getElementById("sfn-m");
f.addEventListener("submit",function(e){e.preventDefault();var em=f.email.value.trim(),b=f.querySelector("button");
if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(em)){m.className="sfn-m err";m.textContent="Enter a valid email address.";f.email.focus();return}
b.disabled=true;fetch(S+"/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:em,website:f.website.value})})
.then(function(r){return r.json().then(function(j){return[r.ok,j]})}).then(function(x){if(!x[0]){m.className="sfn-m err";m.textContent=x[1].error||"That didn't work. Try again.";b.disabled=false;return}
m.className="sfn-m ok";m.textContent="You're on the list. Thanks for signing up!";f.email.value="";
if(x[1].offer_code){m.textContent="You're on the list! Your code: ";var c=document.createElement("b");c.textContent=x[1].offer_code;m.appendChild(c);m.appendChild(document.createTextNode(". It's added to your cart automatically."));try{sessionStorage.setItem("sf_code_${slug}",x[1].offer_code)}catch(e){}}
window.sfTrack&&sfTrack("lead",{})}).catch(function(){m.className="sfn-m err";m.textContent="Couldn't reach the store. Check your connection.";b.disabled=false})})})})();</script>`;
};

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
document.getElementById("tot").textContent=fmt(q.total_before_tax)${store._hasSubscriptions ? '+(q.billing_interval?" / "+q.billing_interval:"")' : ""};var tn=document.getElementById("taxnote");tn.hidden=!q.tax_note;tn.textContent=q.tax_note||"";
var cc=sfCart.read();q.lines.forEach(function(l){var f=cc.find(function(c){return c.product_id===l.product_id&&(c.variant_id||null)===(l.variant_id||null)});if(f){f.unit=l.unit_cents;f.title=l.title}});sfCart.write(cc);
if(code&&q.discount)msg("Code applied: "+q.discount_label,true);else if(!code)msg("")}).catch(function(){msg("Couldn't reach the store. Check your connection.")})}
document.getElementById("codef").addEventListener("submit",function(e){e.preventDefault();code=document.getElementById("code").value.trim().toUpperCase();try{sessionStorage.setItem("sf_code_${slug}",code)}catch(x){}quote()});
document.getElementById("go").addEventListener("click",function(){var b=this;b.disabled=true;b.textContent="Opening checkout…";${store.id ? `
if(window.sfTrack){var c=sfCart.read();sfTrack("checkout",{value:c.reduce(function(t,l){return t+l.unit*l.qty},0)/100,qty:c.reduce(function(t,l){return t+l.qty},0)})}` : ""}
fetch(S+"/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:items(),code:code${store.id ? ",ref:window.sfRef?sfRef():null" : ""}})}).then(function(r){return r.json().then(function(j){return[r.ok,j]})}).then(function(x){
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
${o.subscription ? `<section class="sum"><h2>Your subscription</h2><p>Status: ${esc(o.subscription.status)}${o.subscription.period_end ? `. ${o.subscription.cancel_at_period_end ? "Access ends" : "Current period ends"} ${esc(new Date(o.subscription.period_end*1000).toLocaleDateString("en-US"))}` : ""}.</p><a class="buy alt" href="${esc(o.subscription.manage_url)}">Manage subscription / cancel</a><p class="fine">Keep this private order link to access your downloads and billing settings.</p></section>` : ""}
${downloads.length ? `<div class="dl">${downloads.map((d) => `<a class="buy" href="${esc(d.url)}">Download ${esc(d.title)}</a>`).join("")}<p class="fine">Download links work for 7 days. Bookmark this page to get fresh ones.</p></div>` : ""}
${o.items.some((l) => l.kind === "physical") && !pending ? `<p>${o.status === "fulfilled" ? "Your order has shipped." : `${esc(store.store_name)} will ship your order soon.`}${o.tracking ? ` Tracking number: <a href="${esc(o.tracking.url)}" rel="noopener">${esc(o.tracking.number)}</a>${o.tracking.carrier ? ` (${esc(o.tracking.carrier)})` : ""}.` : ""}</p>` : ""}
<div class="sum" style="position:static">${rows}
<div class="row"><span>Subtotal</span><span>${money$(o.subtotal)}</span></div>
${o.discount ? `<div class="row"><span>Discount${o.discount_code ? ` (${esc(o.discount_code)})` : ""}</span><span>−${money$(o.discount)}</span></div>` : ""}
${o.shipping || o.items.some((l) => l.kind === "physical") ? `<div class="row"><span>Shipping</span><span>${o.shipping ? money$(o.shipping) : "Free"}</span></div>` : ""}
${o.tax ? `<div class="row"><span>Tax</span><span>${money$(o.tax)}</span></div>` : ""}
<div class="row t"><span>Total</span><span>${money$(o.total)}</span></div><p class="fine">Order ${esc(o.id)}</p></div>`;
  const purchase = { order: o.id, value: o.total, qty: o.items.reduce((t, l) => t + l.qty, 0) };
  const clear = !pending && o.status !== "canceled" ? `<script>sfCart.write([]);try{sessionStorage.removeItem("sf_code_${esc(store.store_slug)}")}catch(e){}
(function(){var k="sf_px_"+${JSON.stringify(o.id)};try{if(localStorage.getItem(k))return;localStorage.setItem(k,"1")}catch(e){}window.sfTrack&&sfTrack("purchase",${JSON.stringify(purchase).replace(/</g, "\\u003c")})})()</script>` : "";
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
/**
 * The Snapfront membership card a partner can add to their link-in-bio page. It goes to their
 * own sales page (snapfront.app/join/CODE) and always says they earn a commission.
 */
export function membershipCard(card) {
  if (!card) return "";
  const usd = (n) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;
  return `<a class="lk sfm" href="${esc(card.url)}" rel="noopener" target="_blank">
<span class="sfm-mark" aria-hidden="true">✦</span><span class="sfm-t"><b>Snapfront membership</b><small>Build a store from one photo. The AI does the heavy lifting.</small><em>${esc(usd(card.lifetime))} for life · or ${esc(usd(card.monthly))}/month</em></span><span class="sfm-go">See it</span></a>
<p class="sfm-note">I earn a commission if you join through this link.</p>`;
}
const MEMBERSHIP_CARD_CSS = `<style>.lk.sfm{justify-content:flex-start;text-align:left;gap:14px;border-color:var(--line);background:var(--surface);border-radius:var(--r-in);padding:14px 16px}
.sfm-mark{width:52px;height:52px;flex:none;border-radius:min(12px,var(--r-in));display:grid;place-items:center;font-size:22px;color:#11151B;background:linear-gradient(160deg,#FFFFFF,#AEB6C2)}
.sfm-t{flex:1;display:grid;gap:2px;min-width:0}.sfm-t b{font-size:16px}.sfm-t small{color:var(--muted);font-weight:500;font-size:14px;line-height:1.35}.sfm-t em{font-style:normal;font-size:13px;font-variant-numeric:tabular-nums}
.sfm-go{flex:none;font-size:14px;padding:6px 12px;border-radius:999px;background:var(--accent);color:var(--on-accent)}
.sfm-note{margin:-4px 0 0;text-align:center;font-size:12px;color:var(--muted)}</style>`;

export function linksPage(store, products, links, card = null) {
  const btn = (href, label, cls = "") => `<a class="lk ${cls}" href="${esc(href)}"${/^https?:/.test(href) ? ' rel="noopener" target="_blank"' : ""}>${esc(label)}</a>`;
  return shell({ title: `${store.store_name} · Links`, description: store.tagline || `Shop ${store.store_name}`, store, canonical: storeUrl(store.store_slug, "/links"),
    body: `${card ? MEMBERSHIP_CARD_CSS : ""}<div class="wrap links"><header>${store.banner_file ? `<img class="av" src="${esc(`${config.publicUrl}/img/${store.banner_file}`)}" alt="">` : ""}<h1>${esc(store.store_name)}</h1>${store.tagline ? `<p>${esc(store.tagline)}</p>` : ""}</header>
${btn(`${home(store)}?utm_source=bio`, "Shop the store", "main")}
${products.map((p) => `<a class="lk prod" href="${esc(base(store))}/${esc(p.slug)}?utm_source=bio">${img(p.image_url, "", ' loading="lazy"')}<span>${esc(p.title)}</span><b>${priceLabel(p)}</b></a>`).join("")}
${membershipCard(card)}
${links.map((l) => btn(l.url, l.label)).join("")}</div>`, signup: true });
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

/** The public "Become an affiliate" page. */
export function affiliateJoinPage(store, { state = null, error = null, rate, blurb } = {}) {
  const done = state === "active" ? `<p class="ok">You're in! Check your email for your link and your stats page.</p>`
    : state === "pending" ? `<p class="ok">Thanks for applying! You'll get your link by email once ${esc(store.store_name)} approves you.</p>` : "";
  return shell({ title: `Affiliate program · ${store.store_name}`, description: `Earn ${rate}% sharing ${store.store_name}`, store, canonical: storeUrl(store.store_slug, "/affiliates"),
    body: `<div class="wrap page"><div class="order"><h1>Earn ${esc(rate)}% sharing ${esc(store.store_name)}</h1>
<p>${blurb ? esc(blurb).replace(/\n/g, "<br>") : `Share your own link with friends and followers. When someone buys through it within ${esc(store.aff_cookie_days)} days, you earn ${esc(rate)}% of their order.`}</p>
${done}${error ? `<p class="err">${esc(error)}</p>` : ""}${state ? "" : `<form class="sfa" method="post" action="${esc(base(store))}/affiliates">
<label>Your name <input name="name" required maxlength="80" autocomplete="name"></label>
<label>Email <input name="email" type="email" required maxlength="254" autocomplete="email"></label>
<label>Where will you share? <small>Optional: your Instagram, TikTok, blog or newsletter</small><textarea name="about" rows="3" maxlength="300"></textarea></label>
<input name="website" tabindex="-1" autocomplete="off" class="sfn-hp" aria-hidden="true"><button type="submit">Join the program</button></form>`}</div></div>` });
}
/** An affiliate's private stats page. */
export function affiliatePortalPage(store, a) {
  const $ = (n) => money(Math.round(n * 100));
  return shell({ title: `Your affiliate stats · ${store.store_name}`, description: `Affiliate stats for ${store.store_name}`, store,
    body: `<div class="wrap page"><div class="order"><h1>Hi ${esc(a.name.split(" ")[0])}</h1><p>You earn ${esc(a.rate)}% of every ${esc(store.store_name)} order that comes through your link.${a.status !== "active" ? " <strong>Your link is paused right now.</strong>" : ""}</p>
<div class="sfa-link"><code id="lnk">${esc(a.link)}</code><button type="button" id="cp">Copy link</button></div>
<dl class="sfa-stats"><div><dt>Clicks</dt><dd>${a.clicks}</dd></div><div><dt>Orders</dt><dd>${a.orders}</dd></div><div><dt>Earned</dt><dd>${$(a.earned)}</dd></div><div><dt>Paid to you</dt><dd>${$(a.paid)}</dd></div><div><dt>Owed to you</dt><dd>${$(a.owed)}</dd></div></dl>
<h2 style="font-size:22px;margin:12px 0 0">Recent orders</h2>${a.recent.length ? `<div style="overflow-x:auto"><table class="sfa-tbl"><thead><tr><th>Date</th><th>Order</th><th>You earned</th></tr></thead><tbody>${a.recent.map((o) => `<tr><td>${esc(String(o.paid_at).slice(0, 10))}</td><td>${$(o.amount)}${o.refunded ? " (refunded)" : ""}</td><td>${$(o.commission)}</td></tr>`).join("")}</tbody></table></div>` : `<p>No orders yet. Share your link to get started.</p>`}
${a.payouts.length ? `<h2 style="font-size:22px;margin:12px 0 0">Payments</h2><div style="overflow-x:auto"><table class="sfa-tbl"><thead><tr><th>Date</th><th>Note</th><th>Amount</th></tr></thead><tbody>${a.payouts.map((p) => `<tr><td>${esc(String(p.created_at).slice(0, 10))}</td><td>${esc(p.note)}</td><td>${$(p.amount)}</td></tr>`).join("")}</tbody></table></div>` : ""}
<p class="fine">Keep this page private: anyone with its address can see your stats. ${esc(store.store_name)} pays affiliates directly.</p></div></div>
<script>document.getElementById("cp").addEventListener("click",function(){var t=document.getElementById("lnk").textContent,b=this;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Copied"},function(){var r=document.createRange();r.selectNodeContents(document.getElementById("lnk"));getSelection().removeAllRanges();getSelection().addRange(r)})})</script>` });
}

/** A creator's UGC portfolio page: videos, niches, rates and how to book. */
export function ugcPage(store, p) {
  const vid = p.items.filter((i) => i.kind === "video"), links = p.items.filter((i) => i.kind === "link");
  const css = `<style>.ugc{max-width:1100px;margin:0 auto;padding-block:clamp(32px,5vw,64px);display:grid;gap:28px}.ugc h1{margin:0;font-family:var(--display);font-size:clamp(34px,5vw,56px);line-height:1.05;text-wrap:balance}
.ugc .lead{margin:8px 0 0;color:var(--muted);font-size:18px;max-width:60ch}.ugc .chips{display:flex;flex-wrap:wrap;gap:8px}.ugc .chip{border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:14px}
.ugc .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}.ugc video{width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:var(--r-card);background:#000;display:block}
.ugc figure{margin:0;display:grid;gap:6px}.ugc figcaption{font-size:14px;color:var(--muted)}.ugc table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}.ugc td{padding:12px 4px;border-bottom:1px solid var(--line)}.ugc td:last-child{text-align:right;font-weight:700}
.ugc .book{display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:20px;border:1px solid var(--line);border-radius:var(--r-card);background:var(--surface)}.ugc .book a.btn{background:var(--accent);color:var(--on-accent);padding:14px 24px;border-radius:var(--r-btn);text-decoration:none;font-weight:700}
.ugc h2{margin:0 0 10px;font-size:24px}.ugc .links a{display:block;padding:12px 0;border-bottom:1px solid var(--line);color:inherit}</style>`;
  const body = `${css}<div class="wrap"><div class="ugc"><header><h1>${esc(p.name)}</h1><p class="lead">${esc(p.headline)}</p></header>
${p.niches.length ? `<div class="chips">${p.niches.map((n) => `<span class="chip">${esc(n)}</span>`).join("")}</div>` : ""}
${p.bio ? `<p style="margin:0;max-width:65ch;line-height:1.6">${esc(p.bio).replace(/\n/g, "<br>")}</p>` : ""}
${vid.length ? `<section><h2>My work</h2><div class="grid">${vid.map((v) => `<figure><video src="${esc(v.src)}"${v.poster_src ? ` poster="${esc(v.poster_src)}"` : ""} controls playsinline preload="none"></video>${v.title ? `<figcaption>${esc(v.title)}</figcaption>` : ""}</figure>`).join("")}</div></section>` : ""}
${links.length ? `<section class="links"><h2>More of my content</h2>${links.map((l) => `<a href="${esc(l.url)}" rel="noopener" target="_blank">${esc(l.title || l.url)}</a>`).join("")}</section>` : ""}
${p.rates.length ? `<section><h2>Rates</h2><table>${p.rates.map((r) => `<tr><td>${esc(r.label)}</td><td>${money(Math.round(r.price * 100)).replace(/\.00$/, "")}</td></tr>`).join("")}</table></section>` : ""}
<section class="book"><div style="flex:1;min-width:220px"><h2 style="margin:0">Work with me</h2><p style="margin:6px 0 0;color:var(--muted)">${p.email ? `Email <strong>${esc(p.email)}</strong> with your product and timeline.` : "Send me a message with your product and timeline."}</p></div>
${p.email ? `<a class="btn" href="mailto:${esc(p.email)}?subject=${encodeURIComponent("UGC for my brand")}">Book a video</a>` : ""}
${["tiktok", "instagram", "youtube"].filter((k) => p.socials[k]).map((k) => `<a href="${esc(p.socials[k])}" rel="noopener" target="_blank">${k === "tiktok" ? "TikTok" : k === "instagram" ? "Instagram" : "YouTube"}</a>`).join("")}</section></div></div>`;
  return shell({ title: `${p.name} · UGC creator`, description: p.headline, store, canonical: storeUrl(store.store_slug, "/ugc"), body });
}

export function notePage(store, title, html) {
  return shell({ title, description: title, store, body: `<div class="wrap"><div class="note">${html}</div></div>` });
}
export { esc, money };
