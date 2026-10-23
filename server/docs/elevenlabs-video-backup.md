# ElevenLabs video backup

Runpod remains primary. Only an explicit HTTP 402 on a new Runpod submission
activates this backup. Authentication failures, moderation, network timeouts,
and failures of already accepted jobs do not trigger another paid generation.

## Coverage

- Product clips: Veo 3.1 Fast, 720p, trimmed to the original five seconds.
- Avatar motion: four, five, or eight seconds at 720p or 1080p. Veo generates
  an allowed duration (1080p uses eight seconds), then ffmpeg preserves the
  requested duration and sound preference. Existing voiceovers are still mixed.
- Talking avatars: Aurora at 480p, driven by the same voice audio already made
  for the original job. Aurora does not accept the InfiniteTalk prompt.
- Ten-, twelve-, and fifteen-second motion clips still require Runpod funds;
  they are not silently shortened. ElevenLabs ByteDance access needs separate
  provider approval and is not assumed by this integration.
- Photos, avatar images, and arbitrary owner Studio endpoint calls remain Runpod.

## Configuration on the API service

Use the existing `ELEVENLABS_API_KEY`. It needs Image & Video / Flows permission
and permission to read the subscription. The workspace must have Pro or higher.
No keys go to the mobile/web client.

| Variable | Default | Meaning |
| --- | --- | --- |
| `ELEVENLABS_VIDEO_BACKUP` | disabled | Set exactly `true` to permit new backup jobs. |
| `ELEVENLABS_VIDEO_DAILY_LIMIT` | `10` | Maximum backup attempts per UTC day, shared across all stores. Zero pauses new attempts. |
| `ELEVENLABS_VIDEO_CREDIT_RESERVE` | `50000` | Block new attempts when reported remaining subscription credits are at or below this threshold. |

The reserve is a pre-submission check, not a hard spending budget: provider
charges and other users of the ElevenLabs account can change the balance while
a job is running. The app does not enable overage billing or buy credits.
Failed and uncertain submissions consume a daily slot to avoid retry loops.

Startup logs `[eleven-video] access` with a non-billable permission/subscription
check. `ready:true` confirms list/subscription access, not successful paid
generation or permission to create. A controlled live generation is needed for
that final check. The integration tests use stand-ins, never paid generations.

## Durability and billing

`video_backups` records the original Snapfront job ID, provider generation ID,
model, attempt status, and next poll time. The old `runpod_id` column remains the
legacy external ID slot; the backup table determines which provider to poll.
Existing jobs without a backup row continue on Runpod. Polls are throttled and
collectors prevent overlapping downloads. Provider output is copied to `/data`
before its temporary download link expires.

There is one existing Snapfront credit debit or plan allowance per job, not a
second debit for the backup. The existing refund path restores failed jobs once.
Accepted backup IDs are reused after worker recovery; ambiguous submissions are
never automatically resubmitted. Turning the switch off prevents new backup
submissions while already accepted jobs continue to be collected with the key.

Validation: `node --test test/eleven-video.test.js test/credits-videos.test.js
test/runpod-empty.test.js test/photo-engines.test.js` (Node 22).

Official API references:
- https://elevenlabs.io/docs/api-reference/flows/video/create
- https://elevenlabs.io/docs/api-reference/flows/video/get
- https://elevenlabs.io/docs/eleven-api/guides/how-to/image-and-video/references
