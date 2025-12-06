import { supabase } from "@/lib/supabase";
import { Outfit_400Regular, Outfit_500Medium, Outfit_700Bold, useFonts } from "@expo-google-fonts/outfit";
import { Session } from "@supabase/supabase-js";
import { Redirect, SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "./global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded] = useFonts({
    Outfit_Regular: Outfit_400Regular,
    Outfit_Medium: Outfit_500Medium,
    Outfit_Bold: Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-kin-charcoal">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }


  // 3. If no session, go to Login
  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="chat/[id]" 
        options={{
          headerShown: false,
          headerTitle: "Chat",
          presentation: "card"
        }}
      />
    </Stack>
  );
}