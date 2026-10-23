# Owner marketing autopilot

The owner-only AI Marketing Center now includes an Autopilot tab. This runs on the existing live Render service, not on the owner's phone, and does not require n8n or another hosting subscription.

## One-time setup

1. Open AI Marketing Center → Autopilot in the owner account.
2. Create or choose a campaign describing the audience and goal.
3. Connect and select the Facebook Pages / Instagram professional accounts to publish to. Leave social times blank to run blog articles only.
4. Set the timezone, daily social times, article weekdays/time, and AI writing call limit.
5. Confirm standing authorization and choose Enable Autopilot. Individual items no longer need manual approval.

The suggested schedule is 09:00 and 18:00 social videos daily, and 10:00 articles on Tuesdays and Fridays, America/New_York. These are editable defaults, not an automatically enabled production campaign. Deployment alone never chooses an audience or enables publishing.

## How it runs

The live server checks SQLite every 30 seconds and prepares slots up to 30 minutes early. Each slot has a unique store/kind/local-date/time key, a durable state, a renewable lease, a campaign reference, and a settings revision. Daylight-saving time follows the configured timezone; nonexistent spring-forward times are skipped and repeated fall-back times run once.

A social slot writes one caption and narrated script, queues an idempotent brand video in the existing faceless worker, registers the completed media, and submits to the existing Meta publishing queue. Videos use Snapfront's promotional visuals, local Kokoro narration, and FFmpeg at 1080×1920; they do not use paid Runpod or ElevenLabs video generation. A blog slot writes and schedules a substantive article through the existing blog publisher.

AI writing still has provider charges. The default is four API calls per UTC day for automation, configurable from one to six, also subject to the account's existing Marketing Center daily limit. Reservations happen before requests; failed attempts count. Automated writing disables SDK and helper retries so a reservation makes at most one provider request. A slot can retry a transient writing failure once, subject to the same daily cap. This is a call limit, not a guaranteed dollar budget.

Generated content is checked for required fields, article length, narration length, unsupported earnings/pricing claims, and unexpected links or markup. These checks reduce obvious problems but are not an exhaustive fact checker. Changed drafts, invalid content, disconnected/expired destinations, and exhausted limits are held or failed visibly. There is no automatic outreach, cold email, paid advertising, or publishing to other networks in this release.

## Pause and recovery

Pause revokes the settings revision and cancels pending automated publications that have not begun processing. A publish already in progress cannot reliably be recalled; the interface reports it. Paid writing already in flight may finish, but a revision check prevents it from approving content after pause. Local video rendering already started may finish without publication.

After a restart, valid leases prevent duplicate work; expired leases can resume. A slot missed by more than two hours is skipped instead of creating a catch-up burst. Publication and the submitted checkpoint share a transaction; the Meta queue handles uncertain external outcomes without replaying them. Settings changes can reuse canceled future slots, but never replay sent slots. Standby replicas do not start the automation worker.

The activity list shows the latest 60 slots, connected-destination delivery status, errors, and links to their content. Advanced attribution, external outreach, and additional social networks remain separate future work.

## Validation

Integration tests cover owner/store authorization, standing consent, timezones/DST, duplicate prevention, daily limits, pause during an in-flight writer response, bounded provider calls/retries, content holds, expired connections, lease recovery, and automatic article/social approval. A separate provider-free test renders and decodes a real narrated MP4 with the production renderer, using a synthetic test voice. Live paid generation and real social posting are not part of deployment verification.
