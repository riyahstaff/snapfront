export const DIGITAL_FORMAT_IDS = ["guide", "checklist", "hooks", "quotes", "planner"] as const;
export type DigitalFormat = typeof DIGITAL_FORMAT_IDS[number];
export const DIGITAL_BLOCK_KINDS = ["heading", "paragraph", "list", "callout", "quote", "writing", "image"] as const;
export type DigitalBlockKind = typeof DIGITAL_BLOCK_KINDS[number];
export const DIGITAL_PAGE_KINDS = ["content", "quote", "planner"] as const;
export type DigitalPageKind = typeof DIGITAL_PAGE_KINDS[number];
export const DIGITAL_HEADING_FONTS = ["sans", "serif", "display", "mono"] as const;
export const DIGITAL_BODY_FONTS = ["sans", "serif"] as const;

export type DigitalPalette = { paper: string; ink: string; accent: string; muted: string; soft: string };
export type DigitalFonts = { heading: typeof DIGITAL_HEADING_FONTS[number]; body: typeof DIGITAL_BODY_FONTS[number] };
export type DigitalDesignRevision = 1 | 2;
export type DigitalBlock = {
  id: string;
  kind: DigitalBlockKind;
  text?: string;
  items?: string[];
  image_file?: string | null;
  image_fit?: "contain" | "cover";
};
export type DigitalPage = { id: string; title: string; kind: DigitalPageKind; blocks: DigitalBlock[] };
export type DigitalDocument = {
  schema_version: 1;
  format: DigitalFormat;
  template_id: string;
  /** Omitted documents are legacy revision 1 until a seller explicitly selects a design. */
  design_revision?: DigitalDesignRevision;
  /** Revision-2 artwork is visible unless the seller explicitly turns it off. */
  show_artwork?: boolean;
  title: string;
  subtitle: string;
  brand: string;
  eyebrow: string;
  palette: DigitalPalette;
  fonts: DigitalFonts;
  pages: DigitalPage[];
};

/** The public summary shared by the server catalog and the packaged, offline registry. */
export type DigitalTemplateSummary = {
  id: string;
  name: string;
  format: DigitalFormat;
  /** Older public catalogs omit this and are treated as revision 1 for matching purposes. */
  design_revision?: DigitalDesignRevision;
  description: string;
  tags: string[];
  palette: DigitalPalette;
  fonts: DigitalFonts;
  sample: { title: string; subtitle: string; brand: string; eyebrow: string };
  preview_url: string;
};

/** Missing saved-source metadata remains legacy; new source creation deliberately uses revision 2. */
export function digitalDesignRevision(value: { design_revision?: DigitalDesignRevision } | null | undefined, fallback: DigitalDesignRevision = 1): DigitalDesignRevision {
  const revision = value?.design_revision;
  return revision === 1 || revision === 2 ? revision : fallback;
}

/**
 * A remote catalog may refresh copy only when it belongs to the exact same art/thumbnails package.
 * This keeps a v2 summary from being presented over a v1 native cover (and vice versa).
 */
export function mergeDigitalTemplateSummaries(
  bundledTemplates: readonly DigitalTemplateSummary[],
  remoteTemplates?: readonly DigitalTemplateSummary[] | null,
): DigitalTemplateSummary[] {
  if (!remoteTemplates?.length) return [...bundledTemplates];
  const remoteById = new Map(remoteTemplates.map((template) => [template.id, template]));
  return bundledTemplates.map((bundled) => {
    const remote = remoteById.get(bundled.id);
    return remote && digitalDesignRevision(remote) === digitalDesignRevision(bundled) ? remote : bundled;
  });
}

export const DEFAULT_DIGITAL_PALETTE: DigitalPalette = {
  paper: "#FFFDF8", ink: "#1D2433", accent: "#7052E8", muted: "#64748B", soft: "#EEEAFB",
};

const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_PAGES = 60;
const MAX_BLOCKS = 40;
const MAX_TOTAL_BYTES = 200_000;
const MAX_TEXT = 12_000;
const MAX_ITEMS = 100;
const MAX_ITEM_TEXT = 1_000;
const MAX_TITLE = 300;
const MAX_SUBTITLE = 500;
const MAX_BRAND = 200;
const MAX_EYEBROW = 120;
const OWNED_IMAGE_FILE = /^[\w-]+\.(jpg|png|webp|gif)$/;

export function isDigitalFormat(value: unknown): value is DigitalFormat {
  return typeof value === "string" && (DIGITAL_FORMAT_IDS as readonly string[]).includes(value);
}

export function formatFromTemplateId(templateId: string): DigitalFormat {
  const candidate = templateId.split("-")[0];
  return isDigitalFormat(candidate) ? candidate : "guide";
}

/** IDs are intentionally simple because both renderer attributes and server validation depend on them. */
export function nextDigitalId(prefix: "page" | "block" = "block"): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${stamp}_${random}`;
}

export function cloneDigitalDocument(document: DigitalDocument): DigitalDocument {
  return JSON.parse(JSON.stringify(document)) as DigitalDocument;
}

/**
 * A legacy rebuild deliberately starts with the selected template's illustrative, editable copy.
 * It does not pretend to recover an old PDF's source document.
 */
export function newDigitalDocument(template: Pick<DigitalTemplateSummary, "id" | "format" | "palette" | "fonts" | "sample" | "design_revision"> | string): DigitalDocument {
  const summary = typeof template === "string" ? null : template;
  const templateId = typeof template === "string" ? template : template.id;
  const format = summary?.format ?? formatFromTemplateId(templateId);
  const sample = summary?.sample ?? { title: "Your digital design", subtitle: "Replace this starter copy with your own.", brand: "Your brand", eyebrow: "START HERE" };
  const revision = digitalDesignRevision(summary, 2);
  return {
    schema_version: 1,
    format,
    template_id: templateId,
    design_revision: revision,
    ...(revision === 2 ? { show_artwork: true } : {}),
    title: sample.title,
    subtitle: sample.subtitle,
    brand: sample.brand,
    eyebrow: sample.eyebrow,
    palette: { ...(summary?.palette ?? DEFAULT_DIGITAL_PALETTE) },
    fonts: { ...(summary?.fonts ?? { heading: "sans", body: "sans" }) },
    pages: [{
      id: nextDigitalId("page"),
      title: "Start here",
      kind: "content",
      blocks: [{ id: nextDigitalId("block"), kind: "paragraph", text: "Write your first page here." }],
    }],
  };
}

export function newDigitalBlock(kind: DigitalBlockKind = "paragraph"): DigitalBlock {
  if (kind === "list") return { id: nextDigitalId("block"), kind, items: ["First item"] };
  if (kind === "image") return { id: nextDigitalId("block"), kind, image_file: null, image_fit: "contain", text: "" };
  return { id: nextDigitalId("block"), kind, text: kind === "heading" ? "New heading" : "" };
}

export function duplicateDigitalPage(page: DigitalPage): DigitalPage {
  return {
    ...page,
    id: nextDigitalId("page"),
    title: `${page.title || "Untitled page"} copy`,
    blocks: page.blocks.map((block) => ({ ...block, id: nextDigitalId("block"), items: block.items ? [...block.items] : undefined })),
  };
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function utf8Bytes(value: string): number {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
  return unescape(encodeURIComponent(value)).length;
}

function isPalette(value: unknown): value is DigitalPalette {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return ["paper", "ink", "accent", "muted", "soft"].every((key) => typeof candidate[key] === "string" && /^#[0-9a-f]{6}$/i.test(candidate[key] as string));
}

/**
 * Mirrors contract limits before network work. It only reports errors; it never clips authored text,
 * list items, or pages. The server remains the authoritative validation boundary.
 */
export function validateDigitalDocument(document: DigitalDocument): string | null {
  if (document.schema_version !== 1) return "This design uses an unsupported document version.";
  if (!isDigitalFormat(document.format)) return "Choose one of the five supported digital formats.";
  if (!SAFE_ID.test(document.template_id)) return "The selected template id is invalid.";
  if (document.design_revision !== undefined && document.design_revision !== 1 && document.design_revision !== 2) return "This design uses an unsupported visual revision.";
  if (document.show_artwork !== undefined && typeof document.show_artwork !== "boolean") return "Artwork visibility must be on or off.";
  if (document.show_artwork !== undefined && document.design_revision !== 2) return "Artwork visibility is available for premium designs only.";
  if (![document.title, document.subtitle, document.brand, document.eyebrow].every((value) => typeof value === "string")) return "Cover fields must be text.";
  if (document.title.length > MAX_TITLE) return `Title must be ${MAX_TITLE} characters or fewer.`;
  if (document.subtitle.length > MAX_SUBTITLE) return `Subtitle must be ${MAX_SUBTITLE} characters or fewer.`;
  if (document.brand.length > MAX_BRAND) return `Brand must be ${MAX_BRAND} characters or fewer.`;
  if (document.eyebrow.length > MAX_EYEBROW) return `Eyebrow must be ${MAX_EYEBROW} characters or fewer.`;
  if (!isPalette(document.palette)) return "Each palette color needs a value.";
  if (!(DIGITAL_HEADING_FONTS as readonly string[]).includes(document.fonts.heading) || !(DIGITAL_BODY_FONTS as readonly string[]).includes(document.fonts.body)) return "Choose a supported heading and body font.";
  if (!Array.isArray(document.pages) || document.pages.length === 0) return "Add at least one source page before saving.";
  if (document.pages.length > MAX_PAGES) return `A design can have at most ${MAX_PAGES} source pages.`;

  const pageIds = new Set<string>();
  const blockIds = new Set<string>();
  for (const [pageIndex, page] of document.pages.entries()) {
    if (!SAFE_ID.test(page.id) || pageIds.has(page.id)) return `Page ${pageIndex + 1} needs a unique safe id.`;
    pageIds.add(page.id);
    if (typeof page.title !== "string" || !(DIGITAL_PAGE_KINDS as readonly string[]).includes(page.kind)) return `Page ${pageIndex + 1} has invalid page details.`;
    if (!Array.isArray(page.blocks) || page.blocks.length > MAX_BLOCKS) return `Page ${pageIndex + 1} can have at most ${MAX_BLOCKS} blocks.`;
    for (const [blockIndex, block] of page.blocks.entries()) {
      if (!SAFE_ID.test(block.id) || blockIds.has(block.id)) return `Block ${blockIndex + 1} on page ${pageIndex + 1} needs a unique safe id.`;
      blockIds.add(block.id);
      if (!(DIGITAL_BLOCK_KINDS as readonly string[]).includes(block.kind)) return `Block ${blockIndex + 1} on page ${pageIndex + 1} has an unsupported kind.`;
      if (block.text !== undefined && (typeof block.text !== "string" || block.text.length > MAX_TEXT)) return `Block text must be ${MAX_TEXT.toLocaleString()} characters or fewer; split it across pages instead.`;
      if (block.items !== undefined) {
        if (!Array.isArray(block.items) || block.items.length > MAX_ITEMS) return `A list can have at most ${MAX_ITEMS} items.`;
        if (block.items.some((item) => typeof item !== "string" || item.length > MAX_ITEM_TEXT)) return `Each list item must be ${MAX_ITEM_TEXT.toLocaleString()} characters or fewer.`;
      }
      if (block.image_file !== undefined && block.image_file !== null && (typeof block.image_file !== "string" || !OWNED_IMAGE_FILE.test(block.image_file))) return "An image block needs a seller-owned JPG, PNG, WebP, or GIF file reference, not a URL.";
      if (block.image_fit !== undefined && block.image_fit !== "contain" && block.image_fit !== "cover") return "Image fit must be contain or cover.";
    }
  }
  if (utf8Bytes(JSON.stringify(document)) > MAX_TOTAL_BYTES) return "This source document is larger than 200 KB. Split it into a smaller digital product; nothing was clipped.";
  return null;
}

export function sameDigitalSession(expected: { storeId: string; storeRevision: number; productId: string }, actual: { storeId: string; storeRevision: number; productId: string }): boolean {
  return expected.storeId === actual.storeId && expected.storeRevision === actual.storeRevision && expected.productId === actual.productId;
}

export const DIGITAL_DOCUMENT_LIMITS = { MAX_PAGES, MAX_BLOCKS, MAX_TOTAL_BYTES, MAX_TEXT, MAX_ITEMS, MAX_ITEM_TEXT, MAX_TITLE, MAX_SUBTITLE, MAX_BRAND, MAX_EYEBROW } as const;
