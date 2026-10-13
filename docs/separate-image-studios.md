# Storefront Photo Agent and Digital Photo Studio

**Next native version: 1.1.1.** This source update preserves the silver icon, Liquid Chrome Home, rotating theme cards, filled storefront layouts and all 50 editable digital designs.

## What was wrong with Refresh

The private preview could return exactly the same HTML. Updating the preview data alone did not guarantee that the native WebView or browser frame reloaded, so tapping Refresh could appear to do nothing. Requests also lacked a complete deadline covering authentication and response-body reading.

Refresh now:

- Fetches the latest draft, records a render revision and remounts the preview even when the HTML is identical.
- Busts caches only for unsigned pictures hosted on the app’s own image/theme paths. Signed links, external URLs, data images and font URLs are not rewritten.
- Shows loading, completion and recoverable network/render errors. A failed request leaves the last good preview and saved draft available.
- Bounds the whole request, including token lookup and JSON response reading.
- **Does not generate an image, spend AI image allowance or publish the store. It is not a paid feature.**

## 1. Redesign storefront pictures

The storefront wizard no longer embeds the old background-only Photo Studio.

1. Choose a filled storefront design and open **Swap the photos**.
2. Pick **Main**, **Detail 1** or **Detail 2**, when that design uses those spots.
3. Upload/take a real picture, or choose a photo from your actual products.
4. Open **Ask the Storefront Photo Agent**.
5. Choose **Redesign my photo** or **Create backdrop**.
6. Describe the whole idea: subject, materials, colors, lighting, placement and mood. Two optional starters offer editorial and cinematic direction; they are not a fixed list of permitted backgrounds.
7. Choose wide, portrait or square and create **one candidate**.
8. Compare the original and result, then explicitly choose **Use this candidate in this spot**.
9. Check the real theme preview and finish the existing guided setup when ready.

Only the selected draft photo is replaced. Other photo spots, theme layout, actual products and the live store remain unchanged until the seller finishes setup. Backdrop generation makes decorative artwork—not invented inventory. AI is instructed to preserve an actual item/logo/label, but that is not a guarantee; seller review is required.

### Leaving and recovering

Requests are stored on the server under the initiating account, store and photo spot. Closing the screen does not request another image. Resume/check/review reads the existing job.

An interrupted start offers a **same-request retry** with the original request key, prompt, source and destination. Editing a prompt cannot silently turn this recovery into a second generation. If that in-memory recovery input is no longer available, the UI reloads saved history rather than inventing a new request.

## 2. Make premium digital artwork

**Digital Photo Studio** is separate from storefront editing. It is available from a saved digital product or from a picture spot inside the editable Digital Design Studio.

For artwork inside a product:

1. Open the digital editor and select/create an image block.
2. Tap **Make artwork in Digital Photo Studio**. The editor first saves the private source draft.
3. Choose **New artwork** or **Edit my picture**. Editing a saved page image uses that page picture, not an unrelated listing cover.
4. Enter a full prompt, optional framing guidance and an editorial, illustration, cinematic or soft-texture direction.
5. Choose the picture shape and create a candidate.
6. Review it, then tap **Use in this page**.
7. The candidate returns to the same existing image block. Save, preview and export through the digital editor as usual.

The handoff is bound to the account/store/product/page/block and the prior image reference. It waits for a remounted editor to load its actual source and refuses a removed, changed or non-image destination. It does not implicitly add pages or overwrite a buyer file. A product-level studio entry also offers an easy route to the editable design.

**Words, fonts, colors, pages and PDF delivery remain editable and separate.** AI picture editing is not used to rewrite text-bearing PDFs or rasterize the entire source document.

## 3. Present the real digital cover

The second studio tab creates three composed presentations:

- **Chrome reader:** silver device frame and a clean, portrait-cover composition.
- **Editorial print:** layered paper, subtle depth and soft shadows.
- **Midnight tablet:** a dark tablet presentation with the actual cover.

These are local server composites of the real saved cover—not AI-invented titles. They honor the requested shape and retain the original cover’s aspect ratio. Repeating a presentation resolves back to the recorded original cover rather than putting a tablet inside another tablet.

The seller must review and confirm a listing-cover change. That update is explicitly bound to the initiating store and modifies **only `image_file`**. It never replaces the editable document, PDF, price, listing status, payment plan or buyer download.

Original artwork uses the existing `scene` allowance. Composed presentations use the existing `studio` allowance. Presentations do not call Runpod and are not labeled as AI outputs. A missing image provider does not prevent presentations, manual uploads or Refresh when their other requirements are met.

## Preserved physical-product tool

Existing physical photo work remains under **Product Photo Cleanup** for compatibility. It is no longer presented as the storefront design assistant or digital artwork studio. A generated candidate is not automatically applied to an inventory photo.

## Backend and safety

New owner-authenticated API:

- `GET /api/image-assistant?context=storefront|digital`
- `POST /api/image-assistant/jobs`
- `GET /api/image-assistant/jobs/:id`

The existing `X-Store` selection is explicit for image operations and reviewed listing changes. A synchronous selected-store guard also blocks stale-screen actions during the short interval before the new account/store view finishes loading.

Image requests have durable unique request keys, operation/prompt/source/destination fingerprints, usage-period records, owner-checked leases, heartbeat renewal, a pre-submission fence and terminal-state guards. An ambiguous post-crash submission is failed honestly and its image allowance is restored rather than submitted again. Failed requests restore the recorded allowance period once; they do not invent a monetary refund. One background scan is active at a time and scans select distinct eligible jobs.

Provider results are bounded, image-decoded, normalized and accepted only from allow-listed Runpod HTTPS hosts/redirects. Candidate/source references are retained by owner-aware media cleanup and removed with account/store deletion. The draft privacy text describes prompts, pictures and durable image requests; the owner should review that disclosure before launch.

## Validation and release boundary

The implementation is tested with isolated databases, mocked Runpod responses, local real-cover compositing and actual native components rendered through React Native Web. The control screenshots use local fixture products and allowances. They are **not live account screenshots or proof of AI output quality**. The three presentation examples are genuine output from the implemented compositor.

Physical-device WebView rendering, actual Runpod output quality/latency and the supplied tester accounts’ entitlements require live follow-up. No production seller was created or modified, no live AI generation was billed, and no account was granted a paid plan during implementation.

This change is based on the open 50-design source work in PR #7. The new release PR includes that source ancestry; activate the compatible backend together with the next native build. Native package identifiers, the silver icon, EAS project, signing configuration and store billing are unchanged. A signed AAB is a separate release step and has not been requested for these image-tool changes.

## Provider/API references

- [Runpod Qwen Image Edit 2511](https://docs.runpod.io/public-endpoints/models/qwen-image-edit-2511)
- [Runpod Qwen Image](https://docs.runpod.io/public-endpoints/models/qwen-image)
- [Expo SDK 57 WebView](https://docs.expo.dev/versions/v57.0.0/sdk/webview/)
- [Expo SDK 57 ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)
