import BottomSheetMenu from '@/components/BottomSheetMenu';
import TabButton from '@/components/TabButton';
import UserCard from '@/components/UserCard';
import {
  acceptRequest,
  blockUser,
  cancelRequest,
  declineRequest,
  fetchFriends,
  fetchRequests,
  fetchSuggestions,
  getChatRoomWithFriend,
  removeSuggestion,
  sendFriendRequest,
  Suggestion,
  unfriendUser
} from '@/lib/people';
import { supabase } from '@/lib/supabase';
import { FriendRequest, Friend } from '@/types';
import { useRouter } from 'expo-router';
import { Ban, Check, Circle, Clock, Ellipsis, MessageCircle, Search, UserMinus, UserPlus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SocialTab = 'suggestions' | 'requests' | 'friends';

export default function PeopleScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SocialTab>('suggestions');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data State
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Badge tracking
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [newFriends, setNewFriends] = useState(0);
  const [lastViewedRequests, setLastViewedRequests] = useState(0);
  const [lastViewedFriends, setLastViewedFriends] = useState(0);

  // Friend menu state
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendMenuVisible, setFriendMenuVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setUnreadRequests(Math.max(0, requests.length - lastViewedRequests));
  }, [requests.length, lastViewedRequests]);

  useEffect(() => {
    setNewFriends(Math.max(0, friends.length - lastViewedFriends));
  }, [friends.length, lastViewedFriends]);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [requestsData, friendsData, suggestionsData] = await Promise.all([
      fetchRequests(user.id),
      fetchFriends(user.id),
      fetchSuggestions(user.id)
    ]);

    setRequests(requestsData);
    setFriends(friendsData);
    setSuggestions(suggestionsData);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function handleTabChange(tab: SocialTab) {
    setActiveTab(tab);
    if (tab === 'requests') {
      setLastViewedRequests(requests.length);
      setUnreadRequests(0);
    } else if (tab === 'friends') {
      setLastViewedFriends(friends.length);
      setNewFriends(0);
    }
  }

  // Actions
  async function handleSendRequest(receiverId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const success = await sendFriendRequest(user.id, receiverId);
    if (success) {
      setSuggestions(prev => prev.map(s =>
        s.id === receiverId ? { ...s, friendshipStatus: 'pending' } : s
      ));
    }
  }

  async function handleCancelRequest(receiverId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const success = await cancelRequest(user.id, receiverId);
    if (success) {
      setSuggestions(prev => prev.map(s =>
        s.id === receiverId ? { ...s, friendshipStatus: null } : s
      ));
    }
  }

  async function handleAcceptRequest(friendshipId: string, senderId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const success = await acceptRequest(user.id, friendshipId, senderId);
    if (success) {
      setRequests(prev => prev.filter(r => r.requester_id !== senderId));
      const friendsData = await fetchFriends(user.id);
      setFriends(friendsData);
    }
  }

  async function handleDeclineRequest(friendshipId: string) {
    const success = await declineRequest(friendshipId);
    if (success) {
      setRequests(prev => prev.filter(r => r.id !== friendshipId));
    }
  }

  async function handleRemoveSuggestion(targetUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const success = await removeSuggestion(user.id, targetUserId);
    if (success) {
      setSuggestions(prev => prev.filter(s => s.id !== targetUserId));
    }
  }

  async function handleMessageFriend(friendId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const roomId = await getChatRoomWithFriend(user.id, friendId);
    
    if (roomId) {
      router.push(`/chat/${roomId}`);
    } else {
      router.push('/(tabs)/chats');
    }
  }

  async function handleUnfriend(friendshipId: string) {
    const success = await unfriendUser(friendshipId);
    
    if (success) {
      setFriends(prev => prev.filter(f => f.id !== friendshipId));
      setFriendMenuVisible(false);
      setSelectedFriend(null);
    }
  }

  async function handleBlockUser(userId: string, friendshipId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const success = await blockUser(user.id, userId);
    
    if (success) {
      // Remove from friends list
      setFriends(prev => prev.filter(f => f.id !== friendshipId));
      setFriendMenuVisible(false);
      setSelectedFriend(null);
    }
  }

  function openFriendMenu(friend: Friend) {
    setSelectedFriend(friend);
    setFriendMenuVisible(true);
  }

  // Render sections
  function renderSuggestions() {
    return (
      <FlatList
        data={suggestions}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <UserCard
            title={item.full_name}
            subtitle="Suggested for you"
            avatarUrl={item.avatar_url}
            onPress={() => router.push(`/user/${item.id}`)}
            rightAction={
              item.friendshipStatus === 'pending' ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCancelRequest(item.id);
                  }}
                  className="bg-kin-slate/20 px-4 py-2 rounded-full flex-row items-center gap-2"
                >
                  <Clock size={16} color="#9CA3AF" />
                  <Text className="text-kin-mist font-outfit-bold text-xs">Pending</Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemoveSuggestion(item.id);
                    }}
                    className="bg-kin-slate/20 p-3 rounded-full active:bg-red-500/20"
                  >
                    <X size={18} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSendRequest(item.id);
                    }}
                    className="bg-kin-slate/20 p-3 rounded-full active:bg-kin-amber/20"
                  >
                    <UserPlus size={20} color="#F59E0B" />
                  </TouchableOpacity>
                </View>
              )
            }
          />
        )}
      />
    );
  }

  function renderRequests() {
    return (
      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
        contentContainerStyle={{ padding: 24 }}
        ListEmptyComponent={<Text className="text-kin-mist text-center mt-10">No pending requests.</Text>}
        renderItem={({ item }) => (
          <UserCard
            title={item.profiles?.full_name}
            subtitle="Wants to connect"
            avatarUrl={item.profiles?.avatar_url}
            onPress={() => router.push(`/user/${item.requester_id}`)}
            bottomAction={
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => handleAcceptRequest(item.id, item.requester_id)}
                  className="flex-1 bg-kin-amber py-3 rounded-xl items-center flex-row justify-center gap-2"
                >
                  <Check size={16} color="#111827" />
                  <Text className="text-kin-charcoal font-outfit-bold text-sm">Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeclineRequest(item.id)}
                  className="flex-1 bg-kin-slate/20 py-3 rounded-xl items-center flex-row justify-center gap-2"
                >
                  <X size={16} color="#EF4444" />
                  <Text className="text-kin-white font-outfit-bold text-sm">Delete</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      />
    );
  }

  function renderFriends() {
    return (
      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <UserCard
            title={item.profile?.full_name}
            subtitle="Friend"
            avatarUrl={item.profile?.avatar_url}
            onPress={() => router.push(`/user/${item.profile?.id}`)}
            rightAction={
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleMessageFriend(item.profile?.id);
                  }}
                  className="bg-kin-slate/20 p-3 rounded-full active:bg-kin-amber/20"
                >
                  <MessageCircle size={20} color="#F59E0B" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    openFriendMenu(item);
                  }}
                  className="p-3 rounded-full active:bg-kin-amber/20"
                >
                  <Ellipsis size={20} color="#F59E0B" />
                </TouchableOpacity>
              </View>
            }
          />
        )}
      />
    );
  }

  function renderContent() {
    if (loading && !refreshing) {
      return <ActivityIndicator color="#F59E0B" className="mt-10" />;
    }

    switch (activeTab) {
      case 'suggestions':
        return renderSuggestions();
      case 'requests':
        return renderRequests();
      case 'friends':
        return renderFriends();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 bg-kin-charcoal">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-kin-white font-outfit-bold text-3xl">People</Text>
          <TouchableOpacity
            onPress={() => router.push('/add-friend')}
            className="bg-kin-midnight p-3 rounded-full border border-kin-slate/50"
          >
            <Search size={20} color="#F59E0B" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-kin-slate/20">
          <TabButton
            isActive={activeTab === 'suggestions'}
            onPress={() => handleTabChange('suggestions')}
            label="Discover"
          />
          <TabButton
            isActive={activeTab === 'requests'}
            onPress={() => handleTabChange('requests')}
            label="Requests"
            count={unreadRequests}
          />
          <TabButton
            isActive={activeTab === 'friends'}
            onPress={() => handleTabChange('friends')}
            label="My Friends"
            count={newFriends}
          />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 bg-kin-charcoal">
        {renderContent()}
      </View>

      {/* Friend Options Menu */}
      {selectedFriend && (
        <BottomSheetMenu
          visible={friendMenuVisible}
          onClose={() => {
            setFriendMenuVisible(false);
            setSelectedFriend(null);
          }}
          title={selectedFriend.profile?.full_name || 'Friend Options'}
          subtitle="Friends since recently"
          items={[
            {
              icon: MessageCircle,
              label: 'Message User',
              onPress: () => {
                setFriendMenuVisible(false);
                handleMessageFriend(selectedFriend.profile?.id);
              }
            },
            {
              icon: Ban,
              label: 'Block User',
              onPress: () => handleBlockUser(selectedFriend.profile?.id, selectedFriend.id)
            },
            {
              icon: Circle,
              label: 'divider',
              onPress: () => {}
            },
            {
              icon: UserMinus,
              label: 'Unfriend',
              onPress: () => handleUnfriend(selectedFriend.id),
              isDestructive: true
            }
          ]}
        />
      )}
    </SafeAreaView>
  );
}
