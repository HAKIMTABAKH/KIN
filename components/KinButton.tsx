import { Text, Pressable, View } from 'react-native';
import { cn } from '../lib/utils';
import { KinButtonProps } from '@/types';


export function KinButton({ title, onPress, variant = 'primary', className }: KinButtonProps) {
  return (
    <Pressable 
      onPress={onPress}
      className={cn(
        "rounded-2xl px-6 py-4 flex-row justify-center items-center active:opacity-80",
        variant === 'primary' ? "bg-kin-amber" : "bg-kin-midnight",
        className
      )}
    >
      <Text 
        className={cn(
          "font-outfit-bold text-lg",
          variant === 'primary' ? "text-kin-charcoal" : "text-kin-amber"
        )}
      >
        {title}
      </Text>
    </Pressable>
  );
}