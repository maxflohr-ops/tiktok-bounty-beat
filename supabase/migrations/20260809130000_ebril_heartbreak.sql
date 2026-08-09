-- Ebril — Heartbreak: anticipation bounty for the upcoming sound. Same tier
-- line as the stream bounty ($100 per 1M, one 2.5M video -> $250), $500
-- purse, through year end. Sound URL attaches at release. Idempotent by title.
INSERT INTO public.bounties
  (title, description, sound_name, artist_song, tiktok_sound_url,
   payout_type, platform_target, reward_cash_cents, reward_points,
   max_submissions, deadline, status, funded_cash_cents)
SELECT
  'Clip Ebril — Anticipate Heartbreak',
  'Cut a TikTok on Ebril''s "Anticipate Heartbreak." Tiered payout: 1M verified views pays $100, and a single video that hits 2.5M views captures $250. Views stack across your clips at the same rate. 9:16 only, subtitles encouraged, use the official sound.',
  'Ebril — Anticipate Heartbreak',
  'Ebril',
  'https://www.tiktok.com/music/original-sound-7597916391358024503',
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
