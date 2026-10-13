import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { httpError } from "./claude.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "digital-templates");
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
    if (shape.kind === "polygon" && (!Array.isArray(shape.points) || shape.points.length < 3 || shape.points.length > 8 || shape.points.some(p => !Array.isArray(p) || p.length !== 2 || p.some(n => !range(n, 0, 1))))) fail(id, "invalid polygon");
    if (shape.kind === "arc" && (![shape.start, shape.end].every(n => range(n, -360, 720)))) fail(id, "invalid arc");
  }
}
export function validateTemplate(t) {
  const id = t?.id;
  if (!/^(guide|checklist|hooks|quotes|planner)-(0[1-9]|10)$/.test(id) || id.split("-")[0] !== t.format) fail(id, "invalid id/format");
  for (const [key, max] of [["name", 70], ["description", 240]]) if (typeof t[key] !== "string" || !t[key].trim() || t[key].length > max) fail(id, `invalid ${key}`);
  if (!Array.isArray(t.tags) || t.tags.length > 8 || t.tags.some(x => typeof x !== "string" || x.length > 40)) fail(id, "invalid tags");
  for (const role of ROLES) if (!/^#[0-9a-f]{6}$/i.test(t.palette?.[role])) fail(id, `invalid ${role} color`);
  if (!["sans", "serif", "display", "mono"].includes(t.fonts?.heading) || !["sans", "serif"].includes(t.fonts?.body)) fail(id, "invalid fonts");
  if (!ROLES.includes(t.cover?.background) || !["ink", "paper"].includes(t.cover?.textColor)) fail(id, "invalid cover roles");
  for (const field of ["title", "subtitle", "eyebrow", "brand"]) {
    box(id, t.cover[field]);
    if (!range(t.cover[field].size, field === "title" ? 28 : field === "subtitle" ? 11 : 8, field === "title" ? 70 : field === "subtitle" ? 20 : 14) || !["left", "center", "right"].includes(t.cover[field].align)) fail(id, "invalid cover typography");
    if (typeof t.sample?.[field] !== "string" || !t.sample[field].trim() || t.sample[field].length > 180) fail(id, "invalid illustrative text");
  }
  shapes(id, t.cover.shapes, 18);
  if (t.cover.shapes.length < 3) fail(id, "missing original composition");
  if (t.cover.image !== null && t.cover.image !== undefined) box(id, t.cover.image);
  const inside = t.interior;
  if (!inside || !range(inside.margin, 34, 60) || !range(inside.headingSize, 22, 34) || !range(inside.bodySize, 10, 12.5) || !range(inside.lineHeight, 1.35, 1.65) || !["rule", "band", "side", "stack", "pill"].includes(inside.headerStyle) || !["plain", "cards", "stripe", "outline", "steps"].includes(inside.blockStyle) || !["single", "sidebar"].includes(inside.column) || !["plain", "pill", "large", "none"].includes(inside.numberStyle)) fail(id, "invalid reading-page settings");
  shapes(id, inside.shapes, 6);
  return t;
}
export const digitalTemplates = Object.freeze(DIGITAL_FORMATS.flatMap(({ id }) => Array.from({ length: 10 }, (_, i) => {
  const key = `${id}-${String(i + 1).padStart(2, "0")}`;
  const value = validateTemplate(JSON.parse(fs.readFileSync(path.join(root, `${key}.json`), "utf8")));
  if (value.id !== key) fail(key, "file identity mismatch");
  return value;
})));
const byId = new Map(digitalTemplates.map(t => [t.id, t]));
export function templateById(id) {
  const template = byId.get(id);
  if (!template) throw httpError(400, "Choose one of the 50 Snapfront digital designs.");
  return template;
}
export function publicDigitalCatalog() {
  return { version: 1, formats: DIGITAL_FORMATS, templates: digitalTemplates.map(t => ({
    id: t.id, name: t.name, format: t.format, description: t.description, tags: t.tags,
    palette: t.palette, fonts: t.fonts, sample: t.sample, preview_url: `/digital-design-assets/${t.id}.png`,
  })) };
}
