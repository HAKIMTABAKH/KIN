import VideoControls from '@/components/VideoControls';
import { downloadMedia, sendMediaReply } from '@/lib/mediaViewerHelpers';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Camera, Download, X } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function MediaViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Params
  const uri = params.uri as string;
  const type = params.type as string;
  const userName = params.userName as string;
  const avatar = params.avatar as string;
  const timestamp = params.timestamp as string;
  const messageId = params.messageId as string;
  const roomId = params.roomId as string;

  // State
  const [saving, setSaving] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  // Animation Values
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // Video Setup
  const player = type === 'video' ? useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  }) : null;

  const togglePlay = () => {
    if (!player) return;
    player.playing ? player.pause() : player.play();
  };

  // Gesture Handlers
  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    setShowControls(focusMode);
  };

  const goBack = () => router.back();

  const singleTap = Gesture.Tap()
    .onEnd(() => toggleFocusMode())
    .runOnJS(true);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = scale.value > 1 ? withSpring(1) : withSpring(2);
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => { savedScale.value = scale.value; })
    .onUpdate((e) => { scale.value = savedScale.value * e.scale; })
    .onEnd(() => { if (scale.value < 1) scale.value = withSpring(1); });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.value > 1.1) return;
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (scale.value > 1.1) return;
      if (e.translationY > 150 || e.velocityY > 1000) goBack();
      else translateY.value = withSpring(0);
    })
    .runOnJS(true);

  const composedGestures = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    Gesture.Exclusive(doubleTap, singleTap)
  );

  // Animated Styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value <= 1 
        ? interpolate(translateY.value, [0, height], [1, 0.8], Extrapolation.CLAMP) 
        : scale.value 
      }
    ],
    borderRadius: interpolate(translateY.value, [0, 200], [0, 20], Extrapolation.CLAMP),
    overflow: 'hidden',
  }));

  const uiStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, 100], [1, 0], Extrapolation.CLAMP),
  }));

  // Actions
  const handleDownload = () => {
    downloadMedia(uri, () => setSaving(true), () => setSaving(false));
  };

  const handleSendReply = async () => {
    setSending(true);
    await sendMediaReply(replyText, roomId, messageId, () => {
      setReplyText('');
      router.back();
    });
    setSending(false);
  };

  return (
    <GestureHandlerRootView className="flex-1">
      {/* Background */}
      {!focusMode ? (
        <>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <View className="absolute inset-0 bg-black/60" />
        </>
      ) : (
        <View className="absolute inset-0 bg-black" />
      )}

      <SafeAreaView className="flex-1">
        {/* Header */}
        {!focusMode && (
          <Animated.View className="flex-row justify-between px-4 py-2 z-[60]" style={uiStyle}>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={goBack} className="mr-3 bg-black/30 p-1 rounded-full">
                <X color="white" size={26} />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Image 
                  source={{ uri: avatar || 'https://i.pravatar.cc/150' }} 
                  style={{ width: 32, height: 32, borderRadius: 16 }}
                  className="bg-kin-slate"
                />
                <View className="ml-2.5">
                  <Text className="text-white font-outfit-bold text-base">{userName}</Text>
                  <Text className="text-kin-mist text-xs">{timestamp}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={handleDownload} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Download color="white" size={24} />}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Content */}
        <View className="flex-1 z-10">
          <GestureDetector gesture={composedGestures}>
            <Animated.View className="flex-1 justify-center items-center" style={animatedStyle}>
              {type === 'video' && player ? (
                <View style={{ width, height: '100%' }}>
                  <VideoView
                    player={player}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                    nativeControls={false}
                  />
                </View>
              ) : (
                <Image source={{ uri }} style={{ width, height: '100%' }} contentFit="contain" />
              )}
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Video Controls */}
        {type === 'video' && player && !focusMode && (
          <Animated.View className="absolute inset-0 z-50" style={uiStyle} pointerEvents="box-none">
            <VideoControls player={player} visible={showControls} onTogglePlay={togglePlay} />
          </Animated.View>
        )}

        {/* Footer */}
        {!focusMode && (
          <Animated.View className="z-[60]" style={uiStyle}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
              keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
              <View className="px-4 pb-4 pt-2">
                <View className="flex-row items-center bg-kin-midnight/90 rounded-full p-1 border border-kin-slate min-h-[50px]">
                  <TouchableOpacity className="w-10 h-10 bg-blue-500 rounded-full justify-center items-center mr-2">
                    <Camera size={20} color="white" />
                  </TouchableOpacity>
                  <TextInput
                    placeholder="Reply..."
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 text-white font-outfit text-base h-10"
                    value={replyText}
                    onChangeText={setReplyText}
                    returnKeyType="send"
                    onSubmitEditing={handleSendReply}
                  />
                  {replyText.length > 0 && (
                    <TouchableOpacity onPress={handleSendReply} disabled={sending} className="mx-3">
                      {sending ? (
                        <ActivityIndicator size="small" color="#3B82F6" />
                      ) : (
                        <Text className="text-blue-500 font-outfit-bold text-base">Send</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
