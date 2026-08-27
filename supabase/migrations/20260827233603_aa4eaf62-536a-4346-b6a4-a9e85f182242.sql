ALTER TABLE public.bounties ADD COLUMN IF NOT EXISTS logo_pack_url text;

INSERT INTO public.bounties (
  title, description, sound_name, artist_song, tiktok_sound_url, source_assets_url, cover_url,
  payout_type, platform_target, reward_cash_cents, reward_points, max_submissions, deadline,
  status, visibility, funded_cash_cents, counting_days, hashtags, rules
)
SELECT
  '"biting bullets" × GTA VI',
  'GTA VI: An Extended Look just dropped (Netflix Aug 27, Rockstar''s YouTube tonight 9pm ET). Clip the announcement / trailer footage — Vice City night shots, chases, neon, character reveals — and put the official ''biting bullets'' sound under it. Reaction clips to the announcement count too. Make Vice City look like it was scored by a saxophone.',
  'ridgeclub — biting bullets',
  'ridgeclub — biting bullets',
  'https://www.tiktok.com/music/biting-bullets-7657072140283643921',
  'https://www.youtube.com/watch?v=qq76pQsI1iw',
  'https://img.youtube.com/vi/qq76pQsI1iw/maxresdefault.jpg',
  'per_1k_views', 'tiktok', 10000, 100, NULL, '2026-12-31T23:59:00Z',
  'active', 'public', 250000, 3, ARRAY['bitingbullets'],
  E'1. Clip must use the OFFICIAL "biting bullets" sound via the platform''s sound picker (TikTok sound / Reels audio). Baked-in or re-uploaded audio doesn''t count — the sound attribution IS the campaign.\n2. Caption must include @ridgeclub + #bitingbullets.\n3. Minimum clip length: 7 seconds.\n4. Link your account here BEFORE posting. Unlinked accounts produce unpayable views — no retroactive fix.\n5. Submit your live URL within 60 minutes of posting.\n6. One payout per unique edit — duplicates of another creator''s edit are seized; first submission wins.\n7. Bot or purchased views: seized + banned from all future bounties.\n8. Rights note: trailer footage belongs to Rockstar/Netflix. Transformative edits survive; straight re-uploads get taken down, and takedown risk is on the creator.'
WHERE NOT EXISTS (SELECT 1 FROM public.bounties WHERE title = '"biting bullets" × GTA VI');