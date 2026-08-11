-- Ridgeclub — Do I Clench My Fist? (Mac Miller edits): $3 per 100k verified
-- views from a $100 purse (full purse at ~3.33M views; views stack across an
-- editor's clips). Idempotent by title, same pattern as the other launch
-- seeds; ensureLaunchBounties mirrors this server-side.

INSERT INTO public.bounties
  (title, description, sound_name, artist_song,
   payout_type, platform_target, reward_cash_cents, reward_points,
   max_submissions, deadline, status, funded_cash_cents, rules)
SELECT
  'Ridgeclub — Do I Clench My Fist? (Mac Miller edits)',
  'Cut Mac Miller edits — archival footage, interviews, live moments — set to Ridgeclub''s "Do I Clench My Fist?". $3 per 100,000 verified views from a $100 posted purse, paid pro-rata, and views stack across your clips. 9:16 only, use the sound.',
  'Ridgeclub — Do I Clench My Fist?',
  'Ridgeclub',
  'per_1k_views',
  'tiktok',
  300,        -- $3 per 100k verified views
  100,
  20,
  '2026-09-08 23:59:00+00',
  'active',
  10000,      -- the $100 purse
  'Campaign logo overlay required on every delivered clip — grab it from the logo pack on this contract.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.bounties WHERE title = 'Ridgeclub — Do I Clench My Fist? (Mac Miller edits)'
);
