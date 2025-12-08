-- Create blocked_users table to track users that have been blocked
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own blocked users
CREATE POLICY "Users can view their own blocked users"
  ON blocked_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own blocked users
CREATE POLICY "Users can block users"
  ON blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own blocked users (unblock)
CREATE POLICY "Users can unblock users"
  ON blocked_users
  FOR DELETE
  USING (auth.uid() = user_id);
