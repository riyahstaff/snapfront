import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";

let client = null;
function anthropic() {
  if (!config.anthropicKey) throw httpError(503, "AI writing is not configured. Set ANTHROPIC_API_KEY on the server.");
  client ??= new Anthropic({ apiKey: config.anthropicKey });
  return client;
}

export function httpError(status, message, extra) {
  const e = new Error(message);
  e.status = status;
  if (extra) e.extra = extra;   // e.g. { upgrade: "launch" } so the app can show the right plan
  return e;
}

/** Pull one JSON object out of a model reply (tolerates code fences or a stray sentence). */
export function parseJson(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1] : text;
  const start = body.indexOf("{"), end = body.lastIndexOf("}");
  if (start < 0 || end < start) throw httpError(502, "The AI reply had no JSON in it. Try again.");
  return JSON.parse(body.slice(start, end + 1));
}

async function askJson(content, maxTokens) {
  // Test hook: lets the smoke tests run without an API key.
  if (process.env.SNAPFRONT_FAKE_AI) return JSON.parse(process.env.SNAPFRONT_FAKE_AI);
  const msg = await anthropic().messages.create({
    model: config.claudeModel,
    max_tokens: maxTokens,
    messages: [{ role: "user", content }],
  });
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return parseJson(text);
}

const PAGE_SHAPE = `{"title": string (max 70 chars, no emoji), "tagline": string (max 100 chars),
"description": string (2 short paragraphs separated by a blank line, plain text),
"bullets": [4-6 short strings], "suggested_price": number (USD), "category": string (2-3 words),
"tags": [5 lowercase single words], "faq": [3 objects {"q": string, "a": string}],
"alt_text": string, "seo_description": string (max 155 chars)}`;

/** Photo → product page copy. imageBase64 must be plain base64 (no data: prefix). */
export async function productFromPhoto({ imageBase64, mediaType, kind, hint, price, tone }) {
  const prompt = `You are a top e-commerce copywriter. The photo shows a product a small business wants to sell online. Write a complete product page for it.
Product type: ${kind === "digital" ? "digital download, delivered instantly after purchase" : "physical item that ships to the buyer"}.
${hint ? `Seller's note: ${hint}` : "The seller gave no description; identify the product from the photo."}
${price ? `The seller's price is $${price}; use it as suggested_price.` : "Suggest a realistic US retail price."}
Tone: ${tone || "warm and friendly"}.
Only make claims a buyer could see in the photo or that the seller stated. Never invent certifications, awards, reviews, or materials you cannot see. FAQ answers should cover shipping or delivery, care or use, and returns in general terms the seller can edit.
Reply with only one JSON object of this shape: ${PAGE_SHAPE}`;
  return askJson([
    { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
    { type: "text", text: prompt },
  ], 2000);
}

export const PRODUCT_TYPES = {
  guide: { name: "Mini e-book", sub: "6-chapter how-to guide", price: 12,
    shape: `"content": {"chapters": [6 objects {"heading": string, "paragraphs": [3-4 strings of 60-110 words], "tip": string}]}` },
  checklist: { name: "Checklist pack", sub: "printable checklists and worksheets", price: 8,
    shape: `"content": {"lists": [5 objects {"heading": string, "intro": string, "items": [8-10 short action strings]}]}` },
  hooks: { name: "Content prompt pack", sub: "60 hooks and post ideas", price: 15,
    shape: `"content": {"groups": [6 objects {"heading": string, "items": [10 fill-in-the-blank hooks using [brackets] for blanks]}]}` },
  quotes: { name: "Quote print set", sub: "6 printable 8x10 wall prints", price: 9,
    shape: `"content": {"quotes": [6 original short quotes, 3-9 words each, no attribution]}` },
  planner: { name: "Mini planner", sub: "weekly, habit and goal pages", price: 10,
    shape: `"content": {"weekly_prompts": [4 short reflection prompts], "habits": [8 habit names], "goal_areas": [4 short area names]}` },
};

/** Niche + format → a whole digital product (content + listing copy). */
export async function generateDigitalProduct({ type, niche }) {
  const t = PRODUCT_TYPES[type];
  if (!t) throw httpError(400, `Unknown product type. Use one of: ${Object.keys(PRODUCT_TYPES).join(", ")}.`);
  const prompt = `Create a sellable digital product: a ${t.name} (${t.sub}) for this audience and topic: "${niche}".
The content must be genuinely useful, specific and original, in plain, warm, practical English. No emoji. Do not quote real people.
Reply with only one JSON object:
{"title": string (max 60 chars), "tagline": string (max 100 chars), "description": string (2 short paragraphs separated by a blank line, describing what the buyer gets), "bullets": [5 strings], "suggested_price": number (USD), "category": string, "tags": [5 lowercase words], "faq": [3 objects {"q","a"} about format, printing or devices, and use], ${t.shape}}`;
  return askJson([{ type: "text", text: prompt }], 8000);
}
