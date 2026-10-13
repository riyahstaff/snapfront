# Snapfront: 105 editable storefront themes

## Authorized scope

Keep Claude’s original 20 theme definitions and their rendering behavior unchanged. Replace the rejected 25 palette variants with responsive, genuinely product-specific implementations of the 25 newly approved visual concepts. Create 60 additional product-specific themes in the same broad categories, producing exactly 105 selectable themes (20 classic + 25 approved + 60 new). Push the validated changes to the existing GitHub deployment branch/main so the already-connected Railway service deploys them. Do not move infrastructure, change billing/access, submit an app-store release, or modify existing sellers’ chosen themes, products or checkout.

The user authorized deployment on October 12, 2026. Production currently exposes 20 themes. GitHub main reports a successful Railway status for the existing snapfront-api service; no Railway credential is present, so use the existing GitHub auto-deploy and verify its status and public API rather than changing the hosting configuration.

## Design contract

Each new theme is an independent category-led composition, not one of five shared templates with a changed palette. The approved 25 use their exact reference images as visual guidance. Additional 60 cover different product specialties: fashion and accessories, beauty, home, technology, outdoor/automotive and lifestyle. Each receives its own responsive hero markup, scoped CSS, typography, product imagery, collection treatment and discovery structure. A shared low-level helper provides safe HTML/media primitives and links, not the theme’s layout.

The movement is editorial commerce adapted to the product: campaign/atelier composition for fashion; precise architectural product staging for hardware; tactile room/ritual narratives for home and beauty; equipment-led landscapes for outdoor; expressive play and cultural worlds for games, toys and books. Core principles: recognizable products, distinct composition, legible selling actions and real inventory. Palette and typography belong to each category’s world. Wordmarks use the seller’s actual store name in theme-specific treatment. Copy should be concise and suggestive, never fabricate seller facts. Example voice: “Objects for the days that linger.” / “Build your own listening room.”

All copy stays real HTML. Generated hero photography is demonstration imagery only, not a baked-in screenshot of a website, and never becomes a seller’s inventory. Public stores use the seller’s uploaded cover and/or actual live product photos; blank stores retain usable empty states. Theme thumbnails and demonstration routes are explicitly labeled illustrative. Product prices, stock, discounts, shipping and checkout derive from existing data. Discovery controls must use actual categories/products; do not show fake fitment/configurator/material/size controls without a corresponding real data source.

Motion remains optional still/drift/pan, confined to clipped hero media with pause/play and reduced-motion support. No paid video generation, RunPod calls or simulated new product views. Navigation, text and buying controls remain stationary.

## Architecture

- `server/src/category-themes/<key>.js`: one module per new theme; exports theme metadata, responsive hero renderer, discovery renderer and scoped CSS.
- `server/src/category-theme-kit.js`: safe low-level rendering context, common accessible media/motion primitives and metadata constructor; no category layout decisions.
- `server/src/premium-themes.js`: registry for 85 new modules, replacing only the rejected premium collection.
- `server/src/themes.js`: preserve original entries; expose additional preview/category metadata additively and include registry.
- `server/src/render.js`: delegate new theme heroes/discovery through registry, retaining classic paths and existing commerce pages.
- `server/assets/themes`: optimized generated demo heroes and actual-renderer thumbnails, served from the existing server with shared-path handling for store/custom domains.
- Server demo gallery and preview routes: read-only fixtures, no seller creation or payment actions; render the actual templates rather than static UI concept images.
- `mobile/src/app/looks.tsx`, `storefront-setup.tsx`, `mobile/src/lib/api.ts`: searchable category/theme catalog with real preview thumbnails and five-step phone flow. Avoid loading 85 large images at once; keep existing upload/copy/apply behavior.
- `server/test`: exact 105 unique selectable themes; classic-definition parity; all storefront/product/cart paths; asset/API/demo isolation; safe content; media motion and empty states.
- `docs`: updated seller instructions and deployment/mobile-release caveats.

## Implementation orchestration

A single workflow handles 85 independent category modules: 25 reference implementations and 60 original directions. One dedicated worker per theme with a deterministic output path. Each produces its own implementation and planned hero photography; failures are reported, not counted as complete. The parent integrates and validates the registry, app browsing, routes and deployment. No Git operations or production access in workers. Large-workflow confirmation is handled by the dedicated approval gate.

## Toolchain and delivery

This is an existing GitHub-only Expo/Node project, not a Manus-hosted scaffold. Managed post-edit diagnostics return “No active project”; use explicit Node syntax checks, the existing server tests, Expo TypeScript and lint. Node 22.23.3 is available and previously passed the native SQLite tests. Expo SDK 57 documentation was read before phone changes. Railway deploys `server` with Railpack, npm start and `/health`; preserve this configuration.

Deliver only what is verified. A successful push is not a successful deploy: check GitHub Railway status and public `/api/themes` count/IDs. Existing shipped native builds may require an app update for new browsing/wizard UI, although their existing API-fed theme picker can receive all catalog entries immediately. Do not claim a mobile release was submitted.

## Native catalog and setup update — October 12, 2026

Update the existing GitHub Expo app in place; do not create a replacement managed app or change its backend, Expo project ID, native identifiers, billing, or hosting. Ship source changes as a reviewable GitHub pull request, not an app-store submission. The current user request authorizes implementation of the native UI, not publishing a particular seller's storefront during testing.

Both Store look and the five-step wizard will reuse a searchable thumbnail picker covering all 105 API-fed themes, including the 20 classic designs. Keep counts dynamic, add Classic/Premium and broad-category filters, normalize multi-word searches across name/category/product/vibe/family, and mount at most 12 catalog cards per page. Preserve the existing editorial mobile design: Bricolage Grotesque headings, Figtree controls, electric-blue selected states, rounded thumbnail cards, clear radio/check states, compact category chips, and explicit demo labels. Search/filter/page changes never change the selection or applied store.

The wizard keeps Look → Cover → Words → Products → Review. Persist browse state and the furthest reached step in store-specific drafts; preserve an existing classic theme rather than replacing it with a premium theme. Review and Apply use one shared payload. Keep photo staging, per-field optional AI insertions, manual editing without allowances, and product publishing separate. Fix draft writes outside React state updater side effects, await writes before leaving for products, recover safely after store switching, and show a durable completion view with the actual storefront link after a successful apply. Display readiness for live products, plan eligibility, and Stripe without changing these settings or implying that Apply publishes products. Save/preview/error states must accurately report success or failure.

Modules: `mobile/src/lib/theme-catalog.ts` owns search/filter/pagination; `mobile/src/components/theme-picker.tsx` owns accessible thumbnail controls; `mobile/src/lib/storefront-setup.ts` owns draft reconciliation, review payload and readiness; existing screen and persistence files integrate them. Tests use Node's runner with TypeScript transpilation and mocked native storage so no production seller or AI allowance is touched. Existing managed diagnostics are unavailable for this GitHub-only checkout; use TypeScript, Expo lint, native bundle export and the isolated server suite.

SDK references checked before native API edits: https://docs.expo.dev/versions/v57.0.0/ , https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/ , https://docs.expo.dev/versions/v57.0.0/sdk/image/ , https://docs.expo.dev/versions/v57.0.0/sdk/router.md .
