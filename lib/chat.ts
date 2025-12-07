import { supabase } from './supabase';

export interface Message {
  id: string;
  content: string;
  room_id: string;
  user_id: string;
  created_at: string;
  reply_to_id?: string | null;
  reactions?: Record<string, string[]>; // emoji -> array of user IDs
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
  reply_message?: {
    id: string;
    content: string;
    profiles?: {
      full_name?: string;
    };
  } | null;
}

export interface Room {
  id: string;
  name: string;
  created_at: string;
}

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
