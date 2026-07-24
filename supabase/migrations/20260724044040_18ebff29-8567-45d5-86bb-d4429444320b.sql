
-- Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'editor');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','manager')
  );
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  tiktok_handle text,
  avatar_url text,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default editor role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'editor');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bounties
CREATE TYPE public.bounty_status AS ENUM ('draft','active','closed');

CREATE TABLE public.bounties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  sound_name text NOT NULL,
  tiktok_sound_url text,
  cover_url text,
  reward_points integer NOT NULL DEFAULT 0,
  reward_cash_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  max_submissions integer,
  deadline timestamptz,
  status public.bounty_status NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bounties TO authenticated;
GRANT ALL ON public.bounties TO service_role;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bounties readable to authenticated" ON public.bounties
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage bounties insert" ON public.bounties
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff manage bounties update" ON public.bounties
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff manage bounties delete" ON public.bounties
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER bounties_updated BEFORE UPDATE ON public.bounties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Submissions
CREATE TYPE public.submission_status AS ENUM ('pending','approved','rejected');

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  editor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tiktok_video_url text NOT NULL,
  tiktok_handle text NOT NULL,
  oembed_title text,
  oembed_author text,
  oembed_thumbnail text,
  auto_check_passed boolean NOT NULL DEFAULT false,
  auto_check_notes text,
  status public.submission_status NOT NULL DEFAULT 'pending',
  awarded_points integer NOT NULL DEFAULT 0,
  awarded_cash_cents integer NOT NULL DEFAULT 0,
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "editor reads own submissions" ON public.submissions
  FOR SELECT TO authenticated USING (auth.uid() = editor_id OR public.is_staff(auth.uid()));
CREATE POLICY "editor inserts own submission" ON public.submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = editor_id);
CREATE POLICY "staff updates submissions" ON public.submissions
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff deletes submissions" ON public.submissions
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER submissions_updated BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX submissions_bounty_idx ON public.submissions(bounty_id);
CREATE INDEX submissions_editor_idx ON public.submissions(editor_id);
CREATE INDEX submissions_status_idx ON public.submissions(status);
