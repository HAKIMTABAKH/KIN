import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TabButtonProps {
  isActive: boolean;
  onPress: () => void;
  label: string;
  count?: number;
}

export default function TabButton({ isActive, onPress, label, count }: TabButtonProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`flex-1 items-center py-3 border-b-2 ${isActive ? 'border-kin-amber' : 'border-transparent'}`}
    >
      <View className="relative">
        <Text className={`font-outfit-bold text-sm ${isActive ? 'text-kin-white' : 'text-kin-mist'}`}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View className="absolute -top-1 -right-5 bg-red-500 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1">
            <Text className="text-white text-[10px] font-outfit-bold">
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
