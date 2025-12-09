import { AlertTriangle, X } from 'lucide-react-native';
import React from 'react';
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <TouchableWithoutFeedback>
            <View className="w-full max-w-[320px] bg-kin-charcoal rounded-3xl overflow-hidden border border-kin-slate/30 shadow-2xl">
              
              {/* Close Button */}
              <TouchableOpacity 
                onPress={onClose} 
                className="absolute top-4 right-4 z-10 bg-kin-midnight p-1.5 rounded-full"
              >
                <X size={18} color="#7077A1" />
              </TouchableOpacity>

              {/* Icon */}
              <View className="items-center pt-8 pb-4">
                <View className={`h-16 w-16 rounded-full items-center justify-center ${isDestructive ? 'bg-red-500/10' : 'bg-kin-amber/10'}`}>
                  <AlertTriangle size={32} color={isDestructive ? '#EF4444' : '#F59E0B'} />
                </View>
              </View>

              {/* Content */}
              <View className="px-6 pb-6">
                <Text className="text-kin-white font-outfit-bold text-xl text-center mb-2">
                  {title}
                </Text>
                <Text className="text-kin-mist font-outfit text-center text-sm leading-5">
                  {message}
                </Text>
              </View>

              {/* Buttons */}
              <View className="flex-row border-t border-kin-slate/30">
                {/* Cancel Button */}
                <TouchableOpacity 
                  onPress={onClose}
                  className="flex-1 py-4 items-center justify-center border-r border-kin-slate/30 active:bg-kin-slate/20"
                >
                  <Text className="text-kin-mist font-outfit-medium text-base">
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                {/* Confirm Button */}
                <TouchableOpacity 
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 py-4 items-center justify-center active:bg-kin-slate/20"
                >
                  <Text className={`font-outfit-bold text-base ${isDestructive ? 'text-red-500' : 'text-kin-amber'}`}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
