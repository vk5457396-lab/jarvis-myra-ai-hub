ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS activation_token text;
CREATE UNIQUE INDEX IF NOT EXISTS licenses_license_key_key ON public.licenses (license_key);