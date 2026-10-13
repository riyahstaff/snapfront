# Photo-first Home and Meta marketing release

## Home

The first prominent Home action is now **Snap a product** for a new/default store. It opens the original camera/library composer at `/snap`, preserving AI listing generation and editable product review. A store with a saved setup draft, products or an established design instead gets **Continue my storefront**, which opens the existing five-step setup and restores a saved step when present. All users can still snap another product or browse/design a storefront. Actions sit above the gateway illustration, not below it.

The theme showcase now rotates real catalog thumbnail cards every five seconds while visible, focused and foregrounded. It has manual swipe, previous/next and Pause/Play. Swiping or interacting pauses auto-rotation until Play is pressed. Unknown accessibility preferences, Reduce Motion and a screen reader leave it manual. It stops when less than half the carousel is visible, on route blur/background and on unmount. The end wraps back to the first card. A theme card opens a catalog search for that theme name; it never selects or applies it. The existing gateway artwork has its separate decorative motion control and is not a live theme renderer.

Returning-user detection is based on the currently selected store, not simply the existence of a device signup token. Failed product loading does not fabricate returning activity; saved drafts/applied design remain evidence. Draft and product loads are guarded by selection revisions to avoid carrying one store's state into another.

While the store's draft and product state are unresolved, the primary button displays a non-navigable loading state instead of briefly routing returning users into the new-user flow. If identity/activity cannot be resolved, it offers My store rather than guessing.

## Meta publishing

The new feature connects seller-authorized Facebook Pages and their linked professional Instagram accounts through Facebook Login for Business. This integration does not publish to Facebook personal profiles or personal Instagram accounts. Rendering and writing marketing content remain separate from publication. Sellers review the exact caption, selected destinations and media before approving Publish now or Schedule. TikTok and manual export are retained.

Images/carousels publish to both supported destination types. Video output is explicitly **Instagram Reel / standard Facebook Page video**, not Facebook Reel. Frozen final review includes the actual image(s) or controlled native Reel playback, selected names, exact caption and local/UTC schedule. Each destination has its own durable status, allowing partial success. Unknown final public results are not blindly retried. Published-with-caption-warning responses are shown as warnings and never republished. Disconnect and account deletion stop future jobs; already-public Meta posts are not deleted by Snapfront.

See [Meta publishing setup](meta-publishing-setup.md) for required developer-app settings, server secrets, permission approval and worker activation. Credentials are not embedded in native source. No real social account was connected and no public post was sent during this implementation's isolated validation. A source PR, passing tests and JavaScript bundles are not production activation, device OAuth verification or an app-store release.

## Billing remains unchanged

No Google Play, plan entitlement, Stripe Connect or checkout changes are part of this release. Google's official policy generally requires Google Play Billing for in-app digital goods/services, subscriptions and cloud-software upgrades, unless an applicable policy exception or enrolled alternative-billing program permits otherwise. Therefore the existing Android upgrade integration remains in place; “Google always must process every payment everywhere” is too broad. This is distinct from customers buying sellers' physical products, which are not supported by Google Play Billing.[1]

## Validation and remaining activation work

- **43/43 mobile tests passed**; TypeScript and Expo lint passed.
- **82/82 server tests passed** under Node 22.23.3, including fail-closed mocked Meta transport and isolated temporary databases.
- iOS and Android Hermes JavaScript bundles exported successfully; **not signed APK/IPA builds**.
- Actual React Native components rendered through isolated mock adapters at 320, 390 and 430 px: photo-first action, returning action, offscreen stopping, automatic advancement, Pause/Play, manual next, reduced motion, exact publishing review and cancel/setup-required states verified without external publishing.
- The 23.32-second silent carousel demonstration is a browser capture of actual components using mocked account/native preference adapters and real catalog thumbnails. It is not a physical-device recording.
- No production seller, plan, checkout or public social post was changed. This feature branch/PR is separate from main and has not been merged.
- Before activation: configure the Meta developer app and secrets, approve required permissions, deploy the backend with durable storage and HTTPS, install a new native build, verify real-device OAuth/foreground/accessibility/Reel playback, then deliberately enable publishing. Review the updated privacy policy and Meta obligations before public activation.

## References

[1]: https://support.google.com/googleplay/android-developer/answer/10281818 "Google Play: Understanding the payments policy"
[2]: https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business "Meta Facebook Login for Business"
[3]: https://developers.facebook.com/documentation/instagram-platform/content-publishing "Meta Instagram content publishing"
[4]: https://developers.facebook.com/documentation/pages-api/posts "Meta Facebook Pages post publishing"
