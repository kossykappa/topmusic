/*
  # Add video_url column to tracks table

  1. Changes
    - Add `video_url` column to `tracks` table (text, nullable)
    - This allows tracks to have optional video content
    - When video_url is present, it will be used instead of audio_url for playback
  
  2. Notes
    - Column is nullable to support both audio-only and video tracks
    - Existing tracks will have NULL video_url (audio-only by default)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE tracks ADD COLUMN video_url text;
  END IF;
END $$;
