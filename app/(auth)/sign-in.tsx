import { Link, router } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KinInput from '../../components/KinInput';
import { cleanOAuthUrl, configureGoogleSignIn, getCurrentSession, isGoogleSignInAvailable, isOAuthCallback, signInWithEmail, signInWithGoogle, updateProfileFromMetadata } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const isWeb = Platform.OS === 'web';
  const showGoogleButton = isWeb || isGoogleSignInAvailable();

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
        console.log('Already authenticated, syncing profile and redirecting...');
        
        // Sync profile to ensure it's up to date
        if (session.user) {
          await updateProfileFromMetadata(session.user.id);
        }
        
        cleanOAuthUrl();
        router.replace('/(tabs)/Feed');
      } else if (mounted) {
        // No session, ensure loading is false
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && mounted) {
        console.log('Sign in detected, updating profile and redirecting...');
        
        // Update profile from OAuth metadata if available
        if (session.user) {
          await updateProfileFromMetadata(session.user.id);
        }
        
        cleanOAuthUrl();
        router.replace('/(tabs)/Feed');
      } else if (event === 'SIGNED_OUT' && mounted) {
        // Reset loading state on sign out
        console.log('Sign out detected, resetting loading state');
        setLoading(false);
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
      if (error.code === 'not_available') {
        Alert.alert(
          'Not Available in Expo Go',
          'Google Sign-In requires a development build. Please use email sign-in or build the app with EAS.'
        );
      } else if (error.code !== 'cancelled') {
        Alert.alert('Google Sign-In Error', error.message);
      }
      setLoading(false);
    } else if (!isWeb) {
      // On native, navigate after successful sign-in
      router.replace('/(tabs)/Feed');
    }
    // On web, OAuth will redirect automatically
  }

  // Validation Function
  const validate = () => {
    const newErrors: FormErrors = {};
    
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Email Sign-In
  async function handleEmailSignIn() {
    if (!validate()) return;

    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    
    if (error) {
      setErrors({ email: error.message });
      setLoading(false);
    } else {
      router.replace('/(tabs)/Feed');
    }
  }

  // Helper to clear error when user types
  const handleInputChange = (field: keyof FormErrors, value: string, setter: (value: string) => void) => {
    setter(value);
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-kin-charcoal"
    >
      {/* 2. SCROLLVIEW: Ensures the inputs scroll up when keyboard opens */}
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 3. SAFE AREA: Handles the notch/padding inside the scroll */}
        <SafeAreaView className="flex-1 items-center justify-center p-7 gap-6">
          
          {/* Header */}
          <View className="mb-10 w-full">
            <Text className="text-kin-amber text-4xl font-outfit-bold mb-2">Welcome Back.</Text>
            <Text className="text-kin-white text-xl font-outfit-medium">Enter your digital living room.</Text>
          </View>

          <View className="w-full">
            
            {/* Google Button (Optional) */}
            {showGoogleButton && (
              <>
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
              </>
            )}

            <KinInput
              icon={Mail}
              placeholder="Email Address"
              value={email}
              onChangeText={(text) => handleInputChange('email', text, setEmail)}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <KinInput
              icon={Lock}
              placeholder="Password"
              value={password}
              onChangeText={(text) => handleInputChange('password', text, setPassword)}
              error={errors.password}
              secureTextEntry={!isPasswordVisible}
              rightIcon={isPasswordVisible ? Eye : EyeOff}
              onRightIconPress={togglePasswordVisibility}
            />

            {/* Sign In Button */}
            <TouchableOpacity 
  onPress={handleEmailSignIn}
  disabled={loading}
  // 1. Change background to Amber (High Visibility)
  // 2. Add 'mt-2' to give it a little breathing room from the inputs
  className={`bg-kin-amber h-14 rounded-2xl flex-row justify-center items-center px-6 mt-2 ${loading ? 'opacity-50' : ''}`}
>
  {/* 3. Change text to Dark (Black/Charcoal) so it's readable on Amber */}
  <Text className="text-black font-outfit-bold text-lg mr-2">
    {loading ? "Signing in..." : "Sign in with Email"}
  </Text>
  
  {/* 4. Change arrow to Black to match text */}
  {!loading && <ArrowRight color="#000000" size={24} />}
</TouchableOpacity>
          </View>

          {/* Footer Link */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-kin-mist font-outfit">Don't have a key? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text className="text-kin-amber font-outfit-bold">Create one</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
