-- Check and fix the deleted_rooms table constraint
-- The upsert in deleteRoomForUser requires a unique constraint on (user_id, room_id)

-- First, check if the constraint exists
-- If not, add it

-- Drop existing constraint if it exists (to recreate it properly)
ALTER TABLE deleted_rooms DROP CONSTRAINT IF EXISTS deleted_rooms_user_id_room_id_key;

-- Add the unique constraint
ALTER TABLE deleted_rooms ADD CONSTRAINT deleted_rooms_user_id_room_id_key UNIQUE (user_id, room_id);

-- Verify the constraint exists
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'deleted_rooms' AND constraint_type = 'UNIQUE';
