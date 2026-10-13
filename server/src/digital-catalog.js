import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { httpError } from "./claude.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "digital-templates");
const premiumRoot = path.join(root, "premium");
const fontRoot = path.join(here, "..", "assets", "fonts");
export const fontPaths = Object.freeze({
  sansRegular: path.join(fontRoot, "DMSans-Regular.ttf"),
  sansBold: path.join(fontRoot, "DMSans-Bold.ttf"),
  serif: path.join(fontRoot, "SourceSerif4-Regular.otf"),
  mono: path.join(fontRoot, "LiberationMono-Regular.ttf"),
  display: path.join(fontRoot, "BricolageGrotesque-ExtraBold.ttf"),
});
export const DIGITAL_FORMATS = Object.freeze([
  { id: "guide", name: "Mini e-books" },
  { id: "checklist", name: "Checklists & worksheets" },
  { id: "hooks", name: "Content prompt packs" },
  { id: "quotes", name: "Quote prints" },
  { id: "planner", name: "Planners" },
]);
const ROLES = ["paper", "ink", "accent", "muted", "soft"];
const COVER_FIELDS = ["title", "subtitle", "eyebrow", "brand"];
// This finite server-owned vocabulary is deliberately not derived from a template or
// document path. The extra material studies are sibling Snapfront artwork, not seller media.
const ARTWORK_IDS = new Set(["chrome-gateway", "pearl-sculpture", "amethyst-glass", "emerald-architecture", "optical-silver", "silk-silver", "ice-prism", "copper-orbit", "stone-silver"]);
const range = (n, min, max) => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
const fail = (id, message) => { throw new Error(`Digital template ${id}: ${message}`); };
function box(id, value, zero = false) {
  if (!value || !range(value.x, 0, 1) || !range(value.y, 0, 1) || !range(value.w, zero ? 0 : 0.01, 1) || !range(value.h, zero ? 0 : 0.01, 1) || value.x + value.w > 1.00001 || value.y + value.h > 1.00001) fail(id, "invalid normalized region");
}
function shapes(id, list, max) {
  if (!Array.isArray(list) || list.length > max) fail(id, "invalid geometry count");
  for (const shape of list) {
    if (!["rect", "ellipse", "line", "arc", "polygon"].includes(shape.kind) || !ROLES.includes(shape.fill)) fail(id, "invalid original shape");
    box(id, shape, true);
    if (shape.opacity !== undefined && !range(shape.opacity, 0, 1)) fail(id, "invalid opacity");
    if (shape.stroke !== undefined && !range(shape.stroke, 0, 6)) fail(id, "invalid stroke");
    if (shape.radius !== undefined && !range(shape.radius, 0, 0.1)) fail(id, "invalid radius");
    if (shape.hollow !== undefined && (typeof shape.hollow !== "boolean" || shape.kind !== "rect" || !shape.stroke)) fail(id, "invalid hollow frame");
    if (shape.behindArt !== undefined && (typeof shape.behindArt !== "boolean" || shape.kind !== "rect")) fail(id, "invalid artwork mat");
    if (shape.kind === "polygon" && (!Array.isArray(shape.points) || shape.points.length < 3 || shape.points.length > 8 || shape.points.some(p => !Array.isArray(p) || p.length !== 2 || p.some(n => !range(n, 0, 1))))) fail(id, "invalid polygon");
    if (shape.kind === "arc" && (![shape.start, shape.end].every(n => range(n, -360, 720)))) fail(id, "invalid arc");
  }
}

function gradient(id, value) {
  if (!value || typeof value !== "object" || !ROLES.includes(value.from) || !ROLES.includes(value.to) || !["vertical", "horizontal", "diagonal"].includes(value.direction)) fail(id, "invalid gradient");
}

function artwork(id, value) {
  if (!value || typeof value !== "object" || !ARTWORK_IDS.has(value.id) || !validArtworkBox(value) || !["cover", "contain"].includes(value.fit) || !range(value.opacity, 0, 1)) fail(id, "invalid trusted artwork");
}

function validArtworkBox(value) {
  try { box("artwork", value); return true; } catch { return false; }
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function templateKeys() {
  return DIGITAL_FORMATS.flatMap(({ id }) => Array.from({ length: 10 }, (_, i) => `${id}-${String(i + 1).padStart(2, "0")}`));
}
export function validateTemplate(t) {
  const id = t?.id;
  const revision = t?.design_revision === undefined ? 1 : t.design_revision;
  if (revision !== 1 && revision !== 2) fail(id, "invalid design revision");
  if (revision === 2 && t.design_revision !== 2) fail(id, "missing premium design revision");
  if (!/^(guide|checklist|hooks|quotes|planner)-(0[1-9]|10)$/.test(id) || id.split("-")[0] !== t.format) fail(id, "invalid id/format");
  for (const [key, max] of [["name", 70], ["description", 240]]) if (typeof t[key] !== "string" || !t[key].trim() || t[key].length > max) fail(id, `invalid ${key}`);
  if (!Array.isArray(t.tags) || t.tags.length > 8 || t.tags.some(x => typeof x !== "string" || x.length > 40)) fail(id, "invalid tags");
  for (const role of ROLES) if (!/^#[0-9a-f]{6}$/i.test(t.palette?.[role])) fail(id, `invalid ${role} color`);
  if (!["sans", "serif", "display", "mono"].includes(t.fonts?.heading) || !["sans", "serif"].includes(t.fonts?.body)) fail(id, "invalid fonts");
  if (!ROLES.includes(t.cover?.background) || !["ink", "paper"].includes(t.cover?.textColor)) fail(id, "invalid cover roles");
  for (const field of COVER_FIELDS) {
    box(id, t.cover[field]);
    if (!range(t.cover[field].size, field === "title" ? 28 : field === "subtitle" ? 11 : 8, field === "title" ? revision === 2 ? 86 : 70 : field === "subtitle" ? 20 : 14) || !["left", "center", "right"].includes(t.cover[field].align)) fail(id, "invalid cover typography");
    if (typeof t.sample?.[field] !== "string" || !t.sample[field].trim() || t.sample[field].length > 180) fail(id, "invalid illustrative text");
  }
  shapes(id, t.cover.shapes, revision === 2 ? 36 : 18);
  if (t.cover.shapes.length < 3) fail(id, "missing original composition");
  if (t.cover.image !== null && t.cover.image !== undefined) box(id, t.cover.image);
  if (revision === 2) {
    if (t.cover.gradient !== undefined) gradient(id, t.cover.gradient);
    if (t.cover.fieldColors !== undefined) {
      if (!t.cover.fieldColors || typeof t.cover.fieldColors !== "object" || Array.isArray(t.cover.fieldColors)) fail(id, "invalid field colors");
      for (const [field, color] of Object.entries(t.cover.fieldColors)) if (!COVER_FIELDS.includes(field) || !ROLES.includes(color)) fail(id, "invalid field colors");
    }
    if (!Array.isArray(t.cover.artworks) || !t.cover.artworks.length || t.cover.artworks.length > 3) fail(id, "missing trusted artwork");
    t.cover.artworks.forEach((item) => artwork(id, item));
  }
  const inside = t.interior;
  if (!inside || !range(inside.margin, 34, 60) || !range(inside.headingSize, 22, 34) || !range(inside.bodySize, 10, 12.5) || !range(inside.lineHeight, 1.35, 1.65) || !["rule", "band", "side", "stack", "pill", "technical"].includes(inside.headerStyle) || !["plain", "cards", "stripe", "outline", "steps"].includes(inside.blockStyle) || !["single", "sidebar"].includes(inside.column) || !["plain", "pill", "large", "none"].includes(inside.numberStyle)) fail(id, "invalid reading-page settings");
  shapes(id, inside.shapes, revision === 2 ? 12 : 6);
  if (revision === 2) {
    if (inside.chapterStyle !== undefined && !["editorial", "technical", "gallery"].includes(inside.chapterStyle)) fail(id, "invalid chapter style");
    if (inside.ornament !== undefined && !["chrome-rule", "split-rail", "micro-grid", "none"].includes(inside.ornament)) fail(id, "invalid interior ornament");
    if (inside.gradient !== undefined) gradient(id, inside.gradient);
  }
  return t;
}

function readTemplate(folder, key, revision, optional = false) {
  const file = path.join(folder, `${key}.json`);
  try {
    const value = validateTemplate(JSON.parse(fs.readFileSync(file, "utf8")));
    if (value.id !== key || (revision === 2 && value.design_revision !== 2) || (revision === 1 && value.design_revision !== undefined && value.design_revision !== 1)) fail(key, "file identity or revision mismatch");
    return deepFreeze(value);
  } catch (error) {
    // Premium files are produced independently. A missing or in-flight file must not
    // prevent revision-1 saved products from rendering while the collection arrives.
    if (optional && (error?.code === "ENOENT" || error instanceof SyntaxError)) return null;
    throw error;
  }
}

export const revision1DigitalTemplates = Object.freeze(templateKeys().map((key) => readTemplate(root, key, 1)));
export const digitalTemplates = Object.freeze(templateKeys().map((key) => readTemplate(premiumRoot, key, 2, true)).filter(Boolean));
if (digitalTemplates.length !== templateKeys().length) throw new Error("Premium digital template collection is incomplete; all 50 revision-2 files are required.");
const byRevision = new Map([
  [1, new Map(revision1DigitalTemplates.map((t) => [t.id, t]))],
  [2, new Map(digitalTemplates.map((t) => [t.id, t]))],
]);

export function templateById(id, revision = 2) {
  const template = byRevision.get(revision)?.get(id);
  if (!template) throw httpError(400, "Choose one of the 50 Snapfront digital designs.");
  return template;
}
export function publicDigitalCatalog(revision = 2) {
  const templates = revision === 1 ? revision1DigitalTemplates : revision === 2 ? digitalTemplates : null;
  if (!templates) throw httpError(400, "Choose digital catalog revision 1 or 2.");
  return { version: revision, formats: DIGITAL_FORMATS, templates: templates.map(t => ({
    id: t.id, name: t.name, format: t.format, description: t.description, tags: t.tags,
    palette: t.palette, fonts: t.fonts, sample: { title: t.sample.title, subtitle: t.sample.subtitle, brand: t.sample.brand, eyebrow: t.sample.eyebrow }, design_revision: revision,
    preview_url: revision === 2 ? `/digital-design-assets/v2/${t.id}.png` : `/digital-design-assets/${t.id}.png`,
  })) };
}
