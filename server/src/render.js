// Server-rendered public storefront pages. Plain HTML + one inline stylesheet: fast, SEO-friendly,
// and shareable from a link-in-bio.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (cents, cur = "usd") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(cents / 100);

const CSS = `
:root{--paper:#F2F3F7;--card:#fff;--ink:#16152E;--muted:#5D5F78;--line:#D6D9E5;--cobalt:#2C47F5;--flash:#FFD84A}
@media(prefers-color-scheme:dark){:root{--paper:#0F0F1C;--card:#191A2B;--ink:#EEEEF7;--muted:#A3A5BE;--line:#2F3149;--cobalt:#7C8CFF}}
*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 Figtree,system-ui,-apple-system,"Segoe UI",sans-serif}
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
footer{text-align:center;color:var(--muted);font-size:13px;padding:32px 16px}
.bar nav{display:flex;gap:16px;align-items:center}.cartlink{font:700 15px Figtree,sans-serif!important;display:inline-flex;gap:6px;align-items:center;text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:6px 14px;background:var(--paper)}
.cartlink b{background:var(--cobalt);color:#fff;border-radius:99px;min-width:22px;height:22px;display:inline-grid;place-items:center;font-size:12px;padding:0 6px}.cartlink b:empty{display:none}
.soldp{position:absolute;right:12px;top:12px;background:var(--ink);color:var(--paper);font-weight:700;font-size:13px;padding:3px 10px;border-radius:6px}
fieldset{border:0;padding:0;margin:0;display:grid;gap:8px}legend{font-weight:700;margin-bottom:8px;padding:0}
.opts{display:flex;flex-wrap:wrap;gap:8px}.opts label{position:relative}.opts input{position:absolute;opacity:0;inset:0}
.opts span{display:inline-block;border:1.5px solid var(--line);background:var(--card);border-radius:10px;padding:9px 16px;font-weight:600;cursor:pointer}
.opts input:checked+span{border-color:var(--cobalt);box-shadow:inset 0 0 0 1px var(--cobalt)}.opts input:focus-visible+span{outline:3px solid var(--flash);outline-offset:2px}
.opts input:disabled+span{opacity:.45;text-decoration:line-through;cursor:not-allowed}
.qty{display:inline-flex;align-items:center;border:1.5px solid var(--line);border-radius:999px;background:var(--card)}
.qty button{all:unset;cursor:pointer;width:40px;height:40px;display:grid;place-items:center;font-size:20px;font-weight:700}.qty button:focus-visible{outline:3px solid var(--flash);border-radius:99px}
.qty output{min-width:28px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
.actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.actions .buy{min-width:0;flex:1 1 150px}
button.buy{border:0;cursor:pointer;font:inherit;font-weight:700;font-size:17px}button.buy:disabled{opacity:.45;cursor:not-allowed}
.buy.alt{background:transparent;color:var(--ink);border:1.5px solid var(--ink)}.buy:focus-visible{outline:3px solid var(--flash);outline-offset:2px}
.stock{font-size:14px;font-weight:600}.stock.low{color:#B02E23}@media(prefers-color-scheme:dark){.stock.low{color:#FF7A6B}}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:var(--paper);padding:12px 18px;border-radius:12px;font-weight:600;display:flex;gap:14px;align-items:center;max-width:calc(100% - 32px)}
.toast a{color:var(--flash)}
.cartw{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:32px;align-items:start}@media(max-width:760px){.cartw{grid-template-columns:1fr}}
.lines{display:grid;gap:12px}.line{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:14px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px}
.line img,.line .noimg{width:72px;height:72px;border-radius:10px;object-fit:cover;background:var(--line)}.line h3{margin:0;font-size:16px}.line .v{color:var(--muted);font-size:14px}
.line .r{display:grid;justify-items:end;gap:6px}.rm{all:unset;cursor:pointer;color:var(--muted);font-size:13px;text-decoration:underline}.rm:focus-visible{outline:2px solid var(--cobalt)}
.sum{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;display:grid;gap:12px;position:sticky;top:16px}
.sum h2{font-size:22px}.row{display:flex;justify-content:space-between;gap:12px;font-variant-numeric:tabular-nums}.row.t{font-weight:800;font-size:20px;border-top:1px solid var(--line);padding-top:12px}
.code{display:flex;gap:8px}.code input{flex:1;min-width:0;font:inherit;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink);text-transform:uppercase}.code input::placeholder{text-transform:none;color:var(--muted)}
.code button{font:inherit;font-weight:700;border:1.5px solid var(--ink);background:transparent;color:var(--ink);border-radius:10px;padding:0 14px;cursor:pointer}
.err{color:#B02E23;font-weight:600;margin:0}@media(prefers-color-scheme:dark){.err{color:#FF7A6B}}.ok{color:#157049;font-weight:600;margin:0}@media(prefers-color-scheme:dark){.ok{color:#4CC88C}}
.order{max-width:640px;margin:0 auto;display:grid;gap:18px}.order h1{font-size:clamp(32px,5vw,48px)}.dl{display:grid;gap:10px}`;

// Cart lives in the buyer's browser (per store). Only ids and quantities are trusted by the server.
const CART_JS = (slug) => `<script>
(function(){var K="sf_cart_${slug}";
function read(){try{return JSON.parse(localStorage.getItem(K))||[]}catch(e){return[]}}
function write(c){try{localStorage.setItem(K,JSON.stringify(c))}catch(e){}badge()}
function badge(){var n=read().reduce(function(s,l){return s+l.qty},0);document.querySelectorAll("[data-cart-count]").forEach(function(b){b.textContent=n?String(n):""})}
window.sfCart={read:read,write:write,add:function(item){var c=read(),k=item.product_id+":"+(item.variant_id||"");var f=c.find(function(l){return l.product_id+":"+(l.variant_id||"")===k});
if(f){f.qty=item.kind==="digital"?1:Math.min(20,f.qty+item.qty)}else c.push(item);write(c)}};badge();})();</script>`;

function shell({ title, description, store, image, body, canonical }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ""}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Figtree:wght@400;600;700&display=swap">
<style>${CSS}</style></head><body>
<header class="bar"><div><a href="/s/${esc(store.store_slug)}">${esc(store.store_name)}</a><nav><a class="cartlink" href="/s/${esc(store.store_slug)}/cart">Cart <b data-cart-count></b></a></nav></div></header>
${CART_JS(store.store_slug)}<main>${body}</main><footer>© ${new Date().getFullYear()} ${esc(store.store_name)} · Secure checkout by Stripe · Made with Snapfront</footer></body></html>`;
}

export function storePage(store, products, baseUrl) {
  const cards = products.map((p) => `<a class="card" href="/s/${esc(store.store_slug)}/${esc(p.slug)}"><div class="ph">${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.alt_text || p.title)}" loading="lazy">` : ""}<span class="tagp">${p.variants.length && new Set(p.variants.map((v) => v.price_cents ?? p.price_cents)).size > 1 ? "From " : ""}${money(Math.min(p.price_cents, ...p.variants.map((v) => v.price_cents ?? p.price_cents)), p.currency)}</span>${p.in_stock ? "" : `<span class="soldp">Sold out</span>`}</div><div class="m"><h2>${esc(p.title)}</h2></div></a>`).join("");
  return shell({
    title: store.store_name, description: store.tagline || `Shop ${store.store_name}`, store,
    image: products[0]?.image_url, canonical: `${baseUrl}/s/${store.store_slug}`,
    body: `<section class="hero"><h1>${esc(store.store_name)}</h1>${store.tagline ? `<p>${esc(store.tagline)}</p>` : ""}</section>
<div class="grid">${cards || `<p class="fine">New products are on the way.</p>`}</div>`,
  });
}

export function productPage(store, p, baseUrl) {
  const sellable = p.status === "live" && store.stripe_ready;
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
    : `<div class="actions">${qty}<button class="buy" type="button" id="add">Add to cart</button><button class="buy alt" type="button" id="now">Buy now</button></div>`;
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
document.getElementById("now").addEventListener("click",function(){add();location.href="/s/${esc(store.store_slug)}/cart"});sync()})();</script>` : "";
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: p.title, description: p.seo_description || p.tagline, image: p.image_url || undefined, sku: p.sku || undefined,
    offers: { "@type": "Offer", price: (startPrice / 100).toFixed(2), priceCurrency: p.currency.toUpperCase(), availability: `https://schema.org/${p.in_stock ? "InStock" : "OutOfStock"}`, url: `${baseUrl}/s/${store.store_slug}/${p.slug}` } };
  return shell({
    title: `${p.title} · ${store.store_name}`, description: p.seo_description || p.tagline, store, image: p.image_url,
    canonical: `${baseUrl}/s/${store.store_slug}/${p.slug}`,
    body: `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
<article class="pp"><div class="frame">${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.alt_text || p.title)}">` : ""}<i></i><i></i><i></i><i></i></div>
<div class="info"><div class="cat">${p.kind === "digital" ? "Digital download" : esc(p.category || "Product")}</div><h1>${esc(p.title)}</h1>
${p.tagline ? `<p class="tl">${esc(p.tagline)}</p>` : ""}<div class="price" id="price">${money(startPrice, p.currency)}</div>${opts}<div>${buy}</div><div id="stock" class="stock" aria-live="polite"></div>
<div class="fine">Secure checkout by Stripe${p.kind === "digital" ? " · instant download after payment" : ""}</div>
${String(p.description || "").split(/\n\s*\n/).filter(Boolean).map((t) => `<p style="margin:0">${esc(t)}</p>`).join("")}
${p.bullets.length ? `<h2 style="font-size:20px">What you get</h2><ul class="b">${p.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
${p.tags.length ? `<div class="tags">${p.tags.map((t) => `<span>#${esc(t)}</span>`).join("")}</div>` : ""}
<div>${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div></div></article>
<div class="toast" id="toast" role="status" hidden>Added to your cart <a href="/s/${esc(store.store_slug)}/cart">View cart</a></div>${script}`,
  });
}

export function cartPage(store, baseUrl) {
  const slug = esc(store.store_slug);
  return shell({
    title: `Your cart · ${store.store_name}`, description: `Your cart at ${store.store_name}`, store, canonical: `${baseUrl}/s/${store.store_slug}/cart`,
    body: `<section class="hero"><h1>Your cart</h1></section>
<div id="empty" hidden><p>Your cart is empty.</p><p><a class="buy" href="/s/${slug}">Keep shopping</a></p></div>
<div class="cartw" id="full" hidden><div class="lines" id="lines"></div>
<aside class="sum" aria-labelledby="sumh"><h2 id="sumh">Order summary</h2>
<div class="row"><span>Subtotal</span><span id="sub"></span></div>
<div class="row" id="discrow" hidden><span id="disclabel">Discount</span><span id="disc"></span></div>
<div class="row" id="shiprow" hidden><span>Shipping</span><span id="ship"></span></div>
<div class="row t"><span>Total</span><span id="tot"></span></div><p class="fine" id="taxnote" hidden></p>
<form class="code" id="codef"><label for="code" class="fine" style="position:absolute;left:-9999px">Discount code</label><input id="code" placeholder="Discount code" autocomplete="off" maxlength="32"><button type="submit">Apply</button></form>
<p id="msg" role="status" class="fine" hidden></p>
<button class="buy" type="button" id="go">Check out</button><p class="fine">You'll pay on Stripe's secure checkout.</p></aside></div>
<script>(function(){var S="/s/${slug}",code="",fmt=function(d){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(d)};
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
    ? `<h1>Payment didn't go through</h1><p>Your order wasn't charged. <a href="/s/${esc(store.store_slug)}/cart">Return to your cart</a> to try again.</p>`
    : `<h1>${pending ? "Almost there" : "Thank you!"}</h1>
<p>${pending ? "We're waiting for Stripe to confirm your payment. This page refreshes on its own." : `Your order is confirmed${o.email ? ` and a receipt is on its way to <strong>${esc(o.email)}</strong>` : ""}.`}</p>
${downloads.length ? `<div class="dl">${downloads.map((d) => `<a class="buy" href="${esc(d.url)}">Download ${esc(d.title)}</a>`).join("")}<p class="fine">Download links work for 7 days. Bookmark this page to get fresh ones.</p></div>` : ""}
${o.items.some((l) => l.kind === "physical") && !pending ? `<p>${o.status === "fulfilled" ? "Your order has shipped." : `${esc(store.store_name)} will ship your order soon.`}</p>` : ""}
<div class="sum" style="position:static">${rows}
<div class="row"><span>Subtotal</span><span>${money$(o.subtotal)}</span></div>
${o.discount ? `<div class="row"><span>Discount${o.discount_code ? ` (${esc(o.discount_code)})` : ""}</span><span>−${money$(o.discount)}</span></div>` : ""}
${o.shipping || o.items.some((l) => l.kind === "physical") ? `<div class="row"><span>Shipping</span><span>${o.shipping ? money$(o.shipping) : "Free"}</span></div>` : ""}
${o.tax ? `<div class="row"><span>Tax</span><span>${money$(o.tax)}</span></div>` : ""}
<div class="row t"><span>Total</span><span>${money$(o.total)}</span></div><p class="fine">Order ${esc(o.id)}</p></div>`;
  const clear = !pending && o.status !== "canceled" ? `<script>sfCart.write([]);try{sessionStorage.removeItem("sf_code_${esc(store.store_slug)}")}catch(e){}</script>` : "";
  return shell({ title: pending ? "Confirming payment" : "Thank you", description: `Your order from ${store.store_name}`, store,
    body: `${pending ? `<meta http-equiv="refresh" content="4">` : ""}<div class="order">${body}</div>${clear}` });
}

/** Stripe's embedded tax settings + registrations components, for Express sellers. */
export function taxSetupPage(store, token, publishableKey) {
  return shell({
    title: "Set up sales tax", description: "Sales tax setup", store,
    body: `<div class="order" style="max-width:760px"><h1>Set up sales tax</h1>
<p>Stripe works out the right tax for each order from your business address and the places you're registered to collect tax. Add both below, then go back to Snapfront and turn on automatic sales tax.</p>
<p class="fine">Not sure where you're registered? Your accountant or state tax agency can tell you. In the US you usually register in your home state first.</p>
<h2 style="font-size:22px">1. Business address</h2><div id="settings"><p class="fine" id="l1">Loading…</p></div>
<h2 style="font-size:22px">2. Where you collect tax</h2><div id="regs"><p class="fine" id="l2">Loading…</p></div>
<p class="err" id="err" hidden></p><p class="fine">When you're done, close this page and return to the app.</p></div>
<script src="https://connect-js.stripe.com/v1.0/connect.js" async></script>
<script>window.StripeConnect=window.StripeConnect||{};StripeConnect.onLoad=function(){
var T=${JSON.stringify(token)};function fail(m){var e=document.getElementById("err");e.hidden=false;e.textContent=m}
var sc=StripeConnect.init({publishableKey:${JSON.stringify(publishableKey)},fetchClientSecret:function(){return fetch("/stripe/tax/session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({t:T})}).then(function(r){return r.json().then(function(j){if(!r.ok){fail(j.error||"Couldn't start tax setup.");return undefined}return j.client_secret})})},
appearance:{variables:{colorPrimary:"#2C47F5",fontFamily:"Figtree, system-ui, sans-serif",borderRadius:"10px"}},fonts:[{cssSrc:"https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&display=swap"}]});
[["tax-settings","settings","l1"],["tax-registrations","regs","l2"]].forEach(function(c){var el=sc.create(c[0]);el.setOnLoaderStart&&el.setOnLoaderStart(function(){var l=document.getElementById(c[2]);l&&l.remove()});
el.setOnLoadError&&el.setOnLoadError(function(e){fail("Stripe couldn't load this section: "+(e.error&&e.error.message||"try again."))});document.getElementById(c[1]).appendChild(el)})};</script>`,
  });
}

export function notePage(store, title, html) {
  return shell({ title, description: title, store, body: `<div class="note">${html}</div>` });
}
export { esc, money };
