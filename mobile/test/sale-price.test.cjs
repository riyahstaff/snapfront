// The optional original price: parsed like the price, previewed honestly, and refused when it
// isn't higher than the price.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
function helpers() {
  const out = ts.transpileModule(fs.readFileSync(path.join(root, "src/lib/sale-price.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", out)(module, module.exports);
  return module.exports;
}
const { parseMoney, savePercent, salePreview } = helpers();

test("money is read the way sellers type it", () => {
  assert.equal(parseMoney("20"), 20);
  assert.equal(parseMoney("$1,250.5"), 1250.5);
  assert.equal(parseMoney(" "), null);
  assert.ok(Number.isNaN(parseMoney("twenty")));
  assert.ok(Number.isNaN(parseMoney("1.999")));
});

test("the saving is rounded down so it never overstates", () => {
  assert.equal(savePercent(12, 20), 40);
  assert.equal(savePercent(12.5, 20), 37);
  assert.equal(savePercent(19.95, 20), 0);
  assert.equal(savePercent(20, 20), 0);
});

test("the preview shows the sale, or says what to fix", () => {
  assert.equal(salePreview("12", ""), null, "blank means no original price");
  assert.deepEqual(salePreview("12", "20"), { ok: true, text: "Shows $20.00 crossed out, with “Save 40%”." });
  assert.equal(salePreview("19.95", "20").text, "Shows $20.00 crossed out.");
  assert.equal(salePreview("20", "15").ok, false);
  assert.match(salePreview("20", "15").text, /higher than the price/);
  assert.equal(salePreview("12", "abc").ok, false);
  assert.equal(salePreview("", "20").text, "Enter the price first.");
});

test("the product screen saves the original price with the price and explains it", () => {
  const src = fs.readFileSync(path.join(root, "src/app/product/[id].tsx"), "utf8");
  assert.match(src, /label="Original price \(optional\)"/);
  assert.match(src, /compare_at: original === null \? null : original/);
  assert.match(src, /hint="Shown crossed out next to the price, for a sale\. Leave it blank for none\."/);
});
