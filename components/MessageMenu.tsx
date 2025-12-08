import { MessageMenuProps } from '@/types';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy, CornerUpLeft, Forward, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];


export default function MessageMenu({ visible, message, isMe, onClose, onReply, onDelete, onReaction }: MessageMenuProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  if (!message) return null;

  const handleAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
    onClose();
  };

  const handleEmojiSelect = (emojiObject: EmojiType) => {
    onReaction(emojiObject.emoji);
    setIsEmojiPickerOpen(false);
    onClose();
  };

  return (
    <>
      <Modal transparent visible={visible && !isEmojiPickerOpen} animationType="fade" onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1 bg-black/80 justify-center items-center px-6">
            
            {/* 1. THE REACTION PILL (Floating) */}
            <View className="flex-row bg-[#1F222B] rounded-full px-4 py-3 mb-6 shadow-2xl items-center justify-between w-full max-w-[350px]">
              {QUICK_REACTIONS.map((emoji) => (
                <TouchableOpacity 
                  key={emoji} 
                  onPress={() => handleAction(() => onReaction(emoji))}
                  className="active:scale-125 transform transition-transform"
                >
                  <Text className="text-4xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
              
              {/* The (+) Button */}
              <TouchableOpacity 
                onPress={() => setIsEmojiPickerOpen(true)}
                className="h-10 w-10 bg-kin-slate/30 rounded-full items-center justify-center ml-2"
              >
                <Plus color="#A0A0A0" size={24} />
              </TouchableOpacity>
            </View>

            {/* 2. THE ACTION MENU (Dialog) */}
            <View className="w-full max-w-[300px] bg-[#1F222B] rounded-3xl overflow-hidden">
              <MenuItem icon={CornerUpLeft} label="Reply" onPress={() => handleAction(() => onReply(message))} />
              <MenuItem icon={Forward} label="Forward" onPress={() => handleAction(() => console.log('Forward'))} />
              <MenuItem icon={Copy} label="Copy" onPress={() => handleAction(async () => {
                await Clipboard.setStringAsync(message.content);
              })} />
              
              {isMe && (
                <MenuItem 
                  icon={Trash2} 
                  label="Unsend" 
                  isDestructive 
                  onPress={() => handleAction(() => onDelete(message.id))} 
                />
              )}
            </View>

          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 3. FULL EMOJI KEYBOARD */}
      <EmojiPicker
        onEmojiSelected={handleEmojiSelect}
        open={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        theme={{
          backdrop: '#11182799',
          knob: '#F59E0B',
          container: '#1F222B',
          header: '#FFF',
          skinTonesContainer: '#334155',
          category: {
            icon: '#7077A1',
            iconActive: '#F59E0B',
            container: '#1F222B',
            containerActive: '#1F222B',
          },
        }}
      />
    </>
  );
}

// Helper for Rows
const MenuItem = ({ icon: Icon, label, onPress, isDestructive }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    className="flex-row items-center p-5 border-b border-kin-slate/10 active:bg-kin-slate/20"
  >
    <Icon color={isDestructive ? '#EF4444' : '#FFF'} size={24} />
    <Text className={`ml-4 text-lg font-outfit-medium ${isDestructive ? 'text-red-500' : 'text-white'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);