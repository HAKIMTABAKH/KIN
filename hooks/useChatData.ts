import { supabase } from '@/lib/supabase';
import { Message, RoomWithUser } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// --- 1. FETCH CHAT ROOMS LIST ---
export function useChatRooms() {
  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch rooms I am in
      const { data: roomsData, error } = await supabase
        .from('user_rooms')
        .select('room_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching rooms:', error);
        return [];
      }

      if (!roomsData || roomsData.length === 0) return [];

      const roomIds = roomsData.map(ur => ur.room_id);

      // Fetch room details
      const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .in('id', roomIds);

      if (!rooms) return [];

      // For each room, fetch the other user's profile and latest message
      const roomsWithUsers = await Promise.all(
        rooms.map(async (room: any) => {
          // Get other participant
          const { data: otherParticipants } = await supabase
            .from('user_rooms')
            .select(`
              user_id,
              profiles (
                id,
                full_name,
                avatar_url,
                last_seen
              )
            `)
            .eq('room_id', room.id)
            .neq('user_id', user.id)
            .limit(1)
            .single();

          const otherUser = otherParticipants?.profiles;

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('id, content, created_at, user_id, media_url, media_type')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: room.id,
            name: room.name,
            created_at: room.created_at,
            displayName: otherUser?.full_name || room.name || 'Unknown',
            otherUserAvatar: otherUser?.avatar_url || null,
            otherUserId: otherUser?.id || null,
            lastMessage,
            updated_at: lastMessage?.created_at || room.created_at,
          } as RoomWithUser & { lastMessage?: any; updated_at: string };
        })
      );

      // Filter out nulls and sort by latest activity
      const validRooms = roomsWithUsers.filter(Boolean);
      return validRooms.sort((a, b) => 
        new Date(b!.updated_at).getTime() - new Date(a!.updated_at).getTime()
      );
    },
    staleTime: 1000 * 60, // Fresh for 1 minute
  });
}

// --- 2. FETCH MESSAGES FOR A SPECIFIC ROOM ---
export function useRoomMessages(roomId: string) {
  return useQuery({
    queryKey: ['messages', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(full_name, avatar_url),
          reply_message:messages!reply_to_id(
            id, 
            content, 
            media_url, 
            media_type, 
            profiles(full_name)
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return (data || []) as Message[];
    },
    staleTime: 1000 * 30, // Fresh for 30 seconds
  });
}

// --- 3. HELPER TO INVALIDATE CHAT CACHES ---
export function useInvalidateChats() {
  const queryClient = useQueryClient();

  return {
    invalidateRooms: () => queryClient.invalidateQueries({ queryKey: ['chat-rooms'] }),
    invalidateMessages: (roomId: string) => queryClient.invalidateQueries({ queryKey: ['messages', roomId] }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  };
}
