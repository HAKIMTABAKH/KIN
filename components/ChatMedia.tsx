import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Pause, Play } from 'lucide-react-native';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

type ChatMediaProps = {
  uri: string;
  type: 'image' | 'video';
};

export default function ChatMedia({ uri, type }: ChatMediaProps) {
  // IMAGE HANDLING
  if (type === 'image') {
    return (
      <Image
        source={{ uri }}
        style={{ width: 240, height: 180, borderRadius: 12, backgroundColor: '#334155' }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  // VIDEO HANDLING (New API)
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <View className="relative rounded-xl overflow-hidden bg-black" style={{ width: 240, height: 180 }}>
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
      />
      
      {/* Custom Play/Pause Overlay */}
      <View className="absolute inset-0 justify-center items-center">
        <TouchableOpacity
          onPress={togglePlay}
          className="bg-black/60 p-4 rounded-full border border-white/30"
        >
          {isPlaying ? (
            <Pause size={24} color="white" fill="white" />
          ) : (
            <Play size={24} color="white" fill="white" style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
