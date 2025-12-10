import ChatMedia from '@/components/ChatMedia';
import { Message } from '@/lib/chat';
import { getUserInitial } from '@/lib/messageHelpers';
import { Image } from 'expo-image';
import { AlertCircle, Clock } from 'lucide-react-native';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface ChatMessageBubbleProps {
  item: Message;
  isMe: boolean;
  onlyEmojis: boolean;
  hasMedia: boolean;
  mediaType: string;
  hasReactions: boolean;
  reactions: Record<string, string[]>;
  replyData: any;
  isFlashing: boolean;
  isSending: boolean;
  isError: boolean;
  isUploading: boolean;
  shouldShowReadReceipt: boolean;
  readAt: string;
  formatTimeAgo: (date: string) => string;
  onLongPress: () => void;
  onReplyPress: () => void;
  onProfilePress: () => void;
}

export default function ChatMessageBubble({
  item,
  isMe,
  onlyEmojis,
  hasMedia,
  mediaType,
  hasReactions,
  reactions,
  replyData,
  isFlashing,
  isSending,
  isError,
  isUploading,
  shouldShowReadReceipt,
  readAt,
  formatTimeAgo,
  onLongPress,
  onReplyPress,
  onProfilePress,
}: ChatMessageBubbleProps) {
  return (
    <View className={`mb-2 ${isMe ? 'self-end items-end' : 'self-start items-start flex-row'} max-w-[80%]`}>
      {/* Profile Image (Other users only) */}
      {!isMe && !onlyEmojis && (
        <TouchableOpacity 
          className="mr-2 mt-6"
          onPress={onProfilePress}
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

      <View className={`flex-shrink ${isMe ? 'items-end' : ''}`}>
        <TouchableOpacity 
          onLongPress={onLongPress}
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
              relative mb-6 overflow-hidden
              ${onlyEmojis || hasMedia ? 'bg-transparent px-0 py-0' : 'px-4 py-3 rounded-2xl'}
              ${!onlyEmojis && !hasMedia && isMe ? 'bg-kin-amber rounded-tr-sm' : ''}
              ${!onlyEmojis && !hasMedia && !isMe ? 'bg-kin-midnight border border-kin-slate rounded-tl-sm' : ''}
              ${isFlashing && !onlyEmojis && !hasMedia ? (isMe ? 'opacity-70' : 'bg-kin-slate/50') : ''}
              ${isSending || isUploading ? 'opacity-70' : 'opacity-100'}
            `}
            style={{ alignSelf: 'flex-start' }}
          >
            {/* REPLY PREVIEW */}
            {replyData && !onlyEmojis && (
              <TouchableOpacity
                onPress={onReplyPress}
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

            {/* MEDIA CONTENT */}
            {hasMedia && (
              <View className="relative rounded-xl overflow-hidden">
                <ChatMedia 
                  uri={(item as any).media_url} 
                  type={mediaType || 'image'} 
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

            {/* TEXT CONTENT */}
            {item.content && !onlyEmojis && (
              <View className={hasMedia ? `mt-2 px-4 py-3 rounded-2xl ${isMe ? 'bg-kin-amber rounded-tr-sm' : 'bg-kin-midnight border border-kin-slate rounded-tl-sm'}` : ''}>
                <Text 
                  className={`font-outfit text-base
                    ${!onlyEmojis && isMe ? 'text-black font-outfit-medium' : 'text-kin-white'}
                  `}
                >
                  {item.content}
                </Text>
              </View>
            )}
            
            {/* EMOJI ONLY CONTENT */}
            {onlyEmojis && (
              <Text className="text-3xl font-outfit">
                {item.content}
              </Text>
            )}

            {/* REACTIONS PILL */}
            {hasReactions && (
              <TouchableOpacity
                onPress={onLongPress}
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
        </TouchableOpacity>
        
        {/* STATUS INDICATORS */}
        <View className="flex-row items-center gap-1" style={{ marginTop: hasReactions ? 4 : 4 }}>
          {/* Sending Icon */}
          {isSending && <Clock size={10} color="#F59E0B" />}
          
          {/* Error Icon */}
          {isError && <AlertCircle size={10} color="#EF4444" />}
          
          {/* Read Receipt */}
          {shouldShowReadReceipt && !isSending && !isError && (
            <Text className="text-[10px] text-kin-amber font-outfit-bold">
              • Seen {formatTimeAgo(readAt)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
