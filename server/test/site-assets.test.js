// The home page's tool-card animations live in assets/site/tools and load on both snapfront.app and the
// web app's own host (app.<domain>), whose other paths are the web app.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-site-"));
Object.assign(process.env, { DATA_DIR: tmp, PUBLIC_URL: "https://assets.test", STORE_DOMAIN: "assets.test" });
const { app } = await import("../src/index.js");
const TOOLS = path.resolve(new URL("../assets/site/tools/", import.meta.url).pathname);

let server, port;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); port = server.address().port; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });
const get = (host, p) => new Promise((resolve, reject) => {
  http.get({ host: "127.0.0.1", port, path: p, headers: { Host: host } }, (res) => { res.resume(); res.on("end", () => resolve(res)); }).on("error", reject);
});

test("every tool card has a WebM, an MP4 and a poster", () => {
  const home = fs.readFileSync(path.resolve(new URL("../../mobile/src/web/home.tsx", import.meta.url).pathname), "utf8");
  const keys = [...home.matchAll(/art: "([a-z0-9-]+)"/g)].map((m) => m[1]);
  assert.equal(keys.length, 19);
  for (const k of keys) for (const ext of ["webm", "mp4", "webp"]) assert.ok(fs.existsSync(path.join(TOOLS, `${k}.${ext}`)), `${k}.${ext}`);
});

test("the animations load on both hosts; the web app host still serves the app elsewhere", async () => {
  for (const host of ["assets.test", "app.assets.test"]) {
    const v = await get(host, "/site/tools/buyers.webm");
    assert.equal(v.statusCode, 200, host);
    assert.match(v.headers["content-type"], /video\/webm/);
    assert.match((await get(host, "/site/tools/buyers.webp")).headers["content-type"], /image\/webp/);
  }
  const page = await get("app.assets.test", "/channels");
  assert.match(page.headers["content-type"] || "", /text\/html/);
});
