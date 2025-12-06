import { supabase } from "@/lib/supabase";
import { Link } from "expo-router";
import { MessageSquarePlus, Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatsListScreen() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


    useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    // 1. Fetch rooms that exist
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setRooms(data || []);
    }
    setLoading(false);
  }

  async function createTestRoom() {
    // Temporary helper to create a room so you can see it
    await supabase.from('rooms').insert([{ name: 'General Chat' }]);
    fetchRooms();
  }

  const renderItem = ({ item }: { item: any }) => (
    <Link href={`/chat/${item.id}`} asChild>
      <TouchableOpacity className="flex-row items-center p-4 border-b border-kin-slate/20 active:bg-kin-slate/10">
        <View className="h-14 w-14 rounded-full bg-kin-slate items-center justify-center mr-4">
          <Text className="text-kin-white font-outfit-bold text-xl">
            {item.name ? item.name[0] : '#'}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-kin-white font-outfit-bold text-lg">{item.name}</Text>
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
        
        {/* Button to create a test room */}
        <TouchableOpacity onPress={createTestRoom} className="h-12 w-12 bg-kin-amber rounded-full items-center justify-center shadow-lg">
          <MessageSquarePlus color="#111827" size={24} />
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
