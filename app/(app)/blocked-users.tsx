import { supabase } from '@/lib/supabase';
import { BlockedUser } from '@/types';
import { useRouter } from 'expo-router';
import { Ban, ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function BlockedUsersScreen() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  async function fetchBlockedUsers() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('blocked_users')
      .select(`
        id,
        blocked_user_id,
        profile:profiles!blocked_users_blocked_user_id_fkey(full_name, avatar_url)
      `)
      .eq('user_id', user.id);

    if (data) {
      const normalized = data.map(item => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile
      }));
      setBlockedUsers(normalized);
    }

    setLoading(false);
  }

  async function handleUnblock(blockId: string) {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('id', blockId);

    if (!error) {
      setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-kin-slate/30">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft color="#F59E0B" size={24} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-kin-white font-outfit-bold text-xl">Blocked Users</Text>
          <Text className="text-kin-mist text-sm font-outfit">
            {blockedUsers.length} {blockedUsers.length === 1 ? 'user' : 'users'} blocked
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#F59E0B" size="large" />
        </View>
      ) : blockedUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-kin-midnight p-6 rounded-full mb-4">
            <Ban size={48} color="#7077A1" />
          </View>
          <Text className="text-kin-white font-outfit-bold text-xl mb-2">No Blocked Users</Text>
          <Text className="text-kin-mist text-center font-outfit">
            You haven't blocked anyone yet. Blocked users won't be able to interact with you.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          renderItem={({ item }) => (
            <View className="bg-kin-midnight p-4 rounded-2xl border border-kin-slate/20 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="h-12 w-12 bg-kin-slate rounded-full items-center justify-center overflow-hidden mr-3">
                  {item.profile?.avatar_url ? (
                    <Image 
                      source={{ uri: item.profile.avatar_url }} 
                      className="h-full w-full" 
                    />
                  ) : (
                    <Text className="text-kin-white font-outfit-bold text-lg">
                      {item.profile?.full_name?.[0] || '?'}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-kin-white font-outfit-bold text-lg">
                    {item.profile?.full_name || 'Unknown User'}
                  </Text>
                  <Text className="text-kin-mist text-xs font-outfit">Blocked</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleUnblock(item.id)}
                className="bg-kin-slate/20 px-4 py-2 rounded-lg active:opacity-80"
              >
                <Text className="text-kin-amber font-outfit-bold text-sm">Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
