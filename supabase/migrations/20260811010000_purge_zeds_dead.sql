-- Scrub any Zeds Dead listing outright: we never worked with them, so no row
-- carrying the name belongs anywhere it could surface (board, bounty pages
-- and their metadata, the OCC feed, clips walls). Dependent rows (submissions,
-- events, applications) go with the bounty via ON DELETE CASCADE.
-- The server mirrors this sweep in purgeBannedListings for publishes that
-- skip git-synced migrations.

DELETE FROM public.bounties
WHERE title ILIKE '%zeds dead%' OR title ILIKE '%zed''s dead%' OR title ILIKE '%zedsdead%'
   OR artist_song ILIKE '%zeds dead%' OR artist_song ILIKE '%zed''s dead%' OR artist_song ILIKE '%zedsdead%'
   OR sound_name ILIKE '%zeds dead%' OR sound_name ILIKE '%zed''s dead%' OR sound_name ILIKE '%zedsdead%'
   OR description ILIKE '%zeds dead%' OR description ILIKE '%zed''s dead%' OR description ILIKE '%zedsdead%';

DELETE FROM public.sound_listings
WHERE artist_name ILIKE '%zeds dead%' OR artist_name ILIKE '%zed''s dead%' OR artist_name ILIKE '%zedsdead%'
   OR song_title ILIKE '%zeds dead%' OR song_title ILIKE '%zed''s dead%' OR song_title ILIKE '%zedsdead%'
   OR notes ILIKE '%zeds dead%' OR notes ILIKE '%zed''s dead%' OR notes ILIKE '%zedsdead%';
