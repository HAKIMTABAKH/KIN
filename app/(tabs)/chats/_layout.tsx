import { Stack } from 'expo-router';

export default function ChatsStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[chatId]" />
    </Stack>
  );
}
