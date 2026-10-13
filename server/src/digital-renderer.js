// One measured scene is rendered into the native SVG preview, Resvg cover and PDFKit export.
// The renderer deliberately accepts image bytes only from its injected resolver: it never fetches
// URLs or reads arbitrary paths from an editable document.
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import PDFDocument from "pdfkit";
import opentype from "opentype.js";
import sharp from "sharp";
import { fontPaths, templateById } from "./digital-catalog.js";
import { documentHash, validateDocument } from "./digital-document.js";
import { readTrustedArtwork, trustedArtworkIds } from "./premium-artwork.js";

const LETTER = Object.freeze({ width: 612, height: 792 });
const QUOTE = Object.freeze({ width: 576, height: 720 });
const MAX_RENDERED_PAGES = 150;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_DISTINCT_IMAGES = 32;
const FONT_ORDER = ["sans", "sansBold", "serif", "mono", "display"];
const ROLE_NAMES = new Set(["paper", "ink", "accent", "muted", "soft"]);
const TEMPLATE_SHAPES = new Set(["rect", "ellipse", "line", "arc", "polygon"]);
const GRADIENT_DIRECTIONS = new Set(["vertical", "horizontal", "diagonal"]);
const TRUSTED_ARTWORK_IDS = new Set(trustedArtworkIds);
const SVG_PAGE_LIMIT = 2 * 1024 * 1024;

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
}

function attr(value) { return esc(value).replace(/\n/g, "&#10;"); }
function n(value) { return Number.isFinite(value) ? Number(value.toFixed(3)) : 0; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function sizeFor(format) { return format === "quotes" ? QUOTE : LETTER; }
function role(palette, name) { return palette[ROLE_NAMES.has(name) ? name : "ink"]; }

function validNumber(value, min, max) { return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max; }
function validBox(value, allowZero = false) {
  return value && validNumber(value.x, 0, 1) && validNumber(value.y, 0, 1)
    && validNumber(value.w, allowZero ? 0 : 0.001, 1) && validNumber(value.h, allowZero ? 0 : 0.001, 1)
    && value.x + value.w <= 1.00001 && value.y + value.h <= 1.00001;
}

function validGradient(value) {
  return value && typeof value === "object" && ROLE_NAMES.has(value.from) && ROLE_NAMES.has(value.to) && GRADIENT_DIRECTIONS.has(value.direction);
}

/** Renderer-side guard in case a packaged template is replaced after catalog startup. */
function assertTemplate(template) {
  if (!template || typeof template !== "object") throw fail("The selected digital template is unavailable.");
  if (!template.cover || !template.interior || !template.palette || !template.fonts) throw fail("The selected digital template is incomplete.");
  for (const color of Object.values(template.palette)) if (typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color)) throw fail("The selected digital template has an invalid palette.");
  if (!ROLE_NAMES.has(template.cover.background) || !ROLE_NAMES.has(template.cover.textColor)) throw fail("The selected digital template has invalid cover colors.");
  for (const field of ["title", "subtitle", "eyebrow", "brand"]) {
    const region = template.cover[field];
    if (!validBox(region) || !validNumber(region.size, 5, 90) || !["left", "center", "right"].includes(region.align)) {
      throw fail("The selected digital template has invalid cover text regions.");
    }
  }
  if (template.design_revision === 2) {
    if (template.cover.gradient !== undefined && !validGradient(template.cover.gradient)) throw fail("The selected digital template has an invalid cover gradient.");
    if (template.cover.fieldColors !== undefined && (!template.cover.fieldColors || typeof template.cover.fieldColors !== "object" || Object.entries(template.cover.fieldColors).some(([field, color]) => !["title", "subtitle", "eyebrow", "brand"].includes(field) || !ROLE_NAMES.has(color)))) throw fail("The selected digital template has invalid cover field colors.");
    if (!Array.isArray(template.cover.artworks) || !template.cover.artworks.length || template.cover.artworks.length > 3) throw fail("The selected digital template has no trusted cover artwork.");
    for (const artwork of template.cover.artworks) {
      if (!artwork || !TRUSTED_ARTWORK_IDS.has(artwork.id) || !validBox(artwork) || !["cover", "contain"].includes(artwork.fit) || !validNumber(artwork.opacity, 0, 1)) throw fail("The selected digital template has invalid trusted cover artwork.");
    }
    if (template.interior.gradient !== undefined && !validGradient(template.interior.gradient)) throw fail("The selected digital template has an invalid interior gradient.");
    if (template.interior.chapterStyle !== undefined && !["editorial", "technical", "gallery"].includes(template.interior.chapterStyle)) throw fail("The selected digital template has an invalid chapter style.");
    if (template.interior.ornament !== undefined && !["chrome-rule", "split-rail", "micro-grid", "none"].includes(template.interior.ornament)) throw fail("The selected digital template has an invalid interior ornament.");
  }
  const allShapes = [template.cover.shapes, template.interior.shapes];
  for (const shapes of allShapes) {
    if (!Array.isArray(shapes)) throw fail("The selected digital template has invalid geometry.");
    for (const shape of shapes) {
      if (!shape || !TEMPLATE_SHAPES.has(shape.kind) || !ROLE_NAMES.has(shape.fill) || !validBox(shape, true)) throw fail("The selected digital template has invalid geometry.");
      if (shape.opacity !== undefined && !validNumber(shape.opacity, 0, 1)) throw fail("The selected digital template has invalid geometry.");
      if (shape.stroke !== undefined && !validNumber(shape.stroke, 0, 6)) throw fail("The selected digital template has invalid geometry.");
      if (shape.radius !== undefined && !validNumber(shape.radius, 0, 0.1)) throw fail("The selected digital template has invalid geometry.");
      if (shape.kind === "polygon" && (!Array.isArray(shape.points) || shape.points.length < 3 || shape.points.length > 8 || shape.points.some((p) => !Array.isArray(p) || p.length !== 2 || !p.every((v) => validNumber(v, 0, 1))))) throw fail("The selected digital template has invalid polygon geometry.");
      if (shape.kind === "arc" && ![shape.start, shape.end].every((v) => validNumber(v, -360, 720))) throw fail("The selected digital template has invalid arc geometry.");
    }
  }
  return template;
}

const fontBuffers = new Map();
const fontMetrics = new Map();

function keyPath(key) {
  return ({ sans: fontPaths.sansRegular, sansBold: fontPaths.sansBold, serif: fontPaths.serif, mono: fontPaths.mono, display: fontPaths.display })[key];
}

function fontBuffer(key) {
  if (!FONT_ORDER.includes(key)) throw fail(`Unknown bundled font ${key}.`);
  if (!fontBuffers.has(key)) fontBuffers.set(key, fs.readFileSync(keyPath(key)));
  return fontBuffers.get(key);
}

function metricFont(key) {
  if (!fontMetrics.has(key)) {
    const bytes = fontBuffer(key);
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const font = opentype.parse(data);
    if (!font) throw fail(`Could not read bundled font ${key}.`, 500);
    fontMetrics.set(key, font);
  }
  return fontMetrics.get(key);
}

function familyFor(key) {
  const names = metricFont(key).names || {};
  // opentype.js v2 keeps name records below Windows/Unicode/Macintosh tables.
  // Prefer the family over fullName so the @font-face declaration and Resvg's
  // loaded font file resolve to the same face.
  for (const table of [names.windows, names.unicode, names.macintosh, names]) {
    const value = table?.preferredFamily?.en || table?.fontFamily?.en || table?.fullName?.en;
    if (value) return value;
  }
  return `Snapfront-${key}`;
}

function fontWeight(key) {
  return ({ sans: 400, sansBold: 700, serif: 400, mono: 400, display: 800 })[key] || 400;
}

function headingFont(document) {
  return ({ sans: "sansBold", serif: "serif", display: "display", mono: "mono" })[document.fonts.heading] || "sansBold";
}
function bodyFont(document) { return document.fonts.body === "serif" ? "serif" : "sans"; }

/** Measured with the same bundled OpenType files that PDFKit/Resvg receive. */
function textWidth(text, font, size) {
  if (!text) return 0;
  const face = metricFont(font);
  const scale = size / face.unitsPerEm;
  let width = 0;
  let previous = null;
  // opentype.js's Bidi shaping currently throws on DM Sans's lookup type 6,
  // while this deterministic glyph/pair-kerning path works for every bundled face.
  for (const character of String(text)) {
    const glyph = face.charToGlyph(character);
    if (glyph.index === 0 && !/\s/.test(character)) {
      throw fail(`The selected typeface cannot display “${character}” (U+${character.codePointAt(0).toString(16).toUpperCase()}). Use a supported character or another typeface before exporting. Your source text has not been removed.`);
    }
    if (previous) {
      try { width += face.getKerningValue(previous, glyph) * scale; } catch { /* absent/unsupported kerning table */ }
    }
    width += (glyph.advanceWidth || face.unitsPerEm * 0.5) * scale;
    previous = glyph;
  }
  return width;
}

function lineX(line, x, width, font, size, align) {
  const used = textWidth(line, font, size);
  if (align === "center") return x + Math.max(0, (width - used) / 2);
  if (align === "right") return x + Math.max(0, width - used);
  return x;
}

// Splits only after preserving every code point. Long URL-like words are split by real glyph
// width rather than allowed to run out of the printable box.
function splitLongWord(word, width, font, size) {
  const parts = [];
  let part = "";
  for (const glyph of Array.from(word)) {
    if (part && textWidth(part + glyph, font, size) > width) { parts.push(part); part = glyph; }
    else part += glyph;
  }
  if (part || !parts.length) parts.push(part);
  return parts;
}

function wrapText(value, width, font, size) {
  const all = String(value ?? "");
  const lines = [];
  for (const paragraph of all.split("\n")) {
    if (paragraph === "") { lines.push(""); continue; }
    const words = paragraph.match(/\S+/g) || [""];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, font, size) <= width) { line = candidate; continue; }
      if (line) { lines.push(line); line = ""; }
      if (textWidth(word, font, size) <= width) line = word;
      else {
        const parts = splitLongWord(word, width, font, size);
        lines.push(...parts.slice(0, -1));
        line = parts.at(-1) || "";
      }
    }
    lines.push(line);
  }
  return lines.length ? lines : [""];
}

function textFits(text, region, font, desiredSize, lineHeight) {
  let size = desiredSize;
  const words = String(text ?? "").match(/\S+/g) || [];
  while (size >= 6) {
    // A cover is a compact consumer-facing composition. Preserve whole words whenever
    // a smaller readable type size fits; flow-body text still supports long URL splitting.
    if (size > 6 && words.some((word) => textWidth(word, font, size) > region.w)) {
      size = Number((size - 0.5).toFixed(2));
      continue;
    }
    const lines = wrapText(text, region.w, font, size);
    if (lines.length * size * lineHeight <= region.h + 0.01) return { size, lines };
    size = Number((size - 0.5).toFixed(2));
  }
  return null;
}

function pageScene(width, height, sourcePageId = null, kind = "interior") {
  return { width, height, sourcePageId, kind, elements: [] };
}

function normalizedShape(shape, palette, width, height) {
  const color = role(palette, shape.fill);
  const base = { type: shape.kind, x: shape.x * width, y: shape.y * height, w: shape.w * width, h: shape.h * height, opacity: shape.opacity ?? 1 };
  if (shape.kind === "rect" || shape.kind === "ellipse" || shape.kind === "polygon") {
    // Filled mats/rails use fill. A numeric template stroke is an outline in the
    // same palette color; circles with a paper fill therefore become true rings.
    base.fill = shape.hollow === true ? null : color;
    if (shape.stroke) { base.stroke = color; base.strokeWidth = shape.stroke; }
  } else {
    base.color = color;
    base.stroke = shape.stroke || 1;
  }
  if (shape.radius) base.radius = shape.radius * Math.min(width, height);
  if (shape.kind === "polygon") base.points = shape.points.map(([x, y]) => [base.x + x * base.w, base.y + y * base.h]);
  if (shape.kind === "arc") { base.start = shape.start; base.end = shape.end; }
  return base;
}

function addText(scene, { x, y, width, lines, font, size, lineHeight = 1.35, color, align = "left", blockId, field }) {
  const lh = size * lineHeight;
  const positioned = lines.map((line, index) => ({ text: line, x: lineX(line, x, width, font, size, align), y: y + index * lh }));
  scene.elements.push({ type: "text", x, y, width, lines: positioned, font, size, lineHeight: lh, color, align, blockId, field });
}

function addLine(scene, { x1, y1, x2, y2, color, width = 1, opacity = 1, blockId }) {
  scene.elements.push({ type: "line", x: x1, y: y1, w: x2 - x1, h: y2 - y1, color, stroke: width, opacity, blockId });
}

function addRect(scene, { x, y, w, h, fill = null, stroke = null, strokeWidth = 0, radius = 0, opacity = 1, blockId }) {
  scene.elements.push({ type: "rect", x, y, w, h, fill, stroke, strokeWidth, radius, opacity, blockId });
}

function arcBezier(x, y, w, h, startDeg, endDeg) {
  const cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2;
  const start = startDeg * Math.PI / 180;
  let end = endDeg * Math.PI / 180;
  if (end === start) end += Math.PI * 2;
  const direction = end > start ? 1 : -1;
  const segments = Math.ceil(Math.abs(end - start) / (Math.PI / 2));
  const step = (end - start) / segments;
  const point = (angle) => [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry];
  const pieces = [];
  let angle = start;
  for (let i = 0; i < segments; i++) {
    const next = angle + step;
    const k = (4 / 3) * Math.tan(Math.abs(next - angle) / 4) * direction;
    const p0 = point(angle), p3 = point(next);
    const c1 = [p0[0] - Math.sin(angle) * rx * k, p0[1] + Math.cos(angle) * ry * k];
    const c2 = [p3[0] + Math.sin(next) * rx * k, p3[1] - Math.cos(next) * ry * k];
    pieces.push({ p0, c1, c2, p3 });
    angle = next;
  }
  return pieces;
}

function svgPathFromArc(element) {
  const pieces = arcBezier(element.x, element.y, element.w, element.h, element.start, element.end);
  if (!pieces.length) return "";
  return `M ${n(pieces[0].p0[0])} ${n(pieces[0].p0[1])} ${pieces.map((p) => `C ${n(p.c1[0])} ${n(p.c1[1])} ${n(p.c2[0])} ${n(p.c2[1])} ${n(p.p3[0])} ${n(p.p3[1])}`).join(" ")}`;
}

function svgFontCss(fontKeys) {
  return fontKeys.map((key) => {
    const file = keyPath(key);
    const mime = path.extname(file).toLowerCase() === ".otf" ? "font/otf" : "font/ttf";
    const format = mime === "font/otf" ? "opentype" : "truetype";
    return `@font-face{font-family:${JSON.stringify(familyFor(key))};font-weight:${fontWeight(key)};src:url(data:${mime};base64,${fontBuffer(key).toString("base64")}) format('${format}');font-display:block;}`;
  }).join("");
}

function svgElement(element) {
  const opacity = element.opacity === undefined || element.opacity === 1 ? "" : ` opacity=\"${n(element.opacity)}\"`;
  if (element.type === "gradient") {
    return `<rect x=\"${n(element.x)}\" y=\"${n(element.y)}\" width=\"${n(element.w)}\" height=\"${n(element.h)}\" fill=\"url(#${attr(element.svgId)})\"${opacity}/>`;
  }
  if (element.type === "rect") {
    const fill = element.fill ? ` fill=\"${attr(element.fill)}\"` : " fill=\"none\"";
    const stroke = element.stroke ? ` stroke=\"${attr(element.stroke)}\" stroke-width=\"${n(element.strokeWidth)}\"` : "";
    return `<rect x=\"${n(element.x)}\" y=\"${n(element.y)}\" width=\"${n(element.w)}\" height=\"${n(element.h)}\"${element.radius ? ` rx=\"${n(element.radius)}\" ry=\"${n(element.radius)}\"` : ""}${fill}${stroke}${opacity}/>`;
  }
  if (element.type === "ellipse") {
    const fill = element.fill || element.color || "none";
    const stroke = element.stroke ? ` stroke=\"${attr(element.stroke)}\" stroke-width=\"${n(element.strokeWidth || 1)}\"` : "";
    return `<ellipse cx=\"${n(element.x + element.w / 2)}\" cy=\"${n(element.y + element.h / 2)}\" rx=\"${n(Math.abs(element.w) / 2)}\" ry=\"${n(Math.abs(element.h) / 2)}\" fill=\"${attr(fill)}\"${stroke}${opacity}/>`;
  }
  if (element.type === "line") return `<line x1=\"${n(element.x)}\" y1=\"${n(element.y)}\" x2=\"${n(element.x + element.w)}\" y2=\"${n(element.y + element.h)}\" stroke=\"${attr(element.color)}\" stroke-width=\"${n(element.stroke || 1)}\" stroke-linecap=\"round\"${opacity}/>`;
  if (element.type === "arc") return `<path d=\"${svgPathFromArc(element)}\" fill=\"none\" stroke=\"${attr(element.color)}\" stroke-width=\"${n(element.stroke || 1)}\" stroke-linecap=\"round\"${opacity}/>`;
  if (element.type === "polygon") {
    const fill = element.fill || element.color || "none";
    const stroke = element.stroke ? ` stroke=\"${attr(element.stroke)}\" stroke-width=\"${n(element.strokeWidth || 1)}\"` : "";
    return `<polygon points=\"${element.points.map(([x, y]) => `${n(x)},${n(y)}`).join(" ")}\" fill=\"${attr(fill)}\"${stroke}${opacity}/>`;
  }
  if (element.type === "text") {
    const family = familyFor(element.font);
    const spans = element.lines.map((line) => `<tspan x=\"${n(line.x)}\" y=\"${n(line.y)}\">${esc(line.text)}</tspan>`).join("");
    return `<text font-family=\"${attr(family)}\" font-weight=\"${fontWeight(element.font)}\" font-size=\"${n(element.size)}\" fill=\"${attr(element.color)}\" dominant-baseline=\"text-before-edge\" xml:space=\"preserve\">${spans}</text>`;
  }
  if (element.type === "checkbox") return `<rect x=\"${n(element.x)}\" y=\"${n(element.y)}\" width=\"${n(element.size)}\" height=\"${n(element.size)}\" rx=\"${n(element.size * 0.14)}\" fill=\"none\" stroke=\"${attr(element.color)}\" stroke-width=\"${n(element.stroke || 0.9)}\"${opacity}/>`;
  if (element.type === "image") {
    const preserve = element.fit === "cover" ? "xMidYMid slice" : "xMidYMid meet";
    return `<image href=\"data:${element.mime};base64,${element.buffer.toString("base64")}\" x=\"${n(element.x)}\" y=\"${n(element.y)}\" width=\"${n(element.w)}\" height=\"${n(element.h)}\" preserveAspectRatio=\"${preserve}\"${opacity}/>`;
  }
  return "";
}

function sceneSvg(scene) {
  const elements = scene.elements.map((element, index) => element.type === "gradient" ? { ...element, svgId: `digital-gradient-${index}` } : element);
  const keys = [...new Set(elements.filter((e) => e.type === "text").map((e) => e.font))];
  // An all-geometric page still receives a bundled body face so native SVG consumers never
  // substitute a network/system font when text is added by an accessibility layer.
  if (!keys.length) keys.push("sans");
  const pageId = scene.sourcePageId || "cover";
  const gradients = elements.filter((element) => element.type === "gradient").map((element) => `<linearGradient id=\"${element.svgId}\" gradientUnits=\"userSpaceOnUse\" x1=\"${n(element.x1)}\" y1=\"${n(element.y1)}\" x2=\"${n(element.x2)}\" y2=\"${n(element.y2)}\"><stop offset=\"0%\" stop-color=\"${attr(element.from)}\"/><stop offset=\"100%\" stop-color=\"${attr(element.to)}\"/></linearGradient>`).join("");
  const body = elements.map((element) => {
    const marker = element.field ? ` data-digital-page=\"${attr(pageId)}\" data-digital-field=\"${attr(element.field)}\"` : element.blockId ? ` data-digital-page=\"${attr(pageId)}\" data-digital-block=\"${attr(element.blockId)}\"` : "";
    const payload = svgElement(element);
    return marker ? `<g${marker}>${payload}</g>` : payload;
  }).join("");
  const pageMarker = ` data-digital-page=\"${attr(pageId)}\"`;
  const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${n(scene.width)}\" height=\"${n(scene.height)}\" viewBox=\"0 0 ${n(scene.width)} ${n(scene.height)}\" role=\"img\" aria-label=\"Digital design preview\"><defs>${gradients}<style><![CDATA[${svgFontCss(keys)}]]></style></defs><g${pageMarker}>${body}</g></svg>`;
  if (Buffer.byteLength(svg, "utf8") > SVG_PAGE_LIMIT) throw fail("A rendered preview page exceeds the 2 MiB native preview limit. Use a smaller image.", 413);
  return svg;
}

function drawPdfElement(pdf, element) {
  pdf.save();
  if (element.opacity !== undefined) pdf.opacity(element.opacity);
  if (element.type === "gradient") {
    const gradient = pdf.linearGradient(element.x1, element.y1, element.x2, element.y2);
    gradient.stop(0, element.from).stop(1, element.to);
    pdf.rect(element.x, element.y, element.w, element.h).fill(gradient);
  } else if (element.type === "rect") {
    const box = element.radius ? pdf.roundedRect(element.x, element.y, element.w, element.h, element.radius) : pdf.rect(element.x, element.y, element.w, element.h);
    if (element.fill) box.fillColor(element.fill);
    if (element.stroke) box.lineWidth(element.strokeWidth || 1).strokeColor(element.stroke);
    if (element.fill && element.stroke) box.fillAndStroke(element.fill, element.stroke);
    else if (element.fill) box.fill(element.fill);
    else if (element.stroke) box.stroke(element.stroke);
  } else if (element.type === "ellipse") {
    const shape = pdf.ellipse(element.x + element.w / 2, element.y + element.h / 2, Math.abs(element.w / 2), Math.abs(element.h / 2));
    if (element.fill) shape.fillColor(element.fill);
    if (element.stroke) shape.lineWidth(element.strokeWidth || 1).strokeColor(element.stroke);
    if (element.fill && element.stroke) shape.fillAndStroke(element.fill, element.stroke);
    else if (element.fill) shape.fill(element.fill);
    else if (element.stroke) shape.stroke(element.stroke);
  } else if (element.type === "line") {
    pdf.moveTo(element.x, element.y).lineTo(element.x + element.w, element.y + element.h).lineWidth(element.stroke || 1).strokeColor(element.color).stroke();
  } else if (element.type === "arc") {
    const parts = arcBezier(element.x, element.y, element.w, element.h, element.start, element.end);
    if (parts.length) {
      pdf.moveTo(parts[0].p0[0], parts[0].p0[1]);
      for (const part of parts) pdf.bezierCurveTo(part.c1[0], part.c1[1], part.c2[0], part.c2[1], part.p3[0], part.p3[1]);
      pdf.lineWidth(element.stroke || 1).strokeColor(element.color).stroke();
    }
  } else if (element.type === "polygon") {
    if (element.points.length) {
      pdf.moveTo(element.points[0][0], element.points[0][1]);
      for (const point of element.points.slice(1)) pdf.lineTo(point[0], point[1]);
      const shape = pdf.closePath();
      if (element.fill) shape.fillColor(element.fill);
      if (element.stroke) shape.lineWidth(element.strokeWidth || 1).strokeColor(element.stroke);
      if (element.fill && element.stroke) shape.fillAndStroke(element.fill, element.stroke);
      else if (element.fill) shape.fill(element.fill);
      else if (element.stroke) shape.stroke(element.stroke);
    }
  } else if (element.type === "text") {
    pdf.font(element.font).fontSize(element.size).fillColor(element.color);
    for (const line of element.lines) pdf.text(line.text, line.x, line.y, { lineBreak: false, baseline: "top" });
  } else if (element.type === "checkbox") {
    pdf.roundedRect(element.x, element.y, element.size, element.size, element.size * 0.14).lineWidth(element.stroke || 0.9).strokeColor(element.color).stroke();
  } else if (element.type === "image") {
    if (element.clip === true && element.fit === "cover") pdf.rect(element.x, element.y, element.w, element.h).clip();
    pdf.image(element.buffer, element.x, element.y, element.fit === "cover"
      ? { cover: [element.w, element.h], align: "center", valign: "center" }
      : { width: element.w, height: element.h });
  }
  pdf.restore();
}

function pdfBuffer(scenes, document) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ autoFirstPage: false, margin: 0, info: { Title: document.title, Author: document.brand || "Snapfront", Subject: "Digital product" } });
    const chunks = [];
    pdf.on("data", (chunk) => chunks.push(chunk));
    pdf.on("error", reject);
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.registerFont("sans", fontPaths.sansRegular);
    pdf.registerFont("sansBold", fontPaths.sansBold);
    pdf.registerFont("serif", fontPaths.serif);
    pdf.registerFont("mono", fontPaths.mono);
    pdf.registerFont("display", fontPaths.display);
    for (const scene of scenes) {
      pdf.addPage({ size: [scene.width, scene.height], margin: 0 });
      for (const element of scene.elements) drawPdfElement(pdf, element);
    }
    pdf.end();
  });
}

function background(scene, color) { addRect(scene, { x: 0, y: 0, w: scene.width, h: scene.height, fill: color }); }

function addGradient(scene, definition, palette, opacity = 1) {
  if (!definition) return;
  const x = 0, y = 0, w = scene.width, h = scene.height;
  const vector = definition.direction === "horizontal" ? { x1: x, y1: y, x2: x + w, y2: y }
    : definition.direction === "diagonal" ? { x1: x, y1: y, x2: x + w, y2: y + h }
      : { x1: x, y1: y, x2: x, y2: y + h };
  scene.elements.push({ type: "gradient", x, y, w, h, ...vector, from: role(palette, definition.from), to: role(palette, definition.to), opacity });
}

function coverText(scene, document, template, field, value, font, ratio, color) {
  if (!value) return;
  const region = template.cover[field];
  const box = { x: region.x * scene.width, y: region.y * scene.height, w: region.w * scene.width, h: region.h * scene.height };
  const fitted = textFits(value, box, font, region.size * ratio, field === "title" ? 1.05 : 1.3);
  if (!fitted) throw fail(`${field[0].toUpperCase() + field.slice(1)} is too long for this cover template. Shorten it; no text was removed.`);
  const totalH = fitted.lines.length * fitted.size * (field === "title" ? 1.05 : 1.3);
  const y = box.y + Math.max(0, (box.h - totalH) / 2);
  addText(scene, { x: box.x, y, width: box.w, lines: fitted.lines, font, size: fitted.size, lineHeight: field === "title" ? 1.05 : 1.3, color, align: region.align, field });
}

function fitImageBox(box, image, fit = "contain") {
  if (!image?.width || !image?.height) return box;
  const scale = fit === "cover" ? Math.max(box.w / image.width, box.h / image.height) : Math.min(box.w / image.width, box.h / image.height);
  const w = image.width * scale, h = image.height * scale;
  if (fit === "cover") return box;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

async function imageStore(resolveImage) {
  const cache = new Map();
  return async (file) => {
    if (!file || !resolveImage) return null;
    if (cache.has(file)) return cache.get(file);
    if (cache.size >= MAX_DISTINCT_IMAGES) throw fail(`A digital document can render at most ${MAX_DISTINCT_IMAGES} distinct images.`, 413);
    const pending = (async () => {
      let bytes;
      try { bytes = await resolveImage(file); } catch { throw fail(`Could not read stored image ${file}.`); }
      if (bytes === null || bytes === undefined) return null;
      if (!Buffer.isBuffer(bytes)) throw fail(`Stored image ${file} did not resolve to image bytes.`);
      if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw fail(`Stored image ${file} is too large to render.`, 413);
      try {
        const image = sharp(bytes, { animated: false, limitInputPixels: 40_000_000 }).rotate();
        const metadata = await image.metadata();
        if (!metadata.width || !metadata.height) throw new Error("no dimensions");
        // Normalising image data once prevents repeat base64 conversions of source GIF/WebP
        // and caps the size embedded into each SVG/PDF scene.
        const buffer = await image.resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
        return { buffer, mime: "image/jpeg", width: metadata.width, height: metadata.height };
      } catch { throw fail(`Stored image ${file} is not a supported readable image.`); }
    })();
    cache.set(file, pending);
    return pending;
  };
}

function normalizedRegion(region, width, height) {
  return { x: region.x * width, y: region.y * height, w: region.w * width, h: region.h * height };
}

function coverFieldColor(document, template, field) {
  return role(document.palette, template.cover.fieldColors?.[field] || template.cover.textColor);
}

function firstOwnedImage(document) {
  return document.pages.flatMap((page) => page.blocks).find((block) => block.kind === "image" && block.image_file) || null;
}

function addPlacedImage(scene, image, region, fit, extras = {}) {
  const fitted = fitImageBox(region, image, fit);
  scene.elements.push({ type: "image", ...fitted, ...image, fit, ...extras });
}

/** Add only fixed server-owned artwork. Seller bytes travel solely through getImage. */
async function addCoverArtwork(scene, document, template, getImage, getArtwork, includeReplacement = true) {
  const artworks = template.design_revision === 2 ? template.cover.artworks || [] : [];
  const primaryRegion = template.cover.image;
  const replacement = includeReplacement && primaryRegion ? firstOwnedImage(document) : null;
  let replacementImage = null;
  if (replacement) replacementImage = await getImage(replacement.image_file);

  if (!artworks.length) {
    if (replacementImage && primaryRegion) addPlacedImage(scene, replacementImage, normalizedRegion(primaryRegion, scene.width, scene.height), replacement.image_fit || "contain", { blockId: replacement.id });
    return;
  }

  for (let index = 0; index < artworks.length; index++) {
    const artwork = artworks[index];
    if (index === 0 && replacementImage && primaryRegion) {
      // The editable, known-owned image takes the exact primary slot, even when the
      // decorative-art toggle is off. It remains marked for native editor selection.
      addPlacedImage(scene, replacementImage, normalizedRegion(primaryRegion, scene.width, scene.height), replacement.image_fit || "contain", { blockId: replacement.id, clip: true });
      continue;
    }
    if (document.show_artwork === false) continue;
    const image = await getArtwork(artwork.id);
    if (image) addPlacedImage(scene, image, normalizedRegion(artwork, scene.width, scene.height), artwork.fit, { opacity: artwork.opacity, clip: true });
  }
}

async function buildCover(document, template, getImage, getArtwork) {
  const { width, height } = sizeFor(document.format);
  const scene = pageScene(width, height, null, "cover");
  background(scene, role(document.palette, template.cover.background));
  if (template.design_revision === 2) addGradient(scene, template.cover.gradient, document.palette);
  for (const shape of template.cover.shapes.filter(s => s.behindArt === true)) scene.elements.push(normalizedShape(shape, document.palette, width, height));
  await addCoverArtwork(scene, document, template, getImage, getArtwork);
  for (const shape of template.cover.shapes.filter(s => s.behindArt !== true)) scene.elements.push(normalizedShape(shape, document.palette, width, height));
  coverText(scene, document, template, "eyebrow", document.eyebrow, bodyFont(document), 1, coverFieldColor(document, template, "eyebrow"));
  coverText(scene, document, template, "title", document.title, headingFont(document), 1, coverFieldColor(document, template, "title"));
  coverText(scene, document, template, "subtitle", document.subtitle, bodyFont(document), 1, coverFieldColor(document, template, "subtitle"));
  coverText(scene, document, template, "brand", document.brand, bodyFont(document), 1, coverFieldColor(document, template, "brand"));
  return scene;
}

function sourceNumber(source) {
  const matched = String(source.id || "").match(/(\d+)(?!.*\d)/);
  return String(matched ? Number(matched[1]) : 1).padStart(2, "0");
}

function addPremiumOrnament(scene, document, interior, margin) {
  const { width, height } = scene;
  if (interior.ornament === "chrome-rule") {
    addLine(scene, { x1: margin, y1: margin * 0.55, x2: width - margin, y2: margin * 0.55, color: document.palette.accent, width: 0.65, opacity: 0.7 });
    addRect(scene, { x: margin, y: margin * 0.43, w: 27, h: 2, fill: document.palette.accent, opacity: 0.95 });
    addLine(scene, { x1: margin, y1: height - margin * 0.5, x2: width - margin, y2: height - margin * 0.5, color: document.palette.soft, width: 0.6, opacity: 0.85 });
  } else if (interior.ornament === "split-rail") {
    addRect(scene, { x: Math.max(10, margin * 0.38), y: margin * 0.72, w: 1.3, h: height - margin * 1.45, fill: document.palette.accent, opacity: 0.65 });
    addRect(scene, { x: width - Math.max(12, margin * 0.38) - 1.3, y: margin * 0.72, w: 1.3, h: height - margin * 1.45, fill: document.palette.soft, opacity: 0.95 });
  } else if (interior.ornament === "micro-grid") {
    const originX = width - margin * 0.72, originY = margin * 0.32;
    for (let step = 0; step < 4; step++) {
      addLine(scene, { x1: originX + step * 4, y1: originY, x2: originX + step * 4, y2: originY + 12, color: document.palette.muted, width: 0.35, opacity: 0.55 });
      addLine(scene, { x1: originX, y1: originY + step * 4, x2: originX + 12, y2: originY + step * 4, color: document.palette.muted, width: 0.35, opacity: 0.55 });
    }
  }
}

function addPremiumChapterLabel(scene, document, interior, source, headerX, headerY, headerW) {
  if (!interior.chapterStyle) return;
  const number = sourceNumber(source);
  const label = interior.chapterStyle === "technical" ? `SECTION ${number}` : interior.chapterStyle === "gallery" ? `EDITION ${number}` : `CHAPTER ${number}`;
  addText(scene, { x: headerX, y: headerY - 14, width: Math.min(headerW, 150), lines: [label], font: "sansBold", size: 7.4, lineHeight: 1, color: document.palette.accent, blockId: `${source.id}-chapter-label` });
  if (interior.chapterStyle === "gallery") {
    addText(scene, { x: headerX + headerW - 42, y: headerY - 20, width: 42, lines: [number], font: headingFont(document), size: 18, lineHeight: 1, color: document.palette.soft, align: "right", blockId: `${source.id}-chapter-number` });
  }
}

function interiorStart(document, template, source, continuation, pages = []) {
  const { width, height } = sizeFor(document.format);
  const scene = pageScene(width, height, source.id, "interior");
  const interior = template.interior;
  const margin = clamp(interior.margin, 34, 60);
  background(scene, document.palette.paper);
  if (template.design_revision === 2) addGradient(scene, interior.gradient, document.palette, 0.13);
  for (const shape of interior.shapes || []) scene.elements.push(normalizedShape(shape, document.palette, width, height));
  if (template.design_revision === 2) addPremiumOrnament(scene, document, interior, margin);
  const title = source.title || document.title;
  const headFont = headingFont(document), body = bodyFont(document);
  const headerY = margin + (template.design_revision === 2 && interior.chapterStyle ? 9 : 0);
  const headerH = Math.max(44, interior.headingSize * 1.8);
  const headerX = margin + (interior.headerStyle === "side" ? 15 : 0);
  const headerW = width - 2 * margin - (interior.headerStyle === "side" ? 15 : 0);
  const headerText = continuation ? `${title} — continued` : title;
  const fittedHeader = textFits(headerText, { x: headerX, y: headerY, w: headerW, h: headerH - 10 }, headFont, Math.min(interior.headingSize, 28), 1.08);
  if (!fittedHeader) throw fail("A source page title is too long for its template header. Shorten it; no text was removed.");
  if (interior.headerStyle === "band") addRect(scene, { x: margin, y: headerY - 7, w: width - 2 * margin, h: headerH, fill: document.palette.soft, opacity: 0.62 });
  if (interior.headerStyle === "side") addRect(scene, { x: margin, y: headerY - 4, w: 7, h: headerH + 7, fill: document.palette.accent });
  if (interior.headerStyle === "pill") addRect(scene, { x: margin, y: headerY - 4, w: Math.min(width - 2 * margin, 240), h: headerH - 2, fill: document.palette.soft, radius: headerH / 2, opacity: 0.8 });
  if (interior.headerStyle === "rule") addLine(scene, { x1: margin, y1: headerY + headerH, x2: width - margin, y2: headerY + headerH, color: document.palette.accent, width: 1.5 });
  if (interior.headerStyle === "stack") {
    addRect(scene, { x: margin, y: headerY, w: 25, h: 6, fill: document.palette.accent });
    addRect(scene, { x: margin + 31, y: headerY, w: 46, h: 6, fill: document.palette.soft });
  }
  if (interior.headerStyle === "technical") {
    addRect(scene, { x: margin, y: headerY - 7, w: 9, h: 9, fill: document.palette.accent, opacity: 0.95 });
    addLine(scene, { x1: margin + 15, y1: headerY - 2.5, x2: width - margin, y2: headerY - 2.5, color: document.palette.muted, width: 0.7, opacity: 0.7 });
    addLine(scene, { x1: margin, y1: headerY + headerH, x2: width - margin, y2: headerY + headerH, color: document.palette.accent, width: 1.1, opacity: 0.8 });
  }
  if (template.design_revision === 2 && !continuation) addPremiumChapterLabel(scene, document, interior, source, headerX, headerY, headerW);
  addText(scene, { x: headerX, y: headerY + 7, width: headerW, lines: fittedHeader.lines, font: headFont, size: fittedHeader.size, lineHeight: 1.08, color: document.palette.ink });
  const fittedFooter = textFits(document.brand || document.title, { x: margin, y: height - margin, w: width - 2 * margin, h: Math.max(14, margin - 8) }, body, 7.5, 1.1);
  if (!fittedFooter) throw fail("The brand line is too long for the printable footer. Shorten it; no text was removed.");
  const footerY = height - margin + 4;
  addLine(scene, { x1: margin, y1: footerY - 8, x2: width - margin, y2: footerY - 8, color: document.palette.soft, width: 0.7, opacity: 0.9 });
  addText(scene, { x: margin, y: footerY, width: width - 2 * margin, lines: fittedFooter.lines, font: body, size: fittedFooter.size, lineHeight: 1.1, color: document.palette.muted, align: "right" });
  pages.push(scene);
  return { scene, y: headerY + headerH + 17, bottom: height - margin - 22, margin, width: width - 2 * margin, continuation: true, pages };
}

function blockFrame(scene, template, document, x, y, width, height, blockId, step) {
  const style = template.interior.blockStyle;
  if (style === "cards") addRect(scene, { x, y, w: width, h: height, fill: document.palette.soft, radius: 6, opacity: 0.54, blockId });
  if (style === "stripe") addRect(scene, { x, y, w: 4, h: height, fill: document.palette.accent, blockId });
  if (style === "outline") addRect(scene, { x, y, w: width, h: height, stroke: document.palette.muted, strokeWidth: 0.7, radius: 4, opacity: 0.75, blockId });
  if (style === "steps") {
    addRect(scene, { x, y, w: 22, h: 22, fill: document.palette.soft, radius: 11, blockId });
    addText(scene, { x, y: y + 4, width: 22, lines: [String(step)], font: "sansBold", size: 8, lineHeight: 1, color: document.palette.ink, align: "center", blockId });
  }
}

function flowInsets(template) {
  const pad = template.interior.blockStyle === "plain" ? 0 : 7;
  return { left: pad + (template.interior.blockStyle === "stripe" ? 8 : 0) + (template.interior.blockStyle === "steps" ? 28 : 0), right: pad };
}

function textLinesForBlock(block, document, template, availableWidth, ordinal) {
  const body = bodyFont(document);
  const heading = headingFont(document);
  const interior = template.interior;
  const bodySize = interior.bodySize;
  const bodyHeight = bodySize * interior.lineHeight;
  const lines = [];
  const pushText = (text, font, size, height, indent = 0, options = {}) => {
    for (const line of wrapText(text, availableWidth - indent, font, size)) lines.push({ text: line, font, size, height, indent, ...options });
  };
  if (block.kind === "heading") pushText(block.text, heading, interior.headingSize * 0.78, interior.headingSize * 0.95, 0, { color: document.palette.ink });
  else if (block.kind === "paragraph") pushText(block.text, body, bodySize, bodyHeight, 0, { color: document.palette.ink });
  else if (block.kind === "callout") {
    pushText("NOTE", "sansBold", 7.5, 11, 0, { color: document.palette.accent, label: true });
    pushText(block.text, body, bodySize, bodyHeight, 0, { color: document.palette.ink });
  } else if (block.kind === "quote") pushText(block.text, heading, Math.max(14, interior.headingSize * 0.62), Math.max(18, interior.headingSize * 0.78), 0, { color: document.palette.ink });
  else if (block.kind === "list") {
    const checklist = document.format === "checklist" || document.format === "planner";
    block.items.forEach((item, itemIndex) => {
      const itemLines = wrapText(item, availableWidth - 23, body, bodySize);
      itemLines.forEach((line, lineIndex) => lines.push({ text: line, font: body, size: bodySize, height: bodyHeight, indent: 23, color: document.palette.ink,
        checkbox: checklist && lineIndex === 0, number: !checklist && template.interior.numberStyle !== "none" && lineIndex === 0 ? ordinal + itemIndex + 1 : null }));
    });
  } else if (block.kind === "writing") {
    pushText(block.text, body, bodySize, bodyHeight, 0, { color: document.palette.ink });
    for (let i = 0; i < 4; i++) lines.push({ writing: true, height: Math.max(20, bodyHeight * 1.45), color: document.palette.muted });
  }
  return lines;
}

function addFlowBlock(state, document, template, source, block, lines, ordinal) {
  if (!lines.length) return;
  let at = 0;
  const pad = template.interior.blockStyle === "plain" ? 0 : 7;
  while (at < lines.length) {
    const gap = state.y > 0 ? 7 : 0;
    let capacity = state.bottom - state.y - gap - pad * 2;
    if (capacity < lines[at].height) {
      state = interiorStart(document, template, source, true, state.pages);
      continue;
    }
    const take = [];
    let used = 0;
    while (at < lines.length && used + lines[at].height <= capacity + 0.01) { take.push(lines[at++]); used += take.at(-1).height; }
    const y = state.y + gap;
    const h = used + pad * 2;
    blockFrame(state.scene, template, document, state.margin, y, state.width, h, block.id, ordinal);
    let cursor = y + pad;
    for (const line of take) {
      if (line.writing) addLine(state.scene, { x1: state.margin + 3, y1: cursor + line.height - 5, x2: state.margin + state.width, y2: cursor + line.height - 5, color: document.palette.muted, width: 0.55, blockId: block.id });
      else {
        const insets = flowInsets(template);
        const textX = state.margin + insets.left + (line.indent || 0);
        const textW = state.width - insets.left - insets.right - (line.indent || 0);
        if (line.checkbox) state.scene.elements.push({ type: "checkbox", x: state.margin + pad + 2, y: cursor + Math.max(1, (line.height - 11) / 2), size: 11, color: document.palette.muted, stroke: 0.85, blockId: block.id });
        if (line.number !== null && line.number !== undefined) {
          const numberStyle = template.interior.numberStyle;
          if (numberStyle === "pill") addRect(state.scene, { x: state.margin + pad, y: cursor + 1, w: 16, h: 16, fill: document.palette.accent, radius: 8, blockId: block.id });
          addText(state.scene, { x: state.margin + pad, y: cursor + (numberStyle === "pill" ? 4 : 1), width: 16, lines: [String(line.number)], font: "sansBold", size: 7.5, lineHeight: 1, color: numberStyle === "pill" ? document.palette.paper : document.palette.accent, align: "center", blockId: block.id });
        }
        addText(state.scene, { x: textX, y: cursor, width: textW, lines: [line.text], font: line.font, size: line.size, lineHeight: 1, color: line.color, blockId: block.id });
      }
      cursor += line.height;
    }
    state.y = y + h;
  }
  return state;
}

async function addImageBlock(state, document, template, source, block, getImage, ordinal) {
  const image = block.image_file ? await getImage(block.image_file) : null;
  const desired = image ? clamp(state.width * 0.48, 110, 220) : 115;
  if (state.y + desired + 14 > state.bottom) state = interiorStart(document, template, source, true, state.pages);
  const y = state.y + 7;
  blockFrame(state.scene, template, document, state.margin, y, state.width, desired, block.id, ordinal);
  if (image) {
    const outer = { x: state.margin + 8, y: y + 8, w: state.width - 16, h: desired - 16 };
    const fitted = fitImageBox(outer, image, block.image_fit || "contain");
    state.scene.elements.push({ type: "image", ...fitted, ...image, fit: block.image_fit || "contain", blockId: block.id });
  } else {
    addRect(state.scene, { x: state.margin + 8, y: y + 8, w: state.width - 16, h: desired - 16, fill: document.palette.soft, opacity: 0.45, blockId: block.id });
    addText(state.scene, { x: state.margin + 8, y: y + desired / 2 - 6, width: state.width - 16, lines: [block.image_file ? "Stored image unavailable" : "Image placeholder"], font: bodyFont(document), size: 9, lineHeight: 1.2, color: document.palette.muted, align: "center", blockId: block.id });
  }
  state.y = y + desired;
  return state;
}

async function interiorScenes(document, template, getImage, getArtwork) {
  const scenes = [];
  for (const originalSource of document.pages) {
    let source = originalSource;
    // Quote products are printable compositions: every actual quote gets its own print.
    if (document.format === "quotes") {
      const quoteBlocks = source.blocks.filter((block) => block.kind === "quote");
      if (quoteBlocks.length) {
        for (const block of quoteBlocks) scenes.push(...await quoteScenes(document, template, source, block, getImage, getArtwork));
        const rest = source.blocks.filter((block) => block.kind !== "quote");
        if (!rest.length) continue;
        source = { ...source, blocks: rest };
      }
    }
    let state = interiorStart(document, template, source, false, []);
    const startLength = scenes.length;
    for (let index = 0; index < source.blocks.length; index++) {
      const block = source.blocks[index];
      if (block.kind === "image") state = await addImageBlock(state, document, template, source, block, getImage, index + 1);
      else {
        const insets = flowInsets(template);
        state = addFlowBlock(state, document, template, source, block, textLinesForBlock(block, document, template, state.width - insets.left - insets.right, index), index + 1);
      }
    }
    // Empty source pages remain editable/tappable and render a readable blank worksheet page.
    if (source.blocks.length === 0 && scenes.length === startLength) scenes.push(...state.pages);
    else scenes.push(...state.pages);
  }
  return scenes;
}

async function quoteScenes(document, template, source, block, getImage, getArtwork) {
  const { width, height } = sizeFor(document.format);
  const region = template.cover.title;
  const margin = Math.max(42, template.interior.margin);
  const available = { x: region.x * width, y: region.y * height, w: region.w * width, h: region.h * height };
  const heading = headingFont(document);
  let size = region.size;
  let lines = wrapText(block.text, available.w, heading, size);
  while (lines.length * size * 1.14 > available.h && size > 12) { size -= 1; lines = wrapText(block.text, available.w, heading, size); }
  const lineCapacity = Math.max(1, Math.floor(available.h / (size * 1.14)));
  const scenes = [];
  for (let offset = 0; offset < lines.length; offset += lineCapacity) {
    const scene = pageScene(width, height, source.id, "quote");
    background(scene, role(document.palette, template.cover.background));
    if (template.design_revision === 2) addGradient(scene, template.cover.gradient, document.palette);
    for (const shape of (template.cover.shapes || []).filter(s => s.behindArt === true)) scene.elements.push(normalizedShape(shape, document.palette, width, height));
    await addCoverArtwork(scene, document, template, getImage, getArtwork, template.design_revision === 2);
    for (const shape of (template.cover.shapes || []).filter(s => s.behindArt !== true)) scene.elements.push(normalizedShape(shape, document.palette, width, height));
    const part = lines.slice(offset, offset + lineCapacity);
    const used = part.length * size * 1.14;
    addText(scene, { x: available.x, y: available.y + Math.max(0, (available.h - used) / 2), width: available.w, lines: part, font: heading, size, lineHeight: 1.14, color: coverFieldColor(document, template, "title"), align: region.align, blockId: block.id });
    const brand = template.cover.brand;
    addText(scene, { x: brand.x * width, y: brand.y * height, width: brand.w * width, lines: wrapText(document.brand || document.title, brand.w * width, bodyFont(document), Math.min(brand.size, 9)), font: bodyFont(document), size: Math.min(brand.size, 9), lineHeight: 1.1, color: coverFieldColor(document, template, "brand"), align: brand.align, blockId: block.id });
    if (offset) addText(scene, { x: margin, y: height * 0.9, width: width - 2 * margin, lines: ["continued"], font: bodyFont(document), size: 7.5, lineHeight: 1, color: document.palette.muted, align: "center", blockId: block.id });
    scenes.push(scene);
  }
  return scenes;
}

async function buildScenes(document, resolveImage) {
  const clean = validateDocument(document);
  const template = assertTemplate(templateById(clean.template_id, clean.design_revision ?? 1));
  const getImage = await imageStore(resolveImage);
  const getArtwork = await imageStore(readTrustedArtwork);
  const cover = await buildCover(clean, template, getImage, getArtwork);
  const interiors = await interiorScenes(clean, template, getImage, getArtwork);
  const scenes = [cover, ...interiors];
  if (scenes.length > MAX_RENDERED_PAGES) throw fail(`This document renders to ${scenes.length} pages; the preview/export maximum is ${MAX_RENDERED_PAGES}. Shorten the content or split it into smaller products.`);
  return { clean, template, scenes };
}

/** Render safe, self-contained native preview SVG pages. */
export async function renderDigitalPreview(document, resolveImage) {
  const { clean, scenes } = await buildScenes(document, resolveImage);
  const pages = scenes.map((scene, index) => ({ index, source_page_id: scene.sourcePageId, svg: sceneSvg(scene), width: scene.width, height: scene.height }));
  return { pages, page_count: pages.length, document_hash: documentHash(clean) };
}

/** Render one PDF with real selectable text plus the Resvg raster cover and SVG preview. */
export async function renderDigitalExport(document, resolveImage) {
  const { clean, scenes } = await buildScenes(document, resolveImage);
  const pages = scenes.map((scene, index) => ({ index, source_page_id: scene.sourcePageId, svg: sceneSvg(scene), width: scene.width, height: scene.height }));
  const cover = new Resvg(pages[0].svg, {
    fitTo: { mode: "width", value: 1224 },
    font: { fontFiles: FONT_ORDER.map(keyPath), loadSystemFonts: false, defaultFontFamily: familyFor(bodyFont(clean)) },
  }).render().asPng();
  const pdf = await pdfBuffer(scenes, clean);
  return { pdf, cover, preview: { pages, page_count: pages.length, document_hash: documentHash(clean) } };
}
