import * as Haptics from 'expo-haptics';
import { Copy, CornerUpLeft, Forward, Smile, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Clipboard, Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

type MessageMenuProps = {
  visible: boolean;
  message: any;
  isMe: boolean;
  onClose: () => void;
  onReply: (msg: any) => void;
  onDelete: (id: string) => void;
  onReaction: (emoji: string) => void;
};

export default function MessageMenu({ visible, message, isMe, onClose, onReply, onDelete, onReaction }: MessageMenuProps) {
  if (!message) return null;

  const handleCopy = async () => {
    Clipboard.setString(message.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          
          {/* 1. MESSAGE PREVIEW (Optional: Shows what you selected) */}
          <View className={`p-4 rounded-2xl mb-6 max-w-[90%] opacity-80 ${isMe ? 'bg-kin-amber self-end' : 'bg-kin-midnight border border-kin-slate self-start'}`}>
             <Text className={`font-outfit ${isMe ? 'text-black' : 'text-kin-white'}`} numberOfLines={2}>
               {message.content}
             </Text>
          </View>

          {/* 2. REACTION BAR (Floating Pill) */}
          <View className="flex-row bg-kin-midnight rounded-full p-2 mb-4 border border-kin-slate shadow-xl w-full justify-between">
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity 
                key={emoji} 
                onPress={() => handleAction(() => onReaction(emoji))}
                className="p-2 bg-kin-slate/10 rounded-full active:bg-kin-slate/30"
              >
                <Text className="text-2xl">{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity className="p-2 rounded-full bg-kin-slate/20 justify-center items-center">
               <Smile color="#A0A0A0" size={24} />
            </TouchableOpacity>
          </View>

          {/* 3. MENU ACTIONS (The Dialog Box) */}
          <View className="w-full bg-kin-midnight rounded-3xl overflow-hidden border border-kin-slate shadow-2xl">
            
            <MenuItem icon={CornerUpLeft} label="Reply" onPress={() => handleAction(() => onReply(message))} />
            <MenuItem icon={Forward} label="Forward" onPress={() => handleAction(() => console.log('Forward'))} />
            <MenuItem icon={Copy} label="Copy" onPress={handleCopy} />
            
            {/* Only show Delete/Unsend if it's MY message */}
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
  );
}

// Helper Sub-component for menu rows
const MenuItem = ({ icon: Icon, label, onPress, isDestructive }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    className="flex-row items-center p-4 border-b border-kin-slate/20 active:bg-kin-slate/20"
  >
    <Icon color={isDestructive ? '#EF4444' : '#E2E8F0'} size={22} />
    <Text className={`ml-4 text-lg font-outfit-medium ${isDestructive ? 'text-red-500' : 'text-kin-white'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);