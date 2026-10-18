# Digital bundles, subscriptions, and Mira

## Seller workflow

Open **My store → Bundles & subscriptions**, or the Products step of storefront setup.
Choose two or more individual digital products for a one-time bundle, or one or more
for a monthly/yearly subscription. Set a name, description and price. Save a draft,
then open it to preview and publish using the existing product publishing flow.
Included products must belong to the same store, have delivery attached, be live
before the offer goes live, have unlimited inventory and have no variants. Nested
offers, physical products and dropship fulfillment are not supported by this release.

Offers appear as ordinary listings across the theme catalog. Recurring prices show
their interval on cards, product pages, discovery sections and the cart. A subscription
is purchased separately from one-time items; discount codes currently apply only
to one-time purchases. Sellers can archive an offer to stop new signups.

One-time bundles pin the offered downloads when checkout starts. Subscriptions pin
the included product IDs and price at signup; existing members can download current
versions of those included products while entitled. Editing an offer changes future
signups only. Previously downloaded files/external links cannot be recalled.

Subscribers see billing status, paid-period end and **Manage subscription / cancel**
on their private confirmation page. The connected-account Stripe portal supports
payment-method changes, invoices and cancellation at period end. Failed payment or
ended access blocks new downloads. A paid membership remains accessible when the
seller archives its listing. Active memberships prevent deleting their source products.
The seller's offers screen includes subscriber status and cumulative paid invoice totals.
Renewal invoices are recorded in the subscription ledger, not duplicated as ordinary
one-time orders in Sales & profit.

## Mira

Mira is a contextual, conversational store stylist in storefront setup (including the
themes step). She sees that store's products, the current draft and up to six recent
messages. She proposes catalog themes, supported hero motion, copy and photo guidance.
A review button stages the allowlisted design fields only. The existing preview and
Finish action publish them. She cannot change prices, Stripe, photos or live store
settings directly. Requests use the existing assistant allowance and configured
Anthropic integration; unsuccessful responses don't consume that allowance.

## Stripe rollout gate

This uses the seller's existing connected Stripe account and direct charges, not
Snapfront credit sales or Treasury. No live payments were made during development.
Verify the Connect webhook destination at `/api/stripe/webhook` receives these events
**from connected accounts** (in addition to existing events):

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.payment_action_required`

Keep its signing secret in the existing comma-separated `STRIPE_WEBHOOK_SECRET`.
Current subscription state is retrieved from the correct connected account to resist
out-of-order event replay; failed processing returns 500 for Stripe retries. Existing
pending-order reconciliation also registers subscriptions. Subscription reconciliation
and on-demand entitlement refresh provide recovery if events are delayed.

Before a production launch, use a Stripe test connected account to complete a hosted
monthly checkout, advance a test clock through a renewal/failure, and cancel through
the portal. Confirm that the connected account accepts the enabled Billing/portal
features. The API's recording Stripe stand-in tests exercise these request shapes and
state transitions, but do not replace that external test-mode acceptance check.

## Verification

- Server suite: 239 tests executed; 238 initially passed; the classic-page snapshot
  regression was fixed and its test passed on rerun. Targeted final commerce/theme
  suite: 13/13 passing.
- TypeScript typecheck, Expo lint and production Expo web export passed.
- Tests cover bundle ownership/validation, immutable delivery, monthly/yearly
  pricing, account-scoped webhooks, retries before fulfillment, membership scope
  preservation, payment failure/recovery, portal parameters, cancellation, invoice
  idempotency and Mira's field allowlist/no live mutation.
- Automated browser screenshots could not run: Chromium was unavailable and its
  download failed in this environment. No visual-browser signoff is claimed.

Database changes are additive. Deploy with the normal Railway build so the web client
is regenerated from source. Existing one-time product behavior and the original 20
classic themes' baseline markup are preserved.
