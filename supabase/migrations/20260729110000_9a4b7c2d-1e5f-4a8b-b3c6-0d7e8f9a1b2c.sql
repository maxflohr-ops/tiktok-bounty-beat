-- Owner auto-admin: maxflohr@allmylifeproductions.com is always staff.
-- Grant now if the account exists, and auto-grant whenever that email signs in
-- (e.g. first Google OAuth login creates the user). The grant requires a
-- CONFIRMED email so a stranger can't gain admin by merely typing this address
-- into the password signup form — Google logins arrive already confirmed.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'maxflohr@allmylifeproductions.com'
  AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'maxflohr@allmylifeproductions.com'
     AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS owner_admin_on_signup ON auth.users;
CREATE TRIGGER owner_admin_on_signup
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();
