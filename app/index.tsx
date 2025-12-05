import { cleanOAuthUrl, getCurrentSession, isOAuthCallback } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    let mounted = true;

    // Check current session
    const checkSession = async () => {
      // Give Supabase time to process OAuth callback if present
      if (isOAuthCallback()) {
        console.log('Index - OAuth callback detected, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const { session, error } = await getCurrentSession();
      console.log('Index - Session check:', {
        hasSession: !!session,
        error: error,
        sessionDetails: session ? { user: session.user.email, expiresAt: session.expires_at } : null
      });
      
      if (mounted) {
        setIsAuthenticated(!!session);
        setIsChecking(false);
        
        // Clean OAuth URL if authenticated
        if (session) {
          cleanOAuthUrl();
        }
      }
    };

    checkSession();

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
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Show loading while checking auth
  if (isChecking || isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  
  return <Redirect href="/(tabs)/Feed" />;
}
