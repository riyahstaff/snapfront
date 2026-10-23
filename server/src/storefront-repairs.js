/** Owner-requested data repair. The supplied book URL identifies the store without
 * guessing a slug. Refuse ambiguous matches and never overwrite a chosen name. */
export function repairTaviStorefront(db) {
  const correct = "https://a.co/d/03F3C84Y";
  const typo = "https://a.co/d/O3F3C84Y";
  const containsBookLink = (text) => /https:\/\/a\.co\/d\/[0O]3F3C84Y(?=$|[\s<>"'.,!?;:)\]}&#])/u.test(String(text));
  return db.transaction(() => {
    db.exec("CREATE TABLE IF NOT EXISTS storefront_data_repairs (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))");
    const key = "tavi-store-name-2026-10-23";
    if (db.prepare("SELECT 1 FROM storefront_data_repairs WHERE id=?").get(key)) return { status: "already_applied" };
    // This is a repair of existing data, never a rule for stores created in the future.
    const finish = (result) => { db.prepare("INSERT INTO storefront_data_repairs (id) VALUES (?)").run(key); return result; };
    const products = db.prepare("SELECT id, seller_id, description FROM products WHERE instr(description, ?) > 0 OR instr(description, ?) > 0").all(correct, typo).filter((p) => containsBookLink(p.description));
    const sellerIds = [...new Set(products.map((p) => p.seller_id))];
    if (sellerIds.length !== 1) return finish({ status: sellerIds.length ? "ambiguous" : "not_found" });
    const seller = db.prepare("SELECT id, store_name, store_slug FROM sellers WHERE id=?").get(sellerIds[0]);
    const name = seller.store_name.trim();
    if (!/^(?:my snapfront store)?$/i.test(name) && name.toLowerCase() !== "tavi and friends") return finish({ status: "name_needs_review", store_slug: seller.store_slug });
    db.prepare("UPDATE sellers SET store_name=? WHERE id=?").run("Tavi and Friends", seller.id);
    for (const product of products) {
      const description = product.description.replace(/https:\/\/a\.co\/d\/O3F3C84Y(?=$|[\s<>"'.,!?;:)\]}&#])/gu, correct);
      if (description !== product.description) db.prepare("UPDATE products SET description=? WHERE id=? AND seller_id=?").run(description, product.id, seller.id);
    }
    return finish({ status: "repaired", store_slug: seller.store_slug });
  })();
}
