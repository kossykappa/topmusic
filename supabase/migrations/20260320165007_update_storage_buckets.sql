/*
  # Update Storage Buckets

  1. Storage Updates
    - Create 'tracks' bucket for audio files
    - Create 'covers' bucket for cover images
    - Set up public access policies for both buckets

  2. Notes
    - Buckets are created with public access for easy retrieval
    - Policies allow anyone to upload and view files
*/

-- Create storage buckets for tracks and covers
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('tracks', 'tracks', true),
  ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tracks
CREATE POLICY "Public can view tracks"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'tracks');

CREATE POLICY "Anyone can upload tracks"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'tracks');

-- Storage policies for covers
CREATE POLICY "Public can view covers"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'covers');

CREATE POLICY "Anyone can upload covers"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'covers');