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
import * as presenter from "./academy-presenter.js";
import * as credits from "./credits.js";

db.exec(`CREATE TABLE IF NOT EXISTS academy_progress (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  done_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (account_id, lesson_id)
)`);

const dir = () => path.join(config.dataDir, "academy");
// Lessons taught by the avatar depend on her, the voice and the screen recordings too.
const hashOf = (l) => (presenter.appliesTo(l.id) ? `p${presenter.versionOf(l).slice(0, 11)}`
  : crypto.createHash("sha256").update(JSON.stringify([l.title, l.slides.map(({ heading, points, say }) => ({ heading, points, say })), 2])).digest("hex").slice(0, 12));
const fileOf = (l) => path.join(dir(), `${l.id}-${hashOf(l)}.mp4`);
/** The newest finished video of a lesson: the current one, or the previous one while a new one is made. */
function currentFile(l) {
  if (fs.existsSync(fileOf(l))) return fileOf(l);
  try {
    const older = fs.readdirSync(dir()).filter((f) => f.startsWith(`${l.id}-`) && f.endsWith(".mp4") && !f.includes(".part"))
      .map((f) => path.join(dir(), f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    return older[0] || null;
  } catch { return null; }
}
const lessonById = (id) => LESSONS.find((l) => l.id === id);
const isMember = (account) => plans.effectivePlan(account) !== "free";
const unlocked = (account, l) => isMember(account) || MODULES.find((m) => m.id === l.module)?.free;

/* ---------- signed video links (members only, for a few hours) ---------- */
const sig = (id, exp) => crypto.createHmac("sha256", config.downloadSecret).update(`academy:${id}:${exp}`).digest("base64url").slice(0, 32);
function videoUrl(l) {
  if (!currentFile(l)) return null;
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
  return currentFile(l);
}

/* ---------- what the app shows ---------- */
export function catalog(account) {
  const done = new Set(db.prepare("SELECT lesson_id FROM academy_progress WHERE account_id = ?").all(account.id).map((r) => r.lesson_id));
  const member = isMember(account);
  return {
    member, done: done.size, total: LESSONS.length, owner: credits.isOwner(account),
    modules: MODULES.map((m) => ({ id: m.id, title: m.title, free: Boolean(m.free),
      lessons: LESSONS.filter((l) => l.module === m.id).map((l) => {
        const meta = (() => { try { return JSON.parse(fs.readFileSync(`${currentFile(l)}.json`, "utf8")); } catch { return null; } })();
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
    video: videoUrl(l), video_status: currentFile(l) ? "ready" : "making",
    presenter: presenter.appliesTo(l.id),
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

/* ---------- slides with the avatar teaching ---------- */
// Same look as the plain slides, with room on the right for her window and, for app demos, a phone
// on the left for the screen recording.
function presenterFrame(inner, { index, count, moduleTitle, headerX = 64, head, phone }) {
  const bar = count > 1 ? `<rect x="64" y="${H - 22}" width="${W - 128}" height="4" rx="2" fill="${C.line}"/><rect x="64" y="${H - 22}" width="${((W - 128) * (index + 1)) / count}" height="4" rx="2" fill="${C.accent}"/>` : "";
  const win = `<rect x="${head.x - 6}" y="${head.y - 6}" width="${head.w + 12}" height="${head.h + 12}" rx="32" fill="#1B2027" stroke="${C.line}" stroke-width="2"/>`;
  const device = phone ? `<rect x="${phone.x}" y="${phone.y}" width="${phone.w}" height="${phone.h}" rx="44" fill="#05070A" stroke="#3A414C" stroke-width="3"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.bg1}"/><stop offset="1" stop-color="${C.bg2}"/></linearGradient>
<radialGradient id="glow" cx="0.85" cy="0.1" r="0.6"><stop offset="0" stop-color="#C9D2DE" stop-opacity="0.16"/><stop offset="1" stop-color="#C9D2DE" stop-opacity="0"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#glow)"/>
${MARK ? `<image x="${headerX}" y="44" width="34" height="34" xlink:href="${MARK}"/>` : ""}
<text x="${headerX + (MARK ? 46 : 0)}" y="68" font-family="${FAM.bold}" font-size="19" fill="${C.muted}">Snapfront Academy  /  ${esc(moduleTitle)}</text>
${device}${win}${inner}${bar}</svg>`;
}
export function presenterSlideSvg(l, s, index, layout = "slide") {
  const moduleTitle = MODULES.find((m) => m.id === l.module)?.title || "";
  const L = presenter.LAYOUT[layout];
  const x = layout === "screen" ? L.phone.x + L.phone.w + 44 : 64;
  const width = L.head.x - x - 48;
  const ctx = { index, count: l.slides.length, moduleTitle, headerX: x, head: L.head, phone: layout === "screen" ? L.phone : null };
  const big = layout === "screen" ? 44 : 60, mid = layout === "screen" ? 26 : 30;
  if (index === 0 && !s.points.length) {
    const lines = wrap(FONT_FILES.display, l.title, big + 8, width, 4);
    const sub = wrap(FONT_FILES.body, l.summary, mid, width, 4);
    const top = H / 2 - (lines.length * (big + 16) + sub.length * (mid + 12)) / 2 + 40;
    return presenterFrame(`${lines.map((t, i) => `<text x="${x}" y="${top + i * (big + 16)}" font-family="${FAM.display}" font-size="${big + 8}" fill="${C.ink}" letter-spacing="-1.2">${esc(t)}</text>`).join("")}
<rect x="${x}" y="${top + lines.length * (big + 16) - 36}" width="90" height="5" rx="2.5" fill="${C.accent}"/>
${sub.map((t, i) => `<text x="${x}" y="${top + lines.length * (big + 16) + 20 + i * (mid + 12)}" font-family="${FAM.body}" font-size="${mid}" fill="${C.muted}">${esc(t)}</text>`).join("")}`, ctx);
  }
  const head = wrap(FONT_FILES.display, s.heading, big, width, 3);
  let y = 170;
  let out = head.map((t, i) => `<text x="${x}" y="${y + i * (big + 10)}" font-family="${FAM.display}" font-size="${big}" fill="${C.ink}" letter-spacing="-1">${esc(t)}</text>`).join("");
  y += head.length * (big + 10) + 34;
  const size = s.points.length > 4 ? mid - 3 : mid, gap = s.points.length > 4 ? 14 : 20;
  for (const p of s.points) {
    const numbered = /^\d+\.\s/.exec(p);
    const text = numbered ? p.slice(numbered[0].length) : p;
    const lines = wrap(FONT_FILES.body, text, size, width - 60, 3);
    out += numbered
      ? `<circle cx="${x + 18}" cy="${y - size * 0.34}" r="17" fill="${C.accent}"/><text x="${x + 18}" y="${y - size * 0.34 + 7}" text-anchor="middle" font-family="${FAM.bold}" font-size="19" fill="${C.bg1}">${esc(numbered[0].replace(/\D/g, ""))}</text>`
      : `<rect x="${x + 6}" y="${y - size * 0.5}" width="12" height="12" rx="3" fill="${C.accent}"/>`;
    out += lines.map((t, i) => `<text x="${x + 48}" y="${y + i * (size + 9)}" font-family="${FAM.body}" font-size="${size}" fill="${C.ink}">${esc(t)}</text>`).join("");
    y += lines.length * (size + 9) + gap;
  }
  return presenterFrame(out, ctx);
}

/* ---------- building the videos (in the background) ---------- */
let building = null;
export const buildStatus = () => ({ building: Boolean(building), ready: LESSONS.filter((l) => fs.existsSync(fileOf(l))).length, total: LESSONS.length,
  presenter_lessons: LESSONS.filter((l) => presenter.appliesTo(l.id)).map((l) => ({ id: l.id, ready: fs.existsSync(fileOf(l)), video: videoUrl(l) })), last_error: lastError });
let lastError = null;
/** Rebuild just the lessons the avatar teaches (in the background). */
export function buildPresenterLessons() {
  const only = LESSONS.filter((l) => presenter.appliesTo(l.id)).map((l) => l.id);
  if (only.length) buildMissing({ only }).catch((e) => console.error("[academy]", e.message));
  return only;
}
/** Make any lesson videos that are missing or out of date. One at a time; safe to call again. */
export function buildMissing({ voice = "af_heart", only = null } = {}) {
  if (building) return building;
  building = (async () => {
    fs.mkdirSync(dir(), { recursive: true });
    let made = 0;
    for (const l of LESSONS.filter((x) => !only || only.includes(x.id))) {
      if (fs.existsSync(fileOf(l))) continue;
      try {
        const t0 = Date.now();
        const target = fileOf(l);   // worked out once: it depends on settings that can change while building
        const { seconds } = presenter.appliesTo(l.id)
          ? await presenter.buildLesson(l, { svgFor: presenterSlideSvg, out: target })
          : await makeVideo(l.slides.map((s, i) => ({ png: pngFromSvg(slideSvg(l, s, i)), say: s.say })), { out: target, width: W, height: H, voice, workDir: dir() });
        if (target !== fileOf(l)) { fs.rmSync(target, { force: true }); continue; }   // settings changed meanwhile: the next build makes it
        fs.writeFileSync(`${target}.json`, JSON.stringify({ seconds, made_at: new Date().toISOString(), presenter: presenter.appliesTo(l.id) }));
        // Older versions of this lesson's video aren't needed any more.
        for (const f of fs.readdirSync(dir())) if (f.startsWith(`${l.id}-`) && !f.startsWith(path.basename(fileOf(l)))) fs.rmSync(path.join(dir(), f), { force: true });
        console.log(`[academy] made ${l.id} (${seconds}s) in ${Math.round((Date.now() - t0) / 1000)}s`);
        made++;
      } catch (e) { lastError = `${l.id}: ${e.message}`.slice(0, 300); console.error("[academy]", l.id, e.message); }
    }
    return made;
  })().finally(() => { building = null; });
  return building;
}
