
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  referral_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  referred_by UUID REFERENCES public.profiles(id),
  wallet_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Public can read referral codes" ON public.profiles FOR SELECT TO anon USING (true);

-- Referral earnings table
CREATE TABLE public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purchase_id TEXT NOT NULL,
  purchase_amount INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'credited',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own earnings" ON public.referral_earnings FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to process referral commission (5%)
CREATE OR REPLACE FUNCTION public.process_referral_commission(
  p_user_id UUID,
  p_purchase_id TEXT,
  p_purchase_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_commission INTEGER;
BEGIN
  SELECT referred_by INTO v_referrer_id FROM public.profiles WHERE id = p_user_id;
  
  IF v_referrer_id IS NOT NULL THEN
    v_commission := (p_purchase_amount * 5) / 100;
    
    INSERT INTO public.referral_earnings (referrer_id, referred_user_id, purchase_id, purchase_amount, commission_amount)
    VALUES (v_referrer_id, p_user_id, p_purchase_id, p_purchase_amount, v_commission);
    
    UPDATE public.profiles SET wallet_balance = wallet_balance + v_commission, updated_at = now()
    WHERE id = v_referrer_id;
  END IF;
END;
$$;
