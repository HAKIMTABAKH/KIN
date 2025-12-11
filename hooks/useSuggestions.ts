import { fetchSuggestions } from '@/lib/people';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export function useSuggestions() {
  const { 
    data: suggestions, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['friend-suggestions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      return await fetchSuggestions(user.id);
    },
    staleTime: 1000 * 60 * 10, // Suggestions stay fresh for 10 minutes
  });

  return {
    suggestions: suggestions || [],
    isLoading,
    refresh: refetch
  };
}
