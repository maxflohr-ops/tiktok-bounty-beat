-- Ridgeclub — Biting Bullets: $100 purse at $2 per 100k verified views
-- ($100 for a 5M-view TikTok; views stack across an editor's clips).
-- Idempotent by title, same pattern as the Ebril seed.

INSERT INTO public.bounties
  (title, description, sound_name, artist_song,
   payout_type, platform_target, reward_cash_cents, reward_points,
   max_submissions, deadline, status, funded_cash_cents)
SELECT
  'Clip Ridgeclub — Biting Bullets',
  'Cut a TikTok on Ridgeclub''s "Biting Bullets." $2 per 100,000 verified views — a 5M-view video captures the full $100 purse, and views stack across your clips, so two 2.5M clips cash the same. 9:16 only, subtitles encouraged, use the sound.',
  'Ridgeclub — Biting Bullets',
  'Ridgeclub',
  'per_1k_views',
  'tiktok',
  200,        -- cents per 100k views ≡ $100 per 5M
  100,
  20,
  '2026-09-08 23:59:00+00',
  'active',
  10000       -- the $100 purse
WHERE NOT EXISTS (
  SELECT 1 FROM public.bounties WHERE title = 'Clip Ridgeclub — Biting Bullets'
);
