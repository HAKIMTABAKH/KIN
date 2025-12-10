import { formatTime } from '@/lib/mediaViewerHelpers';
import Slider from '@react-native-community/slider';
import { Pause, Play } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type VideoControlsProps = {
  player: any;
  visible: boolean;
  onTogglePlay: () => void;
};

export default function VideoControls({ player, visible, onTogglePlay }: VideoControlsProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player && !isSeeking) {
        setCurrentTime(player.currentTime);
        setDuration(player.duration);
        setIsPlaying(player.playing);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [player, isSeeking]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Play/Pause Button */}
      <View className="flex-1 justify-center items-center" pointerEvents="box-none">
        <TouchableOpacity 
          onPress={onTogglePlay} 
          className="bg-black/50 p-5 rounded-full border border-white/20"
        >
          {isPlaying ? (
            <Pause size={32} color="white" fill="white" />
          ) : (
            <Play size={32} color="white" fill="white" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View className="absolute bottom-[90px] left-5 right-5">
        <View className="flex-row justify-between mb-2">
          <Text className="text-white text-xs font-outfit-medium">{formatTime(currentTime)}</Text>
          <Text className="text-white text-xs font-outfit-medium">{formatTime(duration)}</Text>
        </View>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={duration || 1}
          value={currentTime}
          minimumTrackTintColor="#F59E0B"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#FFFFFF"
          onSlidingStart={() => setIsSeeking(true)}
          onSlidingComplete={(val) => {
            player.currentTime = val;
            setCurrentTime(val);
            setIsSeeking(false);
          }}
        />
      </View>
    </View>
  );
}
