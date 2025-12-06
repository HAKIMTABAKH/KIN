import { Message } from '@/lib/chat';
import { Text, View } from 'react-native';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  showSeparator?: boolean;
  separatorText?: string;
}

export default function ChatMessage({ 
  message, 
  isCurrentUser, 
  showSeparator, 
  separatorText 
}: ChatMessageProps) {
  const currentDate = new Date(message.created_at);

  return (
    <View>
      {/* DATE SEPARATOR */}
      {showSeparator && separatorText && (
        <View className="items-center my-4 opacity-60">
          <View className="bg-kin-slate/40 px-3 py-1 rounded-full">
            <Text className="text-kin-mist text-xs font-outfit-medium">
              {separatorText}
            </Text>
          </View>
        </View>
      )}

      {/* MESSAGE BUBBLE */}
      <View className={`mb-2 max-w-[80%] ${isCurrentUser ? 'self-end' : 'self-start'}`}>
        {/* Name Label (Only for others) */}
        {!isCurrentUser && (
          <Text className="text-kin-mist text-xs font-outfit mb-1 ml-1">
            {message.profiles?.full_name || 'User'}
          </Text>
        )}

        {/* The Bubble */}
        <View
          className={`px-4 py-3 rounded-2xl ${
            isCurrentUser
              ? 'bg-kin-amber rounded-tr-sm'
              : 'bg-kin-midnight border border-kin-slate rounded-tl-sm'
          }`}
        >
          <Text className={`font-outfit text-base ${isCurrentUser ? 'text-black font-outfit-medium' : 'text-kin-white'}`}>
            {message.content}
          </Text>
        </View>


      </View>
    </View>
  );
}
