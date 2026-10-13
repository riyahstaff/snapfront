# Snapfront’s 105-theme storefront catalog

## Theme collection

The catalog is designed to contain **105 selectable themes: the original 20 classic themes, the 25 approved category concepts implemented as editable storefronts, and 60 additional product-specialty themes**. The original classic definitions and IDs are unchanged. The rejected set of five palette families has been replaced, not counted as another 25 themes.

Each of the 85 new themes has its own module under `server/src/category-themes/`, with independent hero markup, discovery markup and scoped CSS. `category-theme-kit.js` provides safe text, media, links and metadata primitives, not one common layout. `premium-themes.js` registers the modules. Storefront, product, cart and checkout functionality remain part of the same existing Snapfront app.

The original `storefront-css.js`, classic hero markup, entrance animation and scroll/parallax behavior are preserved. New templates use the separate `category-storefront-css.js`; the new hero copy and photo-motion options apply to these category templates, not a redesign of the classics. Baseline hashes cover 100 original-theme page cases (home, empty home, category, product and cart for all 20) and normalize only the footer year.

Themes cover apparel and accessories, beauty, home goods, electronics and gaming, outdoor and automotive, and lifestyle products. Specific specialties include computers, tires, watches, camping, toys, coffee, fragrances, keyboard hardware, ceramics, garden furniture, surfboards and books. Search and broad-group filters in the phone picker help users find an appropriate look.

## Seller media, words and shopping

Real storefronts use the seller’s uploaded cover and live product photographs. Original generated photographs are used only in explicitly illustrative theme demonstrations and thumbnails. Demo photos never become a seller’s product inventory merely by choosing a theme. A seller can upload photos, enter copy manually, optionally insert suggested wording, and review before applying.

Hero words remain real editable HTML, not a baked-in website screenshot. Optional AI suggestions reuse Snapfront’s existing Anthropic integration and one successful photo-to-page allowance; they do not add a new provider or change plan limits. The endpoint returns suggestions without saving them. Users choose which fields to insert. Theme title/subtitle suggestions are also opt-in and editable.

Theme discovery sections link to actual product categories or products. This release does not invent operational tire fitment, PC configuration, material/color filtering or other category-specific engines without a real data source. Product prices, stock, variants, discounts, domains, orders, Stripe checkout and plan gating keep their existing behavior. No existing seller selection is automatically changed.

Motion choices are **Still**, **Gentle float** (drift) and **Slow pan**. They move the existing clipped hero photograph, not the interface. Pause/play and reduced-motion preferences are enforced across the independent modules. These effects do not generate a video, create a 3D model or reveal unseen sides of an object. No new RunPod or Higgsfield integration is included.

## Phone flow and preview routes

The phone wizard is available from **My store → Build a premium storefront** and **Store look → Open premium setup**. Its five stages are Look, Cover, Words, Products and Review. A device-local, store-specific draft resumes on the same phone. The catalog loads thumbnails efficiently and paginates the wizard’s search results. The original Store look editor remains available.

`GET /api/themes` returns all theme metadata with additive `group`, `preview_url`, `demo_url`, `copy.title` and `copy.subtitle` fields for new themes. Existing six `shape.hero` values remain valid for older API-fed native pickers. New thumbnails come from the actual renderer, not the static design-concept images.

`GET /themes` is a responsive read-only gallery. `GET /theme-demo/:id` and illustrative product/cart routes demonstrate the actual template without creating a seller, product, order or checkout session. These demo pages are noindex; example products and prices are labeled illustrative and cannot be purchased. Assets are served at `/theme-assets/:file`, with path validation and shared-domain routing. Classic entries remain available in the gallery and their real renderer remains unchanged.

## API and persistence

`POST /api/storefront/photo` stages an authenticated seller-owned upload without changing the applied cover. `DELETE /api/storefront/photo/:file` can dispose of an unused owned staged image, but cannot delete an applied cover. Related temporary previews expire when their cover is discarded.

`POST /api/storefront/copy` is authenticated and rate-limited. It counts allowance only after usable output and never persists the suggestion. `POST /api/storefront/preview` validates the same fields as Apply and returns a random private link for a 30-minute server-memory snapshot. `GET /storefront-preview/:token` uses no-store/noindex/no-referrer; anyone with the unguessable link can view it until expiry. Its shopping links lead to the currently applied store.

`PATCH /api/me` accepts bounded hero fields, motion and owned staged-cover references; validation and updates are transactional. Additive SQLite columns are `hero_title`, `hero_subtitle`, `hero_eyebrow`, `hero_cta`, `hero_motion`, plus the `storefront_photos` table. Existing stores default to Still. Blank hero fields preserve existing seller-wording fallbacks. There is no bulk seller-theme migration.

An upload cap of 100 saved covers per store remains. This release does not create a general cover-library manager or scheduled retention policy.

## Deployment and native release

The user authorized the existing GitHub/Railway deployment path. Railway already builds the `server` service from GitHub using its existing configuration and `/health` check. This change does not alter infrastructure, billing, secrets, ownership or account access.

A successful Git push must be followed by checking the Railway GitHub status and the live `/api/themes` count and IDs; until those checks succeed, deployment is not confirmed. The homepage theme count is calculated from the registry, avoiding a disconnected marketing number.

**Backend deployment is not an app-store release.** Older phone builds using the existing API-fed picker can receive the expanded theme catalog. The new thumbnail/search experience and five-step wizard are source changes that need a new native build/release. No native release is submitted by this task. Release the server before any native build that requires the new endpoints.

## Validation

Use a recent Node 22 runtime (22.23.3 was previously compatible with the repository’s pinned native dependencies). Run server tests, phone TypeScript and Expo lint, and responsive browser checks against actual renderer fixtures. The catalog tests require exactly 105 unique IDs, 85 module entries, media assets, classic metadata parity, safe seller copy, empty stores, actual commerce paths and read-only demo isolation.

```sh
cd server
npm ci
npm test
cd ../mobile
npm ci
npm run typecheck
npm run lint
```

Final executed check results and deployment verification are recorded in the release report. Native iOS/Android upload behavior, device-specific resume/accessibility and live Anthropic output still require real-device/release checks; fake-AI tests do not verify the live provider.

For seller-facing steps, see [Storefront setup guide](./storefront-setup-guide.md).
