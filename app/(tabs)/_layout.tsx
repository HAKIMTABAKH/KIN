import { supabase } from '@/lib/supabase';
import { Tabs, useRouter } from 'expo-router';
import { Home, MessageSquare, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { syncCurrentUserProfile } from '../../lib/auth';

export default function TabsLayout() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication before rendering tabs
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('TabsLayout - No session, redirecting to sign-in');
        router.replace('/(auth)/sign-in');
      } else {
        console.log('TabsLayout - Session found, syncing profile');
        await syncCurrentUserProfile();
      }
      
      setIsChecking(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('TabsLayout - Auth event:', event);
      if (event === 'SIGNED_OUT') {
        console.log('TabsLayout - Signed out, redirecting to sign-in');
        router.replace('/(auth)/sign-in');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isChecking) {
    return (
      <View className="flex-1 justify-center items-center bg-kin-charcoal">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1D', 
          borderTopColor: '#334155', 
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#F6B17A', 
        tabBarInactiveTintColor: '#7077A1', 
        tabBarShowLabel: false, 

      }}
    >
      {/* 1. Feed Tab */}
      <Tabs.Screen
        name="Feed"
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={28} />,
        }}
      />

      {/* 2. Chats Tab (Note: using the folder 'chats') */}
      <Tabs.Screen
        name="chats"
        options={{
          tabBarIcon: ({ color }) => <MessageSquare  color={color} size={28} />,
        }}
      />

      {/* 3. Profile Tab */}
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={28} />,
        }}
      />
    </Tabs>
  );
}