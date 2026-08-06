-- Auto-counted clip stats: pulled from the clip's public TikTok page on
-- delivery and on demand, so editors get instant feedback without typing
-- numbers in. view_count stays the editor-facing figure; verified_view_count
-- remains the staff-verified number payouts compute from.
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS like_count integer,
  ADD COLUMN IF NOT EXISTS comment_count integer,
  ADD COLUMN IF NOT EXISTS stats_refreshed_at timestamptz;
