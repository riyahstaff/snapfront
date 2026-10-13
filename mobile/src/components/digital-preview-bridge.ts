export type DigitalPreviewSelection =
  | { type: "field"; field: "title" | "subtitle" | "brand" | "eyebrow" }
  | { type: "block"; pageId: string; blockId: string };

export const MAX_DIGITAL_SVG_BYTES = 2 * 1024 * 1024;
const MAX_MESSAGE_BYTES = 512;
const SAFE_ID = /^[A-Za-z0-9_-]{1,120}$/;
const COVER_FIELDS = ["title", "subtitle", "brand", "eyebrow"] as const;

function byteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
  return unescape(encodeURIComponent(value)).length;
}

function allowedDataResource(value: string): boolean {
  return /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)
    || /^data:(?:font\/[a-z0-9.+-]+|application\/(?:font-[a-z0-9.+-]+|octet-stream));base64,[a-z0-9+/=\s]+$/i.test(value)
    || /^#[A-Za-z][A-Za-z0-9_-]*$/.test(value);
}

function resourceValue(double: string | undefined, single: string | undefined, bare: string | undefined): string {
  return (double ?? single ?? bare ?? "").trim();
}

/**
 * The preview service is the only intended SVG source. This defense-in-depth gate preserves the
 * renderer's embedded data fonts and owned image bytes, while removing executable tags, navigation,
 * event handlers, and every non-data resource. It rejects oversized SVGs instead of truncating them.
 */
export function sanitizeDigitalSvg(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim() || byteLength(value) > MAX_DIGITAL_SVG_BYTES) return null;
  let svg = value.trim();
  if (!/^<svg\b/i.test(svg)) return null;
  svg = svg.replace(/<!--[\s\S]*?-->/g, "");
  svg = svg.replace(/<(script|iframe|object|embed|foreignObject|audio|video|canvas)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  svg = svg.replace(/<(script|iframe|object|embed|foreignObject|audio|video|canvas)\b[^>]*\/?\s*>/gi, "");
  svg = svg.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  svg = svg.replace(/\s(?:href|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_all, double: string | undefined, single: string | undefined, bare: string | undefined) => {
    const resource = resourceValue(double, single, bare);
    return allowedDataResource(resource) ? ` href="${resource.replace(/"/g, "&quot;")}"` : "";
  });
  svg = svg.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi, (_all, double: string | undefined, single: string | undefined, bare: string | undefined) => {
    const resource = resourceValue(double, single, bare);
    return allowedDataResource(resource) ? `url(${resource})` : "none";
  });
  // Audit only values that can load resources. A renderer can legitimately print “https://…” in
  // a <text>/<tspan>, so scanning all SVG markup would incorrectly blank authored guide copy.
  const attributeValues = [...svg.matchAll(/\s(?:href|xlink:href|src|style)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)]
    .map((match) => resourceValue(match[1], match[2], match[3])).join(" ");
  const styleBodies = [...svg.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map((match) => match[1]).join(" ");
  if (/\b(?:javascript:|vbscript:|https?:|file:|data:text\/html)/i.test(`${attributeValues} ${styleBodies}`) || byteLength(svg) > MAX_DIGITAL_SVG_BYTES) return null;
  return svg;
}

/** Controlled blank-document transport for one server-rendered page only. */
export function buildDigitalPreviewDocument(svg: string, target: "native" | "web"): string | null {
  const safe = sanitizeDigitalSvg(svg);
  if (!safe) return null;
  const send = target === "native"
    ? "window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(message));"
    : "window.parent&&window.parent.postMessage(message,'*');";
  const script = `(function(){'use strict';var ids=/^[A-Za-z0-9_-]{1,120}$/;document.addEventListener('click',function(event){var node=event.target;while(node&&node!==document){var field=node.getAttribute&&node.getAttribute('data-digital-field');if(field==='title'||field==='subtitle'||field==='brand'||field==='eyebrow'){event.preventDefault();var message={type:'field',field:field};${send}return;}var block=node.getAttribute&&node.getAttribute('data-digital-block');var page=node.getAttribute&&node.getAttribute('data-digital-page');if(block&&page&&ids.test(block)&&ids.test(page)){event.preventDefault();var message={type:'block',pageId:page,blockId:block};${send}return;}node=node.parentNode;}},true);}());`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"><style>html,body{margin:0;width:100%;min-height:100%;background:transparent}svg{display:block;width:100%;height:auto}*{box-sizing:border-box}</style></head><body>${safe}<script>${script}</script></body></html>`;
}

/** Native WebView should never leave the generated about:blank document. */
export function isAllowedDigitalPreviewNavigation(value: unknown): boolean {
  const url = String(value ?? "");
  return url === "about:blank" || url.startsWith("about:blank#");
}

/** Only exact, tiny renderer-selection payloads are allowed to change native editing state. */
export function digitalPreviewBridgeMessage(value: unknown): DigitalPreviewSelection | null {
  if (typeof value !== "string" || byteLength(value) > MAX_MESSAGE_BYTES) return null;
  try {
    const message = JSON.parse(value) as Record<string, unknown>;
    if (message.type === "field" && Object.keys(message).length === 2 && typeof message.field === "string" && (COVER_FIELDS as readonly string[]).includes(message.field)) {
      return { type: "field", field: message.field as DigitalPreviewSelection & { type: "field" } extends never ? never : "title" | "subtitle" | "brand" | "eyebrow" };
    }
    if (message.type === "block" && Object.keys(message).length === 3 && typeof message.pageId === "string" && typeof message.blockId === "string" && SAFE_ID.test(message.pageId) && SAFE_ID.test(message.blockId)) {
      return { type: "block", pageId: message.pageId, blockId: message.blockId };
    }
  } catch { /* malformed messages cannot invoke the editor */ }
  return null;
}
