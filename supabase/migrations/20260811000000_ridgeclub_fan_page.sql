-- Ridgeclub — Fan Page: $50 flat per approved fan page from a $100 purse
-- (first two approved pages capture it). Deliverable is a dedicated TikTok
-- fan account, not a single clip. Idempotent by title, same pattern as the
-- other launch seeds; ensureLaunchBounties mirrors this server-side.

INSERT INTO public.bounties
  (title, description, sound_name, artist_song,
   payout_type, platform_target, reward_cash_cents, reward_points,
   max_submissions, deadline, status, funded_cash_cents, rules)
SELECT
  'Ridgeclub — Fan Page',
  'Build a whole Ridgeclub fan page on TikTok: a dedicated account carrying the Ridgeclub name and look, at least five posted clips using Ridgeclub sounds, and a bio that points back to the artist. Deliver the account URL as your submission. $50 flat per approved fan page from a $100 posted purse — the first two approved pages capture it.',
  'Ridgeclub — any sound',
  'Ridgeclub',
  'flat',
  'tiktok',
  5000,       -- $50 flat per approved fan page
  100,
  10,
  '2026-12-31 23:59:00+00',
  'active',
  10000,      -- the $100 purse
  'Campaign logo overlay required on every delivered clip — grab it from the logo pack on this contract.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.bounties WHERE title = 'Ridgeclub — Fan Page'
);
