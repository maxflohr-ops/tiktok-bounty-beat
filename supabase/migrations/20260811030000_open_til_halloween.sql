-- Everything on the board stays open through Halloween: pull any earlier
-- deadline forward to Oct 31. Later deadlines (the Ebril year-end runs, the
-- fan page) keep their dates, and open-ended rows (null deadline) stay
-- open-ended. The seed sync in ensureLaunchBounties mirrors the extension
-- for the launch bounties when a publish skips this file.

UPDATE public.bounties
SET deadline = '2026-10-31 23:59:00+00', updated_at = now()
WHERE status = 'active'
  AND deadline IS NOT NULL
  AND deadline < '2026-10-31 23:59:00+00';

-- Sound link for the Mac Miller edits campaign (TikTok share link).
UPDATE public.bounties
SET tiktok_sound_url = 'https://www.tiktok.com/t/ZT9kLRCQ8e1vj-jLsqm/', updated_at = now()
WHERE title = 'Ridgeclub — Do I Clench My Fist? (Mac Miller edits)'
  AND tiktok_sound_url IS NULL;
