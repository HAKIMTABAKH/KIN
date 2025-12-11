import { supabase } from '@/lib/supabase';
import { RoomWithUser } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useChatRooms() {
  const { 
    data: rooms, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

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

      // Get other participants for each room
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
                avatar_url
              )
            `)
            .eq('room_id', room.id)
            .neq('user_id', user.id)
            .limit(1)
            .single();

          const otherUser = otherParticipants?.profiles;

          return {
            id: room.id,
            name: room.name,
            created_at: room.created_at,
            displayName: otherUser?.full_name || room.name || 'Unknown',
            otherUserAvatar: otherUser?.avatar_url || null,
            otherUserId: otherUser?.id || null,
          } as RoomWithUser;
        })
      );

      return roomsWithUsers.filter(Boolean) as RoomWithUser[];
    },
    staleTime: 1000 * 60 * 2, // Rooms stay fresh for 2 minutes
  });

  return {
    rooms: rooms || [],
    isLoading,
    refresh: refetch
  };
}
