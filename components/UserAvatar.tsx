import { usePresence } from '@/lib/PresenceContext';
import { formatLastSeen } from '@/lib/presenceUtils';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

type UserAvatarProps = {
  avatarUrl?: string | null;
  userId: string;
  lastSeen?: string | null;
  size?: number;
  showTimeText?: boolean;
};

export default function UserAvatar({ 
  avatarUrl, 
  userId, 
  lastSeen, 
  size = 48, 
  showTimeText = false 
}: UserAvatarProps) {
  const { onlineUsers } = usePresence();
  
  // Check if ID is in the Realtime Set
  const isOnline = onlineUsers.has(userId);

  // Calculate dot size proportionally
  const dotSize = Math.max(size * 0.28, 10);
  const borderWidth = Math.max(size * 0.04, 2);

  return (
    <View className={showTimeText ? "flex-row items-center" : ""}>
      {/* Avatar Image & Dot */}
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Image
          source={{ uri: avatarUrl || 'https://i.pravatar.cc/150' }}
          style={{ 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: '#374151' 
          }}
        />
        
        {/* Green Dot (Only if Online) */}
        {isOnline && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: '#22C55E',
              borderWidth: borderWidth,
              borderColor: '#111827',
            }}
          />
        )}
      </View>

      {/* Text Status (Offline Time) */}
      {showTimeText && (
        <View className="ml-3">
          <Text className="text-kin-mist text-xs">
            {isOnline ? (
              <Text className="text-green-500 font-outfit-bold">Online</Text>
            ) : (
              `Last seen ${formatLastSeen(lastSeen)}`
            )}
          </Text>
        </View>
      )}
    </View>
  );
}
