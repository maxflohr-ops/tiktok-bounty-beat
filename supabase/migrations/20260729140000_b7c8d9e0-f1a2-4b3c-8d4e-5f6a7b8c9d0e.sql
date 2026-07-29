-- Copula bridge: link copula briefs/clips to Bounty Board contracts.
--
-- Requires two secrets in Lovable Cloud (never in this repo):
--   BRIDGE_SHARED_SECRET  — HMAC key shared with copula (openssl rand -hex 32)
--   COPULA_BASE_URL       — copula's base URL for outbound payout notifies
--
-- Security findings from the side-build review are already handled here:
--   #1 stripe_customer_id / top_up_session_id / funded_cash_cents are
--      column-level revoked from anon+authenticated (20260729013521);
--      public reads go through the listPublicBounties server fn, which
--      selects an explicit safe column list.
--   #2 bounty_payments INSERT/UPDATE/DELETE revoked from anon+authenticated
--      (20260729013521) — writes are service-role only (Stripe webhook).

ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS copula_brief_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS artist_slug text;

-- Bridge claims: one copula clip claiming one contract.
-- Distinct from public.submissions (site-native claims) on purpose:
-- copula clips arrive pre-moderated and carry copula identities, not auth.users.
CREATE TABLE IF NOT EXISTS public.bounty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  copula_user_id text NOT NULL,
  copula_clip_id text NOT NULL UNIQUE,
  clip_url text NOT NULL,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'approved', 'paying', 'paid')),
  verified_views bigint NOT NULL DEFAULT 0,
  paid_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.bounty_claims TO service_role;
-- No anon/authenticated grants: the bridge edge functions and staff server
-- functions all use the service role. Staff UI reads go through supabaseAdmin
-- behind an is_staff gate.
ALTER TABLE public.bounty_claims ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'bounty_claims_updated'
  ) THEN
    CREATE TRIGGER bounty_claims_updated BEFORE UPDATE ON public.bounty_claims
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS bounty_claims_bounty_id_idx ON public.bounty_claims (bounty_id);
CREATE INDEX IF NOT EXISTS bounty_claims_status_idx ON public.bounty_claims (status);
