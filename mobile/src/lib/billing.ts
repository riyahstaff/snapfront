// In-app purchases through RevenueCat (Google Play Billing / App Store). The server never trusts the
// phone: after a purchase or restore it asks RevenueCat itself (api.billingSync) and updates the plan.
import { Platform } from "react-native";
import Constants from "expo-constants";
import Purchases, { PACKAGE_TYPE, type PurchasesPackage } from "react-native-purchases";
import { api, type Me } from "./api";

const extra = (Constants.expoConfig?.extra ?? {}) as { revenuecatGoogleKey?: string; revenuecatAppleKey?: string };
const apiKey = Platform.select({ android: extra.revenuecatGoogleKey, ios: extra.revenuecatAppleKey }) || "";

export type Offer = { plan: "launch" | "pro"; price: string; pkg: PurchasesPackage };

let configuredFor: string | null = null;
export const billingAvailable = () => Boolean(apiKey) && Platform.OS !== "web";

/** Tie purchases to the Snapfront account, so they follow the person to a new phone. */
export async function startBilling(accountId: string) {
  if (!billingAvailable() || configuredFor === accountId) return;
  try {
    if (!configuredFor) Purchases.configure({ apiKey, appUserID: accountId });
    else await Purchases.logIn(accountId);
    configuredFor = accountId;
  } catch {
    // Purchases are unavailable in Expo Go or without store services; the plans screen says so.
  }
}

/** Launch is the one-time "lifetime" package; Pro is the monthly subscription. */
export async function getOffers(): Promise<Offer[]> {
  if (!configuredFor) return [];
  const offerings = await Purchases.getOfferings();
  const pkgs = offerings.current?.availablePackages ?? [];
  const out: Offer[] = [];
  const launch = pkgs.find((p) => p.packageType === PACKAGE_TYPE.LIFETIME);
  const pro = pkgs.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY);
  if (launch) out.push({ plan: "launch", price: launch.product.priceString, pkg: launch });
  if (pro) out.push({ plan: "pro", price: pro.product.priceString, pkg: pro });
  return out;
}

/** Returns the updated account, or null if the person backed out of the purchase sheet. */
export async function buy(offer: Offer): Promise<Me | null> {
  try {
    await Purchases.purchasePackage(offer.pkg);
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return null;
    throw e;
  }
  return api.billingSync();
}

export async function restore(): Promise<Me> {
  if (configuredFor) await Purchases.restorePurchases();
  return api.billingSync();
}
