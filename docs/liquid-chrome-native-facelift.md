# Liquid Chrome × Noir Atelier native facelift

The selected design is implemented in the existing Snapfront Expo SDK 57 app: graphite backgrounds, platinum actions, polished chrome artwork, and the aperture/storefront-doorway emblem from Noir Atelier. At the user's request, the emblem now has a brushed silver/platinum chrome finish matching the gateway on Home rather than copper. The same silver mark replaces the previous blue/yellow branding in Home, native navigation, onboarding, app launcher, Android adaptive/themed icons, splash, and favicon. The emblem silhouette, graphite icon background, interface, motion and app behavior are preserved; the small copper editorial text accents remain unchanged.

## What changed

Home is now a creative-commerce dashboard with a cinematic chrome hero, a Build/Continue storefront action, the current store’s saved setup step, and a discovery rail from the actual theme catalog. Theme totals are read from the API, not fixed marketing counts. Discovery opens the existing catalog; it never automatically selects or applies a theme. Product, studio, assistant, sourcing, store and order shortcuts remain real native routes. Concept artwork is clearly labeled and does not pretend to be seller inventory.

The original photo-to-product composer now lives at `/snap`, one tap from Home. Its camera/library, hint, physical/digital, price, AI-generation and draft behavior are preserved. My Store, Marketing, empty Draft and wizard add-photo actions point directly to the relocated composer. Find, Assistant, Create, My store, hidden Trends, and secondary features remain available.

Shared controls use consistent chrome typography, outlined surfaces and platinum primary actions. Buttons and form controls have generous touch targets; button text can wrap. Cover-upload controls and the local review summary use solid dark text plates for readable contrast over arbitrary seller photos. Theme artwork retains its own storefront colors.

## Opening motion

The hero artwork has a 650 ms opacity/vertical entrance and a subtle 14-second up/down drift cycle. These are native `Animated` transforms, not a generated video or a screen recording playing inside the app. Headlines, buttons and other operational content never move or wait for the entrance. The animation uses the native driver and non-interaction timing.

The hero remains static until the initial Reduce Motion preference is known, honors live setting changes, offers Pause/Play, and stops on route blur, app background, Android notification-drawer blur and unmount. Resuming does not replay the entrance. No launch interstitial was added.

## Reliability fix

Cold-start seller/token creation is now single-flight: simultaneous root/Home/catalog requests share one initialization promise. A failed initialization releases the promise so a later retry can work. This prevents duplicate seller creation caused by concurrent first-launch requests.

## Verified in this workspace

- **32 native regression tests passed**, including the existing 105-theme/draft/store-ownership cases and new motion lifecycle, contrast, navigation, native identity and cold-start cases.
- **TypeScript and Expo lint passed**, and `git diff --check` is clean.
- **Final iOS and Android JavaScript/Hermes bundle exports passed** after the review fixes.
- **74 backend regression tests passed** using isolated test data. No backend source, storefront theme definitions, billing, Stripe, infrastructure or seller records were changed during validation.
- An isolated harness rendered the actual Home, ThemePicker and PhotoComposer components through React Native Web, with mocked platform adapters, fixture workspace data and local catalog thumbnails. Home layouts at 320/390/430 px had no page-level horizontal overflow; Pause/Play, catalog search and photo-input navigation worked with no page errors. Browser Reduce Motion displayed the static state. These screenshots are **component previews, not native-device screenshots**.
- Launcher icon is 1024×1024 opaque PNG. Android foreground and monochrome icons are 1024×1024 with alpha and safe central placement. The 1200×900 JPEG hero is about 183 KiB; high-resolution generation masters are kept outside the runtime source tree.

## Build and delivery boundaries

A new signed native build is required for the launcher/splash and added `expo-system-ui` configuration. No EAS build, OTA update, App Store/Google Play submission or release was initiated. Real-device verification of camera/library permission flows, native navigation/header rendering, large text, billing modules and foreground/Reduce Motion behavior remains necessary before release. Existing package identifiers, EAS project ID, API URL and permissions are preserved.

`expo install --check` reported newly available patch versions for Expo, Router, Sharing and Splash (57.0.28, Router 57.0.26, Sharing 57.0.23 and Splash 57.0.10). The original project’s patch levels were retained rather than broadening this facelift into an SDK upgrade. The added system-UI and web packages were installed using Expo’s SDK-compatible installer; the lockfile is included. Existing dependency peer/security warnings require a separate dependency-maintenance pass; no force-upgrade was performed.

The update is on `feature/liquid-chrome-facelift`. GitHub initially returned **HTTP 401: Bad credentials** when preparing the PR, so publication paused and the source was saved locally. On October 12, 2026, a fresh check confirmed that the GitHub connector was enabled and repository access had recovered with push permission. The approved silver-logo facelift is now being published as a separate reviewable PR; no automatic merge or native release is authorized. The earlier native-picker PR remains separate from this facelift.
