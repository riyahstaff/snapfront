import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import sharp from "sharp";
import { digitalTemplates, publicDigitalCatalog, templateById, validateTemplate } from "../src/digital-catalog.js";
import { documentHash, starterDocument, validateDocument } from "../src/digital-document.js";
import { renderDigitalExport, renderDigitalPreview } from "../src/digital-renderer.js";

function premium(id = "guide-01") {
  return starterDocument(id, { design_revision: 2 });
}

async function ownedJpeg() {
  return sharp({ create: { width: 40, height: 60, channels: 3, background: "#aabbcc" } }).jpeg().toBuffer();
}

function firstEmbeddedJpeg(svg) {
  const match = svg.match(/data:image\/jpeg;base64,([^"\s]+)/);
  assert.ok(match, "an embedded JPEG artwork is expected");
  return Buffer.from(match[1], "base64");
}

test("revision-2 catalog is complete, versioned, and retains an immutable revision-1 lookup", () => {
  assert.equal(digitalTemplates.length, 50);
  const catalog = publicDigitalCatalog(2);
  assert.equal(catalog.version, 2);
  assert.equal(catalog.templates.length, 50);
  assert.ok(catalog.templates.every((template) => template.design_revision === 2 && template.preview_url === `/digital-design-assets/v2/${template.id}.png`));
  assert.equal(publicDigitalCatalog(1).templates[0].preview_url, "/digital-design-assets/guide-01.png");
  assert.equal(templateById("guide-01").design_revision, 2);
  assert.equal(templateById("guide-01", 1).design_revision, undefined);
});

test("premium cover gradients, decoded trusted JPEG art, and text export consistently to SVG and PDF", async () => {
  const template = digitalTemplates.find((value) => value.cover.gradient);
  assert.ok(template, "at least one premium gradient template is required");
  const document = premium(template.id);
  document.title = "Premium gradient title";
  const preview = await renderDigitalPreview(document);
  const svg = preview.pages[0].svg;
  assert.match(svg, /<linearGradient\b/);
  const artwork = firstEmbeddedJpeg(svg);
  assert.equal(artwork.subarray(0, 2).toString("hex"), "ffd8", "trusted artwork must have been decoded then embedded as JPEG bytes");
  assert.ok(Buffer.byteLength(svg) < 2 * 1024 * 1024);
  assert.doesNotMatch(svg, /(?:href|xlink:href)="(?:https?:|file:|\/)/i);

  const exported = await renderDigitalExport(document);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-premium-pdf-"));
  try {
    const pdf = path.join(directory, "premium.pdf");
    fs.writeFileSync(pdf, exported.pdf);
    const text = execFileSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
    assert.match(text.replace(/\s+/g, " "), /Premium gradient title/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("legacy omission stays revision-1 and premium artwork can be disabled without hiding an owned primary replacement", async () => {
  const legacy = starterDocument("guide-01");
  const normalizedLegacy = validateDocument(legacy);
  assert.equal(Object.hasOwn(normalizedLegacy, "design_revision"), false);
  assert.equal(Object.hasOwn(normalizedLegacy, "show_artwork"), false);
  assert.equal(documentHash(legacy), documentHash(JSON.parse(JSON.stringify(legacy))));
  const legacyPreview = await renderDigitalPreview(legacy);
  assert.doesNotMatch(legacyPreview.pages[0].svg, /data:image\/jpeg;base64,/);

  const document = premium();
  document.pages[0].blocks.push({ id: "owned-cover", kind: "image", image_file: "owned-cover.jpg", image_fit: "cover" });
  const resolveImage = async (file) => file === "owned-cover.jpg" ? ownedJpeg() : null;
  const withArt = await renderDigitalPreview(document, resolveImage);
  assert.match(withArt.pages[0].svg, /data-digital-block="owned-cover"/);
  assert.ok((withArt.pages[0].svg.match(/data:image\/jpeg;base64,/g) || []).length >= 2, "replacement plus remaining premium art expected");

  document.show_artwork = false;
  const disabled = await renderDigitalPreview(document, resolveImage);
  assert.match(disabled.pages[0].svg, /data-digital-block="owned-cover"/);
  assert.equal((disabled.pages[0].svg.match(/data:image\/jpeg;base64,/g) || []).length, 1, "only the owned replacement remains when decorative art is disabled");
});

test("premium long copy paginates with whole-word wrapping and rejects arbitrary artwork resource references", async () => {
  const document = premium("guide-01");
  const start = "BEGIN premium measured prose ";
  const end = " END premium measured prose";
  const fill = "whole-word typography ".repeat(430);
  document.pages = [{ id: "chapter-01", title: "Measured chapter", kind: "content", blocks: [{ id: "long-copy", kind: "paragraph", text: start + fill + end }] }];
  const preview = await renderDigitalPreview(document);
  assert.ok(preview.page_count > 2, "cover plus multiple reading pages expected");
  const interior = preview.pages.slice(1).map((page) => page.svg).join("");
  assert.match(interior, /BEGIN premium measured prose/);
  assert.match(interior, /typography END/);
  assert.match(interior, /premium measured prose/);
  assert.match(interior, /CHAPTER 01/);
  assert.ok(preview.pages.every((page) => Buffer.byteLength(page.svg) < 2 * 1024 * 1024));

  const unsafe = structuredClone(templateById("guide-01"));
  unsafe.cover.artworks[0].id = "../../not-an-artwork.jpg";
  assert.throws(() => validateTemplate(unsafe), /trusted artwork/i);
  assert.throws(() => validateDocument({ ...document, pages: [{ ...document.pages[0], blocks: [{ id: "bad-image", kind: "image", image_file: "../../etc/passwd.jpg" }] }] }), /stored JPG/i);
});


test("all 50 premium covers visibly retain art, expose owned replacement slots, and keep legacy assets distinct", async () => {
  const { Resvg } = await import("@resvg/resvg-js");
  for (const template of digitalTemplates) {
    assert.ok(template.cover.image, `${template.id} must allow a cover image replacement`);
    const document = premium(template.id);
    const original = await renderDigitalPreview(document);
    document.show_artwork = false;
    const hidden = await renderDigitalPreview(document);
    const pixels = (svg) => new Resvg(svg, { fitTo: { mode: "width", value: 160 } }).render().asPng();
    const [withArt, withoutArt] = await Promise.all([sharp(pixels(original.pages[0].svg)).ensureAlpha().raw().toBuffer(), sharp(pixels(hidden.pages[0].svg)).ensureAlpha().raw().toBuffer()]);
    let changed = 0;
    for (let offset = 0; offset < withArt.length; offset += 4) if (Math.abs(withArt[offset]-withoutArt[offset])+Math.abs(withArt[offset+1]-withoutArt[offset+1])+Math.abs(withArt[offset+2]-withoutArt[offset+2]) > 15) changed++;
    assert.ok(changed / (withArt.length / 4) > 0.015, `${template.id}: artwork must remain visibly present, not hidden under a solid mat`);
  }
});

test("premium cropped optical art cannot bleed into the quote field in the actual PDF", async () => {
  const document = premium("quotes-06");
  const exported = await renderDigitalExport(document);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "snapfront-premium-crop-"));
  try {
    const pdf = path.join(directory, "crop.pdf");
    fs.writeFileSync(pdf, exported.pdf);
    execFileSync("pdftoppm", ["-f", "1", "-singlefile", "-r", "72", "-png", pdf, path.join(directory, "crop")]);
    const pixels = await sharp(path.join(directory, "crop.png")).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { templateById } = await import("../src/digital-catalog.js");
    const template = templateById("quotes-06",2);
    // Bottom-left blank paper is outside art/text; the old un-clipped crop reached this area.
    const x = Math.round(pixels.info.width * 0.06), y = Math.round(pixels.info.height * 0.70);
    const offset = (y * pixels.info.width + x) * pixels.info.channels;
    const expected = template.palette[template.cover.background];
    for(let c=0;c<3;c++) assert.ok(Math.abs(pixels.data[offset+c]-parseInt(expected.slice(1+c*2,3+c*2),16))<12, "cropped art must not paint outside its declared PDF viewport");
  } finally { fs.rmSync(directory,{recursive:true,force:true}); }
});
