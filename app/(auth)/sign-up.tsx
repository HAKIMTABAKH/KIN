import { Link, router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUpWithEmail } from '../../lib/auth';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    
    const { error } = await signUpWithEmail(email, password);

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      Alert.alert('Success', 'Check your email for confirmation!');
      setLoading(false);
      router.replace('/(auth)/sign-in');
    }
  }

  return (
    <SafeAreaView className="kin-container justify-center">
      
      <View className="mb-10">
        <Text className="h1-bold text-kin-white mb-2">Join KIN.</Text>
        <Text className="h3-medium">Create your private space.</Text>
      </View>

      <View className="space-y-4 w-full">
        
        <View className="flex-row items-center bg-kin-midnight rounded-2xl px-4 h-16">
          <Mail color="#7077A1" size={20} />
          <TextInput 
            className="flex-1 ml-3 font-outfit text-kin-white text-base"
            placeholder="Email Address"
            placeholderTextColor="#7077A1"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="flex-row items-center bg-kin-midnight rounded-2xl px-4 h-16">
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

        <TouchableOpacity 
          onPress={handleSignUp}
          disabled={loading}
          className="btn-primary mt-6"
        >
          <Text className="btn-primary-text">
            {loading ? "Creating..." : "Create Account"}
          </Text>
        </TouchableOpacity>

      </View>

      <View className="flex-row justify-center mt-8">
        <Text className="text-kin-mist font-outfit">Already have a space? </Text>
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity>
            <Text className="text-kin-amber font-outfit-bold">Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>

    </SafeAreaView>
  );
}