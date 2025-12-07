-- Add reactions column to messages table
-- This column stores reactions as a JSONB object where keys are emojis and values are arrays of user IDs
-- Example: { "❤️": ["user-id-1", "user-id-2"], "😂": ["user-id-3"] }

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_reactions ON messages USING GIN (reactions);

-- Add a comment to document the column
COMMENT ON COLUMN messages.reactions IS 'Stores message reactions as JSONB. Format: { "emoji": ["userId1", "userId2"] }';
