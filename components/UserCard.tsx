import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { UserCardProps } from '@/types';

export default function UserCard({ 
  title, 
  subtitle, 
  avatarUrl, 
  onPress, 
  rightAction, 
  bottomAction 
}: UserCardProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-kin-midnight p-4 rounded-2xl border border-kin-slate/20 mb-3"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Image 
            source={{ uri: avatarUrl || 'https://i.pravatar.cc/150' }} 
            className="h-12 w-12 rounded-full bg-kin-slate" 
          />
          <View className="ml-3 flex-1">
            <Text className="text-kin-white font-outfit-bold text-lg" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-kin-mist text-xs" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
        
        {rightAction && (
          <View className="ml-2">
            {rightAction}
          </View>
        )}
      </View>

      {bottomAction && (
        <View className="mt-4 pt-3 border-t border-kin-slate/10">
          {bottomAction}
        </View>
      )}
    </TouchableOpacity>
  );
}
