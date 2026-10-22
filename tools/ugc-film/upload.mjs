// Uploads the finished film to the live server, where it plays as the Academy lesson that names it.
//   STUDIO_TOKEN=… node upload.mjs [file]     (default out/final/ugc-film-1080.mp4)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const here = path.dirname(new URL(import.meta.url).pathname);
const API = process.env.API || "https://snapfront.app";
const TOKEN = process.env.STUDIO_TOKEN || process.env.ACADEMY_STUDIO_TOKEN;
if (!TOKEN) { console.error("Set STUDIO_TOKEN"); process.exit(1); }
const { OUT, META } = await import("./film.mjs");
const file = process.argv[2] || path.join(OUT, "final", `${META.name}-1080.mp4`);
const seconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
const r = await fetch(`${API}/api/academy/films/${META.academy}?seconds=${seconds.toFixed(1)}`, { method: "PUT", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "video/mp4" }, body: fs.readFileSync(file) });
console.log(r.status, await r.text());
process.exit(r.ok ? 0 : 1);
