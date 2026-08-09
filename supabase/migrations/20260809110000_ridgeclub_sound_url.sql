-- Attach the official TikTok sound to the Ridgeclub bounty. Idempotent:
-- only fills the URL where it's missing.
UPDATE public.bounties
SET tiktok_sound_url = 'https://www.tiktok.com/music/original-sound-7653102138111052552',
    updated_at = now()
WHERE title = 'Clip Ridgeclub — Biting Bullets'
  AND tiktok_sound_url IS NULL;
