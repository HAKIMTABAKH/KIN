import { supabase } from '@/lib/supabase';
import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

/**
 * Format time in seconds to MM:SS format
 */
export const formatTime = (timeInSeconds: number): string => {
  if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

/**
 * Download media to device gallery
 */
export const downloadMedia = async (
  uri: string,
  onStart: () => void,
  onComplete: () => void
): Promise<boolean> => {
  onStart();
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to save media.');
      onComplete();
      return false;
    }

    const filename = uri.split('/').pop() || 'download';
    const fileUri = `${cacheDirectory}${filename}`;
    const { uri: localUri } = await downloadAsync(uri, fileUri);
    await MediaLibrary.saveToLibraryAsync(localUri);
    Alert.alert('Saved', 'Media saved to gallery');
    return true;
  } catch (e) {
    console.error('Download error:', e);
    Alert.alert('Error', 'Failed to save media');
    return false;
  } finally {
    onComplete();
  }
};

/**
 * Send a reply message to a media
 */
export const sendMediaReply = async (
  content: string,
  roomId: string,
  messageId: string,
  onSuccess: () => void
): Promise<boolean> => {
  if (!content.trim()) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('messages').insert({
      content: content.trim(),
      room_id: roomId,
      user_id: user?.id,
      reply_to_id: messageId,
    });

    if (!error) {
      onSuccess();
      return true;
    }
    return false;
  } catch (e) {
    console.error('Reply error:', e);
    return false;
  }
};
