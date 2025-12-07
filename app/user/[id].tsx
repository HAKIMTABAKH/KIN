import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Edit3, Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [id]);

  const loadUserProfile = async () => {
    try {
      // Get current user
      const { user } = await getCurrentUser();
      setCurrentUserId(user?.id || null);
      setIsOwnProfile(user?.id === id);

      // Load profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-kin-charcoal">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#F59E0B" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-kin-charcoal">
        <View className="flex-1 justify-center items-center">
          <Text className="text-kin-white text-lg font-outfit">User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const memberSince = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : 'Unknown';

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#F5F5F5" />
          </TouchableOpacity>
          
          {/* Show Settings button only for own profile */}
          {isOwnProfile && (
            <TouchableOpacity 
              onPress={() => router.push('/settings')}
              className="bg-kin-midnight p-2 rounded-full border border-kin-slate/50"
            >
              <Settings size={20} color="#F59E0B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Header */}
        <View className="items-center mt-4 mb-8 px-6">
          <View className="relative">
            {/* Avatar */}
            <View className="h-28 w-28 bg-kin-midnight rounded-full items-center justify-center border-4 border-kin-slate shadow-xl overflow-hidden">
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} className="h-full w-full" />
              ) : (
                <Text className="text-4xl font-outfit-bold text-kin-mist">
                  {profile.full_name?.charAt(0).toUpperCase() || '?'}
                </Text>
              )}
            </View>
            
            {/* Edit Badge - Only for own profile */}
            {isOwnProfile && (
              <TouchableOpacity className="absolute bottom-0 right-0 bg-kin-amber h-9 w-9 rounded-full items-center justify-center border-2 border-kin-charcoal">
                <Edit3 color="#111827" size={16} />
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-kin-white text-2xl font-outfit-bold mt-4">
            {profile.full_name || 'Kin Member'}
          </Text>
          
          {profile.bio && (
            <Text className="text-kin-white font-outfit text-sm text-center mt-2 px-4">
              {profile.bio}
            </Text>
          )}
          
          <View className="bg-kin-midnight/50 px-3 py-1 rounded-full mt-3 border border-kin-slate/30">
            <Text className="text-kin-amber text-xs font-outfit-medium">Member since {memberSince}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-around mx-6 mb-8 bg-kin-midnight p-4 rounded-2xl border border-kin-slate/50">
          <View className="items-center">
            <Text className="text-kin-white font-outfit-bold text-lg">0</Text>
            <Text className="text-kin-mist text-xs font-outfit">Posts</Text>
          </View>
          <View className="h-full w-[1px] bg-kin-slate/50" />
          <View className="items-center">
            <Text className="text-kin-white font-outfit-bold text-lg">0</Text>
            <Text className="text-kin-mist text-xs font-outfit">Friends</Text>
          </View>
          <View className="h-full w-[1px] bg-kin-slate/50" />
          <View className="items-center">
            <Text className="text-kin-white font-outfit-bold text-lg">0</Text>
            <Text className="text-kin-mist text-xs font-outfit">Followers</Text>
          </View>
        </View>

        {/* Posts Section - Coming Soon */}
        <View className="px-6">
          <Text className="text-kin-white font-outfit-bold text-lg mb-4">Posts</Text>
          <View className="bg-kin-midnight rounded-2xl p-8 items-center border border-kin-slate/50">
            <Text className="text-kin-mist font-outfit text-center">
              {isOwnProfile ? 'No posts yet. Start sharing your moments!' : 'No posts to show'}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
