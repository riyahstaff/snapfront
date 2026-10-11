// Suppliers a seller can connect with their own account: CJdropshipping, Printful and AliExpress.
// Credentials are stored per account, encrypted, and only ever used for that seller's products and orders.
import crypto from "node:crypto";
import { config } from "./config.js";
import { db } from "./db.js";
import { httpError } from "./claude.js";
import { seal, unseal } from "./supplier-util.js";
import * as cj from "./cj.js";
import * as printful from "./printful.js";
import * as aliexpress from "./aliexpress.js";

export const ADAPTERS = { cj: cj.adapter, printful: printful.adapter, aliexpress: aliexpress.adapter };
export const SOURCES = Object.keys(ADAPTERS);

db.exec(`
CREATE TABLE IF NOT EXISTS supplier_accounts (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  supplier TEXT NOT NULL,
  creds_enc TEXT NOT NULL,
  info TEXT NOT NULL DEFAULT '{}',
  auto_pay INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','pending_auth')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (account_id, supplier)
);
CREATE TABLE IF NOT EXISTS order_fulfillments (
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier TEXT NOT NULL,
  status TEXT NOT NULL,
  supplier_order_id TEXT,
  error TEXT,
  tracking_number TEXT,
  tracking_carrier TEXT,
  tracking_url TEXT,
  checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (order_id, supplier)
);
`);
{
  // Move CJ connections and CJ order progress saved before suppliers had their own tables.
  const cols = new Set(db.prepare("PRAGMA table_info(accounts)").all().map((c) => c.name));
  if (cols.has("cj_key_enc")) {
    for (const a of db.prepare("SELECT id, cj_key_enc, cj_auto_pay FROM accounts WHERE cj_key_enc IS NOT NULL").all()) {
      const key = unseal(a.cj_key_enc);
      if (key) db.prepare("INSERT OR IGNORE INTO supplier_accounts (account_id, supplier, creds_enc, auto_pay) VALUES (?, 'cj', ?, ?)").run(a.id, seal(JSON.stringify({ apiKey: key })), a.cj_auto_pay ? 1 : 0);
      db.prepare("UPDATE accounts SET cj_key_enc = NULL WHERE id = ?").run(a.id);
    }
  }
  db.prepare(`INSERT OR IGNORE INTO order_fulfillments (order_id, supplier, status, supplier_order_id, error, tracking_number, tracking_carrier, checked_at)
    SELECT id, 'cj', supplier_status, supplier_order_id, supplier_error, tracking_number, tracking_carrier, supplier_checked_at FROM orders WHERE supplier_status IS NOT NULL`).run();
  db.prepare("UPDATE orders SET supplier_status = NULL WHERE supplier_status IS NOT NULL").run();
}

export function adapterFor(source) {
  const a = ADAPTERS[String(source || "cj")];
  if (!a) throw httpError(400, `Unknown supplier. Use one of: ${SOURCES.join(", ")}.`);
  return a;
}

const row = (accountId, supplier) => db.prepare("SELECT * FROM supplier_accounts WHERE account_id = ? AND supplier = ?").get(accountId, supplier);
function credsOf(r) {
  if (!r) return null;
  try { return JSON.parse(unseal(r.creds_enc) || "null"); } catch { return null; }
}
function saveCreds(accountId, supplier, creds) {
  const { _changed, ...clean } = creds;
  db.prepare("UPDATE supplier_accounts SET creds_enc = ? WHERE account_id = ? AND supplier = ?").run(seal(JSON.stringify(clean)), accountId, supplier);
}

/** The seller's working credentials for a supplier, or null when not connected (or not yet authorized). */
export function connection(accountId, supplier) {
  const r = row(accountId, supplier);
  if (!r || r.status !== "connected") return null;
  const creds = credsOf(r);
  return creds ? { creds, autoPay: Boolean(r.auto_pay), info: JSON.parse(r.info || "{}") } : null;
}

/** Run a supplier call with the seller's credentials, saving them if the call refreshed a token. */
export async function withCreds(accountId, supplier, fn, { required = true } = {}) {
  const a = adapterFor(supplier);
  const c = connection(accountId, supplier);
  if (!c && required && !a.browseWithoutAccount) {
    throw httpError(409, `Connect your ${a.name} account in Store settings first.`, { connect: supplier });
  }
  const creds = c?.creds || null;
  try { return await fn(creds, c); }
  finally { if (creds?._changed) saveCreds(accountId, supplier, creds); }
}

export const callbackUrl = (supplier) => `${config.publicUrl}/suppliers/${supplier}/callback`;
const stateFor = (accountId, supplier) => {
  const payload = `${accountId}.${supplier}.${Date.now()}`;
  const mac = crypto.createHmac("sha256", config.downloadSecret).update(payload).digest("base64url").slice(0, 32);
  return Buffer.from(`${payload}.${mac}`).toString("base64url");
};
export function readState(state) {
  try {
    const [accountId, supplier, ts, mac] = Buffer.from(String(state || ""), "base64url").toString().split(".");
    const want = crypto.createHmac("sha256", config.downloadSecret).update(`${accountId}.${supplier}.${ts}`).digest("base64url").slice(0, 32);
    if (!mac || mac.length !== want.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(want))) return null;
    if (Date.now() - Number(ts) > 60 * 60e3) return null;
    return { accountId, supplier };
  } catch { return null; }
}

/** Public view of the seller's supplier connections (no secrets). */
export function status(accountId) {
  const out = {};
  for (const [id, a] of Object.entries(ADAPTERS)) {
    const r = row(accountId, id);
    const info = r ? JSON.parse(r.info || "{}") : {};
    out[id] = {
      name: a.name, connected: r?.status === "connected", auto_pay: Boolean(r?.auto_pay),
      ...(a.browseWithoutAccount ? { browse_without_account: Boolean(id !== "cj" || config.cjApiKey) } : {}),
      ...(a.needsAuthorization ? { pending_authorization: r?.status === "pending_auth", callback_url: callbackUrl(id) } : {}),
      ...(info.store_name ? { store_name: info.store_name } : {}),
      ...(info.account ? { account_name: info.account } : {}),
    };
  }
  return out;
}

export async function connect(accountId, supplier, input) {
  const a = adapterFor(supplier);
  const { creds, info = {}, pending = false } = await a.connect(input || {});
  db.prepare(`INSERT INTO supplier_accounts (account_id, supplier, creds_enc, info, auto_pay, status) VALUES (?,?,?,?,?,?)
    ON CONFLICT(account_id, supplier) DO UPDATE SET creds_enc=excluded.creds_enc, info=excluded.info, auto_pay=excluded.auto_pay, status=excluded.status`)
    .run(accountId, supplier, seal(JSON.stringify(creds)), JSON.stringify(info), input?.auto_pay ? 1 : 0, pending ? "pending_auth" : "connected");
  return { ...status(accountId), ...(pending ? { authorize_url: authorizeUrl(accountId, supplier) } : {}) };
}

export function authorizeUrl(accountId, supplier) {
  const r = row(accountId, supplier);
  const a = adapterFor(supplier);
  if (!r || !a.needsAuthorization) throw httpError(409, `Add your ${a.name} app details first.`);
  return aliexpress.authorizeUrl(credsOf(r), callbackUrl(supplier), stateFor(accountId, supplier));
}

/** The supplier sent the seller back to us after they approved Snapfront. */
export async function finishAuthorization(state, code) {
  const s = readState(state);
  if (!s) throw httpError(400, "This link has expired. Go back to Snapfront and tap Authorize again.");
  const r = row(s.accountId, s.supplier);
  if (!r) throw httpError(404, "Add your app details in Snapfront first.");
  const creds = await aliexpress.finishAuthorization(credsOf(r), String(code || ""));
  const info = { ...JSON.parse(r.info || "{}"), ...(creds.account ? { account: creds.account } : {}) };
  db.prepare("UPDATE supplier_accounts SET creds_enc = ?, info = ?, status = 'connected' WHERE account_id = ? AND supplier = ?")
    .run(seal(JSON.stringify(creds)), JSON.stringify(info), s.accountId, s.supplier);
  return s;
}

export function setAutoPay(accountId, supplier, autoPay) {
  const a = adapterFor(supplier);
  const r = db.prepare("UPDATE supplier_accounts SET auto_pay = ? WHERE account_id = ? AND supplier = ?").run(autoPay ? 1 : 0, accountId, supplier);
  if (!r.changes) throw httpError(409, `Connect your ${a.name} account first.`);
  return status(accountId);
}

export function disconnect(accountId, supplier) {
  adapterFor(supplier);
  db.prepare("DELETE FROM supplier_accounts WHERE account_id = ? AND supplier = ?").run(accountId, supplier);
  return status(accountId);
}
