import type { Product, StudioResult } from "@/lib/api";
import type { StorefrontDraft, TemplatePhoto, TemplatePhotoSlot } from "@/lib/storefront-draft";
import { templatePhotoForSlot } from "@/lib/template-setup";

export type OwnedPhotoSource = TemplatePhoto & { label: string; kind: "slot" | "product" };
export type RetainedStudioResult = { storeId: string; slot: TemplatePhotoSlot; revision: number; photo: TemplatePhoto; source_file: string };

const resultMemory = new Map<string, RetainedStudioResult>();
const file = (value: unknown) => /^[\w-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(String(value ?? ""));
const url = (value: unknown) => /^https?:\/\//i.test(String(value ?? ""));
export const photoKey = (storeId: string, slot: TemplatePhotoSlot) => `${storeId}:${slot}`;

/** A Studio input must be a real server-owned reference, never a sample URL, data URL, or local base64. */
export function ownedPhoto(value: unknown, label: string, kind: "slot" | "product"): OwnedPhotoSource | null {
  const photo = value as Partial<TemplatePhoto> | null;
  const image_file = typeof photo?.image_file === "string" ? photo.image_file : null;
  const image_url = typeof photo?.image_url === "string" ? photo.image_url : null;
  return image_file && image_url && file(image_file) && url(image_url) ? { image_file, image_url, label, kind } : null;
}

export function draftSlotSource(draft: StorefrontDraft, slot: TemplatePhotoSlot): OwnedPhotoSource | null {
  const photo = templatePhotoForSlot(draft, slot);
  return ownedPhoto(photo, slot === 0 ? "Your main photo" : `Your detail photo ${slot}`, "slot");
}

export function productPhotoSources(products: Product[]): OwnedPhotoSource[] {
  return products.flatMap((product) => {
    const source = ownedPhoto({ image_file: product.image_file, image_url: product.image_url }, product.title || "Product photo", "product");
    return source ? [source] : [];
  });
}

/** Keep a completed result scoped to the initiating store and slot until that app process ends. */
export function retainStudioResult(storeId: string, slot: TemplatePhotoSlot, revision: number, source: OwnedPhotoSource, result: StudioResult): RetainedStudioResult | null {
  const photo = ownedPhoto(result, "AI photo", "slot");
  if (!photo || result.source_file !== source.image_file) return null;
  const retained: RetainedStudioResult = { storeId, slot, revision, photo, source_file: source.image_file };
  resultMemory.set(photoKey(storeId, slot), retained);
  return retained;
}

/** Do not display a late result if this panel now represents another store, slot, or store revision. */
export function studioResultFor(storeId: string, slot: TemplatePhotoSlot, revision: number): RetainedStudioResult | null {
  const result = resultMemory.get(photoKey(storeId, slot)) ?? null;
  return result && result.storeId === storeId && result.slot === slot && result.revision === revision ? result : null;
}

export function discardStudioResult(storeId: string, slot: TemplatePhotoSlot) {
  resultMemory.delete(photoKey(storeId, slot));
}
