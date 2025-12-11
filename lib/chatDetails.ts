import { supabase } from './supabase';

export type ChatMediaItem = {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
};

export type ChatDetailsProfile = {
  id: string;
  full_name?: string;
  avatar_url?: string;
  last_seen?: string;
  bio?: string;
  created_at?: string;
};

/**
 * Fetch user profile by ID
 */
export async function fetchUserProfile(userId: string): Promise<ChatDetailsProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Fetch all shared media in a chat room
 */
export async function fetchSharedMedia(roomId: string): Promise<ChatMediaItem[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, media_url, media_type')
    .eq('room_id', roomId)
    .not('media_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shared media:', error);
    return [];
  }

  return (data || []) as ChatMediaItem[];
}

export type MediaGalleryItem = {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
};

/**
 * Fetch all media items for the gallery viewer
 */
export async function fetchMediaGallery(roomId: string): Promise<MediaGalleryItem[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, media_url, media_type, created_at, user_id, profiles(full_name, avatar_url)')
    .eq('room_id', roomId)
    .not('media_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching media gallery:', error);
    return [];
  }

  return (data || []).map(item => ({
    ...item,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
  })) as MediaGalleryItem[];
}
