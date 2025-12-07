import { MenuItemProps } from '@/types';
import { ChevronRight } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';


export default function MenuItem({ 
  icon: Icon, 
  label, 
  value, 
  isLast, 
  isDestructive, 
  onPress 
}: MenuItemProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`flex-row items-center justify-between p-4 active:bg-kin-slate/20 ${!isLast ? 'border-b border-kin-slate/30' : ''}`}
    >
      <View className="flex-row items-center">
        <View className={`h-10 w-10 rounded-full items-center justify-center mr-4 ${isDestructive ? 'bg-red-500/10' : 'bg-kin-slate/20'}`}>
          <Icon color={isDestructive ? '#EF4444' : '#7077A1'} size={20} />
        </View>
        <Text className={`font-outfit-medium text-base ${isDestructive ? 'text-red-500' : 'text-kin-white'}`}>
          {label}
        </Text>
      </View>
      
      <View className="flex-row items-center">
        {value && <Text className="text-kin-mist font-outfit mr-2">{value}</Text>}
        {!isDestructive && <ChevronRight color="#7077A1" size={20} />}
      </View>
    </TouchableOpacity>
  );
}
