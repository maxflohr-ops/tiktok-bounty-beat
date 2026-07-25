
CREATE TABLE public.sound_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  song_title TEXT NOT NULL,
  tiktok_sound_url TEXT,
  spotify_url TEXT,
  contact_email TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  amount_cents INTEGER NOT NULL DEFAULT 20000,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  listed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.sound_listings TO authenticated;
GRANT ALL ON public.sound_listings TO service_role;

ALTER TABLE public.sound_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their listings"
  ON public.sound_listings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Signed-in users can create their listings"
  ON public.sound_listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can update listings"
  ON public.sound_listings FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER sound_listings_updated_at
  BEFORE UPDATE ON public.sound_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX sound_listings_user_idx ON public.sound_listings(user_id);
CREATE INDEX sound_listings_status_idx ON public.sound_listings(status);
