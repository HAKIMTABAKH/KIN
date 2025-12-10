// types/index.ts

import { LucideIcon } from "lucide-react-native";
import { TextInputProps } from "react-native";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string; // The '?' makes it optional
  updated_at: string;
  last_seen?: string; // ISO timestamp for presence feature
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
  subtitle?: string;
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
  avatarUrl?: string | null;
  userId?: string | null;
  lastSeen?: string | null;
  roomId?: string;
  onBack: () => void;
  onProfilePress?: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface Friend {
  id: string;
  profile: {
    id: string;
    full_name: string;
    avatar_url?: string;
    last_seen?: string | null;
  };
}

export interface Suggestion {
  id: string;
  full_name: string;
  avatar_url?: string;
  friendshipStatus: string | null;
}

export interface Message {
  id: string;
  content: string;
  room_id: string;
  user_id: string;
  created_at: string;
  reply_to_id?: string | null;
  reactions?: Record<string, string[]>; // emoji -> array of user IDs
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
  reply_message?: {
    id: string;
    content: string;
    media_url?: string | null;
    media_type?: 'image' | 'video' | null;
    profiles?: {
      full_name?: string;
    };
  } | null;
}

export interface Room {
  id: string;
  name: string;
  created_at: string;
}
export interface UserCardProps {
  title: string;
  subtitle: string;
  avatarUrl?: string;
  onPress?: () => void;
  rightAction?: React.ReactNode;
  bottomAction?: React.ReactNode;
}


export interface TypingIndicatorProps {
  isVisible: boolean;
  avatarUrl?: string;
  userName?: string;
}
export interface ProfileTabIconProps {
  color: string;
  size: number;
}
export type MessageMenuProps = {
  visible: boolean;
  message: any;
  isMe: boolean;
  onClose: () => void;
  onReply: (msg: any) => void;
  onDelete: (id: string) => void;
  onReaction: (emoji: string) => void;
}
export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
}
export interface BlockedUser {
  id: string;
  blocked_user_id: string;
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

export type Notification = {
  id: string;
  type: 'friend_request' | 'like' | 'comment' | 'system';
  text: string;
  time: string;
  read: boolean;
  requester_id?: string;
  avatar_url?: string;
  full_name?: string;
}
export type NotificationSection = {
  title: string;
  data: Notification[];
};

export interface Friend {
  id: string;
  profile: {
    id: string;
    full_name: string;
    avatar_url?: string;
    last_seen?: string | null;
  };
  isOnline: boolean;
}

export interface RoomWithUser {
  id: string;
  name?: string;
  created_at: string;
  displayName: string;
  otherUserAvatar: string | null;
  otherUserId: string | null;
}