import { Friend, Message, RoomWithUser } from '@/types';
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    // Check if user deleted this room (get the timestamp)
    const { data: deletedRoom, error: deletedError } = await supabase
      .from('deleted_rooms')
      .select('deleted_at')
      .eq('user_id', user.id)
      .eq('room_id', roomId)
      .maybeSingle();

    // Fetch messages (only after delete timestamp if room was deleted)
    let query = supabase
      .from('messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('room_id', roomId);

    // If room was deleted, only show messages after that time
    if (!deletedError && deletedRoom && deletedRoom.deleted_at) {
      query = query.gt('created_at', deletedRoom.deleted_at);
    }

    const { data: messages, error } = await query.order('created_at', { ascending: false });

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

    // Get rooms that user has deleted (soft delete)
    const { data: deletedRooms, error: deletedError } = await supabase
      .from('deleted_rooms')
      .select('*')
      .eq('user_id', user.id);

    // Create a map of deleted rooms with their deleted_at timestamps
    const deletedRoomsMap = new Map<string, string>();
    deletedRooms?.forEach(dr => deletedRoomsMap.set(dr.room_id, dr.deleted_at));

    // For each deleted room, check if there are new messages after deleted_at
    // If yes, show the room in the list
    const roomsToShow: string[] = [];
    
    for (const ur of userRooms) {
      const deletedAt = deletedRoomsMap.get(ur.room_id);
      
      if (!deletedAt) {
        // Room not deleted, show it
        roomsToShow.push(ur.room_id);
      } else {
        // Room was deleted, check if there are new messages after deleted_at
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('room_id', ur.room_id)
          .gt('created_at', deletedAt);
        
        if (count && count > 0) {
          // There are new messages, show the room
          roomsToShow.push(ur.room_id);
        }
      }
    }
    
    const roomIds = roomsToShow;

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

        // If no other user found (they left), try to find who was in this room from messages
        if (room.name === 'DM') {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('user_id, profiles(full_name, avatar_url)')
            .eq('room_id', room.id)
            .neq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (lastMessage && lastMessage.profiles) {
            const profile = Array.isArray(lastMessage.profiles) ? lastMessage.profiles[0] : lastMessage.profiles;
            return {
              ...room,
              displayName: profile.full_name || 'Unknown User',
              otherUserAvatar: profile.avatar_url || null,
              otherUserId: lastMessage.user_id
            };
          }
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

// Delete a chat room (soft delete - marks as deleted for this user only)
export async function deleteRoomForUser(roomId: string, userId: string): Promise<boolean> {
  try {    
    // Mark the room as deleted for this user (soft delete)
    // This hides old messages but keeps the room for the other user
    // Use upsert to handle cases where the entry already exists
    const { data, error } = await supabase
      .from('deleted_rooms')
      .upsert({
        user_id: userId,
        room_id: roomId,
        deleted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,room_id'
      })
      .select();

    console.log('[deleteRoomForUser] Result:', data, 'Error:', error);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting room for user:', error);
    return false;
  }
}

// Get or create chat room with a friend (for clicking on friend in rail)
export async function getOrCreateChatWithFriend(userId: string, friendId: string): Promise<string | null> {
  try {
    // Check if there's an existing DM room between these two users
    const { data: allRooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('name', 'DM');

    if (allRooms && allRooms.length > 0) {
      // Check each DM room to see if it's between these two users
      for (const room of allRooms) {
        const { data: members } = await supabase
          .from('user_rooms')
          .select('user_id')
          .eq('room_id', room.id);

        if (members && members.length === 2) {
          const memberIds = members.map(m => m.user_id);
          if (memberIds.includes(userId) && memberIds.includes(friendId)) {
            // Found existing room - just return it
            // Don't modify deleted_at - let the user see any messages after the original deletion
            // The fetchMessages function will filter based on the existing deleted_at
            return room.id;
          }
        }
      }
    }

    // No existing room found, create a new one
    const { data: newRoom } = await supabase
      .from('rooms')
      .insert({ name: 'DM' })
      .select()
      .single();

    if (newRoom) {
      await supabase
        .from('user_rooms')
        .insert([
          { user_id: userId, room_id: newRoom.id },
          { user_id: friendId, room_id: newRoom.id }
        ]);

      return newRoom.id;
    }

    return null;
  } catch (error) {
    console.error('Error getting or creating chat:', error);
    return null;
  }
}
