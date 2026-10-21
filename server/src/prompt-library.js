// The prompt library: long, copy-and-paste prompts for Claude and ChatGPT, many of them using the
// Snapfront connector. The prompts live as plain text in server/prompts/*.txt so more can be added
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
export function resetLibrary() { cache = null; pageCache = null; jsonCache = null; }

/* ---------- the /prompts page ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/** Escape, then highlight [PLACEHOLDERS] so people see what to fill in. */
const withBlanks = (s) => esc(s).replace(/\[([^\]\n]{1,120})\]/g, '<mark>[$1]</mark>');

export const PROMPTS_CSS = `
.hero{padding-block:56px 26px}.hero .lead{max-width:70ch}
.how{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin:26px 0 8px}
.how div{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px 18px}.how b{display:block;margin-bottom:4px}
.how p{margin:0;color:var(--muted);font-size:15px}
.bar{position:sticky;top:0;z-index:5;background:rgba(9,11,14,.94);backdrop-filter:blur(8px);border-block:1px solid rgba(54,60,70,.5);padding-block:14px;margin-top:22px}
.bar .row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.bar select{flex:0 1 300px;min-width:0;font:inherit;font-size:15px;padding:11px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink)}
.bar input[type=search]{flex:1 1 280px;min-width:0;font:inherit;font-size:16px;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink)}
.bar label.only{display:flex;gap:8px;align-items:center;font-size:15px;color:var(--muted);cursor:pointer;white-space:nowrap}
.bar label.only input{width:18px;height:18px;accent-color:var(--platinum)}
.chips{display:flex;gap:8px;overflow-x:auto;padding-top:16px;scrollbar-width:thin}
.chip{flex:none;font:600 14px/1 Figtree,system-ui,sans-serif;padding:10px 14px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--muted);cursor:pointer}
.chip[aria-pressed=true]{background:var(--platinum);border-color:var(--platinum);color:var(--on-platinum)}
.chip span{opacity:.7;margin-left:6px;font-variant-numeric:tabular-nums}
.count{color:var(--muted);font-size:15px;margin:18px 0 0;font-variant-numeric:tabular-nums}
.cat{padding-block:30px 10px;border-top:0}.cat>h2{margin-bottom:4px}.cat>p{color:var(--muted);margin-bottom:18px;max-width:75ch}
.list{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(min(100%,520px),1fr));align-items:start}
.p{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:20px 20px 16px;min-width:0;scroll-margin-top:110px}
.p:target{border-color:var(--platinum)}
.grp{content-visibility:auto;contain-intrinsic-size:auto 1400px}
.p header{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;padding:0;border:0}
.p .t{font-size:18px;line-height:1.3;margin:0;letter-spacing:-.01em}.p .t a{text-decoration:none}.p .t a:hover{text-decoration:underline}
.p .for{margin:6px 0 0;font-size:14px;line-height:1.4;color:var(--muted)}
.gh{display:flex;gap:10px;align-items:baseline;font-size:20px;margin:30px 0 14px}.gh span{color:var(--muted);font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}
.grp:first-of-type .gh{margin-top:6px}
.tag{display:inline-block;margin-top:8px;font-size:12px;font-weight:700;letter-spacing:.03em;color:var(--good)}
.p .copy{flex:none;min-height:38px;padding:8px 14px;font-size:14px;border-radius:10px}
.p pre{margin:14px 0 0;white-space:pre-wrap;word-wrap:break-word;font:15px/1.6 Figtree,system-ui,sans-serif;color:#D5DAE1;max-height:9.6em;overflow:hidden;position:relative}
.p.open pre{max-height:none}
.p:not(.open) pre::after{content:"";position:absolute;inset:auto 0 0 0;height:3.2em;background:linear-gradient(transparent,var(--surface))}
.p mark{background:rgba(217,149,104,.16);color:var(--copper);border-radius:4px;padding:0 2px}
.p .more{margin-top:10px;background:none;border:0;padding:4px 0;color:var(--ink);font:600 14px/1 Figtree,system-ui,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.none{padding:40px 0;color:var(--muted)}
.fine{color:var(--muted);font-size:14px;max-width:80ch;padding-block:34px 56px}
.p header>div{min-width:0}
@media(min-width:900px){.chips{flex-wrap:wrap;overflow:visible}}
@media(max-width:560px){.p{padding:16px}.p .copy{min-height:36px;padding:6px 12px;font-size:13px}.bar{padding-block:10px}.chips{padding-top:12px}.bar .row{gap:8px}.bar select{flex:1 1 60%}.p{scroll-margin-top:150px}}
@media (prefers-reduced-motion:no-preference){.chip,.p{transition:border-color .15s}}`;

const PROMPTS_JS = `(function(){
var q=document.getElementById("q"),only=document.getElementById("only"),sel=document.getElementById("cat"),chips=[].slice.call(document.querySelectorAll(".chip")),
cards=[].slice.call(document.querySelectorAll(".p")),cats=[].slice.call(document.querySelectorAll(".cat")),count=document.getElementById("count"),none=document.getElementById("none"),total=cards.length,cat="";
var grps=[].slice.call(document.querySelectorAll(".grp"));
var text=cards.map(function(c){var f=c.querySelector(".for");return (c.querySelector(".t").textContent+" "+(f?f.textContent:"")+" "+c.querySelector("pre").textContent).toLowerCase()});
function apply(){var words=q.value.toLowerCase().split(/\\s+/).filter(Boolean),n=0;
cards.forEach(function(c,i){var ok=(!cat||c.dataset.cat===cat)&&(!only.checked||c.dataset.snapfront==="1")&&words.every(function(w){return text[i].indexOf(w)>=0});c.hidden=!ok;if(ok)n++});
grps.forEach(function(g){g.hidden=!g.querySelector(".p:not([hidden])")});cats.forEach(function(s){s.hidden=!s.querySelector(".p:not([hidden])")});
count.textContent=n===total?"All "+total+" prompts":"Showing "+n+" of "+total+" prompts";none.hidden=n>0}
function pick(v){cat=v;sel.value=v;chips.forEach(function(x){x.setAttribute("aria-pressed",String(x.dataset.cat===v))});apply();
if(history.replaceState)history.replaceState(null,"",cat?"#"+cat:location.pathname)}
chips.forEach(function(b){b.addEventListener("click",function(){pick(b.dataset.cat)})});sel.addEventListener("change",function(){pick(sel.value);var s=document.getElementById("count");if(s)s.scrollIntoView({block:"start"})});
var t;q.addEventListener("input",function(){clearTimeout(t);t=setTimeout(apply,120)});only.addEventListener("change",apply);
document.addEventListener("click",function(e){var b=e.target.closest(".copy,.more");if(!b)return;var card=b.closest(".p");
if(b.classList.contains("more")){var o=card.classList.toggle("open");b.textContent=o?"Show less":"Show the full prompt";b.setAttribute("aria-expanded",String(o));return}
var pre=card.querySelector("pre"),s=pre.textContent;function done(){b.textContent="Copied";setTimeout(function(){b.textContent="Copy prompt"},2000)}
function choose(){card.classList.add("open");var r=document.createRange();r.selectNodeContents(pre);var g=getSelection();g.removeAllRanges();g.addRange(r)}
if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(done,choose);else choose()});
function route(){var h=decodeURIComponent(location.hash.slice(1));if(!h)return;if(chips.some(function(x){return x.dataset.cat===h})){pick(h);return}
var el=document.getElementById(h);if(!el||!el.classList.contains("p"))return;if(el.hidden){q.value="";only.checked=false;pick("")}
el.classList.add("open");var m=el.querySelector(".more");m.textContent="Show less";m.setAttribute("aria-expanded","true");setTimeout(function(){el.scrollIntoView({block:"start"})},0)}
window.addEventListener("hashchange",route);route();
apply()})();`;

export function promptsBody() {
  const { categories, prompts } = library();
  const total = prompts.length;
  const withSnapfront = prompts.filter((p) => p.snapfront).length;
  const chips = [`<button class="chip" type="button" data-cat="" aria-pressed="true">All<span>${total}</span></button>`]
    .concat(categories.map((c) => `<button class="chip" type="button" data-cat="${esc(c.id)}" aria-pressed="false">${esc(c.name)}<span>${c.count}</span></button>`)).join("");
  const card = (p, c, h) => `<article class="p" id="${esc(p.id)}" data-cat="${esc(c.id)}" data-snapfront="${p.snapfront ? 1 : 0}">
<header><div><${h} class="t"><a href="#${esc(p.id)}">${esc(p.title)}</a></${h}>${p.for ? `<p class="for">For ${esc(p.for)}</p>` : ""}${p.snapfront ? '<span class="tag">Uses Snapfront</span>' : ""}</div><button class="btn copy" type="button">Copy prompt</button></header>
<pre>${withBlanks(p.prompt)}</pre><button class="more" type="button" aria-expanded="false">Show the full prompt</button></article>`;
  const options = [`<option value="">All categories (${total})</option>`].concat(categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)} (${c.count})</option>`)).join("");
  const sections = categories.map((c) => {
    // Prompts without a group come first, then each group under its own sub-heading, in file order.
    const groups = new Map();
    for (const p of prompts) if (p.category === c.id) { if (!groups.has(p.group)) groups.set(p.group, []); groups.get(p.group).push(p); }
    const ordered = [...groups].sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : 0));
    const body = ordered.map(([g, ps]) => `<div class="grp">${g ? `<h3 class="gh">${esc(g)}<span>${ps.length}</span></h3>` : ""}<div class="list">${ps.map((p) => card(p, c, g ? "h4" : "h3")).join("\n")}</div></div>`).join("\n");
    return `<section class="cat" id="cat-${esc(c.id)}"><h2>${esc(c.name)}</h2>${c.blurb ? `<p>${esc(c.blurb)}</p>` : ""}${body}</section>`;
  }).join("\n");
  return `<div class="wrap"><section class="hero"><h1>${total} prompts for Claude and ChatGPT</h1>
<p class="lead">Ready-to-paste prompts for building digital products, running your Snapfront store, short videos, AI agents, side hustles, money, health and your career. Some are focused prompts for one job; others are full build plans that walk you from research to a finished product, a product page and an automation plan. ${withSnapfront} of them use the Snapfront connector to work on your store for you.</p>
<div class="how"><div><b>Connect Snapfront first</b><p>Add the Snapfront connector to Claude or ChatGPT so the prompts marked Uses Snapfront can read and update your store. <a href="/connect-ai">How to connect</a></p></div>
<div><b>Fill in the brackets</b><p>Copy a prompt, paste it into a new chat and replace anything in <mark style="background:rgba(217,149,104,.16);color:var(--copper);border-radius:4px;padding:0 2px">[BRACKETS]</mark> with your own details.</p></div>
<div><b>You stay in charge</b><p>Store prompts ask your assistant to show you changes and wait for your OK before anything goes live.</p></div></div></section></div>
<div class="bar"><div class="wrap"><div class="row"><input id="q" type="search" placeholder="Search prompts: TikTok, planner, credit, Notion…" aria-label="Search prompts" autocomplete="off">
<select id="cat" aria-label="Category">${options}</select><label class="only"><input id="only" type="checkbox"> Uses Snapfront only</label></div></div></div>
<div class="wrap"><div class="chips" role="group" aria-label="Categories">${chips}</div></div>
<div class="wrap"><p class="count" id="count" aria-live="polite">All ${total} prompts</p><p class="none" id="none" hidden>No prompts match that. Try a shorter word or pick All.</p>
${sections}
<p class="fine">These prompts help you plan, write and build. What you earn depends on your product, your audience and the work you put in, and no prompt can promise income. Prompts about money, credit, health and the law give general information, not professional advice: check important decisions with a qualified professional. Claude is made by Anthropic and ChatGPT by OpenAI; Snapfront isn't affiliated with either.</p></div>
<script>${PROMPTS_JS}</script>`;
}

/** The page's HTML, gzip and brotli versions, made once (the page is the same for everyone). */
let pageCache = null;
export function promptsPage(render) {
  if (!pageCache) {
    const html = Buffer.from(render(promptsBody()));
    pageCache = { html, gzip: zlib.gzipSync(html, { level: 9 }), br: zlib.brotliCompressSync(html, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 10 } }) };
  }
  return pageCache;
}

/** The library as JSON (the same for everyone), precompressed like the page. */
let jsonCache = null;
export function promptsJson() {
  if (!jsonCache) {
    const { categories, prompts } = library();
    const html = Buffer.from(JSON.stringify({ count: prompts.length, categories, prompts }));
    jsonCache = { html, gzip: zlib.gzipSync(html, { level: 9 }), br: zlib.brotliCompressSync(html) };
  }
  return jsonCache;
}

/** Send a precompressed page, picking the best encoding the browser accepts. */
export function sendCompressed(req, res, page, type = "text/html; charset=utf-8") {
  const accept = String(req.headers["accept-encoding"] || "");
  res.set("Content-Type", type).set("Vary", "Accept-Encoding");
  if (/\bbr\b/.test(accept)) return res.set("Content-Encoding", "br").send(page.br);
  if (/\bgzip\b/.test(accept)) return res.set("Content-Encoding", "gzip").send(page.gzip);
  return res.send(page.html);
}
