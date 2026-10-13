// Editable digital-design persistence, rendering orchestration, and private export delivery.
// This module deliberately keeps source documents separate from the product's buyer-facing
// attachment: saving a source is never a silent publish or file replacement.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, dirs } from "./config.js";
import { db, newId, rowToProduct } from "./db.js";
import { httpError } from "./claude.js";
import { digitalTemplates, publicDigitalCatalog, templateById } from "./digital-catalog.js";
import { validateDocument, documentFromGenerated, starterDocument, documentHash, ownedDocument } from "./digital-document.js";
import { renderDigitalPreview, renderDigitalExport } from "./digital-renderer.js";
import { createProduct, withPage } from "./store.js";
import { snapshotProductDownloads } from "./commerce.js";

const IMAGE_FILE = /^[\w-]+\.(?:jpg|jpeg|png|webp|gif)$/;
const FILE_NAME = /^[\w-]+\.(?:pdf|png)$/;
const EXPORT_TTL_MS = 60 * 60 * 1000;
const LEGACY_MESSAGE = "This older digital file has no editable source. You can rebuild an editable draft, but the existing buyer download will not be imported or changed until you review and attach a new export.";

const parseDocument = (value) => {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
};

function productFor(seller, productId) {
  const row = db.prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?").get(String(productId || ""), seller.id);
  if (!row) throw httpError(404, "That product doesn't exist.");
  if (row.kind !== "digital") throw httpError(400, "Digital designs are available only for digital products.");
  return row;
}

function designRow(productId) {
  return db.prepare("SELECT * FROM digital_designs WHERE product_id = ?").get(productId) || null;
}

function sign(payload) {
  return crypto.createHmac("sha256", config.downloadSecret).update(payload).digest("base64url");
}

function privateToken(sellerId, exportId, kind, minutes = EXPORT_TTL_MS / 60_000) {
  const payload = Buffer.from(JSON.stringify({ t: "digital-export", s: sellerId, x: exportId, k: kind, e: Date.now() + minutes * 60_000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readPrivateExportToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (parsed?.t !== "digital-export" || !["pdf", "cover"].includes(parsed.k) || typeof parsed.s !== "string" || typeof parsed.x !== "string" || !Number.isFinite(parsed.e) || parsed.e <= Date.now()) return null;
    return parsed;
  } catch { return null; }
}

function privateUrl(sellerId, exportId, kind) {
  return `${config.publicUrl}/digital-design-exports/${privateToken(sellerId, exportId, kind)}`;
}

function exportView(row) {
  if (!row) return null;
  return {
    id: row.id,
    revision: row.revision,
    document_hash: row.document_hash,
    page_count: row.page_count,
    pdf_url: privateUrl(row.seller_id, row.id, "pdf"),
    cover_url: privateUrl(row.seller_id, row.id, "cover"),
    created_at: row.created_at,
  };
}

function compatibleExport(row, document) {
  if (!row || !document) return null;
  const hash = documentHash(document);
  return db.prepare(`SELECT * FROM digital_design_exports
    WHERE product_id = ? AND seller_id = ? AND revision = ? AND document_hash = ?
    ORDER BY created_at DESC, id DESC LIMIT 1`).get(row.product_id, row.seller_id, row.revision, hash) || null;
}

function recordFor(product, row = designRow(product.id)) {
  if (!row || !row.source_available) {
    return { product_id: product.id, source_available: false, document: null, revision: 0, export: null, legacy_message: LEGACY_MESSAGE };
  }
  const document = parseDocument(row.document_json);
  // A malformed historic row is treated honestly as unavailable rather than sent to a renderer.
  if (!document) return { product_id: product.id, source_available: false, document: null, revision: 0, export: null, legacy_message: LEGACY_MESSAGE };
  return {
    product_id: product.id,
    source_available: true,
    document,
    revision: row.revision,
    export: exportView(compatibleExport(row, document)),
    legacy_message: row.legacy_message || null,
  };
}

async function owned(seller, document) {
  // The document module validates all source limits and each seller-owned image reference.
  // Await supports either an agreed synchronous or asynchronous implementation.
  const value = await ownedDocument(seller.id, document);
  return value || document;
}

function resolveLocalImage(sellerId, imageFile) {
  if (!IMAGE_FILE.test(String(imageFile || ""))) return null;
  // ownedDocument has already checked ownership. This second check only constrains disk access.
  const file = path.join(dirs.images, imageFile);
  try { return fs.readFileSync(file); } catch { return null; }
}

function writeExclusive(dir, name, data) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), data, { flag: "wx" });
  return name;
}

function deleteQuiet(dir, file) {
  if (FILE_NAME.test(String(file || "")) || IMAGE_FILE.test(String(file || ""))) fs.rmSync(path.join(dir, file), { force: true });
}

export function catalog() {
  // publicDigitalCatalog is the canonical view. The fallback only preserves a useful response if
  // a deployment has an older catalog worker during a rolling restart.
  return typeof publicDigitalCatalog === "function"
    ? publicDigitalCatalog()
    : { templates: digitalTemplates, formats: ["guide", "checklist", "hooks", "quotes", "planner"].map((id) => ({ id, name: id[0].toUpperCase() + id.slice(1) })), version: 1 };
}

export function getDesign(seller, productId) {
  return recordFor(productFor(seller, productId));
}

/** Make a product/listing and its editable illustrative source. It remains a private draft. */
export async function createDraft(seller, body = {}) {
  const templateId = String(body.template_id || "");
  const template = templateById(templateId); // canonical 400 for an unknown template
  const document = await owned(seller, starterDocument(templateId, {
    title: body.title,
    subtitle: body.subtitle,
    brand: body.brand || seller.store_name,
  }));
  validateDocument(document);
  const product = createProduct(seller, {
    title: document.title,
    tagline: document.subtitle,
    description: "Illustrative editable template content. Review every page and attach a reviewed export before publishing.",
    category: template.format || document.format,
    kind: "digital",
    price: 0,
    alt_text: `Cover of ${document.title}`,
    seo_description: document.subtitle,
  });
  db.prepare(`INSERT INTO digital_designs (product_id, seller_id, source_available, document_json, revision, legacy_message)
    VALUES (?,?,?,?,0,NULL)`).run(product.id, seller.id, 1, JSON.stringify(document));
  return { product, design: getDesign(seller, product.id) };
}

/** Save only source data, atomically comparing the caller's optimistic revision. */
export async function saveDesign(seller, productId, body = {}) {
  const product = productFor(seller, productId);
  const revision = Number(body.revision);
  if (!Number.isInteger(revision) || revision < 0) throw httpError(400, "revision must be a non-negative integer.");
  const document = await owned(seller, body.document);
  validateDocument(document);
  const json = JSON.stringify(document);

  const saved = db.transaction(() => {
    const current = designRow(product.id);
    if (!current) {
      if (!body.rebuild_legacy) throw httpError(409, "This older file has no editable source. Confirm rebuild_legacy to start a new editable draft without changing its current attachment.");
      if (revision !== 0) throw httpError(409, "This design changed before it could be saved. Reload it and try again.");
      try {
        db.prepare(`INSERT INTO digital_designs (product_id, seller_id, source_available, document_json, revision, legacy_message)
          VALUES (?,?,?,?,1,NULL)`).run(product.id, seller.id, 1, json);
      } catch (e) {
        if (String(e?.code || "").startsWith("SQLITE_CONSTRAINT")) throw httpError(409, "This design changed before it could be saved. Reload it and try again.");
        throw e;
      }
      return designRow(product.id);
    }
    const update = db.prepare(`UPDATE digital_designs
      SET source_available=1, document_json=?, revision=revision+1, legacy_message=NULL
      WHERE product_id=? AND seller_id=? AND revision=?`).run(json, product.id, seller.id, revision);
    if (!update.changes) throw httpError(409, "This design changed before it could be saved. Reload it and try again.");
    return designRow(product.id);
  })();
  return recordFor(product, saved);
}

export async function previewDesign(seller, productId, body = {}) {
  productFor(seller, productId);
  const document = await owned(seller, body.document);
  validateDocument(document);
  const preview = await renderDigitalPreview(document, (imageFile) => resolveLocalImage(seller.id, imageFile));
  if (!preview || !Array.isArray(preview.pages) || preview.pages.length > 150 || Number(preview.page_count) > 150) {
    throw httpError(400, "This design would render more than 150 pages. Split it into smaller source pages before previewing.");
  }
  return preview;
}

/** Render an immutable owner-private artifact for the currently saved revision only. */
export async function exportDesign(seller, productId, body = {}) {
  const product = productFor(seller, productId);
  const revision = Number(body.revision);
  if (!Number.isInteger(revision) || revision < 0) throw httpError(400, "revision must be a non-negative integer.");
  const current = designRow(product.id);
  if (!current?.source_available) throw httpError(409, "This older file has no editable source. Rebuild a draft before exporting.");
  if (current.revision !== revision) throw httpError(409, "This design changed before it could be exported. Save or reload it first.");
  const document = parseDocument(current.document_json);
  if (!document) throw httpError(409, "This design source is unavailable. Rebuild it before exporting.");
  await owned(seller, document);
  const hash = documentHash(document);
  const reusable = compatibleExport(current, document);
  if (reusable && fs.existsSync(path.join(dirs.files, reusable.pdf_file)) && fs.existsSync(path.join(dirs.files, reusable.cover_file))) return exportView(reusable);
  const rendered = await renderDigitalExport(document, (imageFile) => resolveLocalImage(seller.id, imageFile));
  if (!rendered?.pdf || !rendered?.cover || !rendered?.preview) throw httpError(502, "The digital renderer did not return a complete export.");
  if (Number(rendered.preview.page_count) > 150 || rendered.preview.pages?.length > 150) throw httpError(400, "This design would render more than 150 pages. Split it into smaller source pages before exporting.");

  // A parallel request may have finished while this one awaited font/image rendering.
  // The following recheck and synchronous write/transaction cannot interleave in this process.
  const winner = compatibleExport(current, document);
  if (winner && fs.existsSync(path.join(dirs.files, winner.pdf_file)) && fs.existsSync(path.join(dirs.files, winner.cover_file))) return exportView(winner);
  const id = newId("dexp");
  const pdfFile = `${id}.pdf`;
  const coverFile = `${id}.png`;
  try {
    writeExclusive(dirs.files, pdfFile, rendered.pdf);
    writeExclusive(dirs.files, coverFile, rendered.cover);
    const exported = db.transaction(() => {
      const fresh = designRow(product.id);
      if (!fresh?.source_available || fresh.revision !== revision || documentHash(parseDocument(fresh.document_json)) !== hash) {
        throw httpError(409, "This design changed while it was exporting. Reload it and export the saved revision again.");
      }
      db.prepare(`INSERT INTO digital_design_exports
        (id, product_id, seller_id, revision, document_hash, page_count, pdf_file, cover_file)
        VALUES (?,?,?,?,?,?,?,?)`).run(id, product.id, seller.id, revision, hash, rendered.preview.page_count, pdfFile, coverFile);
      return db.prepare("SELECT * FROM digital_design_exports WHERE id = ?").get(id);
    })();
    return exportView(exported);
  } catch (e) {
    deleteQuiet(dirs.files, pdfFile);
    deleteQuiet(dirs.files, coverFile);
    throw e;
  }
}

function productCoverFile(exportRow) {
  if (!FILE_NAME.test(String(exportRow.cover_file || ""))) throw httpError(409, "The export cover is unavailable. Export the current design again.");
  const source = path.join(dirs.files, exportRow.cover_file);
  let cover;
  try { cover = fs.readFileSync(source); } catch { throw httpError(409, "The export cover is unavailable. Export the current design again."); }
  const name = exportRow.attached_cover_file || `${newId("dcover")}.png`;
  const target = path.join(dirs.images, name);
  if (!fs.existsSync(target)) writeExclusive(dirs.images, name, cover);
  return name;
}

/** Replace buyer-facing file/cover only after the caller has reviewed a matching export. */
export async function attachExport(seller, productId, body = {}) {
  const product = productFor(seller, productId);
  const revision = Number(body.revision);
  if (!Number.isInteger(revision) || revision < 0 || typeof body.export_id !== "string") throw httpError(400, "export_id and revision are required.");
  const design = designRow(product.id);
  if (!design?.source_available || design.revision !== revision) throw httpError(409, "This export is no longer the saved design revision. Export the current draft again.");
  const document = parseDocument(design.document_json);
  const hash = document && documentHash(document);
  const exported = db.prepare(`SELECT * FROM digital_design_exports
    WHERE id = ? AND product_id = ? AND seller_id = ? AND revision = ? AND document_hash = ?`).get(body.export_id, product.id, seller.id, revision, hash);
  if (!exported) throw httpError(409, "That export is stale, unavailable, or belongs to another store.");
  if (product.status === "live" && body.acknowledge_live !== true) throw httpError(409, "Confirm that this reviewed export will replace the live buyer download.");

  if (design.attached_export_id === exported.id && product.delivery_file === exported.pdf_file && product.image_file === exported.attached_cover_file) {
    return { product: withPage(seller, product), design: recordFor(product, design) };
  }

  const newCover = productCoverFile(exported);
  try {
    const attached = db.transaction(() => {
      const freshDesign = designRow(product.id);
      const freshProduct = productFor(seller, product.id);
      if (!freshDesign?.source_available || freshDesign.revision !== revision || documentHash(parseDocument(freshDesign.document_json)) !== hash) {
        throw httpError(409, "This design changed before the export could be attached. Export the current revision again.");
      }
      const freshExport = db.prepare(`SELECT * FROM digital_design_exports
        WHERE id=? AND product_id=? AND seller_id=? AND revision=? AND document_hash=?`).get(exported.id, product.id, seller.id, revision, hash);
      if (!freshExport) throw httpError(409, "That export is no longer available.");
      // The product can have been published while the caller was reviewing the export.
      if (freshProduct.status === "live" && body.acknowledge_live !== true) {
        throw httpError(409, "Confirm that this reviewed export will replace the live buyer download.");
      }
      // Each existing paid buyer keeps the file/url they purchased before replacement.
      snapshotProductDownloads(freshProduct);
      db.prepare("UPDATE products SET delivery_file=?, delivery_url=NULL, image_file=? WHERE id=?")
        .run(freshExport.pdf_file, newCover, product.id);
      // The generated attachment is a valid seller-owned local image if a later editable source
      // intentionally uses it as an image block or storefront asset.
      db.prepare("INSERT OR IGNORE INTO seller_media (image_file, seller_id) VALUES (?,?)").run(newCover, seller.id);
      db.prepare("UPDATE digital_design_exports SET attached_cover_file=? WHERE id=?").run(newCover, exported.id);
      db.prepare("UPDATE digital_designs SET attached_export_id=? WHERE product_id=?").run(exported.id, product.id);
      return {
        product: db.prepare("SELECT * FROM products WHERE id=?").get(product.id),
        design: designRow(product.id),
      };
    })();
    return { product: withPage(seller, attached.product), design: recordFor(attached.product, attached.design) };
  } catch (e) {
    // A just-created attachment cover is not referenced if the transaction failed.
    if (!exported.attached_cover_file) deleteQuiet(dirs.images, newCover);
    throw e;
  }
}

/** Prepare generated content before a listing/file is created, avoiding orphaned legacy output. */
export async function generatedSourceDocument(seller, generated, type, templateId = null) {
  const id = templateId || `${type}-01`;
  templateById(id);
  const document = await owned(seller, documentFromGenerated(generated, type, id, seller.store_name));
  validateDocument(document);
  return document;
}

/** Called after normal AI generation so the complete structured response remains editable. */
export async function registerGeneratedSource(seller, productId, generated, type, templateId = null, preparedDocument = null) {
  const product = productFor(seller, productId);
  const document = preparedDocument || await generatedSourceDocument(seller, generated, type, templateId);
  const current = designRow(product.id);
  if (current) return recordFor(product, current);
  db.prepare(`INSERT INTO digital_designs (product_id, seller_id, source_available, document_json, revision, legacy_message)
    VALUES (?,?,?,?,0,NULL)`).run(product.id, seller.id, 1, JSON.stringify(document));
  return getDesign(seller, product.id);
}

/** Template-selected AI generation uses the new renderer and attaches only to its draft product. */
export async function renderGeneratedTemplate(seller, productId) {
  const design = getDesign(seller, productId);
  if (!design.source_available) throw httpError(409, "The generated source is unavailable.");
  const exported = await exportDesign(seller, productId, { revision: design.revision });
  return attachExport(seller, productId, { export_id: exported.id, revision: design.revision, acknowledge_live: true });
}

/** Signed expiring export capability. The token is owner-bound and never embedded in public HTML. */
export function privateExportFile(token) {
  const parsed = readPrivateExportToken(token);
  if (!parsed) throw httpError(410, "This private export link has expired. Open the design again to get a new link.");
  const row = db.prepare("SELECT * FROM digital_design_exports WHERE id = ? AND seller_id = ?").get(parsed.x, parsed.s);
  if (!row) throw httpError(404, "That export no longer exists.");
  const file = parsed.k === "pdf" ? row.pdf_file : row.cover_file;
  if (!FILE_NAME.test(String(file || ""))) throw httpError(404, "That export file is unavailable.");
  const disk = path.join(dirs.files, file);
  if (!fs.existsSync(disk)) throw httpError(404, "That export file is unavailable.");
  return { path: disk, kind: parsed.k, name: `${row.id}.${parsed.k === "pdf" ? "pdf" : "png"}` };
}

function fileIsSnapshotted(file) {
  return Boolean(db.prepare("SELECT 1 FROM digital_order_downloads WHERE delivery_file = ? LIMIT 1").get(file));
}

/** Remove unneeded private export artifacts before a product row cascades. Paid snapshots win. */
export function cleanupProductDesign(productId) {
  const exports = db.prepare("SELECT seller_id, pdf_file, cover_file, attached_cover_file FROM digital_design_exports WHERE product_id = ?").all(productId);
  for (const exported of exports) {
    if (exported.pdf_file && !fileIsSnapshotted(exported.pdf_file)) deleteQuiet(dirs.files, exported.pdf_file);
    if (exported.cover_file && !fileIsSnapshotted(exported.cover_file)) deleteQuiet(dirs.files, exported.cover_file);
    // The outgoing product still references this cover. Check surviving references only
    // after its row is deleted, using the shared product/banner/staged/design verifier.
  }
  return [...new Set(exports.map((row) => row.attached_cover_file).filter(Boolean))];
}

/** True when a seller's surviving editable source uses an image; JSON is parsed defensively. */
export function imageReferencedByAnyDesign(sellerId, imageFile, exceptProductId = null) {
  if (!IMAGE_FILE.test(String(imageFile || ""))) return false;
  const rows = db.prepare("SELECT product_id, document_json FROM digital_designs WHERE seller_id = ? AND source_available = 1").all(sellerId);
  return rows.some((row) => row.product_id !== exceptProductId && parseDocument(row.document_json)?.pages
    ?.some((page) => page?.blocks?.some((block) => block?.kind === "image" && block.image_file === imageFile)));
}

export { LEGACY_MESSAGE };
