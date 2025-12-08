import { fetchRequests } from "@/lib/people";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { Link, useRouter } from "expo-router";
import { Bell, UserPlus } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const LAST_SEEN_KEY = 'notifications_last_seen';

export default function FeedScreen() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [])
  );

  async function loadUnreadCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const requests = await fetchRequests(user.id);
      setUnreadCount(requests.length);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }

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
            className="h-10 w-10 bg-kin-midnight rounded-full items-center justify-center border border-kin-slate/30 relative"
          >
            <Bell color="#F59E0B" size={22} />
            {/* Badge with count */}
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full items-center justify-center border-2 border-kin-charcoal">
                <Text className="text-white text-xs font-outfit-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
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