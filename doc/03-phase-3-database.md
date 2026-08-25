# Phase 3 — Database + RLS

Applied through Supabase MCP `apply_migration`.

## Migrations

- `initial_enums`
- `core_user_tables`
- `opportunity_crm_tables`
- `outreach_inbox_ops_tables`
- `indexes_triggers_helpers`
- `row_level_security`
- `security_hardening`

Local copies:

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/0002_row_level_security.sql`

## Notes

- Users can only access their own rows.
- `email_account_tokens`, `oauth_states`, and `job_runs` have RLS enabled and no client policies (service role only).
- Signup creates `profiles`, `user_preferences`, and a free `subscriptions` row.
- Profile `role` cannot be changed by non-admins.

## How to test

Sign up, then confirm a `profiles` row exists for that user in Supabase.
