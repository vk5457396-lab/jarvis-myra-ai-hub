GRANT SELECT ON public.marketplace_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_products TO authenticated;
GRANT ALL ON public.marketplace_products TO service_role;

GRANT SELECT, INSERT ON public.marketplace_downloads TO anon;
GRANT SELECT, INSERT ON public.marketplace_downloads TO authenticated;
GRANT ALL ON public.marketplace_downloads TO service_role;