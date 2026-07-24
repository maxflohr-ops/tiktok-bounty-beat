
-- Contract numbering
CREATE SEQUENCE IF NOT EXISTS public.bounty_contract_no_seq START 1;

-- Extend enums (Postgres only allows ADD VALUE)
ALTER TYPE public.bounty_status ADD VALUE IF NOT EXISTS 'claimed';
ALTER TYPE public.bounty_status ADD VALUE IF NOT EXISTS 'in_review';
ALTER TYPE public.bounty_status ADD VALUE IF NOT EXISTS 'fulfilled';
ALTER TYPE public.bounty_status ADD VALUE IF NOT EXISTS 'expired';

ALTER TYPE public.submission_status ADD VALUE IF NOT EXISTS 'claimed';
ALTER TYPE public.submission_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE public.submission_status ADD VALUE IF NOT EXISTS 'paid';

-- New payout / platform enums
DO $$ BEGIN
  CREATE TYPE public.payout_type AS ENUM ('flat', 'per_1k_views');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.platform_target AS ENUM ('tiktok', 'reels', 'shorts');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bounty additions
ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS contract_no bigint UNIQUE,
  ADD COLUMN IF NOT EXISTS artist_song text,
  ADD COLUMN IF NOT EXISTS source_assets_url text,
  ADD COLUMN IF NOT EXISTS payout_type public.payout_type NOT NULL DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS platform_target public.platform_target NOT NULL DEFAULT 'tiktok';

-- Backfill contract numbers on any existing rows
UPDATE public.bounties
SET contract_no = nextval('public.bounty_contract_no_seq')
WHERE contract_no IS NULL;

ALTER TABLE public.bounties
  ALTER COLUMN contract_no SET DEFAULT nextval('public.bounty_contract_no_seq'),
  ALTER COLUMN contract_no SET NOT NULL;

-- Submissions: allow claim-first, deliver-later
ALTER TABLE public.submissions
  ALTER COLUMN tiktok_video_url DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- One claim per clipper per bounty
CREATE UNIQUE INDEX IF NOT EXISTS submissions_bounty_editor_unique
  ON public.submissions(bounty_id, editor_id);
