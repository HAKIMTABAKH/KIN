import VideoControls from '@/components/VideoControls';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';

const isWeb = Platform.OS === 'web';

type MediaGalleryItemProps = {
  uri: string;
  isActive: boolean;
  width: number;
};

export default function MediaGalleryItem({ uri, isActive, width }: MediaGalleryItemProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    if (isActive) p.play();
  });

  useEffect(() => {
    if (isActive) player?.play();
    else player?.pause();
  }, [isActive]);

  if (!player) return null;

  return (
    <View style={{ width, height: '100%' }}>
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        nativeControls={isWeb}
      />
      {!isWeb && (
        <VideoControls
          player={player}
          visible={true}
          onTogglePlay={() => {
            player.playing ? player.pause() : player.play();
          }}
        />
      )}
    </View>
  );
}
