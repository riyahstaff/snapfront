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

## Credits, avatar videos and talking avatars

Avatar videos are paid with **credits**, bought in packs on the website (like Higgsfield or OpenArt). Plans cover the everyday tools; credits pay for the expensive video models, so Lifetime members pay for heavy video use.

### Packs (Stripe Checkout on Snapfront's account)

| Pack | Credits | Price | Per credit |
|---|---|---|---|
| Starter | 300 | $15 | 5.0¢ |
| Creator | 800 | $35 | 4.4¢ |
| Studio | 2,000 | $79 | 4.0¢ |
| Agency | 5,500 | $199 | 3.6¢ |

Change them with `CREDIT_PACKS` (JSON list of `{id, name, credits, cents, badge?}`) on Railway. Credits never expire; all sales are final; a failed video always refunds its credits. A refunded or disputed pack takes its credits back (the background check looks at purchases from the last 120 days). Packs are only sold on the website: the phone app shows the balance and history and names no prices, like memberships.

### Video models and prices

Credits = provider cost × `CREDIT_MARKUP` (2.5) ÷ `CREDIT_VALUE_USD` ($0.04), rounded up to 5.

| Model (Runpod endpoint) | Use | Options | Credits |
|---|---|---|---|
| Kling O1 (`kling-video-o1-r2v`) | Avatar + product + photo as references; most consistent | 9:16, 5 or 10 s, 720p | 35 / 70 |
| Seedance 2.5 (`16jsvx5ncmm24x`) | Best quality, optional sound and music | 9:16, 5 or 10 s, 720p or 1080p | 115 / 225 (720p), 285 / 565 (1080p) |
| Sora 2 Pro (`sora-2-pro-i2v`) | Sound and dialogue; keeps the photo's framing | 4, 8 or 12 s, 720p or 1080p | 75 / 150 / 225 (720p), 125 / 250 / 375 (1080p) |
| InfiniteTalk (`infinitetalk`) | Talking avatar, lip-synced to Snapfront's own Kokoro voice | Up to 450 characters, 480p or 720p | 20 / 35 |

- Videos start from a finished avatar photo (avatar + product). Talking avatars can also start from the avatar's portrait, and only work for styles with a face (Soft 3D, Illustrated, Mascot).
- Endpoint ids can be swapped with `RUNPOD_EP_KLING`, `RUNPOD_EP_SEEDANCE`, `RUNPOD_EP_SORA`, `RUNPOD_EP_TALK`.
- Wan 2.6 isn't used: Runpod lists only horizontal sizes for it.
- Up to 3 videos in progress per store. Jobs that fail, time out (40 minutes) or never start get their credits back.
- Admin: `POST /api/admin/credits/:account {amount, note}` with `ADMIN_TOKEN` adds or removes credits (promos, support, testers).
- API: `GET /api/credits`, `POST /api/credits/checkout {pack}`, `POST /api/credits/confirm {session_id}`, `GET/POST /api/avatar-videos`, `GET/DELETE /api/avatar-videos/:id`.
