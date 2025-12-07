-- Check existing RLS policies on messages table
-- Run this first to see what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'messages';

-- If RLS is enabled but no UPDATE policy exists, add one
-- This allows authenticated users to update messages (including reactions)

-- Drop existing update policy if it's too restrictive
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;

-- Create a new policy that allows users to update messages in rooms they're part of
CREATE POLICY "Users can update messages in their rooms"
ON messages
FOR UPDATE
TO authenticated
USING (
    -- User must be a member of the room
    EXISTS (
        SELECT 1 FROM user_rooms
        WHERE user_rooms.room_id = messages.room_id
        AND user_rooms.user_id = auth.uid()
    )
)
WITH CHECK (
    -- User must be a member of the room
    EXISTS (
        SELECT 1 FROM user_rooms
        WHERE user_rooms.room_id = messages.room_id
        AND user_rooms.user_id = auth.uid()
    )
);

-- Alternative: If you don't have user_rooms table, use this simpler policy
-- Uncomment if needed:
/*
DROP POLICY IF EXISTS "Users can update messages in their rooms" ON messages;

CREATE POLICY "Authenticated users can update messages"
ON messages
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
*/
