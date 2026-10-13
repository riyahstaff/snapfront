import { config } from "./config.js";

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const SINGLE_WEIGHT = new Set(["Instrument Serif", "DM Serif Display", "Young Serif", "Marcellus", "Anton", "Bebas Neue", "Lilita One", "Archivo Black", "Abril Fatface", "Prata", "Yeseva One"]);
const OPTICAL_FONTS = {
  "Bodoni Moda": "opsz,wght@6..96,400;6..96,500;6..96,600;6..96,700",
  "Fraunces": "opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700",
  "DM Sans": "opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700",
  "Newsreader": "opsz,wght@6..72,400;6..72,500;6..72,600;6..72,700",
};
const fontSpec = (family, weight = 400, body = false) => family === "DM Mono" ? "wght@400;500" : OPTICAL_FONTS[family] || (SINGLE_WEIGHT.has(family) ? "wght@400" : body ? "wght@400;500;600;700" : `wght@${weight}`);
const luminance = (hex) => {
  const channels = String(hex).replace("#", "").match(/.{2}/g)?.map((part) => parseInt(part, 16) / 255) || [1, 1, 1];
  const [r, g, b] = channels.map((n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Shared tokens and API compatibility only; each module owns its structure and scoped CSS. */
export function defineTheme(spec) {
  const key = spec.id.replace(/^p-/, "");
  const c = spec.colors;
  const displayWeight = SINGLE_WEIGHT.has(spec.display) ? 400 : (spec.displayWeight || 600);
  return {
    id: spec.id, name: spec.name, for: spec.for || spec.category, vibe: spec.vibe,
    collection: "premium", category: spec.category, group: spec.group, family: key,
    fonts: {
      display: [spec.display, fontSpec(spec.display, displayWeight), displayWeight, spec.tracking || "-.02em"],
      body: [spec.body, fontSpec(spec.body, 400, true)],
    },
    c, dark: spec.dark ?? luminance(c.bg) < 0.18,
    header: spec.header || "split", hero: spec.hero || "editorial", cats: "pill",
    card: spec.card || "clean", ratio: spec.ratio || "1/1", rCard: spec.rCard ?? 0, rBtn: spec.rBtn ?? 0,
    motion: spec.motion || "still", copy: spec.copy, announce: "static", band: false,
    ...(spec.upper ? { upper: spec.upper } : {}),
    demoHero: `/theme-assets/${key}-hero.webp`,
    preview: `/theme-assets/${key}-preview.webp`,
    demo: `/theme-demo/${spec.id}`,
  };
}

export function categoryContext(store, t, products, cats, productCard) {
  const root = store._base ?? `/s/${store.store_slug}`;
  const clean = (value) => typeof value === "string" ? value.trim() : "";
  const pics = [
    ...(store.banner_file ? [{ url: `${config.publicUrl}/img/${store.banner_file}`, alt: `${store.store_name} storefront` }] : []),
    ...products.filter((p) => p.image_url).map((p) => ({ url: p.image_url, alt: p.alt_text || p.title })),
  ];
  // Only read-only demo fixtures can specify a generated demonstration hero.
  if (store._themeDemo && store._demoHero) pics.unshift({ url: store._demoHero, alt: `${t.category} — illustrative theme photography` });
  const seen = new Set();
  const distinctPics = pics.filter((pic) => !seen.has(pic.url) && seen.add(pic.url));
  const head = clean(store.hero_title) || store.tagline || store.store_name;
  const oldSub = store.tagline && store.about ? store.about.split(/(?<=[.!?])\s/)[0].slice(0, 180) : "";
  const sub = clean(store.hero_subtitle) || oldSub;
  const eyebrow = clean(store.hero_eyebrow) || t.copy?.eyebrow || "";
  const ctaLabel = clean(store.hero_cta) || t.copy?.cta || "Shop now";
  const motion = distinctPics.length && ["drift", "pan"].includes(store.hero_motion) ? store.hero_motion : "still";
  const hasMotion = motion !== "still";
  const ctas = `<div class="ctas"><a class="btn" href="#shop">${esc(ctaLabel)}</a>${store.about ? '<a class="btn ghost" href="#about">Our story</a>' : ""}</div>`;
  const ctx = {
    store, t, products, cats, pics: distinctPics, head, sub, eyebrow, ctaLabel, esc, ctas,
    heroAttrs: hasMotion ? ` data-hero-motion="${motion}"` : "",
    heroClass: hasMotion ? " has-hero-motion" : "",
    controls: hasMotion ? '<button class="motion-toggle" type="button" data-hero-motion-control aria-pressed="false" aria-label="Pause hero motion">Pause motion</button>' : "",
    money: (cents, currency = "usd") => new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100),
    productLink: (p) => `${root}/${encodeURIComponent(p.slug)}`,
    categoryLink: (name) => `${root}/?c=${encodeURIComponent(name)}#shop`,
    productCard: (p) => productCard(store, p),
    media: (index, { priority = false, lazy = true, decorative = false } = {}) => {
      const pic = distinctPics[index];
      return pic?.url
        ? `<img class="hero-media" src="${esc(pic.url)}" alt="${decorative ? "" : esc(pic.alt)}"${priority ? ' fetchpriority="high"' : lazy ? ' loading="lazy"' : ""} decoding="async">`
        : `<div class="theme-empty-media" aria-hidden="true"><span>${esc(store.store_name)}</span></div>`;
    },
    copy: (extraClass = "") => `<div class="txt${extraClass ? ` ${esc(extraClass)}` : ""}">${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}<h1${head.length > 56 ? ' class="long"' : ""}>${esc(head)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ""}${ctas}</div>`,
  };
  return ctx;
}

export const CATEGORY_BASE_CSS = `
.premium{--tracking:var(--dt);--onPanel:var(--on-panel);--onAccent:var(--on-accent);--onFoot:var(--on-foot);--onBar:var(--on-bar);--onBadge:var(--on-badge);--font-body:var(--body);--font-display:var(--display);--displayWeight:var(--dw);--rBtn:var(--r-btn);--rCard:var(--r-card)}
.category-hero .theme-empty-media{height:100%;min-height:260px;display:grid;place-items:center;background:var(--surface);color:var(--muted);font:500 clamp(22px,3vw,38px)/1.2 var(--display);text-align:center;padding:32px}
.category-hero .theme-empty-media span{max-width:20ch;overflow-wrap:anywhere}
.category-hero img.hero-media{max-width:100%}
.category-hero :is(.txt,h1,p){min-width:0;overflow-wrap:break-word}
.category-hero .motion-toggle{z-index:5;min-height:44px;background:var(--bg);color:var(--ink);box-shadow:0 2px 18px #0002}
.category-hero :is(.ctas,.btn){position:relative;z-index:2}
.premium :is(.category-hero,.theme-discovery) a:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
.premium .hero.is-motion-paused .hero-media{animation-play-state:paused!important}
.premium :is(a:hover,button:hover,a:hover img,a:hover span,a:hover i){transform:none!important}
@media(prefers-reduced-motion:reduce){.premium .hero .hero-media{animation:none!important;transform:none!important}.premium .motion-toggle{display:none!important}}
`;
