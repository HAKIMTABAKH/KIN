import MenuItem from '@/components/MenuItem';
import { signOut } from '@/lib/auth';
import { getProfileData, Profile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import {
    Bell,
    CreditCard,
    Globe,
    HelpCircle,
    LogOut,
    Moon,
    Shield,
    User
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadProfile();

    // Listen for auth state changes to handle logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Settings - Auth event:', event);
      if (event === 'SIGNED_OUT') {
        console.log('Settings - Signed out, navigating to sign-in');
        router.replace('/(auth)/sign-in');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfile() {
    setLoading(true);
    const data = await getProfileData();
    setProfile(data.profile);
    setLoading(false);
  }

 

  if (loading) {
    return (
      <View className="flex-1 bg-kin-charcoal justify-center items-center">
        <ActivityIndicator color="#F59E0B" size="large" />
      </View>
    );
  }

  if (signingOut) {
    return (
      <View className="flex-1 bg-kin-charcoal justify-center items-center">
        <ActivityIndicator color="#F59E0B" size="large" />
        <Text className="text-kin-white font-outfit-medium mt-4">Signing out...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-kin-white text-3xl font-outfit-bold">Settings</Text>
          <Text className="text-kin-mist font-outfit mt-1">Manage your account and preferences</Text>
        </View>

        {/* Menu Sections */}
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
            </View>
          </View>

          <Text className="text-center text-kin-slate text-xs font-outfit mt-4">Kin v1.0.0 (Beta)</Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
