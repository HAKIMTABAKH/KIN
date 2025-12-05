import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, MessageCircle, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1D', // kin-charcoal
          borderTopColor: '#2D3250',  // kin-midnight (subtle border)
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#F6B17A', // kin-amber
        tabBarInactiveTintColor: '#7077A1', // kin-mist
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
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={28} />,
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