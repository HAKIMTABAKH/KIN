// types/index.ts

import { Message } from "@/lib/chat";
import { LogOut, LucideIcon } from "lucide-react-native";
import { TextInputProps } from "react-native";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string; // The '?' makes it optional
  updated_at: string;
}

export interface ProfileData {
  profile: Profile | null;
  userEmail: string;
  memberSince: string;
}
export interface MenuItem {
  icon: any;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
}

export interface BottomSheetMenuProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: MenuItem[];
  footer?: string;
}

export interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  isLast?: boolean;
  isDestructive?: boolean;
  onPress?: () => void;
}

export interface KinInputProps extends TextInputProps {
  icon: LucideIcon;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
}


export interface KinButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  showSeparator?: boolean;
  separatorText?: string;
}

export interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCameraPress?: () => void;
  onMicPress?: () => void;
  onImagePress?: () => void;
}
export interface ChatHeaderProps {
  roomName: string;
  onBack: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}
