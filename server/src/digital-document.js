// Editable digital-product source documents. This module intentionally normalises only
// object shape (not copy) so a saved source is never silently shortened or rewritten.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { templateById } from "./digital-catalog.js";
import { dirs } from "./config.js";
import { ownsSellerImage } from "./media-ownership.js";

export const DIGITAL_FORMATS = Object.freeze(["guide", "checklist", "hooks", "quotes", "planner"]);
const FORMAT_SET = new Set(DIGITAL_FORMATS);
const PAGE_KINDS = new Set(["content", "quote", "planner"]);
const BLOCK_KINDS = new Set(["heading", "paragraph", "list", "callout", "quote", "writing", "image"]);
const HEADING_FONTS = new Set(["sans", "serif", "display", "mono"]);
const BODY_FONTS = new Set(["sans", "serif"]);
const PALETTE_KEYS = ["paper", "ink", "accent", "muted", "soft"];
const TOP_KEYS = ["schema_version", "design_revision", "show_artwork", "format", "template_id", "title", "subtitle", "brand", "eyebrow", "palette", "fonts", "pages"];
const PAGE_KEYS = ["id", "title", "kind", "blocks"];
const BLOCK_KEYS = ["id", "kind", "text", "items", "image_file", "image_fit"];
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const IMAGE_FILE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}\.(?:jpg|png|webp|gif)$/i;
const HEX = /^#[0-9a-fA-F]{6}$/;

function problem(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value, allowed, label) {
  if (!plainObject(value)) throw problem(`${label} must be an object.`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw problem(`${label} has an unsupported field: ${key}.`);
}

function requiredString(value, label, max) {
  if (typeof value !== "string") throw problem(`${label} must be text.`);
  if (Buffer.byteLength(value, "utf8") > max) throw problem(`${label} is too long (maximum ${max} UTF-8 bytes).`);
  return value;
}

function optionalString(value, label, max) {
  return value === undefined ? undefined : requiredString(value, label, max);
}

function safeId(value, label) {
  if (typeof value !== "string" || !SAFE_ID.test(value)) throw problem(`${label} must use only letters, numbers, hyphens, and underscores.`);
  return value;
}

function byteLength(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function rgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
}

function contrast(a, b) {
  const la = rgb(a).reduce((sum, component, i) => sum + component * [0.2126, 0.7152, 0.0722][i], 0);
  const lb = rgb(b).reduce((sum, component, i) => sum + component * [0.2126, 0.7152, 0.0722][i], 0);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function cleanPalette(value) {
  exactKeys(value, PALETTE_KEYS, "palette");
  const out = {};
  for (const key of PALETTE_KEYS) {
    if (typeof value[key] !== "string" || !HEX.test(value[key])) throw problem(`palette.${key} must be a six-digit hex color.`);
    out[key] = value[key].toUpperCase();
  }
  // Ink is used for all long reading copy and muted is used for labels. Accent is
  // also decorative geometry in several original templates, so it cannot be
  // globally required to contrast against paper.
  if (contrast(out.paper, out.ink) < 4.5) throw problem("palette.paper and palette.ink need high contrast for readable copy.");
  if (contrast(out.paper, out.muted) < 3) throw problem("palette.muted is not readable enough against palette.paper.");
  return out;
}

function cleanFonts(value) {
  exactKeys(value, ["heading", "body"], "fonts");
  if (!HEADING_FONTS.has(value.heading)) throw problem("fonts.heading must be sans, serif, display, or mono.");
  if (!BODY_FONTS.has(value.body)) throw problem("fonts.body must be sans or serif.");
  return { heading: value.heading, body: value.body };
}

function cleanBlock(value, pageNumber, usedBlockIds) {
  exactKeys(value, BLOCK_KEYS, `pages[${pageNumber}].blocks[]`);
  const id = safeId(value.id, `pages[${pageNumber}].blocks[].id`);
  if (usedBlockIds.has(id)) throw problem(`Block id ${id} is repeated. Block ids must be unique across the document.`);
  usedBlockIds.add(id);
  if (!BLOCK_KINDS.has(value.kind)) throw problem("Block kind must be heading, paragraph, list, callout, quote, writing, or image.");

  const out = { id, kind: value.kind };
  const hasText = Object.hasOwn(value, "text");
  const hasItems = Object.hasOwn(value, "items");
  const hasImage = Object.hasOwn(value, "image_file");
  const hasFit = Object.hasOwn(value, "image_fit");

  if (hasText) out.text = requiredString(value.text, `Block ${id} text`, 12000);
  if (hasItems) {
    if (!Array.isArray(value.items)) throw problem(`Block ${id} items must be an array.`);
    if (value.items.length > 100) throw problem(`Block ${id} has more than 100 list items.`);
    out.items = value.items.map((item, i) => requiredString(item, `Block ${id} item ${i + 1}`, 1000));
  }
  if (hasImage) {
    if (value.image_file !== null && (typeof value.image_file !== "string" || !IMAGE_FILE.test(value.image_file))) {
      throw problem(`Block ${id} image_file must be a stored JPG, PNG, WebP, or GIF filename.`);
    }
    out.image_file = value.image_file;
  }
  if (hasFit) {
    if (value.image_fit !== "contain" && value.image_fit !== "cover") throw problem(`Block ${id} image_fit must be contain or cover.`);
    out.image_fit = value.image_fit;
  }

  if (["heading", "paragraph", "callout", "quote", "writing"].includes(out.kind) && !hasText) {
    throw problem(`Block ${id} needs text.`);
  }
  if (out.kind === "list" && !hasItems) throw problem(`List block ${id} needs items.`);
  if (out.kind === "image" && hasItems) throw problem(`Image block ${id} cannot contain list items.`);
  if (out.kind !== "image" && hasImage) throw problem(`Only image blocks can reference image_file.`);
  if (out.kind !== "image" && hasFit) throw problem(`Only image blocks can set image_fit.`);
  return out;
}

/**
 * Validate an untrusted editable source document and return a plain, safe clone.
 * No strings are trimmed, collapsed, or clipped: doing that would lose sellable copy.
 */
export function validateDocument(document) {
  exactKeys(document, TOP_KEYS, "document");
  if (document.schema_version !== 1) throw problem("This digital document uses an unsupported schema version.");
  const hasRevision = Object.hasOwn(document, "design_revision");
  const revision = hasRevision ? document.design_revision : 1;
  if (revision !== 1 && revision !== 2) throw problem("design_revision must be 1 or 2.");
  const hasArtworkSetting = Object.hasOwn(document, "show_artwork");
  if (hasArtworkSetting && typeof document.show_artwork !== "boolean") throw problem("show_artwork must be true or false.");
  if (hasArtworkSetting && revision !== 2) throw problem("show_artwork is available only for design revision 2.");
  if (!FORMAT_SET.has(document.format)) throw problem("Digital format must be guide, checklist, hooks, quotes, or planner.");
  const templateId = safeId(document.template_id, "template_id");
  let template;
  // Missing revision is intentionally revision 1—not today's default catalog design.
  // This preserves both legacy layout output and existing document hashes.
  try { template = templateById(templateId, revision); } catch (error) { throw error?.status ? error : problem("That digital template does not exist."); }
  if (!template || template.id !== templateId) throw problem("That digital template does not exist.");
  if (template.format !== document.format) throw problem("The selected template does not match this document format.");

  const out = {
    schema_version: 1,
    ...(hasRevision ? { design_revision: revision } : {}),
    ...(hasArtworkSetting ? { show_artwork: document.show_artwork } : {}),
    format: document.format,
    template_id: templateId,
    title: requiredString(document.title, "title", 300),
    subtitle: requiredString(document.subtitle, "subtitle", 500),
    brand: requiredString(document.brand, "brand", 200),
    eyebrow: requiredString(document.eyebrow, "eyebrow", 120),
    palette: cleanPalette(document.palette),
    fonts: cleanFonts(document.fonts),
    pages: [],
  };
  if (!Array.isArray(document.pages) || !document.pages.length) throw problem("A digital document needs at least one source page.");
  if (document.pages.length > 60) throw problem("A digital document can have at most 60 source pages.");
  const pageIds = new Set();
  const blockIds = new Set();
  document.pages.forEach((page, pageIndex) => {
    exactKeys(page, PAGE_KEYS, `pages[${pageIndex}]`);
    const id = safeId(page.id, `pages[${pageIndex}].id`);
    if (pageIds.has(id)) throw problem(`Page id ${id} is repeated.`);
    pageIds.add(id);
    if (!PAGE_KINDS.has(page.kind)) throw problem(`Page ${id} kind must be content, quote, or planner.`);
    const title = requiredString(page.title, `Page ${id} title`, 500);
    if (!Array.isArray(page.blocks)) throw problem(`Page ${id} blocks must be an array.`);
    if (page.blocks.length > 40) throw problem(`Page ${id} has more than 40 blocks.`);
    out.pages.push({ id, title, kind: page.kind, blocks: page.blocks.map((block) => cleanBlock(block, pageIndex, blockIds)) });
  });
  const bytes = byteLength(out);
  if (bytes > 200000) throw problem("This digital document exceeds the 200 KB UTF-8 source limit.");
  return out;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** A stable hash of validated source—not layout output, renderer version, or current time. */
export function documentHash(document) {
  return crypto.createHash("sha256").update(stableJson(validateDocument(document)), "utf8").digest("hex");
}

function templateSample(template, overrides = {}) {
  const sample = template.sample || {};
  return {
    title: overrides.title ?? sample.title ?? "Untitled digital product",
    subtitle: overrides.subtitle ?? sample.subtitle ?? "Editable sample content",
    brand: overrides.brand ?? sample.brand ?? "Your brand",
    eyebrow: sample.eyebrow ?? template.format.toUpperCase(),
  };
}

function baseDocument(templateId, overrides = {}, designRevision = 2) {
  if (designRevision !== 1 && designRevision !== 2) throw problem("design_revision must be 1 or 2.");
  const template = templateById(templateId, designRevision);
  const copy = templateSample(template, overrides);
  return {
    schema_version: 1,
    ...(designRevision === 2 ? { design_revision: 2, show_artwork: true } : {}),
    format: template.format,
    template_id: template.id,
    ...copy,
    palette: { ...template.palette },
    fonts: { ...template.fonts },
    pages: [],
  };
}

/** Create original, editable illustrative content for a selected catalog template. */
export function starterDocument(templateId, { title, subtitle, brand, design_revision = 1, show_artwork } = {}) {
  const d = baseDocument(templateId, { title, subtitle, brand }, design_revision);
  if (design_revision === 2 && show_artwork !== undefined) d.show_artwork = show_artwork;
  const page = (id, pageTitle, kind, blocks) => d.pages.push({ id, title: pageTitle, kind, blocks });
  if (d.format === "guide") {
    page("page-01", "Start here", "content", [
      { id: "welcome", kind: "heading", text: "A clear place to begin" },
      { id: "welcome-copy", kind: "paragraph", text: "This is illustrative starter copy. Replace it with your own guidance, examples, and next steps before you publish." },
      { id: "welcome-tip", kind: "callout", text: "Keep one useful action on each page so readers can put the idea to work." },
    ]);
  } else if (d.format === "checklist") {
    page("page-01", "Your first checklist", "content", [
      { id: "check-intro", kind: "paragraph", text: "Use this sample checklist as a starting point, then make every item specific to your buyer." },
      { id: "check-items", kind: "list", items: ["Choose one clear outcome", "Prepare the materials you need", "Complete the first small step", "Review and celebrate progress"] },
      { id: "check-notes", kind: "writing", text: "Notes and adjustments" },
    ]);
  } else if (d.format === "hooks") {
    page("page-01", "Prompts to adapt", "content", [
      { id: "hook-intro", kind: "paragraph", text: "These are illustrative prompts. Edit the bracketed details for your audience and offer." },
      { id: "hook-list", kind: "list", items: ["The simple way to begin [your task]", "What I wish I knew before [a common challenge]", "Try this when [your audience feels stuck]", "A small shift that makes [the result] easier"] },
    ]);
  } else if (d.format === "quotes") {
    // The cover sample for quote designs is itself the approved illustrative quote.
    page("quote-01", "Quote print", "quote", [{ id: "quote-01-copy", kind: "quote", text: d.title }]);
  } else {
    page("page-01", "Weekly focus", "planner", [
      { id: "planner-focus", kind: "writing", text: "This week's most meaningful focus" },
      { id: "planner-actions", kind: "list", items: ["One priority to begin", "One person to contact", "One small task to finish"] },
      { id: "planner-reflect", kind: "writing", text: "What worked well?" },
    ]);
  }
  return validateDocument(d);
}

function generatedString(value, fallback) {
  return typeof value === "string" && value.length ? value : fallback;
}

/**
 * Converts the five existing generated payload shapes into source blocks before any PDF is made.
 * It deliberately does not flatten paragraphs/lists into a single truncated string.
 */
export function documentFromGenerated(result, type, templateId, storeName, designRevision = 1) {
  if (!FORMAT_SET.has(type)) throw problem("Unknown generated digital format.");
  if (designRevision !== 1 && designRevision !== 2) throw problem("design_revision must be 1 or 2.");
  const template = templateById(templateId, designRevision);
  if (template.format !== type) throw problem("The selected template does not match the generated format.");
  if (!plainObject(result)) throw problem("The generated digital product did not contain a source object.", 502);
  const r = result;
  const d = baseDocument(templateId, {
    title: generatedString(r.title, template.sample?.title || "Untitled digital product"),
    subtitle: generatedString(r.tagline, template.sample?.subtitle || "Editable digital product"),
    brand: generatedString(storeName, template.sample?.brand || "Your brand"),
  }, designRevision);
  if (!plainObject(r.content)) throw problem("The generated digital product did not contain its expected content.", 502);
  const content = r.content;
  const asText = (value, fallback = "") => typeof value === "string" ? value : fallback;
  const asList = (value, label) => {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      throw problem(`The generated ${label} must be an array of text.`, 502);
    }
    return value;
  };

  if (type === "guide") {
    if (!Array.isArray(content.chapters)) throw problem("The generated guide did not contain chapters.", 502);
    const chapters = content.chapters;
    chapters.forEach((chapter, index) => {
      const c = plainObject(chapter) ? chapter : {};
      const blocks = [{ id: `chapter-${index + 1}-heading`, kind: "heading", text: asText(c.heading, `Chapter ${index + 1}`) }];
      asList(c.paragraphs, "guide paragraphs").forEach((text, p) => blocks.push({ id: `chapter-${index + 1}-paragraph-${p + 1}`, kind: "paragraph", text }));
      if (typeof c.tip === "string" && c.tip) blocks.push({ id: `chapter-${index + 1}-tip`, kind: "callout", text: c.tip });
      d.pages.push({ id: `chapter-${index + 1}`, title: asText(c.heading, `Chapter ${index + 1}`), kind: "content", blocks });
    });
  } else if (type === "checklist") {
    if (!Array.isArray(content.lists)) throw problem("The generated checklist did not contain lists.", 502);
    const lists = content.lists;
    lists.forEach((list, index) => {
      const l = plainObject(list) ? list : {};
      const blocks = [];
      if (typeof l.intro === "string" && l.intro) blocks.push({ id: `list-${index + 1}-intro`, kind: "paragraph", text: l.intro });
      blocks.push({ id: `list-${index + 1}-items`, kind: "list", items: asList(l.items, "checklist items") });
      d.pages.push({ id: `list-${index + 1}`, title: asText(l.heading, `Checklist ${index + 1}`), kind: "content", blocks });
    });
  } else if (type === "hooks") {
    if (!Array.isArray(content.groups)) throw problem("The generated hook pack did not contain groups.", 502);
    const groups = content.groups;
    groups.forEach((group, index) => {
      const g = plainObject(group) ? group : {};
      d.pages.push({ id: `group-${index + 1}`, title: asText(g.heading, `Prompt group ${index + 1}`), kind: "content", blocks: [
        { id: `group-${index + 1}-items`, kind: "list", items: asList(g.items, "hook items") },
      ] });
    });
  } else if (type === "quotes") {
    const quotes = asList(content.quotes, "quotes");
    quotes.forEach((quote, index) => d.pages.push({ id: `quote-${index + 1}`, title: "Quote print", kind: "quote", blocks: [{ id: `quote-${index + 1}-copy`, kind: "quote", text: quote }] }));
  } else {
    const goals = asList(content.goal_areas, "goal areas");
    d.pages.push({ id: "goals", title: "My goals", kind: "planner", blocks: goals.flatMap((goal, index) => [
      { id: `goal-${index + 1}-title`, kind: "heading", text: goal },
      { id: `goal-${index + 1}-space`, kind: "writing", text: "Notes and next steps" },
    ]) });
    const prompts = asList(content.weekly_prompts, "weekly prompts");
    const weekCount = Math.max(1, prompts.length);
    for (let week = 0; week < weekCount; week++) {
      d.pages.push({ id: `week-${week + 1}`, title: `Week ${week + 1}`, kind: "planner", blocks: [
        { id: `week-${week + 1}-days`, kind: "list", items: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
        { id: `week-${week + 1}-reflection`, kind: "writing", text: prompts[week] || "What went well this week?" },
      ] });
    }
    const habits = asList(content.habits, "habits");
    if (habits.length) d.pages.push({ id: "habits", title: "Habit tracker", kind: "planner", blocks: [{ id: "habit-list", kind: "list", items: habits }] });
  }
  if (!d.pages.length) throw problem("The generated digital product had no usable source pages.", 502);
  return validateDocument(d);
}

/** Validate source and verify every referenced local image belongs to the named seller. */
export function ownedDocument(sellerId, document) {
  if (typeof sellerId !== "string" || !sellerId) throw problem("A seller is required to use stored images.");
  const clean = validateDocument(document);
  for (const page of clean.pages) for (const block of page.blocks) {
    if (block.kind !== "image" || !block.image_file) continue;
    if (!ownsSellerImage(sellerId, block.image_file)) throw problem(`Image ${block.image_file} does not belong to this store.`, 404);
    const imagePath = path.resolve(dirs.images, block.image_file);
    if (path.dirname(imagePath) !== path.resolve(dirs.images) || !fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
      throw problem(`Image ${block.image_file} is no longer available.`, 404);
    }
    // Uploaded source images are normally capped lower. This prevents a deliberately huge
    // local file from turning a preview/export request into an unbounded decode.
    if (fs.statSync(imagePath).size > 12 * 1024 * 1024) throw problem(`Image ${block.image_file} is too large to render.`);
  }
  return clean;
}
