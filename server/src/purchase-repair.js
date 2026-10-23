// One-time owner-authorized repair. Keep the existing store, listing and URL.
export function repairTaviPurchase(db) {
  return db.transaction(() => {
    db.exec("CREATE TABLE IF NOT EXISTS storefront_data_repairs (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))");
    const key = "tavi-amazon-purchase-2026-10-23";
    if (db.prepare("SELECT 1 FROM storefront_data_repairs WHERE id=?").get(key)) return;
    const rows = db.prepare("SELECT p.id,p.title,p.description FROM products p JOIN sellers s ON s.id=p.seller_id WHERE s.store_slug=?").all("my-snapfront-store-6")
      .filter(p => /tavi\s+and\s+friends/i.test(p.title) && /https:\/\/a\.co\/d\/03F3C84Y(?=$|[\s<>"'.,!?;:)\]}&#])/.test(p.description));
    if (rows.length === 1) db.prepare("UPDATE products SET purchase_method='external',external_url=? WHERE id=?").run("https://a.co/d/03F3C84Y", rows[0].id);
    db.prepare("INSERT INTO storefront_data_repairs (id) VALUES (?)").run(key);
    console.info("[purchase-repair]", rows.length === 1 ? "Tavi book now uses Amazon checkout" : "No unique existing Tavi book; skipped");
  })();
}
