import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X } from 'lucide-react-native';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface MediaPreviewSheetProps {
  visible: boolean;
  media: ImagePicker.ImagePickerAsset | null;
  uploading: boolean;
  onClose: () => void;
  onSend: () => void;
}

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
  });

  return (
    <VideoView
      player={player}
      style={{ 
        width: '100%', 
        height: 300, 
        backgroundColor: '#1e293b',
        borderRadius: 16
      }}
      contentFit="contain"
      nativeControls={true}
    />
  );
}

export default function MediaPreviewSheet({ 
  visible, 
  media, 
  uploading, 
  onClose, 
  onSend 
}: MediaPreviewSheetProps) {
  if (!visible || !media) return null;

  return (
    <View className="absolute inset-0 bg-black/80 justify-end">
      <TouchableOpacity 
        className="flex-1" 
        activeOpacity={1}
        onPress={onClose}
      />
      
      <View className="bg-kin-charcoal rounded-t-3xl pb-8">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-kin-slate/30">
          <Text className="text-kin-white text-lg font-outfit-bold">Send Media</Text>
          <TouchableOpacity onPress={onClose}>
            <X color="#9CA3AF" size={24} />
          </TouchableOpacity>
        </View>

        {/* Media Preview */}
        <View className="px-6 py-6 items-center">
          {media.type === 'video' ? (
            <VideoPreview uri={media.uri} />
          ) : (
            <Image 
              source={{ uri: media.uri }}
              style={{ 
                width: '100%', 
                height: 300, 
                backgroundColor: '#1e293b',
                borderRadius: 16
              }}
              contentFit="contain"
              transition={200}
            />
          )}
          
          {/* File Info */}
          <View className="mt-4 flex-row items-center gap-2">
            <Text className="text-kin-mist text-sm font-outfit">
              {media.type === 'video' ? 'Video' : 'Image'}
            </Text>
            {media.fileSize && (
              <>
                <Text className="text-kin-mist text-sm">•</Text>
                <Text className="text-kin-mist text-sm font-outfit">
                  {(media.fileSize / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Send Button */}
        <View className="px-6">
          <TouchableOpacity
            onPress={onSend}
            disabled={uploading}
            className="bg-kin-amber py-4 rounded-2xl items-center"
          >
            {uploading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black text-base font-outfit-bold">Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
