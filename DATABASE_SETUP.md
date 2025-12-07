# Database Setup for Reactions

## Add Reactions Column to Messages Table

You need to add a `reactions` column to your `messages` table in Supabase to store message reactions.

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Add reactions column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_reactions ON messages USING GIN (reactions);
```

5. Click **Run** to execute the query

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Apply the migration
supabase db push

# Or run the migration file directly
supabase db execute -f supabase/migrations/add_reactions_to_messages.sql
```

### Verify the Column Was Added

Run this query in SQL Editor to verify:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'messages' AND column_name = 'reactions';
```

You should see:
- **column_name**: reactions
- **data_type**: jsonb
- **column_default**: '{}'::jsonb

### Data Structure

The `reactions` column stores data in this format:

```json
{
  "❤️": ["user-id-1", "user-id-2"],
  "😂": ["user-id-3"],
  "👍": ["user-id-1"]
}
```

Where:
- **Keys** are emoji strings
- **Values** are arrays of user IDs who reacted with that emoji

### Testing

After adding the column, test by:
1. Long-pressing a message in the chat
2. Selecting an emoji reaction
3. Check the database to see the reaction saved

### Troubleshooting

If reactions still don't save, follow these steps:

#### Step 1: Check RLS Policies

Row Level Security might be blocking updates. Run this in SQL Editor:

```sql
-- Check existing policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'messages';
```

If you see policies but no UPDATE policy, or if the UPDATE policy is too restrictive, run:

```sql
-- Simple policy that allows all authenticated users to update messages
CREATE POLICY "Authenticated users can update messages"
ON messages
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

#### Step 2: Check if RLS is enabled

```sql
-- Check if RLS is enabled on messages table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages';
```

If `rowsecurity` is `true` but you have no UPDATE policy, that's the problem!

#### Step 3: Test Manual Update

Try updating a message manually:

```sql
-- First, get a message ID
SELECT id, content FROM messages LIMIT 1;

-- Then try to update it (replace 'your-message-id' with actual ID)
UPDATE messages 
SET reactions = '{"❤️": ["test-user-id"]}'::jsonb 
WHERE id = 'your-message-id';

-- Check if it worked
SELECT id, content, reactions FROM messages WHERE id = 'your-message-id';
```

If the manual update works, the column is fine and it's an RLS policy issue.

#### Step 4: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab when you try to react. Look for error messages that say:

- "new row violates row-level security policy" → RLS policy issue
- "column does not exist" → Column wasn't created properly
- "permission denied" → User authentication issue

#### Quick Fix (Temporary)

If you just want to test and make it work quickly, you can temporarily disable RLS:

```sql
-- TEMPORARY: Disable RLS for testing (NOT recommended for production!)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

**Important**: Re-enable RLS and add proper policies before going to production:

```sql
-- Re-enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add proper policies
CREATE POLICY "Authenticated users can update messages"
ON messages FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);
```
