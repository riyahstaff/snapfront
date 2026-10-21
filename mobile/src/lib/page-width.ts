// How wide each page's content is on the website (the phone app ignores this):
//   narrow: a photo-first tool, a centered 608px column the size of the photo box, so the
//           photo, the choices under it and the button all share the same two edges
//   focus: one task, one centered 760px column (forms and step-by-step tools)
//   wide:  reading and lists, a centered 1120px column
//   full:  dashboards that use the whole screen
// The page title lines up with the same column, so every page has one clean left edge.
export type PageWidth = "narrow" | "focus" | "wide" | "full";
export const PAGE_MAX: Record<PageWidth, number | undefined> = { narrow: 608, focus: 760, wide: 1120, full: undefined };

const NARROW = new Set(["snap", "price-check", "studio"]);
const FOCUS = new Set([
  "ai-media", "faceless", "marketing", "avatars", "discounts", "store-offers", "pixels",
  "digital-photo-studio", "draft", "product", "supplier", "welcome", "start", "sign-in", "community-post", "lesson", "assistant",
]);
const WIDE = new Set([
  "academy", "find", "autodm", "affiliates", "earn", "channels", "reviews", "trends", "sources", "ugc", "credits", "create", "community", "plans",
]);

/** The width for a route name ("snap", "product/[id]") or a path ("/product/abc"). */
export function pageWidthFor(nameOrPath: string | null | undefined): PageWidth {
  const first = String(nameOrPath || "").replace(/^\/+/, "").replace(/^\(tabs\)\/?/, "").split(/[/?#]/)[0];
  if (NARROW.has(first)) return "narrow";
  if (FOCUS.has(first)) return "focus";
  if (WIDE.has(first)) return "wide";
  return "full";
}

/** Narrow and focus pages are single columns: fields, choices and main buttons span the column. */
export const isColumn = (w: PageWidth) => w === "narrow" || w === "focus";
