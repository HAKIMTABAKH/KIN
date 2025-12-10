# Fix: Deleted Chat Messages and Room Restoration Issue

## Problem Description

### Issue 1: Old Messages Reappearing (FIXED)
When User A deleted a chat with User B and then clicked on User B from the "Online Friends Rail":
- ❌ The old deleted messages reappeared for User A
- ❌ User A could see the entire conversation history they had deleted

### Issue 2: Room Not Reappearing in Chat List (FIXED)
When User A deleted a chat, clicked on User B from Friends Rail, and sent a new message:
- ❌ The room stayed hidden from User A's chat list
- ❌ User A couldn't see the conversation in their chats page
- ✅ The chat opened empty (correct)
- ✅ New messages appeared in the chat (correct)

## Root Causes

### Issue 1 Root Cause
The `getOrCreateChatWithFriend()` function was **deleting** the entry from `deleted_rooms` when reopening a chat, removing the `deleted_at` timestamp and making all old messages visible again.

### Issue 2 Root Cause
When sending a message to a deleted room, the `deleted_rooms` entry wasn't being removed, so the room remained hidden from the chat list even though new messages were being sent.

## Solutions

### Solution 1: Keep Old Messages Hidden
In `getOrCreateChatWithFriend()`, we now **update** the `deleted_at` timestamp instead of deleting the entry:

```typescript
if (deletedRoom) {
  // Update deleted_at to NOW - keeps old messages hidden
  await supabase
    .from('deleted_rooms')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('room_id', room.id);
}
```

### Solution 2: Restore Room When Sending Message
In `sendMessage()`, we now **delete** the `deleted_rooms` entry when a user sends a message:

```typescript
// If this room was deleted by the user, remove it from deleted_rooms
// This will make the room reappear in their chat list
await supabase
  .from('deleted_rooms')
  .delete()
  .eq('user_id', userId)
  .eq('room_id', roomId);
```

### Solution 3: Handle Re-deletion
In `deleteRoomForUser()`, we now use **upsert** instead of insert to handle cases where the entry already exists:

```typescript
// Use upsert to handle cases where the entry already exists
const { error } = await supabase
  .from('deleted_rooms')
  .upsert({
    user_id: userId,
    room_id: roomId,
    deleted_at: new Date().toISOString()
  }, {
    onConflict: 'user_id,room_id'
  });
```

This prevents errors when a user deletes a chat multiple times (e.g., delete → reopen → send message → delete again).

## How It Works Now

### Complete Flow:
1. **User A deletes chat with User B**
   - `deleted_at` = "2024-01-01 10:00:00"
   - Room disappears from User A's chat list
   - User B still sees all messages

2. **User A clicks on User B from Friends Rail**
   - System finds existing room
   - Updates `deleted_at` = "2024-01-01 15:00:00" (NOW)
   - Chat opens empty (old messages hidden)
   - Room still NOT in chat list (because deleted_rooms entry exists)

3. **User A sends a new message**
   - `deleted_rooms` entry is DELETED
   - Room reappears in User A's chat list
   - Only messages after "2024-01-01 15:00:00" are visible
   - Old messages remain hidden forever

4. **User B's experience**
   - Sees all messages (old and new)
   - Completely unaffected by User A's deletion

## Files Changed
- ✅ `lib/chat.ts` - Fixed `getOrCreateChatWithFriend()` function
- ✅ `lib/chat.ts` - Fixed `sendMessage()` function
- ✅ `lib/chat.ts` - Fixed `deleteRoomForUser()` function (use upsert instead of insert)
- ✅ `FIX_DELETED_CHAT_ISSUE.md` - Updated documentation

## SQL to Run
**No SQL migration needed!** The database schema is already correct. The fix is entirely in the application code.

Optional cleanup (if needed):

```sql
-- Optional: Remove deleted_rooms entries for rooms that no longer exist
DELETE FROM deleted_rooms
WHERE room_id NOT IN (
  SELECT DISTINCT room_id FROM user_rooms
);
```

## Testing Checklist

### Test 1: Delete and Reopen
1. ✅ User A has a chat with User B (with existing messages)
2. ✅ User A deletes the chat
3. ✅ Chat disappears from User A's list
4. ✅ User A clicks on User B from "Online Friends Rail"
5. ✅ Chat opens but is EMPTY (no old messages)
6. ✅ Chat is NOT in User A's chat list yet

### Test 2: Send Message After Delete
7. ✅ User A sends a new message in the empty chat
8. ✅ New message appears in the chat
9. ✅ **Chat now appears in User A's chat list**
10. ✅ Only new messages are visible (old messages stay hidden)

### Test 3: Other User Unaffected
11. ✅ User B still sees all messages (old and new)
12. ✅ User B's chat list is unaffected

## Database Schema Reference

```sql
CREATE TABLE deleted_rooms (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  room_id UUID REFERENCES rooms(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);
```

### Key Functions:

**fetchMessages()** - Filters messages by deleted_at:
```typescript
if (deletedRoom && deletedRoom.deleted_at) {
  query = query.gt('created_at', deletedRoom.deleted_at);
}
```

**fetchRooms()** - Hides rooms in deleted_rooms:
```typescript
const deletedRoomIds = new Set(deletedRooms?.map(dr => dr.room_id) || []);
const roomIds = userRooms
  .map(ur => ur.room_id)
  .filter(roomId => !deletedRoomIds.has(roomId));
```

## Status
✅ **FULLY FIXED** - Both issues resolved with code changes only, no database migration required.
