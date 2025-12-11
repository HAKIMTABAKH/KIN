-- Add created_at column to profiles table if it doesn't exist
-- This stores when the user profile was created

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN created_at timestamp with time zone DEFAULT now();
    
    -- Backfill existing profiles with their auth.users created_at
    UPDATE public.profiles p
    SET created_at = u.created_at
    FROM auth.users u
    WHERE p.id = u.id AND p.created_at IS NULL;
  END IF;
END $$;
