-- Counting windows, multi-clip claims, payout preference, and tax profiles.

-- Every contract sets how long each clip's view-counting window runs and how
-- many clips one editor may claim (site max 15 for now; adjustable here).
ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS counting_days integer NOT NULL DEFAULT 14
    CHECK (counting_days BETWEEN 1 AND 90),
  ADD COLUMN IF NOT EXISTS max_clips_per_editor integer NOT NULL DEFAULT 15
    CHECK (max_clips_per_editor BETWEEN 1 AND 50);

-- Stamped when proof is delivered: now() + counting_days. Views are verified
-- and paid at the close of this window.
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS counting_ends_at timestamptz;

-- Multi-clip: an editor can hold several slots on one contract.
DROP INDEX IF EXISTS public.submissions_bounty_editor_unique;

-- Which rail the editor wants paid on when both are on file.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_preference text
    CHECK (payout_preference IN ('paypal', 'usdc'));

-- W-9-style tax info, collected once lifetime payouts pass the threshold
-- (enforced in the payout path; threshold lives in code). Service-role only:
-- all reads/writes go through auth-gated server functions, and the TIN is
-- never returned to a client.
CREATE TABLE IF NOT EXISTS public.tax_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  region text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  tin text NOT NULL,
  tin_type text NOT NULL DEFAULT 'ssn' CHECK (tin_type IN ('ssn', 'ein')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.tax_profiles TO service_role;
ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tax_profiles_updated') THEN
    CREATE TRIGGER tax_profiles_updated BEFORE UPDATE ON public.tax_profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
