import React, { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';

interface TypingIndicatorProps {
  isVisible: boolean;
  avatarUrl?: string;
  userName?: string;
}

export default function TypingIndicator({ isVisible, avatarUrl, userName }: TypingIndicatorProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      const animate = (dot: Animated.Value) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: -5, // Move up
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0, // Move down
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      // Stagger the animations
      setTimeout(() => animate(dot1), 0);
      setTimeout(() => animate(dot2), 200);
      setTimeout(() => animate(dot3), 400);
    }
  }, [isVisible, dot1, dot2, dot3]);

  if (!isVisible) return null;

  return (
    <View className="flex-row items-start ml-4 mb-2 mt-1">
      {/* Profile Image */}
      <View className="mr-2">
        {avatarUrl ? (
          <Image 
            source={{ uri: avatarUrl }} 
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <View className="w-8 h-8 rounded-full bg-kin-slate items-center justify-center">
            <Text className="text-kin-white text-sm font-outfit-bold">
              {userName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>

      {/* Typing Bubble */}
      <View>
        <View className="bg-kin-midnight px-4 py-3 rounded-2xl rounded-tl-sm border border-kin-slate/50 flex-row space-x-1">
          <Dot anim={dot1} />
          <Dot anim={dot2} />
          <Dot anim={dot3} />
        </View>
        <Text className="text-kin-mist text-[10px] ml-1 mt-1 font-outfit">typing...</Text>
      </View>
    </View>
  );
}

const Dot = ({ anim }: { anim: Animated.Value }) => (
  <Animated.View
    style={{
      transform: [{ translateY: anim }],
    }}
    className="h-2 w-2 bg-kin-amber rounded-full mx-0.5 opacity-80"
  />
);
