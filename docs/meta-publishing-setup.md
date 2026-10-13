# Meta seller publishing setup

This backend is **inactive by default**. It does not connect an account or publish anything until the Snapfront owner configures a Meta app, deploys the required environment variables on a persistent server volume, completes Meta approval where required, and explicitly sets `META_PUBLISHING_ENABLED=true`. Implementing these routes is not live-account verification.

## Create and configure the Meta app

Create a **Business** type Meta app. Add **Facebook Login for Business**, **Instagram API setup with Facebook login**, and **Webhooks**. In Facebook Login for Business, create the configuration used for a **user access token** and save its configuration ID as `META_LOGIN_CONFIG_ID`.

Set the following fixed HTTPS URLs in the Meta App Dashboard. Do not add a development callback that points to a phone, a local tunnel, or a client-supplied URL.

| Meta setting | Exact URL |
|---|---|
| Facebook Login for Business → Valid OAuth Redirect URI | `https://YOUR_PUBLIC_SERVER/social/meta/callback` |
| Deauthorize Callback URL | `https://YOUR_PUBLIC_SERVER/social/meta/deauthorize` |
| Data Deletion Request URL | `https://YOUR_PUBLIC_SERVER/social/meta/data-deletion` |
| Privacy Policy URL | `https://YOUR_PUBLIC_SERVER/privacy` |

The server always constructs an OAuth code flow with the fixed callback above, a cryptographically random one-use state, `config_id`, and the Graph version below. It redirects the installed app only to `snapfront://marketing?social=connected` or `snapfront://marketing?social=error`; the mobile client cannot supply a redirect URL.

The requested permissions are `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_manage_engagement`, `publish_video`, `instagram_basic`, and `instagram_content_publish`. Sellers must have a Page task that permits creating content. For Page video, `publish_video` and the relevant Page permissions must be approved. A linked Instagram account must be a Professional (Business or Creator) account connected to a Facebook Page. Page Publishing Authorization can also block an otherwise connected Instagram destination, so sellers should complete it before scheduling posts.

Meta's documented discovery call is `GET /me/accounts?fields=id,name,access_token,instagram_business_account`; Snapfront also requests tasks and accepts only destinations with `CREATE_CONTENT` or `MANAGE`. Discovery pagination is bounded and cursor-based. The server exchanges the code-flow token for a long-lived **User** token before discovery, then validates the app identity of that User token and every selected **Page** token with `debug_token`. When discovery omits an Instagram username, it reads the linked professional account's username for display only. No token or debug response is returned to the app.

## App review, verification, and deployment

Development-mode apps only work for people with roles on the Meta app. Before serving ordinary sellers, submit the requested permissions/features for **App Review**, provide a working screencast that shows the seller-owned connection and reviewed posting workflow, and complete any **Business Verification** Meta requires. Keep the app in development mode and leave publishing disabled until those approvals are complete. Do not claim that a test seller or a live Page was verified until the owner has performed that check.

Deploy behind a public HTTPS origin. Meta retrieves Instagram image/video URLs during publishing, so `PUBLIC_URL` must be an HTTPS URL reachable from Meta. Snapfront rejects OAuth and publishing configuration when it is not HTTPS. The Graph version defaults to `v26.0`; pin it during the supported Meta version window and intentionally upgrade after testing.

The Node service and SQLite database must share a **durable mounted volume** at `DATA_DIR`. That volume holds encrypted seller tokens, consumed OAuth-state records, frozen render ownership records, Instagram container IDs, Facebook upload handles, and queue leases. An ephemeral deployment can lose that state after a restart and must not be activated for seller publishing.

## Environment variables

```bash
# The deployed public origin, no trailing slash. It must be HTTPS for Meta.
PUBLIC_URL=https://api.example.com
DATA_DIR=/persistent/snapfront-data

META_APP_ID=123456789012345
META_APP_SECRET=replace-with-Meta-app-secret
META_LOGIN_CONFIG_ID=replace-with-Facebook-Login-for-Business-config-id
# Generate exactly 32 random bytes, base64 encoded. Never reuse DOWNLOAD_SIGNING_SECRET.
META_TOKEN_ENCRYPTION_KEY="$(openssl rand -base64 32)"
META_GRAPH_VERSION=v26.0
# Leave false through setup/review/deployment; set true only for deliberate activation.
META_PUBLISHING_ENABLED=false
```

`META_TOKEN_ENCRYPTION_KEY` must decode to exactly 32 bytes. Snapfront uses AES-256-GCM and has **no development fallback key**. Missing, malformed, or changed keys make the integration unavailable rather than attempting to decrypt with another key. Tokens never appear in account, post, or error API responses.

The code-flow token is not stored for publishing. Snapfront persists the long-lived User token and the independently issued Page token as separate encrypted values, together with their token and data-access expiry values returned by Meta. Expiry is not a promise of availability: a revoked or expired credential is immediately treated as `reconnect_required`. Reconnect through the seller-owned OAuth flow; never edit the database, reuse a copied access token, or assume that an older Page token has the User token's lifetime.

The publishing worker starts only in the real Node server process and only when all values above are valid and `META_PUBLISHING_ENABLED=true`. Imported test apps start no worker. The queue uses SQLite atomic claims, a capped in-flight set, and finite leases. A lease lost during safe work—Instagram container creation/polling or a Facebook upload step—can be requeued with its persisted handles. Once Snapfront has persisted the final public-publish boundary, an expired lease, transport loss, or unconfirmed final result becomes `uncertain`; it is not automatically replayed. Operators and sellers must check Meta before creating another post.

## Supported publishing behavior

Snapfront accepts only server-generated, seller-owned registered media renders. It never fetches a URL supplied by the app. Images must be JPEG and current Instagram feed ratios must be in the supported 4:5–1.91:1 range; generated video files must be MP4. Instagram uses the documented container → bounded status polling → `media_publish` sequence. It polls at most once a minute and for at most five polls. The authoritative Instagram publishing-limit endpoint is checked before container creation **and again immediately before** `media_publish`; an incomplete quota response is blocked rather than guessed. A quota-full destination waits and is checked again later. Meta's terminal `CAPTION_NOT_ATTACHED` configuration issue is recorded as a published-with-warning result, never replayed.

Facebook Page single-image publishing uses `POST /{page-id}/photos`. A Facebook carousel uploads every owned image with `published=false`, persists those photo IDs, then creates **one** `POST /{page-id}/feed` with `attached_media[n]`; it does not create several independent public photos. Facebook Page video uses a resumable upload session with the long-lived **User** token in the upload request, followed by `POST /{page-id}/videos` using the **Page** token. This is Page-video publishing, not a claim of Facebook Reels support. Instagram supports owned image carousels of up to ten items and uses the User token for quota/container/final Instagram API calls.

A seller explicitly queues every destination after review. Rendering, AI copy, Save/Share, and TikTok export do not enqueue or publish anything. Each target receives a frozen caption, selected destination, and registered media-file snapshot. A caption must be a non-empty reviewed string (outer whitespace is normalized; its reviewed content is otherwise retained) and at most 2,200 characters. A schedule must be an ISO 8601 timestamp **with a timezone**, in the future and no more than 90 days away; the app should show the exact local/UTC conversion before approval. The client idempotency key returns original target rows only when the complete normalized request—including render, caption, destinations, and schedule—is identical, even if that once-future schedule has since passed. Reuse with changed caption, destinations, render, or schedule returns a conflict.

## Privacy and incident handling

Meta posts signed deauthorize and data-deletion callbacks as `signed_request`. Snapfront validates the HMAC-SHA256 signature with `META_APP_SECRET` before deleting matching connected destinations; malformed or unsigned callbacks do not clean up retained data. Connection deletion cascades queued/history publishing records and jobs, removes stored encrypted tokens, and cancels any in-flight worker through its next lease check. The data-deletion endpoint responds with Meta's required `{url, confirmation_code}` object; its status page contains only the completion state.

Before activation, review the app's public privacy-policy URL, data-deletion URL, permission rationale, Data Use Checkup/review status, and the actual deployed HTTPS callback URLs with the owner. Confirm a seller can see only public account metadata, can disconnect a destination, and can request deletion. Never put access tokens, OAuth codes, raw Graph errors, app secrets, or secret-bearing media URLs in screenshots, support tickets, analytics, or seller-facing responses.

If Meta returns an expired/revoked-token signal, the destination is marked `reconnect_required`. A definitive pre-publication rejection is recorded as a failure and may be retried only when marked safe. Expected network failures after the final public-publish boundary are `uncertain`, not retried. Do not activate merely because automated tests pass: Meta approval, verified seller-owned destinations, persistent storage, HTTPS reachability, and an owner-run live verification are separate activation gates.

## References

- [Facebook Login manual server-side code flow](https://developers.facebook.com/documentation/facebook-login/guides/advanced/manual-flow)
- [Facebook Login for Business and Page/Instagram discovery](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-facebook-login/business-login-for-instagram)
- [Instagram Content Publishing, limits, media containers, and polling](https://developers.facebook.com/documentation/instagram-platform/content-publishing)
- [Pages Posts, permissions, photos, and scheduling](https://developers.facebook.com/docs/pages/publishing/)
- [Video API publishing and resumable upload handles](https://developers.facebook.com/documentation/video-api/guides/publishing)
- [Meta data-deletion callback contract](https://developers.facebook.com/documentation/development/create-an-app/app-dashboard/data-deletion-callback)
