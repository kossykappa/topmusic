/*
  # Create TOPMUSIC Platform Schema

  1. New Tables
    - `artists`
      - `id` (uuid, primary key)
      - `name` (text, artist name)
      - `bio` (text, artist biography)
      - `profile_image` (text, URL to profile image)
      - `followers_count` (integer, number of followers)
      - `created_at` (timestamptz, when artist was created)
    
    - `songs`
      - `id` (uuid, primary key)
      - `artist_id` (uuid, foreign key to artists)
      - `title` (text, song title)
      - `genre` (text, music genre)
      - `language` (text, song language)
      - `audio_url` (text, URL to audio file)
      - `cover_image` (text, URL to cover image)
      - `plays_count` (integer, number of plays)
      - `created_at` (timestamptz, upload date)
    
    - `follows`
      - `id` (uuid, primary key)
      - `artist_id` (uuid, foreign key to artists)
      - `follower_name` (text, name of follower)
      - `created_at` (timestamptz, when follow occurred)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated insert/update operations
*/

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text DEFAULT '',
  profile_image text DEFAULT '',
  followers_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  title text NOT NULL,
  genre text NOT NULL,
  language text NOT NULL,
  audio_url text NOT NULL,
  cover_image text NOT NULL,
  plays_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  follower_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Artists policies (public read access)
CREATE POLICY "Anyone can view artists"
  ON artists FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create artists"
  ON artists FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update artists"
  ON artists FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Songs policies (public read access)
CREATE POLICY "Anyone can view songs"
  ON songs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can upload songs"
  ON songs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update songs"
  ON songs FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Follows policies
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can follow artists"
  ON follows FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can unfollow artists"
  ON follows FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_artist_id ON follows(artist_id);