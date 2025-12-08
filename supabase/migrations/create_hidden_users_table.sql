-- Create hidden_users table to track users that have been hidden from suggestions
CREATE TABLE IF NOT EXISTS hidden_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hidden_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, hidden_user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_hidden_users_user_id ON hidden_users(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_users_hidden_user_id ON hidden_users(hidden_user_id);

-- Enable RLS
ALTER TABLE hidden_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own hidden users
CREATE POLICY "Users can view their own hidden users"
  ON hidden_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own hidden users
CREATE POLICY "Users can hide users"
  ON hidden_users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own hidden users (unhide)
CREATE POLICY "Users can unhide users"
  ON hidden_users
  FOR DELETE
  USING (auth.uid() = user_id);
