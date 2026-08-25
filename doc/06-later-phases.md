# Later phases (6–16) — Foundation in place

These layers exist so remaining APIs can be added without rewriting the app.

## Opportunity / CRM / inbox / campaigns

UI and tables are ready. Empty and not-configured states are used instead of fake live results.

## AI

`lib/ai/` calls OpenRouter through `OPENROUTER_API_KEY` and `AI_MODEL` / `AI_FAST_MODEL` / `AI_REASONING_MODEL`.

## Gmail

- Connect: `/api/auth/google`
- Callback: `/api/auth/google/callback`
- Disconnect: `/api/gmail/disconnect`
- Test send: `/api/gmail/send-test`
- Pub/Sub webhook: `/api/webhooks/gmail` (rejects missing bearer tokens)

Required env names: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_PUBSUB_TOPIC`, `GOOGLE_PUBSUB_SUBSCRIPTION`

Manual Google Cloud setup still required:

1. Authorized redirect `http://localhost:3000/api/auth/google/callback` and `https://clientra.vercel.app/api/auth/google/callback`
2. Gmail API enabled
3. Pub/Sub topic/subscription if using push notifications

## Discovery adapters

`lib/opportunities/` has replaceable adapters:

- urlscan → website discovery
- Apollo `/organizations/search` → companies
- Adzuna jobs API → job opportunities

Unconfigured sources throw `SourceNotConfiguredError` and the UI shows **Not configured**. Social, Google Search, and Brave Search are intentionally not wired yet.

## Background jobs

`lib/jobs/queue.ts` writes to `job_runs`. A worker can be attached later.
