import { supabase } from './supabase';

/**
 * Get the count of friends for a user
 * Counts all accepted friendships where user is either requester or receiver
 */
export async function getFriendsCount(userId: string): Promise<number> {
  // Debug: Check current auth user
  const { data: { user: authUser } } = await supabase.auth.getUser();
  console.log('DEBUG auth.uid():', authUser?.id);
  console.log('DEBUG querying for userId:', userId);
  
  // Use separate queries to avoid .or() + .eq() filter issues
  const { data: asRequester, error: err1 } = await supabase
    .from('friendships')
    .select('id')
    .eq('requester_id', userId)
    .eq('status', 'accepted');

  const { data: asReceiver, error: err2 } = await supabase
    .from('friendships')
    .select('id, requester_id, receiver_id, status')
    .eq('receiver_id', userId)
    .eq('status', 'accepted');

  console.log('DEBUG userId:', userId);
  console.log('DEBUG asRequester:', asRequester);
  console.log('DEBUG asReceiver:', asReceiver);
  console.log('DEBUG err1:', err1);
  console.log('DEBUG err2:', err2);

  if (err1 || err2) {
    console.error('Error fetching friends count:', err1 || err2);
    return 0;
  }

  const total = (asRequester?.length || 0) + (asReceiver?.length || 0);
  console.log('Friends count:', total, '(as requester:', asRequester?.length, ', as receiver:', asReceiver?.length, ')');
  
  return total;
}

/**
 * Get profile stats (friends count, posts count, etc.)
 */
export async function getProfileStats(userId: string): Promise<{
  friendsCount: number;
  postsCount: number;
  followersCount: number;
}> {
  const friendsCount = await getFriendsCount(userId);
  
  // Posts and followers can be added later when those features exist
  return {
    friendsCount,
    postsCount: 0,
    followersCount: 0
  };
}
