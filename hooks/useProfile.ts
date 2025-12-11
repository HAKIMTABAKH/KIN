import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useProfile() {
  const { 
    data: profile, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return null;
      }

      return data as Profile;
    },
    staleTime: 1000 * 60 * 10, // Profile data stays fresh for 10 minutes
  });

  return {
    profile,
    isLoading,
    refresh: refetch
  };
}
