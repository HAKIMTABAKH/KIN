-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own blocked users" ON blocked_users;
DROP POLICY IF EXISTS "Users can block users" ON blocked_users;
DROP POLICY IF EXISTS "Users can unblock users" ON blocked_users;

-- Create new policies that allow users to see blocks in both directions

-- Policy: Users can see who they blocked
CREATE POLICY "Users can view who they blocked"
  ON blocked_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can see who blocked them (needed for bidirectional blocking)
CREATE POLICY "Users can view who blocked them"
  ON blocked_users
  FOR SELECT
  USING (auth.uid() = blocked_user_id);

-- Policy: Users can insert their own blocks
CREATE POLICY "Users can block users"
  ON blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own blocks (unblock)
CREATE POLICY "Users can unblock users"
  ON blocked_users
  FOR DELETE
  USING (auth.uid() = user_id);
