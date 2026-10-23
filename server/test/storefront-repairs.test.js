import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { repairTaviStorefront } from "../src/storefront-repairs.js";

function fixture() {
  const db = new Database(":memory:");
  db.exec("CREATE TABLE sellers (id TEXT PRIMARY KEY, store_name TEXT, store_slug TEXT); CREATE TABLE products (id TEXT PRIMARY KEY, seller_id TEXT, description TEXT)");
  db.prepare("INSERT INTO sellers VALUES (?,?,?)").run("tavi", "My Snapfront Store", "original-store-address");
  db.prepare("INSERT INTO sellers VALUES (?,?,?)").run("other", "Other store", "other");
  return db;
}

test("repair uses the exact book URL, keeps the address, corrects the typo, and only runs once", () => {
  const db = fixture();
  try {
    db.prepare("INSERT INTO products VALUES (?,?,?)").run("book", "tavi", "Coloring book: https://a.co/d/O3F3C84Y.");
    assert.deepEqual(repairTaviStorefront(db), { status: "repaired", store_slug: "original-store-address" });
    assert.equal(db.prepare("SELECT store_name FROM sellers WHERE id='tavi'").get().store_name, "Tavi and Friends");
    assert.equal(db.prepare("SELECT description FROM products WHERE id='book'").get().description, "Coloring book: https://a.co/d/03F3C84Y.");
    assert.equal(db.prepare("SELECT store_name FROM sellers WHERE id='other'").get().store_name, "Other store");
    db.prepare("UPDATE sellers SET store_name='New chosen name' WHERE id='tavi'").run();
    assert.equal(repairTaviStorefront(db).status, "already_applied");
    assert.equal(db.prepare("SELECT store_name FROM sellers WHERE id='tavi'").get().store_name, "New chosen name");
  } finally { db.close(); }
});

test("the corrected URL also identifies the default-named store", () => {
  const db = fixture();
  try {
    db.prepare("INSERT INTO products VALUES (?,?,?)").run("book", "tavi", "https://a.co/d/03F3C84Y");
    assert.equal(repairTaviStorefront(db).status, "repaired");
  } finally { db.close(); }
});

test("missing, ambiguous, longer URLs and a different chosen name never get renamed", () => {
  for (const scenario of ["missing", "ambiguous", "longer", "named"]) {
    const db = fixture();
    try {
      if (scenario !== "missing") db.prepare("INSERT INTO products VALUES (?,?,?)").run("book", "tavi", `https://a.co/d/03F3C84Y${scenario === "longer" ? "other-book" : ""}`);
      if (scenario === "ambiguous") db.prepare("INSERT INTO products VALUES (?,?,?)").run("otherbook", "other", "https://a.co/d/03F3C84Y");
      if (scenario === "named") db.prepare("UPDATE sellers SET store_name='Chosen name' WHERE id='tavi'").run();
      const before = db.prepare("SELECT * FROM sellers").all();
      assert.notEqual(repairTaviStorefront(db).status, "repaired");
      assert.deepEqual(db.prepare("SELECT * FROM sellers").all(), before);
    } finally { db.close(); }
  }
});
