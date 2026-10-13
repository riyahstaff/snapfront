# Snapfront Signature Collection — 50 premium editable designs

## What changed

The rejected first collection has been replaced **for new selections and new drafts** with 50 original premium compositions matching the Liquid Chrome app: sculptural chrome, silver silk, optical metal, translucent ice, amethyst glass, emerald architecture, copper orbit and stone/silver materials. These are actual editable document layouts, not decorative pictures over a generic PDF.

The collection contains ten designs in each format:

- E-books and guides.
- Checklists.
- Creator hook/content packs.
- Quote prints.
- Planners.

The designs use varied asymmetrical artwork placements, graphite and platinum panels, restrained gemstone accents, measured display/serif/monospace type, true material artwork, and purposeful matching interior pages. Interior reading and writing areas stay legible and usable.

## Simple seller workflow

1. Open **Create → Browse 50 editable designs**.
2. Search or filter the **Premium collection** and choose the full pictured design.
3. Choose a private starter draft or have AI write the content into the selected design.
4. Tap the preview's text to edit it, or use the normal text/page/color/font controls.
5. Upload an image block or use Digital Photo Studio. The first owned image takes the design's main cover-art slot; quote-print pages also use the reviewed replacement. Toggle **Show original artwork** to hide decorative materials without hiding the seller's own picture.
6. Save, preview, and export. Only the explicit reviewed **Attach** action changes the file supplied to new buyers. Nothing automatically publishes the product.

All copy, page titles, paragraphs, list items, branding, palettes, font choices, source pages and uploaded image blocks remain editable. Decorative material imagery is a reusable image asset—not individually editable 3D geometry. The supplied artwork can be hidden or replaced with an owned image; text is never flattened into that artwork.

## Preview/export fidelity

- The real renderer makes both native SVG previews and PDF output from the same measured source and bundled fonts.
- Every offline mobile thumbnail is regenerated from explicit visual revision 2, with an artwork-presence gate.
- Solid image mats are behind the art; hollow frame marks do not paint over it.
- Decorative rules do not cross cover text boxes.
- Premium PDF image viewports clip cover crops instead of letting scaled art bleed into text.
- All 50 covers have actual owned-image replacement regions, and visible-art raster tests reject art concealed under solid shapes.
- The picker shows whole cover compositions, not cropped title fragments.

## Historic-product compatibility

The old 50 definitions and cover thumbnails are retained as **revision 1**. Existing source documents lacking `design_revision` remain revision 1, with their original normalized source shape/hash and layout. Existing buyer files are not automatically regenerated or replaced.

Only a new draft or explicit style choice selects `design_revision: 2`. New native builds request `/api/digital-designs?revision=2`; unversioned requests from older installed builds retain the old metadata and image bytes. Premium previews use `/digital-design-assets/v2/<id>.png`, avoiding old cached covers paired with new names.

Private export capabilities, current-store ownership, source-revision checks, paid/pending order download snapshots, reviewed attachment, billing, the product camera, storefront editor and silver app branding are unchanged.

## Release boundary

The source identifies the next native release as **1.2.0**. A separate PR contains the redesign; merging, Railway deployment, signed EAS AAB generation and Google Play upload are not performed as part of this redesign request. Deploy the compatible backend and build the new native app together before expecting the premium collection on a phone. The current installed 1.1.1 build intentionally retains its revision-1 catalog.

Review evidence is generated from actual revision-2 source: 50 cover PNGs, 50 matching first interiors, and 50 sample PDFs. Illustrative sample copy is not represented as seller-created inventory. Native-component browser checks use local owner fixtures, not production sellers or real AI calls. A physical Samsung installation remains a release-stage check.

## Reproducible generation

```sh
python3 mobile/scripts/package-premium-artwork.py
node mobile/scripts/package-digital-designs.mjs
DATA_DIR=/tmp/snapfront-premium-review node mobile/scripts/premium-digital-review.mjs /absolute/review-output
npm test --prefix server
npm test --prefix mobile
npm run typecheck --prefix mobile
npm run lint --prefix mobile
```

The optional artwork optimizer needs the original master PNG files used during artwork creation. The checked-in optimized JPEGs are the complete runtime assets; ordinary application builds and cover regeneration do not require the masters or new AI image generation.

## Final validation

The full server suite passed **127 tests** and the final mobile suite passed **81 tests**. The catalog/premium renderer suite passed **11 tests**, including all-50 visible-art raster checks and actual PDF crop verification; the revision API suite also passed. TypeScript, Expo lint and final Android/iOS JavaScript bundle exports passed. No signed 1.2.0 app-store artifact or production deployment was requested.

Upstream main gained the separate web-app and web-billing work during this task. That commit was integrated without overwriting its routing, billing or built web assets. The existing built web client remains a revision-1 client until deliberately rebuilt; its original catalog remains available.
