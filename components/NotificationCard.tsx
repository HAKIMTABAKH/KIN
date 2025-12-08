import { Ellipsis } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

type NotificationCardProps = {
  icon?: React.ReactNode;
  avatarUrl?: string;
  title: string;
  subtitle: string;
  time: string;
  onPress?: () => void;
  onMenuPress?: () => void;
  bottomAction?: React.ReactNode;
};

export default function NotificationCard({
  icon,
  avatarUrl,
  title,
  subtitle,
  time,
  onPress,
  onMenuPress,
  bottomAction
}: NotificationCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-kin-midnight p-4 rounded-2xl border border-kin-slate/20 mb-3"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-start flex-1">
          {/* Avatar or Icon */}
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="h-12 w-12 rounded-full bg-kin-slate"
            />
          ) : (
            <View className="h-12 w-12 rounded-full bg-kin-slate/20 items-center justify-center">
              {icon}
            </View>
          )}

          {/* Content */}
          <View className="ml-3 flex-1">
            <Text className="text-kin-white font-outfit-bold text-sm" numberOfLines={2}>
              {title}
            </Text>
            <Text className="text-kin-mist text-xs mt-1" numberOfLines={2}>
              {subtitle}
            </Text>
            <Text className="text-kin-white text-xs mt-1">{time}</Text>
          </View>
        </View>

        {/* Menu Button */}
        {onMenuPress && (
          <TouchableOpacity
            onPress={onMenuPress}
            className="h-8 w-8 items-center justify-center ml-2"
          >
            <Ellipsis size={20} color="#7077A1" />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Action */}
      {bottomAction && (
        <View className="mt-4 pt-3 border-t border-kin-slate/10">
          {bottomAction}
        </View>
      )}
    </TouchableOpacity>
  );
}
