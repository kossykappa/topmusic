/*
  # Add Media Type Support to Tracks

  1. Changes to Existing Tables
    - `tracks`
      - Add `media_type` (text, either 'audio' or 'video')
      - Defaults to 'audio' for existing tracks

  2. Notes
    - Allows platform to support both music and video content
    - Media type is automatically detected from file extension
    - Enables different player experiences for audio vs video
*/

-- Add media_type column to tracks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE tracks ADD COLUMN media_type text DEFAULT 'audio' CHECK (media_type IN ('audio', 'video'));
  END IF;
END $$;

-- Create index for media type filtering
CREATE INDEX IF NOT EXISTS idx_tracks_media_type ON tracks(media_type);