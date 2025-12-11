import { LucideIcon } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

type ChatDetailsActionButtonProps = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
};

export default function ChatDetailsActionButton({ icon: Icon, label, onPress }: ChatDetailsActionButtonProps) {
  return (
    <View className="items-center">
      <TouchableOpacity
        onPress={onPress}
        className="h-12 w-12 bg-kin-midnight rounded-full items-center justify-center border border-kin-slate/30 mb-1"
      >
        <Icon size={20} color="#F59E0B" />
      </TouchableOpacity>
      <Text className="text-kin-white text-xs font-outfit">{label}</Text>
    </View>
  );
}
