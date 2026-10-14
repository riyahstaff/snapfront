// Today's post: one ready-to-film content idea per store per day, written for the store's own
// products. The kind of post rotates daily (product in use, a question, behind the scenes, a
// result, a deal, a faceless video, a LIVE). Written by Claude; a built-in idea is used if the AI
// is unavailable. Up to 3 fresh ideas a day.
import { db, rowToProduct } from "./db.js";
import { askJson, httpError } from "./claude.js";
import { storeUrl } from "./urls.js";

db.exec(`CREATE TABLE IF NOT EXISTS daily_prompts (
  seller_id TEXT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 1,
  body TEXT NOT NULL,
  PRIMARY KEY (seller_id, day)
)`);

export const KINDS = [
  { id: "in-use", name: "Show it in use", how: "Film the product being used, close up, in a real moment." },
  { id: "question", name: "Answer a question", how: "Answer one question buyers ask about this product, in under 30 seconds." },
  { id: "behind", name: "Behind the scenes", how: "Show how the product is made, packed or chosen." },
  { id: "result", name: "The result", how: "Show the before and after, or the feeling the product gives." },
  { id: "faceless", name: "Faceless video", how: "Hands, product and text on screen with a voiceover, no face needed." },
  { id: "deal", name: "Deal or launch", how: "Announce a limited offer or something new, with a clear deadline." },
  { id: "live", name: "Go LIVE", how: "Plan a short TikTok LIVE around this product and tell followers when." },
];
const clamp = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const dayIndex = (day) => Math.floor(Date.parse(`${day}T00:00:00Z`) / 864e5);
const todayFor = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());   // YYYY-MM-DD

function fallback(seller, kind, product) {
  const p = product?.title || "your best seller";
  const lines = {
    "in-use": { hook: `POV: you finally found ${p}`, film: ["Open on the product in your hand", "Show it being used, close up", "End on the finished look or result"] },
    question: { hook: `“Is ${p} worth it?” Here's the honest answer`, film: ["Read the question out loud or on screen", "Show the product while you answer", "Finish with who it's perfect for"] },
    behind: { hook: `How every ${p} order gets packed`, film: ["Show your workspace", "Pack one order start to finish", "Seal it with a thank-you note"] },
    result: { hook: `Before and after ${p}`, film: ["Show the before", "Quick cut to using the product", "Reveal the after, hold for 2 seconds"] },
    faceless: { hook: `3 reasons people love ${p}`, film: ["Film hands and product only", "Put each reason on screen as text", "Use a calm voiceover or trending sound"] },
    deal: { hook: `This ends Sunday: ${p}`, film: ["Show the product", "Put the deal and deadline on screen", "Point to the link in your bio"] },
    live: { hook: `Going LIVE tonight with ${p}`, film: ["Post a 10-second teaser", "Say the time you'll go live", "Ask viewers what they want to see"] },
  }[kind.id];
  return { ...lines, on_screen: lines.hook, caption: `${lines.hook}. Link in bio to shop ${seller.store_name}.`, hashtags: ["smallbusiness", "shopsmall", "tiktokmademebuyit"], cta: "Link in bio" };
}

async function write(seller, kind, product) {
  const out = await askJson([{ type: "text", text: `You're a social media coach for a small online store. Write today's post idea.
Store: ${seller.store_name}${seller.tagline ? ` (${seller.tagline})` : ""}
${product ? `Product to feature: ${product.title}. ${clamp(product.tagline, 120)} ${clamp((product.bullets || []).join("; "), 300)} Price $${(product.price_cents / 100).toFixed(2)}.` : "The store has no products yet: make the post about starting the store and what's coming."}
Kind of post: ${kind.name}. ${kind.how}
For TikTok, Instagram Reels and YouTube Shorts. Rules: specific to this product and store; no made-up claims, reviews, numbers or awards; filmable on a phone in under 15 minutes; a hook that works with the sound off.
Return JSON: {"hook": string (max 70 chars, the first line said or shown), "film": [3-5 short steps, each max 80 chars], "on_screen": string (max 60 chars, text to put on screen),
"caption": string (max 300 chars, ends by pointing to the link in bio), "hashtags": [5-8 strings without #], "cta": string (max 30 chars)}` }], 700);
  return {
    hook: clamp(out.hook, 90), film: (Array.isArray(out.film) ? out.film : []).map((x) => clamp(x, 100)).filter(Boolean).slice(0, 5),
    on_screen: clamp(out.on_screen, 80), caption: String(out.caption || "").trim().slice(0, 500),
    hashtags: (Array.isArray(out.hashtags) ? out.hashtags : []).map((h) => String(h).replace(/[^\p{L}\p{N}_]/gu, "")).filter(Boolean).slice(0, 8), cta: clamp(out.cta, 40),
  };
}

/** Today's idea for this store (made on first ask, then kept for the day). `fresh` asks for another one (up to 3 a day). */
export async function today(seller, { fresh = false } = {}) {
  const day = todayFor();
  const row = db.prepare("SELECT * FROM daily_prompts WHERE seller_id = ? AND day = ?").get(seller.id, day);
  if (row && !fresh) return JSON.parse(row.body);
  if (row && row.n >= 3) throw httpError(429, "That's 3 ideas today. Come back tomorrow for more.");
  const n = (row?.n || 0) + 1;
  const kind = KINDS[(dayIndex(day) + (row ? row.n : 0)) % KINDS.length];
  const products = db.prepare("SELECT * FROM products WHERE seller_id = ? AND status = 'live' ORDER BY created_at").all(seller.id).map(rowToProduct);
  const product = products.length ? products[(dayIndex(day) + (row ? row.n : 0)) % products.length] : null;
  let idea;
  try { idea = await write(seller, kind, product); if (!idea.hook || !idea.film.length) throw new Error("empty"); }
  catch { idea = fallback(seller, kind, product); }
  const body = { day, kind: kind.id, kind_name: kind.name, ...idea, product: product ? { id: product.id, title: product.title, image_url: product.image_url, url: storeUrl(seller.store_slug, `/${product.slug}`) } : null, more_left: Math.max(0, 3 - n) };
  db.prepare("INSERT INTO daily_prompts (seller_id, day, n, body) VALUES (?,?,?,?) ON CONFLICT(seller_id, day) DO UPDATE SET n = ?, body = excluded.body")
    .run(seller.id, day, n, JSON.stringify(body), n);
  return body;
}
