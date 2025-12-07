import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Check, User, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FriendRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch friendships where YOU are the receiver AND status is pending
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        profiles!friendships_requester_id_fkey (full_name, avatar_url)
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching requests:', error);
    }
    
    if (data) {
      // Normalize the data - profiles might be an array
      const normalized = data.map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      }));
      setRequests(normalized);
    }
    setLoading(false);
  }

  const handleAccept = async (friendshipId: string, senderId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Update Friendship Status to 'accepted'
      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (updateError) {
        console.error('Error updating friendship:', updateError);
        alert('Error accepting request');
        return;
      }

      // 2. Check if a room already exists between these users
      const { data: existingRooms } = await supabase
        .from('user_rooms')
        .select('room_id')
        .eq('user_id', user.id);

      let roomExists = false;
      if (existingRooms) {
        // Check if sender is in any of these rooms
        for (const room of existingRooms) {
          const { data: sharedRoom } = await supabase
            .from('user_rooms')
            .select('room_id')
            .eq('room_id', room.room_id)
            .eq('user_id', senderId)
            .single();

          if (sharedRoom) {
            roomExists = true;
            break;
          }
        }
      }

      // 3. CREATE A NEW CHAT ROOM if it doesn't exist
      if (!roomExists) {
        console.log('Creating new room for users:', user.id, senderId);
        
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .insert({ name: 'DM' })
          .select()
          .single();

        if (roomError) {
          console.error('Error creating room:', roomError);
          alert(`Error creating chat room: ${roomError.message}`);
          return;
        }

        console.log('Room created:', roomData);

        if (roomData) {
          // 4. Add BOTH users to the room
          console.log('Adding users to room:', roomData.id);
          
          const { data: insertedData, error: memberError } = await supabase
            .from('user_rooms')
            .insert([
              { user_id: user.id, room_id: roomData.id },
              { user_id: senderId, room_id: roomData.id }
            ])
            .select();
            
          if (memberError) {
            console.error('Error adding users to room:', memberError);
            console.error('Error code:', memberError.code);
            console.error('Error details:', memberError.details);
            console.error('Error hint:', memberError.hint);
            alert(`Error setting up chat: ${memberError.message || 'Unknown error'}\nCode: ${memberError.code}`);
            return;
          }
          
          console.log('Users added to room successfully:', insertedData);
        }
      } else {
        console.log('Room already exists between users');
      }

      // Success! Remove from list and show success message
      setRequests(prev => prev.filter(r => r.id !== friendshipId));
      alert('You are now friends! You can start chatting in the Messages tab.');
      
    } catch (error) {
      console.error('Error in handleAccept:', error);
      alert('An error occurred');
    }
  };

  const handleDecline = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        console.error('Error declining request:', error);
        alert('Error declining request');
        return;
      }

      // Remove from UI
      setRequests(prev => prev.filter(r => r.id !== friendshipId));
    } catch (error) {
      console.error('Error in handleDecline:', error);
      alert('An error occurred');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <View className="px-6 py-4 border-b border-kin-slate/30">
        <Text className="text-kin-white font-outfit-bold text-2xl">Friend Requests</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#F59E0B" className="mt-10" />
      ) : requests.length === 0 ? (
        <View className="items-center justify-center mt-20 px-6">
          <User size={64} color="#334155" />
          <Text className="text-kin-mist font-outfit mt-4 text-center">No pending requests.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-kin-slate/10">
              <View className="flex-row items-center flex-1">
                <View className="h-12 w-12 bg-kin-slate rounded-full items-center justify-center mr-3 overflow-hidden">
                  {item.profiles?.avatar_url ? (
                    <Image source={{ uri: item.profiles.avatar_url }} className="h-full w-full" />
                  ) : (
                    <Text className="text-kin-white font-outfit-bold text-lg">
                      {item.profiles?.full_name?.[0] || '?'}
                    </Text>
                  )}
                </View>
                <View>
                  <Text className="text-kin-white font-outfit-bold text-lg">
                    {item.profiles?.full_name || 'Unknown User'}
                  </Text>
                  <Text className="text-kin-mist text-xs">wants to connect</Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity 
                  onPress={() => handleDecline(item.id)}
                  className="h-10 w-10 bg-kin-slate/20 rounded-full items-center justify-center"
                >
                  <X size={20} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleAccept(item.id, item.requester_id)}
                  className="h-10 w-10 bg-kin-amber rounded-full items-center justify-center shadow-lg"
                >
                  <Check size={20} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}