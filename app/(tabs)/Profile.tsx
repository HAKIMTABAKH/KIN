import BottomSheetMenu from '@/components/BottomSheetMenu';
import { signOut } from '@/lib/auth';
import { getProfileData, Profile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import {
  Edit3,
  LogOut,
  Menu,
  Settings,
  Shield,
  UserCog
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  
  // State for the Bottom Sheet Menu
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadProfile();
    
    // Listen for auth state changes (Logout redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/sign-in');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const data = await getProfileData();
    setProfile(data.profile);
    setUserEmail(data.userEmail);
    setMemberSince(data.memberSince);
    setLoading(false);
  }

  async function handleSignOut() {
    setMenuVisible(false); // Close menu first
    try {
      setSigningOut(true);
      await signOut();
      // Auth listener handles redirect
    } catch (error) {
      console.error('Error signing out:', error);
      setSigningOut(false);
    }
  }

  const navigateTo = (path: string) => {
    setMenuVisible(false);
    router.push(path);
  };

  const menuItems = [
    {
      icon: Settings,
      label: 'Settings & Privacy',
      onPress: () => navigateTo('/settings'),
    },
    {
      icon: UserCog,
      label: 'Account Details',
      onPress: () => navigateTo('/account'),
    },
    {
      icon: Shield,
      label: 'Security',
      onPress: () => navigateTo('/security'),
    },
    {
      icon: View,
      label: 'divider',
      onPress: () => {},
    },
    {
      icon: LogOut,
      label: 'Log Out',
      onPress: handleSignOut,
      isDestructive: true,
    },
  ];

  if (loading || signingOut) {
    return (
      <View className="flex-1 bg-kin-charcoal justify-center items-center">
        <ActivityIndicator color="#F59E0B" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* --- HEADER --- */}
        <View className="flex-row justify-between items-center px-6 pt-4">
          <Text className="text-kin-mist font-outfit-bold text-sm tracking-widest">MY PROFILE</Text>
          
          {/* THE MENU TRIGGER */}
          <TouchableOpacity 
            onPress={() => setMenuVisible(true)}
            className="h-10 w-10 bg-kin-midnight rounded-full items-center justify-center border border-kin-slate/50 active:bg-kin-slate/20"
          >
            <Menu size={20} color="#F59E0B" />
          </TouchableOpacity>
        </View>

        {/* --- PROFILE INFO --- */}
        <View className="items-center mt-2 mb-8 px-6">
          <View className="relative">
            <View className="h-28 w-28 bg-kin-midnight rounded-full items-center justify-center border-4 border-kin-slate shadow-xl overflow-hidden">
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} className="h-full w-full" />
              ) : (
                <Text className="text-4xl font-outfit-bold text-kin-mist">
                  {profile?.full_name?.charAt(0) || 'U'}
                </Text>
              )}
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 bg-kin-amber h-9 w-9 rounded-full items-center justify-center border-2 border-kin-charcoal">
              <Edit3 color="#111827" size={16} />
            </TouchableOpacity>
          </View>

          <Text className="text-kin-white text-2xl font-outfit-bold mt-4">
            {profile?.full_name || 'Kin Member'}
          </Text>
          <Text className="text-kin-mist font-outfit text-base mb-1">{userEmail}</Text>
          
          {profile?.bio && (
            <Text className="text-kin-white font-outfit text-sm text-center mt-2 px-4">
              {profile.bio}
            </Text>
          )}
          
          <View className="bg-kin-midnight/50 px-3 py-1 rounded-full mt-3 border border-kin-slate/30">
            <Text className="text-kin-amber text-xs font-outfit-medium">Member since {memberSince}</Text>
          </View>
        </View>

        {/* --- STATS --- */}
        <View className="flex-row justify-around mx-6 mb-8 bg-kin-midnight p-4 rounded-2xl border border-kin-slate/50">
          <StatBox number="0" label="Posts" />
          <View className="h-full w-[1px] bg-kin-slate/50" />
          <StatBox number="0" label="Friends" />
          <View className="h-full w-[1px] bg-kin-slate/50" />
          <StatBox number="0" label="Followers" />
        </View>

        {/* --- POSTS --- */}
        <View className="px-6">
          <Text className="text-kin-white font-outfit-bold text-lg mb-4">Posts</Text>
          <View className="bg-kin-midnight rounded-2xl p-8 items-center border border-kin-slate/50">
            <Text className="text-kin-mist font-outfit text-center">
              No posts yet. Start sharing your moments!
            </Text>
          </View>
        </View>

      </ScrollView>

      <BottomSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title="Menu"
        items={menuItems}
        footer="Kin v1.0.0"
      />

    </SafeAreaView>
  );
}

// --- HELPER COMPONENTS ---

const StatBox = ({ number, label }: { number: string, label: string }) => (
  <View className="items-center">
    <Text className="text-kin-white font-outfit-bold text-lg">{number}</Text>
    <Text className="text-kin-mist text-xs font-outfit">{label}</Text>
  </View>
);