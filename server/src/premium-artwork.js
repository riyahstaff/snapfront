// Decorative premium artwork is a server resource, never a seller-provided document path.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const artworkRoot = path.resolve(here, "..", "assets", "digital-artwork");
const files = Object.freeze({
  "chrome-gateway": "chrome-gateway.jpg",
  "pearl-sculpture": "pearl-sculpture.jpg",
  "amethyst-glass": "amethyst-glass.jpg",
  "emerald-architecture": "emerald-architecture.jpg",
  "optical-silver": "optical-silver.jpg",
  "silk-silver": "silk-silver.jpg",
  "ice-prism": "ice-prism.jpg",
  "copper-orbit": "copper-orbit.jpg",
  "stone-silver": "stone-silver.jpg",
});
const MAX_ARTWORK_BYTES = 1024 * 1024;

export const trustedArtworkIds = Object.freeze(Object.keys(files));

/**
 * Reads only a known Snapfront artwork filename. `id` is matched against a frozen map,
 * so neither source documents nor templates can cause arbitrary file or URL access.
 */
export async function readTrustedArtwork(id) {
  const filename = files[id];
  if (!filename) return null;
  const file = path.resolve(artworkRoot, filename);
  if (path.dirname(file) !== artworkRoot) return null;
  try {
    const bytes = await fs.readFile(file);
    if (!bytes.length || bytes.length > MAX_ARTWORK_BYTES) return null;
    return bytes;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}
