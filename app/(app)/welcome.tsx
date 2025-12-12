import { images } from '@/constants';
import { isGoogleSignInAvailable, signInWithGoogle } from '@/lib/auth';
import { markWelcomeShown } from '@/lib/utils';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome() {
  const [loading, setLoading] = useState(false);
  const showGoogleButton = Platform.OS === 'web' || isGoogleSignInAvailable();

  async function handleGoogleSignIn() {
    setLoading(true);

    // Mark welcome as shown
    await markWelcomeShown();

    const { error } = await signInWithGoogle();

    if (error) {
      if (error.code === 'not_available') {
        Alert.alert(
          'Not Available in Expo Go',
          'Google Sign-In requires a development build. Please use email sign-in or build the app with EAS.',
          [{ text: 'OK' }]
        );
      } else if (error.code !== 'cancelled') {
        Alert.alert('Error', error.message);
      }
      setLoading(false);
    }
  }

  async function handleEmailContinue() {
    // Mark welcome as shown
    await markWelcomeShown();
    router.replace('/(auth)/sign-in');
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      <View className="flex-1 justify-between px-6 py-10">
        
        {/* Logo Section */}
        <View className="flex-1 justify-center items-center">
          <View className="w-32 h-32 bg-kin-midnight rounded-3xl items-center justify-center border border-kin-white/10">
            <Image
              source={images.welcomeicon}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Bottom Content */}
        <View className="w-full">
          <Text className="text-4xl font-outfit-bold text-center text-kin-white mb-3">
            Deep Connections{"\n"}
            <Text className="text-kin-amber">Start Here</Text>
          </Text>

          <Text className="text-kin-mist text-center text-base font-outfit mb-10">
            Your digital living room for close friends.
            No ads. No noise. Just memories.
          </Text>

          {/* Buttons */}
          <View className="gap-4">
            {showGoogleButton && (
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={loading}
                className={`w-full bg-white h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${loading ? 'opacity-50' : ''}`}
              >
                <Text className="text-kin-charcoal font-outfit-bold text-lg">
                  {loading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleEmailContinue}
              disabled={loading}
              className={`w-full bg-kin-midnight h-14 rounded-2xl flex-row items-center justify-center border border-kin-mist/20 ${loading ? 'opacity-50' : ''}`}
            >
              <Mail color="#F6B17A" size={24} className="mr-3" />
              <Text className="text-kin-white font-outfit-medium text-lg">
                Continue with Email
              </Text>
            </TouchableOpacity>

            {!showGoogleButton && (
              <Text className="text-kin-mist text-xs font-outfit text-center mt-2">
                Google Sign-In requires a development build
              </Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
