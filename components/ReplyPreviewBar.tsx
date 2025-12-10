import { Message } from '@/lib/chat';
import { X } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

interface ReplyPreviewBarProps {
  replyingTo: Message | null;
  onClose: () => void;
}

export default function ReplyPreviewBar({ replyingTo, onClose }: ReplyPreviewBarProps) {
  if (!replyingTo) return null;

  return (
    <View className="bg-kin-midnight px-4 py-2 border-t border-kin-slate/30 flex-row justify-between items-center">
      <View className="border-l-4 border-kin-amber pl-3 flex-1">
        <Text className="text-kin-amber text-xs font-outfit-bold mb-1">
          Replying to {replyingTo.profiles?.full_name || 'User'}
        </Text>
        <Text className="text-kin-mist text-xs font-outfit" numberOfLines={1}>
          {replyingTo.content}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose}>
        <X color="#9CA3AF" size={20} />
      </TouchableOpacity>
    </View>
  );
}
