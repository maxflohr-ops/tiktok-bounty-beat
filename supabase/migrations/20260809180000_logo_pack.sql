-- Campaign logo program: every delivered clip must carry the campaign logo
-- overlay. logo_pack_url holds the Google Drive download for the logos and
-- renders as its own area on the bounty page.
ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS logo_pack_url text;
GRANT SELECT (logo_pack_url) ON public.bounties TO authenticated, anon;

-- Stamp the rule on the launch bounties that don't state it yet.
UPDATE public.bounties
SET rules = CASE
      WHEN rules IS NULL OR rules = '' THEN 'Campaign logo overlay required on every delivered clip — grab it from the logo pack on this contract.'
      ELSE rules || E'\n' || 'Campaign logo overlay required on every delivered clip — grab it from the logo pack on this contract.'
    END,
    updated_at = now()
WHERE title IN (
  'Clip Ebril''s Thursday Twitch stream',
  'Clip Ebril — Anticipate Heartbreak',
  'Clip Sons of Legion — Any Song, Any Edit',
  'Clip Ridgeclub — Biting Bullets'
)
  AND (rules IS NULL OR rules NOT LIKE '%logo overlay%');
