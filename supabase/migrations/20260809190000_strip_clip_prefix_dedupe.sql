-- 1) Remove the stale rename-generation duplicates (Dog Legion / Songs of
--    Legion variants) - but never a row that already has submissions.
DELETE FROM public.bounties b
WHERE b.title IN (
  'Clip Dog Legion — Lyric Edits (any song)',
  'Dog Legion — Lyric Edits (any song)',
  'Clip Songs of Legion — Lyric Edits (any song)',
  'Songs of Legion — Lyric Edits (any song)'
)
AND NOT EXISTS (SELECT 1 FROM public.submissions s WHERE s.bounty_id = b.id);

-- 2) Strip the 'Clip ' prefix from every remaining bounty title, skipping
--    any row whose stripped title already exists (no accidental twins).
UPDATE public.bounties b
SET title = right(b.title, -5),
    updated_at = now()
WHERE b.title LIKE 'Clip %'
  AND NOT EXISTS (
    SELECT 1 FROM public.bounties b2 WHERE b2.title = right(b.title, -5)
  );
