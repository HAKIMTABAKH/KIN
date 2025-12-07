# Reply & Unsend Feature Setup Guide

This guide will help you set up the new reply-to-message and unsend features in your chat app.

## ✅ What's Been Implemented

### 1. **Database Changes**
- Added `reply_to_id` column to link messages
- Added delete policy for users to delete their own messages
- Added index for better query performance

### 2. **Backend Updates**
- Updated `Message` interface to include `reply_to_id` and `reply_message` fields
- Modified `fetchMessages()` to fetch reply data using nested joins
- Modified `sendMessage()` to accept optional `replyToId` parameter
- Updated realtime subscription to handle DELETE events

### 3. **UI Features**
- **Unsend**: Long-press a message → tap "Unsend" → message deleted for everyone
- **Reply Preview**: When replying, a small card shows inside the bubble with the original message
- **Scroll to Original**: Tap the reply preview to scroll to the original message
- **Realtime Sync**: All users see unsends and replies instantly

## 🚀 Setup Steps

### Step 1: Run Database Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Run the migration file: `supabase/migrations/add_reply_to_and_delete_policy.sql`

Or copy and paste this SQL:

```sql
-- Add reply_to_id column
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add delete policy
CREATE POLICY "Users can delete their own messages"
  ON public.messages 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON public.messages(reply_to_id);
```

### Step 2: Test the Features

1. **Test Reply**:
   - Long-press any message
   - Tap "Reply"
   - Type your response
   - Send
   - You should see a small preview card inside your message bubble
   - Tap the preview to scroll to the original message

2. **Test Unsend**:
   - Long-press YOUR OWN message
   - Tap "Unsend"
   - Message should disappear for everyone in the chat

3. **Test Realtime**:
   - Open the chat on two devices/browsers
   - Unsend a message on one device
   - It should disappear on both devices instantly

## 🎨 How It Works

### Reply Flow
```
User long-presses message 
  → Taps "Reply" 
  → Reply preview appears above input 
  → User types and sends 
  → Message saved with reply_to_id 
  → UI shows reply card inside bubble
  → Tap card to scroll to original
```

### Unsend Flow
```
User long-presses their message 
  → Taps "Unsend" 
  → DELETE query sent to Supabase 
  → Realtime listener catches DELETE event 
  → Message removed from all users' screens
```

### Database Structure
```
messages table:
├── id (uuid)
├── content (text)
├── user_id (uuid)
├── room_id (uuid)
├── reply_to_id (uuid) ← NEW! Links to another message
├── reactions (jsonb)
└── created_at (timestamp)
```

## 🔧 Troubleshooting

### Issue: "Unsend" button doesn't appear
- **Solution**: Make sure you're long-pressing YOUR OWN message. The unsend option only shows for messages you sent.

### Issue: Reply preview doesn't show
- **Solution**: Make sure you ran the database migration. The `reply_to_id` column must exist.

### Issue: Scroll to message doesn't work
- **Solution**: This can happen with dynamic height items. The code includes a fallback handler that waits 500ms and retries.

### Issue: Realtime delete not working
- **Solution**: Check that the DELETE policy was created successfully in Supabase. Run the SQL migration again if needed.

## 📝 Code Changes Summary

### Files Modified:
1. ✅ `lib/chat.ts` - Updated Message interface and queries
2. ✅ `app/chat/[id].tsx` - Added scroll ref, reply UI, and delete handling
3. ✅ `components/MessageMenu.tsx` - Already had Unsend button (no changes needed)

### Files Created:
1. ✅ `supabase/migrations/add_reply_to_and_delete_policy.sql` - Database migration

## 🎉 You're All Set!

The reply and unsend features are now fully implemented. Just run the database migration and start testing!
