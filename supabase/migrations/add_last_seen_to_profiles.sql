-- Migration: Add last_seen column to profiles table
-- This column stores the timestamp of when a user was last active in the app
-- Used for displaying "Last seen X ago" status when users are offline

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add an index for efficient querying of recently active users
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen DESC);

-- Update RLS policy to allow users to update their own last_seen
-- (This assumes existing RLS policies allow users to update their own profile)
