# Growth tools: email, affiliates, pixels, AutoDM

Screens: My store → Grow your store (phone) and the Tools grid on app.snapfront.app.

| Feature | Plans | Server module |
| --- | --- | --- |
| Email sign-up box on every store, checkout opt-in, subscriber list, CSV export | All | `server/src/audience.js` |
| Email broadcasts (send now or schedule, test sends, open/click/unsubscribe stats) | Launch (500/mo), Pro (5,000/mo) | `audience.js` |
| Automatic emails: welcome, after a purchase, win-back | Pro | `audience.js` |
| Affiliate program: `?ref=CODE` links, join page, private stats page, commission, payouts | Pro | `server/src/affiliates.js` |
| Ad pixels: Meta, TikTok, GA4, Pinterest with standard shopping events | Launch, Pro | `server/src/pixels.js` |
| Instagram AutoDM: keyword replies to comments and DMs | Pro | `server/src/autodm.js` |

## Email

- Sent through Resend's batch API (`RESEND_API_KEY`) from a queue in SQLite (`email_sends`), one batch of 100 every ~0.6 s. The worker runs every minute and also starts immediately after a send.
- Every email has the seller's mailing address (required before sending) and `List-Unsubscribe` + one-click unsubscribe (`/u/<token>`). Unsubscribe pages need a button press, so link scanners don't unsubscribe people.
- Opens: `/e/o/<send>.gif`. Clicks: `/e/c/<send>?u=&s=` (HMAC-signed, so it can't be used as an open redirect). Links get `utm_source=email`, which shows up as "email" in Sales & profit sources.
- Monthly limits per account: `EMAIL_CAPS='{"launch":500,"pro":5000}'` to change them.
- Checkout adds an optional "Email me new products and offers" dropdown (Stripe Checkout `custom_fields`) when the sign-up box is on.

## Affiliates

- The storefront remembers `?ref=CODE` in the buyer's browser for the store's cookie window and sends it with the checkout. Commission = rate × (subtotal − discount), fixed at payment, reduced in proportion to refunds, zero when the affiliate buys with their own link.
- Sellers pay affiliates themselves and record payouts ("Mark paid").

## AutoDM setup (Snapfront owner, once)

AutoDM is fully built but stays off until Meta approves it:

1. In the Meta app: add the Instagram product's webhooks, callback `https://snapfront.app/api/meta/webhook`, verify token = `META_WEBHOOK_VERIFY_TOKEN`, subscribe to `comments` and `messages`.
2. Add `instagram_manage_messages`, `instagram_manage_comments` and `pages_manage_metadata` to the Facebook Login for Business configuration and request Advanced Access in App Review.
3. Set `META_AUTODM_ENABLED=true` and `META_WEBHOOK_VERIFY_TOKEN` (plus the existing `META_*` variables used for publishing).
4. Sellers reconnect Instagram in Marketing posts, then tap "Refresh the Instagram connection" on the AutoDM screen.

Webhook deliveries are verified with `X-Hub-Signature-256` (app secret). Each person gets a rule's reply at most once a day.
