ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS last_job_discovery_at timestamptz;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS last_website_discovery_at timestamptz;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS last_apollo_discovery_at timestamptz;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS last_problem_discovery_at timestamptz;
