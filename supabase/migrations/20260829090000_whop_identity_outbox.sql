-- WO-2: Whop identity crossover + Whop money-rail bookkeeping.
-- Additive only. Worker-owned tables (bounty_claims) are not touched.
--
-- The kit's sketch targets `users`/`purses`/`payouts`; this repo's mapping is
-- profiles / bounties+bounty_payments / payout_approvals. Whop identity lives
-- in its own table rather than as columns on profiles because a Whop user may
-- exist with no Bounty Sounds account yet: identity collision fails closed and
-- linking is an explicit, audited act — never an automatic merge.

-- One row per verified Whop user. profile_id stays NULL until an explicit link.
CREATE TABLE IF NOT EXISTS public.whop_identities (
  whop_user_id text PRIMARY KEY,               -- user_… from the verified token
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  whop_account_id text UNIQUE,                 -- connected account (biz_…), set in WO-3
  whop_kyc_status text NOT NULL DEFAULT 'none'
    CHECK (whop_kyc_status IN ('none', 'pending', 'approved', 'rejected')),
  whop_payout_method_id text,                  -- default payout method (potk_…), set in WO-3
  linked_at timestamptz,
  linked_via text,                             -- audit trail: 'dual_auth' only, for now
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.whop_identities TO service_role;
-- No anon/authenticated grants: all access goes through server functions using
-- the service role (same posture as bounty_claims).
ALTER TABLE public.whop_identities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'whop_identities_updated') THEN
    CREATE TRIGGER whop_identities_updated BEFORE UPDATE ON public.whop_identities
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Every Whop money move is written here as an intent before it executes.
CREATE TABLE IF NOT EXISTS public.whop_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('topup', 'transfer', 'payout', 'bounty_create')),
  ref_table text NOT NULL,
  ref_id uuid NOT NULL,
  idempotency_key text UNIQUE NOT NULL,        -- capture:<uuid> / payout:<uuid> / purse:<uuid>
  request jsonb NOT NULL,
  response jsonb,
  status text NOT NULL DEFAULT 'dry' CHECK (status IN ('dry', 'sent', 'ok', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

GRANT ALL ON public.whop_outbox TO service_role;
ALTER TABLE public.whop_outbox ENABLE ROW LEVEL SECURITY;

-- Webhook dedupe ledger (endpoint arrives in WO-6).
CREATE TABLE IF NOT EXISTS public.whop_webhook_events (
  id text PRIMARY KEY,                         -- Whop webhook id
  type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

GRANT ALL ON public.whop_webhook_events TO service_role;
ALTER TABLE public.whop_webhook_events ENABLE ROW LEVEL SECURITY;

-- Purse side: the funder's Whop checkout payment (WO-4 writes these).
ALTER TABLE public.bounty_payments ADD COLUMN IF NOT EXISTS whop_payment_id text;
-- Mirror to Whop native bounties is OFF; the column exists only so a future
-- explicit opt-in has somewhere to write.
ALTER TABLE public.bounties ADD COLUMN IF NOT EXISTS whop_bounty_id text;

-- Payout side: which rail executed, and the Whop ids to reconcile against.
ALTER TABLE public.payout_approvals
  ADD COLUMN IF NOT EXISTS whop_transfer_id text,
  ADD COLUMN IF NOT EXISTS whop_payout_id text,
  ADD COLUMN IF NOT EXISTS rail text NOT NULL DEFAULT 'whop'
    CHECK (rail IN ('whop', 'stripe_connect'));

-- Historical approvals were all Stripe; label them truthfully.
UPDATE public.payout_approvals SET rail = 'stripe_connect' WHERE stripe_transfer_id IS NOT NULL;
