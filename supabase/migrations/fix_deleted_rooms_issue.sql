-- Fix for deleted rooms issue
-- This migration documents the fix for two related issues:
-- 1. Old messages reappearing when reopening a deleted chat
-- 2. Room not reappearing in chat list after sending a message

-- No data migration needed since the fix is in the application code
-- The deleted_rooms table structure is already correct

-- Optional: If you want to clean up any orphaned deleted_rooms entries
-- where the room no longer exists in user_rooms, uncomment below:

/*
DELETE FROM deleted_rooms
WHERE room_id NOT IN (
  SELECT DISTINCT room_id FROM user_rooms
);
*/

-- FIXES IMPLEMENTED IN APPLICATION CODE (lib/chat.ts):

-- Fix 1: getOrCreateChatWithFriend()
-- When a user clicks on a friend from the rail and reopens a deleted chat:
-- 1. The existing room is found
-- 2. If it was deleted, the deleted_at timestamp is UPDATED to NOW
-- 3. This keeps old messages hidden while allowing new conversation
-- 4. The room stays hidden from chat list until a message is sent

-- Fix 2: sendMessage()
-- When a user sends a message to a room:
-- 1. Check if the room is in deleted_rooms for this user
-- 2. If yes, DELETE the deleted_rooms entry
-- 3. This makes the room reappear in their chat list
-- 4. Only messages after the deleted_at timestamp are visible

-- RESULT:
-- - Deleted chats stay deleted (old messages hidden)
-- - Clicking on friend from rail opens empty chat
-- - Sending a message restores the room to chat list
-- - Only new messages are visible
-- - Other user is completely unaffected

-- No database changes needed - this file documents the fix
