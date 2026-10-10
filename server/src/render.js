// Server-rendered public storefront pages. Plain HTML + one inline stylesheet: fast, SEO-friendly,
// and shareable from a link-in-bio.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (cents, cur = "usd") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(cents / 100);

const CSS = `
:root{--paper:#F2F3F7;--card:#fff;--ink:#16152E;--muted:#5D5F78;--line:#D6D9E5;--cobalt:#2C47F5;--flash:#FFD84A}
@media(prefers-color-scheme:dark){:root{--paper:#0F0F1C;--card:#191A2B;--ink:#EEEEF7;--muted:#A3A5BE;--line:#2F3149;--cobalt:#7C8CFF}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 Figtree,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:inherit}h1,h2{font-family:"Bricolage Grotesque",Figtree,sans-serif;line-height:1.08;margin:0;text-wrap:balance}
.bar{border-bottom:1px solid var(--line);background:var(--card)}.bar div{max-width:1120px;margin:0 auto;padding:16px;display:flex;gap:12px;align-items:baseline;justify-content:space-between;flex-wrap:wrap}
.bar a{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:22px;text-decoration:none}.bar span{color:var(--muted);font-size:14px}
main{max-width:1120px;margin:0 auto;padding:28px 16px 64px}
.hero{display:grid;gap:8px;margin-bottom:28px}.hero h1{font-size:clamp(34px,6vw,64px);letter-spacing:-.03em}.hero p{color:var(--muted);margin:0;max-width:60ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;text-decoration:none;display:grid}
.card:hover{border-color:var(--cobalt)}.ph{aspect-ratio:1/1;background:var(--line);position:relative}.ph img{width:100%;height:100%;object-fit:cover;display:block}
.tagp{position:absolute;left:12px;bottom:12px;background:var(--flash);color:#16152E;font-weight:800;padding:4px 10px;border-radius:6px;font-variant-numeric:tabular-nums}
.card div.m{padding:14px 16px}.card h2{font-size:18px}
.pp{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:40px;align-items:start}@media(max-width:760px){.pp{grid-template-columns:1fr;gap:20px}}
.frame{position:relative;border-radius:18px;overflow:hidden;background:var(--line);aspect-ratio:1/1}.frame img{width:100%;height:100%;object-fit:cover;display:block}
.frame i{position:absolute;width:30px;height:30px;border:0 solid #fff;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))}
.frame i:nth-of-type(1){top:16px;left:16px;border-top-width:3px;border-left-width:3px}.frame i:nth-of-type(2){top:16px;right:16px;border-top-width:3px;border-right-width:3px}
.frame i:nth-of-type(3){bottom:16px;left:16px;border-bottom-width:3px;border-left-width:3px}.frame i:nth-of-type(4){bottom:16px;right:16px;border-bottom-width:3px;border-right-width:3px}
.info{display:grid;gap:16px}.cat{color:var(--cobalt);font-weight:700;font-size:14px}.info h1{font-size:clamp(30px,4vw,44px);letter-spacing:-.02em}
.tl{color:var(--muted);font-size:18px;margin:0}.price{font:800 32px "Bricolage Grotesque",sans-serif;font-variant-numeric:tabular-nums}
.buy{display:inline-flex;justify-content:center;background:var(--cobalt);color:#fff;text-decoration:none;font-weight:700;font-size:17px;padding:15px 30px;border-radius:999px;min-width:220px}
.buy.off{opacity:.45;pointer-events:none}.fine{font-size:13px;color:var(--muted)}
ul.b{list-style:none;padding:0;margin:0;display:grid;gap:8px}ul.b li{padding-left:24px;position:relative}ul.b li::before{content:"";position:absolute;left:0;top:7px;width:10px;height:10px;border:2px solid var(--cobalt);border-radius:2px}
details{border-top:1px solid var(--line);padding:12px 0}summary{font-weight:600;cursor:pointer}details p{color:var(--muted);margin:8px 0 0}
.tags{display:flex;flex-wrap:wrap;gap:6px}.tags span{background:var(--card);border:1px solid var(--line);border-radius:99px;padding:2px 10px;font-size:13px;color:var(--muted)}
.note{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px;max-width:640px;margin:40px auto;display:grid;gap:14px;text-align:center;justify-items:center}
footer{text-align:center;color:var(--muted);font-size:13px;padding:32px 16px}`;

function shell({ title, description, store, image, body, canonical }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ""}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Figtree:wght@400;600;700&display=swap">
<style>${CSS}</style></head><body>
<header class="bar"><div><a href="/s/${esc(store.store_slug)}">${esc(store.store_name)}</a><span>${esc(store.tagline)}</span></div></header>
<main>${body}</main><footer>© ${new Date().getFullYear()} ${esc(store.store_name)} · Secure checkout by Stripe · Made with Snapfront</footer></body></html>`;
}

export function storePage(store, products, baseUrl) {
  const cards = products.map((p) => `<a class="card" href="/s/${esc(store.store_slug)}/${esc(p.slug)}"><div class="ph">${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.alt_text || p.title)}" loading="lazy">` : ""}<span class="tagp">${money(p.price_cents, p.currency)}</span></div><div class="m"><h2>${esc(p.title)}</h2></div></a>`).join("");
  return shell({
    title: store.store_name, description: store.tagline || `Shop ${store.store_name}`, store,
    image: products[0]?.image_url, canonical: `${baseUrl}/s/${store.store_slug}`,
    body: `<section class="hero"><h1>${esc(store.store_name)}</h1>${store.tagline ? `<p>${esc(store.tagline)}</p>` : ""}</section>
<div class="grid">${cards || `<p class="fine">New products are on the way.</p>`}</div>`,
  });
}

export function productPage(store, p, baseUrl) {
  const buy = p.payment_link_url
    ? `<a class="buy" href="${esc(p.payment_link_url)}">Buy now · ${money(p.price_cents, p.currency)}</a>`
    : `<span class="buy off">Available soon</span>`;
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: p.title, description: p.seo_description || p.tagline, image: p.image_url || undefined,
    offers: { "@type": "Offer", price: (p.price_cents / 100).toFixed(2), priceCurrency: p.currency.toUpperCase(), availability: "https://schema.org/InStock", url: `${baseUrl}/s/${store.store_slug}/${p.slug}` } };
  return shell({
    title: `${p.title} · ${store.store_name}`, description: p.seo_description || p.tagline, store, image: p.image_url,
    canonical: `${baseUrl}/s/${store.store_slug}/${p.slug}`,
    body: `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
<article class="pp"><div class="frame">${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.alt_text || p.title)}">` : ""}<i></i><i></i><i></i><i></i></div>
<div class="info"><div class="cat">${p.kind === "digital" ? "Digital download" : esc(p.category || "Product")}</div><h1>${esc(p.title)}</h1>
${p.tagline ? `<p class="tl">${esc(p.tagline)}</p>` : ""}<div class="price">${money(p.price_cents, p.currency)}</div><div>${buy}</div>
<div class="fine">Secure checkout by Stripe${p.kind === "digital" ? " · instant download after payment" : ""}</div>
${String(p.description || "").split(/\n\s*\n/).filter(Boolean).map((t) => `<p style="margin:0">${esc(t)}</p>`).join("")}
${p.bullets.length ? `<h2 style="font-size:20px">What you get</h2><ul class="b">${p.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
${p.tags.length ? `<div class="tags">${p.tags.map((t) => `<span>#${esc(t)}</span>`).join("")}</div>` : ""}
<div>${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div></div></article>`,
  });
}

export function notePage(store, title, html) {
  return shell({ title, description: title, store, body: `<div class="note">${html}</div>` });
}
export { esc, money };
