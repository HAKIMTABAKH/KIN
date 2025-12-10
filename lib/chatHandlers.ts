/**
 * Chat Room Handler Functions
 * Business logic for chat room operations
 */

import * as Haptics from 'expo-haptics';
import { LayoutAnimation } from 'react-native';
import { getCurrentUser } from './auth';
import { fetchMessageById, fetchMessages, getRoomDetails, sendMessage as sendChatMessage } from './chat';
import { supabase } from './supabase';

/**
 * Setup room - Load initial data and authenticate user
 */
export const setupRoom = async (
  roomId: string,
  setCurrentUserId: (id: string) => void,
  setRoomName: (name: string) => void,
  setMessages: (messages: any[]) => void,
  setLoading: (loading: boolean) => void,
  router: any
) => {
  // Get current user
  const { user } = await getCurrentUser();
  
  // Check authentication
  if (!user) {
    router.replace('/(auth)/sign-in');
    return;
  }
  
  setCurrentUserId(user.id);

  // Get room details
  const { data: roomData } = await getRoomDetails(roomId);
  
  // Get other user in the room to display their name
  const { data: roomMembers } = await supabase
    .from('user_rooms')
    .select('user_id')
    .eq('room_id', roomId);

  // Find the other user (not current user)
  const otherUserId = roomMembers?.find(m => m.user_id !== user.id)?.user_id;

  if (otherUserId) {
    // Fetch other user's profile
    const { data: otherUserProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', otherUserId)
      .single();

    if (otherUserProfile?.full_name) {
      setRoomName(otherUserProfile.full_name);
    } else {
      setRoomName(roomData?.name || 'Chat');
    }
  } else {
    setRoomName(roomData?.name || 'Chat');
  }

  // Load initial messages
  const { data: messagesData } = await fetchMessages(roomId);
  setMessages(messagesData);
  
  setLoading(false);
};

/**
 * Handle input text change with typing indicator broadcast
 */
export const handleInputChange = (
  text: string,
  setInputText: (text: string) => void,
  currentUserId: string | null,
  roomId: string,
  myTypingTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
) => {
  // Standard UI update
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setInputText(text);

  // Typing Logic
  if (text.length > 0 && currentUserId) {
    // Limit how often we send the signal (Throttling)
    // Only send once every 2 seconds
    if (!myTypingTimeoutRef.current) {
      supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: currentUserId },
      });

      myTypingTimeoutRef.current = setTimeout(() => {
        myTypingTimeoutRef.current = null;
      }, 2000);
    }
  }
};

/**
 * Send a message with optimistic UI update
 */
export const handleSendMessage = async (
  inputText: string,
  currentUserId: string | null,
  roomId: string,
  replyingTo: any,
  setInputText: (text: string) => void,
  setReplyingTo: (message: any) => void,
  setMessages: (updater: (prev: any[]) => any[]) => void
) => {
  if (!inputText.trim() || !currentUserId) return;

  const content = inputText.trim();
  const replyToId = replyingTo?.id || null;
  const replyMessageData = replyingTo;
  
  // 1. Create a temporary ID and "fake" message object
  const tempId = `temp-${Date.now()}`;
  const tempMessage: any = {
    id: tempId,
    content,
    user_id: currentUserId,
    created_at: new Date().toISOString(),
    room_id: roomId,
    status: 'sending', // Mark as sending
    reactions: {},
    reply_to_id: replyToId,
    reply_message: replyMessageData ? {
      id: replyMessageData.id,
      content: replyMessageData.content,
      profiles: replyMessageData.profiles
    } : null,
    profiles: null // Will be populated from realtime or we can add current user profile
  };
  
  // 2. Clear input & update UI immediately (optimistic update)
  setInputText('');
  setReplyingTo(null);
  setMessages((prev) => [tempMessage, ...prev]);
  
  // 3. Send to database
  const { data, error } = await sendChatMessage(roomId, currentUserId, content, replyToId);
  
  // 4. Handle success or failure
  if (!error && data) {
    // Fetch the complete message with all relations
    const { data: completeMessage } = await fetchMessageById(data.id);
    
    if (completeMessage) {
      // Replace the "temp" message with the "real" message from DB
      // The realtime subscription will also try to add this, but we handle that there
      setMessages((prev) => {
        // Remove temp message and add real one, avoiding duplicates
        const withoutTemp = prev.filter(msg => msg.id !== tempId);
        const exists = withoutTemp.some(msg => msg.id === completeMessage.id);
        if (exists) {
          return withoutTemp.map(msg => msg.id === completeMessage.id ? completeMessage : msg);
        }
        return [completeMessage, ...withoutTemp];
      });
    }
  } else {
    console.error('Send failed:', error);
    // Mark as "failed" in UI so user can retry
    setMessages((prev) =>
      prev.map((msg) => (msg.id === tempId ? { ...msg, status: 'error' } : msg))
    );
  }
};

/**
 * Handle long press on message with haptic feedback
 */
export const handleLongPress = (message: any, setSelectedMessage: (message: any) => void) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  setSelectedMessage(message);
};

/**
 * Handle reply to message
 */
export const handleReply = (message: any, setReplyingTo: (message: any) => void) => {
  setReplyingTo(message);
};

/**
 * Delete a message with optimistic update
 */
export const handleDelete = async (
  messageId: string,
  roomId: string,
  setMessages: (updater: (prev: any[]) => any[]) => void
) => {
  // Optimistic update - remove from UI immediately
  setMessages((prev) => prev.filter((m) => m.id !== messageId));
  
  // Delete from database
  const { error } = await supabase.from('messages').delete().eq('id', messageId);
  
  if (error) {
    console.error('Error deleting message:', error);
    // Optionally: Refetch messages to restore the message if delete failed
    const { data } = await fetchMessages(roomId);
    if (data) setMessages(() => data);
  }
};

/**
 * Scroll to a specific message and flash it
 */
export const scrollToMessage = (
  targetId: string,
  messages: any[],
  flatListRef: React.RefObject<any>,
  setFlashMessageId: (id: string | null) => void
) => {
  const index = messages.findIndex((m) => m.id === targetId);
  
  if (index !== -1 && flatListRef.current) {
    try {
      // Scroll to the message
      flatListRef.current.scrollToIndex({ 
        index, 
        animated: true, 
        viewPosition: 0.5 
      });
      
      // Flash the message to highlight it
      setFlashMessageId(targetId);
      setTimeout(() => {
        setFlashMessageId(null);
      }, 1500);
    } catch (error) {
      console.error('Scroll error:', error);
      // Fallback: scroll to offset
      flatListRef.current.scrollToOffset({ 
        offset: index * 100, 
        animated: true 
      });
    }
  }
};

/**
 * Handle reaction toggle on a message
 */
export const handleReaction = async (
  emoji: string,
  selectedMessage: any,
  currentUserId: string | null,
  setMessages: (updater: (prev: any[]) => any[]) => void,
  setSelectedMessage: (message: any) => void
) => {
  if (!selectedMessage || !currentUserId) return;

  const messageId = selectedMessage.id;
  const currentReactions = (selectedMessage as any).reactions || {};
  
  // Toggle logic: Add if not present, remove if already reacted
  let updatedReactions = { ...currentReactions };
  const usersWhoReacted = updatedReactions[emoji] || [];

  if (usersWhoReacted.includes(currentUserId)) {
    // Remove reaction
    updatedReactions[emoji] = usersWhoReacted.filter((id: string) => id !== currentUserId);
    if (updatedReactions[emoji].length === 0) {
      delete updatedReactions[emoji];
    }
  } else {
    // Add reaction
    updatedReactions[emoji] = [...usersWhoReacted, currentUserId];
  }

  // 1. Optimistic update (update UI immediately)
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === messageId ? { ...msg, reactions: updatedReactions } as any : msg
    )
  );
  setSelectedMessage(null); // Close menu

  // 2. Send to database
  const { error } = await supabase
    .from('messages')
    .update({ reactions: updatedReactions })
    .eq('id', messageId)
    .select();

  if (error) {
    console.error('Error updating reaction:', error);
  }
};
