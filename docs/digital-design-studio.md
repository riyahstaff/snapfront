# Digital Design Studio

Snapfront's original design collection has **50 editable layouts**: ten mini e-books, ten checklist/worksheet packs, ten content prompt packs, ten quote-print layouts and ten planners. These are Snapfront designs, not a Canva account connection or copied Canva templates. The library includes bold graphic, cinematic dark, calm editorial, soft pastel and precise indexed styles; all content pages prioritize readable text and usable writing space.

## The simple path

**Choose a design.** Open Create and choose Digital designs. Search the pictured collection or pick a format. Tap a design to inspect it; browsing does not create or change a product. Start a private editable draft using sample copy, or ask the existing AI writing tool to draft content using your allowance. The sample words are a starting point, not finished guidance for your buyers.

**Make it yours.** Change the cover title, subtitle and brand. Pick your colors and typeface. Each page keeps its text, lists and pictures as editable source. Tap text in the actual preview to open that field, or use the labeled page/block controls. Upload or reuse your own pictures, add or rearrange pages and undo a recent in-session change. Save the private draft to resume later. A save does not replace the downloadable product file.

**Preview every page.** Snapfront renders the actual chosen layout, not an unrelated illustration. Reading text wraps and flows into additional output pages instead of disappearing off the bottom. Review the title, spelling, pictures, list items and writing spaces. If the preview cannot refresh, the last shown page remains visible but is not accepted as a current export.

**Create and attach the finished file.** Export the saved revision to PDF and a cover image. The export is private and does not publish or change the listing. After reviewing it, choose Attach to this product. For a live product, explicitly confirm that the file for future buyers will be replaced. Previous paid buyers retain their prior file reference; listing prices, plan, checkout and publication status are unchanged.

## Existing products and AI content

New generated products retain their full structured chapters, paragraphs, tips, checklists, hooks, quotes or planner prompts as editable source. Designing that content does not call AI again or consume another generation allowance. Older PDFs made before source retention cannot honestly be recovered as their original editable text. The app explains this and offers a fresh editable rebuild; the original attachment stays in place until you deliberately attach a new export.

## Privacy and reliability

Design source, private exports and image references are scoped to the initiating seller/store and product. A draft saved elsewhere cannot be silently overwritten: conflicting revisions require reload/reconciliation. Store switches invalidate late preview/save/attach UI results. Owned image validation rejects external arbitrary URLs and other sellers' pictures. The catalog thumbnails and font files are included with the app/server so browsing does not depend on live font or image hosting.

## Release boundary

This feature is being prepared on `feature/digital-design-studio-50` for native version **1.1.0**. It requires matching backend routes plus the new native binary. A signed AAB is for Google Play testing, not direct phone installation. Merely having the AAB does not mean these backend changes are deployed or the app is submitted to a Play track. Current verified checks, pull request and build identifiers are recorded separately in the delivery release notes after implementation completes.

## Verified implementation

- Exactly **50 original compositions**, ten per format, with real rendered cover images bundled offline. Bold color-block, cinematic dark, indexed mono, expressive display type, warm serif and calm editorial styles draw on [Canva's 2026 design report](https://www.canva.com/newsroom/news/design-trends-2026/) and [Adobe's 2026 forecast](https://business.adobe.com/blog/adobe-2026-creative-trends-forecast), not copied provider templates.
- The selected actual design appears filled immediately in the editor. Tap cover/body text to select its field, edit, then Update actual preview. Titles wrap as whole words where possible. Cards display the entire cover rather than cropped artwork.
- Source pages and blocks remain editable: text/list items, pictures with contain/cover fit, brand/colors/typeface, add/duplicate/reorder/remove pages and blocks, bounded in-session undo. Destructive page/block operations require confirmation; exiting without Save loses session-only edits.
- Saving is owner/product/revision-bound. Conflicts do not overwrite another saved revision. A current rendered preview and exact saved export are required before Attach. Open private PDF/cover uses expiring HTTPS capability links; expired links can be refreshed by exporting the saved revision again.
- Repeated/concurrent exports reuse the existing unchanged artifact in the single server process. Earlier paid buyers and already-started digital checkouts retain their original file; generic delivery-link updates also preserve buyer references. Shared cover photos survive when another listing/storefront/design still needs them. Account deletion removes private export files and retained download references.
- Bundled fonts support their own Latin/extended character coverage; unsupported glyphs/scripts/emoji produce a clear error instead of missing-character boxes. The original editable source is not removed. This is not a multilingual text-layout engine or full Canva drag-and-drop editor.

### Validation completed

**110 backend tests and 65 native regressions**, TypeScript, Expo lint and SDK dependency compatibility pass. Android/iOS JavaScript bundles export successfully. All 50 definitions render using the shared measured SVG/PDF engine; catalog tests verify count, unique composition, contrast, fonts/licenses and byte-for-byte native/server thumbnail parity.

The actual native library/editor components also pass an isolated phone-size React Native Web walkthrough with real server-renderer SVG/PDF: all 50 bundled images decode, selected design is filled, tap-to-edit selects the correct title, undo restores it, pages add/duplicate/delete, a seller-owned fixture photo inserts, source saves, preview/export succeeds, cancelling final review never attaches, and explicit final review attaches once. External provider/production traffic was blocked. This is **not** a physical-phone camera, WebView or Play Billing test, nor a Google Play submission.
