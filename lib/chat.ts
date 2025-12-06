import { supabase } from './supabase';

export interface Message {
  id: string;
  content: string;
  room_id: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
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
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { data: [], error };
  }
}

// Fetch a single message by ID (for realtime updates)
export async function fetchMessageById(messageId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('id', messageId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching message:', error);
    return { data: null, error };
  }
}

// Send a message to a room
export async function sendMessage(roomId: string, userId: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: content.trim(),
        room_id: roomId,
        user_id: userId,
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
