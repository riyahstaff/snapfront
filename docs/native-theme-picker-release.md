# Native theme picker and guided setup update

## What changed

- Store look and storefront setup share a searchable, accessible thumbnail picker for the complete API catalog: 105 themes (20 classic, 85 premium), with dynamic counts, Classic/Premium/category filters, accent- and punctuation-insensitive multi-word search, 12 cards per page, empty/error/retry states and a Show selected action.
- The wizard now includes classic looks without replacing an existing classic selection. Browse state, current step and furthest visited step are persisted per store; visited steps are directly reachable. New steps start at the top.
- Cover uploads remain staged until final Apply. Replaced staged references are cleaned up only after their replacement is saved. Late uploads are bound to the initiating store and merge into its saved draft.
- AI copy remains optional, separately reviewable and individually insertable. Completed suggestions are retained for the original store rather than lost after a store switch. Classic fields match their unchanged renderer; premium-only headline/eyebrow/CTA/motion controls are clearly scoped.
- Product rows now open review through the awaited save-and-navigate path. The product list refreshes on return. Product publishing remains separate.
- Review uses one payload for private preview and Apply, reports live/draft inventory and plan/Stripe readiness, and shows an explicit completion screen with the actual store URL after Apply. Draft cleanup failure is distinguished from deployment failure.
- Store selection revisions and request generations prevent older loads and apply responses from reverting the active account. Storefront mutations carry their initiating X-Store explicitly.

## Verification

- `cd mobile && npm test`: **21 passing tests** exercising the actual TypeScript modules with mocked SecureStore and fetch: full 105-theme registry coverage, all pages, search/filter intersection, no selection mutation, classic preservation, retired-theme reconciliation, v1 draft compatibility, queued write/clear/read ordering, storage failures, store isolation, preview/apply parity, readiness, retained suggestions, late uploads, X-Store binding, overlapping refreshes and store-switch responses.
- `cd mobile && npm run typecheck`: passed.
- `cd mobile && npm run lint`: passed without warnings.
- `cd server && npm test`: **74 passing tests** with isolated temporary databases, including theme/classic parity, all-theme rendering, staged-photo ownership, preview isolation and AI allowance behavior. No server source changes in this update.
- Expo SDK 57 iOS and Android exports: passed; both generate Hermes bundles. These verify bundling, not signed native packages or physical-device behavior.
- `git diff --check`: passed.
- Read-only live `/api/themes` check: **105 unique themes**, including **85 premium thumbnails**; classic looks use the existing native mini-store renderer. No seller was created and no production storefront, product, plan or AI allowance was changed during verification.

The environment's Node 22.13.0 caused the existing better-sqlite3 tests to crash before edits. Node 22.23.3, consistent with the previous repository validation, passes all 74 tests. No production runtime configuration was changed.

## Release boundary

The update is source-ready for review and native builds, not an app-store release. The existing Expo project ID, application identifiers, package versions, permission configuration, backend hosting, billing and checkout remain unchanged. No EAS signed build, OTA update, Google Play submission or App Store submission was performed.

Physical-device verification is still required for library picker/cancel behavior, staged upload on intermittent connections, navigation/resume while switching stores, screen-reader/large-text layout, and native browser return. Seller setup instructions are in [the updated guide](storefront-setup-guide.md).
