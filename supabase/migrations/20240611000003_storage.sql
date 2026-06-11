-- Safar: Storage buckets and policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('report-images', 'report-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('community-uploads', 'community-uploads', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Report images
CREATE POLICY "report_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'report-images');

CREATE POLICY "report_images_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'report-images' AND auth.role() = 'authenticated');

CREATE POLICY "report_images_own_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Community uploads
CREATE POLICY "community_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-uploads');

CREATE POLICY "community_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'community-uploads' AND auth.role() = 'authenticated');
