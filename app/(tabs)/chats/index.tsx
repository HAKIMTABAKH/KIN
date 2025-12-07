import { fetchFriends, fetchRooms, Friend, RoomWithUser } from "@/lib/chat";
import { Link, useRouter } from "expo-router";
import { Search, SquarePen, UserPlus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatsListScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomWithUser[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
            onPress={() => {
              // Find the room with this friend and navigate to it
              const room = rooms.find(r => r.otherUserId === item.profile?.id);
              if (room) {
                router.push(`/chat/${room.id}`);
              }
            }}
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

  const renderItem = ({ item }: { item: any }) => (
    <Link href={`/chat/${item.id}`} asChild>
      <TouchableOpacity className="flex-row items-center p-4 border-b border-kin-slate/20 active:bg-kin-slate/10">
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
    </Link>
  );

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-kin-mist font-outfit text-sm uppercase tracking-widest">Workspace</Text>
          <Text className="text-kin-white font-outfit-bold text-3xl">Messages</Text>
        </View>  
        <Link href="/new-chat" asChild>
          <TouchableOpacity className="h-12 w-12 rounded-full bg-kin-slate items-center justify-center">
            <SquarePen  color="#F59E0B" size={22} />
          </TouchableOpacity>
        </Link>
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
    </SafeAreaView>
  );
}
