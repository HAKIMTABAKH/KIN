import { Message } from '@/types';
import { supabase } from './supabase';



// Get room details by ID
export async function getRoomDetails(roomId: string) {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching room:', error);
    return { data: null, error };
  }
}

// Fetch messages for a room
export async function fetchMessages(roomId: string) {
  try {
    // First, fetch all messages with profiles
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!messages || messages.length === 0) {
      return { data: [], error: null };
    }

    // Get all unique reply_to_ids
    const replyIds = messages
      .filter(msg => msg.reply_to_id)
      .map(msg => msg.reply_to_id);

    // Fetch all reply messages in one query
    let replyMessages: any = {};
    if (replyIds.length > 0) {
      const { data: replies } = await supabase
        .from('messages')
        .select('id, content, profiles(full_name)')
        .in('id', replyIds);

      // Create a map for quick lookup
      if (replies) {
        replyMessages = replies.reduce((acc: any, reply: any) => {
          acc[reply.id] = reply;
          return acc;
        }, {});
      }
    }

    // Attach reply_message to each message
    const transformedData = messages.map(msg => ({
      ...msg,
      reply_message: msg.reply_to_id ? (replyMessages[msg.reply_to_id] || null) : null
    }));

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { data: [], error };
  }
}

// Fetch a single message by ID (for realtime updates)
export async function fetchMessageById(messageId: string) {
  try {
    // Fetch the message with profile
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('id', messageId)
      .single();

    if (error) throw error;
    if (!data) {
      return { data: null, error: null };
    }

    // If this message is a reply, fetch the original message
    let replyMessage = null;
    if (data.reply_to_id) {
      const { data: reply } = await supabase
        .from('messages')
        .select('id, content, profiles(full_name)')
        .eq('id', data.reply_to_id)
        .single();
      
      replyMessage = reply;
    }

    const transformedData = {
      ...data,
      reply_message: replyMessage
    };
    
    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching message:', error);
    return { data: null, error };
  }
}

// Send a message to a room
export async function sendMessage(roomId: string, userId: string, content: string, replyToId?: string | null) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: content.trim(),
        room_id: roomId,
        user_id: userId,
        ...(replyToId && { reply_to_id: replyToId }),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { data: null, error };
  }
}

// Subscribe to new messages in a room
export function subscribeToRoom(roomId: string, onNewMessage: (message: Message) => void) {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        // Fetch the full message with profile data
        const { data } = await fetchMessageById(payload.new.id);
        if (data) {
          onNewMessage(data);
        }
      }
    )
    .subscribe();

  return channel;
}

// Unsubscribe from room
export function unsubscribeFromRoom(channel: any) {
  supabase.removeChannel(channel);
}

// ===== CHAT LIST & FRIENDS =====

export interface Friend {
  id: string;
  profile: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  isOnline: boolean;
}

export interface RoomWithUser {
  id: string;
  name?: string;
  created_at: string;
  displayName: string;
  otherUserAvatar: string | null;
  otherUserId: string | null;
}

// Fetch friends list
export async function fetchFriends(): Promise<Friend[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: friendships } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        receiver_id,
        profiles!friendships_requester_id_fkey (id, full_name, avatar_url),
        receiver:profiles!friendships_receiver_id_fkey (id, full_name, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!friendships) return [];

    const friendsList = friendships.map(friendship => {
      const isRequester = friendship.requester_id === user.id;
      const friendProfile = isRequester ? friendship.receiver : friendship.profiles;
      
      return {
        id: friendship.id,
        profile: Array.isArray(friendProfile) ? friendProfile[0] : friendProfile,
        isOnline: Math.random() > 0.5 // TODO: Replace with actual online status
      };
    });

    return friendsList;
  } catch (error) {
    console.error('Error fetching friends:', error);
    return [];
  }
}

// Fetch chat rooms list
export async function fetchRooms(): Promise<RoomWithUser[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get blocked users (both directions)
    const { data: blockedByMe } = await supabase
      .from('blocked_users')
      .select('blocked_user_id')
      .eq('user_id', user.id);
    
    const { data: blockedMe } = await supabase
      .from('blocked_users')
      .select('user_id')
      .eq('blocked_user_id', user.id);
    
    const blockedIds = new Set<string>();
    blockedByMe?.forEach(b => blockedIds.add(b.blocked_user_id));
    blockedMe?.forEach(b => blockedIds.add(b.user_id));

    const { data: userRooms, error: roomsError } = await supabase
      .from('user_rooms')
      .select('room_id')
      .eq('user_id', user.id);

    if (roomsError || !userRooms || userRooms.length === 0) {
      return [];
    }

    const roomIds = userRooms.map(ur => ur.room_id);

    const { data: roomsData, error: roomDetailsError } = await supabase
      .from('rooms')
      .select('*')
      .in('id', roomIds)
      .order('created_at', { ascending: false });

    if (roomDetailsError || !roomsData) {
      return [];
    }

    const roomsWithUsers = await Promise.all(
      roomsData.map(async (room) => {
        const { data: roomMembers } = await supabase
          .from('user_rooms')
          .select('user_id')
          .eq('room_id', room.id);

        const otherUserId = roomMembers?.find(m => m.user_id !== user.id)?.user_id;

        if (otherUserId) {
          // Skip if user is blocked
          if (blockedIds.has(otherUserId)) {
            return null;
          }

          const { data: otherUserProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          return {
            ...room,
            displayName: otherUserProfile?.full_name || 'Unknown User',
            otherUserAvatar: otherUserProfile?.avatar_url || null,
            otherUserId: otherUserId
          };
        }

        return {
          ...room,
          displayName: room.name || 'Chat',
          otherUserAvatar: null,
          otherUserId: null
        };
      })
    );

    // Filter out null values (blocked users)
    return roomsWithUsers.filter((room): room is RoomWithUser => room !== null);
  } catch (error) {
    console.error('Error in fetchRooms:', error);
    return [];
  }
}
