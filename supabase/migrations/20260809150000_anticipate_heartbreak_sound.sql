-- "Anticipate Heartbreak" is live on TikTok - attach the official sound and
-- switch the brief from anticipation to live. Idempotent: only touches the
-- row while its sound URL is still missing.
UPDATE public.bounties
SET tiktok_sound_url = 'https://www.tiktok.com/music/original-sound-7597916391358024503',
    sound_name = 'Ebril — Anticipate Heartbreak',
    description = 'Cut a TikTok on Ebril''s "Anticipate Heartbreak." Tiered payout: 1M verified views pays $100, and a single video that hits 2.5M views captures $250. Views stack across your clips at the same rate. 9:16 only, subtitles encouraged, use the official sound.',
    updated_at = now()
WHERE title = 'Clip Ebril — Anticipate Heartbreak'
  AND tiktok_sound_url IS NULL;
