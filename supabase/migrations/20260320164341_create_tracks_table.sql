/*
  # Create Tracks Table and Storage

  1. New Tables
    - `tracks`
      - `id` (uuid, primary key)
      - `title` (text, track title)
      - `artist_name` (text, artist name)
      - `genre` (text, music genre)
      - `language` (text, track language)
      - `audio_url` (text, URL to audio file)
      - `cover_url` (text, URL to cover image)
      - `plays_count` (integer, number of plays)
      - `created_at` (timestamptz, upload timestamp)

  2. Security
    - Enable RLS on tracks table
    - Add policies for public read access
    - Add policies for public insert access
    - Add policies for public update access

  3. Storage
    - Create storage buckets for audio files and cover images
    - Set up public access policies for storage buckets
*/

-- Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_name text NOT NULL,
  genre text NOT NULL,
  language text NOT NULL,
  audio_url text NOT NULL,
  cover_url text NOT NULL,
  plays_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Tracks policies (public access for demo purposes)
CREATE POLICY "Anyone can view tracks"
  ON tracks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can upload tracks"
  ON tracks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update tracks"
  ON tracks FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_plays_count ON tracks(plays_count DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_name ON tracks(artist_name);

-- Create storage buckets for audio files and cover images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('audio-files', 'audio-files', true),
  ('cover-images', 'cover-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio files
CREATE POLICY "Public can view audio files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'audio-files');

CREATE POLICY "Anyone can upload audio files"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'audio-files');

-- Storage policies for cover images
CREATE POLICY "Public can view cover images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'cover-images');

CREATE POLICY "Anyone can upload cover images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'cover-images');