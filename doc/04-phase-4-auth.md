# Phase 4 — Authentication and onboarding

## Implemented

- Email/password signup and login
- Supabase auth callback at `/auth/callback`
- Six-step onboarding wizard
- Redirect to `/onboarding` until completed

## Files

- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/auth/callback/route.ts`
- `app/(app)/onboarding/page.tsx`
- `lib/supabase/*`

## Manual configuration

In the Supabase dashboard:

1. Enable Email auth.
2. Add redirect URL `http://localhost:3000/auth/callback` (and the production URL later).
3. Optional: enable Google for *login only* using the Supabase callback `https://vltmfdfipjjkkuxrpgki.supabase.co/auth/v1/callback`. Do not reuse that URL for Gmail sending.

## How to test

1. Sign up with email/password.
2. Complete onboarding.
3. Confirm you land on `/dashboard`.
