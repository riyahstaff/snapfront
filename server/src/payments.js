// Stripe Connect (Express accounts, direct charges). Each seller is paid into their own Stripe
// account; Snapfront optionally keeps PLATFORM_FEE_PERCENT of each sale as an application fee.
import Stripe from "stripe";
import crypto from "node:crypto";
import { config } from "./config.js";
import { httpError } from "./claude.js";

let stripe = null;
export function stripeClient() {
  if (!config.stripeKey) throw httpError(503, "Payments are not configured. Set STRIPE_SECRET_KEY on the server.");
  stripe ??= new Stripe(config.stripeKey);
  return stripe;
}

/** Create (or reuse) the seller's connected account and return a Stripe-hosted onboarding URL. */
export async function onboardingLink(seller) {
  const s = stripeClient();
  let accountId = seller.stripe_account_id;
  if (!accountId) {
    const acct = await s.accounts.create({
      type: "express",
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

/** Create the Stripe product, price and Payment Link on the seller's account. */
export async function publishToStripe(seller, product) {
  const s = stripeClient();
  const opts = { stripeAccount: seller.stripe_account_id };
  const imageUrl = product.image_url && product.image_url.startsWith("https://") ? [product.image_url] : undefined;
  const sp = await s.products.create({
    name: product.title,
    description: (product.tagline || product.description || "").slice(0, 500) || undefined,
    images: imageUrl,
    metadata: { snapfront_product: product.id },
  }, opts);
  const price = await s.prices.create({ product: sp.id, unit_amount: product.price_cents, currency: product.currency }, opts);
  const params = {
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { snapfront_product: product.id },
    after_completion: { type: "redirect", redirect: { url: `${config.publicUrl}/thanks?p=${product.id}&session_id={CHECKOUT_SESSION_ID}` } },
  };
  if (config.platformFeePercent > 0) params.application_fee_percent = config.platformFeePercent;
  if (product.kind === "physical") params.shipping_address_collection = { allowed_countries: ["US", "CA", "GB", "AU", "NZ", "IE"] };
  const link = await s.paymentLinks.create(params, opts);
  return { stripe_product_id: sp.id, stripe_price_id: price.id, payment_link_url: link.url };
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
export function downloadToken(productId, sessionId, days = 7) {
  const payload = Buffer.from(JSON.stringify({ p: productId, s: sessionId, e: Date.now() + days * 864e5 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readDownloadToken(token) {
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  return data.e > Date.now() ? data : null;
}

export async function emailDownload(to, product, url, storeName) {
  if (!config.resendKey || !to) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.emailFrom, to, subject: `Your download: ${product.title}`,
      html: `<p>Thanks for your order from ${storeName}!</p><p><a href="${url}">Download ${product.title}</a></p><p>The link works for 7 days.</p>`,
    }),
  });
  return res.ok;
}
