import { LucideIcon } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

type ChatDetailsTabItemProps = {
  icon: LucideIcon;
  isActive: boolean;
  onPress: () => void;
};

export default function ChatDetailsTabItem({ icon: Icon, isActive, onPress }: ChatDetailsTabItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 items-center pb-3 border-b-2 ${isActive ? 'border-kin-amber' : 'border-transparent'}`}
    >
      <Icon size={20} color={isActive ? '#F59E0B' : '#7077A1'} />
    </TouchableOpacity>
  );
}
