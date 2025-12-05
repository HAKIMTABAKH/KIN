import { Link, router } from 'expo-router';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cleanOAuthUrl, configureGoogleSignIn, getCurrentSession, isOAuthCallback, signInWithEmail, signInWithGoogle } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isWeb = Platform.OS === 'web';

  // Configure Google Sign-In on mount
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      // On web, give Supabase time to process OAuth callback
      if (isOAuthCallback()) {
        console.log('OAuth callback detected, waiting for Supabase to process...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const { session } = await getCurrentSession();
      if (session && mounted) {
        console.log('Already authenticated, redirecting...');
        cleanOAuthUrl();
        router.replace('/(tabs)/Feed');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && mounted) {
        console.log('Sign in detected, redirecting...');
        cleanOAuthUrl();
        router.replace('/(tabs)/Feed');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle Google Sign-In
  async function handleGoogleSignIn() {
    setLoading(true);
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      // Don't show alert for user cancellation
      if (error.code !== 'cancelled') {
        Alert.alert('Google Sign-In Error', error.message);
      }
      setLoading(false);
    } else if (!isWeb) {
      // On native, navigate after successful sign-in
      router.replace('/(tabs)/Feed');
    }
    // On web, OAuth will redirect automatically
  }

  // Handle Email Sign-In
  async function handleEmailSignIn() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    
    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      router.replace('/(tabs)/Feed');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal items-center justify-center p-6">
      
      <View className="mb-10 w-full">
        <Text className="text-kin-amber text-4xl font-outfit-bold mb-2">Welcome Back.</Text>
        <Text className="text-kin-white text-xl font-outfit-medium">Enter your digital living room.</Text>
      </View>

      <View className="w-full">
        
        {/* Google Button - Available on all platforms */}
        <TouchableOpacity 
          onPress={handleGoogleSignIn}
          disabled={loading}
          className={`flex-row items-center justify-center bg-kin-white h-14 rounded-2xl mb-4 ${loading ? 'opacity-50' : ''}`}
        >
          <Text className="text-kin-charcoal font-outfit-bold text-lg">Continue with Google</Text>
        </TouchableOpacity>

        <View className="flex-row items-center my-4">
          <View className="flex-1 h-[1px] bg-kin-mist/30" />
          <Text className="mx-4 text-kin-mist font-outfit">OR</Text>
          <View className="flex-1 h-[1px] bg-kin-mist/30" />
        </View>

        {/* Email Inputs */}
        <View className="flex-row items-center bg-kin-midnight rounded-2xl px-4 h-16 mb-4 border border-kin-slate">
          <Mail color="#7077A1" size={20} />
          <TextInput 
            className="flex-1 ml-3 font-outfit text-kin-white text-base"
            placeholder="Email Address"
            placeholderTextColor="#7077A1"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="flex-row items-center bg-kin-midnight rounded-2xl px-4 h-16 mb-4 border border-kin-slate">
          <Lock color="#7077A1" size={20} />
          <TextInput 
            className="flex-1 ml-3 font-outfit text-kin-white text-base"
            placeholder="Password"
            placeholderTextColor="#7077A1"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Regular Sign In */}
        <TouchableOpacity 
          onPress={handleEmailSignIn}
          disabled={loading}
          className={`bg-kin-slate h-14 rounded-2xl flex-row justify-between items-center px-6 ${loading ? 'opacity-50' : ''}`}
        >
          <Text className="text-kin-mist font-outfit-bold text-base">
            {loading ? "Signing in..." : "Sign in with Email"}
          </Text>
          {!loading && <ArrowRight color="#7077A1" size={24} />}
        </TouchableOpacity>

      </View>

      <View className="flex-row justify-center mt-8">
        <Text className="text-kin-mist font-outfit">Don't have a key? </Text>
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity>
            <Text className="text-kin-amber font-outfit-bold">Create one</Text>
          </TouchableOpacity>
        </Link>
      </View>

    </SafeAreaView>
  );
}
