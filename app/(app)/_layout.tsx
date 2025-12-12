import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="add-friend" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="Notifications" />
      <Stack.Screen name="blocked-users" />
      <Stack.Screen name="chat-details" />
      <Stack.Screen name="media-viewer" />
    </Stack>
  );
}
