# Phase 2 — Application shell + navigation

## Implemented

- Next.js App Router with marketing, auth, app, and admin route groups
- Marketing header/footer
- Authenticated sidebar matching the product IA
- Shared UI primitives (button, card, badge, inputs, tabs, score, empty/error/not-configured)

## Files

- `app/layout.tsx`, `app/globals.css`, `middleware.ts`
- `components/layout/*`, `components/ui/*`
- `app/(marketing)/*`, `app/(auth)/*`, `app/(app)/*`, `app/(admin)/*`

## Env

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

## How to test

1. `npm run dev`
2. Open `/` and walk header links.
3. Open `/login` (unauthenticated app routes should redirect here).
