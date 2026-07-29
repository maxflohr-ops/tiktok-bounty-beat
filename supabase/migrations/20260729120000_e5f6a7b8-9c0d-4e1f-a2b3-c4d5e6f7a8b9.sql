-- Ebril's Thursday Twitch mission: switch to pay-per-view at $5 per 100k
-- verified views, and link her Twitch channel as the source.
-- Note: reward_cash_cents for payout_type 'per_1k_views' is cents per 100k
-- views (see the payout math in stripe.functions/submissions.functions).

UPDATE public.bounties
SET payout_type = 'per_1k_views',
    reward_cash_cents = 500,
    source_assets_url = 'https://twitch.tv/ebbionline',
    updated_at = now()
WHERE title = 'Clip Ebril''s Thursday Twitch stream';
