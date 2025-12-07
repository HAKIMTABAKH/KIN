// context/UserContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types'; // Import the Profile type

// Define the shape of the context value
interface UserContextType {
  profile: Profile | null;
  loading: boolean;
}

// Create the context with an initial default value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create a provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch the user's profile on app start
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch the full profile from your 'profiles' table
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .returns<Profile>(); // Assert the return type
        
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();

    // Listen for auth changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value: UserContextType = {
    profile,
    loading,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Create a custom hook for easy access
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};