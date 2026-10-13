import type { StoreTheme, TemplatePreview as TemplatePreviewData } from "@/lib/api";

export type TemplatePreviewProps = {
  preview: TemplatePreviewData | null;
  loading: boolean;
  error: string | null;
  theme: StoreTheme | null;
  onRetry: () => void;
  onPhoto: (index: 0 | 1 | 2) => void;
  onWords?: () => void;
  renderRevision?: number;
};

export type PreviewBridgeMessage = { type: "photo"; index: 0 | 1 | 2 };
const MAX_HTML_BYTES = 350_000;
const MAX_MESSAGE_BYTES = 512;

const safeResource = (value: string) => /^https:\/\//i.test(value) || /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(value);

/** Remove executable/navigation primitives while retaining a server-rendered responsive layout and HTTPS images. */
export function sanitizePreviewHtml(value: unknown): string {
  let html = String(value ?? "").slice(0, MAX_HTML_BYTES);
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/<(script|iframe|object|embed|form|base|meta|link)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  html = html.replace(/<(script|iframe|object|embed|form|base|meta|link)\b[^>]*\/?\s*>/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/\s(?:href|action|target|srcset)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/\s(src|poster)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_match, attr: string, _quoted: string, double: string | undefined, single: string | undefined, bare: string | undefined) => {
    const resource = double ?? single ?? bare ?? "";
    return safeResource(resource) ? ` ${attr}="${resource.replace(/"/g, "&quot;")}"` : "";
  });
  html = html.replace(/url\(\s*(['"]?)(?:javascript:|data:(?!image\/))/gi, "url($1");
  return html;
}

function documentParts(html: string) {
  const safe = sanitizePreviewHtml(html);
  // Theme-specific typefaces are part of the selected design. Keep only the fixed trusted font stylesheet host.
  const fonts = Array.from(html.matchAll(/<link\b[^>]*href=["'](https:\/\/fonts\.googleapis\.com\/css[^"']+)["'][^>]*>/gi))
    .map((match) => `<link rel="stylesheet" href="${match[1].replace(/"/g, "&quot;")}">`).join("\n");
  const styles = Array.from(safe.matchAll(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi)).map((match) => match[0]).join("\n");
  const body = safe.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1] ?? safe;
  const classes = safe.match(/<body\b[^>]*\bclass=["']([^"']*)["']/i)?.[1] ?? "";
  const bodyClass = classes.split(/\s+/).filter((value) => /^[a-zA-Z0-9_-]+$/.test(value)).join(" ").slice(0, 1000);
  return { styles: fonts + "\n" + styles, bodyClass, body: body.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "") };
}

/** Cache-bust only owned public picture endpoints; never alter signed/external/data URLs. */
export function refreshTemplateImages(html: string, revision: number, origin: string): string {
  if (!Number.isSafeInteger(revision) || revision < 1) return html;
  return html.replace(/https:\/\/[^\s"'<>\)]+/g, (resource) => {
    try {
      const url = new URL(resource.replace(/&amp;/g, "&"));
      if (url.origin !== new URL(origin).origin || !/^\/(?:img|theme-assets)\/[\w.-]+$/.test(url.pathname) || url.search) return resource;
      url.searchParams.set("sf_preview", String(revision));
      return url.toString();
    } catch { return resource; }
  });
}

/** Build an about:blank-only document. The only JavaScript is this bounded photo-slot bridge. */
export function buildTemplatePreviewDocument(html: string, target: "native" | "web"): string {
  const { styles, body, bodyClass } = documentParts(html);
  const bridge = target === "native"
    ? "window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(message));"
    : "window.parent&&window.parent.postMessage(message,'*');";
  const script = `(function(){'use strict';document.addEventListener('click',function(event){var node=event.target;while(node&&node!==document){var raw=node.getAttribute&&(node.getAttribute('data-sf-photo')||node.getAttribute('data-snapfront-photo-slot')||node.getAttribute('data-photo-slot'));if(raw!==null&&raw!==undefined){var index=Number(raw);if(index===0||index===1||index===2){event.preventDefault();var message={type:'photo',index:index};${bridge}return;}}node=node.parentNode;}},true);}());`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https: data:; script-src 'unsafe-inline'; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'">${styles}<style>html,body{margin:0;min-height:100%;max-width:100%;overflow-x:hidden}*,*:before,*:after{box-sizing:border-box}a{cursor:default}</style></head><body class="${bodyClass}">${body}<script>${script}</script></body></html>`;
}

/** Keep WebView navigation local to the inline base document. */
export function isAllowedPreviewNavigation(url: unknown): boolean {
  const value = String(url ?? "");
  return value === "about:blank" || value.startsWith("about:blank#");
}

/** Parse only tiny exact bridge payloads; arbitrary HTML cannot invoke native callbacks. */
export function previewBridgeMessage(value: unknown): PreviewBridgeMessage | null {
  if (typeof value !== "string" || value.length > MAX_MESSAGE_BYTES) return null;
  try {
    const message = JSON.parse(value) as { type?: unknown; index?: unknown };
    return message.type === "photo" && (message.index === 0 || message.index === 1 || message.index === 2)
      ? { type: "photo", index: message.index }
      : null;
  } catch {
    return null;
  }
}

export function setupPreviewNeedsLatestBackend(error: string | null, preview: TemplatePreviewData | null): boolean {
  if (preview) return false;
  return !error || /\b404\b|not found|template-preview|template preview|unsupported/i.test(error);
}
