# Environment variables

Never commit values. This file lists names only.

## Public (browser-safe)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

## Supabase (server)

- `SUPABASE_SERVICE_ROLE_KEY`

## AI (server)

- `OPENROUTER_API_KEY`
- `AI_MODEL` — `anthropic/claude-sonnet-5` (outreach, analysis, replies)
- `AI_FAST_MODEL` — `google/gemini-3.7-flash` (scoring, intent, follow-ups)
- `AI_REASONING_MODEL` — `anthropic/claude-opus-5` (deep website analysis)

## Google OAuth for Gmail integration (server)

These are **not** the Supabase Auth Google callback.

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CLOUD_PROJECT_ID` (alias of project id)
- `GOOGLE_CLOUD_PROJECT_NUMBER`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_REDIRECT_URI_PRODUCTION`

Allowed Gmail callback origins:

- `http://localhost:3000/api/auth/google/callback`
- `https://clientra.vercel.app/api/auth/google/callback`

Supabase Auth Google callback (login only, do not reuse for Gmail):

`https://vltmfdfipjjkkuxrpgki.supabase.co/auth/v1/callback`

Also add to Google authorized JavaScript origins:

- `http://localhost:3000`
- `https://clientra.vercel.app`

## Google Pub/Sub (server)

- `GOOGLE_PUBSUB_TOPIC`
- `GOOGLE_PUBSUB_SUBSCRIPTION`

## Website discovery (server)

- `URLSCAN_API_KEY`

## Company discovery (server)

- `APOLLO_API_KEY`

## Job discovery (server)

- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`

## Never expose to the browser

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `GOOGLE_CLIENT_SECRET`
- `URLSCAN_API_KEY`
- `APOLLO_API_KEY`
- `ADZUNA_APP_KEY`
- Gmail refresh tokens
- Any encrypted token column
