# Database Setup - IMPORTANT!

## ⚠️ You MUST run this SQL migration first!

The chat delete feature requires a new database table. Follow these steps:

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run This SQL

Copy and paste this entire SQL script into the SQL Editor and click "Run":

```sql
-- Create deleted_rooms table for soft delete functionality
CREATE TABLE IF NOT EXISTS deleted_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- Enable Row Level Security
ALTER TABLE deleted_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own deleted rooms"
  ON deleted_rooms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rooms"
  ON deleted_rooms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can restore their deleted rooms"
  ON deleted_rooms FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_deleted_rooms_user_room 
  ON deleted_rooms(user_id, room_id);
```

### Step 3: Verify

After running the SQL, verify the table was created:

```sql
SELECT * FROM deleted_rooms;
```

You should see an empty table with columns: `id`, `user_id`, `room_id`, `deleted_at`

### Step 4: Test

Now the delete feature will work correctly:
- User A deletes chat → Old messages hidden
- User A clicks friend → Rejoins same room, sees only NEW messages
- User B unaffected → Sees all messages
- No duplicate rooms!

---

## What This Does

**Before Migration:**
- ❌ Delete creates duplicate rooms
- ❌ User A sees old messages after rejoining
- ❌ User B gets multiple rooms with same person

**After Migration:**
- ✅ Delete hides old messages for User A only
- ✅ User A sees fresh conversation after rejoining
- ✅ User B keeps all history
- ✅ Only ONE room between two users
