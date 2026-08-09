-- The song is "Anticipate Heartbreak" - rename any row created under the
-- short title. Idempotent; no-op when the new title already exists.
UPDATE public.bounties
SET title = 'Clip Ebril — Anticipate Heartbreak',
    sound_name = 'Ebril — Anticipate Heartbreak (drops soon)',
    description = replace(description, 'the moment "Heartbreak" lands', 'the moment "Anticipate Heartbreak" lands'),
    updated_at = now()
WHERE title = 'Clip Ebril — Heartbreak'
  AND NOT EXISTS (
    SELECT 1 FROM public.bounties WHERE title = 'Clip Ebril — Anticipate Heartbreak'
  );
