// Stripe Connect (Express accounts, direct charges). Each seller is paid into their own Stripe
// account; Snapfront optionally keeps PLATFORM_FEE_PERCENT of each sale as an application fee.
import Stripe from "stripe";
import crypto from "node:crypto";
import { config } from "./config.js";
import { httpError } from "./claude.js";

let stripe = null;
export function setStripeClient(c) { stripe = c; }   // used by tests
export function stripeClient() {
  if (stripe) return stripe;
  if (!config.stripeKey) throw httpError(503, "Payments are not configured. Set STRIPE_SECRET_KEY on the server.");
  stripe = new Stripe(config.stripeKey);
  return stripe;
}

/** Create (or reuse) the seller's connected account and return a Stripe-hosted onboarding URL. */
export async function onboardingLink(seller) {
  const s = stripeClient();
  let accountId = seller.stripe_account_id;
  if (!accountId) {
    // Express Dashboard for sellers, but Stripe (not Snapfront) covers losses and sellers pay their own
    // Stripe fees. Plain type: "express" would make the platform liable for every seller's negative balance.
    const acct = await s.accounts.create({
      controller: {
        stripe_dashboard: { type: "express" },
        losses: { payments: "stripe" },
        fees: { payer: "account" },
        requirement_collection: "stripe",
      },
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: { name: seller.store_name, url: `${config.publicUrl}/s/${seller.store_slug}` },
      metadata: { snapfront_seller: seller.id },
    });
    accountId = acct.id;
  }
  const link = await s.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${config.publicUrl}/stripe/refresh`,
    return_url: `${config.publicUrl}/stripe/return`,
  });
  return { accountId, url: link.url };
}

export async function accountReady(accountId) {
  if (!accountId) return false;
  const acct = await stripeClient().accounts.retrieve(accountId);
  return Boolean(acct.charges_enabled);
}

/** Stripe Express dashboard login link so sellers can see payouts. */
export async function dashboardLink(accountId) {
  return (await stripeClient().accounts.createLoginLink(accountId)).url;
}

/**
 * Create a Checkout Session on the seller's connected account (a direct charge).
 * A cart discount becomes a single-use coupon so the buyer sees it itemised in Checkout.
 */
export async function createCheckout(seller, params, discountCents = 0) {
  const s = stripeClient();
  const opts = { stripeAccount: seller.stripe_account_id };
  if (discountCents > 0) {
    const coupon = await s.coupons.create({
      amount_off: discountCents, currency: "usd", duration: "once", max_redemptions: 1,
      name: `Discount ${params.metadata?.snapfront_order || ""}`.trim().slice(0, 40),
    }, opts);
    params = { ...params, discounts: [{ coupon: coupon.id }] };
  }
  return s.checkout.sessions.create(params, opts);
}

/**
 * Stripe Tax on an Express account. Express sellers have no Stripe Dashboard for tax, so they
 * enter their business address and tax registrations in Stripe's embedded components (/stripe/tax).
 */
export async function taxStatus(accountId) {
  const opts = { stripeAccount: accountId };
  const [settings, regs] = await Promise.all([
    stripeClient().tax.settings.retrieve({}, opts),
    stripeClient().tax.registrations.list({ status: "active", limit: 100 }, opts),
  ]);
  return {
    active: settings.status === "active",
    missing: settings.status_details?.pending?.missing_fields || [],
    registrations: regs.data.map((r) => [r.country, r.country_options?.us?.state].filter(Boolean).join("-")),
  };
}

/** A short-lived session for Stripe's embedded tax settings and registrations components. */
export async function taxAccountSession(accountId) {
  const session = await stripeClient().accountSessions.create({
    account: accountId,
    components: { tax_settings: { enabled: true }, tax_registrations: { enabled: true } },
  });
  return session.client_secret;
}

/** Read a checkout on the seller's account (status, totals, buyer details). */
export async function getSession(accountId, sessionId) {
  return stripeClient().checkout.sessions.retrieve(sessionId, { stripeAccount: accountId });
}

/** Check a finished checkout on the seller's account. */
export async function paidSession(accountId, sessionId) {
  const session = await stripeClient().checkout.sessions.retrieve(sessionId, { stripeAccount: accountId });
  return session.payment_status === "paid" ? session : null;
}

export function verifyWebhook(rawBody, signature) {
  if (!config.stripeWebhookSecret) throw httpError(503, "STRIPE_WEBHOOK_SECRET is not set.");
  return stripeClient().webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
}

/* ---- signed, expiring download links (no login needed for buyers) ---- */
const sign = (payload) => crypto.createHmac("sha256", config.downloadSecret).update(payload).digest("base64url");

/** Signed link for the tax setup page, so the app can open it in the browser without sharing its token. */
export function taxSetupToken(sellerId, minutes = 30) {
  const payload = Buffer.from(JSON.stringify({ t: "tax", sel: sellerId, e: Date.now() + minutes * 60e3 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readTaxSetupToken(token) {
  const data = readDownloadToken(token);
  return data?.t === "tax" ? data.sel : null;
}
export function downloadToken(productId, sessionId, days = 7) {
  const payload = Buffer.from(JSON.stringify({ p: productId, s: sessionId, e: Date.now() + days * 864e5 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readDownloadToken(token) {
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  let data;
  try { data = JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { return null; }
  return data.e > Date.now() ? data : null;
}

const escHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Order confirmation with any download links. Sent only when RESEND_API_KEY is set. */
export async function emailOrder(to, { storeName, orderUrl, downloads }) {
  if (!config.resendKey || !to) return false;
  const links = downloads.map((d) => `<li><a href="${escHtml(d.url)}">Download ${escHtml(d.title)}</a></li>`).join("");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.emailFrom, to, subject: `Your order from ${storeName}`,
      html: `<p>Thanks for your order from ${escHtml(storeName)}!</p>${links ? `<ul>${links}</ul><p>Download links work for 7 days.</p>` : ""}<p><a href="${escHtml(orderUrl)}">View your order</a></p>`,
    }),
  });
  return res.ok;
}
