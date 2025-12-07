import { cleanOAuthUrl, getCurrentSession, isOAuthCallback } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { hasSeenWelcome } from "@/lib/utils";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasSeenWelcomeScreen, setHasSeenWelcomeScreen] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    let mounted = true;

    // Check welcome status and session
    const checkInitialState = async () => {
      // Check if user has seen welcome screen
      const seenWelcome = await hasSeenWelcome();
      
      // Give Supabase time to process OAuth callback if present
      if (isOAuthCallback()) {
        console.log('Index - OAuth callback detected, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const { session, error } = await getCurrentSession();
      console.log('Index - Session check:', {
        hasSession: !!session,
        seenWelcome,
        error: error,
        sessionDetails: session ? { user: session.user.email, expiresAt: session.expires_at } : null
      });
      
      if (mounted) {
        setHasSeenWelcomeScreen(seenWelcome);
        setIsAuthenticated(!!session);
        setIsChecking(false);
        
        // Clean OAuth URL if authenticated
        if (session) {
          cleanOAuthUrl();
        }
      }
    };

    checkInitialState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Index - Auth event:', event, 'Has session:', !!session);
      if (session) {
        console.log('Index - Session user:', session.user.email);
      }
      
      if (mounted) {
        setIsAuthenticated(!!session);
        setIsChecking(false);
        
        // Clean OAuth URL after successful auth
        if (session) {
          cleanOAuthUrl();
        }
        
        // On sign out, ensure we're not stuck in checking state
        if (event === 'SIGNED_OUT') {
          console.log('Index - Sign out detected, clearing auth state');
          setIsAuthenticated(false);
          setIsChecking(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Show loading while checking
  if (isChecking || isAuthenticated === null || hasSeenWelcomeScreen === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }
  
  // Show welcome screen on first launch (only if not authenticated)
  if (!hasSeenWelcomeScreen && !isAuthenticated) {
    return <Redirect href="/welcome" />;
  }
  
  // Show sign-in if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  
  // Show main app if authenticated
  return <Redirect href="/(tabs)/Feed" />;
}
