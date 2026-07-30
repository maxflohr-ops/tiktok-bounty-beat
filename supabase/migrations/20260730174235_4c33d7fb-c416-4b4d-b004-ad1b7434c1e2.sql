ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS featured_until timestamptz,
  ADD COLUMN IF NOT EXISTS featured_plus boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hashtags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS counting_days integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS max_clips_per_editor integer NOT NULL DEFAULT 15;

GRANT SELECT (featured_until, featured_plus, hashtags, rules, counting_days, max_clips_per_editor) ON public.bounties TO authenticated, anon;
GRANT INSERT (featured_until, featured_plus, hashtags, rules, counting_days, max_clips_per_editor), UPDATE (featured_until, featured_plus, hashtags, rules, counting_days, max_clips_per_editor) ON public.bounties TO authenticated;
GRANT ALL ON public.bounties TO service_role;