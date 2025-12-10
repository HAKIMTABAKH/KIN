/**
 * Media Handler Functions
 * Business logic for media picking and uploading
 */

import { decode } from 'base64-arraybuffer';
import * as ExpoFS from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { supabase } from './supabase';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Pick media from camera or library
 */
export const pickMedia = async (
  mode: 'library' | 'camera',
  onSuccess: (file: ImagePicker.ImagePickerAsset) => void
) => {
  try {
    let result: ImagePicker.ImagePickerResult;

    if (mode === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take photos and videos.');
        return;
      }

      result = await ImagePicker.launchCameraAsync({
        // FIX: Use simple array instead of deprecated Enum
        mediaTypes: ['images', 'videos'], 
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library access is needed to select photos and videos.');
        return;
      }

      result = await ImagePicker.launchImageLibraryAsync({
        // FIX: Use simple array instead of deprecated Enum
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = result.assets[0];

      if (file.fileSize && file.fileSize > MAX_FILE_SIZE) {
        Alert.alert('File Too Large', 'Please select a file smaller than 20MB.');
        return;
      }

      onSuccess(file);
    }
  } catch (error) {
    console.error('Error picking media:', error);
    Alert.alert('Error', 'Failed to pick media. Please try again.');
  }
};

/**
 * Upload media and send as message
 */
export const uploadAndSendMedia = async (
  file: ImagePicker.ImagePickerAsset,
  roomId: string,
  userId: string,
  setMessages: (updater: (prev: any[]) => any[]) => void,
  setUploading: (uploading: boolean) => void,
  replyToId?: string | null
) => {
  if (!file || !userId) return;

  const mediaType = file.type === 'video' ? 'video' : 'image';
  const fileExt = file.uri.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');
  const fileName = `${roomId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Optimistic Update
  const tempId = `temp-media-${Date.now()}`;
  const tempMessage: any = {
    id: tempId,
    content: '',
    user_id: userId,
    created_at: new Date().toISOString(),
    room_id: roomId,
    status: 'uploading',
    media_url: file.uri,
    media_type: mediaType,
    reactions: {},
    profiles: null,
    reply_to_id: replyToId,
  };

  setMessages((prev) => [tempMessage, ...prev]);
  setUploading(true);

  try {
    // 1. Read file as base64 string (Using Legacy API)
    const base64 = await ExpoFS.readAsStringAsync(file.uri, {
      encoding: 'base64',
    });

    // 2. Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // 3. Upload to Supabase Storage
    const contentType = mediaType === 'video' ? `video/${fileExt}` : `image/${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(fileName, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 4. Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // 5. Save message to database
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        content: '',
        room_id: roomId,
        user_id: userId,
        media_url: publicUrl,
        media_type: mediaType,
        ...(replyToId && { reply_to_id: replyToId }),
      })
      .select('*, profiles(full_name, avatar_url)')
      .single();

    if (messageError) throw messageError;

    // 6. Replace optimistic message with real one
    setMessages((prev) => {
      const withoutTemp = prev.filter((msg) => msg.id !== tempId);
      const exists = withoutTemp.some((msg) => msg.id === messageData.id);
      if (exists) {
        return withoutTemp.map((msg) =>
          msg.id === messageData.id ? messageData : msg
        );
      }
      return [messageData, ...withoutTemp];
    });

  } catch (error) {
    console.error('Error uploading media:', error);
    Alert.alert('Upload Failed', 'Failed to upload media. Please try again.');
    setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
  } finally {
    setUploading(false);
  }
};