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
- [x] Deliver validated source via a GitHub pull request; document native-device/build gaps; do not submit an app-store release or mutate production sellers during tests.

## Liquid Chrome native facelift with Noir Atelier logo
- [x] The app uses the approved Liquid Chrome graphite/platinum frontend with Noir Atelier’s copper aperture/doorway logo, replacing the blue-square/yellow-dot brand throughout home, navigation, onboarding, launcher, adaptive icon, splash and favicon; existing app/Expo identifiers and permissions remain unchanged.
- [x] Home presents real tappable setup/resume actions, API-fed theme discovery and one-tap photo/AI/sourcing/order access; retain every existing Find, Assistant, Create, My store, Trends and secondary feature; no fake inventory, revenue or storefront selections.
- [x] Opening motion is real native decorative motion, does not delay interaction, has pause/resume, respects Reduce Motion on initial load and changes, and stops on blur/background/unmount; operational text and controls stay stationary.
- [x] Photo-to-product creation and wizard/draft add-photo exits still work through a dedicated /snap route without changing upload/generation/publishing behavior; store-specific drafts and catalog selections remain isolated.
- [x] Shared controls and screens have readable contrast, finger-sized touch targets, large-text/phone-friendly layout and consistent chrome surfaces; deliver source as a validated branch/archive and separate reviewable GitHub PR after recovered authorization, not a merged/released build, with clear signed-build/device testing boundaries.

## Silver chrome logo finish revision
- [x] Preserve the approved aperture/doorway symbol, recolor its material to brushed silver/platinum matching the Home gateway, and use it consistently in launcher/adaptive/themed/splash/favicon/in-app mark assets; preserve the graphite background, platform safe areas, interface, motion and app behavior; deliver a verified icon and updated local source without publishing a native release.

## Photo-first Home and Meta publishing
- [x] New users get Snap a product as the first prominent Home action; returning users keep Continue my storefront and actual saved-step restoration; photo, AI listing, theme setup and all existing routes remain usable and store-isolated.
- [x] Real theme thumbnails auto-carousel with swipe, previous/next and Pause/Play; no automatic theme selection/application; unknown/Reduce Motion/screen-reader, offscreen, route/background and unmount states stop automatic movement.
- [x] Sellers can authorize Facebook Pages and linked professional Instagram accounts through secure Meta OAuth, select exact destinations and disconnect/reconnect; encrypted per-store tokens/state and privacy callbacks prevent cross-store leakage; missing configuration is visible and never reported connected.
- [x] Marketing keeps manual generation/Save/Share/TikTok and adds Facebook wording, reviewed Publish now/Schedule to selected Meta destinations, exact scheduling-time feedback, idempotent frozen caption/owned-media snapshots, status/history and cancel/safe retry; generated drafts never auto-publish without the seller's approval.
- [x] Durable server-owned jobs survive restart, handle partial destination success, processing/rate delays and expired tokens safely, and do not blindly retry ambiguous public publishing; isolated mocked tests never publish or consume production allowances.
- [x] Deliver a validated separate GitHub PR and setup/release guidance; preserve Google Play/Stripe billing and native IDs; do not merge, submit app-store builds, activate live social posting or change account permissions during tests.
- [ ] Activate live Meta OAuth/publishing only after the owner configures the developer app/secrets/approved permissions and the updated backend/native app are deployed; report real-account verification as pending until performed.

## Native release identification and reliable theme images
- [x] Home and Settings visibly identify native version/build and Liquid Chrome release so users can distinguish the installed release without clearing local drafts; correction uses display version 1.0.1 and existing app/signing identity.
- [x] All 105 actual storefront thumbnail images (20 classic, 85 premium) are packaged locally and render without remote-image access in picker, wizard and carousel; future remote looks retain HTTPS support and explicit retry/error feedback; classic definitions and selection/application behavior stay intact.
- [x] Public theme discovery is independent of seller bootstrap; photo-first and returning-store behavior remains unchanged.
- [ ] Validate tests, types/lint, native bundle and actual AAB content/assets; deliver focused PR and verified signed AAB, with Play rollout/installed-device verification distinguished from artifact completion; no app-store submission, account deletion or signing changes during tests.

## Template-first, beginner-friendly storefront setup
- [x] Choosing any theme keeps its actual responsive design visible with clearly labeled sample pictures/words/product examples until replaced; show the same layout changing as users replace photos and text, never a blank canvas or a generic summary mislabeled as the chosen theme.
- [x] Five simple steps explain exactly what to tap and what changes: Pick a design, Swap photos, Change words, Add products, Check and finish; plain language, one clear next action, progress, back/resume, sensible editable starter copy and preserved manual edits/store-specific ownership.
- [x] Users can tap photo spots and upload/take/reuse real photos or ask the configured AI photo studio to create a background using their real product; preview AI results before insertion, explain source/allowance/provider requirements, recover from permission/cancel/provider/upload/save failure, and fill remaining spots with their own photo easily; ordered main/extra photos persist in the chosen real template only after explicit finish.
- [x] Starter words are editable and reviewed before final use, optional AI text remains reviewed, and actual products replace illustrative example cards through the normal photo/product flow without fake inventory or automatic publishing; the final preview removes samples, highlights missing content with Fix actions, and explains design saving versus products/plan/payments/orders.
- [x] Validate isolated renderer/ownership/sample-isolation/cleanup and native draft/preview/navigation regressions, types/lint and platform exports; deliver reviewable source and clear backend/native activation boundaries; preserve current frontend, photo-first behavior, billing, native/signing identity and existing seller data, with no production mutation, merge, live AI call or Play submission during testing.

## 50 original editable digital-product designs
- [x] Deliver exactly 50 original pictured designs, ten for each existing generated digital format, with distinct 2026-appropriate compositions, readable typography, palettes and motifs; all editable text/images remain source data and no Canva/template assets are copied.
- [x] Sellers choose a filled design, edit their generated or manually written text/pages/list items, upload/reuse owned pictures, change colors/fonts, reorder/add/duplicate/remove pages, undo in-session and save a resumable owner-bound private draft; no blank-canvas prerequisite, lost generated content or hidden paid AI call.
- [x] Generated digital products retain all editable source content; older files without source are explained honestly and never treated as recovered PDF contents; digital creation/product routes lead to the designer while the existing photo/storefront/marketing/billing paths remain unchanged.
- [x] Real page previews and PDF/PNG-cover exports use the same measured, paginated layout and bundled fonts/images; all 50 previews load locally, long text is preserved without clipping, errors/conflicts/late responses stay bound to their initiating store/product.
- [x] Export and Attach are separate reviewed actions; private export/draft saves never replace buyer files or publish products; attaching validates current draft/export ownership and explicit live-file replacement acknowledgement, retains previous paid-order delivery, and preserves prices/plans/Stripe/Play billing.
- [x] Validate native/server regressions, types/lint, exact 50 assets/renderers, ownership/safety/fidelity and platform bundles; deliver reviewable source and verified next signed AAB with backend deployment and physical-device gaps explicit; no Play submission, production test mutations or silent merge/deploy.

## Separated image studios and reliable storefront Refresh
- [x] Refresh fetches a fresh preview, visibly reloads the frame/images even for identical HTML, reports timeout/render errors and completion, and works without paid allowances while retaining safe drafts.
- [x] Storefront Photo Agent accepts complete seller prompts and real photo/decorative inputs, keeps original/candidate previews, persists owner-bound jobs, and inserts only explicitly chosen results into the correct local photo slot.
- [x] Digital Photo Studio provides original prompted artwork/refinement plus polished true-cover mockups, preserves editable words/pages/PDF and supports reviewed page-image/listing-image use with current-store guards.
- [x] Keep provider availability, allowance exhaustion and test-account access distinct; no silent account upgrade, cross-store result, purchase, fabricated inventory, duplicate charge or automatic public apply.
- [x] Validate isolated server/native/UI regressions and Android/iOS bundles; deliver reviewable source and visual evidence with PR #7 dependency, backend/native activation and tester-identity gaps explicit.
