-- Dog Legion — Lyric Edits: any Dog Legion song, lyrics on screen,
-- #maddenlegion in the caption. $1 per 5k verified views ($20 per 100k),
-- $100 purse. No single sound URL - the campaign hashtag is the
-- auto-verification signal. Idempotent by title.
INSERT INTO public.bounties
  (title, description, sound_name, artist_song,
   payout_type, platform_target, reward_cash_cents, reward_points,
   max_submissions, deadline, status, funded_cash_cents, hashtags)
SELECT
  'Clip Dog Legion — Lyric Edits (any song)',
  'Cut a lyric edit on any Dog Legion song — lyrics on screen, #maddenlegion in the caption. $1 per 5,000 verified views, paid pro-rata, and views stack across your clips. Any Dog Legion track counts; pick the line that hits. 9:16 only, subtitles/lyrics required.',
  'Dog Legion — any song (lyric edit)',
  'Dog Legion',
  'per_1k_views',
  'tiktok',
  2000,
  100,
  20,
  '2026-09-08 23:59:00+00',
  'active',
  10000,
  ARRAY['maddenlegion']
WHERE NOT EXISTS (
  SELECT 1 FROM public.bounties WHERE title = 'Clip Dog Legion — Lyric Edits (any song)'
);
