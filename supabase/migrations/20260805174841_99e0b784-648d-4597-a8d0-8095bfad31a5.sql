-- 1. bounties: replace blanket read policy with a scoped one
DROP POLICY IF EXISTS "bounties readable to authenticated" ON public.bounties;

CREATE POLICY "bounties scoped read"
ON public.bounties FOR SELECT TO authenticated
USING (
  public.is_staff(auth.uid())
  OR created_by = auth.uid()
  OR (visibility = 'public' AND status <> 'draft')
);

-- Defense in depth: keep sensitive payment columns unreachable from client roles
REVOKE ALL ON public.bounties FROM anon, authenticated;
GRANT SELECT (
  id, contract_no, title, description, sound_name, tiktok_sound_url, cover_url,
  artist_song, source_assets_url, reward_points, reward_cash_cents, currency,
  payout_type, platform_target, max_submissions, deadline, status, created_at,
  updated_at, created_by, featured_until, featured_plus, hashtags, rules,
  counting_days, max_clips_per_editor, visibility, access_mode
) ON public.bounties TO authenticated;
GRANT ALL ON public.bounties TO service_role;

-- 2. bounty_payments: no client-side insert path
DROP POLICY IF EXISTS "staff manage bounty_payments" ON public.bounty_payments;

CREATE POLICY "staff read bounty_payments"
ON public.bounty_payments FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "staff update bounty_payments"
ON public.bounty_payments FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

REVOKE INSERT, DELETE ON public.bounty_payments FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.bounty_payments TO authenticated;
GRANT ALL ON public.bounty_payments TO service_role;