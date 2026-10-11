// Sellers' own domains (shop.pawplace.com) through Cloudflare for SaaS on the snapfront.app zone.
//
//   buyer → shop.pawplace.com (seller's CNAME → domains.snapfront.app)
//         → Cloudflare edge (certificate for the seller's domain)
//         → "snapfront-domains" Worker, which forwards the request to edge-origin.snapfront.app (Railway)
//           with X-Snapfront-Host: shop.pawplace.com and a shared secret
//         → this server serves the store that owns that domain.
//
// Railway only answers for hostnames it knows, so the Worker re-addresses each request to one it does.
import crypto from "node:crypto";
import { config } from "./config.js";
import { db } from "./db.js";
import { httpError } from "./claude.js";

const API = "https://api.cloudflare.com/client/v4";
export const WORKER_NAME = "snapfront-domains";
let fetchImpl = (...a) => fetch(...a);
export function setCloudflareFetch(f) { fetchImpl = f; zone = null; ready = null; }   // used by tests

const addCol = (t, name, def) => { if (!db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === name)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${name} ${def}`); };
addCol("sellers", "custom_domain", "TEXT");
addCol("sellers", "custom_domain_id", "TEXT");
addCol("sellers", "custom_domain_status", "TEXT");   // pending | active | failed
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS sellers_custom_domain ON sellers (custom_domain) WHERE custom_domain IS NOT NULL");

export const enabled = () => Boolean(config.cloudflareToken && config.storeDomain);
const host = (label) => `${label}.${config.storeDomain}`;
export const cnameTarget = () => host("domains");          // what sellers point their CNAME at
const fallbackHost = () => host("edge");                  // Cloudflare for SaaS fallback origin (originless, the Worker answers)
export const originHost = () => host("edge-origin");     // where the Worker sends requests (Railway, via *.snapfront.app)
/** Proves a request came through our Worker, so X-Snapfront-Host can be trusted. */
export const edgeSecret = () => crypto.createHmac("sha256", config.downloadSecret).update("snapfront-edge-v1").digest("base64url");

async function cf(method, path, body, { form } = {}) {
  let res;
  try {
    res = await fetchImpl(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${config.cloudflareToken}`, ...(form ? {} : { "Content-Type": "application/json" }) },
      body: form || (body ? JSON.stringify(body) : undefined),
    });
  } catch (e) {
    console.error("[cloudflare] network", path, e.message);
    throw httpError(502, "Couldn't reach Cloudflare. Try again in a minute.");
  }
  const j = await res.json().catch(() => ({}));
  if (j?.success) return j.result;
  const err = (j?.errors || [])[0] || {};
  console.error("[cloudflare]", method, path, res.status, err.code, err.message);
  const e = httpError(res.status === 409 || err.code === 1406 ? 409 : 502, err.message ? `Cloudflare: ${err.message}` : "Cloudflare didn't answer. Try again in a minute.");
  e.cfCode = err.code;
  throw e;
}

let zone = null;
async function getZone() {
  if (zone) return zone;
  const list = await cf("GET", `/zones?name=${encodeURIComponent(config.storeDomain)}`);
  const z = Array.isArray(list) ? list[0] : null;
  if (!z) throw httpError(503, `${config.storeDomain} isn't on Cloudflare yet.`);
  if (z.status !== "active") throw httpError(503, `${config.storeDomain} is still being set up on Cloudflare. Try again once it's active.`);
  zone = { id: z.id, account: z.account?.id };
  return zone;
}

const WORKER_SOURCE = `// Forwards a seller's own domain to Snapfront, saying which domain it was.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = new Headers(request.headers);
    headers.set("X-Snapfront-Host", url.hostname.toLowerCase());
    headers.set("X-Snapfront-Edge", env.EDGE_SECRET);
    headers.set("X-Forwarded-Proto", "https");
    const target = "https://" + env.ORIGIN_HOST + url.pathname + url.search;
    const hasBody = !["GET", "HEAD"].includes(request.method);
    return fetch(target, { method: request.method, headers, body: hasBody ? request.body : undefined, redirect: "manual" });
  },
};
`;

async function ensureRecord(z, name, type, content) {
  const existing = await cf("GET", `/zones/${z.id}/dns_records?name=${encodeURIComponent(name)}`);
  const rec = (existing || []).find((r) => r.type === type);
  if (rec && rec.content === content && rec.proxied) return;
  const body = { type, name, content, proxied: true, ttl: 1, comment: "Snapfront: sellers' own domains" };
  if (rec) await cf("PUT", `/zones/${z.id}/dns_records/${rec.id}`, body);
  else await cf("POST", `/zones/${z.id}/dns_records`, body);
}

/** One-time Cloudflare setup; safe to run again (each step checks first). */
let ready = null;
export function ensureEdge() {
  if (!enabled()) return Promise.reject(httpError(503, "Custom domains aren't switched on yet."));
  ready ||= (async () => {
    const z = await getZone();
    await ensureRecord(z, fallbackHost(), "AAAA", "100::");
    await ensureRecord(z, cnameTarget(), "CNAME", fallbackHost());
    const fb = await cf("GET", `/zones/${z.id}/custom_hostnames/fallback_origin`).catch(() => null);
    if (fb?.origin !== fallbackHost()) await cf("PUT", `/zones/${z.id}/custom_hostnames/fallback_origin`, { origin: fallbackHost() });

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify({
      main_module: "worker.js", compatibility_date: "2025-01-01",
      bindings: [{ type: "secret_text", name: "EDGE_SECRET", text: edgeSecret() }, { type: "plain_text", name: "ORIGIN_HOST", text: originHost() }],
    })], { type: "application/json" }));
    form.append("worker.js", new Blob([WORKER_SOURCE], { type: "application/javascript+module" }), "worker.js");
    await cf("PUT", `/accounts/${z.account}/workers/scripts/${WORKER_NAME}`, null, { form });

    const routes = await cf("GET", `/zones/${z.id}/workers/routes`);
    if (!(routes || []).some((r) => r.pattern === "*/*" && r.script === WORKER_NAME)) {
      await cf("POST", `/zones/${z.id}/workers/routes`, { pattern: "*/*", script: WORKER_NAME });
    }
    console.log("[domains] Cloudflare edge ready");
    return z;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

/* ---------- a seller's domain ---------- */
export function cleanHostname(input) {
  const h = String(input || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/?#].*$/, "").replace(/\.$/, "");
  if (!/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(h)) throw httpError(400, "Type a domain like shop.yourstore.com.");
  if (config.storeDomain && (h === config.storeDomain || h.endsWith(`.${config.storeDomain}`))) throw httpError(400, `Your store already has a ${config.storeDomain} address. Use a domain you own.`);
  if (h.split(".").length < 3) throw httpError(400, `Use a subdomain, like shop.${h} or www.${h}. Most domain companies can't point the bare ${h} at another service.`);
  return h;
}

/** Instructions for the seller's domain company. */
export function dnsRecord(hostname) {
  const parts = hostname.split(".");
  // shop.pawplace.com -> host "shop"; shop.pawplace.co.uk -> "shop" too (best effort: everything before the last two labels, or three for 2-letter second levels)
  const tail = /^(co|com|net|org|gov|ac|edu)$/.test(parts[parts.length - 2]) && parts[parts.length - 1].length === 2 ? 3 : 2;
  return { type: "CNAME", host: parts.slice(0, parts.length - tail).join("."), value: cnameTarget() };
}

export function view(seller) {
  if (!seller.custom_domain) return { enabled: enabled(), domain: null };
  return {
    enabled: enabled(), domain: seller.custom_domain, status: seller.custom_domain_status || "pending",
    record: dnsRecord(seller.custom_domain), url: `https://${seller.custom_domain}`,
  };
}

function statusFrom(h) {
  if (h?.status === "active" && h?.ssl?.status === "active") return "active";
  if (/blocked|moved|deleted/.test(h?.status || "") || /failed|expired/.test(h?.ssl?.status || "")) return "failed";
  return "pending";
}

export async function addDomain(seller, input) {
  const hostname = cleanHostname(input);
  const owner = db.prepare("SELECT id FROM sellers WHERE custom_domain = ? AND id != ?").get(hostname, seller.id);
  if (owner) throw httpError(409, `${hostname} is already connected to another Snapfront store.`);
  const z = await ensureEdge();
  if (seller.custom_domain_id) await cf("DELETE", `/zones/${z.id}/custom_hostnames/${seller.custom_domain_id}`).catch(() => {});
  let h;
  try {
    h = await cf("POST", `/zones/${z.id}/custom_hostnames`, { hostname, ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } } });
  } catch (e) {
    if (e.cfCode === 1406 || /already exists/i.test(e.message)) throw httpError(409, `${hostname} is already set up with another service on Cloudflare. Remove it there first.`);
    throw e;
  }
  db.prepare("UPDATE sellers SET custom_domain = ?, custom_domain_id = ?, custom_domain_status = ? WHERE id = ?").run(hostname, h.id, statusFrom(h), seller.id);
  return view(db.prepare("SELECT * FROM sellers WHERE id = ?").get(seller.id));
}

export async function refreshDomain(seller) {
  if (!seller.custom_domain_id) return view(seller);
  const z = await ensureEdge();
  const h = await cf("GET", `/zones/${z.id}/custom_hostnames/${seller.custom_domain_id}`).catch((e) => { if (/not found|does not exist/i.test(e.message)) return null; throw e; });
  const status = h ? statusFrom(h) : "failed";
  db.prepare("UPDATE sellers SET custom_domain_status = ? WHERE id = ?").run(status, seller.id);
  return view(db.prepare("SELECT * FROM sellers WHERE id = ?").get(seller.id));
}

export async function removeDomain(seller) {
  if (seller.custom_domain_id && enabled()) {
    const z = await ensureEdge();
    await cf("DELETE", `/zones/${z.id}/custom_hostnames/${seller.custom_domain_id}`).catch((e) => console.error("[domains] delete", e.message));
  }
  db.prepare("UPDATE sellers SET custom_domain = NULL, custom_domain_id = NULL, custom_domain_status = NULL WHERE id = ?").run(seller.id);
  return view(db.prepare("SELECT * FROM sellers WHERE id = ?").get(seller.id));
}

/** Check pending domains in the background so they switch on without the seller asking. */
export async function refreshPending(limit = 20) {
  if (!enabled()) return 0;
  const rows = db.prepare("SELECT * FROM sellers WHERE custom_domain_id IS NOT NULL AND custom_domain_status = 'pending' LIMIT ?").all(limit);
  for (const s of rows) await refreshDomain(s).catch((e) => console.error("[domains] refresh", s.custom_domain, e.message));
  return rows.length;
}
