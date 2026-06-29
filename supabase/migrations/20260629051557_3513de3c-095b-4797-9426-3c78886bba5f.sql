
CREATE TABLE public.marketplace_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  category text DEFAULT 'general',
  price integer NOT NULL DEFAULT 0,
  thumbnail_url text,
  banner_url text,
  screenshots jsonb NOT NULL DEFAULT '[]'::jsonb,
  file_path text,
  file_name text,
  file_size bigint DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  download_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marketplace_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_products TO authenticated;
GRANT ALL ON public.marketplace_products TO service_role;

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published products"
  ON public.marketplace_products FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert products"
  ON public.marketplace_products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.marketplace_products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.marketplace_products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_marketplace_products_slug ON public.marketplace_products(slug);
CREATE INDEX idx_marketplace_products_published ON public.marketplace_products(is_published, created_at DESC);

CREATE TRIGGER marketplace_products_updated_at
  BEFORE UPDATE ON public.marketplace_products
  FOR EACH ROW EXECUTE FUNCTION public.set_telegram_alert_settings_updated_at();


CREATE TABLE public.marketplace_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text,
  customer_name text,
  amount integer NOT NULL DEFAULT 0,
  payment_id text,
  razorpay_order_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.marketplace_downloads TO authenticated;
GRANT ALL ON public.marketplace_downloads TO service_role;

ALTER TABLE public.marketplace_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own downloads"
  ON public.marketplace_downloads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can record their own downloads"
  ON public.marketplace_downloads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX idx_marketplace_downloads_product ON public.marketplace_downloads(product_id);
CREATE INDEX idx_marketplace_downloads_user ON public.marketplace_downloads(user_id);
