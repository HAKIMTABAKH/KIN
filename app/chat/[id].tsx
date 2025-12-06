import ChatHeader from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import ChatMessage from '@/components/ChatMessage';
import MessageMenu from '@/components/MessageMenu';
import { getCurrentUser } from '@/lib/auth';
import { fetchMessages, getRoomDetails, Message, sendMessage as sendChatMessage, subscribeToRoom, unsubscribeFromRoom } from '@/lib/chat';
import { getSeparatorText } from '@/lib/dateHelpers';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('Chat');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  useEffect(() => {
    setupRoom();

    // Subscribe to realtime messages
    const channel = subscribeToRoom(id, (newMessage) => {
      setMessages((prev) => [newMessage, ...prev]);
    });

    return () => {
      unsubscribeFromRoom(channel);
    };
  }, [id]);

  async function setupRoom() {
    // Get current user
    const { user } = await getCurrentUser();
    setCurrentUserId(user?.id || null);

    // Get room details
    const { data: roomData } = await getRoomDetails(id);
    if (roomData) setRoomName(roomData.name || 'Chat');

    // Load initial messages
    const { data: messagesData } = await fetchMessages(id);
    setMessages(messagesData);
    
    setLoading(false);
  }

  async function handleSendMessage() {
    if (!inputText.trim() || !currentUserId) return;

    const content = inputText.trim();
    setInputText('');
    setReplyingTo(null);

    await sendChatMessage(id, currentUserId, content);
  }

  const handleLongPress = (message: Message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(message);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleDelete = async (messageId: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const handleReaction = async (emoji: string) => {
    console.log(`Reacted with ${emoji} to message ${selectedMessage?.id}`);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const olderMessage = messages[index + 1];
    const currentDate = new Date(item.created_at);
    const olderDate = olderMessage ? new Date(olderMessage.created_at) : null;
    const separatorText = getSeparatorText(currentDate, olderDate);
    
    return (
      <TouchableOpacity
        onLongPress={() => handleLongPress(item)}
        delayLongPress={300}
        activeOpacity={0.8}
      >
        <ChatMessage 
          message={item} 
          isCurrentUser={item.user_id === currentUserId}
          showSeparator={!!separatorText}
          separatorText={separatorText || undefined}
        />
      </TouchableOpacity>
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
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
          className="flex-1"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
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

        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          onCameraPress={() => console.log('Camera')}
          onMicPress={() => console.log('Mic')}
          onImagePress={() => console.log('Image')}
          onEmojiPress={() => console.log('Emoji')}
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