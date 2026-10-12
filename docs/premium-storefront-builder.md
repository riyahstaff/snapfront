# Premium storefront builder — implementation notes

## What changed

Snapfront now has **45 storefront looks: the existing 20 plus 25 premium themes**. The premium collection uses five structural layout families, each with five different palettes and type pairs. Maison Aurel is warm ivory/burgundy editorial luxury, Lune is pearl/moss-green beauty, and Forma is dark graphite/copper audio. Seven broad category filters keep the phone picker manageable.

The new phone wizard is available from **My store → Build a premium storefront** and **Store look → Open premium setup**. Its five stages are Look, Cover, Words, Products and Review. A device-local, store-specific draft resumes from the same phone. Photos are uploaded as seller-owned staged assets; text, theme and motion are applied together only through the explicit final action. Existing Store look editing remains available.

Snapfront already writes product listings from photos. The new storefront-copy endpoint adds editable suggestions for the hero, tagline, About and announcement. It reuses the server's existing Anthropic configuration and **one successful photo-to-page allowance**; it does not silently introduce another provider or change plan limits. Sellers choose individual suggestions and can always type manually. No live AI call was made during implementation.

## Themes and motion

The five families are Maison (framed boutique split), Luminous (airy beauty split), Cinema (dark product stage), Gallery (asymmetric object composition), and Journal (campaign editorial). This is a shared, maintainable rendering system, not 25 separate sites.

Motion choices are **Still**, **Drift** and **Pan**. They animate the existing hero photograph only; they do not produce a video, create a 3D model or reveal unseen sides of a product. Premium pages skip the existing scroll-reveal copy animations. Hero playback has a pause/play control and respects the browser's reduced-motion preference. Existing stores default to Still. RunPod and Higgsfield are not integrated by this change.

The final visual quality still depends on the seller's uploaded photographs. A plain product snapshot will not automatically become a studio-rendered product scene merely by choosing a theme. Snapfront's existing photo studio remains separate.

## API and persistence

| Endpoint / field | Behavior |
| --- | --- |
| `GET /api/themes` | Existing metadata plus optional collection, category, family, motion and copy cues. |
| `POST /api/storefront/photo` | Authenticated image upload; returns `image_file` / `image_url` without changing the applied banner. Image signatures and size limits are checked. |
| `DELETE /api/storefront/photo/:file` | Authenticated seller-owned disposal of an unused staged cover. Cannot delete an applied cover. Associated temporary previews expire. |
| `POST /api/storefront/copy` | Authenticated, rate-limited suggestions from seller notes and existing product facts. Counts allowance only after usable output. Does not save seller data. |
| `POST /api/storefront/preview` | Validates the same storefront fields as Apply; returns a random private URL for a 30-minute server-memory snapshot. |
| `GET /storefront-preview/:token` | Renders staged theme, cover, copy and motion plus existing live products. No-store/noindex/no-referrer. Product/store links lead to the applied store. Anyone holding the unguessable link can view it until expiry; it is not an authenticated sharing portal. |
| `PATCH /api/me` | Existing update endpoint; now accepts bounded hero fields, motion and a seller-owned staged banner reference. Validation and updates are transactional. |

The additive SQLite migration adds `hero_title`, `hero_subtitle`, `hero_eyebrow`, `hero_cta`, `hero_motion` and `storefront_photos`. Existing theme IDs, seller data, products, prices, stock, order handling, Stripe checkout, plan gating and domains are preserved. Blank hero fields fall back to existing store wording / theme cues.

The phone clears/replaces unused staged choices through the owner-scoped disposal endpoint. Applied photos are retained. An upload cap of 100 saved covers per store remains as a storage safeguard; there is not yet a general cover-library manager or abandoned-upload retention job. Do not add scheduled cleanup without a separate retention decision.

## Release and verification

Deploy the **server first**, then release the updated phone app. The old app continues to use the existing API. The new phone flow needs the new endpoints, so releasing it before the server would cause setup requests to fail. No production deployment, merge, app-store submission or native release build was performed here.

Use a recent Node 22 runtime (tested **22.23.3**). The sandbox's older Node 22.13.0 segfaulted while constructing a database with the repository's existing `better-sqlite3` 13.0.3 dependency. The compatible Node version resolved that environment issue without changing the project's dependency versions.

Run:

```sh
cd server
npm ci
node --test test/*.test.js
cd ../mobile
npm ci
npm run typecheck
npm run lint
```

Verified results: **68 server tests passed**, phone TypeScript and Expo lint passed, and **50 Chromium layout checks** (25 themes at 1440px and 390px) passed with no horizontal overflow, hero pause/play and reduced-motion behavior.

Tests cover theme catalog and rendering, existing commerce and domains, staged-photo ownership and disposal, bounded/escaped hero words, non-persisting previews, atomic apply and AI suggestion behavior using the existing fake-AI test hook. Browser smoke checks exercise desktop and phone storefront layouts, pause/play and reduced motion. Native iOS/Android picker behavior, real-device SecureStore resume, accessibility on a device, a live Anthropic response and production rollout still need release testing.

For seller-facing instructions, use [Premium storefront setup guide](./storefront-setup-guide.md).
