import { db } from "./db.js";
import { designPhotoFiles } from "./storefront-media.js";

const hasImageAssistantJobs = () => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='image_assistant_jobs'").get());

/** Private source ownership is established by authenticated uploads, listings or recorded AI jobs—not a public filename. */
export function ownsSellerImage(sellerId, file) {
  if (!sellerId || !/^[\w-]+\.(jpg|jpeg|png|webp|gif)$/.test(String(file || ""))) return false;
  if (db.prepare(`SELECT 1 FROM seller_media WHERE seller_id=? AND image_file=?
    UNION SELECT 1 FROM products WHERE seller_id=? AND image_file=?
    UNION SELECT 1 FROM storefront_photos WHERE seller_id=? AND image_file=?
    UNION SELECT 1 FROM sellers WHERE id=? AND banner_file=? LIMIT 1`)
    .get(sellerId, file, sellerId, file, sellerId, file, sellerId, file)) return true;
  const seller = db.prepare("SELECT design_photos FROM sellers WHERE id=?").get(sellerId);
  if (designPhotoFiles(seller?.design_photos).includes(file)) return true;
  // AI results created before this release have durable seller ownership in media_jobs.
  return db.prepare("SELECT result FROM media_jobs WHERE seller_id=? AND status='done' AND result IS NOT NULL").all(sellerId)
    .some((row) => { try { return JSON.parse(row.result)?.image_file === file; } catch { return false; } })
    // Image-assistant outputs are registered in seller_media when finished, but this durable
    // record also covers a migration/restart between the file write and registration.
    || (hasImageAssistantJobs() && Boolean(db.prepare("SELECT 1 FROM image_assistant_jobs WHERE seller_id=? AND result_file=? AND status='done' LIMIT 1").get(sellerId, file)));
}

/**
 * A staged upload may be deleted only after it is no longer applied anywhere. This intentionally
 * keeps a file when a product, either storefront slot, or durable AI-job history still needs it.
 */
export function sellerImageIsInUse(sellerId, file) {
  if (!sellerId || !/^[\w-]+\.(jpg|jpeg|png|webp|gif)$/.test(String(file || ""))) return false;
  if (db.prepare("SELECT 1 FROM products WHERE seller_id=? AND image_file=? LIMIT 1").get(sellerId, file)) return true;
  const seller = db.prepare("SELECT banner_file, design_photos FROM sellers WHERE id=?").get(sellerId);
  if (seller?.banner_file === file || designPhotoFiles(seller?.design_photos).includes(file)) return true;
  const designs = db.prepare("SELECT document_json FROM digital_designs WHERE seller_id=? AND source_available=1").all(sellerId);
  if (designs.some((row) => {
    try {
      const source = JSON.parse(row.document_json);
      return Array.isArray(source.pages) && source.pages.some((page) => Array.isArray(page.blocks)
        && page.blocks.some((block) => block?.kind === "image" && block.image_file === file));
    } catch { return false; }
  })) return true;
  return db.prepare("SELECT result FROM media_jobs WHERE seller_id=? AND result IS NOT NULL").all(sellerId)
    .some((row) => { try { return JSON.parse(row.result)?.image_file === file; } catch { return false; } })
    // A running job needs its source for a resumable provider poll; a finished job retains its
    // own result for the explicit later Use action. Never delete either opportunistically.
    || (hasImageAssistantJobs() && Boolean(db.prepare(`SELECT 1 FROM image_assistant_jobs
      WHERE seller_id=? AND (source_file=? OR result_file=?) LIMIT 1`).get(sellerId, file, file)));
}

/** Like sellerImageIsInUse, plus a staged library entry. Use for destructive cleanup after a product/banner changes. */
export function sellerImageIsStored(sellerId, file) {
  return sellerImageIsInUse(sellerId, file) || Boolean(db.prepare("SELECT 1 FROM storefront_photos WHERE seller_id=? AND image_file=?").get(sellerId, file));
}
