-- Verification Script: Check if Reply Feature is Set Up Correctly
-- Run this in Supabase SQL Editor to verify everything is configured

-- 1. Check if reply_to_id column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'messages' 
  AND column_name = 'reply_to_id';
-- Expected: Should return one row with reply_to_id | uuid | YES

-- 2. Check if delete policy exists
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'messages' 
  AND policyname = 'Users can delete their own messages';
-- Expected: Should return one row

-- 3. Check if index exists
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename = 'messages' 
  AND indexname = 'idx_messages_reply_to_id';
-- Expected: Should return one row

-- 4. Test query: Get messages with reply data (like the app does)
SELECT 
  m1.id,
  m1.content,
  m1.reply_to_id,
  m1.created_at,
  p1.full_name as sender_name,
  m2.id as reply_msg_id,
  m2.content as reply_content,
  p2.full_name as reply_author
FROM messages m1
LEFT JOIN profiles p1 ON m1.user_id = p1.id
LEFT JOIN messages m2 ON m1.reply_to_id = m2.id
LEFT JOIN profiles p2 ON m2.user_id = p2.id
ORDER BY m1.created_at DESC
LIMIT 10;
-- Expected: Should return your recent messages
-- If reply_to_id is not null, you should see reply_content and reply_author

-- 5. Summary: Count messages with replies
SELECT 
  COUNT(*) as total_messages,
  COUNT(reply_to_id) as messages_with_replies,
  COUNT(reply_to_id) * 100.0 / COUNT(*) as reply_percentage
FROM messages;
-- Expected: Shows how many messages are replies
