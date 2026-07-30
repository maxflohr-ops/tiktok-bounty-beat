
-- 1) bounties: make the safe-column read set explicit for authenticated users
REVOKE SELECT ON public.bounties FROM authenticated;
REVOKE SELECT ON public.bounties FROM anon;
GRANT SELECT (
  id, contract_no, title, description, sound_name, tiktok_sound_url, cover_url,
  artist_song, source_assets_url, reward_points, reward_cash_cents, currency,
  payout_type, platform_target, max_submissions, deadline, status, created_by,
  created_at, updated_at, featured_until, featured_plus, hashtags, rules,
  counting_days, max_clips_per_editor
) ON public.bounties TO authenticated;
GRANT ALL ON public.bounties TO service_role;

-- 2) bounty_claims: server-only (accessed via service role); no client access
REVOKE ALL ON public.bounty_claims FROM authenticated;
REVOKE ALL ON public.bounty_claims FROM anon;
GRANT ALL ON public.bounty_claims TO service_role;
ALTER TABLE public.bounty_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no client access to bounty_claims" ON public.bounty_claims;
CREATE POLICY "no client access to bounty_claims"
  ON public.bounty_claims FOR SELECT TO authenticated USING (false);

-- 3) tax_profiles: contains TIN/PII; server-only, never readable by clients
REVOKE ALL ON public.tax_profiles FROM authenticated;
REVOKE ALL ON public.tax_profiles FROM anon;
GRANT ALL ON public.tax_profiles TO service_role;
ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no client access to tax_profiles" ON public.tax_profiles;
CREATE POLICY "no client access to tax_profiles"
  ON public.tax_profiles FOR SELECT TO authenticated USING (false);
