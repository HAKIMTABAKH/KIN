-- Fix RLS policies for friendships table to allow viewing friend counts on user profiles
-- This allows users to see the count of friends for any user profile they visit

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view friendships they are part of" ON friendships;
DROP POLICY IF EXISTS "Users can view all accepted friendships" ON friendships;
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can view accepted friendships" ON friendships;

-- Single comprehensive SELECT policy:
-- Users can view:
-- 1. Any friendship they are part of (any status)
-- 2. Any accepted friendship (for viewing other users' friend counts)
CREATE POLICY "Users can view friendships"
ON friendships
FOR SELECT
USING (
  auth.uid() = requester_id 
  OR auth.uid() = receiver_id
  OR status = 'accepted'
);

-- Users can insert friendships where they are the requester
CREATE POLICY "Users can create friend requests"
ON friendships
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Users can update friendships where they are the receiver (to accept requests)
CREATE POLICY "Users can accept friend requests"
ON friendships
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Users can delete friendships where they are involved
CREATE POLICY "Users can delete friendships they are part of"
ON friendships
FOR DELETE
USING (
  auth.uid() = requester_id 
  OR auth.uid() = receiver_id
);
