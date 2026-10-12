import * as SecureStore from "expo-secure-store";

/** A resumable local setup draft. It deliberately stores server photo references, never image base64. */
export type HeroMotion = "still" | "drift" | "pan";
export type StorefrontTone = "considered" | "warm" | "bold";
export type StorefrontDraft = {
  version: 1;
  step: number;
  category: string;
  theme: string;
  banner_file: string | null;
  banner_url: string | null;
  hero_motion: HeroMotion;
  store_name: string;
  hero_title: string;
  hero_subtitle: string;
  hero_eyebrow: string;
  hero_cta: string;
  tagline: string;
  about: string;
  announcement: string;
  notes: string;
  tone: StorefrontTone;
};

const PREFIX = "snapfront.storefront-draft.";
const MAX_DRAFT_BYTES = 6000;
const writeTails = new Map<string, Promise<void>>();

const text = (value: unknown, max: number) => String(value ?? "").slice(0, max);
const step = (value: unknown) => Math.max(1, Math.min(5, Math.floor(Number(value) || 1)));
const motion = (value: unknown): HeroMotion => value === "drift" || value === "pan" ? value : "still";
const tone = (value: unknown): StorefrontTone => value === "warm" || value === "bold" ? value : "considered";
const validFile = (value: unknown) => /^[\w-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(String(value ?? ""));
const imageUrl = (value: unknown) => {
  const url = text(value, 1200);
  return /^https?:\/\//i.test(url) ? url : null;
};

function key(storeId: string) {
  // Store ids currently use safe characters; keep the storage key safe if that ever changes.
  return `${PREFIX}${String(storeId).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

/** SecureStore is asynchronous, so serialize writes for each store in call order. */
function queueWrite(storageKey: string, write: () => Promise<void>): Promise<void> {
  const previous = writeTails.get(storageKey) ?? Promise.resolve();
  // A failed earlier write must not prevent a newer complete draft from being saved.
  const queued = previous.catch(() => undefined).then(write);
  writeTails.set(storageKey, queued);
  void queued.then(
    () => { if (writeTails.get(storageKey) === queued) writeTails.delete(storageKey); },
    () => { if (writeTails.get(storageKey) === queued) writeTails.delete(storageKey); },
  );
  return queued;
}

/** JSON length is UTF-16 code units; SecureStore limits are byte-oriented. */
function utf8Bytes(value: string): number {
  let bytes = 0;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function newStorefrontDraft(values: Partial<StorefrontDraft> = {}): StorefrontDraft {
  return {
    version: 1,
    step: step(values.step),
    category: text(values.category, 64),
    theme: text(values.theme, 100),
    banner_file: validFile(values.banner_file) ? String(values.banner_file) : null,
    banner_url: imageUrl(values.banner_url),
    hero_motion: motion(values.hero_motion),
    store_name: text(values.store_name, 80),
    hero_title: text(values.hero_title, 100),
    hero_subtitle: text(values.hero_subtitle, 220),
    hero_eyebrow: text(values.hero_eyebrow, 48),
    hero_cta: text(values.hero_cta, 32),
    tagline: text(values.tagline, 160),
    about: text(values.about, 600),
    announcement: text(values.announcement, 90),
    notes: text(values.notes, 700),
    tone: tone(values.tone),
  };
}

/** Load a single store's draft. Invalid or old local data is ignored rather than shown. */
export async function loadStorefrontDraft(storeId: string): Promise<StorefrontDraft | null> {
  const raw = await SecureStore.getItemAsync(key(storeId));
  if (!raw || utf8Bytes(raw) > MAX_DRAFT_BYTES) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StorefrontDraft>;
    if (parsed.version !== 1) return null;
    return newStorefrontDraft(parsed);
  } catch {
    return null;
  }
}

/** Persist only short text and an owned staged-photo reference; image bytes are never kept locally here. */
export function saveStorefrontDraft(storeId: string, draft: StorefrontDraft): Promise<void> {
  const encoded = JSON.stringify(newStorefrontDraft(draft));
  if (utf8Bytes(encoded) > MAX_DRAFT_BYTES) return Promise.reject(new Error("Storefront draft is too large to save on this device."));
  const storageKey = key(storeId);
  return queueWrite(storageKey, () => SecureStore.setItemAsync(storageKey, encoded));
}

export function clearStorefrontDraft(storeId: string): Promise<void> {
  const storageKey = key(storeId);
  return queueWrite(storageKey, () => SecureStore.deleteItemAsync(storageKey));
}
