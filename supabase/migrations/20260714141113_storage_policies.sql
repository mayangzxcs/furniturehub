/*
# Storage policies for furniture bucket

1. Security
- Public read access for furniture bucket (images are public content)
- Authenticated users can upload (avatars, post images)
- Users can delete their own files
*/

-- Ensure the furniture bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('furniture', 'furniture', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for furniture bucket
DROP POLICY IF EXISTS "furniture_bucket_public_read" ON storage.objects;
CREATE POLICY "furniture_bucket_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'furniture');

-- Authenticated users can upload to furniture bucket
DROP POLICY IF EXISTS "furniture_bucket_auth_upload" ON storage.objects;
CREATE POLICY "furniture_bucket_auth_upload" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'furniture');

-- Authenticated users can update their own files
DROP POLICY IF EXISTS "furniture_bucket_auth_update" ON storage.objects;
CREATE POLICY "furniture_bucket_auth_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'furniture') WITH CHECK (bucket_id = 'furniture');

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "furniture_bucket_auth_delete" ON storage.objects;
CREATE POLICY "furniture_bucket_auth_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'furniture');