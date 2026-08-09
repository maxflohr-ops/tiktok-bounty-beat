-- Ebril — Heartbreak: anticipation bounty for the upcoming sound. Same tier
-- line as the stream bounty ($100 per 1M, one 2.5M video -> $250), $500
-- purse, through year end. Sound URL attaches at release. Idempotent by title.
INSERT INTO public.bounties
  (title, description, sound_name, artist_song,
   payout_type, platform_target, reward_cash_cents, reward_points,
   max_submissions, deadline, status, funded_cash_cents)
SELECT
  'Clip Ebril — Anticipate Heartbreak',
  'Ebril''s next drop. Seize a slot now — the moment "Anticipate Heartbreak" lands on TikTok, cut your clip on it and deliver. Tiered payout: 1M verified views pays $100, and a single video that hits 2.5M views captures $250. Views stack across your clips at the same rate. 9:16 only, subtitles encouraged, use the official sound once it''s live (link lands on this contract at release).',
  'Ebril — Anticipate Heartbreak (drops soon)',
  'Ebril',
  'per_1k_views',
  'tiktok',
  10000,
  100,
  20,
  '2026-12-31 23:59:00+00',
  'active',
  50000
WHERE NOT EXISTS (
  SELECT 1 FROM public.bounties WHERE title = 'Clip Ebril — Anticipate Heartbreak'
);
