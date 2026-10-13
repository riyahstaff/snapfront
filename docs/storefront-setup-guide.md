# Storefront setup in the Snapfront app

Open **My store → Build your storefront** (or **Store look → Open guided setup**) to choose a design, upload a cover, write your store’s story, review products, and apply the design together. This updates the current store’s presentation; it does not create another store, change products or prices, upgrade a plan, or connect Stripe.

## 1. Look — browse all themes

The picker includes the full **105-theme catalog: 20 classic and 85 premium themes**, when returned by the connected backend. Counts always reflect the catalog actually available.

- Search by theme name, product type, category, family or mood. Multiple words can appear in any order; search ignores capitalization, punctuation and accents.
- Use **All**, **Classic** or **Premium**, then narrow by available collection categories.
- Compare thumbnail cards, **12 per page**. Smaller screens and larger text use a single column. Premium thumbnails are rendered illustrative templates marked **Demo imagery**. Classic thumbnails retain their original mini-store drawings, optionally using your own live-product photo.
- Tap a card to select it locally. Search, filter and page changes never select or apply another theme. **Show selected theme** brings your current choice back into view.
- An existing classic look remains selected when you enter setup. If a previously saved look was removed from the catalog, the app preserves your staged photo and wording and explains the replacement.

## 2. Cover — upload your photo

Tap **Choose photo** to open the system photo library. Select one product or lifestyle photo; wide photos usually crop best. The image uploads as a seller-owned **staged** cover and does not replace your live cover yet. Canceling the picker or an upload failure leaves your current choice intact.

**Use current** removes the new staged choice from the setup draft, not your applied cover. An unused replaced staged cover is discarded only after the replacement draft is saved. If there is no cover, your newest live-product photo can supply the fallback. Draft products are not used on the public storefront.

Premium themes support **Still**, **Drift** and **Pan** image effects. These are not generated videos, 3D models or new product views. Classic themes retain their original image behavior.

## 3. Words — write or request suggestions

Write your store name, tagline, About text and announcement directly. Premium looks additionally support a hero headline, subheadline, eyebrow and button label. Classic looks use the tagline as the headline and About text as the supporting story; their original rendering is unchanged.

Theme wording ideas and **Get AI suggestions** are optional. Add factual notes about your products or add a product first, then choose a writing tone. Each successful AI request consumes **one photo-to-page allowance**; the app displays the allowance usage. Manual editing needs no AI allowance.

Review results, then use each individual **Use** button to copy only the fields you want into your editable local draft. Suggestions never save or publish public copy. Verify all seller claims: do not invent shipping offers, reviews, origins, certifications, materials or medical benefits. Classic looks offer insertion for the fields they actually render.

## 4. Products — add or review real listings

Open a product row to review its price and details, **Add a product from a photo**, or **Create a digital product** using the normal Snapfront flow. The wizard saves its current step before opening an add-product flow. Return through **My store → Resume storefront setup**; products refresh on return.

Publishing a product remains an explicit separate action in the regular product screen. The storefront wizard does not publish drafts or change inventory, prices or checkout.

## 5. Review — preview and deploy the design

Check the local theme, cover and copy summary, plus live/draft product counts and current plan/payment readiness. The summary is not a pixel-perfect rendered storefront; use **Preview my storefront** to inspect the actual template.

The private browser preview includes staged changes and existing live products without modifying your public store. It expires after **30 minutes**. Store and product links navigate to the currently applied public store rather than carrying the staged snapshot.

When ready, tap **Apply to public storefront**. This sends the reviewed theme, staged photo reference and wording in one store update. The completion screen shows that the design was applied and provides the real storefront link.

**Applying a design is not the same as enabling sales.** Taking orders requires this store to be eligible on its current plan, have completed Stripe setup, and have published products. The wizard reports those conditions without changing them. No plan purchase, Stripe setup or product publication occurs automatically.

## Save and resume

Drafts are saved on this phone, separately for each store. Search, category, collection, page and the furthest visited wizard step are retained. Tap a previously visited step to revise it. Moving between wizard steps starts at the top of the new screen.

- **Saving…** means the local write is pending; **Saved on this phone** confirms it completed.
- If native storage fails, keep the wizard open and use **Retry saving draft** before leaving. The open draft remains editable, but cross-restart recovery is not guaranteed until it saves successfully.
- Switching stores restores that store’s own draft. Never reuse one store’s setup choices in another store unintentionally.
- Drafts store bounded text and a server photo reference, never image base64.
- Photo uploads and AI requests are bound to the store that started them. If you switch stores before a result returns, completed photos are merged into the original store's draft and AI suggestions remain available when that store resumes. Suggestions still require an explicit per-field Use action. If native persistence fails, AI results remain available for the current app session.
- Successful Apply clears the resume draft. A cleanup failure does not undo the applied storefront; the completion screen reports the remaining device-only draft.

**Store look** remains available for quick cover, About, announcement and theme changes, with the same searchable thumbnail picker. Its Preview button opens your own store with the selected theme; only **Apply theme** changes that theme publicly.

## Native release

Backend theme availability and a native app release are separate. These controls require a build containing this source update. JavaScript bundle exports are not signed APK/AAB/IPA artifacts or app-store submissions.
