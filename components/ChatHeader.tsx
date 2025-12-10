import { ChatHeaderProps } from '@/types';
import { Image } from 'expo-image';
import { ArrowLeft, Phone, Video } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';


export default function ChatHeader({ roomName, avatarUrl, onBack, onVoiceCall, onVideoCall }: ChatHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-kin-slate/60 bg-kin-charcoal z-10">
      {/* Left Section: Back Button + Avatar + Name */}
      <View className="flex-row items-center flex-1">
        <TouchableOpacity onPress={onBack} className="mr-3 p-2 -ml-2">
          <ArrowLeft color="#F59E0B" size={24} />
        </TouchableOpacity>
        
        {/* Profile Avatar */}
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="w-10 h-10 rounded-full mr-3"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-kin-slate items-center justify-center mr-3">
            <Text className="text-kin-white text-sm font-outfit-bold">
              {roomName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View>
          <Text className="text-kin-white font-outfit-bold text-lg">{roomName}</Text>
          <Text className="text-kin-mist font-outfit text-xs">Live</Text>
        </View>
      </View>

      {/* Right Section: Call Buttons */}
      <View className="flex-row items-center space-x-3">
        <TouchableOpacity className="p-2" onPress={onVoiceCall}>
          <Phone color="#7077A1" size={22} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2" onPress={onVideoCall}>
          <Video color="#7077A1" size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
