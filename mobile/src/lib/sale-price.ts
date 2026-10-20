// The optional "original price" shown crossed out next to a product's price. Display only: the
// store always charges the price itself.

/** "$20" or "20.00" -> 20; blank -> null; anything else -> NaN. */
export function parseMoney(text: string): number | null {
  const t = String(text ?? "").replace(/[$,\s]/g, "");
  if (!t) return null;
  return /^\d+(\.\d{1,2})?$/.test(t) ? Number(t) : NaN;
}

/** The whole percent a buyer saves, rounded down so it never overstates. */
export function savePercent(price: number, original: number): number {
  if (!(original > price) || !(price >= 0)) return 0;
  return Math.floor((1 - price / original) * 100);
}

/** What the seller sees under the field: a preview, or what to fix. */
export function salePreview(priceText: string, originalText: string): { ok: boolean; text: string } | null {
  const original = parseMoney(originalText);
  if (original === null) return null;
  const price = parseMoney(priceText);
  if (Number.isNaN(original) || original <= 0) return { ok: false, text: "Enter the original price, like 20.00." };
  if (price === null || Number.isNaN(price)) return { ok: false, text: "Enter the price first." };
  if (original <= price) return { ok: false, text: "The original price must be higher than the price." };
  const pct = savePercent(price, original);
  return { ok: true, text: `Shows $${original.toFixed(2)} crossed out${pct >= 1 ? `, with “Save ${pct}%”` : ""}.` };
}
