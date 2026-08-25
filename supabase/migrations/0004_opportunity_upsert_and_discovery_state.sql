-- Unique constraint required for PostgREST upserts on (user_id, content_hash).
DROP INDEX IF EXISTS public.idx_opportunities_user_hash_unique;
ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_user_hash_key;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_user_hash_key UNIQUE (user_id, content_hash);

ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS last_discovery_at timestamptz;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS last_discovery_error text;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS last_discovery_count integer;
