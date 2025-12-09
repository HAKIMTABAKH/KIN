-- Fix RLS policies for deleted_rooms table

-- Drop and recreate SELECT policy
DROP POLICY IF EXISTS "Users can view their own deleted rooms" ON deleted_rooms;

CREATE POLICY "Users can view their own deleted rooms"
  ON deleted_rooms FOR SELECT
  USING (user_id = auth.uid());

-- Add UPDATE policy (needed for upsert)
DROP POLICY IF EXISTS "Users can update their own deleted rooms" ON deleted_rooms;

CREATE POLICY "Users can update their own deleted rooms"
  ON deleted_rooms FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
