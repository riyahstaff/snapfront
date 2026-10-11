import type { Seller } from "./api";

/** Close to the server's rule, for a live preview while typing; the server has the final say. */
export function slugPreview(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36);
}

/** "pawplace.snapfront.app" or the long form, without https://, for showing to people. */
export function displayAddress(s: Pick<Seller, "store_url">) {
  return s.store_url.replace(/^https?:\/\//, "");
}

export const DEFAULT_STORE_NAME = "My Snapfront Store";

/** Set once the seller has named their store (or chosen "Later"), so the welcome screen shows only once. */
export const NAMED_KEY = "snapfront.named";
