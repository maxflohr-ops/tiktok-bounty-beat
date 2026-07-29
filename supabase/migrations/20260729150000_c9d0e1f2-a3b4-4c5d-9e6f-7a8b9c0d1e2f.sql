-- Listings can now be a livestream (upcoming or a previous VOD), not just a sound.
ALTER TABLE public.sound_listings
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'sound'
    CHECK (listing_type IN ('sound', 'stream')),
  ADD COLUMN IF NOT EXISTS stream_url text,
  ADD COLUMN IF NOT EXISTS stream_at timestamptz; -- null = previous stream / VOD
