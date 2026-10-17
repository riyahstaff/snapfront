# Membership sales page and faceless avatars

## Membership sales page

- `snapfront.app/join` is a long, phone-first page that sells Snapfront Lifetime and Monthly, in the order link-in-bio offers use: the problem, a better morning, courses vs Snapfront, "do I have to show my face?", what's inside, the optional partner program, the plans, an FAQ and a sticky Join bar.
- `snapfront.app/join/CODE` is a partner's own copy. The visit is counted like `/r/CODE`, the code is remembered for checkout (the `sf_via` cookie plus `?via=CODE` on the plan buttons), the page says the partner earns a commission, and it isn't indexed. Unknown or suspended codes go to `/join`.
- Plan buttons go to `app.snapfront.app/plans?buy=lifetime|pro`, which opens Stripe Checkout as before. Prices, the commission rate and the monthly commission are read from `webbilling.js` and `partners.js`.
- Deliberately absent: income claims, invented results, crossed-out "was" prices and "most popular" claims.

### Pay in 4 (optional)

Plan checkout doesn't set `payment_method_types`, so Stripe shows whatever methods are switched on in the Dashboard. To offer Klarna or Afterpay on Lifetime:

1. Turn them on in Stripe → Settings → Payment methods (for Snapfront's own account).
2. Set `PLAN_PAY_LATER=klarna,afterpay` (any of `klarna`, `afterpay`, `affirm`) on the server.

Only then does the page mention them, with the real split (4 × $74.75 for $299). Leave the variable unset and the page says nothing about paying later.

## Membership card on a partner's link-in-bio page

Earn with Snapfront → **Your sales page** has the partner's `/join/CODE` link (copy, preview, share) and a switch, **Show it on my link-in-bio page**. When on, the store's `/links` page shows a Snapfront membership card linking to the partner's sales page, with "I earn a commission if you join through this link." under it.

- `PUT /api/partners/bio-card {on}` (per store; only active partners can turn it on). `GET /api/partners/me` now returns `sales_link` and `bio_card`.
- Suspending a partner hides the card immediately.

## Faceless avatars

Store → **Faceless avatars**. Sellers make an original AI character once, then put it in photos with their products. Each finished photo opens Marketing (post or story) with that photo, so all the usual designs, carousels and reels work.

- Styles: Chrome host (mirrored visor, no face), Soft 3D character, Illustrated, From behind, Hands only, Mascot. Each style's rule (for example "no human face is ever visible") is repeated in every photo prompt.
- Avatars are original characters. Descriptions that ask for a real or famous person's likeness are refused before anything is sent to the AI, and every prompt tells the model not to resemble anyone.
- Models (Runpod public endpoints, the existing `RUNPOD_API_KEY`): `qwen-image-t2i` makes the avatar; `qwen-image-edit-2511` takes the avatar plus the product photo and returns a 4:5 photo.
- Both use the "AI lifestyle photos" allowance (`scene`) and are refunded if they fail. Results are saved as the store's own photos and marked as AI images. Up to 12 avatars per store.
- API: `GET/POST /api/avatars`, `GET/DELETE /api/avatars/:id`, `POST /api/avatar-shots`, `GET /api/avatar-shots/:id`. A background check runs every 8 seconds alongside the AI photo check.

The web app picks this up on the next deploy (Railway rebuilds it). The Android app needs a new build to show the new screen.
