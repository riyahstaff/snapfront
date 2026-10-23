# ElevenLabs image backup

When a new Runpod image submission returns HTTP 402, the shared image router switches to ElevenLabs. This covers avatar portraits, photo blends, outfit changes, avatar/product composites, standard and premium lifestyle photos, synchronous photo edits, image-assistant jobs, and Mira's digital-product artwork. Videos continue through the separate video backup.

Reference photos are read from local Snapfront storage after callers validate ownership, converted to bounded JPEG references, and sent inline to ElevenLabs. Both photos in a blend are retained. Prompts, negative instructions and aspect ratios are retained; requested 2K/4K resolutions are mapped to ElevenLabs values. Only known image endpoints and configured photo-engine aliases qualify. Arbitrary remote reference URLs are rejected.

## Configuration

- `ELEVENLABS_API_KEY`: existing key with Image & Video / Flows access.
- `ELEVENLABS_IMAGE_BACKUP=true`: enables new image fallbacks.
- `ELEVENLABS_IMAGE_MODEL=gemini-3-pro-image`: default; `gemini-3.1-flash-image` is also supported. Both accept text and reference images.
- `ELEVENLABS_IMAGE_DAILY_LIMIT`: default 10, across all image backups. Failed and uncertain submissions count; zero pauses new submissions.
- `ELEVENLABS_IMAGE_CREDIT_RESERVE`: defaults to the video reserve, otherwise 50000. Refuses new submissions when remaining credits are at or below the reserve. This is a preflight threshold, not an exact per-job cost reservation.

Startup logs `[eleven-image] access` with enabled/ready status and remaining credits using non-billable API requests. No keys, prompts or reference-image bytes are logged.

The existing `image_backups` table and `eleven-image:` IDs remain compatible with portrait jobs from the previous deployment. Additional cache/poll columns migrate additively. Accepted jobs are polled on their original provider, including after disabling new backups. The signed output URL is refreshed after 45 minutes and results are copied to Snapfront's existing storage. Failed backups do not trigger the automatic second blend model or image-assistant regeneration. Switching preserves the caller's single credit/allowance charge and existing failure refunds. Ambiguous POSTs are never automatically repeated.

## Verification

`node --test server/test/eleven-image.test.js server/test/avatars.test.js server/test/photo-engines.test.js server/test/image-assistant.test.js server/test/eleven-video.test.js server/test/runpod-empty.test.js`

Tests use mocked providers and a real temporary SQLite database. No paid generations are started by tests or startup checks.

API contracts:
- https://elevenlabs.io/docs/api-reference/flows/image/create
- https://elevenlabs.io/docs/api-reference/flows/image/get
