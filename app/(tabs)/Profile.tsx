import { getCurrentSession, getCurrentUser, signOut } from "@/lib/auth";
import { router } from "expo-router";
import { LogOut } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get user and session info
    getCurrentUser().then(({ user }) => {
      console.log('Profile - User:', user);
      setUser(user);
    });

    getCurrentSession().then(({ session }) => {
      console.log('Profile - Session:', session);
      setSession(session);
    });
  }, []);

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/(auth)/sign-in');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <View className="p-6">
        <Text className="text-kin-white text-2xl font-outfit-bold mb-6">Profile</Text>
        
        {user ? (
          <View className="mb-6 bg-kin-midnight p-4 rounded-2xl">
            <Text className="text-kin-mist font-outfit mb-2">Email:</Text>
            <Text className="text-kin-white font-outfit-medium text-lg mb-4">{user.email}</Text>
            
            <Text className="text-kin-mist font-outfit mb-2">Full Name:</Text>
            <Text className="text-kin-white font-outfit-medium text-lg mb-4">
              {user.user_metadata?.full_name || 'N/A'}
            </Text>
            
            <Text className="text-kin-mist font-outfit mb-2">Provider:</Text>
            <Text className="text-kin-white font-outfit-medium text-lg mb-4">
              {user.app_metadata?.provider || 'email'}
            </Text>

            <Text className="text-kin-mist font-outfit mb-2">User ID:</Text>
            <Text className="text-kin-white font-outfit text-sm">{user.id}</Text>
          </View>
        ) : (
          <View className="mb-6 bg-kin-midnight p-4 rounded-2xl">
            <Text className="text-kin-mist font-outfit">Loading user info...</Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={handleSignOut}
          className="bg-kin-slate h-14 rounded-2xl flex-row justify-center items-center"
        >
          <LogOut color="#7077A1" size={20} style={{ marginRight: 8 }} />
          <Text className="text-kin-mist font-outfit-bold text-base">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}