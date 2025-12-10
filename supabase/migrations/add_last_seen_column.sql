-- Add last_seen column to profiles table for presence feature
-- This stores when a user was last active (for "5m ago" display when offline)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Create index for efficient queries on last_seen
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);
