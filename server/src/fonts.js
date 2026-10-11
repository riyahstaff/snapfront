// Fonts for server-rendered graphics (marketing posts): each store's theme fonts, downloaded once from
// Google Fonts as static TTF files and cached on the data volume, plus text measuring for wrapping.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import { config } from "./config.js";

const BUNDLED = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "fonts");
const FALLBACK = { display: path.join(BUNDLED, "BricolageGrotesque-ExtraBold.ttf"), body: path.join(BUNDLED, "DMSans-Regular.ttf"), bold: path.join(BUNDLED, "DMSans-Bold.ttf") };
const cacheDir = () => path.join(config.dataDir, "fonts");
const parsed = new Map();
let fetchImpl = (...a) => fetch(...a);
export function setFontFetch(f) { fetchImpl = f; }   // tests

/** Path to a TTF for this family and weight (downloaded on first use); falls back to a bundled font. */
export async function fontFile(family, weight = 400, role = "body") {
  const name = `${family.replace(/[^\w]+/g, "")}-${weight}.ttf`;
  const file = path.join(cacheDir(), name);
  if (fs.existsSync(file)) return file;
  try {
    // The v1 CSS API returns static TTF instances, which the SVG renderer handles reliably.
    const css = await (await fetchImpl(`https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}:${weight}`, { signal: AbortSignal.timeout(15_000) })).text();
    const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
    if (!url) throw new Error("no ttf in css");
    const buf = Buffer.from(await (await fetchImpl(url, { signal: AbortSignal.timeout(30_000) })).arrayBuffer());
    if (buf.length < 1000) throw new Error("font too small");
    fs.mkdirSync(cacheDir(), { recursive: true });
    fs.writeFileSync(file, buf);
    return file;
  } catch (e) {
    console.warn("[fonts]", family, weight, e.message);
    return role === "display" ? FALLBACK.display : weight >= 600 ? FALLBACK.bold : FALLBACK.body;
  }
}

/** The family name inside a TTF (what SVG text must ask for). */
export function familyOf(file) {
  const n = font(file).names, pick = (t) => t?.preferredFamily?.en || t?.fontFamily?.en;
  return pick(n.windows) || pick(n.unicode) || pick(n.macintosh) || pick(n) || "sans-serif";
}
/** The weight class (400, 700, 800...) a TTF declares. */
export const weightOf = (file) => font(file).tables.os2?.usWeightClass || 400;

function font(file) {
  if (!parsed.has(file)) { const b = fs.readFileSync(file); parsed.set(file, opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length))); }
  return parsed.get(file);
}

/** Width of text in px at a size, with letter spacing in em. */
export function measure(file, text, size, tracking = 0) {
  const f = font(file), str = String(text), scale = size / f.unitsPerEm;
  // Glyph by glyph (opentype.js's full shaping trips on some fonts' ligature tables), with pair kerning.
  let w = 0, prev = null;
  for (const ch of str) {
    const g = f.charToGlyph(ch);
    if (prev) { try { w += f.getKerningValue(prev, g) * scale; } catch { /* no kerning */ } }
    w += (g.advanceWidth || f.unitsPerEm * 0.5) * scale;
    prev = g;
  }
  return w + Math.max(0, [...str].length - 1) * tracking * size;
}

/** Break text into lines that fit `width`; returns at most `maxLines` (the last one ends with … if cut). */
export function wrap(file, text, size, width, maxLines = 4, tracking = 0) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (measure(file, next, size, tracking) <= width || !line) line = next;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && measure(file, `${last}…`, size, tracking) > width) last = last.replace(/\s*\S+$/, "");
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

/** The biggest size (≤ max) at which text fits in `lines` lines of `width`. */
export function fitSize(file, text, width, maxLines, max, min = 24, tracking = 0) {
  for (let s = max; s >= min; s -= 2) {
    const l = wrap(file, text, s, width, 99, tracking);
    if (l.length <= maxLines && l.every((x) => measure(file, x, s, tracking) <= width)) return s;
  }
  return min;
}
