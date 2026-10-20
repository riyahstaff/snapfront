// The AI art director: a generated digital product gets a cover and inside images chosen for its
// topic, set in Snapfront's sleek layouts; without the image service it still gets a designed cover.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-aicover-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://cover.test";
process.env.RUNPOD_API_KEY = "";
// One fake AI reply serves both calls: the product writer reads the product fields and the art
// director reads the layout fields.
const chapters = Array.from({ length: 6 }, (_, i) => ({ heading: `Chapter ${i + 1}: Simple meals`, paragraphs: ["Cook once, eat twice.", "Keep a stocked pantry."], tip: "Prep grains on Sunday." }));
process.env.SNAPFRONT_FAKE_AI = JSON.stringify({
  title: "The Easy Plate: Recipes for Healthy Eating Habits", tagline: "Six short chapters of simple recipes and routines",
  description: "A practical guide.\n\nRecipes and routines.", bullets: ["a", "b", "c", "d", "e"], suggested_price: 12, category: "Food", tags: ["food", "recipes", "health", "meal", "prep"],
  faq: [{ q: "Format?", a: "PDF." }, { q: "Print?", a: "Yes." }, { q: "Devices?", a: "Any." }],
  content: { chapters },
  layout: "fullbleed", subject: "a colourful grain bowl", eyebrow: "the recipe guide",
  palette: { base: "#0B0D0C", accent: "#E8A33D", text: "#FFFFFF" },
  cover_image: "Overhead editorial photo of a colourful grain bowl with roasted vegetables on a dark stone table, soft window light",
  inside_images: [{ section: 1, prompt: "A tidy pantry shelf of glass jars with grains and beans, soft light" }, { section: 4, prompt: "Hands chopping fresh herbs on a wooden board, close up" }, { section: 4, prompt: "duplicate section is dropped" }],
});

const { app } = await import("../src/index.js");
const { db } = await import("../src/db.js");
const { config } = await import("../src/config.js");
const ai = await import("../src/ai-cover.js");
const ia = await import("../src/image-assistant.js");
const fonts = await import("../src/fonts.js");
const sharp = (await import("sharp")).default;
fonts.setFontFetch(async () => { throw new Error("offline in tests"); });   // bundled fonts stand in
ia.setArtPollMs(1);

let server, base, token;
before(async () => {
  server = app.listen(0); await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
  const made = await (await fetch(`${base}/api/sellers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store_name: "Love That Offer" }) })).json();
  token = made.token;
  db.prepare("UPDATE accounts SET comp_plan = 'pro' WHERE id = ?").run(made.account.id);   // members make several products
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const generate = () => fetch(`${base}/api/ai/generate`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ type: "guide", niche: "busy parents who want healthy meals", color: "brick" }) });
const photo = () => sharp({ create: { width: 640, height: 768, channels: 3, background: "#6b8f4e" } }).jpeg().toBuffer();

test("the art director's choices are made safe: layouts, readable colours, at most two inside images on real sections", () => {
  const sections = ["A", "B", "C"];
  const d = ai.normalizeDirection({ layout: "editorial", palette: { base: "#111111", accent: "#F5F5F5", text: "#EEEEEE" }, eyebrow: "calm guide", cover_image: "a quiet morning desk with tea and a notebook",
    inside_images: [{ section: 0, prompt: "a cup of tea on a windowsill" }, { section: 9, prompt: "out of range section here" }, { section: 2, prompt: "a stack of linen notebooks" }, { section: 1, prompt: "a third image is too many" }] }, { title: "T", type: "guide", sections });
  assert.equal(d.layout, "editorial");
  assert.ok(d.palette.base !== "#111111", "an editorial page is light");
  assert.notEqual(d.palette.text, "#EEEEEE", "the title stays readable on the light page");
  assert.equal(d.eyebrow, "CALM GUIDE");
  assert.deepEqual(d.inside_images.map((x) => x.section), [0, 2]);
  const dark = ai.normalizeDirection({ layout: "nonsense", palette: { base: "#FAFAFA" } }, { title: "T", type: "quotes", sections: [] });
  assert.equal(dark.layout, "fullbleed");
  assert.equal(dark.palette.base, "#0E1116", "photo layouts sit on dark");
  assert.equal(dark.palette.text, "#FFFFFF");
  assert.equal(ai.normalizeDirection(null, { title: "T", type: "guide", sections }).layout, "panel");
  assert.deepEqual(ai.normalizeDirection({ inside_images: [{ section: 3, prompt: "the welcome page picture" }] }, { title: "T", type: "planner", sections: [] }).inside_images.map((x) => x.section), [-1]);
});

test("every layout renders a full-page cover, with a photo or a designed background, even for a long title", async () => {
  const img = await photo();
  for (const layout of ["fullbleed", "panel", "editorial"]) for (const image of [img, null]) {
    const direction = ai.normalizeDirection({ layout, palette: { accent: "#E8A33D" }, eyebrow: "the guide" }, { title: "x", type: "guide", sections: [] });
    const png = await ai.renderCover({ title: "A Very Long Title About Healthy Weeknight Cooking For Busy Families Everywhere", tagline: "Simple recipes and routines that make healthy eating feel easy every single day", type: "guide", storeName: "Shop", direction, image });
    const meta = await sharp(png).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height], ["png", ai.COVER_W, ai.COVER_H], `${layout} ${image ? "photo" : "designed"}`);
  }
  const listing = await sharp(await ai.renderListing(await ai.renderCover({ title: "Short", tagline: "", type: "planner", storeName: "", direction: ai.fallbackDirection({ title: "Short", type: "planner" }), image: null }), { accent: "#7C8CFF" })).metadata();
  assert.deepEqual([listing.width, listing.height], [ai.LISTING, ai.LISTING]);
});

test("without the image service, a new e-book still gets the designed cover and the AI-chosen layout", async () => {
  const r = await generate();
  assert.equal(r.status, 201, await r.clone().text());
  const p = await r.json();
  const file = path.join(tmp, "images", p.image_file);
  const meta = await sharp(file).metadata();
  assert.deepEqual([meta.width, meta.height], [1200, 1200], "the store image is the cover on its stage");
  const pdf = db.prepare("SELECT delivery_file FROM products WHERE id = ?").get(p.id).delivery_file;
  assert.match(fs.readFileSync(path.join(tmp, "files", pdf)).subarray(0, 5).toString(), /%PDF-/);
});

test("with the image service, the cover photo and two chapter images are made and placed in the PDF", async () => {
  config.runpodKey = "rp_test";
  const prompts = [];
  let n = 0;
  ia.setImageAssistantFetch(async (url, opts = {}) => {
    if (url.endsWith("/qwen-image-t2i/run")) { const body = JSON.parse(opts.body); prompts.push(body.input); return Response.json({ id: `art-${++n}` }); }
    if (url.includes("/qwen-image-t2i/status/")) return Response.json({ status: "COMPLETED", output: { image_url: `https://d2h7xmz5gqybh9.cloudfront.net/${url.split("/").pop()}.jpg` } });
    if (url.startsWith("https://d2h7xmz5gqybh9.cloudfront.net/")) { const b = await photo(); return new Response(b, { status: 200, headers: { "content-type": "image/jpeg", "content-length": String(b.length) } }); }
    throw new Error(`unexpected ${url}`);
  });
  try {
    const before = fs.readdirSync(path.join(tmp, "files")).length;
    const r = await generate();
    assert.equal(r.status, 201, await r.clone().text());
    assert.equal(prompts.length, 3, "one cover and two inside images (the duplicate section is dropped)");
    assert.match(prompts[0].prompt, /grain bowl.*no text/i);
    assert.equal(prompts[0].size, "1280*1536");
    assert.equal(prompts[1].size, "1536*1080");
    assert.match(prompts[0].negative_prompt, /text/);
    assert.equal(fs.readdirSync(path.join(tmp, "files")).length, before + 1);
    // The AI images went into the PDF (it is far bigger than a text-only one).
    const p = await r.json();
    const pdf = fs.readFileSync(path.join(tmp, "files", db.prepare("SELECT delivery_file FROM products WHERE id = ?").get(p.id).delivery_file));
    assert.ok((pdf.toString("latin1").match(/\/Subtype \/Image/g) || []).length >= 3, "cover and chapter images are embedded");
    // Allowance is not used by cover images.
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM image_assistant_jobs").get().n, 0);
  } finally { config.runpodKey = ""; ia.setImageAssistantFetch(null); }
});

test("if an image fails, the product is still made, with a designed cover in its place", async () => {
  config.runpodKey = "rp_test";
  ia.setImageAssistantFetch(async (url) => {
    if (url.endsWith("/run")) return Response.json({ id: "x" });
    return Response.json({ status: "FAILED", error: "worker crashed" });
  });
  try {
    const r = await generate();
    assert.equal(r.status, 201, await r.clone().text());
    assert.ok((await r.json()).image_file);
  } finally { config.runpodKey = ""; ia.setImageAssistantFetch(null); }
});
