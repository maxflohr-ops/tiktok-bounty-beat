-- Campaign hashtags and rules.
-- hashtags: stored lowercase without the leading '#'; shown as chips to
-- clippers and counted as a soft verification signal in deliverProof.
-- rules: free text from the campaign owner, shown as a dropdown on the
-- contract page.
ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS hashtags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rules text;

ALTER TABLE public.sound_listings
  ADD COLUMN IF NOT EXISTS hashtags text,
  ADD COLUMN IF NOT EXISTS rules text;
