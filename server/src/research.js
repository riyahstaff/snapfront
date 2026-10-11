// Price check: find the same item for sale elsewhere (Amazon, Walmart, Target, eBay...) from a photo,
// using a Google Lens search through SerpApi, then suggest a competitive price for the seller.
import { config } from "./config.js";
import { httpError } from "./claude.js";

const STORES = [
  ["amazon", /amazon\./i, "Amazon"], ["walmart", /walmart/i, "Walmart"], ["target", /target/i, "Target"],
  ["ebay", /ebay/i, "eBay"], ["etsy", /etsy/i, "Etsy"], ["temu", /temu/i, "Temu"], ["aliexpress", /aliexpress/i, "AliExpress"],
  ["costco", /costco/i, "Costco"], ["bestbuy", /best ?buy/i, "Best Buy"], ["homedepot", /home ?depot/i, "Home Depot"],
];
// Where buyers comparison-shop. Wholesale/marketplace sources like AliExpress or Temu are shown but not used to set the price.
const MAJOR = new Set(["amazon", "walmart", "target", "costco", "bestbuy", "homedepot"]);

let fetchImpl = (...a) => fetch(...a);
export function setLensFetch(f) { fetchImpl = f; }   // used by tests

const money = (v) => {
  if (typeof v === "number") return v;
  const m = String(v ?? "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
};
const storeOf = (source, link) => {
  const hay = `${source || ""} ${link || ""}`;
  const hit = STORES.find(([, re]) => re.test(hay));
  return hit ? { store: hit[0], store_name: hit[2] } : { store: "other", store_name: source || "Other store" };
};
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r2 = (n) => Math.round(n * 100) / 100;
/** Retail-style price just under a target: 23.40 -> 22.99. */
const charm = (n) => Math.max(0.99, Math.floor(n) - 0.01 + (n - Math.floor(n) >= 0.99 ? 1 : 0));

/** Normalise whatever SerpApi's Google Lens returns into a list of priced offers. */
export function parseLens(body) {
  const pools = [body?.visual_matches, body?.exact_matches, body?.shopping_results, body?.products].filter(Array.isArray).flat();
  const seen = new Set();
  const out = [];
  for (const m of pools) {
    const price = money(m?.price?.extracted_value ?? m?.price?.value ?? m?.extracted_price ?? m?.price);
    const currency = String(m?.price?.currency ?? m?.currency ?? "$");
    if (!m?.link || !price || price <= 0 || price > 100000) continue;
    if (!/^\$|USD/i.test(currency)) continue;   // US prices only for now
    if (seen.has(m.link)) continue;
    seen.add(m.link);
    out.push({
      title: String(m.title || "").slice(0, 200), link: m.link, thumbnail: m.thumbnail || m.image || null,
      price: r2(price), in_stock: m.in_stock ?? null, ...storeOf(m.source, m.link),
    });
  }
  return out.sort((a, b) => Number(MAJOR.has(b.store)) - Number(MAJOR.has(a.store)) || a.price - b.price).slice(0, 30);
}

/** Summary and a suggested price that undercuts the big retailers while keeping a margin over cost. */
export function suggest(matches, cost) {
  const prices = matches.map((m) => m.price);
  const major = matches.filter((m) => MAJOR.has(m.store));
  const byStore = {};
  for (const m of matches) if (!byStore[m.store] || m.price < byStore[m.store].price) byStore[m.store] = { store_name: m.store_name, price: m.price, link: m.link };
  const summary = prices.length ? {
    count: prices.length, lowest: Math.min(...prices), median: r2(median(prices)), highest: Math.max(...prices),
    lowest_major: major.length ? Math.min(...major.map((m) => m.price)) : null, by_store: byStore,
  } : { count: 0, lowest: null, median: null, highest: null, lowest_major: null, by_store: {} };

  const c = Number(cost) > 0 ? Number(cost) : null;
  let suggestion = null;
  const anchor = summary.lowest_major ?? summary.median;
  if (anchor) {
    // About 5% under the cheapest big retailer, never below cost + 30%.
    let price = charm(anchor * 0.95);
    let basis = summary.lowest_major ? `about 5% under the lowest big-retailer price ($${summary.lowest_major.toFixed(2)})` : `about 5% under the typical price ($${summary.median.toFixed(2)})`;
    if (c && price < c * 1.3) { price = charm(c * 1.3 + 0.99); basis = "the lowest price that still leaves a 30% margin over your cost"; }
    suggestion = { price: r2(price), basis, ...(c ? { cost: c, profit: r2(price - c), margin_percent: Math.round(((price - c) / price) * 100) } : {}) };
    if (c && summary.lowest_major && c * 1.3 > summary.lowest_major) {
      suggestion.warning = "Big retailers sell this for about what it costs you, so it'll be hard to compete on price. Consider a different product or a bundle.";
    }
  }
  return { summary, suggestion };
}

/** Run a Google Lens product search for a public image URL. */
export async function priceCheck(imageUrl, cost) {
  if (!config.serpapiKey) throw httpError(503, "Price check isn't set up yet. Try again later.");
  if (!/^https:\/\//.test(imageUrl)) throw httpError(400, "Price check needs a public image link.");
  const q = new URLSearchParams({ engine: "google_lens", url: imageUrl, type: "products", hl: "en", country: "us", api_key: config.serpapiKey });
  const res = await fetchImpl(`https://serpapi.com/search.json?${q}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.error) {
    if (/hasn't returned any results|no results/i.test(body?.error || "")) return { matches: [], ...suggest([], cost) };
    console.error("[price-check]", res.status, body?.error);
    throw httpError(502, "The price search didn't work just now. Try again in a minute.");
  }
  const matches = parseLens(body);
  return { matches, ...suggest(matches, cost) };
}
