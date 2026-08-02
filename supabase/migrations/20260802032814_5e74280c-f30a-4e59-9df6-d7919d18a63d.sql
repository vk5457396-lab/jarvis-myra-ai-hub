CREATE POLICY "Users can read own devices"
ON public.devices
FOR SELECT
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update own devices"
ON public.devices
FOR UPDATE
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid())
WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());