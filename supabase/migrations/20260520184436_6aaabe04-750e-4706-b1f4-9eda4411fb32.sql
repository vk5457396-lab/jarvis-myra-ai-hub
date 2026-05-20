
-- 1) Profiles: drop overly permissive anon policy
DROP POLICY IF EXISTS "Public can read referral codes" ON public.profiles;

-- Safe referral lookup function for anon (signup + referral banner)
CREATE OR REPLACE FUNCTION public.get_referrer_by_code(_code text)
RETURNS TABLE (id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name FROM public.profiles WHERE referral_code = _code LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_referrer_by_code(text) TO anon, authenticated;

-- 2) Profiles: prevent user-driven changes to protected columns
CREATE OR REPLACE FUNCTION public.prevent_protected_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.id := OLD.id;
  NEW.email := OLD.email;
  NEW.wallet_balance := OLD.wallet_balance;
  NEW.referral_code := OLD.referral_code;
  NEW.referred_by := OLD.referred_by;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_columns ON public.profiles;
CREATE TRIGGER profiles_protect_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_protected_profile_updates();

-- 3) Purchases: drop public read, expose aggregate via RPC
DROP POLICY IF EXISTS "Anyone can count purchases" ON public.purchases;

CREATE OR REPLACE FUNCTION public.get_purchase_counts()
RETURNS TABLE (product_type text, count bigint, revenue bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT product_type, COUNT(*)::bigint AS count, COALESCE(SUM(amount),0)::bigint AS revenue
  FROM public.purchases
  GROUP BY product_type;
$$;

GRANT EXECUTE ON FUNCTION public.get_purchase_counts() TO anon, authenticated;
