# Snapfront on the web (app.snapfront.app)

The website is the same Expo app as the phone version, built for browsers and served by the API server.

- **Address:** `https://app.snapfront.app`. snapfront.app stays the home page; stores stay at `<slug>.snapfront.app`. "app" is a reserved store address.
- **Same accounts:** the website uses the same API, sign-in token and email sign-in as the phone app, so stores, products and plans follow the person.
- **Looks like a website:** a top menu (`src/web/web-nav.tsx`) on every page instead of the phone's bottom tab bar, a home page with a full-width hero, your store, the tools, themes and the Android app (`src/web/home.tsx`), page title bars and a footer. On narrow screens the menu folds into ☰.
- **Pay first, then the app:** the Get Launch / Get Pro buttons on snapfront.app open `app.snapfront.app/plans?buy=launch|pro`, which goes straight to Stripe Checkout. After paying, the welcome screen asks the buyer to save the plan to their email (6-digit code, prefilled with the checkout email) and links to Google Play (`PLAY_STORE_URL`, default the com.sidebanc.snapfront listing). Signing in to the Android app with that email brings the plan. If the email already has an account, the website purchase moves to it (`webbilling.transferPurchases`). The Android app itself never links to web payment.
- **Plans:** the website sells Launch ($29 one time) and Pro ($14.99/month) with Stripe Checkout on Snapfront's own Stripe account (`server/src/webbilling.js`). Google Play purchases (`playbilling.js`) and Stripe purchases both count; an account gets the best plan from either. The server confirms every checkout with Stripe when the browser returns, on each app sync and in a 30-minute background sweep (renewals, cancellations, refunds). Deleting an account cancels its web subscription. Pro bought on the web is managed through the Stripe billing portal (Plans → Manage subscription).

## Phone app safety

Every web change lives in web-only files, so Android and iOS builds use exactly the same code as before:

- `mobile/metro.config.js` swaps modules **only when building for web**: `expo-secure-store` → `src/web/secure-store.ts` (browser local storage), React Native Web's do-nothing `Alert` → `src/web/alert.ts` (a real dialog), and these screens (`WEB_SCREENS`): root layout → `src/web/root-layout.tsx`, tabs layout → `src/web/tabs-layout.tsx`, Home → `src/web/home.tsx`, Plans → `src/web/plans-screen.tsx`. The web root and tabs layouts mirror the phone's screen lists; when a screen is added to `src/app/_layout.tsx`, add its title to `TITLES` in `src/web/root-layout.tsx`.
- `*.web.ts` files (`billing.web.ts`, `media.web.ts`, `release-info.web.ts`) are picked up by the web build only.
- `mobile/public/index.html` is the web page shell (graphite background, centered column on wide screens).

Verified when this was added: the Android bundle had the same 1,660 modules with identical code and wiring as before (only Metro's internal module numbers differ), 76 app tests, TypeScript and lint pass.

Do **not** add web screens as `src/app/*.web.tsx` route files: Expo Router bundles every route file into the phone app too. Use the Metro swap instead.

## Rebuilding the website

After changing the app, rebuild and commit the web build so Railway serves it:

```sh
cd mobile && npm run build:web    # writes ../server/webapp
```

`server/webapp/assets/node_modules/` holds the icon fonts; `.gitignore` keeps it.
