-- Campaign payment fields must never be readable by ordinary signed-in users.
REVOKE SELECT ON public.bounties FROM authenticated;
REVOKE ALL ON public.bounties FROM anon;
GRANT SELECT (
  id, contract_no, title, description, sound_name, tiktok_sound_url, cover_url,
  artist_song, source_assets_url, reward_points, reward_cash_cents, currency,
  payout_type, platform_target, max_submissions, deadline, status, created_by,
  created_at, updated_at, featured_until, featured_plus, hashtags, rules,
  counting_days, max_clips_per_editor
) ON public.bounties TO authenticated;
REVOKE SELECT (stripe_customer_id, top_up_session_id, funded_cash_cents)
  ON public.bounties FROM authenticated;
GRANT ALL ON public.bounties TO service_role;

-- Payments are created server-side only; no client insert path.
REVOKE INSERT ON public.bounty_payments FROM authenticated, anon;
GRANT ALL ON public.bounty_payments TO service_role;