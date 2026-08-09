-- Board alerts: emails to ping when new bounties post. Server-only table —
-- no client grants, no policies; all access goes through service role.
CREATE TABLE IF NOT EXISTS public.board_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS board_alerts_email_key ON public.board_alerts (lower(email));
ALTER TABLE public.board_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.board_alerts FROM authenticated;
REVOKE ALL ON public.board_alerts FROM anon;
GRANT ALL ON public.board_alerts TO service_role;
