# Snapfront

**Snap a photo. Get a storefront.** Snapfront is an iOS and Android app that turns a product photo into a complete product page with Stripe checkout, generates best-selling digital products (e-books, checklists, hook packs, quote prints, planners), and hosts each seller's storefront on the web.

```
mobile/   Expo (React Native) app for the App Store and Google Play  — Expo SDK 57, Expo Router, TypeScript
server/   Node API + public storefronts                               — Express 5, SQLite, Claude API, Stripe Connect
```

## How it works

1. **Snap** – the seller takes or picks a photo. The app sends it to `POST /api/ai/product-from-photo`, where Claude reads the image and writes the title, tagline, description, bullets, FAQ, tags, SEO text and a suggested price.
2. **Create** – `POST /api/ai/generate` writes a whole digital product for a niche, renders a cover (PNG) and a print-ready PDF, and saves it as a draft listing.
3. **Get paid** – sellers connect their own Stripe account (Stripe Connect Express). Publishing creates the Stripe product, price and a Payment Link on the seller's account. Snapfront keeps `PLATFORM_FEE_PERCENT` as an application fee.
4. **Ask the assistant** – the Assistant tab talks to a store agent running on Claude Fable 5.1 (`AGENT_MODEL`). It has tools that act on the seller's own store (check the store, research what sells, generate digital products, create and edit listings, set prices, publish with Stripe, read orders) and runs the multi-step job itself, reporting progress back to the app (`POST /api/agent/runs`, then poll `GET /api/agent/runs/:id`). Limits: 10 tool rounds per request, 15 requests per seller per hour, one at a time.
5. **Sell** – every store lives at `/s/<store>` with product pages at `/s/<store>/<product>` (Open Graph tags + Product schema for search and social previews). After payment, buyers land on `/thanks`, which verifies the Stripe session and gives digital buyers a signed, 7-day download link (also emailed if Resend is configured).

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
4. In Stripe → Developers → Webhooks, add an endpoint for **Connected accounts** at `PUBLIC_URL/api/stripe/webhook` with events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `account.updated`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
5. In Stripe → Connect, finish the platform profile so Express onboarding works.
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

Before submitting, change `com.snapfront.app` in `app.json` to a bundle ID you own, replace `REPLACE_WITH_SUPPORT_EMAIL` in `server/src/index.js` (privacy and terms pages), and fill in `eas.json` submit settings. The full walkthrough is in the Snapfront publishing guide.

## App store notes

- Sellers' customers pay on the web through Stripe for goods sold by the seller; the app doesn't sell digital content to its own users, so no in-app purchase is involved. If you later charge sellers a subscription inside the app, Apple and Google require their in-app billing for that.
- In-app account deletion (Store settings → Delete my store) and the `/privacy` page cover the stores' account and privacy requirements.
- Camera and photo permission strings are set in `app.json`.

## API reference

| Method | Path | What it does |
|---|---|---|
| POST | `/api/sellers` | Create a store for this device, returns a bearer token |
| GET / PATCH / DELETE | `/api/me` | Read, rename or delete the store |
| POST | `/api/ai/product-from-photo` | Photo (base64) → product page copy |
| POST | `/api/ai/generate` | Niche + format → digital product, cover and PDF |
| GET / POST | `/api/products` | List or create products |
| GET / PATCH / DELETE | `/api/products/:id` | Read, edit or delete one product |
| POST | `/api/products/:id/publish` | Create Stripe product, price and Payment Link; go live |
| POST | `/api/agent/runs` | Start a store-assistant request (Claude Fable 5.1 + store tools) |
| GET | `/api/agent/runs/:id` | Progress steps, products touched and the final reply |
| POST | `/api/stripe/onboard` | Stripe Connect onboarding link |
| GET | `/api/stripe/status` | Whether the seller can take payments |
| POST | `/api/stripe/dashboard` | Stripe Express dashboard link |
| POST | `/api/stripe/webhook` | Stripe Connect webhook |
| GET | `/s/:store`, `/s/:store/:product` | Public storefront pages |
| GET | `/thanks`, `/d/:token` | Order confirmation and signed downloads |
| GET | `/privacy`, `/terms` | Legal pages for the store listings |

## Licences

Fonts in `server/assets/fonts` (Bricolage Grotesque, DM Sans) are under the SIL Open Font License (`OFL.txt`).
