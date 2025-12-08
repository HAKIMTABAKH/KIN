import { BottomSheetMenuProps, MenuItem } from '@/types';
import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';



export default function BottomSheetMenu({ 
  visible, 
  onClose, 
  title = 'Menu',
  subtitle,
  items,
  footer 
}: BottomSheetMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-kin-charcoal rounded-t-3xl border-t border-kin-slate/30 pb-10 pt-4 px-6 shadow-2xl">
              
              {/* Handle Bar */}
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 bg-kin-slate rounded-full" />
              </View>

              {/* Header */}
              <View className="flex-row justify-between items-start mb-6">
                <View className="flex-1">
                  <Text className="text-kin-white font-outfit-bold text-xl">{title}</Text>
                  {subtitle && (
                    <Text className="text-kin-mist text-sm font-outfit mt-1">
                      {subtitle}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={onClose} className="bg-kin-midnight p-1 rounded-full">
                  <X size={20} color="#7077A1" />
                </TouchableOpacity>
              </View>

              {/* Menu Items */}
              <View className="bg-kin-midnight rounded-2xl overflow-hidden border border-kin-slate/30">
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    {item.label === 'divider' ? (
                      <View className="h-[1px] bg-kin-slate/30" />
                    ) : (
                      <MenuItemComponent {...item} />
                    )}
                  </React.Fragment>
                ))}
              </View>

              {/* Footer */}
              {footer && (
                <Text className="text-center text-kin-mist/30 text-xs font-outfit mt-6">
                  {footer}
                </Text>
              )}

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const MenuItemComponent = ({ icon: Icon, label, onPress, isDestructive }: MenuItem) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`flex-row items-center p-4 active:bg-kin-slate/20 ${!isDestructive && 'border-b border-kin-slate/10'}`}
  >
    <View className={`h-10 w-10 rounded-full items-center justify-center mr-4 ${isDestructive ? 'bg-red-500/10' : 'bg-kin-slate/20'}`}>
      <Icon size={20} color={isDestructive ? '#EF4444' : '#F59E0B'} />
    </View>
    <Text className={`font-outfit-medium text-base ${isDestructive ? 'text-red-500' : 'text-kin-white'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);
