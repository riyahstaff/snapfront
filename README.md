# Snapfront

**Snap a photo. Get a storefront.** Snapfront is an iOS and Android app that turns a product photo into a complete product page with Stripe checkout, generates best-selling digital products (e-books, checklists, hook packs, quote prints, planners), and hosts each seller's storefront on the web.

```
mobile/   Expo (React Native) app for the App Store and Google Play  — Expo SDK 57, Expo Router, TypeScript
server/   Node API + public storefronts                               — Express 5, SQLite, Claude API, Stripe Connect
```

## How it works

1. **Snap** – the seller takes or picks a photo. The app sends it to `POST /api/ai/product-from-photo`, where Claude reads the image and writes the title, tagline, description, bullets, FAQ, tags, SEO text and a suggested price.
2. **Create** – `POST /api/ai/generate` writes a whole digital product for a niche, renders a cover (PNG) and a print-ready PDF, and saves it as a draft listing.
3. **Get paid** – sellers connect their own full Stripe account (Stripe Connect with Stripe-managed losses: Stripe covers refunds, chargebacks and negative balances; sellers pay their own Stripe fees). Buyers fill a cart on the storefront; checkout creates a Stripe Checkout Session on the seller's account (a direct charge) from prices re-read on the server. Snapfront takes no cut of sales by default (`PLATFORM_FEE_PERCENT=0`); it earns from plans instead.
4. **Run the store** – products can have options (sizes, colours) each with its own price and stock, stock counts that drop with each sale and show "sold out" at zero, discount codes (percent or amount off, minimum order, use limit, expiry), flat-rate shipping with an optional free-shipping threshold and country list, and automatic sales tax through Stripe Tax. Sellers can set up tax in their Stripe Dashboard, or from Store settings → Set up sales tax, which opens `/stripe/tax`, a page hosting Stripe's embedded tax settings and registrations components (needs `STRIPE_PUBLISHABLE_KEY`); tax can only be turned on once the seller's tax settings are active and they have at least one registration. Orders record items, totals, tax, buyer and shipping address; sellers mark physical orders shipped from the app.
5. **Ask the assistant** – the Assistant tab talks to a store agent running on Claude Fable 5.1 (`AGENT_MODEL`). It has tools that act on the seller's own store (check the store, research what sells, generate digital products, create and edit listings, set prices, stock and options, publish, manage discount codes, shipping and tax settings, read and fulfil orders) and runs the multi-step job itself, reporting progress back to the app (`POST /api/agent/runs`, then poll `GET /api/agent/runs/:id`). Limits: 10 tool rounds per request, 15 requests per seller per hour, one at a time.
6. **Sell** – every store lives at `/s/<store>` with product pages at `/s/<store>/<product>` (Open Graph tags + Product schema for search and social previews) and a cart at `/s/<store>/cart`. After payment, buyers land on `/thanks?o=<order>`, which confirms the order with Stripe if the webhook hasn't arrived yet and gives digital buyers signed, 7-day download links (also emailed if Resend is configured).

## Pricing

| Plan | Price | Live stores | AI pages / products / assistant |
|---|---|---|---|
| Free | $0 | 0 (build and preview 1 store) | 3 / 1 / – in total, 3 price checks |
| Launch | $29 once | 1 | 30 / 5 / – a month, 30 price checks |
| Pro | $14.99 a month | up to 10 | 300 / 50 / 40 a month, 300 price checks |

People buy in the app through Google Play Billing (and the App Store), handled by RevenueCat. The app identifies each person by their Snapfront account id; RevenueCat entitlements `launch` (lifetime) and `pro` (monthly) map to plans. The server never trusts the phone: it reads entitlements from RevenueCat (`REVENUECAT_SECRET_KEY`) when the app calls `POST /api/billing/sync` and when RevenueCat's webhook (`POST /api/revenuecat/webhook`, `Authorization` = `REVENUECAT_WEBHOOK_AUTH`) reports a purchase, renewal or expiry. Allowances can be tuned with `PLAN_LIMITS` (JSON) without a code change. Accounts own stores; the app sends `X-Store` to pick which one. Email sign-in (6-digit codes via Resend) moves an account to a new phone.

## Price check

`POST /api/research/price-check` takes a photo or supplier screenshot (base64, an uploaded image, or an https image link), runs a Google Lens product search through SerpApi (`SERPAPI_KEY`), and returns US-priced matches from Amazon, Walmart, Target, eBay and others, the lowest price per store, and a suggested price about 5% under the cheapest big retailer while keeping at least a 30% margin over the seller's cost.

## Dropshipping (CJdropshipping)

Sellers find products in the app's **Find** tab. Search and product details use Snapfront's own CJ key (`CJ_API_KEY`); results are cached (searches 1 hour, products and shipping quotes 6 hours) and calls are spaced one per second, CJ's limit.

- **Add to my store** (`POST /api/catalog/products/:pid/import`) downloads the photo, writes fresh copy with Claude (one AI product page from the plan), and prices it: the seller's price if given, otherwise a price check against Amazon/Walmart/Target (one price check from the plan), otherwise about 2.5 times the cost including shipping. Options keep their CJ variant ids and costs.
- **Orders**: each seller connects their own CJ account (Store settings, `PUT /api/suppliers/cj`, key stored AES-GCM encrypted). When an order with CJ items is paid, Snapfront picks CJ's cheapest shipping method and creates the order in the seller's CJ account: paid from their CJ wallet if they turned on automatic payment, otherwise left for them to pay in CJ. Orders paid before CJ is connected are sent as soon as it is.
- **Tracking** is checked every 30 minutes (and on demand from the order); once CJ ships, the order is marked fulfilled and the tracking number shows on the buyer's order page.

## Run it locally

```bash
# 1. API
cd server
cp .env.example .env        # add ANTHROPIC_API_KEY and STRIPE_SECRET_KEY (test mode)
npm install
npm test                    # smoke tests (AI faked, no keys needed)
npm run dev                 # http://localhost:8080

# 2. App
cd ../mobile
npm install
# point the app at your API: edit "extra.apiUrl" in app.json (use your computer's LAN IP on a phone)
npx expo start              # scan the QR code with a development build or Expo Go
```

## Deploy the API (Railway)

1. Push this repo to GitHub, then in Railway: **New project → Deploy from GitHub repo**, root directory `server`.
2. Add a **volume** mounted at `/data` and set `DATA_DIR=/data`.
3. Set the variables from `.env.example` (`PUBLIC_URL` = the Railway domain, e.g. `https://snapfront-api.up.railway.app`).
4. In Stripe → Developers → Webhooks, add an endpoint for **Connected accounts** at `PUBLIC_URL/api/stripe/webhook` with events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `account.updated`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
5. In Stripe → Connect, finish the platform profile (sellers collect payments directly; Stripe manages losses) so seller onboarding works.
6. Put the Railway URL in `mobile/app.json → extra.apiUrl`.

`railway.json` sets the start command and the `/health` check.

## Ship the app

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init                 # fills extra.eas.projectId
npm run build:ios && npm run submit:ios
npm run build:android && npm run submit:android
```

The app ID is `com.sidebanc.snapfront` (iOS and Android) and the support contact on the privacy and terms pages is torrey@troosec.com. Before the first iOS submission, add the App Store Connect app ID to `eas.json` under `submit.production.ios.ascAppId`. The full walkthrough is in the Snapfront publishing guide.

## App store notes

- Sellers' customers pay on the web through Stripe for goods sold by the seller; the app doesn't sell digital content to its own users, so no in-app purchase is involved. If you later charge sellers a subscription inside the app, Apple and Google require their in-app billing for that.
- In-app account deletion (Store settings → Delete my store) and the `/privacy` page cover the stores' account and privacy requirements.
- Camera and photo permission strings are set in `app.json`.

## API reference

| Method | Path | What it does |
|---|---|---|
| POST | `/api/sellers` | Create a store for this device, returns a bearer token |
| GET / PATCH / DELETE | `/api/me` | Read, edit (name, tagline, shipping, tax) or delete the store |
| POST | `/api/ai/product-from-photo` | Photo (base64) → product page copy |
| POST | `/api/ai/generate` | Niche + format → digital product, cover and PDF |
| GET / POST | `/api/products` | List or create products |
| GET / PATCH / DELETE | `/api/products/:id` | Read, edit or delete one product |
| POST | `/api/products/:id/publish` | Put a product on sale (Stripe must be ready) |
| GET | `/api/orders` | Paid, fulfilled and canceled orders |
| POST | `/api/orders/:id/fulfill` | Mark a paid order shipped |
| GET / POST | `/api/discounts` | List or create discount codes |
| PATCH / DELETE | `/api/discounts/:id` | Turn a code on/off, or delete it |
| POST | `/api/agent/runs` | Start a store-assistant request (Claude Fable 5.1 + store tools) |
| GET | `/api/agent/runs/:id` | Progress steps, products touched and the final reply |
| POST | `/api/stripe/onboard` | Stripe Connect onboarding link |
| GET | `/api/stripe/status` | Whether the seller can take payments |
| POST | `/api/stripe/dashboard` | Where the seller sees sales and payouts |
| POST | `/api/stripe/webhook` | Stripe Connect webhook |
| POST | `/api/stripe/tax-setup` | Signed 30-minute link to the sales tax setup page |
| GET | `/api/stripe/tax` | Whether Stripe Tax is active and where the seller is registered |
| GET | `/s/:store`, `/s/:store/:product`, `/s/:store/cart` | Public storefront, product and cart pages |
| POST | `/s/:store/cart/quote` | Price a cart: subtotal, discount, shipping (public) |
| POST | `/s/:store/checkout` | Start Stripe Checkout for a cart (public) |
| GET | `/thanks`, `/d/:token` | Order confirmation and signed downloads |
| GET | `/privacy`, `/terms` | Legal pages for the store listings |

## Licences

Fonts in `server/assets/fonts` (Bricolage Grotesque, DM Sans) are under the SIL Open Font License (`OFL.txt`).
