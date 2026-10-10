// The Snapfront store agent: Claude Fable 5.1 with tools that act on the seller's own store.
// A seller asks in plain words ("make a holiday gift guide for dog owners and put it on sale for $9")
// and the agent plans, creates, edits and publishes products, then reports back.
import Anthropic from "@anthropic-ai/sdk";
import crypto from "node:crypto";
import { config } from "./config.js";
import { db } from "./db.js";
import { httpError, PRODUCT_TYPES } from "./claude.js";
import * as store from "./store.js";

const MAX_ROUNDS = 10;          // tool-use rounds per request
const MAX_TOKENS = 16000;       // per model turn
const RUN_TTL_MS = 30 * 60 * 1000;

let client = null;
export function setAgentClient(c) { client = c; }     // used by tests
function anthropic() {
  if (client) return client;
  if (!config.anthropicKey) throw httpError(503, "The assistant is not configured. Set ANTHROPIC_API_KEY on the server.");
  client = new Anthropic({ apiKey: config.anthropicKey });
  return client;
}

const fresh = (id) => db.prepare("SELECT * FROM sellers WHERE id = ?").get(id);
const brief = (p) => ({ id: p.id, title: p.title, price: p.price, status: p.status, kind: p.kind, category: p.category,
  has_delivery_file: p.has_delivery, page_url: p.page_url, checkout_url: p.payment_link_url || null });

const TYPE_IDS = Object.keys(PRODUCT_TYPES);

/** Tool definitions (Messages API `tools`), each paired with its handler and a progress label for the app. */
const TOOLS = [
  {
    name: "get_store",
    description: "Get the seller's store: name, tagline, public store URL, whether Stripe is connected and able to take payments, and how many products are live or in draft. Call this first when you need to know the store's state or before publishing anything.",
    input_schema: { type: "object", properties: {} },
    label: () => "Checking your store",
    run: (seller) => {
      const s = store.publicSeller(fresh(seller.id));
      const ps = store.listProducts(seller);
      return { ...s, products_live: ps.filter((p) => p.status === "live").length, products_draft: ps.filter((p) => p.status === "draft").length };
    },
  },
  {
    name: "list_products",
    description: "List every product in the seller's store with its id, title, price in US dollars, status (draft or live), kind (physical or digital), whether a download file is attached, its public page URL and checkout URL. Use it to find a product's id before editing or publishing it.",
    input_schema: { type: "object", properties: {} },
    label: () => "Looking through your products",
    run: (seller) => store.listProducts(seller).map(brief),
  },
  {
    name: "get_product",
    description: "Get the full listing for one product by id: title, tagline, description, bullets, tags, FAQ, price, status and links.",
    input_schema: { type: "object", properties: { id: { type: "string", description: "Product id from list_products" } }, required: ["id"] },
    label: () => "Reading a product",
    run: (seller, i) => store.withPage(seller, store.productRow(seller, i.id)),
  },
  {
    name: "generate_digital_product",
    description: `Write a complete digital product for a niche, design its cover, build the print-ready PDF buyers download, and save it as a DRAFT listing with full listing copy. Formats: ${TYPE_IDS.map((t) => `${t} (${PRODUCT_TYPES[t].name}: ${PRODUCT_TYPES[t].sub})`).join("; ")}. Takes about a minute. The product is not for sale until publish_product is called. Use one call per product.`,
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: TYPE_IDS, description: "Which product format to make" },
        niche: { type: "string", description: "Who it's for and what it covers, specific, e.g. 'first-time dog owners planning a holiday gift exchange'" },
        price: { type: "number", description: "Price in US dollars. Omit to use a suggested price." },
        color: { type: "string", enum: ["cobalt", "forest", "brick", "violet", "ink", "amber"], description: "Cover colour" },
      },
      required: ["type", "niche"],
    },
    label: (i) => `Writing a ${PRODUCT_TYPES[i.type]?.name?.toLowerCase() || "digital product"} for ${String(i.niche || "").slice(0, 60)}`,
    product: true,
    run: async (seller, i) => brief(await store.generateProduct(fresh(seller.id), { type: i.type, niche: i.niche, price: i.price, color: i.color })),
  },
  {
    name: "create_product_listing",
    description: "Create a DRAFT listing from text alone, for a physical item or a digital file the seller already has. Write all the copy yourself: a clear title, a one-line tagline, a two-paragraph description (paragraphs separated by a blank line), 4-6 bullets, 5 tags and 2-3 FAQ entries. Only state facts the seller gave you. For a digital product, include delivery_url if the seller gave you an https download link.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" }, tagline: { type: "string" }, description: { type: "string" },
        bullets: { type: "array", items: { type: "string" } }, tags: { type: "array", items: { type: "string" } },
        faq: { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] } },
        category: { type: "string" }, kind: { type: "string", enum: ["physical", "digital"] },
        price: { type: "number", description: "US dollars" }, delivery_url: { type: "string", description: "https link to the file buyers download (digital only)" },
      },
      required: ["title", "description", "kind", "price"],
    },
    label: (i) => `Creating “${String(i.title || "").slice(0, 60)}”`,
    product: true,
    run: (seller, i) => brief(store.createProduct(fresh(seller.id), i)),
  },
  {
    name: "update_product",
    description: "Edit an existing product. Pass only the fields to change. Changing the price of a live product takes it back to draft until it is published again.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" }, title: { type: "string" }, tagline: { type: "string" }, description: { type: "string" },
        bullets: { type: "array", items: { type: "string" } }, tags: { type: "array", items: { type: "string" } },
        faq: { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] } },
        category: { type: "string" }, price: { type: "number", description: "US dollars" }, delivery_url: { type: "string" },
      },
      required: ["id"],
    },
    label: () => "Editing a product",
    product: true,
    run: (seller, i) => { const { id, ...rest } = i; return brief(store.updateProduct(fresh(seller.id), id, rest)); },
  },
  {
    name: "publish_product",
    description: "Put a draft product on sale: creates the Stripe product, price and checkout link on the seller's own Stripe account and adds it to the public storefront. Only call this when the seller has asked to sell, publish or put something on sale. Fails with a clear message if Stripe isn't connected yet; then tell the seller to tap Connect Stripe in My store.",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    label: () => "Publishing with Stripe checkout",
    product: true,
    run: async (seller, i) => brief(await store.publishProduct(seller, i.id)),
  },
  {
    name: "update_store",
    description: "Change the store's name or tagline (the line under the name on the storefront).",
    input_schema: { type: "object", properties: { store_name: { type: "string" }, tagline: { type: "string" } } },
    label: () => "Updating your store details",
    run: (seller, i) => store.updateStore(fresh(seller.id), i),
  },
  {
    name: "get_trends",
    description: "The digital product formats selling best across Etsy, TikTok, Instagram and Pinterest right now, ranked, with where each sells. Use it when the seller asks what to make or sell.",
    input_schema: { type: "object", properties: {} },
    label: () => "Checking what's selling",
    run: () => store.TRENDS,
  },
  {
    name: "list_orders",
    description: "The store's recent orders: product title, amount in cents, buyer email and date, newest first.",
    input_schema: { type: "object", properties: {} },
    label: () => "Checking your orders",
    run: (seller) => store.listOrders(seller),
  },
];
const BY_NAME = Object.fromEntries(TOOLS.map((t) => [t.name, t]));
export const TOOL_DEFS = TOOLS.map(({ name, description, input_schema }) => ({ name, description, input_schema }));

function systemPrompt(seller) {
  const s = store.publicSeller(fresh(seller.id));
  return `You are the Snapfront store assistant. Snapfront helps small sellers and creators make products and sell them from their own storefront with Stripe checkout.
You work for the seller of "${s.store_name}" (${s.store_url}). Stripe connected: ${s.stripe_ready ? "yes, ready to take payments" : s.stripe_connected ? "started but not finished" : "no"}.
Today is ${new Date().toISOString().slice(0, 10)}.

How to work:
- Use the tools to do the work instead of describing what the seller could do. Plan briefly, then act.
- Products you create start as drafts. Publish only when the seller asked to sell, publish or put something on sale.
- Never invent facts about a seller's physical product (materials, sizes, certifications). Ask if you need them.
- Prices are in US dollars. If the seller gives no price, use a sensible one and say what you chose.
- You can't take photos, delete products, issue refunds or change Stripe settings; tell the seller where in the app to do those (Snap tab, a product's page, the Stripe dashboard from Store settings).
- When you write marketing copy (captions, hooks, launch posts), write it directly in your reply, ready to paste.

Reply in plain text for a phone screen: short paragraphs, simple dashes for lists, no headings, no tables, no emoji. Say what you did, with each product's title and price, and what the seller should do next. Never claim an action you didn't complete with a tool.`;
}

/* ---------- runs (the app starts one, then polls for progress) ---------- */
const runs = new Map();
const activeBySeller = new Map();
const recentBySeller = new Map();

function sweep() {
  const now = Date.now();
  for (const [id, r] of runs) if (now - r.createdAt > RUN_TTL_MS) runs.delete(id);
}

export function startRun(seller, messages) {
  sweep();
  if (activeBySeller.get(seller.id)) throw httpError(409, "The assistant is still working on your last request.");
  const now = Date.now(), hour = 60 * 60 * 1000;
  const recent = (recentBySeller.get(seller.id) || []).filter((t) => now - t < hour);
  if (recent.length >= 15) throw httpError(429, "You've reached the assistant's hourly limit. Try again a little later.");
  const convo = cleanMessages(messages);
  recent.push(now); recentBySeller.set(seller.id, recent);
  const run = { id: crypto.randomUUID(), sellerId: seller.id, status: "running", events: [], reply: null, error: null, createdAt: now };
  runs.set(run.id, run); activeBySeller.set(seller.id, run.id);
  runAgent(seller, convo, (e) => run.events.push({ ...e, at: Date.now() }))
    .then((reply) => { run.reply = reply; run.status = "done"; })
    .catch((e) => { run.error = e.status && e.status !== 500 && !e.headers ? e.message : "The assistant hit a problem. Try again."; run.status = "error"; if (!e.status) console.error("[agent]", e); })
    .finally(() => activeBySeller.delete(seller.id));
  return run;
}

export function getRun(seller, id, after = 0) {
  const run = runs.get(String(id));
  if (!run || run.sellerId !== seller.id) throw httpError(404, "That assistant request has expired.");
  return { id: run.id, status: run.status, events: run.events.slice(after), next: run.events.length, reply: run.reply, error: run.error };
}

function cleanMessages(messages) {
  const list = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  while (list.length && list[0].role !== "user") list.shift();
  if (!list.length || list.at(-1).role !== "user") throw httpError(400, "Send a message for the assistant.");
  // merge accidental consecutive same-role turns
  return list.reduce((out, m) => { const last = out.at(-1); if (last && last.role === m.role) last.content += "\n\n" + m.content; else out.push({ ...m }); return out; }, []);
}

/** The tool-use loop. Returns the final reply text. */
export async function runAgent(seller, messages, emit = () => {}) {
  const ai = anthropic();
  const convo = messages.map((m) => ({ role: m.role, content: m.content }));
  for (let round = 0; round < MAX_ROUNDS; round++) {
    emit({ type: "thinking" });
    const res = await ai.messages.create({
      model: config.agentModel,
      max_tokens: MAX_TOKENS,
      system: systemPrompt(seller),
      tools: TOOL_DEFS,
      messages: convo,
    });
    // Pass the assistant's content back unchanged (thinking blocks included).
    convo.push({ role: "assistant", content: res.content });
    const calls = res.content.filter((b) => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || !calls.length) {
      const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      return text || "Done.";
    }
    const results = [];
    for (const call of calls) {
      const tool = BY_NAME[call.name];
      const input = call.input && typeof call.input === "object" ? call.input : {};
      if (!tool) { results.push({ type: "tool_result", tool_use_id: call.id, content: `Unknown tool ${call.name}`, is_error: true }); continue; }
      emit({ type: "step", tool: call.name, label: tool.label(input) });
      try {
        const out = await tool.run(seller, input);
        if (tool.product && out?.id) emit({ type: "product", product: out });
        results.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(out).slice(0, 30000) });
      } catch (e) {
        emit({ type: "step_failed", tool: call.name, label: e.message });
        results.push({ type: "tool_result", tool_use_id: call.id, content: e.message || "That didn't work.", is_error: true });
      }
    }
    convo.push({ role: "user", content: results });
  }
  return "I've done as much as I can in one go. Check My store, then tell me what to do next.";
}
