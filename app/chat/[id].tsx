import ChatHeader from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import MessageMenu from '@/components/MessageMenu';
import TypingIndicator from '@/components/TypingIndicator';
import { getCurrentUser } from '@/lib/auth';
import { fetchMessageById, fetchMessages, getRoomDetails, Message, sendMessage as sendChatMessage } from '@/lib/chat';
import { getSeparatorText } from '@/lib/dateHelpers';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Clock, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    LayoutAnimation,
    Platform,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Helper: Detect if message is ONLY emojis
const isEmojiOnly = (text: string) => {
  if (!text) return false;
  // Matches common emoji ranges, symbols, and whitespace
  const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}\u{2B00}-\u{2BFF}\u{200D}\u{FE0F}\s]+$/u;
  return emojiRegex.test(text);
};

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('Chat');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [flashMessageId, setFlashMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false); // Is someone else typing?
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // To clear the bubble
  const myTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // To throttle my sending

  useEffect(() => {
    setupRoom();

    // Subscribe to realtime messages and updates
    const channel = supabase
      .channel(`room:${id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Use the helper function that handles reply data correctly
            const { data } = await fetchMessageById(payload.new.id);
            
            if (data) {
              // Check if message already exists (from optimistic update)
              setMessages((prev) => {
                const exists = prev.some(msg => msg.id === data.id);
                if (exists) {
                  // Replace the existing message (in case it was optimistic)
                  return prev.map(msg => msg.id === data.id ? data : msg);
                } else {
                  // Add new message
                  return [data, ...prev];
                }
              });
            }
          }

          if (payload.eventType === 'UPDATE') {
            // Update the specific message in our local list
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          }

          if (payload.eventType === 'DELETE') {
            // Remove deleted message from the list
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          // Check if it's someone else typing
          if (payload.payload.user_id !== currentUserId) {
            setIsTyping(true);
            
            // Clear the bubble after 3 seconds if no new signal comes
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
    };
  }, [id, currentUserId]);

  async function setupRoom() {
    // Get current user
    const { user } = await getCurrentUser();
    
    // Check authentication
    if (!user) {
      console.log('ChatRoom - No user found, redirecting to sign-in');
      router.replace('/(auth)/sign-in');
      return;
    }
    
    setCurrentUserId(user.id);

    // Get room details
    const { data: roomData } = await getRoomDetails(id);
    if (roomData) setRoomName(roomData.name || 'Chat');

    // Load initial messages
    const { data: messagesData } = await fetchMessages(id);
    setMessages(messagesData);
    
    setLoading(false);
  }

  const handleInputChange = (text: string) => {
    // Standard UI update
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setInputText(text);

    // Typing Logic
    if (text.length > 0 && currentUserId) {
      // Limit how often we send the signal (Throttling)
      // Only send once every 2 seconds
      if (!myTypingTimeoutRef.current) {
        supabase.channel(`room:${id}`).send({
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

  async function handleSendMessage() {
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
      room_id: id,
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
    const { data, error } = await sendChatMessage(id, currentUserId, content, replyToId);
    
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
  }

  const handleLongPress = (message: Message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(message);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleDelete = async (messageId: string) => {
    // Optimistic update - remove from UI immediately
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    
    // Delete from database
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    
    if (error) {
      console.error('Error deleting message:', error);
      // Optionally: Refetch messages to restore the message if delete failed
      const { data } = await fetchMessages(id);
      if (data) setMessages(data);
    }
  };

  const scrollToMessage = (targetId: string) => {
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

  const handleReaction = async (emoji: string) => {
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

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.user_id === currentUserId;
    
    // 1. Date Separator Logic
    const olderMessage = messages[index + 1];
    const currentDate = new Date(item.created_at);
    const olderDate = olderMessage ? new Date(olderMessage.created_at) : null;
    const separatorText = getSeparatorText(currentDate, olderDate);

    // 2. Emoji-Only Check
    const onlyEmojis = isEmojiOnly(item.content);

    // 3. Get reactions from message (if they exist)
    const reactions = (item as any).reactions || {};
    const hasReactions = Object.keys(reactions).length > 0;

    // 4. Check if this message is a reply (only if reply_to_id exists)
    let replyData = item.reply_to_id ? item.reply_message : null;
    
    // Defensive: If reply_message is an array, take the first element
    if (Array.isArray(replyData) && replyData.length > 0) {
      replyData = replyData[0];
    } else if (Array.isArray(replyData)) {
      replyData = null;
    }

    // 5. Check if this message should flash (highlight animation)
    const isFlashing = flashMessageId === item.id;

    // 6. Check message status (for optimistic sending)
    const isSending = (item as any).status === 'sending';
    const isError = (item as any).status === 'error';

    return (
      <View>
        {/* DATE SEPARATOR */}
        {separatorText && (
          <View className="items-center my-4 opacity-60">
            <View className="bg-kin-slate/40 px-3 py-1 rounded-full">
              <Text className="text-kin-mist text-xs font-outfit-medium">{separatorText}</Text>
            </View>
          </View>
        )}

        {/* MESSAGE CONTAINER */}
        <TouchableOpacity 
          onLongPress={() => handleLongPress(item)}
          delayLongPress={300}
          activeOpacity={0.8}
          className={`mb-2 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}
        >
          {/* Name Label (Them only) */}
          {!isMe && !onlyEmojis && (
            <Text className="text-kin-mist text-xs font-outfit mb-1 ml-1">
              {item.profiles?.full_name || 'User'}
            </Text>
          )}

          {/* THE BUBBLE */}
          <View 
            className={`
              relative flex-col
              ${onlyEmojis ? 'bg-transparent px-0 py-0' : 'px-4 py-3 rounded-2xl'}
              ${!onlyEmojis && isMe ? 'bg-kin-amber rounded-tr-sm' : ''}
              ${!onlyEmojis && !isMe ? 'bg-kin-midnight border border-kin-slate rounded-tl-sm' : ''}
              ${hasReactions ? 'mb-4' : ''}
              ${isFlashing && !onlyEmojis ? (isMe ? 'opacity-70' : 'bg-kin-slate/50') : ''}
              ${isSending ? 'opacity-70' : 'opacity-100'}
            `}
          >
            {/* REPLY PREVIEW - Instagram/Messenger Style */}
            {replyData && !onlyEmojis && (
              <TouchableOpacity
                onPress={() => scrollToMessage(replyData.id)}
                activeOpacity={0.7}
                className={`mb-2.5 px-3 py-2 rounded-xl border-l-[3px] ${
                  isMe 
                    ? 'bg-black/15 border-black/30' 
                    : 'bg-kin-amber/10 border-kin-amber'
                }`}
              >
                <Text className={`text-[11px] font-outfit-bold mb-1 ${
                  isMe ? 'text-black/80' : 'text-kin-amber'
                }`}>
                  {replyData.profiles?.full_name || 'User'}
                </Text>
                <Text 
                  className={`text-xs leading-4 ${isMe ? 'text-black/70' : 'text-kin-mist/90'}`} 
                  numberOfLines={2}
                >
                  {replyData.content}
                </Text>
              </TouchableOpacity>
            )}

            {/* MESSAGE CONTENT */}
            <Text 
              className={`font-outfit
                ${onlyEmojis ? 'text-3xl' : 'text-base'}
                ${!onlyEmojis && isMe ? 'text-black font-outfit-medium' : 'text-kin-white'}
              `}
            >
              {item.content}
            </Text>

            {/* REACTIONS PILL */}
            {hasReactions && (
              <TouchableOpacity
                onPress={() => handleLongPress(item)}
                className={`
                  absolute -bottom-5
                  ${isMe ? 'right-0' : 'left-0'}
                  bg-[#2D3246] rounded-full px-2 py-1 flex-row items-center border-2 border-kin-charcoal shadow-sm z-10
                `}
              >
                {Object.entries(reactions).map(([emoji, users]) => {
                  const userList = users as string[];
                  const count = userList.length;
                  
                  return (
                    <View key={emoji} className="flex-row items-center mr-1">
                      <Text className="text-xs">{emoji}</Text>
                      {count > 1 && (
                        <Text className="text-[10px] text-kin-white ml-0.5 font-outfit-bold">{count}</Text>
                      )}
                    </View>
                  );
                })}
              </TouchableOpacity>
            )}
          </View>

          {/* STATUS INDICATORS (Time + Sending/Error Icons) */}
          {!onlyEmojis && (
            <View className={`flex-row items-center mt-1 ${isMe ? 'justify-end mr-1' : 'ml-1'}`}>
              <Text className="text-[10px] text-kin-mist font-outfit">
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              
              {/* Sending Icon */}
              {isSending && (
                <Clock size={10} color="#F59E0B" style={{ marginLeft: 4 }} />
              )}
              
              {/* Error Icon */}
              {isError && (
                <AlertCircle size={10} color="#EF4444" style={{ marginLeft: 4 }} />
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-kin-charcoal justify-center items-center">
        <ActivityIndicator color="#F59E0B" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal" edges={['top', 'left', 'right']}>
      <ChatHeader 
        roomName={roomName} 
        onBack={() => router.back()}
        onVoiceCall={() => console.log('Voice call')}
        onVideoCall={() => console.log('Video call')}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
          className="flex-1"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onScrollToIndexFailed={(info) => {
            // Prevents crash if scroll fails (common with dynamic height items)
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ 
                index: info.index, 
                animated: true,
                viewPosition: 0.5
              });
            });
          }}
        />

        {/* Typing Indicator */}
        <TypingIndicator isVisible={isTyping} />

        {/* Reply Preview Box */}
        {replyingTo && (
          <View className="bg-kin-midnight px-4 py-2 border-t border-kin-slate/30 flex-row justify-between items-center">
            <View className="border-l-4 border-kin-amber pl-3 flex-1">
              <Text className="text-kin-amber text-xs font-outfit-bold mb-1">
                Replying to {replyingTo.profiles?.full_name || 'User'}
              </Text>
              <Text className="text-kin-mist text-xs font-outfit" numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <X color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>
        )}

        <ChatInput
          value={inputText}
          onChangeText={handleInputChange}
          onSend={handleSendMessage}
          onCameraPress={() => console.log('Camera')}
          onMicPress={() => console.log('Mic')}
          onImagePress={() => console.log('Image')}
        />
      </KeyboardAvoidingView>

      {/* Message Menu Modal */}
      <MessageMenu
        visible={!!selectedMessage}
        message={selectedMessage}
        isMe={selectedMessage?.user_id === currentUserId}
        onClose={() => setSelectedMessage(null)}
        onReply={handleReply}
        onDelete={handleDelete}
        onReaction={handleReaction}
      />
    </SafeAreaView>
  );
}