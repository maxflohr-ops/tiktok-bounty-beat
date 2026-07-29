-- Featured placements: a contract can buy the pinned #1 slot on the board.
ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

-- Listing checkout can request the featured add-on ($1,000 first month).
ALTER TABLE public.sound_listings
  ADD COLUMN IF NOT EXISTS featured_requested boolean NOT NULL DEFAULT false;
