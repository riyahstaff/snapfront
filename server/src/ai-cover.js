// AI art direction for generated digital products. After the product is written, an "art director"
// (Claude) reads its title, audience and sections and decides what the cover should show, its
// colours and layout, and one or two inside images tied to specific sections. The images come from
// the same AI image service as the studio (with its download and image checks); the cover is then
// set in one of Snapfront's sleek layouts. Without the image service the same layouts are drawn with
// a designed abstract background, never a flat colour block.
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { askJson } from "./claude.js";
import { generateArtwork, providerEnabled } from "./image-assistant.js";
import { fontFile, familyOf, measure, wrap, fitSize } from "./fonts.js";

export const COVER_W = 1275, COVER_H = 1650;          // US Letter at 150 dpi: fills the PDF's first page
export const LISTING = 1200;                           // square store image: the cover on a graphite stage
const LAYOUTS = ["fullbleed", "panel", "editorial"];
const KIND = { guide: "E-book", checklist: "Checklist pack", hooks: "Content pack", quotes: "Print set", planner: "Planner" };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const line = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const HEX = /^#[0-9a-f]{6}$/i;

/* ---------- colour helpers ---------- */
function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function luminance(hex) {
  return rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function mix(a, b, t) { const [p, q] = [rgb(a), rgb(b)]; return `#${p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, "0")).join("")}`; }

/** The sections inside images can belong to: chapters, lists or groups (none for prints/planners). */
export function sectionsOf(type, content = {}) {
  const list = type === "guide" ? content.chapters : type === "checklist" ? content.lists : type === "hooks" ? content.groups : [];
  return (Array.isArray(list) ? list : []).map((s) => line(s?.heading, 90)).filter(Boolean);
}

/** A complete, safe direction (used as is when the art director can't be reached). */
export function fallbackDirection({ title, type, accent = "#7C8CFF" }) {
  return {
    layout: "panel", eyebrow: (KIND[type] || "Digital product").toUpperCase(),
    palette: { base: "#0E1116", accent: HEX.test(accent) ? accent : "#7C8CFF", text: "#FFFFFF" },
    cover_image: null, inside_images: [], subject: line(title, 80),
  };
}

/** Make whatever the art director sent into a direction the renderer can trust. */
export function normalizeDirection(raw, { title, type, sections, accent }) {
  const base = fallbackDirection({ title, type, accent });
  if (!raw || typeof raw !== "object") return base;
  const layout = LAYOUTS.includes(raw.layout) ? raw.layout : "fullbleed";
  const p = raw.palette || {};
  let bg = HEX.test(p.base) ? p.base : null, acc = HEX.test(p.accent) ? p.accent : base.palette.accent, text = HEX.test(p.text) ? p.text : null;
  if (layout === "editorial") {
    if (!bg || luminance(bg) < 0.6) bg = "#F3EFE8";
    if (!text || contrast(text, bg) < 7) text = "#17161B";
    if (contrast(acc, bg) < 3) acc = mix(acc, "#000000", 0.45);
  } else {
    if (!bg || luminance(bg) > 0.06) bg = "#0E1116";
    text = "#FFFFFF";
    if (contrast(acc, bg) < 3) acc = mix(acc, "#FFFFFF", 0.45);
  }
  const prompt = (v) => line(v, 700);
  const inside = (Array.isArray(raw.inside_images) ? raw.inside_images : []).map((x) => ({
    section: Number.isInteger(x?.section) && x.section >= 0 && x.section < sections.length ? x.section : sections.length ? null : -1,
    prompt: prompt(x?.prompt),
  })).filter((x) => x.section !== null && x.prompt.length > 12);
  const seen = new Set();
  return {
    layout, palette: { base: bg, accent: acc, text },
    eyebrow: line(raw.eyebrow, 28).toUpperCase() || base.eyebrow,
    subject: line(raw.subject, 120) || base.subject,
    cover_image: prompt(raw.cover_image).length > 12 ? prompt(raw.cover_image) : null,
    // At most two inside images, each on a different section (or one on the welcome page).
    inside_images: inside.filter((x) => !seen.has(x.section) && seen.add(x.section)).slice(0, sections.length ? 2 : 1),
  };
}

/** Claude reads the product and decides the cover and inside images. */
export async function artDirection({ title, tagline, type, niche, sections, accent }) {
  const raw = await askJson([{ type: "text", text: `You are the art director for Snapfront, a sleek, modern store builder. Design the cover and inside images for this digital product so they clearly fit its topic.
Format: ${KIND[type] || type}
Title: ${title}
Tagline: ${tagline || ""}
Audience and topic: ${niche || ""}
Sections (0-based): ${sections.length ? sections.map((s, i) => `${i}. ${s}`).join(" | ") : "none (one image may go on the welcome page: use section -1)"}

Decide:
- "subject": in a few words, what the cover shows (it must be obviously about the title's topic).
- "cover_image": a detailed prompt for the cover image. Premium editorial photography or refined 3D/illustration, whichever suits the topic best; specific subject, setting, light, colours, camera angle; magazine quality, modern and uncluttered, with calm space in the lower third for the title. Absolutely no text, letters, logos, brand names, or real people; no close-up faces.
- "layout": "fullbleed" (photo fills the cover, title over a dark fade: best for rich photographic subjects like food, travel, fitness), "panel" (image in a rounded panel on dark graphite: sleek, techy, business, finance, productivity), or "editorial" (image in an arched frame on a light warm page with a serif title: calm, wellness, writing, parenting, faith).
- "palette": {"base": background hex (dark for fullbleed/panel, light for editorial), "accent": hex that comes from the image's colours, "text": title colour hex}.
- "eyebrow": 2-4 words in capitals naming the format and topic, like "THE RECIPE GUIDE" (max 24 characters).
- "inside_images": up to 2 objects {"section": index, "prompt": image prompt in the same visual style as the cover, showing that section's topic}. Pick the sections a picture helps most.
Return one JSON object with exactly these keys.` }], 1500);
  return normalizeDirection(raw, { title, type, sections, accent });
}

/* ---------- fonts ---------- */
let fontsPromise = null;
async function fonts() {
  fontsPromise ??= (async () => {
    const [display, body, bold, serif] = await Promise.all([
      fontFile("Figtree", 800, "display"), fontFile("Figtree", 500), fontFile("Figtree", 700, "body"), fontFile("Fraunces", 600, "display"),
    ]);
    return { display, body, bold, serif, files: [...new Set([display, body, bold, serif])] };
  })().catch((e) => { fontsPromise = null; throw e; });
  return fontsPromise;
}

/* ---------- drawing ---------- */
const dataUri = (buf) => `data:image/jpeg;base64,${buf.toString("base64")}`;

/** A designed stand-in for a photo: soft light pools in the palette with fine chrome rings. */
function abstractArt(id, x, y, w, h, palette) {
  const a = palette.accent, light = mix(a, "#FFFFFF", 0.55), deep = mix(a, palette.base, 0.7);
  return `<defs>
    <radialGradient id="${id}a" cx="72%" cy="22%" r="70%"><stop offset="0" stop-color="${light}" stop-opacity=".95"/><stop offset=".45" stop-color="${a}" stop-opacity=".75"/><stop offset="1" stop-color="${deep}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}b" cx="18%" cy="88%" r="65%"><stop offset="0" stop-color="${a}" stop-opacity=".55"/><stop offset="1" stop-color="${deep}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity=".08"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".35"/></linearGradient>
  </defs>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${deep}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}a)"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}b)"/>
  ${[0.62, 0.46, 0.32].map((r, i) => `<circle cx="${x + w * 0.74}" cy="${y + h * 0.3}" r="${Math.min(w, h) * r}" fill="none" stroke="url(#${id}c)" stroke-width="${2.5 - i * 0.6}"/>`).join("")}`;
}

function picture(id, buf, x, y, w, h, palette, clip = "") {
  if (!buf) return clip ? `<g clip-path="url(#${clip})">${abstractArt(id, x, y, w, h, palette)}</g>` : abstractArt(id, x, y, w, h, palette);
  return `<image href="${dataUri(buf)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"${clip ? ` clip-path="url(#${clip})"` : ""}/>`;
}

function textLines(lines, { x, y, size, leading, family, weight = 400, fill, anchor = "start", tracking = 0, opacity = 1 }) {
  return lines.map((t, i) => `<text x="${x}" y="${y + i * leading}" font-family="${esc(family)}" font-weight="${weight}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"${tracking ? ` letter-spacing="${tracking * size}"` : ""}${opacity < 1 ? ` opacity="${opacity}"` : ""}>${esc(t)}</text>`).join("");
}

/** The cover as a Letter-size PNG. */
export async function renderCover({ title, tagline, type, storeName, direction, image }) {
  const f = await fonts();
  const { layout, palette, eyebrow } = direction;
  const W = COVER_W, H = COVER_H, M = 96;
  const fam = { display: familyOf(f.display), body: familyOf(f.body), bold: familyOf(f.bold), serif: familyOf(f.serif) };
  const kind = (KIND[type] || "Digital product").toUpperCase();
  const brand = line(storeName, 40).toUpperCase();
  let svg;

  if (layout === "editorial") {
    const ink = palette.text, frameW = W - 2 * 170, frameH = Math.round(H * 0.45), fx = 170, fy = 130;
    const titleFont = f.serif, tw = W - 2 * 130;
    let size = fitSize(titleFont, title, tw, 3, 104, 56);
    let tl = wrap(titleFont, title, size, tw, 3);
    const sub = wrap(f.body, tagline || "", 34, W - 2 * 200, 2);
    const eyebrowY = fy + frameH + 82;
    // Title and tagline fit between the label and the footer line, shrinking a long title if needed.
    const room = (H - 175) - (eyebrowY + 38);
    while (size > 56 && tl.length * size * 1.08 + (sub.length ? 26 + sub.length * 46 : 0) > room) { size -= 4; tl = wrap(titleFont, title, size, tw, 3); }
    const ty = eyebrowY + 38 + size * 0.9;
    svg = `<rect width="${W}" height="${H}" fill="${palette.base}"/>
      <defs><clipPath id="arch"><path d="M${fx} ${fy + frameW / 2} A${frameW / 2} ${frameW / 2} 0 0 1 ${fx + frameW} ${fy + frameW / 2} L${fx + frameW} ${fy + frameH} L${fx} ${fy + frameH} Z"/></clipPath></defs>
      ${picture("ed", image, fx, fy, frameW, frameH, palette, "arch")}
      <path d="M${fx} ${fy + frameW / 2} A${frameW / 2} ${frameW / 2} 0 0 1 ${fx + frameW} ${fy + frameW / 2} L${fx + frameW} ${fy + frameH} L${fx} ${fy + frameH} Z" fill="none" stroke="${palette.accent}" stroke-opacity=".35" stroke-width="2"/>
      ${textLines([eyebrow], { x: W / 2, y: eyebrowY, size: 24, leading: 0, family: fam.bold, weight: 700, fill: palette.accent, anchor: "middle", tracking: 0.22 })}
      ${textLines(tl, { x: W / 2, y: ty, size, leading: size * 1.08, family: fam.serif, weight: 600, fill: ink, anchor: "middle" })}
      ${textLines(sub, { x: W / 2, y: ty + (tl.length - 1) * size * 1.08 + 26 + 44, size: 34, leading: 46, family: fam.body, weight: 500, fill: ink, anchor: "middle", opacity: 0.72 })}
      <line x1="${M}" y1="${H - 128}" x2="${W - M}" y2="${H - 128}" stroke="${ink}" stroke-opacity=".18" stroke-width="2"/>
      ${textLines([kind], { x: M, y: H - 80, size: 22, leading: 0, family: fam.bold, weight: 700, fill: ink, tracking: 0.18, opacity: 0.7 })}
      ${brand ? textLines([brand], { x: W - M, y: H - 80, size: 22, leading: 0, family: fam.bold, weight: 700, fill: ink, anchor: "end", tracking: 0.18, opacity: 0.7 }) : ""}`;
  } else {
    const panel = layout === "panel";
    const tw = W - 2 * M;
    const panelH = Math.round(H * 0.52), panelBottom = 72 + panelH;
    let size = fitSize(f.display, title, tw, panel ? 3 : 4, panel ? 124 : 128, 56, -0.02);
    let tl = wrap(f.display, title, size, tw, panel ? 3 : 4, -0.02);
    const sub = wrap(f.body, tagline || "", 38, tw - 60, panel ? 2 : 3);
    const subH = sub.length * 50;
    let titleBottom, ty;
    if (panel) {
      // Eyebrow, title and tagline sit between the picture panel and the footer.
      const room = (H - 175) - (panelBottom + 70 + 34);
      while (size > 56 && tl.length * size + (sub.length ? 34 + subH : 0) > room) { size -= 4; tl = wrap(f.display, title, size, tw, 3, -0.02); }
      ty = panelBottom + 70 + 34 + size * 0.86;
      titleBottom = ty + (tl.length - 1) * size;
    } else {
      titleBottom = H - 210 - subH - (sub.length ? 34 : 0);
      ty = titleBottom - (tl.length - 1) * size * 1.0;
    }
    const pill = measure(f.bold, eyebrow, 24, 0.2) + 60;
    const pillY = panel ? 0 : M - 8;
    const image_ = panel
      ? `<defs><clipPath id="pn"><rect x="72" y="72" width="${W - 144}" height="${Math.round(H * 0.52)}" rx="40"/></clipPath>
           <radialGradient id="glow" cx="80%" cy="62%" r="60%"><stop offset="0" stop-color="${palette.accent}" stop-opacity=".28"/><stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/></radialGradient></defs>
         <rect width="${W}" height="${H}" fill="${palette.base}"/><rect width="${W}" height="${H}" fill="url(#glow)"/>
         ${picture("pn", image, 72, 72, W - 144, Math.round(H * 0.52), palette, "pn")}
         <rect x="72" y="72" width="${W - 144}" height="${Math.round(H * 0.52)}" rx="40" fill="none" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="2"/>`
      : `<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.base}" stop-opacity=".55"/><stop offset=".16" stop-color="${palette.base}" stop-opacity="0"/><stop offset=".42" stop-color="${palette.base}" stop-opacity="0"/><stop offset=".72" stop-color="${palette.base}" stop-opacity=".86"/><stop offset="1" stop-color="${palette.base}" stop-opacity=".97"/></linearGradient></defs>
         <rect width="${W}" height="${H}" fill="${palette.base}"/>
         ${picture("fb", image, 0, 0, W, H, palette)}
         <rect width="${W}" height="${H}" fill="url(#fade)"/>`;
    const eyebrowSvg = panel
      ? textLines([eyebrow], { x: M, y: panelBottom + 70, size: 24, leading: 0, family: fam.bold, weight: 700, fill: palette.accent, tracking: 0.2 })
      : `<rect x="${M}" y="${pillY}" width="${pill}" height="56" rx="28" fill="#FFFFFF" fill-opacity=".14" stroke="#FFFFFF" stroke-opacity=".42" stroke-width="1.5"/>
         ${textLines([eyebrow], { x: M + 30, y: pillY + 37, size: 24, leading: 0, family: fam.bold, weight: 700, fill: "#FFFFFF", tracking: 0.2 })}`;
    svg = `${image_}${eyebrowSvg}
      ${textLines(tl, { x: M, y: ty, size, leading: size * 1.0, family: fam.display, weight: 800, fill: palette.text, tracking: -0.02 })}
      ${textLines(sub, { x: M, y: titleBottom + 34 + 40, size: 38, leading: 50, family: fam.body, weight: 500, fill: "#FFFFFF", opacity: 0.8 })}
      <line x1="${M}" y1="${H - 132}" x2="${W - M}" y2="${H - 132}" stroke="#FFFFFF" stroke-opacity=".22" stroke-width="2"/>
      <rect x="${M}" y="${H - 135}" width="120" height="6" rx="3" fill="${palette.accent}"/>
      ${textLines([kind], { x: M, y: H - 80, size: 22, leading: 0, family: fam.bold, weight: 700, fill: "#FFFFFF", tracking: 0.18, opacity: 0.78 })}
      ${brand ? textLines([brand], { x: W - M, y: H - 80, size: 22, leading: 0, family: fam.bold, weight: 700, fill: "#FFFFFF", anchor: "end", tracking: 0.18, opacity: 0.78 }) : ""}`;
  }
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svg}</svg>`;
  return new Resvg(doc, { font: { fontFiles: f.files, loadSystemFonts: false, defaultFontFamily: fam.body } }).render().asPng();
}

/** The square store image: the cover standing on a graphite stage with a soft glow and shadow. */
export async function renderListing(coverPng, palette) {
  const S = LISTING, h = 980, w = Math.round(h * COVER_W / COVER_H), x = Math.round((S - w) / 2), y = Math.round((S - h) / 2) - 6;
  const cover = await sharp(coverPng).resize(w, h).png().toBuffer();
  const stage = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <defs><radialGradient id="g" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="${mix(palette.accent, "#1A1E25", 0.72)}"/><stop offset=".55" stop-color="#13161B"/><stop offset="1" stop-color="#090B0E"/></radialGradient>
      <filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter></defs>
    <rect width="${S}" height="${S}" fill="url(#g)"/>
    <rect x="${x + 18}" y="${y + 40}" width="${w - 36}" height="${h}" rx="18" fill="#000" opacity=".6" filter="url(#s)"/>
    <rect x="${x - 1}" y="${y - 1}" width="${w + 2}" height="${h + 2}" rx="15" fill="none" stroke="#FFFFFF" stroke-opacity=".12" stroke-width="2"/></svg>`;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="14" fill="#fff"/></svg>`);
  const rounded = await sharp(cover).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return sharp(Buffer.from(new Resvg(stage).render().asPng())).composite([{ input: rounded, left: x, top: y }]).png().toBuffer();
}

/**
 * The whole design for one generated product: direction, images, cover and store image.
 * Never throws for a design problem: anything that fails falls back to the sleek layouts.
 */
export async function designProduct({ product, type, niche, storeName, accent }) {
  const sections = sectionsOf(type, product.content);
  let direction;
  try { direction = await artDirection({ title: product.title, tagline: product.tagline, type, niche, sections, accent }); }
  catch (e) { console.warn("[ai-cover] art direction", e.message); direction = fallbackDirection({ title: product.title, type, accent }); }
  const jobs = [];
  if (providerEnabled()) {
    if (direction.cover_image) jobs.push(generateArtwork(direction.cover_image, { aspect: "portrait" }).then((buf) => ({ kind: "cover", buf })));
    for (const x of direction.inside_images) jobs.push(generateArtwork(x.prompt, { aspect: "wide" }).then((buf) => ({ kind: "inside", section: x.section, buf })));
  }
  const done = await Promise.allSettled(jobs);
  const images = new Map();
  let coverImage = null;
  for (const r of done) {
    if (r.status !== "fulfilled") { console.warn("[ai-cover] image", r.reason?.message || r.reason); continue; }
    if (r.value.kind === "cover") coverImage = r.value.buf;
    // Content packs start a new page every second group, so their images go on those pages.
    else images.set(type === "hooks" && r.value.section > 0 ? r.value.section - (r.value.section % 2) : r.value.section, r.value.buf);
  }
  const cover = await renderCover({ title: product.title, tagline: product.tagline, type, storeName, direction, image: coverImage });
  const listing = await renderListing(cover, direction.palette);
  console.log(`[ai-cover] ${type} "${line(product.title, 50)}": ${direction.layout}, cover ${coverImage ? "photo" : "designed"}, ${images.size} inside image(s)`);
  return { direction, cover, listing, images, accent: direction.palette.accent };
}
