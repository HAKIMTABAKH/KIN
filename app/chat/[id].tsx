import ChatHeader from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import ChatMedia from '@/components/ChatMedia';
import LinkText from '@/components/LinkText';
import MessageMenu from '@/components/MessageMenu';
import TypingIndicator from '@/components/TypingIndicator';
import { useRoomMessages } from '@/hooks/useChatData';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { fetchMessageById, Message } from '@/lib/chat';
import { handleDelete, handleInputChange, handleLongPress, handleReaction, handleReply, handleSendMessage, scrollToMessage, setupRoomMetadata } from '@/lib/chatHandlers';
import { formatTimeAgo, getSeparatorText } from '@/lib/dateHelpers';
import { pickMedia, uploadAndSendMedia } from '@/lib/mediaHandlers';
import {
  getUserInitial,
  isEmojiOnly,
  normalizeReplyData
} from '@/lib/messageHelpers';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AlertCircle, ArrowDownFromLine, Clock, Play, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Media Preview Component for Bottom Sheet
function MediaPreview({ uri, type }: { uri: string; type: 'video' | 'image' }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
  });

  return (
    <VideoView
      player={player}
      style={{
        width: '100%',
        height: 300,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        overflow: 'hidden' // Fix for Android border radius
      }}
      contentFit="contain"
      nativeControls={true}
    />
  );
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  // Use React Query for cached messages and current user
  const { data: cachedMessages, isLoading: queryLoading } = useRoomMessages(id);
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const currentUserId = user?.id || null;
  const messages = cachedMessages || [];
  
  // Create a setState-like function for React Query cache updates
  const setMessages = (updater: (prev: Message[]) => Message[]) => {
    queryClient.setQueryData(['messages', id], (oldData: Message[] = []) => {
      return updater(oldData);
    });
  };
  
  const [inputText, setInputText] = useState('');
  
  // Initialize room data from cached messages if available
  const cachedOtherUser = messages.length > 0 && messages[0].user_id !== currentUserId 
    ? messages[0] 
    : messages.find(m => m.user_id !== currentUserId);
  
  const [roomName, setRoomName] = useState(cachedOtherUser?.profiles?.full_name || '');
  const [otherUserId, setOtherUserId] = useState<string | null>(cachedOtherUser?.user_id || null);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(cachedOtherUser?.profiles?.avatar_url || null);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null);
  
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [flashMessageId, setFlashMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false); // Is someone else typing?
  const [typingUserProfile, setTypingUserProfile] = useState<{ avatar_url?: string; full_name?: string } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false); // Show scroll to bottom button
  const [blockStatus, setBlockStatus] = useState<'none' | 'blocked_by_me' | 'blocked_me'>('none');
  const [uploading, setUploading] = useState(false); // Media upload state
  const [uploadProgress, setUploadProgress] = useState(0); // Upload progress percentage
  const [selectedMedia, setSelectedMedia] = useState<ImagePicker.ImagePickerAsset | null>(null); // Selected media for preview
  const [showMediaPreview, setShowMediaPreview] = useState(false); // Show media preview bottom sheet
  const [mediaError, setMediaError] = useState<string | null>(null); // Media error message

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // To clear the bubble
  const myTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // To throttle my sending

  // Update room info from cached messages immediately
  useEffect(() => {
    if (messages.length > 0 && currentUserId && !roomName) {
      const otherUserMessage = messages.find(m => m.user_id !== currentUserId);
      if (otherUserMessage) {
        setRoomName(otherUserMessage.profiles?.full_name || '');
        setOtherUserId(otherUserMessage.user_id);
        setOtherUserAvatar(otherUserMessage.profiles?.avatar_url || null);
      }
    }
  }, [messages, currentUserId, roomName]);

  // Mark messages as read
  const markAsRead = async () => {
    if (!currentUserId || !id) return;

    // Update ALL messages in this room that:
    // 1. Are NOT from me
    // 2. Are currently unread (read_at is null)
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('room_id', id)
      .neq('user_id', currentUserId)
      .is('read_at', null);

    if (error) console.error('Error marking read:', error);
  };

  // Open media viewer
  const openMediaViewer = (item: Message) => {
    const mediaUrl = (item as any).media_url;
    if (!mediaUrl) return;

    router.push({
      pathname: '/(app)/media-viewer',
      params: {
        uri: mediaUrl,
        type: (item as any).media_type || 'image',
        userName: item.profiles?.full_name || 'User',
        avatar: item.profiles?.avatar_url || '',
        timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        // NEW PARAMS NEEDED FOR REPLY:
        messageId: item.id,
        roomId: id,
      }
    });
  };

  // Handle media picking
  const handlePickMedia = (mode: 'library' | 'camera') => {
    setMediaError(null); // Clear previous error
    pickMedia(
      mode, 
      (file) => {
        setSelectedMedia(file);
        setShowMediaPreview(true);
      },
      (error) => {
        setMediaError(error);
        // Auto-clear error after 5 seconds
        setTimeout(() => setMediaError(null), 5000);
      }
    );
  };

  // Handle send from preview
  const handleSendMedia = async () => {
    if (!selectedMedia || !currentUserId) return;

    setShowMediaPreview(false);
    setMediaError(null);
    await uploadAndSendMedia(
      selectedMedia, 
      id, 
      currentUserId, 
      setMessages, 
      setUploading, 
      replyingTo?.id || null,
      (error) => {
        setMediaError(error);
        setTimeout(() => setMediaError(null), 5000);
      }
    );
    setSelectedMedia(null);
    setReplyingTo(null);
  };



  useEffect(() => {
    if (!currentUserId) return; // Wait for user to load
    
    // Setup room metadata only (no messages - React Query handles that)
    setupRoomMetadata(
      id, 
      () => {}, // currentUserId comes from useCurrentUser hook now
      setRoomName, 
      router, 
      setOtherUserAvatar,
      (profile: any) => {
        if (profile) {
          setOtherUserId(profile.id);
          setOtherUserLastSeen(profile.last_seen || null);
        }
      }
    );

    // Mark existing messages as read when entering the room
    markAsRead();

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
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // Fetch full message with joins
            const { data } = await fetchMessageById(payload.new.id);

            if (data) {
              // Update React Query cache
              queryClient.setQueryData(['messages', id], (oldData: Message[] = []) => {
                const exists = oldData.some(msg => msg.id === data.id);
                if (exists) {
                  // Replace optimistic message with real one
                  return oldData.map(msg => msg.id === data.id ? data : msg);
                } else {
                  // Add new message
                  return [data, ...oldData];
                }
              });

              // Also invalidate chat rooms to update last message
              queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });

              // If a NEW message arrives and I'm looking at the screen, mark it read
              if (data.user_id !== currentUserId) {
                markAsRead();
              }
            }
          }

          if (payload.eventType === 'UPDATE') {
            // Update React Query cache for message updates (reactions, read status, etc.)
            queryClient.setQueryData(['messages', id], (oldData: Message[] = []) => {
              return oldData.map((msg) =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              );
            });
          }

          if (payload.eventType === 'DELETE') {
            // Remove deleted message from React Query cache
            queryClient.setQueryData(['messages', id], (oldData: Message[] = []) => {
              return oldData.filter((msg) => msg.id !== payload.old.id);
            });
            
            // Also invalidate chat rooms to update last message
            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
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
    const isUploading = (item as any).status === 'uploading';

    // 6b. Check if message has media
    const hasMedia = !!(item as any).media_url;
    const mediaType = (item as any).media_type;

    // 7. Check if this is the latest message sent by me (for read receipt)
    // Only show "Seen" if:
    // - This is my message
    // - It's the most recent message I sent
    // - The other user hasn't replied yet (the very first message in the list should be mine)
    const myMessages = messages.filter(m => m.user_id === currentUserId);
    const isLatestOwnMessage = myMessages.length > 0 && myMessages[0].id === item.id;
    const otherUserHasReplied = messages.length > 0 && messages[0].user_id !== currentUserId;
    const readAt = (item as any).read_at;

    // Show read receipt only if it's my latest message AND the other user hasn't replied yet
    const shouldShowReadReceipt = isMe && isLatestOwnMessage && readAt && !otherUserHasReplied;

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
        <View className={`mb-2 ${isMe ? 'self-end items-end' : 'self-start items-start flex-row'} max-w-[80%]`}>
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
                  style={{ width: 32, height: 32, borderRadius: 16 }}
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

          <View className={`flex-shrink ${isMe ? 'items-end' : 'items-start'}`}>
            {/* Name Label (Them only) */}
            {!isMe && !onlyEmojis && (
              <Text className="text-kin-mist text-xs font-outfit mb-1 ml-1">
                {item.profiles?.full_name || 'User'}
              </Text>
            )}

            {/* REPLY PREVIEW - OUTSIDE THE BUBBLE (Fixed width for consistency) */}
            {replyData && (
              <TouchableOpacity
                onPress={() => scrollToMessage(replyData.id, messages, flatListRef, setFlashMessageId)}
                activeOpacity={0.7}
                className="mb-1 rounded-xl overflow-hidden flex-row w-[200px]"
              >
                {/* Left: Text Content with Border */}
                <View className={`flex-1 py-2 pl-3 pr-2 border-l-[3px] justify-center ${isMe ? 'border-kin-amber/50' : 'border-kin-amber'}`}>
                  <Text className={`text-[10px] font-outfit-bold mb-0.5 ${isMe ? 'text-kin-mist/70' : 'text-kin-amber'}`}>
                    {replyData.profiles?.full_name || 'User'}
                  </Text>
                  <Text
                    className={`text-[11px] text-kin-mist/80`}
                    numberOfLines={1}
                  >
                    {replyData.content || (replyData.media_type === 'video' ? '📹 Video' : replyData.media_type === 'image' ? '📷 Photo' : 'Message')}
                  </Text>
                </View>

                {/* Right: Media Thumbnail */}
                {replyData.media_url && (
                  <View className="w-12 h-12 rounded-md overflow-hidden bg-kin-slate/20">
                    <Image
                      source={{ uri: replyData.media_url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    {/* Video Icon Overlay */}
                    {replyData.media_type === 'video' && (
                      <View className="absolute inset-0 items-center justify-center bg-black/40">
                        <Play size={14} color="white" fill="white" />
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Wrapper for bubble and reactions positioning */}
            <View className="relative">
              <TouchableOpacity
                onLongPress={() => handleLongPress(item, setSelectedMessage)}
                delayLongPress={300}
                activeOpacity={0.8}
              >
                {/* THE BUBBLE - ONLY FOR ACTUAL MESSAGE CONTENT */}
                <View
                  className={`
                ${hasReactions ? 'mb-6' : 'mb-1'}
                ${onlyEmojis || hasMedia ? 'bg-transparent px-0 py-0' : 'px-4 py-3 rounded-2xl'}
                ${!onlyEmojis && !hasMedia && isMe ? 'bg-kin-amber rounded-tr-sm' : ''}
                ${!onlyEmojis && !hasMedia && !isMe ? 'bg-kin-midnight border border-kin-slate rounded-tl-sm' : ''}
                ${isFlashing && !onlyEmojis && !hasMedia ? (isMe ? 'opacity-70' : 'bg-kin-slate/50') : ''}
                ${isSending || isUploading ? 'opacity-70' : 'opacity-100'}
              `}
                >
                  {/* MEDIA CONTENT (Image/Video) */}
                  {hasMedia && (
                    <View className="relative rounded-xl overflow-hidden">
                      <ChatMedia
                        uri={(item as any).media_url}
                        type={mediaType || 'image'}
                        onPress={() => openMediaViewer(item)}
                        onLongPress={() => handleLongPress(item, setSelectedMessage)}
                      />

                      {/* Upload Progress Overlay */}
                      {isUploading && (
                        <View className="absolute inset-0 bg-black/60 items-center justify-center rounded-xl">
                          <ActivityIndicator size="large" color="#F59E0B" />
                          <Text className="text-white text-xs font-outfit-medium mt-2">Uploading...</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* TEXT CONTENT (with bubble if media exists) */}
                  {item.content && !onlyEmojis && (
                    <View className={hasMedia ? `mt-2 px-4 py-3 rounded-2xl ${isMe ? 'bg-kin-amber rounded-tr-sm' : 'bg-kin-midnight border border-kin-slate rounded-tl-sm'}` : ''}>
                      <LinkText
                        className={`font-outfit text-base
                      ${!onlyEmojis && isMe ? 'text-black font-outfit-medium' : 'text-kin-white'}
                    `}
                        linkColor={isMe ? '#1E40AF' : '#60A5FA'}
                      >
                        {item.content}
                      </LinkText>
                    </View>
                  )}

                  {/* EMOJI ONLY CONTENT */}
                  {onlyEmojis && (
                    <Text className="text-3xl font-outfit">
                      {item.content}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* REACTIONS PILL - Positioned relative to wrapper */}
              {hasReactions && (
                <TouchableOpacity
                  onPress={() => handleLongPress(item, setSelectedMessage)}
                  className={`
                absolute -bottom-4
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

            {/* STATUS INDICATORS (Sending/Error/Read) - Show for ALL messages */}
            <View className={`flex-row items-center gap-1 ${hasReactions ? 'mt-1' : 'mt-1'}`}>

              {/* Sending Icon */}
              {isSending && (
                <Clock size={10} color="#F59E0B" />
              )}

              {/* Error Icon */}
              {isError && (
                <AlertCircle size={10} color="#EF4444" />
              )}

              {/* Read Receipt */}
              {shouldShowReadReceipt && !isSending && !isError && (
                <Text className="text-[10px] text-kin-amber font-outfit-bold">
                  • Seen {formatTimeAgo(readAt)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Loading guard: Wait for user ID to prevent race condition
  // This prevents messages from appearing on wrong side before we know "who we are"
  if (userLoading || !currentUserId) {
    return (
      <SafeAreaView className="flex-1 bg-kin-charcoal justify-center items-center">
        <ActivityIndicator color="#F59E0B" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal" edges={['top', 'left', 'right']}>
      <ChatHeader
        roomName={roomName}
        avatarUrl={otherUserAvatar}
        userId={otherUserId}
        lastSeen={otherUserLastSeen}
        onBack={() => router.back()}
        onProfilePress={() => {
          if (otherUserId) {
            router.push({
              pathname: '/(app)/chat-details',
              params: { roomId: id, odataId: otherUserId }
            });
          }
        }}
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
            <ArrowDownFromLine size={22} color="#000000" />
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
          <View className="bg-kin-midnight px-4 py-2 border-t border-kin-slate/30">
            <View className="bg-kin-slate/30 rounded-xl overflow-hidden flex-row">
              {/* Left: Text Content with Border */}
              <View className="flex-1 py-2 pl-3 pr-2 border-l-[4px] border-kin-amber justify-center">
                <Text className="text-kin-amber text-xs font-outfit-bold mb-0.5">
                  Replying to {replyingTo.profiles?.full_name || 'User'}
                </Text>
                <Text className="text-kin-mist text-xs font-outfit" numberOfLines={1}>
                  {(replyingTo as any).content || ((replyingTo as any).media_type === 'video' ? '📹 Video' : (replyingTo as any).media_type === 'image' ? '📷 Photo' : 'Message')}
                </Text>
              </View>

              {/* Right: Media Thumbnail or Close Button */}
              {(replyingTo as any).media_url ? (
                <View className="relative">
                  <View className="w-14 h-14 bg-black/10">
                    <Image
                      source={{ uri: (replyingTo as any).media_url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    {/* Video Icon Overlay */}
                    {(replyingTo as any).media_type === 'video' && (
                      <View className="absolute inset-0 items-center justify-center bg-black/30">
                        <Play size={16} color="white" fill="white" />
                      </View>
                    )}
                  </View>
                  {/* Close button on top of thumbnail */}
                  <TouchableOpacity 
                    onPress={() => setReplyingTo(null)}
                    className="absolute -top-1 -right-1 bg-kin-charcoal rounded-full p-1"
                    style={{ elevation: 3 }}
                  >
                    <X color="#9CA3AF" size={14} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={() => setReplyingTo(null)}
                  className="w-14 h-14 items-center justify-center"
                >
                  <X color="#9CA3AF" size={20} />
                </TouchableOpacity>
              )}
            </View>
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
          <>
            {/* Media Error Message */}
            {mediaError && (
              <View className="bg-red-500/10 mx-4 mb-2 px-4 py-3 rounded-xl border border-red-500/30 flex-row items-center">
                <AlertCircle size={18} color="#EF4444" />
                <Text className="text-red-400 text-sm font-outfit ml-2 flex-1">{mediaError}</Text>
                <TouchableOpacity onPress={() => setMediaError(null)}>
                  <X size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
            <ChatInput
              value={inputText}
              onChangeText={(text) => handleInputChange(text, setInputText, currentUserId, id, myTypingTimeoutRef)}
              onSend={() => handleSendMessage(inputText, currentUserId, id, replyingTo, setInputText, setReplyingTo, setMessages)}
              onCameraPress={() => handlePickMedia('camera')}
              onMicPress={() => console.log('Mic')}
              onImagePress={() => handlePickMedia('library')}
            />
          </>
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

      {/* Media Preview Bottom Sheet */}
      {showMediaPreview && selectedMedia && (
        <View className="absolute inset-0 bg-black/80 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => {
              setShowMediaPreview(false);
              setSelectedMedia(null);
            }}
          />

          <View className="bg-kin-charcoal rounded-t-3xl pb-8">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-kin-slate/30">
              <Text className="text-kin-white text-lg font-outfit-bold">
                {replyingTo ? 'Reply with Media' : 'Send Media'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowMediaPreview(false);
                  setSelectedMedia(null);
                }}
              >
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>

            {/* Reply Indicator */}
            {replyingTo && (
              <View className="mx-6 mt-4 bg-kin-slate/30 rounded-xl overflow-hidden flex-row">
                <View className="flex-1 py-2 pl-3 pr-2 border-l-[4px] border-kin-amber justify-center">
                  <Text className="text-kin-amber text-xs font-outfit-bold mb-0.5">
                    Replying to {replyingTo.profiles?.full_name || 'User'}
                  </Text>
                  <Text className="text-kin-mist text-xs font-outfit" numberOfLines={1}>
                    {(replyingTo as any).content || ((replyingTo as any).media_type === 'video' ? '📹 Video' : (replyingTo as any).media_type === 'image' ? '📷 Photo' : 'Message')}
                  </Text>
                </View>
                {(replyingTo as any).media_url && (
                  <View className="w-12 h-12 rounded-md overflow-hidden bg-kin-slate/20">
                    <Image
                      source={{ uri: (replyingTo as any).media_url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    {(replyingTo as any).media_type === 'video' && (
                      <View className="absolute inset-0 items-center justify-center bg-black/40">
                        <Play size={14} color="white" fill="white" />
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Media Preview */}
            <View className="px-6 py-6 items-center">
              {selectedMedia.type === 'video' ? (
                <MediaPreview uri={selectedMedia.uri} type="video" />
              ) : (
                <Image
                  source={{ uri: selectedMedia.uri }}
                  style={{
                    width: '100%',
                    height: 300,
                    backgroundColor: '#1e293b',
                    borderRadius: 16
                  }}
                  contentFit="contain"
                  transition={200}
                />
              )}

              {/* File Info */}
              <View className="mt-4 flex-row items-center gap-2">
                <Text className="text-kin-mist text-sm font-outfit">
                  {selectedMedia.type === 'video' ? 'Video' : 'Image'}
                </Text>
                {selectedMedia.fileSize && (
                  <>
                    <Text className="text-kin-mist text-sm">•</Text>
                    <Text className="text-kin-mist text-sm font-outfit">
                      {(selectedMedia.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Send Button */}
            <View className="px-6">
              <TouchableOpacity
                onPress={handleSendMedia}
                disabled={uploading}
                className="bg-kin-amber py-4 rounded-2xl items-center"
              >
                {uploading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-black text-base font-outfit-bold">Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}