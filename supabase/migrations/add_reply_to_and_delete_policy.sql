-- Step 1: Add reply_to_id column to messages table
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Step 2: Add delete policy for users to delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.messages 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 3: Create index for better query performance on reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON public.messages(reply_to_id);
