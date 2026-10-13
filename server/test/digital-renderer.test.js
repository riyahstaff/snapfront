import assert from "node:assert/strict";
import test from "node:test";
import { digitalTemplates } from "../src/digital-catalog.js";
import { documentFromGenerated, documentHash, starterDocument, validateDocument } from "../src/digital-document.js";
import { renderDigitalExport, renderDigitalPreview } from "../src/digital-renderer.js";

function source(templateId = "guide-01") {
  return starterDocument(templateId);
}

test("all 50 original templates render their own self-contained cover composition", async () => {
  assert.equal(digitalTemplates.length, 50);
  for (const template of digitalTemplates) {
    const preview = await renderDigitalPreview(source(template.id));
    assert.equal(preview.pages[0].source_page_id, null, template.id);
    assert.equal(preview.pages[0].width, template.format === "quotes" ? 576 : 612);
    assert.match(preview.pages[0].svg, /data:font\/(?:ttf|otf);base64,/);
    assert.match(preview.pages[0].svg, /data-digital-page="cover"/);
    assert.match(preview.pages[0].svg, /data-digital-field="title"/);
    // A template requires at least three cover shapes; each has a visible SVG primitive.
    const primitives = (preview.pages[0].svg.match(/<(?:rect|ellipse|line|path|polygon)\b/g) || []).length;
    assert.ok(primitives >= 3, `${template.id} cover geometry was not rendered`);
  }
});

test("validation is strict, preserves source strings, and hashes deterministically", () => {
  const doc = source();
  const escaped = `A <tag> & "quoted" UTF-8 café — 日本語`;
  doc.pages[0].blocks[1].text = escaped;
  const validated = validateDocument(doc);
  assert.equal(validated.pages[0].blocks[1].text, escaped);
  assert.equal(documentHash(doc), documentHash(JSON.parse(JSON.stringify(doc))));
  assert.throws(() => validateDocument({ ...doc, unexpected: true }), /unsupported field/i);
  assert.throws(() => validateDocument({ ...doc, pages: [{ ...doc.pages[0], id: "bad id" }] }), /letters, numbers, hyphens/i);
  assert.throws(() => validateDocument({ ...doc, palette: { ...doc.palette, paper: "#FFFFFF", ink: "#FEFEFE" } }), /high contrast/i);
  assert.throws(() => validateDocument({ ...doc, pages: [{ ...doc.pages[0], blocks: Array.from({ length: 41 }, (_, i) => ({ id: `b-${i}`, kind: "paragraph", text: "x" })) }] }), /40 blocks/i);
});

test("all five existing generated shapes become editable source without silently dropping malformed list data", () => {
  const common = { title: "Product", tagline: "A useful download" };
  const cases = [
    ["guide", "guide-01", { chapters: [{ heading: "Chapter", paragraphs: ["One paragraph", "Two paragraphs"], tip: "A tip" }] }],
    ["checklist", "checklist-01", { lists: [{ heading: "List", intro: "Introduction", items: ["First", "Second"] }] }],
    ["hooks", "hooks-01", { groups: [{ heading: "Group", items: ["Hook one", "Hook two"] }] }],
    ["quotes", "quotes-01", { quotes: ["Original quote one", "Original quote two"] }],
    ["planner", "planner-01", { goal_areas: ["Work"], weekly_prompts: ["What worked?"], habits: ["Walk"] }],
  ];
  for (const [format, templateId, content] of cases) {
    const doc = documentFromGenerated({ ...common, content }, format, templateId, "Test store");
    assert.equal(doc.format, format);
    assert.ok(doc.pages.length);
    validateDocument(doc);
  }
  assert.throws(() => documentFromGenerated({ ...common, content: { quotes: ["okay", 4] } }, "quotes", "quotes-01", "Store"), /array of text/i);
});

test("long UTF-8 text paginates without truncation and SVG remains escaped and tappable", async () => {
  const doc = source();
  const head = "START café résumé <keep> & ";
  const tail = " END naïve & <tail>";
  const fill = "measured-word ".repeat(Math.floor((12000 - Buffer.byteLength(head) - Buffer.byteLength(tail)) / Buffer.byteLength("measured-word ")));
  const text = head + fill + tail;
  assert.ok(Buffer.byteLength(text) <= 12000);
  doc.pages = [{ id: "long-page", title: "Long reading page", kind: "content", blocks: [{ id: "long-copy", kind: "paragraph", text }] }];
  const preview = await renderDigitalPreview(doc);
  assert.ok(preview.page_count > 2, "cover plus paginated content expected");
  const allSvg = preview.pages.map((page) => page.svg).join("");
  assert.match(allSvg, /START café résumé &lt;keep&gt; &amp;/);
  assert.match(allSvg, /END naïve &amp; &lt;tail&gt;/);
  assert.match(allSvg, /data-digital-page="long-page" data-digital-block="long-copy"/);
  assert.ok(preview.pages.every((page) => Buffer.byteLength(page.svg) <= 2 * 1024 * 1024));

  const exported = await renderDigitalExport(doc);
  assert.ok(Buffer.isBuffer(exported.pdf) && exported.pdf.subarray(0, 5).toString() === "%PDF-");
  assert.ok(Buffer.isBuffer(exported.cover) && exported.cover.subarray(1, 4).toString() === "PNG");
  assert.equal(exported.preview.document_hash, preview.document_hash);
});

test("quote products produce one graphical print per actual quote", async () => {
  const doc = source("quotes-01");
  doc.pages = [{ id: "quotes", title: "Prints", kind: "quote", blocks: [
    { id: "quote-a", kind: "quote", text: "First printable thought" },
    { id: "quote-b", kind: "quote", text: "Second printable thought" },
  ] }];
  const preview = await renderDigitalPreview(doc);
  assert.equal(preview.page_count, 3); // cover plus one page for each actual quote
  assert.match(preview.pages[1].svg, /data-digital-block="quote-a"/);
  assert.match(preview.pages[2].svg, /data-digital-block="quote-b"/);
});

test("unsupported font characters remain in source but fail preview/export clearly instead of becoming missing glyphs", async () => {
  for (const text of ["日本語", "😀", "ع", "क"]) {
    const document = source();
    document.pages[0].blocks[1].text = text;
    assert.equal(validateDocument(document).pages[0].blocks[1].text, text);
    await assert.rejects(() => renderDigitalPreview(document), /cannot display.*source text has not been removed/);
    await assert.rejects(() => renderDigitalExport(document), /cannot display/);
  }
});
