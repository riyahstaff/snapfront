// Sellers' own domains via Cloudflare for SaaS (a stand-in Cloudflare API), and the Worker hand-off.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-domains-"));
process.env.DATA_DIR = tmp;
process.env.PUBLIC_URL = "https://shopdomain.test";
process.env.STORE_DOMAIN = "shopdomain.test";
process.env.CLOUDFLARE_API_TOKEN = "cf_test_token";

const { app } = await import("../src/index.js");
const domains = await import("../src/domains.js");
const { db } = await import("../src/db.js");

/* ---------- fake Cloudflare ---------- */
const calls = [];
let hostnameState = { status: "pending", ssl: { status: "pending_validation" } };
domains.setCloudflareFetch(async (url, init) => {
  const u = new URL(url);
  const p = u.pathname.replace("/client/v4", "");
  let body = null;
  if (init.body instanceof FormData) body = { metadata: JSON.parse(await init.body.get("metadata").text()), worker: await init.body.get("worker.js").text() };
  else if (init.body) body = JSON.parse(init.body);
  calls.push({ method: init.method, path: p, query: Object.fromEntries(u.searchParams), body, auth: init.headers.Authorization });
  const ok = (result) => ({ ok: true, status: 200, json: async () => ({ success: true, errors: [], result }) });
  if (p === "/zones") return ok([{ id: "z1", status: "active", account: { id: "acct1" } }]);
  if (p === "/zones/z1/dns_records" && init.method === "GET") return ok([]);
  if (p === "/zones/z1/dns_records") return ok({ id: "r1" });
  if (p === "/zones/z1/custom_hostnames/fallback_origin") return ok(init.method === "GET" ? { origin: null } : { origin: body.origin, status: "pending_deployment" });
  if (p === "/accounts/acct1/workers/scripts/snapfront-domains") return ok({ id: "snapfront-domains" });
  if (p === "/zones/z1/workers/routes") return ok(init.method === "GET" ? [] : { id: "route1" });
  if (p === "/zones/z1/custom_hostnames" && init.method === "POST") return ok({ id: "ch1", hostname: body.hostname, ...hostnameState });
  if (p === "/zones/z1/custom_hostnames/ch1") return ok(init.method === "DELETE" ? { id: "ch1" } : { id: "ch1", ...hostnameState });
  throw new Error(`unexpected Cloudflare call ${init.method} ${p}`);
});

let server, port;
before(async () => { server = app.listen(0); await new Promise((r) => server.once("listening", r)); port = server.address().port; });
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

function req(host, method, url, { body, token, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({ host: "127.0.0.1", port, method, path: url, headers: { Host: host, ...headers, ...(data ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } }, (res) => {
      let text = ""; res.on("data", (c) => (text += c)); res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location, text, json: () => JSON.parse(text) }));
    });
    r.on("error", reject); if (data) r.write(data); r.end();
  });
}
const api = (method, url, token, body) => req("shopdomain.test", method, url, { token, body });
const viaWorker = (domain, url, secret = domains.edgeSecret()) => req("edge-origin.shopdomain.test", "GET", url, { headers: { "X-Snapfront-Host": domain, "X-Snapfront-Edge": secret } });

let s;
test("own domains come with Pro, and only subdomains of a domain the seller owns", async () => {
  s = (await api("POST", "/api/sellers", null, { store_name: "Paw Place" })).json();
  await api("PATCH", "/api/me", s.token, { store_name: "Paw Place" });
  let r = await api("PUT", "/api/domain", s.token, { domain: "shop.pawplace.com" });
  assert.equal(r.status, 402); assert.equal(r.json().upgrade, "pro");

  db.prepare("UPDATE accounts SET plan = 'pro' WHERE id = ?").run(s.account.id);
  assert.match((await api("PUT", "/api/domain", s.token, { domain: "pawplace.com" })).json().error, /subdomain, like shop\.pawplace\.com/);
  assert.match((await api("PUT", "/api/domain", s.token, { domain: "x.shopdomain.test" })).json().error, /already has a shopdomain\.test address/);
  assert.equal((await api("PUT", "/api/domain", s.token, { domain: "not a domain" })).status, 400);
});

test("adding a domain sets up Cloudflare once and tells the seller which record to add", async () => {
  const r = await api("PUT", "/api/domain", s.token, { domain: "https://Shop.PawPlace.com/" });
  assert.equal(r.status, 200, r.text);
  const v = r.json();
  assert.equal(v.domain, "shop.pawplace.com");
  assert.equal(v.status, "pending");
  assert.deepEqual(v.record, { type: "CNAME", host: "shop", value: "domains.shopdomain.test" });

  assert.ok(calls.every((c) => c.auth === "Bearer cf_test_token"));
  const dns = calls.filter((c) => c.path === "/zones/z1/dns_records" && c.method === "POST").map((c) => [c.body.name, c.body.type, c.body.content, c.body.proxied]);
  assert.deepEqual(dns, [["edge.shopdomain.test", "AAAA", "100::", true], ["domains.shopdomain.test", "CNAME", "edge.shopdomain.test", true]]);
  assert.equal(calls.find((c) => c.path.endsWith("/fallback_origin") && c.method === "PUT").body.origin, "edge.shopdomain.test");
  const worker = calls.find((c) => c.path.endsWith("/workers/scripts/snapfront-domains"));
  assert.equal(worker.body.metadata.main_module, "worker.js");
  assert.deepEqual(worker.body.metadata.bindings.map((b) => [b.type, b.name]), [["secret_text", "EDGE_SECRET"], ["plain_text", "ORIGIN_HOST"]]);
  assert.equal(worker.body.metadata.bindings[1].text, "edge-origin.shopdomain.test");
  assert.match(worker.body.worker, /X-Snapfront-Host/);
  assert.deepEqual(calls.find((c) => c.path === "/zones/z1/workers/routes" && c.method === "POST").body, { pattern: "*/*", script: "snapfront-domains" });
  const ch = calls.find((c) => c.path === "/zones/z1/custom_hostnames" && c.method === "POST").body;
  assert.equal(ch.hostname, "shop.pawplace.com");
  assert.equal(ch.ssl.method, "http");

  // Another store can't take the same domain
  const t = (await api("POST", "/api/sellers", null, {})).json();
  db.prepare("UPDATE accounts SET plan = 'pro' WHERE id = ?").run(t.account.id);
  assert.equal((await api("PUT", "/api/domain", t.token, { domain: "shop.pawplace.com" })).status, 409);
});

test("requests from the Worker serve the store; the domain becomes the store's address", async () => {
  // A forged hand-off is ignored (and edge-origin isn't a store)
  assert.equal((await viaWorker("shop.pawplace.com", "/", "wrong-secret")).status, 404);

  let r = await viaWorker("shop.pawplace.com", "/");
  assert.equal(r.status, 200, r.text);
  assert.match(r.text, /Paw Place/);
  assert.match(r.text, /href="\/cart"/);
  assert.match(r.text, /rel="canonical" href="https:\/\/shop\.pawplace\.com"/);

  const me = (await api("GET", "/api/me", s.token)).json();
  assert.equal(me.store_url, "https://shop.pawplace.com");
  assert.deepEqual(me.custom_domain, { domain: "shop.pawplace.com", status: "active" });
  // The snapfront.app address now forwards to the seller's domain
  r = await req("paw-place.shopdomain.test", "GET", "/cart?x=1");
  assert.equal(r.status, 301);
  assert.equal(r.location, "https://shop.pawplace.com/cart?x=1");
  assert.equal((await viaWorker("unknown.example.com", "/")).status, 404);
});

test("refresh reads Cloudflare's status; if Pro ends the store falls back to its snapfront.app address; remove cleans up", async () => {
  hostnameState = { status: "active", ssl: { status: "active" } };
  assert.equal((await api("POST", "/api/domain/refresh", s.token)).json().status, "active");

  db.prepare("UPDATE accounts SET plan = 'launch' WHERE id = ?").run(s.account.id);
  assert.equal((await api("GET", "/api/me", s.token)).json().store_url, "https://paw-place.shopdomain.test");
  const r = await viaWorker("shop.pawplace.com", "/");
  assert.equal(r.status, 301);
  assert.equal(r.location, "https://paw-place.shopdomain.test");

  const v = (await api("DELETE", "/api/domain", s.token)).json();
  assert.equal(v.domain, null);
  assert.ok(calls.some((c) => c.method === "DELETE" && c.path === "/zones/z1/custom_hostnames/ch1"));
});
