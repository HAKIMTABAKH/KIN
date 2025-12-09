import BottomSheetMenu from "@/components/BottomSheetMenu";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteRoomForUser, fetchFriends, fetchRooms, Friend, getOrCreateChatWithFriend, RoomWithUser } from "@/lib/chat";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { Archive, Bell, BellOff, Circle, Pin, Search, SquarePen, Trash2, UserPlus, Users } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatsListScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomWithUser[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithUser | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setLoading(true);
    const [roomsData, friendsData] = await Promise.all([
      fetchRooms(),
      fetchFriends()
    ]);
    setRooms(roomsData);
    setFriends(friendsData);
    setLoading(false);
  }


  // --- ONLINE FRIENDS RAIL ---
  const renderFriendsRail = () => (
    <View className="mb-6">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
      >
        {/* "Add Friend" Bubble */}
        <View className="items-center">
          <TouchableOpacity 
            className="h-16 w-16 rounded-full border-2 border-dashed border-kin-slate items-center justify-center mb-2"
            onPress={() => router.push('/add-friend')}
          >
            <UserPlus size={24} color="#7077A1" />
          </TouchableOpacity>
          <Text className="text-kin-mist text-xs font-outfit">Add</Text>
        </View>

        {/* Friends */}
        {friends.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            className="items-center"
            onPress={() => handleFriendClick(item.profile?.id)}
          >
            <View className="relative">
              <Image 
                source={{ uri: item.profile?.avatar_url || 'https://i.pravatar.cc/150' }} 
                className="h-16 w-16 rounded-full bg-kin-slate mb-2" 
              />
              {item.isOnline && (
                <View className="absolute bottom-2 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-kin-charcoal" />
              )}
            </View>
            <Text className="text-kin-white text-xs font-outfit-medium w-16 text-center" numberOfLines={1}>
              {item.profile?.full_name?.split(' ')[0] || 'Friend'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  function openRoomMenu(room: RoomWithUser) {
    setSelectedRoom(room);
    setMenuVisible(true);
  }

  function confirmDeleteRoom() {
    if (!selectedRoom) return;
    setMenuVisible(false);
    setDeleteDialogVisible(true);
  }

  async function handleDeleteRoom() {
    if (!selectedRoom) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const success = await deleteRoomForUser(selectedRoom.id, user.id);
    
    if (success) {
      setRooms(prev => prev.filter(r => r.id !== selectedRoom.id));
      setSelectedRoom(null);
    }
  }

  async function handleFriendClick(friendId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get or create a chat room with this friend
    const roomId = await getOrCreateChatWithFriend(user.id, friendId);
    
    if (roomId) {
      // Navigate to chat - room will appear in list only after sending a message
      router.push(`/chat/${roomId}`);
    }
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/chat/${item.id}`)}
      onLongPress={() => openRoomMenu(item)}
      className="flex-row items-center p-4 border-b border-kin-slate/20 active:bg-kin-slate/10"
    >
      <View className="h-14 w-14 rounded-full bg-kin-slate items-center justify-center mr-4 overflow-hidden">
        {item.otherUserAvatar ? (
          <Image source={{ uri: item.otherUserAvatar }} className="h-full w-full" />
        ) : (
          <Text className="text-kin-white font-outfit-bold text-xl">
            {item.displayName ? item.displayName[0].toUpperCase() : '#'}
          </Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-kin-white font-outfit-bold text-lg">{item.displayName}</Text>
        <Text className="text-kin-mist font-outfit text-sm">Tap to chat</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-kin-mist font-outfit text-sm uppercase tracking-widest">Workspace</Text>
          <Text className="text-kin-white font-outfit-bold text-3xl">Messages</Text>
        </View>  
        <TouchableOpacity 
          onPress={() => router.push('/new-chat' as any)}
          className="h-12 w-12 rounded-full bg-kin-slate items-center justify-center"
        >
          <SquarePen  color="#F59E0B" size={22} />
        </TouchableOpacity>
      </View>

      <View className="px-6 my-4">
        <View className="flex-row items-center bg-kin-midnight h-12 rounded-xl px-4 border border-kin-slate">
          <Search color="#7077A1" size={20} />
          <TextInput 
            className="flex-1 ml-3 font-outfit text-kin-white"
            placeholder="Search..."
            placeholderTextColor="#7077A1"
          />
        </View>
      </View>

      {/* Online Friends Rail */}
      {!loading && friends.length > 0 && renderFriendsRail()}

      {loading ? (
        <ActivityIndicator color="#F59E0B" className="mt-10" />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <Text className="text-kin-mist font-outfit mb-4">No rooms yet.</Text>
              <Text className="text-kin-amber font-outfit text-sm">Tap the + button to create one.</Text>
            </View>
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        onClose={() => {
          setDeleteDialogVisible(false);
          setSelectedRoom(null);
        }}
        onConfirm={handleDeleteRoom}
        title="Delete Chat"
        message={`Are you sure you want to delete the entire conversation with ${selectedRoom?.displayName || 'this user'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />

      {/* Chat Options Menu */}
      {selectedRoom && (
        <BottomSheetMenu
          visible={menuVisible}
          onClose={() => {
            setMenuVisible(false);
            setSelectedRoom(null);
          }}
          title={selectedRoom.displayName}
          subtitle="Chat Options"
          items={[
            {
              icon: Pin,
              label: 'Pin Chat',
              onPress: () => {
                setMenuVisible(false);
                // TODO: Implement pin chat
              }
            },
            {
              icon: Archive,
              label: 'Archive Chat',
              onPress: () => {
                setMenuVisible(false);
                // TODO: Implement archive chat
              }
            },
            {
              icon: BellOff,
              label: 'Mute Notifications',
              onPress: () => {
                setMenuVisible(false);
                // TODO: Implement mute
              }
            },
            {
              icon: Users,
              label: `Create Group with ${selectedRoom.displayName}`,
              onPress: () => {
                setMenuVisible(false);
                // TODO: Implement create group
              }
            },
            {
              icon: Bell,
              label: 'Mark as Read',
              onPress: () => {
                setMenuVisible(false);
                // TODO: Implement mark as read
              }
            },
            {
              icon: Circle,
              label: 'divider',
              onPress: () => {}
            },
            {
              icon: Trash2,
              label: 'Delete Chat',
              onPress: confirmDeleteRoom,
              isDestructive: true
            }
          ]}
          footer="More options coming soon"
        />
      )}
    </SafeAreaView>
  );
}
