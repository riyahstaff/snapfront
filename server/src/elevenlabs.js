// Premium voices: ElevenLabs text-to-speech on Snapfront's own ElevenLabs account
// (ELEVENLABS_API_KEY), sold to sellers in credits. Used for voiceovers on avatar videos and for
// talking avatars, next to the free Kokoro voices.
//
// Only ElevenLabs' stock ("premade") voices are offered, never the account owner's own or cloned
// voices. ELEVENLABS_VOICES (comma-separated voice ids) replaces that list with exactly the voices
// Snapfront wants to sell, if the owner prefers to choose them.
// Prices: ELEVENLABS_USD_PER_1K_CHARS (default $0.30, about what ElevenLabs' paid plans cost per
// 1,000 characters), turned into credits like the video models, at least 5 credits.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { dirs } from "./config.js";
import * as credits from "./credits.js";

const API = "https://api.elevenlabs.io";
const key = () => String(process.env.ELEVENLABS_API_KEY || "").trim();
export const enabled = () => Boolean(key());
const model = () => String(process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2").trim();
const usdPer1k = () => { const v = Number(process.env.ELEVENLABS_USD_PER_1K_CHARS); return Number.isFinite(v) && v > 0 && v < 100 ? v : 0.3; };
let fetchImpl = (...a) => fetch(...a);
export function setElevenFetch(f) { fetchImpl = f; voicesCache = null; }   // tests

/** Extra credits for reading `chars` characters with a premium voice. */
/** Credits per 1,000 characters before rounding; the app rounds up to 5 with a minimum of 5, like the server. */
export const ratePer1k = () => usdPer1k() * credits.perDollar();
export const priceFor = (chars) => credits.creditsFor((Math.max(1, chars) / 1000) * usdPer1k());

/* ---------- the voices on sale ---------- */
let voicesCache = null;   // { at, list }
const PREFIX = "el:";
export const isPremium = (id) => String(id || "").startsWith(PREFIX);
/** The premium voices, as { id: "el:<voice id>", name, accent, gender, premium: true }. Cached for 6 hours. */
export async function voices() {
  if (!enabled()) return [];
  if (voicesCache && Date.now() - voicesCache.at < 6 * 3600e3) return voicesCache.list;
  const chosen = String(process.env.ELEVENLABS_VOICES || "").split(",").map((s) => s.trim()).filter(Boolean);
  try {
    const q = new URLSearchParams({ page_size: "100" });
    if (chosen.length) for (const id of chosen.slice(0, 100)) q.append("voice_ids", id);
    else q.set("category", "premade");
    const r = await fetchImpl(`${API}/v2/voices?${q}`, { headers: { "xi-api-key": key() }, signal: AbortSignal.timeout(15_000) });
    if (!r.ok) throw new Error(`voices ${r.status}`);
    const data = await r.json();
    const list = (data.voices || [])
      // Never sell the owner's own voices unless they listed them on purpose.
      .filter((v) => v?.voice_id && (chosen.length ? chosen.includes(v.voice_id) : v.category === "premade"))
      .map((v) => ({ id: `${PREFIX}${v.voice_id}`, name: String(v.name || "Voice").split(/\s+[-–—]\s+/)[0].slice(0, 30),
        accent: String(v.labels?.accent || "").replace(/^\w/, (c) => c.toUpperCase()).slice(0, 20), gender: v.labels?.gender || "", premium: true }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 40);
    voicesCache = { at: Date.now(), list };
    return list;
  } catch (e) {
    console.warn("[elevenlabs] voices", e.message);
    voicesCache = { at: Date.now() - 5.5 * 3600e3, list: voicesCache?.list || [] };   // try again in 30 minutes
    return voicesCache.list;
  }
}
export async function isOnSale(id) { return (await voices()).some((v) => v.id === id); }

/* ---------- the owner's own voice choices (Academy presenter; never sold to sellers) ---------- */
const get = (url) => fetchImpl(`${API}${url}`, { headers: { "xi-api-key": key() }, signal: AbortSignal.timeout(20_000) });
/** Search ElevenLabs' public voice library. */
export async function searchLibrary(q = {}) {
  if (!enabled()) throw new Error("ElevenLabs isn't connected");
  const p = new URLSearchParams({ page_size: String(Math.min(50, Math.max(1, Number(q.page_size) || 30))), sort: ["trending", "cloned_by_count", "usage_character_count_1y", "created_date"].includes(q.sort) ? q.sort : "cloned_by_count" });
  for (const k of ["search", "gender", "age", "accent", "language"]) if (q[k]) p.set(k, String(q[k]).slice(0, 60));
  for (const k of ["descriptives", "use_cases"]) for (const v of [].concat(q[k] || []).slice(0, 5)) p.append(k, String(v).slice(0, 40));
  const r = await get(`/v1/shared-voices?${p}`);
  if (!r.ok) throw new Error(`library ${r.status} ${(await r.text().catch(() => "")).slice(0, 200)}`);
  const data = await r.json();
  return (data.voices || []).map((v) => ({ voice_id: v.voice_id, public_owner_id: v.public_owner_id, name: String(v.name || "").slice(0, 60), accent: v.accent || "", gender: v.gender || "", age: v.age || "",
    descriptive: v.descriptive || "", use_case: v.use_case || "", description: String(v.description || "").slice(0, 300), preview_url: v.preview_url || null, uses: v.cloned_by_count || 0 }));
}
/** Add a library voice to Snapfront's ElevenLabs account; returns its id ("el:..."). */
export async function addFromLibrary(publicOwnerId, voiceId, name) {
  if (!enabled()) throw new Error("ElevenLabs isn't connected");
  if (!/^[A-Za-z0-9]{6,80}$/.test(String(publicOwnerId)) || !/^[A-Za-z0-9]{8,40}$/.test(String(voiceId))) throw new Error("bad voice");
  const r = await fetchImpl(`${API}/v1/voices/add/${publicOwnerId}/${voiceId}`, { method: "POST", headers: { "xi-api-key": key(), "Content-Type": "application/json" },
    body: JSON.stringify({ new_name: String(name || "Academy voice").slice(0, 60) }), signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`add voice ${r.status} ${(await r.text().catch(() => "")).slice(0, 200)}`);
  const d = await r.json();
  accountCache = null;
  return `${PREFIX}${d.voice_id}`;
}
let accountCache = null;   // { at, list }
/** Every voice in Snapfront's ElevenLabs account, for the owner's own use. */
export async function accountVoices() {
  if (!enabled()) return [];
  if (accountCache && Date.now() - accountCache.at < 10 * 60e3) return accountCache.list;
  try {
    const r = await get("/v2/voices?page_size=100");
    if (!r.ok) throw new Error(`voices ${r.status}`);
    const data = await r.json();
    const list = (data.voices || []).filter((v) => v?.voice_id).map((v) => ({ id: `${PREFIX}${v.voice_id}`, name: String(v.name || "Voice").slice(0, 40),
      accent: String(v.labels?.accent || "").replace(/^\w/, (c) => c.toUpperCase()).slice(0, 24), gender: v.labels?.gender || "", premium: true, category: v.category || "" }));
    accountCache = { at: Date.now(), list };
    return list;
  } catch (e) { console.warn("[elevenlabs] account voices", e.message); return accountCache?.list || []; }
}

/* ---------- speaking ---------- */
function toWav(input, output) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, ["-y", "-hide_banner", "-loglevel", "error", "-i", input, "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", output], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err = (err + d).slice(-1000); });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`convert: ${err.slice(-200)}`))));
    p.on("error", reject);
  });
}
/**
 * Read `text` with a premium voice. Writes a 24 kHz mono WAV to `outPath` and returns its length
 * in seconds. Throws if ElevenLabs can't do it (the caller falls back to the free voice or refunds).
 */
export async function speakToWav(text, voiceId, outPath) {
  if (!enabled()) throw new Error("ElevenLabs isn't connected");
  const id = String(voiceId).slice(PREFIX.length);
  if (!/^[A-Za-z0-9]{8,40}$/.test(id)) throw new Error("bad voice id");
  const r = await fetchImpl(`${API}/v1/text-to-speech/${id}?output_format=mp3_44100_128`, {
    method: "POST", headers: { "xi-api-key": key(), "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: model() }), signal: AbortSignal.timeout(90_000),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`speech ${r.status} ${detail.slice(0, 200)}`);
  }
  const mp3 = path.join(dirs.media, `${crypto.randomUUID()}.mp3`);
  try {
    fs.writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
    await toWav(mp3, outPath);
  } finally { fs.rmSync(mp3, { force: true }); }
  const bytes = fs.statSync(outPath).size - 44;
  return Math.max(0, bytes / 2 / 24000);
}
