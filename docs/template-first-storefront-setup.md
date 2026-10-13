# Make a storefront without starting from a blank page

Choose a finished design, then make it yours. Snapfront keeps the selected layout, colors, fonts and picture positions while you change the content. You do not need to be a graphic designer.

## 1. Pick a design

Open **Store look**, browse the pictured themes, and tap **Customize this design**. Or open storefront setup and tap a theme. The photo step opens with the actual responsive layout, not an empty store or a generic summary card.

Pictures, words and product cards marked as examples are there to help you see the design. They are not your inventory. Nothing changes in your public store while you work.

## 2. Swap the photos

Tap a photo in the design, or choose its Main/Detail button. Tap **Take photo** or **Choose photo** to replace it. You can also choose a picture from one of your existing products. The rest of the layout stays in place.

Some designs use one large picture; others have extra picture spots. The editor shows the spots used by the selected layout. Add your main photo, then use **Use main photo in other spots** if you do not have several pictures yet. You can replace each spot with a different photo later.

For AI help, tap **Ask AI to help with this photo**. The existing Photo Studio starts from your actual uploaded/product picture and changes its background. Choose a scene, or describe a background when custom prompts are enabled. Each generation uses one Studio edit from the plan. The app shows the result first; tap **Use this AI photo** only if you like it. Example photos are never sent as if they were your product.

Photo Studio must be configured on the server. When it is unavailable or the allowance is exhausted, ordinary camera/library/product-photo choices still work. An unused AI result is held privately for the app session; it is not restored after restarting the app. It is not applied automatically.

## 3. Change the words

The main form asks only for your shop name, a big headline, and a short introduction. Starter words make the layout visible immediately. Edit them to describe what you actually sell.

Optional controls let you ask AI for writing suggestions or edit the button, small heading, story and top message. AI suggestions are choices, not automatic changes. Manually writing your own text does not use an AI request.

Your changes update the actual design preview. A changed theme keeps text you already wrote, rather than overwriting it with a new example.

## 4. Add products

Tap **Add a product from a photo**. Take or upload a picture, check the generated product details and price, and save the item using the normal product flow. On the product screen, tap **Continue customizing my storefront** to return to your saved design.

The editing preview can show saved draft items so you can judge the layout. Customers only see published products. Adding a product never creates inventory from the theme’s example cards.

## 5. Check and finish

The final preview removes example pictures and example products. It shows the real design content and published items. Review any missing-photo reminders; use **Fix my photos** to return directly to the right step. Read any remaining starter words, change them or explicitly confirm that they describe your shop.

**Finish: save my store design** unlocks after the actual final preview is ready, the pictured spots have real photos, starter words have been reviewed, and the phone draft is saved. This saves the design, photos and reviewed words. It does not change the plan, connect payments, publish products, or turn draft items into items for sale. If the shop still needs published products or payment setup, the final step explains that separately.

Back and progress controls keep the current selection and phone-local draft. Do not uninstall the app or clear its data to update it.

## Release and testing boundaries

This feature requires both the new backend and an updated native app. The installed Build 22 does not acquire new native screens merely because source code changes. The backend adds `/api/storefront/template-preview`, two ordered optional design-photo references, and safe validation; the native build adds the actual-layout editing frame and simpler controls.

If the backend is unavailable, the app identifies the packaged theme image as an example only and offers retry. It does not present a stale static thumbnail as a live edited preview. Finishing remains blocked until the real final preview succeeds.

The implementation is validated with isolated server data and mocked camera, Studio and account APIs. Responsive browser checks use the actual renderer and screen components, but do not prove physical-camera behavior or native Android/iOS WebView behavior. A coordinated backend deployment and a new signed native build/device test are required before a live release. No existing public store, billing setting, social connection or inventory is changed by these tests.

## Verified implementation checks

- 58 native regressions passed; TypeScript and ESLint passed.
- 90 backend regressions passed, including a deterministic render/slot consistency check across all 105 themes, final sample removal, per-store image ownership, ordered-photo gaps/duplicates and media cleanup.
- iOS, Android and browser bundle exports passed. These are compilation checks, not signed app-store binaries.
- The actual native screen components and real server-rendered layouts passed a local-only responsive walkthrough: theme selection, visible-photo tap, photo replacement, three-slot reuse, manual words, unavailable-AI recovery, real fixture-product review, final-word approval, exact final patch, and Classic back/resume.
- A separate empty-new-store check decoded the selected design’s sample image and the uploaded replacement without creating inventory or applying a public store. Browser fixture pictures were downscaled and inlined only for the test transport; production assets and native rendering sources were not replaced.
- Camera hardware, successful live AI generation, native Android/iOS WebView behavior and a signed-device release remain unverified. Tests do not use real seller tokens or publish anything.

### Developer references

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [SDK 57 WebView](https://docs.expo.dev/versions/v57.0.0/sdk/webview/)
- [SDK 57 Image Picker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)

### Dependency review before a production release

Expo’s SDK compatibility check passes after four scoped SDK 57 patch updates. The SDK toolchain still produces npm audit advisory rollups (12 moderate and 18 high affected package entries; no critical entry). Several suggested automated remedies are incompatible major SDK changes, including a downgrade to Expo 44. No force upgrade/downgrade was applied. Review the underlying transitive advisories separately before production release; passing behavior tests and bundle exports is not a security certification. Expo also registered its default sharing plugin during installation; no share-target props, app identity, payment setup or seller permissions were configured.
