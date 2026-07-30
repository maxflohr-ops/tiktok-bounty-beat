-- Ebril's Thursday Twitch mission: $5 per 5,000 verified TikTok views.
-- Stored as cents per 100k views (10000 ≡ $5/5k); payout math is now
-- proportional, so a 5,000-view clip pays exactly $5.
UPDATE public.bounties
SET reward_cash_cents = 10000,
    description = 'Ebril goes live on Twitch every Thursday. Cut the stream''s best moments into vertical clips and post them to TikTok — best reactions, best runs, best lines. $5 per 5,000 verified views. Keep Ebril''s voice front and center. 9:16 only, subtitles encouraged. Clips from the live stream or its VOD both count.',
    updated_at = now()
WHERE title = 'Clip Ebril''s Thursday Twitch stream';
