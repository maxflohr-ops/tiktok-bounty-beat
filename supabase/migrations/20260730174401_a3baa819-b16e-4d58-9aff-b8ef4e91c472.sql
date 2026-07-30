ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS counting_ends_at timestamptz;
GRANT SELECT (counting_ends_at), UPDATE (counting_ends_at) ON public.submissions TO authenticated;