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

## Docs

Step-by-step implementation notes live in `doc/`.

## Important

- Never put server secrets in `NEXT_PUBLIC_*` variables.
- Gmail callback: `/api/auth/google/callback`
- Supabase Auth callback: `/auth/callback` and the Supabase-hosted `/auth/v1/callback`
- Unconfigured APIs show **Not configured** instead of fake data.
