-- Sons of Legion — Any Song, Any Edit: any Sons of Legion track, any edit
-- style, #maddenlegion in the caption. $1 per 5k verified views ($20 per
-- 100k), $100 purse. The campaign hashtag is the auto-verification signal.
-- Idempotent by title.
INSERT INTO public.bounties
  (title, description, sound_name, artist_song,
   payout_type, platform_target, reward_cash_cents, reward_points,
   max_submissions, deadline, status, funded_cash_cents, hashtags, rules)
SELECT
  'Clip Sons of Legion — Any Song, Any Edit',
  'Any Sons of Legion song, any style of edit — gameplay, lyrics, montage, whatever hits. #maddenlegion in the caption. $1 per 5,000 verified views, paid pro-rata, and views stack across your clips. 9:16 only.',
  'Sons of Legion — any song, any edit',
  'Sons of Legion',
  'per_1k_views',
  'tiktok',
  2000,
  100,
  20,
  '2026-09-08 23:59:00+00',
  'active',
  10000,
  ARRAY['maddenlegion'],
  'Campaign logo overlay required on every delivered clip — grab it from the logo pack on this contract.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.bounties WHERE title = 'Clip Sons of Legion — Any Song, Any Edit'
);
