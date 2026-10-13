# Template-first storefront preview API

This document describes the **server contract** for the native storefront setup flow. It does not publish a store, create inventory, change a plan, connect Stripe, or perform a payment/AI/Meta operation.

## Endpoint

`POST /api/storefront/template-preview`

- **Authentication:** `Authorization: Bearer <device token>`; the selected store follows the existing optional `X-Store` header.
- **Response headers:** `Cache-Control: no-store, max-age=0`, `Pragma: no-cache`, and `X-Content-Type-Options: nosniff`.
- **Request:** normal `StorePatch` presentation fields plus a required `mode`:

```json
{
  "mode": "template",
  "theme": "p-handbags",
  "banner_file": "owned-main.webp",
  "design_photos": ["owned-detail.webp", null],
  "hero_title": "A title the seller entered",
  "hero_subtitle": "Optional supporting copy",
  "hero_eyebrow": "NEW COLLECTION",
  "hero_cta": "Browse now"
}
```

`mode` is exactly one of:

- **`template`** — renders the selected real store template with current draft and live products. If no real product exists, server-memory sample products may fill the layout. For each image position the selected renderer actually uses, real owned slot media and real product media win first; a remaining empty position receives selected-theme fixture photography (repeated only for this private render when necessary). Blank wording can receive render-only starter copy. These samples are never persisted.
- **`final`** — renders only seller data and **live** products. It never inserts sample photo, product, or starter-copy data. An empty renderer-used media position remains empty and is reported with `"image_url": null`.

The route uses the same `storePage` and theme modules as a seller storefront; it is not a screenshot or a mock layout. Request values are passed through the existing allow-listed `storefrontPatch` validator. Arbitrary client fields cannot become private renderer flags.

## Response

```json
{
  "html": "<!doctype html>…",
  "photo_slots": [
    {
      "index": 0,
      "label": "Main photo",
      "image_url": "https://…/img/owned-main.webp",
      "sample": false
    }
  ],
  "sample_products": 0,
  "mode": "final",
  "theme": { "id": "p-handbags", "name": "Afterglow Carry" }
}
```

`photo_slots` reports only editable image slots actually used by that selected renderer. Indices are always `0`, `1`, or `2`; it never invents unused slots for a one-photo design. In a `final` response, an actually-used but unfilled position is present with `image_url: null` so a client can block Finish rather than saving a blank composition. When a live product image fills an otherwise empty renderer position, its URL is reported as real (`sample: false`).

| Index | Meaning | Persisted source |
|---:|---|---|
| 0 | Main photo | `sellers.banner_file` |
| 1 | Supporting photo 1 | `sellers.design_photos[0]` |
| 2 | Supporting photo 2 | `sellers.design_photos[1]` |

`sample` is deterministic: it is `true` only for private server-generated fixture media in `template` mode. It is never true for a seller file or a real product image, even when a seller intentionally reuses one owned file in multiple slots. The private HTML contains an explicit sample notice whenever sample media, copy, or products are present.

## Preview HTML isolation

The response HTML is intended for a private native WebView/srcdoc context:

- Original storefront scripts, cart behavior, checkout behavior, forms, and navigable public links are removed or blocked.
- A restrictive HTML CSP blocks connections and form submissions while allowing only the renderer’s inline styles/bridge and image/font sources needed for layout.
- The only added bridge sends JSON `{"type":"photo","slot":N}` for taps on renderer-used `data-sf-photo` images **or empty media placeholders**, and optionally `{"type":"words"}` from the headline. No seller auth token, account data, payment key, or API secret is embedded.
- Previewing reads database rows only. It never publishes a draft, writes a product, creates an order, or opens checkout.

## Persisted photo fields

SQLite migration adds:

```sql
ALTER TABLE sellers ADD COLUMN design_photos TEXT NOT NULL DEFAULT '[]';
```

It contains an ordered JSON array of at most two `string | null` entries. `PATCH /api/me` and the existing private token preview use the same `StorePatch` validation:

- `banner_file` and each non-null `design_photos` value must be an existing seller-owned JPG/JPEG/PNG/WebP/GIF under the image store.
- Ownership is checked through shared `ownsSellerImage`, accepting a staged setup photo, photo-studio/recorded media, or an actual product image from the initiating seller only.
- URLs, theme demo asset names, traversal strings, foreign-store files, and missing files are rejected.
- `null` safely clears an individual auxiliary slot; an empty array clears both.
- Duplicates are retained intentionally. For example, `["same.webp", "same.webp"]` remains two independently positioned supporting slots.

`GET /api/me` (and other `publicSeller` responses) remain additive and now include:

```json
{
  "banner_file": "owned-main.webp",
  "banner_url": "https://…/img/owned-main.webp",
  "design_photos": [
    { "image_file": "owned-detail.webp", "image_url": "https://…/img/owned-detail.webp" },
    null
  ]
}
```

Existing public storefronts without extras retain their original media order and premium image deduplication behavior. Private previews preserve the fixed ordered positions `0`, `1`, and `2`: a chosen media 2 is never compacted into media 1 when media 1 is `null`. Explicit extras render as media 1/2 alongside main media 0.

## Safe deletion and cleanup

A staged photo cannot be deleted while it is used by a product, main banner, either auxiliary slot, or durable generated-media history. Product/banner cleanup also preserves a file still held in the staged library. Store and account deletion collect `design_photos` alongside banner, staged, product, and seller-media references.

## Existing private-token preview

`POST /api/storefront/preview` remains compatible: its random 30-minute URL snapshot is unchanged, now receives a validated serialized `design_photos` patch, and renderer slot parsing materializes it correctly. It still uses its established live-product-only behavior.

## Deployment blocker

This repository change is **not deployed** by this task. The connected backend must be built and deployed before a native build depends on `POST /api/storefront/template-preview` or `design_photos`. No merge, production mutation, publication, account/plan change, Stripe action, Meta action, or payment action was performed here.
