-- Recruiting pipeline + referral program. Additive only.
--
-- recruit_prospects: the creators staff are courting, one row per person,
-- moved across stages on the desk's Recruiting board. Staff-only: nothing
-- here is visible to clippers. Contact is always a human action — the app
-- stores openers and stages, it never sends a message.
--
-- referrals: who brought whom. Written only by the server (service role) when
-- a signed-in clipper arrives with ?ref=<handle>, so a user can't credit
-- themselves by editing their own profile. Referral bonuses are awarded by
-- staff at review, never paid automatically.

CREATE TABLE IF NOT EXISTS public.recruit_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  handle text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  profile_url text NOT NULL,
  segment text NOT NULL CHECK (segment IN ('sax', 'reactor', 'curator', 'edits', 'other')),
  campaign text,
  followers text,
  fit text,
  opener text,
  contact text,
  sources text[] NOT NULL DEFAULT '{}',
  stage text NOT NULL DEFAULT 'prospect'
    CHECK (stage IN ('prospect', 'contacted', 'replied', 'onboarded', 'active', 'passed')),
  founding boolean NOT NULL DEFAULT false,
  notes text,
  last_touch_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.recruit_prospects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruit_prospects TO authenticated;
ALTER TABLE public.recruit_prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage prospects" ON public.recruit_prospects;
CREATE POLICY "staff manage prospects" ON public.recruit_prospects
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS recruit_prospects_updated_at ON public.recruit_prospects;
CREATE TRIGGER recruit_prospects_updated_at BEFORE UPDATE ON public.recruit_prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (referrer_id <> referred_id)
);

GRANT ALL ON public.referrals TO service_role;
GRANT SELECT ON public.referrals TO authenticated;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own or staff referrals" ON public.referrals;
CREATE POLICY "read own or staff referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_staff(auth.uid()));
