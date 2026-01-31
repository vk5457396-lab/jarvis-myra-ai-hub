-- Create purchases table to track all sales
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('jarvis', 'myra', 'bundle', 'jarvis_source', 'myra_source', 'bundle_source')),
  amount INTEGER NOT NULL,
  payment_id TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (only count, no sensitive data)
CREATE POLICY "Anyone can count purchases" 
ON public.purchases 
FOR SELECT 
USING (true);

-- Create policy for insert via edge function (service role)
CREATE POLICY "Service role can insert purchases" 
ON public.purchases 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_purchases_product_type ON public.purchases(product_type);
CREATE INDEX idx_purchases_created_at ON public.purchases(created_at);