-- Production board shows zero contracts: the Ebril seed either never landed
-- or the row was deleted/drafted. Handle both — insert if missing, then
-- normalize status + rate on whatever row exists. Idempotent.

INSERT INTO public.bounties
  (title, description, sound_name, artist_song, source_assets_url,
   payout_type, platform_target, reward_cash_cents, reward_points,
   max_submissions, deadline, status)
SELECT
  'Clip Ebril''s Thursday Twitch stream',
  'Ebril goes live on Twitch every Thursday. Cut the stream''s best moments into vertical clips and post them to TikTok — best reactions, best runs, best lines. $5 per 5,000 verified views. Keep Ebril''s voice front and center. 9:16 only, subtitles encouraged. Clips from the live stream or its VOD both count.',
  'Ebril — live on Twitch (Thursdays)',
  'Ebril',
  'https://twitch.tv/ebbionline',
  'per_1k_views',
  'tiktok',
  10000,     -- cents per 100k views ≡ $5 per 5,000
  100,
  20,
  '2026-08-13 23:59:00+00',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.bounties WHERE title = 'Clip Ebril''s Thursday Twitch stream'
);

UPDATE public.bounties
SET status = 'active',
    payout_type = 'per_1k_views',
    reward_cash_cents = 10000,
    source_assets_url = 'https://twitch.tv/ebbionline',
    updated_at = now()
WHERE title = 'Clip Ebril''s Thursday Twitch stream';
