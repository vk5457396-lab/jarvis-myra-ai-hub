CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF lower(COALESCE(NEW.email, '')) IN ('vikash@gmail.com', 'vk5457396@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_referral_wallet(
  p_referrer_id uuid,
  p_purchase_id text,
  p_purchase_amount integer,
  p_referred_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_commission integer;
BEGIN
  IF p_referrer_id IS NULL OR p_purchase_amount IS NULL OR p_purchase_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid referral credit payload';
  END IF;

  v_commission := GREATEST((p_purchase_amount * 5) / 100, 0);

  IF v_commission <= 0 THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.referral_earnings
    WHERE purchase_id = p_purchase_id
      AND referrer_id = p_referrer_id
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.referral_earnings (
    referrer_id,
    referred_user_id,
    purchase_id,
    purchase_amount,
    commission_amount
  ) VALUES (
    p_referrer_id,
    COALESCE(p_referred_user_id, p_referrer_id),
    p_purchase_id,
    p_purchase_amount,
    v_commission
  );

  UPDATE public.profiles
  SET wallet_balance = wallet_balance + v_commission,
      updated_at = now()
  WHERE id = p_referrer_id;
END;
$$;