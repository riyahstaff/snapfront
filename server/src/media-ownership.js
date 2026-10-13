import { db } from "./db.js";

/** Private source ownership is established by authenticated uploads, listings or recorded AI jobs—not a public filename. */
export function ownsSellerImage(sellerId, file) {
  if (!sellerId || !/^[\w-]+\.(jpg|jpeg|png|webp|gif)$/.test(String(file || ""))) return false;
  if (db.prepare(`SELECT 1 FROM seller_media WHERE seller_id=? AND image_file=?
    UNION SELECT 1 FROM products WHERE seller_id=? AND image_file=?
    UNION SELECT 1 FROM storefront_photos WHERE seller_id=? AND image_file=?
    UNION SELECT 1 FROM sellers WHERE id=? AND banner_file=? LIMIT 1`)
    .get(sellerId, file, sellerId, file, sellerId, file, sellerId, file)) return true;
  // AI results created before this release have durable seller ownership in media_jobs.
  return db.prepare("SELECT result FROM media_jobs WHERE seller_id=? AND status='done' AND result IS NOT NULL").all(sellerId)
    .some((row) => { try { return JSON.parse(row.result)?.image_file === file; } catch { return false; } });
}
