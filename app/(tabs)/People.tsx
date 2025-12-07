import { supabase } from '@/lib/supabase';
import { Search, UserPlus, Users, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  Image, 
  RefreshControl, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SocialTab = 'suggestions' | 'requests' | 'friends';

export default function PeopleScreen() {
  const [activeTab, setActiveTab] = useState<SocialTab>('suggestions');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data State
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await Promise.all([
      fetchRequests(user.id),
      fetchFriends(user.id),
      fetchSuggestions(user.id)
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // --- QUERIES ---
  async function fetchRequests(uid: string) {
    const { data } = await supabase.from('friendships').select(`id, requester_id, profiles!friendships_requester_id_fkey(full_name, avatar_url)`).eq('receiver_id', uid).eq('status', 'pending');
    if(data) setRequests(data.map(i => ({...i, profiles: Array.isArray(i.profiles) ? i.profiles[0] : i.profiles})));
  }
  async function fetchFriends(uid: string) {
    const { data } = await supabase.from('friendships').select(`id, requester_id, receiver_id, requester:profiles!friendships_requester_id_fkey(*), receiver:profiles!friendships_receiver_id_fkey(*)`).or(`requester_id.eq.${uid},receiver_id.eq.${uid}`).eq('status', 'accepted');
    if(data) setFriends(data.map(i => ({ id: i.id, profile: i.requester_id === uid ? i.receiver : i.requester })));
  }
  async function fetchSuggestions(uid: string) {
    const { data } = await supabase.from('profiles').select('*').neq('id', uid).limit(20);
    if(data) setSuggestions(data);
  }

  // --- TAB COMPONENT ---
  const TabButton = ({ id, label, count }: { id: SocialTab; label: string; count?: number }) => {
    const isActive = activeTab === id;
    return (
      <TouchableOpacity 
        onPress={() => setActiveTab(id)}
        className={`flex-1 items-center py-3 border-b-2 ${isActive ? 'border-kin-amber' : 'border-transparent'}`}
      >
        <Text className={`font-outfit-bold text-sm ${isActive ? 'text-kin-white' : 'text-kin-mist'}`}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View className="absolute top-2 right-4 bg-red-500 h-2 w-2 rounded-full" />
        )}
      </TouchableOpacity>
    );
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    if (loading && !refreshing) return <ActivityIndicator color="#F59E0B" className="mt-10" />;

    // 1. SUGGESTIONS
    if (activeTab === 'suggestions') {
      return (
        <FlatList
          data={suggestions}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
          contentContainerStyle={{ padding: 24, gap: 16 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between bg-kin-midnight p-4 rounded-2xl border border-kin-slate/20">
              <View className="flex-row items-center flex-1">
                <Image source={{ uri: item.avatar_url || 'https://i.pravatar.cc/150' }} className="h-12 w-12 rounded-full bg-kin-slate" />
                <View className="ml-3">
                  <Text className="text-kin-white font-outfit-bold">{item.full_name}</Text>
                  <Text className="text-kin-mist text-xs">Suggested for you</Text>
                </View>
              </View>
              <TouchableOpacity className="bg-kin-slate/20 p-2 rounded-full">
                <UserPlus size={20} color="#F59E0B" />
              </TouchableOpacity>
            </View>
          )}
        />
      );
    }

    // 2. REQUESTS
    if (activeTab === 'requests') {
      return (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
          contentContainerStyle={{ padding: 24, gap: 16 }}
          ListEmptyComponent={<Text className="text-kin-mist text-center mt-10">No pending requests.</Text>}
          renderItem={({ item }) => (
            <View className="bg-kin-midnight p-4 rounded-2xl border border-kin-slate/20">
              <View className="flex-row items-center mb-3">
                <Image source={{ uri: item.profiles?.avatar_url || 'https://i.pravatar.cc/150' }} className="h-12 w-12 rounded-full bg-kin-slate" />
                <View className="ml-3">
                  <Text className="text-kin-white font-outfit-bold text-lg">{item.profiles?.full_name}</Text>
                  <Text className="text-kin-mist text-xs">wants to connect</Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity className="flex-1 bg-kin-amber py-2 rounded-xl items-center">
                  <Text className="text-kin-charcoal font-outfit-bold text-sm">Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-kin-slate/20 py-2 rounded-xl items-center">
                  <Text className="text-kin-white font-outfit-bold text-sm">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      );
    }

    // 3. FRIENDS
    if (activeTab === 'friends') {
      return (
        <FlatList
          data={friends}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
          contentContainerStyle={{ padding: 24, gap: 16 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="relative">
                  <Image source={{ uri: item.profile?.avatar_url || 'https://i.pravatar.cc/150' }} className="h-12 w-12 rounded-full bg-kin-slate" />
                  <View className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-kin-charcoal" />
                </View>
                <Text className="text-kin-white font-outfit-bold ml-3 text-lg">{item.profile?.full_name}</Text>
              </View>
              <View className="bg-kin-slate/20 px-3 py-1 rounded-full">
                <Text className="text-kin-mist text-xs">Friends</Text>
              </View>
            </View>
          )}
        />
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal" edges={['top']}>
      {/* HEADER */}
      <View className="px-6 pt-4 bg-kin-charcoal">
        <Text className="text-kin-white font-outfit-bold text-3xl mb-4">People</Text>
        
        {/* TOP TABS */}
        <View className="flex-row border-b border-kin-slate/20">
          <TabButton id="suggestions" label="Discover" />
          <TabButton id="requests" label="Requests" count={requests.length} />
          <TabButton id="friends" label="My Friends" count={friends.length} />
        </View>
      </View>

      {/* CONTENT */}
      <View className="flex-1 bg-kin-charcoal">
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}