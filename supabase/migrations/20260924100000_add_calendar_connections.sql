-- Nylas stores the provider OAuth tokens. CivicDesk stores only the opaque grant ID.
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  grant_id TEXT,
  calendar_id TEXT,
  oauth_state UUID UNIQUE,
  oauth_state_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ
);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_connections TO authenticated;
GRANT ALL ON public.calendar_connections TO service_role;
CREATE POLICY "own calendar connection" ON public.calendar_connections
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.deadlines ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;
ALTER TABLE public.deadlines DROP COLUMN IF EXISTS google_event_id;
