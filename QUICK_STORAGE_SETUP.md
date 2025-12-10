# Quick Storage Setup Guide

## The Error You're Seeing

```
StorageUnknownError: Bucket not found
```

This means the `chat-media` storage bucket doesn't exist yet in your Supabase project.

## Fix It Now (2 Steps)

### Step 1: Create Storage Bucket

Go to your Supabase Dashboard:
1. Click **Storage** in the left sidebar
2. Click **New bucket**
3. Enter bucket name: `chat-media`
4. Make it **Public** (toggle on)
5. Click **Create bucket**

### Step 2: Run This SQL

Go to **SQL Editor** and run:

```sql
-- Add media columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video'));

-- Set up storage policies for chat-media bucket
CREATE POLICY "Anyone can upload to chat-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Anyone can view chat-media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-media');

CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media');
```

## That's It!

After these 2 steps, try uploading an image again. It should work!

## What I Fixed

✅ **Deprecated API Warning** - Updated to use new `['images', 'videos']` syntax
✅ **Better Error Messages** - Now tells you exactly what's wrong
✅ **Improved Upload** - Better content type detection
✅ **No Crop Screen** - Images selected as-is
✅ **Preview Bottom Sheet** - Review before sending

## Test It

1. Tap the image icon in chat
2. Select a photo
3. Preview appears in bottom sheet
4. Tap "Send"
5. Image uploads and appears in chat!
