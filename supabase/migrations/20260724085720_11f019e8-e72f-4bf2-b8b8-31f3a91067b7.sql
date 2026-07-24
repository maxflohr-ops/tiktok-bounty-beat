
CREATE TYPE public.dispute_status AS ENUM ('open','under_review','resolved','rejected');

CREATE TABLE public.payout_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  claimed_view_count integer,
  evidence_url text,
  note text NOT NULL,
  status public.dispute_status NOT NULL DEFAULT 'open',
  reviewer_id uuid,
  reviewer_note text,
  resolved_view_count integer,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payout_disputes TO authenticated;
GRANT ALL ON public.payout_disputes TO service_role;

ALTER TABLE public.payout_disputes ENABLE ROW LEVEL SECURITY;

-- Submitter can insert a dispute for their own submission
CREATE POLICY "submitter can file dispute"
ON public.payout_disputes FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id AND s.editor_id = auth.uid()
  )
);

-- Submitter can read their own disputes
CREATE POLICY "submitter can read own disputes"
ON public.payout_disputes FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Staff can read all disputes
CREATE POLICY "staff can read all disputes"
ON public.payout_disputes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','manager')
  )
);

-- Staff can update disputes (review/resolve)
CREATE POLICY "staff can update disputes"
ON public.payout_disputes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','manager')
  )
);

-- Only one open/under_review dispute per submission at a time
CREATE UNIQUE INDEX payout_disputes_one_open_per_submission
ON public.payout_disputes(submission_id)
WHERE status IN ('open','under_review');

CREATE INDEX payout_disputes_created_by_idx ON public.payout_disputes(created_by);
CREATE INDEX payout_disputes_status_idx ON public.payout_disputes(status);

CREATE TRIGGER update_payout_disputes_updated_at
BEFORE UPDATE ON public.payout_disputes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
