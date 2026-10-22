// Snapfront's plans on the website (app.snapfront.app): Stripe Checkout on Snapfront's own Stripe
// account. Same exports as billing.ts (Google Play) so shared screens work unchanged; the server
// checks every payment with Stripe and the plan follows the account into the phone app too.
// Web-only file: the phone app never loads it.
import * as SecureStore from "expo-secure-store";
import { API_URL, ApiError, api, type Me } from "./api";

export const LIFETIME = "lifetime";
export const PRO = "pro";
export type Offer = { plan: "lifetime" | "pro" | "yearly"; price: string; sku: string; offerToken?: string; left?: number; limit?: number };

/* ---------- Snapfront Partners: who sent this person ---------- */
// A partner link (snapfront.app/r/CODE) leaves a cookie on .snapfront.app; a link straight to the
// website can carry ?via=CODE. The first one is kept, and the server records it on the account.
const VIA = "snapfront.via";
function readVia(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(VIA);
    if (saved) return saved;
    const fromUrl = new URLSearchParams(window.location.search).get("via");
    const fromCookie = /(?:^|;\s*)sf_via=([^;]+)/.exec(document.cookie)?.[1];
    const v = fromCookie ? decodeURIComponent(fromCookie) : fromUrl ? `${fromUrl}.${Date.now()}` : null;
    if (v) window.localStorage.setItem(VIA, v);
    return v;
  } catch { return null; }
}
let claimed = false;
async function claimReferral() {
  const via = readVia();
  if (!via || claimed) return;
  claimed = true;
  await call("POST", "/api/partners/claim", { code: via }).catch(() => { claimed = false; });
}

let accountId: string | null = null;
export const billingAvailable = () => true;

/** Same sign-in as the rest of the app (the token api.ts keeps). */
async function call<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
  let token = await SecureStore.getItemAsync("snapfront.token");
  if (!token) { await api.me(); token = await SecureStore.getItemAsync("snapfront.token"); }
  const res = await fetch(`${API_URL}${path}`, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // An unknown token: api.me() drops it and starts a fresh visitor session, then try once more.
    if (res.status === 401 && (data as { code?: string }).code === "session_unknown" && !retried) {
      await api.me().catch(() => null);
      return call<T>(method, path, body, true);
    }
    throw new ApiError((data as { error?: string }).error || "Something went wrong. Try again.", res.status);
  }
  return data as T;
}

/** Called when the app opens: if the browser just came back from Stripe, unlock the plan. */
export async function startBilling(id: string) {
  accountId = id;
  void claimReferral();
  await finishReturnFromCheckout().catch(() => null);
}

export type CheckoutResult = Me & { checkout_email?: string | null };
let returning: Promise<CheckoutResult | null> | null = null;
/** The checkout the browser just came back from, if any: confirmed with Stripe by the server. */
export function finishReturnFromCheckout(): Promise<CheckoutResult | null> {
  if (returning) return returning;
  if (typeof window === "undefined") return Promise.resolve(null);
  const params = new URLSearchParams(window.location.search);
  const session = params.get("session_id");
  if (params.get("checkout") !== "done" || !session) return Promise.resolve(null);
  returning ||= call<CheckoutResult>("POST", "/api/billing/web/confirm", { session_id: session }).finally(() => {
    params.delete("session_id"); params.delete("checkout");   // a refresh shouldn't repeat this
    const q = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (q ? `?${q}` : ""));
  });
  return returning;
}
export const returningFromCheckout = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("checkout") === "done";
export const checkoutCanceled = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("checkout") === "canceled";

type OffersReply = { enabled: boolean; offers: Offer[]; android_url: string | null };
let offersReply: Promise<OffersReply> | null = null;
const offersOnce = () => (offersReply ||= call<OffersReply>("GET", "/api/billing/web/offers").catch((e) => { offersReply = null; throw e; }));

export async function getOffers(): Promise<Offer[]> {
  const r = await offersOnce();
  return r.enabled ? r.offers : [];
}
/** Where to get the phone app (the Google Play listing). */
export async function getAppInfo(): Promise<{ android_url: string | null }> {
  return { android_url: (await offersOnce()).android_url };
}

/** Sends the browser to Stripe's secure checkout page. It comes back to /plans when done. */
export async function buy(offer: Offer): Promise<Me | null> {
  if (!accountId) accountId = (await api.me()).account.id;
  const { url } = await call<{ url: string }>("POST", "/api/billing/web/checkout", { plan: offer.plan, ref: readVia() });
  window.location.assign(url);
  return new Promise<Me | null>(() => {});   // the page is leaving for Stripe
}

/** Check again with Stripe (and Google Play) for this account. */
export async function restore(): Promise<Me> {
  return api.billingSync();
}

/** Stripe's page to change the card or cancel Pro bought on the website. */
export async function manageSubscription(): Promise<void> {
  const { url } = await call<{ url: string }>("POST", "/api/billing/web/portal");
  window.location.assign(url);
}
