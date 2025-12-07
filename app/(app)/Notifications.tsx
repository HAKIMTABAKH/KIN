import { ArrowLeft, Bell, Heart, UserPlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock Data
const NOTIFICATIONS = [
  { id: '1', type: 'system', text: 'Welcome to Kin! Complete your profile.', time: '2h ago', read: false },
  { id: '2', type: 'like', text: 'Sarah reacted ❤️ to your message.', time: '5h ago', read: true },
  { id: '3', type: 'request', text: 'Mike accepted your friend request.', time: '1d ago', read: true },
];

export default function NotificationsScreen() {
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={18} color="#EF4444" fill="#EF4444" />;
      case 'request': return <UserPlus size={18} color="#3B82F6" />;
      default: return <Bell size={18} color="#F59E0B" />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-kin-slate/30">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="#F59E0B" size={24} />
        </TouchableOpacity>
        <Text className="text-kin-white font-outfit-bold text-xl">Notifications</Text>
      </View>

      <FlatList 
        data={NOTIFICATIONS}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
           <TouchableOpacity className={`flex-row items-center p-4 rounded-2xl mb-3 ${item.read ? 'bg-transparent' : 'bg-kin-midnight border border-kin-slate/30'}`}>
              <View className={`h-10 w-10 rounded-full items-center justify-center mr-4 bg-kin-slate/20`}>
                 {getIcon(item.type)}
              </View>
              <View className="flex-1">
                 <Text className={`font-outfit text-sm ${item.read ? 'text-kin-mist' : 'text-kin-white font-outfit-bold'}`}>{item.text}</Text>
                 <Text className="text-kin-slate text-xs mt-1">{item.time}</Text>
              </View>
              {!item.read && <View className="h-2 w-2 bg-kin-amber rounded-full" />}
           </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}