import MediaGalleryItem from '@/components/MediaGalleryItem';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import { MediaGalleryItem as MediaItemType } from '@/lib/chatDetails';
import { downloadMedia, sendMediaReply } from '@/lib/mediaViewerHelpers';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ChevronLeft, ChevronRight, Download, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
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

const isWeb = Platform.OS === 'web';

export default function MediaViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const { width, height } = useWindowDimensions();

  const uri = params.uri as string;
  const type = params.type as string;
  const userName = params.userName as string;
  const avatar = params.avatar as string;
  const timestamp = params.timestamp as string;
  const messageId = params.messageId as string;
  const roomId = params.roomId as string;

  const [saving, setSaving] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use React Query for cached media gallery
  const { data: cachedMediaItems, isLoading: loadingGallery } = useMediaGallery(roomId);

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // Create single media item for standalone view
  function createSingleMediaItem(): MediaItemType {
    return {
      id: messageId || '1',
      media_url: uri,
      media_type: type as 'image' | 'video',
      created_at: new Date().toISOString(),
      user_id: '',
      profiles: { full_name: userName, avatar_url: avatar }
    };
  }

  // Determine media items: use cached gallery or single item
  const mediaItems = roomId && cachedMediaItems && cachedMediaItems.length > 0 
    ? cachedMediaItems 
    : [createSingleMediaItem()];

  // Find current index when media items load
  useEffect(() => {
    if (mediaItems.length > 1) {
      const idx = mediaItems.findIndex(item => item.id === messageId || item.media_url === uri);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: idx, animated: false });
        }, 100);
      }
    }
  }, [mediaItems, messageId, uri]);

  const currentItem = mediaItems[currentIndex];
  const currentUri = currentItem?.media_url || uri;
  const currentUserName = currentItem?.profiles?.full_name || userName;
  const currentAvatar = currentItem?.profiles?.avatar_url || avatar;

  const goBack = () => router.back();
  const toggleFocusMode = () => setFocusMode(!focusMode);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  const goToNext = () => {
    if (currentIndex < mediaItems.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  // Keyboard navigation for web
  useEffect(() => {
    if (!isWeb) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') goBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, mediaItems.length]);

  // Gesture handlers
  const singleTap = Gesture.Tap().onEnd(() => toggleFocusMode()).runOnJS(true);
  
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      scale.value = scale.value > 1 ? withSpring(1) : withSpring(2);
    });
  
  const pinchGesture = Gesture.Pinch()
    .onStart(() => { 
      'worklet';
      savedScale.value = scale.value; 
    })
    .onUpdate((e) => { 
      'worklet';
      scale.value = savedScale.value * e.scale; 
    })
    .onEnd(() => { 
      'worklet';
      if (scale.value < 1) scale.value = withSpring(1); 
    });
  
  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .activeOffsetY([-10, 10])
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      'worklet';
      if (scale.value > 1.1) return;
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (scale.value > 1.1) return;
      if (e.translationY > 150 || e.velocityY > 1000) {
        goBack();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const composedGestures = Gesture.Simultaneous(pinchGesture, Gesture.Exclusive(doubleTap, singleTap));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value <= 1 ? interpolate(translateY.value, [0, height], [1, 0.8], Extrapolation.CLAMP) : scale.value }
    ],
    borderRadius: interpolate(translateY.value, [0, 200], [0, 20], Extrapolation.CLAMP),
    overflow: 'hidden' as const,
  }));

  const uiStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, 100], [1, 0], Extrapolation.CLAMP),
  }));

  const handleDownload = () => downloadMedia(currentUri, () => setSaving(true), () => setSaving(false));

  const handleSendReply = async () => {
    setSending(true);
    await sendMediaReply(replyText, roomId, currentItem?.id || messageId, () => {
      setReplyText('');
      router.back();
    });
    setSending(false);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== undefined) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderMediaItem = ({ item }: { item: MediaItemType }) => (
    <View style={{ width, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
      {item.media_type === 'video' ? (
        <MediaGalleryItem uri={item.media_url} isActive={item.id === currentItem?.id} width={width} />
      ) : (
        <Image source={{ uri: item.media_url }} style={{ width, height: '100%' }} contentFit="contain" />
      )}
    </View>
  );

  if (loadingGallery) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#F59E0B" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      {!focusMode ? (
        <>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <View className="absolute inset-0 bg-black/60" />
        </>
      ) : (
        <View className="absolute inset-0 bg-black" />
      )}

      <SafeAreaView className="flex-1">
        {!focusMode && (
          <Animated.View className="flex-row justify-between px-4 py-2 z-[60]" style={uiStyle}>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={goBack} className="mr-3 bg-black/30 p-1 rounded-full">
                <X color="white" size={26} />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Image
                  source={{ uri: currentAvatar || 'https://i.pravatar.cc/150' }}
                  style={{ width: 32, height: 32, borderRadius: 16 }}
                  className="bg-kin-slate"
                />
                <View className="ml-2.5">
                  <Text className="text-white font-outfit-bold text-base">{currentUserName}</Text>
                  <Text className="text-kin-mist text-xs">
                    {mediaItems.length > 1 ? `${currentIndex + 1} of ${mediaItems.length}` : timestamp}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={handleDownload} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Download color="white" size={24} />}
            </TouchableOpacity>
          </Animated.View>
        )}

        <GestureDetector gesture={panGesture}>
          <Animated.View className="flex-1 z-10" style={animatedStyle}>
            <GestureDetector gesture={composedGestures}>
              <View className="flex-1">
                <FlatList
                  ref={flatListRef}
                  data={mediaItems}
                  renderItem={renderMediaItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={viewabilityConfig}
                  initialScrollIndex={currentIndex > 0 ? currentIndex : undefined}
                  getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                  onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                      flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                    }, 100);
                  }}
                />
              </View>
            </GestureDetector>
          </Animated.View>
        </GestureDetector>

        {isWeb && !focusMode && mediaItems.length > 1 && (
          <View className="absolute inset-y-0 left-0 right-0 flex-row justify-between items-center px-4 z-50" pointerEvents="box-none">
            <TouchableOpacity
              onPress={goToPrevious}
              disabled={currentIndex === 0}
              className={`bg-black/50 p-3 rounded-full ${currentIndex === 0 ? 'opacity-30' : ''}`}
            >
              <ChevronLeft color="white" size={30} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToNext}
              disabled={currentIndex === mediaItems.length - 1}
              className={`bg-black/50 p-3 rounded-full ${currentIndex === mediaItems.length - 1 ? 'opacity-30' : ''}`}
            >
              <ChevronRight color="white" size={30} />
            </TouchableOpacity>
          </View>
        )}

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
