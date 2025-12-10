# Media Sharing Setup Instructions

## 1. Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Add media columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video'));

-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Anyone can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Anyone can view chat media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-media');

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 2. Features Implemented

✅ **Image & Video Sharing**
- Pick from gallery or take photo/video with camera
- 20MB file size limit with validation
- Automatic upload to Supabase Storage

✅ **Upload Progress**
- Loading indicator while uploading
- Optimistic UI updates (shows preview immediately)
- Fast uploads show progress smoothly

✅ **Message Display**
- Images displayed at 240x180px with rounded corners
- Videos with native playback controls
- Text can accompany media
- Emoji-only messages still work

✅ **Read Receipts**
- "Seen X ago" indicator on latest message
- Disappears when other user replies
- Works for text, media, and emoji messages

## 3. How It Works

### Picking Media
- **Camera button**: Opens camera to take photo/video
- **Gallery button**: Opens image picker to select from library

### Upload Flow
1. User selects media
2. File size validated (max 20MB)
3. Optimistic message added with local preview
4. File uploaded to Supabase Storage
5. Message saved to database with public URL
6. Real message replaces optimistic one

### Storage Structure
Files are organized by room:
```
chat-media/
  └── {room_id}/
      ├── {timestamp}_{random}.jpg
      ├── {timestamp}_{random}.mp4
      └── ...
```

## 4. Usage

In the chat screen:
- Tap the **camera icon** (left side) to take a photo/video
- Tap the **image icon** (right side) to pick from gallery
- Media uploads automatically after selection
- Loading indicator shows during upload

## 5. Error Handling

- File too large: Alert shown, upload cancelled
- Upload failed: Alert shown, message removed
- Permission denied: Alert shown with instructions
