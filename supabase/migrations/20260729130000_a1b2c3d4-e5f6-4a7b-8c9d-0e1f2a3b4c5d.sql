-- Multiple TikTok accounts per clipper. Deliveries no longer hard-block on
-- the posting account: known accounts auto-verify, new ones are auto-linked
-- as 'unverified' and flagged for review; staff approval promotes them to
-- 'trusted'.

CREATE TABLE IF NOT EXISTS public.tiktok_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text NOT NULL CHECK (handle ~ '^[a-z0-9_.]{2,24}$'),
  status text NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'trusted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, handle)
);

GRANT SELECT, INSERT, DELETE ON public.tiktok_accounts TO authenticated;
GRANT ALL ON public.tiktok_accounts TO service_role;
ALTER TABLE public.tiktok_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own accounts select" ON public.tiktok_accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Users may add accounts but never self-mark them trusted.
CREATE POLICY "own accounts insert" ON public.tiktok_accounts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'unverified');
CREATE POLICY "own accounts delete" ON public.tiktok_accounts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Seed: profile handles and handles already used on submissions are trusted
-- (they predate this system and were the basis of past payouts).
INSERT INTO public.tiktok_accounts (user_id, handle, status)
SELECT id, lower(tiktok_handle), 'trusted'
FROM public.profiles
WHERE tiktok_handle IS NOT NULL AND tiktok_handle ~ '^[A-Za-z0-9_.]{2,24}$'
ON CONFLICT (user_id, handle) DO NOTHING;

INSERT INTO public.tiktok_accounts (user_id, handle, status)
SELECT DISTINCT editor_id, lower(tiktok_handle), 'trusted'
FROM public.submissions
WHERE tiktok_handle IS NOT NULL AND tiktok_handle ~ '^[A-Za-z0-9_.]{2,24}$'
ON CONFLICT (user_id, handle) DO NOTHING;
