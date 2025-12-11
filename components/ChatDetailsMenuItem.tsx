import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

type ChatDetailsMenuItemProps = {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
};

export default function ChatDetailsMenuItem({ icon: Icon, label, value, onPress }: ChatDetailsMenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-4 border-b border-kin-slate/10"
    >
      <Icon size={22} color="#9CA3AF" />
      <View className="flex-1 ml-4">
        <Text className="text-kin-white font-outfit-medium text-base">{label}</Text>
        {value && <Text className="text-kin-mist text-xs">{value}</Text>}
      </View>
      <ChevronRight size={20} color="#334155" />
    </TouchableOpacity>
  );
}
