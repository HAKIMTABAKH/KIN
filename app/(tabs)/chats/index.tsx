import { Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatsListScreen() {
  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <View className="p-6">
        <Text className="text-kin-white text-2xl font-outfit-bold">Chats</Text>
      </View>
    </SafeAreaView>
  );
}
