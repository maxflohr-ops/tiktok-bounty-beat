-- The artist is Sons of Legion - rename any row created under an earlier
-- wrong name. Idempotent; no-op when the correct row exists.
UPDATE public.bounties
SET title = 'Clip Sons of Legion — Any Song, Any Edit',
    sound_name = 'Sons of Legion — any song, any edit',
    artist_song = 'Sons of Legion',
    description = 'Any Sons of Legion song, any style of edit — gameplay, lyrics, montage, whatever hits. #maddenlegion in the caption. $1 per 5,000 verified views, paid pro-rata, and views stack across your clips. 9:16 only.',
    updated_at = now()
WHERE title IN ('Clip Dog Legion — Lyric Edits (any song)', 'Clip Songs of Legion — Lyric Edits (any song)')
  AND NOT EXISTS (
    SELECT 1 FROM public.bounties WHERE title = 'Clip Sons of Legion — Any Song, Any Edit'
  );
