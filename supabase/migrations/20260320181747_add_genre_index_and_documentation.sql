/*
  # Add Genre Index and Documentation

  1. Performance Improvements
    - Add index on genre column for faster filtering by genre
    
  2. Documentation
    - Document all supported genres in database comments
    - Genres organized by category: Global, Africa, Diaspora, Others
    
  3. Supported Genres
    
    Global (13):
    - Pop, Rock, Hip Hop, R&B, Jazz, Electronic, Classical, Country, Reggae, Latin, Indie, Metal, K-Pop
    
    Africa (19):
    - Afrobeat, Amapiano, Afro House, Afro Pop, Bongo Flava, Gqom, Highlife, Makossa, Soukous, Ndombolo, 
      Coupe-Decale, Fuji, Palmwine, Semba, Kizomba, Kuduro, Funaná, Coladeira, Morna
    
    Diaspora (2):
    - Zouk, Tarraxinha
    
    Others (3):
    - Gospel, Traditional, Instrumental
    
  Total: 37 genres covering global music with strong African representation
*/

-- Add index on genre for better query performance
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);

-- Add comment to document supported genres
COMMENT ON COLUMN tracks.genre IS 'Music genre. Supported: Pop, Rock, Hip Hop, R&B, Jazz, Electronic, Classical, Country, Reggae, Latin, Indie, Metal, K-Pop, Afrobeat, Amapiano, Afro House, Afro Pop, Bongo Flava, Gqom, Highlife, Makossa, Soukous, Ndombolo, Coupe-Decale, Fuji, Palmwine, Semba, Kizomba, Kuduro, Funaná, Coladeira, Morna, Zouk, Tarraxinha, Gospel, Traditional, Instrumental';
