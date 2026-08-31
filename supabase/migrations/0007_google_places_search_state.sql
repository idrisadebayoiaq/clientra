-- Track Google Places already shown to a user and pagination state per search.
CREATE TABLE IF NOT EXISTS public.google_places_seen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  place_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);

CREATE TABLE IF NOT EXISTS public.google_places_search_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_key text NOT NULL,
  category text NOT NULL,
  location text NOT NULL,
  next_page_token text,
  last_batch_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, search_key)
);

CREATE INDEX IF NOT EXISTS idx_google_places_seen_user ON public.google_places_seen(user_id, place_id);
CREATE INDEX IF NOT EXISTS idx_google_places_sessions_user ON public.google_places_search_sessions(user_id, search_key);

ALTER TABLE public.google_places_seen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_places_search_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS google_places_seen_own ON public.google_places_seen;
CREATE POLICY google_places_seen_own ON public.google_places_seen
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS google_places_sessions_own ON public.google_places_search_sessions;
CREATE POLICY google_places_sessions_own ON public.google_places_search_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
