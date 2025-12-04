import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatsListScreen() {
  // Example chat data
  const chats = [
    { id: '1', name: 'John Doe', lastMessage: 'Hey there!' },
    { id: '2', name: 'Jane Smith', lastMessage: 'See you tomorrow' },
    { id: '3', name: 'Mike Johnson', lastMessage: 'Thanks!' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <View className="p-6">
        <Text className="text-kin-white text-2xl font-outfit-bold mb-4">Chats</Text>
        
        {chats.map((chat) => (
          <Link key={chat.id} href={`/chat/${chat.id}`} asChild>
            <Pressable className="bg-kin-slate p-4 rounded-lg mb-3">
              <Text className="text-kin-white text-lg font-outfit-medium">{chat.name}</Text>
              <Text className="text-kin-mist text-sm font-outfit">{chat.lastMessage}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </SafeAreaView>
  );
}
