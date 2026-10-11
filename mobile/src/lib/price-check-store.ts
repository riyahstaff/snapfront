/** Hands a photo picked on one screen to the Price Check screen (too large for route params). */
export type PendingPhoto = { uri: string; base64: string; mimeType: string };
let pending: PendingPhoto | null = null;
export const priceCheckPhoto = {
  set(p: PendingPhoto) { pending = p; },
  take(): PendingPhoto | null { const p = pending; pending = null; return p; },
};
