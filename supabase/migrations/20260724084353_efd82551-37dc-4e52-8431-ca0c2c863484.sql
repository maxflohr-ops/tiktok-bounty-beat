
DO $$ BEGIN
  CREATE TYPE public.payout_approval_status AS ENUM ('pending','approved','rejected','sent','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.payout_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'USD',
  status public.payout_approval_status NOT NULL DEFAULT 'pending',
  requested_by uuid NOT NULL,
  decided_by uuid,
  decision_note text,
  stripe_transfer_id text,
  error text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payout_approvals_one_open_per_sub
  ON public.payout_approvals(submission_id)
  WHERE status IN ('pending','approved','sent');

GRANT SELECT, INSERT, UPDATE ON public.payout_approvals TO authenticated;
GRANT ALL ON public.payout_approvals TO service_role;

ALTER TABLE public.payout_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read approvals" ON public.payout_approvals
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "staff request approvals" ON public.payout_approvals
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND requested_by = auth.uid());

CREATE POLICY "admins decide approvals" ON public.payout_approvals
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payout_approvals_updated_at
  BEFORE UPDATE ON public.payout_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
