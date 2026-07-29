-- Seed mission: clip Ebril's Thursday Twitch stream.
-- Rate/pot are starting values — adjust and fund from the admin desk.
-- Idempotent: skipped if a bounty with this title already exists.

INSERT INTO public.bounties
  (title, description, sound_name, artist_song,
   payout_type, platform_target, reward_cash_cents, reward_points,
   max_submissions, deadline, status)
SELECT
  'Clip Ebril''s Thursday Twitch stream',
  'Ebril goes live on Twitch every Thursday. Cut the stream''s best moments into vertical clips and post them to TikTok — best reactions, best runs, best lines. Keep Ebril''s voice front and center. 9:16 only, subtitles encouraged. Clips from the live stream or its VOD both count.',
  'Ebril — live on Twitch (Thursdays)',
  'Ebril',
  'flat',
  'tiktok',
  2000,      -- $20 per approved clip (adjust in admin)
  100,
  20,
  '2026-08-13 23:59:00+00',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.bounties WHERE title = 'Clip Ebril''s Thursday Twitch stream'
);
