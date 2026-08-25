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

Gmail callback (production only, not localhost):

- `https://clientra-xi-rouge.vercel.app/api/auth/google/callback`

Supabase Auth Google callback (login only, do not reuse for Gmail):

`https://vltmfdfipjjkkuxrpgki.supabase.co/auth/v1/callback`

Also add to Google authorized JavaScript origins:

- `https://clientra-xi-rouge.vercel.app`

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

## Vercel (this is where API keys must live)

Clientra is a Next.js app. Discovery, website analysis, OpenRouter, Apollo, Adzuna, urlscan, and Gmail OAuth all run on the Vercel server. They read `process.env.*`.

They do **not** read Supabase Edge Function secrets. Putting keys only in Edge Functions → Secrets will not enable urlscan, Apollo, jobs, or AI analysis.

Add the same names in Vercel → Project Settings → Environment Variables. Use Production for the live site. Set Preview too if you want feature-branch deploys to call the APIs.

After adding or changing a key, redeploy (or wait for the next git push) so the new values load.

On Vercel, `NEXT_PUBLIC_APP_URL` and `GOOGLE_REDIRECT_URI` must be the deployed origin, not `http://localhost:3000`.

Example production values (not secrets):

- `NEXT_PUBLIC_APP_URL=https://clientra-xi-rouge.vercel.app`
- `GOOGLE_REDIRECT_URI=https://clientra-xi-rouge.vercel.app/api/auth/google/callback`
- `GOOGLE_REDIRECT_URI_PRODUCTION=https://clientra-xi-rouge.vercel.app/api/auth/google/callback`

## Supabase (database + Auth only)

This project does not deploy or call Supabase Edge Functions. Tables, RLS, and Auth triggers already live in the hosted database.

In the Supabase dashboard, only Auth URLs need to match production:

- Site URL: `https://clientra-xi-rouge.vercel.app`
- Redirect URLs: `https://clientra-xi-rouge.vercel.app/auth/callback`

Also in Google Cloud OAuth:

- Authorized JavaScript origin: `https://clientra-xi-rouge.vercel.app`
- Authorized redirect URI: `https://clientra-xi-rouge.vercel.app/api/auth/google/callback`

## Never expose to the browser

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `GOOGLE_CLIENT_SECRET`
- `URLSCAN_API_KEY`
- `APOLLO_API_KEY`
- `ADZUNA_APP_KEY`
- Gmail refresh tokens
- Any encrypted token column
