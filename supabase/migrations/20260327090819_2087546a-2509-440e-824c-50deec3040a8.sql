
-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: authenticated users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can read all roles
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create withdrawals table
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL CHECK (amount > 0 AND amount <= 500),
  upi_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  processed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can read own withdrawals
CREATE POLICY "Users can read own withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can insert own withdrawals
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can read all withdrawals
CREATE POLICY "Admins can read all withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all withdrawals
CREATE POLICY "Admins can update all withdrawals" ON public.withdrawals
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins can read all earnings
CREATE POLICY "Admins can read all earnings" ON public.referral_earnings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to process withdrawal (deduct from wallet)
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount integer, p_upi_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_withdrawal_id uuid;
BEGIN
  SELECT wallet_balance INTO v_balance FROM profiles WHERE id = auth.uid();
  
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  IF p_amount > 500 THEN
    RAISE EXCEPTION 'Maximum withdrawal is ₹500';
  END IF;
  
  IF p_amount > v_balance THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  INSERT INTO withdrawals (user_id, amount, upi_id)
  VALUES (auth.uid(), p_amount, p_upi_id)
  RETURNING id INTO v_withdrawal_id;
  
  UPDATE profiles SET wallet_balance = wallet_balance - p_amount, updated_at = now()
  WHERE id = auth.uid();
  
  RETURN v_withdrawal_id;
END;
$$;

-- Function for admin to process withdrawal
CREATE OR REPLACE FUNCTION public.process_withdrawal(p_withdrawal_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id;
  
  IF v_withdrawal IS NULL THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;
  
  IF v_withdrawal.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal already processed';
  END IF;
  
  IF p_status = 'rejected' THEN
    UPDATE profiles SET wallet_balance = wallet_balance + v_withdrawal.amount, updated_at = now()
    WHERE id = v_withdrawal.user_id;
  END IF;
  
  UPDATE withdrawals SET status = p_status, processed_by = auth.uid(), processed_at = now()
  WHERE id = p_withdrawal_id;
END;
$$;
