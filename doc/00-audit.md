# Clientra — Phase 1 Project Audit

Date: 2026-08-25

This audit was produced before implementation. The repository was a greenfield project.

## 1. Current framework

None existed at audit time. The foundation is now being built on:

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## 2. Current routing architecture

None existed. Target routing:

- Public marketing routes via `app/(marketing)/`
- Auth routes via `app/(auth)/`
- Authenticated product via `app/(app)/`
- Admin via `app/(admin)/`
- API routes via `app/api/`

## 3. Existing authentication

None. Planned: Supabase Auth (email/password + optional Google sign-in for *login only*).

Gmail sending uses a **separate** Google OAuth flow at `/api/auth/google/callback`. It must not use the Supabase Auth callback.

## 4. Existing Supabase configuration

- Project URL is configured via `NEXT_PUBLIC_SUPABASE_URL`
- Project ref: `vltmfdfipjjkkuxrpgki`
- MCP is connected
- Tables: **none**
- Migrations: **none**
- Edge functions: **none**
- Installed extensions: `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`, `plpgsql`

## 5. Existing pages

None.

## 6. Existing components

None.

## 7. Existing database schema

Empty public schema. No application tables.

## 8. Existing environment variables (names only)

Present in `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_PROJECT_NUMBER`
- `GOOGLE_PUBSUB_TOPIC`
- `GOOGLE_PUBSUB_SUBSCRIPTION`

Not yet present; will be added as names/placeholders:

- `GOOGLE_REDIRECT_URI`
- `NEXT_PUBLIC_APP_URL`
- `AI_MODEL`
- `AI_FAST_MODEL`
- `AI_REASONING_MODEL`

## 9. What is already working

- Local environment file with credentials
- Cursor MCP connection to the Clientra Supabase project
- Nothing else (no app, no schema, no auth, no UI)

## 10. What needs to be created

The full Clientra platform foundation, in the phase order defined in `01-implementation-plan.md`.
