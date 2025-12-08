import { Friend, FriendRequest, Suggestion } from '@/types';
import { supabase } from './supabase';


// Fetch friend requests
export async function fetchRequests(uid: string): Promise<FriendRequest[]> {
  // Get blocked users (both ways)
  const { data: blockedByMe } = await supabase
    .from('blocked_users')
    .select('blocked_user_id')
    .eq('user_id', uid);
  
  const { data: blockedMe } = await supabase
    .from('blocked_users')
    .select('user_id')
    .eq('blocked_user_id', uid);
  
  const blockedIds = new Set<string>();
  blockedByMe?.forEach(b => blockedIds.add(b.blocked_user_id));
  blockedMe?.forEach(b => blockedIds.add(b.user_id));

  const { data } = await supabase
    .from('friendships')
    .select(`id, requester_id, profiles!friendships_requester_id_fkey(full_name, avatar_url)`)
    .eq('receiver_id', uid)
    .eq('status', 'pending');
  
  if (!data) return [];
  
  // Filter out blocked users
  const filtered = data.filter(req => !blockedIds.has(req.requester_id));
  
  return filtered.map(i => ({
    ...i,
    profiles: Array.isArray(i.profiles) ? i.profiles[0] : i.profiles
  }));
}

// Fetch friends
export async function fetchFriends(uid: string): Promise<Friend[]> {
  // Get blocked users (both ways)
  const { data: blockedByMe } = await supabase
    .from('blocked_users')
    .select('blocked_user_id')
    .eq('user_id', uid);
  
  const { data: blockedMe } = await supabase
    .from('blocked_users')
    .select('user_id')
    .eq('blocked_user_id', uid);
  
  const blockedIds = new Set<string>();
  blockedByMe?.forEach(b => blockedIds.add(b.blocked_user_id));
  blockedMe?.forEach(b => blockedIds.add(b.user_id));

  const { data } = await supabase
    .from('friendships')
    .select(`
      id, 
      requester_id, 
      receiver_id, 
      requester:profiles!friendships_requester_id_fkey(*), 
      receiver:profiles!friendships_receiver_id_fkey(*)
    `)
    .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
    .eq('status', 'accepted');
  
  if (!data) return [];
  
  // Filter out blocked users
  const filtered = data.filter(f => {
    const friendId = f.requester_id === uid ? f.receiver_id : f.requester_id;
    return !blockedIds.has(friendId);
  });
  
  return filtered.map(i => {
    const friendProfile = i.requester_id === uid ? i.receiver : i.requester;
    return {
      id: i.id,
      profile: Array.isArray(friendProfile) ? friendProfile[0] : friendProfile
    };
  });
}

// Fetch suggestions
export async function fetchSuggestions(uid: string): Promise<Suggestion[]> {
  const { data: allFriendships } = await supabase
    .from('friendships')
    .select('requester_id, receiver_id, status')
    .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`);
  
  // Get hidden users
  const { data: hiddenUsers } = await supabase
    .from('hidden_users')
    .select('hidden_user_id')
    .eq('user_id', uid);
  
  // Get blocked users (both ways - users I blocked and users who blocked me)
  const { data: blockedByMe } = await supabase
    .from('blocked_users')
    .select('blocked_user_id')
    .eq('user_id', uid);
  
  const { data: blockedMe } = await supabase
    .from('blocked_users')
    .select('user_id')
    .eq('blocked_user_id', uid);
  
  const excludeIds = new Set([uid]);
  
  // Exclude friends and pending requests
  allFriendships?.forEach(f => {
    if (f.status === 'accepted') {
      excludeIds.add(f.requester_id);
      excludeIds.add(f.receiver_id);
    }
    if (f.status === 'pending' && f.receiver_id === uid) {
      excludeIds.add(f.requester_id);
    }
  });

  // Exclude hidden users
  hiddenUsers?.forEach(h => {
    excludeIds.add(h.hidden_user_id);
  });

  // Exclude blocked users (both directions)
  blockedByMe?.forEach(b => {
    excludeIds.add(b.blocked_user_id);
  });
  
  blockedMe?.forEach(b => {
    excludeIds.add(b.user_id);
  });

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .not('id', 'in', `(${Array.from(excludeIds).join(',')})`)
    .limit(20);
  
  if (!profiles) return [];

  const profilesWithStatus = await Promise.all(
    profiles.map(async (profile) => {
      const { data: friendship } = await supabase
        .from('friendships')
        .select('status, requester_id')
        .eq('requester_id', uid)
        .eq('receiver_id', profile.id)
        .single();
      
      return {
        ...profile,
        friendshipStatus: friendship?.status || null
      };
    })
  );
  
  return profilesWithStatus;
}

// Check if there's a block between two users (either direction)
export async function isBlocked(uid: string, targetUserId: string): Promise<boolean> {
  const { data } = await supabase
    .from('blocked_users')
    .select('id')
    .or(`and(user_id.eq.${uid},blocked_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},blocked_user_id.eq.${uid})`)
    .limit(1);
  
  return (data && data.length > 0) || false;
}

// Send friend request
export async function sendFriendRequest(uid: string, receiverId: string): Promise<boolean> {
  // Check if either user has blocked the other
  const blocked = await isBlocked(uid, receiverId);
  
  if (blocked) {
    console.log('Cannot send friend request - user is blocked');
    return false;
  }

  const { error } = await supabase
    .from('friendships')
    .insert({
      requester_id: uid,
      receiver_id: receiverId,
      status: 'pending'
    });
  
  return !error;
}

// Cancel friend request
export async function cancelRequest(uid: string, receiverId: string): Promise<boolean> {
  const { data } = await supabase
    .from('friendships')
    .select('id')
    .or(`and(requester_id.eq.${uid},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${uid})`)
    .eq('status', 'pending')
    .single();
  
  if (!data) return false;
  
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', data.id);
  
  return !error;
}

// Accept friend request
export async function acceptRequest(uid: string, friendshipId: string, senderId: string): Promise<boolean> {
  const { error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);
  
  if (updateError) return false;

  // Create chat room
  const { data: room } = await supabase
    .from('rooms')
    .insert({ name: 'DM' })
    .select()
    .single();
  
  if (room) {
    await supabase
      .from('user_rooms')
      .insert([
        { user_id: uid, room_id: room.id },
        { user_id: senderId, room_id: room.id }
      ]);
  }
  
  return true;
}

// Decline friend request
export async function declineRequest(friendshipId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  
  return !error;
}

// Remove suggestion (hide user)
export async function removeSuggestion(uid: string, targetUserId: string): Promise<boolean> {
  const { error } = await supabase
    .from('hidden_users')
    .insert({
      user_id: uid,
      hidden_user_id: targetUserId
    });
  
  if (error) {
    console.error('Error hiding user:', error);
    return false;
  }
  
  return true;
}

// Unfriend a user
export async function unfriendUser(friendshipId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  
  if (error) {
    console.error('Error unfriending user:', error);
    return false;
  }
  
  return true;
}

// Block a user
export async function blockUser(uid: string, targetUserId: string): Promise<boolean> {
  // First, remove any existing friendship
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .or(`and(requester_id.eq.${uid},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${uid})`)
    .single();
  
  if (friendship) {
    await supabase
      .from('friendships')
      .delete()
      .eq('id', friendship.id);
  }

  // Add to blocked users table
  const { error } = await supabase
    .from('blocked_users')
    .insert({
      user_id: uid,
      blocked_user_id: targetUserId
    });
  
  if (error) {
    console.error('Error blocking user:', error);
    return false;
  }
  
  return true;
}

// Get chat room with a friend
export async function getChatRoomWithFriend(uid: string, friendId: string): Promise<string | null> {
  // Get user's rooms
  const { data: userRooms } = await supabase
    .from('user_rooms')
    .select('room_id')
    .eq('user_id', uid);
  
  if (!userRooms || userRooms.length === 0) return null;

  const roomIds = userRooms.map(ur => ur.room_id);

  // Check which room has the friend
  for (const roomId of roomIds) {
    const { data: roomMembers } = await supabase
      .from('user_rooms')
      .select('user_id')
      .eq('room_id', roomId);

    const hasFriend = roomMembers?.some(m => m.user_id === friendId);
    if (hasFriend) {
      return roomId;
    }
  }

  return null;
}

// Search users by name
export async function searchUsers(uid: string, query: string) {
  // Get blocked users (both directions)
  const { data: blockedByMe } = await supabase
    .from('blocked_users')
    .select('blocked_user_id')
    .eq('user_id', uid);
  
  const { data: blockedMe } = await supabase
    .from('blocked_users')
    .select('user_id')
    .eq('blocked_user_id', uid);
  
  const blockedIds = new Set<string>([uid]);
  blockedByMe?.forEach(b => blockedIds.add(b.blocked_user_id));
  blockedMe?.forEach(b => blockedIds.add(b.user_id));

  // Search profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', `%${query}%`)
    .not('id', 'in', `(${Array.from(blockedIds).join(',')})`)
    .limit(10);

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  // Check friendship status for each user
  const resultsWithStatus = await Promise.all(
    (data || []).map(async (profile) => {
      const { data: friendship } = await supabase
        .from('friendships')
        .select('status')
        .or(`and(requester_id.eq.${uid},receiver_id.eq.${profile.id}),and(requester_id.eq.${profile.id},receiver_id.eq.${uid})`)
        .single();

      return {
        ...profile,
        friendshipStatus: friendship?.status || null
      };
    })
  );

  return resultsWithStatus;
}

export { Suggestion };

