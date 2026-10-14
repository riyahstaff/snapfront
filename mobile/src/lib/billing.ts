// Google Play Billing (expo-iap). Memberships are sold on the website now, so the app no longer
// sells anything: this keeps working for people who bought in earlier versions (finishing
// half-done purchases, Restore). The server never trusts the
// phone: each purchase token goes to /api/billing/google, the server checks it with Google,
// acknowledges it and sets the plan. The purchase is tagged with the Snapfront account id, so it
// can't be used to unlock someone else's account.
import { Platform } from "react-native";
import {
  initConnection, fetchProducts, requestPurchase, finishTransaction, getAvailablePurchases,
  purchaseUpdatedListener, purchaseErrorListener, isUserCancelledError,
  type Purchase, type Product, type ProductSubscription,
} from "expo-iap";
import { api, type Me } from "./api";

export const LAUNCH = "snapfront_launch";     // no longer sold; still restored for people who bought it
export const LIFETIME = "snapfront_lifetime";
export const PRO = "snapfront_pro";
const PRO_BASE_PLAN = "pro-monthly-69";

export type Offer = { plan: "lifetime" | "pro"; price: string; sku: string; offerToken?: string };
type SubOffer = { basePlanIdAndroid?: string | null; offerTokenAndroid?: string | null; displayPrice: string };

let accountId: string | null = null;
let connected = false;
let connecting: Promise<boolean> | null = null;
let listening = false;
// buy() waits for the purchase to come back through the listener.
let waiting: { sku: string; resolve: (m: Me | null) => void; reject: (e: unknown) => void } | null = null;

export const billingAvailable = () => Platform.OS === "android";

async function connect(): Promise<boolean> {
  if (!billingAvailable()) return false;
  if (connected) return true;
  connecting ||= initConnection().then(() => (connected = true)).catch(() => false).finally(() => { connecting = null; });
  return connecting;
}

const tokenOf = (p: Purchase) => (p as { purchaseToken?: string | null }).purchaseToken || "";

/** Send one purchase to the server, then tell Google Play we've handled it. */
async function deliver(p: Purchase): Promise<Me | null> {
  if (p.productId !== LAUNCH && p.productId !== LIFETIME && p.productId !== PRO) return null;
  if (p.purchaseState === "pending") return null;   // e.g. paying with cash at a shop: it arrives later
  const token = tokenOf(p);
  if (!token) return null;
  const me = await api.billingGoogle(p.productId, token);
  await finishTransaction({ purchase: p, isConsumable: false }).catch(() => {});
  return me;
}

function listen() {
  if (listening) return;
  listening = true;
  purchaseUpdatedListener(async (p) => {
    try {
      const me = await deliver(p);
      if (waiting && waiting.sku === p.productId) { waiting.resolve(me); waiting = null; }
    } catch (e) {
      if (waiting && waiting.sku === p.productId) { waiting.reject(e); waiting = null; }
    }
  });
  purchaseErrorListener((e) => {
    if (!waiting) return;
    if (isUserCancelledError(e)) waiting.resolve(null); else waiting.reject(e);
    waiting = null;
  });
}

/** Called when the app opens (and after signing in): connect, and finish any purchase left half-done. */
export async function startBilling(id: string) {
  accountId = id;
  if (!(await connect())) return;
  listen();
  try {
    const left = (await getAvailablePurchases()).filter((p) => !(p as { isAcknowledgedAndroid?: boolean | null }).isAcknowledgedAndroid);
    for (const p of left) await deliver(p).catch(() => {});
  } catch { /* not signed in to Google Play, or offline: nothing to finish now */ }
}

/** The two plans with prices in the person's own currency, as Google Play shows them. */
export async function getOffers(): Promise<Offer[]> {
  if (!(await connect())) return [];
  const out: Offer[] = [];
  const once = (await fetchProducts({ skus: [LIFETIME], type: "in-app" }).catch(() => [])) as Product[];
  const lifetime = once.find((p) => p.id === LIFETIME);
  if (lifetime) out.push({ plan: "lifetime", price: lifetime.displayPrice, sku: LIFETIME });
  const subs = (await fetchProducts({ skus: [PRO], type: "subs" }).catch(() => [])) as ProductSubscription[];
  const pro = subs.find((p) => p.id === PRO);
  const offers: SubOffer[] = (pro as { subscriptionOffers?: SubOffer[] | null } | undefined)?.subscriptionOffers ?? [];
  // Only the current monthly price: the old $14.99 base plan stays for people who already have it.
  const monthly = offers.find((o) => o.basePlanIdAndroid === PRO_BASE_PLAN && o.offerTokenAndroid);
  if (pro && monthly?.offerTokenAndroid) out.push({ plan: "pro", price: monthly.displayPrice || pro.displayPrice, sku: PRO, offerToken: monthly.offerTokenAndroid });
  return out;
}

/** Opens Google Play's purchase sheet. Returns the updated account, or null if the person backed out. */
export async function buy(offer: Offer): Promise<Me | null> {
  if (!accountId || !(await connect())) throw new Error("Purchases aren't available on this device.");
  listen();
  const done = new Promise<Me | null>((resolve, reject) => { waiting = { sku: offer.sku, resolve, reject }; });
  try {
    if (offer.plan === "lifetime") {
      await requestPurchase({ type: "in-app", request: { google: { skus: [offer.sku], obfuscatedAccountId: accountId } } });
    } else {
      await requestPurchase({ type: "subs", request: { google: { skus: [offer.sku], obfuscatedAccountId: accountId,
        subscriptionOffers: offer.offerToken ? [{ sku: offer.sku, offerToken: offer.offerToken }] : [] } } });
    }
  } catch (e) {
    waiting = null;
    if (isUserCancelledError(e)) return null;
    throw e;
  }
  return done;
}

/** Re-send everything this Google account owns to the server, then return the account. */
export async function restore(): Promise<Me> {
  let failure: unknown = null;
  if (await connect()) {
    const owned = await getAvailablePurchases().catch(() => [] as Purchase[]);
    for (const p of owned) {
      try { await deliver(p); } catch (e) { failure = e; }
    }
  }
  const me = await api.billingSync();
  // Say why when something was found but couldn't be used (e.g. bought on another Snapfront account).
  if (failure && me.account.plan === "free") throw failure;
  return me;
}
