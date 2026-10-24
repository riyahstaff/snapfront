# Comfy Router: owner-only product clip pilot

This is a gated **additional provider** for the existing Snapfront AI Media product-photo-to-video tool. It does not replace RunPod or ElevenLabs.

## What is implemented

- Comfy model discovery: `GET /api/admin/owner/comfy/models` and `GET /api/admin/owner/comfy/schema?model=wan/wan2.6-i2v`. Both require the signed-in Snapfront owner.
- Video submit: `POST /api/ai-media` with `kind:"video"`, an owned `image_file`, a preset or prompt, and `video_provider:"comfy"`.
- Five image-to-video engines are available for the owner in the existing Video engine selector: Wan 2.6, Wan 2.7, MiniMax H3, Seedance 2.5, and Kling Video O1. Each maps the product photo, motion prompt, and five-second duration into that model's documented native Comfy Router input schema. Generated MP4s are extracted using the model-specific result schema, avoiding confusion with image thumbnails.
- Only the Snapfront owner may select Comfy. Each submission has a durable, unique idempotency key saved in the existing media job. The submitted Comfy request ID is saved and polled without re-submitting the job.
- On successful completion, the video is copied into Snapfront's existing /data media store. Accepted jobs can still be polled after new submissions have been disabled.
- The existing Snapfront plan allowance and failure refund path are reused. Owner media remains free in Snapfront accounting, **but Comfy credits are billed to the owner's Comfy workspace**.
- Existing RunPod default, ElevenLabs backup, and all other image/avatar generators are untouched.

## Render environment

- `COMFY_API_KEY`: required; store on Render, never in client code or Git.
- `COMFY_ROUTER_ENABLED`: **defaults disabled**. Set exactly `true` only for an approved test.
- `COMFY_ROUTER_DAILY_LIMIT`: **defaults to 0** (no paid requests). Set `1` for a controlled first paid test, up to a hard maximum of 10. Attempts consume slots even if a provider rejects the request, to prevent automatic repeated spending.

The Comfy provider is offered in the AI Media screen **only when all three conditions are true**: the signed-in account is a configured Snapfront owner, the feature flag is enabled, and the daily limit is nonzero. Other members continue using the original provider.

## Testing and safe rollout

1. Review draft PR and run `npm --prefix server test` plus the web/client build. Tests mock Comfy and do not charge provider credits.
2. Confirm a Comfy Developer Platform balance. Last observed balance was **0**, so a paid generation is not currently possible.
3. Deploy to a safe staging environment, verify owner-only catalog access and missing-key behavior; verify members cannot request Comfy.
4. Set `COMFY_ROUTER_ENABLED=true`, `COMFY_ROUTER_DAILY_LIMIT=1` only after approving a single paid job. Generate one owner video; inspect provider cost, quality, duration and saved-media URL.
5. Keep Comfy owner-only until pricing, daily spend caps, customer credit debits and model-specific costs are confirmed.

**Ambiguous submission handling:** a network timeout may happen after Comfy has accepted and billed a job. The client explicitly does **not** automatically re-submit a new generation. Reconcile such submissions in Comfy Activity before retrying.

Reference: https://docs.comfy.org/development/comfy-router/models/wan/wan2-6-i2v/code

## Business billing: separate Snapfront and provider ledgers

Snapfront customer credits are **not** Comfy credits and cannot be transferred into Comfy by a Stripe payment. The customer's purchase increases the existing Snapfront `credit_ledger`; provider bills its own Comfy credit balance separately. Never expose `COMFY_API_KEY` to customers.

**This five-model rollout is owner-only.** Before opening a model to customers, measure actual charges and set server-side credit prices per model, charge Snapfront credits transactionally before submitting, refund once when a job fails, and show the customer the price. Track owner/provider cost and gross margin per job; stop or fall back only when a submission is definitely rejected and the customer has opted into that fallback. The daily limit remains in force. Comfy top-ups and optional subscription payments are handled by Comfy's checkout (Stripe is supported), but **automatic threshold-based Comfy credit replenishment has not been verified**. Do not claim that funding will refill automatically without confirmation from Comfy.

Prices must be verified against live Comfy model catalog before accepting customer-paid generations. Existing RunPod stays an option.
