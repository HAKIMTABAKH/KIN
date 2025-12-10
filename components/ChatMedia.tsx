import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

type ChatMediaProps = {
  uri: string;
  type: 'image' | 'video';
  onPress: () => void;
};

export default function ChatMedia({ uri, type, onPress }: ChatMediaProps) {
  // VIDEO: We load it but keep it paused to act as a thumbnail
  const player = type === 'video' ? useVideoPlayer(uri, (player) => {
    player.muted = true;
    // Do NOT call player.play() here. We want a static thumbnail.
  }) : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View className="relative rounded-xl overflow-hidden bg-black border border-kin-slate/20" style={{ width: 220, height: 160 }}>
        {type === 'image' ? (
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <>
            {/* Video View acts as thumbnail (Paused) */}
            {player && (
              <VideoView
                player={player}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                nativeControls={false}
              />
            )}

            {/* Play Icon Overlay */}
            <View className="absolute inset-0 justify-center items-center bg-black/30">
              <View className="bg-black/50 p-3 rounded-full backdrop-blur-md border border-white/20">
                <Play size={24} color="white" fill="white" style={{ marginLeft: 2 }} />
              </View>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
