-- 1) verified_view_count: staff-set number used for payouts (defends against self-reported view inflation)
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS verified_view_count integer;

-- Only staff can set/update verified_view_count. Regular editors updating their own row
-- already can't touch this column because their UPDATE policy... wait, editors have no
-- UPDATE policy on submissions at all — only "staff updates submissions" exists. Good.
-- (updateViewCount server fn currently uses the authenticated client; it will fail RLS
-- when trying to update verified_view_count, which is what we want.)

-- 2) Column-level revoke on sensitive bounty columns
REVOKE SELECT (stripe_customer_id, top_up_session_id, funded_cash_cents)
  ON public.bounties FROM anon, authenticated;

-- service_role keeps full access implicitly (GRANT ALL was issued earlier); staff paths
-- will read these via supabaseAdmin.

-- 3) bounty_payments: explicitly deny non-staff writes.
-- Current policies: "bounty creators read own payments" (SELECT) + "staff manage bounty_payments" (ALL).
-- Without an INSERT policy for authenticated, inserts as authenticated already fail — but make
-- intent explicit by ensuring no permissive policy exists and revoking write grants from authenticated.
REVOKE INSERT, UPDATE, DELETE ON public.bounty_payments FROM anon, authenticated;
-- Keep SELECT for authenticated so the creator-read policy still applies.
GRANT SELECT ON public.bounty_payments TO authenticated;
GRANT ALL ON public.bounty_payments TO service_role;
