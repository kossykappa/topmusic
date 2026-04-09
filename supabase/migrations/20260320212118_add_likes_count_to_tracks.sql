/*
  # Add likes_count to tracks table

  1. Changes
    - Add `likes_count` column to `tracks` table (integer, default 0)
    - Create function to update likes_count when likes are added/removed
    - Create trigger to automatically update likes_count
  
  2. Notes
    - Denormalized field for performance (avoids counting likes on every query)
    - Automatically maintained by triggers
    - Defaults to 0 for existing tracks
*/

-- Add likes_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE tracks ADD COLUMN likes_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_track_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tracks SET likes_count = likes_count + 1 WHERE id = NEW.track_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tracks SET likes_count = likes_count - 1 WHERE id = OLD.track_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS track_likes_count_trigger ON likes;
CREATE TRIGGER track_likes_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_track_likes_count();

-- Initialize likes_count for existing tracks
UPDATE tracks
SET likes_count = (
  SELECT COUNT(*)
  FROM likes
  WHERE likes.track_id = tracks.id
);