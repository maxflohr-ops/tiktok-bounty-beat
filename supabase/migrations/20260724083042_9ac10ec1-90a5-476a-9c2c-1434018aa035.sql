-- Editor payout methods (restricted to owner + staff)
CREATE TABLE public.payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_method text NOT NULL DEFAULT 'stripe',
  stripe_connect_account_id text,
  stripe_connect_status text NOT NULL DEFAULT 'none',
  paypal_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, default_method)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_methods TO authenticated;
GRANT ALL ON public.payout_methods TO service_role;
ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own payout_method"
  ON public.payout_methods
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "staff read all payout_methods"
  ON public.payout_methods
  FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- Top-up payments to bounties
CREATE TABLE public.bounty_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'USD',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.bounty_payments TO authenticated;
GRANT ALL ON public.bounty_payments TO service_role;
ALTER TABLE public.bounty_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff manage bounty_payments"
  ON public.bounty_payments
  FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Bounty pot balance and top-up tracking
ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS funded_cash_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS top_up_session_id text;

-- Submission payout tracking
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS paid_cash_cents integer NOT NULL DEFAULT 0;

-- Attach update_updated_at trigger to new tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_payout_methods_updated_at'
  ) THEN
    CREATE TRIGGER update_payout_methods_updated_at
      BEFORE UPDATE ON public.payout_methods
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_bounty_payments_updated_at'
  ) THEN
    CREATE TRIGGER update_bounty_payments_updated_at
      BEFORE UPDATE ON public.bounty_payments
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;