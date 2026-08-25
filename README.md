# Clientra

Clientra is an AI client acquisition engine for freelancers, developers, agencies, and other service providers.

It is not a freelancer marketplace.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Supabase Auth + Postgres + RLS
- OpenRouter for AI
- Separate Google OAuth for Gmail (not the Supabase Auth callback)

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. `npm install`
3. `npm run dev`

Open http://localhost:3000

## Deploy on Vercel

Import [the GitHub repo](https://github.com/idrisadebayoiaq/clientra) in Vercel. Framework is Next.js (`vercel.json`). Add the environment variables from `.env.example` in **Project Settings → Environment Variables** for Production (and Preview if you want preview deploys to work).

Required for the app and auth:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` — production origin, e.g. `https://clientra.vercel.app`
- `SUPABASE_SERVICE_ROLE_KEY`

Required for AI, discovery, and Gmail:

- `OPENROUTER_API_KEY`
- `URLSCAN_API_KEY`
- `APOLLO_API_KEY`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` — `https://clientra.vercel.app/api/auth/google/callback`
- `GOOGLE_REDIRECT_URI_PRODUCTION` — same production callback

Recommended:

- `AI_MODEL` — `anthropic/claude-sonnet-5`
- `AI_FAST_MODEL` — `google/gemini-3.7-flash`
- `AI_REASONING_MODEL` — `anthropic/claude-opus-5`
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_PROJECT_NUMBER`
- `GOOGLE_PUBSUB_TOPIC`
- `GOOGLE_PUBSUB_SUBSCRIPTION`

Never put server secrets in `NEXT_PUBLIC_*`. After the first Vercel URL exists, also add `https://clientra.vercel.app/auth/callback` (and your custom domain, if any) to Supabase Auth redirect URLs, and the Gmail callback to Google Cloud OAuth.

## Docs

Step-by-step implementation notes live in `doc/`.

## Important

- Never put server secrets in `NEXT_PUBLIC_*` variables.
- Gmail callback: `/api/auth/google/callback`
- Supabase Auth callback: `/auth/callback` and the Supabase-hosted `/auth/v1/callback`
- Unconfigured APIs show **Not configured** instead of fake data.
