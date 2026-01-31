-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert purchases" ON public.purchases;

-- No INSERT policy needed for public role - edge function uses service role which bypasses RLS
-- The SELECT policy with (true) is intentionally for public read (counting sales) and is acceptable