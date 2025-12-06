import MenuItem from '@/components/MenuItem';
import { signOut } from '@/lib/auth';
import { getProfileData, Profile } from '@/lib/profile';
import { router } from 'expo-router';
import {
  Bell,
  CreditCard,
  Edit3,
  Globe,
  HelpCircle,
  LogOut,
  Moon,
  Shield,
  User
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadProfile();
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
    await signOut();
    router.replace('/(auth)/sign-in');
  }

  if (loading) {
    return (
      <View className="flex-1 bg-kin-charcoal justify-center items-center">
        <ActivityIndicator color="#F59E0B" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* --- HEADER SECTION --- */}
        <View className="items-center mt-6 mb-8 px-6">
          <View className="relative">
            {/* Avatar Circle */}
            <View className="h-28 w-28 bg-kin-midnight rounded-full items-center justify-center border-4 border-kin-slate shadow-xl overflow-hidden">
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} className="h-full w-full" />
              ) : (
                <Text className="text-4xl font-outfit-bold text-kin-mist">
                  {profile?.full_name?.charAt(0) || 'U'}
                </Text>
              )}
            </View>
            
            {/* Edit Badge */}
            <TouchableOpacity className="absolute bottom-0 right-0 bg-kin-amber h-9 w-9 rounded-full items-center justify-center border-2 border-kin-charcoal">
              <Edit3 color="#111827" size={16} />
            </TouchableOpacity>
          </View>

          <Text className="text-kin-white text-2xl font-outfit-bold mt-4">
            {profile?.full_name || 'Kin Member'}
          </Text>
          <Text className="text-kin-mist font-outfit text-base mb-1">{userEmail}</Text>
          
          <View className="bg-kin-midnight/50 px-3 py-1 rounded-full mt-2 border border-kin-slate/30">
            <Text className="text-kin-amber text-xs font-outfit-medium">Member since {memberSince}</Text>
          </View>
        </View>

        {/* --- STATS ROW (Mock Data) --- */}
        <View className="flex-row justify-around mx-6 mb-8 bg-kin-midnight p-4 rounded-2xl border border-kin-slate/50">
          <View className="items-center">
            <Text className="text-kin-white font-outfit-bold text-lg">0</Text>
            <Text className="text-kin-mist text-xs font-outfit">Friends</Text>
          </View>
          <View className="h-full w-[1px] bg-kin-slate/50" />
          <View className="items-center">
            <Text className="text-kin-white font-outfit-bold text-lg">0</Text>
            <Text className="text-kin-mist text-xs font-outfit">Groups</Text>
          </View>
          <View className="h-full w-[1px] bg-kin-slate/50" />
          <View className="items-center">
            <Text className="text-kin-white font-outfit-bold text-lg">Active</Text>
            <Text className="text-kin-mist text-xs font-outfit">Status</Text>
          </View>
        </View>

        {/* --- MENU SECTIONS --- */}
        <View className="px-6 gap-6">
          
          {/* Account Settings */}
          <View>
            <Text className="text-kin-mist font-outfit-bold text-sm uppercase mb-3 ml-2 tracking-wider">Account</Text>
            <View className="bg-kin-midnight rounded-2xl overflow-hidden border border-kin-slate/50">
              <MenuItem icon={User} label="Personal Info" />
              <MenuItem icon={Shield} label="Privacy & Security" />
              <MenuItem icon={CreditCard} label="Subscription" isLast />
            </View>
          </View>

          {/* Preferences */}
          <View>
            <Text className="text-kin-mist font-outfit-bold text-sm uppercase mb-3 ml-2 tracking-wider">Preferences</Text>
            <View className="bg-kin-midnight rounded-2xl overflow-hidden border border-kin-slate/50">
              <MenuItem icon={Bell} label="Notifications" />
              <MenuItem icon={Globe} label="Language" value="English" />
              <View className="flex-row items-center justify-between p-4 active:bg-kin-slate/20">
                <View className="flex-row items-center">
                  <View className="h-10 w-10 bg-kin-slate/20 rounded-full items-center justify-center mr-4">
                    <Moon color="#F59E0B" size={20} />
                  </View>
                  <Text className="text-kin-white font-outfit-medium text-base">Dark Mode</Text>
                </View>
                <Switch 
                  value={isDarkMode} 
                  onValueChange={setIsDarkMode}
                  trackColor={{ false: '#334155', true: '#F59E0B' }}
                  thumbColor={'#FFFFFF'}
                />
              </View>
            </View>
          </View>

          {/* Support */}
          <View>
            <Text className="text-kin-mist font-outfit-bold text-sm uppercase mb-3 ml-2 tracking-wider">Support</Text>
            <View className="bg-kin-midnight rounded-2xl overflow-hidden border border-kin-slate/50">
              <MenuItem icon={HelpCircle} label="Help Center" />
              <MenuItem icon={LogOut} label="Log Out" isLast isDestructive onPress={handleSignOut} />
            </View>
          </View>

          <Text className="text-center text-kin-slate text-xs font-outfit mt-4">Kin v1.0.0 (Beta)</Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

