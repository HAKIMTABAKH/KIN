import { Link, router } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KinInput from '../../components/KinInput';
import { signUpWithEmail } from '../../lib/auth';

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({}); 
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else {
      // Check for password complexity
      const hasLowerCase = /[a-z]/.test(password);
      const hasUpperCase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      
      if (!hasLowerCase || !hasUpperCase || !hasNumber ) {
        newErrors.password = "Password should contain at least one character of each: abcdefghijklmnopqrstuv wxyzABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSignUp() {
    if (!validate()) return; 

    setLoading(true);
    
    const { error } = await signUpWithEmail(email, password, fullName);

    if (error) {
      // Map Supabase errors to the correct field
      if (error.message.toLowerCase().includes('password')) {
        setErrors({ password: error.message });
      } else if (error.message.toLowerCase().includes('email')) {
        setErrors({ email: error.message });
      } else {
        setErrors({ email: error.message });
      }
      setLoading(false);
    } else {
      setLoading(false);
      router.replace('/(tabs)/Feed');
    }
  }

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
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <SafeAreaView className="flex-1 items-center justify-center p-7 gap-6">
          
          <View className="mb-10 w-full">
            <Text className="text-kin-amber text-4xl font-outfit-bold mb-2">Join KIN.</Text>
            <Text className="text-kin-white text-xl font-outfit-medium">Create your private space.</Text>
          </View>

          <View className="w-full">
            
            <KinInput
              icon={User}
              placeholder="Full Name"
              value={fullName}
              onChangeText={(text) => handleInputChange('fullName', text, setFullName)}
              error={errors.fullName}
              autoCapitalize="words"
            />

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

            {/* Create Account Button */}
            <TouchableOpacity 
              onPress={handleSignUp}
              disabled={loading}
              className={`bg-kin-amber h-14 rounded-2xl flex-row justify-center items-center px-6 mt-2 ${loading ? 'opacity-50' : ''}`}
            >
              <Text className="text-black font-outfit-bold text-lg mr-2">
                {loading ? "Creating..." : "Create Account"}
              </Text>
              {!loading && <ArrowRight color="#000000" size={24} />}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}