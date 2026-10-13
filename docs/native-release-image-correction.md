# Native release identification and theme-image correction

## What the user observed

The phone showed the original violet **Snap** tab, “Snap a photo. Get a storefront.” headline and camera panel rather than Liquid Chrome Home. Store look cards also appeared as blank canvases. The owner supplied Play Console evidence that **version code 21 (1.0.0)** was active and available on the correct internal testing track. The upload/track choice was therefore correct.

## Artifact findings

The downloaded signed version-21 AAB contains package `com.sidebanc.snapfront`, native version code `21`, version name `1.0.0`, and the new compiled Home. Its embedded JavaScript is identical to the version-20 preview APK. Both include `Your vision.`, `Beautifully built.`, `ChromeHero`, `ThemeCarousel`, and the new preview component; neither contains the historical Home headline. The shipped native manifest disables Expo updates. Account state and storefront themes cannot restore the deleted Home route or old tab label/color system.

The screenshot matches historical native code from the earlier version-15 release and its ancestors. This is strong evidence of an older/same-named installation being opened, but the **actual installed package/version on the handset has not yet been supplied**. A historical package migration from `com.snapfront.app` to `com.sidebanc.snapfront` is another possible explanation for a same-named older app, not a confirmed cause. Availability on a test track does not establish which binary is currently running on a phone. Do not report a wrong upload or a confirmed Play cache issue without device evidence.

The live API returned 105 themes. All four featured premium preview URLs tested returned HTTP 200 `image/webp`. The old picker lacked the new real-image component. This explains why updating the catalog on the server does not retrofit the modern picker into an older installed binary. There is no confirmed live server thumbnail outage in the checks performed.

## Corrective release

The display version is now **1.0.1**. Home shows the **actual installed native version and build code**; Settings → About additionally shows the package ID and named Liquid Chrome release. This uses `expo-application` runtime native values rather than guessing from the Expo project or Play track metadata.

All **105 actual renderer thumbnails (20 classic + 85 premium)** are now copied into the app bundle with static Metro imports. The shared component used by Home carousel, Store look and wizard chooses these local images first. It supports HTTPS thumbnails for future catalog entries and can fall back to remote if a bundled decode fails. If both fail, it displays an explicit unavailable state and Retry image control; retry never selects/applies a look. The 20 original classic themes now also have screenshot previews of the actual renderer with clearly illustrative sample product imagery, rather than empty schematic blocks; their storefront definitions and behavior are unchanged. Unknown classic looks can still fall back to the schematic renderer. Catalog assets remain illustrative and never become seller cover photos or inventory.

The public `/api/themes` read no longer waits for seller bootstrap or SecureStore. Seller authentication is still required for all existing seller operations. The theme catalog itself still needs connectivity to refresh; packaging thumbnails does not make all app operations offline.

No camera, store-draft, product, billing, signing-key, native-package or backend infrastructure behavior was changed. No seller data was deleted and no Play submission, rollout or attestation was performed.

## Verified before signing

- 50 native regressions pass, including image mapping/byte parity, local-first fallback, installed-build identity and public catalog independence.
- TypeScript and Expo lint pass; Android export passes with the new markers and all static image references.
- Mock-only browser checks load all 105 unique genuine thumbnails over eight premium and two classic picker pages and four Home carousel thumbnails with external requests blocked. Browsing leaves the selected classic look unchanged. This is component validation, not a claim of installed-device validation.
- `mobile/scripts/verify-android-artifact.py` verifies the downloaded AAB's native package/version/code, required compiled modern-Home/carousel/release/error markers, absence of old Home strings, ZIP integrity, all 105 thumbnail byte hashes and chrome-hero bytes. It intentionally rejects an older 1.0.0 artifact. A passed artifact gate is not Google Play review or a malware scan.

## Non-destructive phone verification

Use the enrolled Google account to open your **existing internal tester link**, then select Update in Google Play if offered. After installation completes, force-stop Snapfront through Android Settings and reopen it; force-stop does not clear local drafts. In the corrective release, the Home badge and Settings → About identify the running binary as **1.0.1 / its new build code**.

If Play only offers Open, confirm the tester account and compare the phone's installed version code with the active track. The old and v21 releases share the display version 1.0.0, so that name alone is ambiguous. Do not uninstall, clear data or regenerate signing keys merely to troubleshoot. If more than one Snapfront is installed, collect its package identity before changing anything.

For a USB-debugging diagnosis, the following are read-only:

```sh
adb shell dumpsys activity activities | grep -m1 -E 'mResumedActivity|topResumedActivity'
adb shell 'for p in com.sidebanc.snapfront com.snapfront.app; do echo "===== $p ====="; dumpsys package "$p" | grep -E "versionCode=|versionName=|lastUpdateTime|installerPackageName"; done'
adb shell pm list packages | grep -i snapfront
```

A confirmed foreground `com.sidebanc.snapfront` at version code 21 or the corrective code showing old Home after a cold relaunch would contradict the downloaded artifact and needs examination of the actually installed package/splits—not another speculative UI change.

## Developer maintenance

Regenerate the static image map/premium copies with `node mobile/scripts/package-theme-thumbnails.mjs` after approved renderer previews change. Validate a finished signed correction with `python3 mobile/scripts/verify-android-artifact.py <bundle.aab> --version-code <actual-code>`. No dynamic require paths: static imports ensure EAS/Metro includes each image in the signed artifact.
