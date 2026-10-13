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

## Pricing

- **Lifetime** $299 once and **Monthly** $69 a month. Both unlock the `pro` plan. Website: `webbilling.js` (`LIFETIME_PRICE_CENTS`, `PRO_PRICE_CENTS` to change). Google Play: `snapfront_lifetime` and the `pro-monthly-69` base plan on `snapfront_pro` (`PLAY_LIFETIME_PRICE`, `PLAY_PRO_PRICE`), created automatically at startup.
- Launch ($29 once) and the $14.99 Pro base plan are no longer sold; people who bought them keep them. Once the new phone build is live, stop selling them in older app versions with `POST /api/admin/play/retire-old` (admin token).
- Monthly web subscribers who buy Lifetime have their subscription stopped at the end of the paid month.

## Snapfront Partners (affiliates who sell Snapfront)

- Anyone with a Snapfront account and email joins in **Earn with Snapfront** and gets `snapfront.app/r/CODE`.
- The link sets an `sf_via` cookie on `.snapfront.app`; the website sends it to `/api/partners/claim` (and with the checkout). The first partner wins, for `PARTNER_WINDOW_DAYS` (60).
- A Lifetime purchase (website or Google Play) earns `PARTNER_RATE` % (50). Monthly plans earn `PARTNER_MONTHLY_RATE` % of the first payment (0 = off).
- Commissions are held `PARTNER_HOLD_DAYS` (30), voided on refund, then paid automatically by Stripe transfer to the partner's connected store account (`PARTNER_AUTO_PAYOUTS=false` to stop that), or by hand to PayPal: see `https://snapfront.app/admin/partners` with the admin token.
