ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS access_mode text;

ALTER TABLE public.bounties
  DROP CONSTRAINT IF EXISTS bounties_visibility_check;
ALTER TABLE public.bounties
  ADD CONSTRAINT bounties_visibility_check CHECK (visibility IN ('public','private'));

ALTER TABLE public.bounties
  DROP CONSTRAINT IF EXISTS bounties_access_mode_check;
ALTER TABLE public.bounties
  ADD CONSTRAINT bounties_access_mode_check CHECK (access_mode IS NULL OR access_mode IN ('invite','apply'));

ALTER TABLE public.bounties
  DROP CONSTRAINT IF EXISTS bounties_private_needs_access_mode;
ALTER TABLE public.bounties
  ADD CONSTRAINT bounties_private_needs_access_mode
  CHECK (visibility = 'public' OR access_mode IS NOT NULL);

GRANT SELECT (visibility, access_mode) ON public.bounties TO authenticated, anon;

CREATE TABLE IF NOT EXISTS public.bounty_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('invited','accepted','applied','approved','rejected')),
  message text,
  tiktok_handle text,
  invited_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  decided_at timestamp with time zone,
  CONSTRAINT bounty_access_bounty_user_unique UNIQUE (bounty_id, user_id)
);

GRANT SELECT, INSERT ON public.bounty_access TO authenticated;
GRANT ALL ON public.bounty_access TO service_role;

ALTER TABLE public.bounty_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own access rows" ON public.bounty_access;
CREATE POLICY "users read own access rows" ON public.bounty_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "users apply to private apply bounties" ON public.bounty_access;
CREATE POLICY "users apply to private apply bounties" ON public.bounty_access
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'applied'
    AND EXISTS (
      SELECT 1 FROM public.bounties b
      WHERE b.id = bounty_access.bounty_id
        AND b.visibility = 'private'
        AND b.access_mode = 'apply'
    )
  );

DROP POLICY IF EXISTS "staff update access rows" ON public.bounty_access;
CREATE POLICY "staff update access rows" ON public.bounty_access
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff delete access rows" ON public.bounty_access;
CREATE POLICY "staff delete access rows" ON public.bounty_access
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS bounty_access_updated_at ON public.bounty_access;
CREATE TRIGGER bounty_access_updated_at BEFORE UPDATE ON public.bounty_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS bounty_access_user_idx ON public.bounty_access(user_id);
CREATE INDEX IF NOT EXISTS bounty_access_bounty_idx ON public.bounty_access(bounty_id);

ALTER TABLE public.sound_listings
  ADD COLUMN IF NOT EXISTS campaign_access text NOT NULL DEFAULT 'public';
ALTER TABLE public.sound_listings
  DROP CONSTRAINT IF EXISTS sound_listings_campaign_access_check;
ALTER TABLE public.sound_listings
  ADD CONSTRAINT sound_listings_campaign_access_check
  CHECK (campaign_access IN ('public','private_invite','private_apply'));