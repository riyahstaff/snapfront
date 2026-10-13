# Snapfront 105-theme release outcomes

- [x] Leave the original 20 Claude themes unchanged, including definitions, IDs and rendering behavior; do not change any existing seller’s applied theme, products, prices, inventory, plan, Stripe or checkout.
- [x] Implement all 25 approved product-specific visual concepts as editable, responsive storefront code, replacing the rejected color-variation premium set; do not deploy static concept screenshots as websites.
- [x] Create exactly 60 additional original product-specialty themes in the same broad categories, with distinct hero/discovery structures and category-appropriate imagery, producing exactly 105 unique selectable themes.
- [x] Preserve the five-step phone setup: choose look, stage upload/photo and optional still/drift/pan motion, manually enter or optionally suggest editable words, add/review products, preview/apply. Suggestions and preview never apply themselves. Keep original classic-editor functionality.
- [x] Make the 105-theme collection easy to browse on a phone with category/search controls and actual-template thumbnails; demonstrate every new theme in a read-only gallery using labeled illustrative products, never generated imagery as real seller inventory.
- [x] Keep motion only on clipped hero media, with pause/play and reduced-motion fallback. Use actual categories/products for all public shopping controls; do not fabricate vehicle fitment, configurations, size/material filtering or seller claims.
- [x] Validate server syntax/tests, classic parity, all 105 storefront/product/cart renders, preview isolation, asset routing, thumbnail completeness, phone TypeScript/lint and responsive layouts. Fix confirmed defects before push.
- [ ] Push approved changes through the existing GitHub/Railway auto-deployment, verify GitHub Railway status and the live theme API, and report whether 105 themes are confirmed deployed. Do not submit a native app-store release or change Railway infrastructure/billing/access.
- [x] Update seller instructions and release notes; clearly distinguish live backend theme availability from phone UI changes that need a new native release.

## Native theme picker and guided storefront setup
- [x] Users can browse all 105 API-fed themes, including classic and premium designs, using a shared searchable thumbnail picker; search/filter/page changes never select or apply a theme; counts, selected visibility, empty states and retries work on a phone.
- [x] Users can complete Look, Cover, Words, Products and Review; store-specific drafts preserve step and browse state; existing classic themes remain selected; switching stores cannot apply another store's local draft.
- [x] Users can upload a staged cover, recover from cancel/upload failure, keep the current cover, and choose still/drift/pan without modifying the live storefront until Apply.
- [x] Users can generate AI suggestions, insert individual editable fields, or edit manually without an allowance; suggestions never deploy public copy automatically.
- [x] Users can review real products/readiness, preview the private draft, and apply the design in one final action with an explicit completion view and actual store link; products, plan, Stripe and checkout stay unchanged.
- [ ] Deliver validated source via a GitHub pull request; document native-device/build gaps; do not submit an app-store release or mutate production sellers during tests.
