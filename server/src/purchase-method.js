export const isExternal = (p) => p.purchase_method === "external";
export function cleanPurchaseUrl(value) {
  const raw = String(value || "").trim();
  try {
    const u = new URL(raw);
    if (raw.length > 2048 || u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".") || u.hostname.endsWith(".localhost")) throw new Error();
    return u.href;
  } catch { const e = new Error("Enter a complete purchase link starting with https://"); e.status = 400; throw e; }
}
const AMAZON = new Set(["a.co", "amzn.to", "amazon.com", "amazon.co.uk", "amazon.ca", "amazon.com.au", "amazon.de", "amazon.fr", "amazon.it", "amazon.es", "amazon.co.jp", "amazon.in", "amazon.com.br", "amazon.com.mx", "amazon.nl", "amazon.se", "amazon.pl", "amazon.com.be"]);
export function externalPurchase(p) {
  if (!isExternal(p)) return null;
  try {
    const url = cleanPurchaseUrl(p.external_url);
    const amazon = AMAZON.has(new URL(url).hostname.replace(/^www\./, ""));
    return { url, label: amazon ? "Buy on Amazon" : "Buy on website", note: amazon ? "Checkout, printing and shipping are handled by Amazon." : "Checkout and delivery are handled by the linked website." };
  } catch { return null; }
}
