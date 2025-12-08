# Database Migrations

## Running the Migration

To apply the `deleted_rooms` table migration, run this SQL in your Supabase SQL Editor:

```sql
-- Create a table to track when users "delete" a room (soft delete)
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
```

## What This Does

This migration creates a `deleted_rooms` table that tracks when users "delete" a chat:

- **Soft Delete**: When User A deletes a chat, it's marked in `deleted_rooms` but stays in the database
- **User B Unaffected**: User B still sees all messages
- **User A Fresh Start**: User A only sees messages sent AFTER they deleted the chat
- **One Room**: Only ONE DM room exists between two users (no duplicates)
- **Rejoin**: When User A clicks on User B again, they rejoin the same room but only see new messages

## How It Works

1. User A deletes chat → Record added to `deleted_rooms` with timestamp
2. User B still sees everything (not in their `deleted_rooms`)
3. User A clicks on User B → Removes record from `deleted_rooms`, rejoins room
4. User A only sees messages created after the delete timestamp
5. No duplicate rooms created!
