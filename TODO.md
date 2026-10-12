# Premium storefront builder outcomes

- [x] Add 25 premium themes in five structural families alongside the 20 existing themes, including Maison Aurel, Lune and Forma. All themes render storefront, product and cart pages, retain existing theme IDs and allow non-saving theme previews.
- [x] Add optional still/drift/pan hero motion with pause/play, reduced-motion support, static fallback, and animation confined to media. No RunPod integration, paid video generation or fabricated 3D rotation.
- [x] Add editable storefront AI suggestions using the existing provider and photo allowance, with authentication, rate limiting and no automatic persistence. Product photo-to-text remains available.
- [x] Add safe seller-owned staged photo uploads, additive optional hero fields and validation; preserve products, prices, checkout, plan gating and live stores until apply.
- [x] Add a five-step portrait phone wizard: choose look, upload/select photo and motion, enter/edit/suggest words, add/review products, preview/apply. Store-scoped drafts resume, manual entry works without AI and preview is distinguished from apply.
- [x] Add seller-facing numbered instructions and implementation documentation. Validate server tests, Node syntax, mobile TypeScript and Expo lint; clearly state native device and live AI verification gaps.
- [x] Deliver a reviewable GitHub pull request and guide without merging, deploying or submitting a new app release. PR: https://github.com/riyahstaff/snapfront/pull/1

## Verification

Server: 68 tests passed on Node 22.23.3. Phone: TypeScript and Expo lint passed. Chromium: all 25 premium themes checked at 1440px and 390px (50 layouts), with no horizontal overflow, hero pause/play and reduced-motion behavior verified. Native iOS/Android photo picker, SecureStore resume and live Anthropic output remain release checks.
