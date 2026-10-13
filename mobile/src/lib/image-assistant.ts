import { imageRequest } from "@/lib/api";

export type ImageContext = "storefront" | "digital";
export type ImageOperation = "storefront-edit" | "storefront-art" | "digital-art" | "digital-edit" | "digital-mockup";
export type ImageAspect = "wide" | "portrait" | "square";
export type ImageJob = {
  id: string; context: ImageContext; operation: ImageOperation;
  status: "queued" | "running" | "done" | "failed";
  prompt: string; aspect: ImageAspect; slot: 0 | 1 | 2 | null;
  product_id: string | null; source_file: string | null;
  image_file?: string; image_url?: string; error: string | null; created_at: string;
};
export type ImageAssistantOptions = {
  enabled: boolean; provider: "runpod" | null; setup_required: string | null;
  jobs: ImageJob[]; mockups: { id: string; name: string }[];
  allowance: { ai: { remaining: number; limit: number }; mockup: { remaining: number; limit: number } };
};
export type ImageAssistantInput = {
  operation: ImageOperation; prompt: string; image_file?: string | null;
  aspect: ImageAspect; preset?: string; idempotency_key: string;
  slot?: 0 | 1 | 2; product_id?: string | null;
};
export const imageAssistant = {
  options: (context: ImageContext, storeId: string) => imageRequest<ImageAssistantOptions>("GET", `/api/image-assistant?context=${context}`, undefined, storeId),
  start: (input: ImageAssistantInput, storeId: string) => imageRequest<ImageJob>("POST", "/api/image-assistant/jobs", input, storeId),
  job: (id: string, storeId: string) => imageRequest<ImageJob>("GET", `/api/image-assistant/jobs/${encodeURIComponent(id)}`, undefined, storeId),
};
export const imageJobRunning = (job: ImageJob | null | undefined) => job?.status === "queued" || job?.status === "running";
export const usableImageJob = (job: ImageJob | null | undefined): job is ImageJob & { image_file: string; image_url: string } => Boolean(job?.status === "done" && /^[\w-]+\.(?:png|jpe?g|webp)$/.test(job.image_file ?? "") && /^https?:\/\//.test(job.image_url ?? ""));
/** A new key is created only for an explicit new generation. Retry sends the frozen request/key. */
export const imageRequestKey = () => `image_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
export function mergeImageJob(jobs: ImageJob[], next: ImageJob): ImageJob[] {
  const previous = jobs.find((job) => job.id === next.id);
  if (previous && !imageJobRunning(previous) && imageJobRunning(next)) return jobs;
  return [next, ...jobs.filter((job) => job.id !== next.id)].slice(0, 40);
}
export function jobsForStorefrontSlot(jobs: ImageJob[], slot: 0 | 1 | 2): ImageJob[] {
  return jobs.filter((job) => job.context === "storefront" && job.slot === slot);
}
export type DigitalArtworkSelection = { storeId: string; productId: string; pageId: string; blockId: string; previousImageFile?: string | null; image_file: string; image_url: string };
const artwork = new Map<string, DigitalArtworkSelection>();
export function rememberDigitalArtwork(selection: DigitalArtworkSelection) {
  if (!selection.storeId || !selection.productId || !selection.pageId || !selection.blockId || !/^[\w-]+\.(?:png|jpe?g|webp)$/.test(selection.image_file) || !/^https?:\/\//.test(selection.image_url)) throw new Error("Choose a completed image and the same digital page first.");
  artwork.set(`${selection.storeId}:${selection.productId}`, { ...selection });
}
export function consumeDigitalArtwork(storeId: string, productId: string): DigitalArtworkSelection | null {
  const key = `${storeId}:${productId}`;
  const selection = artwork.get(key) ?? null;
  artwork.delete(key);
  return selection;
}
