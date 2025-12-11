import { supabase } from '@/lib/supabase';
import { Friend, FriendRequest } from '@/types';
import { useQuery } from '@tanstack/react-query';

export function useSocialData() {
  // Fetch Friend Requests (Cached)
  const { 
    data: requests, 
    isLoading: loadingRequests, 
    refetch: refetchRequests 
  } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('friendships')
        .select(`id, requester_id, profiles!friendships_requester_id_fkey(full_name, avatar_url)`)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (!data) return [];

      return data.map(item => ({
        id: item.id,
        requester_id: item.requester_id,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })) as FriendRequest[];
    },
    staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
  });

  // Fetch Friends (Cached)
  const { 
    data: friends, 
    isLoading: loadingFriends, 
    refetch: refetchFriends 
  } = useQuery({
    queryKey: ['my-friends'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('friendships')
        .select(`
          id, 
          requester_id, 
          receiver_id, 
          requester:profiles!friendships_requester_id_fkey(*), 
          receiver:profiles!friendships_receiver_id_fkey(*)
        `)
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (!data) return [];

      return data.map(item => ({
        id: item.id,
        profile: item.requester_id === user.id ? item.receiver : item.requester
      })) as Friend[];
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    requests: requests || [],
    friends: friends || [],
    isLoading: loadingRequests || loadingFriends,
    refresh: () => {
      refetchRequests();
      refetchFriends();
    }
  };
}
