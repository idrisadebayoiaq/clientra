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

1. Authorized redirect `https://clientra-xi.vercel.app/api/auth/google/callback` only (do not use localhost for Gmail)
2. Gmail API enabled
3. Pub/Sub topic/subscription if using push notifications

## Discovery adapters

`lib/opportunities/` has replaceable adapters:

- urlscan → website discovery
- Hacker News Algolia → problem posts (public official API, no extra key)
- Apollo `/organizations/search` → companies
- Adzuna jobs API → job opportunities

Unconfigured sources throw `SourceNotConfiguredError`. Facebook, Instagram, LinkedIn, X, and Outlook stay copy-and-open-profile only.

## Background jobs

`lib/jobs/queue.ts` writes to `job_runs`. A worker can be attached later.
