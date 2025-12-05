import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const isWeb = Platform.OS === 'web';

// Lazy load Google Sign-In only when available (not in Expo Go)
let GoogleSignin: any = null;
let statusCodes: any = null;

try {
  if (!isWeb) {
    const googleSignInModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignInModule.GoogleSignin;
    statusCodes = googleSignInModule.statusCodes;
  }
} catch (error) {
  console.log('Google Sign-In not available (Expo Go or module not installed)');
}

// Check if Google Sign-In is available
export function isGoogleSignInAvailable() {
  return !isWeb && GoogleSignin !== null;
}

// Configure Google Sign-In for native platforms
export function configureGoogleSignIn() {
  if (isWeb || !GoogleSignin) return;

  const webClientId =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  if (!webClientId) {
    console.error('Missing Google Web Client ID in environment variables');
    return;
  }

  try {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/userinfo.profile'],
      webClientId: webClientId,
    });
  } catch (error) {
    console.error('Error configuring Google Sign-In:', error);
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { data, error };
}

// Sign in with Google (handles both web and native)
export async function signInWithGoogle() {
  if (isWeb) {
    // Web: Use Supabase OAuth
    // Redirect to root - Supabase will handle the OAuth callback
    const redirectUrl = window.location.origin;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    return { data, error };
  } else {
    // Native: Check if Google Sign-In is available
    if (!GoogleSignin) {
      return { 
        data: null, 
        error: { 
          message: 'Google Sign-In is not available. Please use a development build or email sign-in.', 
          code: 'not_available' 
        } 
      };
    }

    // Native: Use Google Sign-In SDK
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token present!');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      return { data, error };
    } catch (error: any) {
      // Handle Google Sign-In specific errors
      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { data: null, error: { message: 'Sign-in cancelled', code: 'cancelled' } };
      } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
        return { data: null, error: { message: 'Sign-in already in progress', code: 'in_progress' } };
      } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { data: null, error: { message: 'Play Services not available', code: 'play_services' } };
      }
      return { data: null, error };
    }
  }
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  // Also sign out from Google on native if available
  if (!isWeb && GoogleSignin) {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out from Google:', error);
    }
  }

  return { error };
}

// Get current session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

// Clean OAuth URL hash (web only)
export function cleanOAuthUrl() {
  if (isWeb && window.location.hash) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Check if URL contains OAuth callback
export function isOAuthCallback() {
  return isWeb && window.location.hash.includes('access_token');
}
