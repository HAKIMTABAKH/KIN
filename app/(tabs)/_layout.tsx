import { Tabs } from 'expo-router';
import { Home, MessageSquare, User } from 'lucide-react-native';
import { useEffect } from 'react';
import { syncCurrentUserProfile } from '../../lib/auth';

export default function TabsLayout() {
  useEffect(() => {
    syncCurrentUserProfile();
  }, []);

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