import { images } from '@/constants';
import { router } from 'expo-router';
import { Heart, Mail, MapPin, MessageCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { isGoogleSignInAvailable, signInWithGoogle } from '@/lib/auth';
import { markWelcomeShown } from '@/lib/utils';

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
    <SafeAreaView className="flex-1 bg-kin-charcoal relative">

      {/* =================================================
                   1. THE ORBIT ILLUSTRATION (Centerpiece)
                  ================================================= */}
      <View className="flex-1 justify-center items-center relative mt-10">

        {/* --- Outer Ring (Largest) --- */}
        <View className="w-[340px] h-[340px] rounded-full border border-kin-white/5 absolute justify-center items-center">
          {/* Planet 1: Top Right (Friend Avatar) */}
          <View className="absolute top-4 right-10 bg-kin-amber p-1 rounded-full">
            <View className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden border-2 border-kin-charcoal">
              <Image source={{ uri: 'https://i.pravatar.cc/100?img=5' }} className="w-full h-full" />
            </View>
          </View>

          {/* Planet 2: Bottom Left (Location Pin) */}
          <View className="absolute bottom-10 left-6 bg-kin-midnight p-3 rounded-full border border-kin-white/10 shadow-lg">
            <MapPin color="#F6B17A" size={24} fill="#F6B17A" fillOpacity={0.2} />
          </View>
        </View>


        {/* --- Inner Ring (Medium) --- */}
        <View className="w-[220px] h-[220px] rounded-full border border-kin-white/10 absolute justify-center items-center">
          {/* Planet 3: Top Left (Chat Bubble) */}
          <View className="absolute -top-4 left-6 bg-kin-midnight p-3 rounded-full border border-kin-white/10 shadow-lg transform -rotate-12">
            <MessageCircle color="#7077A1" size={24} />
          </View>

          {/* Planet 4: Bottom Right (Heart) */}
          <View className="absolute bottom-4 right-2 bg-kin-midnight p-3 rounded-full border border-kin-white/10 shadow-lg transform rotate-12">
            <Heart color="#F6B17A" size={24} fill="#F6B17A" />
          </View>
        </View>


        {/* --- CENTER SUN (Your KIN Logo) --- */}
        <View className="w-28 h-28 bg-kin-charcoal rounded-[40px] items-center justify-center shadow-2xl shadow-kin-amber/20 border border-kin-white/10 z-10">
          <Image
            source={images.welcomeicon}
            style={{ width: Platform.OS === 'web' ? 80 : 160, height: Platform.OS === 'web' ? 80 : 160 }}
            resizeMode="contain"
          />
        </View>

        {/* Glow Effect */}
        <View className="absolute -z-10">
          <Svg height="200" width="200" viewBox="0 0 400 400">
            <Defs>
              <RadialGradient
                id="grad"
                cx="200"
                cy="200"
                r="200"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor="#F6B17A" stopOpacity="0.4" />
                <Stop offset="1" stopColor="#F6B17A" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="200" cy="200" r="200" fill="url(#grad)" />
          </Svg>
        </View>
      </View>


      {/* =================================================
                   2. BOTTOM CONTENT (Text & Buttons)
                  ================================================= */}
      <View className="w-full px-6 pb-10">

        <Text className="text-4xl font-outfit-bold text-center text-kin-white mb-3">
          Deep Connections{"\n"}
          <Text className="text-kin-amber">Start Here</Text>
        </Text>

        <Text className="text-kin-mist text-center text-base font-outfit mb-10 px-4">
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

    </SafeAreaView>
  );
}
