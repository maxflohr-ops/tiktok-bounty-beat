
-- Revoke ALL, then re-grant only the safe columns to anon/authenticated.
-- Sensitive columns (stripe_customer_id, top_up_session_id, funded_cash_cents) remain
-- readable only by service_role (used by supabaseAdmin server-side).

REVOKE ALL ON public.bounties FROM anon, authenticated;

GRANT SELECT (
  id, contract_no, title, description, sound_name, tiktok_sound_url, cover_url,
  artist_song, source_assets_url, reward_points, reward_cash_cents, currency,
  payout_type, platform_target, max_submissions, deadline, status,
  created_by, created_at, updated_at
) ON public.bounties TO anon, authenticated;

-- Staff still write via authenticated policies; grant needed DML back for authenticated
-- (RLS policy "staff manage bounties *" gates who can actually do it).
GRANT INSERT, UPDATE, DELETE ON public.bounties TO authenticated;

GRANT ALL ON public.bounties TO service_role;
