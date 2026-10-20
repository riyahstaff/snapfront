// Server-side cover art and product PDFs, rendered with bundled open-licence fonts so output
// looks identical on any host (no system fonts required).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import PDFDocument from "pdfkit";
import { PRODUCT_TYPES } from "./claude.js";

const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "fonts");
const F = {
  display: path.join(FONT_DIR, "BricolageGrotesque-ExtraBold.ttf"),
  body: path.join(FONT_DIR, "DMSans-Regular.ttf"),
  bold: path.join(FONT_DIR, "DMSans-Bold.ttf"),
};
export const COVER_COLORS = { cobalt: "#2C47F5", forest: "#1E8E5A", brick: "#C2372B", violet: "#7A3EC8", ink: "#16152E", amber: "#D9822B" };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Greedy word wrap using an average glyph width; good enough for display type. */
function wrap(text, maxChars) {
  const lines = []; let line = "";
  for (const w of String(text).split(/\s+/)) {
    if ((line + " " + w).trim().length > maxChars && line) { lines.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

/** 1200×1200 PNG cover for a generated digital product. */
export function renderCover({ title, tagline, type, color = COVER_COLORS.cobalt }) {
  const kind = (PRODUCT_TYPES[type]?.name || "Digital product").toUpperCase();
  const t = wrap(title, 18).slice(0, 4);
  const sub = wrap(tagline || "", 46).slice(0, 2);
  const titleY = 700 - (t.length - 1) * 100;
  const rings = Array.from({ length: 6 }, (_, i) => `<circle cx="${1050 - i * 40}" cy="${160 + i * 30}" r="${260 - i * 30}" fill="#fff" opacity="0.16"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" fill="#F4F3F0"/><rect width="1200" height="760" fill="${esc(color)}"/>${rings}
  <text x="80" y="120" font-family="DM Sans" font-weight="700" font-size="30" letter-spacing="3" fill="#fff">${esc(kind)}</text>
  ${t.map((ln, i) => `<text x="80" y="${titleY + i * 100}" font-family="Bricolage Grotesque" font-weight="800" font-size="92" fill="#fff">${esc(ln)}</text>`).join("")}
  ${sub.map((ln, i) => `<text x="80" y="${850 + i * 50}" font-family="DM Sans" font-size="36" fill="#16152E">${esc(ln)}</text>`).join("")}
  <text x="80" y="1110" font-family="DM Sans" font-weight="700" font-size="28" letter-spacing="2" fill="${esc(color)}">INSTANT DOWNLOAD · PRINTABLE PDF</text></svg>`;
  return new Resvg(svg, { font: { fontFiles: [F.display, F.body, F.bold], loadSystemFonts: false, defaultFontFamily: "DM Sans" } }).render().asPng();
}

/**
 * Build the sellable PDF for a generated product. Returns a Buffer. `design` (from ai-cover.js), when
 * given, supplies a full-page cover and inside images keyed by section index (-1 = welcome page).
 */
export function renderProductPdf(product, coverPng, color = COVER_COLORS.cobalt, design = null) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 60, info: { Title: product.title, Author: product.storeName || "Snapfront" } });
    const chunks = []; doc.on("data", (c) => chunks.push(c)); doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject);
    doc.registerFont("display", F.display); doc.registerFont("body", F.body); doc.registerFont("bold", F.bold);
    const W = doc.page.width, H = doc.page.height, M = 60;

    // Cover
    if (design?.cover) doc.image(design.cover, 0, 0, { width: W, height: H });
    else {
      doc.rect(0, 0, W, H).fill("#F4F3F0");
      doc.image(coverPng, 0, (H - W) / 2, { width: W });
      doc.rect(0, 0, W, (H - W) / 2).fill(color);
    }
    // An inside image at the top of a page: rounded, full text width.
    const picture = (key, height = 230) => {
      const img = design?.images?.get?.(key);
      if (!img) return;
      const y = doc.y;
      doc.save(); doc.roundedRect(M, y, W - 2 * M, height, 14).clip();
      doc.image(img, M, y, { cover: [W - 2 * M, height], align: "center", valign: "center" });
      doc.restore();
      doc.x = M; doc.y = y + height + 22;
    };

    const page = () => {
      doc.addPage(); doc.rect(0, 0, W, 8).fill(color);
      doc.font("body").fontSize(8).fillColor("#888").text(product.title, M, H - 40, { lineBreak: false });
      doc.y = M; doc.x = M;
    };
    const h = (t, size = 20) => doc.font("display").fontSize(size).fillColor("#16152E").text(t, { width: W - 2 * M }).moveDown(0.5);
    const p = (t, size = 11) => doc.font("body").fontSize(size).fillColor("#2A2A35").text(t, { width: W - 2 * M, lineGap: 4 }).moveDown(0.6);
    const box = (t) => { const y = doc.y; doc.rect(M, y + 2, 10, 10).lineWidth(0.8).stroke("#999"); doc.font("body").fontSize(11).fillColor("#2A2A35").text(t, M + 20, y, { width: W - 2 * M - 20 }); doc.moveDown(0.4); doc.x = M; };

    page(); picture(-1, 260); h("Welcome", 26); p(product.description || "");
    p("Personal use licence: thank you for your purchase. Please don't resell or share this file.", 9);
    const c = product.content || {};
    if (product.type === "guide") (c.chapters || []).forEach((ch, i) => {
      page(); picture(i); doc.font("bold").fontSize(10).fillColor(color).text(`CHAPTER ${i + 1}`).moveDown(0.4);
      h(ch.heading || ""); (ch.paragraphs || []).forEach((t) => p(String(t)));
      if (ch.tip) { doc.moveDown(0.3); const y = doc.y; const hgt = doc.heightOfString("Try this: " + ch.tip, { width: W - 2 * M - 24 }) + 20;
        doc.rect(M, y, W - 2 * M, hgt).fill("#F4F3F0"); doc.font("bold").fontSize(10.5).fillColor("#2A2A35").text("Try this: " + ch.tip, M + 12, y + 10, { width: W - 2 * M - 24 }); doc.x = M; }
    });
    if (product.type === "checklist") (c.lists || []).forEach((ls, i) => { page(); picture(i, 170); h(ls.heading || ""); if (ls.intro) p(ls.intro); (ls.items || []).forEach((it) => box(String(it))); });
    if (product.type === "hooks") (c.groups || []).forEach((g, gi) => { if (gi % 2 === 0) page(); if (gi % 2 === 0) picture(gi, 150); h(g.heading || "", 16); (g.items || []).forEach((it, k) => p(`${gi * 10 + k + 1}.  ${it}`, 10.5)); });
    if (product.type === "quotes") (c.quotes || []).forEach((q) => {
      doc.addPage(); doc.rect(0, 0, W, H).fill("#F4F3F0"); doc.circle(W / 2, H * 0.36, 120).fill(color);
      doc.font("display").fontSize(32).fillColor("#16152E").text(String(q), M + 20, H * 0.62, { width: W - 2 * M - 40, align: "center" });
    });
    if (product.type === "planner") {
      page(); h("My goals", 26); (c.goal_areas || []).forEach((a) => { h(String(a), 14); for (let i = 0; i < 3; i++) box(" "); });
      for (let w = 0; w < 4; w++) {
        page(); h("Week of ____________", 20);
        for (const d of ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]) {
          const y = doc.y; doc.font("bold").fontSize(10).fillColor(color).text(d, M, y);
          for (let k = 0; k < 3; k++) doc.moveTo(M + 50, y + 12 + k * 16).lineTo(W - M, y + 12 + k * 16).lineWidth(0.5).stroke("#ccc");
          doc.y = y + 62; doc.x = M;
        }
        p("Reflect: " + ((c.weekly_prompts || [])[w] || "What went well this week?"));
      }
      page(); h("Habit tracker", 20);
      (c.habits || []).forEach((hb, i) => { const y = 120 + i * 34; doc.font("body").fontSize(9).fillColor("#2A2A35").text(String(hb), M, y + 4, { width: 140, lineBreak: false });
        for (let d = 0; d < 31; d++) doc.rect(M + 150 + d * 11.5, y + 2, 9, 14).lineWidth(0.5).stroke("#bbb"); });
    }
    doc.end();
  });
}

export function writeFileSafe(dir, name, buf) {
  const p = path.join(dir, name); fs.writeFileSync(p, buf); return name;
}
