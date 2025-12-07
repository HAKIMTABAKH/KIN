import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

export default function TypingIndicator({ isVisible }: { isVisible: boolean }) {
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
    <View className="flex-row items-center ml-4 mb-2 mt-1">
      <View className="bg-kin-midnight px-4 py-3 rounded-2xl rounded-tl-sm border border-kin-slate/50 flex-row space-x-1">
        <Dot anim={dot1} />
        <Dot anim={dot2} />
        <Dot anim={dot3} />
      </View>
      <Text className="text-kin-mist text-[10px] ml-2 font-outfit">typing...</Text>
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
