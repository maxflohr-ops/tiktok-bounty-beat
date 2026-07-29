-- Podcasts join the listing types, and Featured gets a plus tier.
ALTER TABLE public.sound_listings DROP CONSTRAINT IF EXISTS sound_listings_listing_type_check;
ALTER TABLE public.sound_listings
  ADD CONSTRAINT sound_listings_listing_type_check
  CHECK (listing_type IN ('sound', 'stream', 'keynote', 'podcast'));

-- featured_tier supersedes featured_requested (kept for existing rows):
-- none | featured ($1,000/mo pinned slot) | featured_plus ($2,500/mo pinned +
-- presented-by line on the landing ledger).
ALTER TABLE public.sound_listings
  ADD COLUMN IF NOT EXISTS featured_tier text NOT NULL DEFAULT 'none'
    CHECK (featured_tier IN ('none', 'featured', 'featured_plus'));

ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS featured_plus boolean NOT NULL DEFAULT false;
