// The prompt library ("Bonus: 1k Prompts" in the app): long prompts for Claude and ChatGPT, many of
// them using the Snapfront connector. The app fills in the blanks and opens them in the assistant. The prompts live as plain text in server/prompts/*.txt so more can be added
// without touching code:
//
//   # category: Build your Snapfront store      <- files with the same category name are merged
//   # blurb: One line shown under the category  (the first file's blurb is used)
//   # group: Ebooks and practical guides        <- optional: a sub-heading for this file's prompts
//   # connector: off                            <- optional: these prompts mention Snapfront but
//                                                  don't use the connector (no "Uses Snapfront" tag
//                                                  unless they name a connector tool)
//
//   ## Prompt title
//   @for: who it's for                          <- optional, right after the title
//   The prompt, any number of lines, with [PLACEHOLDERS] in square brackets.
//
// Files load in name order (which also sets the category order). A prompt's ID comes from its
// title, so links to it stay the same when other prompts are added.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "prompts");
const MIN_LENGTH = 350;   // the library is for full prompts, not one-liners
const TOOLS = /\b(list_stores|get_store|get_product|list_store_looks|check_store|preview_store_design|update_store_design|create_draft_product|update_product|use_picture_from_link|make_faceless_video|get_video)\b/;

export const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

/** Parse the prompt files in `dir`. Throws on anything malformed so a bad file fails tests, not buyers. */
export function loadPrompts(dir = DIR) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt")).sort();
  const categories = new Map();
  const prompts = [];
  const ids = new Set();
  for (const file of files) {
    const lines = fs.readFileSync(path.join(dir, file), "utf8").replace(/\r\n?/g, "\n").split("\n");
    let category = null, current = null, group = "", connector = true;
    const finish = () => {
      if (!current) return;
      const text = current.lines.join("\n").trim();
      if (text.length < MIN_LENGTH) throw new Error(`${file}: "${current.title}" is too short (${text.length} characters)`);
      const snapfront = TOOLS.test(text) || (connector && /\bSnapfront\b/.test(text));
      prompts.push({ id: current.id, title: current.title, category: category.id, group, for: current.for || "", prompt: text, snapfront });
      category.count++;
      current = null;
    };
    for (const [i, line] of lines.entries()) {
      const head = /^# (category|blurb|group|connector):\s*(.+?)\s*$/.exec(line);
      if (head && !current) {
        if (head[1] === "category") {
          const id = slug(head[2]);
          if (!categories.has(id)) categories.set(id, { id, name: head[2], blurb: "", count: 0 });
          category = categories.get(id);
        } else if (head[1] === "blurb") { if (category && !category.blurb) category.blurb = head[2]; }
        else if (head[1] === "group") group = head[2];
        else if (head[2] === "off") connector = false;
        else throw new Error(`${file}:${i + 1}: "# connector:" can only be "off"`);
        continue;
      }
      const meta = /^@for:\s*(.+?)\s*$/.exec(line);
      if (meta && current && !current.lines.length && !current.for) { current.for = meta[1]; continue; }
      if (line.startsWith("## ")) {
        finish();
        if (!category) throw new Error(`${file}:${i + 1}: a prompt before any "# category:" line`);
        const title = line.slice(3).trim();
        const id = slug(title);
        if (!id) throw new Error(`${file}:${i + 1}: a prompt with no title`);
        if (ids.has(id)) throw new Error(`${file}:${i + 1}: two prompts are called "${title}"`);
        ids.add(id);
        current = { id, title, lines: [] };
        continue;
      }
      if (current) current.lines.push(line);
      else if (line.trim() && !line.startsWith("#")) throw new Error(`${file}:${i + 1}: text outside a prompt`);
    }
    finish();
  }
  return { categories: [...categories.values()].filter((c) => c.count), prompts };
}

let cache = null;
export function library() {
  if (!cache) cache = loadPrompts();
  return cache;
}
export function resetLibrary() { cache = null; jsonCache = null; }

/** The library as JSON (the same for everyone), precompressed. The app's "Bonus: 1k Prompts" screen reads it. */
let jsonCache = null;
export function promptsJson() {
  if (!jsonCache) {
    const { categories, prompts } = library();
    const html = Buffer.from(JSON.stringify({ count: prompts.length, categories, prompts }));
    jsonCache = { html, gzip: zlib.gzipSync(html, { level: 9 }), br: zlib.brotliCompressSync(html) };
  }
  return jsonCache;
}

/** Send a precompressed response, picking the best encoding the browser accepts. */
export function sendCompressed(req, res, page, type = "text/html; charset=utf-8") {
  const accept = String(req.headers["accept-encoding"] || "");
  res.set("Content-Type", type).set("Vary", "Accept-Encoding");
  if (/\bbr\b/.test(accept)) return res.set("Content-Encoding", "br").send(page.br);
  if (/\bgzip\b/.test(accept)) return res.set("Content-Encoding", "gzip").send(page.gzip);
  return res.send(page.html);
}
