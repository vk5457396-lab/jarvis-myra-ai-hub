
-- Public read for marketplace media (thumbnails/banners/screenshots)
CREATE POLICY "Public read marketplace media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketplace-media');

CREATE POLICY "Admins manage marketplace media"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'marketplace-media' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'marketplace-media' AND public.has_role(auth.uid(), 'admin'));

-- Private files: only admins can manage; downloads served via edge function (signed URL)
CREATE POLICY "Admins manage marketplace files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'marketplace-files' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'marketplace-files' AND public.has_role(auth.uid(), 'admin'));
