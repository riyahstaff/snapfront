import { config } from "./config.js";

export const IMAGE_FILE = /^[\w-]+\.(jpg|jpeg|png|webp|gif)$/;

/** Read the two optional ordered design-photo references without trusting malformed legacy JSON. */
export function designPhotoFiles(value) {
  let list = [];
  try { list = Array.isArray(value) ? value : JSON.parse(value || "[]"); } catch { /* legacy malformed value: no extra media */ }
  if (!Array.isArray(list)) return [];
  return list.slice(0, 2).map((file) => IMAGE_FILE.test(String(file || "")) ? file : null);
}

/** A renderer-friendly list. Indices deliberately retain their editable slot number (0–2). */
export function storefrontMediaSlots(store, { ordered = false } = {}) {
  const files = [
    IMAGE_FILE.test(String(store?.banner_file || "")) ? store.banner_file : null,
    ...designPhotoFiles(store?.design_photos),
    null,
    null,
  ].slice(0, 3);
  const slots = files.map((file, index) => file
    ? { index, file, url: `${config.publicUrl}/img/${file}`, sample: false }
    : null);
  // This property is generated only by the private template-preview endpoint. It is never persisted
  // or supplied by a client, and only fills a genuinely empty set of owned replacement media.
  if (!slots.some(Boolean) && typeof store?._templateSampleHero === "string" && /^https?:\/\//.test(store._templateSampleHero)) {
    slots[0] = { index: 0, file: null, url: store._templateSampleHero, sample: true };
  }
  return ordered
    ? slots.map((slot, index) => slot || { index, file: null, url: null, sample: false })
    : slots.filter(Boolean);
}

/**
 * The private setup preview preserves slot positions even when a seller leaves a gap.  Product
 * photography can honestly fill an empty renderer position; template-only fallback photography
 * fills the remainder without becoming a seller field. Public storefronts intentionally keep the
 * compact, legacy media order returned by storefrontMediaSlots(store).
 */
export function storefrontPreviewMediaSlots(store, products = []) {
  const slots = storefrontMediaSlots(store, { ordered: true });
  if (!store?._templatePreview) return slots.filter((slot) => slot.url);

  const productMedia = products
    .filter((product) => product?.image_url && !product._templateSampleProduct)
    .map((product) => ({ url: product.image_url, alt: product.alt_text || product.title || "" }));
  const samples = store._templateFinal ? [] : (Array.isArray(store._templateSampleMedia)
    ? store._templateSampleMedia.filter((url) => typeof url === "string" && /^https?:\/\//.test(url))
    : []);
  let productIndex = 0;
  let sampleIndex = 0;

  return slots.map((slot) => {
    if (slot.url) return { ...slot, preview: true };
    const product = productMedia[productIndex++];
    if (product) return { index: slot.index, file: null, ...product, sample: false, preview: true };
    const sample = samples.length ? samples[sampleIndex++ % samples.length] : null;
    return sample
      ? { index: slot.index, file: null, url: sample, sample: true, preview: true }
      : { ...slot, preview: true };
  });
}

export const slotLabel = (index) => index === 0 ? "Main photo" : `Supporting photo ${index}`;
