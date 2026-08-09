-- The artist is Songs of Legion, not Dog Legion - rename any row created
-- under the wrong name. Idempotent; no-op when the correct row exists.
UPDATE public.bounties
SET title = 'Clip Songs of Legion — Lyric Edits (any song)',
    sound_name = 'Songs of Legion — any song (lyric edit)',
    artist_song = 'Songs of Legion',
    description = replace(description, 'Dog Legion', 'Songs of Legion'),
    updated_at = now()
WHERE title = 'Clip Dog Legion — Lyric Edits (any song)'
  AND NOT EXISTS (
    SELECT 1 FROM public.bounties WHERE title = 'Clip Songs of Legion — Lyric Edits (any song)'
  );
