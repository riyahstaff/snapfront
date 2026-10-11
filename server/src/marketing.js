// Marketing posts: AI-written captions plus ready-to-post graphics and short videos for Instagram and
// TikTok, drawn in the store's own theme colours and fonts. Sellers save them to their phone and post.
//   Images:   one post (1080×1350), square (1080×1080) or story (1080×1920), six designs
//   Carousel: three slides (the design, why buyers love it, where to buy)
//   Reel:     the three slides as a 9-second vertical video with slow zooms and crossfades
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import ffmpegPath from "ffmpeg-static";
import { config, dirs } from "./config.js";
import { askJson, httpError } from "./claude.js";
import { themeOf } from "./themes.js";
import { fontFile, familyOf, weightOf, wrap, fitSize, measure } from "./fonts.js";
import { storeUrl } from "./urls.js";
import { cutout as realCutout } from "./cutout.js";

const run = promisify(execFile);
let cutout = realCutout;
export function setCutout(f) { cutout = f; }   // tests

export const FORMATS = { post: [1080, 1350], square: [1080, 1080], story: [1080, 1920] };
export const TEMPLATES = [
  { id: "spotlight", name: "Spotlight", about: "Your photo full size, headline on top" },
  { id: "split", name: "Split", about: "Photo above, words on your store colour" },
  { id: "frame", name: "Gallery", about: "Framed photo, clean and centred" },
  { id: "drop", name: "New drop", about: "Product cut out over a giant word" },
  { id: "offer", name: "Offer", about: "Big sale or discount message" },
  { id: "minimal", name: "Minimal", about: "Photo with a small caption card" },
];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clamp = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

/* ---------- AI copy ---------- */
export async function writeCopy(seller, product, { platform = "instagram", tone = "", offer = "" } = {}) {
  const url = storeUrl(seller.store_slug, `/${product.slug}`).replace(/^https?:\/\//, "");
  const out = await askJson([{ type: "text", text: `Write a social media post that sells this product.
Platform: ${platform === "tiktok" ? "TikTok (casual, punchy, hook in the first line)" : "Instagram (warm, polished)"}
Store: ${seller.store_name}${seller.tagline ? ` — ${seller.tagline}` : ""}
Product: ${product.title}
Tagline: ${product.tagline || ""}
Details: ${(product.bullets || []).join("; ")} ${String(product.description || "").slice(0, 600)}
Price: $${(product.price_cents / 100).toFixed(2)}
${offer ? `Offer to mention: ${offer}` : "No discount: don't invent one."}
${tone ? `Tone: ${tone}` : ""}
Rules: be specific to this product; no made-up claims, reviews, numbers of customers or awards; at most 3 emoji in the caption; the caption ends by telling people the link is in the bio.
Return JSON: {"headline": string (max 32 chars, the scroll-stopping line on the graphic), "subline": string (max 60 chars),
"bullets": [3 strings, each max 38 chars, real benefits from the details], "cta": string (max 18 chars, e.g. "Shop now"),
"caption": string (max 600 chars), "hashtags": [8-12 strings without #, relevant and specific]}` }], 900);
  return {
    headline: clamp(out.headline || product.title, 40), subline: clamp(out.subline || product.tagline, 80),
    bullets: (Array.isArray(out.bullets) ? out.bullets : []).map((b) => clamp(b, 44)).filter(Boolean).slice(0, 3),
    cta: clamp(out.cta || "Shop now", 22), caption: String(out.caption || "").trim().slice(0, 1200),
    hashtags: (Array.isArray(out.hashtags) ? out.hashtags : []).map((h) => String(h).replace(/[^\p{L}\p{N}_]/gu, "")).filter(Boolean).slice(0, 15),
    link: url,
  };
}

/* ---------- drawing helpers ---------- */
async function kit(seller) {
  const t = themeOf(seller.theme);
  const [dFam, , dW, dTrack] = t.fonts.display;
  const bFam = t.fonts.body[0];
  const files = { display: await fontFile(dFam, dW, "display"), body: await fontFile(bFam, 400), bold: await fontFile(bFam, 700, "body") };
  const fam = { display: familyOf(files.display), body: familyOf(files.body), bold: familyOf(files.bold) };
  const weight = { display: weightOf(files.display), body: weightOf(files.body), bold: weightOf(files.bold) };
  const track = parseFloat(dTrack) || 0;
  const upper = t.upper === "titles" || t.upper === "all";
  return { t, c: t.c, files, fam, weight, track, upper };
}
const fileOf = (imageUrl) => { const m = String(imageUrl || "").match(/\/img\/([\w-]+\.(?:jpg|png|webp|gif))$/); return m ? path.join(dirs.images, m[1]) : null; };

async function photoData(src, w, h, radius = 0) {
  let img = sharp(src).rotate().resize(Math.round(w), Math.round(h), { fit: "cover", position: "attention" });
  if (radius > 0) {
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w)}" height="${Math.round(h)}"><rect width="100%" height="100%" rx="${radius}" ry="${radius}"/></svg>`);
    img = img.composite([{ input: mask, blend: "dest-in" }]).png();
    return `data:image/png;base64,${(await img.toBuffer()).toString("base64")}`;
  }
  return `data:image/jpeg;base64,${(await img.jpeg({ quality: 88 }).toBuffer()).toString("base64")}`;
}
const image = (href, x, y, w, h) => `<image href="${href}" x="${x}" y="${y}" width="${Math.round(w)}" height="${Math.round(h)}" preserveAspectRatio="xMidYMid slice"/>`;

/** Lines of text; returns { svg, height }. anchor: start | middle | end. */
function text(k, role, str, { x, y, size, color, width, maxLines = 3, anchor = "start", lineHeight = 1.08, opacity = 1, tracking = 0, upper = false }) {
  const file = k.files[role];
  const s = upper ? String(str).toUpperCase() : String(str);
  const lines = wrap(file, s, size, width, maxLines, tracking);
  const svg = lines.map((ln, i) => `<text x="${x}" y="${(y + size * 0.82 + i * size * lineHeight).toFixed(1)}" font-family="${esc(k.fam[role])}" font-weight="${k.weight[role]}" font-size="${size}" fill="${color}" fill-opacity="${opacity}" text-anchor="${anchor}" letter-spacing="${(tracking * size).toFixed(2)}">${esc(ln)}</text>`).join("");
  return { svg, height: lines.length ? size + (lines.length - 1) * size * lineHeight : 0, lines };
}
function pill(k, str, { x, y, size = 30, bg, fg, anchor = "start", padX = 26, padY = 14 }) {
  const w = measure(k.files.bold, str, size) + padX * 2, h = size + padY * 2;
  const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const r = k.t.rBtn >= 999 ? h / 2 : Math.min(k.t.rBtn, 12);
  return { svg: `<rect x="${left}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${bg}"/><text x="${left + w / 2}" y="${y + padY + size * 0.8}" font-family="${esc(k.fam.bold)}" font-weight="${k.weight.bold}" font-size="${size}" fill="${fg}" text-anchor="middle">${esc(str)}</text>`, w, h };
}
const priceOf = (p) => `$${(p.price_cents / 100).toFixed(2).replace(/\.00$/, "")}`;
const btn = (k) => (k.c.panel.toLowerCase() === k.c.accent.toLowerCase() ? { bg: k.c.onPanel, fg: k.c.panel } : { bg: k.c.accent, fg: k.c.onAccent });

async function render(k, W, H, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: "original" }, font: { fontFiles: [k.files.display, k.files.body, k.files.bold], loadSystemFonts: false, defaultFontFamily: k.fam.body } }).render().asPng();
  return sharp(png).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}

/* ---------- the six designs ---------- */
async function design(id, k, W, H, { product, copy, offer, src }) {
  const P = 72, c = k.c, story = H > 1600, price = priceOf(product);
  const hd = (size) => ({ size, tracking: k.track, upper: k.upper });
  switch (id) {
    case "split": {
      const ph = Math.round(H * (story ? 0.6 : 0.58));
      const b = btn(k);
      const hs = fitSize(k.files.display, k.upper ? copy.headline.toUpperCase() : copy.headline, W - 2 * P, 2, story ? 110 : 92, 44, k.track);
      const h = text(k, "display", copy.headline, { x: P, y: ph + 64, color: c.onPanel, width: W - 2 * P, maxLines: 2, ...hd(hs) });
      const sub = text(k, "body", copy.subline, { x: P, y: ph + 64 + h.height + 24, size: 36, color: c.onPanel, opacity: 0.82, width: W - 2 * P, maxLines: 2, lineHeight: 1.3 });
      const cta = pill(k, copy.cta, { x: P, y: H - P - 72, size: 32, bg: b.bg, fg: b.fg });
      const pr = text(k, "display", price, { x: W - P, y: H - P - 70, size: 64, color: c.onPanel, width: 400, anchor: "end", maxLines: 1 });
      return `<rect width="${W}" height="${H}" fill="${c.panel}"/>${image(await photoData(src, W, ph), 0, 0, W, ph)}${h.svg}${sub.svg}${cta.svg}${pr.svg}`;
    }
    case "frame": {
      const top = text(k, "display", k.store, { x: W / 2, y: P, size: 34, color: c.ink, width: W - 2 * P, anchor: "middle", maxLines: 1, tracking: k.track, upper: k.upper });
      const hs = fitSize(k.files.display, k.upper ? copy.headline.toUpperCase() : copy.headline, W - 2 * P, 2, story ? 104 : 84, 40, k.track);
      const h = text(k, "display", copy.headline, { x: W / 2, y: P + 90, color: c.ink, width: W - 2 * P, anchor: "middle", maxLines: 2, ...hd(hs) });
      const py = P + 90 + h.height + 48, ph = H - py - P - 170;
      const r = Math.min(k.t.rCard * 2, 48);
      const pr = text(k, "display", price, { x: W / 2, y: H - P - 150, size: 60, color: c.ink, width: W, anchor: "middle", maxLines: 1 });
      const url = text(k, "body", `${copy.cta} · ${copy.link}`, { x: W / 2, y: H - P - 62, size: 30, color: c.muted, width: W - 2 * P, anchor: "middle", maxLines: 1 });
      return `<rect width="${W}" height="${H}" fill="${c.bg}"/>${top.svg}${h.svg}${image(await photoData(src, W - 2 * P, ph, r), P, py, W - 2 * P, ph)}${pr.svg}${url.svg}`;
    }
    case "drop": {
      const word = clamp(product.label || "New", 10).toUpperCase();
      const ws = Math.min(story ? 420 : 330, Math.floor(((W - 40) / Math.max(1, measure(k.files.display, word, 100))) * 100));
      const big = `<text x="${W / 2}" y="${H * 0.42}" font-family="${esc(k.fam.display)}" font-weight="${k.weight.display}" font-size="${ws}" fill="${c.onAccent}" fill-opacity="0.16" text-anchor="middle" letter-spacing="${(k.track * ws).toFixed(1)}">${esc(word)}</text>`;
      let prod;
      try {
        const cut = await cutout(src);
        const box = [W * 0.8, H * (story ? 0.48 : 0.5)];
        const s = Math.min(box[0] / cut.width, box[1] / cut.height);
        const w = Math.round(cut.width * s), h = Math.round(cut.height * s);
        const png = await sharp(cut.png).resize(w, h).png().toBuffer();
        const cx = W / 2, base = H * (story ? 0.62 : 0.66);
        prod = `<ellipse cx="${cx}" cy="${base - 4}" rx="${w * 0.38}" ry="${Math.max(10, w * 0.04)}" fill="#000" fill-opacity="0.28" filter="url(#sh)"/>${image(`data:image/png;base64,${png.toString("base64")}`, cx - w / 2, base - h, w, h)}`;
      } catch {
        const s = W * 0.62;
        prod = image(await photoData(src, s, s, Math.min(k.t.rCard * 2, 40)), (W - s) / 2, H * 0.18, s, s);
      }
      const hy = H * (story ? 0.68 : 0.72);
      const hs = fitSize(k.files.display, k.upper ? copy.headline.toUpperCase() : copy.headline, W - 2 * P, 2, story ? 100 : 80, 40, k.track);
      const h = text(k, "display", copy.headline, { x: W / 2, y: hy, color: c.onAccent, width: W - 2 * P, anchor: "middle", maxLines: 2, ...hd(hs) });
      const pr = pill(k, `${price} · ${copy.cta}`, { x: W / 2, y: hy + h.height + 40, size: 34, bg: c.badge, fg: c.onBadge, anchor: "middle" });
      return `<defs><filter id="sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs><rect width="${W}" height="${H}" fill="${c.accent}"/>${big}${prod}${h.svg}${pr.svg}`;
    }
    case "offer": {
      const msg = clamp(offer || product.label || copy.headline, 40);
      const ms = fitSize(k.files.display, msg.toUpperCase(), W - 2 * P, 3, story ? 170 : 140, 60, k.track);
      const m = text(k, "display", msg, { x: P, y: P + 20, size: ms, color: c.accent, width: W - 2 * P, maxLines: 3, tracking: k.track, upper: true, lineHeight: 0.98 });
      const py = P + 20 + m.height + 44, pr = text(k, "display", price, { x: P, y: H - P - 64, size: 54, color: c.ink, width: 400, maxLines: 1 });
      const b = btn(k), cta = pill(k, copy.cta, { x: W - P, y: H - P - 70, size: 32, bg: b.bg, fg: b.fg, anchor: "end" });
      const ph = H - py - P - 120;
      return `<rect width="${W}" height="${H}" fill="${c.bg}"/>${m.svg}${image(await photoData(src, W - 2 * P, ph, Math.min(k.t.rCard * 2, 44)), P, py, W - 2 * P, ph)}${pr.svg}${cta.svg}`;
    }
    case "minimal": {
      const cw = W - 2 * P;
      const t1 = text(k, "display", product.title, { x: P + 40, y: 0, size: 52, color: c.ink, width: cw - 80, maxLines: 2, tracking: k.track, upper: k.upper });
      const ch = 40 + t1.height + 24 + 40 + 40;
      const cy = H - P - ch;
      const t = text(k, "display", product.title, { x: P + 40, y: cy + 40, size: 52, color: c.ink, width: cw - 80, maxLines: 2, tracking: k.track, upper: k.upper });
      const meta = text(k, "bold", `${price}  ·  ${copy.link}`, { x: P + 40, y: cy + 40 + t.height + 24, size: 30, color: c.muted, width: cw - 80, maxLines: 1 });
      const r = Math.min(k.t.rCard * 1.5, 28);
      return `${image(await photoData(src, W, H), 0, 0, W, H)}<rect x="${P}" y="${cy}" width="${cw}" height="${ch}" rx="${r}" fill="${c.surface}" fill-opacity="0.96"/>${t.svg}${meta.svg}`;
    }
    default: { // spotlight
      const hs = fitSize(k.files.display, k.upper ? copy.headline.toUpperCase() : copy.headline, W - 2 * P, 3, story ? 120 : 100, 44, k.track);
      const lines = wrap(k.files.display, k.upper ? copy.headline.toUpperCase() : copy.headline, hs, W - 2 * P, 3, k.track).length;
      const subLines = wrap(k.files.body, copy.subline, 38, W - 2 * P, 2).length;
      const blockH = 66 + 36 + hs * (1 + (lines - 1) * 1.04) + 24 + 38 * 1.3 * subLines + 40 + 36;
      const y0 = H - P - blockH;
      const pr = pill(k, price, { x: P, y: y0, size: 34, bg: c.badge, fg: c.onBadge, padY: 14 });
      const h = text(k, "display", copy.headline, { x: P, y: y0 + 66 + 36, color: "#FFFFFF", width: W - 2 * P, maxLines: 3, lineHeight: 1.04, ...hd(hs) });
      const sub = text(k, "body", copy.subline, { x: P, y: y0 + 66 + 36 + h.height + 24, size: 38, color: "#FFFFFF", opacity: 0.88, width: W - 2 * P, maxLines: 2, lineHeight: 1.3 });
      const url = text(k, "bold", `${copy.cta} · ${copy.link}`, { x: P, y: H - P - 36, size: 30, color: "#FFFFFF", width: W - 2 * P, maxLines: 1 });
      return `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.78"/></linearGradient></defs>
${image(await photoData(src, W, H), 0, 0, W, H)}<rect y="${y0 - 260}" width="${W}" height="${H - y0 + 260}" fill="url(#g)"/>${pr.svg}${h.svg}${sub.svg}${url.svg}`;
    }
  }
}

/** Slide 2: why people love it (the AI bullets). */
async function featuresSlide(k, W, H, { product, copy, src }) {
  const P = 72, c = k.c, ph = Math.round(H * (H > 1600 ? 0.5 : H < 1200 ? 0.4 : 0.5));
  const r = Math.min(k.t.rCard * 2, 44);
  const h = text(k, "display", product.title, { x: P, y: P + ph + 56, size: H > 1600 ? 76 : 64, color: c.ink, width: W - 2 * P, maxLines: 2, tracking: k.track, upper: k.upper });
  let y = P + ph + 56 + h.height + 48, items = "";
  for (const b of copy.bullets) {
    const t = text(k, "body", b, { x: P + 76, y, size: 40, color: c.ink, width: W - 2 * P - 76, maxLines: 2, lineHeight: 1.25 });
    items += `<circle cx="${P + 24}" cy="${y + 24}" r="24" fill="${c.accent}"/><path d="M${P + 13} ${y + 25} l8 8 l15 -16" stroke="${c.onAccent}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${t.svg}`;
    y += t.height + 40;
  }
  return `<rect width="${W}" height="${H}" fill="${c.bg}"/>${image(await photoData(src, W - 2 * P, ph, r), P, P, W - 2 * P, ph)}${h.svg}${items}`;
}
/** Slide 3: where to buy. */
async function ctaSlide(k, W, H, { product, copy, src }) {
  const P = 72, c = k.c, s = Math.round(W * 0.46);
  const ph = await photoData(src, s, s, s / 2);
  const cta = text(k, "display", copy.cta, { x: W / 2, y: H * 0.18 + s + 70, size: H > 1600 ? 130 : 108, color: c.onAccent, width: W - 2 * P, anchor: "middle", maxLines: 2, tracking: k.track, upper: k.upper });
  const pr = text(k, "display", priceOf(product), { x: W / 2, y: H * 0.18 + s + 70 + cta.height + 40, size: 64, color: c.onAccent, width: W, anchor: "middle", maxLines: 1, opacity: 0.9 });
  const link = pill(k, copy.link, { x: W / 2, y: H - P - 120, size: 32, bg: c.onAccent, fg: c.accent, anchor: "middle" });
  const bio = text(k, "body", "Link in bio", { x: W / 2, y: H - P - 30, size: 28, color: c.onAccent, width: W, anchor: "middle", maxLines: 1, opacity: 0.8 });
  return `<rect width="${W}" height="${H}" fill="${c.accent}"/>${image(ph, (W - s) / 2, H * 0.18, s, s)}${cta.svg}${pr.svg}${link.svg}${bio.svg}`;
}

/* ---------- public: make files ---------- */
const save = (buf, ext) => {
  fs.mkdirSync(dirs.media, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(dirs.media, name), buf);
  return { file: name, url: `${config.publicUrl}/media/${name}` };
};

/**
 * Render a post. kind: image | carousel | reel. Returns { files: [{file, url}], kind }.
 * `image_url` may point at a studio photo instead of the product's main photo.
 */
export async function renderPost(seller, product, { kind = "image", template = "spotlight", format = "post", copy, offer = "", image_url } = {}) {
  if (!TEMPLATES.some((t) => t.id === template)) throw httpError(400, "Pick one of the designs.");
  if (!FORMATS[format]) throw httpError(400, "Pick post, square or story.");
  if (!["image", "carousel", "reel"].includes(kind)) throw httpError(400, "Pick an image, a carousel or a reel.");
  const src = fileOf(image_url && fileOf(image_url) ? image_url : product.image_url);
  if (!src || !fs.existsSync(src)) throw httpError(400, "This product needs a photo first.");
  const c = {
    headline: clamp(copy?.headline || product.title, 40), subline: clamp(copy?.subline || product.tagline, 80),
    bullets: (copy?.bullets || product.bullets || []).map((b) => clamp(b, 44)).filter(Boolean).slice(0, 3),
    cta: clamp(copy?.cta || "Shop now", 22), link: storeUrl(seller.store_slug).replace(/^https?:\/\//, ""),
  };
  const k = await kit(seller);
  k.store = seller.store_name;
  const [W, H] = kind === "reel" ? FORMATS.story : FORMATS[format];
  const ctx = { product, copy: c, offer: clamp(offer, 40), src };
  const first = await render(k, W, H, await design(template, k, W, H, ctx));
  if (kind === "image") return { kind, files: [save(first, "jpg")] };
  const slides = [first, await render(k, W, H, await featuresSlide(k, W, H, ctx)), await render(k, W, H, await ctaSlide(k, W, H, ctx))];
  if (kind === "carousel") return { kind, files: slides.map((s) => save(s, "jpg")) };
  return { kind, files: [save(await reel(slides, W, H), "mp4")] };
}

/** Three stills → a 9-second vertical video: slow zoom on each, 0.5 s crossfades. */
export async function reel(slides, W, H, seconds = 3.4) {
  const dir = fs.mkdtempSync(path.join(dirs.media, ".reel-"));
  try {
    const ins = slides.map((b, i) => { const f = path.join(dir, `s${i}.jpg`); fs.writeFileSync(f, b); return f; });
    const fps = 30, frames = Math.round(seconds * fps), fade = 0.5;
    const parts = ins.map((_, i) => `[${i}:v]scale=${Math.round(W * 1.1)}:${Math.round(H * 1.1)},zoompan=z='min(zoom+0.0009,1.09)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${fps},setsar=1[v${i}]`);
    let chain = "", last = "v0";
    for (let i = 1; i < ins.length; i++) {
      const out = i === ins.length - 1 ? "out" : `x${i}`;
      chain += `;[${last}][v${i}]xfade=transition=fade:duration=${fade}:offset=${(i * (seconds - fade)).toFixed(2)}[${out}]`;
      last = out;
    }
    const out = path.join(dir, "reel.mp4");
    // One still per input: zoompan turns each into `frames` frames.
    await run(ffmpegPath, ["-y", ...ins.flatMap((f) => ["-i", f]), "-filter_complex", parts.join(";") + chain,
      "-map", ins.length > 1 ? "[out]" : "[v0]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { timeout: 180_000 });
    return fs.readFileSync(out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
