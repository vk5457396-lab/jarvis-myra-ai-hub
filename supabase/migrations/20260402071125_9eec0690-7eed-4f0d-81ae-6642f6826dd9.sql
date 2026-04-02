CREATE TABLE IF NOT EXISTS public.telegram_alert_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bot_token_ciphertext text NOT NULL,
  bot_token_iv text NOT NULL,
  bot_token_mask text NOT NULL,
  chat_id text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_alert_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own telegram alert settings" ON public.telegram_alert_settings;
CREATE POLICY "Users can view own telegram alert settings"
ON public.telegram_alert_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own telegram alert settings" ON public.telegram_alert_settings;
CREATE POLICY "Users can create own telegram alert settings"
ON public.telegram_alert_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own telegram alert settings" ON public.telegram_alert_settings;
CREATE POLICY "Users can update own telegram alert settings"
ON public.telegram_alert_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own telegram alert settings" ON public.telegram_alert_settings;
CREATE POLICY "Users can delete own telegram alert settings"
ON public.telegram_alert_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_telegram_alert_settings_enabled
ON public.telegram_alert_settings (is_enabled);

CREATE OR REPLACE FUNCTION public.set_telegram_alert_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_telegram_alert_settings_updated_at ON public.telegram_alert_settings;
CREATE TRIGGER set_telegram_alert_settings_updated_at
BEFORE UPDATE ON public.telegram_alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_telegram_alert_settings_updated_at();