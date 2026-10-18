// The home page's 90-second promo: the files ship with the site, the page plays it muted on arrival with
// sound, play/pause, mute, volume, seek, captions and full-screen controls, and it ends on Start here.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-promo-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://promo.test" });
const { app } = await import("../src/index.js");
const DIR = path.resolve(new URL("../assets/site/promo/", import.meta.url).pathname);

let server, base;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test("the promo files are all there: two MP4 sizes, a poster and captions", () => {
  for (const f of ["promo-1080.mp4", "promo-720.mp4", "promo.jpg", "promo.vtt"]) {
    const st = fs.statSync(path.join(DIR, f));
    assert.ok(st.size > 1000, f);
  }
  assert.ok(fs.statSync(path.join(DIR, "promo-1080.mp4")).size < 40e6, "keep the HD cut light enough for the home page");
  const vtt = fs.readFileSync(path.join(DIR, "promo.vtt"), "utf8");
  assert.match(vtt, /^WEBVTT/);
  assert.match(vtt, /Start here/);
  const meta = JSON.parse(fs.readFileSync(path.join(DIR, "promo.json"), "utf8"));
  assert.ok(meta.duration > 70 && meta.duration < 100, `about a minute and a half, got ${meta.duration}s`);
});

test("the home page plays it muted on arrival, with every control and a Start here ending", async () => {
  const html = await (await fetch(`${base}/`)).text();
  const section = html.slice(html.indexOf('id="watch"'));
  assert.match(section, /<video id="promo" playsinline muted/);
  for (const id of ["p-sound", "p-play", "p-mute", "p-vol", "p-seek", "p-cc", "p-full", "p-start", "p-again"]) assert.match(section, new RegExp(`id="${id}"`), id);
  assert.match(section, /Tap for sound/);
  assert.match(section, /<track kind="captions" src="\/site\/promo\/promo\.vtt\?v=[a-z0-9]+"/);
  assert.match(section, /prefers-reduced-motion/);   // no autoplay for people who asked for less motion
  assert.ok(html.indexOf('id="watch"') > html.indexOf('id="start-here"'), "the film sits under the hero's Start here button");
  for (const [f, type] of [["promo-720.mp4", /video\/mp4/], ["promo-1080.mp4", /video\/mp4/], ["promo.jpg", /image\/jpeg/], ["promo.vtt", /text\/vtt/]]) {
    const r = await fetch(`${base}/site/promo/${f}`, { headers: { Range: "bytes=0-99" } });
    assert.ok([200, 206].includes(r.status), f);
    assert.match(r.headers.get("content-type") || "", type, f);
    await r.arrayBuffer();
  }
});
