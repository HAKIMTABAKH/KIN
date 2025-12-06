import { Camera, Image, Mic, Send, Smile } from 'lucide-react-native';
import { LayoutAnimation, Platform, TextInput, TouchableOpacity, View } from 'react-native';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCameraPress?: () => void;
  onMicPress?: () => void;
  onImagePress?: () => void;
  onEmojiPress?: () => void;
}

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  onCameraPress,
  onMicPress,
  onImagePress,
  onEmojiPress
}: ChatInputProps) {
  const handleTextChange = (text: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChangeText(text);
  };

  return (
    <View className="px-4 py-4 bg-kin-charcoal border-t border-kin-slate/20">
      <View className="flex-row items-end space-x-2">
        <View className="flex-1 flex-row items-center bg-kin-midnight border border-kin-slate/50 rounded-3xl min-h-[48px] px-3 py-1 mb-1">
          <TouchableOpacity 
            onPress={onCameraPress}
            className="h-12 w-12 bg-kin-midnight rounded-full items-center justify-center mb-1 mt-1 border border-kin-slate/50"
          >
            <Camera color="#F59E0B" size={22} />
          </TouchableOpacity>
          
          <TextInput
            className="flex-1 text-kin-white font-outfit text-base max-h-24 pt-3 pb-3 ml-2"
            placeholder="Message..."
            placeholderTextColor="#7077A1"
            multiline
            value={value}
            onChangeText={handleTextChange}
          />

          {/* Dynamic Right Side */}
          {value.length > 0 ? (
            // Typing: Show Send Button
            <TouchableOpacity
              onPress={onSend}
              className="h-10 w-12 bg-kin-amber rounded-full items-center justify-center ml-2 mb-1 shadow-sm"
            >
              <Send color="#111827" size={18} />
            </TouchableOpacity>
          ) : (
            // Empty: Show Media Icons
            <View className="flex-row items-center space-x-4 mr-1 mb-1 gap-2">
              <TouchableOpacity onPress={onMicPress}>
                <Mic color="#7077A1" size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onImagePress}>
                <Image color="#7077A1" size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onEmojiPress}>
                <Smile color="#7077A1" size={24} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Padding for iPhone */}
      {Platform.OS === 'ios' && <View className="h-5" />}
    </View>
  );
}
