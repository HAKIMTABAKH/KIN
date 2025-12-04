import { Outfit_400Regular, Outfit_500Medium, Outfit_700Bold, useFonts } from "@expo-google-fonts/outfit";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import "./global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
  
   /*useEffect(() => {
    fetchAuthenticatedUser()
  }, []);*/

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="chat/[id]" 
        options={{
          headerShown: true,
          headerTitle: "Chat",
          presentation: "card"
        }}
      />
    </Stack>
  );
}