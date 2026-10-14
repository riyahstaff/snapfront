// Snapfront Academy: short lessons with narrated videos, a written guide and a button that opens the
// tool for each step. Videos are made on the server with open-source AI (narrated.js) and kept on the
// data volume; they're built once in the background and rebuilt only when a lesson's words change.
// Members on a paid plan get every lesson; the first module is open to everyone.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";
import { db } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";
import { MODULES, LESSONS } from "./academy-content.js";
import { makeVideo, pngFromSvg, FONT_FILES } from "./narrated.js";
import { wrap, familyOf } from "./fonts.js";

db.exec(`CREATE TABLE IF NOT EXISTS academy_progress (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  done_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (account_id, lesson_id)
)`);

const dir = () => path.join(config.dataDir, "academy");
const hashOf = (l) => crypto.createHash("sha256").update(JSON.stringify([l.title, l.slides, 2])).digest("hex").slice(0, 12);
const fileOf = (l) => path.join(dir(), `${l.id}-${hashOf(l)}.mp4`);
const metaOf = (l) => `${fileOf(l)}.json`;
const lessonById = (id) => LESSONS.find((l) => l.id === id);
const isMember = (account) => plans.effectivePlan(account) !== "free";
const unlocked = (account, l) => isMember(account) || MODULES.find((m) => m.id === l.module)?.free;

/* ---------- signed video links (members only, for a few hours) ---------- */
const sig = (id, exp) => crypto.createHmac("sha256", config.downloadSecret).update(`academy:${id}:${exp}`).digest("base64url").slice(0, 32);
function videoUrl(l) {
  if (!fs.existsSync(fileOf(l))) return null;
  const exp = Math.floor(Date.now() / 1000) + 6 * 3600;
  return `${config.publicUrl}/academy-media/${l.id}.mp4?e=${exp}&s=${sig(l.id, exp)}`;
}
/** The file for a signed link, or null. */
export function videoFile(id, e, s) {
  const l = lessonById(String(id).replace(/\.mp4$/, ""));
  const exp = Number(e);
  if (!l || !exp || exp < Date.now() / 1000) return null;
  const want = sig(l.id, exp);
  if (String(s || "").length !== want.length || !crypto.timingSafeEqual(Buffer.from(String(s)), Buffer.from(want))) return null;
  return fs.existsSync(fileOf(l)) ? fileOf(l) : null;
}

/* ---------- what the app shows ---------- */
export function catalog(account) {
  const done = new Set(db.prepare("SELECT lesson_id FROM academy_progress WHERE account_id = ?").all(account.id).map((r) => r.lesson_id));
  const member = isMember(account);
  return {
    member, done: done.size, total: LESSONS.length,
    modules: MODULES.map((m) => ({ id: m.id, title: m.title, free: Boolean(m.free),
      lessons: LESSONS.filter((l) => l.module === m.id).map((l) => {
        const meta = (() => { try { return JSON.parse(fs.readFileSync(metaOf(l), "utf8")); } catch { return null; } })();
        return { id: l.id, title: l.title, summary: l.summary, done: done.has(l.id), locked: !unlocked(account, l), minutes: meta ? Math.max(1, Math.round(meta.seconds / 60)) : Math.max(1, Math.round(l.slides.reduce((t, s) => t + s.say.split(" ").length, 0) / 150)) };
      }) })),
  };
}
export function lesson(account, id) {
  const l = lessonById(id);
  if (!l) throw httpError(404, "That lesson doesn't exist.");
  if (!unlocked(account, l)) throw httpError(402, "This lesson comes with Snapfront Pro.", { upgrade: "pro" });
  const i = LESSONS.indexOf(l);
  return {
    id: l.id, title: l.title, summary: l.summary, module: MODULES.find((m) => m.id === l.module)?.title, action: l.action,
    video: videoUrl(l), video_status: fs.existsSync(fileOf(l)) ? "ready" : "making",
    guide: l.slides.slice(1).map((s) => ({ heading: s.heading, points: s.points })),
    transcript: l.slides.map((s) => s.say).join("\n\n"),
    done: Boolean(db.prepare("SELECT 1 FROM academy_progress WHERE account_id = ? AND lesson_id = ?").get(account.id, l.id)),
    next: LESSONS[i + 1] ? { id: LESSONS[i + 1].id, title: LESSONS[i + 1].title } : null,
  };
}
export function setDone(account, id, done = true) {
  const l = lessonById(id);
  if (!l) throw httpError(404, "That lesson doesn't exist.");
  if (done) db.prepare("INSERT OR IGNORE INTO academy_progress (account_id, lesson_id) VALUES (?,?)").run(account.id, l.id);
  else db.prepare("DELETE FROM academy_progress WHERE account_id = ? AND lesson_id = ?").run(account.id, l.id);
  return catalog(account);
}

/* ---------- the slides ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const FAM = { display: familyOf(FONT_FILES.display), body: familyOf(FONT_FILES.body), bold: familyOf(FONT_FILES.bold) };
const MARK = (() => { try { return `data:image/png;base64,${fs.readFileSync(path.resolve(new URL("../assets/site/mark.png", import.meta.url).pathname)).toString("base64")}`; } catch { return null; } })();
const W = 1280, H = 720;
const C = { bg1: "#0B0D10", bg2: "#171B21", ink: "#F3F5F8", muted: "#A7AFBA", line: "#2B313A", accent: "#E5E9F0" };
function frame(inner, { index, count, moduleTitle }) {
  const bar = count > 1 ? `<rect x="64" y="${H - 40}" width="${W - 128}" height="4" rx="2" fill="${C.line}"/><rect x="64" y="${H - 40}" width="${((W - 128) * (index + 1)) / count}" height="4" rx="2" fill="${C.accent}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.bg1}"/><stop offset="1" stop-color="${C.bg2}"/></linearGradient>
<radialGradient id="glow" cx="0.85" cy="0.1" r="0.6"><stop offset="0" stop-color="#C9D2DE" stop-opacity="0.16"/><stop offset="1" stop-color="#C9D2DE" stop-opacity="0"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glow)"/>
${MARK ? `<image x="64" y="52" width="40" height="40" xlink:href="${MARK}"/>` : ""}
<text x="${MARK ? 116 : 64}" y="80" font-family="${FAM.bold}" font-size="22" fill="${C.muted}">Snapfront Academy  /  ${esc(moduleTitle)}</text>
${inner}${bar}</svg>`;
}
export function slideSvg(l, s, index) {
  const moduleTitle = MODULES.find((m) => m.id === l.module)?.title || "";
  const ctx = { index, count: l.slides.length, moduleTitle };
  if (index === 0) {
    const lines = wrap(FONT_FILES.display, l.title, 76, W - 200, 3);
    const sub = wrap(FONT_FILES.body, l.summary, 32, W - 260, 3);
    const top = H / 2 - (lines.length * 84 + sub.length * 44) / 2 + 40;
    return frame(`${lines.map((t, i) => `<text x="64" y="${top + i * 84}" font-family="${FAM.display}" font-size="76" fill="${C.ink}" letter-spacing="-1.5">${esc(t)}</text>`).join("")}
<rect x="64" y="${top + lines.length * 84 - 40}" width="96" height="5" rx="2.5" fill="${C.accent}"/>
${sub.map((t, i) => `<text x="64" y="${top + lines.length * 84 + 24 + i * 44}" font-family="${FAM.body}" font-size="32" fill="${C.muted}">${esc(t)}</text>`).join("")}`, ctx);
  }
  const head = wrap(FONT_FILES.display, s.heading, 58, W - 160, 2);
  let y = 200;
  let out = head.map((t, i) => `<text x="64" y="${y + i * 66}" font-family="${FAM.display}" font-size="58" fill="${C.ink}" letter-spacing="-1">${esc(t)}</text>`).join("");
  y += head.length * 66 + 40;
  const size = s.points.length > 4 ? 30 : 34, gap = s.points.length > 4 ? 18 : 24;
  for (const p of s.points) {
    const numbered = /^\d+\.\s/.exec(p);
    const text = numbered ? p.slice(numbered[0].length) : p;
    const lines = wrap(FONT_FILES.body, text, size, W - 260, 2);
    out += numbered
      ? `<circle cx="84" cy="${y - size * 0.34}" r="20" fill="${C.accent}"/><text x="84" y="${y - size * 0.34 + 8}" text-anchor="middle" font-family="${FAM.bold}" font-size="22" fill="${C.bg1}">${esc(numbered[0].replace(/\D/g, ""))}</text>`
      : `<rect x="70" y="${y - size * 0.5}" width="14" height="14" rx="3" fill="${C.accent}"/>`;
    out += lines.map((t, i) => `<text x="124" y="${y + i * (size + 10)}" font-family="${FAM.body}" font-size="${size}" fill="${C.ink}">${esc(t)}</text>`).join("");
    y += lines.length * (size + 10) + gap;
  }
  return frame(out, ctx);
}

/* ---------- building the videos (in the background) ---------- */
let building = null;
export const buildStatus = () => ({ building: Boolean(building), ready: LESSONS.filter((l) => fs.existsSync(fileOf(l))).length, total: LESSONS.length });
/** Make any lesson videos that are missing or out of date. One at a time; safe to call again. */
export function buildMissing({ voice = "af_heart", only = null } = {}) {
  if (building) return building;
  building = (async () => {
    fs.mkdirSync(dir(), { recursive: true });
    let made = 0;
    for (const l of LESSONS.filter((x) => !only || only.includes(x.id))) {
      if (fs.existsSync(fileOf(l))) continue;
      try {
        const slides = l.slides.map((s, i) => ({ png: pngFromSvg(slideSvg(l, s, i)), say: s.say }));
        const t0 = Date.now();
        const { seconds } = await makeVideo(slides, { out: fileOf(l), width: W, height: H, voice, workDir: dir() });
        fs.writeFileSync(metaOf(l), JSON.stringify({ seconds, made_at: new Date().toISOString() }));
        // Older versions of this lesson's video aren't needed any more.
        for (const f of fs.readdirSync(dir())) if (f.startsWith(`${l.id}-`) && !f.startsWith(path.basename(fileOf(l)))) fs.rmSync(path.join(dir(), f), { force: true });
        console.log(`[academy] made ${l.id} (${seconds}s) in ${Math.round((Date.now() - t0) / 1000)}s`);
        made++;
      } catch (e) { console.error("[academy]", l.id, e.message); }
    }
    return made;
  })().finally(() => { building = null; });
  return building;
}
