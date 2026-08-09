-- Ebril: extend through the year and reframe as tiered.
-- Rate is unchanged (10000 cents per 100k = $100 per 1M = $5 per 5k), so the
-- tiers are exact pro-rata points: 1M -> $100, one 2.5M video -> $250.
-- Purse set to $500 so the top tier is visibly covered.
UPDATE public.bounties
SET deadline = '2026-12-31 23:59:00+00',
    description = 'Ebril goes live on Twitch every Thursday. Cut the stream''s best moments into vertical clips and post them to TikTok — best reactions, best runs, best lines. Tiered payout: 1M verified views on TikTok pays $100, and a single video that hits 2.5M views captures $250. Views stack across your clips at the same rate. Keep Ebril''s voice front and center. 9:16 only, subtitles encouraged. Clips from the live stream or its VOD both count.',
    funded_cash_cents = GREATEST(COALESCE(funded_cash_cents, 0), 50000),
    status = 'active',
    updated_at = now()
WHERE title = 'Clip Ebril''s Thursday Twitch stream';
