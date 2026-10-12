// Email sign-in with a 6-digit code. A new phone starts with an anonymous account; signing in with an
// email either attaches that email to it, or (if the email already belongs to an account) switches
// the phone to that account so the person's stores and purchases follow them.
import crypto from "node:crypto";
import { config } from "./config.js";
import { db } from "./db.js";
import { httpError } from "./claude.js";
import * as plans from "./plans.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const normEmail = (e) => String(e || "").trim().toLowerCase().slice(0, 200);
const hashCode = (email, code) => crypto.createHmac("sha256", config.downloadSecret).update(`${email}:${code}`).digest("hex");

let sendImpl = async (to, code) => {
  if (!config.resendKey) throw httpError(503, "Email sign-in isn't set up yet. Try again later.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.emailFrom, to, subject: `Your Snapfront sign-in code: ${code}`,
      html: `<p>Your Snapfront sign-in code is</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>It works for 10 minutes. If you didn't ask for it, you can ignore this email.</p>`,
    }),
  });
  if (!res.ok) {
    console.warn("[email] resend", res.status, (await res.text().catch(() => "")).slice(0, 300));
    throw httpError(502, "We couldn't send the email. Check the address and try again.");
  }
};
export function setEmailSender(f) { sendImpl = f; }   // used by tests

const recent = new Map();
export async function startEmailLogin(account, rawEmail) {
  const email = normEmail(rawEmail);
  if (!EMAIL.test(email)) throw httpError(400, "Enter a valid email address.");
  const now = Date.now();
  const list = (recent.get(email) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (list.length >= 5) throw httpError(429, "Too many codes requested. Wait a little and try again.");
  list.push(now); recent.set(email, list);
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  db.prepare(`INSERT INTO login_codes (email, code_hash, account_id, expires_at, attempts) VALUES (?,?,?,?,0)
    ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, account_id = excluded.account_id, expires_at = excluded.expires_at, attempts = 0`)
    .run(email, hashCode(email, code), account.id, new Date(now + 10 * 60 * 1000).toISOString());
  await sendImpl(email, code);
  return { sent: true, email };
}

export function verifyEmailLogin(account, rawEmail, rawCode) {
  const email = normEmail(rawEmail);
  const code = String(rawCode || "").replace(/\D/g, "");
  const row = db.prepare("SELECT * FROM login_codes WHERE email = ?").get(email);
  if (!row || row.account_id !== account.id || new Date(row.expires_at) < new Date()) throw httpError(400, "That code has expired. Ask for a new one.");
  if (row.attempts >= 5) throw httpError(429, "Too many wrong codes. Ask for a new one.");
  const a = Buffer.from(row.code_hash), b = Buffer.from(hashCode(email, code));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    db.prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?").run(email);
    throw httpError(400, "That code isn't right. Check the email and try again.");
  }
  db.prepare("DELETE FROM login_codes WHERE email = ?").run(email);

  const owner = db.prepare("SELECT * FROM accounts WHERE email = ?").get(email);
  if (!owner || owner.id === account.id) {
    db.prepare("UPDATE accounts SET email = ? WHERE id = ?").run(email, account.id);
    return { status: "linked", email };
  }
  // The email belongs to another account: sign this phone in to it. The phone's own account is
  // dropped if it never got past the starter store (no products), so it doesn't linger.
  const token = plans.newSession(owner.id);
  const products = db.prepare("SELECT COUNT(*) n FROM products p JOIN sellers s ON s.id = p.seller_id WHERE s.account_id = ?").get(account.id).n;
  if (!products && !account.email && account.plan === "free" && !account.comp_plan) db.prepare("DELETE FROM accounts WHERE id = ?").run(account.id);
  return { status: "switched", email, token };
}


/* ---------- deleting an account from the web (Google Play asks for a link that does this) ---------- */
const deleteHash = (email, code) => hashCode(email, `delete:${code}`);
let sendDeleteImpl = async (to, code) => {
  if (!config.resendKey) throw httpError(503, "Email isn't working right now. Email us instead and we'll delete your account.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.emailFrom, to, subject: `Your code to delete your Snapfront account: ${code}`,
      html: `<p>Someone asked to delete the Snapfront account for this email address. If it was you, enter this code on the deletion page:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>It works for 10 minutes. If you didn't ask for this, ignore this email and nothing will be deleted.</p>`,
    }),
  });
  if (!res.ok) { console.warn("[email] delete", res.status, (await res.text().catch(() => "")).slice(0, 300)); throw httpError(502, "We couldn't send the email. Try again in a minute."); }
};
export function setDeleteSender(f) { sendDeleteImpl = f; }   // tests

/** Email a deletion code if an account uses this email. Says the same thing either way. */
export async function startDeletion(rawEmail) {
  const email = normEmail(rawEmail);
  if (!EMAIL.test(email)) throw httpError(400, "Enter a valid email address.");
  const now = Date.now();
  const list = (recent.get(`del:${email}`) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (list.length >= 5) throw httpError(429, "Too many codes requested. Wait a little and try again.");
  list.push(now); recent.set(`del:${email}`, list);
  const account = db.prepare("SELECT id FROM accounts WHERE email = ?").get(email);
  if (!account) return { email };
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  db.prepare(`INSERT INTO login_codes (email, code_hash, account_id, expires_at, attempts) VALUES (?,?,?,?,0)
    ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, account_id = excluded.account_id, expires_at = excluded.expires_at, attempts = 0`)
    .run(email, deleteHash(email, code), account.id, new Date(now + 10 * 60 * 1000).toISOString());
  await sendDeleteImpl(email, code);
  return { email };
}

/** Check the deletion code; returns the account id to delete. */
export function confirmDeletion(rawEmail, rawCode) {
  const email = normEmail(rawEmail);
  const code = String(rawCode || "").replace(/\D/g, "");
  const row = db.prepare("SELECT * FROM login_codes WHERE email = ?").get(email);
  if (!row || new Date(row.expires_at) < new Date()) throw httpError(400, "That code has expired. Ask for a new one.");
  if (row.attempts >= 5) throw httpError(429, "Too many wrong codes. Ask for a new one.");
  const a = Buffer.from(row.code_hash), b = Buffer.from(deleteHash(email, code));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    db.prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?").run(email);
    throw httpError(400, "That code isn't right. Check the email and try again.");
  }
  db.prepare("DELETE FROM login_codes WHERE email = ?").run(email);
  return row.account_id;
}
