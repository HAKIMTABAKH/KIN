import { cancelRequest, searchUsers, sendFriendRequest } from '@/lib/people';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Check, Clock, Search, UserPlus, UserX, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SEARCH_HISTORY_KEY = 'search_history';

export default function AddFriendScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
    const [searchHistory, setSearchHistory] = useState<any[]>([]);

    // Get current user and load search history on mount
    useEffect(() => {
        async function getCurrentUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        }
        async function loadSearchHistory() {
            try {
                const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
                if (history) {
                    setSearchHistory(JSON.parse(history));
                }
            } catch (error) {
                console.error('Error loading search history:', error);
            }
        }
        getCurrentUser();
        loadSearchHistory();
    }, []);

    // Save user to search history
    async function addToHistory(user: any) {
        try {
            const newHistory = [user, ...searchHistory.filter(u => u.id !== user.id)].slice(0, 10);
            setSearchHistory(newHistory);
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    // Clear search history
    async function clearHistory() {
        try {
            setSearchHistory([]);
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
        } catch (error) {
            console.error('Error clearing search history:', error);
        }
    }

    // Intelligent search with debounce
    useEffect(() => {
        // Clear results if query is empty
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        // Debounce: wait 500ms after user stops typing
        const delayDebounceFn = setTimeout(async () => {
            if (!currentUserId) return;
            
            setLoading(true);
            const cleanQuery = query.trim();
            const searchResults = await searchUsers(currentUserId, cleanQuery);
            setResults(searchResults);
            setLoading(false);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, currentUserId]);

    async function handleSendRequest(receiverId: string) {
        if (!currentUserId || processingRequests.has(receiverId)) return;

        setProcessingRequests(prev => new Set(prev).add(receiverId));

        const success = await sendFriendRequest(currentUserId, receiverId);
        
        if (success) {
            const user = results.find(p => p.id === receiverId);
            if (user) {
                await addToHistory({ ...user, friendshipStatus: 'pending' });
            }
            setResults(prev => prev.map(p =>
                p.id === receiverId ? { ...p, friendshipStatus: 'pending' } : p
            ));
        }

        setTimeout(() => {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(receiverId);
                return newSet;
            });
        }, 1000);
    }

    async function handleCancelRequest(receiverId: string) {
        if (!currentUserId || processingRequests.has(receiverId)) return;

        setProcessingRequests(prev => new Set(prev).add(receiverId));

        const success = await cancelRequest(currentUserId, receiverId);
        
        if (success) {
            setResults(prev => prev.map(p =>
                p.id === receiverId ? { ...p, friendshipStatus: null } : p
            ));
        }

        setTimeout(() => {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(receiverId);
                return newSet;
            });``
        }, 1000);
    }

    return (
        <SafeAreaView className="flex-1 bg-kin-charcoal">
            <KeyboardAvoidingView 
                className="flex-1" 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
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
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <X size={16} color="#7077A1" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Search History */}
            {query.length === 0 && searchHistory.length > 0 && (
                <View className="px-4 mb-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-kin-mist text-xs font-outfit-bold uppercase tracking-widest">
                            Recent Searches
                        </Text>
                        <TouchableOpacity onPress={clearHistory}>
                            <Text className="text-kin-amber text-xs font-outfit-bold">CLEAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Results List */}
            {loading ? (
                <View className="mt-10">
                    <ActivityIndicator color="#F59E0B" />
                    <Text className="text-kin-mist text-center mt-2 font-outfit">Searching...</Text>
                </View>
            ) : query.length > 0 && results.length === 0 ? (
                <View className="flex-1 items-center px-6 pt-20">
                    <View className="items-center">
                        <View className="h-20 w-20 bg-kin-midnight rounded-full items-center justify-center mb-4">
                            <UserX size={40} color="#7077A1" />
                        </View>
                        <Text className="text-kin-white font-outfit-bold text-lg mb-2">
                            No Users Found
                        </Text>
                        <Text className="text-kin-mist text-center font-outfit">
                            We couldn't find anyone named "{query}"
                        </Text>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={query.length > 0 ? results : searchHistory}
                    keyExtractor={(item) => item.id}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={query.length === 0 && searchHistory.length > 0 ? (
                        <View className="flex-row items-center px-6 mb-2">
                            <Clock size={14} color="#7077A1" />
                            <Text className="text-kin-mist text-xs font-outfit ml-2">
                                Tap to view profile again
                            </Text>
                        </View>
                    ) : null}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => {
                                addToHistory(item);
                                router.push(`/user/${item.id}`);
                            }}
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
                                        handleCancelRequest(item.id);
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
                                        handleSendRequest(item.id);
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}