import { Profile, ProfileData } from '@/types';
import { supabase } from './supabase';


// Get current user's profile data
export async function getProfileData(): Promise<ProfileData> {
  try {
    // 1. Get Auth Data (Email, Created At)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        profile: null,
        userEmail: '',
        memberSince: ''
      };
    }

    const userEmail = user.email || '';
    
    // Format date: "Jan 2024"
    const date = new Date(user.created_at);
    const memberSince = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    // 2. Get Public Profile Data (Name, Avatar)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      profile,
      userEmail,
      memberSince
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return {
      profile: null,
      userEmail: '',
      memberSince: ''
    };
  }
}

// Update user's profile
export async function updateProfile(updates: Partial<Profile>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: new Error('No user found') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    return { error };
  } catch (error) {
    return { error };
  }
}

// Upload avatar image
export async function uploadAvatar(file: File | Blob, userId: string) {
  try {
    const fileExt = file.type?.split('/')[1] || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      return { error: uploadError, url: null };
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { error: null, url: data.publicUrl };
  } catch (error) {
    return { error, url: null };
  }
}
export { Profile };

