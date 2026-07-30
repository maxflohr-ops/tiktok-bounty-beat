-- profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_preference text CHECK (payout_preference IN ('paypal','usdc')),
  ADD COLUMN IF NOT EXISTS signup_logged_at timestamptz;
GRANT SELECT (payout_preference, signup_logged_at), UPDATE (payout_preference) ON public.profiles TO authenticated;

-- sound_listings
ALTER TABLE public.sound_listings
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'sound',
  ADD COLUMN IF NOT EXISTS stream_url text,
  ADD COLUMN IF NOT EXISTS stream_at timestamptz,
  ADD COLUMN IF NOT EXISTS hashtags text,
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS featured_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_tier text NOT NULL DEFAULT 'none';

-- tiktok_accounts
CREATE TABLE IF NOT EXISTS public.tiktok_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  handle text NOT NULL,
  status text NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, handle)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiktok_accounts TO authenticated;
GRANT ALL ON public.tiktok_accounts TO service_role;
ALTER TABLE public.tiktok_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own tiktok accounts" ON public.tiktok_accounts;
CREATE POLICY "own tiktok accounts" ON public.tiktok_accounts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- tax_profiles (service role only)
CREATE TABLE IF NOT EXISTS public.tax_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  legal_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  region text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  tin text NOT NULL,
  tin_type text NOT NULL DEFAULT 'ssn',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tax_profiles TO service_role;
ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;

-- bounty_claims (service role only)
CREATE TABLE IF NOT EXISTS public.bounty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  copula_user_id text,
  copula_clip_id text,
  clip_url text,
  status text NOT NULL DEFAULT 'pending',
  verified_views integer NOT NULL DEFAULT 0,
  paid_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bounty_claims TO service_role;
ALTER TABLE public.bounty_claims ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tax_profiles_updated_at ON public.tax_profiles;
CREATE TRIGGER tax_profiles_updated_at BEFORE UPDATE ON public.tax_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS bounty_claims_updated_at ON public.bounty_claims;
CREATE TRIGGER bounty_claims_updated_at BEFORE UPDATE ON public.bounty_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();