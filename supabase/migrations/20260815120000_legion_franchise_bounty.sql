-- Legion Franchise Bounty — Sons of Legion, "Out The Cage" (Madden NFL 27).
-- Flat ladder: $25 per approved clip is the rung the board pays
-- automatically; the 3+ episode series upgrade ($50) and the judged purse
-- ($150 best series / $100 runner-up / $50 best single clip) are awarded by
-- staff at review. Purse holds the whole committed line: $800 posting +
-- $300 judged.
--
-- Deadline stays Sept 13 rather than the Halloween sweep applied to the
-- other campaigns: the creator outreach emails commit to that date.
-- Idempotent by title; ensureLaunchBounties mirrors this server-side.

INSERT INTO public.bounties
  (title, description, sound_name, artist_song, tiktok_sound_url,
   payout_type, platform_target, reward_cash_cents, reward_points,
   max_submissions, deadline, status, funded_cash_cents, hashtags, rules)
SELECT
  'Sons of Legion — Out The Cage (Madden 27)',
  'Sons of Legion''s "Out The Cage" is on the Madden NFL 27 soundtrack. Cut Madden content over it — franchise storylines, rebuild arcs, ratings reactions, MUT pulls, tier lists with a spicy bottom slot. $25 per approved clip, or $50 if you run a 3+ episode series with the track as the intro theme. On top of that sits a $300 judged purse: $150 for the best series, $100 runner-up, $50 for the best single clip — judged on creativity, not follower count, so a mid-size account can take it off someone twice their size.',
  'Sons of Legion — Out The Cage',
  'Sons of Legion',
  'https://www.tiktok.com/music/Out-The-Cage-7665103983788705793',
  'flat',
  'tiktok',
  2500,       -- $25 flat per approved clip
  100,
  20,
  '2026-09-13 23:59:00+00',
  'active',
  110000,     -- $800 posting line + $300 judged purse
  ARRAY['maddenlegion'],
  'Official sound only — the canonical Out The Cage page, not a re-upload or remix. #maddenlegion in the caption. Paid-partnership toggle ON (FTC — protects you and the band). Your own capture, no re-uploaded broadcast footage. Series entries need 3+ episodes using the track as the intro theme. No slurs or hate, no piling on individual players, and never claim EA or the NFL endorses this campaign.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.bounties WHERE title = 'Sons of Legion — Out The Cage (Madden 27)'
);
