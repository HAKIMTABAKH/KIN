import { Link, useRouter } from "expo-router";
import { Bell, Search, UserPlus } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FeedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <ScrollView>
        {/* Header with Find People Button */}
      
         <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-kin-white font-outfit-bold text-3xl">Feed</Text>
        </View>
        
        <View className="flex-row gap-3">
          {/* REQUESTS BUTTON */}
            <TouchableOpacity 
            onPress={() => router.push('/(app)/Notifications')}
            className="h-10 w-10 bg-kin-midnight rounded-full items-center justify-center border border-kin-slate/30"
          >
            <Bell color="#F59E0B" size={22} />
            {/* Red Dot for unread */}
            <View className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-kin-charcoal" />
          </TouchableOpacity>

          {/* ADD FRIEND BUTTON */}
          <Link href="/add-friend" asChild>
            <TouchableOpacity className="h-10 w-10 bg-kin-amber rounded-full items-center justify-center shadow-lg">
              <UserPlus   color="#111827" size={22} />
            </TouchableOpacity>
          </Link>
        </View>
        </View>

        {/* Feed Content - Coming Soon */}
        <View className="px-6 pt-6">
          <View className="bg-kin-midnight rounded-2xl p-8 items-center border border-kin-slate/50">
            <Text className="text-kin-mist font-outfit text-center mb-2">
              Your feed is empty
            </Text>
            <Text className="text-kin-slate text-xs font-outfit text-center">
              Start following people to see their posts here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}