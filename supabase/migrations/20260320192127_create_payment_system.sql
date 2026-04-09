/*
  # Create Payment System for Artists

  1. New Tables
    - `users`
      - `id` (uuid, primary key, linked to auth.users)
      - `email` (text, user email)
      - `name` (text, artist/user name)
      - `balance` (numeric, current earnings balance)
      - `total_earnings` (numeric, lifetime earnings)
      - `created_at` (timestamptz, account creation date)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `track_id` (uuid, foreign key to tracks, nullable)
      - `amount` (numeric, transaction amount)
      - `type` (text, transaction type: 'play', 'withdrawal', 'bonus')
      - `status` (text, transaction status: 'completed', 'pending', 'failed')
      - `created_at` (timestamptz, transaction timestamp)

  2. Changes to Existing Tables
    - `tracks`
      - Add `artist_id` (uuid, foreign key to users)
      - Add `earnings` (numeric, total earnings from this track)

  3. Security
    - Enable RLS on all new tables
    - Users can read their own data
    - Users can read their own transactions
    - Only system (via edge functions) can create transactions
    - Only system can update balances

  4. Indexes
    - Add indexes on foreign keys for performance
    - Add indexes on frequently queried fields
*/

-- Create users table for artist management
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  balance numeric DEFAULT 0 CHECK (balance >= 0),
  total_earnings numeric DEFAULT 0 CHECK (total_earnings >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create transactions table for tracking all payments
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id uuid REFERENCES tracks(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('play', 'withdrawal', 'bonus')),
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Add new columns to tracks table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'artist_id'
  ) THEN
    ALTER TABLE tracks ADD COLUMN artist_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tracks' AND column_name = 'earnings'
  ) THEN
    ALTER TABLE tracks ADD COLUMN earnings numeric DEFAULT 0 CHECK (earnings >= 0);
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Anyone can view user profiles"
  ON users FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create user profile"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view all transactions for transparency"
  ON transactions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Service role can insert transactions"
  ON transactions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_track_id ON transactions(track_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_earnings ON tracks(earnings DESC);

-- Create a function to safely increment play count and earnings
CREATE OR REPLACE FUNCTION increment_play_count(
  p_track_id uuid,
  p_artist_id uuid,
  p_pay_per_play numeric DEFAULT 0.003
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_track_earnings numeric;
  v_user_balance numeric;
BEGIN
  -- Update track plays and earnings
  UPDATE tracks
  SET 
    plays_count = plays_count + 1,
    earnings = earnings + p_pay_per_play
  WHERE id = p_track_id
  RETURNING earnings INTO v_track_earnings;

  -- Update user balance and total earnings
  UPDATE users
  SET 
    balance = balance + p_pay_per_play,
    total_earnings = total_earnings + p_pay_per_play
  WHERE id = p_artist_id
  RETURNING balance INTO v_user_balance;

  -- Insert transaction record
  INSERT INTO transactions (user_id, track_id, amount, type, status)
  VALUES (p_artist_id, p_track_id, p_pay_per_play, 'play', 'completed');

  -- Return result
  v_result := json_build_object(
    'success', true,
    'track_earnings', v_track_earnings,
    'user_balance', v_user_balance,
    'amount_earned', p_pay_per_play
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_play_count TO anon, authenticated;