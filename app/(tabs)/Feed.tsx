import { KinButton } from "@/components/KinButton";
import { Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FeedScreen() {
  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <View className="p-6">
        <Text className="text-kin-white text-2xl font-outfit-bold">Feed</Text>
        <KinButton
          title="Press me"
          onPress={() => console.log('Button pressed')}
          variant="secondary"
          className="mt-4"

        />
        <KinButton
          title="Cancel"
          onPress={() => console.log('Button pressed')}
          className="mt-4"
        />


      </View>
    </SafeAreaView>
  );
}