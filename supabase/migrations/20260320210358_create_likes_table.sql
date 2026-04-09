/*
  # Create Likes Table for Social Features

  1. New Tables
    - `likes`
      - `id` (uuid, primary key) - Unique identifier for each like
      - `track_id` (uuid, foreign key) - References tracks table
      - `user_id` (text) - User identifier (anonymous for now)
      - `created_at` (timestamptz) - When the like was created

  2. Security
    - Enable RLS on the table
    - Add policies for:
      - Public read access (anyone can see likes)
      - Public insert access (anyone can like)
      - Public delete access (anyone can unlike)

  3. Indexes
    - Add indexes on foreign keys for better query performance
    - Add composite index on (track_id, user_id) to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL DEFAULT 'anonymous',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'likes' AND policyname = 'Anyone can view likes'
  ) THEN
    CREATE POLICY "Anyone can view likes"
      ON likes FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'likes' AND policyname = 'Anyone can insert likes'
  ) THEN
    CREATE POLICY "Anyone can insert likes"
      ON likes FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'likes' AND policyname = 'Anyone can delete their own likes'
  ) THEN
    CREATE POLICY "Anyone can delete their own likes"
      ON likes FOR DELETE
      TO public
      USING (user_id = 'anonymous');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_likes_track_id ON likes(track_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_track_user ON likes(track_id, user_id);
