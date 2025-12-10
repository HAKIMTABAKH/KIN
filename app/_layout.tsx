import { supabase } from "@/lib/supabase";
import { Outfit_400Regular, Outfit_500Medium, Outfit_700Bold, useFonts } from "@expo-google-fonts/outfit";
import { Session } from "@supabase/supabase-js";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { UserProvider } from '../context/UserContext';
import "./global.css";
import { PresenceProvider } from "@/lib/PresenceContext";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const segments = useSegments();
  const router = useRouter();

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
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('_layout - Initial session:', !!session);
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('_layout auth event:', event, 'Has session:', !!session);
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Route protection: redirect based on auth state and current location
  useEffect(() => {
    if (loading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inChatRoute = segments[0] === 'chat';
    const isProtectedRoute = inTabsGroup || inChatRoute;

    console.log('_layout - Route protection check:', {
      segments,
      hasSession: !!session,
      inAuthGroup,
      isProtectedRoute
    });

    // If user is NOT authenticated and trying to access protected routes
    if (!session && isProtectedRoute) {
      console.log('_layout - Redirecting to sign-in (no session, protected route)');
      router.replace('/(auth)/sign-in');
    }
    // If user IS authenticated and on auth pages, redirect to app
    else if (session && inAuthGroup) {
      console.log('_layout - Redirecting to Feed (has session, on auth page)');
      router.replace('/(tabs)/Feed');
    }
  }, [session, segments, loading, fontsLoaded]);

  if (!fontsLoaded || loading) {
    return (
      <View className="flex-1 justify-center items-center bg-kin-charcoal">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <PresenceProvider>
      <UserProvider> 
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(app)" />
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
          <Stack.Screen 
            name="(app)/media-viewer" 
            options={{
              presentation: "transparentModal",
              animation: "fade",
              headerShown: false
            }}
          />
        </Stack>
      </UserProvider>
    </PresenceProvider>
  );
}