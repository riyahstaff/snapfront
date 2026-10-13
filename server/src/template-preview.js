import { config } from "./config.js";
import { storePage } from "./render.js";
import { themeDemoFixture } from "./theme-gallery.js";
import { themeOf } from "./themes.js";
import { storefrontMediaSlots, storefrontPreviewMediaSlots, slotLabel } from "./storefront-media.js";

const clean = (value) => typeof value === "string" ? value.trim() : "";
const sourceForTheme = (theme) => `${config.publicUrl}${theme.demoHero || "/theme-assets/candles-hero.webp"}`;

function privateTemplateStore(seller, patch, mode) {
  const theme = themeOf(patch.theme || seller.theme);
  const fixture = themeDemoFixture(theme.id);
  const store = {
    ...seller,
    ...patch,
    _base: "",
    _theme: theme.id,
    _draftPreview: true,
    _templatePreview: true,
    _templateFinal: mode === "final",
  };
  let sampleCopy = false;
  if (mode === "template") {
    // These URLs exist only on this render-only object. The renderer assigns them only to an
    // empty composition position, after real seller and product media have had priority.
    const sampleMedia = [
      ...(fixture?.products || []).map((product) => product.image_url),
      sourceForTheme(theme),
    ].filter((url) => typeof url === "string" && /^https?:\/\//.test(url));
    store._templateSampleMedia = sampleMedia;
    // This is render-only starter wording. Nothing here is written to sellers or products.
    for (const key of ["tagline", "about", "hero_title", "hero_subtitle", "hero_eyebrow", "hero_cta"]) {
      if (!clean(store[key]) && clean(fixture?.store?.[key])) {
        store[key] = fixture.store[key];
        sampleCopy = true;
      }
    }
    if (!storefrontMediaSlots(store).length) store._templateSampleHero = sourceForTheme(theme);
  }
  return { store, theme, fixture, sampleCopy };
}

function previewProducts(realProducts, fixture, store, mode) {
  if (mode === "final") return { products: realProducts.filter((product) => product.status === "live"), sampleProducts: 0 };
  if (realProducts.length) {
    return {
      products: realProducts.map((product) => ({
        ...product,
        // The card label is rendered only in this response and makes draft/live state unambiguous.
        label: product.status === "draft" ? "Draft preview" : (product.label || "Live preview"),
      })),
      sampleProducts: 0,
    };
  }
  const media = storefrontMediaSlots(store);
  const examples = (fixture?.products || []).map((product, index) => {
    const replacement = media.length ? media[index % media.length] : null;
    return {
      ...product,
      image_url: replacement?.url || product.image_url,
      _templateSampleProduct: true,
      label: "Sample preview",
      status: "draft",
    };
  });
  return { products: examples, sampleProducts: examples.length };
}

function isolateHtml(html, { hasSamples, mode }) {
  // Store pages contain their ordinary cart, motion, and enhancement scripts. The private iframe has
  // no commerce or navigation surface: remove all source scripts/forms before adding one tiny bridge.
  let out = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>\s*/gi, "")
    .replace(/<form\b[^>]*>[\s\S]*?<\/form>\s*/gi, "")
    .replace(/<div class="pv"[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<a\b([^>]*)>/gi, (_match, attrs) => `<a${attrs.replace(/\s+href\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/\s+target\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")} aria-disabled="true" data-sf-blocked-link>`);
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src http: https: data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'">`;
  const styles = `<style>.sf-template-notice{position:sticky;top:0;z-index:99;margin:0;padding:10px 16px;background:#17171b;color:#fff;text-align:center;font:600 13px/1.35 system-ui,sans-serif}.sf-template-notice[data-sample]{background:#6a3e16}.sf-template-notice strong{font-weight:800}[data-sf-photo],[data-sf-words]{cursor:pointer}[data-sf-blocked-link]{cursor:default}</style>`;
  const notice = hasSamples
    ? `<aside class="sf-template-notice" data-sample role="note"><strong>Example design.</strong> Tap a photo to replace it. Nothing is live yet.</aside>`
    : `<aside class="sf-template-notice" role="note">Your private preview. Nothing is saved to your live store yet.</aside>`;
  const bridge = `<script>(function(){function send(message){var json=JSON.stringify(message),nativeBridge=window.ReactNativeWebView;if(nativeBridge&&typeof nativeBridge.postMessage==='function'){nativeBridge.postMessage(json)}else if(window.parent!==window){window.parent.postMessage(json,'*')}}document.querySelectorAll('[data-sf-photo]').forEach(function(media){media.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();send({type:'photo',slot:Number(media.dataset.sfPhoto)})})});var words=document.querySelector('[data-sf-words]');if(words){words.addEventListener('click',function(){send({type:'words'})})}})();</script>`;
  out = out.replace("</head>", `${csp}${styles}</head>`).replace(/(<body\b[^>]*>)/i, `$1${notice}`);
  // A headline is the only optional copy-edit affordance. It does not disclose or send any text.
  out = out.replace(/<h1\b/i, '<h1 data-sf-words tabindex="0"');
  return out.replace("</body>", `${bridge}</body>`);
}

/** Build an ephemeral native-webview preview. It neither writes data nor manufactures inventory. */
export function materializeTemplatePreview({ seller, patch, products, mode }) {
  const { store, theme, fixture, sampleCopy } = privateTemplateStore(seller, patch, mode);
  const selected = previewProducts(products, fixture, store, mode);
  const rendered = storePage(store, selected.products, config.publicUrl);
  const used = new Set([...rendered.matchAll(/\bdata-sf-photo="([0-2])"/g)].map((match) => Number(match[1])));
  const photo_slots = storefrontPreviewMediaSlots(store, selected.products).filter((slot) => used.has(slot.index)).map((slot) => ({
    index: slot.index,
    label: slotLabel(slot.index),
    image_url: slot.url || null,
    sample: Boolean(slot.sample),
  }));
  const html = isolateHtml(rendered, { hasSamples: Boolean(sampleCopy || selected.sampleProducts || photo_slots.some((slot) => slot.sample)), mode });
  return {
    html,
    photo_slots,
    sample_products: selected.sampleProducts,
    mode,
    theme: { id: theme.id, name: theme.name },
  };
}
