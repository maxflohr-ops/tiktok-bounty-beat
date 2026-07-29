-- Keynote joins sound and stream as a listing type, closing the gap where
-- /keynotes pointed people at a form with no keynote option.
ALTER TABLE public.sound_listings DROP CONSTRAINT IF EXISTS sound_listings_listing_type_check;
ALTER TABLE public.sound_listings
  ADD CONSTRAINT sound_listings_listing_type_check
  CHECK (listing_type IN ('sound', 'stream', 'keynote'));
