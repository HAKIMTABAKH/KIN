-- Create a table to track when users "delete" a room (soft delete)
-- This allows them to hide messages but keep the room for the other user

CREATE TABLE IF NOT EXISTS deleted_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- Add RLS policies
ALTER TABLE deleted_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deleted rooms"
  ON deleted_rooms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rooms"
  ON deleted_rooms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can restore their deleted rooms"
  ON deleted_rooms FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_deleted_rooms_user_room ON deleted_rooms(user_id, room_id);
