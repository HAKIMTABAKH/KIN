import ChatHeader from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import MessageMenu from '@/components/MessageMenu';
import TypingIndicator from '@/components/TypingIndicator';
import { fetchMessageById, Message } from '@/lib/chat';
import { handleDelete, handleInputChange, handleLongPress, handleReaction, handleReply, handleSendMessage, scrollToMessage, setupRoom } from '@/lib/chatHandlers';
import { getSeparatorText } from '@/lib/dateHelpers';
import {
    getMessageBubbleMinWidth,
    getUserInitial,
    isEmojiOnly,
    normalizeReplyData
} from '@/lib/messageHelpers';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, ArrowDownFromLine, Clock, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [typingUserProfile, setTypingUserProfile] = useState<{ avatar_url?: string; full_name?: string } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false); // Show scroll to bottom button
  const [blockStatus, setBlockStatus] = useState<'none' | 'blocked_by_me' | 'blocked_me'>('none');
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // To clear the bubble
  const myTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // To throttle my sending

  useEffect(() => {
    setupRoom(id, setCurrentUserId, setRoomName, setMessages, setLoading, router);

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
        async (payload) => {
          // Check if it's someone else typing
          if (payload.payload.user_id !== currentUserId) {
            setIsTyping(true);
            
            // Fetch the typing user's profile if we don't have it
            if (payload.payload.avatar_url !== undefined) {
              setTypingUserProfile({
                avatar_url: payload.payload.avatar_url,
                full_name: payload.payload.full_name
              });
            } else {
              // Fetch from profiles table
              const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url, full_name')
                .eq('id', payload.payload.user_id)
                .single();
              
              if (profile) {
                setTypingUserProfile(profile);
              }
            }
            
            // Clear the bubble after 3 seconds if no new signal comes
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
              setTypingUserProfile(null);
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

  // Check block status
  useEffect(() => {
    async function checkBlockStatus() {
      if (!currentUserId) return;

      // Get other user in the room
      const { data: roomMembers } = await supabase
        .from('user_rooms')
        .select('user_id')
        .eq('room_id', id);

      const otherUser = roomMembers?.find(m => m.user_id !== currentUserId);
      if (!otherUser) return;

      setOtherUserId(otherUser.user_id);

      // Check if I blocked them
      const { data: iBlockedThem } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('blocked_user_id', otherUser.user_id)
        .single();

      if (iBlockedThem) {
        setBlockStatus('blocked_by_me');
        return;
      }

      // Check if they blocked me
      const { data: theyBlockedMe } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('user_id', otherUser.user_id)
        .eq('blocked_user_id', currentUserId)
        .single();

      if (theyBlockedMe) {
        setBlockStatus('blocked_me');
        return;
      }

      setBlockStatus('none');
    }

    checkBlockStatus();
  }, [id, currentUserId]);

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
    const replyData = item.reply_to_id ? normalizeReplyData(item.reply_message) : null;

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
        <View className={`mb-2 flex-row ${isMe ? 'self-end' : 'self-start'} max-w-[80%]`}>
          {/* Profile Image (Other users only) */}
          {!isMe && !onlyEmojis && (
            <TouchableOpacity 
              className="mr-2 mt-6"
              onPress={() => {
                if (item.user_id) {
                  router.push(`/user/${item.user_id}`);
                }
              }}
              activeOpacity={0.7}
            >
              {item.profiles?.avatar_url ? (
                <Image 
                  source={{ uri: item.profiles.avatar_url }} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <View className="w-8 h-8 rounded-full bg-kin-slate items-center justify-center">
                  <Text className="text-kin-white text-sm font-outfit-bold">
                    {getUserInitial(item.profiles?.full_name)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <View className="flex-shrink">
            <TouchableOpacity 
              onLongPress={() => handleLongPress(item, setSelectedMessage)}
              delayLongPress={300}
              activeOpacity={0.8}
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
              relative
              ${onlyEmojis ? 'bg-transparent px-0 py-0' : 'px-4 py-3 rounded-2xl'}
              ${!onlyEmojis && isMe ? 'bg-kin-amber rounded-tr-sm' : ''}
              ${!onlyEmojis && !isMe ? 'bg-kin-midnight border border-kin-slate rounded-tl-sm' : ''}
              ${hasReactions ? 'mb-4' : ''}
              ${isFlashing && !onlyEmojis ? (isMe ? 'opacity-70' : 'bg-kin-slate/50') : ''}
              ${isSending ? 'opacity-70' : 'opacity-100'}
            `}
            style={{ 
              minWidth: getMessageBubbleMinWidth(hasReactions),
              alignSelf: 'flex-start'
            }}
          >
            {/* REPLY PREVIEW - Instagram/Messenger Style */}
            {replyData && !onlyEmojis && (
              <TouchableOpacity
                onPress={() => scrollToMessage(replyData.id, messages, flatListRef, setFlashMessageId)}
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
                onPress={() => handleLongPress(item, setSelectedMessage)}
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

              {/* STATUS INDICATORS (Sending/Error Icons) */}
              {!onlyEmojis && (
                <View className={`flex-row items-center mt-1 ${isMe ? 'justify-end mr-1' : 'ml-1'}`}>
                  
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
        </View>
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
          onScroll={(event) => {
            // Show button when user scrolls up more than 200 pixels
            const offsetY = event.nativeEvent.contentOffset.y;
            setShowScrollButton(offsetY > 200);
          }}
          scrollEventThrottle={200}
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

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <TouchableOpacity
            onPress={() => {
              setShowScrollButton(false); // Hide immediately
              setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
              }, 50);
            }}
            className="absolute bottom-28 self-center bg-kin-mist rounded-full p-2 shadow-lg"
            style={{ elevation: 5 }}
          >
            <ArrowDownFromLine  size={22} color="#000000" />
          </TouchableOpacity>
        )}

        {/* Typing Indicator */}
        <TypingIndicator 
          isVisible={isTyping} 
          avatarUrl={typingUserProfile?.avatar_url}
          userName={typingUserProfile?.full_name}
        />

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

        {/* Block Status UI */}
        {blockStatus === 'blocked_by_me' ? (
          <View className="bg-kin-midnight px-6 py-4 border-t border-kin-slate/30">
            <View className="bg-kin-slate/20 p-4 rounded-xl items-center">
              <Text className="text-kin-white font-outfit-bold text-base mb-2">
                You blocked this user
              </Text>
              <Text className="text-kin-mist text-sm text-center mb-4">
                Unblock to continue the conversation
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  if (!currentUserId || !otherUserId) return;
                  const { data } = await supabase
                    .from('blocked_users')
                    .select('id')
                    .eq('user_id', currentUserId)
                    .eq('blocked_user_id', otherUserId)
                    .single();
                  
                  if (data) {
                    await supabase.from('blocked_users').delete().eq('id', data.id);
                    setBlockStatus('none');
                  }
                }}
                className="bg-kin-amber px-6 py-3 rounded-xl"
              >
                <Text className="text-black font-outfit-bold">Unblock User</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : blockStatus === 'blocked_me' ? (
          <View className="bg-kin-midnight px-6 py-4 border-t border-kin-slate/30">
            <View className="bg-red-500/10 p-4 rounded-xl items-center border border-red-500/20">
              <Text className="text-red-500 font-outfit-bold text-base mb-2">
                This user blocked you
              </Text>
              <Text className="text-kin-mist text-sm text-center">
                You can't send messages to this user
              </Text>
            </View>
          </View>
        ) : (
          <ChatInput
            value={inputText}
            onChangeText={(text) => handleInputChange(text, setInputText, currentUserId, id, myTypingTimeoutRef)}
            onSend={() => handleSendMessage(inputText, currentUserId, id, replyingTo, setInputText, setReplyingTo, setMessages)}
            onCameraPress={() => console.log('Camera')}
            onMicPress={() => console.log('Mic')}
            onImagePress={() => console.log('Image')}
          />
        )}
      </KeyboardAvoidingView>

      {/* Message Menu Modal */}
      <MessageMenu
        visible={!!selectedMessage}
        message={selectedMessage}
        isMe={selectedMessage?.user_id === currentUserId}
        onClose={() => setSelectedMessage(null)}
        onReply={(msg) => handleReply(msg, setReplyingTo)}
        onDelete={(msgId) => handleDelete(msgId, id, setMessages)}
        onReaction={(emoji) => handleReaction(emoji, selectedMessage, currentUserId, setMessages, setSelectedMessage)}
      />
    </SafeAreaView>
  );
}