
CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'lifetime',
  duration integer,
  status text NOT NULL DEFAULT 'available',
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  expires_at timestamptz,
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_licenses_status ON public.licenses(status);
CREATE INDEX idx_licenses_device ON public.licenses(device_id);
CREATE INDEX idx_licenses_created_at ON public.licenses(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.licenses TO authenticated;
GRANT ALL ON public.licenses TO service_role;

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read licenses" ON public.licenses
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert licenses" ON public.licenses
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update licenses" ON public.licenses
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete licenses" ON public.licenses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.license_settings (
  id boolean PRIMARY KEY DEFAULT true,
  prefix text NOT NULL DEFAULT 'MYRA',
  random_length integer NOT NULL DEFAULT 16,
  max_activations integer NOT NULL DEFAULT 1,
  device_lock boolean NOT NULL DEFAULT true,
  offline_activation boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT license_settings_singleton CHECK (id)
);

GRANT SELECT, INSERT, UPDATE ON public.license_settings TO authenticated;
GRANT ALL ON public.license_settings TO service_role;

ALTER TABLE public.license_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read license settings" ON public.license_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert license settings" ON public.license_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update license settings" ON public.license_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.license_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_licenses_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_licenses_updated_at BEFORE UPDATE ON public.licenses
FOR EACH ROW EXECUTE FUNCTION public.set_licenses_updated_at();

CREATE TRIGGER trg_license_settings_updated_at BEFORE UPDATE ON public.license_settings
FOR EACH ROW EXECUTE FUNCTION public.set_licenses_updated_at();

CREATE OR REPLACE FUNCTION public.activate_license(p_license_key text, p_device_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lic RECORD;
  v_expires timestamptz;
BEGIN
  SELECT * INTO v_lic FROM public.licenses WHERE license_key = p_license_key;
  IF v_lic IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid license key');
  END IF;
  IF v_lic.status = 'disabled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'License disabled');
  END IF;
  IF v_lic.expires_at IS NOT NULL AND v_lic.expires_at < now() THEN
    UPDATE public.licenses SET status = 'expired' WHERE id = v_lic.id;
    RETURN jsonb_build_object('success', false, 'error', 'License expired');
  END IF;
  IF v_lic.device_id IS NOT NULL AND v_lic.device_id <> p_device_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'License already activated on another device');
  END IF;
  IF v_lic.device_id = p_device_id THEN
    RETURN jsonb_build_object('success', true, 'plan', v_lic.plan, 'expires_at', v_lic.expires_at);
  END IF;

  IF v_lic.duration IS NULL THEN
    v_expires := NULL;
  ELSE
    v_expires := now() + (v_lic.duration || ' days')::interval;
  END IF;

  UPDATE public.licenses
  SET device_id = p_device_id, activated_at = now(), expires_at = v_expires, status = 'activated'
  WHERE id = v_lic.id;

  RETURN jsonb_build_object('success', true, 'plan', v_lic.plan, 'expires_at', v_expires);
END;
$$;

REVOKE ALL ON FUNCTION public.activate_license(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_license(text, text) TO anon, authenticated, service_role;
