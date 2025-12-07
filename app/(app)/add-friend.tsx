import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Check, Search, UserPlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddFriendScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

    // 1. Search Logic
    const handleSearch = async () => {
        if (query.length < 3) {
            alert('Please enter at least 3 characters');
            return;
        }

        setLoading(true);

        try {
            // Get current user ID first
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            if (!user) {
                alert('Please log in first');
                setLoading(false);
                return;
            }

            // Search profiles (ILIKE is case-insensitive)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('full_name', `%${query}%`)
                .neq('id', user.id)
                .limit(10);

            if (error) {
                console.error('Search error:', error);
                alert('Error searching users');
                setResults([]);
            } else {
                // Check friendship status for each user
                const resultsWithStatus = await Promise.all(
                    (data || []).map(async (profile) => {
                        // Check if there's a friendship (in either direction)
                        const { data: friendship } = await supabase
                            .from('friendships')
                            .select('status')
                            .or(`and(requester_id.eq.${user.id},receiver_id.eq.${profile.id}),and(requester_id.eq.${profile.id},receiver_id.eq.${user.id})`)
                            .single();

                        return {
                            ...profile,
                            friendshipStatus: friendship?.status || null
                        };
                    })
                );

                setResults(resultsWithStatus);
            }
        } catch (error) {
            console.error('Error in handleSearch:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // 2. Send Request Logic
    const sendRequest = async (receiverId: string) => {
        if (!currentUserId || processingRequests.has(receiverId)) {
            return;
        }

        // Mark as processing
        setProcessingRequests(prev => new Set(prev).add(receiverId));

        try {
            const { error } = await supabase
                .from('friendships')
                .insert({
                    requester_id: currentUserId,
                    receiver_id: receiverId,
                    status: 'pending'
                });

            if (error) {
                console.error('Error sending request:', error);
                if (error.code !== '23505') {
                    // Only show error if it's not a duplicate
                    console.error('Error sending request: ' + error.message);
                }
            } else {
                // Update the UI to show pending status
                setResults(prev => prev.map(p =>
                    p.id === receiverId
                        ? { ...p, friendshipStatus: 'pending' }
                        : p
                ));
            }
        } catch (error) {
            console.error('Error in sendRequest:', error);
        } finally {
            // Remove from processing after a delay
            setTimeout(() => {
                setProcessingRequests(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(receiverId);
                    return newSet;
                });
            }, 1000);
        }
    };

    // 3. Cancel Request Logic
    const cancelRequest = async (receiverId: string) => {
        if (!currentUserId || processingRequests.has(receiverId)) {
            return;
        }

        // Mark as processing
        setProcessingRequests(prev => new Set(prev).add(receiverId));

        try {
            console.log('Canceling request from', currentUserId, 'to', receiverId);
            
            // First, check which direction the friendship exists
            const { data: existingFriendship } = await supabase
                .from('friendships')
                .select('*')
                .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
                .eq('status', 'pending')
                .single();

            console.log('Found friendship:', existingFriendship);

            if (existingFriendship) {
                // Delete using the ID
                const { data, error } = await supabase
                    .from('friendships')
                    .delete()
                    .eq('id', existingFriendship.id)
                    .select();

                if (error) {
                    console.error('Error canceling request:', error);
                    console.error('Error details:', error.message);
                } else {
                    console.log('Request canceled successfully:', data);
                    // Update the UI to remove pending status
                    setResults(prev => prev.map(p =>
                        p.id === receiverId
                            ? { ...p, friendshipStatus: null }
                            : p
                    ));
                }
            } else {
                console.log('No pending friendship found to cancel');
            }
        } catch (error) {
            console.error('Error in cancelRequest:', error);
        } finally {
            // Remove from processing after a delay
            setTimeout(() => {
                setProcessingRequests(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(receiverId);
                    return newSet;
                });
            }, 1000);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-kin-charcoal">
            {/* Header */}
            <View className="flex-row items-center px-4 py-4 border-b border-kin-slate/30">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <X color="#F59E0B" size={24} />
                </TouchableOpacity>
                <Text className="text-kin-white font-outfit-bold text-xl">Find People</Text>
            </View>

            {/* Search Input */}
            <View className="px-4 py-4">
                <View className="flex-row items-center bg-kin-midnight h-12 rounded-xl px-4 border border-kin-slate">
                    <Search color="#7077A1" size={20} />
                    <TextInput
                        className="flex-1 ml-3 font-outfit text-kin-white"
                        placeholder="Search by name..."
                        placeholderTextColor="#7077A1"
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                </View>
            </View>

            {/* Results List */}
            {loading ? (
                <ActivityIndicator color="#F59E0B" className="mt-10" />
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push(`/user/${item.id}`)}
                            className="flex-row items-center justify-between px-6 py-4 border-b border-kin-slate/10 active:bg-kin-slate/10"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="h-12 w-12 bg-kin-slate rounded-full items-center justify-center overflow-hidden mr-3">
                                    {item.avatar_url ? (
                                        <Image source={{ uri: item.avatar_url }} className="h-full w-full" />
                                    ) : (
                                        <Text className="text-kin-white font-outfit-bold text-lg">{item.full_name[0]}</Text>
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-kin-white font-outfit-bold">{item.full_name}</Text>
                                    <Text className="text-kin-mist text-xs font-outfit">
                                        {item.friendshipStatus === 'accepted' ? 'Friends' :
                                            item.friendshipStatus === 'pending' ? 'Request Pending' :
                                                'Kin User'}
                                    </Text>
                                </View>
                            </View>

                            {item.friendshipStatus === 'accepted' ? (
                                <View className="bg-kin-slate/30 px-4 py-2 rounded-lg flex-row items-center">
                                    <Check size={16} color="#10B981" />
                                    <Text className="text-kin-mist font-outfit-bold ml-2 text-xs">FRIENDS</Text>
                                </View>
                            ) : item.friendshipStatus === 'pending' ? (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        cancelRequest(item.id);
                                    }}
                                    disabled={processingRequests.has(item.id)}
                                    className="bg-kin-slate/30 px-4 py-2 rounded-lg flex-row items-center"
                                >
                                    <X size={16} color="#EF4444" />
                                    <Text className="text-kin-mist font-outfit-bold ml-2 text-xs">CANCEL</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        sendRequest(item.id);
                                    }}
                                    disabled={processingRequests.has(item.id)}
                                    className="bg-kin-amber px-4 py-2 rounded-lg flex-row items-center"
                                >
                                    <UserPlus size={16} color="black" />
                                    <Text className="text-black font-outfit-bold ml-2 text-xs">ADD</Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}