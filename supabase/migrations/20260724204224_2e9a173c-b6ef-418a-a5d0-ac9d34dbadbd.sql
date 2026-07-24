
-- 1) Hide sensitive Stripe columns on bounties from client roles (defense in depth alongside RLS)
REVOKE SELECT (stripe_customer_id, top_up_session_id) ON public.bounties FROM anon, authenticated;

-- 2) Allow bounty creators to read their own payment records
CREATE POLICY "bounty creators read own payments"
  ON public.bounty_payments
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- 3) Switch role-check helpers to SECURITY INVOKER so signed-in users
--    calling them cannot bypass RLS on user_roles. The user_roles
--    "users read own roles" policy still lets is_staff(auth.uid()) and
--    has_role(auth.uid(), ...) work for the caller's own row inside RLS.
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
