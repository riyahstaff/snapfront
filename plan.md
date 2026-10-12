# Premium storefront builder

## Scope

Add 25 premium storefront themes alongside the 20 existing themes. Preserve existing theme IDs, store data, products, cart behavior, Stripe checkout, plan gating and domain handling. Work on `feature/premium-storefront-builder`; deliver a pull request, not a production deployment or app-store submission.

The new catalog uses five coordinated layout families: maison (luxury editorial split), luminous (airy floating-product split), cinema (dark product spotlight), gallery (asymmetric design-object composition), and journal (image-first campaign editorial). Each family has five differentiated palettes, font pairs, category recommendations and copy cues. This is one shared rendering system, not 25 independent websites.

## Design

Movement: editorial luxury commerce, combined with restrained product-design gallery aesthetics. Core principles: photography first, deliberate typography, clear buying actions and mobile-first restraint. Warm ivory and oxblood express boutique luxury; pearl and sage express beauty; charcoal and copper express premium hardware. Asymmetric split heroes, sculptural media frames and gallery-like unboxed products differentiate templates from color-only variants.

Typography pairs expressive serif or geometric display families with readable sans-serif body fonts. Wordmarks use theme-specific tracking and hierarchy. Signature elements are oversized product media, small tracked collection labels and elegant rectangular calls to action. Brand essence is a seller-owned boutique with premium art direction; personality: considered, confident, expressive. Copy examples: “Make the ordinary extraordinary.” and “Less noise. More feeling.” These are editable examples, not automatically claimed product facts.

Motion is optional: still, drift (gentle CSS floating/tilt) or pan (slow image zoom). Animate only hero media, never navigation or copy. Include an accessible pause/play button, honor reduced-motion preferences and retain a static image fallback. This does not generate new video, recreate a true 3D object rotation from one photograph, or call RunPod.

## Phone experience

Add an accessible `storefront-setup` screen reachable from Store look and My store. Five stages: 1 choose a premium look with category filters, 2 upload/select a cover photo and choose motion, 3 edit store name and words with optional AI suggestions, 4 add/review products through the existing photo-to-product draft flow, 5 preview and explicitly apply the storefront settings. Save staged local drafts per store so users can resume; apply storefront text/theme/motion together at the final action. Photo upload can be stored immediately, but explain that to existing-store owners if not staged. Prefer staged hero-photo upload that does not change live banner until apply.

AI already suggests product titles, descriptions, bullets and more from product photos. Add `POST /api/storefront/copy` to suggest storefront words from seller notes and their existing products. Return suggestions only; do not persist them until the seller explicitly applies. Reuse existing Anthropic helper and existing photo allowance; clearly label that allowance in UI. Manual text editing works without AI. Do not invent shipping offers, ratings, material claims, certifications or medical claims.

## Shared API contract

New optional seller fields: `hero_title` (max 100), `hero_subtitle` (max 220), `hero_eyebrow` (max 48), `hero_cta` (max 32), `hero_motion` (`still`, `drift`, `pan`, default still). Existing `tagline`, `about`, `announcement` stay intact. Accept blank values to restore theme defaults/fallbacks.

`StoreTheme` gains optional `collection: 'premium' | 'classic'`, `category`, `family`, `motion` and `copy` (eyebrow, collection, cta). Keep `shape.hero` within the existing six values; family-specific body classes add the new presentation. Prefix new theme IDs `p-` to avoid collisions. Premium theme names include Maison Aurel, Lune and Forma; complete set lives in `server/src/premium-themes.js`.

`POST /api/storefront/copy` input: `{ notes?: string, tone?: string, theme?: string, store_name?: string }`; output: `{ hero_title, hero_subtitle, hero_eyebrow, hero_cta, tagline, about, announcement }` with the limits above plus tagline 160, about 600, announcement 90. Auth and hourly AI limit apply, reuse photo allowance. Caller can retain/edit individual suggestions; no automatic save.

Staged photo: `POST /api/storefront/photo` accepts the same imageBase64/mediaType shape as existing banner upload and returns `{ image_file, image_url }`, records ownership in a dedicated table. `PATCH /api/me` can set `banner_file` only to one of this seller's staged files or current banner. Do not allow another store's file. No arbitrary URLs or video uploads.

## Project structure

`server/src/premium-themes.js`: new catalog; `themes.js`: exports and CSS variables/classes; `storefront-css.js` and `render.js`: actual responsive family layouts and hero motion; `storefront-copy.js`: AI suggestions. `db.js`, `store.js`, `index.js`: additive migrations, validation, uploads and API routing. `mobile/src/app/storefront-setup.tsx`: guided flow; `mobile/src/lib/api.ts`: matching types and calls; `mobile/src/lib/storefront-draft.ts`: store-scoped resume helpers; existing Store look/My store provide links. `server/test`: catalog, rendering, API, ownership and backward compatibility coverage. `docs/storefront-setup-guide.md`: seller-facing numbered instructions.

## Delivery boundary

Managed diagnostics cannot bind to this GitHub-only repo (no active Manus project); use Node syntax checks, existing server tests, mobile TypeScript and Expo lint instead. No replacement scaffold or infrastructure migration. Actual native photo-picker behavior needs later device testing; no native release build or live AI calls are required here.

## Implemented refinements

The final builder provides full staged server snapshots via POST /api/storefront/preview rather than a theme-only preview. Temporary private URLs last 30 minutes and never save storefront fields; they show only live products. Unused staged photos can be disposed of through an owner-scoped DELETE endpoint and the phone invokes it on replace/clear. Premium motion is restricted to hero images; existing classic reveal behavior is preserved. Category filters are seven broad groups rather than 25 niche chips.
